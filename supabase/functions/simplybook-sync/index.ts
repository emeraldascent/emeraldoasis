import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_LOGIN = "emeraldoasiscamp@gmail.com";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAdminToken(): Promise<string> {
  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  // Use getUserToken with API User Key — bypasses IP restrictions
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_LOGIN, apiUserKey],
      id: 1,
    }),
  });

  const data = await res.json();
  console.log("getUserToken response:", JSON.stringify(data));
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  if (!data.result) throw new Error("Auth failed: empty token");
  return data.result;
}

// Also try REST Admin API auth
async function getRestAdminToken(): Promise<string> {
  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  const res = await fetch(`https://${SIMPLYBOOK_COMPANY}.simplybook.me/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: SIMPLYBOOK_COMPANY,
      login: SIMPLYBOOK_ADMIN_LOGIN,
      password: apiUserKey,
    }),
  });

  const data = await res.json();
  console.log("REST admin auth response:", JSON.stringify(data));
  return data.token;
}

async function callJsonRpc(token: string, url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 2 }),
  });
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== SimplyBook Sync: Probing available methods ===");

    // Get token via getUserToken (API User Key)
    const token = await getAdminToken();
    console.log("JSON-RPC token obtained.");

    // Probe: list admin methods that work
    const probes = [
      { url: SIMPLYBOOK_ADMIN_URL, method: "getClientList", params: [null, "client", null] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getBookingList", params: [null, null, null] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getUserList", params: [] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getMembershipList", params: [] },
      { url: "https://user-api.simplybook.me", method: "getMembershipList", params: [] },
      { url: "https://user-api.simplybook.me", method: "getClientList", params: [null, "client", null] },
    ];

    const results: Record<string, string> = {};

    for (const p of probes) {
      const res = await callJsonRpc(token, p.url, p.method, p.params);
      const endpoint = p.url.includes("/admin") ? "admin" : "public";
      const status = res.error ? `DENIED: ${res.error.message}` : `OK (${typeof res.result === "object" ? JSON.stringify(res.result).slice(0, 200) : res.result})`;
      results[`${endpoint}/${p.method}`] = status;
      console.log(`${endpoint}/${p.method}: ${status}`);
    }

    // Also try REST admin auth
    let restToken = "";
    try {
      restToken = await getRestAdminToken();
      console.log("REST admin token:", restToken ? "obtained" : "empty");
    } catch (e) {
      console.log("REST admin auth failed:", String(e));
    }

    return new Response(
      JSON.stringify({ success: true, probes: results, rest_token: !!restToken }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

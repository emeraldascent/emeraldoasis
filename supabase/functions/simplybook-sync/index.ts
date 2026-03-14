import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_LOGIN = "emeraldoasiscamp@gmail.com";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getToken(): Promise<string> {
  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

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
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  return data.result;
}

async function callAdmin(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_ADMIN_URL, {
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
    const token = await getToken();
    console.log("Token obtained.");

    // Probe many admin methods to find what this user can access
    const methods = [
      { method: "getCurrentUserDetails", params: [] },
      { method: "getPluginList", params: [] },
      { method: "getPluginStatuses", params: [] },
      { method: "isPluginActivated", params: ["membership"] },
      { method: "isPluginActivated", params: ["client"] },
      { method: "getCompanyInfo", params: [] },
      { method: "getEventList", params: [] },
      { method: "getBookings", params: [] },
      { method: "getClientList", params: [null, "client", null] },
      { method: "getClient", params: ["1"] },
      { method: "getMembershipList", params: [] },
    ];

    const results: Record<string, string> = {};

    for (const m of methods) {
      const res = await callAdmin(token, m.method, m.params);
      if (res.error) {
        results[`${m.method}(${JSON.stringify(m.params)})`] = `ERROR: ${res.error.message}`;
      } else {
        const preview = JSON.stringify(res.result).slice(0, 500);
        results[`${m.method}(${JSON.stringify(m.params)})`] = preview;
      }
      console.log(`${m.method}: ${res.error ? 'ERROR: ' + res.error.message : 'OK'}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

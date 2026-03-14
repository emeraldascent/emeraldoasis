import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_PUBLIC_URL = "https://user-api.simplybook.me";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Auth with API User Key via getUserToken (bypasses IP restriction)
async function getToken(): Promise<string> {
  const apiKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, "emeraldoasiscamp@gmail.com", apiKey],
      id: 1,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  return data.result;
}

async function callApi(url: string, token: string, method: string, params: unknown[]) {
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
    console.log("Authenticating...");
    const token = await getToken();
    console.log("Token obtained.");

    // Probe what methods work on both endpoints
    const probes = [
      { url: SIMPLYBOOK_ADMIN_URL, method: "getClientList", params: [null, "client", null] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getClientList", params: [] },
      { url: SIMPLYBOOK_PUBLIC_URL, method: "getClientMembershipList", params: ["1"] },
      { url: SIMPLYBOOK_PUBLIC_URL, method: "getMembershipList", params: [] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getMembershipList", params: [] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getBookings", params: [] },
      { url: SIMPLYBOOK_ADMIN_URL, method: "getBookingList", params: [null, null, null] },
    ];

    const results: any[] = [];
    for (const probe of probes) {
      const result = await callApi(probe.url, token, probe.method, probe.params);
      const endpoint = probe.url === SIMPLYBOOK_ADMIN_URL ? "admin" : "public";
      const summary = result.error
        ? `ERROR: ${result.error.message}`
        : `OK: ${JSON.stringify(result.result).substring(0, 200)}`;
      console.log(`[${endpoint}] ${probe.method}(${JSON.stringify(probe.params)}): ${summary}`);
      results.push({
        endpoint,
        method: probe.method,
        params: probe.params,
        success: !result.error,
        preview: result.error ? result.error.message : JSON.stringify(result.result).substring(0, 200),
      });
    }

    return new Response(
      JSON.stringify({ success: true, probes: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

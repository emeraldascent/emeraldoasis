import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function tryGetUserToken(login: string, password: string): Promise<{ token: string | null; error: string | null }> {
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, login, password],
      id: 1,
    }),
  });
  const data = await res.json();
  if (data.error) return { token: null, error: data.error.message };
  return { token: data.result, error: null };
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
    const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
    if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

    console.log("=== Testing different login values with API User Key ===");

    const logins = [
      "emeraldoasiscamp@gmail.com",
      "emeraldoasiscamp",
      "api",
      "admin",
    ];

    const results: Record<string, any> = {};

    for (const login of logins) {
      const { token, error } = await tryGetUserToken(login, apiUserKey);
      if (error) {
        results[login] = { auth: `FAILED: ${error}` };
        console.log(`Login "${login}": auth failed - ${error}`);
        continue;
      }

      console.log(`Login "${login}": token obtained`);

      // Test getClientList with this token
      const clientRes = await callAdmin(token!, "getClientList", [null, "client", null]);
      const clientStatus = clientRes.error ? `DENIED: ${clientRes.error.message}` : "OK";

      // Test getMembershipList
      const memberRes = await callAdmin(token!, "getMembershipList", []);
      const memberStatus = memberRes.error ? `DENIED: ${memberRes.error.message}` : `OK: ${JSON.stringify(memberRes.result).slice(0, 300)}`;

      results[login] = { auth: "OK", getClientList: clientStatus, getMembershipList: memberStatus };
      console.log(`  getClientList: ${clientStatus}`);
      console.log(`  getMembershipList: ${memberStatus}`);
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

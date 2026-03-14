const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const LOGIN_URL = "https://user-api.simplybook.me/login";
const ADMIN_URL = "https://user-api.simplybook.me/admin";
const PUBLIC_URL = "https://user-api.simplybook.me";

async function rpc(url: string, method: string, params: unknown[], headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY") || "";
  const publicKey = Deno.env.get("SIMPLYBOOK_API_KEY") || "";
  const results: any[] = [];

  const test = async (label: string, fn: () => Promise<any>) => {
    try {
      const r = await fn();
      results.push({ label, success: !r.error, detail: r.error?.message || JSON.stringify(r.result).substring(0, 300) });
    } catch (e) {
      results.push({ label, success: false, detail: String(e) });
    }
  };

  // Test 1: getUserToken with API User Key as password
  let userKeyToken = "";
  await test("getUserToken(company, email, apiUserKey)", async () => {
    const r = await rpc(LOGIN_URL, "getUserToken", [SIMPLYBOOK_COMPANY, "emeraldoasiscamp@gmail.com", apiUserKey]);
    if (r.result) userKeyToken = r.result;
    return r;
  });

  // Test 2: Use that token on admin endpoint
  if (userKeyToken) {
    await test("admin/getClientList with userKeyToken", async () => {
      return rpc(ADMIN_URL, "getClientList", [null, "client", null], {
        "X-Company-Login": SIMPLYBOOK_COMPANY,
        "X-Token": userKeyToken,
      });
    });

    // Test 3: Try admin endpoint with different method signatures
    await test("admin/getClientList() no params", async () => {
      return rpc(ADMIN_URL, "getClientList", [], {
        "X-Company-Login": SIMPLYBOOK_COMPANY,
        "X-Token": userKeyToken,
      });
    });

    // Test 4: Try using API User Key directly as X-Token (bearer-style)  
    await test("admin/getClientList with apiUserKey as X-Token", async () => {
      return rpc(ADMIN_URL, "getClientList", [null, "client", null], {
        "X-Company-Login": SIMPLYBOOK_COMPANY,
        "X-Token": apiUserKey,
      });
    });
  }

  // Test 5: getToken with public key, then try admin
  let publicToken = "";
  await test("getToken(company, publicKey)", async () => {
    const r = await rpc(LOGIN_URL, "getToken", [SIMPLYBOOK_COMPANY, publicKey]);
    if (r.result) publicToken = r.result;
    return r;
  });

  if (publicToken) {
    await test("admin/getClientList with publicToken", async () => {
      return rpc(ADMIN_URL, "getClientList", [null, "client", null], {
        "X-Company-Login": SIMPLYBOOK_COMPANY,
        "X-Token": publicToken,
      });
    });
  }

  // Test 6: getToken with API User Key directly  
  await test("getToken(company, apiUserKey)", async () => {
    return rpc(LOGIN_URL, "getToken", [SIMPLYBOOK_COMPANY, apiUserKey]);
  });

  // Test 7: REST-style auth (not JSON-RPC)
  await test("REST POST /login with company+login+apiUserKey", async () => {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: SIMPLYBOOK_COMPANY,
        login: "emeraldoasiscamp@gmail.com",
        password: apiUserKey,
      }),
    });
    return { result: await res.json() };
  });

  // Test 8: REST-style with key field
  await test("REST POST /login with company+key", async () => {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: SIMPLYBOOK_COMPANY,
        key: apiUserKey,
      }),
    });
    return { result: await res.json() };
  });

  return new Response(JSON.stringify({ results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

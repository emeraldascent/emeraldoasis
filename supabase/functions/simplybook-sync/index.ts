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
  if (data.error) throw new Error("Auth: " + data.error.message);
  return data.result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = await getToken();
    console.log("Token:", token);

    // Try getServiceUrl to find the correct API URL
    const urlRes = await fetch(SIMPLYBOOK_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getServiceUrl",
        params: [SIMPLYBOOK_COMPANY],
        id: 3,
      }),
    });
    const urlData = await urlRes.json();
    console.log("getServiceUrl:", JSON.stringify(urlData));
    const serviceUrl = urlData.result;

    // Now try admin calls with:
    // 1. Standard admin URL
    // 2. Service URL from getServiceUrl + /admin
    // 3. Different X-Company-Login variations
    const tests: { label: string; url: string; companyHeader: string }[] = [
      { label: "standard", url: SIMPLYBOOK_ADMIN_URL, companyHeader: SIMPLYBOOK_COMPANY },
      { label: "serviceUrl+admin", url: (serviceUrl || "https://user-api.simplybook.me") + "/admin", companyHeader: SIMPLYBOOK_COMPANY },
      { label: "noCompanyHeader", url: SIMPLYBOOK_ADMIN_URL, companyHeader: "" },
    ];

    const results: Record<string, any> = {};

    for (const t of tests) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Token": token,
      };
      if (t.companyHeader) headers["X-Company-Login"] = t.companyHeader;

      const res = await fetch(t.url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getEventList",
          params: [],
          id: 2,
        }),
      });
      const data = await res.json();
      results[t.label] = data.error ? `ERROR: ${data.error.message}` : `OK: ${JSON.stringify(data.result).slice(0, 300)}`;
      console.log(`${t.label}: ${results[t.label]}`);
    }

    return new Response(
      JSON.stringify({ success: true, serviceUrl, results }),
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

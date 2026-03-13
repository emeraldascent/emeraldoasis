import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_API_KEY = Deno.env.get("SIMPLYBOOK_API_KEY") || "";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_API_URL = "https://user-api.simplybook.me";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getToken(): Promise<string> {
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getToken",
      params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_API_KEY],
      id: 1,
    }),
  });
  const data = await res.json();
  return data.result;
}

async function callApi(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 2 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = await getToken();
    const { action, dateFrom, dateTo } = await req.json();

    if (action === "services") {
      const events = await callApi(token, "getEventList", []);
      return new Response(JSON.stringify(events), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "availability") {
      // Get start time matrix for date range
      const matrix = await callApi(token, "getStartTimeMatrix", [
        dateFrom,
        dateTo,
        null, // all services
        null, // all providers
        1,
      ]);
      return new Response(JSON.stringify(matrix), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "work_calendar") {
      const [year, month] = dateFrom.split("-").map(Number);
      const cal = await callApi(token, "getWorkCalendar", [year, month, null]);
      return new Response(JSON.stringify(cal), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

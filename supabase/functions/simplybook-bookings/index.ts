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
  if (data.error) throw new Error(data.error.message);
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
    const body = await req.json();
    const { action } = body;

    // Get available time slots for a service on a date range
    if (action === "time_slots") {
      const { dateFrom, dateTo, eventId, unitId } = body;
      const matrix = await callApi(token, "getStartTimeMatrix", [
        dateFrom,
        dateTo,
        eventId,
        unitId || null,
        1,
      ]);
      return new Response(JSON.stringify(matrix), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get work calendar for a month
    if (action === "work_calendar") {
      const { year, month } = body;
      const cal = await callApi(token, "getWorkCalendar", [year, month, null]);
      return new Response(JSON.stringify(cal), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a booking
    if (action === "book") {
      const { eventId, unitId, date, time, clientData, additionalFields, count } = body;
      const result = await callApi(token, "book", [
        eventId,
        unitId,
        date,
        time,
        clientData,  // { name, email, phone }
        additionalFields || [],
        count || 1,
      ]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if a client has an active Silver/Gold membership
    if (action === "check_membership") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ hasMembership: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get client list and find by email
      try {
        const clients = await callApi(token, "getClientList", [email]);
        let hasMembership = false;

        // Check if any client matching this email has an active membership
        if (clients && typeof clients === "object") {
          for (const clientId of Object.keys(clients)) {
            const memberships = await callApi(token, "getClientMembershipList", [clientId]);
            if (memberships && Array.isArray(memberships) && memberships.length > 0) {
              // Check if any membership is currently active
              const now = new Date();
              for (const m of memberships) {
                if (m.is_active === "1" || m.is_active === true) {
                  hasMembership = true;
                  break;
                }
              }
            }
            if (hasMembership) break;
          }
        }

        return new Response(JSON.stringify({ hasMembership }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ hasMembership: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Confirm a booking (some setups require confirmation after book)
    if (action === "confirm") {
      const { bookingId } = body;
      const result = await callApi(token, "confirmBooking", [bookingId]);
      return new Response(JSON.stringify(result), {
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

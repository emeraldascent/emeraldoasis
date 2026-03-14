import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_API_KEY = Deno.env.get("SIMPLYBOOK_API_KEY") || "";
const SIMPLYBOOK_ADMIN_LOGIN = "emeraldoasiscamp@gmail.com";
const SIMPLYBOOK_ADMIN_API_KEY = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY") || "";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_API_URL = "https://user-api.simplybook.me";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public token — for read-only operations (availability, calendar)
async function getPublicToken(): Promise<string> {
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

// Admin token — for write operations (booking, confirm)
async function getAdminToken(): Promise<string> {
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_LOGIN, SIMPLYBOOK_ADMIN_API_KEY],
      id: 1,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error("Admin auth failed: " + data.error.message);
  if (!data.result) throw new Error("Admin auth failed: empty token");
  return data.result;
}

async function callPublicApi(token: string, method: string, params: unknown[]) {
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

async function callAdminApi(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-User-Token": token,
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
    const body = await req.json();
    const { action } = body;

    // Read-only actions use public token
    if (action === "time_slots") {
      const token = await getPublicToken();
      const { dateFrom, dateTo, eventId, unitId } = body;
      const matrix = await callPublicApi(token, "getStartTimeMatrix", [
        dateFrom, dateTo, eventId, unitId || null, 1,
      ]);
      return new Response(JSON.stringify(matrix), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "work_calendar") {
      const token = await getPublicToken();
      const { year, month } = body;
      const cal = await callPublicApi(token, "getWorkCalendar", [year, month, null]);
      return new Response(JSON.stringify(cal), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Booking uses public API token (client login disabled in SimplyBook)
    if (action === "book") {
      const token = await getPublicToken();
      const { eventId, unitId, date, time, clientData, additionalFields, count } = body;

      // Event-to-Unit mapping based on SimplyBook configuration
      const EVENT_UNIT_MAP: Record<number, number> = {
        18: 22, 19: 22, 22: 22, 23: 22, // Day passes → Day Pass Parking
        20: 22, 21: 22,                   // Member passes → Day Pass Parking
        11: 4, 12: 5, 13: 6, 14: 7,      // Campsites 3-6
        9: 23, 8: 8, 10: 3,              // Campsite 7 Social/Group, Creekside
      };
      const resolvedUnitId = unitId || EVENT_UNIT_MAP[eventId] || 22;

      // Convert additional fields from array [{id, value}] to object {id: value}
      let additionalObj: Record<string, any> = {};
      if (Array.isArray(additionalFields)) {
        for (const f of additionalFields) {
          if (f && f.id !== undefined) additionalObj[String(f.id)] = f.value;
        }
      } else if (additionalFields && typeof additionalFields === "object") {
        additionalObj = additionalFields;
      }

      console.log(`Booking: event=${eventId}, unit=${resolvedUnitId}, additional=${JSON.stringify(additionalObj)}`);

      const result = await callPublicApi(token, "book", [
        eventId, resolvedUnitId, date, time, clientData, additionalObj, count || 1,
      ]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debug: get additional fields definition
    if (action === "get_fields") {
      const token = await getPublicToken();
      const { eventId } = body;
      const fields = await callPublicApi(token, "getAdditionalFields", [eventId]);
      return new Response(JSON.stringify(fields), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_membership") {
      const { email } = body;
      return new Response(JSON.stringify({ hasMembership: !!email && false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm") {
      const adminToken = await getAdminToken();
      const { bookingId } = body;
      const result = await callAdminApi(adminToken, "confirmBooking", [bookingId]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("simplybook-bookings error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

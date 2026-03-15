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
  if (data.error) {
    const code = data.error?.code ? ` (${data.error.code})` : "";
    const details = data.error?.data
      ? ` | ${typeof data.error.data === "string" ? data.error.data : JSON.stringify(data.error.data)}`
      : "";
    throw new Error(`${data.error.message}${code}${details}`);
  }
  return data.result;
}

function addMinutesToDateTime(date: string, time: string, minutes: number) {
  const [h, m, s] = time.split(":").map((x) => Number(x || 0));
  const dt = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
  dt.setMinutes(dt.getMinutes() + minutes);
  const endDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const endTime = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}:${String(dt.getSeconds()).padStart(2, "0")}`;
  return { endDate, endTime };
}

function splitNameParts(fullName: string) {
  const clean = fullName.trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "Guest", lastName: "User" };
  const parts = clean.split(" ");
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function normalizeRequiredFields(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>)
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }
  return [];
}

function defaultRequiredFieldValue(field: string, base: Record<string, unknown>) {
  const f = field.toLowerCase();
  if (f === "country_id" || f.endsWith("_id")) return 1;
  if (f.includes("email")) return base.email || `guest_${Date.now()}@example.com`;
  if (f.includes("phone")) return base.phone || "+10000000000";
  if (f === "name" || f.includes("first_name")) return base.name || "Guest User";
  if (f === "name2" || f.includes("last_name") || f.includes("surname")) return base.name2 || "User";
  if (f.includes("zip") || f.includes("postal") || f.includes("postcode")) return base.zip || "00000";
  if (f.includes("city")) return base.city || "N/A";
  if (f.includes("address")) return base.address1 || "N/A";
  return "N/A";
}

async function findExistingClientIdByEmail(adminToken: string, safeEmail: string): Promise<number | null> {
  if (!safeEmail) return null;

  const lookups: unknown[][] = [[{ search: safeEmail }], []];

  for (const params of lookups) {
    try {
      const clientListRaw = await callAdminApi(adminToken, "getClientList", params);
      const clientList: any[] = Array.isArray(clientListRaw) ? clientListRaw : Object.values(clientListRaw || {});
      const existingClient = clientList.find((c: any) =>
        String(c?.email || "").trim().toLowerCase() === safeEmail
      );

      if (existingClient?.id) {
        const existingId = Number(existingClient.id);
        if (!Number.isNaN(existingId)) return existingId;
      }
    } catch (err) {
      console.warn(`getClientList lookup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return null;
}

async function resolveClientIdForAdminBooking(adminToken: string, clientData: Record<string, unknown>) {
  const fullName = String(clientData?.name || "").trim();
  const safeEmail = String(clientData?.email || "").trim().toLowerCase();
  const normalizedPhone = String(clientData?.phone || "").replace(/[^\d+]/g, "");

  const existingByEmail = await findExistingClientIdByEmail(adminToken, safeEmail);
  if (existingByEmail) return existingByEmail;

  const { firstName, lastName } = splitNameParts(fullName || "Guest User");
  const clientPayload: Record<string, unknown> = {
    name: `${firstName} ${lastName}`.trim(),
    name2: lastName,
    email: safeEmail || `guest_${Date.now()}@example.com`,
    phone: normalizedPhone || "+10000000000",
    address1: "N/A",
    address2: "N/A",
    city: "N/A",
    zip: "00000",
    country_id: 1,
  };

  try {
    const requiredRaw = await callAdminApi(adminToken, "getCompanyParam", ["require_fields"]);
    const requiredFields = normalizeRequiredFields(requiredRaw);
    for (const field of requiredFields) {
      if (!(field in clientPayload) || clientPayload[field] === "" || clientPayload[field] === null) {
        clientPayload[field] = defaultRequiredFieldValue(field, clientPayload);
      }
    }
    console.log(`Required client fields: ${requiredFields.join(",") || "none"}`);
  } catch (err) {
    console.warn(`Could not load require_fields: ${err instanceof Error ? err.message : String(err)}`);
  }

  const customClientFields: Record<string, unknown> = {};

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      if (Object.keys(customClientFields).length > 0) {
        clientPayload.client_fields = customClientFields;
      }

      const clientResult = await callAdminApi(adminToken, "addClient", [clientPayload, false]);
      const clientId = Number(
        typeof clientResult === "object" && clientResult !== null
          ? (clientResult as Record<string, unknown>).id ?? clientResult
          : clientResult
      );

      if (!clientId || Number.isNaN(clientId)) {
        throw new Error("Failed to resolve client ID for admin booking");
      }

      return clientId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes("-32066") || message.toLowerCase().includes("already exist")) {
        const existingAfterDuplicate = await findExistingClientIdByEmail(adminToken, safeEmail);
        if (existingAfterDuplicate) {
          console.warn(`Client already exists for ${safeEmail}; reusing existing id ${existingAfterDuplicate}`);
          return existingAfterDuplicate;
        }
      }

      const customFieldMatch = message.match(/client_fields\/([a-f0-9]+)/i);
      if (!customFieldMatch) throw err;

      const fieldHash = customFieldMatch[1];
      if (customClientFields[fieldHash]) throw err;

      customClientFields[fieldHash] = "N/A";
      console.warn(`Missing required client field ${fieldHash}; retrying addClient (attempt ${attempt})`);
    }
  }

  throw new Error("Failed to create or resolve SimplyBook client after required field retries");
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

    // Booking: try public API first, fall back to admin flow when client auth is required
    if (action === "book") {
      const publicToken = await getPublicToken();
      const { eventId, unitId, date, time, clientData, additionalFields, count } = body;

      // Event-to-Unit mapping based on SimplyBook configuration
      const EVENT_UNIT_MAP: Record<number, number> = {
        18: 22, 19: 22, 22: 22, 23: 22, // Day passes → Day Pass Parking
        20: 22, 21: 22,                   // Member passes → Day Pass Parking
        11: 4, 12: 5, 13: 6, 14: 7,      // Campsites 3-6
        9: 23, 8: 8, 10: 3,              // Campsite 7 Social/Group, Creekside
      };
      const resolvedUnitId = unitId || EVENT_UNIT_MAP[eventId] || 22;

      // SimplyBook expects additional fields keyed by field hash name, not numeric ID
      const fieldDefs = await callPublicApi(publicToken, "getAdditionalFields", [eventId]);
      const fieldList: any[] = Array.isArray(fieldDefs) ? fieldDefs : Object.values(fieldDefs || {});
      const idToName: Record<string, string> = {};
      for (const f of fieldList) {
        idToName[String(f.id)] = f.name;
      }

      let additionalObj: Record<string, any> = {};
      if (Array.isArray(additionalFields)) {
        for (const f of additionalFields) {
          if (f && f.id !== undefined) {
            const key = idToName[String(f.id)] || String(f.id);
            additionalObj[key] = f.value;
          }
        }
      } else if (additionalFields && typeof additionalFields === "object") {
        for (const [k, v] of Object.entries(additionalFields)) {
          const key = idToName[k] || k;
          additionalObj[key] = v;
        }
      }

      console.log(`Booking: event=${eventId}, unit=${resolvedUnitId}, additional=${JSON.stringify(additionalObj)}`);

      try {
        const result = await callPublicApi(publicToken, "book", [
          eventId, resolvedUnitId, date, time, clientData, additionalObj, count || 1,
        ]);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (publicErr) {
        const publicMsg = publicErr instanceof Error ? publicErr.message : String(publicErr);
        if (!publicMsg.toLowerCase().includes("client authorization required")) {
          throw publicErr;
        }

        console.warn("Public booking requires client auth; falling back to admin booking flow");

        const adminToken = await getAdminToken();

        let clientId: number;
        try {
          clientId = await resolveClientIdForAdminBooking(adminToken, clientData || {});
        } catch (addClientErr) {
          throw new Error(`Admin client resolution failed: ${addClientErr instanceof Error ? addClientErr.message : String(addClientErr)}`);
        }

        const events = await callPublicApi(publicToken, "getEventList", []);
        const eventList: any[] = Array.isArray(events) ? events : Object.values(events || {});
        const eventInfo = eventList.find((e: any) => Number(e?.id) === Number(eventId));
        const durationMinutes = Number(eventInfo?.duration) > 0 ? Number(eventInfo.duration) : 30;
        const { endDate, endTime } = addMinutesToDateTime(date, time, durationMinutes);
        const clientTimeOffset = 60;

        let result: unknown;
        try {
          result = await callAdminApi(adminToken, "book", [
            eventId,
            resolvedUnitId,
            clientId,
            date,
            time,
            endDate,
            endTime,
            clientTimeOffset,
            additionalObj,
            count || 1,
            null,
            null,
          ]);
        } catch (adminBookErr) {
          throw new Error(`Admin book failed: ${adminBookErr instanceof Error ? adminBookErr.message : String(adminBookErr)}`);
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

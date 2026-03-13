import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function extractField(payload: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    if (payload[key]) return String(payload[key]).trim();
  }
  // Try nested JotForm "q{n}_" style keys
  for (const [k, v] of Object.entries(payload)) {
    const lower = k.toLowerCase();
    for (const search of keys) {
      if (lower.includes(search.toLowerCase())) {
        if (typeof v === "object" && v !== null) {
          // JotForm name fields: { first: "...", last: "..." }
          if ("first" in v) return String(v.first || "").trim();
          return Object.values(v).filter(Boolean).join(" ").trim();
        }
        return String(v).trim();
      }
    }
  }
  return "";
}

function extractName(payload: Record<string, any>, part: "first" | "last"): string {
  // Look for explicit first_name / last_name
  const direct = part === "first"
    ? extractField(payload, "first_name", "firstName")
    : extractField(payload, "last_name", "lastName");
  if (direct) return direct;

  // JotForm sends name fields as objects with { first, last }
  for (const [, v] of Object.entries(payload)) {
    if (typeof v === "object" && v !== null && "first" in v && "last" in v) {
      return String(v[part] || "").trim();
    }
  }

  // Fallback: split a "name" field
  const full = extractField(payload, "name", "fullName", "full_name");
  if (full) {
    const parts = full.split(" ");
    return part === "first" ? parts[0] : parts.slice(1).join(" ");
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: Record<string, any>;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      // JotForm sends x-www-form-urlencoded by default
      const text = await req.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries());

      // JotForm sometimes sends rawRequest as JSON string
      if (payload.rawRequest) {
        try {
          const raw = JSON.parse(payload.rawRequest);
          payload = { ...payload, ...raw };
        } catch {
          // ignore parse errors on rawRequest
        }
      }
    }

    const email = extractField(payload, "email", "Email", "emailAddress").toLowerCase();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email found in submission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = extractName(payload, "first");
    const lastName = extractName(payload, "last");
    const phone = extractField(payload, "phone", "phoneNumber", "phone_number");
    const emergencyContact = extractField(payload, "emergency_contact", "emergencyContact", "emergency");
    const licensePlate = extractField(payload, "license_plate", "licensePlate", "license") || null;
    const address = extractField(payload, "address", "streetAddress", "street_address") || null;
    const dob = extractField(payload, "date_of_birth", "dateOfBirth", "dob", "birthday") || null;
    const photoUrl = extractField(payload, "photo_url", "photoUrl", "photo", "profilePhoto") || null;
    const referralSource = extractField(payload, "referral_source", "referralSource", "referral", "howDidYouHear") || null;
    const submissionId = extractField(payload, "submissionID", "submission_id", "formID") || null;

    const waiverRaw = extractField(payload, "waiver", "waiverSigned", "waiver_signed", "liability");
    const waiverSigned = ["yes", "true", "1", "signed", "agreed"].includes(waiverRaw.toLowerCase());

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from("jotform_submissions").upsert(
      {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        emergency_contact: emergencyContact,
        license_plate: licensePlate,
        address,
        date_of_birth: dob,
        photo_url: photoUrl,
        referral_source: referralSource,
        waiver_signed: waiverSigned,
        waiver_signed_at: waiverSigned ? new Date().toISOString() : null,
        pma_agreed: true,
        pma_agreed_at: new Date().toISOString(),
        jotform_submission_id: submissionId,
        raw_payload: payload,
      },
      { onConflict: "jotform_submission_id", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Upsert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

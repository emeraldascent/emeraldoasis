import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTHNET_URL = "https://api.authorize.net/xml/v1/request.api";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return respond(401, { error: "Not authenticated" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return respond(401, { error: "Invalid session" });

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, memberId, opaqueData, email, memberName } = await req.json();

    // Verify caller owns this member record
    const { data: member, error: memberError } = await adminSupabase
      .from("members")
      .select("id, user_id, authnet_customer_profile_id, authnet_payment_profile_id, saved_card_last4")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError || !member || member.user_id !== user.id) {
      return respond(403, { error: "Unauthorized" });
    }

    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");
    if (!apiLoginId || !transactionKey) {
      return respond(500, { error: "Payment gateway not configured" });
    }

    // ── CREATE profile from opaque payment data ──
    if (action === "save") {
      if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
        return respond(400, { error: "Missing payment token" });
      }

      // If customer profile already exists, delete it first
      if (member.authnet_customer_profile_id) {
        await deleteCustomerProfile(apiLoginId, transactionKey, member.authnet_customer_profile_id);
      }

      // Create customer profile with payment profile
      const firstName = (memberName || "").split(" ")[0] || "";
      const lastName = (memberName || "").split(" ").slice(1).join(" ") || "";

      const createXml = `<?xml version="1.0" encoding="utf-8"?>
<createCustomerProfileRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${esc(apiLoginId)}</name>
    <transactionKey>${esc(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <profile>
    <merchantCustomerId>${esc(memberId)}</merchantCustomerId>
    <email>${esc(email || "")}</email>
    <paymentProfiles>
      <billTo>
        <firstName>${esc(firstName)}</firstName>
        <lastName>${esc(lastName)}</lastName>
      </billTo>
      <payment>
        <opaqueData>
          <dataDescriptor>${esc(opaqueData.dataDescriptor)}</dataDescriptor>
          <dataValue>${esc(opaqueData.dataValue)}</dataValue>
        </opaqueData>
      </payment>
    </paymentProfiles>
  </profile>
  <validationMode>liveMode</validationMode>
</createCustomerProfileRequest>`;

      const res = await fetch(AUTHNET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: createXml,
      });

      const text = await res.text();
      const clean = text.replace(/^\uFEFF/, "");
      const resultCode = extractXml(clean, "resultCode");

      if (resultCode !== "Ok") {
        const errText = extractXml(clean, "text") || "Failed to save card";
        console.error("CIM create failed:", clean);
        return respond(400, { error: errText });
      }

      const customerProfileId = extractXml(clean, "customerProfileId");
      // Payment profile IDs come as a list; grab first
      const paymentProfileId = extractXml(clean, "customerPaymentProfileIdList");

      // Get last 4 digits by fetching the profile
      let last4 = "****";
      if (customerProfileId) {
        last4 = await getCardLast4(apiLoginId, transactionKey, customerProfileId) || "****";
      }

      // Save to members table
      await adminSupabase
        .from("members")
        .update({
          authnet_customer_profile_id: customerProfileId,
          authnet_payment_profile_id: paymentProfileId,
          saved_card_last4: last4,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memberId);

      return respond(200, {
        success: true,
        last4,
        customerProfileId,
      });
    }

    // ── DELETE saved profile ──
    if (action === "delete") {
      if (member.authnet_customer_profile_id) {
        await deleteCustomerProfile(apiLoginId, transactionKey, member.authnet_customer_profile_id);
      }

      await adminSupabase
        .from("members")
        .update({
          authnet_customer_profile_id: null,
          authnet_payment_profile_id: null,
          saved_card_last4: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memberId);

      return respond(200, { success: true });
    }

    return respond(400, { error: "Invalid action" });
  } catch (err) {
    console.error("manage-payment-profile error:", err);
    return respond(500, { error: "Failed to manage payment profile" });
  }
});

async function deleteCustomerProfile(apiLoginId: string, transactionKey: string, customerProfileId: string) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<deleteCustomerProfileRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${esc(apiLoginId)}</name>
    <transactionKey>${esc(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <customerProfileId>${esc(customerProfileId)}</customerProfileId>
</deleteCustomerProfileRequest>`;

  try {
    await fetch(AUTHNET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
  } catch (e) {
    console.error("Delete profile failed:", e);
  }
}

async function getCardLast4(apiLoginId: string, transactionKey: string, customerProfileId: string): Promise<string | null> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<getCustomerProfileRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${esc(apiLoginId)}</name>
    <transactionKey>${esc(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <customerProfileId>${esc(customerProfileId)}</customerProfileId>
</getCustomerProfileRequest>`;

  try {
    const res = await fetch(AUTHNET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
    const text = await res.text();
    const clean = text.replace(/^\uFEFF/, "");
    const cardNumber = extractXml(clean, "cardNumber");
    // Authorize.net returns masked like XXXX1234
    if (cardNumber) {
      return cardNumber.slice(-4);
    }
  } catch (e) {
    console.error("Get profile failed:", e);
  }
  return null;
}

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function extractXml(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

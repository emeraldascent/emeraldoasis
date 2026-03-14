import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Authorize.net XML API endpoint (production)
const AUTHNET_URL = "https://api.authorize.net/xml/v1/request.api";
// For sandbox, use: "https://apitest.authorize.net/xml/v1/request.api"

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opaqueData, amount, description, email, memberName } = await req.json();

    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return new Response(
        JSON.stringify({ error: "Missing payment token (opaqueData)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");

    if (!apiLoginId || !transactionKey) {
      console.error("Missing Authorize.net credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build createTransactionRequest XML
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<createTransactionRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${escapeXml(apiLoginId)}</name>
    <transactionKey>${escapeXml(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <transactionRequest>
    <transactionType>authCaptureTransaction</transactionType>
    <amount>${parseFloat(amount).toFixed(2)}</amount>
    <payment>
      <opaqueData>
        <dataDescriptor>${escapeXml(opaqueData.dataDescriptor)}</dataDescriptor>
        <dataValue>${escapeXml(opaqueData.dataValue)}</dataValue>
      </opaqueData>
    </payment>
    <order>
      <description>${escapeXml(description || "Emerald Oasis Booking")}</description>
    </order>
    <customer>
      <email>${escapeXml(email || "")}</email>
    </customer>
    <billTo>
      <firstName>${escapeXml((memberName || "").split(" ")[0] || "")}</firstName>
      <lastName>${escapeXml((memberName || "").split(" ").slice(1).join(" ") || "")}</lastName>
    </billTo>
  </transactionRequest>
</createTransactionRequest>`;

    const res = await fetch(AUTHNET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlBody,
    });

    const text = await res.text();
    // Remove BOM if present
    const clean = text.replace(/^\uFEFF/, "");

    // Parse key fields from XML response
    const resultCode = extractXml(clean, "resultCode");
    const messageCode = extractXml(clean, "code");
    const messageText = extractXml(clean, "text") || extractXml(clean, "description");
    const transId = extractXml(clean, "transId");
    const responseCode = extractXml(clean, "responseCode");

    if (resultCode === "Ok" && responseCode === "1") {
      return new Response(
        JSON.stringify({
          success: true,
          transactionId: transId,
          message: messageText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Authorize.net declined:", clean);
      return new Response(
        JSON.stringify({
          success: false,
          error: messageText || "Payment declined",
          code: messageCode,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("authorize-payment error:", err);
    return new Response(
      JSON.stringify({ error: "Payment processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractXml(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

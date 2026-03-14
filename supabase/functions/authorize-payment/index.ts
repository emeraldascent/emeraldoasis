import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Authorize.net XML API endpoint (production)
const AUTHNET_URL = "https://api.authorize.net/xml/v1/request.api";

// Simple in-memory rate limiter: max 5 requests per IP per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many payment requests. Please wait a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");

    if (!apiLoginId || !transactionKey) {
      console.error("Missing Authorize.net credentials");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── VOID a transaction ──
    if (action === "void") {
      const { transactionId } = body;
      if (!transactionId) {
        return new Response(
          JSON.stringify({ error: "Missing transactionId for void" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const voidXml = `<?xml version="1.0" encoding="utf-8"?>
<createTransactionRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${escapeXml(apiLoginId)}</name>
    <transactionKey>${escapeXml(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <transactionRequest>
    <transactionType>voidTransaction</transactionType>
    <refTransId>${escapeXml(transactionId)}</refTransId>
  </transactionRequest>
</createTransactionRequest>`;

      const res = await fetch(AUTHNET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: voidXml,
      });
      const text = await res.text();
      const clean = text.replace(/^\uFEFF/, "");
      const resultCode = extractXml(clean, "resultCode");
      const messageText = extractXml(clean, "text") || extractXml(clean, "description");

      if (resultCode === "Ok") {
        return new Response(
          JSON.stringify({ success: true, message: "Transaction voided" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.error("Void failed:", clean);
        return new Response(
          JSON.stringify({ success: false, error: messageText || "Void failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── CHARGE (default action) ──
    const { opaqueData, amount, description, email, memberName } = body;

    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return new Response(
        JSON.stringify({ error: "Missing payment token (opaqueData)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const clean = text.replace(/^\uFEFF/, "");

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

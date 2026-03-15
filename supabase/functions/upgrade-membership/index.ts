import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTHNET_URL = "https://api.authorize.net/xml/v1/request.api";

const TIER_PRICES: Record<string, number> = {
  weekly: 2,
  monthly: 4,
  seasonal: 10,
  annual: 20,
};

const TIER_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  seasonal: 90,
  annual: 365,
};

// Simple in-memory rate limiter
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

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return respond(429, { error: "Too many requests. Please wait a moment." });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return respond(401, { error: "Not authenticated" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respond(401, { error: "Invalid session" });
    }

    const { opaqueData, tier, memberId, email, memberName, mode, useSavedCard } = await req.json();

    if (!tier || !TIER_PRICES[tier]) {
      return respond(400, { error: "Invalid membership tier" });
    }

    // Verify caller owns this member record
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: memberRecord, error: memberError } = await adminSupabase
      .from("members")
      .select("id, user_id, membership_end, membership_tier, authnet_customer_profile_id, authnet_payment_profile_id")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError || !memberRecord || memberRecord.user_id !== user.id) {
      return respond(403, { error: "Unauthorized" });
    }

    const amount = TIER_PRICES[tier];

    // Validate payment method
    if (useSavedCard) {
      if (!memberRecord.authnet_customer_profile_id || !memberRecord.authnet_payment_profile_id) {
        return respond(400, { error: "No saved payment method found" });
      }
    } else if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return respond(400, { error: "Missing payment token" });
    }

    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");
    if (!apiLoginId || !transactionKey) {
      return respond(500, { error: "Payment gateway not configured" });
    }

    // 1. Charge via Authorize.net
    const description = mode === "extend"
      ? `Extend ${tier} PMA Membership — ${TIER_DAYS[tier]} days`
      : `Upgrade to ${tier} PMA Membership — ${TIER_DAYS[tier]} days`;

    let xmlBody: string;

    if (useSavedCard) {
      // Charge using saved customer profile
      xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<createTransactionRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${esc(apiLoginId)}</name>
    <transactionKey>${esc(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <transactionRequest>
    <transactionType>authCaptureTransaction</transactionType>
    <amount>${amount.toFixed(2)}</amount>
    <profile>
      <customerProfileId>${esc(memberRecord.authnet_customer_profile_id!)}</customerProfileId>
      <paymentProfile>
        <paymentProfileId>${esc(memberRecord.authnet_payment_profile_id!)}</paymentProfileId>
      </paymentProfile>
    </profile>
    <order>
      <description>${esc(description)}</description>
    </order>
  </transactionRequest>
</createTransactionRequest>`;
    } else {
      // Charge using opaque data (one-time token)
      xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<createTransactionRequest xmlns="AnetApi/xml/v1/schema/AnetApiSchema.xsd">
  <merchantAuthentication>
    <name>${esc(apiLoginId)}</name>
    <transactionKey>${esc(transactionKey)}</transactionKey>
  </merchantAuthentication>
  <transactionRequest>
    <transactionType>authCaptureTransaction</transactionType>
    <amount>${amount.toFixed(2)}</amount>
    <payment>
      <opaqueData>
        <dataDescriptor>${esc(opaqueData.dataDescriptor)}</dataDescriptor>
        <dataValue>${esc(opaqueData.dataValue)}</dataValue>
      </opaqueData>
    </payment>
    <order>
      <description>${esc(description)}</description>
    </order>
    <customer>
      <email>${esc(email || "")}</email>
    </customer>
    <billTo>
      <firstName>${esc((memberName || "").split(" ")[0] || "")}</firstName>
      <lastName>${esc((memberName || "").split(" ").slice(1).join(" ") || "")}</lastName>
    </billTo>
  </transactionRequest>
</createTransactionRequest>`;
    }

    const res = await fetch(AUTHNET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlBody,
    });

    const text = await res.text();
    const clean = text.replace(/^\uFEFF/, "");
    const resultCode = extractXml(clean, "resultCode");
    const responseCode = extractXml(clean, "responseCode");
    const transId = extractXml(clean, "transId");
    const messageText = extractXml(clean, "text") || extractXml(clean, "description");

    if (resultCode !== "Ok" || responseCode !== "1") {
      console.error("Payment declined:", clean);
      return respond(400, { error: messageText || "Payment declined" });
    }

    console.log(`PMA ${mode} payment: $${amount} for ${tier}, txn ${transId}`);

    // 2. Update membership
    const currentEnd = new Date(memberRecord.membership_end);
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setDate(newEnd.getDate() + TIER_DAYS[tier]);

    const { error: updateError } = await adminSupabase
      .from("members")
      .update({
        membership_tier: tier,
        membership_end: newEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (updateError) {
      console.error("DB update failed:", updateError);
      return respond(500, {
        error: "Payment succeeded but account update failed. Contact support.",
        transactionId: transId,
      });
    }

    // 3. Sync tier to jotform_submissions
    await adminSupabase
      .from("jotform_submissions")
      .update({ membership_tier: tier })
      .eq("matched_member_id", memberId);

    return respond(200, {
      success: true,
      transactionId: transId,
      tier,
      newEnd: newEnd.toISOString(),
    });
  } catch (err) {
    console.error("upgrade-membership error:", err);
    return respond(500, { error: "Membership upgrade failed" });
  }
});

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

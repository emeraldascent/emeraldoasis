import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUTHNET_URL = "https://api.authorize.net/xml/v1/request.api";

const TIER_PRICES: Record<string, number> = {
  silver: 25,
  gold: 50,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opaqueData, tier, memberId, email, memberName } = await req.json();

    // Validate tier
    if (!tier || !TIER_PRICES[tier]) {
      return respond(400, { error: "Invalid membership tier" });
    }

    const amount = TIER_PRICES[tier];

    // Validate payment token
    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return respond(400, { error: "Missing payment token" });
    }

    const apiLoginId = Deno.env.get("AUTHNET_API_LOGIN_ID");
    const transactionKey = Deno.env.get("AUTHNET_TRANSACTION_KEY");
    if (!apiLoginId || !transactionKey) {
      return respond(500, { error: "Payment gateway not configured" });
    }

    // 1. Charge via Authorize.net
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
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
      <description>${esc(`${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership — 30 days`)}</description>
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

    console.log(`Payment successful: $${amount} for ${tier} membership, txn ${transId}`);

    // 2. Update member in our database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from("members")
      .update({
        subscription_active: true,
        subscription_tier: tier,
        membership_start: now.toISOString(),
        membership_end: thirtyDaysLater.toISOString(),
      })
      .eq("id", memberId);

    if (updateError) {
      console.error("DB update failed:", updateError);
      // Payment went through but DB failed — log for manual resolution
      return respond(500, {
        error: "Payment succeeded but account update failed. Contact support.",
        transactionId: transId,
      });
    }

    // 3. Best-effort: sync membership to SimplyBook
    try {
      const sbApiKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
      if (sbApiKey) {
        // Get admin token
        const loginRes = await fetch("https://user-api.simplybook.me/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "getUserToken",
            params: ["emeraldoasiscamp", "admin", sbApiKey],
            id: 1,
          }),
        });
        const loginData = await loginRes.json();
        const token = loginData.result;

        if (token) {
          const sbHeaders = {
            "Content-Type": "application/json",
            "X-Company-Login": "emeraldoasiscamp",
            "X-User-Token": token,
          };
          const sbUrl = "https://user-api.simplybook.me/admin/";

          // Find or create client by email
          const searchRes = await fetch(sbUrl, {
            method: "POST",
            headers: sbHeaders,
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "getClientList",
              params: [{ search: email }],
              id: 2,
            }),
          });
          const searchData = await searchRes.json();
          let clientId: string | null = null;

          if (searchData.result?.length > 0) {
            clientId = searchData.result[0].id;
          } else {
            // Create client
            const nameParts = (memberName || "").split(" ");
            const createRes = await fetch(sbUrl, {
              method: "POST",
              headers: sbHeaders,
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "addClient",
                params: [{
                  name: nameParts[0] || "",
                  name2: nameParts.slice(1).join(" ") || "",
                  email: email || "",
                }],
                id: 3,
              }),
            });
            const createData = await createRes.json();
            clientId = createData.result;
          }

          if (clientId) {
            // Update simplybook_client_id in our DB
            await supabase.from("members").update({ simplybook_client_id: clientId }).eq("id", memberId);

            // Get available memberships to find the right one
            const membershipsRes = await fetch(sbUrl, {
              method: "POST",
              headers: sbHeaders,
              body: JSON.stringify({
                jsonrpc: "2.0",
                method: "getMembershipList",
                params: [],
                id: 4,
              }),
            });
            const membershipsData = await membershipsRes.json();
            console.log("SimplyBook memberships:", JSON.stringify(membershipsData.result));

            // Find membership matching tier name (Silver/Gold)
            const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
            const membership = (membershipsData.result || []).find(
              (m: any) => m.name?.toLowerCase().includes(tier) || m.name?.includes(tierName)
            );

            if (membership) {
              // Issue membership to client
              const issueRes = await fetch(sbUrl, {
                method: "POST",
                headers: sbHeaders,
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "issueClientMembership",
                  params: [clientId, membership.id],
                  id: 5,
                }),
              });
              const issueData = await issueRes.json();
              console.log("SimplyBook membership issued:", JSON.stringify(issueData));
            } else {
              console.warn(`No SimplyBook membership found matching tier "${tier}"`);
            }
          }
        }
      }
    } catch (sbErr) {
      console.warn("SimplyBook sync (non-blocking):", sbErr);
    }

    return respond(200, {
      success: true,
      transactionId: transId,
      tier,
      expiresAt: thirtyDaysLater.toISOString(),
    });
  } catch (err) {
    console.error("purchase-membership error:", err);
    return respond(500, { error: "Membership purchase failed" });
  }
});

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: string): string {
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

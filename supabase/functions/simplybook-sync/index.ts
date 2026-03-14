import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  return data; // Return full response so we can inspect errors
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SIMPLYBOOK_API_KEY) {
      throw new Error("Missing SIMPLYBOOK_API_KEY secret.");
    }

    console.log("Authenticating with SimplyBook API...");
    const token = await getToken();
    console.log("Token obtained.");

    // Get membership types to know Silver/Gold IDs
    const membershipResult = await callApi(token, "getMembershipList", []);
    const membershipTypes = membershipResult.result || [];
    console.log(`Found ${membershipTypes.length} membership types`);

    // Build membership ID -> tier map
    const membershipTierMap = new Map<string, string>();
    for (const m of membershipTypes) {
      const name = (m.name || "").toLowerCase();
      if (name.includes("gold")) membershipTierMap.set(String(m.id), "gold");
      else if (name.includes("silver")) membershipTierMap.set(String(m.id), "silver");
    }
    console.log("Membership tier map:", JSON.stringify(Object.fromEntries(membershipTierMap)));

    // Try various method signatures for getClientMembershipList
    const methodAttempts = [
      // Try with no filter, maybe it returns all
      { method: "getClientMembershipList", params: [null, null] },
      { method: "getClientMembershipList", params: [{}] },
      // Try getting by membership ID
      ...Array.from(membershipTierMap.keys()).map(id => ({
        method: "getClientMembershipList", params: [{ membership_id: id }]
      })),
      ...Array.from(membershipTierMap.keys()).map(id => ({
        method: "getClientMembershipList", params: [id]
      })),
      // Try other methods
      { method: "getMembershipClientList", params: [] },
      { method: "getActiveMemberships", params: [] },
      { method: "getClientMemberships", params: [] },
    ];

    let successfulResult: any = null;
    let successfulMethod = "";

    for (const attempt of methodAttempts) {
      const result = await callApi(token, attempt.method, attempt.params);
      console.log(`${attempt.method}(${JSON.stringify(attempt.params)}):`, 
        result.error ? `ERROR: ${result.error.message}` : `OK: ${JSON.stringify(result.result).substring(0, 300)}`);
      
      if (!result.error && result.result) {
        successfulResult = result.result;
        successfulMethod = `${attempt.method}(${JSON.stringify(attempt.params)})`;
        break;
      }
    }

    // Build email -> tier map
    const activeSubscriptions = new Map<string, string>();

    if (successfulResult) {
      console.log("Processing results from:", successfulMethod);
      const entries = Array.isArray(successfulResult) 
        ? successfulResult 
        : Object.values(successfulResult);
      
      for (const entry of entries) {
        const e = entry as any;
        const email = (e.email || e.client_email || "").toLowerCase().trim();
        const membershipId = String(e.membership_id || e.membershipId || "");
        
        if (email && membershipTierMap.has(membershipId)) {
          activeSubscriptions.set(email, membershipTierMap.get(membershipId)!);
        } else if (email) {
          // Try to detect tier from string content
          const entryStr = JSON.stringify(e).toLowerCase();
          if (entryStr.includes("gold")) activeSubscriptions.set(email, "gold");
          else if (entryStr.includes("silver")) activeSubscriptions.set(email, "silver");
        }
      }
    }

    console.log(`Active subscriptions mapped: ${activeSubscriptions.size}`);

    // Sync to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbMembers, error: dbError } = await supabase
      .from("members")
      .select("id, email, subscription_active, subscription_tier");
    if (dbError) throw new Error(dbError.message);

    let updatedCount = 0;
    const updates = [];

    for (const member of dbMembers) {
      if (!member.email) continue;
      const email = member.email.toLowerCase().trim();
      const activeTier = activeSubscriptions.get(email);
      const shouldBeActive = !!activeTier;

      if (member.subscription_active !== shouldBeActive || member.subscription_tier !== (activeTier || null)) {
        console.log(`Updating ${email}: active=${shouldBeActive}, tier=${activeTier || "none"}`);
        updates.push(
          supabase
            .from("members")
            .update({
              subscription_active: shouldBeActive,
              subscription_tier: activeTier || null,
            })
            .eq("id", member.id)
        );
        updatedCount++;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync complete",
        membership_types: membershipTypes.map((m: any) => ({ id: m.id, name: m.name })),
        successful_method: successfulMethod || "none",
        active_subscriptions: activeSubscriptions.size,
        records_updated: updatedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

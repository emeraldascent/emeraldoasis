import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_API_KEY = Deno.env.get("SIMPLYBOOK_API_KEY") || "";
const SIMPLYBOOK_ADMIN_API_KEY = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY") || "";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";
const SIMPLYBOOK_PUBLIC_URL = "https://user-api.simplybook.me";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function rpcCall(url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return await res.json();
}

async function rpcCallWithToken(url: string, token: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 2 }),
  });
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    // Step 1: Try multiple auth approaches to get admin access
    let adminToken: string | null = null;

    // Approach 1: getUserToken with admin API key
    const authAttempts = [
      { method: "getUserToken", params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_API_KEY], label: "getUserToken+adminKey" },
      { method: "getUserToken", params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_API_KEY], label: "getUserToken+publicKey" },
      { method: "getToken", params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_API_KEY], label: "getToken+adminKey" },
    ];

    for (const attempt of authAttempts) {
      const result = await rpcCall(SIMPLYBOOK_LOGIN_URL, attempt.method, attempt.params);
      if (result.result) {
        log(`Auth SUCCESS with ${attempt.label}`);
        // Test if this token works on admin endpoint
        const testResult = await rpcCallWithToken(SIMPLYBOOK_ADMIN_URL, result.result, "getClientList", [null, "client", null]);
        if (testResult.result) {
          log(`Admin access WORKS with ${attempt.label}`);
          adminToken = result.result;
          break;
        } else {
          log(`Admin access DENIED with ${attempt.label}: ${testResult.error?.message || "unknown"}`);
        }
      } else {
        log(`Auth FAILED with ${attempt.label}: ${result.error?.message || "unknown"}`);
      }
    }

    // Step 2: Get public token for membership type info
    const publicTokenResult = await rpcCall(SIMPLYBOOK_LOGIN_URL, "getToken", [SIMPLYBOOK_COMPANY, SIMPLYBOOK_API_KEY]);
    if (publicTokenResult.error) throw new Error("Public auth failed: " + publicTokenResult.error.message);
    const publicToken = publicTokenResult.result;

    // Get membership types
    const membershipResult = await rpcCallWithToken(SIMPLYBOOK_PUBLIC_URL, publicToken, "getMembershipList", []);
    const membershipTypes = membershipResult.result || [];
    log(`Membership types: ${membershipTypes.map((m: any) => `${m.id}=${m.name}`).join(", ")}`);

    const membershipTierMap = new Map<string, string>();
    for (const m of membershipTypes) {
      const name = (m.name || "").toLowerCase();
      if (name.includes("gold")) membershipTierMap.set(String(m.id), "gold");
      else if (name.includes("silver")) membershipTierMap.set(String(m.id), "silver");
    }

    // Step 3: Get active subscriptions
    const activeSubscriptions = new Map<string, string>();

    if (adminToken) {
      // We have admin access — get full client list with memberships
      log("Using admin API to fetch client memberships...");
      const clientResult = await rpcCallWithToken(SIMPLYBOOK_ADMIN_URL, adminToken, "getClientList", [null, "client", null]);
      const clientMap = clientResult.result?.data || clientResult.result || {};
      const clients = Object.values(clientMap);
      log(`Found ${clients.length} clients`);

      for (const client of clients) {
        const c = client as any;
        if (!c.email) continue;
        const email = c.email.toLowerCase().trim();
        const clientStr = JSON.stringify(c).toLowerCase();
        
        if (clientStr.includes("gold")) activeSubscriptions.set(email, "gold");
        else if (clientStr.includes("silver")) activeSubscriptions.set(email, "silver");
      }
    } else {
      // No admin access — try to check memberships for known members via public API
      log("No admin access. Trying per-member lookup via public API...");
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: dbMembers } = await supabase
        .from("members")
        .select("id, email, simplybook_client_id");

      if (dbMembers) {
        for (const member of dbMembers) {
          if (!member.simplybook_client_id) continue;
          
          // Try getClientMembershipList with client_id
          const result = await rpcCallWithToken(
            SIMPLYBOOK_PUBLIC_URL, publicToken, 
            "getClientMembershipList", [member.simplybook_client_id]
          );
          
          if (result.result && !result.error) {
            const memberships = Array.isArray(result.result) ? result.result : Object.values(result.result);
            for (const m of memberships) {
              const mid = String((m as any).membership_id || "");
              if (membershipTierMap.has(mid)) {
                activeSubscriptions.set(member.email.toLowerCase().trim(), membershipTierMap.get(mid)!);
              }
            }
          }
        }
      }
      
      log(`Per-member lookup found ${activeSubscriptions.size} subscriptions`);
    }

    log(`Total active subscriptions: ${activeSubscriptions.size}`);

    // Step 4: Sync to Supabase
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
        log(`Updating ${email}: active=${shouldBeActive}, tier=${activeTier || "none"}`);
        updates.push(
          supabase.from("members")
            .update({ subscription_active: shouldBeActive, subscription_tier: activeTier || null })
            .eq("id", member.id)
        );
        updatedCount++;
      }
    }

    if (updates.length > 0) await Promise.all(updates);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync complete",
        admin_access: !!adminToken,
        membership_types: membershipTypes.map((m: any) => ({ id: m.id, name: m.name })),
        active_subscriptions: activeSubscriptions.size,
        records_updated: updatedCount,
        logs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

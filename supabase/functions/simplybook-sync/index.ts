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
  if (data.error) throw new Error(`${method}: ${data.error.message}`);
  return data.result;
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

    // Try to get membership/subscription info via available API methods
    // First check what plugins are active
    let plugins: string[] = [];
    try {
      const pluginList = await callApi(token, "isPluginActivated", ["membership"]);
      console.log("Membership plugin active:", pluginList);
      if (pluginList) plugins.push("membership");
    } catch (e) {
      console.log("Membership plugin check:", String(e));
    }

    // Try getMembershipList to see available membership types
    let membershipTypes: any = null;
    try {
      membershipTypes = await callApi(token, "getMembershipList", []);
      console.log("Membership types:", JSON.stringify(membershipTypes));
    } catch (e) {
      console.log("getMembershipList:", String(e));
    }

    // Try getClientMembershipList or similar
    let clientMemberships: any = null;
    const methodsToTry = [
      "getClientMembershipList",
      "getMembershipClientList", 
      "getClientList",
    ];

    for (const method of methodsToTry) {
      try {
        clientMemberships = await callApi(token, method, []);
        console.log(`${method} succeeded:`, JSON.stringify(clientMemberships).substring(0, 500));
        break;
      } catch (e) {
        console.log(`${method} failed:`, String(e));
      }
    }

    // Build email -> tier map
    const activeSubscriptions = new Map<string, string>();

    if (clientMemberships) {
      const entries = Array.isArray(clientMemberships) 
        ? clientMemberships 
        : Object.values(clientMemberships);
      
      for (const entry of entries) {
        const e = entry as any;
        if (!e.email && !e.client_email) continue;
        const email = (e.email || e.client_email || "").toLowerCase().trim();
        if (!email) continue;

        const entryStr = JSON.stringify(e).toLowerCase();
        let tier: string | null = null;
        if (entryStr.includes("gold")) tier = "gold";
        else if (entryStr.includes("silver")) tier = "silver";

        if (tier) {
          activeSubscriptions.set(email, tier);
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

      if (member.subscription_active !== shouldBeActive || member.subscription_tier !== activeTier) {
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
        membership_types: membershipTypes,
        active_subscriptions: activeSubscriptions.size,
        records_updated: updatedCount,
        methods_available: clientMemberships ? true : false,
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

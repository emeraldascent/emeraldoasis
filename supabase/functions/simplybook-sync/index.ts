import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_API_KEY = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY") || "";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_API_URL = "https://user-api.simplybook.me/admin/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAdminToken(): Promise<string> {
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getToken",
      params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_API_KEY],
      id: 1,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function callAdminApi(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_ADMIN_API_URL, {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SIMPLYBOOK_ADMIN_API_KEY) {
      throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret. Please add it to Supabase Edge Function secrets.");
    }

    console.log("Authenticating with SimplyBook Admin API...");
    const token = await getAdminToken();

    console.log("Fetching memberships...");
    // 1. Get all active memberships via getClientList (or similar method)
    // We request the client list, and parse out their active memberships
    let clientsRaw = null;
    try {
      clientsRaw = await callAdminApi(token, "getClientList", [null, "client", null]);
    } catch (e) {
      console.error("Failed to call getClientList on Admin API:", e);
      throw e;
    }
    
    // We expect clientsRaw to be a paginated response like { data: { "1": { ... } }, metadata: {...} }
    const clientMap = clientsRaw.data || clientsRaw;
    const clients = Object.values(clientMap);

    console.log(`Found ${clients.length} clients in SimplyBook.`);

    // Map emails to their subscription tier based on SimplyBook data
    const activeSubscriptions = new Map<string, string>(); // email -> tier

    for (const client of clients) {
      const c = client as any;
      if (!c.email) continue;
      const email = c.email.toLowerCase().trim();
      
      // Determine if they have an active Silver or Gold membership
      const clientStr = JSON.stringify(c).toLowerCase();
      let tier = null;
      
      // Look for membership indicators in the client object
      // (SimplyBook usually embeds 'memberships' or 'client_memberships' arrays)
      if (clientStr.includes("membership") || c.memberships) {
        if (clientStr.includes("gold")) {
          tier = "gold";
        } else if (clientStr.includes("silver")) {
          tier = "silver";
        }
      }

      if (tier) {
        activeSubscriptions.set(email, tier);
      }
    }

    console.log(`Found ${activeSubscriptions.size} active SimplyBook subscriptions (Silver/Gold).`);

    // Now update Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all members from Supabase
    const { data: dbMembers, error: dbError } = await supabase.from("members").select("id, email, subscription_active, subscription_tier");
    if (dbError) throw new Error(dbError.message);

    let updatedCount = 0;
    const updates = [];

    // Compare and sync
    for (const member of dbMembers) {
      if (!member.email) continue;
      const email = member.email.toLowerCase().trim();
      const activeTier = activeSubscriptions.get(email);
      
      const shouldBeActive = !!activeTier;
      
      if (member.subscription_active !== shouldBeActive || member.subscription_tier !== activeTier) {
        console.log(`Updating ${email}: active=${shouldBeActive}, tier=${activeTier}`);
        updates.push(
          supabase
            .from("members")
            .update({
              subscription_active: shouldBeActive,
              subscription_tier: activeTier || null
            })
            .eq("id", member.id)
        );
        updatedCount++;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Sync complete", 
      simplybook_clients_checked: clients.length,
      active_subscriptions_found: activeSubscriptions.size,
      supabase_records_updated: updatedCount
    }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.toString() }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

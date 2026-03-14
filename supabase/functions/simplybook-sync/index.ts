import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAdminToken(): Promise<string> {
  const apiKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  // Use API User Key with getUserToken to get a session token
  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, apiKey],
      id: 1,
    }),
  });
  const data = await res.json();
  console.log("getUserToken response:", JSON.stringify(data));
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  return data.result;
}

async function callAdminApi(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_ADMIN_URL, {
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
    console.log("Using API User Key for SimplyBook auth...");
    const apiKey = getApiUserKey();

    console.log("Fetching client list...");
    const clientsRaw = await callAdminApi(apiKey, "getClientList", [null, "client", null]);
    const clientMap = clientsRaw?.data || clientsRaw || {};
    const clients: any[] = Object.values(clientMap);
    console.log(`Found ${clients.length} clients.`);

    // Build email -> tier map
    const activeSubscriptions = new Map<string, string>();

    // Check each client's membership
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbMembers, error: dbError } = await supabase
      .from("members")
      .select("id, email, subscription_active, subscription_tier");
    if (dbError) throw new Error(dbError.message);

    const memberEmails = new Set(dbMembers.map((m) => m.email.toLowerCase().trim()));

    // For each SimplyBook client that matches a member, check memberships
    for (const c of clients) {
      if (!c.email) continue;
      const email = c.email.toLowerCase().trim();
      if (!memberEmails.has(email)) continue;

      // Check client data for membership indicators
      const clientStr = JSON.stringify(c).toLowerCase();
      if (clientStr.includes("gold") || clientStr.includes("oasis pass - gold")) {
        activeSubscriptions.set(email, "gold");
        continue;
      } else if (clientStr.includes("silver") || clientStr.includes("oasis pass - silver")) {
        activeSubscriptions.set(email, "silver");
        continue;
      }

      // Try per-client membership lookup
      try {
        const memberships = await callAdminApi(apiKey, "getClientMembershipList", [String(c.id)]);
        if (memberships) {
          const entries = Array.isArray(memberships) ? memberships : Object.values(memberships);
          for (const m of entries) {
            const mName = String((m as any).name || "").toLowerCase();
            if (mName.includes("gold")) activeSubscriptions.set(email, "gold");
            else if (mName.includes("silver")) activeSubscriptions.set(email, "silver");
          }
        }
      } catch (e) {
        console.log(`Membership check for ${email} (client ${c.id}): ${String(e)}`);
      }
    }

    console.log(`Active subscriptions: ${activeSubscriptions.size}`);

    // Sync to Supabase
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
        simplybook_clients: clients.length,
        active_subscriptions: activeSubscriptions.size,
        records_updated: updatedCount,
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

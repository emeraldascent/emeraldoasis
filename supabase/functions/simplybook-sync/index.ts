import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_LOGIN = "emeraldoasiscamp@gmail.com";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAdminToken(): Promise<string> {
  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  const res = await fetch(SIMPLYBOOK_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_ADMIN_LOGIN, apiUserKey],
      id: 1,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  if (!data.result) throw new Error("Auth failed: empty token");
  return data.result;
}

async function callAdminApi(token: string, method: string, params: unknown[]) {
  const res = await fetch(SIMPLYBOOK_ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-User-Token": token,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 2 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${method}: ${data.error.message}`);
  return data.result;
}

function detectTierFromClient(client: any): string | null {
  const clientStr = JSON.stringify(client).toLowerCase();
  if (clientStr.includes("gold")) return "gold";
  if (clientStr.includes("silver")) return "silver";
  return null;
}

async function detectTierFromMemberships(token: string, clientId: string): Promise<string | null> {
  try {
    const memberships = await callAdminApi(token, "getClientMembershipList", [clientId]);
    if (!memberships) return null;
    const entries = Array.isArray(memberships) ? memberships : Object.values(memberships);
    for (const m of entries) {
      const mName = String((m as any).name || "").toLowerCase();
      if (mName.includes("gold")) return "gold";
      if (mName.includes("silver")) return "silver";
    }
  } catch (e) {
    console.log(`Membership check for client ${clientId}: ${e}`);
  }
  return null;
}

// ─── Single-member sync: check one member's subscription status ───
async function syncSingleMember(email: string) {
  const supabase = getSupabase();
  const normalizedEmail = email.toLowerCase().trim();

  // Get the member from our DB
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, email, subscription_active, subscription_tier")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message);
  if (!member) throw new Error(`Member not found: ${normalizedEmail}`);

  // Get admin token and client list from SimplyBook
  const token = await getAdminToken();
  const clientsRaw = await callAdminApi(token, "getClientList", []);
  const clients: any[] = Array.isArray(clientsRaw) ? clientsRaw : Object.values(clientsRaw);

  // Find matching client
  const matchingClient = clients.find(
    (c: any) => c.email && c.email.toLowerCase().trim() === normalizedEmail,
  );

  let detectedTier: string | null = null;

  if (matchingClient) {
    detectedTier = detectTierFromClient(matchingClient);
    if (!detectedTier) {
      detectedTier = await detectTierFromMemberships(token, String(matchingClient.id));
    }
  }

  const shouldBeActive = !!detectedTier;

  // Only update if changed
  if (member.subscription_active !== shouldBeActive || member.subscription_tier !== (detectedTier || null)) {
    console.log(`Updating ${normalizedEmail}: active=${shouldBeActive}, tier=${detectedTier || "none"}`);
    const { error: updateError } = await supabase
      .from("members")
      .update({
        subscription_active: shouldBeActive,
        subscription_tier: detectedTier || null,
      })
      .eq("id", member.id);
    if (updateError) throw new Error(updateError.message);
  }

  return {
    email: normalizedEmail,
    subscription_active: shouldBeActive,
    subscription_tier: detectedTier || null,
    updated: member.subscription_active !== shouldBeActive || member.subscription_tier !== (detectedTier || null),
  };
}

// ─── Full sync: check all members ───
async function syncAllMembers() {
  const supabase = getSupabase();
  const token = await getAdminToken();

  // Get client list
  const clientsRaw = await callAdminApi(token, "getClientList", []);
  const clients: any[] = Array.isArray(clientsRaw) ? clientsRaw : Object.values(clientsRaw);
  console.log(`Found ${clients.length} SimplyBook clients.`);

  const { data: dbMembers, error: dbError } = await supabase
    .from("members")
    .select("id, email, subscription_active, subscription_tier");
  if (dbError) throw new Error(dbError.message);

  const memberEmails = new Set(dbMembers.map((m) => m.email.toLowerCase().trim()));
  const activeSubscriptions = new Map<string, string>();

  for (const c of clients) {
    if (!c.email) continue;
    const email = c.email.toLowerCase().trim();
    if (!memberEmails.has(email)) continue;

    const tier = detectTierFromClient(c);
    if (tier) {
      activeSubscriptions.set(email, tier);
      continue;
    }

    const membershipTier = await detectTierFromMemberships(token, String(c.id));
    if (membershipTier) activeSubscriptions.set(email, membershipTier);
  }

  console.log(`Active subscriptions: ${activeSubscriptions.size}`);

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
          .update({ subscription_active: shouldBeActive, subscription_tier: activeTier || null })
          .eq("id", member.id),
      );
      updatedCount++;
    }
  }

  if (updates.length > 0) await Promise.all(updates);

  return {
    simplybook_clients: clients.length,
    active_subscriptions: activeSubscriptions.size,
    records_updated: updatedCount,
  };
}

// ─── Handler ───
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body = full sync (e.g. cron call)
    }

    const { action, email } = body;

    // Single-member check (called from frontend after membership purchase)
    if (action === "check_member" && email) {
      console.log(`Single-member sync for: ${email}`);
      const result = await syncSingleMember(email);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full sync (called by cron or manually)
    console.log("Running full membership sync...");
    const result = await syncAllMembers();
    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

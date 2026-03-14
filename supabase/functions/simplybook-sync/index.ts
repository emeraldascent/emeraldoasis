import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_API_KEY = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Authenticate with SimplyBook REST API v2 using custom API key
async function getV2Token(): Promise<string> {
  const res = await fetch("https://login.simplybook.me/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: SIMPLYBOOK_COMPANY,
      key: SIMPLYBOOK_ADMIN_API_KEY,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.token;
}

async function v2Get(token: string, path: string) {
  const res = await fetch(`https://user-api.simplybook.me/admin${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SIMPLYBOOK_ADMIN_API_KEY) {
      throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");
    }

    console.log("Authenticating with SimplyBook REST API v2...");
    const token = await getV2Token();
    console.log("Token obtained successfully.");

    // Fetch clients with memberships
    console.log("Fetching clients...");
    let clients: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await v2Get(token, `/clients?page=${page}&on_page=${perPage}`);
      const batch = Array.isArray(result) ? result : (result.data || []);
      clients = clients.concat(batch);
      console.log(`Page ${page}: ${batch.length} clients`);
      if (batch.length < perPage) break;
      page++;
    }

    console.log(`Total clients fetched: ${clients.length}`);

    // Fetch active memberships
    console.log("Fetching memberships...");
    let memberships: any[] = [];
    try {
      const mResult = await v2Get(token, "/memberships");
      memberships = Array.isArray(mResult) ? mResult : (mResult.data || []);
    } catch (e) {
      console.warn("Could not fetch /memberships endpoint, trying /client-memberships...");
      try {
        const mResult = await v2Get(token, "/client-memberships");
        memberships = Array.isArray(mResult) ? mResult : (mResult.data || []);
      } catch (e2) {
        console.warn("Could not fetch client-memberships either:", String(e2));
      }
    }

    console.log(`Memberships found: ${memberships.length}`);

    // Build email -> tier map from membership data
    const activeSubscriptions = new Map<string, string>();

    // Try to match memberships to clients
    for (const m of memberships) {
      const mStr = JSON.stringify(m).toLowerCase();
      let tier: string | null = null;
      if (mStr.includes("gold")) tier = "gold";
      else if (mStr.includes("silver")) tier = "silver";

      if (tier && m.client_id) {
        // Find client email by client_id
        const client = clients.find((c: any) => String(c.id) === String(m.client_id));
        if (client?.email) {
          activeSubscriptions.set(client.email.toLowerCase().trim(), tier);
        }
      }
    }

    // Also scan client objects for embedded membership info
    for (const c of clients) {
      if (!c.email) continue;
      const email = c.email.toLowerCase().trim();
      if (activeSubscriptions.has(email)) continue;

      const clientStr = JSON.stringify(c).toLowerCase();
      if (clientStr.includes("gold")) {
        activeSubscriptions.set(email, "gold");
      } else if (clientStr.includes("silver")) {
        activeSubscriptions.set(email, "silver");
      }
    }

    console.log(`Active subscriptions found: ${activeSubscriptions.size}`);

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
        clients_checked: clients.length,
        memberships_found: memberships.length,
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

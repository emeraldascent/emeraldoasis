import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SIMPLYBOOK_COMPANY = "emeraldoasiscamp";
const SIMPLYBOOK_ADMIN_LOGIN = "emeraldoasiscamp@gmail.com";
const SIMPLYBOOK_LOGIN_URL = "https://user-api.simplybook.me/login";
const SIMPLYBOOK_PUBLIC_URL = "https://user-api.simplybook.me";
const SIMPLYBOOK_ADMIN_URL = "https://user-api.simplybook.me/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getToken(): Promise<string> {
  const apiUserKey = Deno.env.get("SIMPLYBOOK_ADMIN_API_KEY");
  if (!apiUserKey) throw new Error("Missing SIMPLYBOOK_ADMIN_API_KEY secret.");

  // getUserToken with API User Key bypasses IP restrictions
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
  console.log("getUserToken response:", JSON.stringify(data));
  if (data.error) throw new Error("Auth failed: " + data.error.message);
  if (!data.result) throw new Error("Auth failed: empty token");
  return data.result;
}

async function callApi(token: string, url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 2 }),
  });

  const data = await res.json();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Authenticating...");
    const token = await getToken();
    console.log("Token obtained.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: dbMembers, error: dbError } = await supabase
      .from("members")
      .select("id, email, subscription_active, subscription_tier, simplybook_client_id");
    if (dbError) throw new Error(dbError.message);

    // Step 1: Get available memberships from the public API
    const membershipListRes = await callApi(token, SIMPLYBOOK_PUBLIC_URL, "getMembershipList", []);
    console.log("getMembershipList:", JSON.stringify(membershipListRes));

    // Step 2: Try admin getClientList first, fall back to public API
    let clients: any[] = [];
    const adminRes = await callApi(token, SIMPLYBOOK_ADMIN_URL, "getClientList", [null, "client", null]);
    if (!adminRes.error) {
      const clientMap = adminRes.result?.data || adminRes.result || {};
      clients = Object.values(clientMap);
      console.log(`Admin getClientList: ${clients.length} clients`);
    } else {
      console.log(`Admin getClientList denied: ${adminRes.error.message}`);
      // Try public API method
      const pubRes = await callApi(token, SIMPLYBOOK_PUBLIC_URL, "getClientList", [null, "client", null]);
      if (!pubRes.error) {
        const clientMap = pubRes.result?.data || pubRes.result || {};
        clients = Object.values(clientMap);
        console.log(`Public getClientList: ${clients.length} clients`);
      } else {
        console.log(`Public getClientList also denied: ${pubRes.error.message}`);
      }
    }

    const activeSubscriptions = new Map<string, string>();

    if (clients.length > 0) {
      // Match clients to members by email
      const memberEmails = new Set(dbMembers.map((m) => m.email.toLowerCase().trim()));

      for (const c of clients) {
        if (!c.email) continue;
        const email = c.email.toLowerCase().trim();
        if (!memberEmails.has(email)) continue;

        // Check client data for membership indicators
        const clientStr = JSON.stringify(c).toLowerCase();
        if (clientStr.includes("gold")) {
          activeSubscriptions.set(email, "gold");
          continue;
        }
        if (clientStr.includes("silver")) {
          activeSubscriptions.set(email, "silver");
          continue;
        }

        // Try per-client membership lookup on both endpoints
        for (const url of [SIMPLYBOOK_ADMIN_URL, SIMPLYBOOK_PUBLIC_URL]) {
          const mRes = await callApi(token, url, "getClientMembershipList", [String(c.id)]);
          if (!mRes.error && mRes.result) {
            const entries = Array.isArray(mRes.result) ? mRes.result : Object.values(mRes.result);
            for (const m of entries) {
              const mName = String((m as any).name || "").toLowerCase();
              if (mName.includes("gold")) activeSubscriptions.set(email, "gold");
              else if (mName.includes("silver")) activeSubscriptions.set(email, "silver");
            }
            if (activeSubscriptions.has(email)) break;
          }
        }
      }
    } else {
      // No client list available — try membership lookup for each member with simplybook_client_id
      console.log("No client list. Checking members with simplybook_client_id...");
      for (const member of dbMembers) {
        if (!member.simplybook_client_id) continue;
        for (const url of [SIMPLYBOOK_ADMIN_URL, SIMPLYBOOK_PUBLIC_URL]) {
          const mRes = await callApi(token, url, "getClientMembershipList", [member.simplybook_client_id]);
          if (!mRes.error && mRes.result) {
            const entries = Array.isArray(mRes.result) ? mRes.result : Object.values(mRes.result);
            for (const m of entries) {
              const mName = String((m as any).name || "").toLowerCase();
              const email = member.email.toLowerCase().trim();
              if (mName.includes("gold")) activeSubscriptions.set(email, "gold");
              else if (mName.includes("silver")) activeSubscriptions.set(email, "silver");
            }
            break;
          }
        }
      }
    }

    console.log(`Active subscriptions found: ${activeSubscriptions.size}`);

    // Sync to database
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

    return new Response(
      JSON.stringify({
        success: true,
        simplybook_clients: clients.length,
        active_subscriptions: activeSubscriptions.size,
        records_updated: updatedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

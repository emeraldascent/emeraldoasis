import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let formData: any = {};

    if (contentType.includes("application/json")) {
      formData = await req.json();
    } else {
      const bodyText = await req.text();
      try {
        formData = JSON.parse(bodyText);
      } catch (e) {
        const params = new URLSearchParams(bodyText);
        for (const [key, value] of params.entries()) {
          formData[key] = value;
        }
      }
    }

    console.log("Received SimplyBook Webhook:", JSON.stringify(formData));

    // Try to find an email address in the payload
    let email = formData.client_email || formData.client?.email || formData.email || "";
    
    // Deep search for email if not found at root
    if (!email) {
      const payloadString = JSON.stringify(formData).toLowerCase();
      const emailRegex = /"([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)"/g;
      const matches = [...payloadString.matchAll(emailRegex)];
      if (matches.length > 0) {
        // Find the first valid email that isn't emerald oasis admin
        for (const match of matches) {
          if (!match[1].includes('emeraldoasiscamp@gmail.com')) {
            email = match[1];
            break;
          }
        }
      }
    }

    if (!email) {
      console.error("No email found in SimplyBook webhook payload.");
      return new Response(JSON.stringify({ error: "No email found" }), { 
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    email = email.trim().toLowerCase();

    // Determine the tier (Silver or Gold)
    const payloadString = JSON.stringify(formData).toLowerCase();
    let tier: 'silver' | 'gold' | null = null;
    if (payloadString.includes("silver")) {
      tier = "silver";
    } else if (payloadString.includes("gold")) {
      tier = "gold";
    }

    if (!tier) {
      console.log(`Email ${email} found, but no silver/gold indicator. This might be a standard booking webhook, not a membership purchase. Ignoring.`);
      return new Response(JSON.stringify({ success: true, message: "Ignored: Not a membership event" }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the member record
    console.log(`Activating ${tier} subscription for ${email}...`);
    
    const { data, error } = await supabase
      .from("members")
      .update({
        subscription_active: true,
        subscription_tier: tier,
      })
      .eq("email", email)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!data || data.length === 0) {
      console.log(`Warning: Webhook received for ${email}, but no member record exists in Supabase yet.`);
      return new Response(JSON.stringify({ success: true, message: "No matching member record found, but webhook received." }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log("Successfully activated subscription for:", email);

    return new Response(JSON.stringify({ success: true, email, tier }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

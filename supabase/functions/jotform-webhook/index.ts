import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate webhook secret (pass as ?secret=... in the JotForm webhook URL)
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("JOTFORM_WEBHOOK_SECRET");
  if (expectedSecret && secret !== expectedSecret) {
    console.error("Invalid webhook secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let formData: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      formData = await req.json();
    } else {
      // JotForm sends application/x-www-form-urlencoded by default
      const body = await req.text();
      const params = new URLSearchParams(body);
      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }
    }

    let email = "";
    let firstName = "";
    let lastName = "";
    let phone = "";
    let emergencyContact = "";
    let membershipTier = "";
    let licensePlate = "";
    let submissionId = formData["submissionID"] || formData["submission_id"] || "";

    for (const [key, value] of Object.entries(formData)) {
      const k = key.toLowerCase();
      if (k.includes("email") && value && !email) email = value.trim().toLowerCase();
      if ((k.includes("name") && k.includes("[first]")) || k === "first_name") firstName = value.trim();
      if ((k.includes("name") && k.includes("[last]")) || k === "last_name") lastName = value.trim();
      if ((k.includes("phone") && k.includes("[full]")) || k === "phone") phone = value.trim();
      if (k.includes("emergency")) emergencyContact = value.trim();
      if (k.includes("membership") || k.includes("tier") || k.includes("plan")) membershipTier = value.trim().toLowerCase();
      if (k.includes("license") || k.includes("plate") || k.includes("vehicle")) licensePlate = value.trim();
    }

    if (!email) {
      console.error("No email found in submission:", JSON.stringify(formData));
      return new Response(
        JSON.stringify({ error: "No email found in submission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("jotform_submissions")
      .insert({
        jotform_submission_id: submissionId || null,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        emergency_contact: emergencyContact,
        license_plate: licensePlate || null,
        membership_tier: membershipTier || null,
        raw_payload: formData,
      })
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("JotForm submission stored:", email, submissionId);

    return new Response(
      JSON.stringify({ success: true, email, submission_id: submissionId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

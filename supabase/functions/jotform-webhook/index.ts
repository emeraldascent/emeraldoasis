import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // JotForm sends data as application/x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let formData: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = await req.text();
      const params = new URLSearchParams(body);
      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }
    } else if (contentType.includes("application/json")) {
      formData = await req.json();
    } else {
      // Try form-urlencoded as default (JotForm's standard)
      const body = await req.text();
      const params = new URLSearchParams(body);
      for (const [key, value] of params.entries()) {
        formData[key] = value;
      }
    }

    // Extract fields from JotForm's flat key format
    // JotForm sends fields like q3_fullName[first], q3_fullName[last], q5_email, q7_phoneNumber[full], etc.
    // The exact field IDs depend on the form — we'll parse common patterns
    const rawJson = JSON.stringify(formData);

    // Find email (look for keys containing "email")
    let email = "";
    let firstName = "";
    let lastName = "";
    let phone = "";
    let emergencyContact = "";
    let submissionId = formData["submissionID"] || formData["submission_id"] || "";

    for (const [key, value] of Object.entries(formData)) {
      const keyLower = key.toLowerCase();

      if (keyLower.includes("email") && value && !email) {
        email = value.trim().toLowerCase();
      }
      if ((keyLower.includes("name") && keyLower.includes("[first]")) || keyLower === "first_name") {
        firstName = value.trim();
      }
      if ((keyLower.includes("name") && keyLower.includes("[last]")) || keyLower === "last_name") {
        lastName = value.trim();
      }
      if ((keyLower.includes("phone") && keyLower.includes("[full]")) || keyLower === "phone") {
        phone = value.trim();
      }
      if (keyLower.includes("emergency")) {
        emergencyContact = value.trim();
      }
    }

    if (!email) {
      console.error("No email found in submission:", rawJson);
      return new Response(
        JSON.stringify({ error: "No email found in submission" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert into jotform_submissions (update if same email resubmits)
    const { data, error } = await supabase
      .from("jotform_submissions")
      .upsert(
        {
          submission_id: submissionId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          emergency_contact: emergencyContact,
          raw_data: formData,
          submitted_at: new Date().toISOString(),
          claimed: false,
        },
        { onConflict: "submission_id" }
      )
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

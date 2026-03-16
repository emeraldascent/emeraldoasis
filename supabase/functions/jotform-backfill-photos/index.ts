import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jotformApiKey = Deno.env.get("JOTFORM_API_KEY");
  if (!jotformApiKey) {
    return new Response(
      JSON.stringify({ error: "JOTFORM_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all jotform submissions that have a submission_id but no photo_url
    const { data: submissions, error: fetchError } = await supabase
      .from("jotform_submissions")
      .select("id, jotform_submission_id, email, matched_member_id")
      .is("photo_url", null)
      .not("jotform_submission_id", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch submissions: ${fetchError.message}`);
    }

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No submissions to backfill", updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${submissions.length} submissions to backfill`);

    let updated = 0;
    let errors = 0;
    const details: Array<{ email: string; status: string; photo_url?: string }> = [];

    for (const sub of submissions) {
      try {
        const jfRes = await fetch(
          `https://api.jotform.com/submission/${sub.jotform_submission_id}?apiKey=${jotformApiKey}`
        );

        if (!jfRes.ok) {
          const errText = await jfRes.text();
          console.error(`JotForm API error for ${sub.jotform_submission_id}: ${jfRes.status} ${errText}`);
          details.push({ email: sub.email, status: `api_error_${jfRes.status}` });
          errors++;
          continue;
        }

        const jfData = await jfRes.json();
        const answers = jfData?.content?.answers || {};

        // Find photo URL — look for "Member Photo" (qid 25) or any widget/upload with a URL answer
        let photoUrl: string | null = null;
        for (const [_qid, answer] of Object.entries(answers)) {
          const ans = answer as any;
          const fieldText = (ans.text || "").toLowerCase();
          const fieldName = (ans.name || "").toLowerCase();

          // Match "Member Photo" field specifically, or any photo/image widget
          const isPhotoField =
            fieldText.includes("member photo") ||
            fieldText.includes("profile photo") ||
            fieldText.includes("headshot") ||
            (fieldText.includes("photo") && !fieldText.includes("license")) ||
            (fieldName.includes("photo") && !fieldName.includes("license"));

          if (isPhotoField && typeof ans.answer === "string" && ans.answer.startsWith("http")) {
            photoUrl = ans.answer;
            break;
          }
        }

        // Fallback: look for any control_widget with a jotform uploads URL containing "base64_25"
        if (!photoUrl) {
          for (const [_qid, answer] of Object.entries(answers)) {
            const ans = answer as any;
            if (
              ans.type === "control_widget" &&
              typeof ans.answer === "string" &&
              ans.answer.includes("jotform.com/uploads") &&
              !ans.text?.toLowerCase().includes("license") &&
              !ans.text?.toLowerCase().includes("driver")
            ) {
              photoUrl = ans.answer;
              break;
            }
          }
        }

        if (photoUrl) {
          // Update jotform_submissions
          const { error: updateError } = await supabase
            .from("jotform_submissions")
            .update({ photo_url: photoUrl })
            .eq("id", sub.id);

          if (updateError) {
            console.error(`Failed to update ${sub.email}:`, updateError);
            details.push({ email: sub.email, status: "db_update_error" });
            errors++;
          } else {
            updated++;
            details.push({ email: sub.email, status: "updated", photo_url: photoUrl });
            console.log(`Updated photo for ${sub.email}`);

            // Also update matched member record
            if (sub.matched_member_id) {
              await supabase
                .from("members")
                .update({ photo_url: photoUrl })
                .eq("id", sub.matched_member_id);
              console.log(`Also updated member photo for ${sub.email}`);
            }
          }
        } else {
          details.push({ email: sub.email, status: "no_photo_found" });
          console.log(`No photo found for ${sub.email}`);
        }

        // Rate limit: ~700ms between requests
        await new Promise((r) => setTimeout(r, 700));
      } catch (err) {
        console.error(`Error processing ${sub.email}:`, err);
        details.push({ email: sub.email, status: "error" });
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: submissions.length, updated, errors, details }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Backfill error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

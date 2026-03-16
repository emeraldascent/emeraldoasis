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
    // Get jotform submissions that have a submission_id but no usable photo
    // (photo_url is null OR points to jotform.com which requires auth)
    const { data: submissions, error: fetchError } = await supabase
      .from("jotform_submissions")
      .select("id, jotform_submission_id, email, matched_member_id, photo_url")
      .not("jotform_submission_id", "is", null);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    // Filter to only those needing photo migration
    const needsPhoto = (submissions || []).filter(
      (s) => !s.photo_url || s.photo_url.includes("jotform.com")
    );

    if (needsPhoto.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No photos to migrate", updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${needsPhoto.length} submissions to process`);

    let updated = 0;
    let errors = 0;
    const details: Array<{ email: string; status: string }> = [];

    for (const sub of needsPhoto) {
      try {
        // Fetch submission from JotForm API
        const jfRes = await fetch(
          `https://api.jotform.com/submission/${sub.jotform_submission_id}?apiKey=${jotformApiKey}`
        );

        if (!jfRes.ok) {
          await jfRes.text();
          details.push({ email: sub.email, status: `api_error_${jfRes.status}` });
          errors++;
          continue;
        }

        const jfData = await jfRes.json();
        const answers = jfData?.content?.answers || {};

        // Find the Member Photo field (qid 25, control_widget)
        let jotformPhotoUrl: string | null = null;
        for (const [, answer] of Object.entries(answers)) {
          const ans = answer as any;
          const fieldText = (ans.text || "").toLowerCase();
          const isPhotoField =
            fieldText.includes("member photo") ||
            fieldText.includes("profile photo") ||
            (fieldText.includes("photo") && !fieldText.includes("license") && !fieldText.includes("driver"));

          if (isPhotoField && typeof ans.answer === "string" && ans.answer.includes("jotform.com")) {
            jotformPhotoUrl = ans.answer;
            break;
          }
        }

        // Fallback: any widget upload that's not license/driver related
        if (!jotformPhotoUrl) {
          for (const [, answer] of Object.entries(answers)) {
            const ans = answer as any;
            if (
              ans.type === "control_widget" &&
              typeof ans.answer === "string" &&
              ans.answer.includes("jotform.com/uploads") &&
              !ans.text?.toLowerCase().includes("license") &&
              !ans.text?.toLowerCase().includes("driver")
            ) {
              jotformPhotoUrl = ans.answer;
              break;
            }
          }
        }

        if (!jotformPhotoUrl) {
          details.push({ email: sub.email, status: "no_photo_field" });
          continue;
        }

        // Download the photo using the API key for auth
        const photoRes = await fetch(`${jotformPhotoUrl}?apiKey=${jotformApiKey}`);
        if (!photoRes.ok) {
          // Try without apiKey param, maybe it needs cookie-based auth
          // Use the direct submission file download endpoint instead
          const altUrl = `https://api.jotform.com/submission/${sub.jotform_submission_id}?apiKey=${jotformApiKey}`;
          details.push({ email: sub.email, status: `photo_download_failed_${photoRes.status}` });
          errors++;
          continue;
        }

        const photoBlob = await photoRes.arrayBuffer();
        const contentType = photoRes.headers.get("content-type") || "image/png";
        const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";

        // Upload to Supabase storage
        const storagePath = `jotform/${sub.id}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("member-photos")
          .upload(storagePath, photoBlob, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${sub.email}:`, uploadError);
          details.push({ email: sub.email, status: "upload_error" });
          errors++;
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("member-photos")
          .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;

        // Update jotform_submissions
        await supabase
          .from("jotform_submissions")
          .update({ photo_url: publicUrl })
          .eq("id", sub.id);

        // Update matched member if exists
        if (sub.matched_member_id) {
          await supabase
            .from("members")
            .update({ photo_url: publicUrl })
            .eq("id", sub.matched_member_id);
        }

        updated++;
        details.push({ email: sub.email, status: "migrated" });
        console.log(`Migrated photo for ${sub.email}`);

        // Rate limit
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        console.error(`Error for ${sub.email}:`, err);
        details.push({ email: sub.email, status: "error" });
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: needsPhoto.length, updated, errors, details }),
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

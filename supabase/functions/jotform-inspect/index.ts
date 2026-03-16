import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jotformApiKey = Deno.env.get("JOTFORM_API_KEY");
  if (!jotformApiKey) {
    return new Response(JSON.stringify({ error: "JOTFORM_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Use a known submission ID to inspect the structure
  const submissionId = "6290086033717094602";

  const jfRes = await fetch(
    `https://api.jotform.com/submission/${submissionId}?apiKey=${jotformApiKey}`
  );
  const jfData = await jfRes.json();

  // Extract just field names, types, and answer summaries
  const answers = jfData?.content?.answers || {};
  const fields = Object.entries(answers).map(([qid, ans]: [string, any]) => ({
    qid,
    name: ans.name,
    text: ans.text,
    type: ans.type,
    answer_type: typeof ans.answer,
    answer_preview: typeof ans.answer === "string" 
      ? ans.answer.substring(0, 200) 
      : JSON.stringify(ans.answer)?.substring(0, 200),
  }));

  return new Response(JSON.stringify({ fields }, null, 2), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

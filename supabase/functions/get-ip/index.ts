const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Get our outgoing IP using a public service
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();

  return new Response(JSON.stringify({ outgoing_ip: data.ip }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("members")
    .update({
      subscription_active: true,
      subscription_tier: "silver"
    })
    .eq("email", "connor@emeraldascent.com")
    .select();
    
  console.log("Result:", data, error);
}

run();

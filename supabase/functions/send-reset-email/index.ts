import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a password reset link via admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase().trim(),
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")!.replace('.supabase.co', '.lovable.app')}/reset-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error("Generate link error:", error);
      return new Response(
        JSON.stringify({ error: "Could not generate reset link" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resetLink = data.properties.action_link;

    // Send via Gmail SMTP
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: "info@emeraldascent.com",
      password: Deno.env.get("GMAIL_APP_PASSWORD")!,
    });

    await client.send({
      from: "Emerald Oasis <info@emeraldascent.com>",
      to: email,
      subject: "Reset Your Password — Emerald Oasis",
      content: "text/html",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a3a2a; font-size: 22px; margin: 0;">Emerald Oasis</h1>
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi there,
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to choose a new one:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" 
               style="background-color: #2d6a4f; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email. This link expires in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 11px; text-align: center;">
            Emerald Oasis · Private Members Club
          </p>
        </div>
      `,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send reset email error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send reset email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

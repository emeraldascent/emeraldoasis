import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { email, memberName, serviceName, date, time, price, transactionId, isCampsite } =
      await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const timeDisplay = isCampsite
      ? "Check-in: 12:00 – 6:00 PM · Check-out: 11:00 AM"
      : formatTime(time);

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
      subject: `Booking Confirmed — ${serviceName}`,
      content: "text/html",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a3a2a; font-size: 22px; margin: 0;">Emerald Oasis</h1>
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi ${memberName || "there"},
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Your booking has been confirmed! Here are the details:
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Experience</td>
                <td style="color: #1a3a2a; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">${serviceName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Date</td>
                <td style="color: #1a3a2a; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">${isCampsite ? "Schedule" : "Time"}</td>
                <td style="color: #1a3a2a; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">${timeDisplay}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Amount Paid</td>
                <td style="color: #2d6a4f; font-size: 13px; font-weight: 700; text-align: right; padding: 6px 0;">${price}</td>
              </tr>
              ${transactionId ? `
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Transaction</td>
                <td style="color: #1a3a2a; font-size: 11px; text-align: right; padding: 6px 0;">#${transactionId}</td>
              </tr>` : ""}
            </table>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            Please arrive on time. All guests must be PMA members before arrival.
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
    console.error("Send booking email error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send booking confirmation email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

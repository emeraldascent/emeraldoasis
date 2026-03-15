import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Minimal SMTP client using raw Deno.connect / Deno.connectTls
 * that does NOT rely on the removed Deno.writeAll / Deno.readAll APIs.
 */
async function sendEmailViaSmtp(opts: {
  hostname: string;
  port: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect with TLS (port 465)
  const conn = await Deno.connectTls({ hostname: opts.hostname, port: opts.port });

  async function read(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? decoder.decode(buf.subarray(0, n)) : "";
  }

  async function write(cmd: string) {
    const data = encoder.encode(cmd + "\r\n");
    await conn.write(data);
  }

  async function cmd(command: string, expectedCode: string) {
    await write(command);
    const resp = await read();
    if (!resp.startsWith(expectedCode)) {
      throw new Error(`SMTP error on "${command.substring(0, 30)}": ${resp.trim()}`);
    }
    return resp;
  }

  // Read greeting
  await read();

  // EHLO
  await cmd("EHLO localhost", "250");

  // AUTH LOGIN
  await cmd("AUTH LOGIN", "334");
  await cmd(btoa(opts.username), "334");
  await cmd(btoa(opts.password), "235");

  // Envelope — SMTP envelope uses bare email addresses only
  const fromEmail = opts.from.includes("<") 
    ? opts.from.match(/<([^>]+)>/)?.[1] || opts.from 
    : opts.from;
  const toEmail = opts.to.includes("<")
    ? opts.to.match(/<([^>]+)>/)?.[1] || opts.to
    : opts.to;
  await cmd(`MAIL FROM:<${fromEmail}>`, "250");
  await cmd(`RCPT TO:<${toEmail}>`, "250");

  // DATA
  await cmd("DATA", "354");

  const boundary = `----=_Part_${Date.now()}`;
  const message = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    opts.html,
    ``,
    `--${boundary}--`,
    `.`,
  ].join("\r\n");

  await write(message);
  const dataResp = await read();
  if (!dataResp.startsWith("250")) {
    throw new Error(`SMTP DATA response error: ${dataResp.trim()}`);
  }

  // QUIT
  await write("QUIT");
  conn.close();
}

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

    const htmlBody = `
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
        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin: 16px 0 0 0;">
          <p style="color: #92400e; font-size: 12px; font-weight: 600; margin: 0 0 6px 0;">🅿️ Parking</p>
          <ul style="color: #78716c; font-size: 11px; line-height: 1.7; margin: 0; padding-left: 16px;">
            <li>Spring water fill-ups: 15-min limit only</li>
            ${isCampsite
              ? `<li><strong>Lower Lot</strong> — 5 camping spots, 2 market</li>
                 <li><strong>Overflow Lot</strong> — 3 camping spots</li>`
              : `<li><strong>Main Lot</strong> — 7 spots for events & day pass</li>
                 <li><strong>Overflow Lot</strong> — 5 spots for events/day pass</li>
                 <li><strong>Roadside</strong> — 10–15 overflow spots</li>`
            }
          </ul>
        </div>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
          <p style="color: #1a3a2a; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Quick Guide to the App</p>
          <ul style="color: #555; font-size: 12px; line-height: 1.8; margin: 0; padding-left: 18px;">
            <li><strong>Dashboard</strong> — View your upcoming bookings and membership status</li>
            <li><strong>Book</strong> — Reserve day passes, member passes, and campsites</li>
            <li><strong>Guide</strong> — Property rules, directions, and what to bring</li>
            <li><strong>Map</strong> — Interactive property map with trails and key locations</li>
            <li><strong>Profile</strong> — Update your info, photo, and manage your account</li>
          </ul>
          <p style="color: #888; font-size: 11px; margin: 10px 0 0 0;">
            Access the app anytime at <a href="https://emeraldoasis.lovable.app" style="color: #2d6a4f; text-decoration: none; font-weight: 600;">emeraldoasis.lovable.app</a>
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 11px; text-align: center;">
          Emerald Oasis · Private Members Club
        </p>
      </div>
    `;

    await sendEmailViaSmtp({
      hostname: "smtp.gmail.com",
      port: 465,
      username: "info@emeraldascent.com",
      password: Deno.env.get("GMAIL_APP_PASSWORD")!,
      from: "Emerald Oasis <info@emeraldascent.com>",
      to: email,
      subject: `Booking Confirmed — ${serviceName}`,
      html: htmlBody,
    });

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

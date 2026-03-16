import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SiteConfig {
  name: string;
  feeds: { url: string; platform: string }[];
}

const SITES: SiteConfig[] = [
  {
    name: "Site 2 (Creekside #2)",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399421475797170426.ics?t=8dd31740bdb646aa8567654fd93e6d9d", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93498&s=1257412", platform: "hipcamp" },
    ],
  },
  {
    name: "Site 3",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399436091778397187.ics?t=643d98d3e74a46fb841b0d1e1633d61f", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93501&s=1257413", platform: "hipcamp" },
    ],
  },
  {
    name: "Site 4",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399442635764342213.ics?t=98cb065df9a848cea810ec46a896bc1c", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93502&s=1257414", platform: "hipcamp" },
    ],
  },
  {
    name: "Site 5",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399448270429385463.ics?t=c0b1767159dc425bada34c5af953257d", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93503&s=1257415", platform: "hipcamp" },
    ],
  },
  {
    name: "Site 6",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399461892791610478.ics?t=cda29765fc164f93b6a3a89ec55b6bb8", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93504&s=1930572", platform: "hipcamp" },
    ],
  },
  {
    name: "Site 7",
    feeds: [
      { url: "https://www.airbnb.com/calendar/ical/1399464672307662874.ics?t=83eddd0235404e238322123e355341bd", platform: "airbnb" },
      { url: "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93493&s=1257417", platform: "hipcamp" },
    ],
  },
];

function extractField(block: string, fieldName: string): string | null {
  const regex = new RegExp(`${fieldName}[^:]*:(.+)`, "m");
  const match = block.match(regex);
  return match ? match[1].trim().replace(/\r/g, "") : null;
}

function parseIcalDate(str: string): Date | null {
  if (!str) return null;
  if (str.length === 8) {
    return new Date(
      parseInt(str.substr(0, 4)),
      parseInt(str.substr(4, 2)) - 1,
      parseInt(str.substr(6, 2))
    );
  }
  if (str.includes("T")) {
    const y = parseInt(str.substr(0, 4));
    const m = parseInt(str.substr(4, 2)) - 1;
    const d = parseInt(str.substr(6, 2));
    const h = parseInt(str.substr(9, 2));
    const mn = parseInt(str.substr(11, 2));
    const s = parseInt(str.substr(13, 2)) || 0;
    if (str.endsWith("Z")) return new Date(Date.UTC(y, m, d, h, mn, s));
    return new Date(y, m, d, h, mn, s);
  }
  return null;
}

interface IcalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
}

function parseIcalFeed(icalText: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  const blocks = icalText.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    const uid = extractField(block, "UID");
    const summary = extractField(block, "SUMMARY") || "Guest";
    const dtstart = extractField(block, "DTSTART");
    const dtend = extractField(block, "DTEND");

    if (!dtstart || !dtend || !uid) continue;

    const start = parseIcalDate(dtstart);
    const end = parseIcalDate(dtend);
    if (!start || !end) continue;

    events.push({ uid, summary, start, end });
  }
  return events;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let totalUpserted = 0;
    let totalDeleted = 0;

    for (const site of SITES) {
      const allEvents: { uid: string; summary: string; checkIn: string; checkOut: string; platform: string }[] = [];

      for (const feed of site.feeds) {
        try {
          const res = await fetch(feed.url);
          if (!res.ok) {
            console.warn(`Feed fetch failed for ${site.name} (${feed.platform}): HTTP ${res.status}`);
            continue;
          }
          const text = await res.text();
          const events = parseIcalFeed(text);

          for (const ev of events) {
            // Skip "Not available" / blocked-off dates (no real guest)
            const lower = ev.summary.toLowerCase();
            if (lower === "not available" || lower === "blocked" || lower === "unavailable") continue;

            allEvents.push({
              uid: ev.uid,
              summary: ev.summary,
              checkIn: formatDate(ev.start),
              checkOut: formatDate(ev.end),
              platform: feed.platform,
            });
          }
        } catch (e) {
          console.warn(`Error fetching ${feed.platform} feed for ${site.name}:`, e);
        }
      }

      // Upsert all events for this site
      if (allEvents.length > 0) {
        const rows = allEvents.map((ev) => ({
          site_name: site.name,
          platform: ev.platform,
          guest_name: ev.summary,
          check_in: ev.checkIn,
          check_out: ev.checkOut,
          ical_uid: ev.uid,
          ical_summary: ev.summary,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("site_bookings")
          .upsert(rows, { onConflict: "ical_uid" });

        if (error) {
          console.error(`Upsert error for ${site.name}:`, error.message);
        } else {
          totalUpserted += rows.length;
        }
      }

      // Clean up old bookings that are no longer in the feed
      const feedUids = allEvents.map((e) => e.uid);
      if (feedUids.length > 0) {
        // Delete site bookings not in the current feed
        const { data: existing } = await supabase
          .from("site_bookings")
          .select("id, ical_uid")
          .eq("site_name", site.name);

        if (existing) {
          const toDelete = existing.filter((e) => !feedUids.includes(e.ical_uid));
          if (toDelete.length > 0) {
            const { error: delErr } = await supabase
              .from("site_bookings")
              .delete()
              .in("id", toDelete.map((d) => d.id));
            if (!delErr) totalDeleted += toDelete.length;
          }
        }
      }
    }

    console.log(`iCal sync complete: ${totalUpserted} upserted, ${totalDeleted} deleted`);

    return new Response(
      JSON.stringify({ success: true, upserted: totalUpserted, deleted: totalDeleted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("iCal sync error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Emerald Oasis — iCal Sync Script (Google Apps Script)
 * 
 * Fetches Airbnb and Hipcamp iCal feeds and creates blocking events
 * on the matching EOC Google Calendar for each campsite.
 * 
 * SimplyBook reads from the EOC calendars → sees busy times → blocks availability.
 * 
 * SETUP:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this entire script
 * 4. Run syncAllSites() once manually to authorize
 * 5. Set a time-based trigger: syncAllSites() every 15 minutes
 */

// === CONFIGURATION ===
const SITES = [
  {
    name: 'Site 2 (Creekside #2)',
    calendarId: '972de097b1747de1e5c6d0d3a0da0889d30bbb6e952a437519643178727fe2a9@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399421475797170426.ics?t=8dd31740bdb646aa8567654fd93e6d9d',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93498&s=1257412',
    ],
  },
  {
    name: 'Site 3',
    calendarId: 'ad8c7c56b9c534196fb486a8feb22057a1e2032f73b31393cf9607f93bfb32f6@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399436091778397187.ics?t=643d98d3e74a46fb841b0d1e1633d61f',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93501&s=1257413',
    ],
  },
  {
    name: 'Site 4',
    calendarId: 'dfc8e87b289f1d40328fa3ed7fd2d4b5e6b17a55c50fda05f51d8b070e25c5e1@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399442635764342213.ics?t=98cb065df9a848cea810ec46a896bc1c',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93502&s=1257414',
    ],
  },
  {
    name: 'Site 5',
    calendarId: '0556f6c6986a98937c86029057def43896e57f00fae84ee82fcb68da7783e173@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399448270429385463.ics?t=c0b1767159dc425bada34c5af953257d',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93503&s=1257415',
    ],
  },
  {
    name: 'Site 6',
    calendarId: '5c6ec052422bc51f1d5eca10dd2011c603ddbb27f69b0ea733ac3a3e0dcabd01@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399461892791610478.ics?t=cda29765fc164f93b6a3a89ec55b6bb8',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93504&s=1930572',
    ],
  },
  {
    name: 'Site 7',
    calendarId: 'c8e7c3702f8dd7de7844556807ad6cf72efabf0eebbed8d76beaf2d0d7ec9fb7@group.calendar.google.com',
    feeds: [
      'https://www.airbnb.com/calendar/ical/1399464672307662874.ics?t=83eddd0235404e238322123e355341bd',
      'https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93493&s=1257417',
    ],
  },
];

// Tag to identify events created by this script (so we don't duplicate or touch manual events)
const SYNC_TAG = '[EO-SYNC]';

// How far ahead to sync (days)
const SYNC_WINDOW_DAYS = 90;

/**
 * Main entry point — sync all sites
 */
function syncAllSites() {
  for (const site of SITES) {
    try {
      syncSite(site);
      Logger.log(`✅ Synced ${site.name}`);
    } catch (e) {
      Logger.log(`❌ Failed to sync ${site.name}: ${e.message}`);
    }
  }
}

/**
 * Sync a single site: fetch iCal feeds, merge events, update EOC calendar
 */
function syncSite(site) {
  const calendar = CalendarApp.getCalendarById(site.calendarId);
  if (!calendar) {
    Logger.log(`Calendar not found: ${site.calendarId}`);
    return;
  }

  // Collect all external events from feeds
  const externalEvents = [];
  for (const feedUrl of site.feeds) {
    try {
      const events = fetchIcalEvents(feedUrl);
      externalEvents.push(...events);
    } catch (e) {
      Logger.log(`Failed to fetch feed ${feedUrl}: ${e.message}`);
    }
  }

  // Get date range
  const now = new Date();
  const futureDate = new Date(now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // Get existing synced events (ones we created)
  const existingEvents = calendar.getEvents(now, futureDate);
  const syncedEvents = existingEvents.filter(e => 
    e.getTitle().startsWith(SYNC_TAG)
  );

  // Build a map of existing synced events by UID
  const existingMap = {};
  for (const ev of syncedEvents) {
    // Store by description (which contains the original UID)
    const uid = ev.getDescription();
    if (uid) existingMap[uid] = ev;
  }

  // Upsert external events
  const processedUids = new Set();
  for (const ext of externalEvents) {
    if (!ext.start || !ext.end) continue;
    if (ext.end < now || ext.start > futureDate) continue;

    const uid = ext.uid || `${ext.start.getTime()}-${ext.summary}`;
    processedUids.add(uid);

    if (existingMap[uid]) {
      // Event exists — update if changed
      const existing = existingMap[uid];
      const titleMatch = existing.getTitle() === `${SYNC_TAG} ${ext.summary || 'Blocked'}`;
      if (!titleMatch) {
        existing.setTitle(`${SYNC_TAG} ${ext.summary || 'Blocked'}`);
      }
      // Don't update times — could cause issues with all-day vs timed events
    } else {
      // Create new blocking event
      try {
        if (ext.allDay) {
          calendar.createAllDayEvent(
            `${SYNC_TAG} ${ext.summary || 'Blocked'}`,
            ext.start,
            ext.end,
            { description: uid }
          );
        } else {
          calendar.createEvent(
            `${SYNC_TAG} ${ext.summary || 'Blocked'}`,
            ext.start,
            ext.end,
            { description: uid }
          );
        }
      } catch (e) {
        Logger.log(`Failed to create event: ${e.message}`);
      }
    }
  }

  // Delete synced events that no longer exist in feeds
  for (const uid in existingMap) {
    if (!processedUids.has(uid)) {
      try {
        existingMap[uid].deleteEvent();
      } catch (e) {
        Logger.log(`Failed to delete stale event: ${e.message}`);
      }
    }
  }
}

/**
 * Parse an iCal feed URL and return an array of event objects
 */
function fetchIcalEvents(url) {
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error(`HTTP ${response.getResponseCode()}`);
  }

  const ical = response.getContentText();
  const events = [];
  const eventBlocks = ical.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const event = {};

    // Extract fields
    event.uid = extractField(block, 'UID');
    event.summary = extractField(block, 'SUMMARY') || 'Blocked';

    const dtstart = extractField(block, 'DTSTART');
    const dtend = extractField(block, 'DTEND');

    if (dtstart) {
      event.start = parseIcalDate(dtstart);
      event.allDay = dtstart.length === 8; // YYYYMMDD = all-day
    }
    if (dtend) {
      event.end = parseIcalDate(dtend);
    }

    if (event.start && event.end) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Extract a field value from an iCal block
 */
function extractField(block, fieldName) {
  // Handle fields with parameters like DTSTART;VALUE=DATE:20260315
  const regex = new RegExp(`${fieldName}[^:]*:(.+)`, 'm');
  const match = block.match(regex);
  if (match) return match[1].trim().replace(/\r/g, '');
  return null;
}

/**
 * Parse an iCal date string into a JavaScript Date
 */
function parseIcalDate(str) {
  if (!str) return null;

  // All-day: YYYYMMDD
  if (str.length === 8) {
    const y = parseInt(str.substr(0, 4));
    const m = parseInt(str.substr(4, 2)) - 1;
    const d = parseInt(str.substr(6, 2));
    return new Date(y, m, d);
  }

  // Date-time: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  if (str.includes('T')) {
    const y = parseInt(str.substr(0, 4));
    const m = parseInt(str.substr(4, 2)) - 1;
    const d = parseInt(str.substr(6, 2));
    const h = parseInt(str.substr(9, 2));
    const min = parseInt(str.substr(11, 2));
    const s = parseInt(str.substr(13, 2)) || 0;

    if (str.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    return new Date(y, m, d, h, min, s);
  }

  return null;
}

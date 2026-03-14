var SITES = [
  {
    name: "Site 2 (Creekside #2)",
    calendarId: "972de097b1747de1e5c6d0d3a0da0889d30bbb6e952a437519643178727fe2a9@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399421475797170426.ics?t=8dd31740bdb646aa8567654fd93e6d9d",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93498&s=1257412"
    ]
  },
  {
    name: "Site 3",
    calendarId: "ad8c7c56b9c534196fb486a8feb22057a1e2032f73b31393cf9607f93bfb32f6@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399436091778397187.ics?t=643d98d3e74a46fb841b0d1e1633d61f",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93501&s=1257413"
    ]
  },
  {
    name: "Site 4",
    calendarId: "dfc8e87b289f1d40328fa3ed7fd2d4b5e6b17a55c50fda05f51d8b070e25c5e1@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399442635764342213.ics?t=98cb065df9a848cea810ec46a896bc1c",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93502&s=1257414"
    ]
  },
  {
    name: "Site 5",
    calendarId: "0556f6c6986a98937c86029057def43896e57f00fae84ee82fcb68da7783e173@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399448270429385463.ics?t=c0b1767159dc425bada34c5af953257d",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93503&s=1257415"
    ]
  },
  {
    name: "Site 6",
    calendarId: "5c6ec052422bc51f1d5eca10dd2011c603ddbb27f69b0ea733ac3a3e0dcabd01@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399461892791610478.ics?t=cda29765fc164f93b6a3a89ec55b6bb8",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93504&s=1930572"
    ]
  },
  {
    name: "Site 7",
    calendarId: "c8e7c3702f8dd7de7844556807ad6cf72efabf0eebbed8d76beaf2d0d7ec9fb7@group.calendar.google.com",
    feeds: [
      "https://www.airbnb.com/calendar/ical/1399464672307662874.ics?t=83eddd0235404e238322123e355341bd",
      "https://www.hipcamp.com/en-US/bookings/e9f05f13-8283-45bc-ba6a-81690e30c5cd/agenda.ics?cal=93493&s=1257417"
    ]
  }
];

var SYNC_TAG = "[EO-SYNC]";
var SYNC_WINDOW_DAYS = 90;
var WORK_START_HOUR = 7;  // 7 AM
var WORK_END_HOUR = 21;   // 9 PM

function syncAllSites() {
  for (var i = 0; i < SITES.length; i++) {
    try {
      syncSite(SITES[i]);
      Logger.log("Synced " + SITES[i].name);
    } catch (e) {
      Logger.log("Failed " + SITES[i].name + ": " + e.message);
    }
  }
}

// Run this ONCE to clean up old all-day [EO-SYNC] events before using the new version
function cleanupOldSyncEvents() {
  var now = new Date();
  var futureDate = new Date(now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  var pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (var i = 0; i < SITES.length; i++) {
    var calendar = CalendarApp.getCalendarById(SITES[i].calendarId);
    if (!calendar) continue;
    
    var events = calendar.getEvents(pastDate, futureDate);
    var deleted = 0;
    for (var j = 0; j < events.length; j++) {
      if (events[j].getTitle().indexOf(SYNC_TAG) === 0) {
        events[j].deleteEvent();
        deleted++;
      }
    }
    Logger.log("Cleaned " + deleted + " events from " + SITES[i].name);
  }
}

function syncSite(site) {
  var calendar = CalendarApp.getCalendarById(site.calendarId);
  if (!calendar) { Logger.log("Calendar not found: " + site.calendarId); return; }

  var externalEvents = [];
  for (var f = 0; f < site.feeds.length; f++) {
    try {
      var fetched = fetchIcalEvents(site.feeds[f]);
      for (var k = 0; k < fetched.length; k++) externalEvents.push(fetched[k]);
    } catch (e) { Logger.log("Feed error: " + e.message); }
  }

  // Expand multi-day bookings into per-day timed events (7AM-9PM)
  var expandedEvents = [];
  for (var x = 0; x < externalEvents.length; x++) {
    var ext = externalEvents[x];
    if (!ext.start || !ext.end) continue;
    
    if (ext.allDay) {
      // Create a timed event for each day of the booking
      var current = new Date(ext.start.getTime());
      while (current < ext.end) {
        var dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), WORK_START_HOUR, 0, 0);
        var dayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), WORK_END_HOUR, 0, 0);
        expandedEvents.push({
          uid: ext.uid + "_" + current.toISOString().substr(0, 10),
          summary: ext.summary,
          start: dayStart,
          end: dayEnd,
          allDay: false
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      expandedEvents.push(ext);
    }
  }

  var now = new Date();
  var futureDate = new Date(now.getTime() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  var existingEvents = calendar.getEvents(now, futureDate);
  var existingMap = {};

  for (var i = 0; i < existingEvents.length; i++) {
    if (existingEvents[i].getTitle().indexOf(SYNC_TAG) === 0) {
      var desc = existingEvents[i].getDescription();
      if (desc) existingMap[desc] = existingEvents[i];
    }
  }

  var processedUids = {};
  for (var j = 0; j < expandedEvents.length; j++) {
    var ev = expandedEvents[j];
    if (!ev.start || !ev.end) continue;
    if (ev.end < now || ev.start > futureDate) continue;

    var uid = ev.uid || (ev.start.getTime() + "-" + ev.summary);
    processedUids[uid] = true;

    if (existingMap[uid]) {
      var expected = SYNC_TAG + " " + (ev.summary || "Blocked");
      if (existingMap[uid].getTitle() !== expected) existingMap[uid].setTitle(expected);
    } else {
      try {
        var title = SYNC_TAG + " " + (ev.summary || "Blocked");
        calendar.createEvent(title, ev.start, ev.end, {description: uid});
      } catch (e) { Logger.log("Create error: " + e.message); }
    }
  }

  for (var u in existingMap) {
    if (!processedUids[u]) {
      try { existingMap[u].deleteEvent(); }
      catch (e) { Logger.log("Delete error: " + e.message); }
    }
  }
}

function fetchIcalEvents(url) {
  var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  if (response.getResponseCode() !== 200) throw new Error("HTTP " + response.getResponseCode());

  var ical = response.getContentText();
  var events = [];
  var blocks = ical.split("BEGIN:VEVENT");

  for (var i = 1; i < blocks.length; i++) {
    var block = blocks[i].split("END:VEVENT")[0];
    var ev = {};
    ev.uid = extractField(block, "UID");
    ev.summary = extractField(block, "SUMMARY") || "Blocked";
    var dtstart = extractField(block, "DTSTART");
    var dtend = extractField(block, "DTEND");
    if (dtstart) { ev.start = parseIcalDate(dtstart); ev.allDay = dtstart.length === 8; }
    if (dtend) { ev.end = parseIcalDate(dtend); }
    if (ev.start && ev.end) events.push(ev);
  }
  return events;
}

function extractField(block, fieldName) {
  var regex = new RegExp(fieldName + "[^:]*:(.+)", "m");
  var match = block.match(regex);
  return match ? match[1].trim().replace(/\r/g, "") : null;
}

function parseIcalDate(str) {
  if (!str) return null;
  if (str.length === 8) {
    return new Date(parseInt(str.substr(0,4)), parseInt(str.substr(4,2))-1, parseInt(str.substr(6,2)));
  }
  if (str.indexOf("T") > -1) {
    var y = parseInt(str.substr(0,4));
    var m = parseInt(str.substr(4,2)) - 1;
    var d = parseInt(str.substr(6,2));
    var h = parseInt(str.substr(9,2));
    var mn = parseInt(str.substr(11,2));
    var s = parseInt(str.substr(13,2)) || 0;
    if (str.charAt(str.length-1) === "Z") return new Date(Date.UTC(y,m,d,h,mn,s));
    return new Date(y,m,d,h,mn,s);
  }
  return null;
}

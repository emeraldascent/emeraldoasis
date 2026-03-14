const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?src=a65222a1b1389c5e0972db0b25f1d1075e0421b632a80f6fe17234016988aeda%40group.calendar.google.com&ctz=America%2FNew_York&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&mode=WEEK';

export function AdminCalendar() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Live calendar synced with SimplyBook · Hipcamp · Airbnb
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
        <iframe
          src={CALENDAR_EMBED_URL}
          title="Emerald Oasis Booking Calendar"
          className="w-full border-0"
          style={{ height: '500px' }}
        />
      </div>
    </div>
  );
}

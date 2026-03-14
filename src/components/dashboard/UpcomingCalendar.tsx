const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?src=a65222a1b1389c5e0972db0b25f1d1075e0421b632a80f6fe17234016988aeda%40group.calendar.google.com&ctz=America%2FNew_York&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&mode=AGENDA';

export function UpcomingCalendar() {
  return (
    <div className="space-y-2">
      <p
        className="text-xs font-bold"
        style={{ color: 'var(--ea-midnight)' }}
      >
        📅 Upcoming at the Oasis
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
        <iframe
          src={CALENDAR_EMBED_URL}
          title="Upcoming Events"
          className="w-full border-0"
          style={{ height: '300px' }}
        />
      </div>
    </div>
  );
}

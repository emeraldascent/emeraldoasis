import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tent, Sun, Star, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Booking {
  id: string;
  service_name: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string | null;
  guest_names: string[] | null;
  is_member_pass: boolean | null;
  status: string;
  type: 'member';
  member: { first_name: string; last_name: string; email: string } | null;
}



const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const platformColors: Record<string, { bg: string; text: string; label: string }> = {
  airbnb: { bg: '#FEE2E2', text: '#DC2626', label: 'Airbnb' },
  hipcamp: { bg: '#DCFCE7', text: '#16A34A', label: 'Hipcamp' },
  unknown: { bg: '#F3F4F6', text: '#6B7280', label: 'External' },
};

function getServiceIcon(serviceId: string | null) {
  const id = Number(serviceId);
  if ([11, 12, 13, 14].includes(id)) return <Tent size={12} />;
  if ([8, 10].includes(id)) return <Users size={12} />;
  if ([9].includes(id)) return <Tent size={12} />;
  if ([20, 21].includes(id)) return <Star size={12} />;
  return <Sun size={12} />;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Expand a site booking (check_in to check_out range) into individual day strings
function expandSiteBookingDays(sb: any): string[] {
  const days: string[] = [];
  const start = new Date(sb.check_in + 'T12:00:00');
  const end = new Date(sb.check_out + 'T12:00:00');
  const current = new Date(start);
  while (current < end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function AdminCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().split('T')[0]
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [siteBookings, setSiteBookings] = useState<any[]>([]);
  const [monthBookings, setMonthBookings] = useState<Record<string, number>>({});
  const [monthSiteCounts, setMonthSiteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMonth() {
      setLoading(true);
      const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
      const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${lastDay}`;

      const [memberResult, siteResult] = await Promise.all([
        supabase
          .from('member_bookings')
          .select('id, service_name, service_id, booking_date, booking_time, guest_names, is_member_pass, status, member_id')
          .eq('status', 'confirmed')
          .gte('booking_date', dateFrom)
          .lte('booking_date', dateTo)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true }),
        supabase
          .from('site_bookings')
          .select('id, site_name, platform, guest_name, check_in, check_out')
          .lte('check_in', dateTo)
          .gt('check_out', dateFrom),
      ]);

      const data = memberResult.data || [];
      const siteData = siteResult.data || [];
      setSiteBookings(siteData);

      // Count member bookings per day
      const counts: Record<string, number> = {};
      for (const b of data) {
        counts[b.booking_date] = (counts[b.booking_date] || 0) + 1;
      }
      setMonthBookings(counts);

      // Count site bookings per day
      const siteCounts: Record<string, number> = {};
      for (const sb of siteData) {
        const days = expandSiteBookingDays(sb);
        for (const d of days) {
          if (d >= dateFrom && d <= dateTo) {
            siteCounts[d] = (siteCounts[d] || 0) + 1;
          }
        }
      }
      setMonthSiteCounts(siteCounts);

      // Get member names
      const memberIds = [...new Set(data.map((b) => b.member_id))];
      const { data: members } = memberIds.length > 0
        ? await supabase.from('members').select('id, first_name, last_name, email').in('id', memberIds)
        : { data: [] };

      const memberMap = new Map(members?.map((m) => [m.id, m]) || []);
      const enriched: Booking[] = data.map((b) => ({
        ...b,
        type: 'member' as const,
        member: memberMap.get(b.member_id) || null,
      }));
      setBookings(enriched);
      setLoading(false);
    }
    fetchMonth();
  }, [viewYear, viewMonth]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getDayKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const dayMemberBookings = bookings.filter((b) => b.booking_date === selectedDate);
  const daySiteBookings = selectedDate
    ? siteBookings.filter((sb) => {
        const days = expandSiteBookingDays(sb);
        return days.includes(selectedDate);
      })
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ea-emerald)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const key = getDayKey(day);
              const memberCount = monthBookings[key] || 0;
              const siteCount = monthSiteCounts[key] || 0;
              const totalCount = memberCount + siteCount;
              const isSelected = key === selectedDate;
              const isToday = key === todayStr;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors relative"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--ea-emerald)'
                      : isToday
                      ? '#F0FDF4'
                      : 'transparent',
                    color: isSelected ? 'white' : 'var(--ea-midnight)',
                    fontWeight: isToday || isSelected ? 600 : 400,
                  }}
                >
                  {day}
                  {totalCount > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {memberCount > 0 && (
                        <span
                          className="text-[7px] font-bold leading-none"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--ea-spirulina)' }}
                        >
                          {memberCount}
                        </span>
                      )}
                      {siteCount > 0 && (
                        <span
                          className="text-[7px] font-bold leading-none"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : '#8B5CF6' }}
                        >
                          {memberCount > 0 ? `+${siteCount}` : siteCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--ea-midnight)' }}>
              <Calendar size={13} style={{ color: 'var(--ea-emerald)' }} />
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              <span className="ml-auto text-[10px] font-normal text-gray-400">
                {dayMemberBookings.length + daySiteBookings.length} total
              </span>
            </p>
          </div>

          {/* Site bookings for this day */}
          {daySiteBookings.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-50 bg-purple-50/30">
              <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600 mb-2 flex items-center gap-1">
                <Tent size={10} /> Campsite Guests
              </p>
              <div className="space-y-2">
                {daySiteBookings.map((sb: any) => {
                  const pc = platformColors[sb.platform] || platformColors.unknown;
                  return (
                    <div key={sb.id} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: pc.bg }}
                      >
                        <Tent size={11} style={{ color: pc.text }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: 'var(--ea-midnight)' }}>
                          {sb.site_name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {sb.guest_name}
                          <span className="text-gray-300 mx-1">·</span>
                          {sb.check_in} → {sb.check_out}
                        </p>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[8px] font-medium shrink-0"
                        style={{ backgroundColor: pc.bg, color: pc.text }}
                      >
                        {pc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dayMemberBookings.length === 0 && daySiteBookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-gray-400">No bookings on this date</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {dayMemberBookings.map((b) => (
                <div key={b.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: b.is_member_pass ? '#FEF9C3' : '#F0FDF4',
                        color: b.is_member_pass ? '#CA8A04' : 'var(--ea-emerald)',
                      }}
                    >
                      {getServiceIcon(b.service_id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--ea-midnight)' }}>
                        {b.service_name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        {b.booking_time && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {formatTime(b.booking_time)}
                          </span>
                        )}
                        {b.is_member_pass && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                            style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
                          >
                            Pass
                          </span>
                        )}
                      </div>
                      {b.member && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          <span className="font-medium">{b.member.first_name} {b.member.last_name}</span>
                          <span className="text-gray-300 mx-1">·</span>
                          <span className="text-gray-400">{b.member.email}</span>
                        </p>
                      )}
                      {b.guest_names && Array.isArray(b.guest_names) && b.guest_names.join(', ') !== `${b.member?.first_name} ${b.member?.last_name}` && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Guests: {b.guest_names}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

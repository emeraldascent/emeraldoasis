import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tent, Sun, Star, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Booking {
  id: string;
  service_name: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string | null;
  is_member_pass: boolean | null;
  status: string;
}

function getServiceIcon(serviceId: string | null) {
  const id = Number(serviceId);
  if ([11, 12, 13, 14, 9, 8, 10].includes(id)) return <Tent size={14} />;
  if ([20, 21].includes(id)) return <Star size={14} />;
  return <Sun size={14} />;
}

function formatDate(d: string) {
  const date = new Date(d + 'T12:00:00');
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function UpcomingCalendar() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get member ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!member) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('member_bookings')
        .select('id, service_name, service_id, booking_date, booking_time, is_member_pass, status')
        .eq('member_id', member.id)
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(10);

      if (!error && data) setBookings(data);
      setLoading(false);
    }
    fetchBookings();
  }, []);

  return (
    <div className="space-y-2">
      <p
        className="text-xs font-bold flex items-center gap-1.5"
        style={{ color: 'var(--ea-midnight)' }}
      >
        <Calendar size={13} style={{ color: 'var(--ea-emerald)' }} />
        Your Upcoming Bookings
      </p>

      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ea-emerald)' }} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-2xl block mb-2">🌿</span>
            <p className="text-xs text-gray-400">No upcoming bookings</p>
            <p className="text-[10px] text-gray-300 mt-1">Book an experience to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: b.is_member_pass ? '#FEF9C3' : '#F0FDF4',
                    color: b.is_member_pass ? '#CA8A04' : 'var(--ea-emerald)',
                  }}
                >
                  {getServiceIcon(b.service_id)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--ea-midnight)' }}
                  >
                    {b.service_name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{formatDate(b.booking_date)}</span>
                    {b.booking_time && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTime(b.booking_time)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {b.is_member_pass && (
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
                  >
                    Pass
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

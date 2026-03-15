import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Calendar, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';

interface BookingWithMember {
  id: string;
  service_name: string;
  booking_time: string | null;
  booking_date: string;
  guest_names: string[] | null;
  is_member_pass: boolean | null;
  status: string;
  member_id: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    photo_url: string | null;
    membership_tier: string;
    subscription_tier: string | null;
    subscription_active: boolean | null;
  };
}

const formatTime = (t: string | null) => {
  if (!t) return 'No time set';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export function TodayBookings() {
  const [bookings, setBookings] = useState<BookingWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);

      const { data: bookingData, error: bookingError } = await supabase
        .from('member_bookings')
        .select('id, service_name, booking_time, booking_date, guest_names, is_member_pass, status, member_id')
        .eq('booking_date', today)
        .eq('status', 'confirmed')
        .order('booking_time', { ascending: true });

      if (bookingError || !bookingData) {
        setLoading(false);
        return;
      }

      // Get unique member IDs
      const memberIds = [...new Set(bookingData.map(b => b.member_id))];

      if (memberIds.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const { data: memberData } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, phone, photo_url, membership_tier, subscription_tier, subscription_active')
        .in('id', memberIds);

      const memberMap = (memberData || []).reduce<Record<string, BookingWithMember['member']>>((acc, m) => {
        acc[m.id] = m;
        return acc;
      }, {});

      const enriched: BookingWithMember[] = bookingData.map(b => ({
        ...b,
        member: memberMap[b.member_id],
      }));

      setBookings(enriched);
      setLoading(false);
    };

    fetchToday();
  }, []);

  // Group by time slot
  const grouped = bookings.reduce<Record<string, BookingWithMember[]>>((acc, b) => {
    const key = b.booking_time || 'unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const sortedSlots = Object.keys(grouped).sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return a.localeCompare(b);
  });

  // Find current/next time slot
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-8">Loading today's bookings...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--ea-emerald)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <Badge
          className="text-[10px]"
          style={{ backgroundColor: 'var(--ea-emerald)', color: 'white' }}
        >
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm text-gray-400">No bookings for today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSlots.map((slot) => {
            const slotBookings = grouped[slot];
            const slotMinutes = slot !== 'unscheduled'
              ? parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1])
              : null;
            const isPast = slotMinutes !== null && slotMinutes + 120 < currentMinutes;
            const isCurrent = slotMinutes !== null && slotMinutes <= currentMinutes && slotMinutes + 120 >= currentMinutes;

            return (
              <div key={slot}>
                {/* Time slot header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isCurrent ? 'var(--ea-emerald)' : isPast ? '#D1D5DB' : 'var(--ea-spirulina)',
                    }}
                  />
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className={isPast ? 'text-gray-300' : 'text-gray-500'} />
                    <span
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: isCurrent ? 'var(--ea-emerald)' : isPast ? '#9CA3AF' : 'var(--ea-midnight)' }}
                    >
                      {slot === 'unscheduled' ? 'No Time Set' : formatTime(slot)}
                    </span>
                    {isCurrent && (
                      <Badge className="text-[8px] ml-1" style={{ backgroundColor: 'var(--ea-emerald)', color: 'white' }}>
                        NOW
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {slotBookings.length} guest{slotBookings.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Booking cards */}
                <div className="space-y-1.5 ml-4">
                  {slotBookings.map((booking) => {
                    const m = booking.member;
                    const initials = m ? `${m.first_name[0]}${m.last_name[0]}` : '??';

                    return (
                      <div
                        key={booking.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'
                        }`}
                      >
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={m?.photo_url ?? undefined} />
                          <AvatarFallback
                            className="text-[10px] font-bold text-white"
                            style={{ backgroundColor: 'var(--ea-emerald)' }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ea-midnight)' }}>
                            {m ? `${m.first_name} ${m.last_name}` : 'Unknown Member'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {booking.service_name}
                            {booking.is_member_pass && (
                              <span className="ml-1 text-amber-500">· Pass</span>
                            )}
                          </p>
                        </div>

                        {m?.phone && (
                          <a
                            href={`tel:${m.phone}`}
                            className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            📞
                          </a>
                        )}

                        {isPast ? (
                          <CheckCircle2 size={16} className="text-gray-300 shrink-0" />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full border-2 shrink-0"
                            style={{ borderColor: 'var(--ea-emerald)' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

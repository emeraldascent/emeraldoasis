import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMember } from '@/hooks/useMember';
import { Calendar, MapPin, Clock, Ticket, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  capacity: number;
  price: number;
}

interface EventTicket {
  id: string;
  event_id: string;
  quantity: number;
  status: string;
}

interface MemberBooking {
  id: string;
  booking_date: string;
  service_name: string;
  booking_time: string | null;
  status: string;
}

export function Events() {
  const { member } = useMember();
  const [events, setEvents] = useState<Event[]>([]);
  const [myTickets, setMyTickets] = useState<EventTicket[]>([]);
  const [myBookings, setMyBookings] = useState<MemberBooking[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    if (member) {
      fetchMyTickets();
      fetchMyBookings();
    }
  }, [member]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true });
    setEvents((data as Event[]) || []);
    setLoading(false);
  };

  const fetchMyTickets = async () => {
    if (!member) return;
    const { data } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('member_id', member.id);
    setMyTickets((data as EventTicket[]) || []);
  };

  const fetchMyBookings = async () => {
    if (!member) return;
    const { data } = await supabase
      .from('member_bookings')
      .select('*')
      .eq('member_id', member.id)
      .eq('status', 'confirmed')
      .gte('booking_date', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0])
      .order('booking_date', { ascending: true });
    setMyBookings((data as MemberBooking[]) || []);
  };

  const purchaseTicket = async (event: Event) => {
    if (!member) return;
    setPurchasing(true);
    await supabase.from('event_tickets').insert({
      event_id: event.id,
      member_id: member.id,
      quantity: 1,
    });
    await fetchMyTickets();
    setPurchasing(false);
    setSelectedEvent(null);
  };

  const hasTicket = (eventId: string) => myTickets.some((t) => t.event_id === eventId);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  // ── Calendar helpers ──
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach((e) => {
    if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = [];
    eventsByDate[e.event_date].push(e);
  });

  const bookingsByDate: Record<string, MemberBooking[]> = {};
  myBookings.forEach((b) => {
    if (!bookingsByDate[b.booking_date]) bookingsByDate[b.booking_date] = [];
    bookingsByDate[b.booking_date].push(b);
  });

  const upcomingBookings = myBookings.filter(
    (b) => b.booking_date >= todayStr
  );

  const ticketedEventIds = new Set(myTickets.map((t) => t.event_id));

  const calDays: { day: number; dateStr: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calDays.push({ day: d, dateStr });
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Selected date detail
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDateEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const selectedDateBookings = selectedDate && showBookings ? bookingsByDate[selectedDate] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        {/* Header */}
        <div className="text-center mb-4">
          <h1
            className="text-lg mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Events
          </h1>
          <p className="text-xs text-gray-400">Upcoming events at Emerald Oasis</p>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronLeft size={16} style={{ color: 'var(--ea-midnight)' }} />
            </button>
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>{monthLabel}</p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronRight size={16} style={{ color: 'var(--ea-midnight)' }} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i} className="text-[10px] text-gray-400 font-medium py-1">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calDays.map(({ day, dateStr }) => {
              const dayEvents = eventsByDate[dateStr] || [];
              const dayBookings = showBookings ? (bookingsByDate[dateStr] || []) : [];
              const isToday = dateStr === todayStr;
              const hasEvents = dayEvents.length > 0;
              const hasBookings = dayBookings.length > 0;
              const hasMyTicket = dayEvents.some((e) => ticketedEventIds.has(e.id));
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDate(dateStr);
                      setSelectedEvent(dayEvents[0]);
                    } else if (hasBookings) {
                      setSelectedDate(dateStr);
                    }
                  }}
                  className="relative aspect-square flex items-center justify-center rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--ea-emerald)'
                      : hasMyTicket
                        ? '#DCFCE7'
                        : hasEvents
                          ? '#FEF3C7'
                          : isToday
                            ? '#F3F4F6'
                            : 'transparent',
                    color: isSelected
                      ? 'white'
                      : hasEvents
                        ? 'var(--ea-midnight)'
                        : isToday
                          ? 'var(--ea-emerald)'
                          : '#6B7280',
                    fontWeight: hasEvents || isToday || isSelected ? 600 : 400,
                  }}
                >
                  {day}
                  {/* Dots row */}
                  <span className="absolute bottom-0.5 flex gap-0.5 justify-center">
                    {hasEvents && (
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSelected ? 'white' : hasMyTicket ? '#16a34a' : '#d97706' }}
                      />
                    )}
                    {hasBookings && (
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#2563eb' }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Legend + bookings toggle */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d97706' }} /> Event
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#16a34a' }} /> My Ticket
              </span>
              {showBookings && (
                <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb' }} /> Booking
                </span>
              )}
            </div>
            <button
              onClick={() => setShowBookings(!showBookings)}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: showBookings ? '#EFF6FF' : '#F3F4F6',
                color: showBookings ? '#2563eb' : '#9CA3AF',
              }}
            >
              {showBookings ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
              Bookings
            </button>
          </div>
        </div>

        {/* Selected date detail */}
        {selectedDate && (selectedDateEvents.length > 0 || selectedDateBookings.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <button onClick={() => setSelectedDate(null)} className="text-[10px] text-gray-400">✕</button>
            </div>

            {selectedDateEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <span className="text-[10px] font-bold" style={{ color: '#92400e' }}>EVENT</span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--ea-midnight)' }}>
                  {event.title}
                </span>
                <span className="text-[10px] text-gray-500">{formatTime(event.start_time)}</span>
              </button>
            ))}

            {selectedDateBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#EFF6FF' }}
              >
                <span className="text-[10px] font-bold" style={{ color: '#2563eb' }}>BOOKING</span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--ea-midnight)' }}>
                  {booking.service_name}
                </span>
                {booking.booking_time && (
                  <span className="text-[10px] text-gray-500">{formatTime(booking.booking_time)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSelectedEvent(null)}>
            <div
              className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                {selectedEvent.title}
              </h2>
              {selectedEvent.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{selectedEvent.description}</p>
              )}
              <div className="space-y-1.5">
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={13} style={{ color: 'var(--ea-emerald)' }} />
                  {formatDate(selectedEvent.event_date)}
                </p>
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock size={13} style={{ color: 'var(--ea-emerald)' }} />
                  {formatTime(selectedEvent.start_time)}
                  {selectedEvent.end_time ? ` – ${formatTime(selectedEvent.end_time)}` : ''}
                </p>
                {selectedEvent.location && (
                  <p className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin size={13} style={{ color: 'var(--ea-emerald)' }} />
                    {selectedEvent.location}
                  </p>
                )}
                <p className="flex items-center gap-2 text-xs text-gray-600">
                  <Ticket size={13} style={{ color: 'var(--ea-emerald)' }} />
                  {selectedEvent.price > 0 ? `$${selectedEvent.price}` : 'Free'}
                  {' · '}{selectedEvent.capacity} spots
                </p>
              </div>

              {member ? (
                hasTicket(selectedEvent.id) ? (
                  <div className="flex items-center gap-2 justify-center py-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                    <Check size={16} style={{ color: '#16a34a' }} />
                    <span className="text-sm font-medium text-green-700">You have a ticket!</span>
                  </div>
                ) : (
                  <button
                    onClick={() => purchaseTicket(selectedEvent)}
                    disabled={purchasing}
                    className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: 'var(--ea-emerald)' }}
                  >
                    {purchasing ? 'Reserving…' : selectedEvent.price > 0 ? `Get Ticket — $${selectedEvent.price}` : 'Reserve Spot'}
                  </button>
                )
              ) : (
                <p className="text-xs text-gray-400 text-center">Log in to reserve a spot</p>
              )}

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Upcoming Events List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold px-1 text-ea-midnight">
            Upcoming Events
          </h2>

          {loading ? (
            <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
          ) : events.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400">No upcoming events</p>
              <p className="text-xs text-gray-300 mt-1">Check back soon!</p>
            </div>
          ) : (
            events.map((event) => {
              const owned = hasTicket(event.id);
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full bg-white rounded-xl border p-3 text-left hover:shadow-sm transition-shadow"
                  style={{ borderColor: owned ? '#BBF7D0' : '#E5E7EB' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center text-center"
                      style={{ backgroundColor: owned ? '#DCFCE7' : '#FEF3C7' }}
                    >
                      <span className="text-[10px] font-bold leading-none text-ea-midnight">
                        {new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-sm font-bold leading-none text-ea-midnight">
                        {new Date(event.event_date + 'T12:00:00').getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-ea-midnight">
                        {event.title}
                        {owned && <span className="text-green-600 ml-1.5">✓</span>}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {formatTime(event.start_time)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: event.price > 0 ? '#FEF3C7' : '#F0FDF4',
                        color: event.price > 0 ? '#92400e' : '#16a34a',
                      }}
                    >
                      {event.price > 0 ? `$${event.price}` : 'Free'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Upcoming Bookings Section — toggleable */}
        {member && (
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-ea-midnight">
                Your Upcoming Bookings
              </h2>
              <button
                onClick={() => setShowBookings(!showBookings)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                  showBookings ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {showBookings ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                {showBookings ? 'On' : 'Off'}
              </button>
            </div>

            {showBookings && (
              <>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-2xl border border-gray-100">
                    <span className="text-xl block mb-1">🌿</span>
                    <p className="text-xs text-gray-400">No upcoming bookings</p>
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-gray-100 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center text-center bg-blue-50">
                          <span className="text-[10px] font-bold leading-none text-ea-midnight">
                            {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-sm font-bold leading-none text-ea-midnight">
                            {new Date(booking.booking_date + 'T12:00:00').getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-ea-midnight">
                            {booking.service_name}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            {booking.booking_time ? ` · ${formatTime(booking.booking_time)}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

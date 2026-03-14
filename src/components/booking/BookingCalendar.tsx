import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '@/integrations/supabase/client';
import { PaymentForm } from './PaymentForm';
import type { Member } from '../../lib/types';

interface ServiceInfo {
  id: number;
  name: string;
  price: string;
  description: string;
}

interface BookingCalendarProps {
  service: ServiceInfo;
  member: Member;
  onBack: () => void;
}

type Step = 'date' | 'time' | 'confirm' | 'payment' | 'success';

// Campsite service IDs — these get check-in/check-out treatment, not hourly time slots
const CAMPSITE_IDS = [8, 9, 10, 11, 12, 13, 14];
const CAMPSITE_CHECKIN = '12:00 – 6:00 PM';
const CAMPSITE_CHECKOUT = '11:00 AM';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function simplybookCall(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('simplybook-bookings', { body });
  if (error) throw error;
  return data;
}

export function BookingCalendar({ service, member, onBack }: BookingCalendarProps) {
  const [step, setStep] = useState<Step>('date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calendar state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Availability data: { "2026-03-14": ["12:00:00"] }
  const [timeSlots, setTimeSlots] = useState<Record<string, string[]>>({});

  // Selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Guest names (additional field)
  const [guestNames, setGuestNames] = useState(`${member.first_name} ${member.last_name}`);

  // Booking result
  const [, setBookingId] = useState<string | null>(null);

  // Fetch availability when month changes
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
      const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${lastDay}`;

      const data = await simplybookCall({
        action: 'time_slots',
        dateFrom,
        dateTo,
        eventId: service.id,
      });
      setTimeSlots(data || {});
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError('Could not load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth, service.id]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const getDayKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isCampsite = CAMPSITE_IDS.includes(service.id);

  const handleDateSelect = (day: number) => {
    const key = getDayKey(day);
    if (key < todayStr) return;
    if (!timeSlots[key] || timeSlots[key].length === 0) return;
    setSelectedDate(key);

    if (isCampsite) {
      // Campsites auto-select the single time slot (usually 12:00) and skip to confirm
      setSelectedTime(timeSlots[key][0]);
      setStep('confirm');
    } else {
      setSelectedTime(null);
      setStep('time');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    setError('');
    try {
      const result = await simplybookCall({
        action: 'book',
        eventId: service.id,
        unitId: null,
        date: selectedDate,
        time: selectedTime,
        clientData: {
          name: `${member.first_name} ${member.last_name}`,
          email: member.email,
          phone: member.phone || '',
        },
        additionalFields: [
          { id: 2, value: guestNames },
          { id: 3, value: true },
        ],
      });

      const bookingFromList = Array.isArray(result?.bookings) ? result.bookings[0] : null;
      const sbBookingId = String(
        result?.id ??
        result?.bookingId ??
        result?.booking_id ??
        bookingFromList?.id ??
        ''
      );

      if (sbBookingId) {
        setBookingId(sbBookingId);

        // Log booking to backend for pass tracking
        const isMemberPass = [20, 21].includes(service.id);
        try {
          await supabase.from('member_bookings').insert({
            member_id: member.id,
            simplybook_booking_id: sbBookingId,
            service_id: String(service.id),
            service_name: service.name,
            booking_date: selectedDate,
            booking_time: selectedTime,
            guest_names: guestNames ? [guestNames] : null,
            is_member_pass: isMemberPass,
            status: 'confirmed',
          });
        } catch (logErr) {
          console.warn('Failed to log booking to backend:', logErr);
          // Non-blocking — booking succeeded upstream
        }

        setStep('success');
      } else {
        setError('Booking was not confirmed. Please try again or contact us.');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Booking failed. Please try again or book directly at emeraldoasiscamp.simplybook.me');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#F0FDF4' }}
          >
            <Check size={32} style={{ color: 'var(--ea-emerald)' }} />
          </div>
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Booking Confirmed
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">{service.name}</p>
            {isCampsite ? (
              <>
                <p>Check-in: {selectedDate && formatDate(selectedDate)} · {CAMPSITE_CHECKIN}</p>
                <p>Check-out: {CAMPSITE_CHECKOUT} next day</p>
              </>
            ) : (
              <>
                <p>{selectedDate && formatDate(selectedDate)}</p>
                <p>{selectedTime && formatTime(selectedTime)}</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400">
            A confirmation has been sent to {member.email}
          </p>
          <Button
            onClick={onBack}
            className="w-full h-11 text-white font-medium rounded-lg"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'confirm' && isCampsite) { setStep('date'); setSelectedDate(null); }
              else if (step === 'confirm') setStep('time');
              else if (step === 'time') { setStep('date'); setSelectedDate(null); }
              else onBack();
            }}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} style={{ color: 'var(--ea-midnight)' }} />
          </button>
          <div>
            <h1
              className="text-base"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
            >
              {service.name}
            </h1>
            <p className="text-[11px] text-gray-400">
              {step === 'date' && (isCampsite ? 'Select your check-in date' : 'Select a date')}
              {step === 'time' && selectedDate && `${formatDate(selectedDate)} · Pick a time`}
              {step === 'confirm' && 'Confirm your booking'}
            </p>
          </div>
          <span className="ml-auto text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
            {service.price}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* DATE STEP — Calendar */}
        {step === 'date' && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ea-emerald)' }} />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const key = getDayKey(day);
                  const isPast = key < todayStr;
                  const hasSlots = timeSlots[key] && timeSlots[key].length > 0;
                  const isSelected = key === selectedDate;

                  return (
                    <button
                      key={key}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast || !hasSlots}
                      className="aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--ea-emerald)'
                          : hasSlots && !isPast
                          ? '#F0FDF4'
                          : 'transparent',
                        color: isSelected
                          ? 'white'
                          : isPast
                          ? '#D1D5DB'
                          : hasSlots
                          ? 'var(--ea-midnight)'
                          : '#9CA3AF',
                        cursor: isPast || !hasSlots ? 'default' : 'pointer',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }} />
                <span className="text-[10px] text-gray-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-100" />
                <span className="text-[10px] text-gray-400">Unavailable</span>
              </div>
            </div>

            {isCampsite && (
              <div className="mt-3 p-3 rounded-lg text-center" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-[11px] font-medium" style={{ color: 'var(--ea-emerald)' }}>
                  Check-in {CAMPSITE_CHECKIN} · Check-out {CAMPSITE_CHECKOUT}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Each date = one night · Carry gear across creek
                </p>
              </div>
            )}
          </div>
        )}

        {/* TIME STEP — Time slots */}
        {step === 'time' && selectedDate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ea-midnight)' }}>
              Available times
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(timeSlots[selectedDate] || []).map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className="py-3 px-2 rounded-xl text-sm font-medium transition-colors border"
                  style={{
                    backgroundColor: selectedTime === time ? 'var(--ea-emerald)' : 'white',
                    color: selectedTime === time ? 'white' : 'var(--ea-midnight)',
                    borderColor: selectedTime === time ? 'var(--ea-emerald)' : '#E5E7EB',
                  }}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
            {(timeSlots[selectedDate] || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No times available for this date</p>
            )}
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && selectedDate && selectedTime && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <p className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                Booking Summary
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isCampsite ? 'Campsite' : 'Experience'}</span>
                  <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>{service.name}</span>
                </div>
                {isCampsite ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Check-in</span>
                      <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>
                        {formatDate(selectedDate)} · {CAMPSITE_CHECKIN}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Check-out</span>
                      <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>
                        {CAMPSITE_CHECKOUT} next day
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Time</span>
                      <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>{formatTime(selectedTime)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="font-bold" style={{ color: 'var(--ea-emerald)' }}>{service.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member</span>
                  <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>
                    {member.first_name} {member.last_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest names field */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                Guest Names (including yourself)
              </label>
              <textarea
                value={guestNames}
                onChange={(e) => setGuestNames(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
                rows={2}
                placeholder="List all guests for safety records"
              />
              <p className="text-[10px] text-gray-400">
                All guests must be PMA members before arrival
              </p>
            </div>

            <Button
              onClick={handleBook}
              disabled={loading}
              className="w-full h-12 text-white font-medium rounded-xl text-sm"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                `Confirm Booking · ${service.price}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

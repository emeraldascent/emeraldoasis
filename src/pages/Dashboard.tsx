import { useNavigate } from 'react-router-dom';
import type { Member, BadgeStatus } from '../lib/types';
import { MemberBadge } from '../components/dashboard/MemberBadge';
import { BookingGrid } from '../components/dashboard/BookingGrid';
import { UpcomingCalendar } from '../components/dashboard/UpcomingCalendar';
import { PropertyStatus } from '../components/dashboard/PropertyStatus';
import { QuickLinks } from '../components/dashboard/QuickLinks';
import { Droplets, ShoppingBag, Smartphone } from 'lucide-react';

const LOGO_URL =
  '/ea-logo.jpg';

interface DashboardProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
}

export function Dashboard({ member, badgeStatus }: DashboardProps) {
  const navigate = useNavigate();

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌿</span>
          <p className="text-sm text-gray-500">Loading your membership...</p>
        </div>
      </div>
    );
  }

  const isActive = badgeStatus === 'active';
  const isExpired = badgeStatus === 'expired';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Logo header */}
        <div className="flex items-center justify-center gap-2 pb-1">
          <img
            src={LOGO_URL}
            alt="Emerald Oasis"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: 'var(--ea-midnight)',
            }}
          >
            Emerald Oasis
          </span>
        </div>

        {/* Badge — always above fold */}
        <MemberBadge member={member} badgeStatus={badgeStatus} />

        {/* Active member content */}
        {isActive && (
          <>
            {/* Membership includes */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--ea-midnight)' }}>
                Your membership includes:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Droplets size={14} style={{ color: 'var(--ea-sky)' }} />
                  <span>💧 Spring water (15 min parking)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ShoppingBag size={14} style={{ color: 'var(--ea-emerald)' }} />
                  <span>🌿 Emerald Market access</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Smartphone size={14} style={{ color: 'var(--ea-lilac)' }} />
                  <span>📱 Booking portal access</span>
                </div>
              </div>
            </div>

            {/* Booking grid */}
            <BookingGrid onBook={() => navigate('/book')} />

            {/* Upcoming events calendar */}
            <UpcomingCalendar />
          </>
        )}

        {/* Expired member content */}
        {isExpired && (
          <>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Your membership has expired
              </p>
              <p className="text-xs text-red-500">
                Renew to access booking and property experiences.
              </p>
              <button
                onClick={() => navigate('/join')}
                className="text-xs font-semibold underline underline-offset-2"
                style={{ color: 'var(--ea-emerald)' }}
              >
                Renew Membership →
              </button>
            </div>
            <BookingGrid disabled />
          </>
        )}

        {/* Below fold content */}
        <PropertyStatus />

        <QuickLinks />

        {/* Reminder */}
        <div
          className="p-3 rounded-xl text-center"
          style={{ backgroundColor: '#EDEEF8' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--ea-lilac)' }}>
            Membership ≠ Free Access · All experiences require advance booking at emeraldoasis.club
          </p>
        </div>
      </div>
    </div>
  );
}

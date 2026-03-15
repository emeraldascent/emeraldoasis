import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member, BadgeStatus } from '../lib/types';
import { MemberBadge } from '../components/dashboard/MemberBadge';
import { BookingGrid } from '../components/dashboard/BookingGrid';
import { UpcomingCalendar } from '../components/dashboard/UpcomingCalendar';
import { PropertyStatus } from '../components/dashboard/PropertyStatus';
import { QuickLinks } from '../components/dashboard/QuickLinks';
import { MembershipUpgrade } from '../components/membership/MembershipUpgrade';
import { Droplets, ShoppingBag, Smartphone, Star, RefreshCw, Gift } from 'lucide-react';

const LOGO_URL =
  '/ea-logo.jpg';

interface DashboardProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
  onRefreshMember?: () => void;
}

export function Dashboard({ member, badgeStatus, onRefreshMember }: DashboardProps) {
  const navigate = useNavigate();
  const [showExtend, setShowExtend] = useState(false);

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

        {/* Extend PMA button */}
        {isActive && (
          <>
            <button
              onClick={() => setShowExtend(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ea-emerald)', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <RefreshCw size={12} />
              Extend PMA Membership
            </button>
            {showExtend && (
              <MembershipUpgrade
                member={member}
                mode="extend"
                onComplete={() => onRefreshMember?.()}
                onClose={() => setShowExtend(false)}
              />
            )}
          </>
        )}

        {/* Active member content */}
        {isActive && (
          <>
            {/* Free Welcome Pass banner */}
            {!member.welcome_pass_redeemed && (
              <button
                onClick={() => navigate('/book', { state: { welcomePass: true } })}
                className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-border/80"
                style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#DCFCE7', color: 'var(--ea-emerald)' }}
                >
                  <Gift size={18} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                    🎁 Free Oasis Pass
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Your welcome gift — 2 or 4 hour pass, on us!
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-sm">→</span>
              </button>
            )}

            {/* Membership includes */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--ea-midnight)' }}>
                Your membership includes:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Droplets size={14} style={{ color: 'var(--ea-emerald)' }} />
                  <span>Spring water (30 min parking)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ShoppingBag size={14} style={{ color: 'var(--ea-emerald)' }} />
                  <span>Emerald Market — coming April 2026 (select days/hrs)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Smartphone size={14} style={{ color: 'var(--ea-emerald)' }} />
                  <span>Booking portal access</span>
                </div>
              </div>
            </div>

            {/* Oasis Pass upgrade — only show if no active subscription */}
            {!member.subscription_active && (
              <button
                onClick={() => navigate('/book')}
                className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-gray-200"
                style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#FEF9C3', color: '#CA8A04' }}
                >
                  <Star size={18} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                    Upgrade to an Oasis Pass
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Silver (5 visits/mo) or Gold (10 visits/mo) — save on every visit
                  </p>
                </div>
                <span className="text-gray-300 shrink-0">→</span>
              </button>
            )}

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

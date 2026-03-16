import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member, BadgeStatus } from '../lib/types';
import { MemberBadge } from '../components/dashboard/MemberBadge';
import { BookingGrid } from '../components/dashboard/BookingGrid';
import { UpcomingCalendar } from '../components/dashboard/UpcomingCalendar';
import { PropertyStatus } from '../components/dashboard/PropertyStatus';
import { QuickLinks } from '../components/dashboard/QuickLinks';
import { WelcomePassBanner } from '../components/dashboard/WelcomePassBanner';
import { MembershipIncludes } from '../components/dashboard/MembershipIncludes';
import { OasisPassUpgrade } from '../components/dashboard/OasisPassUpgrade';
import { ExpiredMemberState } from '../components/dashboard/ExpiredMemberState';
import { MembershipUpgrade } from '../components/membership/MembershipUpgrade';
import { AnnouncementBoard } from '../components/dashboard/AnnouncementBoard';
import { RefreshCw } from 'lucide-react';

const LOGO_URL = '/ea-logo.jpg';

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
        {/* Property photo banner */}
        <div className="relative rounded-xl overflow-hidden h-32">
          <img
            src="/photos/spring-water.jpg"
            alt="Mandala Springs"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Emerald Oasis" className="w-7 h-7 rounded-full object-cover border border-white/40" />
              <span className="text-sm font-semibold font-serif text-white">
                Emerald Oasis
              </span>
            </div>
          </div>
        </div>

        <MemberBadge member={member} badgeStatus={badgeStatus} />

        <AnnouncementBoard />

        {/* Extend PMA button */}
        {isActive && (
          <>
            <button
              onClick={() => setShowExtend(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors hover:opacity-80 text-ea-emerald bg-green-50 border border-green-200"
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

        {isActive && (
          <>
            {!member.welcome_pass_redeemed && <WelcomePassBanner />}
            <MembershipIncludes />
            <PropertyStatus />
            <QuickLinks />
            <div className="p-3 rounded-xl text-center bg-indigo-50">
              <p className="text-[10px] text-ea-lilac">
                Membership ≠ Free Access · All experiences require advance booking at emeraldoasis.club
              </p>
            </div>
            {!member.subscription_active && <OasisPassUpgrade />}
            <BookingGrid onBook={() => navigate('/book')} />
            <UpcomingCalendar />
          </>
        )}

        {isExpired && <ExpiredMemberState />}
      </div>
    </div>
  );
}

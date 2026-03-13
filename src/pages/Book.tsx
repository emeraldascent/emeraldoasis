import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock } from 'lucide-react';
import type { Member, BadgeStatus } from '../lib/types';

const SIMPLYBOOK_URL = 'https://emeraldoasiscamp.simplybook.me/v2/';

interface BookProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
}

export function Book({ member, badgeStatus }: BookProps) {
  const navigate = useNavigate();
  const isActive = badgeStatus === 'active';

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl block mb-3">🌿</span>
          <p className="text-sm text-gray-500">Loading membership...</p>
        </div>
      </div>
    );
  }

  // Expired / future — lock screen
  if (!isActive) {
    const expDate = new Date(member.membership_end).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-red-100 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <Lock size={28} className="text-red-500" />
          </div>
          <div>
            <h2
              className="text-base font-semibold mb-1"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              Booking Unavailable
            </h2>
            <p className="text-sm text-red-600 font-medium">
              Your membership expired on {expDate}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Renew your membership to book experiences
            </p>
          </div>
          <Button
            onClick={() => navigate('/join')}
            className="w-full h-11 text-white font-medium rounded-lg"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            Renew Membership
          </Button>
        </div>
      </div>
    );
  }

  // Active — embedded SimplyBook
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1
            className="text-base"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: 'var(--ea-midnight)',
            }}
          >
            Book an Experience
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {member.first_name} {member.last_name}
            </span>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: '#22C55E' }}
            />
          </div>
        </div>
      </div>

      {/* SimplyBook iframe */}
      <iframe
        src={SIMPLYBOOK_URL}
        title="Book an Experience — SimplyBook"
        className="flex-1 w-full border-0"
        style={{ minHeight: 'calc(100vh - 120px)' }}
        allow="payment"
      />
    </div>
  );
}

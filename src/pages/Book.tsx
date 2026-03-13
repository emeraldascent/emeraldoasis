import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, ArrowLeft, Sun, Tent, Users, Clock } from 'lucide-react';
import type { Member, BadgeStatus } from '../lib/types';

const SIMPLYBOOK_BASE = 'https://emeraldoasiscamp.simplybook.me/v2/#book/service';

interface ServiceCard {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const DAY_PASSES: ServiceCard[] = [
  { id: 18, name: 'Oasis Pass — 2 Hours', description: 'Spring water, trails, market access', icon: <Clock size={18} /> },
  { id: 19, name: 'Oasis Pass — 4 Hours', description: 'Extended visit with sauna access', icon: <Sun size={18} /> },
  { id: 22, name: 'Oasis Pass — 6 Hours', description: 'Full day experience', icon: <Sun size={18} /> },
];

const CAMPSITES: ServiceCard[] = [
  { id: 11, name: 'Campsite 3', description: 'Creekside primitive site', icon: <Tent size={18} /> },
  { id: 12, name: 'Campsite 4', description: 'Wooded primitive site', icon: <Tent size={18} /> },
  { id: 13, name: 'Campsite 5', description: 'Wooded primitive site', icon: <Tent size={18} /> },
  { id: 14, name: 'Campsite 6', description: 'Wooded primitive site', icon: <Tent size={18} /> },
  { id: 9, name: 'Campsite 7 — Social', description: 'Open social campsite', icon: <Tent size={18} /> },
  { id: 8, name: 'Campsite 7 — Group Reserve', description: 'Full group reservation', icon: <Users size={18} /> },
  { id: 10, name: 'Creekside Group #2', description: 'Group creekside camping', icon: <Users size={18} /> },
];

interface BookProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
}

export function Book({ member, badgeStatus }: BookProps) {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);
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

  // SimplyBook iframe view for selected service
  if (selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              onClick={() => setSelectedService(null)}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} style={{ color: 'var(--ea-midnight)' }} />
            </button>
            <h1
              className="text-base"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'var(--ea-midnight)',
              }}
            >
              {selectedService.name}
            </h1>
          </div>
        </div>
        <iframe
          src={`${SIMPLYBOOK_BASE}/${selectedService.id}`}
          title={`Book ${selectedService.name}`}
          className="flex-1 w-full border-0"
          style={{ minHeight: 'calc(100vh - 120px)' }}
          allow="payment"
        />
      </div>
    );
  }

  // Service card grid
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-lg mb-1"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: 'var(--ea-midnight)',
            }}
          >
            Book an Experience
          </h1>
          <p className="text-xs text-gray-400">
            Welcome back, {member.first_name}
          </p>
        </div>

        {/* Day Passes */}
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--ea-midnight)' }}
          >
            <Sun size={16} style={{ color: 'var(--ea-emerald)' }} />
            Day Passes
          </h2>
          <div className="space-y-2">
            {DAY_PASSES.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                    {service.name}
                  </p>
                  <p className="text-[11px] text-gray-400">{service.description}</p>
                </div>
                <span
                  className="text-xs font-semibold shrink-0"
                  style={{ color: 'var(--ea-emerald)' }}
                >
                  Book →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Campsites */}
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--ea-midnight)' }}
          >
            <Tent size={16} style={{ color: 'var(--ea-emerald)' }} />
            Campsites
          </h2>
          <div className="space-y-2">
            {CAMPSITES.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                    {service.name}
                  </p>
                  <p className="text-[11px] text-gray-400">{service.description}</p>
                </div>
                <span
                  className="text-xs font-semibold shrink-0"
                  style={{ color: 'var(--ea-emerald)' }}
                >
                  Book →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

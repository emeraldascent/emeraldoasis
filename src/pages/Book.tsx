import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Sun, Tent, Users, Clock, Star } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { supabase } from '@/integrations/supabase/client';
import type { Member, BadgeStatus } from '../lib/types';

interface ServiceCard {
  id: number;
  name: string;
  description: string;
  price: string;
  icon: React.ReactNode;
}

const DAY_PASSES: ServiceCard[] = [
  { id: 18, name: 'Oasis Pass — 2 Hours', description: 'Spring water, trails, market access', price: '$4', icon: <Clock size={18} /> },
  { id: 19, name: 'Oasis Pass — 4 Hours', description: 'Extended visit with full property access', price: '$8', icon: <Sun size={18} /> },
  { id: 22, name: 'Oasis Pass — 6 Hours', description: 'Full day experience', price: '$12', icon: <Sun size={18} /> },
  { id: 23, name: 'Oasis Pass — 8 Hours', description: 'Dawn-to-dusk immersion', price: '$16', icon: <Sun size={18} /> },
];

const MEMBER_PASSES: ServiceCard[] = [
  { id: 20, name: 'Silver/Gold Pass — 2 Hours', description: 'Included with Silver/Gold subscription', price: 'Included', icon: <Star size={18} /> },
  { id: 21, name: 'Silver/Gold Pass — 4 Hours', description: 'Included with Silver/Gold subscription', price: 'Included', icon: <Star size={18} /> },
];

const CAMPSITES: ServiceCard[] = [
  { id: 11, name: 'Campsite 3', description: 'Creekside primitive site', price: '$30/night', icon: <Tent size={18} /> },
  { id: 12, name: 'Campsite 4', description: 'Wooded primitive site', price: '$30/night', icon: <Tent size={18} /> },
  { id: 13, name: 'Campsite 5', description: 'Wooded primitive site', price: '$30/night', icon: <Tent size={18} /> },
  { id: 14, name: 'Campsite 6', description: 'Wooded primitive site', price: '$30/night', icon: <Tent size={18} /> },
  { id: 9, name: 'Campsite 7 — Social', description: 'Shared community site (1 spot)', price: '$20/night', icon: <Tent size={18} /> },
  { id: 8, name: 'Campsite 7 — Group Reserve', description: 'Exclusive group use, up to 5 tents', price: '$60/night', icon: <Users size={18} /> },
  { id: 10, name: 'Creekside Group #2', description: 'Group creekside camping', price: '$50/night', icon: <Users size={18} /> },
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

  // Native booking calendar for selected service
  if (selectedService && member) {
    return (
      <BookingCalendar
        service={selectedService}
        member={member}
        onBack={() => setSelectedService(null)}
      />
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
        <ServiceSection
          title="Day Passes"
          icon={<Sun size={16} style={{ color: 'var(--ea-emerald)' }} />}
          services={DAY_PASSES}
          onSelect={setSelectedService}
        />

        {/* Member Passes */}
        <MemberPassSection
          services={MEMBER_PASSES}
          memberEmail={member.email}
          onSelect={setSelectedService}
        />

        {/* Campsites */}
        <ServiceSection
          title="Campsites"
          icon={<Tent size={16} style={{ color: 'var(--ea-emerald)' }} />}
          services={CAMPSITES}
          onSelect={setSelectedService}
        />
      </div>
    </div>
  );
}

const SIMPLYBOOK_SILVER_URL = 'https://emeraldoasiscamp.simplybook.me/v2/#membership/2';
const SIMPLYBOOK_GOLD_URL = 'https://emeraldoasiscamp.simplybook.me/v2/#membership/11';

function MembershipModal({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: (purchased: boolean) => void;
  tier: 'silver' | 'gold';
}) {
  const url = tier === 'silver' ? SIMPLYBOOK_SILVER_URL : SIMPLYBOOK_GOLD_URL;
  const label = tier === 'silver' ? 'Silver' : 'Gold';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose(false)}
      />
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-xl" style={{ height: '85vh', maxHeight: '700px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--ea-midnight)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Subscribe to {label} Pass
          </h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 text-lg font-medium px-2"
          >
            ✕
          </button>
        </div>
        {/* SimplyBook iframe */}
        <iframe
          src={url}
          className="w-full border-0"
          style={{ height: 'calc(100% - 96px)' }}
          allow="payment"
          title={`${label} Membership`}
        />
        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => onClose(true)}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--ea-emerald)' }}
          >
            I've completed my subscription →
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberPassSection({
  services,
  memberEmail,
  onSelect,
}: {
  services: ServiceCard[];
  memberEmail: string;
  onSelect: (s: ServiceCard) => void;
}) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold'>('silver');
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    async function checkMembership() {
      setChecking(true);
      try {
        const { data, error } = await supabase.functions.invoke('simplybook-bookings', {
          body: { action: 'check_membership', email: memberEmail },
        });
        if (!error && data && data.hasMembership) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      } catch {
        setHasSubscription(false);
      } finally {
        setChecking(false);
      }
    }
    checkMembership();
  }, [memberEmail, checkCount]);

  const handleModalClose = (purchased: boolean) => {
    setModalOpen(false);
    if (purchased) {
      // Re-check membership status after they say they purchased
      setCheckCount((c) => c + 1);
    }
  };

  if (checking) {
    return (
      <div>
        <h2
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--ea-midnight)' }}
        >
          <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
          Member Passes
        </h2>
        <div className="p-4 rounded-xl bg-white border border-gray-100 text-center">
          <p className="text-xs text-gray-400">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <>
        <MembershipModal
          open={modalOpen}
          onClose={handleModalClose}
          tier={selectedTier}
        />
        <div>
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--ea-midnight)' }}
          >
            <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
            Member Passes
          </h2>
          <div className="space-y-2">
            {/* Silver */}
            <button
              onClick={() => { setSelectedTier('silver'); setModalOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#F0F0F0', color: '#9CA3AF' }}
              >
                <Star size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  Silver Pass
                </p>
                <p className="text-[11px] text-gray-400">5 included day passes per month</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>
                  $25/mo
                </p>
                <p className="text-[10px] text-gray-400">Subscribe →</p>
              </div>
            </button>
            {/* Gold */}
            <button
              onClick={() => { setSelectedTier('gold'); setModalOpen(true); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#FEF9C3', color: '#CA8A04' }}
              >
                <Star size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  Gold Pass
                </p>
                <p className="text-[11px] text-gray-400">10 included day passes per month</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>
                  $50/mo
                </p>
                <p className="text-[10px] text-gray-400">Subscribe →</p>
              </div>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <ServiceSection
      title="Member Passes"
      icon={<Star size={16} style={{ color: 'var(--ea-emerald)' }} />}
      services={services}
      onSelect={onSelect}
    />
  );
}

function ServiceSection({
  title,
  icon,
  services,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  services: ServiceCard[];
  onSelect: (s: ServiceCard) => void;
}) {
  return (
    <div>
      <h2
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'var(--ea-midnight)' }}
      >
        {icon}
        {title}
      </h2>
      <div className="space-y-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
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
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                {service.price}
              </p>
              <p className="text-[10px] text-gray-400">Book →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

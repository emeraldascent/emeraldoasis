import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Sun, Tent, Users, Clock, Star, Gift } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { MemberPassSection } from '../components/booking/MemberPassSection';
import type { Member, BadgeStatus } from '../lib/types';

interface ServiceCard {
  id: number;
  name: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  imageUrl?: string;
  isFreeWelcome?: boolean;
}

const WELCOME_PASSES: ServiceCard[] = [
  { id: 18, name: 'Welcome Pass — 2 Hours', description: 'Your free welcome gift!', price: 'FREE', icon: <Gift size={18} />, isFreeWelcome: true },
  { id: 19, name: 'Welcome Pass — 4 Hours', description: 'Your free welcome gift!', price: 'FREE', icon: <Gift size={18} />, isFreeWelcome: true },
];

const DAY_PASSES: ServiceCard[] = [
  { id: 18, name: 'Oasis Pass — 2 Hours', description: 'Spring water, trails, Zen Lounge & market', price: '$4', icon: <Clock size={18} /> },
  { id: 19, name: 'Oasis Pass — 4 Hours', description: 'Extended visit · full property & lounge access', price: '$8', icon: <Sun size={18} /> },
  { id: 22, name: 'Oasis Pass — 6 Hours', description: 'Full day · coworking, lounge & all amenities', price: '$12', icon: <Sun size={18} /> },
  { id: 23, name: 'Oasis Pass — 8 Hours', description: 'Dawn-to-dusk · complete Oasis immersion', price: '$16', icon: <Sun size={18} /> },
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
  onRefreshMember?: () => void;
}

export function Book({ member, badgeStatus, onRefreshMember }: BookProps) {
  const navigate = useNavigate();
  const location = useLocation();
  void (location.state as any)?.welcomePass; // used for navigation intent
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);
  const isActive = badgeStatus === 'active';
  const hasWelcomePass = member && !member.welcome_pass_redeemed;

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

  if (selectedService && member) {
    return (
      <BookingCalendar
        service={selectedService}
        member={member}
        onBack={() => setSelectedService(null)}
        onRefreshMember={onRefreshMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-6">
        {/* Hero photo banner */}
        <div className="relative rounded-xl overflow-hidden h-36">
          <img
            src="/photos/creek-trail.jpg"
            alt="Mineral Creek trail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <h1 className="text-lg text-white font-serif">
                Book an Experience
              </h1>
              <p className="text-[11px] text-white/80">
                Welcome back, {member.first_name}
              </p>
            </div>
          </div>
        </div>

        {/* Free Welcome Pass */}
        {hasWelcomePass && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} style={{ color: 'var(--ea-emerald)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                🎁 Your Free Welcome Pass
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 ml-6">
              Every new member gets one free Oasis Pass — choose 2 or 4 hours
            </p>
            <div className="space-y-2">
              {WELCOME_PASSES.map((service) => (
                <button
                  key={`welcome-${service.id}`}
                  onClick={() => setSelectedService(service)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-border/80 text-left"
                  style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#DCFCE7', color: 'var(--ea-emerald)' }}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                      {service.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                      FREE
                    </p>
                    <p className="text-[10px] text-muted-foreground">Redeem →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun size={16} style={{ color: 'var(--ea-emerald)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              Day Passes
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 ml-6">
            Includes Zen Lounge with WiFi & coworking, spring water, trails & market
          </p>
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

        <MemberPassSection
          services={MEMBER_PASSES}
          member={member}
          onSelect={setSelectedService}
          onSubscriptionChange={onRefreshMember}
        />

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
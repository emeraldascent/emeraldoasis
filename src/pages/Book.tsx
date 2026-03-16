import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Sun, Tent, Users, Clock, Star, Gift } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { MemberPassSection } from '../components/booking/MemberPassSection';
import { supabase } from '../integrations/supabase/client';
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

// Campsite IDs that should show /night suffix
const CAMPSITE_IDS = [8, 9, 10, 11, 12, 13, 14];

// Static metadata that doesn't come from the API
const SERVICE_META: Record<number, { description: string; icon: React.ReactNode; imageUrl?: string }> = {
  18: { description: 'Spring water, trails, Zen Lounge & market', icon: <Clock size={18} /> },
  19: { description: 'Extended visit · full property & lounge access', icon: <Sun size={18} /> },
  22: { description: 'Full day · coworking, lounge & all amenities', icon: <Sun size={18} /> },
  23: { description: 'Dawn-to-dusk · complete Oasis immersion', icon: <Sun size={18} /> },
  20: { description: 'Included with Silver/Gold subscription', icon: <Star size={18} /> },
  21: { description: 'Included with Silver/Gold subscription', icon: <Star size={18} /> },
  11: { description: 'Meadow corner · creek views · forest trail access', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace3.jpg' },
  12: { description: 'Between trees along meadow · creek views', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace4.jpg' },
  13: { description: 'Above meadow · more privacy · forest trails', icon: <Tent size={18} />, imageUrl: '/photos/campsite-terrace5.jpg' },
  14: { description: 'Forest hollow · nestled in the woods', icon: <Tent size={18} />, imageUrl: '/photos/campsite-secluded6.jpg' },
  9:  { description: 'Shared community site · 1 spot', icon: <Tent size={18} />, imageUrl: '/photos/campsite-creekside7.jpg' },
  8:  { description: 'Exclusive group use · up to 5 tents', icon: <Users size={18} />, imageUrl: '/photos/campsite-creekside7.jpg' },
  10: { description: 'Group creekside camping', icon: <Users size={18} />, imageUrl: '/photos/campsite-creekside2.jpg' },
};

const DAY_PASS_IDS = [18, 19, 22, 23];
const MEMBER_PASS_IDS = [20, 21];
const CAMPSITE_ORDER = [11, 12, 13, 14, 9, 8, 10];
const WELCOME_PASS_IDS = [18, 19];

// Fallback prices used while API loads or if it fails
const FALLBACK_PRICES: Record<number, string> = {
  18: '$4', 19: '$8', 22: '$12', 23: '$16',
  20: 'Included', 21: 'Included',
  11: '$25/night', 12: '$28/night', 13: '$30/night', 14: '$28/night',
  9: '$20/night', 8: '$60/night', 10: '$45/night',
};

interface BookProps {
  member: Member | null;
  badgeStatus: BadgeStatus;
  onRefreshMember?: () => void;
}

export function Book({ member, badgeStatus, onRefreshMember }: BookProps) {
  const navigate = useNavigate();
  const location = useLocation();
  void (location.state as any)?.welcomePass;
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);
  const [apiPrices, setApiPrices] = useState<Record<number, string>>(FALLBACK_PRICES);
  const isActive = badgeStatus === 'active';
  const hasWelcomePass = member && !member.welcome_pass_redeemed;

  // Fetch service prices from SimplyBook on mount
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('simplybook-bookings', {
          body: { action: 'services' },
        });
        if (error || !data) return;
        const events: any[] = Array.isArray(data) ? data : Object.values(data);
        const prices: Record<number, string> = { ...FALLBACK_PRICES };
        for (const ev of events) {
          const id = Number(ev.id);
          const rawPrice = Number(ev.price);
          if (!id || isNaN(rawPrice)) continue;
          if (MEMBER_PASS_IDS.includes(id)) {
            prices[id] = 'Included';
          } else if (rawPrice === 0) {
            prices[id] = 'FREE';
          } else {
            const suffix = CAMPSITE_IDS.includes(id) ? '/night' : '';
            prices[id] = `$${rawPrice}${suffix}`;
          }
        }
        setApiPrices(prices);
      } catch {
        // keep fallback prices
      }
    })();
  }, []);

  // Build service cards from API prices + static metadata
  const buildCard = (id: number, nameOverride?: string): ServiceCard => {
    const meta = SERVICE_META[id] || { description: '', icon: <Sun size={18} /> };
    return {
      id,
      name: nameOverride || `Service ${id}`,
      description: meta.description,
      price: apiPrices[id] || FALLBACK_PRICES[id] || '$0',
      icon: meta.icon,
      imageUrl: meta.imageUrl,
    };
  };

  const WELCOME_PASSES: ServiceCard[] = WELCOME_PASS_IDS.map((id) => ({
    ...buildCard(id, id === 18 ? 'Welcome Pass — 2 Hours' : 'Welcome Pass — 4 Hours'),
    price: 'FREE',
    icon: <Gift size={18} />,
    isFreeWelcome: true,
  }));

  const DAY_PASSES: ServiceCard[] = DAY_PASS_IDS.map((id) =>
    buildCard(id, id === 18 ? 'Oasis Pass — 2 Hours' : id === 19 ? 'Oasis Pass — 4 Hours' : id === 22 ? 'Oasis Pass — 6 Hours' : 'Oasis Pass — 8 Hours')
  );


  const CAMPSITES: ServiceCard[] = CAMPSITE_ORDER.map((id) => {
    const names: Record<number, string> = {
      11: 'Terrace #3', 12: 'Terrace #4', 13: 'Terrace #5', 14: 'Secluded Site #6',
      9: 'Creekside #7 — Social', 8: 'Creekside #7 — Group', 10: 'Creekside Group #2',
    };
    return buildCard(id, names[id]);
  });

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

<MemberPassSection
          member={member}
          onSubscriptionChange={onRefreshMember}
        />

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
            {DAY_PASSES.map((service) => {
              const hasActiveSub = member?.subscription_active && member?.subscription_tier;
              let displayPrice = service.price;
              let targetService = { ...service };
              
              if (hasActiveSub) {
                if (service.id === 18) {
                  displayPrice = 'Included';
                  targetService.id = 20; // Route to Member 2hr pass
                } else if (service.id === 19) {
                  displayPrice = 'Included';
                  targetService.id = 21; // Route to Member 4hr pass
                }
              }
              
              const isIncluded = displayPrice === 'Included';
              
              return (
              <button
                key={service.id}
                onClick={() => setSelectedService(targetService)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left relative overflow-hidden"
              >
                {isIncluded && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 text-white text-[9px] font-bold rounded-bl-lg" style={{ backgroundColor: 'var(--ea-emerald)' }}>
                    Member Benefit
                  </div>
                )}
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
                  <p className="text-sm font-bold" style={{ color: isIncluded ? 'var(--ea-emerald)' : 'var(--ea-midnight)' }}>
                    {displayPrice}
                  </p>
                  <p className="text-[10px] text-gray-400">Book →</p>
                </div>
              </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tent size={16} style={{ color: 'var(--ea-emerald)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              Campsites
            </h2>
          </div>
          <div className="space-y-2">
            {CAMPSITES.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors text-left"
              >
                {service.imageUrl && (
                  <img src={service.imageUrl} alt={service.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>{service.name}</p>
                  <p className="text-[11px] text-gray-400">{service.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>{service.price}</p>
                  <p className="text-[10px] text-gray-400">Book →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// SimplyBook membership page — unused ServiceSection removed
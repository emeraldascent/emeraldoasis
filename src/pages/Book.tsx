import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Lock, Sun, Tent, Users, Clock, Star, Loader2, Check } from 'lucide-react';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { PaymentForm } from '../components/booking/PaymentForm';
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
          member={member}
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

// ─── In-app membership purchase flow ───

type PurchaseStep = 'select' | 'payment' | 'processing' | 'success';

const PASS_LIMITS: Record<string, number> = { silver: 5, gold: 10 };
const TIER_PRICES: Record<string, number> = { silver: 25, gold: 50 };

function MemberPassSection({
  services,
  member,
  onSelect,
}: {
  services: ServiceCard[];
  member: Member;
  onSelect: (s: ServiceCard) => void;
}) {
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('select');
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold'>('silver');
  const [passesUsed, setPassesUsed] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasSubscription = member.subscription_active && member.subscription_tier;
  const passLimit = member.subscription_tier ? PASS_LIMITS[member.subscription_tier] || 0 : 0;
  const passesRemaining = Math.max(0, passLimit - passesUsed);

  // Count member pass bookings this month
  useEffect(() => {
    if (!hasSubscription) { setLoadingUsage(false); return; }

    async function fetchUsage() {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { count, error } = await supabase
        .from('member_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('is_member_pass', true)
        .eq('status', 'confirmed')
        .gte('booking_date', monthStart);

      if (!error && count !== null) setPassesUsed(count);
      setLoadingUsage(false);
    }
    fetchUsage();
  }, [member.id, hasSubscription]);

  const handlePaymentSuccess = async (opaqueData: { dataDescriptor: string; dataValue: string }) => {
    setPurchaseStep('processing');
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('purchase-membership', {
        body: {
          opaqueData,
          tier: selectedTier,
          memberId: member.id,
          email: member.email,
          memberName: `${member.first_name} ${member.last_name}`,
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Purchase failed');

      setPurchaseStep('success');

      // Reload after short delay to pick up new subscription
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Membership purchase failed:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
      setPurchaseStep('payment');
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ──
  if (purchaseStep === 'success') {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center space-y-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: '#F0FDF4' }}
        >
          <Check size={28} style={{ color: 'var(--ea-emerald)' }} />
        </div>
        <h3
          className="text-base font-semibold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
        >
          {selectedTier === 'gold' ? 'Gold' : 'Silver'} Membership Activated!
        </h3>
        <p className="text-xs text-gray-400">
          Your {PASS_LIMITS[selectedTier]} monthly passes are now available. Refreshing...
        </p>
      </div>
    );
  }

  // ── PAYMENT STEP ──
  if (purchaseStep === 'payment' || purchaseStep === 'processing') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPurchaseStep('select'); setError(''); }}
            className="text-xs font-medium underline"
            style={{ color: 'var(--ea-emerald)' }}
          >
            ← Back
          </button>
          <h2
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: 'var(--ea-midnight)' }}
          >
            <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
            {selectedTier === 'gold' ? 'Gold' : 'Silver'} Membership — ${TIER_PRICES[selectedTier]}/mo
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>
              {selectedTier === 'gold' ? 'Gold' : 'Silver'} Pass
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Included passes</span>
            <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>
              {PASS_LIMITS[selectedTier]}/month
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-medium" style={{ color: 'var(--ea-midnight)' }}>30 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-bold" style={{ color: 'var(--ea-emerald)' }}>
              ${TIER_PRICES[selectedTier]}.00
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {purchaseStep === 'processing' ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ea-emerald)' }} />
            <span className="text-sm text-gray-500">Activating your membership...</span>
          </div>
        ) : (
          <PaymentForm
            amount={`$${TIER_PRICES[selectedTier]}`}
            onPaymentSuccess={handlePaymentSuccess}
            loading={loading}
          />
        )}
      </div>
    );
  }

  // ── NO SUBSCRIPTION — SHOW PURCHASE OPTIONS ──
  if (!hasSubscription) {
    return (
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
            onClick={() => { setSelectedTier('silver'); setPurchaseStep('payment'); }}
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
            onClick={() => { setSelectedTier('gold'); setPurchaseStep('payment'); }}
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
    );
  }

  // ── HAS ACTIVE SUBSCRIPTION — SHOW PASSES WITH USAGE ──
  return (
    <div>
      <h2
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: 'var(--ea-midnight)' }}
      >
        <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
        Member Passes
        <span
          className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: passesRemaining > 0 ? '#F0FDF4' : '#FEF2F2',
            color: passesRemaining > 0 ? 'var(--ea-emerald)' : '#DC2626',
          }}
        >
          {loadingUsage ? '...' : `${passesRemaining} of ${passLimit} remaining`}
        </span>
      </h2>

      {passesRemaining === 0 && !loadingUsage ? (
        <div className="p-4 rounded-xl bg-white border border-red-100 text-center space-y-2">
          <p className="text-sm font-medium text-red-600">
            All {member.subscription_tier === 'gold' ? 'Gold' : 'Silver'} passes used this month
          </p>
          <p className="text-xs text-gray-400">
            Passes reset on the 1st. You can still book regular day passes below.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              disabled={loadingUsage}
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
                  Included
                </p>
                <p className="text-[10px] text-gray-400">Book →</p>
              </div>
            </button>
          ))}
        </div>
      )}
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

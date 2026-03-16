import { useState, useEffect } from 'react';
import { Star, Check, Loader2 } from 'lucide-react';
import { PaymentForm } from './PaymentForm';
import { supabase } from '@/integrations/supabase/client';
import type { Member } from '../../lib/types';

type PurchaseStep = 'select' | 'payment' | 'processing' | 'success';

const PASS_LIMITS: Record<string, number> = { silver: 5, gold: 10 };
const TIER_PRICES: Record<string, number> = { silver: 25, gold: 50 };

interface MemberPassSectionProps {
  member: Member;
  onSubscriptionChange?: () => void;
}

export function MemberPassSection({
  member,
  onSubscriptionChange,
}: MemberPassSectionProps) {
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('select');
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold'>('silver');
  const [passesUsed, setPassesUsed] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasSubscription = member.subscription_active && member.subscription_tier;
  const passLimit = member.subscription_tier ? PASS_LIMITS[member.subscription_tier] || 0 : 0;
  const passesRemaining = Math.max(0, passLimit - passesUsed);

  // Check if subscription is expired using subscription_end
  const subscriptionExpired = hasSubscription && member.subscription_end
    ? new Date(member.subscription_end) < new Date()
    : false;
  const effectiveSubscription = hasSubscription && !subscriptionExpired;

  useEffect(() => {
    if (!effectiveSubscription) { setLoadingUsage(false); return; }

    async function fetchUsage() {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { count, error } = await supabase
        .from('member_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .eq('is_member_pass', true)
        .eq('status', 'confirmed')
        .gte('booking_date', monthStart)
        .not('service_name', 'ilike', '%Welcome%');

      if (!error && count !== null) setPassesUsed(count);
      setLoadingUsage(false);
    }
    fetchUsage();
  }, [member.id, effectiveSubscription]);

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

      // Refresh member data instead of full page reload
      setTimeout(() => {
        onSubscriptionChange?.();
      }, 1500);
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
          Your {PASS_LIMITS[selectedTier]} monthly passes are now available.
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

  // ── EXPIRED SUBSCRIPTION — SHOW RENEWAL + PURCHASE OPTIONS ──
  if (subscriptionExpired) {
    return (
      <div>
        <h2
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--ea-midnight)' }}
        >
          <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
          Member Passes
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            Expired
          </span>
        </h2>
        <div className="p-4 rounded-xl bg-white border border-red-100 text-center space-y-3 mb-3">
          <p className="text-sm font-medium text-red-600">
            Your {member.subscription_tier === 'gold' ? 'Gold' : 'Silver'} subscription expired
          </p>
          <p className="text-xs text-gray-400">Renew below to restore your passes.</p>
        </div>
        {renderTierCards()}
      </div>
    );
  }

  // ── NO SUBSCRIPTION — SHOW PURCHASE OPTIONS ──
  if (!effectiveSubscription) {
    return (
      <div>
        <h2
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--ea-midnight)' }}
        >
          <Star size={16} style={{ color: 'var(--ea-emerald)' }} />
          Member Passes
        </h2>
        {renderTierCards()}
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
        {member.subscription_tier === 'gold' ? 'Gold' : 'Silver'} Passes
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
        <div className="p-4 rounded-xl bg-white border border-gray-100 space-y-2">
          <p className="text-sm font-semibold text-ea-midnight">Your membership is active!</p>
          <p className="text-xs text-gray-500">
            Book any eligible Day Pass below and your member discount will be applied automatically at checkout.
          </p>
        </div>
      )}
    </div>
  );

  function renderTierCards() {
    return (
      <div className="space-y-2">
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
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>Silver Pass</p>
            <p className="text-[11px] text-gray-400">5 included day passes per month</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>$25/mo</p>
            <p className="text-[10px] text-gray-400">Subscribe →</p>
          </div>
        </button>
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
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>Gold Pass</p>
            <p className="text-[11px] text-gray-400">10 included day passes per month</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: 'var(--ea-spirulina)' }}>$50/mo</p>
            <p className="text-[10px] text-gray-400">Subscribe →</p>
          </div>
        </button>
      </div>
    );
  }
}
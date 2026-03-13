import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Gift, Ticket } from 'lucide-react';
import { TIER_CONFIG, type MembershipTier } from '../../lib/types';

interface StepTierProps {
  selectedTier: MembershipTier;
  onTierChange: (tier: MembershipTier) => void;
  onComplete: () => void;
  loading: boolean;
}

export function StepTier({ selectedTier, onTierChange, onComplete, loading }: StepTierProps) {
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = () => {
    setCouponError('');
    if (coupon.trim().toUpperCase() === 'INNERPATH') {
      setCouponApplied(true);
      onTierChange('weekly');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const tiers: MembershipTier[] = ['weekly', 'monthly', 'seasonal', 'annual'];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}>
        Choose Your Membership
      </h2>
      <p className="text-[11px] text-gray-500">
        Membership includes: spring water, market access, and booking portal. All experiences require advance booking.
      </p>

      {couponApplied && (
        <div
          className="p-3 rounded-lg text-sm text-white font-medium"
          style={{ backgroundColor: 'var(--ea-emerald)' }}
        >
          ✨ Inner Path Welcome — Complimentary day pass membership — FREE
        </div>
      )}

      <div className="space-y-2">
        {tiers.map((tier) => {
          const config = TIER_CONFIG[tier];
          const isSelected = selectedTier === tier;
          const isAnnual = tier === 'annual';
          const displayPrice = couponApplied && tier === 'weekly' ? 0 : config.price;

          return (
            <button
              key={tier}
              onClick={() => { if (!couponApplied) onTierChange(tier); }}
              className="w-full text-left p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: isSelected ? (isAnnual ? 'var(--ea-gold)' : 'var(--ea-emerald)') : '#E5E7EB',
                backgroundColor: isAnnual ? '#FBF5E8' : isSelected ? '#F0FDF4' : 'white',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--ea-midnight)' }}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {config.days} days
                    </span>
                  </div>
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: isAnnual ? 'var(--ea-gold)' : 'var(--ea-emerald)' }}
                >
                  {couponApplied && tier === 'weekly' ? 'FREE' : `$${displayPrice}`}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 ml-7">{config.description}</p>
              {isAnnual && (
                <span className="inline-block text-[9px] font-bold uppercase mt-1 ml-7 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--ea-gold)', color: 'white' }}>
                  Recommended
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Coupon code */}
      {!couponApplied && (
        <div className="flex items-center gap-2">
          <Ticket size={16} className="text-gray-400 shrink-0" />
          <Input
            placeholder="Have a coupon code?"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="text-sm bg-slate-50"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyCoupon}
            className="shrink-0"
          >
            Apply
          </Button>
        </div>
      )}
      {couponError && (
        <p className="text-xs text-red-500">{couponError}</p>
      )}

      <Button
        onClick={onComplete}
        className="w-full text-white rounded-lg h-12"
        style={{ backgroundColor: 'var(--ea-emerald)' }}
        disabled={loading}
      >
        {loading ? 'Setting up membership...' : 'Complete Membership →'}
      </Button>

      {/* Welcome credits banner */}
      <div
        className="p-4 rounded-xl text-white text-center"
        style={{
          background: 'linear-gradient(135deg, var(--ea-emerald), var(--ea-spirulina))',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Gift size={18} />
          <span className="text-sm font-semibold">Welcome Credits</span>
        </div>
        <p className="text-xs opacity-90">
          New members receive: 1 free 2-hr Day Pass + 1 free $10 Event
        </p>
      </div>
    </div>
  );
}

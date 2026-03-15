import { useState } from 'react';
import { ArrowUp, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Member, MembershipTier } from '@/lib/types';
import { TIER_CONFIG } from '@/lib/types';
import { PaymentForm } from '../booking/PaymentForm';

interface MembershipUpgradeProps {
  member: Member;
  onComplete: () => void;
  onClose: () => void;
  mode: 'upgrade' | 'extend';
}

const TIER_ORDER: MembershipTier[] = ['weekly', 'monthly', 'seasonal', 'annual'];

export function MembershipUpgrade({ member, onComplete, onClose, mode }: MembershipUpgradeProps) {
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [step, setStep] = useState<'select' | 'pay'>('select');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const currentIndex = TIER_ORDER.indexOf(member.membership_tier);
  const availableTiers = mode === 'upgrade'
    ? TIER_ORDER.filter((_, i) => i > currentIndex)
    : [member.membership_tier];

  const activeTier = mode === 'extend' ? member.membership_tier : selectedTier;
  const activeConfig = activeTier ? TIER_CONFIG[activeTier] : null;

  const handlePaymentSuccess = async (opaqueData: { dataDescriptor: string; dataValue: string }) => {
    if (!activeTier || !activeConfig) return;
    setProcessing(true);
    setError('');

    try {
      // Call edge function to process payment + update membership
      const { data, error: fnError } = await supabase.functions.invoke('upgrade-membership', {
        body: {
          opaqueData,
          tier: activeTier,
          memberId: member.id,
          email: member.email,
          memberName: `${member.first_name} ${member.last_name}`,
          mode,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setDone(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const proceedToPay = () => {
    if (mode === 'extend' || selectedTier) {
      setStep('pay');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            {mode === 'upgrade' ? 'Upgrade Membership' : 'Extend Membership'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DCFCE7' }}>
              <Check size={24} style={{ color: '#16a34a' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--ea-midnight)' }}>
              {mode === 'upgrade' ? 'Membership upgraded!' : 'Membership extended!'}
            </p>
          </div>
        ) : step === 'pay' && activeConfig ? (
          <>
            {/* Payment step */}
            <div className="px-3 py-2.5 rounded-xl border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--ea-midnight)' }}>
                {activeConfig.emoji} {activeConfig.label} — ${activeConfig.price}
              </p>
              <p className="text-[10px] text-gray-500">
                {mode === 'upgrade' ? 'Upgrading from ' + TIER_CONFIG[member.membership_tier].label : `+${activeConfig.days} days`}
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <PaymentForm
              amount={`$${activeConfig.price}`}
              onPaymentSuccess={handlePaymentSuccess}
              loading={processing}
            />

            <button
              onClick={() => setStep('select')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
          </>
        ) : (
          <>
            {/* Selection step */}
            <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-[11px] text-gray-400 mb-0.5">Current</p>
              <p className="text-sm font-medium" style={{ color: 'var(--ea-midnight)' }}>
                {TIER_CONFIG[member.membership_tier].emoji} {TIER_CONFIG[member.membership_tier].label} — ${TIER_CONFIG[member.membership_tier].price}
              </p>
              <p className="text-[11px] text-gray-400">
                Expires {new Date(member.membership_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {mode === 'upgrade' ? (
              availableTiers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">You're already on the highest tier!</p>
              ) : (
                <div className="space-y-2">
                  {availableTiers.map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const isSelected = selectedTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors text-left"
                        style={{
                          borderColor: isSelected ? 'var(--ea-emerald)' : '#E5E7EB',
                          backgroundColor: isSelected ? '#F0FDF4' : 'white',
                        }}
                      >
                        <span className="text-lg">{config.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--ea-midnight)' }}>
                            {config.label}
                          </p>
                          <p className="text-[11px] text-gray-500">{config.description}</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
                          ${config.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="px-3 py-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--ea-emerald)' }}>
                <p className="text-xs text-gray-500">
                  Extending adds <strong>{TIER_CONFIG[member.membership_tier].days} days</strong> from your current expiration date for <strong>${TIER_CONFIG[member.membership_tier].price}</strong>.
                </p>
              </div>
            )}

            <button
              onClick={proceedToPay}
              disabled={mode === 'upgrade' && !selectedTier}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--ea-emerald)' }}
            >
              <ArrowUp size={14} />
              {mode === 'upgrade'
                ? `Upgrade to ${selectedTier ? TIER_CONFIG[selectedTier].label : '…'} — $${selectedTier ? TIER_CONFIG[selectedTier].price : ''}`
                : `Extend — $${TIER_CONFIG[member.membership_tier].price}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

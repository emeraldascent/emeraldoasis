import { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface StepAgreementProps {
  onNext: () => void;
}

const PMA_AGREEMENT = `EMERALD OASIS CLUB
PRIVATE MEMBERSHIP AGREEMENT

══════════════════════════════════════

I. PRIVATE ASSOCIATION STATUS

Emerald Oasis Club operates as a Private Membership Association (PMA) at Mandala Springs, a 67-acre USDA Certified Organic farm in Barnardsville, NC. By joining, you acknowledge:

• This is NOT a public accommodation or commercial business
• This is a private contractual community operating under contract law
• Access is restricted to registered members only
• I am voluntarily choosing to become a private member

══════════════════════════════════════

II. MEMBERSHIP DUES & CONSIDERATION

Your contribution supports land stewardship and sanctuary infrastructure:

☀ Weekly — $2 (7 days access)
🌕 Monthly — $4 (30 days access)
🌳 Seasonal — $10 (90 days access)
🌲 Annual — $20 (365 days access) ← Recommended

══════════════════════════════════════

III. MEMBER ACCESS

Your membership grants the following privileges:

💧 Spring Water — Unlimited fill-ups (15-min parking limit)
📱 Booking Access — Exclusive ability to reserve Camping, Sauna, and Day Passes

EXTENDED VISITS (Booking Required):
🥾 Oasis Day Pass — Hiking, Swimming, Gardens & Zen Lounge
🏕 Camping — Overnight via booking portal
🔥 Sauna & Cold Plunge — Booking required
📅 Classes & Events — See schedule

ACCESS RULES:
✓ Camping bookings automatically include Oasis Pass access
✓ Oasis Day Pass, Sauna Booking, or Event Ticket required for all other extended visits
⚠ PARKING ALERT: Parking is limited and zoned by activity. All extended visits must be booked in advance to guarantee a spot.

GUEST POLICY:
• Members are responsible for their guests
• Non-member guests must join and sign this agreement prior to entry
• Member assumes full liability for any unauthorized guests

══════════════════════════════════════

IV. COMMUNITY GUIDELINES

🤫 Quiet Hours: 9:00 PM – 9:00 AM
🚭 Substance-free & dry compound — no alcohol, illicit substances, smoking, or vaping
🐕 All guest dogs must remain leashed; resident dogs are working farm animals
👶 Supervise children at all times
📵 No photography of others without consent
💚 Be kind and respectful
🚗 Park in designated areas only
🔊 No amplified music or generators

══════════════════════════════════════

V. ENVIRONMENTAL RULES

Mandala Springs is a USDA Certified Organic Forest Farm.

🚶 Stay on marked trails
🦋 Do not feed or disturb wildlife
🍄 No foraging without permission
🗑 Leave No Trace — pack out all trash
🚽 Use composting toilets only
🔥 Fires in designated metal rings only
💧 No soaps, shampoos, or chemicals in streams or springs
🌿 Use natural repellents and cleaners only
☀ No chemical sunscreens, DEET, pesticides
🚫 No single-use plastic water bottles

══════════════════════════════════════

VI. LIABILITY WAIVER & ASSUMPTION OF RISK

AGRITOURISM WARNING (NC Gen. Stat. § 99E-32):
"WARNING — Under North Carolina law, there is no liability for an injury to or death of a participant in an agritourism activity conducted at this agritourism location if such injury or death results from the inherent risks of the agritourism activity."

ASSUMPTION OF RISK:
• This is a working forest farm, not a hotel or resort
• Hazards include: uneven terrain, water hazards, wildlife, poisonous plants, falling branches, steep cliffs, creek crossings, inclement weather
• I voluntarily assume all risks, known and unknown

CREEK CROSSING DISCLOSURE:
Camping-side access requires crossing Mineral Creek via a primitive footbridge. Water levels vary. In high-water conditions, access may be restricted.

RAW WATER NOTICE:
• The spring water is raw, living, and unpasteurized
• It is regularly tested but not treated or filtered
• I consume it at my own discretion and assume all associated risks

THERMAL THERAPY WAIVER:
• Thermal therapy involves extreme temperature changes
• Buddy system required — at least one other person present at all times
• I assume full responsibility for heat exhaustion, hypothermia, or thermal-related injury
• I will not use thermal facilities while under the influence

MEDICAL DISCLOSURE:
Members who are pregnant, have a seizure disorder, or take medications that impair heat regulation must disclose these conditions to staff before participating.

RELEASE OF LIABILITY:
I hereby release, waive, discharge, and covenant not to sue Emerald Oasis Club, Emerald Ascent LLC, Mandala Springs LLC, and their respective owners, operators, officers, agents, stewards, staff, volunteers, and fellow members from any and all claims arising out of my participation in any activities at the property.

══════════════════════════════════════

VII. INDEMNIFICATION

I agree to indemnify and hold harmless the Released Parties from any claims arising from my actions, my children's actions, my guests' actions, or any breach of this agreement.

══════════════════════════════════════

VIII. MINORS

This agreement covers all minor children accompanying the signing member. I represent that I am the parent or legal guardian and accept all terms on their behalf.

══════════════════════════════════════

IX. MEMBERSHIP TERMINATION

Emerald Oasis Club reserves the right to suspend or revoke any membership at any time for violation of community guidelines. No refund for termination due to cause.

══════════════════════════════════════

X. GOVERNING LAW

This agreement is governed by the laws of North Carolina. Disputes shall be resolved in Buncombe County, NC courts. Good-faith mediation required before litigation.`;

export function StepAgreement({ onNext }: StepAgreementProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold" style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}>
        Member Agreement
      </h2>

      <ScrollArea className="h-[50vh] rounded-lg p-4" style={{ backgroundColor: '#F1F5F9' }}>
        <pre
          className="whitespace-pre-wrap text-[10px] leading-relaxed font-sans"
          style={{ color: 'var(--ea-midnight)' }}
        >
          {PMA_AGREEMENT}
        </pre>
      </ScrollArea>

      <div className="flex items-start gap-3 py-2">
        <Checkbox
          id="pma-agree"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
          className="mt-0.5 border-2"
          style={{ borderColor: 'var(--ea-emerald)' }}
        />
        <label htmlFor="pma-agree" className="text-sm cursor-pointer leading-snug">
          I have read and agree to the Member Agreement
        </label>
      </div>

      <Button
        onClick={onNext}
        disabled={!agreed}
        className="w-full text-white rounded-lg h-12"
        style={{ backgroundColor: agreed ? 'var(--ea-emerald)' : '#9CA3AF' }}
      >
        Continue →
      </Button>
    </div>
  );
}

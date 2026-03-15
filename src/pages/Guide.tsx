import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Car, Droplets, Flame, Volume2, Dog, Trash2,
  ShieldAlert, Phone, Map, ChevronDown, ChevronRight,
  Sun, Tent, Store, Sofa, CircleDot,
} from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';

/* ── Amenity cards ─────────────────────────────────────── */

interface Amenity {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  details: string[];
  bookLabel?: string;
  bookPath?: string;
  icon: React.ReactNode;
}

const AMENITIES: Amenity[] = [
  {
    id: 'oasis-pass',
    name: 'Oasis Pass',
    emoji: '☀️',
    tagline: 'Day access to the full property',
    icon: <Sun size={18} />,
    details: [
      '2-, 4-, 6-, or 8-hour passes available',
      'Spring water fill-ups, trails & swimming hole',
      'Zen Lounge with WiFi & coworking',
      'Emerald Market access',
      'Starting at $4 / visit',
    ],
    bookLabel: 'Book an Oasis Pass',
    bookPath: '/book',
  },
  {
    id: 'campground',
    name: 'Campground',
    emoji: '⛺',
    tagline: 'Primitive creekside & wooded sites',
    icon: <Tent size={18} />,
    details: [
      '5 individual sites + 2 group sites',
      'Carry-in access across Mineral Creek footbridge',
      'Fire rings at every site',
      'Composting toilets nearby',
      '$20–$60 / night depending on site',
    ],
    bookLabel: 'Reserve a Campsite',
    bookPath: '/book',
  },
  {
    id: 'sauna',
    name: 'Sauna',
    emoji: '🔥',
    tagline: 'Wood-fired & electric cedar saunas',
    icon: <Flame size={18} />,
    details: [
      'Wood-fired community sauna — fits up to 13',
      'Electric cedar sauna — private, 2-person',
      'Cold plunge in Mineral Creek',
      'Buddy system required — never use alone',
      'Included with Oasis Pass or camping stay',
    ],
  },
  {
    id: 'zen-lounge',
    name: 'Zen Lounge',
    emoji: '🧘',
    tagline: 'Coworking, WiFi & relaxation',
    icon: <Sofa size={18} />,
    details: [
      'Indoor seating with WiFi & power',
      'Quiet workspace during the day',
      'Refreshments available downstairs during market hours',
      'Open to all pass holders & campers',
    ],
  },
  {
    id: 'emerald-market',
    name: 'Emerald Market',
    emoji: '🌿',
    tagline: 'Local goods & provisions',
    icon: <Store size={18} />,
    details: [
      'Locally sourced snacks & drinks',
      'Handmade crafts & wellness products',
      'Provisions & trail supplies',
      'Open during select hours',
    ],
  },
  {
    id: 'guest-policy',
    name: 'Bringing Guests',
    emoji: '👥',
    tagline: 'How to invite friends & family',
    icon: <Sun size={18} />,
    details: [
      'Guests must sign up as a member (free) before visiting — they need to sign the PMA waiver in the app',
      '🎁 Every new member gets 1 free Oasis Pass when they sign up — this is how a guest\'s first visit is free',
      'For return visits, you (the inviting member) must purchase an Oasis Pass for your guest',
      'Have your guest tap "Become a Member" in the app before they arrive',
      'No unregistered visitors allowed on property',
    ],
    bookLabel: 'Book a Guest Pass',
    bookPath: '/book',
  },
];

/* ── Property rules data ───────────────────────────────── */

interface RuleSection {
  title: string;
  icon: React.ReactNode;
  items: string[];
}

const RULE_GROUPS: { heading: string; sections: RuleSection[] }[] = [
  {
    heading: 'Getting Here',
    sections: [
      {
        title: 'Location',
        icon: <MapPin size={14} />,
        items: [
          '445 Stoney Fork Rd, Barnardsville, NC 28709',
          '25 minutes from downtown Asheville',
        ],
      },
      {
        title: 'Parking',
        icon: <Car size={14} />,
        items: [
          'Spring water fill-ups: 30-minute parking limit',
          'Lower Lot — 5 camping, 2 market spots',
          'Main Lot — 7 spots for events & day pass',
          'All extended visits require advance booking',
        ],
      },
      {
        title: 'Creek Crossing',
        icon: <Droplets size={14} />,
        items: [
          'Campsites accessed via footbridge over Mineral Creek',
          'Carry-in only — no vehicle access',
          'Wear appropriate footwear',
        ],
      },
    ],
  },
  {
    heading: 'Hours & Conduct',
    sections: [
      {
        title: 'Hours',
        icon: <Clock size={14} />,
        items: [
          'Property open 7:00 AM – 9:00 PM daily',
          'Quiet hours: 9:00 PM – 9:00 AM',
          'No amplified music during quiet hours',
        ],
      },
      {
        title: 'Dogs',
        icon: <Dog size={14} />,
        items: [
          'Guest dogs must be leashed at all times',
          'Resident farm dogs roam off-leash',
          'Clean up after your pet',
        ],
      },
      {
        title: 'No Alcohol or Smoking',
        icon: <ShieldAlert size={14} />,
        items: [
          'No alcohol, smoking, or vaping on property',
        ],
      },
      {
        title: 'Clothing Optional',
        icon: <Volume2 size={14} />,
        items: [
          'Clothing optional at sauna & swimming hole only',
          'Respect others and use discretion',
        ],
      },
    ],
  },
  {
    heading: 'Land Stewardship',
    sections: [
      {
        title: 'Leave No Trace',
        icon: <Trash2 size={14} />,
        items: [
          'Pack in, pack out — no guest trash cans',
          'Use composting toilets only',
          'No single-use plastic water bottles',
        ],
      },
      {
        title: 'No Chemicals Near Water',
        icon: <Droplets size={14} />,
        items: [
          'USDA Certified Organic — no soaps or sunscreens near water',
          'No DEET, pesticides, or synthetic sprays',
        ],
      },
      {
        title: 'Fire Safety',
        icon: <Flame size={14} />,
        items: [
          'Fires in designated metal fire rings only',
          'Fully extinguish before leaving',
          'No fires during burn bans',
        ],
      },
    ],
  },
  {
    heading: 'Emergency',
    sections: [
      {
        title: 'Emergency Contact',
        icon: <Phone size={14} />,
        items: [
          'Call 911 first for any emergency',
          'Property: (508) 365-8456',
          '445 Stoney Fork Rd, Barnardsville, NC 28709',
          'Nearest hospital: Mission Hospital (~30 min)',
        ],
      },
    ],
  },
];

/* ── Amenity Card component ────────────────────────────── */

function AmenityCard({ amenity }: { amenity: Amenity }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-colors text-left">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-lg"
            style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
          >
            {amenity.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              {amenity.name}
            </p>
            <p className="text-[11px] text-muted-foreground">{amenity.tagline}</p>
          </div>
          <div className="shrink-0 text-muted-foreground transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown size={16} />
          </div>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1">
        <div className="px-4 pt-2 pb-3 ml-14 space-y-2">
          <ul className="space-y-1">
            {amenity.details.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <CircleDot size={8} className="mt-1 shrink-0 opacity-40" />
                {d}
              </li>
            ))}
          </ul>
          {amenity.bookPath && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(amenity.bookPath!); }}
              className="mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--ea-birch)', color: 'var(--ea-emerald)' }}
            >
              {amenity.bookLabel} →
            </button>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/* ── Collapsible Rule Group ────────────────────────────── */

function RuleGroup({ heading, sections }: { heading: string; sections: RuleSection[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button className="w-full flex items-center justify-between py-2">
          <h2
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: 'var(--ea-spirulina)' }}
          >
            {heading}
          </h2>
          <div className="text-muted-foreground">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
        <div className="space-y-2 pb-2">
          {sections.map((section) => (
            <div key={section.title} className="bg-card rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ color: 'var(--ea-emerald)' }}>{section.icon}</div>
                <h3 className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-1 ml-5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground leading-relaxed list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export function Guide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1
            className="text-lg mb-0.5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Explore
          </h1>
          <p className="text-xs text-muted-foreground">
            Emerald Oasis @ Mandala Springs
          </p>
        </div>

        {/* Map link */}
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#F0FDF4', color: 'var(--ea-emerald)' }}
          >
            <Map size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>Property & Trail Map</p>
            <p className="text-[11px] text-muted-foreground">View campsites, trails & base camp</p>
          </div>
          <span className="ml-auto text-muted-foreground text-sm">→</span>
        </button>

        {/* Amenity Cards */}
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-wide mb-2"
            style={{ color: 'var(--ea-spirulina)' }}
          >
            Amenities
          </h2>
          <div className="space-y-2">
            {AMENITIES.map((a) => (
              <AmenityCard key={a.id} amenity={a} />
            ))}
          </div>
        </div>

        {/* PMA Reminder */}
        <div
          className="p-3 rounded-xl text-center"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ea-emerald)' }}>
            🌿 All visitors must be active PMA members before arriving
          </p>
        </div>

        {/* Collapsible Property Rules */}
        <div>
          <div className="space-y-1">
            {RULE_GROUPS.map((group) => (
              <RuleGroup key={group.heading} heading={group.heading} sections={group.sections} />
            ))}
          </div>
        </div>

        {/* Nearby */}
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center justify-between py-2">
              <h2
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: 'var(--ea-spirulina)' }}
              >
                Nearby
              </h2>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden">
            <div className="bg-card rounded-lg border border-border p-3 mb-2">
              <ul className="space-y-1.5">
                {[
                  ['Big Ivy / FS Road 74 trails', '15 min'],
                  ['Downtown Barnardsville', '10 min'],
                  ['Downtown Asheville', '25 min'],
                  ['Douglas Falls', '45 min'],
                ].map(([name, time]) => (
                  <li key={name} className="text-xs text-muted-foreground flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium opacity-60">{time}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                ⚠️ FS Road 74 is seasonally gated Jan 1 – Apr 1
              </p>
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  );
}

import { Button } from '../components/ui/button';

const SIMPLYBOOK_URL = 'https://emeraldoasiscamp.simplybook.me/v2/';

const experiences = [
  {
    emoji: '🥾',
    title: 'Oasis Day Pass',
    description: 'Hiking, swimming, gardens & zen lounge',
    pricing: '2hr / 4hr / 8hr blocks',
    color: 'var(--ea-emerald)',
    bg: '#F0FDF4',
  },
  {
    emoji: '🔥',
    title: 'Sauna & Cold Plunge',
    description: 'Wood-fire & electric sauna + Mineral Creek plunge',
    pricing: 'Electric: $60/hr · Wood-fire: $40/2hrs',
    color: 'var(--ea-spirulina)',
    bg: '#F0FDFA',
  },
  {
    emoji: '🏕️',
    title: 'Camping',
    description: 'Primitive sites along Mineral Creek in the forest',
    pricing: 'Sites 2–8, Zome, and Yome available',
    color: 'var(--ea-sage)',
    bg: '#F1F5F0',
  },
  {
    emoji: '📅',
    title: 'Events & Classes',
    description: 'Yoga, workshops, and community gatherings',
    pricing: 'Check schedule for upcoming events',
    color: 'var(--ea-lilac)',
    bg: '#EDEEF8',
  },
];

export function Book() {
  const handleBook = () => {
    window.open(SIMPLYBOOK_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="text-center mb-2">
          <h1
            className="text-lg mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Book an Experience
          </h1>
          <p className="text-xs text-gray-500">
            All experiences require advance booking
          </p>
        </div>

        {experiences.map((exp) => (
          <div
            key={exp.title}
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: exp.bg, borderColor: '#E5E7EB' }}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{exp.emoji}</span>
                <div className="flex-1">
                  <h3
                    className="text-sm font-bold mb-0.5"
                    style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}
                  >
                    {exp.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">{exp.description}</p>
                  <p className="text-[11px] font-medium" style={{ color: exp.color }}>
                    {exp.pricing}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBook}
                className="w-full mt-3 text-white rounded-lg h-10"
                style={{ backgroundColor: exp.color }}
              >
                Book Now →
              </Button>
            </div>
          </div>
        ))}

        <p className="text-[10px] text-center text-gray-400 pt-2">
          Booking powered by SimplyBook · Camping includes Oasis Pass access
        </p>
      </div>
    </div>
  );
}

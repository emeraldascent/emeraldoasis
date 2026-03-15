import { MapPin, Clock, Car, Droplets, Flame, Volume2, Dog, Trash2, ShieldAlert, Phone, Map, Sparkles, CalendarCheck, Users, Tent, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuideSection {
  title: string;
  icon: React.ReactNode;
  items: string[];
}

const GUIDE_SECTIONS: { heading: string; sections: GuideSection[] }[] = [
  {
    heading: 'Getting Here',
    sections: [
      {
        title: 'Location',
        icon: <MapPin size={16} />,
        items: [
          '445 Stoney Fork Rd, Barnardsville, NC 28709',
          '25 minutes from downtown Asheville',
          'Stoney Fork Road is a public through-road — follow signs to Emerald Oasis',
        ],
      },
      {
        title: 'Parking',
        icon: <Car size={16} />,
        items: [
          '21 total parking spots across 3 driveways',
          '7 spots reserved for camping guests',
          'Spring water fill-ups: 15-minute parking limit',
          'All extended visits require advance booking',
        ],
      },
      {
        title: 'Creek Crossing',
        icon: <Droplets size={16} />,
        items: [
          'Campsites are accessed by crossing Mineral Creek via footbridge',
          'Carry-in only — no vehicle access to camping side',
          'Water levels vary with rainfall; access may be restricted in high water',
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
        icon: <Clock size={16} />,
        items: [
          'Property open 7:00 AM – 9:00 PM daily',
          'Booked campers have extended access',
          'Quiet hours: 9:00 PM – 9:00 AM',
          'No amplified music or generators during quiet hours',
        ],
      },
      {
        title: 'Dogs',
        icon: <Dog size={16} />,
        items: [
          'Guest dogs must be leashed at all times',
          'Resident farm dogs roam off-leash — they are working animals',
          'Clean up after your pet',
        ],
      },
      {
        title: 'Clothing Optional',
        icon: <Volume2 size={16} />,
        items: [
          'Clothing optional at sauna and swimming hole areas only',
          'Respect other members and use discretion',
        ],
      },
      {
        title: 'No Alcohol or Smoking',
        icon: <ShieldAlert size={16} />,
        items: [
          'No alcohol, smoking, or vaping on the property',
          'Cannabis products from our apothecary are the exception',
        ],
      },
    ],
  },
  {
    heading: 'Land Stewardship',
    sections: [
      {
        title: 'Leave No Trace',
        icon: <Trash2 size={16} />,
        items: [
          'Pack in, pack out — no guest trash cans on property',
          'Use composting toilets only',
          'Leave every space better than you found it',
          'No single-use plastic water bottles',
        ],
      },
      {
        title: 'No Chemicals Near Water',
        icon: <Droplets size={16} />,
        items: [
          'Mandala Springs is USDA Certified Organic',
          'No soaps, shampoos, or chemical sunscreens near water sources',
          'No DEET, pesticides, or synthetic sprays',
          'Natural alternatives only — ask staff for recommendations',
        ],
      },
      {
        title: 'Fire Safety',
        icon: <Flame size={16} />,
        items: [
          'Fires permitted in designated metal fire rings only',
          'Never leave a fire unattended',
          'Fully extinguish before leaving — drown, stir, feel',
          'No fires during burn bans',
        ],
      },
    ],
  },
  {
    heading: 'Water & Wellness',
    sections: [
      {
        title: 'Spring Water',
        icon: <Droplets size={16} />,
        items: [
          'Living mountain spring water — raw, unpasteurized',
          'Regularly tested for safety',
          'Unlimited fill-ups included with membership',
          'Consumed at your own discretion',
        ],
      },
      {
        title: 'Sauna & Cold Plunge',
        icon: <Flame size={16} />,
        items: [
          'Electric cedar sauna (private, 2-person)',
          'Wood-fired sauna (community, up to 13)',
          'Cold plunge in Mineral Creek',
          'Buddy system required — never use thermal facilities alone',
          'Consult your doctor if you have heart conditions, are pregnant, or take heat-regulation medications',
        ],
      },
    ],
  },
  {
    heading: 'Emergency & Contact',
    sections: [
      {
        title: 'Emergency',
        icon: <Phone size={16} />,
        items: [
          'Call 911 first for any emergency',
          'Nearest hospital: Mission Hospital, Asheville (~30 min)',
          'Property contact: (508) 365-8456',
          'Address for dispatch: 445 Stoney Fork Rd, Barnardsville, NC 28709',
          'First aid kit located at the main hub',
        ],
      },
    ],
  },
];

export function Guide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-lg mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Property Guide
          </h1>
          <p className="text-xs text-gray-400">
            Emerald Oasis @ Mandala Springs
          </p>
        </div>

        {/* Map Link */}
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#F0FDF4', color: 'var(--ea-emerald)' }}
          >
            <Map size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
              Property & Trail Map
            </p>
            <p className="text-[11px] text-gray-400">View campsites, trails, and base camp</p>
          </div>
          <span className="ml-auto text-gray-300">→</span>
        </button>

        {/* PMA Reminder */}
        <div
          className="p-3 rounded-xl mb-6 text-center"
          style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ea-emerald)' }}>
            🌿 All visitors must be active PMA members before arriving on property
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {GUIDE_SECTIONS.map((group) => (
            <div key={group.heading}>
              <h2
                className="text-sm font-bold mb-3 uppercase tracking-wide"
                style={{ color: 'var(--ea-spirulina)' }}
              >
                {group.heading}
              </h2>
              <div className="space-y-3">
                {group.sections.map((section) => (
                  <div
                    key={section.title}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ color: 'var(--ea-emerald)' }}>{section.icon}</div>
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: 'var(--ea-midnight)' }}
                      >
                        {section.title}
                      </h3>
                    </div>
                    <ul className="space-y-1.5 ml-6">
                      {section.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-600 leading-relaxed list-disc"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Nearby */}
        <div className="mt-6">
          <h2
            className="text-sm font-bold mb-3 uppercase tracking-wide"
            style={{ color: 'var(--ea-spirulina)' }}
          >
            Nearby
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <ul className="space-y-1.5">
              <li className="text-xs text-gray-600 flex justify-between">
                <span>Big Ivy / FS Road 74 trails</span>
                <span className="text-gray-400 font-medium">15 min</span>
              </li>
              <li className="text-xs text-gray-600 flex justify-between">
                <span>Downtown Barnardsville</span>
                <span className="text-gray-400 font-medium">10 min</span>
              </li>
              <li className="text-xs text-gray-600 flex justify-between">
                <span>Downtown Asheville</span>
                <span className="text-gray-400 font-medium">25 min</span>
              </li>
              <li className="text-xs text-gray-600 flex justify-between">
                <span>Douglas Falls</span>
                <span className="text-gray-400 font-medium">45 min</span>
              </li>
            </ul>
            <p className="text-[10px] text-gray-400 mt-2">
              ⚠️ FS Road 74 is seasonally gated Jan 1 – Apr 1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

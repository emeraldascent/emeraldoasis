import { Separator } from '../components/ui/separator';

const sections = [
  {
    emoji: '🕐',
    title: 'Hours',
    content: 'Open 7 AM – 9 PM daily. Extended hours may apply for booked campers.',
  },
  {
    emoji: '📍',
    title: 'Address',
    content: '445 Stoney Fork Rd, Barnardsville, NC 28709. 25 minutes from Asheville.',
  },
  {
    emoji: '🅿️',
    title: 'Parking',
    content: 'Park in designated lots only. 7 spots reserved for camping. All extended visits must be booked in advance to guarantee a spot.',
  },
  {
    emoji: '🌊',
    title: 'Creek Crossing',
    content: 'Camping-side access requires crossing Mineral Creek via a primitive footbridge. Water levels vary. In high-water conditions, access may be restricted. Carry gear across.',
  },
  {
    emoji: '💧',
    title: 'Spring Water',
    content: 'Living mountain spring water — raw, unpasteurized, regularly tested. Unlimited fill-ups with a 15-minute parking limit. Consumed at your own discretion.',
  },
  {
    emoji: '🤫',
    title: 'Quiet Hours',
    content: '9:00 PM – 9:00 AM. No amplified music or generators. Be kind and respectful of fellow members.',
  },
  {
    emoji: '🐕',
    title: 'Dog Policy',
    content: 'All guest dogs must remain leashed at all times. Resident farm dogs are working animals and roam off-leash. Clean up after your pet.',
  },
  {
    emoji: '🗑️',
    title: 'Leave No Trace',
    content: 'Pack in, pack out. There are no guest trash cans. Use composting toilets only. Leave every space better than you found it.',
  },
  {
    emoji: '🧴',
    title: 'No Chemicals',
    content: 'Mandala Springs is USDA Certified Organic. No soaps, shampoos, chemical sunscreens, DEET, or pesticides near water sources. Use natural alternatives only. No single-use plastic water bottles.',
  },
  {
    emoji: '🔥',
    title: 'Fire Safety',
    content: 'Fires permitted in designated metal fire rings only. Never leave a fire unattended. Fully extinguish before leaving.',
  },
  {
    emoji: '🏊',
    title: 'Clothing Optional',
    content: 'Clothing optional at sauna and swimming hole areas only. Please respect other members and use discretion.',
  },
  {
    emoji: '🚨',
    title: 'Emergency',
    content: 'In case of emergency, call 911 first. Property contact: reach staff at the main area. Nearest hospital: Mission Hospital, Asheville (~30 min).',
  },
];

export function Guide() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        <div className="text-center mb-5">
          <h1
            className="text-lg mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Property Guide
          </h1>
          <p className="text-xs text-gray-500">
            Everything you need to know on-site
          </p>
        </div>

        <div className="space-y-2">
          {sections.map((section, i) => (
            <div key={section.title}>
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'var(--ea-birch)' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{section.emoji}</span>
                  <div>
                    <h3
                      className="text-sm font-bold mb-1"
                      style={{ color: 'var(--ea-midnight)', fontFamily: 'Inter, sans-serif' }}
                    >
                      {section.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
              {i < sections.length - 1 && <Separator className="my-0 opacity-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

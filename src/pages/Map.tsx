import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { InteractivePropertyMap } from '@/components/map/InteractivePropertyMap';
import { KEY_LOCATIONS, CATEGORY_COLORS, type KeyLocation } from '@/config/mapConfig';

const MAP_LAYERS = [
  { id: 'trails' as const, label: 'Property & Trails' },
  { id: 'base' as const, label: 'Base Camp' },
];

export function Map() {
  const [activeLayer, setActiveLayer] = useState<'trails' | 'base'>('trails');
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  const handleLegendTap = (loc: KeyLocation) => {
    setFlyTo([...loc.coords]);
    // Reset so the same location can be tapped again
    setTimeout(() => setFlyTo(null), 700);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-5">
        {/* Header */}
        <div className="text-center mb-4">
          <h1
            className="text-lg mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
          >
            Property Map
          </h1>
          <p className="text-xs text-gray-400">
            Tap markers for details · Use 📍 to see your location
          </p>
        </div>

        {/* Layer toggle */}
        <div className="flex gap-2 mb-4">
          {MAP_LAYERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveLayer(m.id)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors border"
              style={{
                backgroundColor: activeLayer === m.id ? 'var(--ea-emerald)' : 'white',
                color: activeLayer === m.id ? 'white' : 'var(--ea-midnight)',
                borderColor: activeLayer === m.id ? 'var(--ea-emerald)' : '#E5E7EB',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Interactive map */}
        <InteractivePropertyMap
          mapLayer={activeLayer}
          flyToCoords={flyTo}
        />

        {/* Legend */}
        <div className="mt-5 bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ea-midnight)' }}>
            Key Locations
          </p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {KEY_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleLegendTap(loc)}
                className="flex items-center gap-2 text-left hover:opacity-70 transition-opacity"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[loc.category] }}
                />
                <span className="text-[11px] text-gray-600 truncate">{loc.icon} {loc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Directions */}
        <div className="mt-4 p-3 rounded-xl text-center" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <a
            href="https://maps.google.com/?q=445+Stoney+Fork+Rd+Barnardsville+NC+28709"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ color: 'var(--ea-emerald)' }}
          >
            <MapPin size={13} />
            Get Directions to Emerald Oasis
          </a>
        </div>
      </div>
    </div>
  );
}

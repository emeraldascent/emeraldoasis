import { useState } from 'react';
import { MapPin, Maximize2, X } from 'lucide-react';

const MAPS = [
  {
    id: 'trails',
    label: 'Property & Trails',
    src: '/property-map-trails.png',
    description: 'Campsites, trails, creek crossing, and Pisgah National Forest access',
  },
  {
    id: 'base',
    label: 'Base Camp',
    src: '/property-map-base.png',
    description: 'Parking, market, sauna, entrance, and camping check-in',
  },
];

export function Map() {
  const [activeMap, setActiveMap] = useState(MAPS[0]);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} />
          </button>
          <img
            src={activeMap.src}
            alt={activeMap.label}
            className="max-w-full max-h-full object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
        </div>
      )}

      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-md mx-auto px-4 py-5">
          {/* Header */}
          <div className="text-center mb-5">
            <h1
              className="text-lg mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--ea-midnight)' }}
            >
              Property Map
            </h1>
            <p className="text-xs text-gray-400">
              Tap the map to zoom · Pinch to explore
            </p>
          </div>

          {/* Map toggle */}
          <div className="flex gap-2 mb-4">
            {MAPS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMap(m)}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors border"
                style={{
                  backgroundColor: activeMap.id === m.id ? 'var(--ea-emerald)' : 'white',
                  color: activeMap.id === m.id ? 'white' : 'var(--ea-midnight)',
                  borderColor: activeMap.id === m.id ? 'var(--ea-emerald)' : '#E5E7EB',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Map image */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
            <button
              onClick={() => setFullscreen(true)}
              className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 shadow-sm border border-gray-100 hover:bg-white transition-colors"
            >
              <Maximize2 size={16} style={{ color: 'var(--ea-midnight)' }} />
            </button>
            <img
              src={activeMap.src}
              alt={activeMap.label}
              className="w-full h-auto cursor-pointer"
              onClick={() => setFullscreen(true)}
            />
          </div>

          {/* Description */}
          <div className="mt-3 flex items-start gap-2 px-1">
            <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--ea-emerald)' }} />
            <p className="text-xs text-gray-500">{activeMap.description}</p>
          </div>

          {/* Legend */}
          <div className="mt-5 bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ea-midnight)' }}>
              Key Locations
            </p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <LegendItem emoji="⛺" label="Campsites 2, 5-8" />
              <LegendItem emoji="🌾" label="Sites 3 & 4 (Meadow)" />
              <LegendItem emoji="🔥" label="Site 7 (Group)" />
              <LegendItem emoji="🌉" label="Creek Crossing" />
              <LegendItem emoji="💧" label="Spring Water" />
              <LegendItem emoji="🧖" label="Sauna Area" />
              <LegendItem emoji="🏪" label="Emerald Market" />
              <LegendItem emoji="🅿️" label="Parking" />
              <LegendItem emoji="📋" label="Info Kiosk" />
              <LegendItem emoji="🌲" label="Pisgah Access" />
              <LegendItem emoji="🚻" label="Composting Toilets" />
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
    </>
  );
}

function LegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{emoji}</span>
      <span className="text-[11px] text-gray-600">{label}</span>
    </div>
  );
}

import { useState } from 'react';
import { MapPin, Maximize2, X } from 'lucide-react';
import { InteractivePropertyMap } from '@/components/map/InteractivePropertyMap';
import { KEY_LOCATIONS, CATEGORY_COLORS, type KeyLocation } from '@/config/mapConfig';

type MapMode = 'interactive' | 'trails' | 'base';

const MAP_LAYERS: { id: MapMode; label: string }[] = [
  { id: 'interactive', label: 'Interactive' },
  { id: 'trails', label: 'Property & Trails' },
  { id: 'base', label: 'Base Camp' },
];

const STATIC_MAPS: Record<string, { src: string; description: string }> = {
  trails: {
    src: '/property-map-trails.png',
    description: 'Campsites, trails, creek crossing, and Pisgah National Forest access',
  },
  base: {
    src: '/property-map-base.png',
    description: 'Parking lots, market, entrance/exit, and camping check-in',
  },
};

export function Map() {
  const [activeMode, setActiveMode] = useState<MapMode>('interactive');
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleLegendTap = (loc: KeyLocation) => {
    if (activeMode !== 'interactive') {
      setActiveMode('interactive');
      setTimeout(() => {
        setFlyTo([...loc.coords]);
        setTimeout(() => setFlyTo(null), 700);
      }, 100);
    } else {
      setFlyTo([...loc.coords]);
      setTimeout(() => setFlyTo(null), 700);
    }
  };

  const staticMap = STATIC_MAPS[activeMode];

  return (
    <>
      {/* Fullscreen overlay for static maps */}
      {fullscreen && staticMap && (
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
            src={staticMap.src}
            alt={activeMode}
            className="max-w-full max-h-full object-contain"
            style={{ touchAction: 'pinch-zoom' }}
          />
        </div>
      )}

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
              {activeMode === 'interactive'
                ? 'Tap markers for details · Use 📍 to see your location'
                : 'Tap image to zoom · Pinch to explore'}
            </p>
          </div>

          {/* Layer toggle */}
          <div className="flex gap-2 mb-4">
            {MAP_LAYERS.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className="flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-colors border"
                style={{
                  backgroundColor: activeMode === m.id ? 'var(--ea-emerald)' : 'white',
                  color: activeMode === m.id ? 'white' : 'var(--ea-midnight)',
                  borderColor: activeMode === m.id ? 'var(--ea-emerald)' : '#E5E7EB',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Map content */}
          {activeMode === 'interactive' ? (
            <InteractivePropertyMap mapLayer="trails" flyToCoords={flyTo} />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
              <button
                onClick={() => setFullscreen(true)}
                className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 shadow-sm border border-gray-100 hover:bg-white transition-colors"
              >
                <Maximize2 size={16} style={{ color: 'var(--ea-midnight)' }} />
              </button>
              <img
                src={staticMap.src}
                alt={activeMode}
                className="w-full h-auto cursor-pointer"
                onClick={() => setFullscreen(true)}
              />
            </div>
          )}

          {/* Description for static maps */}
          {staticMap && (
            <div className="mt-3 flex items-start gap-2 px-1">
              <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--ea-emerald)' }} />
              <p className="text-xs text-gray-500">{staticMap.description}</p>
            </div>
          )}

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
    </>
  );
}

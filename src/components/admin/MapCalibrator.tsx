import { useState, useCallback } from 'react';
import { MapPin, Check, Copy, Loader2, Move, RotateCcw } from 'lucide-react';
import { KEY_LOCATIONS, MAP_CONFIG } from '@/config/mapConfig';

export function MapCalibrator() {
  const [updatedCoords, setUpdatedCoords] = useState<Record<string, [number, number]>>({});
  const [capturing, setCapturing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Overlay adjustment state
  const [overlayBounds, setOverlayBounds] = useState({
    swLat: MAP_CONFIG.imageBounds[0][0],
    swLng: MAP_CONFIG.imageBounds[0][1],
    neLat: MAP_CONFIG.imageBounds[1][0],
    neLng: MAP_CONFIG.imageBounds[1][1],
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayCopied, setOverlayCopied] = useState(false);

  const STEP_COARSE = 0.0005;
  const STEP_FINE = 0.0001;

  const nudge = (corner: 'sw' | 'ne', axis: 'lat' | 'lng', direction: 1 | -1, fine: boolean) => {
    const step = fine ? STEP_FINE : STEP_COARSE;
    const key = `${corner}${axis.charAt(0).toUpperCase()}${axis.slice(1)}` as keyof typeof overlayBounds;
    setOverlayBounds(prev => ({
      ...prev,
      [key]: Math.round((prev[key] + direction * step) * 1000000) / 1000000,
    }));
  };

  const shiftBoth = (axis: 'lat' | 'lng', direction: 1 | -1, fine: boolean) => {
    const step = fine ? STEP_FINE : STEP_COARSE;
    const delta = direction * step;
    if (axis === 'lat') {
      setOverlayBounds(prev => ({
        ...prev,
        swLat: Math.round((prev.swLat + delta) * 1000000) / 1000000,
        neLat: Math.round((prev.neLat + delta) * 1000000) / 1000000,
      }));
    } else {
      setOverlayBounds(prev => ({
        ...prev,
        swLng: Math.round((prev.swLng + delta) * 1000000) / 1000000,
        neLng: Math.round((prev.neLng + delta) * 1000000) / 1000000,
      }));
    }
  };

  const resetOverlay = () => {
    setOverlayBounds({
      swLat: MAP_CONFIG.imageBounds[0][0],
      swLng: MAP_CONFIG.imageBounds[0][1],
      neLat: MAP_CONFIG.imageBounds[1][0],
      neLng: MAP_CONFIG.imageBounds[1][1],
    });
  };

  const exportOverlay = () => {
    const text = `// Updated overlay bounds — paste into mapConfig.ts
imageBounds: [
  [${overlayBounds.swLat}, ${overlayBounds.swLng}] as [number, number],  // SW corner
  [${overlayBounds.neLat}, ${overlayBounds.neLng}] as [number, number],  // NE corner
] as [[number, number], [number, number]],`;
    navigator.clipboard.writeText(text).then(() => {
      setOverlayCopied(true);
      setTimeout(() => setOverlayCopied(false), 2000);
    });
  };

  const capturePosition = useCallback((locId: string) => {
    if (!navigator.geolocation) {
      setError('GPS not available on this device');
      return;
    }
    setCapturing(locId);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          Math.round(pos.coords.latitude * 1000000) / 1000000,
          Math.round(pos.coords.longitude * 1000000) / 1000000,
        ];
        setUpdatedCoords((prev) => ({ ...prev, [locId]: coords }));
        setCapturing(null);
      },
      (err) => {
        setError(err.code === 1 ? 'Location permission denied' : 'Could not get position');
        setCapturing(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  const exportConfig = useCallback(() => {
    const lines = KEY_LOCATIONS.map((loc) => {
      const coords = updatedCoords[loc.id] || loc.coords;
      return `  { id: '${loc.id}', coords: [${coords[0]}, ${coords[1]}] },`;
    });
    const text = `// Updated coordinates — paste into mapConfig.ts\n[\n${lines.join('\n')}\n]`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [updatedCoords]);

  const updatedCount = Object.keys(updatedCoords).length;

  const hasOverlayChanges =
    overlayBounds.swLat !== MAP_CONFIG.imageBounds[0][0] ||
    overlayBounds.swLng !== MAP_CONFIG.imageBounds[0][1] ||
    overlayBounds.neLat !== MAP_CONFIG.imageBounds[1][0] ||
    overlayBounds.neLng !== MAP_CONFIG.imageBounds[1][1];

  return (
    <div className="space-y-4">
      {/* Overlay Adjustment Section */}
      <div>
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200"
        >
          <div className="flex items-center gap-2">
            <Move size={16} style={{ color: 'var(--ea-emerald)' }} />
            <div className="text-left">
              <p className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
                🗺️ Overlay Position
              </p>
              <p className="text-[10px] text-gray-400">Adjust base map alignment</p>
            </div>
          </div>
          <span className="text-gray-400 text-sm">{showOverlay ? '▼' : '▶'}</span>
        </button>

        {showOverlay && (
          <div className="mt-2 p-3 rounded-xl bg-white border border-gray-200 space-y-3">
            {/* Pan controls — shift entire overlay */}
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Pan Overlay (shift both corners)
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => shiftBoth('lat', 1, false)}
                    className="w-10 h-8 rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    ▲
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => shiftBoth('lng', -1, false)}
                      className="w-10 h-8 rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      ◀
                    </button>
                    <button
                      onClick={resetOverlay}
                      className="w-10 h-8 rounded bg-gray-50 text-[9px] text-gray-400 hover:bg-gray-100"
                    >
                      <RotateCcw size={12} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => shiftBoth('lng', 1, false)}
                      className="w-10 h-8 rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={() => shiftBoth('lat', -1, false)}
                    className="w-10 h-8 rounded bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    ▼
                  </button>
                </div>
                {/* Fine arrows */}
                <div className="ml-3 flex flex-col items-center gap-1">
                  <p className="text-[8px] text-gray-400 uppercase">Fine</p>
                  <button
                    onClick={() => shiftBoth('lat', 1, true)}
                    className="w-8 h-6 rounded bg-green-50 text-[10px] text-green-700 hover:bg-green-100"
                  >
                    ▲
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => shiftBoth('lng', -1, true)}
                      className="w-8 h-6 rounded bg-green-50 text-[10px] text-green-700 hover:bg-green-100"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => shiftBoth('lng', 1, true)}
                      className="w-8 h-6 rounded bg-green-50 text-[10px] text-green-700 hover:bg-green-100"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={() => shiftBoth('lat', -1, true)}
                    className="w-8 h-6 rounded bg-green-50 text-[10px] text-green-700 hover:bg-green-100"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Scale/stretch controls */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-gray-50">
                <p className="text-[9px] font-bold text-gray-500 mb-1">SW Corner</p>
                <p className="text-[10px] font-mono text-gray-600">{overlayBounds.swLat}, {overlayBounds.swLng}</p>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => nudge('sw', 'lat', -1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">↓ Lat</button>
                  <button onClick={() => nudge('sw', 'lat', 1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">↑ Lat</button>
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => nudge('sw', 'lng', -1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">← Lng</button>
                  <button onClick={() => nudge('sw', 'lng', 1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">→ Lng</button>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-gray-50">
                <p className="text-[9px] font-bold text-gray-500 mb-1">NE Corner</p>
                <p className="text-[10px] font-mono text-gray-600">{overlayBounds.neLat}, {overlayBounds.neLng}</p>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => nudge('ne', 'lat', -1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">↓ Lat</button>
                  <button onClick={() => nudge('ne', 'lat', 1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">↑ Lat</button>
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => nudge('ne', 'lng', -1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">← Lng</button>
                  <button onClick={() => nudge('ne', 'lng', 1, true)} className="flex-1 h-5 rounded bg-white text-[8px] border border-gray-200">→ Lng</button>
                </div>
              </div>
            </div>

            {/* Export overlay */}
            {hasOverlayChanges && (
              <button
                onClick={exportOverlay}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: overlayCopied ? '#16a34a' : 'var(--ea-emerald)' }}
              >
                {overlayCopied ? <Check size={13} /> : <Copy size={13} />}
                {overlayCopied ? 'Copied!' : 'Export Overlay Bounds'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* GPS Pin Calibrator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            📍 Map Pin Calibrator
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Walk to each spot and tap "Set" to capture GPS coordinates
          </p>
        </div>
        {updatedCount > 0 && (
          <button
            onClick={exportConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: copied ? '#16a34a' : 'var(--ea-emerald)' }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : `Export ${updatedCount}`}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        {KEY_LOCATIONS.map((loc) => {
          const isCapturing = capturing === loc.id;
          const hasUpdate = !!updatedCoords[loc.id];
          const coords = updatedCoords[loc.id] || loc.coords;

          return (
            <div
              key={loc.id}
              className="flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5"
              style={{ borderColor: hasUpdate ? '#BBF7D0' : '#E5E7EB' }}
            >
              <span className="text-lg shrink-0">{loc.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--ea-midnight)' }}>
                  {loc.name}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {coords[0]}, {coords[1]}
                  {hasUpdate && <span className="text-green-600 ml-1">✓ updated</span>}
                </p>
              </div>
              <button
                onClick={() => capturePosition(loc.id)}
                disabled={isCapturing}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: hasUpdate ? '#F0FDF4' : 'white',
                  borderColor: hasUpdate ? '#BBF7D0' : '#E5E7EB',
                  color: 'var(--ea-midnight)',
                }}
              >
                {isCapturing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MapPin size={12} style={{ color: 'var(--ea-emerald)' }} />
                )}
                {isCapturing ? 'Reading…' : 'Set'}
              </button>
            </div>
          );
        })}
      </div>

      {updatedCount > 0 && (
        <p className="text-[11px] text-gray-400 text-center">
          Tap "Export" to copy updated coordinates, then paste into the config
        </p>
      )}
    </div>
  );
}

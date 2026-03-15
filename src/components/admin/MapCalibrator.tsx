import { useState, useCallback } from 'react';
import { MapPin, Check, Copy, Loader2 } from 'lucide-react';
import { KEY_LOCATIONS } from '@/config/mapConfig';

export function MapCalibrator() {
  const [updatedCoords, setUpdatedCoords] = useState<Record<string, [number, number]>>({});
  const [capturing, setCapturing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="space-y-4">
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

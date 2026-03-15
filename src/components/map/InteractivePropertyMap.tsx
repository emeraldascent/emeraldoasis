import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, ImageOverlay, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import {
  MAP_CONFIG,
  KEY_LOCATIONS,
  CATEGORY_COLORS,
  type KeyLocation,
  type LocationCategory,
} from '@/config/mapConfig';

// Fix Leaflet default icon issue with bundlers
import 'leaflet/dist/leaflet.css';

// Create emoji-based markers
function createEmojiIcon(emoji: string, category: LocationCategory) {
  const color = CATEGORY_COLORS[category];
  return L.divIcon({
    className: 'custom-emoji-marker',
    html: `<div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 2.5px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// User location dot
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-location-dot"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Sub-component: recenter map
function RecenterButton({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const handleClick = useCallback(() => {
    if (position) {
      map.flyTo(position, 17, { duration: 0.8 });
    }
  }, [map, position]);

  if (!position) return null;

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-3 z-[1000] w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
      title="Center on my location"
    >
      <Navigation size={18} style={{ color: '#4285F4' }} />
    </button>
  );
}

// Sub-component: fly to location from legend
function FlyToHandler({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 18, { duration: 0.6 });
    }
  }, [target, map]);
  return null;
}

interface InteractivePropertyMapProps {
  mapLayer: 'trails' | 'base';
  onSelectLocation?: (loc: KeyLocation) => void;
  flyToCoords?: [number, number] | null;
}

export function InteractivePropertyMap({ mapLayer, onSelectLocation, flyToCoords }: InteractivePropertyMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const imageUrl = mapLayer === 'trails' ? MAP_CONFIG.trailsMapUrl : MAP_CONFIG.baseCampMapUrl;

  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device');
      return;
    }
    setGpsActive(true);
    setGpsError(null);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        if (err.code === 1) {
          setGpsError('Enable location access in your browser settings to see your position');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }, []);

  useEffect(() => {
    // Auto-start GPS if permission was previously granted
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        startGps();
      }
    }).catch(() => { /* permissions API not supported */ });

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [startGps]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 'calc(100vh - 260px)', minHeight: '340px' }}>
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        {/* Base tile layer at low opacity for road context */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.12}
        />

        {/* Illustrated property map overlay */}
        <ImageOverlay
          url={imageUrl}
          bounds={MAP_CONFIG.imageBounds}
          opacity={0.92}
        />

        {/* Key location markers */}
        {KEY_LOCATIONS.map((loc) => (
          <Marker
            key={loc.id}
            position={loc.coords}
            icon={createEmojiIcon(loc.icon, loc.category)}
            eventHandlers={{
              click: () => onSelectLocation?.(loc),
            }}
          >
            <Popup className="custom-map-popup" closeButton={false}>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 2px', color: '#1a3a2a' }}>
                  {loc.icon} {loc.name}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                  {loc.description}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User location */}
        {userPosition && (
          <>
            <Circle
              center={userPosition}
              radius={Math.min(accuracy, 200)}
              pathOptions={{
                color: 'rgba(66,133,244,0.3)',
                fillColor: 'rgba(66,133,244,0.1)',
                fillOpacity: 0.5,
                weight: 1,
              }}
            />
            <Marker position={userPosition} icon={userLocationIcon} />
          </>
        )}

        <FlyToHandler target={flyToCoords ?? null} />
      </MapContainer>

      {/* GPS button */}
      {!gpsActive ? (
        <button
          onClick={startGps}
          className="absolute bottom-4 right-3 z-[1000] w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
          title="Show my location"
        >
          <Navigation size={18} className="text-gray-500" />
        </button>
      ) : (
        <RecenterButton position={userPosition} />
      )}

      {/* GPS error toast */}
      {gpsError && (
        <div className="absolute bottom-16 left-3 right-3 z-[1000] bg-white/95 rounded-lg px-3 py-2 shadow-md border border-gray-200">
          <p className="text-[11px] text-gray-600 text-center">{gpsError}</p>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
        <ZoomButton dir="in" />
        <ZoomButton dir="out" />
      </div>
    </div>
  );
}

function ZoomButton({ dir }: { dir: 'in' | 'out' }) {
  return (
    <button
      className="zoom-btn w-9 h-9 rounded-lg bg-white/95 shadow border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-white active:scale-95 transition-transform"
      style={{ color: 'var(--ea-midnight)' }}
      data-zoom={dir}
      onClick={(e) => {
        // Walk up to find the leaflet map container and zoom
        const container = (e.target as HTMLElement).closest('.leaflet-container');
        if (container) {
          const mapInstance = (container as any)._leaflet_map;
          // fallback: use dom events
        }
      }}
    >
      {dir === 'in' ? '+' : '−'}
    </button>
  );
}

// Proper zoom buttons using react-leaflet's useMap
export function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
      <button
        className="w-9 h-9 rounded-lg bg-white/95 shadow border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-white active:scale-95 transition-transform"
        style={{ color: 'var(--ea-midnight)' }}
        onClick={() => map.zoomIn()}
      >
        +
      </button>
      <button
        className="w-9 h-9 rounded-lg bg-white/95 shadow border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-white active:scale-95 transition-transform"
        style={{ color: 'var(--ea-midnight)' }}
        onClick={() => map.zoomOut()}
      >
        −
      </button>
    </div>
  );
}

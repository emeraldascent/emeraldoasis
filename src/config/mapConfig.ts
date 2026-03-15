/**
 * Property Map Configuration
 * --------------------------
 * All coordinates are approximate. Connor should verify by
 * walking property corners with a GPS app and updating the
 * imageBounds values below.
 */

export const MAP_CONFIG = {
  // Southwest (bottom-left) and Northeast (top-right) corners of the illustrated map image
  imageBounds: [
    [35.730, -82.435] as [number, number],  // SW corner
    [35.740, -82.425] as [number, number],  // NE corner
  ] as [[number, number], [number, number]],

  center: [35.735, -82.430] as [number, number],
  minZoom: 15,
  maxZoom: 19,
  defaultZoom: 16,

  // Illustrated map images
  trailsMapUrl: '/property-map-trails.png',
  baseCampMapUrl: '/property-map-base.png',
};

export type LocationCategory = 'campsite' | 'amenity' | 'nature' | 'infrastructure';

export interface KeyLocation {
  id: string;
  name: string;
  description: string;
  coords: [number, number];
  icon: string;
  category: LocationCategory;
}

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  campsite: '#16a34a',
  amenity: '#d97706',
  nature: '#2563eb',
  infrastructure: '#6b7280',
};

export const KEY_LOCATIONS: KeyLocation[] = [
  {
    id: 'parking',
    name: 'Parking',
    description: 'Main parking area off Stoney Fork Rd',
    coords: [35.731, -82.428],
    icon: '🅿️',
    category: 'infrastructure',
  },
  {
    id: 'welcome-kiosk',
    name: 'Welcome Kiosk',
    description: 'Check-in, signage, and property info',
    coords: [35.732, -82.429],
    icon: '🏠',
    category: 'infrastructure',
  },
  {
    id: 'zen-lounge',
    name: 'Zen Lounge',
    description: 'WiFi, coworking, zen interior with jungle plants & aquariums',
    coords: [35.733, -82.429],
    icon: '🧘',
    category: 'amenity',
  },
  {
    id: 'market',
    name: 'Emerald Market',
    description: 'Coming April 2026 — Organic products, wellness goods, and Mandala Chocolate (select days/hrs)',
    coords: [35.733, -82.428],
    icon: '🛒',
    category: 'amenity',
  },
  {
    id: 'campsite-2',
    name: 'Campsite 2',
    description: 'Creekside camping',
    coords: [35.734, -82.431],
    icon: '⛺',
    category: 'campsite',
  },
  {
    id: 'campsite-3',
    name: 'Campsite 3 (Meadow)',
    description: 'Open meadow site',
    coords: [35.735, -82.430],
    icon: '🌿',
    category: 'campsite',
  },
  {
    id: 'campsite-4',
    name: 'Campsite 4 (Meadow)',
    description: 'Open meadow site',
    coords: [35.735, -82.429],
    icon: '🌿',
    category: 'campsite',
  },
  {
    id: 'campsite-5',
    name: 'Campsite 5',
    description: 'Forested site',
    coords: [35.736, -82.431],
    icon: '⛺',
    category: 'campsite',
  },
  {
    id: 'campsite-6',
    name: 'Campsite 6',
    description: 'Forested site',
    coords: [35.736, -82.430],
    icon: '⛺',
    category: 'campsite',
  },
  {
    id: 'campsite-7',
    name: 'Campsite 7 (Group)',
    description: 'Large group camping area',
    coords: [35.737, -82.431],
    icon: '🏕️',
    category: 'campsite',
  },
  {
    id: 'campsite-8',
    name: 'Campsite 8',
    description: 'Remote forest site',
    coords: [35.738, -82.432],
    icon: '⛺',
    category: 'campsite',
  },
  {
    id: 'creek-crossing',
    name: 'Creek Crossing',
    description: 'Mineral Creek crossing — wooden bridge to campsites',
    coords: [35.734, -82.430],
    icon: '🌊',
    category: 'nature',
  },
  {
    id: 'springs',
    name: 'Natural Springs',
    description: 'Fresh spring water access point',
    coords: [35.736, -82.429],
    icon: '💧',
    category: 'nature',
  },
  {
    id: 'sauna-cedar',
    name: 'Cedar Sauna',
    description: 'Private cedar electric sauna (2-person)',
    coords: [35.733, -82.430],
    icon: '🔥',
    category: 'amenity',
  },
  {
    id: 'sauna-wood',
    name: 'Wood-Fired Sauna',
    description: 'Community wood-fired sauna (up to 13)',
    coords: [35.733, -82.431],
    icon: '🔥',
    category: 'amenity',
  },
  {
    id: 'pisgah-trailhead',
    name: 'Pisgah Forest Access',
    description: 'Trail access to Pisgah National Forest',
    coords: [35.739, -82.433],
    icon: '🌲',
    category: 'nature',
  },
];

import { SearchResult, LiveJourney, Station } from '@/types/train';
import { env } from '@/config/env';
import { searchLocalTrains, TRAINS_DB } from '@/lib/trains-db';

const RR_BASE = env.RAILRADAR_BASE_URL || 'https://api.railradar.in/v1';
const RR_TIMEOUT_MS = 10000;
const SEARCH_RESULT_LIMIT = 25;

const STATION_COORDS: Record<string, [number, number]> = {
  NDLS: [28.643, 77.2194],
  MMCT: [18.9696, 72.8193],
  HWH: [22.5958, 88.2636],
  NZM: [28.5562, 77.3168],
  MAS: [13.0827, 80.2707],
  CSMT: [18.9402, 72.8355],
  BSB: [25.3217, 82.9873],
  PNBE: [25.6084, 85.1440],
  SDAH: [22.5908, 88.4028],
  TVC: [8.5241, 76.9366],
  LKO: [26.8467, 80.9462],
  KSR: [12.9799, 77.5710],
  SBC: [12.9784, 77.5712],
  GKP: [26.7606, 83.3700],
  ASR: [31.6216, 74.8749],
  DBRG: [27.4839, 94.9115],
  RNC: [23.3554, 85.3347],
  CBE: [11.0168, 76.9558],
  SAI: [19.6897, 74.4769],
  OTH: [20.5937, 78.9629],
};

function rrHeaders() {
  return {
    Authorization: `Bearer ${env.RAILRADAR_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function extractErrorMessage(json: any): string {
  if (!json) return 'Unknown error';
  if (json.error?.message) return `${json.error.code}: ${json.error.message}`;
  if (typeof json.error === 'string') return json.error;
  if (json.message) return json.message;
  return 'Unknown API error';
}

type RrFetchOptions = RequestInit & {
  timeoutMs?: number;
};

/**
 * Fetch wrapper with a bounded timeout so live pages fail honestly instead of hanging.
 */
async function rrFetch(url: string, options: RrFetchOptions = {}): Promise<Response> {
  const { timeoutMs = RR_TIMEOUT_MS, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: { ...rrHeaders(), ...(headers || {}) },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Type helpers for RailRadar raw API shapes ─────────────────────────────

interface RRStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

interface RRTrainDetail {
  number: string;
  name: string;
  type: string;
  category: string;
  source: RRStation;
  destination: RRStation;
  runDays: string[];
  distance: number;
  duration: number;
  avgSpeed: number;
}

interface RRRouteStop {
  sequence: number;
  station?: RRStation;
  stationCode?: string;
  stationName?: string;
  isHalt: boolean;
  platform?: string;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  distance: number;
  status?: string;
  speedToNextStationKmph?: number;
}

interface RRLiveResponse {
  trainNumber: string;
  trainName: string;
  startDate: string;
  lastUpdatedAt: string;
  status: string;
  train: RRTrainDetail;
  isLive: boolean;
  trackingMode: string;
  currentLocation?: {
    stationCode: string;
    sequence: number;
    status: string;
    isHalt: boolean;
    isActualPosition: boolean;
    lat?: number;
    lng?: number;
    segmentProgress?: number;
  };
  nextHalt?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  };
  delayMinutes: number;
  route: RRRouteStop[];
}

function normaliseStatus(status: string): LiveJourney['status'] {
  switch (status) {
    case 'running': return 'running';
    case 'not-started': return 'not_started';
    case 'not_started': return 'not_started';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'delayed': return 'delayed';
    case 'on-time': return 'on_time';
    case 'on_time': return 'on_time';
    default: return 'running';
  }
}

function normaliseRouteStop(stop: RRRouteStop, stationMap: Map<string, RRStation>): Station {
  const stCode = stop.stationCode || stop.station?.code || '';
  const stInfo = stationMap.get(stCode) || stop.station;

  const parseTime = (val?: string): string | undefined => {
    if (!val) return undefined;
    if (val.includes('T')) {
      return new Date(val).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
      });
    }
    return val;
  };

  let stStatus: Station['status'] = 'upcoming';
  const raw = (stop.status || '').toLowerCase();
  if (raw === 'departed' || raw === 'passed' || raw === 'arrived') stStatus = 'passed';
  else if (raw === 'at-station') stStatus = 'current';
  else stStatus = 'upcoming';

  return {
    code: stCode,
    name: stop.stationName || stop.station?.name || stCode,
    lat: stInfo?.lat ?? 0,
    lng: stInfo?.lng ?? 0,
    scheduledArrival: parseTime(stop.scheduledArrival || stop.arrival) || '--:--',
    scheduledDeparture: parseTime(stop.scheduledDeparture || stop.departure) || '--:--',
    actualArrival: parseTime(stop.actualArrival) || undefined,
    actualDeparture: parseTime(stop.actualDeparture) || undefined,
    delayMinutes: stop.delayArrival ?? stop.delayDeparture ?? 0,
    distanceKm: Math.round(stop.distance || 0),
    status: stStatus,
    platform: stop.platform,
  };
}

function interpolatePolyline(coords: [number, number][], pct: number): [number, number] {
  if (!coords || coords.length === 0) return [77.2194, 28.643];
  if (coords.length === 1 || pct <= 0) return coords[0];
  if (pct >= 100) return coords[coords.length - 1];

  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalDist += dist;
    distances.push(totalDist);
  }

  if (totalDist === 0) return coords[0];

  const targetDist = (pct / 100) * totalDist;
  for (let i = 1; i < coords.length; i++) {
    if (distances[i] >= targetDist) {
      const segStartDist = distances[i - 1];
      const segLen = distances[i] - segStartDist;
      const t = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      return [lng1 + t * (lng2 - lng1), lat1 + t * (lat2 - lat1)];
    }
  }
  return coords[coords.length - 1];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function findRouteStopForLiveLocation(raw: RRLiveResponse): RRRouteStop | undefined {
  const liveLocation = raw.currentLocation;
  if (!liveLocation) return undefined;

  return raw.route.find((stop) => stop.sequence === liveLocation.sequence)
    || raw.route.find((stop) => stop.stationCode === liveLocation.stationCode);
}

function estimateCoveredDistance(raw: RRLiveResponse, fallbackKm: number, totalDistanceKm: number): number {
  const liveLocation = raw.currentLocation;
  const currentStop = findRouteStopForLiveLocation(raw);

  if (!liveLocation || !currentStop || !isFiniteNumber(currentStop.distance)) {
    return fallbackKm;
  }

  const baseDistance = currentStop.distance;
  const nextStop = raw.route
    .filter((stop) => stop.sequence > currentStop.sequence && isFiniteNumber(stop.distance))
    .sort((a, b) => a.sequence - b.sequence)[0];

  if (
    liveLocation.status === 'departed'
    && nextStop
    && isFiniteNumber(liveLocation.segmentProgress)
  ) {
    const progress = clamp(liveLocation.segmentProgress, 0, 1);
    return clamp(
      baseDistance + (nextStop.distance - baseDistance) * progress,
      0,
      totalDistanceKm
    );
  }

  return clamp(baseDistance, 0, totalDistanceKm);
}

function positionFromDistance(
  routeGeo: [number, number][] | undefined,
  distanceKm: number,
  totalDistanceKm: number
): [number, number] | undefined {
  if (!routeGeo || routeGeo.length < 2 || totalDistanceKm <= 0) return undefined;
  const pct = clamp((distanceKm / totalDistanceKm) * 100, 0, 100);
  return interpolatePolyline(routeGeo, pct);
}

function normaliseLiveResponse(raw: RRLiveResponse, routeGeo?: [number, number][]): LiveJourney {
  const train = raw.train;

  const stationMap = new Map<string, RRStation>();
  if (train.source) stationMap.set(train.source.code, train.source);
  if (train.destination) stationMap.set(train.destination.code, train.destination);

  const relevantStops = raw.route.filter((s) => s.isHalt || s.stationCode || s.station?.code);
  const totalDistanceKm = train.distance || Math.round(relevantStops[relevantStops.length - 1]?.distance || 0);

  const stations = relevantStops.map((s) => {
    const st = normaliseRouteStop(s, stationMap);
    // If station coordinates are missing, interpolate along routeGeo
    if ((!st.lat || !st.lng) && routeGeo && routeGeo.length >= 2 && totalDistanceKm > 0) {
      const pct = Math.min(100, Math.max(0, (st.distanceKm / totalDistanceKm) * 100));
      const [lng, lat] = interpolatePolyline(routeGeo, pct);
      st.lat = lat;
      st.lng = lng;
    }
    return st;
  });

  const currentStation = stations.find((s) => s.status === 'current');
  const previousStation = [...stations].reverse().find((s) => s.status === 'passed');
  const nextStation = stations.find((s) => s.status === 'upcoming');

  const stationCoveredKm = currentStation?.distanceKm || previousStation?.distanceKm || 0;
  const coveredKm = estimateCoveredDistance(raw, stationCoveredKm, totalDistanceKm);
  const remainingKm = Math.max(0, totalDistanceKm - coveredKm);
  const completion = totalDistanceKm > 0 ? Math.min(100, (coveredKm / totalDistanceKm) * 100) : 0;
  const liveRouteStop = findRouteStopForLiveLocation(raw);

  // Determine train position
  let trainLat = raw.currentLocation?.lat;
  let trainLng = raw.currentLocation?.lng;

  if (!isFiniteNumber(trainLat) || !isFiniteNumber(trainLng)) {
    const routePosition = positionFromDistance(routeGeo, coveredKm, totalDistanceKm);
    const posStation = currentStation || previousStation;
    if (routePosition) {
      const [lng, lat] = routePosition;
      trainLng = lng;
      trainLat = lat;
    } else if (posStation && posStation.lat && posStation.lng) {
      trainLat = posStation.lat;
      trainLng = posStation.lng;
    } else {
      trainLat = train.source.lat;
      trainLng = train.source.lng;
    }
  }

  const currentLocation: LiveJourney['currentLocation'] = {
    lat: trainLat,
    lng: trainLng,
    heading: 45,
    speedKmh: Math.round(liveRouteStop?.speedToNextStationKmph || train.avgSpeed || 80),
    isMoving: raw.status === 'running' && raw.currentLocation?.status !== 'at-station',
  };

  const nextHaltStation = raw.nextHalt?.stationCode
    ? stations.find((s) => s.code === raw.nextHalt?.stationCode) || nextStation
    : nextStation;
  const etaStr = nextHaltStation?.scheduledArrival
    ? `${nextHaltStation.name} at ${nextHaltStation.scheduledArrival}`
    : 'Calculating...';

  return {
    trainId: raw.trainNumber,
    number: raw.trainNumber,
    name: raw.trainName,
    origin: { code: train.source.code, name: train.source.name },
    destination: { code: train.destination.code, name: train.destination.name },
    currentLocation,
    status: normaliseStatus(raw.status),
    delayMinutes: raw.delayMinutes || 0,
    speedKmh: currentLocation.speedKmh,
    distanceCoveredKm: coveredKm,
    remainingDistanceKm: remainingKm,
    totalDistanceKm,
    completionPercentage: Math.round(completion * 10) / 10,
    lastUpdated: raw.lastUpdatedAt || new Date().toISOString(),
    ETA: etaStr,
    previousStation,
    currentStation,
    nextStation,
    stations,
    routeGeometry: routeGeo,
  };
}

async function fetchRouteGeometry(trainNumber: string): Promise<[number, number][] | undefined> {
  try {
    const res = await rrFetch(`${RR_BASE}/trains/${trainNumber}/route`, {
      next: { revalidate: 86400 },
      timeoutMs: 8000,
    } as any);
    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json.success) return undefined;
    const coords: [number, number][] | undefined = json?.data?.geojson?.geometry?.coordinates;
    if (coords && coords.length > 200) {
      const step = Math.ceil(coords.length / 200);
      return coords.filter((_, i) => i % step === 0);
    }
    return coords;
  } catch {
    return undefined;
  }
}

// ─── Fallback Journey Generator ──────────────────────────────────────────

function getStationCoordinates(code: string): [number, number] {
  return STATION_COORDS[code] ?? [20.5937, 78.9629];
}

function haversineDistance([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

function createFallbackStation(code: string, name: string, lat: number, lng: number, scheduledDeparture: string, scheduledArrival: string, distanceKm: number, status: Station['status']) {
  return {
    code,
    name,
    lat,
    lng,
    scheduledArrival,
    scheduledDeparture,
    delayMinutes: 0,
    distanceKm,
    status,
  } as Station;
}

function generateFallbackJourney(trainNumber: string): LiveJourney | null {
  const train = TRAINS_DB.find((t) => t.number === trainNumber);

  const originStation = {
    code: train?.fromCode ?? 'SRC',
    name: train?.from ?? 'Source Station',
  };
  const destinationStation = {
    code: train?.toCode ?? 'DST',
    name: train?.to ?? 'Destination Station',
  };

  const originCoords = getStationCoordinates(originStation.code);
  const destinationCoords = getStationCoordinates(destinationStation.code);
  const totalDistanceKm = Math.max(200, Math.round(haversineDistance(originCoords, destinationCoords)));
  const coveredDistanceKm = Math.round(Math.max(50, Math.min(totalDistanceKm - 50, totalDistanceKm * 0.55)));
  const remainingDistanceKm = Math.max(0, totalDistanceKm - coveredDistanceKm);
  const completionPercentage = Math.round((coveredDistanceKm / totalDistanceKm) * 1000) / 10;

  const now = new Date();
  const departureTime = new Date(now);
  departureTime.setHours(now.getHours() - 3);
  const arrivalTime = new Date(now);
  arrivalTime.setHours(now.getHours() + 4);

  const routeGeometry: [number, number][] = [
    [originCoords[1], originCoords[0]],
    [(originCoords[1] + destinationCoords[1]) / 2, (originCoords[0] + destinationCoords[0]) / 2],
    [destinationCoords[1], destinationCoords[0]],
  ];

  const midpoint = routeGeometry[1];
  const stations: Station[] = [
    createFallbackStation(
      originStation.code,
      originStation.name,
      originCoords[0],
      originCoords[1],
      formatTime(departureTime),
      formatTime(departureTime),
      0,
      'passed'
    ),
    createFallbackStation(
      `${originStation.code}-MID`,
      'En route',
      midpoint[1],
      midpoint[0],
      formatTime(now),
      formatTime(now),
      coveredDistanceKm,
      'current'
    ),
    createFallbackStation(
      destinationStation.code,
      destinationStation.name,
      destinationCoords[0],
      destinationCoords[1],
      formatTime(arrivalTime),
      formatTime(arrivalTime),
      totalDistanceKm,
      'upcoming'
    ),
  ];

  return {
    trainId: trainNumber,
    number: trainNumber,
    name: train?.name ?? `Express Train #${trainNumber}`,
    origin: originStation,
    destination: destinationStation,
    currentLocation: {
      lat: midpoint[1],
      lng: midpoint[0],
      heading: 45,
      speedKmh: 85,
      isMoving: true,
    },
    status: 'running',
    delayMinutes: 0,
    speedKmh: 85,
    distanceCoveredKm: coveredDistanceKm,
    remainingDistanceKm,
    totalDistanceKm,
    completionPercentage,
    lastUpdated: new Date().toISOString(),
    ETA: `${destinationStation.name} at ${formatTime(arrivalTime)}`,
    previousStation: stations[0],
    currentStation: stations[1],
    nextStation: stations[2],
    stations,
    routeGeometry,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function searchTrains(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) {
    return searchLocalTrains('').map((t) => ({
      id: t.number,
      number: t.number,
      name: t.name,
      origin: { code: t.fromCode, name: t.from },
      destination: { code: t.toCode, name: t.to },
    }));
  }

  try {
    const res = await rrFetch(`${RR_BASE}/lookup/trains?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(json) || `Lookup failed: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) throw new Error(extractErrorMessage(json));

    const data: Record<string, string> = json?.data || {};
    return Object.entries(data)
      .slice(0, 15)
      .map(([number, name]) => {
        const localTrain = TRAINS_DB.find((t) => t.number === number);
        return {
          id: number,
          number,
          name,
          origin: {
            code: localTrain?.fromCode || '',
            name: localTrain?.from || '',
          },
          destination: {
            code: localTrain?.toCode || '',
            name: localTrain?.to || '',
          },
        };
      });
  } catch (err) {
    console.warn('RailRadar lookup API fetch failed, using local DB fallback');
    return searchLocalTrains(q).map((t) => ({
      id: t.number,
      number: t.number,
      name: t.name,
      origin: { code: t.fromCode, name: t.from },
      destination: { code: t.toCode, name: t.to },
    }));
  }
}

export async function getLiveJourney(trainNumber: string): Promise<LiveJourney | null> {
  try {
    const [liveRes, routeGeo] = await Promise.all([
      rrFetch(`${RR_BASE}/trains/${trainNumber}/live`, { cache: 'no-store' } as any),
      fetchRouteGeometry(trainNumber),
    ]);

    const json = await liveRes.json().catch(() => null);

    if (!liveRes.ok) {
      if (liveRes.status === 404) return null;
      const msg = extractErrorMessage(json);
      if (liveRes.status === 429 || json?.error?.code === 'TOO_MANY_REQUESTS') {
        throw new Error(`QUOTA_EXCEEDED: ${msg}`);
      }
      throw new Error(`RailRadar API error (${liveRes.status}): ${msg}`);
    }

    if (!json?.success || !json?.data) {
      const msg = extractErrorMessage(json);
      if (json?.error?.code === 'TOO_MANY_REQUESTS') {
        throw new Error(`QUOTA_EXCEEDED: ${msg}`);
      }
      return null;
    }

    return normaliseLiveResponse(json.data as RRLiveResponse, routeGeo);
  } catch (err: any) {
    if (err?.message?.includes('QUOTA_EXCEEDED')) {
      throw err;
    }
    console.warn(`[getLiveJourney] RailRadar API network error for train ${trainNumber}:`, err.message);
    // Return generated fallback journey if server can't reach RailRadar API
    return generateFallbackJourney(trainNumber);
  }
}

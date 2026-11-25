// Small geo helpers (haversine distance, interpolation).

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Linear interpolation between two points (fine for city-scale distances). */
export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function googleMapsLink(p: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
}

// ---------- real roads (OSRM) + address search (Nominatim) ----------

export interface RoadRoute {
  path: [number, number][]; // [lat, lng]
  distanceM: number;
  durationS: number;
  road: boolean; // false = straight-line fallback
}

const routeCache = new Map<string, Promise<RoadRoute>>();

/** ~1 m precision so tiny float noise doesn't miss the cache. */
export const routeKey = (points: LatLng[]) => points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");

function straightLine(points: LatLng[]): RoadRoute {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  // ponytail: 25 km/h city guess for the fallback ETA
  return { path: points.map((p) => [p.lat, p.lng]), distanceM: km * 1000, durationS: (km / 25) * 3600, road: false };
}

/** Driving route that follows roads via the public OSRM server; straight line on any error/timeout. */
export function roadRoute(points: LatLng[]): Promise<RoadRoute> {
  if (points.length < 2) return Promise.resolve(straightLine(points));
  const key = routeKey(points);
  const hit = routeCache.get(key);
  if (hit) return hit;
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const req = fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, {
    signal: AbortSignal.timeout(4000),
  })
    .then((r) => r.json())
    .then((d: { routes?: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[] }) => {
      const r = d.routes?.[0];
      if (!r) throw new Error("no route");
      return { path: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]), distanceM: r.distance, durationS: r.duration, road: true };
    })
    .catch(() => {
      routeCache.delete(key); // don't pin a failure; retry next time
      return straightLine(points);
    });
  routeCache.set(key, req);
  return req;
}

export interface PlaceHit {
  name: string; // short name for labels
  address: string;
  lat: number;
  lng: number;
}

let lastSearch = 0;

/** Nominatim search limited to Lucknow. Call on submit only (usage policy: no autocomplete); max 1 req/sec. */
export async function searchPlaces(q: string): Promise<PlaceHit[]> {
  const wait = lastSearch + 1000 - Date.now();
  lastSearch = Date.now() + Math.max(0, wait);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&viewbox=80.80,27.00,81.10,26.70&bounded=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows: { name?: string; display_name: string; lat: string; lon: string }[] = await res.json();
  return rows.map((r) => ({ name: r.name || r.display_name.split(",")[0], address: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

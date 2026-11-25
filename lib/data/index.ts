// Data layer. The app talks to these functions instead of touching storage
// directly, so the in-memory/localStorage adapter can later be swapped for
// Supabase (implement DataAdapter and pass it to the store).

import type { FoodPreference, Guest, Helper, Place, Position, Task, Vehicle, WeddingConfig } from "@/types";
import { createSeed, PLACES, type SeedOptions, type SeedSnapshot } from "@/lib/seed";

export type { SeedSnapshot };

export const STALE_AFTER_MS = 5 * 60 * 1000;

export interface DataAdapter {
  load(): SeedSnapshot | null;
  save(snapshot: SeedSnapshot): void;
  clear(): void;
}

/** Fresh demo data (Riya weds Arjun, Lucknow). */
export function getSeedSnapshot(opts?: SeedOptions): SeedSnapshot {
  return createSeed(opts);
}

// ---------- positions (Traccar-style: device vs position history) ----------

export function latestPosition(positions: Position[], deviceId: string): Position | undefined {
  let best: Position | undefined;
  for (const p of positions) {
    if (p.deviceId === deviceId && (!best || p.timestamp > best.timestamp)) best = p;
  }
  return best;
}

export function latestPositionsByDevice(positions: Position[]): Map<string, Position> {
  const map = new Map<string, Position>();
  for (const p of positions) {
    const cur = map.get(p.deviceId);
    if (!cur || p.timestamp > cur.timestamp) map.set(p.deviceId, p);
  }
  return map;
}

export function isStale(position: Position | undefined, now: number): boolean {
  return !position || now - position.timestamp > STALE_AFTER_MS;
}

export function tripPositions(positions: Position[], taskId: string, deviceType: Position["deviceType"] = "helper"): Position[] {
  return positions.filter((p) => p.taskId === taskId && p.deviceType === deviceType).sort((a, b) => a.timestamp - b.timestamp);
}

// ---------- helpers & vehicles ----------

export type DisplayStatus = "free" | "busy" | "unavailable" | "stale";

export function helperDisplayStatus(helper: Helper, position: Position | undefined, now: number): DisplayStatus {
  if (isStale(position, now)) return "stale";
  if (helper.status === "unavailable" || helper.availability === "offline") return "unavailable";
  if (helper.status === "busy") return "busy";
  return "free";
}

export function vehicleDisplayStatus(vehicle: Vehicle, position: Position | undefined, now: number): DisplayStatus {
  if (isStale(position, now) && vehicle.status === "in_use") return "stale";
  if (vehicle.status === "unavailable") return "unavailable";
  if (vehicle.status === "in_use") return "busy";
  return "free";
}

export const DISPLAY_COLORS: Record<DisplayStatus, string> = {
  free: "#16a34a",
  busy: "#eab308",
  unavailable: "#dc2626",
  stale: "#9ca3af",
};

export const DISPLAY_LABEL: Record<DisplayStatus, string> = {
  free: "Free",
  busy: "On task",
  unavailable: "Unavailable",
  stale: "Stale location",
};

// ---------- places ----------

/** Saved places for pickup/drop pickers: home, stations, airport, venues, guest arrival points. */
export function getSavedPlaces(config: WeddingConfig, guests: Guest[]): Place[] {
  const places: Place[] = [PLACES.ghar, PLACES.charbagh, PLACES.airport, PLACES.gomtiNagarStation, PLACES.chappanBhog];
  for (const f of config.functions) {
    places.push({ id: `venue-${f.id}`, label: `${f.venueName} (${f.name})`, lat: f.lat, lng: f.lng, kind: "venue" });
  }
  for (const g of guests) {
    if (g.arrival && !places.some((p) => Math.abs(p.lat - g.arrival!.lat) < 1e-4 && Math.abs(p.lng - g.arrival!.lng) < 1e-4)) {
      places.push({ id: `arrival-${g.id}`, label: g.arrival.place, lat: g.arrival.lat, lng: g.arrival.lng, kind: "other" });
    }
  }
  return places;
}

// ---------- catering ----------

export interface CateringLine {
  functionId: string;
  functionName: string;
  date: string;
  time: string;
  venueName: string;
  total: number;
  food: Record<FoodPreference, number>;
  pending: number; // invited guests (families) who have not replied
}

export function cateringSummary(config: WeddingConfig, guests: Guest[]): CateringLine[] {
  return config.functions.map((f) => {
    const line: CateringLine = {
      functionId: f.id,
      functionName: f.name,
      date: f.date,
      time: f.time,
      venueName: f.venueName,
      total: 0,
      food: { veg: 0, jain: 0, "non-veg": 0 },
      pending: 0,
    };
    for (const g of guests) {
      if (!g.invitedFunctionIds.includes(f.id)) continue;
      const r = g.rsvps.find((x) => x.functionId === f.id);
      if (!r || r.status === "pending") line.pending += 1;
      else if (r.status === "yes") {
        line.total += r.headcount;
        line.food[r.food] += r.headcount;
      }
    }
    return line;
  });
}

export function cateringText(line: CateringLine, config: WeddingConfig): string {
  return [
    `${config.brideName} weds ${config.groomName}: ${line.functionName}`,
    `${formatDate(line.date)}, ${formatTime(line.time)} @ ${line.venueName}`,
    `Total plates: ${line.total}`,
    `Veg: ${line.food.veg} | Jain: ${line.food.jain} | Non-veg: ${line.food["non-veg"]}`,
    line.pending ? `(${line.pending} parivaar ka jawab abhi baaki hai)` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------- tasks ----------

export function isPendingPickup(t: Task): boolean {
  return t.type === "pickup" && !["completed", "canceled"].includes(t.status);
}

// ---------- formatting ----------

export function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
}

export function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return "abhi abhi";
  if (s < 60) return `${s} sec pehle`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min pehle`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ghante pehle`;
  return `${Math.round(h / 24)} din pehle`;
}

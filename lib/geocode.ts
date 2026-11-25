// Server-only place lookup for WhatsApp tasks: our saved places first, then OpenStreetMap Nominatim.
import "server-only";
import { PLACES } from "@/lib/seed";
import { knownPlace } from "@/lib/whatsappCommands";
import type { Waypoint } from "@/types";

const cache = new Map<string, Waypoint | null>();
let nextSlot = 0;

// Lucknow box: results here are preferred, not required (Bua ji may be coming from Kanpur).
const VIEWBOX = "80.80,27.00,81.10,26.70";

/** Nominatim usage policy: max 1 request/second, a real User-Agent, cache results. */
async function nominatim(q: string): Promise<Waypoint | null> {
  const wait = nextSlot - Date.now();
  nextSlot = Math.max(Date.now(), nextSlot) + 1100;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&viewbox=${VIEWBOX}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": "ShaadiOS/0.1 (wedding logistics demo)", Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const [hit] = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
  return hit ? { label: hit.name || hit.display_name.split(",")[0], lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}

export async function geocode(name: string, city: string): Promise<Waypoint | null> {
  const key = knownPlace(name);
  if (key) return { label: PLACES[key].label, lat: PLACES[key].lat, lng: PLACES[key].lng };
  const q = `${name.trim()}, ${city}`.slice(0, 200);
  if (!cache.has(q)) cache.set(q, await nominatim(q).catch(() => null));
  return cache.get(q) ?? null;
}

// Rule-based Hinglish parser for WhatsApp commands, e.g.
// "Bua ji ko charbagh se laana hai 3 baje, 3 log" -> pickup task Charbagh -> Ghar at 15:00.
import { PLACES } from "@/lib/seed";
import type { NewTaskInput } from "@/stores/useShaadiStore";

type PlaceKey = keyof typeof PLACES;

// Order matters: specific patterns first, their text is blanked before the next one runs.
const PLACE_PATTERNS: [PlaceKey, RegExp][] = [
  ["gomtiNagarStation", /gomti\s*nagar(\s*(railway\s*)?station)?/],
  ["charbagh", /char\s*bagh|railway\s*station|\bstation\b/],
  ["airport", /airport|hawai\s*adda|amausi/],
  ["chappanBhog", /ch?h?appan\s*bhog|mithai|sweets?/],
  ["ghar", /\bghar\b|\bhome\b/],
];

export const WA_HELP = [
  "Shaadi OS ko kaam bhejiye, jaise:",
  "• Bua ji ko charbagh se laana hai 3 baje, 3 log",
  "• Mausi ko airport chhodna hai 5:30 baje",
  "• Chappan bhog se mithai lani hai kal 11 baje",
  "Jagah: charbagh/station, airport, gomti nagar, chappan bhog/mithai, ghar",
].join("\n");

export type WaCommand = { kind: "help" } | { kind: "task"; input: NewTaskInput };

function istParts(ms: number) {
  const d = new Date(ms + 5.5 * 3600_000); // shift so UTC getters read IST
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}

function parseTime(s: string, now: number): string {
  const m = s.match(/\b(\d{1,2})[:.](\d{2})\b/) ?? s.match(/\b(\d{1,2})\s*(?:baje|bje|pm|am)\b/);
  const day = istParts(now + (/\bkal\b/.test(s) ? 86_400_000 : 0));
  let h = istParts(now).h;
  let min = istParts(now).min;
  if (m) {
    h = Number(m[1]) % 24;
    min = Number(m[2] ?? 0) % 60;
    const am = /\b(am|subah|savere)\b/.test(s);
    const pm = /\b(pm|shaam|sham|raat|dopahar)\b/.test(s);
    // ponytail: "3 baje" without subah/shaam is read as 3 PM (1-7 -> PM); fine for wedding pickups.
    if (h < 12 && (pm || (!am && h >= 1 && h <= 7))) h += 12;
  }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${day.y}-${p(day.m)}-${p(day.d)}T${p(h)}:${p(min)}:00+05:30`;
}

export function parseWaCommand(raw: string, now = Date.now()): WaCommand {
  const text = raw.trim();
  let s = text.toLowerCase();
  if (!s || /^(help|madad|\?|hi|hello)\b/.test(s)) return { kind: "help" };

  // Find places with position and what follows them ("se" = from, "chhod"/"tak" = to).
  const found: { key: PlaceKey; at: number; after: string }[] = [];
  for (const [key, re] of PLACE_PATTERNS) {
    const m = s.match(re);
    if (!m || m.index === undefined) continue;
    found.push({ key, at: m.index, after: s.slice(m.index + m[0].length, m.index + m[0].length + 20) });
    s = s.slice(0, m.index) + " ".repeat(m[0].length) + s.slice(m.index + m[0].length);
  }
  s = text.toLowerCase();
  const others = found.filter((f) => f.key !== "ghar").sort((a, b) => a.at - b.at);
  if (others.length === 0) return { kind: "help" };

  const dropping = /chh?od|drop|pahuncha/.test(s);
  let from: PlaceKey;
  let to: PlaceKey;
  if (others.length >= 2) {
    const src = others.find((f) => /^\s*se\b/.test(f.after)) ?? others[0];
    from = src.key;
    to = others.find((f) => f !== src)!.key;
  } else if (dropping && !/^\s*se\b/.test(others[0].after)) {
    from = "ghar";
    to = others[0].key;
  } else {
    from = others[0].key;
    to = "ghar";
  }

  const people = s.match(/\b(\d{1,2})\s*(log|logo|logon|jan|people|members?|guests?)\b/);
  const errand = from === "chappanBhog" || to === "chappanBhog" || /saman|samaan|mithai|khareed|parcel/.test(s);
  const title = text.replace(/\s+/g, " ").slice(0, 80);
  const wp = (k: PlaceKey) => ({ label: PLACES[k].label, lat: PLACES[k].lat, lng: PLACES[k].lng });

  return {
    kind: "task",
    input: {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      type: errand ? "errand" : "pickup",
      pickup: wp(from),
      drop: wp(to),
      time: parseTime(s, now),
      peopleCount: people ? Math.min(20, Math.max(1, Number(people[1]))) : 1,
    },
  };
}

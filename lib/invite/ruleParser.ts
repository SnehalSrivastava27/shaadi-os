// Offline, rule-based "AI" for the invite builder. Used when no LLM key is set
// or the LLM call fails, so the demo always works. Understands Hinglish:
// names, dates, cities, themes, function names, colours and "X baje" times.

import type { Theme, WeddingConfig, WeddingFunction } from "@/types";
import type { ConfigPatch } from "./schema";
import { CITY_PRESETS, COLOR_WORDS, FUNCTION_CATALOG, THEME_PRESETS, type CityPreset, type FunctionPreset } from "./culture";
import { applyPatch } from "./merge";
import { functionSuggestions } from "./suggestions";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  calcutta: "Kolkata",
  bombay: "Mumbai",
  madras: "Chennai",
  banaras: "Varanasi",
  benaras: "Varanasi",
  "new delhi": "Delhi",
  dilli: "Delhi",
};
const STOPWORDS = new Set([
  ...FUNCTION_CATALOG.flatMap((f) => f.keywords),
  ...CITY_PRESETS.map((c) => c.name.toLowerCase()),
  ...Object.values(THEME_PRESETS).flatMap((t) => t.keywords),
  "shaadi", "theme", "colour", "color", "hindi", "english", "the", "dec", "jan", "reception", "family",
]);
const EVENING_FUNCTIONS = new Set(["sangeet", "jaago", "cocktail", "wedding", "reception", "tilak", "mehendi"]);

export interface RuleResult {
  patch: ConfigPatch;
  summary: string;
  reply: string;
  suggestions: string[];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, word: string) => new RegExp(`(^|[^a-z])${escapeRe(word)}([^a-z]|$)`, "i").test(text);
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function detectFunctions(text: string): FunctionPreset[] {
  const lower = text.toLowerCase();
  return FUNCTION_CATALOG.filter((f) => f.keywords.some((k) => hasWord(lower, k)));
}

export function detectTheme(text: string): Theme | undefined {
  const lower = text.toLowerCase();
  const order: Theme[] = ["south-indian", "punjabi", "bengali", "rajasthani", "modern"];
  return order.find((t) => THEME_PRESETS[t].keywords.some((k) => hasWord(lower, k)));
}

export function detectCity(text: string): CityPreset | undefined {
  const lower = text.toLowerCase();
  for (const [alias, name] of Object.entries(CITY_ALIASES)) {
    if (hasWord(lower, alias)) return CITY_PRESETS.find((c) => c.name === name);
  }
  return CITY_PRESETS.find((c) => hasWord(lower, c.name.toLowerCase()));
}

export function detectDate(text: string, today = new Date()): string | undefined {
  const lower = text.toLowerCase();
  const m1 = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s*,?\s*(\d{4}))?/);
  const m2 = lower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/);
  let day: number | undefined, month: number | undefined, year: number | undefined;
  if (m1) {
    day = Number(m1[1]);
    month = MONTHS.indexOf(m1[2]);
    year = m1[3] ? Number(m1[3]) : undefined;
  } else if (m2) {
    day = Number(m2[2]);
    month = MONTHS.indexOf(m2[1]);
    year = m2[3] ? Number(m2[3]) : undefined;
  }
  if (day === undefined || month === undefined || month < 0 || day < 1 || day > 31) return undefined;
  if (!year) {
    year = today.getFullYear();
    const candidate = new Date(year, month, day);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (candidate < startOfToday) year += 1;
  }
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** "8 baje", "8:30 pm", "subah 7 baje", "20:00" -> "HH:mm" (uses the function to guess AM/PM). */
export function detectTime(text: string, fnKey?: string): string | undefined {
  const lower = text.toLowerCase();
  const m = lower.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(baje|bje|pm|p\.m\.|am|a\.m\.|o'?clock|hrs)/) ?? lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!m) return undefined;
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const suffix = m[3] ?? "";
  if (hour > 23 || minute > 59) return undefined;
  if (/^p/.test(suffix)) {
    if (hour < 12) hour += 12;
  } else if (/^a/.test(suffix)) {
    if (hour === 12) hour = 0;
  } else if (hour <= 12 && (suffix.startsWith("b") || suffix.startsWith("o"))) {
    if (/subah|morning|savere/.test(lower)) {
      // keep AM
    } else if (/shaam|raat|evening|night|dopahar|afternoon/.test(lower)) {
      if (hour < 12) hour += 12;
    } else if (fnKey && EVENING_FUNCTIONS.has(fnKey)) {
      if (hour < 12 && hour >= 1) hour += 12;
    } else if (fnKey !== "muhurtham" && hour >= 1 && hour <= 7) {
      hour += 12;
    }
  }
  return `${pad(hour)}:${pad(minute)}`;
}

export function detectNames(text: string): { bride: string; groom: string } | undefined {
  const re = /\b([A-Z][a-zA-Z]+)\s+(?:aur|and|&|weds|ke saath|n)\s+([A-Z][a-zA-Z]+)\b/g;
  for (const m of text.matchAll(re)) {
    const [a, b] = [m[1], m[2]];
    if (!STOPWORDS.has(a.toLowerCase()) && !STOPWORDS.has(b.toLowerCase())) return { bride: a, groom: b };
  }
  return undefined;
}

function detectColours(text: string): { target: "primary" | "accent" | "background"; hex: string; word: string }[] {
  const lower = text.toLowerCase();
  const words = Object.keys(COLOR_WORDS)
    .sort((a, b) => b.length - a.length)
    .filter((w) => hasWord(lower, w));
  // Drop words contained in a longer matched word ("red" inside "deep red").
  const unique = words.filter((w) => !words.some((o) => o !== w && o.includes(w)));
  const ordered = unique.sort((a, b) => lower.indexOf(a) - lower.indexOf(b));
  const explicitBg = /background|bg\b|peeche|backdrop/.test(lower);
  const explicitAccent = /accent|highlight|border|second/.test(lower);
  return ordered.map((word, i) => {
    let target: "primary" | "accent" | "background" = i === 0 ? "primary" : i === 1 ? "accent" : "background";
    if (ordered.length === 1 && explicitBg) target = "background";
    if (ordered.length === 1 && explicitAccent) target = "accent";
    return { target, hex: COLOR_WORDS[word], word };
  });
}

function functionName(preset: FunctionPreset, theme: Theme): string {
  if (preset.key === "wedding" && theme === "bengali") return "Biye (Wedding)";
  if (preset.key === "wedding" && theme === "south-indian") return "Kalyanam";
  if (preset.key === "wedding" && theme === "modern") return "Wedding Ceremony";
  return preset.name;
}

function buildFunction(preset: FunctionPreset, mainDate: string, city: CityPreset, theme: Theme, index: number): WeddingFunction {
  const venue = city.venues[index % city.venues.length];
  const angle = (index * 72 * Math.PI) / 180;
  return {
    id: `fn-${preset.key}`,
    name: functionName(preset, theme),
    date: addDays(mainDate, preset.dayOffset),
    time: preset.time,
    venueName: `${venue}, ${city.name}`,
    lat: +(city.lat + Math.cos(angle) * 0.012).toFixed(5),
    lng: +(city.lng + Math.sin(angle) * 0.012).toFixed(5),
    dressCode: preset.dressCode,
    description: preset.description,
  };
}

function mainDateOf(config: WeddingConfig): string {
  const main =
    config.functions.find((f) => ["fn-wedding", "fn-anand-karaj", "fn-muhurtham"].includes(f.id)) ??
    config.functions[Math.floor(config.functions.length / 2)];
  return main?.date ?? toIso(new Date(Date.now() + 30 * 86400000));
}

function findExisting(config: WeddingConfig, preset: FunctionPreset): WeddingFunction | undefined {
  return (
    config.functions.find((f) => f.id === `fn-${preset.key}`) ??
    config.functions.find((f) => preset.keywords.some((k) => hasWord(f.name.toLowerCase(), k)))
  );
}

export function parseWithRules(config: WeddingConfig, message: string, today = new Date()): RuleResult {
  const text = message.trim();
  const lower = text.toLowerCase();
  const patch: ConfigPatch = {};
  const changes: string[] = [];

  const names = detectNames(text);
  const theme = detectTheme(text);
  const city = detectCity(text);
  const date = detectDate(text, today);
  const fns = detectFunctions(text);
  const isNewWedding = !!names && (!!date || !!city || fns.length > 1 || /shaadi|wedding|vivah/.test(lower));

  if (isNewWedding && names) {
    // ---------- brand-new wedding from a description ----------
    const t = theme ?? config.theme;
    const c = city ?? CITY_PRESETS.find((x) => x.name === config.city) ?? CITY_PRESETS[0];
    const mainDate = date ?? mainDateOf(config);
    const keys = fns.length ? fns : THEME_PRESETS[t].typicalFunctions.map((k) => FUNCTION_CATALOG.find((f) => f.key === k)!);
    patch.brideName = names.bride;
    patch.groomName = names.groom;
    patch.city = c.name;
    patch.theme = t;
    patch.palette = { ...THEME_PRESETS[t].palette };
    patch.welcomeMessage = { ...THEME_PRESETS[t].welcomeMessage };
    patch.replaceFunctions = true;
    patch.functions = keys.map((p, i) => buildFunction(p, mainDate, c, t, i));
    for (const col of detectColours(text)) patch.palette[col.target] = col.hex;
    const summary = `New ${THEME_PRESETS[t].label} invite: ${names.bride} & ${names.groom}, ${c.name}`;
    const preview = applyPatch(config, patch);
    return {
      patch,
      summary,
      reply: `Badhai ho! ${names.bride} aur ${names.groom} ka ${THEME_PRESETS[t].label} invite taiyaar hai: ${keys.length} functions, ${c.name}. Ab kuch bhi badalne ko boliye, jaise "sangeet 8 baje kar do".`,
      suggestions: preview.ok ? functionSuggestions(preview.config) : [],
    };
  }

  // ---------- edits on the current config ----------
  if (names) {
    patch.brideName = names.bride;
    patch.groomName = names.groom;
    changes.push(`names to ${names.bride} & ${names.groom}`);
  }

  if (theme && theme !== config.theme) {
    patch.theme = theme;
    patch.palette = { ...THEME_PRESETS[theme].palette };
    patch.welcomeMessage = { ...THEME_PRESETS[theme].welcomeMessage };
    changes.push(`${THEME_PRESETS[theme].label} theme`);
  }

  const colours = detectColours(text);
  if (colours.length) {
    patch.palette = { ...(patch.palette ?? {}) };
    for (const c of colours) patch.palette[c.target] = c.hex;
    changes.push(colours.map((c) => `${c.target} ${c.word}`).join(", "));
  }

  if (/hindi/.test(lower)) {
    const off = /hatao|remove|nahi|mat|band|sirf english|only english/.test(lower);
    patch.showHindi = !off;
    changes.push(off ? "Hindi hidden" : "Hindi shown");
  } else if (/sirf english|only english/.test(lower)) {
    patch.showHindi = false;
    changes.push("English only");
  }

  const wantsRemove = /hatao|hata do|remove|delete|cancel|nahi hoga|nahin hoga/.test(lower);
  const functionPatches: NonNullable<ConfigPatch["functions"]> = [];
  const removeIds: string[] = [];
  const added: string[] = [];

  // Work clause by clause so "sangeet 8 baje aur haldi 11 baje" maps times correctly.
  const clauses = text.split(/,|;|\.\s|\baur\b|\band\b/i).map((s) => s.trim()).filter(Boolean);
  for (const clause of clauses) {
    const clauseFns = detectFunctions(clause);
    for (const preset of clauseFns) {
      const existing = findExisting(config, preset);
      const time = detectTime(clause, preset.key);
      const newDate = detectDate(clause, today);
      if (existing && wantsRemove) {
        removeIds.push(existing.id);
        continue;
      }
      if (existing) {
        const fp: NonNullable<ConfigPatch["functions"]>[number] = { id: existing.id };
        if (time) fp.time = time;
        if (newDate) fp.date = newDate;
        if (time || newDate) {
          functionPatches.push(fp);
          changes.push(`${existing.name} ${[newDate, time && `at ${to12h(time)}`].filter(Boolean).join(" ")}`);
        }
      } else if (!wantsRemove) {
        const c = city ?? CITY_PRESETS.find((x) => x.name === config.city) ?? CITY_PRESETS[0];
        const f = buildFunction(preset, mainDateOf(config), c, (patch.theme as Theme) ?? config.theme, config.functions.length + added.length);
        if (time) f.time = time;
        if (newDate) f.date = newDate;
        functionPatches.push(f);
        added.push(f.name);
      }
    }
  }
  if (added.length) changes.push(`added ${added.join(", ")}`);
  if (removeIds.length) {
    patch.removeFunctionIds = removeIds;
    changes.push(`removed ${removeIds.length} function(s)`);
  }

  // A bare date ("shaadi 15 Dec ko hai") shifts the whole schedule.
  if (date && fns.length === 0) {
    const delta = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${mainDateOf(config)}T12:00:00`).getTime()) / 86400000);
    if (delta !== 0) {
      for (const f of config.functions) functionPatches.push({ id: f.id, date: addDays(f.date, delta) });
      changes.push(`schedule moved to ${date}`);
    }
  }

  // City change moves all venues.
  if (city && city.name !== config.city) {
    patch.city = city.name;
    config.functions.forEach((f, i) => {
      const preset = FUNCTION_CATALOG.find((p) => `fn-${p.key}` === f.id) ?? FUNCTION_CATALOG[i % FUNCTION_CATALOG.length];
      const moved = buildFunction(preset, mainDateOf(config), city, config.theme, i);
      const existingPatch = functionPatches.find((p) => p.id === f.id);
      const venue = { venueName: moved.venueName, lat: moved.lat, lng: moved.lng };
      if (existingPatch) Object.assign(existingPatch, venue);
      else functionPatches.push({ id: f.id, ...venue });
    });
    changes.push(`city ${city.name}`);
  }

  if (functionPatches.length) patch.functions = functionPatches;

  const welcome = text.match(/welcome(?: message)?\s*[:\-]\s*(.+)$/i);
  if (welcome) {
    patch.welcomeMessage = { ...(patch.welcomeMessage ?? {}), en: welcome[1].trim() };
    changes.push("welcome message");
  }

  if (changes.length === 0) {
    return {
      patch: {},
      summary: "",
      reply:
        'Maaf kijiye, ye samajh nahi aaya. Aise boliye: "colour maroon karo", "sangeet 8 baje kar do", "Hindi mein bhi dikhao", "Punjabi theme lagao" ya "Jaago add karo".',
      suggestions: functionSuggestions(config),
    };
  }

  const summary = capitalize(changes.join("; ")).slice(0, 80);
  const preview = applyPatch(config, patch);
  return {
    patch,
    summary,
    reply: `Ho gaya! ${summary}.`,
    suggestions: preview.ok ? functionSuggestions(preview.config) : [],
  };
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

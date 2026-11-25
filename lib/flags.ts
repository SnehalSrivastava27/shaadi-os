// Server-only Flagsmith client over the public Edge REST API (no SDK).
// Not configured (no FLAGSMITH_ENVIRONMENT_KEY) or flag missing in Flagsmith -> the default below, so the app works as before.
import "server-only";
import { health } from "@/lib/nudgebee";

export const FLAG_DEFAULTS = {
  whatsapp_group_mode: true, // tasks go to the WhatsApp group, helpers claim them
  whatsapp_voice_notes: true, // Sarvam speech-to-text for WhatsApp voice notes
  whatsapp_native_replies: true, // translated text + spoken reply in the sender's language
  ai_understanding: true, // Sarvam chat reads messages the rule parser can't
  invite_translation: true, // guest invite in 22 Indian languages
  real_rides: true, // real Uber/Rapido through the phone bridge (spends money)
};
export type FlagName = keyof typeof FLAG_DEFAULTS;
export type Flags = Record<FlagName, boolean>;

type ApiFlag = { feature: { name: string }; enabled: boolean; feature_state_value: string | number | boolean | null };
const API = "https://edge.api.flagsmith.com/api/v1";
const flagsmithDown = (why: string) => ({
  fingerprint: "flagsmith:unreachable",
  title: "Flagsmith unreachable: feature flags fell back to defaults",
  rule_name: "flagsmith_unreachable",
  severity: "low" as const,
  description: `${why}. All features run with their default (on) values until Flagsmith answers again.`,
  subject: { name: "edge.api.flagsmith.com", type: "external-api" },
});
const CACHE_MS = 5_000; // short, so a flip in Flagsmith shows up on stage within seconds
let cache: { at: number; flags: ApiFlag[] } | null = null;

export const flagsmithOn = () => !!process.env.FLAGSMITH_ENVIRONMENT_KEY;

async function fetchFlags(path: string): Promise<ApiFlag[] | null> {
  const key = process.env.FLAGSMITH_ENVIRONMENT_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}${path}`, { headers: { "X-Environment-Key": key }, signal: AbortSignal.timeout(3000), cache: "no-store" });
    health(!res.ok, flagsmithDown(`HTTP ${res.status}`));
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data.flags ?? null);
  } catch (e) {
    health(true, flagsmithDown(e instanceof Error ? e.message : String(e)));
    return null; // Flagsmith down -> defaults, never break the app
  }
}

export async function getFlags(): Promise<Flags> {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    const flags = await fetchFlags("/flags/");
    if (flags) cache = { at: Date.now(), flags };
  }
  const out = { ...FLAG_DEFAULTS };
  for (const f of cache?.flags ?? []) if (f.feature.name in out) out[f.feature.name as FlagName] = f.enabled;
  return out;
}

export async function flag(name: FlagName): Promise<boolean> {
  return (await getFlags())[name];
}

/** A/B test: the variant Flagsmith assigns this visitor for a multivariate flag (its value), or null for the control. */
export async function variantFor(name: string, visitorId: string): Promise<string | null> {
  const flags = await fetchFlags(`/identities/?identifier=${encodeURIComponent(visitorId)}`);
  const f = flags?.find((x) => x.feature.name === name);
  return f?.enabled && typeof f.feature_state_value === "string" && f.feature_state_value.trim() ? f.feature_state_value : null;
}

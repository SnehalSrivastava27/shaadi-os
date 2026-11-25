// Server-only Sarvam AI client (https://docs.sarvam.ai). One key: SARVAM_API_KEY.
import "server-only";
import { health } from "@/lib/nudgebee";

const BASE = "https://api.sarvam.ai";

export const sarvamOn = () => !!process.env.SARVAM_API_KEY;

/** Languages Sarvam can translate to (sarvam-translate:v1) and speak (bulbul, subset). */
export const SARVAM_LANGS: Record<string, string> = {
  "hi-IN": "हिन्दी",
  "bn-IN": "বাংলা",
  "mr-IN": "मराठी",
  "ta-IN": "தமிழ்",
  "te-IN": "తెలుగు",
  "gu-IN": "ગુજરાતી",
  "kn-IN": "ಕನ್ನಡ",
  "ml-IN": "മലയാളം",
  "pa-IN": "ਪੰਜਾਬੀ",
  "od-IN": "ଓଡ଼ିଆ",
  "as-IN": "অসমীয়া",
  "ur-IN": "اردو",
  "ne-IN": "नेपाली",
  "mai-IN": "मैथिली",
  "kok-IN": "कोंकणी",
  "doi-IN": "डोगरी",
  "sa-IN": "संस्कृतम्",
  "sd-IN": "سنڌي",
  "ks-IN": "كٲشُر",
  "mni-IN": "মৈতৈলোন্",
  "brx-IN": "बड़ो",
  "sat-IN": "ᱥᱟᱱᱛᱟᱲᱤ",
};
const TTS_LANGS = new Set(["hi-IN", "bn-IN", "ta-IN", "te-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "od-IN", "en-IN"]);

async function call<T>(path: string, init: { json?: unknown; form?: FormData; timeoutMs?: number }): Promise<T> {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("SARVAM_API_KEY is not set");
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "api-subscription-key": key, ...(init.json ? { "content-type": "application/json" } : {}) },
    body: init.form ?? JSON.stringify(init.json),
    signal: AbortSignal.timeout(init.timeoutMs ?? 20_000),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  const inc = {
    fingerprint: `sarvam:${path}`,
    title: `Sarvam ${path} is failing: voice notes / translation / understanding degraded`,
    rule_name: "sarvam_api_error",
    severity: res.status === 401 || res.status === 403 || res.status === 429 ? ("critical" as const) : ("high" as const),
    description: `HTTP ${res.status}: ${data?.error?.message ?? "no message"}. The bot falls back to the rule parser and English replies.`,
    subject: { name: `api.sarvam.ai${path}`, type: "external-api" },
  };
  health(!res.ok, inc);
  if (!res.ok) throw new Error(data?.error?.message ?? `Sarvam ${path} failed (${res.status})`);
  return data as T;
}

/** Voice note -> English text (mode=translate) plus the language it was spoken in. Sync API: max 30 s of audio. */
export async function speechToEnglish(audio: Blob, filename: string) {
  const form = new FormData();
  form.set("file", audio, filename);
  form.set("model", "saaras:v4");
  form.set("mode", "translate");
  const r = await call<{ transcript: string; language_code: string | null }>("/speech-to-text", { form, timeoutMs: 45_000 });
  return { text: r.transcript?.trim() ?? "", lang: r.language_code ?? "en-IN" };
}

export async function detectLanguage(text: string): Promise<string> {
  const r = await call<{ language_code: string | null }>("/text-lid", { json: { input: text.slice(0, 1000) } });
  return r.language_code ?? "en-IN";
}

export async function translate(text: string, target: string, source = "en-IN"): Promise<string> {
  if (target === source || !text.trim()) return text;
  const r = await call<{ translated_text: string }>("/translate", {
    json: { input: text.slice(0, 2000), source_language_code: source, target_language_code: target, model: "sarvam-translate:v1" },
  });
  return r.translated_text;
}

/** Text -> MP3 (base64). Returns null for languages Bulbul cannot speak. */
export async function speak(text: string, lang: string): Promise<string | null> {
  if (!TTS_LANGS.has(lang)) return null;
  const r = await call<{ audios: string[] }>("/text-to-speech", {
    json: { text: text.slice(0, 2500), language_code: lang, model: "bulbul:v3", output_audio_codec: "mp3" },
    timeoutMs: 30_000,
  });
  return r.audios?.[0] ?? null;
}

export async function chat(system: string, user: string): Promise<string> {
  const r = await call<{ choices: { message: { content: string | null } }[] }>("/v1/chat/completions", {
    json: { model: "sarvam-105b", messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.1, max_tokens: 200, reasoning_effort: null },
  });
  return r.choices?.[0]?.message?.content?.trim() ?? "";
}

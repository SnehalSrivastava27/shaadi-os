import { NextResponse } from "next/server";
import { z } from "zod";
import { flag } from "@/lib/flags";
import { SARVAM_LANGS, sarvamOn, translate } from "@/lib/sarvam";

export const dynamic = "force-dynamic";

// PUBLIC (guests aren't signed in): capped input, per-IP rate limit and a cache so a page costs Sarvam credits once.
const cache = new Map<string, string>();
const hits = new Map<string, number[]>();
const MAX_CACHE = 20_000;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear(); // ponytail: crude memory cap, fine for one server
  return recent.length > 20;
}

async function translateMany(texts: string[], target: string): Promise<string[]> {
  // Pack several strings per call, split back on newlines; if Sarvam merges lines, fall back to one call each.
  const chunks: string[][] = [[]];
  for (const t of texts) {
    const cur = chunks.at(-1)!;
    if (cur.length && [...cur, t].join("\n").length > 1500) chunks.push([t]);
    else cur.push(t);
  }
  const out: string[] = [];
  for (const chunk of chunks) {
    const joined = await translate(chunk.join("\n"), target);
    const lines = joined.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === chunk.length) out.push(...lines);
    else for (const t of chunk) out.push(await translate(t, target));
  }
  return out;
}

export async function GET() {
  const enabled = sarvamOn() && (await flag("invite_translation"));
  return NextResponse.json({ enabled, languages: enabled ? SARVAM_LANGS : {} });
}

const body = z.object({
  target: z.string().refine((t) => t in SARVAM_LANGS, "Unsupported language"),
  texts: z.array(z.string().trim().min(1).max(500)).min(1).max(150),
});

export async function POST(req: Request) {
  if (!sarvamOn() || !(await flag("invite_translation"))) return NextResponse.json({ error: "Translation is off" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many requests, try again in a minute" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { target, texts } = parsed.data;
  if (texts.join("").length > 12_000) return NextResponse.json({ error: "Too much text" }, { status: 413 });

  const missing = [...new Set(texts.filter((t) => !cache.has(`${target}\0${t}`)))];
  try {
    if (missing.length) {
      const done = await translateMany(missing, target);
      if (cache.size > MAX_CACHE) cache.clear();
      missing.forEach((t, i) => cache.set(`${target}\0${t}`, done[i]));
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Translation failed" }, { status: 502 });
  }
  return NextResponse.json({ translations: texts.map((t) => cache.get(`${target}\0${t}`) ?? t) });
}

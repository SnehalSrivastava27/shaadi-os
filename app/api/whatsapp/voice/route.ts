import { NextResponse } from "next/server";
import { z } from "zod";
import { waConfig } from "@/lib/whatsappServer";
import { flag } from "@/lib/flags";
import { sarvamOn, speechToEnglish } from "@/lib/sarvam";

export const dynamic = "force-dynamic";

/** WhatsApp voice note -> English text + spoken language, via Sarvam speech-to-text. */
export async function POST(req: Request) {
  const parsed = z.object({ id: z.string().min(1).max(100) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!sarvamOn()) return NextResponse.json({ error: "Voice notes need SARVAM_API_KEY" }, { status: 503 });
  if (!(await flag("whatsapp_voice_notes"))) return NextResponse.json({ error: "Voice notes are turned off" }, { status: 403 });
  const cfg = waConfig();
  if (!cfg) return NextResponse.json({ error: "WhatsApp bridge is not configured" }, { status: 503 });

  const media = await fetch(`${cfg.url}/media?id=${encodeURIComponent(parsed.data.id)}`, {
    headers: { "x-bridge-token": cfg.token },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  }).catch(() => null);
  if (!media?.ok) return NextResponse.json({ error: "Voice note not found" }, { status: 404 });
  try {
    const type = media.headers.get("content-type") ?? "audio/ogg";
    const blob = new Blob([await media.arrayBuffer()], { type: type.split(";")[0] });
    return NextResponse.json(await speechToEnglish(blob, "voice.ogg"));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Transcription failed" }, { status: 502 });
  }
}

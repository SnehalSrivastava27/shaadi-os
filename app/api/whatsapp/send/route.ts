import { NextResponse } from "next/server";
import { z } from "zod";
import { callWa } from "@/lib/whatsappServer";
import { flag } from "@/lib/flags";
import { sarvamOn, speak, translate } from "@/lib/sarvam";

export const dynamic = "force-dynamic";

const sendBody = z.object({
  text: z.string().trim().min(1).max(1000),
  to: z.enum(["self", "group"]).optional(),
  mentions: z.array(z.string().max(80)).max(5).optional(),
  /** Sender's language (e.g. "hi-IN"): also reply translated, and spoken if `voice`. */
  lang: z.string().regex(/^[a-z]{2,3}-IN$/).optional(),
  voice: z.boolean().optional(),
});

/** Replies go only to the owner's own chat or the one Shaadi OS group: no arbitrary numbers from the browser. */
export async function POST(req: Request) {
  const parsed = sendBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const { text, to, mentions, lang, voice } = parsed.data;
  if (to === "group" && !(await flag("whatsapp_group_mode"))) return NextResponse.json({ error: "Group mode is off" }, { status: 403 });

  const { status, data } = await callWa("/send", { method: "POST", body: { text, to, mentions } });
  if (status !== 200) return NextResponse.json({ error: data.error ?? "Send failed" }, { status });

  // Native-language follow-up (Sarvam). English message above keeps the @tags and command words intact.
  if (lang && lang !== "en-IN" && sarvamOn() && (await flag("whatsapp_native_replies"))) {
    try {
      const plain = text.replace(/@\d+/g, "").replace(/\*/g, "").replace(/[ \t]+/g, " ").trim();
      const native = await translate(plain, lang);
      await callWa("/send", { method: "POST", body: { text: native, to } });
      const audio = voice ? await speak(native, lang) : null;
      if (audio) await callWa("/send", { method: "POST", body: { audio, to }, timeoutMs: 20_000 });
    } catch (e) {
      console.error("[sarvam] native reply failed:", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json(data);
}

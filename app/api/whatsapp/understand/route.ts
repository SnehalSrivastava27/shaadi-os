import { NextResponse } from "next/server";
import { z } from "zod";
import { flag } from "@/lib/flags";
import { chat, detectLanguage, sarvamOn } from "@/lib/sarvam";
import { geocode } from "@/lib/geocode";
import { parseTime } from "@/lib/whatsappCommands";
import { parseJsonLoose } from "@/lib/invite/merge";

export const dynamic = "force-dynamic";

const SYSTEM = `You read one WhatsApp message from an Indian wedding family (any Indian language, Hinglish or English) and extract a logistics request.
Reply with JSON only, no prose:
{"task":true,"from":"<place>","to":"<place>","time":"HH:mm" or null,"tomorrow":false,"people":1,"errand":false}
- "from"/"to": real place names as a local would type them in a map search (e.g. "Hazratganj", "Charbagh railway station", "Phoenix Palassio"). Use "home" for ghar/home/the wedding house.
- Pickup ("X ko <place> se laana hai"): from=<place>, to="home". Drop ("chhodna hai"): from="home", to=<place>.
- Shopping errand with no shop named (e.g. "sabzi laani hai"): errand=true, from = a real, well-known market for that item in the wedding city (a name findable on OpenStreetMap, e.g. "Aminabad" in Lucknow), to="home".
- time: 24h; "3 baje" without morning/evening means 15:00; null if no time.
If the message is not a pickup, drop or errand request, reply {"task":false}.`;

const extracted = z.object({
  task: z.boolean(),
  from: z.string().max(120).optional(),
  to: z.string().max(120).optional(),
  time: z.string().regex(/^\d{1,2}:\d{2}$/).nullish(),
  tomorrow: z.boolean().optional(),
  people: z.number().int().min(1).max(20).optional(),
  errand: z.boolean().optional(),
});

/**
 * Sarvam chat extracts from/to/time/people from any message, then each place is looked up
 * (saved places first, then OpenStreetMap), so the bot knows every place, not just five.
 */
export async function POST(req: Request) {
  const parsed = z.object({ text: z.string().trim().min(1).max(1000), city: z.string().max(60).default("Lucknow") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!sarvamOn() || !(await flag("ai_understanding"))) return NextResponse.json({ input: null, lang: "en-IN" });
  const { text, city } = parsed.data;
  try {
    const [raw, lang] = await Promise.all([chat(`${SYSTEM}\nThe wedding city is ${city}.`, text), /[^\x00-\x7F]/.test(text) ? detectLanguage(text) : Promise.resolve("en-IN")]);
    const r = extracted.safeParse(parseJsonLoose(raw));
    if (!r.success || !r.data.task || !r.data.from || !r.data.to) return NextResponse.json({ input: null, lang });
    const [pickup, drop] = [await geocode(r.data.from, city), await geocode(r.data.to, city)];
    if (!pickup || !drop) return NextResponse.json({ input: null, lang, unknownPlace: !pickup ? r.data.from : r.data.to });
    const title = text.replace(/\s+/g, " ").slice(0, 80);
    return NextResponse.json({
      lang,
      input: {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        type: r.data.errand ? "errand" : "pickup",
        pickup,
        drop,
        time: parseTime(`${r.data.time ?? ""} ${r.data.tomorrow ? "kal" : ""}`, Date.now()),
        peopleCount: r.data.people ?? 1,
      },
    });
  } catch (e) {
    return NextResponse.json({ input: null, lang: "en-IN", error: e instanceof Error ? e.message : "Sarvam failed" });
  }
}

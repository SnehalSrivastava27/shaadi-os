import { NextResponse } from "next/server";
import { z } from "zod";
import { callWa } from "@/lib/whatsappServer";

export const dynamic = "force-dynamic";

const sendBody = z.object({ text: z.string().trim().min(1).max(1000), to: z.enum(["self", "group"]).optional(),
  mentions: z.array(z.string().max(80)).max(5).optional(),
});

/** Replies go only to the owner's own chat or the one Shaadi OS group: no arbitrary numbers from the browser. */
export async function POST(req: Request) {
  const parsed = sendBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const { status, data } = await callWa("/send", { method: "POST", body: parsed.data });
  return NextResponse.json(status === 200 ? data : { error: data.error ?? "Send failed" }, { status });
}

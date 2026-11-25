import { NextResponse } from "next/server";
import { callWa, waConfig } from "@/lib/whatsappServer";

export const dynamic = "force-dynamic";

/** WhatsApp bridge status: off | connecting | qr | open | closed. */
export async function GET() {
  if (!waConfig()) return NextResponse.json({ state: "off" });
  const { status, data } = await callWa("/health", { timeoutMs: 4000 });
  if (status !== 200) return NextResponse.json({ state: "off", error: data.error ?? "Bridge offline" });
  return NextResponse.json({ state: data.state, qr: data.qr, me: data.me });
}

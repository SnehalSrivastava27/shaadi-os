import { NextResponse } from "next/server";
import { bridgeConfig, callBridge } from "@/lib/providers/bridgeServer";

export const dynamic = "force-dynamic";

/** Is the phone ride bridge configured and alive? */
export async function GET() {
  if (!bridgeConfig()) return NextResponse.json({ mode: "off" });
  const { status, data } = await callBridge("/health", { timeoutMs: 4000 });
  if (status !== 200) return NextResponse.json({ mode: "off", error: data.error ?? data.detail ?? "Bridge offline" });
  return NextResponse.json({ mode: data.mode, allowBooking: !!data.allowBooking, busy: !!data.busy });
}

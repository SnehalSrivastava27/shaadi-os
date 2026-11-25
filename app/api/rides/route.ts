import { NextResponse } from "next/server";
import { bridgeConfig, callBridge } from "@/lib/providers/bridgeServer";
import { flag } from "@/lib/flags";

export const dynamic = "force-dynamic";

/** Is the phone ride bridge configured and alive? */
export async function GET() {
  // Flagsmith "real_rides" off -> the app falls back to demo rates, no real booking.
  if (!bridgeConfig() || !(await flag("real_rides"))) return NextResponse.json({ mode: "off" });
  const { status, data } = await callBridge("/health", { timeoutMs: 4000 });
  if (status !== 200) return NextResponse.json({ mode: "off", error: data.error ?? data.detail ?? "Bridge offline" });
  return NextResponse.json({ mode: data.mode, allowBooking: !!data.allowBooking, busy: !!data.busy });
}

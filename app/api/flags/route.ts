import { NextResponse } from "next/server";
import { flagsmithOn, getFlags } from "@/lib/flags";
import { sarvamOn } from "@/lib/sarvam";

export const dynamic = "force-dynamic";

/** Live feature flags for the dashboard (polled, so a Flagsmith flip shows without a reload). */
export async function GET() {
  return NextResponse.json({ flags: await getFlags(), flagsmith: flagsmithOn(), sarvam: sarvamOn() });
}

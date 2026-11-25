import { NextResponse } from "next/server";
import { actionQueue } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";

/** Dashboard drains approved NudgeBee runbook actions (signed-in only, via proxy). */
export async function POST() {
  return NextResponse.json({ actions: actionQueue.splice(0) });
}

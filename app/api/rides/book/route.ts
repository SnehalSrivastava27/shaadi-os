import { NextResponse } from "next/server";
import { callBridge } from "@/lib/providers/bridgeServer";
import { bookBody } from "../schema";
import { flag } from "@/lib/flags";
import { health } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await flag("real_rides"))) return NextResponse.json({ error: "Real rides are switched off (Flagsmith: real_rides)" }, { status: 403 });
  const parsed = bookBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  const { status, data } = await callBridge("/book", { method: "POST", body: parsed.data, timeoutMs: 290_000 });
  health(status >= 500 && status !== 503, { // 503 = bridge not configured, not an incident
    fingerprint: "ride-bridge:book",
    title: "Uber/Rapido book failing: guests may be left without a cab",
    rule_name: "ride_bridge_error",
    severity: "high",
    description: `POST /book on the phone ride bridge returned ${status}: ${data.error ?? data.detail ?? "no body"}`,
    subject: { name: "ride-bridge", type: "service" },
  });
  return NextResponse.json(status === 200 ? data : { error: data.error ?? data.detail ?? "Booking failed" }, { status });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { fire, nudgebeeStatus, openFingerprints, resolve } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";

/** NudgeBee status for Settings: is it wired, which incidents are open, last deliveries. */
export async function GET() {
  return NextResponse.json(nudgebeeStatus());
}

const body = z.object({
  tasks: z
    .array(z.object({ id: z.string().max(60), no: z.number().int(), title: z.string().max(120), from: z.string().max(120), to: z.string().max(120), time: z.string().max(40), status: z.string().max(20) }))
    .max(200),
});

const WARN_BEFORE_MIN = 15;
const STALE_AFTER_MIN = 60; // ignore old demo/seed tasks so NudgeBee isn't flooded

/**
 * Wedding SLA check, sent by the dashboard every few seconds: a pickup that nobody has claimed
 * 15 minutes before its time is an incident ("Bua ji will be waiting at Charbagh").
 */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const now = Date.now();
  const firing = new Set<string>();
  for (const t of parsed.data.tasks) {
    const mins = (Date.parse(t.time) - now) / 60_000;
    if (!["created", "declined", "offered"].includes(t.status) || mins > WARN_BEFORE_MIN || mins < -STALE_AFTER_MIN) continue;
    const fp = `task:${t.id}:unclaimed`;
    firing.add(fp);
    fire({
      fingerprint: fp,
      title: mins >= 0 ? `Pickup #${t.no} unclaimed, due in ${Math.round(mins)} min: ${t.title}` : `Pickup #${t.no} is ${Math.round(-mins)} min late and still unclaimed: ${t.title}`,
      rule_name: "task_unclaimed_near_pickup_time",
      severity: mins < 5 ? "critical" : "high",
      description: `${t.from} → ${t.to} at ${t.time}. Status "${t.status}": no helper has taken it in the WhatsApp group. Runbook options: auto_assign (nearest free helper), repost_to_group (tag everyone again).`,
      subject: { name: `task-${t.no}`, type: "wedding-task" },
      labels: { task_id: t.id, task_no: String(t.no) },
    });
  }
  for (const fp of openFingerprints("task:")) if (!firing.has(fp)) resolve(fp); // claimed, done or canceled
  return NextResponse.json({ firing: firing.size });
}

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { actionQueue } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";

const body = z.object({
  action: z.enum(["auto_assign", "repost_to_group", "restart_whatsapp_bridge"]),
  task_id: z.string().max(60).optional(),
  approved_by: z.string().max(80).optional(),
});

function authorized(req: Request) {
  const want = process.env.NUDGEBEE_ACTION_TOKEN ?? "";
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return want.length >= 16 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

/**
 * Called by a NudgeBee workflow (HTTP task) after a human approves the runbook step.
 * Public route (no session), so it needs NUDGEBEE_ACTION_TOKEN as a Bearer token. Actions are queued;
 * the dashboard (which owns the wedding data) runs them within ~5 s.
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action", issues: parsed.error.issues }, { status: 400 });
  const { action, task_id, approved_by } = parsed.data;
  if (action !== "restart_whatsapp_bridge" && !task_id) return NextResponse.json({ error: "task_id is required" }, { status: 400 });

  if (action === "restart_whatsapp_bridge") {
    // Kill the bridge child; lib/waAutostart.ts brings it back in ~3 s with the saved login.
    const child = (globalThis as { __waBridge?: { kill?: () => void } }).__waBridge;
    if (!child?.kill) return NextResponse.json({ error: "Bridge is not managed by this server (WA_BRIDGE_URL set or autostart off)" }, { status: 409 });
    child.kill();
    return NextResponse.json({ ok: true, action });
  }
  const item = { id: crypto.randomUUID(), action, taskId: task_id, at: Date.now(), by: approved_by ?? "NudgeBee" };
  actionQueue.push(item);
  if (actionQueue.length > 100) actionQueue.shift();
  return NextResponse.json({ ok: true, queued: item.id });
}

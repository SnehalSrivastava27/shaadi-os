import { NextResponse } from "next/server";
import { callWa } from "@/lib/whatsappServer";
import { flag } from "@/lib/flags";
import { health } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const since = Math.max(0, Number(new URL(req.url).searchParams.get("since")) || 0);
  const { status, data } = await callWa(`/inbox?since=${since}`, { timeoutMs: 4000 });
  // Polled every ~5 s by the dashboard: the natural heartbeat for "is WhatsApp still working?"
  health(status !== 200 && status !== 503, {
    fingerprint: "wa-bridge:unreachable",
    title: "WhatsApp bridge is not answering: family messages are not reaching Shaadi OS",
    rule_name: "whatsapp_bridge_unreachable",
    severity: "critical",
    description: `GET /inbox on the wa-bridge returned ${status}: ${data.error ?? "no body"}. Tasks posted in the WhatsApp group are not being created or claimed.`,
    subject: { name: "wa-bridge", type: "service" },
  });
  if (status !== 200) return NextResponse.json({ error: data.error ?? "Inbox failed" }, { status });
  // Flagsmith "whatsapp_group_mode" off: ignore the group, self-chat tasks are auto-assigned again.
  if (!(await flag("whatsapp_group_mode"))) {
    return NextResponse.json({ messages: (data.messages ?? []).filter((m: { from?: string }) => m.from !== "group"), hasGroup: false });
  }
  return NextResponse.json(data);
}

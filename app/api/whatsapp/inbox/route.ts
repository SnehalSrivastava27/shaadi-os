import { NextResponse } from "next/server";
import { callWa } from "@/lib/whatsappServer";
import { flag } from "@/lib/flags";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const since = Math.max(0, Number(new URL(req.url).searchParams.get("since")) || 0);
  const { status, data } = await callWa(`/inbox?since=${since}`, { timeoutMs: 4000 });
  if (status !== 200) return NextResponse.json({ error: data.error ?? "Inbox failed" }, { status });
  // Flagsmith "whatsapp_group_mode" off: ignore the group, self-chat tasks are auto-assigned again.
  if (!(await flag("whatsapp_group_mode"))) {
    return NextResponse.json({ messages: (data.messages ?? []).filter((m: { from?: string }) => m.from !== "group"), hasGroup: false });
  }
  return NextResponse.json(data);
}

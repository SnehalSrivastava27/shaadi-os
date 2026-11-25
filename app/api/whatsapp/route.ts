import { NextResponse } from "next/server";
import { callWa, waConfig } from "@/lib/whatsappServer";
import { flag } from "@/lib/flags";
import { health } from "@/lib/nudgebee";

export const dynamic = "force-dynamic";

/** WhatsApp bridge status: off | connecting | qr | open | closed. */
export async function GET() {
  if (!waConfig()) return NextResponse.json({ state: "off" });
  const { status, data } = await callWa("/health", { timeoutMs: 4000 });
  if (status !== 200) return NextResponse.json({ state: "off", error: data.error ?? "Bridge offline" });
  health(data.state === "closed" || data.state === "qr", {
    fingerprint: "wa-bridge:logged-out",
    title: data.state === "qr" ? "WhatsApp is logged out: someone must scan the QR in Settings" : "WhatsApp connection dropped",
    rule_name: "whatsapp_disconnected",
    severity: "high",
    description: `wa-bridge reports state "${data.state}". Until it is "open", group messages are not received.`,
    subject: { name: "wa-bridge", type: "service" },
  });
  const groupMode = await flag("whatsapp_group_mode");
  return NextResponse.json({ state: data.state, qr: data.qr, me: data.me, groupMode, ...(groupMode && { group: data.group, groupName: data.groupName }) });
}

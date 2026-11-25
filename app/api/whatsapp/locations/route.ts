import { NextResponse } from "next/server";
import { callWa } from "@/lib/whatsappServer";

export const dynamic = "force-dynamic";

/** Latest location / live location each WhatsApp group member shared (newer than `since`). */
export async function GET(req: Request) {
  const since = Math.max(0, Number(new URL(req.url).searchParams.get("since")) || 0);
  const { status, data } = await callWa(`/locations?since=${since}`, { timeoutMs: 4000 });
  return NextResponse.json(status === 200 ? data : { error: data.error ?? "Locations failed" }, { status });
}

import { NextResponse } from "next/server";
import { callBridge } from "@/lib/providers/bridgeServer";
import { bookBody } from "../schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const parsed = bookBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking request" }, { status: 400 });
  const { status, data } = await callBridge("/book", { method: "POST", body: parsed.data, timeoutMs: 290_000 });
  return NextResponse.json(status === 200 ? data : { error: data.error ?? data.detail ?? "Booking failed" }, { status });
}

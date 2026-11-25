import { NextResponse } from "next/server";
import { callBridge } from "@/lib/providers/bridgeServer";
import { quoteBody } from "../schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // the phone agent can take a couple of minutes

export async function POST(req: Request) {
  const parsed = quoteBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid quote request" }, { status: 400 });
  const { status, data } = await callBridge("/quote", { method: "POST", body: parsed.data, timeoutMs: 290_000 });
  return NextResponse.json(status === 200 ? data : { error: data.error ?? data.detail ?? "Quote failed" }, { status });
}

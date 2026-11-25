// Server-only helper for talking to the WhatsApp bridge (wa-bridge/server.mjs).
import "server-only";

export function waConfig(): { url: string; token: string } | null {
  const url = process.env.WA_BRIDGE_URL?.replace(/\/$/, "");
  const token = process.env.WA_BRIDGE_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export async function callWa(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}) {
  const cfg = waConfig();
  if (!cfg) return { status: 503, data: { error: "WhatsApp bridge is not configured (WA_BRIDGE_URL / WA_BRIDGE_TOKEN)." } };
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: init.method ?? "GET",
      headers: { "content-type": "application/json", "x-bridge-token": cfg.token },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(init.timeoutMs ?? 10_000),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({ error: `Bridge returned ${res.status}` }));
    return { status: res.status, data };
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "Bridge took too long to answer" : "WhatsApp bridge is not reachable";
    return { status: 502, data: { error: msg } };
  }
}

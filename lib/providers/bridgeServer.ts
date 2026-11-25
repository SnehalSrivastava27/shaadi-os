// Server-only helper for talking to the ride bridge (ride-bridge/server.py).
import "server-only";

export function bridgeConfig(): { url: string; token: string } | null {
  const url = process.env.RIDE_BRIDGE_URL?.replace(/\/$/, "");
  const token = process.env.RIDE_BRIDGE_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export async function callBridge(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}) {
  const cfg = bridgeConfig();
  if (!cfg) return { status: 503, data: { error: "Ride bridge is not configured (RIDE_BRIDGE_URL / RIDE_BRIDGE_TOKEN)." } };
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
    const msg = e instanceof Error && e.name === "TimeoutError" ? "Bridge took too long to answer" : "Bridge is not reachable";
    return { status: 502, data: { error: msg } };
  }
}

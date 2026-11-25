// Server-only NudgeBee client: Shaadi OS reports wedding-day incidents to NudgeBee's Event Webhook
// (docs: integrations/Webhooks/event_webhook.md), where its AI agents investigate and runbooks act.
// Not configured -> every call is a no-op. Never throws: ops reporting must not break the wedding.
import "server-only";

export type NbSeverity = "critical" | "high" | "medium" | "low" | "info";
export type NbIncident = {
  /** Stable across occurrences, e.g. "wa-bridge:down" or "task:t-123:unclaimed". */
  fingerprint: string;
  title: string;
  rule_name: string;
  severity?: NbSeverity;
  description?: string;
  subject?: { name: string; type: string; namespace?: string };
  labels?: Record<string, string>;
};

type Open = { id: string; incident: NbIncident; at: number };
const g = globalThis as { __nbOpen?: Map<string, Open>; __nbLog?: { at: string; fingerprint: string; status: string; ok: boolean; error?: string }[] };
const open = (g.__nbOpen ??= new Map()); // fingerprint -> currently firing event (send firing once, resolved once)
const log = (g.__nbLog ??= []);

export const nudgebeeOn = () => !!process.env.NUDGEBEE_EVENT_WEBHOOK_URL;

function stripToken(url: string) {
  // The token is a credential; send it as a Bearer header instead of in the URL (supported by NudgeBee).
  const u = new URL(url);
  const token = u.searchParams.get("token") ?? process.env.NUDGEBEE_EVENT_TOKEN ?? "";
  u.searchParams.delete("token");
  return { url: u.toString(), token };
}

async function send(status: "firing" | "resolved", id: string, inc: NbIncident, startsAt: number) {
  const raw = process.env.NUDGEBEE_EVENT_WEBHOOK_URL;
  if (!raw) return;
  const { url, token } = stripToken(raw);
  const body = {
    id,
    fingerprint: inc.fingerprint,
    status,
    title: inc.title.slice(0, 250),
    rule_name: inc.rule_name,
    severity: inc.severity ?? "medium",
    description: inc.description?.slice(0, 2000),
    starts_at: new Date(startsAt).toISOString(),
    ...(status === "resolved" && { ends_at: new Date().toISOString() }),
    subject: inc.subject,
    source_tool: "Shaadi OS",
    labels: { app: "shaadi-os", ...inc.labels },
  };
  let entry: (typeof log)[number] = { at: new Date().toISOString(), fingerprint: inc.fingerprint, status, ok: false };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token && { authorization: `Bearer ${token}` }) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    entry = { ...entry, ok: res.ok, ...(!res.ok && { error: `${res.status} ${(await res.text()).slice(0, 200)}` }) };
  } catch (e) {
    entry.error = e instanceof Error ? e.message : String(e);
  }
  log.push(entry);
  if (log.length > 50) log.shift();
  if (!entry.ok) console.error("[nudgebee]", entry.status, entry.fingerprint, entry.error);
}

/** Problem is happening. Sent once per occurrence; repeats are ignored until it resolves. */
export function fire(inc: NbIncident) {
  if (!nudgebeeOn() || open.has(inc.fingerprint)) return;
  const o = { id: `${inc.fingerprint}:${Date.now()}`, incident: inc, at: Date.now() };
  open.set(inc.fingerprint, o);
  void send("firing", o.id, inc, o.at);
}

/** Problem is over: closes the open event (same id + fingerprint + labels, as NudgeBee requires). */
export function resolve(fingerprint: string) {
  const o = open.get(fingerprint);
  if (!o) return;
  open.delete(fingerprint);
  void send("resolved", o.id, o.incident, o.at);
}

/** fire() when `failing`, resolve() otherwise: one line at each health check. */
export function health(failing: boolean, inc: NbIncident) {
  if (failing) fire(inc);
  else resolve(inc.fingerprint);
}

export const openFingerprints = (prefix: string) => [...open.keys()].filter((f) => f.startsWith(prefix));

export function nudgebeeStatus() {
  return { on: nudgebeeOn(), open: [...open.values()].map((o) => ({ fingerprint: o.incident.fingerprint, title: o.incident.title, severity: o.incident.severity ?? "medium", since: o.at })), recent: log.slice(-10) };
}

// ---- Runbook actions: NudgeBee (after human approval) -> Shaadi OS -------------------------------------------
export type OpsAction = { id: string; action: "auto_assign" | "repost_to_group" | "restart_whatsapp_bridge"; taskId?: string; at: number; by: string };
const ga = globalThis as { __nbActions?: OpsAction[] };
export const actionQueue = (ga.__nbActions ??= []);

# NudgeBee in Shaadi OS: the wedding-day SRE

A wedding is a production system with a hard deadline and no second chance. If the WhatsApp bridge drops at 2 pm, nobody notices until Bua ji has been waiting at Charbagh for an hour. Shaadi OS uses **NudgeBee**, an agentic ops platform, as its on-call engineer:

1. **Detect.** Shaadi OS reports wedding-day incidents to NudgeBee's **Event Webhook** as they happen, and resolves them when they recover.
2. **Investigate.** NudgeBee's AI agents enrich and correlate the events: which service, since when, what else broke at the same time.
3. **Act, with approval.** A NudgeBee **workflow (runbook)** proposes a fix. A human approves it in NudgeBee, and the workflow calls back into Shaadi OS, which carries it out.

```
Shaadi OS (server + dashboard)                         NudgeBee
────────────────────────────────                       ─────────────────────────────────────
health checks on every poll ──── firing / resolved ──► Event Webhook  /api/webhooks/event
  • WhatsApp bridge unreachable / logged out            ├─ Troubleshoot → All Events (AI enrichment)
  • Sarvam API errors (401/403/429/5xx)                 ├─ AI agent investigation
  • Flagsmith unreachable                               └─ Workflow / runbook (approval-gated)
  • Uber/Rapido phone bridge errors                                │  human clicks Approve
  • 🧡 pickup unclaimed 15 min before time                          ▼
                                                       HTTP task: POST /api/ops/remediate
◄──────────── auto_assign │ repost_to_group │ restart_whatsapp_bridge ─┘   (Bearer NUDGEBEE_ACTION_TOKEN)
dashboard runs it within ~5 s, posts in the WhatsApp group, logs it on the timeline
```

## What we report

| Incident | Fingerprint | Severity | Fires when | Resolves when |
|---|---|---|---|---|
| WhatsApp bridge unreachable | `wa-bridge:unreachable` | critical | The bridge doesn't answer the dashboard's ~5 s inbox poll | The next successful poll |
| WhatsApp logged out or dropped | `wa-bridge:logged-out` | high | The bridge state is `qr` or `closed` | The state is `open` again |
| Sarvam failing | `sarvam:/speech-to-text`, `sarvam:/translate`, … | critical for 401/403/429, else high | A Sarvam call returns an error | The next successful call to that endpoint |
| Flagsmith unreachable | `flagsmith:unreachable` | low | The flags API errors or times out (the app keeps running on defaults) | The next successful fetch |
| Ride bridge failing | `ride-bridge:quote`, `ride-bridge:book` | high | The phone bridge returns 5xx (except 503, which means not configured) | The next successful call |
| **Pickup unclaimed** | `task:<id>:unclaimed` | critical if under 5 min away, else high | A task is still `created`/`declined`/`offered` 15 min before its time (tasks over 60 min late are ignored as stale) | Someone takes it, it's done, or it's canceled |

The **unclaimed pickup** is the one that matters most. It's a business incident, not an infrastructure one: *"Pickup #7 unclaimed, due in 8 min: Bua ji ko Charbagh se laana hai."* NudgeBee treats it like any other production alert.

Every event uses NudgeBee's documented format: `id`, `fingerprint`, `status`, `title`, `rule_name`, `severity`, `starts_at`/`ends_at` (RFC 3339), `subject`, `source_tool: "Shaadi OS"`, and `labels` (`app: shaadi-os`, plus `task_id`/`task_no` for tasks).

## Runbook actions (NudgeBee → Shaadi OS)

`POST /api/ops/remediate` with `Authorization: Bearer <NUDGEBEE_ACTION_TOKEN>`:

| `action` | Body | What Shaadi OS does |
|---|---|---|
| `auto_assign` | `{"action":"auto_assign","task_id":"t-…","approved_by":"Riya"}` | Assigns the task to the nearest free helper (the same algorithm as the dashboard) and announces it in the WhatsApp group |
| `repost_to_group` | `{"action":"repost_to_group","task_id":"t-…"}` | Posts *"⏰ Still needed! Kaam #7 … Reply: take 7"* to the group again |
| `restart_whatsapp_bridge` | `{"action":"restart_whatsapp_bridge"}` | Kills the bridge process. The auto-start brings it back in about 3 s with the saved login |

The `task_id` comes from the event's `labels.task_id`. In the NudgeBee workflow, pass it as `{{ Inputs.webhook_json.labels.task_id }}` or from the event context.

## How it is built

| File | Role |
|---|---|
| `lib/nudgebee.ts` | The only NudgeBee client. `fire()`, `resolve()`, `health(failing, incident)`. It keeps the open incidents in memory so each problem is sent **once** as firing and **once** as resolved, with the same `id`, `fingerprint` and `labels` that NudgeBee's docs require. The token is sent as a `Bearer` header, not in the URL. It never throws, so a NudgeBee outage can't break a wedding. |
| `app/api/whatsapp/inbox`, `app/api/whatsapp`, `lib/sarvam.ts`, `lib/flags.ts`, `app/api/rides/*` | One `health(...)` line at each place that can fail |
| `app/api/ops` | `GET` returns the status for Settings. `POST` is the wedding SLA check, which the dashboard sends every tick |
| `app/api/ops/remediate` | The public callback for NudgeBee runbooks. It checks the Bearer token in constant time (`timingSafeEqual`) and validates the request with zod |
| `app/api/ops/actions` | The dashboard collects approved actions here (signed-in users only) |
| `components/ops/NudgeBeeCard.tsx` | Settings → **NudgeBee ops**: open incidents and the last delivery error |

## Setup

### 1. Get a NudgeBee instance
Pick one:
- **Hosted:** sign up at https://app.nudgebee.com/signup (free tier).
- **Self-hosted:** clone `nudgebee/nudgebee` and run `docker compose up -d`, then the API server (`make run`, port 8000) and the app (`npm run dev`). This needs Docker, Go and Node. NudgeBee is BSL 1.1, so running it for your own internal use is allowed.

### 2. Create the Event Webhook
NudgeBee → **Admin → Integrations → Webhooks → Event Webhook** → name it `Shaadi OS` → **Save** → copy the URL (`https://<domain>/api/webhooks/event?token=…`).

### 3. Configure Shaadi OS (`.env.local`)
```
NUDGEBEE_EVENT_WEBHOOK_URL=https://<your-nudgebee-domain>/api/webhooks/event?token=<token>
NUDGEBEE_ACTION_TOKEN=<openssl rand -hex 24>   # already generated in .env.local
```
Restart `npm run dev`. Settings → NudgeBee ops should say **All clear**.

### 4. Optional: the approval-gated runbook
In NudgeBee's **Workflow builder**:
1. **Trigger:** an event whose `rule_name` is `task_unclaimed_near_pickup_time`.
2. **Approval step:** notify the family organizer on Slack or email, and wait for Approve.
3. **HTTP task:** `POST https://<shaadi-os>/api/ops/remediate`, header `Authorization: Bearer <NUDGEBEE_ACTION_TOKEN>`, body `{"action":"auto_assign","task_id":"<labels.task_id>","approved_by":"<approver>"}`.

To reach a laptop running the demo, expose it with a tunnel (for example `cloudflared tunnel --url http://localhost:3001`) and use that URL.

## Verify
- **Event format:** a local stand-in for NudgeBee's endpoint applied every rule in the Event Webhook docs (required fields, `firing`/`resolved`, severity values, RFC 3339 times, string-only labels, no `nb_` labels, Bearer auth). The firing and resolved events passed, and repeated failures did **not** resend.
- **Runbook callback** on the running app: no token → 401, wrong token → 401, missing `task_id` → 400, valid `repost_to_group` → queued.
- **Against your NudgeBee:** stop the bridge (`kill $(lsof -tiTCP:8790 -sTCP:LISTEN)`). Within about 5 s, **WhatsApp bridge is not answering** appears under NudgeBee → Troubleshoot → All Events as **High** priority. Restart the bridge and the event changes to **Resolved**.

## Demo script (on stage)
1. Show Settings → NudgeBee ops: **All clear**.
2. Create a pickup due in 10 minutes and don't claim it. **"Pickup #N unclaimed, due in 10 min"** appears in NudgeBee.
3. In NudgeBee, the runbook asks for approval. Click **Approve**. In the WhatsApp group: *"🛟 #N was unclaimed, so it went to Rohit Bhaiya"*, and the NudgeBee event resolves itself.
4. Kill the WhatsApp bridge on stage. NudgeBee raises a **critical** incident; run `restart_whatsapp_bridge` and it resolves.

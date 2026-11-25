# Deploy Shaadi OS on Fly.io

One always-on machine runs the Next.js app **and** the WhatsApp bridge (started by `instrumentation.ts`).
A volume at `/data` keeps the WhatsApp login and bridge token across deploys. Region: Mumbai (`bom`).

Why Fly and not Vercel: the bridge needs a long-lived connection and a disk, and NudgeBee incidents / runbook
actions live in server memory. Exactly **one** machine keeps all of that consistent.

## Steps

```bash
brew install flyctl
fly auth login

cd ~/Desktop/repos/shaadi-os
fly launch --no-deploy --copy-config --name <your-app-name>   # keeps fly.toml; pick a unique name
fly volumes create shaadi_data --region bom --size 1           # WhatsApp login lives here

fly secrets set \
  SESSION_SECRET=$(openssl rand -hex 32) \
  SARVAM_API_KEY=<sarvam key> \
  FLAGSMITH_ENVIRONMENT_KEY=CwHLcJTzqCN722CcXTMNMh \
  NUDGEBEE_ACTION_TOKEN=$(openssl rand -hex 24)
# optional: fly secrets set NUDGEBEE_EVENT_WEBHOOK_URL='https://<nudgebee>/api/webhooks/event?token=…'

fly deploy
fly scale count 1        # never more than one machine (bridge + in-memory state)
```

Then open `https://<your-app-name>.fly.dev/settings`, sign in, and scan the WhatsApp QR. The login is saved on the
volume, so later deploys reconnect without a new QR. Logs: `fly logs` (the QR also prints there).

## Notes
- `FLAGSMITH_ENVIRONMENT_KEY` above is the **Production** environment (switch flags there for the live app).
- Turn off `real_rides` in Flagsmith Production: the Uber/Rapido phone bridge stays on your laptop.
- NudgeBee runbook callback: `https://<your-app-name>.fly.dev/api/ops/remediate` with the `NUDGEBEE_ACTION_TOKEN`.
- Use a spare WhatsApp number. If it ever logs out: `fly ssh console -C "rm -rf /data/wa/auth"`, `fly machine restart`, scan again.
- Tested locally with the same image: app on :3000, bridge auto-started, QR shown, token + login written to `/data/wa`.

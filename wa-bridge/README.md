# Shaadi OS WhatsApp bridge

Link your own WhatsApp and send kaam to Shaadi OS from the **"Message yourself"** chat:

> Bua ji ko charbagh se laana hai 3 baje, 3 log

Shaadi OS creates the task, auto-assigns a helper and replies in the same chat.

```
You (Message yourself chat) ──► wa-bridge (this, 127.0.0.1) ◄── /api/whatsapp/* (Next.js, holds the token) ◄── Shaadi OS tab
```

> **Warning:** this uses [Baileys](https://github.com/WhiskeySockets/Baileys), an **unofficial** WhatsApp Web
> client. WhatsApp can ban numbers that use it. Use a **secondary number**, not your main one.

## Setup

```bash
cd shaadi-os/wa-bridge
npm install
export WA_BRIDGE_TOKEN=$(openssl rand -hex 24)   # keep this, Next.js needs the same value
npm start                                         # PORT=8790 by default, binds 127.0.0.1 only
```

1. A QR prints in the terminal (also shown on Shaadi OS → Settings → WhatsApp connect).
2. On the phone: WhatsApp → Settings → **Linked devices** → **Link a device** → scan it.
3. In `shaadi-os/.env.local`:
   ```
   WA_BRIDGE_URL=http://127.0.0.1:8790
   WA_BRIDGE_TOKEN=<same token>
   ```
   Restart `npm run dev`, keep a Shaadi OS dashboard tab open (it polls every ~5 s and does the work).

The session is saved in `wa-bridge/auth/` (git-ignored). Logged out? Delete `auth/` and start again.

## Security

- Only messages **you** send in your own "Message yourself" chat are read. Other people, groups and status are ignored.
- Messages stay in memory (last 100), nothing is written to disk except the login session.
- Every request needs the `x-bridge-token` header. The bridge refuses to start without a token.

## API

| Endpoint | |
| --- | --- |
| `GET /health` | `{ state: "connecting" \| "qr" \| "open" \| "closed", qr?: "data:image/png…", me?: jid }` |
| `GET /inbox?since=<ms>` | `{ messages: [{ id, text, ts }] }` with `ts > since` |
| `POST /send` `{ text, to? }` | Sends `text` (default: your own chat) |

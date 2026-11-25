# Shaadi OS WhatsApp bridge

Link your own WhatsApp and send tasks to Shaadi OS from the **"Message yourself"** chat:

> Pick up Bua ji from Charbagh at 3pm, 3 people

Hinglish works too ("Bua ji ko charbagh se laana hai 3 baje, 3 log"); replies are in English.

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

### Group mode (anyone can post and take kaam)

1. In WhatsApp (linked number), create a group named **Shaadi OS** (or set `WA_GROUP_NAME`). You must be admin.
2. Settings → WhatsApp connect now shows a **join QR**. Family/helpers scan it to join.
3. In the group: someone posts `Bua ji ko charbagh se laana hai 3 baje` → bot replies `🆕 Kaam #7 … Reply: le 7`.
4. First person to send `le 7` gets it (new numbers are added as helpers). `done 7` closes it, `list` shows open kaam.
5. The bot **@tags** whoever took it (and whoever asked). Once the group exists, kaam you send from "Message yourself"
   is also posted to the group instead of being auto-assigned, so helpers only pick up kaam in the group.

The session is saved in `wa-bridge/auth/` (git-ignored). Logged out? Delete `auth/` and start again.

## Security

- Read: your own "Message yourself" chat, plus every member's messages in the one group named `WA_GROUP_NAME`. All other chats, groups and status are ignored.
- Replies go only to your self-chat or that group, never to arbitrary numbers.
- Messages stay in memory (last 100), nothing is written to disk except the login session.
- Every request needs the `x-bridge-token` header. The bridge refuses to start without a token.

## API

| Endpoint | |
| --- | --- |
| `GET /health` | `{ state: "connecting" \| "qr" \| "open" \| "closed", qr?: "data:image/png…", me?: jid }` |
| `GET /inbox?since=<ms>` | `{ messages: [{ id, text, ts }] }` with `ts > since` |
| `POST /send` `{ text, to? }` | Sends `text` (default: your own chat) |

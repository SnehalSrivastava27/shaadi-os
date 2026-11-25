// Shaadi OS WhatsApp bridge: links YOUR WhatsApp (via Baileys, unofficial
// WhatsApp Web) and exposes a tiny token-protected HTTP API on 127.0.0.1.
// Only messages you send to yourself ("Message yourself" chat) are accepted.
import http from "node:http";
import makeWASocket, { DisconnectReason, generateMessageIDV2, jidNormalizedUser, useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const TOKEN = process.env.WA_BRIDGE_TOKEN;
const PORT = Number(process.env.PORT ?? 8790);
const AUTH_DIR = new URL("./auth/", import.meta.url).pathname;
const MAX_INBOX = 100;
const MAX_TEXT = 2000;

if (!TOKEN || TOKEN.length < 16) {
  console.error("WA_BRIDGE_TOKEN is missing or shorter than 16 chars. Example: WA_BRIDGE_TOKEN=$(openssl rand -hex 24) npm start");
  process.exit(1);
}

let sock = null;
let state = "connecting"; // connecting | qr | open | closed
let qrDataUrl = null;
const inbox = []; // { id, text, ts } in memory only
const sentIds = new Set(); // our own replies, so we never treat them as commands
let lastTs = 0;

const noop = () => {};
const logger = { level: "error", child: () => logger, trace: noop, debug: noop, info: noop, warn: noop, error: (...a) => console.error("[baileys]", ...a) };

const ownJids = () => [sock?.user?.id, sock?.user?.lid].filter(Boolean).map(jidNormalizedUser);

function textOf(m) {
  return m?.conversation ?? m?.extendedTextMessage?.text ?? m?.ephemeralMessage?.message?.extendedTextMessage?.text ?? null;
}

async function connect() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Baileys helper, not a React hook
  const { state: auth, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  sock = makeWASocket({ auth, logger, syncFullHistory: false, markOnlineOnConnect: false });
  const bootSec = Math.floor(Date.now() / 1000);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      state = "qr";
      qrDataUrl = await QRCode.toDataURL(qr);
      console.log(await QRCode.toString(qr, { type: "terminal", small: true }));
      console.log("Scan with WhatsApp → Settings → Linked devices → Link a device");
    }
    if (connection === "open") {
      state = "open";
      qrDataUrl = null;
      console.log(`Connected as ${sock.user?.id}`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      state = "closed";
      qrDataUrl = null;
      if (code === DisconnectReason.loggedOut) {
        console.error("Logged out. Delete wa-bridge/auth/ and restart to link again.");
      } else {
        console.log(`Disconnected (${code ?? "unknown"}), reconnecting…`);
        setTimeout(connect, 2000);
      }
    }
  });

  sock.ev.on("messages.upsert", ({ messages }) => {
    const mine = ownJids();
    for (const msg of messages) {
      const k = msg.key;
      // SECURITY: only the owner, writing in their own self-chat. Groups, status,
      // and every other sender fail this check because remoteJid is not ours.
      if (!k?.fromMe || !k.id || sentIds.has(k.id)) continue;
      const chats = [k.remoteJid, k.remoteJidAlt].filter(Boolean).map(jidNormalizedUser);
      if (!chats.some((j) => mine.includes(j))) continue;
      if (Number(msg.messageTimestamp ?? 0) < bootSec - 60) continue; // skip history replay
      const text = textOf(msg.message)?.trim();
      if (!text || inbox.some((x) => x.id === k.id)) continue;
      lastTs = Math.max(Date.now(), lastTs + 1);
      inbox.push({ id: k.id, text: text.slice(0, MAX_TEXT), ts: lastTs });
      if (inbox.length > MAX_INBOX) inbox.shift();
    }
  });
}

function json(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16_000) throw new Error("too large");
  }
  return JSON.parse(raw || "{}");
}

const server = http.createServer(async (req, res) => {
  if (req.headers["x-bridge-token"] !== TOKEN) return json(res, 401, { error: "Bad token" });
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { state, ...(qrDataUrl && { qr: qrDataUrl }), ...(state === "open" && { me: jidNormalizedUser(sock.user?.id) }) });
    }
    if (req.method === "GET" && url.pathname === "/inbox") {
      const since = Number(url.searchParams.get("since") ?? 0) || 0;
      return json(res, 200, { messages: inbox.filter((m) => m.ts > since) });
    }
    if (req.method === "POST" && url.pathname === "/send") {
      if (state !== "open") return json(res, 409, { error: "WhatsApp is not connected" });
      const { text, to } = await readBody(req);
      if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) return json(res, 400, { error: "text required (max 2000 chars)" });
      const jid = typeof to === "string" && to ? (to.includes("@") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`) : jidNormalizedUser(sock.user.id);
      const messageId = generateMessageIDV2(sock.user.id);
      sentIds.add(messageId);
      if (sentIds.size > 500) sentIds.delete(sentIds.values().next().value);
      await sock.sendMessage(jid, { text }, { messageId });
      return json(res, 200, { ok: true, id: messageId });
    }
    json(res, 404, { error: "Not found" });
  } catch (e) {
    json(res, 500, { error: e instanceof Error ? e.message : "Bridge error" });
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`WhatsApp bridge on http://127.0.0.1:${PORT}`));
connect().catch((e) => {
  console.error(e);
  process.exit(1);
});

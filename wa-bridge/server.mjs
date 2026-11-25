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
// Group mode: anyone in this WhatsApp group can post kaam and claim it. Owner creates the group in WhatsApp.
const GROUP_NAME = (process.env.WA_GROUP_NAME ?? "Shaadi OS").trim().toLowerCase();

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
let group = null; // { jid, name, link, qr }
let groupCheckedAt = 0;
const groupMembers = new Set(); // jids seen posting in the group: the only ones we may @mention

/** Finds the group named WA_GROUP_NAME and its invite link. Re-checked at most every 15 s. */
async function findGroup() {
  if (state !== "open" || Date.now() - groupCheckedAt < 15_000) return;
  groupCheckedAt = Date.now();
  try {
    const all = Object.values(await sock.groupFetchAllParticipating());
    const g = all.find((x) => x.subject?.trim().toLowerCase() === GROUP_NAME);
    if (!g) return void (group = null);
    if (group?.jid === g.id) return;
    let link = null;
    let qr = null;
    try {
      link = `https://chat.whatsapp.com/${await sock.groupInviteCode(g.id)}`; // needs admin
      qr = await QRCode.toDataURL(link);
    } catch {}
    group = { jid: g.id, name: g.subject, link, qr };
    console.log(`Group mode on: "${g.subject}"`);
  } catch (e) {
    console.error("group lookup failed", e?.message);
  }
}
const phoneOf = (...jids) => jids.find((j) => j?.endsWith("@s.whatsapp.net"))?.split("@")[0] ?? null;

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
      groupCheckedAt = 0;
      findGroup();
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

  sock.ev.on("groups.upsert", () => ((groupCheckedAt = 0), findGroup()));
  sock.ev.on("groups.update", () => ((groupCheckedAt = 0), findGroup()));

  sock.ev.on("messages.upsert", ({ messages }) => {
    const mine = ownJids();
    for (const msg of messages) {
      const k = msg.key;
      if (!k?.id || sentIds.has(k.id)) continue;
      // SECURITY: accept only (a) the owner's own self-chat, or (b) the one chosen group.
      // Other chats, other groups and status are dropped here.
      const chats = [k.remoteJid, k.remoteJidAlt].filter(Boolean).map(jidNormalizedUser);
      let from;
      if (k.fromMe && chats.some((j) => mine.includes(j))) from = "self";
      else if (group && k.remoteJid === group.jid) from = "group";
      else continue;
      if (Number(msg.messageTimestamp ?? 0) < bootSec - 60) continue; // skip history replay
      const text = textOf(msg.message)?.trim();
      if (!text || inbox.some((x) => x.id === k.id)) continue;
      lastTs = Math.max(Date.now(), lastTs + 1);
      const ownJid = jidNormalizedUser(sock.user.id);
      const sender = k.fromMe
        ? { phone: phoneOf(ownJid), jid: k.participant ?? ownJid, name: sock.user?.name ?? "Organizer" }
        : { phone: phoneOf(k.participantAlt, k.participant, k.participantPn), jid: k.participant, name: (msg.pushName ?? "").slice(0, 40) || "Guest" };
      if (from === "group" && sender.jid) {
        groupMembers.add(sender.jid);
        if (groupMembers.size > 1000) groupMembers.delete(groupMembers.values().next().value);
      }
      inbox.push({ id: k.id, text: text.slice(0, MAX_TEXT), ts: lastTs, from, sender });
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
      await findGroup();
      return json(res, 200, {
        state,
        ...(qrDataUrl && { qr: qrDataUrl }),
        ...(state === "open" && { me: jidNormalizedUser(sock.user?.id), groupName: process.env.WA_GROUP_NAME ?? "Shaadi OS" }),
        ...(group && { group: { name: group.name, link: group.link, qr: group.qr } }),
      });
    }
    if (req.method === "GET" && url.pathname === "/inbox") {
      const since = Number(url.searchParams.get("since") ?? 0) || 0;
      return json(res, 200, { messages: inbox.filter((m) => m.ts > since), hasGroup: !!group });
    }
    if (req.method === "POST" && url.pathname === "/send") {
      if (state !== "open") return json(res, 409, { error: "WhatsApp is not connected" });
      const { text, to, mentions } = await readBody(req);
      if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT) return json(res, 400, { error: "text required (max 2000 chars)" });
      // Only two targets: the owner's self-chat or the chosen group. No arbitrary numbers.
      if (to === "group" && !group) return json(res, 409, { error: "Group not found" });
      const jid = to === "group" ? group.jid : jidNormalizedUser(sock.user.id);
      const messageId = generateMessageIDV2(sock.user.id);
      sentIds.add(messageId);
      if (sentIds.size > 500) sentIds.delete(sentIds.values().next().value);
      // @tags only in the group, and only for people who have posted there.
      const tags = to === "group" && Array.isArray(mentions) ? mentions.filter((j) => groupMembers.has(j)).slice(0, 5) : [];
      await sock.sendMessage(jid, { text, ...(tags.length && { mentions: tags }) }, { messageId });
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

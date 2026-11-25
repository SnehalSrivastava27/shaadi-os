// Shaadi OS WhatsApp bridge: links YOUR WhatsApp (via Baileys, unofficial
// WhatsApp Web) and exposes a tiny token-protected HTTP API on 127.0.0.1.
// Only messages you send to yourself ("Message yourself" chat) are accepted.
import http from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import makeWASocket, { DisconnectReason, downloadMediaMessage, generateMessageIDV2, jidNormalizedUser, useMultiFileAuthState } from "@whiskeysockets/baileys";
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
const bootSec = Math.floor(Date.now() / 1000); // process start: messages that arrive during a reconnect are kept
let lastClose = null;
let group = null; // { jid, name, link, qr }
let groupCheckedAt = 0;
let lastLookup = null; // { at, groups, found, error } for GET /debug
const voice = new Map(); // message id -> { buf, mimetype }: voice notes, in memory only, last 20
const recent = []; // last 30 incoming messages and what we did with them (GET /debug), no text kept
function note(k, why) {
  recent.push({ at: new Date().toISOString(), chat: k?.remoteJid, fromMe: !!k?.fromMe, why });
  if (recent.length > 30) recent.shift();
}
const locations = new Map(); // sender jid -> { lat, lng, ts, live, name, phone }: latest shared (live) location
const groupMembers = new Set(); // jids seen posting in the group: the only ones we may @mention

const GROUP_FILE = new URL("./auth/group.json", import.meta.url); // remembered so restarts don't depend on a slow lookup
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timed out after ${ms / 1000}s`)), ms))]);

async function useGroup(jid, name) {
  if (group?.jid === jid) return;
  let link = null;
  let qr = null;
  try {
    const code = await withTimeout(sock.groupInviteCode(jid), 10_000); // needs admin
    if (code) {
      link = `https://chat.whatsapp.com/${code}`;
      qr = await QRCode.toDataURL(link);
    }
  } catch {}
  group = { jid, name, link, qr };
  try {
    writeFileSync(GROUP_FILE, JSON.stringify({ jid, name }));
  } catch {}
  console.log(`Group mode on: "${name}"`);
}

/** Is this jid our group? Checks one group's subject (cheap), used when a group message arrives before we know the group. */
async function checkGroup(jid) {
  try {
    const meta = await withTimeout(sock.groupMetadata(jid), 10_000);
    if (meta.subject?.trim().toLowerCase() === GROUP_NAME) await useGroup(jid, meta.subject);
  } catch (e) {
    lastLookup = { at: new Date().toISOString(), error: `metadata ${jid}: ${e?.message}` };
  }
}

/** Finds the group named WA_GROUP_NAME and its invite link. Re-checked at most every 15 s. */
async function findGroup(force = false) {
  if (!sock?.user || (!force && Date.now() - groupCheckedAt < 15_000)) return;
  groupCheckedAt = Date.now();
  try {
    const saved = existsSync(GROUP_FILE) ? JSON.parse(readFileSync(GROUP_FILE, "utf8")) : null;
    if (saved?.jid && !group) await checkGroup(saved.jid);
    if (group) return;
    const all = Object.values(await withTimeout(sock.groupFetchAllParticipating(), 20_000));
    const g = all.find((x) => x.subject?.trim().toLowerCase() === GROUP_NAME);
    lastLookup = { at: new Date().toISOString(), groups: all.length, found: !!g };
    if (!g) return void (group = null);
    await useGroup(g.id, g.subject);
  } catch (e) {
    lastLookup = { at: new Date().toISOString(), error: e?.message ?? String(e) };
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
      // Right after connecting WhatsApp may not answer group queries yet: retry a few times.
      for (const ms of [0, 3000, 8000, 20000]) setTimeout(() => !group && findGroup(true), ms);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      state = "closed";
      qrDataUrl = null;
      if (code === DisconnectReason.loggedOut) {
        console.error("Logged out. Delete wa-bridge/auth/ and restart to link again.");
      } else {
        lastClose = { at: new Date().toISOString(), code: code ?? null };
      console.log(`Disconnected (${code ?? "unknown"}), reconnecting…`);
        setTimeout(connect, 2000);
      }
    }
  });

  sock.ev.on("groups.upsert", () => ((groupCheckedAt = 0), findGroup()));
  sock.ev.on("groups.update", () => ((groupCheckedAt = 0), findGroup()));

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const mine = ownJids();
    // Messages waiting during a reconnect arrive right away: find the group first, or they'd be dropped as "other chat".
    if (!group) for (const jid of new Set(messages.map((m) => m.key?.remoteJid).filter((j) => j?.endsWith("@g.us")))) await checkGroup(jid);
    for (const msg of messages) {
      const k = msg.key;
      if (!k?.id || sentIds.has(k.id)) continue;
      if (k.remoteJid === "status@broadcast") continue;
      // SECURITY: accept only (a) the owner's own self-chat, or (b) the one chosen group.
      // Other chats, other groups and status are dropped here.
      const chats = [k.remoteJid, k.remoteJidAlt].filter(Boolean).map(jidNormalizedUser);
      let from;
      if (k.fromMe && chats.some((j) => mine.includes(j))) from = "self";
      else if (group && k.remoteJid === group.jid) from = "group";
      else {
        note(k, group ? "other chat" : "other chat (group not found yet)");
        continue;
      }
      if (Number(msg.messageTimestamp ?? 0) < bootSec - 60) {
        note(k, "old (before bridge start)");
        continue; // skip history replay
      }
      if (!msg.message) {
        note(k, `no content (${msg.messageStubType ? `stub ${msg.messageStubType}` : "could not decrypt"})`);
        continue;
      }
      const ownJid = jidNormalizedUser(sock.user.id);
      const sender = k.fromMe
        ? { phone: phoneOf(ownJid), jid: k.participant ?? ownJid, name: sock.user?.name ?? "Organizer" }
        : { phone: phoneOf(k.participantAlt, k.participant, k.participantPn), jid: k.participant, name: (msg.pushName ?? "").slice(0, 40) || "Guest" };

      // Location pin or WhatsApp "Share live location" (each live update arrives as a new message): track it, no reply.
      const loc = msg.message?.liveLocationMessage ?? msg.message?.locationMessage;
      if (loc && Number.isFinite(loc.degreesLatitude) && Number.isFinite(loc.degreesLongitude)) {
        const key = sender.jid ?? sender.phone ?? "me";
        locations.set(key, { lat: loc.degreesLatitude, lng: loc.degreesLongitude, ts: Date.now(), live: !!msg.message?.liveLocationMessage, name: sender.name, phone: sender.phone });
        if (locations.size > 500) locations.delete(locations.keys().next().value);
        note(k, msg.message?.liveLocationMessage ? "live location" : "location");
        continue;
      }
      const audioMsg = msg.message?.audioMessage ?? msg.message?.ephemeralMessage?.message?.audioMessage;
      const text = textOf(msg.message)?.trim() ?? "";
      if ((!text && !audioMsg) || inbox.some((x) => x.id === k.id)) {
        note(k, `unsupported message type: ${Object.keys(msg.message).join(",")}`);
        continue;
      }
      note(k, `accepted (${from})`);
      let audio;
      if (audioMsg) {
        try {
          const buf = await downloadMediaMessage(msg, "buffer", {}, { logger, reuploadRequest: sock.updateMediaMessage });
          voice.set(k.id, { buf, mimetype: audioMsg.mimetype ?? "audio/ogg" });
          if (voice.size > 20) voice.delete(voice.keys().next().value);
          audio = { seconds: Number(audioMsg.seconds ?? 0) };
        } catch (e) {
          console.error("voice note download failed", e?.message);
          continue;
        }
      }
      lastTs = Math.max(Date.now(), lastTs + 1);
      if (from === "group" && sender.jid) {
        groupMembers.add(sender.jid);
        if (groupMembers.size > 1000) groupMembers.delete(groupMembers.values().next().value);
      }
      inbox.push({ id: k.id, text: text.slice(0, MAX_TEXT), ts: lastTs, from, sender, ...(audio && { audio }) });
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
    if (raw.length > 4_000_000) throw new Error("too large"); // spoken replies are base64 MP3
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
    if (req.method === "GET" && url.pathname === "/debug") return json(res, 200, { state, lastClose, lastLookup, group: group && { name: group.name, jid: group.jid }, recent });
    if (req.method === "GET" && url.pathname === "/locations") {
      const since = Number(url.searchParams.get("since") ?? 0) || 0;
      return json(res, 200, { locations: [...locations.values()].filter((l) => l.ts > since) });
    }
    if (req.method === "GET" && url.pathname === "/media") {
      const v = voice.get(url.searchParams.get("id") ?? "");
      if (!v) return json(res, 404, { error: "Voice note not found" });
      res.writeHead(200, { "content-type": v.mimetype });
      return res.end(v.buf);
    }
    if (req.method === "POST" && url.pathname === "/send") {
      if (state !== "open") return json(res, 409, { error: "WhatsApp is not connected" });
      const { text, to, mentions, audio } = await readBody(req);
      const hasAudio = typeof audio === "string" && audio.length > 0;
      if (!hasAudio && (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT)) return json(res, 400, { error: "text required (max 2000 chars)" });
      // Only two targets: the owner's self-chat or the chosen group. No arbitrary numbers.
      if (to === "group" && !group) return json(res, 409, { error: "Group not found" });
      const jid = to === "group" ? group.jid : jidNormalizedUser(sock.user.id);
      const messageId = generateMessageIDV2(sock.user.id);
      sentIds.add(messageId);
      if (sentIds.size > 500) sentIds.delete(sentIds.values().next().value);
      // @tags only in the group, and only for people who have posted there.
      const tags = to === "group" && Array.isArray(mentions) ? mentions.filter((j) => groupMembers.has(j)).slice(0, 5) : [];
      const content = hasAudio ? { audio: Buffer.from(audio, "base64"), mimetype: "audio/mpeg" } : { text, ...(tags.length && { mentions: tags }) };
      await sock.sendMessage(jid, content, { messageId });
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

"use client";

import { useEffect } from "react";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { parseWaCommand, WA_GROUP_HELP, WA_HELP, type WaCommand } from "@/lib/whatsappCommands";
import type { Task } from "@/types";
import type { NewTaskInput } from "@/stores/useShaadiStore";

const LAST_SEEN_KEY = "shaadi-os:wa-last-seen";
const LOC_SEEN_KEY = "shaadi-os:wa-loc-seen";
const POSTERS_KEY = "shaadi-os:wa-posters"; // taskId -> who asked, so we can tag them later

type Sender = { phone: string | null; jid?: string; name: string };
type WaMessage = { id: string; text: string; ts: number; from?: "self" | "group"; sender?: Sender; audio?: { seconds: number } };
type Out = { text: string; to: "self" | "group"; mentions?: string[] };

// ponytail: task number = position in the task list, stable while tasks are only appended. Reset demo renumbers.
const taskNo = (id: string) => useShaadiStore.getState().tasks.findIndex((t) => t.id === id) + 1;
const byNo = (no: number): Task | undefined => useShaadiStore.getState().tasks[no - 1];
const fmtWhen = (time: string) =>
  new Date(time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
const route = (t: Task) => `${t.waypoints[0].label} → ${t.waypoints.at(-1)!.label}`;

/** "@9198..." in the text + the jid in mentions = WhatsApp shows a real tag. Falls back to the plain name. */
const tag = (p: Sender | undefined, mentions: string[]) => {
  if (!p?.jid) return p?.name ?? "";
  mentions.push(p.jid);
  return `@${p.jid.split("@")[0]}`;
};

function posters(): Record<string, Sender> {
  try {
    return JSON.parse(localStorage.getItem(POSTERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function rememberPoster(taskId: string, who: Sender) {
  const all = Object.entries({ ...posters(), [taskId]: who }).slice(-200);
  localStorage.setItem(POSTERS_KEY, JSON.stringify(Object.fromEntries(all)));
}

function jobOut(t: Task, poster: Sender): Out {
  const no = taskNo(t.id);
  const mentions: string[] = [];
  const by = poster.jid ? ` (${tag(poster, mentions)})` : "";
  return {
    to: "group",
    mentions,
    text: `🆕 Kaam #${no}${by}: ${t.title}\n${route(t)}, ${fmtWhen(t.time)}, ${people(t.peopleCount)}\nWho will take it? Reply: *take ${no}*`,
  };
}

/** Creates the task and posts it to the group; nobody is auto-assigned, a helper must claim it there. */
function postJob(input: NewTaskInput, poster: Sender): Out {
  const id = useShaadiStore.getState().createTask(input);
  rememberPoster(id, poster);
  return jobOut(useShaadiStore.getState().tasks.find((t) => t.id === id)!, poster);
}

/** Dashboard: posts an existing task to the WhatsApp group. false = no group connected, caller should auto-assign. */
export async function sendTaskToGroup(taskId: string): Promise<boolean> {
  const task = useShaadiStore.getState().tasks.find((t) => t.id === taskId);
  if (!task) return false;
  try {
    const st = await (await fetch("/api/whatsapp", { cache: "no-store" })).json();
    if (st.state !== "open" || !st.group) return false;
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(jobOut(task, { phone: null, name: "Organizer" })),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Self-chat: with a group, the job goes to the group for helpers to claim; without one, auto-assign as before. */
function handleSelf(cmd: WaCommand, hasGroup: boolean): Out[] {
  if (cmd.kind !== "task") return [{ to: "self", text: hasGroup ? WA_GROUP_HELP : WA_HELP }];
  if (hasGroup) {
    const job = postJob(cmd.input, { phone: null, name: "Organizer" });
    return [job, { to: "self", text: `📣 Posted to the group: ${job.text.split("\n")[0].replace("🆕 ", "")}. Whoever takes it gets tagged there.` }];
  }
  const s = useShaadiStore.getState();
  const { title, pickup, drop, time, peopleCount } = cmd.input;
  const r = s.dispatchTask(s.createTask(cmd.input));
  const head = `✅ Task created: ${title}\n${pickup.label} → ${drop.label}, ${fmtWhen(time)}, ${people(peopleCount)}`;
  if (r?.ok) return [{ to: "self", text: `${head}\n🚗 ${r.helper.name}${r.vehicle ? ` (${r.vehicle.name})` : ""}: offer sent` }];
  return [{ to: "self", text: `${head}\n⚠️ No one is free. ${r && !r.ok ? r.message : ""} Book an Uber/Rapido in the app.` }];
}

const REQUEST_WORDS = /\b(laa?n[aei]|lana|lani|le\s*aa|mangwa|chh?od|pick|drop|get|bring|fetch|buy|kharid|khareed)\w*/i;

/** Group: anyone posts kaam, first "le N" takes it (and gets tagged), "done N" closes it. Quiet on chit-chat. */
function handleGroup(cmd: WaCommand, text: string, sender: Sender): Out[] {
  const s = useShaadiStore.getState();
  const reply = (t: string, mentions?: string[]): Out[] => [{ to: "group", text: t, mentions }];
  if (cmd.kind === "help") {
    if (/^(help|madad|\?)$/i.test(text.trim())) return reply(WA_GROUP_HELP);
    // Looks like a request but we couldn't tell where: say so instead of staying silent. Chit-chat stays quiet.
    const m: string[] = [];
    if (REQUEST_WORDS.test(text)) return reply(`${tag(sender, m)} I couldn't tell where 🤔 Please name a place, e.g. "Get sabzi from Chappan Bhog at 5pm" or "Pick up Bua ji from Charbagh at 3pm".`, m);
    return [];
  }
  if (cmd.kind === "list") {
    const open = s.tasks.filter((t) => ["created", "declined"].includes(t.status));
    return reply(open.length ? `Open tasks:\n${open.map((t) => `#${taskNo(t.id)} ${t.title} (${fmtWhen(t.time)})`).join("\n")}\nTo take one: *take <number>*` : "No open tasks right now 🎉");
  }
  if (cmd.kind === "claim" || cmd.kind === "done") {
    const t = byNo(cmd.no);
    if (!t) return reply(`There is no task #${cmd.no}.`);
    const m: string[] = [];
    const poster = posters()[t.id];
    const asker = poster?.jid && poster.jid !== sender.jid ? ` ${tag(poster, m)}` : "";
    if (cmd.kind === "claim") {
      const r = s.claimTask(t.id, sender);
      if (!r.ok) return reply(`${tag(sender, m)} #${cmd.no}: ${r.error}`, m);
      return reply(`🙌 #${cmd.no} ${tag(sender, m)} took it: ${t.title}\n${route(t)}, ${fmtWhen(t.time)}.${asker ? `\n${asker.trim()} your task is on its way.` : ""}\nWhen finished: *done ${cmd.no}*`, m);
    }
    const r = s.completeTask(t.id, sender.name);
    return reply(r.ok ? `✅ #${cmd.no} done: ${t.title}. Thank you ${tag(sender, m)}!${asker}` : `#${cmd.no}: ${r.error}`, m);
  }
  return [postJob(cmd.input, sender)];
}

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/**
 * Message -> command. Voice notes go through Sarvam speech-to-text first; text the rule parser can't read
 * (other languages, free-form Hinglish) goes to Sarvam chat. Also returns the sender's language for the reply.
 */
async function understand(m: WaMessage): Promise<{ cmd: WaCommand; text: string; lang?: string; voice?: boolean; note?: string }> {
  let text = m.text;
  let lang: string | undefined;
  if (m.audio) {
    const r = await post("/api/whatsapp/voice", { id: m.id });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.text) return { cmd: { kind: "help" }, text: "", note: `🎙️ Couldn't read that voice note${data.error ? `: ${data.error}` : ""}.` };
    text = data.text;
    lang = data.lang;
  }
  let cmd = parseWaCommand(text);
  // Requests (and anything the rules can't read) go to Sarvam, which knows every place via the map lookup.
  // Claims/done/list stay rule-based; short chit-chat ("ok", "👍") never costs a call.
  if (cmd.kind === "task" || (cmd.kind === "help" && text.trim().length >= 8)) {
    const city = useShaadiStore.getState().publishedConfig.city;
    const data = await (await post("/api/whatsapp/understand", { text, city })).json().catch(() => ({}));
    lang ??= data.lang;
    if (data.input) cmd = { kind: "task", input: data.input };
    else if (data.unknownPlace && cmd.kind !== "task") return { cmd, text, lang, note: `📍 Couldn't find "${data.unknownPlace}" on the map. Please add the area, e.g. "${data.unknownPlace}, Gomti Nagar".` };
  }
  if (cmd.kind === "task" && m.audio) cmd.input.title = `🎙️ ${text}`.slice(0, 80);
  return { cmd, text, lang, voice: !!m.audio };
}

/** Live locations shared in WhatsApp -> helper dots on the map, everyone at once. */
async function syncLocations() {
  const since = Number(localStorage.getItem(LOC_SEEN_KEY)) || 0;
  const res = await fetch(`/api/whatsapp/locations?since=${since}`, { cache: "no-store" });
  if (!res.ok) return;
  const { locations } = (await res.json()) as { locations: { lat: number; lng: number; ts: number; name: string; phone: string | null }[] };
  const store = useShaadiStore.getState();
  for (const l of locations) store.updateLiveLocation({ name: l.name, phone: l.phone }, l.lat, l.lng, l.ts);
  if (locations.length) localStorage.setItem(LOC_SEEN_KEY, String(Math.max(...locations.map((l) => l.ts))));
}

/** Polls the WhatsApp bridge inbox. With a group, every job is posted there and helpers claim it (they get @tagged). Renders nothing. */
export function WhatsAppAgent() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      let delay = 5000;
      // One tab at a time, so two open tabs never create the same task twice.
      const run = async () => {
        let since = Number(localStorage.getItem(LAST_SEEN_KEY));
        if (!since) {
          since = Date.now(); // first run: ignore anything older
          localStorage.setItem(LAST_SEEN_KEY, String(since));
        }
        const res = await fetch(`/api/whatsapp/inbox?since=${since}`, { cache: "no-store" });
        if (!res.ok) {
          delay = res.status === 503 ? 60_000 : 15_000; // not configured / bridge down
          return;
        }
        const { messages, hasGroup } = (await res.json()) as { messages: WaMessage[]; hasGroup?: boolean };
        for (const m of messages) {
          localStorage.setItem(LAST_SEEN_KEY, String(m.ts)); // mark before acting: a reload never recreates the task
          const group = m.from === "group";
          const u = await understand(m);
          const outs: Out[] = u.note
            ? [{ to: group ? "group" : "self", text: u.note }]
            : group
              ? handleGroup(u.cmd, u.text, m.sender ?? { phone: null, name: "Guest" })
              : handleSelf(u.cmd, !!hasGroup);
          for (const out of outs) await post("/api/whatsapp/send", { ...out, lang: u.lang, voice: u.voice });
        }
      };
      try {
        await syncLocations();
        await (navigator.locks ? navigator.locks.request("shaadi-os-wa-inbox", run) : run());
      } catch {
        delay = 15_000;
      }
      if (!stopped) timer = setTimeout(tick, delay);
    };

    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  return null;
}

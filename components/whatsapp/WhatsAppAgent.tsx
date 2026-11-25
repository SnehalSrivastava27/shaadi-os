"use client";

import { useEffect } from "react";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { parseWaCommand, WA_HELP } from "@/lib/whatsappCommands";

const LAST_SEEN_KEY = "shaadi-os:wa-last-seen";

function handle(text: string): string {
  const cmd = parseWaCommand(text);
  if (cmd.kind === "help") return WA_HELP;
  const s = useShaadiStore.getState();
  const { title, pickup, drop, time, peopleCount } = cmd.input;
  const r = s.dispatchTask(s.createTask(cmd.input));
  const when = new Date(time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const head = `✅ Task bana: ${title}\n${pickup.label} → ${drop.label}, ${when}, ${peopleCount} log`;
  if (r?.ok) return `${head}\n🚗 ${r.helper.name}${r.vehicle ? ` (${r.vehicle.name})` : ""} ko offer bheja`;
  return `${head}\n⚠️ Koi free nahi. ${r && !r.ok ? r.message : ""} App mein Uber/Rapido se book kijiye.`;
}

/** Polls the WhatsApp bridge inbox, turns each self-chat message into a task and replies. Renders nothing. */
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
        const { messages } = (await res.json()) as { messages: { id: string; text: string; ts: number }[] };
        for (const m of messages) {
          localStorage.setItem(LAST_SEEN_KEY, String(m.ts)); // mark before acting: a reload never recreates the task
          await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: handle(m.text) }),
          });
        }
      };
      try {
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

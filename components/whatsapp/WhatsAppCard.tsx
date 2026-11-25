"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WaStatus = {
  state: "off" | "connecting" | "qr" | "open" | "closed";
  qr?: string;
  me?: string;
  error?: string;
  groupName?: string;
  group?: { name: string; link: string | null; qr: string | null };
};

const LABEL: Record<WaStatus["state"], string> = {
  off: "Starting…",
  connecting: "Connecting…",
  qr: "Scan the QR code",
  open: "Connected",
  closed: "Disconnected",
};

export function WhatsAppCard() {
  const [status, setStatus] = useState<WaStatus | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      let next: WaStatus = { state: "off" };
      try {
        next = await (await fetch("/api/whatsapp", { cache: "no-store" })).json();
      } catch {}
      if (stopped) return;
      setStatus(next);
      timer = setTimeout(load, next.state === "open" ? 10_000 : 3000);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  const state = status?.state;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="text-primary size-5" /> WhatsApp connect
          {state && (
            <Badge variant={state === "open" ? "default" : "secondary"} className="ml-auto">
              {LABEL[state]}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Send tasks from your &quot;Message yourself&quot; chat, like &quot;Pick up Bua ji from Charbagh at 3pm, 3 people&quot;.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {state === "qr" && status?.qr && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the local bridge */}
            <img src={status.qr} alt="WhatsApp link QR code" className="size-56 rounded-md border bg-white p-2" />
            <p className="text-muted-foreground">WhatsApp → Settings → Linked devices → Link a device → scan this QR code.</p>
          </>
        )}
        {state === "open" && (
          <p>
            Connected number: <span className="font-medium">+{status?.me?.split("@")[0]}</span>. Keep this tab open; it checks for new messages every ~5 seconds.
          </p>
        )}
        {state === "open" && status?.group?.qr && (
          <div className="grid gap-2 border-t pt-3">
            <p className="font-medium">Family group: {status.group.name}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the local bridge */}
            <img src={status.group.qr} alt="WhatsApp group join QR code" className="size-56 rounded-md border bg-white p-2" />
            <p className="text-muted-foreground">
              Anyone can scan this to join the group. Post a task there, the bot numbers it (#7), and the first person to reply <b>take 7</b> gets it and is tagged. When finished: <b>done 7</b>.
            </p>
            {status.group.link && (
              <a href={status.group.link} target="_blank" rel="noreferrer" className="text-primary break-all underline">
                {status.group.link}
              </a>
            )}
          </div>
        )}
        {state === "open" && status?.group && !status.group.qr && (
          <p className="text-muted-foreground border-t pt-3">Group &quot;{status.group.name}&quot; found, but you must be a group admin to get its invite link.</p>
        )}
        {state === "open" && !status?.group && (
          <p className="text-muted-foreground border-t pt-3">
            Group mode: create a WhatsApp group named <b>&quot;{status?.groupName ?? "Shaadi OS"}&quot;</b> on this number. Its join QR appears here, then anyone in it can post and take tasks.
          </p>
        )}
        {(state === "connecting" || state === "closed") && <p className="text-muted-foreground">Bridge is running, connecting to WhatsApp…</p>}
        {state === "off" && (
          <p className="text-muted-foreground">
            Starting the WhatsApp bridge with the dev server. The first run installs it (about 30 seconds), then the QR code appears here on its own. Use a
            secondary number: the WhatsApp library is unofficial and a number could get banned.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

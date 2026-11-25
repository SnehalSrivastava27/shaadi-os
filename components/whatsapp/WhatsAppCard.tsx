"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type WaStatus = { state: "off" | "connecting" | "qr" | "open" | "closed"; qr?: string; me?: string; error?: string };

const LABEL: Record<WaStatus["state"], string> = {
  off: "Bridge band hai",
  connecting: "Connect ho raha hai…",
  qr: "QR scan kijiye",
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
      timer = setTimeout(load, next.state === "qr" || next.state === "connecting" ? 3000 : 10_000);
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
        <CardDescription>Apne &quot;Message yourself&quot; chat se kaam bhejiye, jaise &quot;Bua ji ko charbagh se laana hai 3 baje, 3 log&quot;.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {state === "qr" && status?.qr && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the local bridge */}
            <img src={status.qr} alt="WhatsApp link QR code" className="size-56 rounded-md border bg-white p-2" />
            <p className="text-muted-foreground">WhatsApp → Settings → Linked devices → Link a device → yeh QR scan kijiye.</p>
          </>
        )}
        {state === "open" && (
          <p>
            Connected number: <span className="font-medium">+{status?.me?.split("@")[0]}</span>. Yeh tab khula rakhiye, har ~5 sec mein naye messages dekhta hai.
          </p>
        )}
        {(state === "connecting" || state === "closed") && <p className="text-muted-foreground">Bridge chal raha hai, WhatsApp se jud raha hai…</p>}
        {state === "off" && (
          <ol className="text-muted-foreground list-decimal space-y-1 pl-5">
            <li>
              <code>cd wa-bridge &amp;&amp; npm install</code>
            </li>
            <li>
              <code>WA_BRIDGE_TOKEN=$(openssl rand -hex 24) npm start</code>
            </li>
            <li>
              <code>.env.local</code> mein <code>WA_BRIDGE_URL=http://127.0.0.1:8790</code> aur wahi <code>WA_BRIDGE_TOKEN</code>, phir dev server restart.
            </li>
            <li>Secondary number use kijiye: Baileys unofficial hai, number ban ho sakta hai.</li>
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

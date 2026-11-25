"use client";

import { useEffect, useState } from "react";
import { Siren } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Status = {
  on: boolean;
  open: { fingerprint: string; title: string; severity: string; since: number }[];
  recent: { at: string; fingerprint: string; status: string; ok: boolean; error?: string }[];
};

/** What Shaadi OS has reported to NudgeBee: open incidents and the last deliveries. */
export function NudgeBeeCard() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const d = await (await fetch("/api/ops", { cache: "no-store" })).json();
        if (!stopped) setS(d);
      } catch {}
      if (!stopped) timer = setTimeout(load, 5000);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  const failed = s?.recent.filter((r) => !r.ok).at(-1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Siren className="text-primary size-5" /> NudgeBee ops
          <Badge variant={s?.on ? "default" : "secondary"} className="ml-auto">
            {s?.on ? (s.open.length ? `${s.open.length} open incident${s.open.length > 1 ? "s" : ""}` : "All clear") : "Not connected"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Wedding-day incidents (WhatsApp down, Sarvam failing, a pickup nobody claimed) go to NudgeBee, where AI agents investigate and approved runbooks fix them.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {!s?.on && (
          <p className="text-muted-foreground">
            Set <code>NUDGEBEE_EVENT_WEBHOOK_URL</code> (Admin → Integrations → Webhooks → Event Webhook) in <code>.env.local</code>. See NUDGEBEE.md.
          </p>
        )}
        {s?.open.map((o) => (
          <div key={o.fingerprint} className="flex items-start justify-between gap-3">
            <span>{o.title}</span>
            <Badge variant={o.severity === "critical" ? "destructive" : "outline"}>{o.severity}</Badge>
          </div>
        ))}
        {failed && <p className="text-destructive text-xs">Last delivery failed: {failed.error}</p>}
      </CardContent>
    </Card>
  );
}

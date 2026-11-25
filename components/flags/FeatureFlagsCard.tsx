"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  whatsapp_group_mode: "WhatsApp group: helpers claim tasks",
  whatsapp_voice_notes: "Voice notes → tasks (Sarvam speech-to-text)",
  whatsapp_native_replies: "Replies in the sender's language + voice (Sarvam)",
  ai_understanding: "AI reads free-form messages (Sarvam chat)",
  invite_translation: "Invite in 22 Indian languages (Sarvam)",
  real_rides: "Real Uber/Rapido booking",
};

type FlagsResponse = { flags: Record<string, boolean>; flagsmith: boolean; sarvam: boolean };

/** Live view of the Flagsmith flags: flip one in Flagsmith and it changes here within ~5 s, no redeploy. */
export function FeatureFlagsCard() {
  const [data, setData] = useState<FlagsResponse | null>(null);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const d = await (await fetch("/api/flags", { cache: "no-store" })).json();
        if (!stopped) setData(d);
      } catch {}
      if (!stopped) timer = setTimeout(load, 5000);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="text-primary size-5" /> Feature flags
          <Badge variant={data?.flagsmith ? "default" : "secondary"} className="ml-auto">
            {data?.flagsmith ? "Flagsmith live" : "Defaults (no Flagsmith key)"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Switched in Flagsmith, no redeploy. {data && !data.sarvam && "Sarvam features need SARVAM_API_KEY."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {data &&
          Object.entries(data.flags).map(([name, on]) => (
            <div key={name} className="flex items-center justify-between gap-3">
              <span>
                {LABELS[name] ?? name} <code className="text-muted-foreground text-xs">{name}</code>
              </span>
              <Badge variant={on ? "default" : "outline"}>{on ? "On" : "Off"}</Badge>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

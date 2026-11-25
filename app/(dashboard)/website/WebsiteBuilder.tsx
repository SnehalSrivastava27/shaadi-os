"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatPanel } from "@/components/invite/ChatPanel";
import { VersionsSheet } from "@/components/invite/VersionsSheet";
import { InviteRenderer } from "@/components/invite/InviteRenderer";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { functionsForGuest } from "@/lib/invite/guestFunctions";
import { THEME_PRESETS } from "@/lib/invite/culture";
import type { Lang } from "@/lib/invite/i18n";
import type { Theme } from "@/types";
import { copyText } from "@/hooks/useCopy";
import { inviteUrl } from "@/lib/messages";

export function WebsiteBuilder() {
  const config = useShaadiStore((s) => s.config);
  const published = useShaadiStore((s) => s.publishedConfig);
  const guests = useShaadiStore((s) => s.guests);
  const publishConfig = useShaadiStore((s) => s.publishConfig);
  const applyConfigPatch = useShaadiStore((s) => s.applyConfigPatch);
  const [guestId, setGuestId] = useState("none");
  const [lang, setLang] = useState<Lang>("en");
  const guest = guests.find((g) => g.id === guestId);
  const dirty = JSON.stringify({ ...config, published: true }) !== JSON.stringify(published);

  return (
    <div className="flex flex-col gap-3 p-3 md:p-6 lg:h-[100vh]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-primary text-2xl font-bold md:text-3xl">Invite website</h1>
          <p className="text-muted-foreground text-sm">Chat karke banaiye. AI sirf JSON config badalta hai, templates usse render hote hain.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? <Badge variant="busy">Unpublished changes</Badge> : <Badge variant="free">Live</Badge>}
          <VersionsSheet />
          <Button
            size="sm"
            onClick={() => {
              publishConfig();
              toast.success("Website publish ho gayi! 🎉", {
                description: "Ab har guest ka personal link isi version ko dikhayega.",
                action: { label: "Copy link", onClick: () => copyText(inviteUrl(guests[0]?.id ?? "g01")) },
              });
            }}
          >
            <Rocket /> Publish
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="h-[520px] min-h-0 lg:h-auto">
          <ChatPanel />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="bg-muted/60 flex flex-wrap items-center gap-2 border-b px-3 py-2">
            <Globe className="text-muted-foreground size-4" />
            <Select
              value={config.theme}
              onValueChange={(v) => {
                const t = v as Theme;
                const r = applyConfigPatch({ theme: t, palette: { ...THEME_PRESETS[t].palette } }, `${THEME_PRESETS[t].label} template`);
                if (r.ok) toast.success(`${THEME_PRESETS[t].label} template lagaya`);
              }}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(THEME_PRESETS).map((t) => (
                  <SelectItem key={t.theme} value={t.theme}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={guestId} onValueChange={setGuestId}>
              <SelectTrigger size="sm" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Preview: general invite</SelectItem>
                {guests.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    As {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="bg-card flex rounded-md border p-0.5 text-xs">
              {(["en", "hi"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded px-2 py-1 ${lang === l ? "bg-primary text-primary-foreground" : ""}`}>
                  {l === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>
            {guest && (
              <Button size="sm" variant="ghost" asChild className="ml-auto">
                <Link href={`/invite/${guest.id}`} target="_blank">
                  Live link <ExternalLink />
                </Link>
              </Button>
            )}
          </div>
          <div className="h-[70vh] min-h-0 flex-1 overflow-y-auto lg:h-auto">
            <InviteRenderer config={config} functions={functionsForGuest(config, guest)} lang={lang} guestName={guest?.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

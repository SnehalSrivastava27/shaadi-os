"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock, Monitor, Rocket, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatPanel } from "@/components/invite/ChatPanel";
import { VersionsSheet } from "@/components/invite/VersionsSheet";
import { InviteRenderer } from "@/components/invite/InviteRenderer";
import { Em, chip, darkPill, hatch, sansFont } from "@/components/website/ui";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { functionsForGuest } from "@/lib/invite/guestFunctions";
import { THEME_PRESETS } from "@/lib/invite/culture";
import type { Lang } from "@/lib/invite/i18n";
import { copyText } from "@/hooks/useCopy";
import { inviteUrl } from "@/lib/messages";
import { cn } from "@/lib/utils";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: React.ReactNode; aria?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border border-[#ececec] bg-[#f7f7f7] p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          aria-label={o.aria}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("flex items-center gap-1 rounded-[10px] px-2.5 py-1 font-medium text-[#6b6b6b] transition", value === o.value && "bg-white text-[#161616] shadow-[0_1px_3px_rgba(0,0,0,0.12)]")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function WebsiteBuilder() {
  const config = useShaadiStore((s) => s.config);
  const published = useShaadiStore((s) => s.publishedConfig);
  const guests = useShaadiStore((s) => s.guests);
  const publishConfig = useShaadiStore((s) => s.publishConfig);
  const applyConfigPatch = useShaadiStore((s) => s.applyConfigPatch);
  const [guestId, setGuestId] = useState("none");
  const [lang, setLang] = useState<Lang>("en");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const guest = guests.find((g) => g.id === guestId);
  const dirty = JSON.stringify({ ...config, published: true }) !== JSON.stringify(published);
  const previewPath = `/invite/${guest?.id ?? guests[0]?.id ?? "g01"}`;

  const preview = <InviteRenderer editable config={config} functions={functionsForGuest(config, guest)} lang={lang} guestName={guest?.name} />;

  return (
    <div className={cn(sansFont, "flex flex-col gap-5 p-4 text-[#161616] md:p-6 lg:h-dvh")}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1 text-xs text-[#5f5f5f] shadow-[0_4px_12px_-8px_rgba(0,0,0,0.25)]">
            <span className={cn("size-1.5 rounded-full", dirty ? "bg-[#d99a1e]" : "bg-[#1f8a54]")} />
            {dirty ? "Unpublished changes" : "Live"} · {config.brideName} &amp; {config.groomName}
          </span>
          <h1 className={cn(sansFont, "mt-3 text-[28px] leading-tight font-semibold tracking-[-0.03em] md:text-[34px]")}>
            Build your invite website by <Em>chatting</Em>.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#5f5f5f]">The AI only edits a JSON config; the templates render from it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VersionsSheet />
          <button
            className={darkPill}
            onClick={() => {
              publishConfig();
              toast.success("Website published! 🎉", {
                description: "Every guest's personal link now shows this version.",
                action: { label: "Copy link", onClick: () => copyText(inviteUrl(guests[0]?.id ?? "g01")) },
              });
            }}
          >
            <Rocket /> {dirty ? "Publish" : "Published"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="h-[560px] min-h-0 lg:h-auto">
          <ChatPanel />
        </div>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_12px_30px_-24px_rgba(0,0,0,0.3)]">
          <div className="grid gap-3 border-b border-[#ececec] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold tracking-wider text-[#8a8a8a] uppercase">Template</span>
              {Object.values(THEME_PRESETS).map((t) => (
                <button
                  key={t.theme}
                  aria-pressed={config.theme === t.theme}
                  onClick={() => {
                    if (config.theme === t.theme) return;
                    const r = applyConfigPatch({ theme: t.theme, palette: { ...t.palette } }, `${t.label} template`);
                    if (r.ok) toast.success(`${t.label} template applied`);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition",
                    config.theme === t.theme ? "border-[#161616] bg-white shadow-[0_6px_14px_-10px_rgba(0,0,0,0.45)]" : "border-[#ececec] text-[#5f5f5f] hover:border-[#d6d6d6]"
                  )}
                >
                  <span className="flex -space-x-1">
                    {[t.palette.primary, t.palette.accent, t.palette.background].map((c) => (
                      <span key={c} className="size-3.5 rounded-full border border-white shadow-[0_0_0_1px_#e5e5e5]" style={{ background: c }} />
                    ))}
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={guestId} onValueChange={setGuestId}>
                <SelectTrigger size="sm" className="w-48 rounded-xl border-[#ececec] bg-white">
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
              <Segmented
                value={lang}
                onChange={setLang}
                options={[
                  { value: "en", label: "English" },
                  { value: "hi", label: "हिंदी" },
                ]}
              />
              <div className="hidden md:block">
                <Segmented
                  value={device}
                  onChange={setDevice}
                  options={[
                    { value: "desktop", label: <Monitor className="size-3.5" />, aria: "Desktop preview" },
                    { value: "mobile", label: <Smartphone className="size-3.5" />, aria: "Mobile preview" },
                  ]}
                />
              </div>
              {guest && (
                <Link href={`/invite/${guest.id}`} target="_blank" className={cn(chip, "ml-auto inline-flex items-center gap-1")}>
                  Live link <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>

          <div className={cn("flex min-h-0 flex-1 justify-center bg-[#fafafa] p-3 md:p-6", hatch)}>
            {device === "mobile" ? (
              <div className="flex h-[70vh] w-[375px] max-w-full flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-[#1c1c1c] bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)] lg:h-auto">
                <div className="mx-auto mt-2 h-5 w-24 shrink-0 rounded-full bg-[#1c1c1c]" />
                <div className="text-foreground min-h-0 flex-1 overflow-y-auto font-sans">{preview}</div>
              </div>
            ) : (
              <div className="flex h-[70vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_24px_50px_-30px_rgba(0,0,0,0.45)] lg:h-auto">
                <div className="flex shrink-0 items-center gap-3 border-b border-[#ececec] bg-[#f7f7f7] px-3 py-2">
                  <span className="flex gap-1.5">
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md border border-[#ececec] bg-white px-3 py-1 text-[11px] text-[#8a8a8a]">
                    <Lock className="size-3 shrink-0" /> shaadi-os.app{previewPath}
                  </span>
                  <span className="hidden w-[42px] sm:block" />
                </div>
                <div className="text-foreground min-h-0 flex-1 overflow-y-auto font-sans">{preview}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

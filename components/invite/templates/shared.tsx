"use client";

import { CalendarDays, Clock, MapPin, Shirt, Sparkles } from "lucide-react";
import type { WeddingConfig, WeddingFunction } from "@/types";
import { LABELS, formatInviteDate, formatInviteTime, functionDisplayName, honorific, type Lang } from "@/lib/invite/i18n";
import { googleMapsLink } from "@/lib/geo";

export interface TemplateProps {
  config: WeddingConfig;
  functions: WeddingFunction[];
  lang: Lang;
  guestName?: string;
  /** Rendered under each function card (e.g. the RSVP form on the public invite). */
  renderFunctionExtra?: (f: WeddingFunction) => React.ReactNode;
}

export function Greeting({ guestName, lang, className, style }: { guestName?: string; lang: Lang; className?: string; style?: React.CSSProperties }) {
  if (!guestName) return null;
  return (
    <p className={className} style={style}>
      <span className="font-semibold">{honorific(guestName, lang)}</span>, {LABELS[lang].invited}
    </p>
  );
}

export function Welcome({ config, lang, className, style }: { config: WeddingConfig; lang: Lang; className?: string; style?: React.CSSProperties }) {
  const showBoth = lang === "en" && config.showHindi;
  return (
    <div className={className} style={style}>
      <p>{lang === "hi" ? config.welcomeMessage.hi : config.welcomeMessage.en}</p>
      {showBoth && <p className="mt-2 opacity-90">{config.welcomeMessage.hi}</p>}
    </div>
  );
}

export function dateRange(functions: WeddingFunction[], lang: Lang): string {
  if (!functions.length) return "";
  const dates = [...new Set(functions.map((f) => f.date))].sort();
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", opts);
  if (dates.length === 1) return fmt(dates[0], { day: "numeric", month: "long", year: "numeric" });
  return `${fmt(dates[0], { day: "numeric", month: "short" })} – ${fmt(dates[dates.length - 1], { day: "numeric", month: "short", year: "numeric" })}`;
}

export function FunctionDetails({
  f,
  lang,
  accent,
  muted = "opacity-75",
}: {
  f: WeddingFunction;
  lang: Lang;
  accent: string;
  muted?: string;
}) {
  const L = LABELS[lang];
  return (
    <div className="grid gap-1.5 text-sm">
      <p className="flex items-center gap-2">
        <CalendarDays className="size-4 shrink-0" style={{ color: accent }} /> {formatInviteDate(f.date, lang)}
      </p>
      <p className="flex items-center gap-2">
        <Clock className="size-4 shrink-0" style={{ color: accent }} /> {formatInviteTime(f.time, lang)}
      </p>
      <a href={googleMapsLink(f)} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:underline">
        <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: accent }} />
        <span>
          {f.venueName} <span className={`text-xs underline ${muted}`}>({L.openMap})</span>
        </span>
      </a>
      {f.dressCode && (
        <p className="flex items-center gap-2">
          <Shirt className="size-4 shrink-0" style={{ color: accent }} />
          <span>
            <span className={muted}>{L.dressCode}:</span> {f.dressCode}
          </span>
        </p>
      )}
      {f.description && (
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0" style={{ color: accent }} />
          <span className={muted}>{f.description}</span>
        </p>
      )}
    </div>
  );
}

export { functionDisplayName, LABELS };

/** Readable text colour for a hex background. */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#2b1416" : "#FFF8EC";
}

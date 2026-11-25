"use client";

import { Greeting, Welcome, FunctionDetails, dateRange, functionDisplayName, LABELS, onColor, type TemplateProps } from "./shared";

function Arch({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 400 60" className="block h-10 w-full -scale-y-100" preserveAspectRatio="none" aria-hidden>
      <path d="M0 60 V30 Q20 30 25 12 Q50 -6 75 12 Q80 30 100 30 Q120 30 125 12 Q150 -6 175 12 Q180 30 200 30 Q220 30 225 12 Q250 -6 275 12 Q280 30 300 30 Q320 30 325 12 Q350 -6 375 12 Q380 30 400 30 V60 Z" fill={color} />
    </svg>
  );
}

function Paisley({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden>
      <path d="M30 78 C5 70 2 40 18 22 C30 8 52 10 54 28 C56 44 40 48 34 40 C28 32 38 24 44 30" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="30" cy="54" r="4" fill={color} />
    </svg>
  );
}

/** Royal Rajasthani: jharokha arches, paisley corners, gold double borders. */
export function RajasthaniTemplate({ config, functions, lang, guestName, renderFunctionExtra }: TemplateProps) {
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  const fg = onColor(primary);
  return (
    <div style={{ background, color: "#2b1416" }} className="min-h-full">
      <section className="relative overflow-hidden px-6 pt-10 pb-14 text-center" style={{ background: primary, color: fg }}>
        <div className="pointer-events-none absolute inset-3 rounded-t-[120px] border-2" style={{ borderColor: accent }} />
        <div className="pointer-events-none absolute inset-5 rounded-t-[110px] border" style={{ borderColor: `${accent}88` }} />
        <Paisley color={accent} className="absolute top-6 left-6 h-12 w-9 opacity-80" />
        <Paisley color={accent} className="absolute top-6 right-6 h-12 w-9 -scale-x-100 opacity-80" />
        <p className="relative text-xs tracking-[0.3em] uppercase" style={{ color: accent }}>
          || Shri Ganeshaya Namah ||
        </p>
        <Greeting guestName={guestName} lang={lang} className="relative mt-5 text-sm" />
        <h1 className="font-heading relative mt-4 text-4xl font-bold sm:text-5xl">
          {config.brideName}
          <span className="mx-3 text-2xl italic" style={{ color: accent }}>
            {L.weds}
          </span>
          {config.groomName}
        </h1>
        <p className="relative mt-3 text-sm tracking-widest uppercase" style={{ color: accent }}>
          {dateRange(functions, lang)} · {config.city}
        </p>
        <Welcome config={config} lang={lang} className="relative mx-auto mt-5 max-w-md text-sm leading-relaxed opacity-95" />
      </section>
      <Arch color={primary} />
      <section className="mx-auto grid max-w-2xl gap-5 px-4 py-8">
        <h2 className="font-heading text-center text-2xl font-semibold" style={{ color: primary }}>
          ✦ {L.functions} ✦
        </h2>
        {functions.map((f) => (
          <article key={f.id} className="rounded-t-[48px] rounded-b-xl border-2 bg-white/70 p-5 shadow-sm" style={{ borderColor: accent }}>
            <h3 className="font-heading mb-3 text-center text-xl font-bold" style={{ color: primary }}>
              {functionDisplayName(f, lang)}
            </h3>
            <FunctionDetails f={f} lang={lang} accent={primary} />
            {renderFunctionExtra?.(f)}
          </article>
        ))}
        <p className="font-heading text-center text-sm italic" style={{ color: primary }}>
          {L.blessings}
        </p>
      </section>
    </div>
  );
}

"use client";

import { Greeting, Welcome, FunctionDetails, dateRange, functionDisplayName, LABELS, type TemplateProps } from "./shared";

function Alpana({ color, className }: { color: string; className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden>
      <circle r="8" fill={color} />
      <circle r="14" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" />
      {petals.map((a) => (
        <path key={a} d="M0 -18 C6 -26 6 -36 0 -44 C-6 -36 -6 -26 0 -18 Z" fill="none" stroke={color} strokeWidth="1.6" transform={`rotate(${a})`} />
      ))}
      <circle r="47" fill="none" stroke={color} strokeWidth="1" />
    </svg>
  );
}

/** Bengali: red-and-white alpana motifs, shankha-pola inspired. */
export function BengaliTemplate({ config, functions, lang, guestName, renderFunctionExtra }: TemplateProps) {
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  return (
    <div style={{ background, color: "#2b1416" }} className="min-h-full">
      <section className="relative overflow-hidden px-6 py-12 text-center" style={{ borderBottom: `6px double ${primary}` }}>
        <Alpana color={primary} className="absolute -top-16 -left-16 size-48 opacity-15" />
        <Alpana color={primary} className="absolute -right-16 -bottom-16 size-48 opacity-15" />
        <Alpana color={primary} className="relative mx-auto size-20" />
        <p className="relative mt-3 text-sm font-semibold tracking-widest" style={{ color: primary }}>
          শুভ বিবাহ · Shubho Bibaho
        </p>
        <Greeting guestName={guestName} lang={lang} className="relative mt-4 text-sm" />
        <h1 className="font-heading relative mt-3 text-4xl font-bold" style={{ color: primary }}>
          {config.brideName} <span className="text-2xl" style={{ color: accent }}>❀</span> {config.groomName}
        </h1>
        <p className="relative mt-3 text-sm">
          {dateRange(functions, lang)} · {config.city}
        </p>
        <Welcome config={config} lang={lang} className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed" />
      </section>
      <section className="mx-auto grid max-w-2xl gap-4 px-4 py-8">
        <h2 className="font-heading text-center text-2xl font-semibold" style={{ color: primary }}>
          {L.functions}
        </h2>
        {functions.map((f) => (
          <article key={f.id} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${primary}55`, boxShadow: `inset 0 0 0 4px #fff, inset 0 0 0 5px ${primary}33` }}>
            <h3 className="font-heading mb-3 flex items-center gap-2 text-xl font-bold" style={{ color: primary }}>
              <Alpana color={accent} className="size-6" /> {functionDisplayName(f, lang)}
            </h3>
            <FunctionDetails f={f} lang={lang} accent={primary} />
            {renderFunctionExtra?.(f)}
          </article>
        ))}
      </section>
    </div>
  );
}

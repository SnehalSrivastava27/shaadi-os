"use client";

import { Greeting, Welcome, FunctionDetails, dateRange, functionDisplayName, LABELS, onColor, type TemplateProps } from "./shared";

function Gopuram({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 70" className="mx-auto h-16 w-28" aria-hidden>
      <path d="M10 70 H110 L100 56 H20 Z M22 56 H98 L90 42 H30 Z M32 42 H88 L80 28 H40 Z M42 28 H78 L70 14 H50 Z M52 14 H68 L60 2 Z" fill={color} />
    </svg>
  );
}

/** South Indian: temple gopuram, kolam dots, silk-saree zari border. */
export function SouthIndianTemplate({ config, functions, lang, guestName, renderFunctionExtra }: TemplateProps) {
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  const kolam = {
    backgroundImage: `radial-gradient(circle, ${accent} 1.6px, transparent 2px)`,
    backgroundSize: "16px 16px",
  };
  const zari = { background: `repeating-linear-gradient(90deg, ${accent} 0 6px, ${primary} 6px 10px)` };
  return (
    <div style={{ background, color: "#2b1416" }} className="min-h-full">
      <div className="h-2" style={zari} />
      <section className="relative px-6 pt-8 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={kolam} />
        <Gopuram color={accent} />
        <p className="relative mt-2 text-xs tracking-[0.3em] uppercase" style={{ color: primary }}>
          Subha Muhurtham
        </p>
        <Greeting guestName={guestName} lang={lang} className="relative mt-4 text-sm" />
        <h1 className="font-heading relative mt-3 text-4xl font-bold" style={{ color: primary }}>
          {config.brideName} <span style={{ color: accent }}>❦</span> {config.groomName}
        </h1>
        <p className="relative mt-3 text-sm font-medium">
          {dateRange(functions, lang)} · {config.city}
        </p>
        <Welcome config={config} lang={lang} className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed" />
      </section>
      <div className="h-2" style={zari} />
      <section className="mx-auto grid max-w-2xl gap-4 px-4 py-8">
        <h2 className="font-heading text-center text-2xl font-semibold" style={{ color: primary }}>
          {L.functions}
        </h2>
        {functions.map((f) => (
          <article key={f.id} className="overflow-hidden rounded-xl border-2 bg-white shadow-sm" style={{ borderColor: accent }}>
            <div className="px-5 py-2" style={{ background: primary, color: onColor(primary) }}>
              <h3 className="font-heading text-lg font-bold">{functionDisplayName(f, lang)}</h3>
            </div>
            <div className="p-5">
              <FunctionDetails f={f} lang={lang} accent={primary} />
              {renderFunctionExtra?.(f)}
            </div>
            <div className="h-2" style={{ background: "#2F6B3B" }} />
          </article>
        ))}
      </section>
    </div>
  );
}

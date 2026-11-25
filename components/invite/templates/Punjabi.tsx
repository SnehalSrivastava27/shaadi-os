"use client";

import { Greeting, Welcome, FunctionDetails, dateRange, functionDisplayName, LABELS, onColor, type TemplateProps } from "./shared";

/** Punjabi: bright phulkari embroidery pattern, bold colour blocks. */
export function PunjabiTemplate({ config, functions, lang, guestName, renderFunctionExtra }: TemplateProps) {
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  const fg = onColor(primary);
  const phulkari = {
    backgroundImage: `linear-gradient(45deg, ${accent} 25%, transparent 25%), linear-gradient(-45deg, ${accent} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${accent} 75%), linear-gradient(-45deg, transparent 75%, ${accent} 75%)`,
    backgroundSize: "18px 18px",
    backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0",
  };
  return (
    <div style={{ background, color: "#2b1416" }} className="min-h-full">
      <div className="h-4 opacity-90" style={phulkari} />
      <section className="px-6 py-10 text-center" style={{ background: primary, color: fg }}>
        <p className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: accent }}>
          Ik Onkar · Shubh Vivah
        </p>
        <Greeting guestName={guestName} lang={lang} className="mt-4 text-sm" />
        <h1 className="font-heading mt-4 text-5xl font-black">
          {config.brideName}
          <span className="block text-xl font-normal italic" style={{ color: accent }}>
            &amp;
          </span>
          {config.groomName}
        </h1>
        <p className="mt-4 inline-block rounded-full px-4 py-1 text-sm font-semibold" style={{ background: accent, color: onColor(accent) }}>
          {dateRange(functions, lang)} · {config.city}
        </p>
        <Welcome config={config} lang={lang} className="mx-auto mt-5 max-w-md text-sm leading-relaxed" />
      </section>
      <div className="h-4 opacity-90" style={phulkari} />
      <section className="mx-auto grid max-w-2xl gap-4 px-4 py-8">
        <h2 className="font-heading text-center text-3xl font-black" style={{ color: primary }}>
          {L.functions} 🥁
        </h2>
        {functions.map((f, i) => (
          <article
            key={f.id}
            className="rounded-2xl border-l-8 bg-white p-5 shadow-md"
            style={{ borderColor: i % 2 ? accent : primary }}
          >
            <h3 className="font-heading mb-3 text-2xl font-bold" style={{ color: i % 2 ? accent : primary }}>
              {functionDisplayName(f, lang)}
            </h3>
            <FunctionDetails f={f} lang={lang} accent={primary} />
            {renderFunctionExtra?.(f)}
          </article>
        ))}
        <p className="text-center text-lg font-bold" style={{ color: primary }}>
          Balle balle! 🎉
        </p>
      </section>
    </div>
  );
}

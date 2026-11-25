"use client";

import { Greeting, Welcome, FunctionDetails, dateRange, functionDisplayName, LABELS, type TemplateProps } from "./shared";

/** Modern minimal: big serif type, hairlines, generous whitespace. */
export function ModernTemplate({ config, functions, lang, guestName, renderFunctionExtra }: TemplateProps) {
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  return (
    <div style={{ background, color: primary }} className="min-h-full">
      <section className="mx-auto max-w-2xl px-6 pt-16 pb-10">
        <Greeting guestName={guestName} lang={lang} className="text-sm opacity-80" />
        <p className="mt-8 text-xs tracking-[0.4em] uppercase" style={{ color: accent }}>
          {L.familyInvite}
        </p>
        <h1 className="font-heading mt-4 text-5xl leading-tight font-medium sm:text-6xl">
          {config.brideName}
          <br />
          <span className="italic" style={{ color: accent }}>
            &amp;
          </span>{" "}
          {config.groomName}
        </h1>
        <div className="my-6 h-px w-24" style={{ background: accent }} />
        <p className="text-sm tracking-widest uppercase">
          {dateRange(functions, lang)} — {config.city}
        </p>
        <Welcome config={config} lang={lang} className="mt-6 max-w-md text-base leading-relaxed opacity-90" />
      </section>
      <section className="mx-auto grid max-w-2xl gap-0 px-6 pb-16">
        {functions.map((f, i) => (
          <article key={f.id} className="grid gap-3 border-t py-6 sm:grid-cols-[48px_1fr]" style={{ borderColor: `${primary}22` }}>
            <span className="font-heading text-2xl" style={{ color: accent }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-heading mb-3 text-2xl">{functionDisplayName(f, lang)}</h3>
              <FunctionDetails f={f} lang={lang} accent={accent} />
              {renderFunctionExtra?.(f)}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

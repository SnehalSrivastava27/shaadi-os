"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { MapPin } from "lucide-react";
import { googleMapsLink } from "@/lib/geo";
import { formatInviteDate, formatInviteTime } from "@/lib/invite/i18n";
import { Editable, EditablePicker, useEdit } from "../Editable";
import { Story } from "../Story";
import { STACKED_SCENE } from "../scene";
import Lenis from "lenis";
import { Greeting, LABELS, functionDisplayName, type TemplateProps } from "./shared";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"] });
const caps = Cinzel({ subsets: ["latin"], weight: ["500", "600"] });

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);

const MAROON = "#8A1C1C";
const MARIGOLD = ["#F59E0B", "#F97316", "#FBBF24"];

// ------------------------------------------------------------------ original SVG art

function Marigold({ x, y, r, i }: { x: number; y: number; r: number; i: number }) {
  const c = MARIGOLD[i % 3];
  return (
    <g>
      {Array.from({ length: 9 }, (_, k) => {
        const a = (k / 9) * Math.PI * 2 + i;
        return <circle key={k} cx={x + Math.cos(a) * r * 0.55} cy={y + Math.sin(a) * r * 0.55} r={r * 0.55} fill={c} />;
      })}
      <circle cx={x} cy={y} r={r * 0.6} fill={c} stroke="#B45309" strokeOpacity={0.35} strokeWidth={0.8} />
      <circle cx={x - r * 0.15} cy={y - r * 0.2} r={r * 0.2} fill="#FFF7D6" opacity={0.55} />
    </g>
  );
}

/** Mango-leaf and marigold toran with hanging strands. */
function Toran() {
  const strands = [18, 66, 114, 162, 238, 286, 334, 382];
  return (
    <svg data-toran viewBox="0 0 400 120" className="pointer-events-none absolute inset-x-0 top-0 z-10 w-full" aria-hidden>
      {Array.from({ length: 21 }, (_, i) => (
        <path key={`l${i}`} d={`M${i * 20} 6 q8 22 0 40 q-8 -18 0 -40Z`} fill={i % 2 ? "#4D7C0F" : "#3F6212"} transform={`rotate(${i % 2 ? 8 : -8} ${i * 20} 6)`} />
      ))}
      {Array.from({ length: 34 }, (_, i) => (
        <Marigold key={`s${i}`} x={i * 12.2} y={10 + Math.sin(i / 2.7) * 3} r={7} i={i} />
      ))}
      {strands.map((x, s) => (
        <g key={`st${s}`}>
          {Array.from({ length: s % 2 ? 4 : 6 }, (_, k) => (
            <Marigold key={k} x={x} y={24 + k * 13} r={6} i={k + s} />
          ))}
          <circle cx={x} cy={s % 2 ? 80 : 106} r={3} fill="#FFFBEB" stroke="#D4A017" />
        </g>
      ))}
    </svg>
  );
}

/** Brass bell on a chain. */
function Bell({ className, len = 70 }: { className?: string; len?: number }) {
  return (
    <svg viewBox={`0 0 40 ${len + 52}`} className={className} aria-hidden>
      <defs>
        <linearGradient id="brass" x1="0" x2="1">
          <stop offset="0" stopColor="#8A5A12" />
          <stop offset="0.45" stopColor="#E8B74A" />
          <stop offset="1" stopColor="#9A6716" />
        </linearGradient>
      </defs>
      {Array.from({ length: Math.floor(len / 7) }, (_, i) => (
        <ellipse key={i} cx="20" cy={i * 7 + 3} rx="2" ry="3.4" fill="none" stroke="#B8862B" strokeWidth="1.2" />
      ))}
      <path d={`M20 ${len} c-4 0 -6 4 -6 9 c0 6 -8 10 -10 22 h32 c-2 -12 -10 -16 -10 -22 c0 -5 -2 -9 -6 -9Z`} fill="url(#brass)" />
      <rect x="3" y={len + 31} width="34" height="4" rx="2" fill="#8A5A12" />
      <circle cx="20" cy={len + 40} r="4" fill="#8A5A12" />
    </svg>
  );
}

/** Scalloped mehrab arch outline in gold. */
function Mehrab({ color }: { color: string }) {
  const d =
    "M20 520 V210 C20 170 40 150 62 140 C70 108 98 92 120 90 C130 60 160 40 200 6 C240 40 270 60 280 90 C302 92 330 108 338 140 C360 150 380 170 380 210 V520";
  return (
    <svg data-arch viewBox="0 0 400 530" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-4 top-16 bottom-10 h-[calc(100%-6.5rem)] w-[calc(100%-2rem)]" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={color} strokeOpacity="0.45" strokeWidth="1" transform="translate(10 12) scale(0.95 0.97)" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function BananaLeaf({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 220" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <path d="M100 215 C60 170 10 120 14 20 C60 60 104 120 100 215Z" fill="#4D7C0F" />
      <path d="M100 215 C64 168 34 110 20 30" stroke="#A3C45A" strokeWidth="2.5" fill="none" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${86 - i * 7} ${190 - i * 18} l-${22 - i} -${10 + i}`} stroke="#365314" strokeWidth="1.2" />
      ))}
      <path d="M110 218 C96 150 70 110 60 40 C92 90 118 140 110 218Z" fill="#65A30D" opacity="0.9" />
    </svg>
  );
}

function Lotus({ className }: { className?: string }) {
  const petal = (rot: number, fill: string, s = 1) => (
    <path key={`${rot}${fill}`} d="M0 0 C-14 -16 -12 -40 0 -54 C12 -40 14 -16 0 0Z" fill={fill} transform={`rotate(${rot}) scale(${s})`} />
  );
  return (
    <svg viewBox="-70 -70 140 90" className={className} aria-hidden>
      <g transform="translate(0 10)">
        {[-70, 70].map((r) => petal(r, "#F9A8D4", 0.85))}
        {[-42, 42].map((r) => petal(r, "#F472B6", 0.95))}
        {[-16, 16].map((r) => petal(r, "#EC4899"))}
        {petal(0, "#FBCFE8", 0.9)}
        <ellipse cx="0" cy="4" rx="40" ry="7" fill="#4D7C0F" />
      </g>
    </svg>
  );
}

function Kalash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden>
      <defs>
        <linearGradient id="kalash" x1="0" x2="1">
          <stop offset="0" stopColor="#7C4A0E" />
          <stop offset="0.4" stopColor="#F2C14E" />
          <stop offset="1" stopColor="#8A5A12" />
        </linearGradient>
      </defs>
      {[-50, -25, 0, 25, 50].map((r) => (
        <path key={r} d="M60 52 c-6 -14 -4 -30 0 -40 c4 10 6 26 0 40Z" fill="#3F6212" transform={`rotate(${r} 60 52)`} />
      ))}
      <ellipse cx="60" cy="38" rx="16" ry="19" fill="#8B5A2B" />
      <path d="M48 26 q12 -10 24 0" stroke="#5C3A1A" strokeWidth="2" fill="none" />
      <path d="M38 56 h44 l-4 10 c22 8 30 28 22 50 c-6 16 -24 24 -40 24 c-16 0 -34 -8 -40 -24 c-8 -22 0 -42 22 -50Z" fill="url(#kalash)" />
      <path d="M26 92 h68" stroke="#B91C1C" strokeWidth="5" />
      <text x="60" y="118" textAnchor="middle" fontSize="18" fill="#B91C1C">ॐ</text>
    </svg>
  );
}

function Divider({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 24" className="mx-auto my-6 h-5 w-48" aria-hidden>
      <path d="M0 12 H96 M144 12 H240" stroke={color} strokeWidth="1" />
      <path d="M120 2 C128 10 128 14 120 22 C112 14 112 10 120 2Z" fill={color} />
      <circle cx="104" cy="12" r="2.5" fill={color} />
      <circle cx="136" cy="12" r="2.5" fill={color} />
    </svg>
  );
}

// ------------------------------------------------------------------ live bits

function useNow() {
  const [now, setNow] = useState<number | null>(null); // null on the server so SSR markup stays stable
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

function Countdown({ iso, color }: { iso: string; color: string }) {
  const now = useNow();
  const left = now === null ? null : Math.max(0, new Date(iso).getTime() - now);
  const parts = left === null ? ["–", "–", "–", "–"] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {["Days", "Hours", "Minutes", "Seconds"].map((l, i) => (
        <div key={l} className="rounded-xl border bg-white/45 py-2" style={{ borderColor: `${color}55` }}>
          <p className={`${display.className} text-3xl font-semibold tabular-nums`} style={{ color }}>
            {parts[i]}
          </p>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: MAROON }}>
            {l}
          </p>
        </div>
      ))}
    </div>
  );
}

function MonthCalendar({ date, color, accent }: { date: string; color: string; accent: string }) {
  const d = new Date(`${date}T00:00:00`);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  return (
    <div className="mx-auto mt-8 max-w-xs rounded-2xl border-2 bg-white/40 p-4" style={{ borderColor: accent }}>
      <p className={`${caps.className} text-center text-sm font-semibold`} style={{ color }}>
        {d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>
      <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center text-xs">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => (
          <span key={w} className="pb-1 opacity-60">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const on = i + 1 === d.getDate();
          return (
            <span key={i} data-cal-day className="relative mx-auto flex size-7 items-center justify-center" style={on ? { color: "#fff" } : undefined}>
              {on && (
                <svg viewBox="0 0 24 24" className="absolute inset-0 size-7" aria-hidden>
                  <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.4 5 6.8 5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.4 0 5.8 3.3 4.3 6.8C19.5 16.4 12 21 12 21z" fill={MAROON} />
                </svg>
              )}
              <span className="relative">{i + 1}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ scenes + motion

/** One screen of the invite. Live: fills the viewport and snaps. Builder: normal flow so editing stays easy. */
function Scene({ live, className = "", children }: { live: boolean; className?: string; children: React.ReactNode }) {
  return (
    <section data-scene className={`${live ? STACKED_SCENE : "relative mx-auto w-full max-w-md px-8 py-10 text-center"} ${className}`}>
      {live && <div data-dim aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-[#2a1d08] opacity-0" />}
      {children}
    </section>
  );
}

/** Marigold and rose petals; GSAP makes them fall. Positions are fixed so server and client markup match. */
function Petals({ count = 26, className = "" }: { count?: number; className?: string }) {
  const colors = ["#F59E0B", "#F97316", "#FBBF24", "#F472B6", "#E11D48"];
  return (
    <div data-petals aria-hidden className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} data-petal viewBox="0 0 20 28" className="absolute top-0 size-4 opacity-0" style={{ left: `${50 + (((i * 37) % 60) - 30)}%`, width: 10 + (i % 4) * 3 }}>
          <path d="M10 0 C18 8 18 20 10 28 C2 20 2 8 10 0Z" fill={colors[i % colors.length]} />
        </svg>
      ))}
    </div>
  );
}

/** Raja Ravi Varma's Riddhi-Siddhi Ganapati (public domain, Wikimedia Commons) in a glowing gold arch. */
function GaneshaBlessing({ accent }: { accent: string }) {
  return (
    <div data-ganesha className="relative z-30 mx-auto w-[104px]">
      <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,#ffe7a3_0%,transparent_70%)] opacity-90" />
      <div className="relative overflow-hidden rounded-t-full border-[3px] bg-white p-1 shadow-[0_12px_28px_-12px_rgba(120,70,0,0.7)]" style={{ borderColor: accent }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- small bundled image */}
        <img src="/story/ganesha.jpg" alt="Lord Ganesha with Riddhi and Siddhi, painting from the Ravi Varma Press" className="aspect-[3/4] w-full rounded-t-full object-cover object-[50%_20%]" />
      </div>
    </div>
  );
}

function usePetalShower(scope: React.RefObject<HTMLElement | null>) {
  return (container: Element, delay = 0) => {
    const h = (scope.current?.ownerDocument.defaultView?.innerHeight ?? 800) + 80;
    gsap.utils.toArray<SVGElement>(container.querySelectorAll("[data-petal]")).forEach((p, i) => {
      gsap.set(p, { y: -30, x: 0, rotation: gsap.utils.random(0, 360), opacity: 0 });
      gsap.to(p, {
        keyframes: { opacity: [0, 1, 1, 0.9] },
        y: h,
        x: gsap.utils.random(-120, 120),
        rotation: `+=${gsap.utils.random(200, 600)}`,
        duration: gsap.utils.random(4.5, 8),
        delay: delay + i * 0.16,
        ease: "none",
        repeat: -1,
        repeatDelay: gsap.utils.random(0, 1.5),
      });
    });
  };
}

// ------------------------------------------------------------------ template

/** Haldi-yellow mandap: Ganesha's blessing, marigold toran, brass bells, gold mehrab, the couple's story, one screen at a time. */
export function MandapTemplate({ config, functions, lang, guestName, renderFunctionExtra, renderRsvp }: TemplateProps) {
  const edit = useEdit();
  const live = !edit;
  const [opened, setOpened] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gate = useRef<HTMLDivElement>(null);
  const shower = usePetalShower(root);
  const { primary, accent, background } = config.palette;
  const L = LABELS[lang];
  const sorted = [...functions].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const main = sorted.find((f) => /wedding|vivah|phere|shaadi|muhurtham|anand/i.test(`${f.id} ${f.name}`)) ?? sorted[sorted.length - 1];
  const mainDate = main ? new Date(`${main.date}T00:00:00`) : null;
  const welcome = lang === "hi" ? config.welcomeMessage.hi : config.welcomeMessage.en;
  const fnEdit = (id: string, key: "name" | "venueName" | "dressCode" | "description" | "date" | "time", label: string) =>
    edit && ((v: string) => edit({ functions: [{ id, [key]: v }] }, `Changed ${label}`));

  const paper = {
    background: `radial-gradient(ellipse at 50% 0%, #fffdf3 0%, transparent 60%), radial-gradient(circle at 20% 80%, ${accent}1f, transparent 45%), ${background}`,
    color: "#3b2a12",
  };

  // Real invite: lock scrolling until the gate opens, then smooth (Lenis) scrolling synced to ScrollTrigger.
  useEffect(() => {
    if (!live) return;
    const html = document.documentElement;
    html.style.overflow = opened ? "" : "hidden";
    // A scene taller than the screen sticks only once its bottom is reached, so nothing is ever cut off.
    const pinTall = () =>
      root.current?.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => (el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`));
    pinTall();
    window.addEventListener("resize", pinTall);
    let lenis: Lenis | null = null;
    const raf = (t: number) => lenis?.raf(t * 1000);
    if (opened && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }
    return () => {
      html.style.overflow = "";
      window.removeEventListener("resize", pinTall);
      gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, [live, opened]);

  // Scroll choreography for every scene after the hero.
  useGSAP(
    () => {
      if (!live) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-bell]", { rotation: 7, transformOrigin: "50% 0%", duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.5 });
        // Card stack: while the next scene slides up, the current one sinks back and dims.
        const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]");
        scenes.forEach((scene, i) => {
          const next = scenes[i + 1];
          if (!next) return;
          const st = { trigger: next, start: "top bottom", end: "top top", scrub: true } as const;
          gsap.to(scene, { scale: 0.9, yPercent: -4, borderRadius: 32, ease: "none", scrollTrigger: st });
          const dim = scene.querySelector("[data-dim]");
          if (dim) gsap.to(dim, { opacity: 0.45, ease: "none", scrollTrigger: st });
        });
        // The marigold thread draws itself as the guest travels through the invite.
        gsap.fromTo("[data-thread] path", { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 } });
        gsap.utils.toArray<HTMLElement>("[data-scene]").slice(1).forEach((scene) => {
          const st = { trigger: scene, start: "top 65%", toggleActions: "play none none reverse" } as const;
          gsap.from(scene.querySelectorAll("[data-anim]"), { y: 46, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.11, scrollTrigger: st });
          const photo = scene.querySelector("[data-photo]");
          if (photo)
            gsap.fromTo(photo, { clipPath: "inset(14% 10% 14% 10% round 28px)", scale: 1.12 }, { clipPath: "inset(0% 0% 0% 0% round 28px)", scale: 1, ease: "none", scrollTrigger: { trigger: scene, start: "top bottom", end: "top 20%", scrub: true } });
          scene.querySelectorAll("[data-parallax]").forEach((el) => gsap.fromTo(el, { yPercent: 18 }, { yPercent: -18, ease: "none", scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true } }));
          scene.querySelectorAll("[data-spin]").forEach((el) => gsap.to(el, { rotation: 360, duration: 60, ease: "none", repeat: -1 }));
          const day = scene.querySelector<HTMLElement>("[data-countup]");
          if (day) gsap.from(day, { textContent: 1, snap: { textContent: 1 }, duration: 1.4, ease: "power2.out", scrollTrigger: st });
          const cal = scene.querySelectorAll("[data-cal-day]");
          if (cal.length) gsap.from(cal, { scale: 0, opacity: 0, duration: 0.35, stagger: 0.012, ease: "back.out(2)", scrollTrigger: st });
          const petals = scene.querySelector("[data-petals]");
          if (petals) ScrollTrigger.create({ trigger: scene, start: "top 60%", once: true, onEnter: () => shower(petals) });
        });
      });
    },
    { scope: root, dependencies: [live] },
  );

  // Hero intro after the gate opens: toran drops, Ganesha appears, arch draws, petals shower.
  useGSAP(
    () => {
      if (!live || !opened) return;
      const hero = root.current?.querySelector("[data-hero]");
      if (!hero) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(hero.querySelector("[data-toran]"), { yPercent: -110, duration: 1.2, ease: "bounce.out" })
          .from(hero.querySelector("[data-ganesha]"), { scale: 0.3, opacity: 0, duration: 1.1, ease: "back.out(1.6)" }, "-=0.6")
          .from(hero.querySelectorAll("[data-arch] path"), { drawSVG: "50% 50%", duration: 1.8, ease: "power2.inOut" }, "<")
          .from(hero.querySelectorAll("[data-hero-item]"), { y: 34, opacity: 0, stagger: 0.13, duration: 0.9 }, "-=1.3")
          .from(hero.querySelectorAll("[data-foliage]"), { y: 140, opacity: 0, stagger: 0.08, duration: 1.1 }, "-=1");
        const petals = hero.querySelector("[data-petals]");
        if (petals) shower(petals, 1.2);
      });
    },
    { scope: root, dependencies: [live, opened] },
  );

  const openGate = () => {
    if (!gate.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setOpened(true);
    gsap.to(gate.current, { opacity: 0, scale: 1.08, duration: 0.55, ease: "power2.in", onComplete: () => setOpened(true) });
  };

  return (
    <div ref={root} style={{ ...paper, ["--paper" as string]: paper.background }} className={`${display.className} relative min-h-full overflow-x-clip`}>
      {live && (
        <svg data-thread aria-hidden viewBox="0 0 24 1000" preserveAspectRatio="none" className="pointer-events-none fixed top-0 left-[max(6px,calc(50%-224px+6px))] z-40 h-[100svh] w-6">
          <path d="M12 0 C2 120 22 240 12 360 S2 600 12 720 S22 900 12 1000" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {/* Gate: only on the real invite, never while editing */}
      {live && !opened && (
        <div ref={gate} className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a1d08]/40 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-xs overflow-hidden rounded-2xl px-6 pt-28 pb-8 text-center shadow-2xl" style={paper}>
            <Toran />
            <p className={`${caps.className} text-[11px] tracking-[0.3em]`} style={{ color: MAROON }}>
              Shubh Vivah
            </p>
            <p className="mt-3 text-4xl leading-tight font-semibold" style={{ color: primary }}>
              {config.brideName}
              <span className="block text-2xl italic" style={{ color: accent }}>
                &amp;
              </span>
              {config.groomName}
            </p>
            {mainDate && (
              <p className="mt-3 text-lg" style={{ color: MAROON }}>
                {mainDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <button
              onClick={openGate}
              className={`${caps.className} mt-6 rounded-full px-8 py-3 text-sm font-semibold tracking-widest text-white shadow-lg transition hover:-translate-y-0.5`}
              style={{ background: primary }}
            >
              Open invite
            </button>
          </div>
        </div>
      )}

      {/* Colour circles: only in the builder */}
      {edit && (
        <div className="sticky top-2 z-40 mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border bg-white/90 px-3 py-1.5 font-sans text-[11px] shadow-md backdrop-blur">
          <span className="text-[#5f5f5f]">Colours</span>
          {(["primary", "accent", "background"] as const).map((k) => (
            <label key={k} className="relative size-6 cursor-pointer rounded-full border-2 border-white shadow ring-1 ring-black/10 transition hover:scale-110" style={{ background: config.palette[k] }} title={{ primary: "Main colour", accent: "Accent colour", background: "Paper colour" }[k]}>
              <input type="color" value={config.palette[k]} onChange={(e) => edit({ palette: { [k]: e.target.value } }, "Changed colours")} className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </label>
          ))}
          <span className="text-[#8a8a8a]">· click any text to edit</span>
        </div>
      )}

      {/* Hero: Ganesha blesses the invite and showers flowers */}
      <section data-scene data-hero className={`relative mx-auto max-w-md overflow-hidden px-8 text-center ${live ? "sticky top-0 flex h-[100svh] min-h-[600px] flex-col items-center pt-[64px] will-change-transform [background:var(--paper)]" : "min-h-[700px] pt-[64px] pb-56"}`}>
        {live && <div data-dim aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-[#2a1d08] opacity-0" />}
        <Toran />
        <div data-bell className="pointer-events-none absolute top-10 left-3 z-10">
          <Bell className="h-36 w-8" len={90} />
        </div>
        <div data-bell className="pointer-events-none absolute top-10 right-3 z-10">
          <Bell className="h-28 w-8" len={60} />
        </div>
        <Mehrab color={accent} />
        {live && <Petals />}
        <GaneshaBlessing accent={accent} />
        <p data-hero-item className="relative mt-4 text-sm" style={{ color: accent }}>
          ॥ श्री गणेशाय नमः ॥
        </p>
        <p data-hero-item className={`${caps.className} relative mt-3 text-[11px] tracking-[0.35em]`} style={{ color: MAROON }}>
          Save the date
        </p>
        <h1 data-hero-item className="relative mt-2 text-[clamp(40px,6.6svh,56px)] leading-[1.02] font-semibold" style={{ color: primary }}>
          <Editable value={config.brideName} onSave={edit && ((v) => edit({ brideName: v }, "Changed bride's name"))} />
          <span className="my-0.5 block text-[0.55em] italic" style={{ color: accent }}>
            &amp;
          </span>
          <Editable value={config.groomName} onSave={edit && ((v) => edit({ groomName: v }, "Changed groom's name"))} />
        </h1>
        <Greeting guestName={guestName} lang={lang} className="relative mt-3 text-lg" style={{ color: MAROON }} />
        <p data-hero-item className="relative mt-1 text-lg" style={{ color: MAROON }}>
          <Editable value={config.city} onSave={edit && ((v) => edit({ city: v }, "Changed city"))} />
        </p>
        <div data-foliage className="pointer-events-none absolute bottom-0 -left-6">
          <BananaLeaf className="h-[26svh] max-h-56 min-h-40 w-28" />
        </div>
        <div data-foliage className="pointer-events-none absolute -right-6 bottom-0">
          <BananaLeaf className="h-[26svh] max-h-56 min-h-40 w-28" flip />
        </div>
        <div data-foliage className="pointer-events-none absolute bottom-3 left-6">
          <Kalash className="h-24 w-20" />
        </div>
        <div data-foliage className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2">
          <Lotus className="h-14 w-24" />
        </div>
        <div data-foliage className="pointer-events-none absolute right-8 bottom-3">
          <Lotus className="h-11 w-20" />
        </div>
        {live && <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 animate-bounce font-sans text-[11px] tracking-widest uppercase opacity-60">Scroll</p>}
      </section>

      {/* Welcome */}
      <Scene live={live}>
        <Divider color={accent} />
        <h2 data-anim className={`${caps.className} text-2xl font-semibold tracking-wider`} style={{ color: primary }}>
          You&apos;re Invited
        </h2>
        <p data-anim className="mt-5 text-[22px] leading-relaxed" style={{ color: MAROON }}>
          <Editable multiline value={welcome} onSave={edit && ((v) => edit({ welcomeMessage: lang === "hi" ? { hi: v } : { en: v } }, "Changed welcome message"))} />
        </p>
        {lang === "en" && config.showHindi && (
          <p data-anim className="mt-4 text-lg opacity-80">
            {config.welcomeMessage.hi}
          </p>
        )}
        <Divider color={accent} />
      </Scene>

      {/* The couple's journey: one chapter per screen */}
      <Story config={config} live={live} primary={primary} accent={accent} ink={MAROON} headingClass={caps.className} titleClass={display.className} />

      {/* Big date + countdown + calendar */}
      {main && mainDate && (
        <Scene live={live}>
          <p data-anim className={`${caps.className} text-sm tracking-widest`} style={{ color: MAROON }}>
            {functionDisplayName(main, lang)}
          </p>
          <div data-anim className="mt-4 flex items-center justify-center gap-5" style={{ color: primary }}>
            <div className="text-right">
              <p className="text-lg">{formatInviteTime(main.time, lang)}</p>
              <p className={`${caps.className} text-sm`}>{mainDate.toLocaleDateString("en-IN", { weekday: "long" })}</p>
            </div>
            <p data-countup className="border-x px-5 text-7xl font-semibold tabular-nums" style={{ borderColor: `${primary}55` }}>
              {mainDate.getDate()}
            </p>
            <div className="text-left">
              <p className={`${caps.className} text-sm`}>{mainDate.toLocaleDateString("en-IN", { month: "long" })}</p>
              <p className="text-lg">{mainDate.getFullYear()}</p>
            </div>
          </div>
          <div data-anim className="w-full">
            <Countdown iso={`${main.date}T${main.time}:00+05:30`} color={primary} />
          </div>
          <MonthCalendar date={main.date} color={primary} accent={accent} />
        </Scene>
      )}

      {/* Functions */}
      {live ? (
        sorted.map((f, i) => (
          <Scene key={f.id} live>
            <svg data-parallax aria-hidden viewBox="-100 -100 200 200" className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-[130%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.08]">
              <g data-spin style={{ transformOrigin: "center" }}>
                {Array.from({ length: 16 }, (_, k) => (
                  <ellipse key={k} rx="18" ry="80" fill="none" stroke={primary} strokeWidth="1.2" transform={`rotate(${k * 11.25})`} />
                ))}
              </g>
            </svg>
            <p data-anim className="relative font-sans text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: accent }}>
              {L.functions} · {i + 1} of {sorted.length}
            </p>
            <h3 data-anim className={`${caps.className} relative mt-3 text-[38px] leading-tight font-semibold`} style={{ color: primary }}>
              {functionDisplayName(f, lang)}
            </h3>
            <p data-anim className="relative mt-2 text-xl" style={{ color: MAROON }}>
              {formatInviteDate(f.date, lang)} · {formatInviteTime(f.time, lang)}
            </p>
            <p data-anim className="relative mt-4 flex items-start justify-center gap-2 text-xl">
              <MapPin className="mt-1.5 size-4 shrink-0" style={{ color: accent }} />
              <span>
                {f.venueName}{" "}
                <a href={googleMapsLink(f)} target="_blank" rel="noreferrer" className="font-sans text-xs whitespace-nowrap underline opacity-70 hover:opacity-100">
                  ({L.openMap})
                </a>
              </span>
            </p>
            {f.dressCode && (
              <p data-anim className="relative mt-2 text-lg">
                <span className="opacity-70">{L.dressCode}: </span>
                {f.dressCode}
              </p>
            )}
            {f.description && (
              <p data-anim className="relative mt-2 max-w-sm text-base italic opacity-80">
                {f.description}
              </p>
            )}
            {renderFunctionExtra && (
              <div data-anim className="relative mt-5 w-full text-left">
                {renderFunctionExtra(f)}
              </div>
            )}
          </Scene>
        ))
      ) : (
        <section className="relative mx-auto max-w-md px-6 pb-10">
          <h2 className={`${caps.className} text-center text-xl font-semibold tracking-wider`} style={{ color: primary }}>
            {L.functions}
          </h2>
          <ol className="relative mt-8 grid gap-6 border-l-2 pl-6" style={{ borderColor: `${accent}88` }}>
            {sorted.map((f) => (
              <li key={f.id} className="relative">
                <span className="absolute top-2 -left-[33px] size-4 rounded-full border-4" style={{ background: primary, borderColor: background }} />
                <article className="rounded-2xl border bg-white/50 p-5 shadow-[0_10px_30px_-20px_rgba(90,60,10,0.6)]" style={{ borderColor: `${accent}66` }}>
                  <h3 className={`${caps.className} text-lg font-semibold`} style={{ color: primary }}>
                    <Editable value={lang === "hi" ? functionDisplayName(f, lang) : f.name} onSave={lang === "hi" ? null : fnEdit(f.id, "name", "function name")} />
                  </h3>
                  <p className="mt-1 text-lg" style={{ color: MAROON }}>
                    <EditablePicker type="date" value={f.date} display={formatInviteDate(f.date, lang)} onSave={fnEdit(f.id, "date", `${f.name} date`)} />
                    {" · "}
                    <EditablePicker type="time" value={f.time} display={formatInviteTime(f.time, lang)} onSave={fnEdit(f.id, "time", `${f.name} time`)} />
                  </p>
                  <p className="mt-3 flex items-start gap-2 text-lg">
                    <MapPin className="mt-1 size-4 shrink-0" style={{ color: accent }} />
                    <span>
                      <Editable value={f.venueName} onSave={fnEdit(f.id, "venueName", `${f.name} venue`)} />{" "}
                      <a href={googleMapsLink(f)} target="_blank" rel="noreferrer" className="font-sans text-xs underline opacity-70 hover:opacity-100">
                        ({L.openMap})
                      </a>
                    </span>
                  </p>
                  <p className="mt-2 text-base">
                    <span className="opacity-70">{L.dressCode}: </span>
                    <Editable value={f.dressCode || "Anything you like"} onSave={fnEdit(f.id, "dressCode", `${f.name} dress code`)} />
                  </p>
                  {f.description && (
                    <p className="mt-2 text-base italic opacity-80">
                      <Editable multiline value={f.description} onSave={fnEdit(f.id, "description", `${f.name} description`)} />
                    </p>
                  )}
                  {renderFunctionExtra?.(f)}
                </article>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* One RSVP for everything, asked at the very end */}
      {renderRsvp && (
        <Scene live={live}>
          <Divider color={accent} />
          <h2 data-anim className={`${caps.className} text-2xl font-semibold tracking-wider`} style={{ color: primary }}>
            {lang === "hi" ? "क्या आप आ रहे हैं?" : "Will you be there?"}
          </h2>
          <p data-anim className="mt-2 mb-6 text-lg" style={{ color: MAROON }}>
            {lang === "hi" ? "बस तीन बातें बता दीजिए।" : "Just three quick things, and you're done."}
          </p>
          <div data-anim className="w-full">
            {renderRsvp()}
          </div>
        </Scene>
      )}

      {/* Closing: one last shower of petals */}
      <Scene live={live}>
        {live && <Petals count={18} />}
        <Lotus className="mx-auto h-16 w-28" />
        <p data-anim className={`${display.className} mt-6 text-3xl italic`} style={{ color: primary }}>
          {L.blessings}
        </p>
        <p data-anim className="mt-4 text-xl" style={{ color: MAROON }}>
          Your presence is the greatest gift of all.
        </p>
        <p data-anim className="mt-8 text-4xl font-semibold" style={{ color: primary }}>
          {config.brideName} <span style={{ color: accent }}>&amp;</span> {config.groomName}
        </p>
      </Scene>
    </div>
  );
}

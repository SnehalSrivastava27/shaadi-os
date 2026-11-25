/* eslint-disable @next/next/no-img-element -- static SVG art; next/image adds nothing for SVG. */
import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import {
  ArrowRight,
  ArrowRightLeft,
  BellRing,
  Car,
  Check,
  CheckCircle2,
  Globe,
  HeartHandshake,
  Languages,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "Shaadi OS: Fufa ki narazgi se accha, to Shaadi OS ko paisa dena hai",
  description: "Pickups, helpers, RSVPs, catering and the invite website: the whole wedding from one control room.",
};

/** Italic serif accent word inside sans headlines. */
function Em({ children }: { children: React.ReactNode }) {
  return <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#7a1f2b] italic">{children}</em>;
}

/** Ledgerle-style raised dark pill button. */
function PillButton({ href, children, light = false, className = "" }: { href: string; children: React.ReactNode; light?: boolean; className?: string }) {
  return light ? (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#161616] shadow-[inset_0_-2px_0_rgba(0,0,0,0.06),0_8px_20px_-12px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </Link>
  ) : (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border border-black bg-[#262626] px-6 py-3 text-[14px] font-semibold text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.22),inset_0_-3px_0_rgba(0,0,0,0.55),0_18px_30px_-12px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:bg-[#1a1a1a] ${className}`}
    >
      {children}
    </Link>
  );
}

function SectionHead({ title, sub, dark = false }: { title: React.ReactNode; sub: string; dark?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className={`text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl ${dark ? "text-white" : "text-[#161616]"}`}>{title}</h2>
      <p className={`mx-auto mt-4 max-w-md text-[15px] leading-relaxed ${dark ? "text-white/60" : "text-[#5f5f5f]"}`}>{sub}</p>
    </div>
  );
}

const hatch = "bg-[repeating-linear-gradient(-45deg,#f1f1f1_0_1px,transparent_1px_9px)]";
const fadeBottom = "[mask-image:linear-gradient(to_bottom,black_62%,transparent)]";

// ---------------------------------------------------------------- bento mocks

function Pill({ tone, children }: { tone: "green" | "blue" | "amber"; children: React.ReactNode }) {
  const c = { green: "bg-[#e8f6ee] text-[#1f8a54]", blue: "bg-[#eaf1fd] text-[#3b6fd8]", amber: "bg-[#fdf3e2] text-[#b4760f]" }[tone];
  const Icon = tone === "green" ? CheckCircle2 : RefreshCw;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${c}`}>
      <Icon className="size-3" /> {children}
    </span>
  );
}

function PickupsMock() {
  const rows = [
    { who: "Bua ji · Charbagh", sub: "Rohit · Innova", pill: <Pill tone="green">Arrived</Pill>, c: "#7a1f2b" },
    { who: "Sharma Uncle · Airport", sub: "Ramesh · Scorpio", pill: <Pill tone="blue">On the way</Pill>, c: "#c9822b" },
    { who: "Mausi ji · Airport", sub: "Pinku · Swift", pill: <Pill tone="amber">Offered</Pill>, c: "#3f7d5c" },
    { who: "Nana ji · Charbagh", sub: "Assigning…", pill: <Pill tone="amber">Queued</Pill>, c: "#6b6b6b" },
  ];
  return (
    <div className={`mx-auto w-full max-w-sm rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.25)] ${fadeBottom}`}>
      <div className="flex items-center justify-between rounded-xl bg-[#f7f7f7] px-4 py-3">
        <div>
          <p className="text-[15px] font-semibold">Auto-assign</p>
          <p className="text-xs text-[#8a8a8a]">
            On for <span className="font-semibold text-[#161616]">6</span> helpers
          </p>
        </div>
        <span className="flex h-6 w-11 items-center justify-end rounded-full bg-[#161616] p-0.5">
          <span className="size-5 rounded-full bg-white" />
        </span>
      </div>
      {rows.map((r, i) => (
        <div key={r.who} className={`flex items-center gap-3 py-3.5 ${i ? "border-t border-dashed border-[#e7e7e7]" : "mt-1"}`}>
          <span className="flex size-9 items-center justify-center rounded-full" style={{ background: `${r.c}14`, color: r.c }}>
            <Car className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">{r.who}</span>
            <span className="text-xs text-[#8a8a8a]">{r.sub}</span>
          </span>
          {r.pill}
        </div>
      ))}
    </div>
  );
}

function HelpersGridMock() {
  const tiles: (null | { t: string; c: string })[] = [
    { t: "RB", c: "#7a1f2b" }, null, { t: "P", c: "#c9822b" }, { t: "🚗", c: "#3b6fd8" },
    null, { t: "CJ", c: "#3f7d5c" }, null, { t: "MJ", c: "#8a8a8a" },
    { t: "R", c: "#1f8a54" }, { t: "🚙", c: "#7a1f2b" }, null, { t: "S", c: "#b4760f" },
    null, null, { t: "🚐", c: "#3f7d5c" }, null,
  ];
  return (
    <div className={`mx-auto grid max-w-sm grid-cols-4 gap-3 ${fadeBottom}`}>
      {tiles.map((t, i) =>
        t ? (
          <span key={i} className="flex aspect-square items-center justify-center rounded-2xl border border-[#ececec] bg-white text-sm font-bold shadow-[0_6px_14px_-10px_rgba(0,0,0,0.35)]" style={{ color: t.c }}>
            {t.t}
          </span>
        ) : (
          <span key={i} className={`aspect-square rounded-2xl border border-[#f0f0f0] ${hatch}`} />
        )
      )}
    </div>
  );
}

function CateringFormMock() {
  return (
    <div className={`mx-auto w-full max-w-sm rounded-2xl border border-[#ececec] bg-white p-5 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.25)] ${fadeBottom}`}>
      <p className="text-[15px] font-semibold">Catering · Wedding &amp; Pheras</p>
      <div className="mt-4 rounded-xl bg-[#f7f7f7] px-4 py-3">
        <p className="text-xs text-[#8a8a8a]">Total plates</p>
        <p className="mt-1 border-b border-dashed border-[#bdbdbd] pb-1 text-3xl font-medium tracking-tight">41</p>
      </div>
      <div className="mt-3 rounded-xl bg-[#f7f7f7] px-4 py-3">
        <p className="text-xs text-[#8a8a8a]">Split</p>
        <div className="mt-2 flex gap-2 text-xs">
          <span className="rounded-lg bg-white px-2.5 py-1.5 font-medium">🟢 Veg 25</span>
          <span className="rounded-lg bg-white px-2.5 py-1.5 font-medium">🟡 Jain 3</span>
          <span className="rounded-lg bg-white px-2.5 py-1.5 font-medium">🔴 Non-veg 13</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#8a8a8a]">2 families yet to reply…</div>
    </div>
  );
}

function CabsMock() {
  const rows = [
    { id: "RPD-541", app: "Rapido", tone: "bg-[#fdf6d8] text-[#9a7a06]", product: "Cab Economy", price: "₹246", note: "Airport → Home · 6 min" },
    { id: "UBR-892", app: "Uber", tone: "bg-[#efefef] text-[#3a3a3a]", product: "Uber Go", price: "₹324", note: "Airport → Home · 8 min" },
  ];
  return (
    <div className={`mx-auto grid w-full max-w-sm gap-4 rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.25)] ${fadeBottom}`}>
      {rows.map((r) => (
        <div key={r.id}>
          <div className="mb-2 flex gap-1.5 text-[11px]">
            <span className="rounded-full bg-[#f3f3f3] px-2 py-0.5 font-medium text-[#5f5f5f]">{r.id}</span>
            <span className={`rounded-full px-2 py-0.5 font-medium ${r.tone}`}>{r.app}</span>
          </div>
          <div className="rounded-xl bg-[#f7f7f7] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-[15px] font-medium">
                <Car className="size-5 text-[#7a1f2b]" /> {r.product}
              </span>
              <span className="text-[15px] font-semibold">{r.price}</span>
            </div>
            <p className="mt-2 text-xs text-[#8a8a8a]">
              <span className="font-medium text-[#3a3a3a]">note :</span> {r.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- dark-section cards

function NimantranCard() {
  const rows = [
    ["Guest", "Sharma Uncle ji", "Function", "Sangeet"],
    ["Date", "11 Dec, 2026", "Time", "8:00 PM"],
    ["Venue", "Hyatt Regency, Lucknow", "People", "2 · Veg"],
  ];
  return (
    <div className="rounded-[1.75rem] bg-white p-4 text-[#161616] sm:p-6">
      <div className={`relative overflow-hidden rounded-2xl border border-[#ececec] ${hatch} p-6 sm:p-10`}>
        <img src="/welcome/peony.svg" alt="" loading="lazy" className="absolute -top-10 -right-10 size-40 opacity-90" />
        <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <HeartHandshake className="size-6 text-[#7a1f2b]" /> Shaadi OS
        </p>
        <div className="mt-8 flex items-end justify-between border-b border-dashed border-[#d9d9d9] pb-6">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">Invitation</p>
          <p className="text-lg text-[#9a9a9a] sm:text-2xl">#RA-0112</p>
        </div>
        {rows.map(([l1, v1, l2, v2], i) => (
          <div key={l1} className={`flex justify-between gap-4 py-5 sm:py-6 ${i < rows.length - 1 ? "border-b border-dashed border-[#d9d9d9]" : ""}`}>
            <div>
              <p className="text-sm text-[#9a9a9a] sm:text-lg">{l1}</p>
              <p className="text-lg font-semibold tracking-tight sm:text-2xl">{v1}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#9a9a9a] sm:text-lg">{l2}</p>
              <p className="text-lg font-semibold tracking-tight sm:text-2xl">{v2}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RsvpChartCard() {
  return (
    <div className="rounded-[1.75rem] bg-white p-4 text-[#161616] sm:p-6">
      <div className={`rounded-2xl border border-[#ececec] ${hatch} p-4 sm:p-8`}>
        <div className="rounded-2xl border border-[#ececec] bg-white p-6 sm:p-8">
          <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f3f3]">
            <Users className="size-6 text-[#7a1f2b]" />
          </span>
          <p className="mt-6 text-xl font-medium tracking-tight sm:text-2xl">Total guests (confirmed)</p>
          <p className="mt-1 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">186</p>
          <svg viewBox="0 0 400 160" className="mt-6 w-full" aria-hidden>
            <defs>
              <linearGradient id="rsvp-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1f8a54" stopOpacity="0.16" />
                <stop offset="1" stopColor="#1f8a54" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="20" x2="400" y2="20" stroke="#d9d9d9" strokeDasharray="6 6" />
            <line x1="0" y1="150" x2="400" y2="150" stroke="#d9d9d9" strokeDasharray="6 6" />
            <line x1="300" y1="20" x2="300" y2="150" stroke="#cfcfcf" strokeDasharray="4 5" />
            <path d="M140 150 C 220 135 250 95 300 55 S 370 22 400 18 V150 H140Z" fill="url(#rsvp-area)" />
            <path d="M140 150 C 220 135 250 95 300 55 S 370 22 400 18" fill="none" stroke="#1f8a54" strokeWidth="2.5" />
            <circle cx="300" cy="55" r="14" fill="#1f8a54" opacity="0.15" />
            <circle cx="300" cy="55" r="6" fill="#1f8a54" stroke="#fff" strokeWidth="2" />
          </svg>
          <p className="-mt-10 inline-flex items-center gap-2 text-sm text-[#1f8a54]">
            ↗ <span className="rounded-full bg-[#e8f6ee] px-3 py-1 font-semibold">+12 today</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckList({ items, dark = false }: { items: [string, string][]; dark?: boolean }) {
  return (
    <ul className="mt-7 grid gap-3">
      {items.map(([b, t]) => (
        <li key={b} className={`flex items-start gap-3 text-sm ${dark ? "text-white/80" : "text-[#3a3a3a]"}`}>
          <Check className="mt-0.5 size-4 shrink-0 text-[#4ade80]" />
          <span>
            <span className={dark ? "text-white" : "text-[#161616]"}>{b}</span> — {t}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- page

const RITUAL_MARKS = [
  { t: "Haldi", c: "font-[family-name:var(--font-cormorant)] italic text-2xl" },
  { t: "MEHENDI", c: "font-bold tracking-[0.2em] text-sm" },
  { t: "Sangeet", c: "font-semibold tracking-tight text-xl" },
  { t: "Saat Phere", c: "font-[family-name:var(--font-cormorant)] text-2xl font-semibold" },
  { t: "jaago", c: "font-bold italic text-xl lowercase" },
  { t: "BARAAT", c: "font-[family-name:var(--font-cormorant)] tracking-[0.3em] text-lg" },
  { t: "Anand Karaj", c: "font-medium text-lg" },
  { t: "Muhurtham", c: "font-[family-name:var(--font-cormorant)] italic text-2xl" },
  { t: "GAYE HOLUD", c: "font-semibold tracking-[0.15em] text-sm" },
  { t: "Reception", c: "font-bold tracking-tight text-xl" },
];

const CAPABILITIES = [
  { icon: MapPinned, title: "Live Control Room", text: "Every helper and car on the map, live. Location older than 5 minutes? Greyed out." },
  { icon: Zap, title: "Auto-assign", text: "The nearest free helper and a car with the right seats, in one tap." },
  { icon: Users, title: "Guests & RSVP", text: "A personal link for every family, showing only their functions." },
  { icon: UtensilsCrossed, title: "Catering count", text: "Plates for every function: veg, Jain, non-veg. Copy for the caterer in one tap." },
  { icon: Globe, title: "Invite builder", text: "Describe it in a chat, get a website. Five templates, every change saved." },
  { icon: BellRing, title: "Backup cabs", text: "Everyone busy? Compare Uber and Rapido rates, book, and the guest message is ready." },
];

const PRINCIPLES = [
  { icon: Zap, title: "2 second dispatch", text: "The pickup is ready the moment the train arrives." },
  { icon: ShieldCheck, title: "Location with permission", text: "Only on wedding days, and only when they say yes." },
  { icon: Languages, title: "English & हिंदी", text: "Speaks the way your family does." },
  { icon: ArrowRightLeft, title: "Declined? Next helper", text: "If someone says no, the next one gets it instantly." },
  { icon: Sparkles, title: "Cultural smarts", text: "Jaago for a Punjabi wedding, gaye holud for a Bengali one." },
  { icon: HeartHandshake, title: "The whole family", text: "From chacha to the cousins, everyone in one app." },
];

const PLANS = [
  {
    name: "Home wedding",
    sub: "A small function, your own people, full control.",
    price: "₹0",
    unit: "",
    cta: "Start the demo",
    href: "/early-access",
    feats: ["Control Room + live map", "Up to 50 guests", "1 invite template", "Rule-based invite builder"],
    featured: false,
  },
  {
    name: "Grand wedding",
    sub: "Three days, five functions, a hundred details.",
    price: "₹4,999",
    unit: "/wedding",
    cta: "Get started",
    href: "/early-access",
    feats: ["Everything in Home wedding", "Unlimited guests", "All five templates + AI builder", "Uber / Rapido backup", "Catering export"],
    featured: true,
  },
  {
    name: "Big fat wedding",
    sub: "Destination, 2000 guests, 3 cities.",
    price: "Let's talk",
    unit: "",
    cta: "Call us",
    href: "/early-access",
    feats: ["Everything in Grand wedding", "Multi-city fleet", "Dedicated wedding manager", "Custom integrations"],
    featured: false,
  },
];

export default function WelcomePage() {
  return (
    <div className={`${sans.variable} ${serif.variable} so-welcome min-h-screen overflow-x-hidden bg-white font-[family-name:var(--font-jakarta)] text-[#161616] antialiased`}>
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/welcome" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <HeartHandshake className="size-6 text-[#7a1f2b]" /> Shaadi OS
          </Link>
          <nav className="hidden gap-8 text-[13px] text-[#5f5f5f] md:flex">
            <a href="#features" className="hover:text-[#161616]">Features</a>
            <a href="#invite" className="hover:text-[#161616]">Invite</a>
            <a href="#plans" className="hover:text-[#161616]">Plans</a>
            <a href="#parivaar" className="hover:text-[#161616]">Family</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-lg px-2.5 py-2 text-[13px] font-semibold text-[#3a3a3a] hover:text-[#161616]">
              Log in
            </Link>
            <PillButton href="/login?mode=signup" className="px-4 py-2 text-[13px]">
              Sign up <ArrowRight className="size-3.5" />
            </PillButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        {/* Ledgerle-style tiled grid, fading out */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 [background-image:linear-gradient(#f1f1f1_1px,transparent_1px),linear-gradient(90deg,#f1f1f1_1px,transparent_1px)] [background-size:106px_106px] [mask-image:radial-gradient(ellipse_at_50%_35%,black_30%,transparent_75%)]"
        />
        <img src="/welcome/bouquet.svg" alt="" className="pointer-events-none absolute top-6 -left-24 -z-10 w-[200px] -scale-x-100 rotate-[200deg] sm:w-[260px] lg:left-0 lg:w-[300px]" />
        <img src="/welcome/bouquet.svg" alt="" className="pointer-events-none absolute top-24 -right-24 -z-10 hidden w-[280px] md:block lg:right-0 lg:w-[320px]" />

        <div className="mx-auto max-w-5xl px-5 pt-20 text-center sm:pt-28">
          <p className="so-rise mx-auto inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1 text-xs font-medium text-[#5f5f5f] shadow-sm">
            <span className="size-1.5 rounded-full bg-[#1f8a54]" /> Wedding season 2026 · Live from Lucknow
          </p>
          <h1 className="so-rise mt-7 text-[40px] leading-[1.04] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[70px]" style={{ animationDelay: "0.08s" }}>
            Fufa ki <Em>narazgi</Em> se accha,
            <br className="hidden sm:block" /> to Shaadi OS ko paisa dena hai.
          </h1>
          <p className="so-rise mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[#5f5f5f] sm:text-base" style={{ animationDelay: "0.18s" }}>
            Pickups, helpers, RSVPs, plates and the invite website. For families who never want a guest left waiting at the station.
          </p>
          <div className="so-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.28s" }}>
            <PillButton href="/">
              See the demo <ArrowRight className="size-4" />
            </PillButton>
            <PillButton href="/website" light className="py-3">
              Make an invite
            </PillButton>
          </div>
        </div>

        {/* Floating UI cards */}
        <div className="so-rise relative mx-auto mt-16 max-w-xl px-5" style={{ animationDelay: "0.38s" }}>
          <div className="absolute -top-8 right-2 z-10 rounded-2xl border border-[#ececec] bg-white px-5 py-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:-right-10">
            <p className="text-xs text-[#5f5f5f]">Today’s pickups</p>
            <p className="text-2xl font-semibold tracking-tight">12 / 14</p>
          </div>
          <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-semibold">On the road now</p>
            {[
              ["RB", "Rohit Bhaiya", "Bua ji · Charbagh → Home", true, "#7a1f2b"],
              ["R", "Ramesh", "Sharma Uncle · Airport → Home", false, "#c9822b"],
              ["P", "Pinku", "Mithai · Chappan Bhog", true, "#3f7d5c"],
            ].map(([i, n, t, on, c], k) => (
              <div key={n as string} className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 ${k !== 1 ? "bg-[#f7f7f7]" : ""}`}>
                <span className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: c as string }}>
                  {i}
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-medium">{n}</span>
                  <span className="text-xs text-[#8a8a8a]">{t}</span>
                </span>
                <span className={`flex h-5 w-9 items-center rounded-full p-0.5 ${on ? "justify-end bg-[#161616]" : "bg-[#e5e5e5]"}`}>
                  <span className="size-4 rounded-full bg-white" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Painted scene fading in from white */}
        <img src="/welcome/mandap.svg" alt="" fetchPriority="low" className="-mt-24 block object-cover h-[380px] w-full sm:h-[520px] lg:h-[640px]" />
      </section>

      {/* Bento */}
      <section id="features" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={
              <>
                Everything to run a wedding,
                <br /> <Em>in one place</Em>
              </>
            }
            sub="From the station to the pandal: every pickup, every guest and every plate, crystal clear."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {[
              { lead: "Auto-assign pickups", rest: "the nearest helper and the right car, with live tracking.", mock: <PickupsMock /> },
              { lead: "The whole family", rest: "helpers and cars in one network, location only with permission.", mock: <HelpersGridMock /> },
              { lead: "RSVPs to plates", rest: "the catering count updates itself with every reply.", mock: <CateringFormMock /> },
              { lead: "Backup cabs", rest: "if everyone is busy, the best Uber and Rapido rate, instantly.", mock: <CabsMock /> },
            ].map((b) => (
              <div key={b.lead} className="flex h-[440px] flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-[#fcfcfc] px-6 pt-7 sm:px-10">
                <p className="mx-auto max-w-sm text-center text-[14px] leading-relaxed text-[#5f5f5f]">
                  <span className="font-semibold text-[#161616]">{b.lead}</span> {b.rest}
                </p>
                <div className="mt-7 flex-1">{b.mock}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ritual marquee (logo strip) */}
      <section className="overflow-hidden py-6" aria-label="Rituals">
        <div className="so-marquee flex w-max items-center gap-16 text-[#4a4a4a]">
          {[...RITUAL_MARKS, ...RITUAL_MARKS].map((r, i) => (
            <span key={i} className={`flex items-center gap-2 whitespace-nowrap ${r.c}`}>
              <Sparkles className="size-4 text-[#c9a227]" /> {r.t}
            </span>
          ))}
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={
              <>
                See everything
                <br /> Shaadi OS <Em>handles</Em>
              </>
            }
            sub="Every department of the wedding, without a single Excel sheet."
          />
          <div className="mt-14 grid overflow-hidden rounded-2xl border border-[#ececec] sm:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <div key={c.title} className={`p-8 sm:p-10 ${i % 2 ? "sm:border-l" : ""} ${i > 0 ? "border-t" : ""} ${i === 1 ? "sm:border-t-0" : ""} border-[#ececec]`}>
                <span className="flex size-12 items-center justify-center rounded-xl border border-[#ececec] bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.04),0_6px_14px_-10px_rgba(0,0,0,0.35)]">
                  <c.icon className="size-5 text-[#3a3a3a]" />
                </span>
                <p className="mt-6 text-[17px] font-semibold tracking-tight">{c.title}</p>
                <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-[#5f5f5f]">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark product sections */}
      <section id="invite" className="bg-[#1b1b1b] px-5 py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <NimantranCard />
            <div>
              <h3 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl">
                Make an invite, <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#f0b36a] italic">just by asking</em>
              </h3>
              <p className="mt-4 max-w-md text-[15px] text-white/60">“Punjabi wedding, 20 Jan, Amritsar.” That’s it. The website builds itself.</p>
              <CheckList
                dark
                items={[
                  ["Say it, see it", "rituals, venue, dress code and welcome message, ready."],
                  ["A link for every guest", "only their functions, with their name on it."],
                  ["Every change saved", "bring back any old version in one tap."],
                ]}
              />
              <PillButton href="/website" light className="mt-9">
                Open the invite builder
              </PillButton>
            </div>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <RsvpChartCard />
            <div>
              <h3 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl">
                Every RSVP, every <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#f0b36a] italic">plate</em>, live
              </h3>
              <p className="mt-4 max-w-md text-[15px] text-white/60">A guest said yes? The caterer’s list changes that same second.</p>
              <CheckList
                dark
                items={[
                  ["Real-time count", "separate for every function."],
                  ["Veg / Jain / Non-veg", "nobody gets the wrong plate."],
                  ["Arrivals → pickups", "enter the train time and the pickup task is ready."],
                ]}
              />
              <PillButton href="/guests" light className="mt-9">
                See guests
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHead
            title={
              <>
                Built for families,
                <br /> <Em>ready</Em> for the wedding
              </>
            }
            sub="Easy to start, and ready for even the biggest baraat."
          />
          <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="text-center">
                <p.icon className="mx-auto size-6 text-[#3a3a3a]" strokeWidth={1.6} />
                <p className="mt-4 text-[15px] font-semibold">{p.title}</p>
                <p className="mx-auto mt-1.5 max-w-[220px] text-[14px] text-[#5f5f5f]">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <PillButton href="/early-access">Start today</PillButton>
          </div>
        </div>
      </section>

      {/* Fufa ji on paper florals */}
      <section id="parivaar" className="relative overflow-hidden bg-[#1b1b1b] px-5 py-24 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl">
              Your wedding buddy that <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#f0b36a] italic">handles it all</em>.
            </h2>
            <figure className="mt-10 border-l-2 border-[#f0b36a]/60 pl-6">
              <blockquote className="font-[family-name:var(--font-cormorant)] text-2xl leading-snug text-white/90 italic sm:text-3xl">
                “Pichli shaadi mein do ghante station pe khada raha. Is baar Rohit chaar minute mein aa gaya. Ab main naraz kaise hoon?”
              </blockquote>
              <figcaption className="mt-4 text-sm text-white/50">Fufa ji, Varanasi · professional narazgi expert</figcaption>
            </figure>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <img src="/welcome/paper.svg" alt="" loading="lazy" className="w-full opacity-90" />
            <img
              src="/welcome/fufa.png"
              alt="Fufa ji sitting on a chair, arms crossed, looking unimpressed"
              loading="lazy"
              width={434}
              height={643}
              className="absolute bottom-[-4%] left-1/2 w-[52%] -translate-x-1/2 drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]"
            />
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={
              <>
                A <Em>plan</Em> for every wedding
              </>
            }
            sub="From small functions to big fat weddings. Cheaper than winning Fufa ji over, guaranteed."
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`rounded-2xl border p-2 ${p.featured ? "border-[#161616]" : "border-[#ececec]"}`}>
                <div className={`rounded-xl p-6 ${p.featured ? hatch + " bg-[#f7f7f7]" : "bg-[#f7f7f7]"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[17px] font-semibold">{p.name}</p>
                    {p.featured && <span className="rounded-full bg-[#7a1f2b] px-2.5 py-0.5 text-[11px] font-semibold text-white">Most popular</span>}
                  </div>
                  <p className="mt-1.5 text-[14px] text-[#5f5f5f]">{p.sub}</p>
                  <p className="mt-6 text-4xl font-semibold tracking-[-0.04em]">
                    {p.price}
                    <span className="text-sm font-normal tracking-normal text-[#5f5f5f]">{p.unit}</span>
                  </p>
                  <Link href={p.href} className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#161616] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#7a1f2b]">
                    {p.cta}
                  </Link>
                </div>
                <div className="px-4 py-5">
                  <p className="text-[13px] text-[#8a8a8a]">Includes :</p>
                  <ul className="mt-3 grid gap-2.5">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-[14px] font-medium">
                        <Check className="size-4 text-[#1f8a54]" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#1b1b1b] px-5 py-24 text-white">
        <div className="mx-auto max-w-6xl">
          <SectionHead dark title={<>What the family said</>} sub="Real relatives, made-up names. The stories will sound just like your family." />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-[#161616]">
              <p className="text-6xl font-semibold tracking-[-0.04em]">4.9</p>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-6 fill-[#f5a524] text-[#f5a524]" />
                ))}
              </div>
              <p className="mt-3 text-sm text-[#5f5f5f]">Average rating from the aunties</p>
            </div>
            {[
              ["Pinky Didi", "Bride's cousin", "“For the first time at any wedding, the catering count was right. Even the halwai was shocked.”"],
              ["Rohit Bhaiya", "Helper no. 1", "“My phone gets just one card: Accept or Decline. No 40 missed calls, no ‘where are you?’.”"],
            ].map(([n, r, q]) => (
              <div key={n} className="rounded-2xl bg-white p-8 text-[#161616]">
                <p className="text-sm text-[#5f5f5f]">
                  {n} · {r}
                </p>
                <p className="mt-5 text-xl leading-snug font-medium tracking-tight">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Painted CTA */}
      <section className="bg-[#1b1b1b] px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="relative overflow-hidden rounded-2xl">
          <img src="/welcome/mandap-cta.svg" alt="" loading="lazy" className="block object-cover h-[460px] w-full sm:h-[560px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,8,10,0.62),rgba(20,8,10,0.25)_70%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
            <h2 className="max-w-3xl text-[34px] leading-[1.06] font-semibold tracking-[-0.035em] text-balance text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-6xl">
              Let Shaadi OS handle the pickups. You focus on the pheras.
            </h2>
            <PillButton href="/" className="mt-8">
              See the demo, totally free <ArrowRight className="size-4" />
            </PillButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1b1b1b] px-5 pt-14 pb-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold">
                <HeartHandshake className="size-6 text-[#f0b36a]" /> Shaadi OS
              </p>
              <p className="mt-3 max-w-xs text-sm text-white/60">The wedding command center: pickups, guests, plates and invites, in one place.</p>
            </div>
            <div>
              <p className="text-sm text-white/50">App</p>
              <ul className="mt-4 grid gap-2.5 text-sm">
                <li><Link href="/" className="hover:text-[#f0b36a]">Control Room</Link></li>
                <li><Link href="/tasks" className="hover:text-[#f0b36a]">Tasks</Link></li>
                <li><Link href="/guests" className="hover:text-[#f0b36a]">Guests</Link></li>
                <li><Link href="/website" className="hover:text-[#f0b36a]">Invite builder</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-white/50">More</p>
              <ul className="mt-4 grid gap-2.5 text-sm">
                <li><Link href="/settings" className="hover:text-[#f0b36a]">Settings</Link></li>
                <li><Link href="/invite/g01" className="hover:text-[#f0b36a]">Sample invite</Link></li>
                <li><a href="#plans" className="hover:text-[#f0b36a]">Plans</a></li>
              </ul>
            </div>
          </div>
          <p className="mt-14 border-t border-white/10 pt-6 text-center text-xs text-white/40">© 2026 Shaadi OS · Made for Indian weddings 🙏</p>
        </div>
      </footer>
    </div>
  );
}

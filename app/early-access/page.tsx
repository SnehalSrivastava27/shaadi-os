import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { ArrowLeft, ArrowRight } from "lucide-react";
import portrait from "@/public/welcome/piyush.png";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-jakarta" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500"], style: ["italic"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "Shaadi OS: Piyush Sir's wedding comes first",
  description: "Shaadi OS gets its first real test at Piyush Sir's wedding. After that, it's your turn.",
};

export default function EarlyAccessPage() {
  return (
    <main
      className={`${sans.variable} ${serif.variable} so-welcome relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-5 py-16 text-center font-[family-name:var(--font-jakarta)] text-[#161616]`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background-image:linear-gradient(#f1f1f1_1px,transparent_1px),linear-gradient(90deg,#f1f1f1_1px,transparent_1px)] [background-size:106px_106px] [mask-image:radial-gradient(ellipse_at_50%_40%,black_30%,transparent_75%)]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG art */}
      <img src="/welcome/bouquet.svg" alt="" className="pointer-events-none absolute top-0 -left-24 -z-10 w-[220px] -scale-x-100 rotate-[200deg] sm:left-0 sm:w-[280px]" />

      <Link href="/welcome" className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[13px] backdrop-blur text-[#5f5f5f] hover:text-[#161616]">
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <div className="so-rise relative">
        <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-[#fbe3d6] blur-2xl" />
        <Image src={portrait} alt="Piyush Garg" priority className="size-44 rounded-full border-4 border-white bg-white object-cover shadow-[0_24px_50px_-28px_rgba(0,0,0,0.5)] sm:size-56" />
      </div>

      <p className="so-rise mt-8 inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1 text-xs font-medium text-[#5f5f5f] shadow-sm" style={{ animationDelay: "0.08s" }}>
        <span className="size-1.5 rounded-full bg-[#c9a227]" /> Early access · Founding wedding
      </p>

      <h1 className="so-rise mt-6 max-w-2xl text-[38px] leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl" style={{ animationDelay: "0.16s" }}>
        Pehle <em className="font-[family-name:var(--font-cormorant)] font-medium text-[#7a1f2b] italic">Piyush Sir</em> ki shaadi mein use hoga, fir aapko milega.
      </h1>

      <p className="so-rise mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#5f5f5f]" style={{ animationDelay: "0.24s" }}>
        Every pickup, every guest and every plate gets its real test there. If it passes, the next muhurat is yours.
      </p>

      <Link
        href="/?tour=1"
        className="so-rise mt-9 inline-flex items-center gap-2 rounded-xl border border-black bg-[#262626] px-7 py-3.5 text-[15px] font-bold tracking-wide text-white shadow-[inset_0_1.5px_0_rgba(255,255,255,0.22),inset_0_-3px_0_rgba(0,0,0,0.55),0_18px_30px_-12px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:bg-[#1a1a1a]"
        style={{ animationDelay: "0.32s" }}
      >
        DEMO DEKHE <ArrowRight className="size-4" />
      </Link>
    </main>
  );
}

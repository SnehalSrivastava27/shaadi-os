import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { LoginForm } from "./LoginForm";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500"], style: ["italic"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "Sign in · Shaadi OS",
  description: "Sign in to your wedding command center, or try it with a demo account.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next, mode } = await searchParams;
  return (
    <main
      className={`${sans.variable} ${serif.variable} relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 font-[family-name:var(--font-jakarta)] text-[#161616]`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background-image:linear-gradient(#f1f1f1_1px,transparent_1px),linear-gradient(90deg,#f1f1f1_1px,transparent_1px)] [background-size:106px_106px] [mask-image:radial-gradient(ellipse_at_50%_40%,black_30%,transparent_75%)]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG art */}
      <img src="/welcome/bouquet.svg" alt="" className="pointer-events-none absolute top-0 -left-24 -z-10 w-[220px] -scale-x-100 rotate-[200deg] sm:left-0 sm:w-[280px]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG art */}
      <img src="/welcome/bouquet.svg" alt="" className="pointer-events-none absolute -right-24 bottom-0 -z-10 hidden w-[260px] rotate-[20deg] md:block lg:right-0" />
      <LoginForm initialMode={mode === "signup" ? "up" : "in"} next={next?.startsWith("/") && !next.startsWith("//") ? next : "/"} />
    </main>
  );
}

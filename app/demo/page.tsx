import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shaadi OS: 2-minute demo",
  description: "The wedding WhatsApp group, but it actually gets things done. Sarvam AI + Flagsmith + NudgeBee.",
  openGraph: { title: "Shaadi OS: 2-minute demo", images: ["/demo/poster.jpg"], type: "video.other", videos: ["/demo/shaadi-os-demo.mp4"] },
};

/** Public demo video page (no sign-in). */
export default function DemoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#fff8ec] px-4 py-10">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-[#7A1F2B] sm:text-4xl">Shaadi OS 🪔</h1>
        <p className="mt-2 text-sm text-[#5f5f5f] sm:text-base">The wedding WhatsApp group, but it actually gets things done.</p>
      </div>
      <video
        src="/demo/shaadi-os-demo.mp4"
        poster="/demo/poster.jpg"
        controls
        playsInline
        preload="metadata"
        className="w-full max-w-4xl rounded-2xl border border-[#ecd9c0] bg-black shadow-xl"
      />
      <p className="text-xs text-[#7a6a5a]">Built with Sarvam AI · Flagsmith · NudgeBee · WeMakeDevs Festive Hacks</p>
      <div className="flex gap-3 text-sm">
        <Link href="/welcome" className="rounded-full bg-[#7A1F2B] px-5 py-2 font-medium text-white">
          See the product
        </Link>
        <a href="/demo/shaadi-os-demo.mp4" download className="rounded-full border border-[#7A1F2B] px-5 py-2 font-medium text-[#7A1F2B]">
          Download video
        </a>
      </div>
    </main>
  );
}

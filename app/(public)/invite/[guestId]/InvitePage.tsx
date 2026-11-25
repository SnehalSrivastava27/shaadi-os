"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { InviteRenderer } from "@/components/invite/InviteRenderer";
import { FinalRsvp } from "@/components/invite/FinalRsvp";
import { functionsForGuest } from "@/lib/invite/guestFunctions";
import type { Lang } from "@/lib/invite/i18n";

export function InvitePage({ guestId }: { guestId: string }) {
  const config = useShaadiStore((s) => s.publishedConfig);
  const guest = useShaadiStore((s) => s.guests.find((g) => g.id === guestId));
  const [lang, setLang] = useState<Lang>("en");

  if (!guest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-heading text-primary text-2xl">This invite link isn&apos;t valid 🙏</p>
        <p className="text-muted-foreground text-sm">Please ask the family for a new link.</p>
      </div>
    );
  }
  if (!config.published) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-heading text-primary text-2xl">Invite coming soon ✨</p>
        <p className="text-muted-foreground text-sm">The website hasn&apos;t been published yet.</p>
      </div>
    );
  }

  const functions = functionsForGuest(config, guest);
  return (
    <div className="relative min-h-screen" style={{ background: config.palette.background }}>
      <button
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-full border bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur"
        style={{ color: config.palette.primary }}
        aria-label="Toggle language"
      >
        <Languages className="size-4" /> {lang === "en" ? "हिंदी" : "English"}
      </button>
      <InviteRenderer
        config={config}
        functions={functions}
        lang={lang}
        guestName={guest.name}
        renderRsvp={() => (
          <FinalRsvp
            key={lang}
            guest={guest}
            lang={lang}
            color={config.palette.primary}
            defaultTime={`${[...functions].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? "2026-12-10"}T09:00`}
          />
        )}
      />
      <footer className="pb-8 text-center text-xs opacity-60" style={{ color: config.palette.primary }}>
        Made with ❤️ on Shaadi OS
      </footer>
    </div>
  );
}

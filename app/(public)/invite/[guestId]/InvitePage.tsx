"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Languages } from "lucide-react";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { InviteRenderer } from "@/components/invite/InviteRenderer";
import { FinalRsvp } from "@/components/invite/FinalRsvp";
import { functionsForGuest } from "@/lib/invite/guestFunctions";
import type { Lang } from "@/lib/invite/i18n";
import { useTranslatePage } from "@/components/invite/useTranslatePage";

const onTranslateError = (msg: string) => toast.error(msg);

export function InvitePage({ guestId }: { guestId: string }) {
  const config = useShaadiStore((s) => s.publishedConfig);
  const guest = useShaadiStore((s) => s.guests.find((g) => g.id === guestId));
  const [lang, setLang] = useState<Lang>("en");
  // Sarvam: any of 22 Indian languages (Flagsmith "invite_translation" can switch it off).
  const [target, setTarget] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/api/translate")
      .then((r) => r.json())
      .then((d) => setLanguages(d.languages ?? {}))
      .catch(() => {});
  }, []);
  useTranslatePage(pageRef, target, onTranslateError);

  if (!guest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-heading text-primary text-2xl">
          This invite link isn&apos;t valid 🙏
        </p>
        <p className="text-muted-foreground text-sm">
          Please ask the family for a new link.
        </p>
      </div>
    );
  }
  if (!config.published) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-heading text-primary text-2xl">
          Invite coming soon ✨
        </p>
        <p className="text-muted-foreground text-sm">
          The website hasn&apos;t been published yet.
        </p>
      </div>
    );
  }

  const functions = functionsForGuest(config, guest);
  return (
    <div
      className="relative min-h-screen"
      style={{ background: config.palette.background }}
    >
      <label
        className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-full border bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur"
        style={{ color: config.palette.primary }}
      >
        <Languages className="size-4" aria-hidden />
        <span className="sr-only">Language</span>
        <select
          value={target ?? lang}
          onChange={(e) => {
            const v = e.target.value;
            setLang(v === "hi" ? "hi" : "en");
            setTarget(v === "en" || v === "hi" ? null : v);
          }}
          className="cursor-pointer bg-transparent outline-none"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          {Object.entries(languages)
            .filter(([code]) => code !== "hi-IN")
            .map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
        </select>
      </label>
      <div ref={pageRef} key={target ?? lang}>
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
      </div>
      <footer
        className="pb-8 text-center text-xs opacity-60"
        style={{ color: config.palette.primary }}
      >
        Made with ❤️ on Shaadi OS
      </footer>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "so-tour-seen";

const STEPS: { target?: string; title: string; text: string }[] = [
  { title: "Swagat hai! 🙏", text: "Ek minute mein samjhiye Shaadi OS kaise kaam karta hai. Aage dabaate jaiye." },
  { target: "summary", title: "Ek nazar mein", text: "Kitne helpers free hain, kitni gaadiyan free hain aur kitne pickups baaki hain." },
  { target: "map", title: "Lucknow ka live naqsha", text: "Har helper, gaadi aur venue yahan dikhta hai. Grey matlab 5 minute se location nahi aayi. Kisi pe bhi click karke details dekhiye." },
  { target: "tasks", title: "Naya kaam, ek tap mein", text: "\"New task\" dabaiye, pickup aur drop chuniye. \"Auto-assign\" sabse paas wale free helper aur sahi seats wali gaadi ko bhej deta hai." },
  { target: "helpers", title: "Aapki team", text: "Chacha ji se cousin tak, sab helpers yahan. Koi free nahi? Uber ya Rapido ka rate dekh ke booking ho jaati hai." },
  { target: "nav", title: "Baaki sab yahan", text: "Tasks ki poori list, Guests (RSVP aur plates ki ginti), Website (invite builder) aur Settings (WhatsApp connect)." },
  { target: "demo", title: "Ab khud dekhiye", text: "Demo dabaiye: Bua ji ka pickup shuru se aakhir tak apne aap chalega." },
];

type Rect = { top: number; left: number; width: number; height: number };

function visibleRect(target?: string): Rect | null {
  const el = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width && r.height ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
}

/** First-visit spotlight tour of the Control Room. Also opens with `?tour=1`. */
export function Tour() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    // Defer so the open happens after mount, not during the effect body.
    const id = setTimeout(() => {
      if (params.get("tour") === "1" || !seen) setStep(0);
    }, 0);
    return () => clearTimeout(id);
  }, [params]);

  const close = useCallback(() => {
    setStep(null);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    if (params.get("tour")) router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);

  const current = step === null ? null : STEPS[step];

  useLayoutEffect(() => {
    if (!current) return;
    const el = current.target && document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => setRect(visibleRect(current.target));
    measure();
    const t = setTimeout(measure, 400); // after smooth scroll settles
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setStep((s) => (s !== null && s < STEPS.length - 1 ? s + 1 : s));
      if (e.key === "ArrowLeft") setStep((s) => (s ? s - 1 : s));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close]);

  if (step === null || !current) return null;
  const last = step === STEPS.length - 1;
  const pad = 8;
  const below = rect ? rect.top + rect.height + 220 < window.innerHeight : true;

  const finish = () => {
    close();
    document.querySelector<HTMLButtonElement>('[data-tour="demo"] button')?.click();
  };

  return (
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-[#F4A300] transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(20,8,10,0.6)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(20,8,10,0.6)]" />
      )}
      <div
        className="fixed inset-x-3 bottom-3 mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-2xl md:inset-x-auto md:bottom-auto"
        style={
          rect && window.innerWidth >= 768
            ? { left: Math.min(Math.max(rect.left, 16), window.innerWidth - 400), top: below ? rect.top + rect.height + pad + 12 : Math.max(16, rect.top - pad - 12 - 200) }
            : rect
              ? undefined
              : { top: "50%", transform: "translateY(-50%)", bottom: "auto" }
        }
      >
        <p className="text-muted-foreground text-xs">
          {step + 1} / {STEPS.length}
        </p>
        <p id="tour-title" className="font-heading text-primary mt-1 text-lg font-bold">
          {current.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">{current.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={last ? finish : () => setStep(step + 1)}>
              {last ? "Demo chalao ▶" : "Aage"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

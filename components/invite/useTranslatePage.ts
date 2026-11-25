"use client";

import { useEffect, type RefObject } from "react";

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE"]);

/**
 * Translates every visible text node inside `ref` into `target` with Sarvam (via /api/translate), like a
 * browser translator, so all invite templates get 22 languages without per-template strings.
 * Keeps translating text React renders later (RSVP steps). Remount the subtree to go back to English.
 */
export function useTranslatePage(ref: RefObject<HTMLElement | null>, target: string | null, onError?: (msg: string) => void) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !target) return;
    const cache = new Map<string, string>();
    const ours = new Set<string>(); // values we wrote, never re-translated
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const nodes = () => {
      const list: Text[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          SKIP.has(n.parentElement?.tagName ?? "") || !/\p{L}/u.test(n.nodeValue ?? "") || ours.has(n.nodeValue!.trim()) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      while (walker.nextNode()) list.push(walker.currentNode as Text);
      return list;
    };

    const apply = (list: Text[]) => {
      for (const n of list) {
        const src = n.nodeValue!.trim();
        const t = cache.get(src);
        if (!t || t === src) continue;
        ours.add(t);
        n.nodeValue = n.nodeValue!.replace(src, t);
      }
    };

    const run = async () => {
      const list = nodes();
      const missing = [...new Set(list.map((n) => n.nodeValue!.trim()).filter((t) => t.length <= 500 && !cache.has(t)))];
      for (let i = 0; i < missing.length && !stopped; i += 150) {
        const batch = missing.slice(i, i + 150);
        const res = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target, texts: batch }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return onError?.(data.error ?? "Translation failed");
        batch.forEach((t, j) => cache.set(t, data.translations[j]));
      }
      if (!stopped) apply(nodes());
    };

    run();
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(run, 300);
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      stopped = true;
      clearTimeout(timer);
      obs.disconnect();
    };
  }, [ref, target, onError]);
}

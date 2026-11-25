"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Story photos live outside the main store so the 50 saved invite versions don't each copy them.
// ponytail: localStorage only (same-browser demo); move to object storage when invites go online.

const BUDGET = 3_500_000; // chars of data-URL, leaves room for the rest of the app in a ~5 MB localStorage

type State = { photos: Record<string, string>; add(dataUrl: string): string; remove(id: string): void };

export const useStoryPhotos = create<State>()(
  persist(
    (set, get) => ({
      photos: {},
      add(dataUrl) {
        const used = Object.values(get().photos).reduce((n, p) => n + p.length, 0);
        if (used + dataUrl.length > BUDGET) throw new Error("Photo storage is full. Remove a photo first.");
        const id = `ph-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ photos: { ...s.photos, [id]: dataUrl } }));
        return id;
      },
      remove(id) {
        set((s) => {
          const photos = { ...s.photos };
          delete photos[id];
          return { photos };
        });
      },
    }),
    { name: "shaadi-os-photos", storage: createJSONStorage(() => localStorage) },
  ),
);

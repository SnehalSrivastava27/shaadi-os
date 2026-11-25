"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useShaadiStore } from "@/stores/useShaadiStore";

/**
 * Loads the persisted demo state from localStorage after mount and keeps tabs
 * in sync. Children render only on the client after hydration, which avoids
 * any server/client mismatch from time-based data (last seen, live positions).
 */
export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const hydrated = useShaadiStore((s) => s.hydrated);

  useEffect(() => {
    const unsub = useShaadiStore.persist.onFinishHydration(() => useShaadiStore.getState().setHydrated());
    Promise.resolve(useShaadiStore.persist.rehydrate()).finally(() => useShaadiStore.getState().setHydrated());
    const onStorage = (e: StorageEvent) => {
      if (e.key === useShaadiStore.persist.getOptions().name) useShaadiStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="font-heading text-lg text-primary">Shaadi OS khul raha hai…</p>
      </div>
    );
  }
  return <>{children}</>;
}

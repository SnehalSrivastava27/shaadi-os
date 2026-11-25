"use client";

import { useRef } from "react";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { PLACES } from "@/lib/seed";
import { latestPosition } from "@/lib/data";
import { guestMessage } from "@/lib/messages";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Floating "Demo" button + bottom captions. Runs a scripted dispatch story. */
export function DemoRunner() {
  const demo = useShaadiStore((s) => s.demo);
  const cancelled = useRef(false);

  const run = async () => {
    const s = () => useShaadiStore.getState();
    cancelled.current = false;
    const caption = (text: string) => s().setDemo({ running: true, caption: text });
    const step = async (ms: number) => {
      await sleep(ms);
      if (cancelled.current) throw new Error("cancelled");
    };

    try {
      caption("Demo shuru! Fresh shaadi data load kar rahe hain…");
      s().resetDemo({ forDemo: true });
      await step(1500);

      // 1. Create the task
      caption("1/4 · Bua ji 3 log ke saath Lucknow Mail se Charbagh pahunch rahi hain. Task banate hain…");
      const taskId = s().createTask({
        title: "Bua ji ko Charbagh station se laana hai",
        type: "pickup",
        pickup: { label: PLACES.charbagh.label, lat: PLACES.charbagh.lat, lng: PLACES.charbagh.lng },
        drop: { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
        time: "2026-12-10T15:00:00+05:30",
        peopleCount: 3,
        guestId: "g01",
      });
      s().setFocus(PLACES.charbagh.lat, PLACES.charbagh.lng, 13);
      await step(2800);

      // 2. Auto-assign
      const r = s().dispatchTask(taskId, { silentFallback: true });
      if (!r?.ok) throw new Error("Auto-assign failed");
      caption(
        `2/4 · Auto-assign: sabse paas free helper ${r.helper.name} (${r.distanceKm.toFixed(1)} km), aur unki ${r.vehicle?.name ?? "gaadi"} (${r.vehicle?.seats} seats). Offer bheja!`
      );
      await step(3000);

      // 3. Auto-accept and drive
      s().acceptTask(taskId);
      s().setMessagePreview(null);
      const t = s().tasks.find((x) => x.id === taskId)!;
      const msg = guestMessage(
        t,
        s().guests.find((g) => g.id === t.guestId),
        s().helpers.find((h) => h.id === t.assignedHelperId),
        s().vehicles.find((v) => v.id === t.assignedVehicleId)
      );
      caption(`3/4 · ${r.helper.name} ne accept kiya! Guest ko message: "${msg}"`);
      await step(3500);
      let lastLeg = -1;
      for (;;) {
        const task = s().tasks.find((x) => x.id === taskId);
        if (!task || task.status !== "in_progress") break;
        const p = latestPosition(s().positions, r.helper.id);
        if (p) s().setFocus(p.lat, p.lng, 13);
        if (task.sim && task.sim.leg !== lastLeg) {
          lastLeg = task.sim.leg;
          caption(
            lastLeg === 0
              ? `3/4 · ${r.helper.name} Charbagh station ki taraf… (trail map par dekhiye)`
              : `3/4 · Bua ji gaadi mein baith gayi! Ab Ghar ki taraf 🚗`
          );
        }
        await step(2000);
      }
      caption("3/4 · Bua ji Ghar pahunch gayi! Task complete ✅");
      await step(2500);

      // 4. Everyone busy -> fallback
      caption("4/4 · Ab maan lijiye sab helpers busy hain… aur Mausi ji Airport pe utar gayi hain.");
      // Finish any other running errand first so nobody frees up mid-step.
      s()
        .tasks.filter((x) => x.status === "in_progress")
        .forEach((x) => s().completeTask(x.id, "Demo"));
      s().setAllHelpersBusy();
      const t2 = s().createTask({
        title: "Mausi ji ko Airport se laana hai",
        type: "pickup",
        pickup: { label: PLACES.airport.label, lat: PLACES.airport.lat, lng: PLACES.airport.lng },
        drop: { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
        time: "2026-12-10T11:00:00+05:30",
        peopleCount: 2,
        guestId: "g04",
      });
      s().setFocus(PLACES.airport.lat, PLACES.airport.lng, 12);
      await step(2500);
      s().dispatchTask(t2);
      caption("Koi free nahi! Uber ya Rapido se book kijiye 👆 (Settings mein 'Reset demo data' se sab wapas)");
      await sleep(7000);
      s().setDemo({ running: false, caption: null });
    } catch (e) {
      s().setDemo({ running: false, caption: null });
      if (e instanceof Error && e.message !== "cancelled") toast.error(`Demo ruk gaya: ${e.message}`);
    }
  };

  const stop = () => {
    cancelled.current = true;
    useShaadiStore.getState().setDemo({ running: false, caption: null });
    toast("Demo band kiya");
  };

  return (
    <>
      <div data-tour="demo" className="fixed right-4 bottom-24 z-[950] md:right-6 md:bottom-6">
        {demo.running ? (
          <Button size="lg" variant="destructive" className="rounded-full shadow-lg" onClick={stop}>
            <Square /> Stop demo
          </Button>
        ) : (
          <Button size="lg" variant="accent" className="rounded-full shadow-lg ring-4 ring-accent/30" onClick={run}>
            <Play /> Demo
          </Button>
        )}
      </div>
      {demo.caption && (
        <div className="pointer-events-none fixed inset-x-0 bottom-40 z-[940] flex justify-center px-4 md:bottom-24 md:pl-60">
          <div className="max-w-2xl rounded-xl border border-gold/60 bg-[#2b1416]/90 px-4 py-3 text-center text-sm text-[#FFF1D6] shadow-xl backdrop-blur">
            {demo.caption}
          </div>
        </div>
      )}
    </>
  );
}

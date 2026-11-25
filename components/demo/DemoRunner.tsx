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
      caption("Demo starting! Loading fresh wedding data…");
      s().resetDemo({ forDemo: true });
      await step(1500);

      // 1. Create the task
      caption("1/4 · Bua ji and family (3 people) are arriving at Charbagh on the Lucknow Mail. Let's create a task…");
      const taskId = s().createTask({
        title: "Pick up Bua ji from Charbagh station",
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
        `2/4 · Auto-assign: nearest free helper ${r.helper.name} (${r.distanceKm.toFixed(1)} km), with the ${r.vehicle?.name ?? "car"} (${r.vehicle?.seats} seats). Offer sent!`
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
      caption(`3/4 · ${r.helper.name} accepted! Message to the guest: "${msg}"`);
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
              ? `3/4 · ${r.helper.name} is heading to Charbagh station… (watch the trail on the map)`
              : `3/4 · Bua ji is in the car! Now heading home 🚗`
          );
        }
        await step(2000);
      }
      caption("3/4 · Bua ji has reached home! Task complete ✅");
      await step(2500);

      // 4. Everyone busy -> fallback
      caption("4/4 · Now suppose every helper is busy… and Mausi ji has just landed at the airport.");
      // Finish any other running errand first so nobody frees up mid-step.
      s()
        .tasks.filter((x) => x.status === "in_progress")
        .forEach((x) => s().completeTask(x.id, "Demo"));
      s().setAllHelpersBusy();
      const t2 = s().createTask({
        title: "Pick up Mausi ji from the airport",
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
      caption("Nobody is free! Book an Uber or Rapido 👆 (use 'Reset demo data' in Settings to start over)");
      await sleep(7000);
      s().setDemo({ running: false, caption: null });
    } catch (e) {
      s().setDemo({ running: false, caption: null });
      if (e instanceof Error && e.message !== "cancelled") toast.error(`Demo stopped: ${e.message}`);
    }
  };

  const stop = () => {
    cancelled.current = true;
    useShaadiStore.getState().setDemo({ running: false, caption: null });
    toast("Demo stopped");
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

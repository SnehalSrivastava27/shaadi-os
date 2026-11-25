"use client";

import { Car, MapPinned, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { isPendingPickup, isStale, latestPositionsByDevice } from "@/lib/data";
import { useNow } from "@/hooks/useNow";

export function SummaryCards() {
  const helpers = useShaadiStore((s) => s.helpers);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const tasks = useShaadiStore((s) => s.tasks);
  const positions = useShaadiStore((s) => s.positions);
  const now = useNow(5000);
  const latest = latestPositionsByDevice(positions);
  const freeHelpers = helpers.filter((h) => h.status === "free" && h.availability === "online" && h.locationSharing && !isStale(latest.get(h.id), now)).length;
  const freeVehicles = vehicles.filter((v) => v.status === "free").length;
  const pendingPickups = tasks.filter(isPendingPickup).length;

  const items = [
    { label: "Free helpers", value: freeHelpers, total: helpers.length, icon: UserCheck, tone: "text-green-700 bg-green-100" },
    { label: "Free gaadiyan", value: freeVehicles, total: vehicles.length, icon: Car, tone: "text-amber-800 bg-amber-100" },
    { label: "Pending pickups", value: pendingPickups, icon: MapPinned, tone: "text-primary bg-secondary" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {items.map((i) => (
        <Card key={i.label} className="gap-1 px-3 py-3 md:flex-row md:items-center md:gap-3 md:px-4">
          <div className={`hidden size-10 shrink-0 items-center justify-center rounded-full md:flex ${i.tone}`}>
            <i.icon className="size-5" />
          </div>
          <div>
            <p className="font-heading text-2xl font-bold leading-none">
              {i.value}
              {i.total !== undefined && <span className="text-muted-foreground text-sm font-normal">/{i.total}</span>}
            </p>
            <p className="text-muted-foreground mt-1 text-[11px] md:text-xs">{i.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

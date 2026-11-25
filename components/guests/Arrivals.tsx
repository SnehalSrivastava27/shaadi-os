"use client";

import { useState } from "react";
import Link from "next/link";
import { CarFront, Plane, TrainFront, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { formatDateTime } from "@/lib/data";
import { NewTaskDialog, isoToIstInput, type NewTaskValues } from "@/components/tasks/NewTaskDialog";
import { TaskStatusBadge } from "@/components/tasks/StatusBadge";
import { PLACES } from "@/lib/seed";
import { shortName } from "@/lib/messages";

export function Arrivals() {
  const guests = useShaadiStore((s) => s.guests);
  const tasks = useShaadiStore((s) => s.tasks);
  const [defaults, setDefaults] = useState<Partial<NewTaskValues> | null>(null);
  const arrivals = guests.filter((g) => g.arrival).sort((a, b) => a.arrival!.time.localeCompare(b.arrival!.time));

  const placeIdFor = (lat: number, lng: number, guestId: string) => {
    const known = Object.values(PLACES).find((p) => Math.abs(p.lat - lat) < 1e-4 && Math.abs(p.lng - lng) < 1e-4);
    return known?.id ?? `arrival-${guestId}`;
  };

  return (
    <div className="grid gap-2">
      {arrivals.map((g) => {
        const a = g.arrival!;
        const task = tasks.find((t) => t.guestId === g.id && t.status !== "canceled");
        const yes = g.rsvps.find((r) => r.status === "yes");
        const people = yes?.headcount || 1;
        return (
          <Card key={g.id} className="flex-row items-center gap-3 px-4 py-3">
            <div className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
              {a.mode === "flight" ? <Plane className="size-5" /> : a.mode === "train" ? <TrainFront className="size-5" /> : <CarFront className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{g.name}</p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(a.time)} · {a.place}
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Users className="size-3" /> {people} {people === 1 ? "person" : "people"}
              </p>
            </div>
            {task ? (
              <Link href={`/tasks/${task.id}`} className="flex flex-col items-end gap-1 text-xs">
                <TaskStatusBadge status={task.status} />
                <span className="text-muted-foreground underline">view task</span>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  setDefaults({
                    title: `Pick up ${shortName(g.name)} from ${a.place.split(" ")[0]} ${a.mode === "flight" ? "airport" : "station"}`,
                    type: "pickup",
                    pickupPlaceId: placeIdFor(a.lat, a.lng, g.id),
                    dropPlaceId: "ghar",
                    time: isoToIstInput(a.time),
                    peopleCount: people,
                    guestId: g.id,
                    autoAssign: true,
                  })
                }
              >
                Create pickup task
              </Button>
            )}
          </Card>
        );
      })}
      <NewTaskDialog open={!!defaults} onOpenChange={(o) => !o && setDefaults(null)} defaults={defaults ?? undefined} />
    </div>
  );
}

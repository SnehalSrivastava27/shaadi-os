"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Sparkles, UserRound, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { TaskStatusBadge } from "@/components/tasks/StatusBadge";
import { formatDateTime } from "@/lib/data";

export function ActiveTasks({ onNewTask }: { onNewTask: () => void }) {
  const tasks = useShaadiStore((s) => s.tasks);
  const helpers = useShaadiStore((s) => s.helpers);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const dispatchTask = useShaadiStore((s) => s.dispatchTask);
  const completeTask = useShaadiStore((s) => s.completeTask);
  const active = tasks
    .filter((t) => !["completed", "canceled"].includes(t.status))
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Active tasks ({active.length})</CardTitle>
        <Button size="sm" onClick={onNewTask}>
          <Sparkles /> New task
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {active.length === 0 && <p className="text-muted-foreground text-sm">Sab kaam ho gaye! Chai pi lijiye ☕</p>}
        {active.map((t) => {
          const h = helpers.find((x) => x.id === t.assignedHelperId);
          const v = vehicles.find((x) => x.id === t.assignedVehicleId);
          return (
            <div key={t.id} className="rounded-lg border bg-white/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/tasks/${t.id}`} className="text-sm font-medium leading-snug hover:underline">
                  {t.title}
                </Link>
                <TaskStatusBadge status={t.status} />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatDateTime(t.time)} · {t.peopleCount} log
                {h && ` · ${h.name}`}
                {v && ` · ${v.name}`}
                {t.externalBooking && ` · ${t.externalProvider}: ${t.externalBooking.driverName} (${t.externalBooking.plate})`}
              </p>
              {t.status === "in_progress" && t.sim && (
                <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-700"
                    style={{ width: `${Math.round(((t.sim.leg + t.sim.step / t.sim.stepsPerLeg) / (t.sim.route.length - 1)) * 100)}%` }}
                  />
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(t.status === "created" || t.status === "declined") && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      const r = dispatchTask(t.id);
                      if (r?.ok) toast.success(`${r.helper.name} ko offer bheja`, { description: r.vehicle ? `${r.vehicle.name} · ${r.vehicle.plateNumber}` : undefined });
                    }}
                  >
                    <Wand2 /> Auto-assign
                  </Button>
                )}
                {t.status === "offered" && h && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/helper/${h.id}`}>
                      <UserRound /> {h.name} ka view
                    </Link>
                  </Button>
                )}
                {(t.status === "in_progress" || t.status === "external" || t.status === "accepted") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const r = completeTask(t.id);
                      if (r.ok) toast.success("Task done ✅");
                      else toast.error(r.error);
                    }}
                  >
                    <CheckCircle2 /> Mark done
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/tasks/${t.id}`}>
                    Details <ChevronRight />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

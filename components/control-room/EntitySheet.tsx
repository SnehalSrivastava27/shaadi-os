"use client";

import Link from "next/link";
import { Car, Clock, Gauge, Phone, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { DISPLAY_LABEL, helperDisplayStatus, latestPosition, timeAgo, vehicleDisplayStatus, formatClock } from "@/lib/data";
import { useNow } from "@/hooks/useNow";
import type { MapSelection } from "@/components/map";
import { TaskStatusBadge } from "@/components/tasks/StatusBadge";

const statusVariant = { free: "free", busy: "busy", unavailable: "unavailable", stale: "stale" } as const;

export function EntitySheet({ selection, onClose }: { selection: MapSelection | null; onClose: () => void }) {
  const helpers = useShaadiStore((s) => s.helpers);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const positions = useShaadiStore((s) => s.positions);
  const tasks = useShaadiStore((s) => s.tasks);
  const now = useNow(2000);

  const helper = selection?.type === "helper" ? helpers.find((h) => h.id === selection.id) : undefined;
  const vehicle = selection?.type === "vehicle" ? vehicles.find((v) => v.id === selection.id) : undefined;
  const pos = selection ? latestPosition(positions, selection.id) : undefined;
  const status = helper ? helperDisplayStatus(helper, pos, now) : vehicle ? vehicleDisplayStatus(vehicle, pos, now) : "free";
  const currentTask = helper
    ? tasks.find((t) => t.id === helper.currentTaskId) ?? tasks.find((t) => t.assignedHelperId === helper.id && t.status === "offered")
    : vehicle
      ? tasks.find((t) => t.assignedVehicleId === vehicle.id && ["offered", "accepted", "in_progress"].includes(t.status))
      : undefined;
  const driver = vehicle ? helpers.find((h) => h.id === vehicle.driverHelperId) : undefined;

  return (
    <Sheet open={!!selection} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {helper ? <UserRound className="size-5" /> : <Car className="size-5" />}
            {helper?.name ?? vehicle?.name}
          </SheetTitle>
          <SheetDescription>{helper ? helper.relation : vehicle ? `${vehicle.plateNumber} · ${vehicle.seats} seats` : ""}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusVariant[status]}>{DISPLAY_LABEL[status]}</Badge>
            {helper && <Badge variant="outline">{helper.availability === "online" ? "Online" : "Offline"}</Badge>}
            {helper && !helper.locationSharing && <Badge variant="stale">Location sharing off</Badge>}
          </div>
          <div className="grid gap-2 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="text-muted-foreground size-4" /> Last seen:{" "}
              <span className="font-medium">{pos ? `${timeAgo(pos.timestamp, now)} (${formatClock(pos.timestamp)})` : "never"}</span>
            </p>
            {pos && pos.speed > 0 && (
              <p className="flex items-center gap-2">
                <Gauge className="text-muted-foreground size-4" /> Speed: <span className="font-medium">{pos.speed} km/h</span>
              </p>
            )}
            {helper && (
              <p className="flex items-center gap-2">
                <Phone className="text-muted-foreground size-4" />
                <a className="text-primary font-medium" href={`tel:${helper.phone.replace(/\s/g, "")}`}>
                  {helper.phone}
                </a>
              </p>
            )}
            {vehicle && (
              <p className="flex items-center gap-2">
                <UserRound className="text-muted-foreground size-4" /> Driver: <span className="font-medium">{driver?.name ?? "None"}</span>
              </p>
            )}
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">Current task</p>
            {currentTask ? (
              <div className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{currentTask.title}</p>
                  <TaskStatusBadge status={currentTask.status} />
                </div>
                <Button size="sm" variant="outline" className="mt-2" asChild>
                  <Link href={`/tasks/${currentTask.id}`}>Open task</Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No task right now.</p>
            )}
          </div>
          {helper && (
            <Button variant="secondary" asChild>
              <Link href={`/helper/${helper.id}`}>{helper.name}’s helper view</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

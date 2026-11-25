"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Car, CheckCircle2, Clock, Flag, MapPin, Pause, Play, Users, Wand2, XCircle, UserRound, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TripMap } from "@/components/map";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { TaskStatusBadge } from "@/components/tasks/StatusBadge";
import { GuestMessageCard } from "@/components/tasks/GuestMessageCard";
import { formatClock, formatDateTime, tripPositions } from "@/lib/data";
import { canTransition, STATUS_LABEL } from "@/lib/taskMachine";
import { googleMapsLink } from "@/lib/geo";
import type { TaskStatus } from "@/types";

const HAPPY_PATH: TaskStatus[] = ["created", "offered", "accepted", "in_progress", "completed"];

export function TaskDetail({ taskId }: { taskId: string }) {
  const task = useShaadiStore((s) => s.tasks.find((t) => t.id === taskId));
  const helper = useShaadiStore((s) => s.helpers.find((h) => h.id === task?.assignedHelperId));
  const vehicle = useShaadiStore((s) => s.vehicles.find((v) => v.id === task?.assignedVehicleId));
  const guest = useShaadiStore((s) => s.guests.find((g) => g.id === task?.guestId));
  const positions = useShaadiStore((s) => s.positions);
  const dispatchTask = useShaadiStore((s) => s.dispatchTask);
  const completeTask = useShaadiStore((s) => s.completeTask);
  const cancelTask = useShaadiStore((s) => s.cancelTask);
  const openFallback = useShaadiStore((s) => s.openFallback);

  const trail = useMemo(() => tripPositions(positions, taskId), [positions, taskId]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  if (!task) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Ye task nahi mila. Shayad demo reset ho gaya.</p>
        <Button variant="link" asChild className="px-0">
          <Link href="/tasks">← Saare tasks</Link>
        </Button>
      </div>
    );
  }

  const replaying = cursor !== undefined;
  const startReplay = () => {
    if (trail.length < 2) {
      toast.info("Replay ke liye abhi trip ka data nahi hai");
      return;
    }
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    setCursor(0);
    timer.current = setInterval(() => {
      i += 1;
      if (i >= trail.length) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setCursor(undefined);
        toast.success("Replay khatam");
        return;
      }
      setCursor(i);
    }, Math.max(80, Math.min(400, 8000 / trail.length)));
  };
  const stopReplay = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setCursor(undefined);
  };

  const stageIndex = HAPPY_PATH.indexOf(task.status);
  const replayPos = replaying ? trail[cursor!] : undefined;

  return (
    <div className="grid gap-4 p-3 md:p-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href="/tasks">
            <ArrowLeft /> Tasks
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="font-heading text-primary text-2xl font-bold md:text-3xl">{task.title}</h1>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {formatDateTime(task.time)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" /> {task.peopleCount} log
              </span>
              <span className="capitalize">{task.type}</span>
            </p>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>
        {/* State machine progress */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {HAPPY_PATH.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className={`rounded-full px-2 py-0.5 ${
                  task.status === s ? "bg-primary text-primary-foreground" : stageIndex > i ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                }`}
              >
                {STATUS_LABEL[s]}
              </span>
              {i < HAPPY_PATH.length - 1 && <span className="text-muted-foreground">→</span>}
            </span>
          ))}
          {!HAPPY_PATH.includes(task.status) && (
            <span className="bg-accent text-accent-foreground ml-2 rounded-full px-2 py-0.5">{STATUS_LABEL[task.status]}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-2">
          <div className="relative h-[45vh] overflow-hidden rounded-xl border lg:h-[480px]">
            <TripMap waypoints={task.waypoints} trail={trail} cursor={cursor} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {replaying ? (
              <Button variant="outline" onClick={stopReplay}>
                <Pause /> Stop replay
              </Button>
            ) : (
              <Button variant="outline" onClick={startReplay} disabled={trail.length < 2}>
                <Play /> Replay trip
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {replayPos
                ? `${formatClock(replayPos.timestamp)} · ${replayPos.speed} km/h · point ${cursor! + 1}/${trail.length}`
                : `${trail.length} GPS points recorded`}
            </span>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">Route</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {task.waypoints.map((w, i) => (
                <a key={i} href={googleMapsLink(w)} target="_blank" rel="noreferrer" className="hover:bg-muted flex items-start gap-2 rounded-md p-1 text-sm">
                  {i === 0 ? <MapPin className="text-primary mt-0.5 size-4" /> : <Flag className="text-accent mt-0.5 size-4" />}
                  <span>
                    <span className="text-muted-foreground text-xs">{i === 0 ? "Pickup" : "Drop"}</span>
                    <br />
                    {w.label}
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {task.externalBooking ? (
                <div className="grid gap-1">
                  <p className="font-medium">
                    {task.externalProvider} · {task.externalBooking.bookingId}
                  </p>
                  <p>
                    {task.externalBooking.driverName} · {task.externalBooking.car} · {task.externalBooking.plate}
                  </p>
                  <p className="text-muted-foreground">
                    ETA {task.externalBooking.etaMinutes} min · ~₹{task.externalBooking.fareEstimate}
                  </p>
                </div>
              ) : helper ? (
                <div className="grid gap-1">
                  <p className="flex items-center gap-2">
                    <UserRound className="size-4" /> <span className="font-medium">{helper.name}</span>
                    <span className="text-muted-foreground">({helper.relation})</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4" /> {helper.phone}
                  </p>
                  {vehicle && (
                    <p className="flex items-center gap-2">
                      <Car className="size-4" /> {vehicle.name} · {vehicle.plateNumber} · {vehicle.seats} seats
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Abhi kisi ko assign nahi kiya.</p>
              )}
              {guest && <p className="text-muted-foreground">Guest: {guest.name} · {guest.phone}</p>}
              {["accepted", "in_progress", "external", "completed"].includes(task.status) && (helper || task.externalBooking) && <GuestMessageCard task={task} />}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {canTransition(task.status, "offered") && (
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => {
                      const r = dispatchTask(task.id);
                      if (r?.ok) toast.success(`${r.helper.name} ko offer bheja`);
                    }}
                  >
                    <Wand2 /> Auto-assign
                  </Button>
                )}
                {task.status === "offered" && helper && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/helper/${helper.id}`}>{helper.name} ka view</Link>
                  </Button>
                )}
                {canTransition(task.status, "external") && (
                  <Button size="sm" variant="outline" onClick={() => openFallback({ taskId: task.id, reason: "Cab book karni hai?" })}>
                    <Car /> Uber / Rapido
                  </Button>
                )}
                {["accepted", "in_progress", "external"].includes(task.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const r = completeTask(task.id);
                      if (r.ok) toast.success("Task done ✅");
                      else toast.error(r.error);
                    }}
                  >
                    <CheckCircle2 /> Mark done
                  </Button>
                )}
                {canTransition(task.status, "canceled") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const r = cancelTask(task.id);
                      if (r.ok) toast("Task cancel kiya");
                    }}
                  >
                    <XCircle /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-base">Activity log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <ol className="grid gap-2">
              {[...task.activity].reverse().map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0 text-xs tabular-nums">{formatClock(a.timestamp)}</span>
                  <span>
                    <span className="font-medium">{a.actor}</span> · {a.action}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

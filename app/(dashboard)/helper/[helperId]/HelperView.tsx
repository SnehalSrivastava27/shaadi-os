"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Bell, Car, Check, CheckCircle2, MapPin, Navigation, Users, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { TaskStatusBadge } from "@/components/tasks/StatusBadge";
import { GuestMessageCard } from "@/components/tasks/GuestMessageCard";
import { formatDateTime, latestPosition, timeAgo } from "@/lib/data";
import { formatKm, haversineKm, googleMapsLink } from "@/lib/geo";
import { useNow } from "@/hooks/useNow";
import { initials } from "@/lib/utils";

export function HelperView({ helperId }: { helperId: string }) {
  const helper = useShaadiStore((s) => s.helpers.find((h) => h.id === helperId));
  const tasks = useShaadiStore((s) => s.tasks);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const guests = useShaadiStore((s) => s.guests);
  const positions = useShaadiStore((s) => s.positions);
  const currentUser = useShaadiStore((s) => s.currentUser);
  const acceptTask = useShaadiStore((s) => s.acceptTask);
  const declineTask = useShaadiStore((s) => s.declineTask);
  const completeTask = useShaadiStore((s) => s.completeTask);
  const setAvailability = useShaadiStore((s) => s.setHelperAvailability);
  const now = useNow(5000);

  if (!helper) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Couldn’t find this helper.</p>
        <Link href="/settings" className="text-primary underline">
          Pick one with &quot;Login as&quot; in Settings
        </Link>
      </div>
    );
  }

  const me = latestPosition(positions, helper.id);
  const offers = tasks.filter((t) => t.assignedHelperId === helper.id && t.status === "offered");
  const current = tasks.find((t) => t.id === helper.currentTaskId && ["accepted", "in_progress"].includes(t.status));
  const done = tasks.filter((t) => t.assignedHelperId === helper.id && t.status === "completed").slice(-5).reverse();
  const viewingAsSelf = currentUser.role === "helper" && currentUser.helperId === helper.id;

  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-3 md:p-6">
      {!viewingAsSelf && (
        <p className="bg-secondary text-secondary-foreground rounded-lg px-3 py-2 text-xs">
          You’re seeing {helper.name}’s phone view as the organizer. Use Settings → &quot;Login as&quot; to switch to a helper.
        </p>
      )}
      <Card className="mandala-bg gap-3 border-0 text-[#FFF1D6]">
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-[#F4D58D]">
            <AvatarFallback className="bg-accent text-accent-foreground text-base">{initials(helper.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-xl font-bold">Hi, {helper.name}!</p>
            <p className="text-xs text-[#F4D58D]">
              {helper.relation} · {me ? `location updated ${timeAgo(me.timestamp, now)}` : "no location yet"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch
              id="online"
              checked={helper.availability === "online"}
              onCheckedChange={(on) => {
                setAvailability(helper.id, on ? "online" : "offline");
                toast(on ? "You're online. New tasks will come in." : "You're offline. No tasks will come in.");
              }}
            />
            <Label htmlFor="online" className="text-[11px] text-[#FFF1D6]">
              {helper.availability === "online" ? "Online" : "Offline"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {!helper.locationSharing && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
          Location sharing is off, so auto-assign won’t send you tasks. <Link href="/settings" className="underline">Settings</Link>
        </p>
      )}

      <section className="grid gap-3">
        <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
          <Bell className="text-primary size-5" /> New tasks {offers.length > 0 && <Badge variant="accent">{offers.length}</Badge>}
        </h2>
        {offers.length === 0 && <p className="text-muted-foreground text-sm">No new tasks right now. Take a break 🙂</p>}
        {offers.map((t) => {
          const v = vehicles.find((x) => x.id === t.assignedVehicleId);
          const g = guests.find((x) => x.id === t.guestId);
          const dist = me ? haversineKm(me, t.waypoints[0]) : undefined;
          return (
            <Card key={t.id} className="border-accent gap-3 border-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>
                  {formatDateTime(t.time)} {dist !== undefined && `· ${formatKm(dist)} from you`}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="text-primary size-4" /> {t.waypoints[0].label}
                </p>
                <p className="flex items-center gap-2">
                  <Navigation className="text-accent size-4" /> {t.waypoints[t.waypoints.length - 1].label}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4" /> {t.peopleCount} people {g && `· ${g.name} (${g.phone})`}
                </p>
                {v && (
                  <p className="flex items-center gap-2">
                    <Car className="size-4" /> {v.name} · {v.plateNumber}
                  </p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const r = declineTask(t.id);
                      toast("Declined", {
                        description: r?.ok ? `Offer passed to ${r.helper.name}` : "The organizer has been told",
                      });
                    }}
                  >
                    <X /> Decline
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      const r = acceptTask(t.id);
                      if (r.ok) toast.success("Accepted! Time to head out 🚗");
                      else toast.error(r.error);
                    }}
                  >
                    <Check /> Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {current && (
        <section className="grid gap-3">
          <h2 className="font-heading text-lg font-semibold">In progress</h2>
          <Card className="gap-3">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{current.title}</CardTitle>
                <CardDescription>
                  {current.sim ? `Heading to: ${current.sim.route[current.sim.leg + 1]?.label}` : "Accepted"}
                </CardDescription>
              </div>
              <TaskStatusBadge status={current.status} />
            </CardHeader>
            <CardContent className="grid gap-3">
              <GuestMessageCard task={current} />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <a href={googleMapsLink(current.sim?.route[current.sim.leg + 1] ?? current.waypoints[0])} target="_blank" rel="noreferrer">
                    <Navigation /> Google Maps
                  </a>
                </Button>
                <Button
                  onClick={() => {
                    const r = completeTask(current.id, helper.name);
                    if (r.ok) toast.success("Well done! Task complete ✅");
                  }}
                >
                  <CheckCircle2 /> Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {done.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-heading text-lg font-semibold">Past tasks</h2>
          {done.map((t) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="bg-card hover:bg-muted flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              {t.title}
              <TaskStatusBadge status={t.status} />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

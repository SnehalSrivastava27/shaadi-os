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
        <p className="text-muted-foreground">Ye helper nahi mila.</p>
        <Link href="/settings" className="text-primary underline">
          Settings mein &quot;Login as&quot; se chuniye
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
          Aap organizer ke roop mein {helper.name} ka phone-view dekh rahe hain. Settings → &quot;Login as&quot; se helper ban sakte hain.
        </p>
      )}
      <Card className="mandala-bg gap-3 border-0 text-[#FFF1D6]">
        <CardContent className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-[#F4D58D]">
            <AvatarFallback className="bg-accent text-accent-foreground text-base">{initials(helper.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-heading text-xl font-bold">Namaste, {helper.name}!</p>
            <p className="text-xs text-[#F4D58D]">
              {helper.relation} · {me ? `location ${timeAgo(me.timestamp, now)} update hui` : "location nahi mili"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Switch
              id="online"
              checked={helper.availability === "online"}
              onCheckedChange={(on) => {
                setAvailability(helper.id, on ? "online" : "offline");
                toast(on ? "Aap online hain. Naye tasks aayenge." : "Aap offline hain. Koi task nahi aayega.");
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
          Location sharing band hai, isliye aapko auto-assign se task nahi milenge. <Link href="/settings" className="underline">Settings</Link>
        </p>
      )}

      <section className="grid gap-3">
        <h2 className="font-heading flex items-center gap-2 text-lg font-semibold">
          <Bell className="text-primary size-5" /> Naye tasks {offers.length > 0 && <Badge variant="accent">{offers.length}</Badge>}
        </h2>
        {offers.length === 0 && <p className="text-muted-foreground text-sm">Abhi koi naya task nahi. Aaram kijiye 🙂</p>}
        {offers.map((t) => {
          const v = vehicles.find((x) => x.id === t.assignedVehicleId);
          const g = guests.find((x) => x.id === t.guestId);
          const dist = me ? haversineKm(me, t.waypoints[0]) : undefined;
          return (
            <Card key={t.id} className="border-accent gap-3 border-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>
                  {formatDateTime(t.time)} {dist !== undefined && `· aapse ${formatKm(dist)} door`}
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
                  <Users className="size-4" /> {t.peopleCount} log {g && `· ${g.name} (${g.phone})`}
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
                      toast("Mana kar diya", {
                        description: r?.ok ? `Ab ${r.helper.name} ko offer gaya` : "Organizer ko bata diya gaya",
                      });
                    }}
                  >
                    <X /> Decline
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      const r = acceptTask(t.id);
                      if (r.ok) toast.success("Accept kiya! Nikal padiye 🚗");
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
          <h2 className="font-heading text-lg font-semibold">Abhi chal raha hai</h2>
          <Card className="gap-3">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{current.title}</CardTitle>
                <CardDescription>
                  {current.sim ? `Ja rahe hain: ${current.sim.route[current.sim.leg + 1]?.label}` : "Accepted"}
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
                    if (r.ok) toast.success("Shabaash! Task complete ✅");
                  }}
                >
                  <CheckCircle2 /> Ho gaya
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {done.length > 0 && (
        <section className="grid gap-2">
          <h2 className="font-heading text-lg font-semibold">Pichle tasks</h2>
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

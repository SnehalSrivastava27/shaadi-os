"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PickerMap } from "@/components/map";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { getSavedPlaces } from "@/lib/data";
import { searchPlaces, type PlaceHit } from "@/lib/geo";

export const newTaskSchema = z
  .object({
    title: z.string().trim().min(3, "Task ka naam likhiye (kam se kam 3 akshar)"),
    type: z.enum(["pickup", "errand"]),
    pickupPlaceId: z.string().min(1, "Pickup point chuniye"),
    pickupLat: z.number().optional(),
    pickupLng: z.number().optional(),
    pickupLabel: z.string().optional(),
    dropPlaceId: z.string().min(1, "Drop point chuniye"),
    dropLat: z.number().optional(),
    dropLng: z.number().optional(),
    dropLabel: z.string().optional(),
    time: z.string().min(1, "Time chuniye"),
    peopleCount: z.number({ error: "Kitne log? Number daaliye" }).int().min(1, "Kam se kam 1").max(20, "20 se zyada nahi"),
    guestId: z.string(),
    autoAssign: z.boolean(),
  })
  .refine((v) => v.pickupPlaceId !== "custom" || (v.pickupLat !== undefined && v.pickupLng !== undefined), {
    message: "Naksha par tap karke pickup point chuniye",
    path: ["pickupPlaceId"],
  })
  .refine((v) => v.dropPlaceId !== "custom" || (v.dropLat !== undefined && v.dropLng !== undefined), {
    message: "Pata dhoondh kar drop point chuniye",
    path: ["dropPlaceId"],
  });

export type NewTaskValues = z.infer<typeof newTaskSchema>;

export function isoToIstInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16).replace(" ", "T");
}

/** Nominatim search; runs on Enter / "Dhoondho" only (usage policy forbids autocomplete). */
function AddressSearch({ onPick }: { onPick: (hit: PlaceHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PlaceHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      setHits(await searchPlaces(q.trim()));
    } catch {
      toast.error("Pata nahi mila", { description: "Thodi der baad phir try kijiye" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-1.5">
      <div className="flex gap-2">
        <Input
          placeholder="Pata likhiye, jaise Hazratganj"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Search />} Dhoondho
        </Button>
      </div>
      {hits?.length === 0 && <p className="text-muted-foreground text-xs">Lucknow mein kuch nahi mila</p>}
      {hits?.map((h, i) => (
        <button
          key={i}
          type="button"
          className="hover:bg-muted rounded-md border px-2 py-1 text-left text-xs"
          onClick={() => {
            onPick(h);
            setHits(null);
            setQ(h.name);
          }}
        >
          <span className="font-medium">{h.name}</span>
          <span className="text-muted-foreground block truncate">{h.address}</span>
        </button>
      ))}
    </div>
  );
}

const DEFAULTS: NewTaskValues = {
  title: "",
  type: "pickup",
  pickupPlaceId: "charbagh",
  dropPlaceId: "ghar",
  time: "2026-12-10T15:00",
  peopleCount: 2,
  guestId: "none",
  autoAssign: true,
};

export function NewTaskDialog({
  open,
  onOpenChange,
  defaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: Partial<NewTaskValues>;
}) {
  const config = useShaadiStore((s) => s.publishedConfig);
  const guests = useShaadiStore((s) => s.guests);
  const createTask = useShaadiStore((s) => s.createTask);
  const dispatchTask = useShaadiStore((s) => s.dispatchTask);
  const places = useMemo(() => getSavedPlaces(config, guests), [config, guests]);

  const form = useForm<NewTaskValues>({ resolver: zodResolver(newTaskSchema), defaultValues: { ...DEFAULTS, ...defaults } });

  useEffect(() => {
    if (open) form.reset({ ...DEFAULTS, ...defaults });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pickupPlaceId = useWatch({ control: form.control, name: "pickupPlaceId" });
  const pickupLat = useWatch({ control: form.control, name: "pickupLat" });
  const pickupLng = useWatch({ control: form.control, name: "pickupLng" });
  const pickupLabel = useWatch({ control: form.control, name: "pickupLabel" });
  const dropPlaceId = useWatch({ control: form.control, name: "dropPlaceId" });
  const dropLabel = useWatch({ control: form.control, name: "dropLabel" });
  const type = useWatch({ control: form.control, name: "type" });

  const onSubmit = (v: NewTaskValues) => {
    const pickupPlace = places.find((p) => p.id === v.pickupPlaceId);
    const dropPlace = places.find((p) => p.id === v.dropPlaceId) ?? places[0];
    const pickup =
      v.pickupPlaceId === "custom"
        ? { label: v.pickupLabel ?? `Custom point (${v.pickupLat?.toFixed(3)}, ${v.pickupLng?.toFixed(3)})`, lat: v.pickupLat!, lng: v.pickupLng! }
        : { label: pickupPlace!.label, lat: pickupPlace!.lat, lng: pickupPlace!.lng };
    const drop =
      v.dropPlaceId === "custom"
        ? { label: v.dropLabel ?? `Custom point (${v.dropLat?.toFixed(3)}, ${v.dropLng?.toFixed(3)})`, lat: v.dropLat!, lng: v.dropLng! }
        : { label: dropPlace.label, lat: dropPlace.lat, lng: dropPlace.lng };
    const id = createTask({
      title: v.title,
      type: v.type,
      pickup,
      drop,
      time: `${v.time}:00+05:30`,
      peopleCount: v.peopleCount,
      guestId: v.guestId === "none" ? undefined : v.guestId,
    });
    toast.success("Task ban gaya", { description: v.title });
    onOpenChange(false);
    if (v.autoAssign) {
      const r = dispatchTask(id);
      if (r?.ok) toast.success(`${r.helper.name} ko offer bheja`, { description: r.vehicle ? `${r.vehicle.name} · ${r.vehicle.plateNumber}` : undefined });
      else if (r) toast.warning("Koi free helper nahi mila", { description: r.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Naya task</DialogTitle>
          <DialogDescription>Pickup ya errand banaiye. Auto-assign sabse paas wale free helper ko bhejega.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kya karna hai?</FormLabel>
                  <FormControl>
                    <Input placeholder="Bua ji ko Charbagh station se laana hai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pickup">Pickup (guest lana)</SelectItem>
                        <SelectItem value="errand">Errand (saaman)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="peopleCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{type === "pickup" ? "Kitne log" : "Kitne log / seats"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pickupPlaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup point</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Jagah chuniye" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {places.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">📍 Pata dhoondhiye / naksha par tap kijiye…</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {pickupPlaceId === "custom" && (
              <div className="grid gap-1.5">
                <AddressSearch
                  onPick={(h) => {
                    form.setValue("pickupLat", h.lat);
                    form.setValue("pickupLng", h.lng);
                    form.setValue("pickupLabel", h.name);
                    form.clearErrors("pickupPlaceId");
                  }}
                />
                <div className="h-48 overflow-hidden rounded-lg border">
                  <PickerMap
                    value={pickupLat !== undefined && pickupLng !== undefined ? { lat: pickupLat, lng: pickupLng } : null}
                    onPick={(lat, lng) => {
                      form.setValue("pickupLabel", undefined);
                      form.setValue("pickupLat", lat);
                      form.setValue("pickupLng", lng, { shouldValidate: true });
                      form.clearErrors("pickupPlaceId");
                    }}
                  />
                </div>
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <MapPin className="size-3" />
                  {pickupLat !== undefined ? `Chuna gaya: ${pickupLabel ?? `${pickupLat}, ${pickupLng}`}` : "Pata dhoondhiye ya pickup point par tap kijiye"}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dropPlaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drop point</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {places.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">🔎 Pata dhoondhiye…</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kab (IST)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {dropPlaceId === "custom" && (
              <div className="grid gap-1.5">
                <AddressSearch
                  onPick={(h) => {
                    form.setValue("dropLat", h.lat);
                    form.setValue("dropLng", h.lng);
                    form.setValue("dropLabel", h.name);
                    form.clearErrors("dropPlaceId");
                  }}
                />
                {dropLabel && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="size-3" /> Drop: {dropLabel}
                  </p>
                )}
              </div>
            )}
            <FormField
              control={form.control}
              name="guestId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest (optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Koi guest nahi</SelectItem>
                      {guests.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="autoAssign"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Turant auto-assign karo</FormLabel>
                    <FormDescription>Sabse paas wale free helper + sahi gaadi ko offer jayega</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Rehne do
              </Button>
              <Button type="submit">
                <Sparkles /> Task banao
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

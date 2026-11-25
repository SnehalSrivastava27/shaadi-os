"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import type { Guest, WeddingFunction } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { LABELS, functionDisplayName, type Lang } from "@/lib/invite/i18n";
import { cn } from "@/lib/utils";

export const rsvpSchema = z
  .object({
    status: z.enum(["yes", "no"], { error: "Choose yes or no" }),
    headcount: z.number({ error: "Enter a number" }).int().min(0).max(20, "20 at most"),
    food: z.enum(["veg", "jain", "non-veg"]),
  })
  .refine((v) => v.status === "no" || v.headcount >= 1, { message: "At least 1 guest", path: ["headcount"] });

type RsvpValues = z.infer<typeof rsvpSchema>;

function Choice<T extends string>({ value, onChange, options, color }: { value?: T; onChange: (v: T) => void; options: { value: T; label: string }[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", value === o.value ? "text-white" : "bg-white")}
          style={value === o.value ? { background: color, borderColor: color } : { borderColor: `${color}55`, color }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RsvpForm({ guest, fn, lang, color }: { guest: Guest; fn: WeddingFunction; lang: Lang; color: string }) {
  const L = LABELS[lang];
  const submitRsvp = useShaadiStore((s) => s.submitRsvp);
  const existing = guest.rsvps.find((r) => r.functionId === fn.id);
  const [saved, setSaved] = useState(existing && existing.status !== "pending");
  const form = useForm<RsvpValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      status: existing?.status === "no" ? "no" : existing?.status === "yes" ? "yes" : undefined,
      headcount: existing?.headcount || 1,
      food: existing?.food ?? "veg",
    },
  });
  const status = useWatch({ control: form.control, name: "status" });

  const onSubmit = (v: RsvpValues) => {
    submitRsvp(guest.id, [{ functionId: fn.id, status: v.status, headcount: v.status === "yes" ? v.headcount : 0, food: v.food }]);
    setSaved(true);
    toast.success(L.saved, { description: functionDisplayName(fn, lang) });
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed p-3" style={{ borderColor: `${color}66` }}>
      <p className="mb-2 text-xs font-semibold tracking-wider uppercase" style={{ color }}>
        {L.rsvp}
        {saved && (
          <span className="ml-2 inline-flex items-center gap-1 normal-case text-green-700">
            <CheckCircle2 className="size-3" /> {existing?.status === "yes" ? `${existing.headcount} ${lang === "hi" ? "लोग" : existing.headcount === 1 ? "guest" : "guests"}` : existing?.status === "no" ? "—" : ""}
          </span>
        )}
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3" onChange={() => setSaved(false)}>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{L.attending}</FormLabel>
                <Choice
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setSaved(false);
                  }}
                  color={color}
                  options={[
                    { value: "yes", label: L.yes },
                    { value: "no", label: L.no },
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {status === "yes" && (
            <div className="grid grid-cols-[90px_1fr] items-start gap-3">
              <FormField
                control={form.control}
                name="headcount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{L.headcount}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        className="h-8 bg-white"
                        value={Number.isNaN(field.value) ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="food"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{L.food}</FormLabel>
                    <Choice
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        setSaved(false);
                      }}
                      color={color}
                      options={[
                        { value: "veg", label: `🟢 ${L.veg}` },
                        { value: "jain", label: `🟡 ${L.jain}` },
                        { value: "non-veg", label: `🔴 ${L.nonVeg}` },
                      ]}
                    />
                  </FormItem>
                )}
              />
            </div>
          )}
          <Button type="submit" size="sm" className="w-fit text-white" style={{ background: color }} disabled={saved}>
            {saved ? <CheckCircle2 /> : null}
            {saved ? L.saved.split("!")[0] + "!" : L.submit}
          </Button>
        </form>
      </Form>
    </div>
  );
}

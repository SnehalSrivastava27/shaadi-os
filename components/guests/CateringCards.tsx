"use client";

import { Copy, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { cateringSummary, cateringText, formatDate, formatTime } from "@/lib/data";
import { copyText } from "@/hooks/useCopy";

export function CateringCards() {
  const guests = useShaadiStore((s) => s.guests);
  const config = useShaadiStore((s) => s.publishedConfig);
  const lines = cateringSummary(config, guests);
  const grand = lines.reduce((s, l) => s + l.total, 0);

  return (
    <div className="grid gap-3">
      <p className="text-muted-foreground text-sm">
        Only &quot;yes&quot; RSVPs are counted. Total plates (all functions): <span className="text-foreground font-semibold">{grand}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lines.map((l) => {
          const max = Math.max(1, l.total);
          return (
            <Card key={l.functionId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="text-accent size-4" /> {l.functionName}
                </CardTitle>
                <CardDescription>
                  {formatDate(l.date)}, {formatTime(l.time)} · {l.venueName}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="font-heading text-primary text-4xl font-bold">
                  {l.total} <span className="text-muted-foreground font-sans text-sm font-normal">plates</span>
                </p>
                {(
                  [
                    ["veg", "Veg", "bg-green-600"],
                    ["jain", "Jain", "bg-yellow-500"],
                    ["non-veg", "Non-veg", "bg-red-600"],
                  ] as const
                ).map(([k, label, color]) => (
                  <div key={k} className="grid gap-1">
                    <div className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="font-semibold">{l.food[k]}</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div className={`${color} h-full transition-all`} style={{ width: `${(l.food[k] / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {l.pending > 0 && <p className="text-muted-foreground text-xs">{l.pending} {l.pending === 1 ? "family hasn't" : "families haven't"} replied yet</p>}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => copyText(cateringText(l, config), "Copied for the caterer")}>
                  <Copy /> Copy for caterer
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { DISPLAY_COLORS, DISPLAY_LABEL, helperDisplayStatus, latestPositionsByDevice, timeAgo } from "@/lib/data";
import { useNow } from "@/hooks/useNow";
import { initials } from "@/lib/utils";
import type { MapSelection } from "@/components/map";
import { EyeOff } from "lucide-react";

const ORDER = { free: 0, busy: 1, unavailable: 2, stale: 3 } as const;

export function HelpersPanel({ onSelect }: { onSelect: (s: MapSelection) => void }) {
  const helpers = useShaadiStore((s) => s.helpers);
  const positions = useShaadiStore((s) => s.positions);
  const highlight = useShaadiStore((s) => s.highlightHelperId);
  const setFocus = useShaadiStore((s) => s.setFocus);
  const now = useNow(5000);
  const latest = latestPositionsByDevice(positions);
  const rows = helpers
    .map((h) => ({ h, p: latest.get(h.id), status: helperDisplayStatus(h, latest.get(h.id), now) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">Helpers</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        {rows.map(({ h, p, status }) => (
          <button
            key={h.id}
            onClick={() => {
              onSelect({ type: "helper", id: h.id });
              if (p && h.locationSharing) setFocus(p.lat, p.lng, 14);
            }}
            className={`hover:bg-muted flex items-center gap-3 rounded-lg px-2 py-1.5 text-left ${highlight === h.id ? "ring-accent ring-2" : ""}`}
          >
            <div className="relative">
              <Avatar className="size-8">
                <AvatarFallback>{initials(h.name)}</AvatarFallback>
              </Avatar>
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white" style={{ background: DISPLAY_COLORS[status] }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{h.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {DISPLAY_LABEL[status]} · {p ? timeAgo(p.timestamp, now) : "no location"}
              </p>
            </div>
            {!h.locationSharing && <EyeOff className="text-muted-foreground size-4" aria-label="Location sharing off" />}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

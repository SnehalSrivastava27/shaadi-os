"use client";

import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { formatClock } from "@/lib/data";
import { THEME_PRESETS } from "@/lib/invite/culture";

export function VersionsSheet() {
  const versions = useShaadiStore((s) => s.versions);
  const config = useShaadiStore((s) => s.config);
  const restore = useShaadiStore((s) => s.restoreVersion);
  const list = [...versions].reverse();
  const currentId = versions[versions.length - 1]?.id;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History /> Versions ({versions.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>Har badlaav save hota hai. Kisi bhi purane version par wapas jaa sakte hain.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] px-4">
          <ol className="grid gap-2 pb-6">
            {list.map((v, i) => (
              <li key={v.id} className="rounded-lg border bg-white/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{v.changeSummary}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatClock(v.timestamp)} · {v.config.brideName} &amp; {v.config.groomName} · {THEME_PRESETS[v.config.theme].label} ·{" "}
                      {v.config.functions.length} functions
                    </p>
                  </div>
                  {v.id === currentId ? (
                    <Badge variant="free">Current</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        restore(v.id);
                        toast.success("Purana version wapas laaya", { description: v.changeSummary });
                      }}
                    >
                      <RotateCcw /> Restore
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  {Object.values(v.config.palette).map((c) => (
                    <span key={c} className="size-4 rounded-full border" style={{ background: c }} />
                  ))}
                  <span className="text-muted-foreground ml-auto text-[10px]">v{list.length - i}</span>
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
        <p className="sr-only">Current config: {config.id}</p>
      </SheetContent>
    </Sheet>
  );
}

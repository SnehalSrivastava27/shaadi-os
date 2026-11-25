"use client";

import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { formatClock } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Em, lightPill, sansFont } from "@/components/website/ui";
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
        <button className={lightPill}>
          <History /> Versions <span className="rounded-md bg-[#f4f4f4] px-1.5 text-[11px] text-[#6b6b6b]">{versions.length}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className={cn(sansFont, "bg-white")}>
        <SheetHeader>
          <SheetTitle className={cn(sansFont, "text-lg font-semibold tracking-[-0.02em]")}>
            Version <Em>history</Em>
          </SheetTitle>
          <SheetDescription>Every change is saved. You can go back to any earlier version.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] px-4">
          <ol className="grid gap-2 pb-6">
            {list.map((v, i) => (
              <li key={v.id} className={cn("rounded-xl border border-[#ececec] bg-white p-3 shadow-[0_8px_20px_-18px_rgba(0,0,0,0.4)]", v.id === currentId && "border-[#161616]")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{v.changeSummary}</p>
                    <p className="mt-0.5 text-xs text-[#8a8a8a]">
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
                        toast.success("Restored earlier version", { description: v.changeSummary });
                      }}
                    >
                      <RotateCcw /> Restore
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  {Object.values(v.config.palette).map((c) => (
                    <span key={c} className="size-4 rounded-full border border-white shadow-[0_0_0_1px_#e5e5e5]" style={{ background: c }} />
                  ))}
                  <span className="ml-auto text-[10px] font-medium text-[#8a8a8a]">v{list.length - i}</span>
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

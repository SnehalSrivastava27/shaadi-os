"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { formatClock } from "@/lib/data";

export function Timeline({ className }: { className?: string }) {
  const timeline = useShaadiStore((s) => s.timeline);
  const items = [...timeline].sort((a, b) => b.timestamp - a.timestamp);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="size-4 animate-pulse text-red-600" /> Live timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-64 px-5">
          <ol className="relative ml-1 border-l-2 border-dashed border-gold/50">
            {items.map((e) => (
              <li key={e.id} className="mb-3 ml-4">
                <span className="bg-accent absolute -left-[7px] mt-1.5 size-3 rounded-full border-2 border-white" />
                <p className="text-muted-foreground text-[11px]">{formatClock(e.timestamp)}</p>
                {e.taskId ? (
                  <Link href={`/tasks/${e.taskId}`} className="text-sm hover:underline">
                    {e.text}
                  </Link>
                ) : (
                  <p className="text-sm">{e.text}</p>
                )}
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

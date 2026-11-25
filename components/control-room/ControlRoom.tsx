"use client";

import { Suspense, useState } from "react";
import { LiveMap, type MapSelection } from "@/components/map";
import { SummaryCards } from "./SummaryCards";
import { ActiveTasks } from "./ActiveTasks";
import { HelpersPanel } from "./HelpersPanel";
import { Timeline } from "./Timeline";
import { EntitySheet } from "./EntitySheet";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { DemoRunner } from "@/components/demo/DemoRunner";
import { Tour } from "@/components/demo/Tour";
import { DISPLAY_COLORS, DISPLAY_LABEL } from "@/lib/data";

export function ControlRoom() {
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-3 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-primary text-2xl font-bold md:text-3xl">Control Room</h1>
        <p className="text-muted-foreground text-sm">Kaun kahan hai, kaunsi gaadi free hai, kiska pickup baaki hai: sab ek jagah.</p>
      </div>
      <div data-tour="summary">
        <SummaryCards />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-2">
          <div data-tour="map" className="relative h-[52vh] overflow-hidden rounded-xl border shadow-sm lg:h-[calc(100vh-230px)] lg:min-h-[520px]">
            <LiveMap onSelect={setSelection} />
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs">
            {(Object.keys(DISPLAY_COLORS) as (keyof typeof DISPLAY_COLORS)[]).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="size-2.5 rounded-full" style={{ background: DISPLAY_COLORS[k] }} /> {DISPLAY_LABEL[k]}
              </span>
            ))}
            <span>· Person = helper · Car = gaadi · Heart = venue</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1">
          <div data-tour="tasks">
            <ActiveTasks onNewTask={() => setNewTaskOpen(true)} />
          </div>
          <div data-tour="helpers">
            <HelpersPanel onSelect={setSelection} />
          </div>
          <Timeline />
        </div>
      </div>
      <EntitySheet selection={selection} onClose={() => setSelection(null)} />
      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
      <DemoRunner />
      <Suspense fallback={null}>
        <Tour />
      </Suspense>
    </div>
  );
}

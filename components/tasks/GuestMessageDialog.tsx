"use client";

import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { GuestMessageCard } from "./GuestMessageCard";

/** Pops up right after a helper accepts (or a cab is booked) with a ready-to-send guest message. */
export function GuestMessageDialog() {
  const taskId = useShaadiStore((s) => s.messagePreviewTaskId);
  const task = useShaadiStore((s) => s.tasks.find((t) => t.id === taskId));
  const demoRunning = useShaadiStore((s) => s.demo.running);
  const close = useShaadiStore((s) => s.setMessagePreview);
  if (!task || demoRunning) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && close(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" /> Message to guest
          </DialogTitle>
          <DialogDescription>{task.title}: WhatsApp par bhej dijiye.</DialogDescription>
        </DialogHeader>
        <GuestMessageCard task={task} />
        <DialogFooter>
          <Button variant="outline" onClick={() => close(null)}>
            Theek hai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

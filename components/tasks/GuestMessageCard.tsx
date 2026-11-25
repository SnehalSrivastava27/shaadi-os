"use client";

import { Copy } from "lucide-react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { guestMessage } from "@/lib/messages";
import { copyText } from "@/hooks/useCopy";

export function GuestMessageCard({ task }: { task: Task }) {
  const guest = useShaadiStore((s) => s.guests.find((g) => g.id === task.guestId));
  const helper = useShaadiStore((s) => s.helpers.find((h) => h.id === task.assignedHelperId));
  const vehicle = useShaadiStore((s) => s.vehicles.find((v) => v.id === task.assignedVehicleId));
  const text = guestMessage(task, guest, helper, vehicle);
  return (
    <div className="rounded-xl border border-green-200 bg-[#E7F8E9] p-3">
      <p className="text-[13px] leading-relaxed text-[#103b1c]">{text}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-green-800/70">{guest ? `To: ${guest.name} · ${guest.phone}` : "Guest preview"}</span>
        <Button size="sm" variant="outline" onClick={() => copyText(text, "Message copied")}>
          <Copy /> Copy
        </Button>
      </div>
    </div>
  );
}

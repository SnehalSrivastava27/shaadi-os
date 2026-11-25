import type { Guest, Helper, Task, Vehicle } from "@/types";

/** Short honorific-friendly name: "Bua ji (Kanpur)" -> "Bua ji". */
export function shortName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

export function guestMessage(task: Task, guest: Guest | undefined, helper: Helper | undefined, vehicle: Vehicle | undefined): string {
  const who = guest ? shortName(guest.name) : "Namaste";
  if (task.status === "external" && task.externalBooking) {
    const b = task.externalBooking;
    return `${who}, aapke liye ${task.externalProvider} book ho gayi hai. Driver: ${b.driverName}, Gaadi: ${b.car} ${b.plate}. ${b.etaMinutes} min mein pahunch rahe hain.`;
  }
  const helperName = helper ? shortName(helper.name).replace(/ Bhaiya$/, "") : "Ghar se koi";
  const car = vehicle ? ` Gaadi: ${vehicle.name.split(" ")[0]} ${vehicle.plateNumber}.` : "";
  return `${who}, ${helperName} aapko lene aa rahe hain.${car} Pahunch kar call karenge. 🙏`;
}

export function inviteUrl(guestId: string): string {
  if (typeof window === "undefined") return `/invite/${guestId}`;
  return `${window.location.origin}/invite/${guestId}`;
}

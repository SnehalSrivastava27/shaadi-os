import type { Guest, Helper, Task, Vehicle } from "@/types";

/** Short honorific-friendly name: "Bua ji (Kanpur)" -> "Bua ji". */
export function shortName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

export function guestMessage(task: Task, guest: Guest | undefined, helper: Helper | undefined, vehicle: Vehicle | undefined): string {
  const who = guest ? `Hi ${shortName(guest.name)}` : "Hello";
  if (task.status === "external" && task.externalBooking) {
    const b = task.externalBooking;
    return `${who}, we've booked a ${task.externalProvider} for you. Driver: ${b.driverName}, Car: ${b.car} ${b.plate}. Arriving in ${b.etaMinutes} min.`;
  }
  const helperName = helper ? shortName(helper.name).replace(/ Bhaiya$/, "") : "Someone from the family";
  const car = vehicle ? ` Car: ${vehicle.name.split(" ")[0]} ${vehicle.plateNumber}.` : "";
  return `${who}, ${helperName} is coming to pick you up.${car} They'll call when they arrive. 🙏`;
}

export function inviteUrl(guestId: string): string {
  if (typeof window === "undefined") return `/invite/${guestId}`;
  return `${window.location.origin}/invite/${guestId}`;
}

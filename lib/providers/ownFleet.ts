// Own fleet provider: helpers + family cars, matched with autoAssign().
// The booking it returns describes the helper/car pair so it fits the same
// RideProvider interface as the cab apps.

import type { ExternalBooking } from "@/types";
import { autoAssign, type AssignInput } from "@/lib/autoAssign";
import { haversineKm } from "@/lib/geo";
import type { BookResult, RideProvider, RideRequest } from "./types";

export function createOwnFleetProvider(getInput: (req: RideRequest) => AssignInput): RideProvider {
  return {
    id: "own",
    displayName: "Ghar ki gaadi (own fleet)",
    async quote(req) {
      const result = autoAssign(getInput(req));
      if (!result.ok) throw new Error(result.message);
      return {
        provider: "own",
        productName: result.vehicle ? `${result.vehicle.name} with ${result.helper.name}` : result.helper.name,
        etaMinutes: Math.max(3, Math.round((result.distanceKm / 25) * 60)),
        fareEstimate: 0,
      };
    },
    async book(req): Promise<BookResult> {
      const result = autoAssign(getInput(req));
      if (!result.ok) throw new Error(result.message);
      const booking: ExternalBooking = {
        bookingId: `OWN-${req.taskId}`,
        driverName: result.helper.name,
        car: result.vehicle?.name ?? "Two-wheeler",
        plate: result.vehicle?.plateNumber ?? "-",
        etaMinutes: Math.max(3, Math.round((haversineKm(req.pickup, req.drop) / 25) * 60)),
        fareEstimate: 0,
      };
      return { kind: "booked", booking };
    },
  };
}

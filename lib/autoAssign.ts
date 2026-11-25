// Auto-assign: pick the nearest eligible helper + the nearest suitable vehicle.
//
// 1. Candidate helpers: availability "online", status "free", locationSharing on,
//    latest position not stale, no pending offer, not in the exclude list.
// 2. Candidate vehicles: status "free", seats >= peopleCount, not reserved by an offer.
// 3. Rank by haversine distance to the first waypoint. Pick the nearest helper, then
//    prefer the vehicle that helper already drives, else the nearest suitable one.
// 4. If no helper is within MAX_DISTANCE_KM the caller falls back to Uber / Rapido.

import type { Helper, Position, Task, Vehicle } from "@/types";
import { haversineKm } from "@/lib/geo";
import { isStale, latestPositionsByDevice } from "@/lib/data";

export const MAX_DISTANCE_KM = 15;

export interface AssignInput {
  task: Task;
  helpers: Helper[];
  vehicles: Vehicle[];
  positions: Position[];
  tasks: Task[];
  now: number;
  excludeHelperIds?: string[];
}

export interface HelperCandidate {
  helper: Helper;
  distanceKm: number;
}

export type AssignResult =
  | { ok: true; helper: Helper; vehicle?: Vehicle; distanceKm: number; ranked: HelperCandidate[] }
  | { ok: false; reason: "no_helpers" | "too_far" | "no_vehicle"; message: string; ranked: HelperCandidate[] };

export function rankHelpers(input: AssignInput): HelperCandidate[] {
  const { task, helpers, positions, tasks, now, excludeHelperIds = [] } = input;
  const target = task.waypoints[0];
  if (!target) return [];
  const latest = latestPositionsByDevice(positions);
  const offeredHelperIds = new Set(
    tasks.filter((t) => t.id !== task.id && t.status === "offered" && t.assignedHelperId).map((t) => t.assignedHelperId!)
  );
  const exclude = new Set([...excludeHelperIds, ...(task.declinedHelperIds ?? [])]);

  return helpers
    .filter(
      (h) =>
        h.availability === "online" &&
        h.status === "free" &&
        h.locationSharing &&
        !exclude.has(h.id) &&
        !offeredHelperIds.has(h.id) &&
        !isStale(latest.get(h.id), now)
    )
    .map((helper) => ({ helper, distanceKm: haversineKm(latest.get(helper.id)!, target) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function pickVehicle(input: AssignInput, helper: Helper): Vehicle | undefined {
  const { task, vehicles, positions, tasks } = input;
  const target = task.waypoints[0];
  const latest = latestPositionsByDevice(positions);
  const reserved = new Set(
    tasks.filter((t) => t.id !== task.id && t.status === "offered" && t.assignedVehicleId).map((t) => t.assignedVehicleId!)
  );
  const suitable = vehicles.filter((v) => v.status === "free" && v.seats >= task.peopleCount && !reserved.has(v.id));
  const own = suitable.find((v) => v.driverHelperId === helper.id);
  if (own) return own;
  return suitable
    .map((v) => ({ v, d: latest.get(v.id) && target ? haversineKm(latest.get(v.id)!, target) : Number.POSITIVE_INFINITY }))
    .sort((a, b) => a.d - b.d)[0]?.v;
}

export function autoAssign(input: AssignInput): AssignResult {
  const ranked = rankHelpers(input);
  if (ranked.length === 0) {
    return { ok: false, reason: "no_helpers", message: "Koi free helper nahi hai.", ranked };
  }
  const best = ranked[0];
  if (best.distanceKm > MAX_DISTANCE_KM) {
    return {
      ok: false,
      reason: "too_far",
      message: `Sabse paas wale helper (${best.helper.name}) bhi ${best.distanceKm.toFixed(1)} km door hain.`,
      ranked,
    };
  }
  const vehicle = pickVehicle(input, best.helper);
  if (!vehicle && input.task.type === "pickup") {
    return { ok: false, reason: "no_vehicle", message: `${input.task.peopleCount} logon ke liye koi gaadi free nahi hai.`, ranked };
  }
  return { ok: true, helper: best.helper, vehicle, distanceKm: best.distanceKm, ranked };
}

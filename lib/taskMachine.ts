// Task lifecycle state machine, modelled on a dispatch "order":
//
//   created ──► offered ──► accepted ──► in_progress ──► completed
//      │           │  ▲         │             │
//      │           ▼  │         └──► canceled ◄┘
//      │        declined ──► (re-offered to the next helper)
//      └──────────► external (Uber / Rapido) ──► completed
//
// Only transitions listed in TRANSITIONS are allowed.

import type { TaskStatus } from "@/types";

export const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  created: ["offered", "external", "canceled"],
  offered: ["accepted", "declined", "external", "canceled"],
  declined: ["offered", "external", "canceled"],
  accepted: ["in_progress", "canceled"],
  in_progress: ["completed", "canceled"],
  external: ["completed", "canceled"],
  completed: [],
  canceled: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Task cannot go from "${from}" to "${to}"`);
  }
}

/** Returns the next status or throws if the transition is not allowed. */
export function transition(from: TaskStatus, to: TaskStatus): TaskStatus {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
  return to;
}

export const TERMINAL_STATUSES: TaskStatus[] = ["completed", "canceled"];
export const ACTIVE_STATUSES: TaskStatus[] = ["created", "offered", "declined", "accepted", "in_progress", "external"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  created: "Created",
  offered: "Offered",
  accepted: "Accepted",
  in_progress: "On the way",
  completed: "Completed",
  declined: "Declined",
  canceled: "Canceled",
  external: "Uber/Rapido",
};

export const STATUS_BADGE: Record<
  TaskStatus,
  "secondary" | "accent" | "default" | "free" | "busy" | "unavailable" | "stale" | "outline"
> = {
  created: "secondary",
  offered: "accent",
  accepted: "busy",
  in_progress: "busy",
  completed: "free",
  declined: "unavailable",
  canceled: "stale",
  external: "outline",
};

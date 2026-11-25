// RideProvider abstraction: our own fleet (helpers + family cars) and external
// cab apps share one interface, so real Uber / Rapido APIs can be plugged in.

import type { ExternalBooking, Waypoint } from "@/types";

export type ProviderId = "own" | "uber" | "rapido";

export interface RideRequest {
  taskId: string;
  pickup: Waypoint;
  drop: Waypoint;
  peopleCount: number;
  time: string;
}

export interface RideOption {
  product: string;
  fare: number;
  etaMinutes: number;
}

export interface RideQuote {
  provider: ProviderId;
  productName: string;
  etaMinutes: number;
  fareEstimate: number;
  /** Every option read from the app (bridge providers). */
  options?: RideOption[];
}

export interface BookOptions {
  /** User explicitly confirmed a real booking. */
  confirm?: boolean;
  /** Product chosen from the quote, e.g. "Uber Go". */
  product?: string;
}

/** A booking, or a dry run that stopped on the app's confirm screen. */
export type BookResult = { kind: "booked"; booking: ExternalBooking } | { kind: "dry-run"; product?: string; fare?: number; etaMinutes?: number };

export interface RideProvider {
  id: ProviderId;
  displayName: string;
  quote(req: RideRequest): Promise<RideQuote>;
  book(req: RideRequest, opts?: BookOptions): Promise<BookResult>;
}

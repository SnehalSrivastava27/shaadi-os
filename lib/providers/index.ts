export * from "./types";
export { MockUberProvider, MockRapidoProvider } from "./mock";
export { createOwnFleetProvider } from "./ownFleet";
export { BRIDGE_PROVIDERS, BridgeUberProvider, BridgeRapidoProvider, getBridgeStatus, type BridgeMode, type BridgeStatus } from "./bridge";
export { pickBest } from "./compare";

import { MockRapidoProvider, MockUberProvider } from "./mock";
import { BRIDGE_PROVIDERS } from "./bridge";
import type { RideProvider } from "./types";
import type { BridgeMode } from "./bridge";
import type { Waypoint } from "@/types";

/** Built-in demo providers (no phone needed). */
export const DEMO_PROVIDERS: RideProvider[] = [MockUberProvider, MockRapidoProvider];

/** Cab providers for the fallback dialog: real phone bridge when it is online, demo mocks otherwise. */
export function externalProviders(mode: BridgeMode): RideProvider[] {
  return mode === "off" ? DEMO_PROVIDERS : BRIDGE_PROVIDERS;
}


/** Uber's official universal link: opens the Uber app (or m.uber.com) with pickup and drop filled in. The rider confirms there. */
export function uberLink(pickup: Waypoint, drop: Waypoint): string {
  return `https://m.uber.com/ul/?${new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": String(pickup.lat),
    "pickup[longitude]": String(pickup.lng),
    "pickup[nickname]": pickup.label,
    "dropoff[latitude]": String(drop.lat),
    "dropoff[longitude]": String(drop.lng),
    "dropoff[nickname]": drop.label,
  })}`;
}

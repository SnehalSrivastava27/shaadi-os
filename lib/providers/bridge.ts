// Client-side RideProviders that go through /api/rides/* to the phone ride
// bridge (ride-bridge/server.py), which drives the real Uber / Rapido apps.

import type { BookOptions, BookResult, RideProvider, RideQuote, RideRequest } from "./types";

export type BridgeMode = "off" | "mock" | "phone";

export interface BridgeStatus {
  mode: BridgeMode;
  allowBooking?: boolean;
  busy?: boolean;
  error?: string;
}

export async function getBridgeStatus(): Promise<BridgeStatus> {
  try {
    const res = await fetch("/api/rides", { cache: "no-store" });
    return (await res.json()) as BridgeStatus;
  } catch {
    return { mode: "off", error: "Status check failed" };
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

interface BridgeQuoteResponse {
  options: { product: string; fare: number; eta_minutes: number }[];
  best: { product: string; fare: number; eta_minutes: number };
}

interface BridgeBookResponse {
  dryRun: boolean;
  mode: "mock" | "phone";
  booking: {
    status: "booked" | "searching" | "ready_to_confirm" | "failed";
    product?: string;
    fare?: number;
    eta_minutes?: number;
    driver_name?: string;
    car?: string;
    plate?: string;
    note?: string;
  };
}

function createBridgeProvider(id: "uber" | "rapido", displayName: string): RideProvider {
  const payload = (req: RideRequest) => ({
    provider: id,
    pickup: { label: req.pickup.label, lat: req.pickup.lat, lng: req.pickup.lng },
    drop: { label: req.drop.label, lat: req.drop.lat, lng: req.drop.lng },
    peopleCount: req.peopleCount,
  });
  return {
    id,
    displayName,
    async quote(req): Promise<RideQuote> {
      const d = await post<BridgeQuoteResponse>("/api/rides/quote", payload(req));
      return {
        provider: id,
        productName: d.best.product,
        etaMinutes: d.best.eta_minutes,
        fareEstimate: Math.round(d.best.fare),
        options: d.options.map((o) => ({ product: o.product, fare: Math.round(o.fare), etaMinutes: o.eta_minutes })),
      };
    },
    async book(req, opts: BookOptions = {}): Promise<BookResult> {
      const d = await post<BridgeBookResponse>("/api/rides/book", { ...payload(req), product: opts.product, confirm: !!opts.confirm });
      const b = d.booking;
      if (b.status === "failed") throw new Error(b.note ?? `${displayName} booking failed on the phone`);
      if (d.dryRun || b.status === "ready_to_confirm") {
        return { kind: "dry-run", product: b.product, fare: b.fare, etaMinutes: b.eta_minutes };
      }
      return {
        kind: "booked",
        booking: {
          bookingId: `${id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          driverName: b.driver_name ?? "Driver dhoondh rahe hain",
          car: b.car ?? b.product ?? displayName,
          plate: b.plate ?? "-",
          etaMinutes: b.eta_minutes ?? 0,
          fareEstimate: Math.round(b.fare ?? 0),
          source: d.mode === "phone" ? "phone" : "bridge-mock",
          status: b.driver_name ? "booked" : "searching",
        },
      };
    },
  };
}

export const BridgeUberProvider = createBridgeProvider("uber", "Uber");
export const BridgeRapidoProvider = createBridgeProvider("rapido", "Rapido");
export const BRIDGE_PROVIDERS: RideProvider[] = [BridgeUberProvider, BridgeRapidoProvider];

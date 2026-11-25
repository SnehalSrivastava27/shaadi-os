import type { ExternalBooking } from "@/types";
import { haversineKm } from "@/lib/geo";
import type { BookResult, ProviderId, RideProvider, RideQuote, RideRequest } from "./types";

const DRIVERS = ["Mohd. Salim", "Rajesh Yadav", "Sunil Kumar", "Anil Verma", "Imran Khan", "Deepak Pal", "Santosh Gupta"];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const plate = () =>
  `UP32 ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${1000 + Math.floor(Math.random() * 9000)}`;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function createMockProvider(id: ProviderId, displayName: string, perKm: number, base: number, cars: (n: number) => string): RideProvider {
  const quote = async (req: RideRequest): Promise<RideQuote> => {
    await delay(300);
    const km = haversineKm(req.pickup, req.drop);
    return {
      provider: id,
      productName: cars(req.peopleCount),
      etaMinutes: 4 + Math.floor(Math.random() * 8),
      fareEstimate: Math.round(base + km * perKm),
    };
  };
  const book = async (req: RideRequest): Promise<BookResult> => {
    const q = await quote(req);
    await delay(500);
    const booking: ExternalBooking = {
      bookingId: `${id.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      driverName: pick(DRIVERS),
      car: q.productName,
      plate: plate(),
      etaMinutes: q.etaMinutes,
      fareEstimate: q.fareEstimate,
      source: "demo",
      status: "booked",
    };
    return { kind: "booked", booking };
  };
  return { id, displayName, quote, book };
}

export const MockUberProvider = createMockProvider("uber", "Uber", 18, 60, (n) =>
  n > 4 ? "Uber XL (Ertiga)" : n > 2 ? "Uber Go Sedan (Dzire)" : "Uber Go (WagonR)"
);

export const MockRapidoProvider = createMockProvider("rapido", "Rapido", 14, 40, (n) =>
  n > 4 ? "Rapido Cab XL (Ertiga)" : n > 1 ? "Rapido Cab (Aura)" : "Rapido Bike"
);

import type { RideQuote } from "./types";

/**
 * Pick the best quote: cheapest fare, and if two fares are within 8% of each
 * other, the one that arrives sooner. Deterministic, so it never fails.
 */
export function pickBest(quotes: RideQuote[]): RideQuote | undefined {
  const valid = quotes.filter((q) => q.fareEstimate > 0);
  if (!valid.length) return undefined;
  return [...valid].sort((a, b) => {
    const close = Math.abs(a.fareEstimate - b.fareEstimate) <= 0.08 * Math.min(a.fareEstimate, b.fareEstimate);
    return close ? a.etaMinutes - b.etaMinutes : a.fareEstimate - b.fareEstimate;
  })[0];
}

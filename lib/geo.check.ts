import { strict as assert } from "node:assert";
import { roadRoute, routeKey } from "./geo";

// Self-check: npx tsx lib/geo.check.ts
(async () => {
  const a = { lat: 26.8318, lng: 80.92 };
  const b = { lat: 26.8563, lng: 80.9912 };
  assert.equal(routeKey([a, b]), routeKey([{ lat: 26.831800001, lng: 80.92 }, b]));
  assert.notEqual(routeKey([a, b]), routeKey([b, a]));
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("offline");
  }) as typeof fetch;
  const fb = await roadRoute([a, b]);
  assert.equal(fb.road, false);
  assert.deepEqual(fb.path, [[a.lat, a.lng], [b.lat, b.lng]]);
  assert.ok(fb.distanceM > 7000 && fb.distanceM < 8000);
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify({ routes: [{ geometry: { coordinates: [[80.92, 26.8318], [80.95, 26.84], [80.9912, 26.8563]] }, distance: 9000, duration: 900 }] }));
  }) as typeof fetch;
  const ok = await roadRoute([a, b]); // failure was not cached
  assert.equal(ok.road, true);
  assert.deepEqual(ok.path[1], [26.84, 80.95]);
  await roadRoute([a, b]); // cached
  assert.equal(calls, 2);
  console.log("geo self-check ok");
})();

// Self-check for the WhatsApp parser: npx tsx lib/whatsappCommands.check.ts
import assert from "node:assert/strict";
import { parseWaCommand, type WaCommand } from "./whatsappCommands";
import { PLACES } from "./seed";

const NOW = Date.parse("2026-12-10T09:00:00+05:30");
const task = (c: WaCommand) => {
  assert.equal(c.kind, "task");
  return (c as Extract<WaCommand, { kind: "task" }>).input;
};

let t = task(parseWaCommand("Bua ji ko charbagh se laana hai 3 baje, 3 log", NOW));
assert.equal(t.pickup.label, PLACES.charbagh.label);
assert.equal(t.drop.label, PLACES.ghar.label);
assert.equal(t.time, "2026-12-10T15:00:00+05:30");
assert.equal(t.peopleCount, 3);
assert.equal(t.type, "pickup");
assert.equal(t.title, "Bua ji ko charbagh se laana hai 3 baje, 3 log");

t = task(parseWaCommand("mausi ko airport chhodna hai 5:30", NOW));
assert.equal(t.pickup.label, PLACES.ghar.label);
assert.equal(t.drop.label, PLACES.airport.label);
assert.equal(t.time, "2026-12-10T17:30:00+05:30");
assert.equal(t.peopleCount, 1);

t = task(parseWaCommand("Chappan bhog se mithai lani hai kal subah 11 baje", NOW));
assert.equal(t.pickup.label, PLACES.chappanBhog.label);
assert.equal(t.type, "errand");
assert.equal(t.time, "2026-12-11T11:00:00+05:30");

t = task(parseWaCommand("Gomti Nagar station se airport 2 log 8 pm", NOW));
assert.equal(t.pickup.label, PLACES.gomtiNagarStation.label);
assert.equal(t.drop.label, PLACES.airport.label);
assert.equal(t.time, "2026-12-10T20:00:00+05:30");
assert.equal(t.peopleCount, 2);

t = task(parseWaCommand("station pe chacha ko lena hai", NOW));
assert.equal(t.pickup.label, PLACES.charbagh.label);
assert.equal(t.time, "2026-12-10T09:00:00+05:30");

assert.equal(parseWaCommand("help").kind, "help");
assert.equal(parseWaCommand("kya haal hai").kind, "help");
assert.equal(parseWaCommand("ghar aa jao").kind, "help");
console.log("whatsappCommands: all checks passed");

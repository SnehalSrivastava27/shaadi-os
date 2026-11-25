// Self-check for the WhatsApp parser: npx tsx lib/whatsappCommands.check.ts
import assert from "node:assert/strict";
import { parseWaCommand, WA_HELP, type WaCommand } from "./whatsappCommands";
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

// English input
t = task(parseWaCommand("Pick up Bua ji from Charbagh at 9pm, 3 people", NOW));
assert.equal(t.pickup.label, PLACES.charbagh.label);
assert.equal(t.drop.label, PLACES.ghar.label);
assert.equal(t.time, "2026-12-10T21:00:00+05:30");
assert.equal(t.peopleCount, 3);

t = task(parseWaCommand("Drop Mausi at the airport at 5:30", NOW));
assert.equal(t.pickup.label, PLACES.ghar.label);
assert.equal(t.drop.label, PLACES.airport.label);
assert.equal(t.time, "2026-12-10T17:30:00+05:30");

t = task(parseWaCommand("Take Chacha ji to Charbagh from the airport tomorrow at 11am, 2 people", NOW));
assert.equal(t.pickup.label, PLACES.airport.label);
assert.equal(t.drop.label, PLACES.charbagh.label);
assert.equal(t.time, "2026-12-11T11:00:00+05:30");
assert.equal(t.peopleCount, 2);

assert.match(WA_HELP, /^Send Shaadi OS a task/);
for (const line of WA_HELP.split("\n").filter((l) => l.startsWith("• "))) task(parseWaCommand(line.slice(2), NOW)); // help examples must parse
assert.equal(parseWaCommand("help").kind, "help");
assert.equal(parseWaCommand("kya haal hai").kind, "help");
assert.equal(parseWaCommand("ghar aa jao").kind, "help");
console.log("whatsappCommands: all checks passed");

// Group commands
assert.deepEqual(parseWaCommand("le 7", NOW), { kind: "claim", no: 7 });
assert.deepEqual(parseWaCommand("Main #12", NOW), { kind: "claim", no: 12 });
assert.deepEqual(parseWaCommand("ho gaya 3", NOW), { kind: "done", no: 3 });
assert.deepEqual(parseWaCommand("take 7", NOW), { kind: "claim", no: 7 });
assert.deepEqual(parseWaCommand("list", NOW), { kind: "list" });
assert.equal(parseWaCommand("le lenge kal", NOW).kind, "help");
console.log("group commands ok");

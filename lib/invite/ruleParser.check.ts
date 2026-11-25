// Self-check for the invite rule parser: npx tsx lib/invite/ruleParser.check.ts
import assert from "node:assert/strict";
import type { WeddingConfig } from "@/types";
import { parseWithRules } from "./ruleParser";
import { applyPatch } from "./merge";
import { EDIT_EXAMPLES, QUICK_STARTS } from "./suggestions";

const TODAY = new Date("2026-11-25T10:00:00");
const empty = { id: "c1", brideName: "A", groomName: "B", city: "Jaipur", theme: "rajasthani", palette: { primary: "#000000", accent: "#000000", background: "#FFFFFF" }, welcomeMessage: { en: "x", hi: "x" }, functions: [{ id: "fn-x", name: "X", date: "2026-12-12", time: "10:00", venueName: "V", lat: 0, lng: 0 }], published: false } satisfies WeddingConfig;

// Every quick start builds a wedding, in English.
let config: WeddingConfig = empty;
for (const q of QUICK_STARTS) {
  const r = parseWithRules(empty, q.prompt, TODAY);
  assert.ok(r.patch.replaceFunctions, q.label);
  assert.match(r.reply, /^Congratulations!/);
  const m = applyPatch(empty, r.patch);
  assert.ok(m.ok);
  if (q === QUICK_STARTS[0]) config = m.config;
}

// Every edit example chip changes something.
for (const e of EDIT_EXAMPLES) assert.notEqual(Object.keys(parseWithRules(config, e, TODAY).patch).length, 0, e);
assert.equal(parseWithRules(config, "Move sangeet to 8 pm", TODAY).patch.functions?.[0].time, "20:00");
assert.equal(parseWithRules(config, "sangeet 8 baje kar do", TODAY).patch.functions?.[0].time, "20:00"); // Hinglish still understood
assert.equal(parseWithRules(config, "Hide Hindi", TODAY).patch.showHindi, false);
assert.equal(parseWithRules(config, "Add Jaago", TODAY).patch.functions?.[0].id, "fn-jaago");
assert.match(parseWithRules(config, "blah", TODAY).reply, /^Sorry/);
console.log("ruleParser: all checks passed");

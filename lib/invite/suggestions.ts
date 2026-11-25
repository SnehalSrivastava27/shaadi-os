import type { WeddingConfig } from "@/types";
import { FUNCTION_CATALOG, THEME_PRESETS } from "./culture";

/** Typical functions for the config's theme that are not yet in the list, as tappable pills. */
export function functionSuggestions(config: WeddingConfig): string[] {
  const preset = THEME_PRESETS[config.theme];
  const existing = new Set(config.functions.map((f) => f.id.replace(/^fn-/, "")));
  const existingNames = config.functions.map((f) => f.name.toLowerCase());
  return preset.typicalFunctions
    .filter((key) => !existing.has(key))
    .map((key) => FUNCTION_CATALOG.find((f) => f.key === key)!)
    .filter((f) => f && !existingNames.some((n) => f.keywords.some((k) => n.includes(k))))
    .map((f) => `Add ${f.name}`);
}

export const QUICK_STARTS = [
  { label: "Rajasthani wedding", prompt: "Riya and Arjun's wedding, 12 Dec, Jaipur. Rajasthani theme. Haldi, mehendi, sangeet and pheras." },
  { label: "Punjabi wedding", prompt: "Simran and Karan's Punjabi wedding, 20 Jan, Amritsar. Chooda, jaago, sangeet and anand karaj." },
  { label: "South Indian wedding", prompt: "Meenakshi and Karthik's South Indian wedding, 5 Feb, Chennai. Nalangu, muhurtham and reception." },
  { label: "Bengali wedding", prompt: "Ananya and Sourav's Bengali wedding, 14 Feb, Kolkata. Gaye holud, biye and bou bhaat." },
];

export const EDIT_EXAMPLES = ["Make the colour maroon", "Move sangeet to 8 pm", "Show Hindi too", "Use the Punjabi theme"];

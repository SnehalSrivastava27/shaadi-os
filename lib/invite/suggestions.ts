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
    .map((f) => `${f.name} add karo`);
}

export const QUICK_STARTS = [
  { label: "Rajasthani shaadi", prompt: "Riya aur Arjun ki shaadi, 12 Dec, Jaipur. Rajasthani theme. Haldi, mehendi, sangeet aur pheras." },
  { label: "Punjabi shaadi", prompt: "Simran aur Karan ki Punjabi shaadi, 20 Jan, Amritsar. Chooda, jaago, sangeet aur anand karaj." },
  { label: "South Indian shaadi", prompt: "Meenakshi aur Karthik ki South Indian shaadi, 5 Feb, Chennai. Nalangu, muhurtham aur reception." },
  { label: "Bengali shaadi", prompt: "Ananya aur Sourav ki Bengali shaadi, 14 Feb, Kolkata. Gaye holud, biye aur bou bhaat." },
];

export const EDIT_EXAMPLES = ["Colour maroon karo", "Sangeet 8 baje kar do", "Hindi mein bhi dikhao", "Punjabi theme lagao"];

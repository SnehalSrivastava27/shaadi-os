import type { WeddingFunction } from "@/types";
import { FUNCTION_CATALOG } from "./culture";

export type Lang = "en" | "hi";

export const LABELS = {
  en: {
    weds: "weds",
    invited: "aapko sadar aamantrit kiya jaata hai",
    familyInvite: "Together with their families",
    functions: "Celebrations",
    dressCode: "Dress code",
    whatIsIt: "What is it?",
    openMap: "Open in Google Maps",
    rsvp: "RSVP",
    attending: "Kya aap aayenge?",
    yes: "Haan, zaroor",
    no: "Maaf kijiye, nahi",
    headcount: "Kitne log",
    food: "Khana",
    veg: "Veg",
    jain: "Jain",
    nonVeg: "Non-veg",
    submit: "RSVP bhejiye",
    saved: "Dhanyavaad! Aapka RSVP mil gaya.",
    venue: "Venue",
    blessings: "With blessings of our elders",
    notInvited: "No functions found for this invite.",
  },
  hi: {
    weds: "संग",
    invited: "आपको सादर आमंत्रित किया जाता है",
    familyInvite: "परिवार सहित",
    functions: "मांगलिक कार्यक्रम",
    dressCode: "पहनावा",
    whatIsIt: "यह रस्म क्या है?",
    openMap: "नक्शे में देखें",
    rsvp: "उपस्थिति की सूचना",
    attending: "क्या आप पधारेंगे?",
    yes: "हाँ, अवश्य",
    no: "क्षमा करें, नहीं",
    headcount: "कितने लोग",
    food: "भोजन",
    veg: "शाकाहारी",
    jain: "जैन",
    nonVeg: "मांसाहारी",
    submit: "सूचना भेजें",
    saved: "धन्यवाद! आपकी सूचना मिल गई।",
    venue: "स्थान",
    blessings: "बड़ों के आशीर्वाद से",
    notInvited: "इस निमंत्रण में कोई कार्यक्रम नहीं मिला।",
  },
} as const;

export type Labels = (typeof LABELS)[Lang];

export function functionDisplayName(f: WeddingFunction, lang: Lang): string {
  if (lang === "en") return f.name;
  const preset = FUNCTION_CATALOG.find((p) => `fn-${p.key}` === f.id || p.name.toLowerCase() === f.name.toLowerCase());
  return preset?.nameHi ?? f.name;
}

export function formatInviteDate(date: string, lang: Lang): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatInviteTime(time: string, lang: Lang): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "Sharma Uncle" -> "Sharma Uncle ji"; "Bua ji (Kanpur)" -> "Bua ji". */
export function honorific(name: string, lang: Lang): string {
  const base = name.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (/\bji$/i.test(base)) return lang === "hi" ? base.replace(/\bji$/i, "जी") : base;
  return `${base} ${lang === "hi" ? "जी" : "ji"}`;
}

// Cultural knowledge used by the invite builder (rule parser, suggestions,
// defaults) and by the seed data. Plain data, no React.

import type { Palette, Theme } from "@/types";

export interface FunctionPreset {
  key: string; // stable id suffix: fn-<key>
  name: string;
  nameHi: string;
  keywords: string[];
  dayOffset: number; // relative to the main wedding day
  time: string; // HH:mm default
  dressCode: string;
  description: string;
}

export const FUNCTION_CATALOG: FunctionPreset[] = [
  {
    key: "roka",
    name: "Roka",
    nameHi: "रोका",
    keywords: ["roka", "rokka"],
    dayOffset: -3,
    time: "12:00",
    dressCode: "Pastel ethnic",
    description: "Dono parivaar milkar rishta pakka karte hain: the official 'yes' between the two families.",
  },
  {
    key: "tilak",
    name: "Tilak",
    nameHi: "तिलक",
    keywords: ["tilak", "tilakotsav"],
    dayOffset: -3,
    time: "18:00",
    dressCode: "Kurta & saree",
    description: "The bride's brothers apply tilak on the groom and welcome him into the family.",
  },
  {
    key: "chooda",
    name: "Chooda Ceremony",
    nameHi: "चूड़ा रस्म",
    keywords: ["chooda", "chura", "choora"],
    dayOffset: -1,
    time: "09:00",
    dressCode: "Bright pinks & oranges",
    description: "The bride's maternal uncle gifts her red-and-ivory bangles, blessed in milk and rose petals.",
  },
  {
    key: "haldi",
    name: "Haldi",
    nameHi: "हल्दी",
    keywords: ["haldi", "haldhi", "pithi", "ubtan"],
    dayOffset: -2,
    time: "10:00",
    dressCode: "Yellow, purane kapde chalenge!",
    description: "Turmeric paste is applied to the bride and groom for glow and good luck. Expect to get messy.",
  },
  {
    key: "mehendi",
    name: "Mehendi",
    nameHi: "मेहंदी",
    keywords: ["mehendi", "mehndi", "mehandi", "henna"],
    dayOffset: -2,
    time: "16:00",
    dressCode: "Green & floral",
    description: "Henna designs for the bride and all the ladies, with dholak geet and chaat.",
  },
  {
    key: "jaago",
    name: "Jaago",
    nameHi: "जागो",
    keywords: ["jaago", "jago"],
    dayOffset: -1,
    time: "21:30",
    dressCode: "Punjabi suits & kurta-pajama",
    description: "A late-night procession with a decorated pot of diyas, singing boliyan to wake up the neighbourhood.",
  },
  {
    key: "sangeet",
    name: "Sangeet",
    nameHi: "संगीत",
    keywords: ["sangeet", "sangit", "ladies sangeet"],
    dayOffset: -1,
    time: "19:30",
    dressCode: "Indo-western glam",
    description: "An evening of music and family dance performances. Rehearsals are compulsory!",
  },
  {
    key: "cocktail",
    name: "Cocktail Night",
    nameHi: "कॉकटेल",
    keywords: ["cocktail"],
    dayOffset: -1,
    time: "20:00",
    dressCode: "Black tie / cocktail",
    description: "A relaxed party for friends of the couple.",
  },
  {
    key: "gaye-holud",
    name: "Gaye Holud",
    nameHi: "गाये होलुद",
    keywords: ["gaye holud", "gaye holus", "gae holud", "holud"],
    dayOffset: -1,
    time: "09:30",
    dressCode: "Yellow saree / panjabi",
    description: "The Bengali haldi: turmeric first touches the groom, then is sent to the bride's home.",
  },
  {
    key: "nalangu",
    name: "Nalangu",
    nameHi: "नलंगु",
    keywords: ["nalangu", "nalungu"],
    dayOffset: -1,
    time: "17:00",
    dressCode: "Silk pavadai & veshti",
    description: "Playful games between the bride and groom: rolling coconuts, breaking papads, lots of laughter.",
  },
  {
    key: "anand-karaj",
    name: "Anand Karaj",
    nameHi: "आनंद कारज",
    keywords: ["anand karaj", "anand kaaraj", "laavan", "lavan"],
    dayOffset: 0,
    time: "10:00",
    dressCode: "Traditional; heads covered in the Gurudwara",
    description: "The Sikh wedding: four laavan (rounds) around the Guru Granth Sahib.",
  },
  {
    key: "muhurtham",
    name: "Muhurtham",
    nameHi: "मुहूर्तम",
    keywords: ["muhurtham", "muhurtam", "muhurat", "thali", "kalyanam"],
    dayOffset: 0,
    time: "07:30",
    dressCode: "Kanjeevaram silk & veshti",
    description: "The auspicious moment when the groom ties the thaali (mangalsutra), followed by a banana-leaf feast.",
  },
  {
    key: "wedding",
    name: "Wedding & Pheras",
    nameHi: "शुभ विवाह एवं फेरे",
    keywords: ["pheras", "phere", "fere", "wedding", "vivah", "shaadi ki raat", "biye", "baraat", "saat phere", "jaimala"],
    dayOffset: 0,
    time: "20:00",
    dressCode: "Royal traditional",
    description: "Baraat, jaimala and the seven sacred pheras around the agni.",
  },
  {
    key: "bou-bhaat",
    name: "Bou Bhaat",
    nameHi: "बौ भात",
    keywords: ["bou bhaat", "bou bhat", "boubhat", "bahu bhaat"],
    dayOffset: 2,
    time: "13:00",
    dressCode: "Bengali traditional",
    description: "The new bride serves rice to the groom's family for the first time: a feast and the Bengali reception.",
  },
  {
    key: "reception",
    name: "Reception",
    nameHi: "रिसेप्शन",
    keywords: ["reception", "pagphera", "dawat"],
    dayOffset: 1,
    time: "19:30",
    dressCode: "Formal / Indo-western",
    description: "Dinner and blessings for the newly-weds.",
  },
];

export function findFunctionPreset(key: string): FunctionPreset | undefined {
  return FUNCTION_CATALOG.find((f) => f.key === key);
}

export interface ThemePreset {
  theme: Theme;
  label: string;
  keywords: string[];
  palette: Palette;
  typicalFunctions: string[];
  welcomeMessage: { en: string; hi: string };
}

export const THEME_PRESETS: Record<Theme, ThemePreset> = {
  rajasthani: {
    theme: "rajasthani",
    label: "Rajasthani",
    keywords: ["rajasthani", "rajputana", "royal", "marwari", "rajwada"],
    palette: { primary: "#7A1F2B", accent: "#F4A300", background: "#FFF8EC" },
    typicalFunctions: ["haldi", "mehendi", "sangeet", "wedding", "reception"],
    welcomeMessage: {
      en: "With the blessings of our elders, we request the honour of your presence at the auspicious wedding celebrations.",
      hi: "शुभ विवाह के पावन अवसर पर आपकी उपस्थिति प्रार्थनीय है।",
    },
  },
  punjabi: {
    theme: "punjabi",
    label: "Punjabi",
    keywords: ["punjabi", "sikh", "panjabi", "amritsari"],
    palette: { primary: "#B0154B", accent: "#FF8A00", background: "#FFF6EE" },
    typicalFunctions: ["chooda", "jaago", "mehendi", "sangeet", "anand-karaj", "reception"],
    welcomeMessage: {
      en: "Rab di mehar naal, we invite you to dance, feast and bless the couple. Balle balle!",
      hi: "वाहेगुरु की कृपा से, आप सपरिवार सादर आमंत्रित हैं।",
    },
  },
  "south-indian": {
    theme: "south-indian",
    label: "South Indian",
    keywords: ["south indian", "tamil", "telugu", "kannada", "malayali", "kerala", "iyer", "iyengar"],
    palette: { primary: "#8B0000", accent: "#D4AF37", background: "#FBF6E9" },
    typicalFunctions: ["nalangu", "muhurtham", "reception"],
    welcomeMessage: {
      en: "With the blessings of the Almighty and our elders, we solicit your gracious presence at the muhurtham.",
      hi: "ईश्वर और बड़ों के आशीर्वाद से, विवाह मुहूर्त में आपकी गरिमामयी उपस्थिति प्रार्थनीय है।",
    },
  },
  bengali: {
    theme: "bengali",
    label: "Bengali",
    keywords: ["bengali", "bangali", "bong", "kolkata wali"],
    palette: { primary: "#C1121F", accent: "#E9B949", background: "#FFFBF2" },
    typicalFunctions: ["gaye-holud", "wedding", "bou-bhaat"],
    welcomeMessage: {
      en: "Shubho Bibaho! With joy, we invite you to bless the couple at their wedding.",
      hi: "शुभ विवाह के मंगल अवसर पर आप सपरिवार सादर आमंत्रित हैं।",
    },
  },
  modern: {
    theme: "modern",
    label: "Modern",
    keywords: ["modern", "minimal", "contemporary", "simple"],
    palette: { primary: "#1F2A44", accent: "#C8A165", background: "#FAF7F2" },
    typicalFunctions: ["cocktail", "sangeet", "wedding", "reception"],
    welcomeMessage: {
      en: "Two hearts, two families, one big celebration. We'd love for you to be there.",
      hi: "दो दिल, दो परिवार, एक जश्न। आपका आना हमारे लिए ख़ुशी की बात होगी।",
    },
  },
};

export interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  venues: string[];
}

export const CITY_PRESETS: CityPreset[] = [
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, venues: ["Taj Mahal Lucknow", "Hyatt Regency Lucknow", "Hotel Clarks Avadh", "Indira Gandhi Pratishthan"] },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, venues: ["Rambagh Palace", "Jai Mahal Palace", "ITC Rajputana", "Diggi Palace"] },
  { name: "Udaipur", lat: 24.5854, lng: 73.7125, venues: ["The Leela Palace Udaipur", "Jagmandir Island Palace", "Fateh Prakash Palace", "Radisson Blu Udaipur"] },
  { name: "Jodhpur", lat: 26.2389, lng: 73.0243, venues: ["Umaid Bhawan Palace", "Ajit Bhawan", "Raas Jodhpur"] },
  { name: "Delhi", lat: 28.6139, lng: 77.209, venues: ["The Leela Ambience", "ITC Maurya", "The Grand, Vasant Kunj", "Taj Palace"] },
  { name: "Amritsar", lat: 31.634, lng: 74.8723, venues: ["Taj Swarna", "Hyatt Regency Amritsar", "Gurudwara Shaheedan Sahib", "Ranjit's Svaasa"] },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, venues: ["JW Marriott Chandigarh", "Taj Chandigarh", "Hyatt Regency Chandigarh"] },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, venues: ["Taj Lands End", "JW Marriott Juhu", "ITC Maratha", "Sahara Star"] },
  { name: "Pune", lat: 18.5204, lng: 73.8567, venues: ["JW Marriott Pune", "Conrad Pune", "The Westin Pune"] },
  { name: "Goa", lat: 15.2993, lng: 74.124, venues: ["Taj Exotica Goa", "W Goa", "Grand Hyatt Goa"] },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, venues: ["ITC Sonar", "The Oberoi Grand", "Taj Bengal", "JW Marriott Kolkata"] },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, venues: ["ITC Grand Chola", "Taj Coromandel", "The Leela Palace Chennai", "Kalasalingam Mahal"] },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, venues: ["Taj West End", "The Leela Palace Bengaluru", "ITC Gardenia", "Palace Grounds"] },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867, venues: ["Taj Falaknuma Palace", "ITC Kohenur", "Novotel HICC"] },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, venues: ["Grand Hyatt Kochi", "Taj Malabar", "Crowne Plaza Kochi"] },
  { name: "Varanasi", lat: 25.3176, lng: 82.9739, venues: ["Taj Ganges", "BrijRama Palace", "Radisson Varanasi"] },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319, venues: ["Landmark Hotel", "Hotel Regenta Central", "Kanpur Club"] },
  { name: "Agra", lat: 27.1767, lng: 78.0081, venues: ["The Oberoi Amarvilas", "ITC Mughal", "Jaypee Palace"] },
];

export function findCity(name: string): CityPreset | undefined {
  return CITY_PRESETS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export const COLOR_WORDS: Record<string, string> = {
  maroon: "#7A1F2B",
  "deep red": "#8B0000",
  red: "#C1121F",
  laal: "#C1121F",
  pink: "#D6336C",
  "rani pink": "#E0115F",
  gulabi: "#E75480",
  peach: "#F4A582",
  orange: "#E8590C",
  kesari: "#FF8C00",
  saffron: "#FF9933",
  marigold: "#F4A300",
  yellow: "#F2C230",
  peela: "#F2C230",
  gold: "#C9A227",
  sunehra: "#C9A227",
  green: "#2F6B3B",
  hara: "#2F6B3B",
  emerald: "#046307",
  mint: "#98D7C2",
  teal: "#0F766E",
  blue: "#1D4E89",
  "royal blue": "#1F3A93",
  neela: "#1D4E89",
  navy: "#1F2A44",
  purple: "#5B2A86",
  lavender: "#B497D6",
  ivory: "#FFF8EC",
  cream: "#FFF5E1",
  white: "#FFFFFF",
  safed: "#FFFFFF",
  black: "#111111",
};

// Seed data: Riya weds Arjun, Lucknow. Generated fresh (with current
// timestamps) every time the demo is reset.

import type {
  ActivityEntry,
  FoodPreference,
  Guest,
  Helper,
  Place,
  Position,
  Rsvp,
  RsvpStatus,
  Task,
  TimelineEvent,
  Vehicle,
  WeddingConfig,
} from "@/types";
import { THEME_PRESETS } from "@/lib/invite/culture";
import { lerp } from "@/lib/geo";

export const PLACES = {
  ghar: { id: "ghar", label: "Home (Gomti Nagar)", lat: 26.8563, lng: 80.9912, kind: "home" },
  charbagh: { id: "charbagh", label: "Charbagh Railway Station", lat: 26.8318, lng: 80.92, kind: "station" },
  airport: { id: "airport", label: "Lucknow Airport (CCS)", lat: 26.7606, lng: 80.8893, kind: "airport" },
  gomtiNagarStation: { id: "gomti-nagar-station", label: "Gomti Nagar Railway Station", lat: 26.8436, lng: 81.0158, kind: "station" },
  chappanBhog: { id: "chappan-bhog", label: "Chappan Bhog, Sadar", lat: 26.8384, lng: 80.9545, kind: "other" },
} satisfies Record<string, Place>;

export const HOME = PLACES.ghar;

export function createSeedConfig(): WeddingConfig {
  return {
    id: "wedding-riya-arjun",
    brideName: "Riya",
    groomName: "Arjun",
    city: "Lucknow",
    theme: "mandap",
    palette: { ...THEME_PRESETS.mandap.palette },
    welcomeMessage: { ...THEME_PRESETS.mandap.welcomeMessage },
    showHindi: true,
    published: true,
    functions: [
      {
        id: "fn-haldi",
        name: "Haldi",
        date: "2026-12-10",
        time: "10:00",
        venueName: "Home courtyard, Gomti Nagar",
        lat: 26.8563,
        lng: 80.9912,
        dressCode: "Yellow. Old clothes are fine!",
        description: "Turmeric paste is applied to the bride for glow and good luck. Expect to get messy.",
      },
      {
        id: "fn-mehendi",
        name: "Mehendi",
        date: "2026-12-10",
        time: "16:00",
        venueName: "Taj Mahal Lucknow, Vipin Khand",
        lat: 26.8536,
        lng: 80.9783,
        dressCode: "Green & floral",
        description: "Henna for the bride and all the ladies, with dholak geet and Lucknowi chaat.",
      },
      {
        id: "fn-sangeet",
        name: "Sangeet",
        date: "2026-12-11",
        time: "19:30",
        venueName: "Hyatt Regency Lucknow, Gomti Nagar",
        lat: 26.8601,
        lng: 81.0046,
        dressCode: "Indo-western glam",
        description: "An evening of music and family dance performances. Rehearsals are compulsory!",
      },
      {
        id: "fn-wedding",
        name: "Wedding & Pheras",
        date: "2026-12-11",
        time: "21:00",
        venueName: "Hotel Clarks Avadh, MG Marg",
        lat: 26.8572,
        lng: 80.9427,
        dressCode: "Royal traditional",
        description: "Baraat, jaimala and the seven sacred pheras around the agni.",
      },
      {
        id: "fn-reception",
        name: "Reception",
        date: "2026-12-12",
        time: "19:30",
        venueName: "Indira Gandhi Pratishthan, Gomti Nagar",
        lat: 26.8611,
        lng: 80.9985,
        dressCode: "Formal / Indo-western",
        description: "Dinner and blessings for the newly-weds. Awadhi dawat included!",
      },
    ],
  };
}

const ALL_FN = ["fn-haldi", "fn-mehendi", "fn-sangeet", "fn-wedding", "fn-reception"];

interface GuestSeed {
  name: string;
  side: "bride" | "groom";
  fns: string[];
  status: RsvpStatus;
  headcount: number;
  food: FoodPreference;
  arrival?: Guest["arrival"];
}

const charbagh = (time: string): Guest["arrival"] => ({
  mode: "train",
  place: PLACES.charbagh.label,
  lat: PLACES.charbagh.lat,
  lng: PLACES.charbagh.lng,
  time,
});
const airport = (time: string): Guest["arrival"] => ({
  mode: "flight",
  place: PLACES.airport.label,
  lat: PLACES.airport.lat,
  lng: PLACES.airport.lng,
  time,
});

const GUESTS: GuestSeed[] = [
  { name: "Bua ji (Kanpur)", side: "bride", fns: ALL_FN, status: "yes", headcount: 3, food: "veg", arrival: charbagh("2026-12-10T15:00:00+05:30") },
  { name: "Sharma Uncle", side: "groom", fns: ["fn-sangeet", "fn-wedding", "fn-reception"], status: "yes", headcount: 2, food: "veg", arrival: airport("2026-12-10T18:30:00+05:30") },
  { name: "Pinky Didi", side: "bride", fns: ALL_FN, status: "yes", headcount: 2, food: "non-veg" },
  { name: "Mausi ji (Delhi)", side: "bride", fns: ALL_FN, status: "yes", headcount: 2, food: "jain", arrival: airport("2026-12-10T11:00:00+05:30") },
  { name: "Verma Aunty", side: "groom", fns: ["fn-wedding", "fn-reception"], status: "pending", headcount: 2, food: "veg" },
  { name: "Gupta family", side: "bride", fns: ["fn-wedding", "fn-reception"], status: "yes", headcount: 5, food: "veg" },
  { name: "Tiwari ji", side: "groom", fns: ["fn-wedding"], status: "no", headcount: 0, food: "veg" },
  { name: "Neha (college friend)", side: "bride", fns: ["fn-sangeet", "fn-wedding"], status: "yes", headcount: 1, food: "non-veg", arrival: charbagh("2026-12-11T07:30:00+05:30") },
  { name: "Rahul & Simran", side: "groom", fns: ["fn-sangeet", "fn-wedding", "fn-reception"], status: "yes", headcount: 2, food: "non-veg", arrival: airport("2026-12-11T13:15:00+05:30") },
  { name: "Dadi ji", side: "bride", fns: ALL_FN, status: "yes", headcount: 1, food: "jain" },
  { name: "Nana ji (Prayagraj)", side: "bride", fns: ALL_FN, status: "yes", headcount: 2, food: "veg", arrival: charbagh("2026-12-10T09:45:00+05:30") },
  { name: "Srivastava Uncle", side: "groom", fns: ["fn-wedding", "fn-reception"], status: "pending", headcount: 3, food: "veg" },
  { name: "Fufa ji (Varanasi)", side: "groom", fns: ALL_FN, status: "yes", headcount: 2, food: "veg", arrival: charbagh("2026-12-10T20:10:00+05:30") },
  { name: "Chhoti Bua", side: "groom", fns: ["fn-haldi", "fn-mehendi", "fn-sangeet", "fn-wedding"], status: "yes", headcount: 3, food: "veg" },
  { name: "Mishra ji (neighbour)", side: "bride", fns: ["fn-wedding", "fn-reception"], status: "yes", headcount: 4, food: "veg" },
  { name: "Kapoor Aunty (Chandigarh)", side: "groom", fns: ["fn-sangeet", "fn-wedding", "fn-reception"], status: "yes", headcount: 2, food: "non-veg", arrival: airport("2026-12-11T10:40:00+05:30") },
  { name: "Ankit (Arjun's office)", side: "groom", fns: ["fn-reception"], status: "yes", headcount: 1, food: "non-veg" },
  { name: "Saxena family", side: "bride", fns: ["fn-wedding", "fn-reception"], status: "no", headcount: 0, food: "veg" },
  { name: "Riya's friends", side: "bride", fns: ["fn-mehendi", "fn-sangeet", "fn-wedding"], status: "yes", headcount: 3, food: "non-veg" },
  { name: "Agarwal Uncle", side: "bride", fns: ["fn-reception"], status: "pending", headcount: 2, food: "jain" },
  { name: "Masi ji (Mumbai)", side: "groom", fns: ALL_FN, status: "yes", headcount: 2, food: "veg", arrival: airport("2026-12-10T14:20:00+05:30") },
  { name: "Khanna Uncle", side: "groom", fns: ["fn-wedding", "fn-reception"], status: "yes", headcount: 3, food: "non-veg" },
  { name: "Bhatia Aunty", side: "bride", fns: ["fn-sangeet"], status: "pending", headcount: 1, food: "veg" },
  { name: "Yadav ji", side: "bride", fns: ["fn-wedding"], status: "yes", headcount: 2, food: "veg" },
  { name: "Choudhary family (Jaipur)", side: "groom", fns: ALL_FN, status: "yes", headcount: 4, food: "veg", arrival: charbagh("2026-12-10T06:15:00+05:30") },
];

function createGuests(): Guest[] {
  return GUESTS.map((g, i) => {
    const rsvps: Rsvp[] = g.fns.map((functionId, j) => {
      // Some "yes" guests skip the early functions, to make catering numbers realistic.
      const skip = g.status === "yes" && i % 4 === 2 && j === 0;
      return {
        functionId,
        status: skip ? "no" : g.status,
        headcount: skip ? 0 : g.headcount,
        food: g.food,
      };
    });
    return {
      id: `g${String(i + 1).padStart(2, "0")}`,
      name: g.name,
      phone: `+91 98${String(3900000 + i * 73129).slice(0, 3)} ${String(10000 + i * 3571).slice(0, 5)}`,
      side: g.side,
      invitedFunctionIds: g.fns,
      rsvps,
      arrival: g.arrival,
    };
  });
}

function createHelpers(): Helper[] {
  return [
    { id: "h-rohit", name: "Rohit Bhaiya", relation: "Riya's cousin (tau ji's son)", phone: "+91 98390 11223", availability: "online", status: "free", locationSharing: true },
    { id: "h-pinku", name: "Pinku", relation: "Cousin", phone: "+91 97944 55120", availability: "online", status: "free", locationSharing: true },
    { id: "h-chacha", name: "Chacha ji", relation: "Riya's uncle (chacha)", phone: "+91 94150 32876", availability: "online", status: "busy", locationSharing: true, currentTaskId: "t-mithai" },
    { id: "h-mama", name: "Mama ji", relation: "Riya's uncle (mama)", phone: "+91 94153 77410", availability: "offline", status: "free", locationSharing: true },
    { id: "h-ramesh", name: "Ramesh", relation: "Driver", phone: "+91 99355 60981", availability: "online", status: "free", locationSharing: true },
    { id: "h-sonu", name: "Sonu", relation: "Cousin (Arjun's brother)", phone: "+91 88400 21764", availability: "online", status: "unavailable", locationSharing: false },
  ];
}

function createVehicles(): Vehicle[] {
  return [
    { id: "v-innova", name: "Innova Crysta", plateNumber: "UP32 AB 1234", seats: 7, status: "free", driverHelperId: "h-rohit" },
    { id: "v-swift", name: "Swift Dzire", plateNumber: "UP32 KD 4521", seats: 4, status: "in_use", driverHelperId: "h-chacha" },
    { id: "v-scorpio", name: "Scorpio N", plateNumber: "UP32 HN 7788", seats: 7, status: "free", driverHelperId: "h-ramesh" },
    { id: "v-tempo", name: "Tempo Traveller", plateNumber: "UP32 TT 9090", seats: 12, status: "free" },
  ];
}

let posCounter = 0;
const pid = () => `p-seed-${++posCounter}`;

function pos(deviceType: Position["deviceType"], deviceId: string, lat: number, lng: number, agoMs: number, now: number, speed = 0, taskId?: string): Position {
  return { id: pid(), deviceType, deviceId, lat, lng, speed, timestamp: now - agoMs, taskId };
}

/** A believable completed trip (Ghar -> Airport -> Ghar) so "Replay trip" works on first load. */
function completedTripPositions(now: number): Position[] {
  const route = [PLACES.ghar, PLACES.airport, PLACES.ghar];
  const out: Position[] = [];
  const start = now - 3 * 60 * 60 * 1000;
  let t = start;
  for (let leg = 0; leg < route.length - 1; leg++) {
    for (let s = 0; s <= 12; s++) {
      const p = lerp(route[leg], route[leg + 1], s / 12);
      const jitter = s > 0 && s < 12 ? Math.sin(s * 1.7) * 0.0025 : 0;
      t += 90_000;
      out.push(pos("helper", "h-ramesh", p.lat + jitter, p.lng - jitter, now - t, now, 38, "t-sharma"));
      out.push(pos("vehicle", "v-scorpio", p.lat + jitter, p.lng - jitter, now - t, now, 38, "t-sharma"));
    }
  }
  return out;
}

function createPositions(now: number): Position[] {
  const min = 60_000;
  return [
    // Rohit near Hazratganj: closest online helper to Charbagh.
    pos("helper", "h-rohit", 26.8505, 80.9466, 0.5 * min, now),
    pos("vehicle", "v-innova", 26.8505, 80.9466, 0.5 * min, now),
    // Pinku in Aliganj.
    pos("helper", "h-pinku", 26.8918, 80.9416, 1 * min, now),
    // Chacha ji on the mithai errand (Indira Nagar, heading to Sadar).
    pos("helper", "h-chacha", 26.8785, 80.9996, 0.3 * min, now),
    pos("vehicle", "v-swift", 26.8785, 80.9996, 0.3 * min, now),
    // Mama ji in Alambagh, phone off for 25 minutes (stale).
    pos("helper", "h-mama", 26.8155, 80.9031, 25 * min, now),
    // Ramesh at Ghar with the Scorpio.
    pos("helper", "h-ramesh", 26.8558, 80.9905, 1.5 * min, now),
    pos("vehicle", "v-scorpio", 26.8558, 80.9905, 1.5 * min, now),
    // Sonu (location sharing off) still has an old point, but it stays hidden.
    pos("helper", "h-sonu", 26.8656, 81.0201, 40 * min, now),
    // Tempo Traveller parked at Ghar.
    pos("vehicle", "v-tempo", 26.8569, 80.992, 4 * min, now),
    ...completedTripPositions(now),
  ];
}

const act = (timestamp: number, actor: string, action: string): ActivityEntry => ({ timestamp, actor, action });

export interface SeedOptions {
  /** Leave out the Bua ji task so the scripted demo can create it live. */
  forDemo?: boolean;
}

export function createSeedTasks(now: number, opts: SeedOptions = {}): Task[] {
  const min = 60_000;
  const tasks: Task[] = [
    {
      id: "t-bua",
      title: "Pick up Bua ji from Charbagh station",
      type: "pickup",
      waypoints: [
        { label: PLACES.charbagh.label, lat: PLACES.charbagh.lat, lng: PLACES.charbagh.lng },
        { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
      ],
      time: "2026-12-10T15:00:00+05:30",
      guestId: "g01",
      peopleCount: 3,
      status: "created",
      activity: [act(now - 20 * min, "Organizer", "Task created: arriving on the Lucknow Mail, coach S4")],
      createdAt: now - 20 * min,
    },
    {
      id: "t-mithai",
      title: "Collect boxes of mithai from Chappan Bhog",
      type: "errand",
      waypoints: [
        { label: PLACES.chappanBhog.label, lat: PLACES.chappanBhog.lat, lng: PLACES.chappanBhog.lng },
        { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
      ],
      time: "2026-12-10T12:00:00+05:30",
      peopleCount: 1,
      assignedHelperId: "h-chacha",
      assignedVehicleId: "v-swift",
      status: "in_progress",
      activity: [
        act(now - 15 * min, "Organizer", "Task created: 200 boxes of kaju katli + motichoor"),
        act(now - 14 * min, "System", "Offered to Chacha ji with Swift Dzire (2.9 km away)"),
        act(now - 12 * min, "Chacha ji", "Accepted the task"),
        act(now - 11 * min, "Chacha ji", "Started the trip"),
      ],
      sim: {
        route: [
          { label: "Indira Nagar", lat: 26.8785, lng: 80.9996 },
          { label: PLACES.chappanBhog.label, lat: PLACES.chappanBhog.lat, lng: PLACES.chappanBhog.lng },
          { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
        ],
        leg: 0,
        step: 0,
        stepsPerLeg: 10,
      },
      createdAt: now - 15 * min,
    },
    {
      id: "t-sharma",
      title: "Pick up Sharma Uncle from the airport",
      type: "pickup",
      waypoints: [
        { label: PLACES.airport.label, lat: PLACES.airport.lat, lng: PLACES.airport.lng },
        { label: PLACES.ghar.label, lat: PLACES.ghar.lat, lng: PLACES.ghar.lng },
      ],
      time: "2026-12-10T18:30:00+05:30",
      guestId: "g02",
      peopleCount: 2,
      assignedHelperId: "h-ramesh",
      assignedVehicleId: "v-scorpio",
      status: "completed",
      activity: [
        act(now - 200 * min, "Organizer", "Task created: IndiGo 6E 2193 from Delhi"),
        act(now - 199 * min, "System", "Offered to Ramesh with Scorpio N (18.4 km away)"),
        act(now - 198 * min, "Ramesh", "Accepted the task"),
        act(now - 180 * min, "Ramesh", "Started the trip"),
        act(now - 160 * min, "Ramesh", "Reached Lucknow Airport (CCS), guest picked up"),
        act(now - 141 * min, "Ramesh", "Reached Home (Gomti Nagar). Task completed"),
      ],
      createdAt: now - 200 * min,
    },
  ];
  return opts.forDemo ? tasks.filter((t) => t.id !== "t-bua") : tasks;
}

function createTimeline(now: number): TimelineEvent[] {
  const min = 60_000;
  return [
    { id: "tl-1", timestamp: now - 141 * min, text: "Sharma Uncle reached home (Ramesh, Scorpio)", taskId: "t-sharma" },
    { id: "tl-2", timestamp: now - 20 * min, text: "New task: Pick up Bua ji from Charbagh station", taskId: "t-bua" },
    { id: "tl-3", timestamp: now - 12 * min, text: "Chacha ji accepted the mithai task", taskId: "t-mithai" },
    { id: "tl-4", timestamp: now - 11 * min, text: "Chacha ji left for Chappan Bhog", taskId: "t-mithai" },
  ];
}

export interface SeedSnapshot {
  config: WeddingConfig;
  guests: Guest[];
  helpers: Helper[];
  vehicles: Vehicle[];
  positions: Position[];
  tasks: Task[];
  timeline: TimelineEvent[];
}

export function createSeed(opts: SeedOptions = {}): SeedSnapshot {
  const now = Date.now();
  posCounter = 0;
  const tasks = createSeedTasks(now, opts);
  return {
    config: createSeedConfig(),
    guests: createGuests(),
    helpers: createHelpers(),
    vehicles: createVehicles(),
    positions: createPositions(now),
    tasks,
    timeline: createTimeline(now).filter((e) => !e.taskId || tasks.some((t) => t.id === e.taskId)),
  };
}

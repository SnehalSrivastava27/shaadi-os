// Shaadi OS domain model. Everything in the app reads from these types.

export type Theme = "rajasthani" | "punjabi" | "south-indian" | "bengali" | "modern";

export interface Palette {
  primary: string;
  accent: string;
  background: string;
}

export interface WeddingFunction {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  venueName: string;
  lat: number;
  lng: number;
  dressCode?: string;
  description?: string;
}

export interface WeddingConfig {
  id: string;
  brideName: string;
  groomName: string;
  city: string;
  theme: Theme;
  palette: Palette;
  welcomeMessage: { en: string; hi: string };
  functions: WeddingFunction[];
  published: boolean;
  /** Show the Hindi welcome alongside English on the invite. */
  showHindi?: boolean;
}

export interface ConfigVersion {
  id: string;
  timestamp: number;
  config: WeddingConfig;
  changeSummary: string;
}

export type RsvpStatus = "yes" | "no" | "pending";
export type FoodPreference = "veg" | "jain" | "non-veg";

export interface Rsvp {
  functionId: string;
  status: RsvpStatus;
  headcount: number;
  food: FoodPreference;
}

export type ArrivalMode = "train" | "flight" | "car" | "bus";

export interface Arrival {
  mode: ArrivalMode;
  place: string;
  lat: number;
  lng: number;
  time: string; // ISO datetime
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  side: "bride" | "groom";
  invitedFunctionIds: string[];
  rsvps: Rsvp[];
  arrival?: Arrival;
}

export type HelperAvailability = "online" | "offline";
export type HelperStatus = "free" | "busy" | "unavailable";

export interface Helper {
  id: string;
  name: string;
  relation: string;
  phone: string;
  availability: HelperAvailability;
  status: HelperStatus;
  locationSharing: boolean;
  currentTaskId?: string;
}

export type VehicleStatus = "free" | "in_use" | "unavailable";

export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  seats: number;
  status: VehicleStatus;
  driverHelperId?: string;
}

export type DeviceType = "helper" | "vehicle";

export interface Position {
  id: string;
  deviceType: DeviceType;
  deviceId: string;
  lat: number;
  lng: number;
  speed: number; // km/h
  timestamp: number; // epoch ms
  /** Set while the device is moving for a task, so trips can be replayed. */
  taskId?: string;
}

export type TaskStatus =
  | "created"
  | "offered"
  | "accepted"
  | "in_progress"
  | "completed"
  | "declined"
  | "canceled"
  | "external";

export interface Waypoint {
  label: string;
  lat: number;
  lng: number;
}

export interface ActivityEntry {
  timestamp: number;
  actor: string;
  action: string;
}

export type ExternalProviderName = "Uber" | "Rapido";

export interface ExternalBooking {
  bookingId: string;
  driverName: string;
  car: string;
  plate: string;
  etaMinutes: number;
  fareEstimate: number;
  /** Where it came from: built-in mock, the ride bridge's mock mode, or a real phone. */
  source?: "demo" | "bridge-mock" | "phone";
  /** "searching" = requested, no driver yet. */
  status?: "booked" | "searching";
}

/** Progress of the simulated drive for an in-progress task. */
export interface TaskSimulation {
  route: Waypoint[]; // start point + waypoints
  leg: number; // index of the segment being driven (route[leg] -> route[leg + 1])
  step: number; // step within the leg
  stepsPerLeg: number;
}

export interface Task {
  id: string;
  title: string;
  type: "pickup" | "errand";
  waypoints: Waypoint[];
  time: string; // ISO datetime
  guestId?: string;
  peopleCount: number;
  assignedHelperId?: string;
  assignedVehicleId?: string;
  status: TaskStatus;
  externalProvider?: ExternalProviderName;
  externalBooking?: ExternalBooking;
  activity: ActivityEntry[];
  /** Helpers that declined this task; auto-assign skips them. */
  declinedHelperIds?: string[];
  sim?: TaskSimulation;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  text: string;
  taskId?: string;
}

export interface Place {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "home" | "station" | "airport" | "venue" | "other";
}

export type CurrentUser = { role: "organizer" } | { role: "helper"; helperId: string };

"use client";

// Single Zustand store for the whole demo. Data lives in memory and is
// mirrored to localStorage (so the public invite page in another tab sees
// RSVPs and the published config). Swap the storage for Supabase via /lib/data.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Arrival,
  ConfigVersion,
  CurrentUser,
  ExternalBooking,
  ExternalProviderName,
  Helper,
  HelperAvailability,
  HelperStatus,
  Position,
  Rsvp,
  Task,
  TaskStatus,
  WeddingConfig,
  Waypoint,
} from "@/types";
import { getSeedSnapshot, latestPosition, type SeedSnapshot } from "@/lib/data";
import type { SeedOptions } from "@/lib/seed";
import { canTransition } from "@/lib/taskMachine";
import { autoAssign, type AssignResult } from "@/lib/autoAssign";
import { haversineKm, lerp, formatKm } from "@/lib/geo";
import { applyPatch, type MergeResult } from "@/lib/invite/merge";
import type { ConfigPatch } from "@/lib/invite/schema";
import { uid } from "@/lib/utils";

export const TICK_MS = 2000;
const HEARTBEAT_EVERY_TICKS = 15; // ~30 s
const KEEP_IDLE_POSITIONS_PER_DEVICE = 20;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  error?: boolean;
  source?: "llm" | "rules";
  suggestions?: string[];
}

export interface NewTaskInput {
  title: string;
  type: Task["type"];
  pickup: Waypoint;
  drop: Waypoint;
  time: string;
  peopleCount: number;
  guestId?: string;
}

export interface FallbackState {
  taskId: string;
  reason: string;
}

export interface DemoState {
  running: boolean;
  caption: string | null;
}

type ActionResult = { ok: true } | { ok: false; error: string };

interface PersistedState extends SeedSnapshot {
  publishedConfig: WeddingConfig;
  versions: ConfigVersion[];
  chat: ChatMessage[];
  currentUser: CurrentUser;
}

interface UiState {
  hydrated: boolean;
  fallback: FallbackState | null;
  highlightHelperId: string | null;
  focus: { lat: number; lng: number; zoom?: number; at: number } | null;
  messagePreviewTaskId: string | null;
  demo: DemoState;
  tickCount: number;
}

interface Actions {
  resetDemo(opts?: SeedOptions): void;
  setCurrentUser(user: CurrentUser): void;
  addTimeline(text: string, taskId?: string): void;

  createTask(input: NewTaskInput): string;
  dispatchTask(taskId: string, opts?: { excludeHelperIds?: string[]; silentFallback?: boolean }): AssignResult | null;
  acceptTask(taskId: string): ActionResult;
  declineTask(taskId: string): AssignResult | null;
  completeTask(taskId: string, actor?: string): ActionResult;
  cancelTask(taskId: string): ActionResult;
  bookExternal(taskId: string, provider: ExternalProviderName, booking: ExternalBooking): ActionResult;

  simulateTick(): void;
  heartbeat(): void;

  setHelperSharing(helperId: string, on: boolean): void;
  setHelperAvailability(helperId: string, availability: HelperAvailability): void;
  setHelperStatus(helperId: string, status: HelperStatus): void;
  setAllHelpersBusy(): void;

  /** `arrival`: set it to plan a pickup, `null` to clear (coming by own car / not coming), omit to keep. */
  submitRsvp(guestId: string, rsvps: Rsvp[], arrival?: Arrival | null): void;

  applyConfigPatch(patch: ConfigPatch, summary: string): MergeResult;
  restoreVersion(versionId: string): void;
  publishConfig(): void;
  addChat(msg: Omit<ChatMessage, "id" | "timestamp">): void;
  clearChat(): void;

  openFallback(state: FallbackState | null): void;
  setHighlight(helperId: string | null): void;
  setFocus(lat: number, lng: number, zoom?: number): void;
  setMessagePreview(taskId: string | null): void;
  setDemo(demo: Partial<DemoState>): void;
  setHydrated(): void;
}

export type ShaadiState = PersistedState & UiState & Actions;

function initialPersisted(opts?: SeedOptions): PersistedState {
  const seed = getSeedSnapshot(opts);
  return {
    ...seed,
    publishedConfig: seed.config,
    versions: [{ id: uid("v"), timestamp: Date.now(), config: seed.config, changeSummary: "Initial invite (seed data)" }],
    chat: [],
    currentUser: { role: "organizer" },
  };
}

const act = (actor: string, action: string) => ({ timestamp: Date.now(), actor, action });

function mapTask(tasks: Task[], id: string, fn: (t: Task) => Task): Task[] {
  return tasks.map((t) => (t.id === id ? fn(t) : t));
}

function mkPosition(deviceType: Position["deviceType"], deviceId: string, lat: number, lng: number, speed: number, taskId?: string): Position {
  return { id: uid("p"), deviceType, deviceId, lat, lng, speed, timestamp: Date.now(), taskId };
}

export const useShaadiStore = create<ShaadiState>()(
  persist(
    (set, get) => ({
      ...initialPersisted(),
      hydrated: false,
      fallback: null,
      highlightHelperId: null,
      focus: null,
      messagePreviewTaskId: null,
      demo: { running: false, caption: null },
      tickCount: 0,

      resetDemo(opts) {
        set({
          ...initialPersisted(opts),
          fallback: null,
          highlightHelperId: null,
          messagePreviewTaskId: null,
          focus: null,
        });
      },

      setCurrentUser(user) {
        set({ currentUser: user });
      },

      addTimeline(text, taskId) {
        set((s) => ({ timeline: [...s.timeline, { id: uid("tl"), timestamp: Date.now(), text, taskId }].slice(-200) }));
      },

      // ---------------- tasks ----------------

      createTask(input) {
        const id = uid("t");
        const task: Task = {
          id,
          title: input.title,
          type: input.type,
          waypoints: [input.pickup, input.drop],
          time: input.time,
          guestId: input.guestId,
          peopleCount: input.peopleCount,
          status: "created",
          activity: [act(organizerName(get().currentUser, get().helpers), `Task created (${input.pickup.label} → ${input.drop.label})`)],
          createdAt: Date.now(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        get().addTimeline(`New task: ${task.title}`, id);
        return id;
      },

      dispatchTask(taskId, opts = {}) {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || !canTransition(task.status, "offered")) return null;
        const result = autoAssign({
          task,
          helpers: s.helpers,
          vehicles: s.vehicles,
          positions: s.positions,
          tasks: s.tasks,
          now: Date.now(),
          excludeHelperIds: opts.excludeHelperIds,
        });
        if (result.ok) {
          const { helper, vehicle, distanceKm } = result;
          set((st) => ({
            tasks: mapTask(st.tasks, taskId, (t) => ({
              ...t,
              status: "offered",
              assignedHelperId: helper.id,
              assignedVehicleId: vehicle?.id,
              activity: [
                ...t.activity,
                act("Auto-assign", `Offered to ${helper.name}${vehicle ? ` with ${vehicle.name} (${vehicle.plateNumber})` : ""}, ${formatKm(distanceKm)} away`),
              ],
            })),
            highlightHelperId: helper.id,
          }));
          get().addTimeline(`${task.title}: offer sent to ${helper.name}${vehicle ? ` (${vehicle.name})` : ""}`, taskId);
          const p = latestPosition(get().positions, helper.id);
          if (p) get().setFocus(p.lat, p.lng, 13);
        } else {
          set((st) => ({
            tasks: mapTask(st.tasks, taskId, (t) => ({
              ...t,
              activity: [...t.activity, act("Auto-assign", `No helper found: ${result.message}`)],
            })),
            fallback: opts.silentFallback ? st.fallback : { taskId, reason: result.message },
          }));
          get().addTimeline(`${task.title}: no free helper found`, taskId);
        }
        return result;
      },

      acceptTask(taskId) {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, error: "Task not found" };
        if (!canTransition(task.status, "accepted")) return { ok: false, error: `Task is "${task.status}", it can't be accepted` };
        const helper = s.helpers.find((h) => h.id === task.assignedHelperId);
        if (!helper) return { ok: false, error: "No helper is assigned" };
        const start = latestPosition(s.positions, helper.id) ?? { lat: task.waypoints[0].lat, lng: task.waypoints[0].lng };
        const route: Waypoint[] = [{ label: `${helper.name}'s location`, lat: start.lat, lng: start.lng }, ...task.waypoints];
        const totalKm = route.slice(1).reduce((sum, w, i) => sum + haversineKm(route[i], w), 0);
        const stepsPerLeg = Math.max(6, Math.min(12, Math.round(totalKm / route.length / 0.6)));

        set((st) => ({
          tasks: mapTask(st.tasks, taskId, (t) => ({
            ...t,
            status: "in_progress",
            sim: { route, leg: 0, step: 0, stepsPerLeg },
            activity: [...t.activity, act(helper.name, "Accepted the task"), act(helper.name, `Started the trip towards ${task.waypoints[0].label}`)],
          })),
          helpers: st.helpers.map((h) => (h.id === helper.id ? { ...h, status: "busy", currentTaskId: taskId } : h)),
          vehicles: st.vehicles.map((v) => (v.id === task.assignedVehicleId ? { ...v, status: "in_use", driverHelperId: helper.id } : v)),
          highlightHelperId: st.highlightHelperId === helper.id ? null : st.highlightHelperId,
          messagePreviewTaskId: taskId,
          positions: [
            ...st.positions,
            mkPosition("helper", helper.id, start.lat, start.lng, 0, taskId),
            ...(task.assignedVehicleId ? [mkPosition("vehicle", task.assignedVehicleId, start.lat, start.lng, 0, taskId)] : []),
          ],
        }));
        get().addTimeline(`${helper.name} accepted: ${task.title}`, taskId);
        return { ok: true };
      },

      declineTask(taskId) {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || !canTransition(task.status, "declined")) return null;
        const helper = s.helpers.find((h) => h.id === task.assignedHelperId);
        const declined = [...(task.declinedHelperIds ?? []), ...(helper ? [helper.id] : [])];
        set((st) => ({
          tasks: mapTask(st.tasks, taskId, (t) => ({
            ...t,
            status: "declined",
            assignedHelperId: undefined,
            assignedVehicleId: undefined,
            declinedHelperIds: declined,
            activity: [...t.activity, act(helper?.name ?? "Helper", "Declined the task")],
          })),
          highlightHelperId: null,
        }));
        get().addTimeline(`${helper?.name ?? "Helper"} declined: ${task.title}. Looking for another helper…`, taskId);
        return get().dispatchTask(taskId, { excludeHelperIds: declined });
      },

      completeTask(taskId, actor) {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, error: "Task not found" };
        let status: TaskStatus = task.status;
        const extra: Task["activity"] = [];
        if (status === "accepted") {
          status = "in_progress";
          extra.push(act(actor ?? "Organizer", "Started the trip"));
        }
        if (!canTransition(status, "completed")) return { ok: false, error: `A "${task.status}" task can't be marked done` };
        const helperName = s.helpers.find((h) => h.id === task.assignedHelperId)?.name;
        set((st) => ({
          tasks: mapTask(st.tasks, taskId, (t) => ({
            ...t,
            status: "completed",
            sim: undefined,
            activity: [...t.activity, ...extra, act(actor ?? "Organizer", "Marked as done")],
          })),
          helpers: st.helpers.map((h) => (h.currentTaskId === taskId ? { ...h, status: "free", currentTaskId: undefined } : h)),
          vehicles: st.vehicles.map((v) => (v.id === task.assignedVehicleId && task.status !== "external" ? { ...v, status: "free" } : v)),
        }));
        get().addTimeline(`Done: ${task.title}${helperName ? ` (${helperName})` : ""}`, taskId);
        return { ok: true };
      },

      cancelTask(taskId) {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, error: "Task not found" };
        if (!canTransition(task.status, "canceled")) return { ok: false, error: `A "${task.status}" task can't be canceled` };
        set((st) => ({
          tasks: mapTask(st.tasks, taskId, (t) => ({ ...t, status: "canceled", sim: undefined, activity: [...t.activity, act("Organizer", "Canceled the task")] })),
          helpers: st.helpers.map((h) => (h.currentTaskId === taskId ? { ...h, status: "free", currentTaskId: undefined } : h)),
          vehicles: st.vehicles.map((v) =>
            v.id === task.assignedVehicleId && ["accepted", "in_progress"].includes(task.status) ? { ...v, status: "free" } : v
          ),
          highlightHelperId: st.highlightHelperId === task.assignedHelperId ? null : st.highlightHelperId,
        }));
        get().addTimeline(`Canceled: ${task.title}`, taskId);
        return { ok: true };
      },

      bookExternal(taskId, provider, booking) {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return { ok: false, error: "Task not found" };
        if (!canTransition(task.status, "external")) return { ok: false, error: `Can't book a cab for a "${task.status}" task` };
        set((st) => ({
          tasks: mapTask(st.tasks, taskId, (t) => ({
            ...t,
            status: "external",
            assignedHelperId: undefined,
            assignedVehicleId: undefined,
            externalProvider: provider,
            externalBooking: booking,
            activity: [
              ...t.activity,
              act("Organizer", `Booked ${provider}: ${booking.driverName}, ${booking.car} ${booking.plate}, ETA ${booking.etaMinutes} min, ~₹${booking.fareEstimate}`),
            ],
          })),
          fallback: null,
          messagePreviewTaskId: taskId,
        }));
        get().addTimeline(`${provider} booked: ${task.title} (${booking.driverName}, ${booking.plate})`, taskId);
        return { ok: true };
      },

      // ---------------- live simulation ----------------

      simulateTick() {
        const s = get();
        const tickCount = s.tickCount + 1;
        const newPositions: Position[] = [];
        const logs: { text: string; taskId: string }[] = [];
        const completed: Task[] = [];

        const tasks = s.tasks.map((task) => {
          if (task.status !== "in_progress" || !task.sim || !task.assignedHelperId) return task;
          const sim = { ...task.sim };
          const from = sim.route[sim.leg];
          const to = sim.route[sim.leg + 1];
          if (!from || !to) return task;
          sim.step += 1;
          const t = Math.min(1, sim.step / sim.stepsPerLeg);
          const p = lerp(from, to, t);
          const wobble = t > 0 && t < 1 ? Math.sin(t * Math.PI) * 0.0018 * (sim.leg % 2 ? -1 : 1) : 0;
          const legKm = haversineKm(from, to);
          const speed = Math.round(22 + (legKm / sim.stepsPerLeg) * 25 + Math.random() * 8);
          newPositions.push(mkPosition("helper", task.assignedHelperId, p.lat + wobble, p.lng - wobble, speed, task.id));
          if (task.assignedVehicleId) newPositions.push(mkPosition("vehicle", task.assignedVehicleId, p.lat + wobble, p.lng - wobble, speed, task.id));

          const activity = [...task.activity];
          const helperName = s.helpers.find((h) => h.id === task.assignedHelperId)?.name ?? "Helper";
          if (sim.step >= sim.stepsPerLeg) {
            const isLast = sim.leg + 1 >= sim.route.length - 1;
            if (isLast) {
              activity.push(act(helperName, `Reached ${to.label}. Task completed`));
              logs.push({ text: `${helperName} reached ${to.label}. Task complete! ✅`, taskId: task.id });
              const done: Task = { ...task, status: "completed", sim: undefined, activity };
              completed.push(done);
              return done;
            }
            const pickedUp = task.type === "pickup" && sim.leg === 0;
            activity.push(act(helperName, `Reached ${to.label}${pickedUp ? ", guest picked up" : ""}`));
            logs.push({
              text: pickedUp ? `${helperName} reached ${to.label}, guest is in the car. Now heading to ${sim.route[sim.leg + 2]?.label ?? "the next stop"}` : `${helperName} reached ${to.label}`,
              taskId: task.id,
            });
            sim.leg += 1;
            sim.step = 0;
          }
          return { ...task, sim, activity };
        });

        if (newPositions.length === 0 && tickCount % HEARTBEAT_EVERY_TICKS !== 0) {
          set({ tickCount });
          return;
        }
        const completedIds = new Set(completed.map((t) => t.id));
        set((st) => ({
          tickCount,
          tasks,
          positions: [...st.positions, ...newPositions],
          helpers: st.helpers.map((h) => (h.currentTaskId && completedIds.has(h.currentTaskId) ? { ...h, status: "free", currentTaskId: undefined } : h)),
          vehicles: st.vehicles.map((v) => (completed.some((t) => t.assignedVehicleId === v.id) ? { ...v, status: "free" } : v)),
        }));
        logs.forEach((l) => get().addTimeline(l.text, l.taskId));
        if (tickCount % HEARTBEAT_EVERY_TICKS === 0) get().heartbeat();
      },

      /** Online helpers report their (unchanged) location periodically, like a GPS device. */
      heartbeat() {
        const s = get();
        const moving = new Set(s.tasks.filter((t) => t.status === "in_progress").flatMap((t) => [t.assignedHelperId, t.assignedVehicleId]));
        const fresh: Position[] = [];
        for (const h of s.helpers) {
          if (h.availability !== "online" || !h.locationSharing || moving.has(h.id)) continue;
          const p = latestPosition(s.positions, h.id);
          if (p) fresh.push(mkPosition("helper", h.id, p.lat, p.lng, 0));
        }
        for (const v of s.vehicles) {
          if (moving.has(v.id) || v.status === "unavailable") continue;
          const p = latestPosition(s.positions, v.id);
          if (p) fresh.push(mkPosition("vehicle", v.id, p.lat, p.lng, 0));
        }
        // Prune idle history; keep trip positions for replay.
        const all = [...s.positions, ...fresh];
        const idleByDevice = new Map<string, Position[]>();
        const keep: Position[] = [];
        for (const p of all) {
          if (p.taskId) keep.push(p);
          else idleByDevice.set(p.deviceId, [...(idleByDevice.get(p.deviceId) ?? []), p]);
        }
        for (const list of idleByDevice.values()) {
          keep.push(...list.sort((a, b) => a.timestamp - b.timestamp).slice(-KEEP_IDLE_POSITIONS_PER_DEVICE));
        }
        set({ positions: keep });
      },

      // ---------------- helpers ----------------

      setHelperSharing(helperId, on) {
        set((s) => ({ helpers: s.helpers.map((h) => (h.id === helperId ? { ...h, locationSharing: on } : h)) }));
        const h = get().helpers.find((x) => x.id === helperId);
        if (h) get().addTimeline(`${h.name} turned location sharing ${on ? "on" : "off"}`);
      },
      setHelperAvailability(helperId, availability) {
        set((s) => ({ helpers: s.helpers.map((h) => (h.id === helperId ? { ...h, availability } : h)) }));
        if (availability === "online") {
          const p = latestPosition(get().positions, helperId);
          if (p) set((s) => ({ positions: [...s.positions, mkPosition("helper", helperId, p.lat, p.lng, 0)] }));
        }
      },
      setHelperStatus(helperId, status) {
        set((s) => ({ helpers: s.helpers.map((h) => (h.id === helperId ? { ...h, status } : h)) }));
      },
      setAllHelpersBusy() {
        set((s) => ({ helpers: s.helpers.map((h): Helper => ({ ...h, status: "busy" })) }));
        get().addTimeline("All helpers are now busy (demo)");
      },

      // ---------------- guests ----------------

      submitRsvp(guestId, rsvps, arrival) {
        set((s) => ({
          guests: s.guests.map((g) => {
            if (g.id !== guestId) return g;
            const merged = [...g.rsvps.filter((r) => !rsvps.some((n) => n.functionId === r.functionId)), ...rsvps];
            if (arrival === undefined) return { ...g, rsvps: merged };
            return { ...g, rsvps: merged, arrival: arrival ?? undefined };
          }),
        }));
        const g = get().guests.find((x) => x.id === guestId);
        if (g) get().addTimeline(`RSVP in: ${g.name} (attending ${rsvps.filter((r) => r.status === "yes").length} functions)`);
      },

      // ---------------- invite builder ----------------

      applyConfigPatch(patch, summary) {
        const result = applyPatch(get().config, patch);
        if (result.ok) {
          set((s) => ({
            config: result.config,
            versions: [...s.versions, { id: uid("v"), timestamp: Date.now(), config: result.config, changeSummary: summary || "Updated invite" }].slice(-50),
          }));
        }
        return result;
      },
      restoreVersion(versionId) {
        const v = get().versions.find((x) => x.id === versionId);
        if (!v) return;
        const config = { ...v.config, published: false };
        set((s) => ({
          config,
          versions: [...s.versions, { id: uid("v"), timestamp: Date.now(), config, changeSummary: `Restored: ${v.changeSummary}` }].slice(-50),
        }));
      },
      publishConfig() {
        const config = { ...get().config, published: true };
        set({ config, publishedConfig: config });
        get().addTimeline(`Invite website published 🎉 (${config.brideName} weds ${config.groomName})`);
      },
      addChat(msg) {
        set((s) => ({ chat: [...s.chat, { ...msg, id: uid("m"), timestamp: Date.now() }].slice(-60) }));
      },
      clearChat() {
        set({ chat: [] });
      },

      // ---------------- ui ----------------

      openFallback(state) {
        set({ fallback: state });
      },
      setHighlight(helperId) {
        set({ highlightHelperId: helperId });
      },
      setFocus(lat, lng, zoom) {
        set({ focus: { lat, lng, zoom, at: Date.now() } });
      },
      setMessagePreview(taskId) {
        set({ messagePreviewTaskId: taskId });
      },
      setDemo(demo) {
        set((s) => ({ demo: { ...s.demo, ...demo } }));
      },
      setHydrated() {
        set({ hydrated: true });
      },
    }),
    {
      name: "shaadi-os-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): PersistedState => ({
        config: s.config,
        guests: s.guests,
        helpers: s.helpers,
        vehicles: s.vehicles,
        positions: s.positions,
        tasks: s.tasks,
        timeline: s.timeline,
        publishedConfig: s.publishedConfig,
        versions: s.versions,
        chat: s.chat,
        currentUser: s.currentUser,
      }),
    }
  )
);

function organizerName(user: CurrentUser, helpers: Helper[]): string {
  if (user.role === "helper") return helpers.find((h) => h.id === user.helperId)?.name ?? "Helper";
  return "Organizer";
}

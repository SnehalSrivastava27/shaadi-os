# Shaadi OS 🪔

**A wedding command center for Indian families.** Track pickups and helpers on a live map, auto-assign the nearest cousin and car, fall back to Uber or Rapido when everyone is busy, manage RSVPs and catering counts, and build the invite website by chatting in Hinglish.

Demo wedding: **Riya weds Arjun, Lucknow, 10–12 Dec**, with 6 helpers, 4 vehicles, 25 guests and 3 sample tasks.

---

## Quick start

```bash
cd shaadi-os
npm install
cp .env.example .env.local   # optional: add an LLM key for the AI invite builder
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

No backend or database is needed. All data is seeded in memory and mirrored to `localStorage`, so the public invite page in another tab sees the same RSVPs. Use **Settings → Reset demo data** to start fresh.

### shadcn/ui

The project is already set up for shadcn/ui (`components.json`, theme variables in `app/globals.css`, components in `components/ui`). To add more components:

```bash
npx shadcn@latest add dropdown-menu
```

For a fresh project you would run `npx shadcn@latest init` first. The components used here (Button, Card, Badge, Dialog, Sheet, Tabs, Input, Textarea, Select, Switch, Form, Label, Sonner, Avatar, ScrollArea, Separator, Table) are the standard shadcn "new-york" sources built on the `radix-ui` package.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` | `gemini`, `openai` or `anthropic`. Optional: if unset, the first provider with a key is used. |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Key for the chosen provider. |
| `LLM_API_KEY` | Optional generic key (overrides the provider-specific one). |
| `LLM_MODEL` | Optional model override. Defaults: `gemini-2.5-flash`, `gpt-4o-mini`, `claude-sonnet-5-5`. |
| `SARVAM_API_KEY` | Sarvam AI: WhatsApp voice notes, any-language understanding, native-language replies, invite in 22 languages. See [SARVAM.md](SARVAM.md). |
| `FLAGSMITH_ENVIRONMENT_KEY` | Flagsmith client-side environment key: live feature switches + landing page A/B test. See [FLAGSMITH.md](FLAGSMITH.md). |
| `WA_BRIDGE_AUTOSTART` | Set to `0` to stop `npm run dev` from starting the WhatsApp bridge itself. |

**No key? No problem.** The invite builder falls back to an offline rule-based parser, so the demo always works. The chat header shows whether you are in `AI: <provider>` or `Offline mode`.

---

## Sarvam AI + Flagsmith: how they are linked and used

Two partner products run the WhatsApp side of Shaadi OS. **Sarvam** understands the family, and **Flagsmith** decides which of those features are on.

```
WhatsApp group ─► wa-bridge ─► dashboard tab (WhatsAppAgent)
                                   │  every feature first asks Flagsmith: is it on?  (lib/flags.ts, 5 s cache)
                                   ├─ voice note ──► Sarvam speech-to-text ─► English + spoken language   [whatsapp_voice_notes]
                                   ├─ any request ─► Sarvam chat ─► from/to/time/people ─► map lookup      [ai_understanding]
                                   ├─ task #N in the group, first "take N" gets it, @tagged                [whatsapp_group_mode]
                                   └─ reply ──► English + Sarvam translate + Sarvam voice                  [whatsapp_native_replies]
Guest invite ─► Sarvam translate ─► 22 Indian languages                                                [invite_translation]
Fallback dialog ─► real Uber/Rapido via phone bridge                                                   [real_rides]
/welcome ─► Flagsmith identity per visitor ─► headline variant (A/B)                                   [landing_headline]
```

### How they are linked
- **Sarvam:** one server-side client, `lib/sarvam.ts`, with the key in `SARVAM_API_KEY` (`.env.local`, never sent to the browser). It calls Sarvam's REST API directly: `/speech-to-text` (saaras:v4, mode `translate`), `/v1/chat/completions` (sarvam-105b), `/translate` (sarvam-translate:v1), `/text-lid`, `/text-to-speech` (bulbul:v3, mp3).
- **Flagsmith:** one server-side client, `lib/flags.ts`, that calls the Edge REST API (`/flags/`, `/identities/`) directly, with no SDK. The key is the project's client-side environment key in `FLAGSMITH_ENVIRONMENT_KEY`.
- **Safe defaults:** with no key, with Flagsmith unreachable, or with a flag missing, every feature defaults to on. With no Sarvam key, the bot falls back to the offline rule parser and English replies. The app never breaks because a partner API is down.

### How they are used
| Where | Sarvam | Flagsmith flag |
|---|---|---|
| `app/api/whatsapp/voice` | Voice note → English text + spoken language | `whatsapp_voice_notes` |
| `app/api/whatsapp/understand` | Any message, any script → pickup/drop/time/people; places resolved on OpenStreetMap | `ai_understanding` |
| `app/api/whatsapp/send` | Translated follow-up + spoken MP3 reply | `whatsapp_native_replies` |
| `app/api/whatsapp/*`, `WhatsAppAgent` | – | `whatsapp_group_mode` (off = self-chat tasks are auto-assigned again) |
| `app/api/translate` + `useTranslatePage` | Whole invite page in 22 languages, batched + cached | `invite_translation` |
| `app/api/rides/*` | – | `real_rides` (off = demo rates, no real booking) |
| `app/welcome/page.tsx` + `proxy.ts` | – | `landing_headline` (multivariate A/B test, stable visitor id cookie) |
| Settings → **Feature flags** card | Shows whether Sarvam is configured | Live state of every flag, polled every 5 s |

Full write-ups: **[SARVAM.md](SARVAM.md)** (problems we hit and how we solved them) and **[FLAGSMITH.md](FLAGSMITH.md)** (setup, flags, A/B test, the live-flip demo).

---

## Try the demo

1. Open the **Control Room** (`/`) and press the floating **Demo** button. Captions at the bottom narrate each step:
   1. Creates *"Bua ji ko Charbagh station se laana hai"* (3 log).
   2. Auto-assigns **Rohit Bhaiya + Innova** (nearest free, online, location-sharing helper) and puts a pulsing ring on him.
   3. Auto-accepts after 2 s and drives to Charbagh and back to Ghar, drawing the trail as a polyline.
   4. Marks every helper busy, creates a second pickup and opens the **Uber / Rapido** fallback dialog.
2. **Tasks** → open any task → **Replay trip** (the seeded *Sharma Uncle* airport trip already has a full GPS trail).
3. **Settings → Login as → Rohit Bhaiya** opens the helper's phone view, with Accept / Decline cards.
4. **Guests → Arrivals → Create pickup task** opens a pre-filled New Task dialog.
5. **Guests → Copy invite link**, open it, submit an RSVP, then watch **Catering** update.
6. **Website**: tap *Punjabi shaadi*, then type *"sangeet 8 baje kar do"*, *"colour maroon karo"*, *"Hindi mein bhi dikhao"*. Open **Versions** to restore an older version, then **Publish**.

---

## Routes

| Route | What it is |
| --- | --- |
| `app/(dashboard)/page.tsx` → `/` | Control Room: live map, active tasks, helpers, timeline, demo |
| `/tasks` | TanStack task table with status tabs, search, sort, *Mark done* |
| `/tasks/[taskId]` | Waypoints, assignment, activity log, guest message, **Replay trip** |
| `/guests` | Guests table (search + filters), Catering cards, Arrivals |
| `/website` | AI invite builder: chat + live preview, versions, publish |
| `/settings` | Location sharing per helper, *Login as*, reset demo |
| `/helper/[helperId]` | Helper's own phone view with incoming task cards |
| `app/(public)/invite/[guestId]` | Personalized public invite + RSVP (EN / हिंदी) |
| `app/api/invite/route.ts` | LLM endpoint (JSON-only), with a rule-based fallback |

## Architecture

```
app/
  (dashboard)/            organizer app (sidebar on desktop, bottom tabs on mobile)
  (public)/invite/        guest-facing invite pages
  api/invite/route.ts     LLM → JSON patch
components/
  ui/                     shadcn/ui primitives
  map/                    Leaflet maps (always loaded via next/dynamic, ssr: false)
  control-room/ tasks/ guests/ invite/ demo/ shell/
stores/useShaadiStore.ts  single Zustand store (persisted to localStorage)
lib/
  data/                   data layer: queries + DataAdapter (swap for Supabase)
  seed.ts                 Lucknow seed data
  taskMachine.ts          task lifecycle state machine
  autoAssign.ts           nearest helper + vehicle
  geo.ts                  haversine, interpolation
  providers/              RideProvider: OwnFleet, MockUber, MockRapido
  invite/                 zod schema, patch merge, rule parser, culture data, LLM client
types/index.ts            domain model
```

- **Client-only rendering for live data.** `StoreHydrator` rehydrates the persisted store after mount and renders the app only on the client. This avoids hydration mismatches from time-based values (last seen, live positions) while keeping pages as server components.
- **Devices vs positions (Traccar style).** Helpers and vehicles are devices; `Position` rows (lat, lng, speed, timestamp, optional `taskId`) form the history. The latest position per device is derived. A device is **stale (grey)** if its last fix is older than 5 minutes. Online helpers send a heartbeat about every 30 s; offline ones go stale.
- **Simulation.** `SimulationEngine` ticks every 2 s. Each in-progress task moves its helper and vehicle one step along `[start → pickup → drop]`, appends positions tagged with the task id (used for the trail and for replay), and logs timeline and activity events at each stage.
- **Status colours:** green = free, yellow = on task, red = unavailable/offline, grey = stale location.

### Task state machine (`lib/taskMachine.ts`)

```
created ──► offered ──► accepted ──► in_progress ──► completed
   │           │  ▲         │             │
   │           ▼  │         └──► canceled ◄┘
   │        declined ──► offered (next helper)
   └──────────► external (Uber / Rapido) ──► completed
```

Only listed transitions are allowed (`canTransition` / `transition`). Every change appends an `ActivityEntry { timestamp, actor, action }`, shown on the task detail page. Helper **availability** (online/offline) is separate from helper **status** (free/busy/unavailable) and from the current assignment.

### Auto-assign algorithm (`lib/autoAssign.ts`)

1. **Candidate helpers:** `availability === "online"`, `status === "free"`, `locationSharing === true`, latest position not stale, no pending offer, not previously declined.
2. **Candidate vehicles:** `status === "free"`, `seats >= peopleCount`, not reserved by another offer.
3. Rank helpers by **haversine distance** to the first waypoint. Pick the nearest helper, then the vehicle that helper already drives if it fits, otherwise the nearest suitable vehicle.
4. Move the task to `offered` and pulse the helper on the map. **Decline** re-runs auto-assign without that helper.
5. If nobody is within **15 km** (or nobody is free), open the *"Koi free nahi hai. Uber ya Rapido se book karein?"* dialog. Bookings go through the `RideProvider` interface (`lib/providers`): `OwnFleetProvider`, `MockUberProvider` and `MockRapidoProvider`, so real APIs can be plugged in later. The task becomes `external`.

#### Real Uber & Rapido (phone ride bridge)

Uber and Rapido have no open public booking API, so `ride-bridge/` (Python + [DroidRun](https://github.com/droidrun/droidrun)) drives the real apps on an Android phone over USB. When `RIDE_BRIDGE_URL` and `RIDE_BRIDGE_TOKEN` are set, the fallback dialog switches from demo rates to live quotes read from the phone, highlights the **Best pick** (`lib/providers/compare.ts`), and books through `BridgeUberProvider` / `BridgeRapidoProvider` (`lib/providers/bridge.ts`). Calls go browser → `/api/rides/*` (server-side, holds the token) → bridge. Booking is a **dry run** (the phone stops on the confirm screen) unless the bridge has `BRIDGE_ALLOW_BOOKING=1` *and* the organizer ticks the confirm box. Setup and safety notes are in [`ride-bridge/README.md`](ride-bridge/README.md).

On acceptance a ready-to-copy guest message appears, e.g. *"Bua ji, Rohit aapko lene aa rahe hain. Gaadi: Innova UP32 AB 1234."*

### Invite builder: JSON config, not generated code

The AI **never writes React or HTML**. One `WeddingConfig` object drives the whole invite site, and five templates (Rajasthani, Punjabi, South Indian, Bengali, Modern) only read from it.

1. The client sends **only the current config and the new request** (no chat history) to `POST /api/invite`.
2. The server calls the LLM with a strict system prompt that requires **JSON only**: `{ patch, summary, reply }`. Code fences are stripped before parsing.
3. The **patch** holds only the changed fields: `palette` and `welcomeMessage` merge key by key, `functions` upsert by id, plus `removeFunctionIds` and `replaceFunctions`.
4. The client merges the patch and validates the result with **zod** (`weddingConfigSchema`). If validation fails, a friendly error is shown and the previous version is kept.
5. Every successful change saves a `ConfigVersion` with a one-line summary. The **Versions** sheet restores any of them.
6. **Publish** copies the draft to `publishedConfig` (`published = true`). `/invite/[guestId]` reads only the published config and shows only the functions that guest is invited to.

**Cultural intelligence:** *Punjabi* suggests chooda, jaago, sangeet and anand karaj; *Bengali* suggests gaye holud, biye and bou bhaat; *South Indian* suggests nalangu and muhurtham. These appear as tappable pills, and every function carries a dress code and a one-line explanation for guests unfamiliar with the ritual. The **offline parser** (`lib/invite/ruleParser.ts`) understands names (*"X aur Y"*), dates (*"12 Dec"*), cities, theme keywords, function names, colour words (*maroon, rani pink, kesari…*), times (*"8 baje"* → 20:00 for evening functions), *"Hindi mein bhi dikhao"*, *"… add karo"* and *"… hatao"*.

### Swapping in Supabase

All reads go through `lib/data` (queries such as `latestPosition`, `cateringSummary`, `getSavedPlaces`) and the store's actions. To use a real backend, implement `DataAdapter` in `lib/data/index.ts` and replace the `persist` storage in `stores/useShaadiStore.ts` (or call Supabase inside the actions). The components do not change.

---

## Credits & inspiration

Architecture and UX ideas were learned from these open-source projects. No code was copied from AGPL or GPL projects; everything here is original.

| Project | License | What we learned |
| --- | --- | --- |
| [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) | MIT | App Router route groups, colocated feature components, shadcn Form + zod, TanStack tables, Sonner toasts |
| [arhamkhnz/next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) | MIT | Sidebar dashboard layout, theme-variable driven shadcn styling |
| [Fleetbase / Fleet-Ops](https://github.com/fleetbase/fleetops) | AGPL-3.0 (concepts only) | Order lifecycle state machine, driver availability separate from assignment, per-order activity log, waypoints, dispatcher console layout |
| [Traccar web (traccar-web)](https://github.com/traccar/traccar-web) | Apache-2.0 | Device vs position model, latest-position derivation, last-seen and stale states, trails and trip replay |
| [Nutlope/llamacoder](https://github.com/Nutlope/llamacoder) | MIT | Chat panel + live preview, sending current state instead of full history, single component library |
| [firecrawl/open-lovable](https://github.com/firecrawl/open-lovable) | MIT | Versioned edits with restore, small patches instead of full regeneration |
| [amangandotra/SmartCab-AI](https://github.com/amangandotra/SmartCab-AI) | no license (concept only) | Driving the real Uber/Ola/Rapido apps with DroidRun to read fares and book |
| Small open-source Next.js wedding sites | various (MIT) | One config object drives the site, guest personalization via route, zod-validated RSVP |

Also built with [Next.js](https://nextjs.org), [shadcn/ui](https://ui.shadcn.com), [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org), [OpenStreetMap](https://www.openstreetmap.org/copyright) tiles, [Zustand](https://zustand.docs.pmnd.rs), [TanStack Table](https://tanstack.com/table), [react-hook-form](https://react-hook-form.com), [zod](https://zod.dev), [lucide](https://lucide.dev) and [Sonner](https://sonner.emilkowal.ski).

> Shubh Vivah! 🙏

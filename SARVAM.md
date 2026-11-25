# Sarvam AI in Shaadi OS: problems we hit and how we solved them

Shaadi OS runs wedding logistics (pickups, errands, helpers) for Indian families. The family talks in a WhatsApp group: in Hinglish, in Hindi script, in voice notes, and rarely the way a form expects. Sarvam is what lets the bot understand them and answer back in their own language.

## The flow

```
WhatsApp group ──► wa-bridge (Baileys) ──► Shaadi OS dashboard tab
   text / voice / location            │
                                       ├─ voice note ──► Sarvam speech-to-text (saaras:v4, mode=translate) ──► English text + spoken language
                                       ├─ any request ─► Sarvam chat (sarvam-105b) ──► {from, to, time, people, errand}
                                       │                    └─ each place ──► saved places, else OpenStreetMap ──► lat/lng
                                       ├─ task "#7" posted in the group; first "take 7" gets it (@tagged)
                                       └─ reply ──► English (keeps @tags and commands)
                                                    + Sarvam translate (sarvam-translate:v1) into the sender's language
                                                    + Sarvam text-to-speech (bulbul:v3, mp3) voice note, for voice-note senders
Guest invite page ──► Sarvam translate ──► the whole invite in 22 Indian languages
```

## Problems and fixes

### 1. The bot only knew five places
**Problem.** The first parser was rule-based: regexes for Charbagh, airport, Gomti Nagar station, Chappan Bhog and home. "Mausi ko Hazratganj se laana hai" or "sabzi laani h" got no answer, and real families name hundreds of places.

**Fix.** Every request now goes to Sarvam chat (`sarvam-105b`), which returns JSON: `{from, to, time, people, errand}`, with places written "as a local would type them in a map search". Each place is resolved in two steps: our saved places first (exact coordinates), then OpenStreetMap Nominatim, biased to the wedding city. Tested:

| Message | Result |
|---|---|
| `Mausi ko Hazratganj se laana hai 6 baje, 2 log` | Pickup Hazratganj → Home, 18:00, 2 people |
| `मामा जी को अमौसी एयरपोर्ट से लाना है कल सुबह 10 बजे` | Pickup Lucknow Airport → Home, tomorrow 10:00; reply language `hi-IN` |
| `Sabzi laani h` | Errand Aminabad → Home |
| `ok thik hai bhai` | Not a task: no reply, no task |

### 2. "Sabzi laani h" has no place at all
**Problem.** At first the model answered `from: "sabzi mandi"`. That is a kind of place, not a place, so the map lookup found nothing.

**Fix.** The prompt now says: for a shopping errand with no shop named, choose "a real, well-known market for that item in the wedding city (a name findable on OpenStreetMap)", and it is told the city. It now picks Aminabad. If a place still can't be found, the bot replies in the group: *"Couldn't find X on the map. Please add the area."* It no longer stays silent.

### 3. Hindi-script messages broke the parser
**Problem.** The regex parser only reads Latin text, so Devanagari messages fell through.

**Fix.** Sarvam chat reads any script. For non-Latin text, Sarvam language identification (`/text-lid`) runs in parallel to detect the sender's language, so the reply can be in that language.

### 4. Voice notes: most of the family won't type
**Problem.** Nani and Bua ji send voice notes, which a text bot can't read.

**Fix.** The bridge downloads WhatsApp voice notes (OGG/Opus, which Sarvam accepts as is) and keeps the last 20 in memory only. Sarvam speech-to-text runs with `model: saaras:v4, mode: translate`, which returns **English** text plus the **spoken language** in one call. The English text goes through the same pipeline as typed text. The task title keeps a 🎙️ so the organizer can see it came from a voice note.
- Limit: the sync API accepts up to 30 seconds of audio. Longer notes would need Sarvam's batch API.

### 5. Replying in the sender's language without breaking the group
**Problem.** Translating the bot's message would also translate `@919…` tags and command words like `take 7`, and then the claim flow breaks.

**Fix.** The bot sends two messages. First the English message, which keeps the @tags and `*take 7*` intact. Then a translated copy with tags and markdown removed (Sarvam `sarvam-translate:v1`). If the sender used a voice note, the bot also sends a spoken reply: Sarvam TTS `bulbul:v3` with `output_audio_codec: "mp3"`. We verified it returns valid MP3. We use MP3 because the opus codec fails at the default 22,050 Hz sample rate.

### 6. Translating the invite website into 22 languages
**Problem.** The invite has six templates, each with its own hardcoded strings. Adding 22 languages to each template means thousands of strings.

**Fix.** The invite is translated in the page itself, the way a browser translator works. A hook walks the visible text nodes, sends unique strings to `/api/translate` in batches, and swaps them in. A `MutationObserver` translates text rendered later, such as the RSVP steps. Several strings are packed into one Sarvam call, split on newlines; if the line count doesn't match, each string is translated on its own. Results are cached on the server, so each page costs credits once per language.
- `/api/translate` is public, because guests aren't signed in. It caps the input (150 strings, 12k characters), rate-limits by IP (20 requests per minute), and is behind a Flagsmith flag.

### 7. LLM reasoning text leaking into answers
**Problem.** Reasoning models can add a "thinking" preamble before the answer.

**Fix.** We send `reasoning_effort: null` (which turns thinking off for `sarvam-105b`), keep only the last line for plain-text answers, and use a tolerant JSON parser for the structured ones.

### 8. Sarvam down or out of credits
Every Sarvam call is optional. With no key, with the flag off, or on an error, the bot falls back to the offline rule parser and plain English replies. The wedding doesn't stop because an API is down.

## Non-Sarvam problems we hit on the way (WhatsApp)

| Problem | Cause | Fix |
|---|---|---|
| The QR code needed manual terminal setup | The bridge was a separate process with its own token | `instrumentation.ts` starts the bridge with `npm run dev`, installs it on first run, keeps the token in a git-ignored `wa-bridge/.token`, and restarts the bridge if it crashes |
| The bridge never started | The dev server was running from another copy of the repo that didn't have the auto-start | Run the dev server from the repo that has the auto-start (`~/Desktop/repos/shaadi-os`) |
| Group messages were silently dropped | After a reconnect, WhatsApp delivers the waiting messages before the bridge has found the group, so they were treated as "other chat" | When a group message arrives, the bridge checks that group's own details directly. It saves the group ID to `auth/group.json` |
| The group was never found | `groupFetchAllParticipating()` sometimes hangs | 10–20 s timeouts, retries on connect, the saved group ID, and the per-message check above |
| Invite link showed `.../undefined` | `groupInviteCode` returned nothing (not admin, or not synced yet) | Show the join QR only when a code actually comes back |
| A message older than 60 s was lost after a reconnect | The "skip old history" cutoff was reset on every reconnect | The cutoff is now the bridge process start time |
| Hard to debug | No visibility into what the bridge received | `GET /debug` lists the last 30 messages and why each one was accepted or skipped (no message text is kept) |

## Live location: everyone on the map at once
Helpers share their **live location** in the WhatsApp group (Attach → Location → Share live location). A one-time location pin works the same way. The bridge keeps the latest position per person, and the dashboard turns each one into a helper dot on the map, adding new people as helpers. Helpers with real GPS are never moved by the simulator; their real position is used instead.
- Not yet verified on a real phone: how often WhatsApp sends live-location updates to a linked device. If only the first pin arrives, ask helpers to re-share, or add Baileys' `messages.update` events.

## Feature flags (Flagsmith)
Each Sarvam feature has its own switch: `whatsapp_voice_notes`, `whatsapp_native_replies`, `ai_understanding`, `invite_translation`. Turning one off in Flagsmith takes effect within about 5 seconds without a redeploy, and Settings → Feature flags shows the live state.

## Setup
```
# .env.local
SARVAM_API_KEY=...            # dashboard.sarvam.ai
FLAGSMITH_ENVIRONMENT_KEY=... # optional; without it every feature is on
```

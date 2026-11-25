# Flagsmith in Shaadi OS

Shaadi OS has features that can go wrong in front of a real wedding: a bot posting to a family WhatsApp group, AI reading voice notes, real Uber/Rapido bookings that spend money. Flagsmith gives each of them an on/off switch that takes effect in seconds without a redeploy. It also runs an A/B test on the landing page headline.

## Setup (already done for this project)

| | |
|---|---|
| Organisation | `personal` |
| Project | **Shaadi OS** (id `56043`) |
| Environments | **Development** (key `4FFuscbcJNT4V9Z8ojAFPS`), **Production** (key `CwHLcJTzqCN722CcXTMNMh`) |
| App config | `.env.local` → `FLAGSMITH_ENVIRONMENT_KEY=<environment key>` |

Environment keys are **client-side keys**. Flagsmith documents them as safe to expose, like a Google Analytics ID. The admin API token used to create the project is **not** stored in the repo or the app.

The project, both environments and every flag below were created through the Flagsmith Admin API (`POST /projects/`, `/environments/`, `/projects/{id}/features/`).

## The flags

| Flag | Type | Default | What turning it off does |
|---|---|---|---|
| `whatsapp_group_mode` | boolean | on | The bot ignores the group. Tasks from the self-chat and the dashboard are auto-assigned again. |
| `whatsapp_voice_notes` | boolean | on | Voice notes aren't transcribed (no Sarvam speech-to-text). |
| `whatsapp_native_replies` | boolean | on | Replies are English only (no Sarvam translation or voice). |
| `ai_understanding` | boolean | on | Only the offline rule parser is used (5 known places). |
| `invite_translation` | boolean | on | The 22-language picker disappears from guest invites, and `/api/translate` returns 403. |
| `real_rides` | boolean | on | Quotes and bookings through the phone bridge are refused, and the app shows demo rates. |
| `landing_headline` | multivariate | 50 / 50 | The A/B test on the `/welcome` headline (see below). |

## How it is wired

```
lib/flags.ts                    the only Flagsmith client (server-only, plain fetch, no SDK)
 ├─ getFlags()                  GET https://edge.api.flagsmith.com/api/v1/flags/      (cached 5 s)
 ├─ flag(name)                  one boolean, used by API routes
 └─ variantFor(name, visitor)   GET .../identities/?identifier=<visitor>   (A/B assignment, not cached)

app/api/flags                   → Settings "Feature flags" card (polls every 5 s)
app/api/whatsapp/*              → whatsapp_group_mode, whatsapp_voice_notes, whatsapp_native_replies, ai_understanding
app/api/translate               → invite_translation
app/api/rides/*                 → real_rides
app/welcome/page.tsx + proxy.ts → landing_headline
```

- **Checks run on the server.** Each API route checks its flag itself, so switching a flag off really turns the feature off; it doesn't just hide a button.
- **It fails open.** With no key, Flagsmith unreachable (3 s timeout), or a flag missing, the defaults above apply. A Flagsmith outage never breaks the wedding.
- **The cache is short on purpose.** The 5 s cache keeps API calls low, and a flip still shows up in a few seconds. Flagsmith recommends caching environment flags and not caching identity flags, which is what we do.

### A/B test: landing headline
1. `proxy.ts` gives every `/welcome` visitor a random, stable `sos_vid` cookie (httpOnly, 180 days). The page can see it on the very first visit.
2. `app/welcome/page.tsx` asks Flagsmith for that visitor's flags (`/identities/?identifier=<sos_vid>`).
3. Flagsmith assigns the variant by percentage split. An empty value is the control (the original "Fufa ki narazgi…" headline). The variant shows *"Bua ji station pe wait nahi karengi. Shaadi OS sab sambhal lega."*
4. Because the visitor ID is stable, a visitor always sees the same headline. Change the split, or add variants, in Flagsmith → `landing_headline`.

We checked it against the real API with six test identities: one was given the variant and the others the control.

## Verified live
With the app running, we switched `invite_translation` off through Flagsmith's versioning API. The app's `/api/translate` reported `enabled:false` **5 seconds** later and came back 2 seconds after we switched it back on. We changed nothing in the app.

> This project uses **v2 feature versioning**. To change a flag through the API, publish a new version: `POST /api/v1/environments/<env id>/features/<feature id>/versions/` with `{"publish_immediately": true, "feature_states_to_update": [{"feature_segment": null, "enabled": false, "feature_state_value": {"type": "unicode", "string_value": null}}]}`. The old `PATCH featurestates` endpoint returns 400. In the dashboard it's just the toggle.

## Demo script (on stage)
1. Open **Settings → Feature flags**. The badge shows "Flagsmith live" and lists every flag as On.
2. In Flagsmith, switch off `whatsapp_native_replies`. Within about 5 s the card shows Off, and the next Hindi message in the group gets an English-only reply.
3. Switch off `real_rides`. The fallback dialog now shows demo rates, and no real cab can be booked by accident.
4. Open `/welcome` in two private windows. Some visitors see the A/B headline.

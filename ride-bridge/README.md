# Shaadi OS ride bridge (real Uber + Rapido)

Uber and Rapido don't offer an open public API for booking rides. Uber's ride
API is limited to approved partners, and Rapido has none. So this bridge does
what a person does: it **drives the real Uber and Rapido apps on an Android
phone** plugged into your laptop, using [DroidRun](https://github.com/droidrun/droidrun)
(an LLM agent that sees the screen and taps for you).

Idea credit: [amangandotra/SmartCab-AI](https://github.com/amangandotra/SmartCab-AI) showed this approach
with DroidRun + Gemini. That repo has no license, so no code was copied; this bridge is an original
implementation with typed structured output, a token, a phone lock and a dry-run safety switch.

```
Shaadi OS (browser) ──► /api/rides/* (Next.js, holds the token) ──► ride-bridge (this, on your laptop)
                                                                        │  DroidRun + adb
                                                                        ▼
                                                              Android phone: Uber / Rapido apps
```

## What it does

| Endpoint | What happens on the phone |
| --- | --- |
| `GET /health` | Nothing. Reports mode (`phone` / `mock`), whether booking is allowed, and whether the phone is busy. |
| `POST /quote` | Opens the app, fills pickup + drop, **reads** every car option (product, fare, ETA), goes home. Never taps Book. |
| `POST /book` | Opens the app, picks the cheapest car with enough seats, then **stops on the confirm screen** (dry run) or, only if `BRIDGE_ALLOW_BOOKING=1` **and** the organizer ticked the confirm box, taps Book and reads the driver details. |

Shaadi OS compares the quotes (cheapest fare; if fares are within 8%, the faster pickup) and marks a **Best pick**.

## Setup

1. **Phone**: enable Developer options → USB debugging. Install and log in to Uber and Rapido.
   Install the DroidRun Portal app (see DroidRun's docs). Keep the phone unlocked.
2. **Laptop**: install [adb](https://developer.android.com/tools/adb), plug in the phone, and check that `adb devices` lists it.
3. **Bridge**:
   ```bash
   cd shaadi-os/ride-bridge
   python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env            # then edit: BRIDGE_TOKEN, GOOGLE_API_KEY
   set -a; source .env; set +a     # Windows: set each variable with `set`
   uvicorn server:app --host 127.0.0.1 --port 8787
   ```
4. **Shaadi OS**: add to `shaadi-os/.env.local` and restart `npm run dev`:
   ```
   RIDE_BRIDGE_URL=http://127.0.0.1:8787
   RIDE_BRIDGE_TOKEN=<same as BRIDGE_TOKEN>
   ```
5. Open a task → **Uber / Rapido**. The dialog badge shows **Live · your phone**.

Try it without a phone first: `BRIDGE_MOCK=1` returns sample fares and bookings through the same code path.

## Safety

- **Dry run by default.** With `BRIDGE_ALLOW_BOOKING=0` the agent is told to stop on the confirm screen and never tap Book.
- **Two keys for a real ride.** Booking needs `BRIDGE_ALLOW_BOOKING=1` on the bridge **and** the organizer ticking "Yes, book a real cab" in the dialog.
- The agent is told not to change the payment method or add tips or extras. Still, **test with a wallet balance of 0 or a test account first**, and watch the phone.
- The token never reaches the browser; only the Next.js server talks to the bridge. Keep the bridge on `127.0.0.1` unless you add your own TLS.
- One phone does one thing at a time (a lock), so quotes are fetched one app after another (about 1–2 minutes each).
- UI automation depends on the apps' current screens. If Uber or Rapido change their UI, the agent may need a few more steps, or may fail and report an error instead of guessing.

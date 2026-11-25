"""
Shaadi OS ride bridge.

Uber and Rapido do not offer an open public booking API, so this bridge does
what a person would do: it drives the real Uber / Rapido apps on an Android
phone connected over USB (adb), using the DroidRun agent to read fares and,
only when explicitly allowed, to book.

Run:  uvicorn server:app --host 0.0.0.0 --port 8787
"""

from __future__ import annotations

import asyncio
import os
import random
import secrets
import time
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

Provider = Literal["uber", "rapido"]

APP_NAMES = {"uber": "Uber", "rapido": "Rapido"}
# Product names per seat requirement, used to steer the agent.
PRODUCT_HINTS = {
    "uber": {"small": "Uber Go / Go Sedan / Premier", "large": "Uber XL"},
    "rapido": {"small": "Cab Economy / Cab Priority", "large": "Cab XL"},
}

TOKEN = os.getenv("BRIDGE_TOKEN", "")
ALLOW_BOOKING = os.getenv("BRIDGE_ALLOW_BOOKING", "0") == "1"
MOCK = os.getenv("BRIDGE_MOCK", "0") == "1"
SERIAL = os.getenv("ANDROID_SERIAL") or None
QUOTE_TIMEOUT_S = int(os.getenv("BRIDGE_QUOTE_TIMEOUT", "240"))
BOOK_TIMEOUT_S = int(os.getenv("BRIDGE_BOOK_TIMEOUT", "300"))

app = FastAPI(title="Shaadi OS ride bridge", version="1.0")

# One phone can only do one thing at a time.
phone_lock = asyncio.Lock()


# ----------------------------------------------------------------- models


class Place(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    lat: Optional[float] = None
    lng: Optional[float] = None


class QuoteRequest(BaseModel):
    provider: Provider
    pickup: Place
    drop: Place
    peopleCount: int = Field(ge=1, le=20)


class BookRequest(QuoteRequest):
    product: Optional[str] = Field(default=None, max_length=80)
    confirm: bool = False


class RideOption(BaseModel):
    """One fare row as shown in the app."""

    product: str = Field(description="Ride product name exactly as shown, e.g. 'Uber Go' or 'Cab Economy'")
    fare: float = Field(description="Fare in INR as a number, without the rupee sign")
    eta_minutes: int = Field(description="Minutes until pickup as shown on the screen")
    seats: Optional[int] = Field(default=None, description="Seat capacity if the app shows it")


class FareScreen(BaseModel):
    """Structured output the agent must return after reading the fare screen."""

    options: list[RideOption]


class BookingScreen(BaseModel):
    """Structured output after booking (or after stopping at the confirm screen)."""

    status: Literal["booked", "searching", "ready_to_confirm", "failed"]
    product: Optional[str] = None
    fare: Optional[float] = None
    eta_minutes: Optional[int] = None
    driver_name: Optional[str] = None
    car: Optional[str] = None
    plate: Optional[str] = None
    note: Optional[str] = None


# ----------------------------------------------------------------- auth


def require_token(x_bridge_token: str = Header(default="")) -> None:
    if not TOKEN:
        raise HTTPException(500, "BRIDGE_TOKEN is not set on the bridge")
    if not secrets.compare_digest(x_bridge_token, TOKEN):
        raise HTTPException(401, "Bad bridge token")


# ----------------------------------------------------------------- agent


def seat_class(people: int) -> str:
    return "large" if people > 4 else "small"


def quote_goal(req: QuoteRequest) -> str:
    app_name = APP_NAMES[req.provider]
    return f"""
Open the {app_name} app.
Set the pickup location to "{req.pickup.label}" and the destination to "{req.drop.label}".
If they are already filled in, check them and correct them if they are wrong.
Wait until the list of ride options with prices is visible.
Scroll the options list so every car option has been seen. Ignore bike and auto options.
Read every car option: product name, fare in rupees, and minutes until pickup.
Do NOT tap any Book, Confirm or Request button. Only read the screen.
When done, go back to the Android home screen and finish with the options you read.
""".strip()


def book_goal(req: BookRequest, really_book: bool) -> str:
    app_name = APP_NAMES[req.provider]
    hint = req.product or PRODUCT_HINTS[req.provider][seat_class(req.peopleCount)]
    final = (
        "Tap the Book / Confirm / Request button once to request the ride. Wait until the app shows "
        "that a driver is being searched or has been assigned, then read the driver name, car, "
        "number plate and pickup time if shown."
        if really_book
        else "STOP on the confirm screen. Do NOT tap Book, Confirm or Request. Read the selected "
        "product, fare and pickup time and finish."
    )
    return f"""
Open the {app_name} app.
Set the pickup location to "{req.pickup.label}" and the destination to "{req.drop.label}".
If they are already filled in, check them and correct them if they are wrong.
The ride is for {req.peopleCount} people, so choose a car with enough seats.
Choose the cheapest option among: {hint}.
Do not change the payment method and do not add tips, insurance or any other extras.
{final}
""".strip()


async def run_agent(goal: str, output_model: type[BaseModel], timeout_s: int) -> BaseModel:
    # Imported lazily so mock mode works without droidrun installed.
    from droidrun import DroidAgent, DroidrunConfig

    config = DroidrunConfig()
    if SERIAL:
        config.device.serial = SERIAL
    agent = DroidAgent(goal=goal, config=config, output_model=output_model, timeout=timeout_s)
    result = await asyncio.wait_for(agent.run(), timeout=timeout_s + 30)
    if not result.success:
        raise HTTPException(502, f"Phone agent could not finish: {result.reason[:300]}")
    if result.structured_output is None:
        raise HTTPException(502, "Phone agent finished but returned no structured data")
    return result.structured_output


# ----------------------------------------------------------------- mock data


def mock_fares(req: QuoteRequest) -> FareScreen:
    base = 220 if req.provider == "rapido" else 280
    large = seat_class(req.peopleCount) == "large"
    names = {
        "uber": ["Uber Go", "Go Sedan", "Uber XL"],
        "rapido": ["Cab Economy", "Cab Priority", "Cab XL"],
    }[req.provider]
    opts = [
        RideOption(product=names[0], fare=base + random.randint(0, 60), eta_minutes=random.randint(3, 9), seats=4),
        RideOption(product=names[1], fare=base + 70 + random.randint(0, 60), eta_minutes=random.randint(3, 9), seats=4),
        RideOption(product=names[2], fare=base + 160 + random.randint(0, 80), eta_minutes=random.randint(5, 12), seats=6),
    ]
    return FareScreen(options=[o for o in opts if not large or (o.seats or 4) >= req.peopleCount])


# ----------------------------------------------------------------- routes


@app.get("/health")
async def health(_: None = Depends(require_token)):
    return {
        "ok": True,
        "mode": "mock" if MOCK else "phone",
        "allowBooking": ALLOW_BOOKING,
        "busy": phone_lock.locked(),
        "providers": list(APP_NAMES),
    }


@app.post("/quote")
async def quote(req: QuoteRequest, _: None = Depends(require_token)):
    started = time.time()
    if MOCK:
        await asyncio.sleep(1.2)
        screen = mock_fares(req)
    else:
        async with phone_lock:
            screen = await run_agent(quote_goal(req), FareScreen, QUOTE_TIMEOUT_S)
    options = [o for o in screen.options if o.fare > 0]
    if not options:
        raise HTTPException(502, "No car options were read from the app")
    fitting = [o for o in options if (o.seats or (6 if "xl" in o.product.lower() else 4)) >= req.peopleCount] or options
    best = min(fitting, key=lambda o: (o.fare, o.eta_minutes))
    return {
        "provider": req.provider,
        "options": [o.model_dump() for o in options],
        "best": best.model_dump(),
        "seconds": round(time.time() - started, 1),
        "mode": "mock" if MOCK else "phone",
    }


@app.post("/book")
async def book(req: BookRequest, _: None = Depends(require_token)):
    really_book = ALLOW_BOOKING and req.confirm
    if MOCK:
        await asyncio.sleep(1.5)
        fares = mock_fares(req).options
        o = next((x for x in fares if req.product and x.product == req.product), fares[0])
        screen = BookingScreen(
            status="booked" if really_book else "ready_to_confirm",
            product=o.product,
            fare=o.fare,
            eta_minutes=o.eta_minutes,
            driver_name=random.choice(["Mohd. Salim", "Rajesh Yadav", "Sunil Kumar", "Deepak Pal"]) if really_book else None,
            car="Maruti Dzire" if really_book else None,
            plate=f"UP32 {random.choice('ABCDEFGH')}{random.choice('JKLMNPQR')} {random.randint(1000, 9999)}" if really_book else None,
        )
    else:
        async with phone_lock:
            screen = await run_agent(book_goal(req, really_book), BookingScreen, BOOK_TIMEOUT_S)
    return {
        "provider": req.provider,
        "dryRun": not really_book,
        "booking": screen.model_dump(),
        "mode": "mock" if MOCK else "phone",
    }

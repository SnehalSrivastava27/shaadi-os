"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import type { Arrival, Guest } from "@/types";
import type { Lang } from "@/lib/invite/i18n";
import { PLACES } from "@/lib/seed";
import { useShaadiStore } from "@/stores/useShaadiStore";

type How = "train" | "flight" | "car";

const T = {
  en: {
    q: "Will you be there?",
    yes: "Yes, we're coming",
    no: "Sorry, can't make it",
    count: "How many of you?",
    how: "How are you getting here?",
    train: "Train",
    flight: "Flight",
    car: "Own car",
    station: "Which station?",
    when: "Arriving on",
    pickup: "We'll send someone to pick you up.",
    send: "Send RSVP",
    thanksYes: "See you there!",
    thanksNo: "We'll miss you. Thank you for letting us know.",
    edit: "Change",
  },
  hi: {
    q: "क्या आप आ रहे हैं?",
    yes: "हाँ, ज़रूर",
    no: "माफ़ कीजिए, नहीं",
    count: "कितने लोग?",
    how: "कैसे आ रहे हैं?",
    train: "ट्रेन",
    flight: "फ़्लाइट",
    car: "अपनी गाड़ी",
    station: "कौन सा स्टेशन?",
    when: "पहुँचने का समय",
    pickup: "हम आपको लेने किसी को भेज देंगे।",
    send: "जवाब भेजें",
    thanksYes: "मिलते हैं!",
    thanksNo: "आपकी कमी खलेगी। बताने के लिए धन्यवाद।",
    edit: "बदलें",
  },
} as const;

const STATIONS = [PLACES.charbagh, PLACES.gomtiNagarStation];

/** One RSVP for the whole invite: coming or not, how many, and how they travel (train/flight arrivals become pickups). */
export function FinalRsvp({ guest, lang, color, defaultTime }: { guest: Guest; lang: Lang; color: string; defaultTime: string }) {
  const t = T[lang];
  const submitRsvp = useShaadiStore((s) => s.submitRsvp);
  const answered = guest.rsvps.find((r) => r.status !== "pending");
  const [coming, setComing] = useState<boolean | null>(answered ? answered.status === "yes" : null);
  const [count, setCount] = useState(Math.max(1, answered?.headcount ?? 1));
  const [how, setHow] = useState<How>(guest.arrival?.mode === "flight" ? "flight" : guest.arrival ? "train" : "car");
  const [station, setStation] = useState(STATIONS.find((s) => s.label === guest.arrival?.place) ?? STATIONS[0]);
  const [when, setWhen] = useState(guest.arrival?.time.slice(0, 16) ?? defaultTime);
  const [done, setDone] = useState(!!answered);

  const send = () => {
    if (coming === null) return;
    const status = coming ? "yes" : "no";
    const rsvps = guest.invitedFunctionIds.map((functionId) => ({
      functionId,
      status,
      headcount: coming ? count : 0,
      food: guest.rsvps.find((r) => r.functionId === functionId)?.food ?? ("veg" as const),
    })) as Guest["rsvps"];
    const place = how === "flight" ? PLACES.airport : station;
    const arrival: Arrival | null =
      coming && how !== "car" && when ? { mode: how, place: place.label, lat: place.lat, lng: place.lng, time: `${when}:00+05:30` } : null;
    submitRsvp(guest.id, rsvps, arrival);
    setDone(true);
    toast.success(coming ? t.thanksYes : t.thanksNo);
  };

  const chip = (on: boolean) => ({
    className: `rounded-full border px-4 py-2 font-sans text-[13px] font-semibold transition ${on ? "text-white shadow-md" : "bg-white/80 hover:bg-white"}`,
    style: on ? { background: color, borderColor: color } : { borderColor: `${color}55`, color },
  });

  if (done && coming !== null)
    return (
      <div className="mx-auto w-full max-w-sm rounded-3xl border bg-white/70 p-6 text-center shadow-[0_18px_40px_-24px_rgba(90,60,10,0.7)]" style={{ borderColor: `${color}33` }}>
        <CheckCircle2 className="mx-auto size-10" style={{ color }} />
        <p className="mt-3 text-2xl font-semibold" style={{ color }}>
          {coming ? t.thanksYes : t.thanksNo}
        </p>
        {coming && (
          <p className="mt-1 font-sans text-sm opacity-75">
            {count} · {how === "car" ? t.car : `${how === "flight" ? t.flight : t.train}, ${new Date(`${when}:00+05:30`).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}
          </p>
        )}
        <button type="button" onClick={() => setDone(false)} className="mt-4 font-sans text-xs font-semibold underline opacity-70 hover:opacity-100">
          {t.edit}
        </button>
      </div>
    );

  return (
    <div className="mx-auto grid w-full max-w-sm gap-5 rounded-3xl border bg-white/70 p-6 text-left shadow-[0_18px_40px_-24px_rgba(90,60,10,0.7)]" style={{ borderColor: `${color}33` }}>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" {...chip(coming === true)} onClick={() => setComing(true)}>
          {t.yes}
        </button>
        <button type="button" {...chip(coming === false)} onClick={() => setComing(false)}>
          {t.no}
        </button>
      </div>

      {coming && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-sm font-semibold">{t.count}</p>
            <div className="flex items-center gap-3 rounded-full border bg-white px-2 py-1" style={{ borderColor: `${color}44` }}>
              <button type="button" aria-label="One less" onClick={() => setCount((c) => Math.max(1, c - 1))} className="rounded-full p-1.5 hover:bg-black/5" style={{ color }}>
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center text-2xl font-semibold tabular-nums" style={{ color }}>
                {count}
              </span>
              <button type="button" aria-label="One more" onClick={() => setCount((c) => Math.min(20, c + 1))} className="rounded-full p-1.5 hover:bg-black/5" style={{ color }}>
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <p className="font-sans text-sm font-semibold">{t.how}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["train", "flight", "car"] as const).map((h) => (
                <button key={h} type="button" {...chip(how === h)} onClick={() => setHow(h)}>
                  {{ train: "🚆 ", flight: "✈️ ", car: "🚗 " }[h]}
                  {t[h]}
                </button>
              ))}
            </div>
          </div>

          {how === "train" && (
            <div>
              <p className="font-sans text-sm font-semibold">{t.station}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATIONS.map((s) => (
                  <button key={s.id} type="button" {...chip(station.id === s.id)} onClick={() => setStation(s)}>
                    {s.label.replace(" Railway Station", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {how !== "car" && (
            <label className="grid gap-1.5 font-sans text-sm font-semibold">
              {t.when}
              <input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className="h-11 rounded-xl border bg-white px-3 font-normal" style={{ borderColor: `${color}44` }} />
              <span className="text-xs font-normal opacity-70">{t.pickup}</span>
            </label>
          )}
        </>
      )}

      <button
        type="button"
        disabled={coming === null || (coming && how !== "car" && !when)}
        onClick={send}
        className="h-12 rounded-full font-sans text-sm font-semibold tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40"
        style={{ background: color }}
      >
        {t.send}
      </button>
    </div>
  );
}

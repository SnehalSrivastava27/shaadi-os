"use client";

import { useEffect, useRef, useState } from "react";
import { Car, ExternalLink, Loader2, RefreshCw, ShieldAlert, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { externalProviders, getBridgeStatus, pickBest, uberLink, type BridgeStatus, type RideQuote, type RideRequest } from "@/lib/providers";
import type { ExternalProviderName } from "@/types";

type QuoteState = { state: "loading" } | { state: "done"; quote: RideQuote } | { state: "error"; error: string };

const MODE_BADGE: Record<BridgeStatus["mode"], { label: string; variant: "outline" | "busy" | "free" }> = {
  off: { label: "Demo rates", variant: "outline" },
  mock: { label: "Bridge · mock", variant: "busy" },
  phone: { label: "Live · aapka phone", variant: "free" },
};

/** "Koi free nahi hai" dialog: compare Uber / Rapido through the RideProvider interface and book. */
export function FallbackDialog() {
  const fallback = useShaadiStore((s) => s.fallback);
  const task = useShaadiStore((s) => s.tasks.find((t) => t.id === s.fallback?.taskId));
  const openFallback = useShaadiStore((s) => s.openFallback);
  const bookExternal = useShaadiStore((s) => s.bookExternal);
  const dispatchTask = useShaadiStore((s) => s.dispatchTask);
  const addTimeline = useShaadiStore((s) => s.addTimeline);

  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteState>>({});
  const [booking, setBooking] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const run = useRef(0);

  const open = !!fallback && !!task;
  const request: RideRequest | null = task
    ? { taskId: task.id, pickup: task.waypoints[0], drop: task.waypoints[task.waypoints.length - 1], peopleCount: task.peopleCount, time: task.time }
    : null;
  const mode = status?.mode ?? "off";
  const providers = externalProviders(mode);
  const live = mode === "phone";
  const bridged = mode !== "off";
  const needsConfirm = bridged && !!status?.allowBooking;

  const loadQuotes = async (st: BridgeStatus, req: RideRequest) => {
    const id = ++run.current;
    const list = externalProviders(st.mode);
    setQuotes(Object.fromEntries(list.map((p) => [p.id, { state: "loading" } as QuoteState])));
    const fetchOne = async (p: (typeof list)[number]) => {
      try {
        const q = await p.quote(req);
        if (run.current === id) setQuotes((s) => ({ ...s, [p.id]: { state: "done", quote: q } }));
      } catch (e) {
        if (run.current === id) setQuotes((s) => ({ ...s, [p.id]: { state: "error", error: e instanceof Error ? e.message : "Rate nahi mila" } }));
      }
    };
    // A real phone can only open one app at a time.
    if (st.mode === "phone") for (const p of list) await fetchOne(p);
    else await Promise.all(list.map(fetchOne));
  };

  useEffect(() => {
    if (!open || !request) return;
    let cancelled = false;
    setConfirmed(false);
    setStatus(null);
    setQuotes({});
    getBridgeStatus().then((st) => {
      if (cancelled) return;
      setStatus(st);
      loadQuotes(st, request);
    });
    return () => {
      cancelled = true;
      run.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, open]);

  const doneQuotes = Object.values(quotes).flatMap((q) => (q.state === "done" ? [q.quote] : []));
  const best = pickBest(doneQuotes);

  const book = async (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    const q = quotes[providerId];
    if (!provider || !request || !task) return;
    if (needsConfirm && !confirmed) {
      toast.error("Pehle confirm kijiye ki asli cab book karni hai");
      return;
    }
    setBooking(providerId);
    try {
      const res = await provider.book(request, { confirm: needsConfirm && confirmed, product: q?.state === "done" ? q.quote.productName : undefined });
      if (res.kind === "dry-run") {
        addTimeline(`${provider.displayName} dry run: phone confirm screen tak pahuncha (${res.product ?? "cab"}, ₹${res.fare ?? "?"})`, task.id);
        toast.info(`${provider.displayName}: confirm screen tak pahunch gaye`, {
          description: "Dry run: asli booking band hai. ride-bridge mein BRIDGE_ALLOW_BOOKING=1 karke real booking on karein.",
        });
        return;
      }
      const r = bookExternal(task.id, provider.displayName as ExternalProviderName, res.booking);
      if (r.ok)
        toast.success(`${provider.displayName} booked: ${res.booking.driverName}`, {
          description: res.booking.status === "searching" ? "Driver dhoondha ja raha hai" : `${res.booking.plate} · ETA ${res.booking.etaMinutes} min`,
        });
      else toast.error(r.error);
    } catch (e) {
      toast.error(`${provider.displayName} booking fail ho gayi`, { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBooking(null);
    }
  };

  const retry = () => {
    if (!task) return;
    openFallback(null);
    const r = dispatchTask(task.id);
    if (r?.ok) toast.success(`${r.helper.name} ko offer bheja`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && openFallback(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Koi free nahi hai 😟
            {status && <Badge variant={MODE_BADGE[mode].variant}>{MODE_BADGE[mode].label}</Badge>}
          </DialogTitle>
          <DialogDescription>
            {fallback?.reason} <span className="text-foreground font-medium">Uber ya Rapido se book karein?</span>
          </DialogDescription>
        </DialogHeader>
        {task && (
          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="font-medium">{task.title}</p>
            <p className="text-muted-foreground">
              {task.waypoints[0]?.label} → {task.waypoints[task.waypoints.length - 1]?.label} · {task.peopleCount} log
            </p>
          </div>
        )}
        {!status ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Ride bridge check kar rahe hain…
          </p>
        ) : (
          <div className="grid gap-2">
            {providers.map((p) => {
              const q = quotes[p.id];
              const isBest = q?.state === "done" && best?.provider === p.id;
              return (
                <Card key={p.id} className={`flex-row items-center justify-between gap-3 px-4 py-3 ${isBest ? "border-primary ring-primary/20 ring-2" : ""}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${p.id === "uber" ? "bg-black text-white" : "bg-yellow-400 text-black"}`}>
                      <Car className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        {p.displayName} {isBest && <Badge variant="free">Best pick</Badge>}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {!q || q.state === "loading" ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" /> {live ? `Phone pe ${p.displayName} khol ke rate padh rahe hain (1–2 min)…` : "Rate dekh rahe hain…"}
                          </span>
                        ) : q.state === "error" ? (
                          <span className="text-destructive">{q.error}</span>
                        ) : (
                          `${q.quote.productName} · ${q.quote.etaMinutes} min · ~₹${q.quote.fareEstimate}`
                        )}
                      </p>
                      {q?.state === "done" && q.quote.options && q.quote.options.length > 1 && (
                        <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                          Aur: {q.quote.options.filter((o) => o.product !== q.quote.productName).map((o) => `${o.product} ₹${o.fare}`).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                  {p.id === "uber" && request && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={uberLink(request.pickup, request.drop)} target="_blank" rel="noopener noreferrer" title="Uber app mein pickup aur drop bhar ke kholo">
                        <ExternalLink /> Uber app
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => book(p.id)} disabled={!!booking || q?.state !== "done" || (needsConfirm && !confirmed)}>
                    {booking === p.id ? <Loader2 className="animate-spin" /> : null}
                    {bridged && !status.allowBooking ? "Dry run" : "Book"}
                  </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {needsConfirm && (
          <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[#7a1f2b]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>
              <span className="flex items-center gap-1 font-medium">
                <ShieldAlert className="size-4 text-amber-700" /> Haan, asli cab book karo
              </span>
              Phone se real ride request jaayegi aur paise lagenge.
            </span>
          </label>
        )}
        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          {mode === "off" ? (
            <>Demo mode: rates aur booking mock hain. Asli Uber/Rapido ke liye <code>ride-bridge</code> chalaiye (README dekhein).</>
          ) : mode === "mock" ? (
            <>
              Ride bridge connected hai lekin BRIDGE_MOCK=1 hai, isliye sample rates aa rahe hain.
              {!status?.allowBooking && " Dry run mode: booking confirm screen par ruk jaati hai."}
            </>
          ) : (
            <>
              <Smartphone className="mt-0.5 size-3.5 shrink-0" /> Aapke phone par Uber/Rapido apps DroidRun se chal rahe hain.
              {!status?.allowBooking && " Dry run: phone confirm screen par ruk jayega."}
            </>
          )}
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => openFallback(null)}>
            Baad mein
          </Button>
          {status && (
            <Button variant="outline" onClick={() => request && loadQuotes(status, request)} disabled={Object.values(quotes).some((q) => q.state === "loading")}>
              <RefreshCw /> Rates dobara
            </Button>
          )}
          <Button variant="outline" onClick={retry}>
            Dobara auto-assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

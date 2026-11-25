"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, HeartHandshake, KeyRound, Loader2 } from "lucide-react";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { Em, darkPill } from "@/components/website/ui";
import { signIn, signUp, type AuthState } from "./actions";

const input =
  "h-11 w-full rounded-xl border border-[#e5e5e5] bg-white px-3.5 text-[14px] outline-none transition placeholder:text-[#a3a3a3] focus:border-[#161616] focus:ring-4 focus:ring-black/5";

export function LoginForm({ next, initialMode = "in" }: { next: string; initialMode?: "in" | "up" }) {
  const [mode, setMode] = useState<"in" | "up">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, undefined);
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = inPending || upPending;
  const setCurrentUser = useShaadiStore((s) => s.setCurrentUser);
  const router = useRouter();

  // On success the server has set the session cookie; mirror the role into the demo store, then go.
  useEffect(() => {
    const user = state?.user;
    if (!user) return;
    setCurrentUser(user.role === "helper" ? { role: "helper", helperId: user.helperId } : { role: "organizer" });
    router.replace(user.role === "helper" && state.next === "/" ? `/helper/${user.helperId}` : (state.next ?? "/"));
  }, [state, setCurrentUser, router]);

  return (
    <div className="w-full max-w-[400px]">
      <Link href="/welcome" className="mx-auto flex w-fit items-center gap-2 text-[15px] font-bold tracking-tight">
        <HeartHandshake className="size-6 text-[#7a1f2b]" /> Shaadi OS
      </Link>

      <div className="mt-6 rounded-3xl border border-[#ececec] bg-white p-6 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.4)] sm:p-8">
        <h1 className="text-center text-[28px] leading-tight font-semibold tracking-[-0.03em]">
          {mode === "in" ? (
            <>
              Welcome <Em>back</Em>
            </>
          ) : (
            <>
              Start your <Em>shaadi</Em>
            </>
          )}
        </h1>
        <p className="mt-2 text-center text-[14px] text-[#5f5f5f]">
          {mode === "in" ? "Sign in to your wedding command center." : "Create an account to plan pickups, guests and invites."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#f3f3f3] p-1 text-[13px] font-semibold" role="tablist">
          {(["in", "up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-lg py-2 transition ${mode === m ? "bg-white shadow-sm" : "text-[#6b6b6b] hover:text-[#161616]"}`}
            >
              {m === "in" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form action={mode === "in" ? inAction : upAction} className="mt-5 grid gap-3">
          <input type="hidden" name="next" value={next} />
          {mode === "up" && (
            <label className="grid gap-1.5 text-[13px] font-medium">
              Your name
              <input name="name" required autoComplete="name" placeholder="Riya's Papa" className={input} />
            </label>
          )}
          <label className="grid gap-1.5 text-[13px] font-medium">
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          <label className="grid gap-1.5 text-[13px] font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={mode === "up" ? 8 : undefined}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              placeholder={mode === "up" ? "At least 8 characters" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
          </label>
          {state?.error && (
            <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] text-[#b42318]">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className={`${darkPill} mt-1 h-11 w-full justify-center text-[14px]`}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {mode === "in" ? "Sign in" : "Create account"} {!pending && <ArrowRight />}
          </button>
        </form>
      </div>

      {/* Demo credentials, on purpose: anyone can log in and look around. */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#d9d9d9] bg-[#fcfcfc] p-4">
        <p className="flex items-center gap-2 text-[12px] font-semibold tracking-wide text-[#5f5f5f] uppercase">
          <KeyRound className="size-3.5" /> Demo accounts
        </p>
        <ul className="mt-3 grid gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email} className="flex items-center justify-between gap-3 rounded-xl border border-[#ececec] bg-white px-3 py-2.5">
              <div className="min-w-0 text-[12.5px]">
                <p className="font-semibold">
                  {a.label} <span className="font-normal text-[#8a8a8a]">· {a.hint}</span>
                </p>
                <p className="truncate font-mono text-[12px] text-[#5f5f5f]">
                  {a.email} / {a.password}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setEmail(a.email);
                  setPassword(a.password);
                }}
                className="shrink-0 rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-[12px] font-semibold transition hover:bg-[#f7f7f7]"
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

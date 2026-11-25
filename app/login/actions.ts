"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { SESSION_COOKIE, SESSION_MAX_AGE, encodeSession, type SessionUser } from "@/lib/session";

type Account = { user: SessionUser; salt: string; hash: string };

const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString("hex");

function makeAccount(user: SessionUser, password: string): Account {
  const salt = randomBytes(16).toString("hex");
  return { user, salt, hash: hashPassword(password, salt) };
}

// ponytail: in-memory account store, so sign-ups vanish on server restart. Swap for a database before real users.
const store = globalThis as unknown as { __soAccounts?: Map<string, Account> };
const [organizer, helper] = DEMO_ACCOUNTS;
const accounts = (store.__soAccounts ??= new Map([
  [organizer.email, makeAccount({ email: organizer.email, name: "Riya's Papa", role: "organizer" }, organizer.password)],
  [helper.email, makeAccount({ email: helper.email, name: "Rohit Bhaiya", role: "helper", helperId: "h-rohit" }, helper.password)],
]));

export type AuthState = { error?: string; user?: SessionUser; next?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");

async function startSession(user: SessionUser) {
  (await cookies()).set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

const signInSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")), password: z.string().min(1, "Enter your password").max(200) });
const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, "Enter your name").max(60),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const acc = accounts.get(parsed.data.email);
  // Hash even for unknown emails so response time doesn't reveal which accounts exist.
  const hash = Buffer.from(hashPassword(parsed.data.password, acc?.salt ?? "no-such-user"), "hex");
  if (!acc || !timingSafeEqual(hash, Buffer.from(acc.hash, "hex"))) return { error: "Wrong email or password" };
  await startSession(acc.user);
  return { user: acc.user, next: safeNext(form.get("next")) };
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (accounts.has(parsed.data.email)) return { error: "An account with this email already exists. Sign in instead." };
  const user: SessionUser = { email: parsed.data.email, name: parsed.data.name, role: "organizer" };
  accounts.set(user.email, makeAccount(user, parsed.data.password));
  await startSession(user);
  return { user, next: safeNext(form.get("next")) };
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

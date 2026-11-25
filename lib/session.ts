import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Signed session cookie: base64url(JSON payload) + "." + HMAC-SHA256. Used by proxy.ts and the login actions.

export const SESSION_COOKIE = "so_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = { email: string; name: string; role: "organizer" } | { email: string; name: string; role: "helper"; helperId: string };
type Payload = SessionUser & { exp: number };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (32+ chars) must be set in production");
  return "dev-only-shaadi-os-session-secret-change-me"; // ponytail: fixed dev secret; set SESSION_SECRET for any real deploy
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function encodeSession(user: SessionUser): string {
  const data = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 } satisfies Payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [data, mac] = token.split(".");
  if (!data || !mac) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return p; // extra `exp` field is harmless
  } catch {
    return null;
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

const VISITOR_COOKIE = "sos_vid";

/** Landing page A/B test (Flagsmith): give each visitor a stable random id, visible to the page on the first visit too. */
function withVisitorId(request: NextRequest) {
  if (request.cookies.get(VISITOR_COOKIE)) return NextResponse.next();
  const id = crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("cookie", [request.headers.get("cookie"), `${VISITOR_COOKIE}=${id}`].filter(Boolean).join("; "));
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(VISITOR_COOKIE, id, { maxAge: 60 * 60 * 24 * 180, sameSite: "lax", httpOnly: true, path: "/" });
  return res;
}

/** Everything except the public pages needs a signed-in session. APIs get 401, pages redirect to /login. */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/welcome") return withVisitorId(request);
  if (decodeSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (pathname === "/" && !search) return NextResponse.redirect(new URL("/welcome", request.url)); // landing is the front door
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: login, marketing pages (+ their /welcome/* assets), guest invites + their translation API, the NudgeBee runbook callback (own Bearer token), Next internals, root files like favicon.
  matcher: ["/((?!login|welcome|early-access|invite/|api/translate|api/ops/remediate|_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)", "/welcome"],
};

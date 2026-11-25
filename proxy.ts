import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

/** Everything except the public pages needs a signed-in session. APIs get 401, pages redirect to /login. */
export function proxy(request: NextRequest) {
  if (decodeSession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (pathname === "/" && !search) return NextResponse.redirect(new URL("/welcome", request.url)); // landing is the front door
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: login, marketing pages (+ their /welcome/* assets), guest invites, Next internals, root files like favicon.
  matcher: ["/((?!login|welcome|early-access|invite/|_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};

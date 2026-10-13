import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Generates a per-request CSP nonce and attaches the full security-header
 * set to every response this app serves.
 *
 * Named `proxy` and filed at src/proxy.ts, not src/middleware.ts -- this
 * Next.js version has renamed the file convention (middleware.ts is
 * deprecated; a `next build` here warns on it) and still runs the old name
 * for backwards compatibility, but a brand-new file has no reason to start
 * on a deprecated name.
 *
 * The nonce exists because the App Router injects its own inline hydration
 * bootstrap scripts -- a strict `script-src 'self'` with no 'unsafe-inline'
 * would otherwise break the framework itself, not just this app's one
 * hand-written inline script (the anti-flash theme script in layout.tsx,
 * which reads this same nonce back via `x-nonce` / `next/headers`). Next.js
 * detects a nonce in this header and automatically applies it to its own
 * inline scripts; this file is responsible for everything else.
 *
 * `style-src` includes 'unsafe-inline' as a deliberate, documented
 * exception -- see the note below. Nothing else does.
 */
/** Owner session cookie, set httpOnly by the backend's /api/auth endpoints. */
const ACCESS_TOKEN_COOKIE = "access_token";
/** Reader cookie, scoped Path=/share so it never travels to owner routes. */
const READER_COOKIE_PREFIX = "reader_token_";

/** Routes that require an owner session. */
const PROTECTED_PREFIXES = ["/profile", "/memoirs", "/memories", "/chapters", "/memoir", "/book"];
/** Routes an already-authenticated owner should not see. */
const AUTHED_AWAY_FROM = ["/signin", "/begin"];

/**
 * Redirects for unauthenticated access to owner routes, and away from the
 * entry screens for someone already signed in.
 *
 * This is defence in depth and nothing more. It checks only for the
 * *presence* of the session cookie -- it does not and cannot verify it,
 * because the signing key lives on the backend. Every page that loads owner
 * data re-verifies ownership server-side against the API, which is the real
 * boundary; this exists so a signed-out visitor gets sent somewhere sensible
 * instead of watching a workspace shell render and then fill with errors.
 *
 * The zero-memoir redirect that §9b describes is deliberately NOT here: it
 * needs the memoir list, which is a network call, and putting one on every
 * request to every protected route is a real cost for a check the workspace
 * layout already has the data to make. It lives in the workspace layout.
 */
function routeGuard(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  const hasOwnerSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !hasOwnerSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    // Round-trip the requested path so sign-in can return them to it. It is
    // re-validated on the way out (lib/safeNext.ts) rather than trusted here.
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasOwnerSession && AUTHED_AWAY_FROM.some((p) => pathname === p)) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // /share/<token> is public at the unlock screen and reader-gated beyond it.
  // The page itself decides which of those it is showing, because only it can
  // tell an absent cookie from an expired one -- and those are two different
  // screens (the password form vs "this link no longer works"). Blanket-
  // redirecting here would collapse them.
  if (pathname.startsWith("/share/")) {
    const token = pathname.split("/")[2];
    if (token) {
      const hasReaderCookie = Boolean(
        request.cookies.get(`${READER_COOKIE_PREFIX}${token}`)?.value,
      );
      // Surfaced as a request header so the server component can branch
      // without reading cookies twice.
      request.headers.set("x-reader-unlocked", hasReaderCookie ? "1" : "0");
    }
  }

  return null;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const supabaseOrigin = (() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return url ? new URL(url).origin : "";
    } catch {
      return "";
    }
  })();

  const csp = [
    "default-src 'self'",
    `img-src 'self' blob: data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `media-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self' fonts.gstatic.com",
    // 'unsafe-inline' here only, not for script-src: this app sets a
    // number of per-instance, JS-computed inline `style` values (a reading
    // progress bar's width, a parallax transform, per-photo duotone
    // overlay opacity) that have no static-class equivalent and no
    // first-party nonce mechanism the way Next's own inline scripts have.
    // style-src 'unsafe-inline' cannot execute script on its own -- the
    // realistic exposure it accepts is CSS-based UI redress, not code
    // execution -- so this is a considered trade, not an oversight.
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    // 'unsafe-eval' is dev-only: React's development build uses eval() for
    // debugging features (reconstructing call stacks across HMR
    // boundaries) that it never uses in production -- Next.js's own CSP
    // guidance calls this out explicitly. Gating on NODE_ENV keeps the
    // production policy exactly as specified, with nothing relaxed.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
    }`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = routeGuard(request) ?? NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own static assets and the favicon, which
    // don't need (and for the static asset cache, shouldn't carry) a
    // per-request nonce.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

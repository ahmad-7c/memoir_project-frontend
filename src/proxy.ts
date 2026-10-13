import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveApiOrigin } from "@/lib/api/origin";

/**
 * Attaches the full security-header set to every response this app serves.
 *
 * Named `proxy` and filed at src/proxy.ts, not src/middleware.ts -- this
 * Next.js version has renamed the file convention (middleware.ts is
 * deprecated; a `next build` here warns on it) and still runs the old name
 * for backwards compatibility, but a brand-new file has no reason to start
 * on a deprecated name.
 *
 * script-src deliberately does NOT use a nonce. A nonce-based CSP only
 * works for pages Next.js renders per-request -- per Next's own CSP docs,
 * "Static pages are generated at build time, when no request or response
 * headers exist, so no nonce can be injected." Almost every route in this
 * app (/begin, /signin, /profile, /memories, /chapters, /memoir,
 * /memoirs/new, ...) is intentionally static for performance. An earlier
 * version of this file generated a per-request nonce and set it in the CSP
 * header anyway; Next silently never attached it to any script tag on
 * those static pages, `strict-dynamic` then trusted nothing, and the
 * result was that literally no JavaScript executed anywhere in the app in
 * production -- every form fell back to a native HTML submit, which is
 * what "the Continue button doesn't do anything" turned out to be. Forcing
 * every page into dynamic rendering just to support nonces would be a much
 * larger change than a CSP fix warrants, so `'unsafe-inline'` is the
 * considered trade here, same as `style-src` already makes below -- it
 * still blocks every externally-hosted or attacker-injected `<script
 * src="...">`, which is the realistic threat this guards against; the app
 * has no `dangerouslySetInnerHTML` anywhere (confirmed by grep) so there's
 * no first-party reflected-HTML surface for an inline-script payload to
 * land in to begin with.
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
  const supabaseOrigin = (() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return url ? new URL(url).origin : "";
    } catch {
      return "";
    }
  })();
  const apiOrigin = resolveApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);

  const csp = [
    "default-src 'self'",
    `img-src 'self' blob: data:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `media-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `connect-src 'self' ${apiOrigin}${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    "font-src 'self' fonts.gstatic.com",
    // Both carry 'unsafe-inline' for the same reason: the App Router's own
    // inline hydration/RSC-payload scripts and this app's per-instance
    // inline styles (a reading progress bar's width, a parallax transform,
    // a per-photo duotone overlay opacity -- values with no static-class
    // equivalent) have no nonce on this app's mostly-static routes (see the
    // file-level comment above). 'unsafe-inline' still blocks every
    // externally-hosted or injected <script src="..."> / <link>, which is
    // the realistic protection script-src/style-src provide here.
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    // 'unsafe-eval' is dev-only: React's development build uses eval() for
    // debugging features (reconstructing call stacks across HMR
    // boundaries) that it never uses in production -- Next.js's own CSP
    // guidance calls this out explicitly. Gating on NODE_ENV keeps the
    // production policy exactly as specified, with nothing relaxed.
    `script-src 'self' 'unsafe-inline'${
      process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
    }`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

  const response = routeGuard(request) ?? NextResponse.next();

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

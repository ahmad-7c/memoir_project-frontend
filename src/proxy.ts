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

  const response = NextResponse.next({ request: { headers: requestHeaders } });

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

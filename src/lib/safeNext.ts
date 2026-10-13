/**
 * Validates a `?next=` redirect target.
 *
 * Anything that isn't a plain in-app path is rejected and replaced with the
 * fallback. Accepting `next` unchecked is an open redirect: a link to
 * `/signin?next=https://evil.example` would bounce a freshly-authenticated
 * user straight off-site, and the URL in the phishing email would be a
 * genuine link to this product.
 *
 * Rejected, with the reason each one matters:
 *   - `https://evil.example`  absolute URL, different origin
 *   - `//evil.example`        protocol-relative; browsers treat it as absolute
 *   - `/\evil.example`        backslash; some parsers normalise it to `//`
 *   - `javascript:...`        scheme payload
 *   - anything not starting with a single `/`
 */
export function safeNextPath(next: string | null | undefined, fallback = "/profile"): string {
  if (!next) return fallback;

  // Must be a single-slash-rooted path.
  if (!next.startsWith("/")) return fallback;
  // Protocol-relative, or a backslash variant browsers may normalise to one.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // A control character or whitespace can be used to smuggle past naive checks.
  if (/[\x00-\x1f\s]/.test(next)) return fallback;

  // Final guard: resolve against a throwaway origin and confirm it stayed there.
  try {
    const resolved = new URL(next, "https://placeholder.invalid");
    if (resolved.origin !== "https://placeholder.invalid") return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}

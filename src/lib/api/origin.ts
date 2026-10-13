/**
 * Normalizes the configured API URL for browser requests and CSP origins.
 */
export function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim().replace(/\/+$/, "");
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must be set for production builds.");
    }
    return "http://localhost:8000";
  }
  if (/^https?:\/\//i.test(value)) return value;
  const host = value.split("/", 1)[0].split(":", 1)[0];
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  return `${isLocal ? "http" : "https"}://${value}`;
}

export function resolveApiOrigin(raw: string | undefined): string {
  return new URL(resolveApiBaseUrl(raw)).origin;
}

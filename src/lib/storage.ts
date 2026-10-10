/**
 * Safe localStorage reader.
 *
 * Returns `null` when the key is missing or the stored value is corrupt, so a
 * damaged value degrades to "nothing saved" instead of throwing and taking the
 * whole page down with it.
 */
export function readStorage<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

import { api } from "@/lib/api/client";

export interface MemoirSummary {
  id: string;
  subject_name: string;
  subject_born_on?: string | null;
  subject_died_on?: string | null;
  subject_is_living?: boolean;
  cover_image_url?: string | null;
  status: "draft" | "published";
  updated_at?: string;
}

/**
 * Where a flat workspace route (/memories, /chapters, /memoir) should send
 * someone, resolved from what they actually own.
 *
 * Three outcomes, and the distinction between the last two matters:
 *
 *   "create"  — no memoirs at all. §4: an authenticated user with no memoir
 *               is ALWAYS sent to /memoirs/new.
 *   "draft"   — the most recently updated draft. The normal case.
 *   "empty"   — they have memoirs, but every one is published. This is the
 *               post-publish state from §1, and it is deliberately NOT a
 *               redirect to creation: the spec asks for a clean-beginning
 *               screen here, not a form. Collapsing it into "create" would
 *               mean a user who just published never sees that moment.
 */
export type FlatRouteTarget =
  | { kind: "create" }
  | { kind: "draft"; memoirId: string }
  | { kind: "empty" };

export async function resolveFlatRouteTarget(): Promise<FlatRouteTarget> {
  const memoirs: MemoirSummary[] = await api.getUserMemoirs();

  if (!Array.isArray(memoirs) || memoirs.length === 0) {
    return { kind: "create" };
  }

  const drafts = memoirs.filter((m) => m.status !== "published");
  if (drafts.length === 0) {
    return { kind: "empty" };
  }

  // Most recently updated first. `updated_at` is an ISO timestamp from the
  // database; missing values sort last rather than throwing off the compare.
  const [latest] = [...drafts].sort((a, b) => {
    const at = a.updated_at ? Date.parse(a.updated_at) : 0;
    const bt = b.updated_at ? Date.parse(b.updated_at) : 0;
    return bt - at;
  });

  return { kind: "draft", memoirId: latest.id };
}

/** Formats a memoir's dates the way every hero and card in the app shows them. */
export function formatMemoirDates(m: {
  subject_born_on?: string | null;
  subject_died_on?: string | null;
  subject_is_living?: boolean;
}): string {
  const born = m.subject_born_on ? new Date(m.subject_born_on).getFullYear() : "";
  if (m.subject_is_living) return born ? `${born} — Present` : "";
  const died = m.subject_died_on ? new Date(m.subject_died_on).getFullYear() : "";
  if (!born && !died) return "";
  return `${born} — ${died}`;
}

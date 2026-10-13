/**
 * The onboarding answers, held in the browser until an account exists.
 *
 * Steps 1-4 of /begin happen before signup, so there is no server to persist
 * them to yet. They live under ONE namespaced sessionStorage key -- not five
 * loose keys -- so restoring, clearing, and reasoning about "what have we
 * collected so far" is a single operation.
 *
 * sessionStorage rather than localStorage: these answers are scoped to one
 * sitting. If someone abandons onboarding and comes back next week, a blank
 * form is kinder than a half-filled one they don't remember starting.
 *
 * Cleared ONLY after the account exists AND the onboarding data has been
 * persisted to the backend (i.e. after the memoir is created) -- see
 * clearOnboardingDraft's callers. Clearing earlier means a failure after
 * signup loses answers the user already gave.
 */
import type { MemoirRelationship } from "@/lib/api/client";

const KEY = "memoir.onboarding.v1";

export interface OnboardingDraft {
  /** Step 1 — the owner's own name. */
  ownerName?: string;
  /** Step 2 — who the memoir is for. */
  subjectName?: string;
  /**
   * Step 3 — the owner's relationship to them. Typed to the backend's own
   * enum rather than `string`: this value goes straight into a Postgres enum
   * column, and a free-form string here would only fail at the API boundary.
   */
  relationship?: MemoirRelationship;
  /** Step 4 — acknowledged the subscription screen (payment is unavailable). */
  subscriptionAcknowledged?: boolean;
}

export function readOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ *
 * External-store interface, so React can read this during render.
 *
 * sessionStorage is an external store, and the correct way to read one in
 * React is useSyncExternalStore -- not a read in useEffect followed by
 * setState, which is a cascading render and (correctly) flagged by
 * react-hooks/set-state-in-effect.
 *
 * The snapshot is the RAW STRING, deliberately. Returning a parsed object
 * would allocate a new object on every call and useSyncExternalStore
 * compares with Object.is, so it would re-render forever. Callers parse the
 * string behind a useMemo.
 * ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

export function subscribeOnboardingDraft(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getOnboardingDraftSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Nothing is stored on the server, so SSR and the hydrating render agree on "empty". */
export function getOnboardingDraftServerSnapshot(): string | null {
  return null;
}

/**
 * Merges one or more answers in. Merge rather than replace so a step only
 * has to know about its own field, and Back-then-forward can never blank a
 * later answer that was already given.
 */
export function saveOnboardingAnswer(patch: Partial<OnboardingDraft>): OnboardingDraft {
  const next = { ...readOnboardingDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage disabled. Onboarding still works within the
    // current page; only Back and refresh lose answers, which is strictly
    // better than refusing to proceed.
  }
  listeners.forEach((l) => l());
  return next;
}

export function clearOnboardingDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
  listeners.forEach((l) => l());
}

/** The five onboarding steps, in order. Used for the progress marks and Back. */
export const ONBOARDING_STEPS = [
  "your-name",
  "their-name",
  "relationship",
  "subscription",
  "account",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * The first step this draft hasn't answered yet.
 *
 * Used to resume mid-flow after a refresh without ever skipping past a
 * question the user genuinely hasn't answered.
 */
export function firstUnansweredStep(draft: OnboardingDraft): number {
  if (!draft.ownerName) return 0;
  if (!draft.subjectName) return 1;
  if (!draft.relationship) return 2;
  if (!draft.subscriptionAcknowledged) return 3;
  return 4;
}

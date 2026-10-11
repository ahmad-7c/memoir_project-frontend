/**
 * Large serif drop cap on a paragraph's first letter, via Tailwind's
 * `first-letter:` variant (no markup slicing needed in callers). The
 * reference never isolated an exact px value for this (see
 * docs/design-reference.md §8) -- sized here as a reasonable ~3x-body
 * multiple, matching what the brief observed visually.
 */
export const DROP_CAP_CLASS =
  "first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.8] first-letter:float-left first-letter:pr-2 first-letter:pt-1 first-letter:text-foreground";

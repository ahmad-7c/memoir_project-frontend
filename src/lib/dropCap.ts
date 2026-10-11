/**
 * The brass drop cap opening each chapter on the published memoir page.
 * Tailwind's `first-letter:` variant targets the real CSS ::first-letter
 * pseudo-element, so this is one class string applied to whichever
 * paragraph is a chapter's actual opening line (the first narrative
 * section if the chapter has one, otherwise its first memory) -- never
 * more than one paragraph per chapter.
 */
export const DROP_CAP_CLASS =
  "first-letter:font-serif first-letter:not-italic first-letter:text-brass first-letter:text-[4.25rem] first-letter:leading-[0.75] first-letter:font-normal first-letter:float-left first-letter:mr-3 first-letter:mt-1";

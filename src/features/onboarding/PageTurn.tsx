"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// The fixed order of the 5-step onboarding sequence -- used only to tell
// forward from backward navigation so the page-turn mirrors correctly. Does
// not change the questions or the data collected, which stays exactly as it
// was (see each screen's own component).
const STEP_ORDER = [
  "/memory-subject-selection",
  "/handwritten-note",
  "/unfold-memory",
  "/memory-moment",
  "/invite-family-friends",
];

const PAGE_EASE = [0.16, 1, 0.3, 1] as const;

type TurnCustom = { direction: number; rotation: number };

const pageVariants = {
  enter: ({ direction }: TurnCustom) => ({
    rotateY: direction >= 0 ? 10 : -10,
    x: direction >= 0 ? 40 : -40,
    opacity: 1,
  }),
  center: {
    rotateY: 0,
    x: 0,
    opacity: 1,
    transition: { duration: 0.68, delay: 0.14, ease: PAGE_EASE },
  },
  exit: ({ direction, rotation }: TurnCustom) => ({
    rotateY: direction >= 0 ? -rotation : rotation,
    x: direction >= 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.62, ease: PAGE_EASE },
  }),
};

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

/**
 * Each onboarding step is a page of a book turning. Wraps the
 * (onboarding) route group's children, keyed by pathname, so a route change
 * between the 5 fixed steps plays as a page turn rather than a hard
 * navigation. Direction (forward/back) is inferred from each step's fixed
 * position in STEP_ORDER, not from browser history, since router.back() and
 * a Back link both need to mirror correctly.
 *
 * Never traps input: AnimatePresence's default (non-"wait") mode lets a
 * second navigation interrupt an in-flight transition immediately rather
 * than queuing behind it -- pressing Next twice just retargets the
 * animation to the newest pathname.
 */
export function PageTurn({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const narrow = useIsNarrow();

  const currentIndex = STEP_ORDER.indexOf(pathname);

  // Derives direction by comparing this render's index against the
  // previous one -- done as the React-documented "adjust state during
  // render" pattern (react.dev: "storing information from previous
  // renders"), not by reading a ref's `.current` in the render body, which
  // React's own lint rule flags as unsafe (a ref read during render isn't
  // guaranteed consistent, e.g. under StrictMode's double-invocation).
  // Calling setState here, conditionally, makes React discard this render
  // and immediately re-render with the updated value before committing
  // anything, so `direction` below is still correct for this navigation.
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const [direction, setDirection] = useState(1);
  if (currentIndex !== prevIndex) {
    setDirection(currentIndex >= prevIndex ? 1 : -1);
    setPrevIndex(currentIndex);
  }

  if (reduced) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const rotation = narrow ? 8 : 14;

  return (
    <div className="relative overflow-x-hidden" style={{ perspective: 2000 }}>
      {/* The spine: fixed at the binding edge, stays put while pages turn. */}
      <div className="absolute inset-y-0 left-0 w-px brass-sheen z-10 pointer-events-none" aria-hidden="true" />

      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          custom={{ direction, rotation } satisfies TurnCustom}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
          className="relative"
        >
          {/* Binding-edge darkening band -- rides with this page as it turns,
              giving the curve of a bound page near the spine. */}
          <div
            className="absolute inset-y-0 left-0 w-15 pointer-events-none z-10"
            style={{ background: "linear-gradient(to right, var(--canvas-deep), transparent)", opacity: 0.22 }}
            aria-hidden="true"
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

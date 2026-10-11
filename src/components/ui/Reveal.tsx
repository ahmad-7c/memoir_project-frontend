"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The one scroll-reveal used everywhere: opacity 0->1, translateY 20px->0,
 * 760ms, fires once per element the first time it crosses 15% visible,
 * never again on scroll back up. `index` staggers siblings by 90ms each.
 *
 * `useReducedMotion` (not a CSS media query alone) is the real gate here --
 * framer-motion's viewport animation doesn't honour
 * prefers-reduced-motion on its own, so a reduced-motion visitor gets the
 * plain, already-visible content with no animated props at all, not just a
 * fast version of the animation.
 */
export function Reveal({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.76, ease: EASE, delay: index * 0.09 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

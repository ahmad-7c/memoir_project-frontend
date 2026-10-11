/**
 * @file ScatteredMemories.tsx
 * @description One idea, one viewport: why the product exists. Previously a
 * collage of rotated stock photos with heavy shadows and blur -- replaced
 * entirely, since both the imagery and the chrome were against the brief
 * (no stock photography, no drop shadows). The line itself was worth
 * keeping; everything around it was not.
 *
 * Fades in once as it enters view (not on every scroll past it) -- a quiet
 * reveal rather than the section simply appearing fully formed and static.
 */

"use client";

import { motion } from "framer-motion";

export default function ScatteredMemories() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-24 md:py-32">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="font-serif text-heading text-ink text-center max-w-2xl leading-relaxed"
      >
        Every family already holds the memoir. It is just{" "}
        <span className="text-accent">scattered</span> across the people who
        loved them.
      </motion.p>
    </section>
  );
}

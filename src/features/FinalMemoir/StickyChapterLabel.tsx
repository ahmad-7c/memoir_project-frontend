"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ChapterRef {
  id: string;
  title: string;
}

/**
 * The current chapter title sticks just below the viewport top while you
 * read that chapter, then hands off to the next with a 240ms crossfade --
 * tracked via IntersectionObserver against each chapter heading's id,
 * rather than a scroll-position calculation.
 */
export function StickyChapterLabel({ chapters }: { chapters: ChapterRef[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (chapters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-56px 0px -80% 0px", threshold: 0 },
    );

    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  const active = chapters.find((c) => c.id === activeId);
  if (!active) return null;

  return (
    <div className="sticky top-14 z-30 h-0" aria-hidden="true">
      <div className="pointer-events-none px-6 md:px-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="text-micro uppercase tracking-[0.06em] text-ink-secondary pt-3"
          >
            {active.title}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

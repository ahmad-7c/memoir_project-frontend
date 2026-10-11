"use client";

import { useEffect, useRef } from "react";

/**
 * Restrained parallax for exactly two cases the brief names: the hero image
 * and the memoir portrait. Nothing else parallaxes. Moves the element at
 * `speed` relative to scroll (0.86 = barely perceptible drift, not a 1:1
 * follow) by writing `transform` only, on a rAF-throttled scroll listener,
 * so it never touches layout. Skipped entirely under reduced motion rather
 * than just slowed down.
 */
export function useParallax<T extends HTMLElement>(speed = 0.86) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      el.style.transform = `translateY(${rect.top * (1 - speed)}px)`;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return ref;
}

"use client";

import { useEffect, useState } from "react";

/**
 * A 2px brass line at the very top of the published memoir page, filling as
 * the reader moves through the whole document. Uses the three-stop brass
 * sheen (globals.css .brass-sheen) rather than a flat fill, so it reads as
 * metal even at 2px tall.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, el.scrollTop / scrollable)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 h-0.5 z-50" aria-hidden="true">
      <div className="brass-sheen h-full" style={{ width: `${progress * 100}%`, transition: "width 120ms linear" }} />
    </div>
  );
}

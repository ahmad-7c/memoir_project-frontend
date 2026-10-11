"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A horizontal brass rule with the three-stop sheen (globals.css
 * .brass-sheen) and, once it enters the viewport, a single travelling
 * highlight band over 1.4s -- never a repeating loop, never again after the
 * first run. Below 40px wide a flat brass-deep line is used instead (the
 * sheen treatment is specified for rules longer than that).
 */
export function BrassRule({ className = "", short = false }: { className?: string; short?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (short) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [short]);

  if (short) {
    return <div className={cn("h-px bg-brass-deep", className)} aria-hidden="true" />;
  }

  return (
    <div
      ref={ref}
      data-run={run ? "true" : "false"}
      className={cn("h-px brass-sheen-sweep", className)}
      aria-hidden="true"
    />
  );
}

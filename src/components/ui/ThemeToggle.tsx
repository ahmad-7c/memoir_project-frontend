"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Manual dark-mode override. The anti-flash script in layout.tsx already
 * sets data-theme from the stored preference (or the OS setting) before
 * paint; this just lets the user flip it and persists the choice.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Lazy-initialized from the attribute the anti-flash script already set,
  // not from matchMedia again -- the two must never disagree.
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing / storage disabled -- the toggle still works for
      // this page view, it just won't persist across visits.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-sm border border-line text-ink-secondary hover:text-ink hover:bg-surface-sunk transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

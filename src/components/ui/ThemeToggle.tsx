"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Manual dark-mode override. The anti-flash script in layout.tsx already
 * applies `.dark` from the stored preference (or the OS setting) before
 * paint; this just lets the user flip it and persists the choice.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Lazy-initialized from the DOM class the anti-flash script already set,
  // not from matchMedia again -- the two must never disagree.
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
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
      className={`inline-flex items-center justify-center w-11 h-11 rounded-full border border-memory-border dark:border-memory-border text-memory-primary dark:text-memory-ink hover:bg-memory-card dark:hover:bg-memory-card transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

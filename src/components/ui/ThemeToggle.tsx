"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Manual dark-mode override. The anti-flash script in layout.tsx already
 * sets data-theme on <html> from the stored preference before paint; this
 * just lets the user flip it and persists the choice.
 *
 * The icon/label can't read that attribute during the initial render: the
 * server has no concept of it (it's written by a script, not by React), so
 * a lazy useState initializer that reads it would make the server render
 * one icon and the client's first render show the other -- an actual,
 * confirmed hydration mismatch (lucide-sun vs lucide-moon), not just a
 * suppressible attribute diff. Instead this always renders the same thing
 * (Moon, "dark") on the first pass, matching the server exactly, then
 * corrects itself from a post-mount effect -- a normal client-side update
 * at that point, not a hydration diff, so there's nothing to suppress.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Deferred a tick so no setState call executes synchronously within the
    // effect body itself -- same constraint worked around elsewhere in this
    // codebase (e.g. AudioPlayer, BookCoverExperience).
    Promise.resolve().then(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark, mounted]);

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

  const showLight = mounted && isDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={showLight ? "Switch to light mode" : "Switch to dark mode"}
      title={showLight ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-sm border border-line text-ink-secondary hover:text-ink hover:bg-surface-sunk transition-colors cursor-pointer ${className}`}
    >
      {showLight ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

import React from "react";
import Link from "next/link";

interface MemoirHeaderProps {
  isVisible: boolean;
}

/**
 * Previously a fixed gradient bar with a hardcoded Helen Keller quote,
 * typed out letter by letter on every page load, plus two decorative
 * pennant shapes -- replaced with a slim, quiet utility strip whose only
 * job is getting back to the profile.
 */
export default function MemoirHeader({ isVisible }: MemoirHeaderProps) {
  return (
    <header
      className={`fixed top-0 inset-x-0 h-14 bg-canvas/90 backdrop-blur-sm border-b border-line z-50 transition-transform ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="h-full max-w-6xl mx-auto px-6 flex items-center">
        <Link href="/profile" className="text-body-ui text-ink-secondary hover:text-ink transition-colors">
          ← Your memoirs
        </Link>
      </div>
    </header>
  );
}

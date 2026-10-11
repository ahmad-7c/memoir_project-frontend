"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  setShowContributors: React.Dispatch<React.SetStateAction<boolean>>;
  memoryCount: number;
}

/**
 * Previously a "stacked paper" 3D counter tile plus staggered, rotated,
 * drop-shadowed nav blocks that scaled on hover -- replaced with a plain
 * hairline nav column. The counter especially was a metric tile, which the
 * dashboard brief forbids outright; the count is now one quiet line of text.
 */
export function DashboardSidebar({ setShowContributors, memoryCount }: DashboardSidebarProps) {
  const router = useRouter();

  const navItemClass =
    "text-left px-4 py-3 rounded-sm text-body-ui text-ink-secondary hover:text-ink hover:bg-surface transition-colors cursor-pointer min-h-11";

  return (
    <aside className="w-64 bg-canvas p-6 hidden lg:flex flex-col justify-start sticky top-0 h-screen z-20 border-r border-line">
      <div>
        <div className="mb-10">
          <span className="font-serif text-subhead text-ink">Family Archive</span>
          <p className="text-small text-ink-muted mt-1">
            {memoryCount} {memoryCount === 1 ? "memory" : "memories"}
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          <a href="#overview" className={navItemClass}>
            New memory
          </a>
          <a href="#archive" className={navItemClass}>
            View archive
          </a>
          <button type="button" onClick={() => setShowContributors((prev) => !prev)} className={navItemClass}>
            Contributors
          </button>
          <button type="button" onClick={() => router.push("/profile")} className={navItemClass}>
            My profile
          </button>
        </nav>
      </div>
    </aside>
  );
}

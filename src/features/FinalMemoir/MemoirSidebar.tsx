import React from "react";
import type { Chapter } from "@/features/dashboard/types/organization";

interface MemoirSidebarProps {
  activeView: "timeline" | "chapters";
  setActiveView: (val: "timeline" | "chapters") => void;
  chapters?: Chapter[];
}

/**
 * Previously also rendered a "Fleeting Thoughts" section of ten fabricated
 * pull-quotes attributed to invented relatives (mockShortQuotes) -- removed
 * entirely. There is no real equivalent of that feature in the backend, so
 * the honest fix is to drop it rather than leave fiction on a real family's
 * page.
 */
export default function MemoirSidebar({ activeView, setActiveView, chapters = [] }: MemoirSidebarProps) {
  const chapterEras = React.useMemo(() => {
    return chapters.map((chapter) => {
      const years = chapter.memories
        .map((m) => (m.occurred_start ? m.occurred_start.slice(0, 4) : null))
        .filter((y): y is string => Boolean(y) && /^\d{4}$/.test(y as string))
        .map(Number)
        .filter((y) => !Number.isNaN(y));

      if (years.length === 0) return null;
      const min = Math.min(...years);
      const max = Math.max(...years);
      const decade = (y: number) => `${Math.floor(y / 10) * 10}s`;
      return min === max ? decade(min) : `${decade(min)}–${decade(max)}`;
    });
  }, [chapters]);

  const hasChapters = chapters.length > 0;

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="flex items-center border border-line rounded-sm overflow-hidden mb-6">
        {(["timeline", "chapters"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setActiveView(v)}
            className={`flex-1 py-2 text-small font-medium capitalize transition-colors cursor-pointer ${
              activeView === v ? "bg-surface-sunk text-ink" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {!hasChapters && (
        <p className="text-small text-ink-muted italic">
          No chapters yet. Organize the timeline from the dashboard to build this book.
        </p>
      )}

      {hasChapters && activeView === "chapters" && (
        <ul className="flex flex-col gap-2.5">
          {chapters.map((chapter, idx) => (
            <li key={chapter.id} className="flex items-center justify-between text-small text-ink-secondary pb-2 border-b border-line">
              <span className="truncate pr-2" title={chapter.title}>
                {chapter.title}
              </span>
              <span className="text-micro text-ink-muted shrink-0">{String(idx + 1).padStart(2, "0")}</span>
            </li>
          ))}
        </ul>
      )}

      {hasChapters && activeView === "timeline" && (
        <ul className="flex flex-col gap-2.5">
          {chapters.map((chapter, idx) => {
            const era = chapterEras[idx];
            if (!era) return null;
            return (
              <li key={chapter.id} className="flex items-center justify-between text-small text-ink-secondary pb-2 border-b border-line">
                <span>{era}</span>
                <span className="text-micro uppercase tracking-[0.06em] text-ink-muted truncate pl-2" title={chapter.title}>
                  {chapter.title}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

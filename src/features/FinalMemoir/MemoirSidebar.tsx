import React from "react";
import { ShortQuote } from "./types";
import type { Chapter } from "@/features/dashboard/types/organization";

interface MemoirSidebarProps {
  activeView: "timeline" | "chapters";
  setActiveView: (val: "timeline" | "chapters") => void;
  mockShortQuotes: ShortQuote[];
  /**
   * Real chapters from the backend.
   *
   * Previously this sidebar rendered four hardcoded chapter titles, so the
   * organized chapters an owner had just approved and applied were never
   * visible here -- the memoir page was entirely mock data.
   */
  chapters?: Chapter[];
}

export default function MemoirSidebar({
  activeView,
  setActiveView,
  mockShortQuotes,
  chapters = [],
}: MemoirSidebarProps) {
  // Decade labels derived from the memories actually assigned to a chapter,
  // rather than a fixed 1950s-2000s list that had nothing to do with the data.
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
    <aside className="w-full lg:w-56 shrink-0 space-y-8">
      {/* Toggle Panel */}
      <div className="bg-white p-4 rounded-sm border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center p-0.5 bg-stone-100/50 border border-stone-200 rounded-sm mb-4">
          {[
            { id: "timeline", label: "Timeline" },
            { id: "chapters", label: "Chapters" },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id as "timeline" | "chapters")}
              className={`flex-1 py-1.5 text-[9px] font-sans uppercase tracking-wider transition-all rounded-sm cursor-pointer ${
                activeView === v.id ? "bg-white text-memory-maroon font-bold shadow-sm" : "text-stone-500 hover:text-memory-maroon"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {!hasChapters && (
            <p className="text-[11px] font-serif text-stone-400 italic">
              No chapters yet. Organize your timeline from the dashboard to build
              this book.
            </p>
          )}

          {hasChapters && activeView === "chapters" && (
            <ul className="space-y-2.5 text-[11px] font-serif">
              {chapters.map((chapter, idx) => (
                <li
                  key={chapter.id}
                  className="flex items-center justify-between text-stone-600 pb-1 border-b border-stone-100"
                >
                  <span className="truncate pr-2" title={chapter.title}>
                    {chapter.title}
                  </span>
                  <span className="text-[9px] font-sans text-stone-400 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {hasChapters && activeView === "timeline" && (
            <ul className="space-y-2.5 text-[11px] font-serif">
              {chapters.map((chapter, idx) => {
                const era = chapterEras[idx];
                if (!era) return null;
                return (
                  <li
                    key={chapter.id}
                    className="flex items-center justify-between text-stone-600 pb-1 border-b border-stone-100"
                  >
                    <span>{era}</span>
                    <span
                      className="text-[9px] font-sans uppercase tracking-wider text-stone-400 truncate pl-2"
                      title={chapter.title}
                    >
                      {chapter.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Fleeting Thoughts */}
      <div className="pt-2">
        <label className="block text-[11px] font-sans uppercase tracking-[0.2em] text-stone-500 font-semibold mb-6 border-b border-stone-200 pb-2">
          Fleeting Thoughts
        </label>
        <div className="space-y-10">
          {mockShortQuotes.map((quote) => (
            <div key={quote.id} className="relative">
              <p className="text-[16px] font-serif italic text-stone-700 leading-relaxed">
                <span className="text-memory-maroon/40 font-serif mr-0.5">“</span>
                {quote.text}
                <span className="text-memory-maroon/40 font-serif ml-0.5">”</span>
              </p>
              <div className="mt-2 flex justify-end items-center gap-2">
                <span className="w-3 h-px bg-memory-maroon/30"></span>
                <span className="text-[9px] font-sans font-semibold text-stone-400 uppercase tracking-wider">
                  {quote.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
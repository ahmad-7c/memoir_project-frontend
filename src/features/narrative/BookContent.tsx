"use client";

import { cn } from "@/lib/utils";
import { DROP_CAP_CLASS } from "@/lib/dropCap";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";
import type { Chapter } from "@/features/dashboard/types/organization";
import type { NarrativeSection } from "@/lib/api/client";

/**
 * The book itself: chapters, their composed narrative or AI summary, and
 * each memory beneath it. Shared by the owner's draft preview
 * (`/memoirs/[id]/preview`) and their read-only published view
 * (`/book/[id]`) -- both render the exact same reading experience, the only
 * difference is what wraps it (a preview banner vs. a published badge).
 */
export function BookContent({
  memoirId,
  chapters,
  narrativeSections,
  loading,
  error,
  emptyTitle = "This memoir has no chapters yet.",
  emptyDescription,
  canComment = true,
}: {
  memoirId: string;
  chapters: Chapter[];
  narrativeSections: NarrativeSection[];
  loading: boolean;
  error: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  canComment?: boolean;
}) {
  if (loading) return <LoadingState label="Opening the book…" />;
  if (error) return <ErrorState message={error} />;
  if (chapters.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-2xl text-foreground mb-3">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {[...chapters]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((chapter, chapterIndex) => {
          const chapterNarrative = narrativeSections.filter((s) => s.chapter_id === chapter.id);
          const opensWithNarrative = chapterNarrative.length > 0;

          return (
            <section key={chapter.id} className="mb-20">
              <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">
                Chapter {String(chapterIndex + 1).padStart(2, "0")}
              </p>
              <h2 className="font-serif text-4xl text-foreground mb-6">{chapter.title}</h2>

              {opensWithNarrative ? (
                <NarrativeSectionsView memoirId={memoirId} sections={chapterNarrative} showLabel dropCapFirst />
              ) : chapter.summary ? (
                <>
                  <p className={cn("text-sm text-foreground leading-relaxed", DROP_CAP_CLASS)}>{chapter.summary}</p>
                  <p className="mt-3 text-[11px] text-muted-foreground">Composed with AI &middot; from family memories</p>
                </>
              ) : null}

              {chapter.memories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic mt-4">No memories recorded in this chapter yet.</p>
              ) : (
                chapter.memories.map((mem, memIndex) => {
                  const body = (mem.body_text ?? "").trim();
                  const applyDropCap = !opensWithNarrative && !chapter.summary && memIndex === 0;
                  return (
                    <article key={mem.id} className="mt-8">
                      {mem.title && <h3 className="font-serif text-xl text-foreground mb-1">{mem.title}</h3>}
                      {mem.occurred_start && (
                        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">
                          {mem.occurred_start}
                        </p>
                      )}
                      {body ? (
                        <p className={cn("text-sm text-foreground leading-relaxed whitespace-pre-wrap", applyDropCap && DROP_CAP_CLASS)}>
                          {body}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">This memory has no text yet.</p>
                      )}
                      <MemoryComments memoirId={memoirId} memoryId={mem.id} canComment={canComment} />
                    </article>
                  );
                })
              )}
            </section>
          );
        })}
    </>
  );
}

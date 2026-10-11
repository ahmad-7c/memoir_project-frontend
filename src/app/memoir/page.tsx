"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, NarrativeSection, OwnerMemoirSummary } from "@/lib/api/client";
import { ChapterSchema } from "@/features/dashboard/types/organization";
import type { Chapter } from "@/features/dashboard/types/organization";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { DROP_CAP_CLASS } from "@/lib/dropCap";
import { useExportMemoir } from "@/hooks/useExportMemoir";
import ReaderHeader from "@/components/ReaderHeader";
import Footer from "@/components/Footer";
import { Hero } from "@/components/ui/Hero";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";

function activeMemoirId(): string {
  if (typeof window === "undefined") return "";
  try {
    const saved = localStorage.getItem("active_memoir");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.data?.id || parsed.id || "";
    }
  } catch {
    // fall through
  }
  return "";
}

/**
 * The owner's own preview of their memoir -- reached via the app top bar's
 * "Read the memoir" link or the /memories, /chapters "Preview memoir" tab.
 * Matches the reference's `/memoir` structure (cinematic hero, chapter
 * book-grid, Sources disclosure, margin notes, closing CTA) with real data:
 * chapters, their AI-composed narrative sections, and real source memories.
 */
export default function MemoirPage() {
  const [memoirId] = useState<string>(activeMemoirId);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([]);
  const [memoirSummary, setMemoirSummary] = useState<OwnerMemoirSummary | null>(null);
  // Known synchronously at mount (activeMemoirId reads localStorage, not a
  // network call), so the "no memoir selected" case is decided here rather
  // than via a setState call inside the fetch effect below.
  const [loading, setLoading] = useState(() => Boolean(activeMemoirId()));
  const [error, setError] = useState<string | null>(() =>
    activeMemoirId() ? null : "No memoir selected. Open your memories and choose one first.",
  );

  const { triggerExport, isExporting } = useExportMemoir(memoirId);

  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;
    Promise.all([
      api.getChapters(memoirId),
      api.getNarrativeSections(memoirId).catch(() => []),
      api.getUserMemoirs().catch(() => []),
    ])
      .then(([chapterData, sections, memoirs]) => {
        if (cancelled) return;
        setChapters(z.array(ChapterSchema).parse(chapterData));
        setNarrativeSections(sections);
        const match = memoirs.find((m: OwnerMemoirSummary) => m.id === memoirId);
        if (match) setMemoirSummary(match);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this memoir.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  const dates = memoirSummary
    ? memoirSummary.subject_is_living
      ? memoirSummary.subject_born_on
        ? `${new Date(memoirSummary.subject_born_on).getFullYear()} — Present`
        : ""
      : [
          memoirSummary.subject_born_on ? new Date(memoirSummary.subject_born_on).getFullYear() : "",
          memoirSummary.subject_died_on ? new Date(memoirSummary.subject_died_on).getFullYear() : "",
        ]
          .filter(Boolean)
          .join(" — ")
    : "";

  return (
    <main>
      <ReaderHeader backHref="/memories" label="Your memoir · preview" />

      <Hero
        variant="reader"
        desktopSrc={memoirSummary?.cover_image_url}
        alt={memoirSummary?.subject_name ? `A photograph of ${memoirSummary.subject_name}.` : "A photograph for this memoir."}
        eyebrow="A life, remembered together"
        title={memoirSummary?.subject_name ?? "This memoir"}
        description={dates ? `${dates}` : "A life, gathered from the people who loved it."}
        footLeft="🔒 Shared privately with family"
        footRight={isExporting ? "Preparing your PDF…" : "Collected with love"}
        action={
          <button
            type="button"
            onClick={() => triggerExport()}
            disabled={isExporting}
            className="text-xs text-hero-foreground/90 hover:text-hero-foreground underline underline-offset-2 cursor-pointer disabled:opacity-60"
          >
            {isExporting ? "Preparing…" : "Export as PDF"}
          </button>
        }
      />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-14">
        {loading ? (
          <LoadingState label="Opening the book…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : chapters.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl text-foreground mb-3">This memoir has no chapters yet.</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your memories are safe. Go back and organise them into chapters first — you&rsquo;ll get to review
              everything before anything changes.
            </p>
          </div>
        ) : (
          [...chapters]
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
                          <MemoryComments memoirId={memoirId} memoryId={mem.id} canComment />
                        </article>
                      );
                    })
                  )}
                </section>
              );
            })
        )}
      </div>

      <section className="bg-secondary py-16 px-6 text-center">
        <h2 className="font-serif text-3xl text-foreground mb-4">Everyone has someone to remember.</h2>
        <Link href="/begin" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Begin a memoir for someone you love &rarr;
        </Link>
      </section>

      <Footer />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api, NarrativeSection, OwnerMemoirSummary } from "@/lib/api/client";
import { ChapterSchema } from "@/features/dashboard/types/organization";
import type { Chapter } from "@/features/dashboard/types/organization";
import { z } from "zod";
import ReaderHeader from "@/components/ReaderHeader";
import Footer from "@/components/Footer";
import { Hero } from "@/components/ui/Hero";
import { Button } from "@/components/ui/Button";
import { BookContent } from "@/features/narrative/BookContent";
import { useWorkspaceMemoir } from "@/features/memoirs/WorkspaceGuard";
import { formatMemoirDates } from "@/features/memoirs/memoirRouting";

/**
 * §5c. The finished memoir rendered exactly as the reader will see it, but
 * NOT published: no share link, no PDF, and a standing marker that this is
 * a preview.
 *
 * Export is deliberately absent here rather than disabled. §6/§8 put the
 * PDF behind publication, and a greyed-out Download button invites people
 * to try it.
 */
export default function MemoirPreviewPage() {
  const memoir = useWorkspaceMemoir();
  const memoirId = memoir.id;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([]);
  const [memoirSummary, setMemoirSummary] = useState<OwnerMemoirSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Prefer the memoir the guard already resolved; the summary call only adds
  // the cover URL, and the page should not sit nameless while it lands.
  const subjectName = memoirSummary?.subject_name ?? memoir.subject_name;
  const dates = formatMemoirDates(memoirSummary ?? memoir);
  const coverUrl = memoirSummary?.cover_image_url ?? memoir.cover_image_url ?? null;

  return (
    <main>
      <ReaderHeader backHref={`/memoirs/${memoirId}/chapters`} label="Preview · not yet published" />

      {/* A standing marker, not a toast: this must still be obvious to
          someone who scrolled straight past the top of the page. */}
      <div className="bg-accent text-accent-foreground text-center text-xs py-2 px-6">
        This is a preview. Nothing here is shared yet — no link, no PDF.
      </div>

      <Hero
        variant="reader"
        desktopSrc={coverUrl}
        alt={subjectName ? `A photograph of ${subjectName}.` : "A photograph for this memoir."}
        eyebrow="A life, remembered together"
        title={subjectName || "This memoir"}
        description={dates || "A life, gathered from the people who loved it."}
        footLeft="🔒 Not shared yet"
        footRight="Collected with love"
      />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-14">
        <BookContent
          memoirId={memoirId}
          chapters={chapters}
          narrativeSections={narrativeSections}
          loading={loading}
          error={error}
          emptyTitle="This memoir has no chapters yet."
          emptyDescription="Your memories are safe. Go back and organise them into chapters first — you'll get to review everything before anything changes."
        />
      </div>

      {/* §5c: the preview ends by offering publication, not by inviting a
          signup -- the "Everyone has someone to remember" CTA belongs on the
          published reader view, where the audience is someone else's family. */}
      <section className="bg-secondary py-16 px-6 text-center">
        <h2 className="font-serif text-3xl text-foreground mb-4">Ready when you are.</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Publishing locks this memoir for good and creates the link your family will read it by.
        </p>
        <Button href={`/memoirs/${memoirId}/chapters`}>Review &amp; publish &rarr;</Button>
      </section>

      <Footer />
    </main>
  );
}

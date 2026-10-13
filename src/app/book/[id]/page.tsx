"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, NarrativeSection, OwnerMemoirSummary } from "@/lib/api/client";
import { ChapterSchema } from "@/features/dashboard/types/organization";
import type { Chapter } from "@/features/dashboard/types/organization";
import { z } from "zod";
import ReaderHeader from "@/components/ReaderHeader";
import Footer from "@/components/Footer";
import { Hero } from "@/components/ui/Hero";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BookContent } from "@/features/narrative/BookContent";
import { PublishPanel } from "@/features/dashboard/components/PublishPanel";
import { formatMemoirDates } from "@/features/memoirs/memoirRouting";

/**
 * §1/§7: a published memoir has no workspace -- WorkspaceGuard sends
 * /memoirs/[id]/* away the moment it's published (see that component).
 * This is where the owner reads it instead: the exact reading experience a
 * family member gets through the share link, with no edit affordance
 * anywhere (ABSENT, not disabled), plus the sharing controls §8 says the
 * owner keeps -- link, password, comments, PDF, revoke -- via the same
 * PublishPanel used during publishing.
 */
export default function OwnerPublishedBookPage() {
  const params = useParams<{ id: string }>();
  const memoirId = params.id;
  const router = useRouter();

  const [memoir, setMemoir] = useState<(OwnerMemoirSummary & { status: "draft" | "published" }) | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;

    api
      .getMemoir(memoirId)
      .then(async (m) => {
        if (cancelled) return;
        if (m.status !== "published") {
          // Not published -- this memoir's workspace still exists; that's
          // where it belongs, not here.
          router.replace(`/memoirs/${memoirId}/memories`);
          return;
        }
        setMemoir(m);
        const [chapterData, sections] = await Promise.all([
          api.getChapters(memoirId),
          api.getNarrativeSections(memoirId).catch(() => []),
        ]);
        if (cancelled) return;
        setChapters(z.array(ChapterSchema).parse(chapterData));
        setNarrativeSections(sections);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 404 || status === 403) {
          router.replace("/profile");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load this memoir.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memoirId, router]);

  const subjectName = memoir?.subject_name ?? "This memoir";
  const dates = memoir ? formatMemoirDates(memoir) : "";
  const coverUrl = memoir?.cover_image_url ?? null;

  return (
    <main>
      <ReaderHeader backHref="/profile" label="Published" />

      <div className="bg-card border-b border-border text-center text-xs py-2 px-6 flex items-center justify-center gap-3">
        <Badge variant="default">Published</Badge>
        <span className="text-muted-foreground">This memoir is locked and shared.</span>
        <button
          type="button"
          onClick={() => setShowSharePanel(true)}
          className="font-medium text-foreground hover:text-accent transition-colors cursor-pointer"
        >
          Manage sharing &rarr;
        </button>
      </div>

      <Hero
        variant="reader"
        desktopSrc={coverUrl}
        alt={subjectName ? `A photograph of ${subjectName}.` : "A photograph for this memoir."}
        eyebrow="A life, remembered together"
        title={subjectName}
        description={dates || "A life, gathered from the people who loved it."}
        footLeft="Published"
        footRight="Collected with love"
      />

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-14">
        <BookContent
          memoirId={memoirId}
          chapters={chapters}
          narrativeSections={narrativeSections}
          loading={loading}
          error={error}
          canComment={false}
        />
      </div>

      <section className="bg-secondary py-16 px-6 text-center">
        <h2 className="font-serif text-3xl text-foreground mb-4">Shared with your family.</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Copy the link, set a password, or download the PDF any time.
        </p>
        <Button type="button" onClick={() => setShowSharePanel(true)}>
          Manage sharing &rarr;
        </Button>
      </section>

      <PublishPanel memoirId={memoirId} open={showSharePanel} onClose={() => setShowSharePanel(false)} />

      <Footer />
    </main>
  );
}

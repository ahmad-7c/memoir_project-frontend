"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useExportMemoir } from "@/hooks/useExportMemoir";
import { api, NarrativeSection, OwnerMemoirSummary } from "@/lib/api/client";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";
import { LoadingState, ErrorState } from "@/components/ui/ScreenStates";

import MemoirHeader from "@/features/FinalMemoir/MemoirHeader";
import MemoirHero from "@/features/FinalMemoir/MemoirHero";
import MemoirActionBar from "@/features/FinalMemoir/MemoirActionBar";
import MemoirSidebar from "@/features/FinalMemoir/MemoirSidebar";

import { ChapterSchema } from "@/features/dashboard/types/organization";
import type { Chapter } from "@/features/dashboard/types/organization";
import { z } from "zod";

interface RealMemory {
  id: string;
  title: string | null;
  body_text: string | null;
  occurred_start: string | null;
}

/**
 * Card for a real memory row. Comments are margin notes (MemoryComments) --
 * no reaction/like affordance here by design; see the comments feature's
 * own docstring.
 */
function RealMemoryCard({ memoirId, memory }: { memoirId: string; memory: RealMemory }) {
  const body = (memory.body_text ?? "").trim();

  return (
    <article className="mb-10 max-w-prose">
      {memory.title && <h3 className="font-serif text-subhead text-ink mb-1">{memory.title}</h3>}
      {memory.occurred_start && <p className="text-micro uppercase tracking-[0.06em] text-ink-muted mb-3">{memory.occurred_start}</p>}

      {body ? (
        <p className="font-serif text-body-read text-ink-secondary leading-relaxed whitespace-pre-wrap">{body}</p>
      ) : (
        <p className="font-serif text-body-read text-ink-muted italic">This memory has no text yet.</p>
      )}

      {/* Owners can always comment on their own memoir -- comment_policy
          only gates readers (see backend CommentsService.create_new_comment). */}
      <MemoryComments memoirId={memoirId} memoryId={memory.id} canComment />
    </article>
  );
}

export default function FinalMemoirPage() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeView, setActiveView] = useState<"timeline" | "chapters">("timeline");

  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [pdfFileName, setPdfFileName] = useState("memoir");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([]);
  const [memoirSummary, setMemoirSummary] = useState<OwnerMemoirSummary | null>(null);

  // Which memoir the current `chapters` belong to -- see the comment on
  // `loadedForMemoirId` below for why this isn't a boolean.
  const [loadedForMemoirId, setLoadedForMemoirId] = useState<string | null>(null);

  const [memoirId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const savedMemoir = localStorage.getItem("active_memoir");
      if (savedMemoir) {
        const parsed = JSON.parse(savedMemoir);
        return parsed.data?.id || parsed.id || "";
      }
    } catch (err) {
      console.error("Failed to parse active memoir from localStorage", err);
    }
    return "";
  });

  const noMemoirSelected = !memoirId;
  const resolvedLoading = !noMemoirSelected && loadedForMemoirId !== memoirId;
  const resolvedError = noMemoirSelected
    ? "No memoir selected. Open your dashboard and choose a memoir first."
    : chaptersError;

  const { triggerExport, isExporting } = useExportMemoir(memoirId);

  // Load the real chapter structure.
  useEffect(() => {
    if (!memoirId) return;

    let cancelled = false;
    const requestedMemoirId = memoirId;

    api
      .getChapters(requestedMemoirId)
      .then((data) => {
        if (cancelled) return;
        setChapters(z.array(ChapterSchema).parse(data));
        setChaptersError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setChapters([]);
        setChaptersError(err instanceof Error ? err.message : "Could not load this memoir.");
      })
      .finally(() => {
        if (!cancelled) setLoadedForMemoirId(requestedMemoirId);
      });

    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  // Real subject name/dates/cover image for the hero -- reuses the same
  // owner-memoir-list endpoint ProfilePage already calls, since there is no
  // single-memoir detail endpoint. Previously the hero never fetched
  // anything and showed a hardcoded "Nadia's Story" for every memoir.
  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;
    api
      .getUserMemoirs()
      .then((memoirs) => {
        if (cancelled) return;
        const match = memoirs.find((m: OwnerMemoirSummary) => m.id === memoirId);
        if (match) setMemoirSummary(match);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;
    api
      .getNarrativeSections(memoirId)
      .then((data) => {
        if (!cancelled) setNarrativeSections(data);
      })
      .catch(() => {
        if (!cancelled) setNarrativeSections([]);
      });
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleSearchTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 250);
  };

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chapters;
    return chapters
      .map((chapter) => ({
        ...chapter,
        memories: chapter.memories.filter((m) => {
          const haystack = [m.title ?? "", m.body_text ?? "", chapter.title, chapter.summary ?? ""].join(" ").toLowerCase();
          return haystack.includes(q);
        }),
      }))
      .filter(
        (chapter) =>
          chapter.memories.length > 0 ||
          chapter.title.toLowerCase().includes(q) ||
          (chapter.summary ?? "").toLowerCase().includes(q),
      );
  }, [chapters, searchQuery]);

  const hasRealChapters = chapters.length > 0;

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
    <div className="min-h-screen bg-canvas">
      <MemoirHeader isVisible={isVisible} />

      <div className="pt-14">
        <MemoirHero
          subjectName={memoirSummary?.subject_name ?? "This memoir"}
          dates={dates}
          coverImageUrl={memoirSummary?.cover_image_url}
        />

        <MemoirActionBar
          pdfFileName={pdfFileName}
          setPdfFileName={setPdfFileName}
          triggerExport={triggerExport}
          isExporting={isExporting}
          searchQuery={searchQuery}
          handleSearchTyping={handleSearchTyping}
          isTyping={isTyping}
        />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row px-6 md:px-10 py-4 gap-12">
          <main className="flex-1 max-w-3xl">
            {narrativeSections.length > 0 && (
              <p className="text-micro uppercase tracking-[0.06em] text-ink-muted mb-6">
                Composed from your family&apos;s own memories
              </p>
            )}

            {resolvedLoading ? (
              <LoadingState label="Opening the book…" />
            ) : resolvedError ? (
              <ErrorState message={resolvedError} />
            ) : !hasRealChapters ? (
              <div className="py-16 text-center">
                <p className="font-serif text-subhead text-ink mb-3">This memoir has no chapters yet</p>
                <p className="text-body-ui text-ink-secondary max-w-sm mx-auto">
                  Your memories are safe. Open your dashboard and choose
                  &ldquo;Organize into chapters&rdquo; to group them -- you&apos;ll get to
                  review everything before it changes.
                </p>
              </div>
            ) : filteredChapters.length === 0 ? (
              <p className="py-16 text-center font-serif text-body-read text-ink-muted italic">
                No entries found matching your search.
              </p>
            ) : (
              filteredChapters.map((chapter) => (
                <div key={chapter.id} className="mb-16">
                  <div className="border-b border-line pb-4 mb-6">
                    <h2 className="font-serif text-heading text-ink mb-1">{chapter.title}</h2>
                    {chapter.summary && (
                      <div className="mt-3 pl-4 border-l-2 border-line">
                        <p className="font-serif text-body-read font-light text-ink-secondary">{chapter.summary}</p>
                        <p className="mt-2 text-micro uppercase tracking-[0.06em] text-ink-muted font-semibold">
                          Composed by AI
                        </p>
                      </div>
                    )}
                  </div>

                  {narrativeSections.some((s) => s.chapter_id === chapter.id) && (
                    <div className="mb-8">
                      <NarrativeSectionsView
                        memoirId={memoirId}
                        sections={narrativeSections.filter((s) => s.chapter_id === chapter.id)}
                        showLabel={false}
                      />
                    </div>
                  )}

                  {chapter.memories.length === 0 ? (
                    <p className="font-serif text-body-read text-ink-muted italic">No memories recorded in this chapter yet.</p>
                  ) : (
                    chapter.memories.map((mem) => <RealMemoryCard key={mem.id} memoirId={memoirId} memory={mem} />)
                  )}
                </div>
              ))
            )}
          </main>

          <MemoirSidebar activeView={activeView} setActiveView={setActiveView} chapters={chapters} />
        </div>
      </div>
    </div>
  );
}

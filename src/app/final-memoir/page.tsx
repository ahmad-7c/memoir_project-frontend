// cspell:disable
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useExportMemoir } from "@/hooks/useExportMemoir";
import { api, NarrativeSection } from "@/lib/api/client";
import { NarrativeSectionsView } from "@/features/narrative/NarrativeSectionsView";
import { MemoryComments } from "@/features/comments/MemoryComments";

// Custom Components
import MemoirHeader from "@/features/FinalMemoir/MemoirHeader";
import MemoirHero from "@/features/FinalMemoir/MemoirHero";
import MemoirActionBar from "@/features/FinalMemoir/MemoirActionBar";
// NOTE: @/features/FinalMemoir/MemoryCard is intentionally not imported here.
// It renders the mock MemoryItem shape (author, reactionsCount, imageCaption),
// which has no equivalent in the database. Real memories are rendered by
// RealMemoryCard below. The mock component remains for the design preview.
import MemoirSidebar from "@/features/FinalMemoir/MemoirSidebar";
import ScatteredGallery from "@/features/FinalMemoir/ScatteredGallery";

// Mock Data
import { mockHeroPhotos, mockShortQuotes } from "@/features/FinalMemoir/mockData";
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
 * Card for a real memory row.
 *
 * Separate from the mock `MemoryCard` rather than adapting the mock one to
 * accept real data: that component's shape (author, reactionsCount, imageCaption,
 * chapter as a string) has no equivalent in the database, so a compatibility
 * layer would have to invent values. Rendering the fields that actually exist
 * is honest. Comments are margin notes (MemoryComments) -- no reaction/like
 * affordance here by design; see the comments feature's own docstring.
 */
function RealMemoryCard({ memoirId, memory }: { memoirId: string; memory: RealMemory }) {
  const body = (memory.body_text ?? "").trim();

  return (
    <article className="mb-8">
      {memory.title && (
        <h3 className="text-xl font-serif text-stone-800 dark:text-memory-ink mb-1">{memory.title}</h3>
      )}
      {memory.occurred_start && (
        <p className="text-[11px] font-sans uppercase tracking-[0.18em] text-stone-400 mb-2">
          {memory.occurred_start}
        </p>
      )}

      {body ? (
        <p className="text-[17px] font-serif leading-[1.9] text-stone-800 dark:text-memory-ink whitespace-pre-wrap">
          {body}
        </p>
      ) : (
        <p className="text-sm font-serif italic text-stone-400">
          This memory has no text yet.
        </p>
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
  
  const [showScatteredView, setShowScatteredView] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [pdfFileName, setPdfFileName] = useState("nadias-story");
  const [isTurningPage] = useState(false);

  // Real chapters from the backend.
  //
  // This page was previously driven entirely by mockMemories, which meant the
  // chapters an owner had just approved and applied never appeared here — the
  // memoir page was a design mock. `chapter_id` is the only link between a
  // chapter and its memories; grouping here is a view, not a copy.
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([]);

  // Which memoir the current `chapters` belong to.
  //
  // This replaces a `chaptersLoading` boolean. A boolean has to be set to true
  // inside the effect body, which is a synchronous setState in an effect and
  // triggers a cascading render. Tracking *what* was loaded instead lets
  // "loading" be derived during render, so nothing is written to state before
  // the fetch resolves.
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

  // Derived, not stored: there is nothing to fetch when no memoir is selected,
  // and "still loading" is simply "what we have isn't for this memoir yet".
  const noMemoirSelected = !memoirId;
  const resolvedLoading = !noMemoirSelected && loadedForMemoirId !== memoirId;
  const resolvedError = noMemoirSelected
    ? "No memoir selected. Open your dashboard and choose a memoir first."
    : chaptersError;

  const { triggerExport, isExporting } = useExportMemoir(memoirId);

  // Load the real chapter structure.
  //
  // `memoirId` comes from localStorage, so it is a hint and not an
  // authorization — the backend independently verifies that the authenticated
  // user is an active participant of that memoir. A 404 here means "not
  // yours / doesn't exist" and is reported as such rather than as an empty book.
  useEffect(() => {
    // No synchronous setState in this effect body: the loading flag is derived
    // from `loadedForMemoirId` above, so nothing is written to state until the
    // fetch actually settles. Calling setState synchronously in an effect
    // triggers a cascading render, which `npm run lint` rejects.
    if (!memoirId) return;

    let cancelled = false;
    const requestedMemoirId = memoirId;

    api
      .getChapters(requestedMemoirId)
      .then((data) => {
        if (cancelled) return;
        // Validated at the API boundary, but re-parsed here so a shape change
        // surfaces as a clear message rather than a crash mid-render of
        // someone's family book.
        setChapters(z.array(ChapterSchema).parse(data));
        setChaptersError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setChapters([]);
        setChaptersError(
          err instanceof Error ? err.message : "Could not load this memoir."
        );
      })
      .finally(() => {
        // Records that the load settled for this memoir, so the derived loading
        // flag turns off — on failure as well as success.
        if (!cancelled) setLoadedForMemoirId(requestedMemoirId);
      });

    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  // Narrative sections, if this memoir has any. Fetched the same way as
  // chapters: a .then/.catch chain only, nothing set synchronously in the
  // effect body.
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
          const haystack = [
            m.title ?? "",
            m.body_text ?? "",
            chapter.title,
            chapter.summary ?? "",
          ]
            .join(" ")
            .toLowerCase();
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-memory-bg font-serif text-stone-900 dark:text-memory-ink selection:bg-memory-maroon/20">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .font-serif { font-family: "Times New Roman", Times, serif !important; }
        .book-text { hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto; }
        @keyframes scribble {
          0% { transform: rotate(-12deg) translate(0px, 0px); }
          25% { transform: rotate(-16deg) translate(-1px, 2px); }
          50% { transform: rotate(-8deg) translate(2px, -1px); }
          75% { transform: rotate(-14deg) translate(-1px, 1px); }
          100% { transform: rotate(-12deg) translate(0px, 0px); }
        }
        .animate-scribble { animation: scribble 0.2s infinite; }
        .cursor-blink::after { content: '|'; animation: blink 1s step-start infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .clearfix::after { content: ""; clear: both; display: table; }
      `}} />

      <MemoirHeader isVisible={isVisible} />

      <MemoirHero onOpenGallery={() => setShowScatteredView(true)} />

      <div className="max-w-4xl mx-auto px-6 mb-8 flex flex-col gap-0.5 opacity-60">
        <div className="w-full h-[1px] bg-stone-300"></div>
        <div className="w-full h-[1px] bg-stone-300"></div>
      </div>

      <MemoirActionBar 
        pdfFileName={pdfFileName}
        setPdfFileName={setPdfFileName}
        triggerExport={triggerExport}
        isExporting={isExporting}
        searchQuery={searchQuery}
        handleSearchTyping={handleSearchTyping}
        isTyping={isTyping}
      />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row px-6 md:px-10 py-4 gap-8 md:gap-12">
        <main style={{ perspective: "2500px" }} className="flex-1 max-w-3xl">
          <div 
            className={`relative bg-[#FCFBF8] dark:bg-memory-card border border-stone-200/80 dark:border-memory-border px-6 md:px-10 py-6 rounded-sm pb-16 origin-left overflow-hidden ${
              isTurningPage 
                ? "transition-all duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] opacity-0 [transform:rotateY(-130deg)_rotateX(4deg)_scale(0.95)] shadow-2xl brightness-50" 
                : "transition-opacity duration-500 ease-in opacity-100 [transform:rotateY(0deg)_rotateX(0deg)_scale(1)] shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_0_60px_rgba(90,24,39,0.02)] brightness-100"
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/5 via-black/0 to-transparent pointer-events-none" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-black/5 via-transparent to-transparent pointer-events-none" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />

            {narrativeSections.length > 0 && (
              <p className="text-[10px] font-sans uppercase tracking-[0.18em] text-stone-400 mb-4 relative z-10">
                Composed from your family&apos;s own memories
              </p>
            )}

            {resolvedLoading ? (
              <div className="py-16 text-center text-stone-400 font-serif italic">
                Opening the book…
              </div>
            ) : resolvedError ? (
              <div className="py-16 text-center font-sans">
                <p className="text-stone-700 mb-2">{resolvedError}</p>
                <p className="text-sm text-stone-400">
                  If this keeps happening, the memoir may have been shared with a
                  different account.
                </p>
              </div>
            ) : !hasRealChapters ? (
              <div className="py-16 text-center font-sans">
                <p className="text-xl font-serif text-stone-700 mb-3">
                  This memoir has no chapters yet
                </p>
                <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
                  Your memories are safe. Open your dashboard and choose
                  &ldquo;Organize Timeline&rdquo; to group them into chapters —
                  you&apos;ll get to review everything before it changes.
                </p>
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="py-16 text-center text-stone-400 font-serif italic">
                No entries found matching your search.
              </div>
            ) : (
              filteredChapters.map((chapter) => (
                <div key={chapter.id} className="mb-8">
                  <div className="mb-3 mt-4 text-left relative flex flex-col">
                    <div className="w-full h-[2px] bg-stone-800 mb-3"></div>
                    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 dark:text-memory-ink mb-1 leading-tight">
                      {chapter.title}
                    </h2>
                    {chapter.summary && (
                      <>
                        <p className="text-[15px] font-serif leading-relaxed text-stone-700 my-3 whitespace-pre-wrap">
                          {chapter.summary}
                        </p>
                        {/* AI-written prose about a real person. Labelled so a
                            reader can tell whose words they are reading, and so
                            nobody assumes the family wrote it. */}
                        <p className="text-[9px] font-sans uppercase tracking-[0.18em] text-stone-400 mb-3">
                          Drafted with AI · editable by the family
                        </p>
                      </>
                    )}
                  </div>

                  {narrativeSections.some((s) => s.chapter_id === chapter.id) && (
                    <div className="mb-6">
                      <NarrativeSectionsView
                        memoirId={memoirId}
                        sections={narrativeSections.filter((s) => s.chapter_id === chapter.id)}
                        showLabel={false}
                      />
                    </div>
                  )}

                  {chapter.memories.length === 0 ? (
                    <p className="text-sm font-serif italic text-stone-400 py-2">
                      No memories recorded in this chapter yet.
                    </p>
                  ) : (
                    chapter.memories.map((mem) => (
                      <RealMemoryCard key={mem.id} memoirId={memoirId} memory={mem} />
                    ))
                  )}
                </div>
              ))
            )}

            {hasRealChapters && filteredChapters.length > 0 && (
              <div className="mt-16 flex flex-col items-center justify-center opacity-90 pb-8">
                <div 
                  className="relative w-20 h-20 bg-memory-maroon flex items-center justify-center cursor-default group"
                  style={{
                    boxShadow: "0 4px 10px rgba(0,0,0,0.2), inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.2)",
                    borderRadius: "50% 48% 52% 49% / 49% 51% 48% 52%"
                  }}
                >
                  <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-memory-maroon shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]"></div>
                  <div className="absolute bottom-1 -left-1 w-4 h-3 rounded-full bg-memory-maroon shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]"></div>
                  <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] bg-memory-maroon/50">
                    <span className="font-serif text-white/80 text-3xl italic font-bold select-none">N</span>
                  </div>
                </div>
                
                <div className="mt-8 text-center border-t border-stone-200/60 pt-6 flex flex-col items-center">
                  <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-stone-400 mb-4 font-semibold">
                    Sealed & Shared By
                  </p>
                  <p className="text-[16px] md:text-[18px] font-serif italic text-stone-600 max-w-lg leading-loose px-4">
                    Sarah, Amir, Uncle Tariq, Aunt Salma, Elena, Daniel, Leila, and Marcus.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <MemoirSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          mockShortQuotes={mockShortQuotes}
          chapters={chapters}
        />
      </div>

      {showScatteredView && (
        <ScatteredGallery 
          heroPhotos={mockHeroPhotos} 
          onClose={() => setShowScatteredView(false)} 
        />
      )}
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Pencil, ChevronUp, ChevronDown, ChevronRight, BookOpen, FolderOutput } from "lucide-react";
import { api } from "@/lib/api/client";
import AppTopBar from "@/components/AppTopBar";
import Footer from "@/components/Footer";
import { IdentityStrip } from "@/components/ui/IdentityStrip";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/ScreenStates";
import { useCoverPhotoUpload } from "@/features/dashboard/hooks";
import { useWorkspaceMemoir } from "@/features/memoirs/WorkspaceGuard";
import { workspaceTabs } from "@/features/memoirs/tabs";
import { ProposalReview } from "@/features/dashboard/components/ProposalReview";
import { PublishPanel } from "@/features/dashboard/components/PublishPanel";
import { NarrativePanel } from "@/features/dashboard/components/NarrativePanel";
import { ArchiveChatWidget } from "@/features/dashboard/components/ArchiveChatWidget";
import type { OrganizationProposal } from "@/features/dashboard/types/organization";

interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  created_by: string;
  memories: { id: string }[];
}

interface FeedMemory {
  id: string;
  title?: string;
  chapter_id?: string;
}

export default function ChaptersPage() {
  const memoir = useWorkspaceMemoir();
  const memoirId = memoir.id;
  const name = memoir.subject_name;
  const TABS = workspaceTabs(memoirId);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(memoir.cover_image_url ?? null);
  const cover = useCoverPhotoUpload(memoirId, setCoverImageUrl);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [proposal, setProposal] = useState<OrganizationProposal | null>(null);
  const [isApplyingProposal, setIsApplyingProposal] = useState(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);

  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [showNarrativePanel, setShowNarrativePanel] = useState(false);

  // Distinguishable from "no chapters yet", which it previously was not:
  // a failed load used to set an empty array and only console.warn, so a
  // broken request looked exactly like an un-organised memoir.
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  // Memory titles for the expand-a-chapter view. getChapters only returns
  // ids per chapter (see Chapter above), so this refetches the feed --
  // already used elsewhere for the same data -- rather than inventing a
  // backend shape that doesn't exist.
  const [feedMemories, setFeedMemories] = useState<FeedMemory[]>([]);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [movingMemoryId, setMovingMemoryId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const refreshChapters = useCallback(async () => {
    if (!memoirId) return;
    try {
      const [chaptersData, feedData] = await Promise.all([
        api.getChapters(memoirId),
        api.getMemoirFeed(memoirId),
      ]);
      setChapters(chaptersData as Chapter[]);
      setFeedMemories(feedData as FeedMemory[]);
      setChaptersError(null);
    } catch (err) {
      setChaptersError(
        err instanceof Error ? err.message : "The chapters didn't load.",
      );
    } finally {
      setChaptersLoading(false);
    }
  }, [memoirId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await refreshChapters();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshChapters]);

  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);
  const chapterIds = new Set(sorted.map((c) => c.id));
  const otherMemories = feedMemories.filter((m) => !m.chapter_id || !chapterIds.has(m.chapter_id));
  const memoriesByChapter = (chapterId: string) => feedMemories.filter((m) => m.chapter_id === chapterId);

  const handleMoveMemory = async (memoryId: string, targetChapterId: string) => {
    if (!memoirId || !targetChapterId) return;
    setMovingMemoryId(memoryId);
    setMoveError(null);
    try {
      await api.moveMemory(memoirId, memoryId, targetChapterId);
      await refreshChapters();
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Couldn't move that memory.");
    } finally {
      setMovingMemoryId(null);
    }
  };

  const handleGenerateTimeline = async () => {
    if (!memoirId) return;
    setIsGeneratingChapters(true);
    setOrganizeError(null);
    try {
      await api.generateTimeline(memoirId);
      const maxAttempts = 40;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusRes = await api.getOrganizeStatus(memoirId);
        if (statusRes.status === "ready") {
          const result = await api.getOrganizeProposal(memoirId);
          if (result?.data) {
            setProposal(result.data);
          } else {
            setOrganizeError("The AI finished but there's nothing to review. Please try again.");
          }
          break;
        }
        if (statusRes.status === "failed" || statusRes.status === "stalled") {
          setOrganizeError(statusRes.error_message ?? "Organizing didn't finish. You can try again.");
          break;
        }
      }
    } catch (e) {
      setOrganizeError(e instanceof Error ? e.message : "Failed to generate timeline");
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  const handleApplyProposal = async () => {
    if (!memoirId || !proposal) return;
    setIsApplyingProposal(true);
    setOrganizeError(null);
    try {
      await api.applyOrganizationProposal(memoirId, proposal.proposal_id);
      await refreshChapters();
      setProposal(null);
    } catch (e) {
      setOrganizeError(e instanceof Error ? e.message : "Could not apply the proposal");
    } finally {
      setIsApplyingProposal(false);
    }
  };

  const startRename = (chapter: Chapter) => {
    setRenamingId(chapter.id);
    setRenameValue(chapter.title);
  };

  const commitRename = async (chapterId: string) => {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!memoirId || !title) return;
    try {
      await api.renameChapter(memoirId, chapterId, title);
      setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, title } : c)));
    } catch (e) {
      console.error("Failed to rename chapter", e);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (!memoirId || target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const order = reordered.map((c, i) => ({ chapter_id: c.id, sort_order: i }));
    // Optimistic: the list visually reorders immediately rather than waiting
    // on the round trip, since this is a same-screen, low-risk reorder.
    setChapters(reordered.map((c, i) => ({ ...c, sort_order: i })));
    try {
      const updated = await api.reorderChapters(memoirId, order);
      setChapters(updated as Chapter[]);
    } catch (e) {
      console.error("Failed to reorder chapters", e);
      setChapters(sorted);
    }
  };

  return (
    <main>
      <AppTopBar />
      <IdentityStrip
        portraitSrc={coverImageUrl}
        portraitAlt={name ? `A photograph of ${name}` : "A photograph of this memoir's subject"}
        eyebrow="A life, taking shape"
        name={name || "Their memoir"}
        subtitle="The chapters of a life."
        onEditPortrait={cover.trigger}
        portraitUploading={cover.uploading}
      />
      {cover.error && <p className="max-w-[1440px] mx-auto px-6 md:px-16 -mt-4 mb-4 text-xs text-destructive">{cover.error}</p>}

      <div className="max-w-[1440px] mx-auto px-6 md:px-16">
        <SectionTabs tabs={TABS} active="The chapters" />

        <div className="flex items-center justify-between gap-4 py-6">
          <Button variant="ghost" onClick={handleGenerateTimeline} disabled={isGeneratingChapters || !memoirId}>
            <Sparkles size={14} /> {isGeneratingChapters ? "Organising…" : "Organise with AI"}
          </Button>
          <Button onClick={() => setShowPublishPanel(true)} disabled={!memoirId}>
            Review &amp; publish &rarr;
          </Button>
        </div>

        <div className="max-w-xl pb-10">
          <h2 className="font-serif text-4xl text-foreground mb-2">A book, not a collection.</h2>
          <p className="text-sm text-muted-foreground">Let each chapter hold a different part of their life.</p>
        </div>

        {organizeError && (
          <div role="alert" className="mb-8 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4 max-w-2xl">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
            <p className="text-sm text-foreground">{organizeError}</p>
          </div>
        )}

        {moveError && (
          <div role="alert" className="mb-8 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4 max-w-2xl">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
            <p className="text-sm text-foreground">{moveError}</p>
          </div>
        )}

        {proposal && (
          <div className="mb-10">
            <ProposalReview
              proposal={proposal}
              onApply={handleApplyProposal}
              onDiscard={() => setProposal(null)}
              isApplying={isApplyingProposal}
            />
          </div>
        )}

        {chaptersLoading ? (
          <LoadingState label="Still gathering the chapters…" />
        ) : chaptersError ? (
          <div role="alert" className="py-10 text-center max-w-md mx-auto">
            <p className="font-serif text-2xl text-foreground mb-3">The chapters didn&rsquo;t load.</p>
            <p className="text-sm text-muted-foreground mb-5">{chaptersError}</p>
            <Button variant="outline" onClick={refreshChapters}>
              Try again
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-10 text-center max-w-md mx-auto">
            <p className="font-serif text-2xl text-foreground mb-3">No chapters yet.</p>
            <p className="text-sm text-muted-foreground">
              Add a few memories first, then let the chapters take shape — on their own, or with a hand from
              &ldquo;Organise with AI.&rdquo;
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-b border-border mb-10">
            {sorted.map((chapter, index) => {
              const isExpanded = expandedChapterId === chapter.id;
              const chapterMemories = memoriesByChapter(chapter.id);
              return (
                <li key={chapter.id} className="py-6">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                      aria-label={isExpanded ? `Collapse ${chapter.title}` : `Expand ${chapter.title}`}
                      aria-expanded={isExpanded}
                      className="font-serif text-3xl text-muted-foreground w-10 shrink-0 flex items-center justify-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </button>
                    <div className="flex-1 min-w-0">
                      {renamingId === chapter.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(chapter.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(chapter.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="font-serif text-xl text-foreground bg-transparent border-b border-border focus:outline-none w-full"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                          className="flex items-center gap-2 text-left cursor-pointer group"
                        >
                          <h3 className="font-serif text-xl text-foreground truncate group-hover:opacity-80 transition-opacity">
                            {chapter.title}
                          </h3>
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                          )}
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {chapter.memories.length} {chapter.memories.length === 1 ? "memory" : "memories"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startRename(chapter)}
                        aria-label={`Rename ${chapter.title}`}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${chapter.title} up`}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === sorted.length - 1}
                        aria-label={`Move ${chapter.title} down`}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 ml-16 flex flex-col gap-2">
                      {chapterMemories.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No memories in this chapter yet.</p>
                      ) : (
                        chapterMemories.map((memory) => (
                          <div
                            key={memory.id}
                            className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0"
                          >
                            <span className="text-sm text-foreground truncate">
                              {memory.title || "Untitled"}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <FolderOutput size={12} className="text-muted-foreground" aria-hidden="true" />
                              <select
                                value={chapter.id}
                                disabled={movingMemoryId === memory.id}
                                onChange={(e) => handleMoveMemory(memory.id, e.target.value)}
                                aria-label={`Move "${memory.title || "Untitled"}" to another chapter`}
                                className="text-xs bg-background border border-border rounded-md px-2 h-7 text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {sorted.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!chaptersLoading && !chaptersError && otherMemories.length > 0 && (
          <div className="mb-16 max-w-2xl">
            <h3 className="text-xs font-medium uppercase tracking-[2px] text-muted-foreground mb-3">
              Other memories
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Not yet part of a chapter. Move each one in when it finds its place.
            </p>
            <div className="flex flex-col gap-2 border-t border-border">
              {otherMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-border"
                >
                  <span className="text-sm text-foreground truncate">{memory.title || "Untitled"}</span>
                  {sorted.length > 0 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <FolderOutput size={12} className="text-muted-foreground" aria-hidden="true" />
                      <select
                        value=""
                        disabled={movingMemoryId === memory.id}
                        onChange={(e) => handleMoveMemory(memory.id, e.target.value)}
                        aria-label={`Move "${memory.title || "Untitled"}" into a chapter`}
                        className="text-xs bg-background border border-border rounded-md px-2 h-7 text-foreground focus:outline-none focus:border-accent transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Move to…
                        </option>
                        {sorted.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pb-16">
          <Button variant="outline" onClick={() => setShowNarrativePanel(true)} disabled={!memoirId}>
            <BookOpen size={14} /> Compose the narrative
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3 max-w-xs mx-auto">
            Their memories remain their own. Composed passages are always labelled.
          </p>
        </div>
      </div>

      <PublishPanel memoirId={memoirId} open={showPublishPanel} onClose={() => setShowPublishPanel(false)} />
      <NarrativePanel memoirId={memoirId} open={showNarrativePanel} onClose={() => setShowNarrativePanel(false)} />

      {/* §5b. Lives on this page because every change it can propose is a
          change to this page's chapter list -- and refreshes that list the
          moment one is applied, so the result is visible immediately. */}
      <ArchiveChatWidget memoirId={memoirId} onApplied={refreshChapters} />

      <Footer />
    </main>
  );
}

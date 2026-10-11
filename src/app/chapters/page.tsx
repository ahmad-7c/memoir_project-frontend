"use client";

import { useEffect, useState } from "react";
import { Sparkles, Pencil, ChevronUp, ChevronDown, BookOpen } from "lucide-react";
import { api } from "@/lib/api/client";
import AppTopBar from "@/components/AppTopBar";
import Footer from "@/components/Footer";
import { IdentityStrip } from "@/components/ui/IdentityStrip";
import { SectionTabs } from "@/components/ui/SectionTabs";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/ScreenStates";
import { useActiveMemoir, useCoverPhotoUpload } from "@/features/dashboard/hooks";
import { ProposalReview } from "@/features/dashboard/components/ProposalReview";
import { PublishPanel } from "@/features/dashboard/components/PublishPanel";
import { NarrativePanel } from "@/features/dashboard/components/NarrativePanel";
import type { OrganizationProposal } from "@/features/dashboard/types/organization";

const TABS = [
  { label: "Memories", href: "/memories" },
  { label: "The chapters", href: "/chapters" },
  { label: "Preview memoir", href: "/memoir" },
];

interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  created_by: string;
  memories: { id: string }[];
}

export default function ChaptersPage() {
  const { memoirId, name, coverImageUrl, setCoverImageUrl } = useActiveMemoir();
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

  useEffect(() => {
    if (!memoirId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getChapters(memoirId);
        if (!cancelled) setChapters(data as Chapter[]);
      } catch (err) {
        console.warn("Could not load chapters", err);
        if (!cancelled) setChapters([]);
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memoirId]);

  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);

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
      const data = await api.getChapters(memoirId);
      setChapters(data as Chapter[]);
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
            {sorted.map((chapter, index) => (
              <li key={chapter.id} className="flex items-center gap-6 py-6">
                <span className="font-serif text-3xl text-muted-foreground w-10 shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
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
                    <h3 className="font-serif text-xl text-foreground truncate">{chapter.title}</h3>
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
              </li>
            ))}
          </ul>
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

      <Footer />
    </main>
  );
}

"use client";

import React, { useState } from "react";
import { Wand2, Edit2 } from "lucide-react";
import { MemoryItem } from "../types";
import { MemoryCard } from "./MemoryCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface MemoryArchiveProps {
  expandedStacks: string[];
  toggleStack: (kind: string) => void;
  mockMemories: (MemoryItem & {
    audioUrl?: string;
    mediaUrl?: string;
    transcription?: string;
    chapter_id?: string;
    content?: string;
    title?: string;
  })[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chapters?: any[];
  isGenerating?: boolean;
  onGenerateTimeline?: () => void;
  onRenameChapter?: (chapterId: string, newTitle: string) => void;
  onMemoryOptionSelect?: (action: string, memoryId: string, targetChapterId?: string) => void;

  /** Active pipeline stage from the backend, e.g. "reading memories". */
  organizeStage?: string | null;
  /** Full stage list, so the wait is legible instead of an opaque spinner. */
  organizeStages?: string[];
  /** Owner-facing failure message, if the last run failed or stalled. */
  organizeError?: string | null;
}

const GROUP_LIMIT = 3;

/**
 * The memory feed. Previously "stacked physical pieces" that scaled,
 * rotated and cast shadows to simulate a pile of paper, plus a shadowed
 * pill view-toggle -- replaced with a plain vertical feed and a hairline
 * segmented control, matching the brief's "vertical feed of entries, not
 * table rows."
 */
export function MemoryArchive({
  expandedStacks,
  toggleStack,
  mockMemories,
  chapters = [],
  isGenerating = false,
  onGenerateTimeline,
  onRenameChapter,
  onMemoryOptionSelect,
  organizeStage = null,
  organizeStages = [],
  organizeError = null,
}: MemoryArchiveProps) {
  const [viewMode, setViewMode] = useState<"material" | "timeline">("material");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleSaveChapterTitle = (chapterId: string) => {
    if (editTitle.trim() && onRenameChapter) {
      onRenameChapter(chapterId, editTitle.trim());
    }
    setEditingChapterId(null);
  };

  return (
    <section id="archive" className="pt-16 border-t border-line">
      <div className="flex items-center justify-between mb-10">
        <h3 className="font-serif text-heading text-ink">The memory archive</h3>

        <div className="flex items-center border border-line rounded-sm overflow-hidden">
          {(["material", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-small font-medium transition-colors cursor-pointer ${
                viewMode === mode ? "bg-surface-sunk text-ink" : "text-ink-muted hover:text-ink-secondary"
              }`}
            >
              {mode === "material" ? "By kind" : "By chapter"}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "material" && (
        <div className="flex flex-col gap-16">
          {[
            { id: "text", title: "Written reflections", items: mockMemories.filter((m) => m.kind === "text") },
            { id: "photo", title: "Photographs", items: mockMemories.filter((m) => m.kind === "photo" || m.kind === "combined") },
            { id: "audio", title: "Voice notes", items: mockMemories.filter((m) => m.kind === "audio") },
          ].map((group) => {
            if (group.items.length === 0) return null;
            const isExpanded = expandedStacks.includes(group.id);
            const visibleItems = isExpanded ? group.items : group.items.slice(0, GROUP_LIMIT);

            return (
              <div key={group.id}>
                <h4 className="font-serif text-subhead text-ink mb-2">{group.title}</h4>
                <div>
                  {visibleItems.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      availableChapters={chapters}
                      onOptionSelect={(action, id, targetChapterId) => onMemoryOptionSelect?.(action, id, targetChapterId)}
                      onPlayAudio={(id) => console.log("Play audio", id)}
                    />
                  ))}
                </div>
                {group.items.length > GROUP_LIMIT && (
                  <button
                    type="button"
                    onClick={() => toggleStack(group.id)}
                    className="mt-4 text-body-ui font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer"
                  >
                    {isExpanded ? "Show fewer" : `Show all ${group.items.length}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "timeline" && (
        <div className="max-w-prose mx-auto">
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-line rounded-md">
              <Wand2 size={22} className="text-ink-muted mb-4" />
              <h4 className="font-serif text-subhead text-ink mb-2">Not yet organized</h4>
              <p className="text-body-ui text-ink-secondary max-w-sm mb-8">
                Let the archive be arranged into chapters, in order.
              </p>
              <Button type="button" onClick={onGenerateTimeline} disabled={isGenerating}>
                {isGenerating ? organizeStage ?? "Reading the memories…" : "Organize into chapters"}
              </Button>

              {isGenerating && organizeStages.length > 0 && (
                <ul className="mt-8 flex flex-col gap-2 text-left" aria-live="polite">
                  {organizeStages.map((stage, i) => {
                    const activeIndex = organizeStages.indexOf(organizeStage ?? organizeStages[0]);
                    const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
                    return (
                      <li
                        key={stage}
                        className={`text-small ${state === "pending" ? "text-ink-muted" : "text-ink-secondary"} ${
                          state === "active" ? "font-semibold text-ink" : ""
                        }`}
                      >
                        {stage}
                      </li>
                    );
                  })}
                </ul>
              )}

              {organizeError && (
                <div role="alert" className="mt-6 flex items-start gap-3 text-left border border-line rounded-md px-4 py-3 max-w-sm mx-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
                  <p className="text-small text-ink">{organizeError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {chapters.map((chapter) => {
                const chapterMemories = mockMemories.filter(
                  (m) => m.chapter_id && chapter.id && String(m.chapter_id).trim() === String(chapter.id).trim(),
                );

                return (
                  <article key={chapter.id}>
                    <div className="border-b border-line pb-4 mb-6 group flex items-center justify-between">
                      {editingChapterId === chapter.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSaveChapterTitle(chapter.id)}
                          />
                          <button
                            onClick={() => handleSaveChapterTitle(chapter.id)}
                            className="text-small font-semibold text-ink hover:underline cursor-pointer shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="font-serif text-heading text-ink">{chapter.title}</h2>
                          <button
                            onClick={() => { setEditingChapterId(chapter.id); setEditTitle(chapter.title); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink-muted hover:text-ink cursor-pointer"
                            title="Edit chapter title"
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                    </div>

                    {chapter.summary && <p className="font-serif text-body-read text-ink-secondary italic mb-6">{chapter.summary}</p>}

                    {chapterMemories.length === 0 ? (
                      <p className="text-body-ui text-ink-muted italic py-4">No memories in this chapter yet.</p>
                    ) : (
                      chapterMemories.map((memory) => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          onOptionSelect={(action, id, targetChapterId) => onMemoryOptionSelect?.(action, id, targetChapterId)}
                        />
                      ))
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

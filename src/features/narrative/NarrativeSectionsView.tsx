"use client";

import { NarrativeSection } from "@/lib/api/client";
import { NarrativeSources } from "./NarrativeSources";

interface NarrativeSectionsViewProps {
  memoirId: string;
  sections: NarrativeSection[];
  /** Set on the reader share page only -- routes Sources through /api/share/{shareToken}/... */
  shareToken?: string;
  readerToken?: string;
  /** Set false when rendering per-chapter and the page shows the label once elsewhere. */
  showLabel?: boolean;
}

/**
 * Renders the AI-composed narrative with its persistent, honest label and a
 * Sources control under every section. Used on both the owner's book view
 * and the reader's unlocked share page -- the family must be able to check
 * the narrative against what was actually said, from either side.
 *
 * Each section is set lighter-weight Fraunces in --ink-secondary with a
 * hairline rule to its left, so a reader can tell at a glance -- without
 * reading closely -- which words are a person's and which are composed.
 */
export function NarrativeSectionsView({
  memoirId,
  sections,
  shareToken,
  readerToken,
  showLabel = true,
}: NarrativeSectionsViewProps) {
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {showLabel && (
        <p className="text-micro uppercase tracking-[0.06em] text-ink-muted">Composed from your family&apos;s own memories</p>
      )}
      {sections.map((section) => (
        <div key={section.id} className="pl-4 border-l-2 border-line">
          <p className="font-serif text-body-read font-light text-ink-secondary whitespace-pre-wrap">{section.body}</p>
          <p className="mt-2 text-micro uppercase tracking-[0.06em] text-ink-muted font-semibold">Composed by AI</p>
          <NarrativeSources memoirId={memoirId} sectionId={section.id} shareToken={shareToken} readerToken={readerToken} />
        </div>
      ))}
    </div>
  );
}

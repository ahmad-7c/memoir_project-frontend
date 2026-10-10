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
    <div className="space-y-8">
      {showLabel && (
        <p className="text-[10px] font-sans uppercase tracking-[0.18em] text-stone-400 mb-3">
          Composed from your family&apos;s own memories
        </p>
      )}
      {sections.map((section) => (
        <div key={section.id}>
          <p className="text-[17px] font-serif leading-[1.9] text-stone-800 whitespace-pre-wrap">
            {section.body}
          </p>
          <NarrativeSources
            memoirId={memoirId}
            sectionId={section.id}
            shareToken={shareToken}
            readerToken={readerToken}
          />
        </div>
      ))}
    </div>
  );
}

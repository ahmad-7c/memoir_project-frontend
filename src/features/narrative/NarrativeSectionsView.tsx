"use client";

import { NarrativeSection } from "@/lib/api/client";
import { NarrativeSources } from "./NarrativeSources";
import { cn } from "@/lib/utils";
import { DROP_CAP_CLASS } from "@/lib/dropCap";

interface NarrativeSectionsViewProps {
  memoirId: string;
  sections: NarrativeSection[];
  /** Set on the reader share page only -- routes Sources through /api/share/{shareToken}/... */
  shareToken?: string;
  readerToken?: string;
  /** Set false when rendering per-chapter and the page shows the label once elsewhere. */
  showLabel?: boolean;
  /** The published memoir page only: this chapter opens with these sections. */
  dropCapFirst?: boolean;
}

/**
 * Renders the AI-composed narrative with its persistent, honest label and a
 * Sources control under every section. Used on both the owner's book view
 * and the reader's unlocked share page -- the family must be able to check
 * the narrative against what was actually said, from either side.
 *
 * Each section is set lighter-weight Fraunces in --ink-secondary with a
 * brass hairline rule to its left and a small persistent label, so a reader
 * can tell at a glance -- without reading closely -- which words are a
 * person's and which are composed. Brass here is one of this screen's two
 * rationed brass elements (the other being the chapter numeral).
 */
export function NarrativeSectionsView({
  memoirId,
  sections,
  shareToken,
  readerToken,
  showLabel = true,
  dropCapFirst = false,
}: NarrativeSectionsViewProps) {
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section, index) => (
        <div key={section.id}>
          <p
            className={cn(
              "text-sm text-foreground leading-relaxed whitespace-pre-wrap",
              dropCapFirst && index === 0 && DROP_CAP_CLASS,
            )}
          >
            {section.body}
          </p>
          {showLabel && (
            <p className="mt-3 text-[11px] text-muted-foreground">Composed with AI &middot; from family memories</p>
          )}
          <NarrativeSources memoirId={memoirId} sectionId={section.id} shareToken={shareToken} readerToken={readerToken} />
        </div>
      ))}
    </div>
  );
}

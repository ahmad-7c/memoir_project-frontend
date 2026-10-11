"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { api, SourceMemory } from "@/lib/api/client";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

interface NarrativeSourcesProps {
  memoirId: string;
  sectionId: string;
  /** Set on the reader share page only -- routes through /api/share/{shareToken}/... */
  shareToken?: string;
  readerToken?: string;
}

/**
 * The Sources button: reveals the exact memories a narrative section was
 * derived from, verbatim -- text, photos, audio players, transcripts. Makes
 * the narrative's claim checkable rather than trusted, same mechanism as
 * citation in retrieval systems. Visible to both the owner and a reader who
 * unlocked the share link (readerToken is only passed on the reader page).
 * Understated, in Small; expands in place, never a modal.
 */
export function NarrativeSources({ memoirId, sectionId, shareToken, readerToken }: NarrativeSourcesProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<SourceMemory[] | null>(null);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (memories) return;

    setLoading(true);
    setError(null);
    const request =
      shareToken && readerToken
        ? api.getSharedSources(shareToken, sectionId, readerToken)
        : api.getNarrativeSources(memoirId, sectionId, readerToken);
    request
      .then((data) => setMemories(data))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load sources.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <span aria-hidden="true">📖</span>
        From the family&rsquo;s memories
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 rounded-md bg-secondary p-5 flex flex-col gap-4">
          {loading && <p className="text-xs text-muted-foreground italic">Loading sources…</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {memories?.map((memory) => (
            <div key={memory.id}>
              <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-1.5">
                {memory.author_name || "Family"}
                {memory.occurred_start && <> &middot; {memory.occurred_start}</>}
              </p>
              {memory.title && <p className="text-xs font-medium text-foreground mb-1">{memory.title}</p>}
              {memory.body_text && (
                <p className="text-sm leading-relaxed text-foreground">&ldquo;{memory.body_text}&rdquo;</p>
              )}
              {memory.media.map((m) => (
                <div key={m.id} className="mt-2">
                  {m.kind === "photo" && m.playback_url && (
                    /* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL */
                    <img
                      src={m.playback_url}
                      alt={m.caption || memory.title || "Source photo"}
                      className="max-w-60 rounded-md border border-border"
                    />
                  )}
                  {m.kind === "audio" && m.playback_url && (
                    <div className="flex flex-col gap-1.5">
                      <AudioPlayer src={m.playback_url} />
                      {m.transcript_text && (
                        <p className="text-xs text-muted-foreground italic pl-3 border-l border-border">&ldquo;{m.transcript_text}&rdquo;</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

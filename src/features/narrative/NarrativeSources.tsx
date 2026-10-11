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
        className="inline-flex items-center gap-1 text-small text-ink-muted hover:text-ink-secondary transition-colors cursor-pointer"
      >
        Sources
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 pl-4 border-l-2 border-line flex flex-col gap-4">
          {loading && <p className="text-small text-ink-muted italic">Loading sources…</p>}
          {error && <p className="text-small text-alert">{error}</p>}
          {memories?.map((memory) => (
            <div key={memory.id}>
              <div className="flex items-baseline gap-2 mb-1">
                {memory.title && <span className="font-semibold text-small text-ink">{memory.title}</span>}
                {memory.occurred_start && <span className="text-micro uppercase tracking-[0.06em] text-ink-muted">{memory.occurred_start}</span>}
              </div>
              {memory.body_text && (
                <p className="font-serif text-body-read text-ink-secondary whitespace-pre-wrap">{memory.body_text}</p>
              )}
              {memory.media.map((m) => (
                <div key={m.id} className="mt-2">
                  {m.kind === "photo" && m.playback_url && (
                    /* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL */
                    <img
                      src={m.playback_url}
                      alt={m.caption || memory.title || "Source photo"}
                      className="max-w-60 rounded-sm border border-line"
                    />
                  )}
                  {m.kind === "audio" && m.playback_url && (
                    <div className="flex flex-col gap-1.5">
                      <AudioPlayer src={m.playback_url} />
                      {m.transcript_text && (
                        <p className="text-small text-ink-muted italic pl-3 border-l border-line">&ldquo;{m.transcript_text}&rdquo;</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {memory.author_name && <p className="mt-1 text-micro uppercase tracking-[0.06em] text-ink-muted">— {memory.author_name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

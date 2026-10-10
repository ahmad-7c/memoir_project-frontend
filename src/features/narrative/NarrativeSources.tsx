"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { api, SourceMemory } from "@/lib/api/client";

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
        className="inline-flex items-center gap-1 text-[11px] font-sans uppercase tracking-[0.15em] text-stone-400 hover:text-memory-primary transition-colors cursor-pointer"
      >
        Sources
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-3 pl-4 border-l-2 border-stone-200 space-y-4 font-sans">
          {loading && (
            <p className="text-xs text-stone-400 italic">Loading sources...</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {memories?.map((memory) => (
            <div key={memory.id} className="text-sm">
              <div className="flex items-baseline gap-2 mb-1">
                {memory.title && (
                  <span className="font-semibold text-stone-800">{memory.title}</span>
                )}
                {memory.occurred_start && (
                  <span className="text-[10px] uppercase tracking-wider text-stone-400">
                    {memory.occurred_start}
                  </span>
                )}
              </div>
              {memory.body_text && (
                <p className="text-stone-700 whitespace-pre-wrap font-serif leading-relaxed">
                  {memory.body_text}
                </p>
              )}
              {memory.media.map((m) => (
                <div key={m.id} className="mt-2">
                  {m.kind === "photo" && m.playback_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.playback_url}
                      alt={m.caption || memory.title || "Source photo"}
                      className="max-w-60 rounded-sm border border-stone-200 shadow-sm"
                    />
                  )}
                  {m.kind === "audio" && m.playback_url && (
                    <div className="space-y-1.5">
                      <audio
                        controls
                        src={m.playback_url}
                        className="w-full max-w-70 h-9"
                        controlsList="nodownload"
                      />
                      {m.transcript_text && (
                        <p className="text-[13px] text-stone-600 italic pl-3 border-l border-stone-300">
                          &quot;{m.transcript_text}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {memory.author_name && (
                <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-400">
                  — {memory.author_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

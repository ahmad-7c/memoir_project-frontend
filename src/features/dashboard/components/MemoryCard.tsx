"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Edit2, Trash2, FolderOutput } from "lucide-react";
import { MemoryItem } from "../types";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { InitialAvatar } from "@/components/ui/InitialAvatar";
import { api } from "@/lib/api/client";

interface MemoryCardProps {
  memory: MemoryItem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableChapters?: any[];
  onOptionSelect?: (action: string, memoryId: string, targetChapterId?: string) => void;
  /** Called after a retry is accepted so the caller can re-poll the feed for the new status. */
  onRetried?: () => void;
}

const TRANSCRIPTION_STATUS_LABEL: Record<string, string> = {
  pending: "Transcribing…",
  processing: "Transcribing…",
  failed: "Transcription failed.",
  stalled: "Transcription didn't finish.",
};

/**
 * The reference's feed-card recipe: small circular avatar + attribution,
 * bold serif title, body paragraph, an optional full-width photo (no
 * border-radius -- deliberately different from CaptionedPhoto elsewhere,
 * confirmed by measuring the reference's own card), an optional audio
 * player. The backend models `author` as a flat string with no separate
 * relationship field, so the attribution line shows the name alone rather
 * than inventing a "· relationship" suffix the data can't support.
 */
export function MemoryCard({ memory, onOptionSelect, availableChapters, onRetried }: MemoryCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleRetry = async () => {
    if (!memory.audioAssetId || retrying) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await api.retryTranscription(memory.audioAssetId);
      onRetried?.();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Couldn't retry the transcription.");
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <article className="w-full py-8 border-b border-border last:border-b-0 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <InitialAvatar initial={memory.author?.[0]?.toUpperCase() || "?"} size={28} />
          <span className="text-xs text-muted-foreground">{memory.author}</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
            aria-label="Memory options"
          >
            <MoreHorizontal size={16} />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md py-1.5 z-20">
              <button
                type="button"
                onClick={() => { setShowOptions(false); onOptionSelect?.("edit", memory.id); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Edit2 size={14} /> Edit detail
              </button>
              <button
                type="button"
                onClick={() => { setShowOptions(false); onOptionSelect?.("delete", memory.id); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium text-destructive hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} /> Remove
              </button>

              {availableChapters && availableChapters.length > 0 && (
                <>
                  <div className="h-px bg-border my-1 mx-2" />
                  <div className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground">
                    Move to chapter
                  </div>
                  {availableChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => { setShowOptions(false); onOptionSelect?.("move", memory.id, chapter.id); }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer ${
                        memory.chapter_id === chapter.id ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <FolderOutput size={12} className="shrink-0" />
                      <span className="truncate">{chapter.title}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {memory.title && <h4 className="font-serif text-xl text-foreground mb-2 leading-tight">{memory.title}</h4>}

      {(memory.kind === "photo" || memory.kind === "combined") && memory.mediaUrl && (
        /* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URLs */
        <img
          src={memory.mediaUrl}
          alt={memory.title || "A photograph from this memory"}
          className="w-full mb-4 object-cover"
        />
      )}

      {memory.content && (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{memory.content}</p>
      )}

      {(memory.kind === "audio" || memory.kind === "combined") && memory.audioUrl && (
        <div className="mt-4">
          <AudioPlayer src={memory.audioUrl} />
        </div>
      )}

      {memory.transcription ? (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-2">Transcription</p>
          <p className="text-sm text-foreground leading-relaxed">&ldquo;{memory.transcription}&rdquo;</p>
        </div>
      ) : memory.transcriptionStatus && memory.transcriptionStatus !== "ready" ? (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {TRANSCRIPTION_STATUS_LABEL[memory.transcriptionStatus] ?? "Transcribing…"}
          </p>
          {(memory.transcriptionStatus === "failed" || memory.transcriptionStatus === "stalled") && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="text-xs font-medium text-accent hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {retrying ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      ) : null}
      {retryError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {retryError}
        </p>
      )}
    </article>
  );
}

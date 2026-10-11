"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Edit2, Trash2, FolderOutput } from "lucide-react";
import { MemoryItem } from "../types";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

interface MemoryCardProps {
  memory: MemoryItem & {
    audioUrl?: string;
    chapter_id?: string;
    mediaUrl?: string;
    transcription?: string;
    duration?: string;
    content?: string;
    title?: string;
    date?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availableChapters?: any[];
  onOptionSelect?: (action: string, memoryId: string, targetChapterId?: string) => void;
  onPlayAudio?: (memoryId: string) => void;
}

/**
 * One entry in the feed. Previously each memory kind (text/photo/audio/
 * combined) got its own decorative treatment -- a different border style,
 * a rotated drop-shadow "duplicate" layer behind it, dashed outlines, a
 * paper-grain texture. All of that is gone: every entry now looks the
 * same regardless of kind, because the brief wants entries that read as a
 * calm feed, not a scrapbook of different materials competing for
 * attention. Only the content inside differs.
 */
export function MemoryCard({ memory, onOptionSelect, onPlayAudio, availableChapters }: MemoryCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <article className="w-full py-8 border-b border-line last:border-b-0 group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-micro uppercase tracking-[0.06em] text-ink-muted font-semibold">{memory.date}</span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100"
            aria-label="Memory options"
          >
            <MoreHorizontal size={16} />
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                key="card-options"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-48 bg-surface border border-line rounded-md py-1.5 z-20"
              >
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); onOptionSelect?.("edit", memory.id); }}
                  className="w-full text-left px-4 py-2.5 text-small font-medium text-ink-secondary hover:bg-surface-sunk hover:text-ink transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 size={14} /> Edit detail
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOptions(false); onOptionSelect?.("delete", memory.id); }}
                  className="w-full text-left px-4 py-2.5 text-small font-medium text-alert hover:bg-surface-sunk transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={14} /> Remove
                </button>

                {availableChapters && availableChapters.length > 0 && (
                  <>
                    <div className="h-px bg-line my-1 mx-2" />
                    <div className="px-4 py-1.5 text-micro font-semibold text-ink-muted uppercase tracking-[0.06em]">
                      Move to chapter
                    </div>
                    {availableChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => { setShowOptions(false); onOptionSelect?.("move", memory.id, chapter.id); }}
                        className={`w-full text-left px-4 py-2 text-small font-medium hover:bg-surface-sunk transition-colors flex items-center gap-2 cursor-pointer ${
                          memory.chapter_id === chapter.id ? "text-ink" : "text-ink-secondary"
                        }`}
                      >
                        <FolderOutput size={12} className="shrink-0" />
                        <span className="truncate">{chapter.title}</span>
                      </button>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        {memory.title && <h4 className="font-serif text-subhead text-ink mb-2 leading-tight">{memory.title}</h4>}

        {(memory.kind === "photo" || memory.kind === "combined") && memory.mediaUrl && (
          /* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URLs */
          <img
            src={memory.mediaUrl}
            alt={memory.title || "A photograph from this memory"}
            className="w-full max-w-md rounded-sm mb-4 object-cover"
          />
        )}

        {memory.content && (
          <p className="font-serif text-body-read text-ink-secondary leading-relaxed whitespace-pre-wrap">
            {memory.content}
          </p>
        )}

        {(memory.kind === "audio" || memory.kind === "combined") && memory.audioUrl && (
          <div className="mt-4">
            <AudioPlayer src={memory.audioUrl} />
          </div>
        )}

        {memory.kind === "audio" && !memory.audioUrl && (
          <button
            type="button"
            onClick={() => onPlayAudio?.(memory.id)}
            className="mt-2 flex items-center gap-3 text-body-ui text-ink-secondary hover:text-ink transition-colors cursor-pointer"
          >
            Play voice note
            {memory.duration && <span className="text-small text-ink-muted">{memory.duration}</span>}
          </button>
        )}

        {memory.transcription && (
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-micro uppercase tracking-[0.06em] text-ink-muted font-semibold mb-2">Transcription</p>
            <p className="font-serif text-body-read text-ink-secondary leading-relaxed">&ldquo;{memory.transcription}&rdquo;</p>
          </div>
        )}
      </div>
    </article>
  );
}

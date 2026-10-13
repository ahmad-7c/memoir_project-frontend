"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * `.audio-player`: --secondary fill, 14px/16px padding, a circular play
 * button, a thin seek line, a time label. The caption above, the
 * attribution/transcript row below, belong to the composing component
 * (AudioMemory) since that copy differs per context.
 */
export function AudioPlayer({ src, className = "" }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    });
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => undefined);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const next = Number(e.target.value);
    el.currentTime = next;
    setCurrentTime(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 rounded-md bg-secondary px-4 py-3.5", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-border text-foreground hover:bg-card transition-colors cursor-pointer"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={seek}
        aria-label="Seek"
        className="flex-1 h-1 rounded-sm appearance-none cursor-pointer bg-border accent-[var(--accent)]"
        style={{
          background: `linear-gradient(to right, var(--accent) ${progress}%, var(--border) ${progress}%)`,
        }}
      />
      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

/**
 * The recurring compound: an optional italic caption above the player, the
 * player itself, and an attribution / transcript-disclosure row below.
 * Appears identically on the landing sample, the /memories feed and the
 * /memoir Sources panel.
 */
export function AudioMemory({
  src,
  caption,
  attribution,
  transcript,
  className = "",
}: {
  src: string;
  caption?: string;
  attribution: string;
  transcript?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      {caption && <p className="font-serif italic text-base text-foreground mb-2">&ldquo;{caption}&rdquo;</p>}
      <AudioPlayer src={src} />
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{attribution}</span>
        {transcript && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="cursor-pointer hover:text-foreground transition-colors"
          >
            Transcript {open ? "︿" : "⌄"}
          </button>
        )}
      </div>
      {transcript && open && (
        <p className="mt-3 text-sm leading-relaxed text-foreground border-l border-accent pl-4">{transcript}</p>
      )}
    </div>
  );
}

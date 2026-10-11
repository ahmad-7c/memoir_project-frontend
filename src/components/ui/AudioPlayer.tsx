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
 * The one audio player used everywhere a recording is played back -- inline
 * and unobtrusive, never the browser's default chrome. A hairline circular
 * play button, a thin seek line, and a time label; nothing else.
 */
export function AudioPlayer({ src, className = "" }: { src: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Deferred a tick so no setState call executes synchronously within the
    // effect body itself -- same constraint worked around elsewhere in this
    // codebase (e.g. final-memoir/page.tsx).
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
    <div className={cn("flex items-center gap-3 max-w-sm", className)}>
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
        className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full border border-line text-ink-secondary hover:text-ink hover:bg-surface-sunk transition-colors cursor-pointer"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={seek}
        aria-label="Seek"
        className="flex-1 h-1 rounded-sm appearance-none cursor-pointer bg-line accent-ink-secondary"
        style={{
          background: `linear-gradient(to right, var(--ink-secondary) ${progress}%, var(--line) ${progress}%)`,
        }}
      />
      <span className="text-small text-ink-muted tabular-nums shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

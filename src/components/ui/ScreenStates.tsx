"use client";

import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared loading/empty/error treatments. Deliberately quiet -- no spinners
 * that imply urgency, no bold red error banners. A grieving, tired user
 * should never feel like something broke; at most, something is still
 * settling, or didn't work this time and can be tried again.
 */

export function LoadingState({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 px-6", className)}>
      <p className="text-sm font-serif italic text-memory-muted animate-pulse">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center py-16 px-6", className)}>
      <h3 className="font-serif text-xl text-memory-primary dark:text-memory-ink mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-memory-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-memory-border dark:border-memory-border bg-memory-card dark:bg-memory-card px-5 py-4 text-left max-w-md mx-auto",
        className,
      )}
    >
      <AlertCircle size={16} className="text-memory-muted shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-memory-primary dark:text-memory-ink leading-relaxed">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-xs font-semibold uppercase tracking-wider text-memory-accent hover:text-memory-primary dark:hover:text-memory-ink transition-colors cursor-pointer"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

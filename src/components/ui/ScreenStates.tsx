"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared loading/empty/error treatments. Deliberately quiet -- no spinners,
 * no percentages, no shimmer. A grieving, tired user should never feel like
 * something broke; at most, something is still settling, or didn't work
 * this time and can be tried again.
 */

export function LoadingState({ label = "Still settling…", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 px-6", className)}>
      <p className="text-body-ui text-ink-muted animate-pulse">{label}</p>
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
      <h3 className="font-serif text-heading text-ink mb-3">{title}</h3>
      {description && (
        <p className="text-body-ui text-ink-secondary max-w-sm mb-6">{description}</p>
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
        "flex items-start gap-3 rounded-md border border-line bg-surface px-5 py-4 text-left max-w-md mx-auto",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-body-ui text-ink">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-small font-semibold uppercase tracking-[0.06em] text-alert hover:text-ink transition-colors cursor-pointer underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared loading/empty/error treatments. Quiet by design -- no spinners, no
 * shimmer; at most, something is still settling, or didn't work and can be
 * tried again.
 */

export function LoadingState({ label = "Still settling…", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 px-6", className)}>
      <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
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
      <h3 className="font-serif text-2xl text-foreground mb-3">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
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
        "flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4 text-left max-w-md mx-auto",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-foreground">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-xs font-medium text-destructive hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

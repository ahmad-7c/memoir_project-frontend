import { cn } from "@/lib/utils";

/**
 * A grouped section of controls or settings -- the publish panel, an
 * overlay's content area. Unlike Card, which is a clickable editorial
 * tile, a Panel is a plain container with its padding built in. The
 * specular top edge (--line-bright on top, --line elsewhere) is the same
 * depth cue as Card, without shadows.
 */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-surface border border-line specular-top rounded-md p-6", className)}>{children}</div>
  );
}

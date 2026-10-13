import { cn } from "@/lib/utils";

/** Circular, tinted, a single initial letter -- no photo. Used for the top-bar account avatar and overlapping contributor avatars in the sidebar. */
export function InitialAvatar({
  initial,
  size = 36,
  className = "",
  style,
}: {
  initial: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-serif shrink-0",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...style }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

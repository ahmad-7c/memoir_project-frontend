/**
 * @file components/ui/Badge.tsx
 * @description Small status label -- a hairline border, never a filled pill
 * (section 4 forbids pill shapes outright; "pill" in the product brief's
 * prose for the published mark means "small label", not a literal shape).
 * Text is always --ink-secondary, never --calm, even on the "calm" variant:
 * --calm measures ~2.8:1 against both --surface and --canvas, below AA for
 * real text, so it is used here only for the border and the small dot,
 * which carry the color without needing to pass text-contrast thresholds.
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "calm" | "neutral";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const dotClass = variant === "calm" ? "bg-calm" : "bg-ink-muted";
  const borderClass = variant === "calm" ? "border-calm/50" : "border-line";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-micro uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-sm border ${borderClass} text-ink-secondary`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

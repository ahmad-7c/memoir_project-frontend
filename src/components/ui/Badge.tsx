/**
 * @file components/ui/Badge.tsx
 * @description Small status label -- a hairline border, never a filled pill
 * (section 4 forbids pill shapes outright; "pill" in the product brief's
 * prose for the published mark means "small label", not a literal shape).
 * Text is always --ink-secondary, never --calm or --brass, even on those
 * variants: both measure well under AA for real text at this size in Pine
 * Light (--calm ~3.8:1, --brass ~3.5:1 against --canvas), so they're used
 * here only for the border and the small dot, which carry the colour
 * without needing to pass text-contrast thresholds. The "brass" variant is
 * the owner-profile PUBLISHED mark specifically.
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "calm" | "brass" | "neutral";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const dotClass = variant === "calm" ? "bg-calm" : variant === "brass" ? "bg-brass" : "bg-ink-muted";
  const borderClass = variant === "calm" ? "border-calm/50" : variant === "brass" ? "border-brass-deep" : "border-line";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-micro uppercase tracking-[0.06em] font-semibold px-2.5 py-1 rounded-sm border ${borderClass} text-ink-secondary`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

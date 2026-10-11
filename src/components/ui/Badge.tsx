interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "muted";
}

/** A small status label -- hairline border, no fill, the reference's lone destructive colour reserved for actual error text, not status chrome. */
export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[2px] font-medium px-2.5 py-1 rounded-full border border-border ${
        variant === "muted" ? "text-muted-foreground" : "text-foreground"
      }`}
    >
      {children}
    </span>
  );
}

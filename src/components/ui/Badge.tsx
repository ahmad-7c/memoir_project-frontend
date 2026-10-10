/**
 * @file components/ui/Badge.tsx
 * @description Small status pill. No domain knowledge -- callers decide what
 * variant/text to show. Reuses the existing memory-primary / stone color
 * tokens already used across the app (DashboardHeader's lock button,
 * MemoirHero's "Drafted with AI" label) rather than introducing new colors.
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "neutral";
}

export function Badge({ children, variant = "primary" }: BadgeProps) {
  const variantClass =
    variant === "primary"
      ? "bg-memory-primary text-white dark:bg-memory-gold dark:text-memory-dark-end"
      : "bg-stone-200 text-stone-600 dark:bg-memory-card dark:text-memory-muted";

  return (
    <span
      className={`inline-flex items-center font-sans text-[10px] uppercase tracking-[0.15em] font-bold px-2.5 py-1 rounded-full ${variantClass}`}
    >
      {children}
    </span>
  );
}

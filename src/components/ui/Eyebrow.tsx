import { cn } from "@/lib/utils";

/**
 * `.eyebrow`: 10px, 500, 2px letter-spacing, uppercase. Used both over hero
 * photos (--hero-foreground) and on plain backgrounds (--muted-foreground).
 * Colour is a dedicated `tone` prop rather than left to `className`:
 * Tailwind v4 orders generated rules by first-seen-in-source, not by
 * position in a className string, so a hardcoded base colour and a
 * `className` override can silently fight instead of the override winning.
 */
export function Eyebrow({
  children,
  tone = "muted",
  className = "",
  as: Comp = "p",
}: {
  children: React.ReactNode;
  tone?: "muted" | "hero";
  className?: string;
  as?: "p" | "span";
}) {
  return (
    <Comp
      className={cn(
        "text-[10px] font-medium uppercase tracking-[2px] leading-[1.6]",
        tone === "hero" ? "text-hero-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

import { cn } from "@/lib/utils";

/**
 * An editorial tile -- a memoir in the owner's profile grid, a choice on
 * the empty dashboard. One hairline border, one surface tint, no shadow;
 * a specular top edge (one step brighter than the other three borders)
 * reads as light falling from above. On hover the border alone warms from
 * --line to --brass-deep over 260ms -- the card never moves or lifts.
 * Composes with a 3:2 media crop at the top (see Card.Media) and plain
 * content below; it never tries to carry equal weight against its
 * siblings by default -- that is each screen's layout decision, not this
 * component's.
 */
export function Card({
  children,
  className = "",
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  return (
    <Comp
      className={cn(
        "bg-surface border border-line specular-top rounded-md overflow-hidden transition-colors duration-[260ms] hover:border-brass-deep",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

Card.Media = function CardMedia({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full aspect-3/2 bg-surface-sunk overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URLs, not a fixed asset next/image can optimise */}
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};

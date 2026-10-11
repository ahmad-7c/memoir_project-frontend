import { cn } from "@/lib/utils";

/** An editorial tile -- a memoir in the owner's profile grid. Hairline border, --card fill, rounded-md, no shadow by default (the reference reserves --shadow for an elevated/interactive state). */
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
    <Comp className={cn("bg-card border border-border rounded-md overflow-hidden transition-colors hover:border-foreground/30", className)}>
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
    <div className={cn("relative w-full aspect-3/2 bg-secondary overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URLs, not a fixed asset next/image can optimise */}
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
};

import { cn } from "@/lib/utils";

/** Italic serif quote + small attribution underneath, no quotation marks drawn -- the reference sets them in the copy itself where used. */
export function PullQuote({
  children,
  attribution,
  className = "",
}: {
  children: React.ReactNode;
  attribution?: string;
  className?: string;
}) {
  return (
    <figure className={cn("mt-6", className)}>
      <blockquote className="font-serif italic text-xl leading-snug text-foreground">{children}</blockquote>
      {attribution && <figcaption className="mt-2 text-[11px] text-muted-foreground">{attribution}</figcaption>}
    </figure>
  );
}

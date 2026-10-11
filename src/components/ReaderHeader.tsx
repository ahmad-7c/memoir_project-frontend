import Link from "next/link";
import { LeafMark } from "./Logo";

/**
 * /memoir's header: back-arrow + wordmark, no nav links, a label on the
 * right. `backHref` is omitted entirely (not just disabled) for readers
 * arriving via a share link, who have no owner workspace to return to.
 */
export default function ReaderHeader({ label, backHref }: { label: string; backHref?: string }) {
  const brand = (
    <span className="flex items-center gap-3 font-serif text-2xl font-semibold text-foreground">
      {backHref && <span aria-hidden="true">&larr;</span>}
      <LeafMark className="w-6 h-6 text-primary" />
      The Family Memoir
    </span>
  );
  return (
    <header className="flex items-center justify-between max-w-[1440px] h-[84px] mx-auto px-6 md:px-16">
      {backHref ? <Link href={backHref}>{brand}</Link> : brand}
      <p className="hidden sm:inline text-xs text-muted-foreground">{label}</p>
    </header>
  );
}

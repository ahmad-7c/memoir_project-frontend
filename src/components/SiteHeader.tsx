import Link from "next/link";
import { LeafMark } from "./Logo";
import { Button } from "./ui/Button";

/** `.site-header` on `/` only: leaf + wordmark, "A glimpse inside" scroll link, solid "Begin" pill. */
export default function SiteHeader() {
  return (
    <header className="flex items-center justify-between max-w-[1440px] h-24 md:h-24 mx-auto px-6 md:px-16">
      <Link href="/" className="flex items-center gap-3 font-serif text-2xl font-semibold text-foreground">
        <LeafMark className="w-6 h-6 text-primary" />
        The Family Memoir
      </Link>
      <nav className="flex items-center gap-8">
        <a href="#sample-memoir" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          A glimpse inside
        </a>
        <Button href="/begin">Begin</Button>
      </nav>
    </header>
  );
}

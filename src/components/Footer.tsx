import { LeafMark } from "./Logo";

/** `.footer`: identical on every page. */
export default function Footer() {
  return (
    <footer className="flex items-center justify-between max-w-[1440px] mx-auto px-6 md:px-16 py-7 text-[10px] text-muted-foreground border-t border-border">
      <span className="flex items-center gap-2 font-serif text-base text-foreground">
        <LeafMark className="w-4 h-4 text-primary" />
        The Family Memoir
      </span>
      <span>Made for the stories that stay with us.</span>
    </footer>
  );
}

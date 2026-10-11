import Link from "next/link";
import { LeafMark } from "./Logo";
import { InitialAvatar } from "./ui/InitialAvatar";

/** The logged-in top bar on /memories, /chapters: wordmark, "Your memoir", "Read the memoir", account initial. */
export default function AppTopBar({ initial = "S" }: { initial?: string }) {
  return (
    <header className="flex items-center justify-between max-w-[1440px] h-[84px] mx-auto px-6 md:px-16">
      <Link href="/memories" className="flex items-center gap-3 font-serif text-2xl font-semibold text-foreground">
        <LeafMark className="w-6 h-6 text-primary" />
        The Family Memoir
      </Link>
      <nav className="flex items-center gap-[34px]">
        <Link href="/memories" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Your memoir
        </Link>
        <Link href="/memoir" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Read the memoir
        </Link>
        <InitialAvatar initial={initial} size={36} />
      </nav>
    </header>
  );
}

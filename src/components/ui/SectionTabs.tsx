import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SectionTab {
  label: string;
  href: string;
}

/** The three-way tab row beneath the identity strip on /memories and /chapters. */
export function SectionTabs({ tabs, active }: { tabs: SectionTab[]; active: string }) {
  return (
    <nav className="flex items-center gap-8 border-b border-border" aria-label="Memoir sections">
      {tabs.map((tab) => {
        const isActive = tab.label === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative py-3 text-sm transition-colors",
              isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";
import { Search, Lock, Copy, Check, Sparkles } from "lucide-react";

interface DashboardHeaderProps {
  name: string;
  setName: (name: string) => void;
  dates: string;
  setDates: (dates: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleCopyLink: () => void;
  isLinkCopied: boolean;
  onLockClick?: () => void;
  onNarrativeClick?: () => void;
}

/**
 * This is a person, not a project -- name and dates stay editable inline,
 * but the chrome around them (a rotated search box with a bespoke polygon
 * border-radius, drop shadows, scale-on-hover icon buttons) has been
 * replaced with plain hairline controls. The lock/publish and narrative
 * actions are secondary (hairline, not accent-filled): adding a memory is
 * the dashboard's one primary action, so these do not compete for that
 * visual weight.
 */
export function DashboardHeader({
  name, setName, dates, setDates, searchQuery, setSearchQuery, handleCopyLink, isLinkCopied, onLockClick, onNarrativeClick,
}: DashboardHeaderProps) {
  const iconButtonClass =
    "w-11 h-11 rounded-full border border-line flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-surface transition-colors cursor-pointer shrink-0";

  return (
    <header className="w-full border-b border-line bg-canvas/90 backdrop-blur-sm px-6 md:px-8 py-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent font-serif text-subhead text-ink border-none outline-none focus-visible:ring-0 p-0 min-w-0 w-40"
        />
        <span className="text-ink-muted">/</span>
        <input
          type="text"
          value={dates}
          onChange={(e) => setDates(e.target.value)}
          className="bg-transparent text-small text-ink-muted border-none outline-none focus-visible:ring-0 p-0 w-28"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 md:w-48 bg-surface-sunk border border-line rounded-sm pl-9 pr-3 py-2.5 text-body-ui text-ink placeholder:text-ink-muted outline-none focus:border-brass transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="h-11 px-4 border border-line rounded-sm flex items-center gap-2 text-body-ui font-medium text-ink-secondary hover:text-ink hover:bg-surface transition-colors cursor-pointer"
        >
          {isLinkCopied ? <Check size={14} /> : <Copy size={14} />}
          {isLinkCopied ? "Link copied" : "Share memoir"}
        </button>

        <button type="button" onClick={onNarrativeClick} className={iconButtonClass} title="The narrative">
          <Sparkles size={15} />
        </button>

        <button type="button" onClick={onLockClick} className={iconButtonClass} title="Lock and publish">
          <Lock size={15} />
        </button>
      </div>
    </header>
  );
}

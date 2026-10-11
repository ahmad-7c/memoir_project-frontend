import { cn } from "@/lib/utils";

/**
 * The reference's wordmark is a leaf icon + "The Memoir Project." in serif,
 * the final period italic. This app is a family's own memoir workspace
 * rather than the marketing site, so the wordmark text is the product name
 * without a trailing full stop (there is nothing to stylise as italic) --
 * the leaf mark itself is kept identical everywhere it appears.
 */
export function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M20 4c-7.5 0-14 4.5-14 12 0 2.2 1.8 4 4 4 7.5 0 14-4.5 14-12 0-1.4-.2-2.8-.5-4-1.2.3-2.5.5-3.5 0z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.5 19.5C11 15 14.5 11 19.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return <LeafMark className={cn("w-6 h-6 text-primary", className)} />;
}

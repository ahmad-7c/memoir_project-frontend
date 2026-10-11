"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface SourceMemory {
  name: string;
  relationship: string;
  text: string;
}

/**
 * The composed-chapter disclosure: "Composed with AI · from family memories"
 * label, then an expandable "From the family's memories" control that
 * reveals a --secondary-tinted panel listing every real source memory
 * verbatim. Collapsed by default everywhere (including on /memoir).
 */
export function SourceBlock({
  sources,
  defaultOpen = false,
  className = "",
}: {
  sources: SourceMemory[];
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("mt-4", className)}>
      <p className="text-[11px] text-muted-foreground mb-2">Composed with AI &middot; from family memories</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <span aria-hidden="true">📖</span>
        From the family&rsquo;s memories {open ? "︿" : "⌄"}
      </button>
      {open && (
        <div className="mt-3 rounded-md bg-secondary p-5 space-y-4">
          {sources.map((s, i) => (
            <div key={i}>
              <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-1.5">
                {s.name} &middot; {s.relationship}
              </p>
              <p className="text-sm leading-relaxed text-foreground">&ldquo;{s.text}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

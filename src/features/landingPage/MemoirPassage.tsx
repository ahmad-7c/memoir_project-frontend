/**
 * @file MemoirPassage.tsx
 * @description "The finished memoir shown, not described" -- a real passage
 * from an illustrative memoir, not a paragraph explaining what one is. Flat
 * tonal card, no stock photo, no shadow. Carries the same brass drop cap
 * and hairline the real published-memoir page uses (see dropCap.ts /
 * final-memoir/page.tsx), so this demonstration genuinely looks like a page
 * from the finished book rather than a mockup of one.
 */

"use client";

import { Reveal } from "@/components/ui/Reveal";
import { BrassRule } from "@/components/ui/BrassRule";
import { DROP_CAP_CLASS } from "@/lib/dropCap";
import { cn } from "@/lib/utils";

export default function MemoirPassage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-24 md:py-32">
      <Reveal>
        <div className="bg-surface border border-line specular-top rounded-md p-8 md:p-12">
          <p className="font-serif text-heading text-ink">Eleanor Hughes</p>
          <p className="text-small text-ink-muted mt-1">1945 – 2024</p>

          <BrassRule short className="w-10 mt-6" />

          <p className={cn("font-serif text-body-read text-ink-secondary mt-6 leading-relaxed", DROP_CAP_CLASS)}>
            She kept a garden that outlived three winters and most of our doubts.
            Every Sunday she was out before the frost had cleared, talking to the
            roses like they owed her an explanation.
          </p>

          <p className="mt-8 pt-6 border-t border-line text-small text-ink-muted">
            A note from her granddaughter, left on this page.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

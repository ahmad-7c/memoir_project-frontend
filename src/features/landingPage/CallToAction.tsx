/**
 * @file CallToAction.tsx
 * @description The closing section: one quiet line, one action. Price
 * already had its own section above -- this doesn't repeat it. The brass
 * rule stands in for the old plain hairline divider -- a single closing
 * flourish (with its one-time sheen sweep) rather than a second accent
 * competing with the button below it.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BrassRule } from "@/components/ui/BrassRule";

export default function CallToAction() {
  return (
    <section className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
      <BrassRule className="w-24 mb-16" />
      <Reveal className="max-w-xl mx-auto flex flex-col items-center">
        <h2 className="font-serif text-heading text-ink mb-8">Start when you&apos;re ready.</h2>
        <Button href="/memory-subject-selection" size="lg">
          Begin
        </Button>
      </Reveal>
    </section>
  );
}

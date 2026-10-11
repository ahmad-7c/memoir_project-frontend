/**
 * @file PriceLine.tsx
 * @description The price, plainly -- its own section, not a marketing
 * banner. Shown openly before signup, stated once, nothing sold.
 */

"use client";

import { Reveal } from "@/components/ui/Reveal";
import { BrassRule } from "@/components/ui/BrassRule";

export default function PriceLine() {
  return (
    <section className="py-24 md:py-32 text-center px-6 flex flex-col items-center">
      <BrassRule className="w-24 mb-16" />
      <Reveal>
        <p className="font-serif text-heading text-ink">$3 a month.</p>
        <p className="text-body-ui text-ink-secondary mt-2">Free to start. Cancel anytime.</p>
      </Reveal>
    </section>
  );
}

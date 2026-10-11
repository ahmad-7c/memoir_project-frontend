/**
 * @file Hero.tsx
 * @description Landing page opener. Leads with the result -- the preview
 * panel below is an illustrative mockup built from this product's own type
 * system, not a stock photo or a real memoir, so a first-time visitor can
 * see what the finished thing looks like before being asked for anything.
 * No filled (primary) button here by design -- the brief wants exactly one
 * primary button on the page, reserved for the closing CTA; "Begin" here is
 * a plain text link.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-5 flex flex-col">
          <h1 className="font-serif text-display text-ink">
            A biography your family writes together.
          </h1>

          <p className="mt-6 text-body-ui text-ink-secondary max-w-prose">
            Relatives add memories by voice, text or photograph from one shared
            link. No app, no account for them to make. It becomes a biography
            the family can keep reading, and a quiet place to leave a note on
            the stories that matter most.
          </p>

          <Link
            href="/memory-subject-selection"
            className="mt-8 inline-flex items-center gap-2 text-body-ui font-semibold text-ink hover:text-ink-secondary transition-colors w-fit"
          >
            Begin
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <MemoirPreview />
        </div>
      </div>
    </section>
  );
}

/**
 * An illustrative mockup, not a screenshot of a real memoir and not a stock
 * photo -- a flat tonal block stands in for a portrait rather than using any
 * photography, per the no-stock-imagery rule.
 */
function MemoirPreview() {
  return (
    <div className="bg-surface border border-line rounded-md overflow-hidden">
      <div className="w-full aspect-16/10 bg-surface-sunk" aria-hidden="true" />
      <div className="p-8 md:p-10">
        <p className="font-serif text-heading text-ink">Eleanor Hughes</p>
        <p className="text-small text-ink-muted mt-1">1945 – 2024</p>

        <p className="font-serif text-body-read text-ink-secondary mt-6 leading-relaxed">
          She kept a garden that outlived three winters and most of our doubts.
          Every Sunday she was out before the frost had cleared, talking to the
          roses like they owed her an explanation.
        </p>

        <div className="mt-6 pt-4 border-t border-line">
          <p className="text-small text-ink-muted">A note from her granddaughter, left on this page</p>
        </div>
      </div>
    </div>
  );
}

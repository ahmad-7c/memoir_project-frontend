/**
 * @file HandwrittenNote.tsx
 * @description Step 2 of 5. A literally handwritten note -- Caveat is used
 * here deliberately, the one exception to the Fraunces/Instrument Sans
 * system, because this card is meant to read as handwriting, not content.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingBackdrop } from "./OnboardingBackdrop";
import backdropImage from "../../../public/images/handwriting-blur.jpg";

export default function HandwrittenNote() {
  return (
    <section className="relative isolate min-h-screen bg-canvas flex flex-col items-center justify-center px-6 py-16">
      <OnboardingBackdrop src={backdropImage} />
      <OnboardingProgress step={2} />

      <div className="relative w-full max-w-100 bg-surface border border-line rounded-md p-10 sm:p-12">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-caveat text-[40px] leading-tight text-ink mb-4">A gentle beginning,</h2>
          <p className="font-caveat text-[26px] text-ink-secondary leading-9">
            Every family has a story worth keeping -- the quiet mornings, the
            faded photographs, and the voices you never want to lose. We built
            this space to hold those pieces safe for you and the ones you love.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8 w-full max-w-95">
        <Button href="/memory-subject-selection" variant="secondary" className="flex-1">
          Back
        </Button>
        <Button href="/unfold-memory" className="flex-1">
          Continue
        </Button>
      </div>
    </section>
  );
}

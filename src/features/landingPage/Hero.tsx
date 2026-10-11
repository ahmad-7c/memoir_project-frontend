/**
 * @file Hero.tsx
 * @description Landing page opener: full-bleed graded photograph, an
 * 8-word-or-under headline, one button. No supporting paragraph -- the
 * image and the whitespace carry what prose used to.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { GradedImage, ImageFadeToCanvas } from "@/components/ui/GradedImage";
import { Reveal } from "@/components/ui/Reveal";
import { useParallax } from "@/hooks/useParallax";
import heroImage from "../../../public/images/sunbeam-empty-room.jpg";

export default function Hero() {
  const parallaxRef = useParallax<HTMLDivElement>(0.86);

  return (
    <section className="relative">
      <div ref={parallaxRef} className="relative h-[72vh] md:h-[82vh] w-full">
        <GradedImage src={heroImage} alt="" fill priority sizes="100vw" />
        <div className="absolute inset-0 hero-scrim" aria-hidden="true" />
        <ImageFadeToCanvas className="h-32" />

        <div className="absolute inset-x-0 bottom-0 px-6 md:px-16 pb-14 md:pb-20">
          <Reveal>
            <h1 className="font-serif text-display lg:text-[4.75rem] text-ink max-w-3xl">
              A biography your family writes together.
            </h1>
          </Reveal>
          <Reveal index={2}>
            <div className="mt-8">
              <Button href="/memory-subject-selection" size="lg">
                Begin
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

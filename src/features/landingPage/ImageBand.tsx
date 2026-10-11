/**
 * @file ImageBand.tsx
 * @description A full-bleed image band with no text -- exists to let the
 * page breathe and to carry mood where words would otherwise sit.
 */

"use client";

import { GradedImage } from "@/components/ui/GradedImage";
import { Reveal } from "@/components/ui/Reveal";
import bandImage from "../../../public/images/pine-forest-fog.jpg";

export default function ImageBand() {
  return (
    <Reveal className="h-[40vh] md:h-[50vh] w-full relative">
      <GradedImage src={bandImage} alt="" fill sizes="100vw" />
    </Reveal>
  );
}

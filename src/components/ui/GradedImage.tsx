import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

interface GradedImageProps {
  src: StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  /** Scale 1.00 -> 1.02 over 640ms on hover -- the parent stays overflow-hidden. */
  hoverScale?: boolean;
}

/**
 * The one place every self-hosted atmospheric photograph passes through, so
 * a 1974 family scan and a 2024 iPhone photo end up belonging to the same
 * page. `filter` grades the photo toward Pine; two stacked overlay layers
 * (a --canvas tint in `color` blend, a second in `multiply`) finish the
 * duotone. A static `next/image` import gives blur-up, reserved width/
 * height (zero layout shift) and AVIF/WebP automatically -- no separate
 * image-processing step needed for any of that.
 */
export function GradedImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes,
  fill = false,
  hoverScale = false,
}: GradedImageProps) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-canvas-deep",
        fill ? "absolute inset-0 h-full w-full" : "relative",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        placeholder="blur"
        priority={priority}
        sizes={sizes}
        className={cn("object-cover photo-grade", hoverScale && "transition-transform duration-[640ms] hover:scale-[1.02]")}
      />
      <div className="absolute inset-0 pointer-events-none duotone-color" aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none duotone-multiply" aria-hidden="true" />
    </div>
  );
}

/**
 * The long vertical fade an image dissolves into --canvas at its lower
 * edge, instead of ending in a hard line -- used under hero/section-band
 * imagery and the published-memoir portrait. A gradient here is a
 * photographic material description (light falling off), the same
 * exception the brief carves out for the brass sheen, not decoration.
 */
export function ImageFadeToCanvas({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-x-0 bottom-0 pointer-events-none fade-to-canvas", className)}
      aria-hidden="true"
    />
  );
}

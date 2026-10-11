import type { StaticImageData } from "next/image";
import { GradedImage } from "@/components/ui/GradedImage";

/**
 * One quiet atmospheric image per onboarding step, low opacity behind the
 * content -- a different photograph each time (see each screen's own
 * import), never a repeat, never literal.
 *
 * `absolute` (not `fixed`): this renders inside PageTurn's 3D-transformed
 * page, and a `transform`/`perspective` ancestor changes the containing
 * block for `position: fixed` descendants per the CSS spec -- a fixed
 * backdrop here would not actually track the viewport. `absolute inset-0`
 * against the onboarding `<section>` itself (which needs `relative`) covers
 * the same ground without depending on anything above it in the tree.
 */
export function OnboardingBackdrop({ src }: { src: StaticImageData }) {
  return (
    <div className="absolute inset-0 -z-10 opacity-[0.16]" aria-hidden="true">
      <GradedImage src={src} alt="" fill sizes="100vw" priority />
    </div>
  );
}

import Image from "next/image";
import { Eyebrow } from "./Eyebrow";

/**
 * NOT a hero. A compact 74px circular portrait beside eyebrow/h1/subtitle --
 * the /memories and /chapters header block. Materially different from the
 * full-bleed Hero used on `/` and `/memoir`; do not reuse that component
 * here even though both show "a photo of the person."
 */
export function IdentityStrip({
  portraitSrc,
  portraitAlt,
  eyebrow,
  name,
  subtitle,
}: {
  portraitSrc: string;
  portraitAlt: string;
  eyebrow: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-5 max-w-[1440px] mx-auto px-6 md:px-16 py-8">
      <div className="relative w-[74px] h-[74px] rounded-full overflow-hidden shrink-0 bg-secondary">
        <Image src={portraitSrc} alt={portraitAlt} fill sizes="74px" className="object-cover" />
      </div>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-serif text-3xl text-foreground mt-1">{name}</h1>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

import Image from "next/image";
import { Camera } from "lucide-react";
import { Eyebrow } from "./Eyebrow";

/**
 * NOT a hero. A compact 74px circular portrait beside eyebrow/h1/subtitle --
 * the /memories and /chapters header block. Materially different from the
 * full-bleed Hero used on `/` and `/memoir`; do not reuse that component
 * here even though both show "a photo of the person."
 *
 * `portraitSrc` is optional: a brand-new memoir has no cover photo yet, and
 * showing a stock placeholder there would silently claim a photo of the
 * person that doesn't exist -- an initial-letter circle is the honest
 * empty state instead.
 */
export function IdentityStrip({
  portraitSrc,
  portraitAlt,
  eyebrow,
  name,
  subtitle,
  onEditPortrait,
  portraitUploading,
}: {
  portraitSrc?: string | null;
  portraitAlt: string;
  eyebrow: string;
  name: string;
  subtitle: string;
  onEditPortrait?: () => void;
  portraitUploading?: boolean;
}) {
  return (
    <div className="flex items-center gap-5 max-w-[1440px] mx-auto px-6 md:px-16 py-8">
      <div className="relative w-[74px] h-[74px] shrink-0">
        <div className="w-full h-full rounded-full overflow-hidden bg-secondary">
          {portraitSrc ? (
            <Image src={portraitSrc} alt={portraitAlt} fill sizes="74px" className="object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center font-serif text-2xl text-foreground">
              {name?.[0]?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        {onEditPortrait && (
          <button
            type="button"
            onClick={onEditPortrait}
            disabled={portraitUploading}
            aria-label="Change cover photo"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Camera size={12} />
          </button>
        )}
      </div>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-serif text-3xl text-foreground mt-1">{name}</h1>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

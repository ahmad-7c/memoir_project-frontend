import Image from "next/image";
import { Eyebrow } from "./Eyebrow";

/**
 * The one full-bleed cinematic hero, in its two heights (`.hero` on the
 * landing page, `.hero.reader-hero` on /memoir). Both image crops are
 * always in the DOM; CSS alone decides which is visible per breakpoint --
 * matching the reference's own mechanism rather than a single art-directed
 * <Image> with sizes/srcset. On the reader variant the phone crop never
 * shows at all; only `object-position` shifts on the desktop crop.
 */
export function Hero({
  desktopSrc,
  phoneSrc,
  alt,
  eyebrow,
  title,
  description,
  footLeft,
  footRight,
  action,
  variant = "landing",
}: {
  desktopSrc?: string | null;
  phoneSrc?: string;
  alt: string;
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  footLeft: string;
  footRight: string;
  action?: React.ReactNode;
  variant?: "landing" | "reader";
}) {
  const isReader = variant === "reader";
  return (
    <div
      className={
        isReader
          ? "relative overflow-hidden h-[470px] min-[1001px]:h-[530px] bg-primary"
          : "relative overflow-hidden h-[780px] min-[701px]:h-[565px] min-[1500px]:h-[610px] bg-primary"
      }
    >
      {desktopSrc && (
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className={
            isReader
              ? "object-cover object-[50%_48%] max-[700px]:object-[74%_58%]"
              : "object-cover object-[50%_48%] max-[700px]:hidden"
          }
        />
      )}
      {!isReader && desktopSrc && phoneSrc && (
        <Image
          src={phoneSrc}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="hidden max-[700px]:block object-cover object-[50%_0%]"
        />
      )}
      <div
        className={
          isReader
            ? "absolute inset-0 bg-gradient-to-r from-[var(--hero-shade)] to-transparent"
            : "absolute inset-0 bg-gradient-to-r from-[var(--hero-shade)] to-transparent max-[700px]:bg-gradient-to-b"
        }
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-[1312px] min-[1500px]:max-w-[1440px] mx-auto h-full flex flex-col justify-center px-6 min-[701px]:px-16 max-[700px]:px-[26px] max-[700px]:pt-[110px]">
        <Eyebrow as="span" tone="hero">
          {eyebrow}
        </Eyebrow>
        <h1 className="font-serif text-hero-foreground text-5xl min-[701px]:text-[82px] max-[700px]:text-[54px] leading-[1.02] mt-4 max-[700px]:mt-4">
          {title}
        </h1>
        <p className="text-hero-foreground/90 text-sm leading-[1.9] mt-4 max-w-md max-[700px]:max-w-[290px] max-[700px]:text-xs">
          {description}
        </p>
        {action && <div className="mt-6">{action}</div>}
      </div>
      <div className="absolute z-10 bottom-[21px] min-[701px]:bottom-[27px] left-[26px] min-[701px]:left-16 right-[26px] min-[701px]:right-16 flex justify-between text-[10px] text-hero-foreground gap-[18px]">
        <span>{footLeft}</span>
        <span>{footRight}</span>
      </div>
    </div>
  );
}

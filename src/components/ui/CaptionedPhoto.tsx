import Image from "next/image";
import { cn } from "@/lib/utils";

/** figure + figcaption, rounded-md, no shadow. Two caption formats recur: "credit" (e.g. "Shared by Margaret, his wife.") and "location" (italic, e.g. "Chapter three · By the sea. Dorset, summer 1978."). */
export function CaptionedPhoto({
  src,
  alt,
  caption,
  credit,
  variant = "credit",
  width = 600,
  height = 400,
  className = "",
}: {
  src: string;
  alt: string;
  caption: string;
  credit?: string;
  variant?: "credit" | "location";
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <figure className={cn("w-full", className)}>
      <div className="relative w-full overflow-hidden rounded-md bg-secondary">
        <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto object-cover" />
      </div>
      <figcaption
        className={cn(
          "mt-2 text-[10px] leading-[1.7] text-muted-foreground",
          variant === "location" && "italic",
        )}
      >
        {caption}
        {credit && (
          <>
            <br />
            {credit}
          </>
        )}
      </figcaption>
    </figure>
  );
}

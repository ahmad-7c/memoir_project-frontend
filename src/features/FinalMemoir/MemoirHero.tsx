import React from "react";

interface MemoirHeroProps {
  subjectName: string;
  dates: string;
  coverImageUrl?: string | null;
}

/**
 * The destination's opening: full-width portrait fading into canvas, name
 * in Display. Previously this rendered a hardcoded "Nadia's Story" with a
 * stock-photo carousel (Unsplash URLs, fabricated captions) regardless of
 * which memoir was actually open -- every real family saw the same fake
 * story. Replaced with the real subject name and the real cover image this
 * memoir actually has (same field ProfilePage already uses); there is no
 * backend field for a photo gallery, so no gallery is shown rather than
 * inventing one.
 */
export default function MemoirHero({ subjectName, dates, coverImageUrl }: MemoirHeroProps) {
  return (
    <section>
      {coverImageUrl && (
        <div className="relative w-full h-[50vh] md:h-[60vh]">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL */}
          <img src={coverImageUrl} alt={subjectName} className="w-full h-full object-cover" />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(to bottom, transparent, var(--canvas))" }}
            aria-hidden="true"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-12 pb-8 text-center">
        <h1 className="font-serif text-display text-ink">{subjectName}</h1>
        {dates && <p className="text-small text-ink-muted mt-3">{dates}</p>}
      </div>
    </section>
  );
}

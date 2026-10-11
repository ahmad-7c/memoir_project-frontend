/**
 * @file ScatteredMemories.tsx
 * @description One idea, one viewport: why the product exists. Previously a
 * collage of rotated stock photos with heavy shadows and blur -- replaced
 * entirely, since both the imagery and the chrome were against the brief
 * (no stock photography, no drop shadows). The line itself was worth
 * keeping; everything around it was not.
 */

export default function ScatteredMemories() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-24 md:py-32">
      <p className="font-serif text-heading text-ink text-center max-w-2xl leading-relaxed">
        Every family already holds the memoir. It is just{" "}
        <span className="text-accent">scattered</span> across the people who
        loved them.
      </p>
    </section>
  );
}

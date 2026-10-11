import { Button } from "@/components/ui/Button";

export default function CallToAction() {
  return (
    <section className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center border-t border-line">
      <div className="max-w-xl mx-auto flex flex-col items-center">
        <h2 className="font-serif text-heading text-ink mb-4">Start when you&apos;re ready.</h2>

        <p className="text-body-ui text-ink-secondary mb-10">$3 a month, after a free start.</p>

        <Button href="/memory-subject-selection" size="lg">
          Begin their story
        </Button>
      </div>
    </section>
  );
}

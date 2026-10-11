import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CaptionedPhoto } from "@/components/ui/CaptionedPhoto";
import { PullQuote } from "@/components/ui/PullQuote";
import { SourceBlock } from "@/components/ui/SourceBlock";
import { AudioMemory } from "@/components/ui/AudioPlayer";

const chapters = [
  { number: "01", title: "Little things, remembered", active: true },
  { number: "02", title: "A house full of noise", active: false },
  { number: "03", title: "Down by the water", active: false },
  { number: "04", title: "What he left us", active: false },
];

/**
 * The landing page's sample-memoir section: intro, book toolbar, and
 * Chapter One in the 3-column book-grid. Own content (Arthur Bellamy,
 * invented family) in the reference's voice -- short, warm, plain, no
 * exclamation marks -- not a copy of the reference's "Edward Williams."
 */
export function SampleMemoir() {
  return (
    <>
      <section className="text-center max-w-2xl mx-auto px-6 pt-14 pb-11">
        <Eyebrow>Not one story. All of theirs.</Eyebrow>
        <h2 className="font-serif text-4xl text-foreground mt-3 mb-3">A whole life, held in many hearts.</h2>
        <p className="text-xs leading-[1.9] text-muted-foreground">
          A daughter&rsquo;s story. A friend&rsquo;s photograph. A voice you never want to forget.
          <br />
          Together, they become a memoir. Here is a little of Arthur&rsquo;s.
        </p>
      </section>

      <section id="sample-memoir" className="max-w-[1100px] mx-auto px-6 md:px-10 pb-16">
        <div className="flex items-center justify-between gap-3 py-5 text-[11px] border-t border-b border-border">
          <span className="flex items-center gap-2 text-foreground">
            <span aria-hidden="true">📖</span>
            The life of Arthur Bellamy &middot; 1941 — 2023
          </span>
          <span className="hidden sm:inline text-[9px] text-muted-foreground">An imagined family &middot; sample memoir</span>
          <span className="flex items-center gap-2 text-foreground">
            <span aria-hidden="true">🔒</span>
            A private family book
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)_270px] gap-6 md:gap-10 pt-9">
          <div className="hidden md:flex flex-col gap-5 text-[11px]">
            <Eyebrow>The chapters</Eyebrow>
            {chapters.map((c) => (
              <div key={c.number} className={c.active ? "text-foreground" : "text-muted-foreground"}>
                <span className="font-serif mr-2">{c.number}</span>
                {c.title}
              </div>
            ))}
          </div>

          <div>
            <Eyebrow>Chapter one</Eyebrow>
            <h3 className="font-serif text-4xl text-foreground mt-1 mb-4">Little things, remembered.</h3>
            <p className="text-sm leading-relaxed text-foreground">
              <span className="float-left font-serif text-[64px] leading-[0.8] pr-2 pt-1 text-foreground" aria-hidden="true">
                H
              </span>
              e never made a fuss. Breakfast was the same every day — toast, two eggs, the radio turned low so it
              was more company than noise. He read the paper from the back page forward, sports first, and never
              once skipped the crossword even on the mornings he knew he wouldn&rsquo;t finish it.
            </p>
            <p className="text-sm leading-relaxed text-foreground mt-4">
              We didn&rsquo;t realise until much later how much of him was in those small habits — the folded
              newspaper on the chair arm, the kettle that whistled a half-tone off true, the porch light left on
              even in summer, even when everyone was already home.
            </p>

            <SourceBlock
              sources={[
                {
                  name: "Claire",
                  relationship: "his daughter",
                  text: "He read the paper back to front, sports pages first. I used to tease him about the crossword — he never finished it, not once, but he never skipped it either.",
                },
                {
                  name: "David",
                  relationship: "his son",
                  text: "The porch light stayed on all summer. I asked him why once and he just said some habits aren't really about anything, they're just what you do.",
                },
              ]}
            />

            <AudioMemory
              className="mt-5"
              src="/audio/sample-clip.wav"
              caption="He liked the quiet best."
              attribution="Claire's memory &middot; sample voice"
              transcript="He liked the quiet best, especially in the mornings. He'd sit with his tea and not say much at all, and that was alright. You didn't need him to fill the silence for it to feel like he was there."
            />
          </div>

          <div>
            <CaptionedPhoto
              src="/images/garden-portrait.jpg"
              alt="A garden in bloom, with a traditional wooden house behind it."
              caption="An afternoon at the allotment, 1979."
              credit="Shared by Claire, his daughter."
              variant="credit"
              width={270}
              height={340}
            />
            <PullQuote attribution="Claire, his daughter">
              He made the ordinary feel like something worth keeping.
            </PullQuote>
          </div>
        </div>
      </section>

      <section className="text-center pb-16">
        <Link href="/memoir" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
          Stay a little longer &rarr;
        </Link>
      </section>
    </>
  );
}

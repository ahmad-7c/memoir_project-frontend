import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { Hero } from "@/components/ui/Hero";
import { Button } from "@/components/ui/Button";
import { SampleMemoir } from "@/features/landingPage/SampleMemoir";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <Hero
        desktopSrc="/images/scattered-photos-linen-desktop.jpg"
        phoneSrc="/images/scattered-photos-linen-phone.jpg"
        alt="A scattering of faded family photographs across warm linen."
        eyebrow="Every life leaves a story"
        title={
          <>
            The Family Memoir<span className="italic text-accent">.</span>
          </>
        }
        description={
          <>
            A life lives on in the people who loved it.
            <br />
            Bring their memories together.
            <br />
            Make something you can keep, forever.
          </>
        }
        footLeft="A lifetime, kept in eight photographs."
        footRight="A life, remembered together."
        action={
          <Button href="/begin" variant="hero" size="lg">
            Begin
          </Button>
        }
      />
      <SampleMemoir />
      <Footer />
    </main>
  );
}

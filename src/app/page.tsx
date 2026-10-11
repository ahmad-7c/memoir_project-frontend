import Hero from "../features/landingPage/Hero";
import LandingPageScroll from "../features/landingPage/LandingPageScroll";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <LandingPageScroll />
    </main>
  );
}

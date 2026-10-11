import Hero from "../features/landingPage/Hero";
import LandingPageScroll from "../features/landingPage/LandingPageScroll";
import AnnouncementBar from "../components/AnnouncementBar";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <LandingPageScroll />
    </main>
  );
}

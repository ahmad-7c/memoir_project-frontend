import MemoirPassage from "./MemoirPassage";
import ImageBand from "./ImageBand";
import PriceLine from "./PriceLine";
import CallToAction from "./CallToAction";

export default function LandingPageScroll() {
  return (
    <div className="flex flex-col w-full">
      <MemoirPassage />
      <ImageBand />
      <PriceLine />
      <CallToAction />
    </div>
  );
}

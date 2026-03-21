import imgRectangle647 from "figma:asset/76052c3a0de6dc113f1a421beb45eac4e773b8e8.png";
import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { DarkShowcase } from "./DarkShowcase";
import { HowItWorks } from "./HowItWorks";
import { Testimonials } from "./Testimonials";
import { PlanningTools } from "./PlanningTools";
import { BlogSection } from "./BlogSection";
import { FAQSection } from "./FAQSection";
import { FooterSection } from "./FooterSection";
import { BeforeYouStart } from "./BeforeYouStart";
import { ReactLenis } from "lenis/react";

export function HomePage() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
    <div className="bg-[#f9fafb] min-h-screen font-['Inter',sans-serif] relative overflow-x-clip">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-[92px] z-40 pointer-events-none">
        <img alt="" className="size-full object-cover" src={imgRectangle647} />
      </div>

      {/* Top blur gradient overlay */}
      <div
        className="fixed top-0 left-0 right-0 h-[120px] z-[39] pointer-events-none backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
        }}
      />

      <Navbar />

      <div className="max-w-[1293px] mx-auto">
        <HeroSection />
      </div>

      <DarkShowcase />

      <div className="max-w-[1293px] mx-auto">
        <BeforeYouStart />
        <HowItWorks />
        <Testimonials />
        <PlanningTools />
      </div>

      <BlogSection />

      <div className="max-w-[1293px] mx-auto">
        <FAQSection />
      </div>

      <FooterSection />

      {/* Bottom blur gradient overlay */}
      <div
        className="fixed bottom-0 left-0 right-0 h-[80px] z-[39] pointer-events-none backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
        }}
      />
    </div>
    </ReactLenis>
  );
}
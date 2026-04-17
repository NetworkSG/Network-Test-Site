import { ReactLenis } from "lenis/react";
import { C, sans, Divider } from "../homepage/v8/primitives";
import { SocialProof3 } from "../homepage/v8/sections/SocialProof3";
import { FreeTools } from "../homepage/v8/sections/FreeTools";
import { SiteFooter } from "../shared/SiteFooter";
import { FunnelHero } from "./FunnelHero";
import { ValueProps } from "./ValueProps";
import { GoogleReviewsLive } from "./GoogleReviewsLive";
import { useHomeownerCount } from "../homepage/v8/useHomeownerCount";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

function FunnelNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: C.cream, borderBottom: `1px solid ${C.creamBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
        <a
          href="/"
          className="cursor-pointer shrink-0 block"
          style={{
            width: "110px",
            height: "23px",
            background: C.black,
            maskImage: `url('${logoImg}')`,
            maskSize: "111.804px 22.909px",
            maskRepeat: "no-repeat",
            maskPosition: "0px 0px",
            WebkitMaskImage: `url('${logoImg}')`,
            WebkitMaskSize: "111.804px 22.909px",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "0px 0px",
          }}
        />
        <div className="flex items-center gap-4">
          <span
            className="hidden sm:inline text-[11px]"
            style={{
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.grayLight,
              fontFamily: sans,
            }}
          >
            Free · No obligations
          </span>
        </div>
      </div>
    </nav>
  );
}

export function FunnelLeadPage() {
  const homeownerCount = useHomeownerCount();
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div
        className="min-h-screen"
        style={{ background: C.cream, fontFamily: sans, color: C.black }}
      >
        <FunnelNav />
        <FunnelHero />
        <Divider />
        <GoogleReviewsLive />
        <Divider />
        <SocialProof3 />
        <Divider />
        <ValueProps />
        <Divider />
        <FreeTools />
        <SiteFooter
          ctaHeadline="Still thinking about it?"
          ctaDescription={`${homeownerCount} homeowners used Network this year to find a designer they can trust. Free, within the day, zero obligations.`}
          ctaButtonLabel="Get my free match"
          ctaHref="#top"
        />
      </div>
    </ReactLenis>
  );
}

export default FunnelLeadPage;

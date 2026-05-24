import { useState, useRef, useEffect } from "react";
import { isValid8DigitPhone } from "../../../utils/phone-validation";
import { ReactLenis } from "lenis/react";
import { useInView } from "motion/react";
import { C, sans, Divider } from "../v8/primitives";
import { NAVBAR } from "../content";
import type { FormState, LeadFormData } from "../types";
import { Seo } from "../../shared/Seo";
import { HomepageNav } from "../../shared/HomepageNav";
import { HomepageFooter } from "../../shared/HomepageFooter";
import { buildHomeStructuredData } from "../../shared/homeSchema";
import { useGoogleReviews } from "../../useGoogleReviews";

import { HeroSection } from "../v8/sections/HeroSection";
import { TrustStatsBar } from "../v8/sections/SocialProof1";
import { PainPoint } from "../v8/sections/PainPoint";
import { Differentiators } from "../v8/sections/Differentiators";
import { HowItWorks } from "../v8/sections/HowItWorks";
import { Guarantee } from "../v8/sections/Guarantee";
import { SocialProof3 } from "../v8/sections/SocialProof3";
import { FAQ } from "../v8/sections/FAQ";
import { FinalRecap } from "../v8/sections/FinalRecap";
import { FreeTools } from "../v8/sections/FreeTools";
import { GoogleReviews } from "../v8/sections/GoogleReviews";
import { BlogHighlights } from "../v8/sections/BlogHighlights";

import { FeaturedDesignersGrid } from "./sections/FeaturedDesignersGrid";

/**
 * TestHomepage — variant of HomepageV8 that surfaces 12 designers via the
 * new Network Star card spec right after the hero. Otherwise identical to /.
 * Lives at /test-homepage and intentionally does not compete with / in SEO.
 */
export function TestHomepage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [form, setForm] = useState<LeadFormData>({ name: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Mirror v8 nav-hide-on-scroll behaviour exactly.
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTouchY = 0;
    const TOP_THRESHOLD = 40;

    const getY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setNavHidden(false), 2000);
    };

    const onWheel = (e: WheelEvent) => {
      if (getY() < TOP_THRESHOLD) setNavHidden(false);
      else if (e.deltaY > 0) setNavHidden(true);
      else if (e.deltaY < 0) setNavHidden(false);
      armIdle();
    };
    const onTouchStart = (e: TouchEvent) => { lastTouchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      const ty = e.touches[0]?.clientY ?? 0;
      const tdy = lastTouchY - ty;
      if (getY() < TOP_THRESHOLD) setNavHidden(false);
      else if (tdy > 4) setNavHidden(true);
      else if (tdy < -4) setNavHidden(false);
      lastTouchY = ty;
      armIdle();
    };
    const onKey = (e: KeyboardEvent) => {
      const downKeys = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];
      const upKeys = ["ArrowUp", "PageUp", "Home"];
      if (getY() < TOP_THRESHOLD) setNavHidden(false);
      else if (downKeys.includes(e.key)) setNavHidden(true);
      else if (upKeys.includes(e.key)) setNavHidden(false);
      armIdle();
    };
    const onScroll = () => { if (getY() < TOP_THRESHOLD) setNavHidden(false); };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  useInView(heroRef, { margin: "-100px" });
  const { payload: googleReviewsPayload } = useGoogleReviews("network");

  const scrollToForm = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || isSubmitting) return;
    if (!isValid8DigitPhone(form.phone)) {
      const phoneInput = (e.currentTarget as HTMLFormElement).querySelector('input[type="tel"]') as HTMLInputElement | null;
      phoneInput?.focus();
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setFormState("qualifying"); }, 600);
  };

  // Silence unused-var on navHidden — kept for parity with v8 in case any
  // child reads it via context in future. The current v8 doesn't pass it
  // either; left as state so the listener wiring stays identical.
  void navHidden;

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <Seo
        title="Network | Featured Interior Designers (test)"
        description="Test homepage variant featuring 12 of Singapore's top interior design firms, ranked and protected by Handshake escrow."
        canonical="/test-homepage"
        jsonLd={buildHomeStructuredData(googleReviewsPayload)}
      />
      <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>
        <HomepageNav onCtaClick={scrollToForm} ctaLabel={NAVBAR.cta.label} />

        <HeroSection
          formState={formState} setFormState={setFormState}
          form={form} setForm={setForm}
          isSubmitting={isSubmitting} handleSubmit={handleSubmit}
          heroRef={heroRef}
        />

        <div className={formState !== "idle" ? "hidden md:block" : ""}>
          {/* NEW: Featured designers grid (Network Star showcase) */}
          <FeaturedDesignersGrid />

          <TrustStatsBar />
          <GoogleReviews />
          <SocialProof3 />
          <Divider />
          <PainPoint scrollToForm={scrollToForm} />
          <HowItWorks scrollToForm={scrollToForm} />
          <Divider />
          <Differentiators scrollToForm={scrollToForm} />
          <Divider />
          <FreeTools />
          <BlogHighlights />
          <Guarantee scrollToForm={scrollToForm} />
          <FAQ scrollToForm={scrollToForm} />
          <FinalRecap scrollToForm={scrollToForm} />

          <HomepageFooter />
        </div>
      </div>
    </ReactLenis>
  );
}

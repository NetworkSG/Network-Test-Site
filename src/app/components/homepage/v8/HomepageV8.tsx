import { useState, useRef, useEffect } from "react";
import { ReactLenis } from "lenis/react";
import { useInView, motion, AnimatePresence } from "motion/react";
import { C, sans, Divider } from "./primitives";
import { NAVBAR, FOOTER } from "../content";
import type { FormState, LeadFormData } from "../types";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { Seo } from "../../shared/Seo";
import { HomepageNav } from "../../shared/HomepageNav";
import { HomepageFooter } from "../../shared/HomepageFooter";
import { buildHomeStructuredData } from "../../shared/homeSchema";
import { useGoogleReviews } from "../../useGoogleReviews";

import { HeroSection } from "./sections/HeroSection";
import { TrustStatsBar } from "./sections/SocialProof1";
import { PainPoint } from "./sections/PainPoint";
import { ValueProps } from "./sections/ValueProps";

import { Differentiators } from "./sections/Differentiators";
import { HowItWorks } from "./sections/HowItWorks";

import { Guarantee } from "./sections/Guarantee";
import { SocialProof3 } from "./sections/SocialProof3";
import { FAQ } from "./sections/FAQ";
import { FinalRecap } from "./sections/FinalRecap";
import { FreeTools } from "./sections/FreeTools";
import { GoogleReviews } from "./sections/GoogleReviews";

/**
 * Homepage — Network SOP Design
 *
 * 12-section high-converting landing page.
 * Warm cream palette, premium editorial feel.
 * EB Garamond for display, DM Sans for body/UI.
 */
export function HomepageV8() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [form, setForm] = useState<LeadFormData>({ name: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

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
      if (getY() < TOP_THRESHOLD) {
        setNavHidden(false);
      } else if (e.deltaY > 0) {
        setNavHidden(true);
      } else if (e.deltaY < 0) {
        setNavHidden(false);
      }
      armIdle();
    };

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const ty = e.touches[0]?.clientY ?? 0;
      const tdy = lastTouchY - ty;
      if (getY() < TOP_THRESHOLD) {
        setNavHidden(false);
      } else if (tdy > 4) {
        setNavHidden(true);
      } else if (tdy < -4) {
        setNavHidden(false);
      }
      lastTouchY = ty;
      armIdle();
    };

    const onKey = (e: KeyboardEvent) => {
      const downKeys = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];
      const upKeys = ["ArrowUp", "PageUp", "Home"];
      if (getY() < TOP_THRESHOLD) {
        setNavHidden(false);
      } else if (downKeys.includes(e.key)) {
        setNavHidden(true);
      } else if (upKeys.includes(e.key)) {
        setNavHidden(false);
      }
      armIdle();
    };

    const onScroll = () => {
      if (getY() < TOP_THRESHOLD) setNavHidden(false);
    };

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

  const heroInView = useInView(heroRef, { margin: "-100px" });
  const { payload: googleReviewsPayload } = useGoogleReviews("network");

  const scrollToForm = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setFormState("qualifying"); }, 600);
  };

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <Seo
        title="Network | Match with Singapore's Top Interior Designers"
        description="Singapore's interior design matching service. Get paired with vetted firms that fit your style, budget, and timeline. Free, no obligation."
        canonical="/"
        jsonLd={buildHomeStructuredData(googleReviewsPayload)}
      />
      <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>

        {/* ═══ NAVBAR ═══ */}
        <HomepageNav onCtaClick={scrollToForm} ctaLabel={NAVBAR.cta.label} />

        {/* ═══ SECTIONS ═══ */}
        <HeroSection
          formState={formState} setFormState={setFormState}
          form={form} setForm={setForm}
          isSubmitting={isSubmitting} handleSubmit={handleSubmit}
          heroRef={heroRef}
        />
        {/* Hide all sections below hero on mobile when qualifying/complete */}
        <div className={formState !== "idle" ? "hidden md:block" : ""}>
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
        <Guarantee scrollToForm={scrollToForm} />
        <FAQ scrollToForm={scrollToForm} />
        <FinalRecap scrollToForm={scrollToForm} />

        {/* ═══ FOOTER ═══ */}
        <HomepageFooter />
        </div>


      </div>
    </ReactLenis>
  );
}

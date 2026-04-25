import { useState, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { useInView, motion, AnimatePresence } from "motion/react";
import { C, sans, Divider } from "./primitives";
import { NAVBAR, FOOTER } from "../content";
import type { FormState, LeadFormData } from "../types";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { Seo } from "../../shared/Seo";
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
  const heroRef = useRef<HTMLElement>(null);
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
        <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: C.cream }}>
          <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
            <a href="/" aria-label="Network — home" className="cursor-pointer shrink-0 block" style={{
              width: "110px", height: "23px", background: C.black,
              maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
              WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
            }} />
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Home</a>
              <a href="/render-tool" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Room Designer</a>
              <a href="/floorplan3d" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Layout Planner</a>
              <a href="/cost-guide" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Cost Guide</a>
              {/* <a href="/style-quiz" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Style Quiz</a> */}
              {/* <a href="/mood-board" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Mood Board</a> */}
              <a href="/networkxhandshake" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Handshake</a>
            </div>
            {/* Desktop CTA */}
            <button onClick={scrollToForm}
              className="hidden md:block text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
            >{NAVBAR.cta.label}</button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
                )}
              </svg>
            </button>
          </div>
          <div className="h-[1px]" style={{ background: C.creamBorder }} />
          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden"
                style={{ background: C.cream, borderBottom: `1px solid ${C.creamBorder}` }}
              >
                <div className="px-6 py-4 flex flex-col gap-1">
                  <a href="/" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Home</a>
                  <a href="/render-tool" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Room Designer</a>
                  <a href="/floorplan3d" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Layout Planner</a>
                  <a href="/cost-guide" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Cost Guide</a>
                  {/* <a href="/style-quiz" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Style Quiz</a> */}
                  {/* <a href="/mood-board" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Mood Board</a> */}
                  <a href="/networkxhandshake" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Handshake</a>
                  <button
                    onClick={() => { setMobileMenuOpen(false); scrollToForm(); }}
                    className="w-full h-[48px] mt-2 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
                    style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
                  >Get matched</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

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
        <footer className="px-6 md:px-10 py-10 md:py-14">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <a href="/" aria-label="Network — home" className="block shrink-0" style={{
                  width: "110px", height: "23px", background: C.black,
                  maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
                  WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
                }} />
                <div className="flex items-center gap-6">
                  {FOOTER.links.map((link) => (
                    <a key={link.label} href={link.href}
                      className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                      style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
                    >{link.label}</a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.facebook.com/networksingapore/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Network on Facebook"
                    className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                    style={{ color: C.gray, transition: "all 0.15s" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 21.95V13.5h2.85l.43-3.32H13.5V8.06c0-.96.27-1.62 1.65-1.62h1.76V3.47a23.6 23.6 0 0 0-2.57-.13c-2.55 0-4.29 1.55-4.29 4.4v2.45H7.18v3.31h2.87v8.45z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/networksingapore/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Network on Instagram"
                    className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                    style={{ color: C.gray, transition: "all 0.15s" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                </div>
                <span className="text-[12px] font-normal" style={{ color: C.gray, fontFamily: sans }}>
                  {FOOTER.copyright}
                </span>
              </div>
            </div>
          </div>
        </footer>
        </div>

        {/* ═══ MOBILE STICKY CTA ═══ */}
        {!heroInView && formState === "idle" && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4" style={{ background: `linear-gradient(to top, ${C.cream} 70%, transparent)` }}>
            <button onClick={scrollToForm}
              className="w-full h-[52px] text-[15px] font-medium cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
              Get My Free Matches
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}

      </div>
    </ReactLenis>
  );
}

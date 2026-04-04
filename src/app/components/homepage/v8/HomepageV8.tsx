import { useState, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { useInView } from "motion/react";
import { C, sans, Divider } from "./primitives";
import { NAVBAR, FOOTER } from "../content";
import type { FormState, LeadFormData } from "../types";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

import { HeroSection } from "./sections/HeroSection";
import { SocialProof1 } from "./sections/SocialProof1";
import { PainPoint } from "./sections/PainPoint";
import { ValueProps } from "./sections/ValueProps";

import { Differentiators } from "./sections/Differentiators";
import { HowItWorks } from "./sections/HowItWorks";

import { Guarantee } from "./sections/Guarantee";
import { SocialProof3 } from "./sections/SocialProof3";
import { FAQ } from "./sections/FAQ";
import { FinalRecap } from "./sections/FinalRecap";

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
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { margin: "-100px" });

  const scrollToForm = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setFormState("qualifying"); }, 600);
  };

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>

        {/* ═══ NAVBAR ═══ */}
        <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: C.cream }}>
          <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
            <a href="/" className="cursor-pointer shrink-0 block" style={{
              width: "110px", height: "23px", background: C.black,
              maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
              WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
            }} />
            <div className="hidden md:flex items-center gap-8">
              <a href="/explore" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Explore</a>
              <a href="/designers" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Designers</a>
              <a href="/floorplan3d" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Floor Layout Planner</a>
              <a href="/cost-guide" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Cost Guide</a>
            </div>
            <button onClick={scrollToForm}
              className="text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
            >{NAVBAR.cta.label}</button>
          </div>
          <div className="h-[1px]" style={{ background: C.creamBorder }} />
        </nav>

        {/* ═══ SECTIONS ═══ */}
        <HeroSection
          formState={formState} setFormState={setFormState}
          form={form} setForm={setForm}
          isSubmitting={isSubmitting} handleSubmit={handleSubmit}
          heroRef={heroRef}
        />
        <SocialProof1 scrollToForm={scrollToForm} />
        <SocialProof3 />
        <Divider />
        <PainPoint scrollToForm={scrollToForm} />
        <ValueProps scrollToForm={scrollToForm} />
        <Divider />
        <Differentiators scrollToForm={scrollToForm} />
        <Divider />
        <HowItWorks scrollToForm={scrollToForm} />
        <Guarantee scrollToForm={scrollToForm} />
        <FAQ scrollToForm={scrollToForm} />
        <FinalRecap scrollToForm={scrollToForm} />

        {/* ═══ FOOTER ═══ */}
        <footer className="px-6 md:px-10 py-10 md:py-14">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <a href="/" className="block shrink-0" style={{
                  width: "110px", height: "23px", background: C.black,
                  maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
                  WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
                }} />
                <div className="flex items-center gap-6">
                  {FOOTER.links.map((link) => (
                    <a key={link.label} href={link.href}
                      className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                      style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}
                    >{link.label}</a>
                  ))}
                </div>
              </div>
              <span className="text-[12px] font-normal" style={{ color: C.grayLight, fontFamily: sans }}>
                {FOOTER.copyright}
              </span>
            </div>
          </div>
        </footer>

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

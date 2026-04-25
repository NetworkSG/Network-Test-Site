import { C, serif, sans, FadeIn, TagLabel } from "../primitives";
import { FINAL_RECAP } from "../../content";
import { useHomeownerCount } from "../useHomeownerCount";

const bulletIcons = [
  /* BadgeCheck */ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></svg>,
  /* Clock */ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  /* CircleOff */ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20" /><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" /><path d="M15.65 21.3A10 10 0 0 1 2.69 8.35" /></svg>,
  /* Star */ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  /* User */ <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
];

export function FinalRecap({ scrollToForm }: { scrollToForm: () => void }) {
  const homeownerCount = useHomeownerCount();
  return (
    <section className="px-6 md:px-10 pb-10">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn>
          <div className="px-8 py-16 md:px-16 md:py-20 text-center" style={{ background: C.footerDark, borderRadius: "12px" }}>
            <TagLabel><span style={{ color: "rgba(255,255,255,0.4)" }}>Get started</span></TagLabel>
            <h2 className="font-normal leading-[1.15] mt-6 mb-5" style={{ fontFamily: serif, color: "#ffffff", fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
              Ready to find <span style={{ color: "rgba(255,255,255,0.5)" }}>a designer you can trust?</span>
            </h2>
            <p className="text-[15px] font-normal leading-[1.75] max-w-[480px] mx-auto mb-10" style={{ color: "rgba(255,255,255,0.55)", fontFamily: sans }}>
              {homeownerCount} Singapore homeowners got matched this year. Takes 2 minutes. Completely free.
            </p>

            {/* Icon pill badges */}
            {/* Desktop: wrapped */}
            <div className="hidden md:flex flex-wrap justify-center gap-3 mb-10 max-w-[640px] mx-auto">
              {FINAL_RECAP.bullets.map((bullet, i) => (
                <span key={bullet} className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-normal"
                  style={{ color: "rgba(255,255,255,0.8)", fontFamily: sans, background: "rgba(255,255,255,0.08)", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {bulletIcons[i]}
                  {bullet}
                </span>
              ))}
            </div>
            {/* Mobile: horizontal auto-scrolling marquee */}
            <div
              className="md:hidden mb-10 -mx-8 overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
              }}
            >
              <style>{`@keyframes finalRecapMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
              <div
                className="flex gap-3 w-max"
                style={{ animation: "finalRecapMarquee 22s linear infinite" }}
              >
                {[...FINAL_RECAP.bullets, ...FINAL_RECAP.bullets].map((bullet, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-normal whitespace-nowrap shrink-0"
                    style={{ color: "rgba(255,255,255,0.8)", fontFamily: sans, background: "rgba(255,255,255,0.08)", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {bulletIcons[i % bulletIcons.length]}
                    {bullet}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button onClick={scrollToForm}
                className="h-[60px] px-9 text-[16px] font-normal hover:opacity-90 active:scale-[0.98] cursor-pointer flex items-center gap-2"
                style={{ background: "#ffffff", color: C.footerDark, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
                {FINAL_RECAP.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div className="flex items-center justify-center gap-4">
              {["6 questions", "2 minutes", "Free, no obligations"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[12px] font-normal" style={{ color: "rgba(255,255,255,0.35)", fontFamily: sans }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />{item}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

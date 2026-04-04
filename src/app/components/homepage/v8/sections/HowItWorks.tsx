import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { HOW_IT_WORKS_V2 } from "../../content";

const stepIcons = [
  /* ClipboardList */
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
  </svg>,
  /* Users */
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  /* MessageCircle */
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>,
];

export function HowItWorks({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      <div className="max-w-[1080px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>{HOW_IT_WORKS_V2.label}</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-14">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            {HOW_IT_WORKS_V2.headline}
          </h2>
        </FadeIn>

        {/* Step cards with connecting line */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[16%] right-[16%] h-[1px]" style={{ background: C.creamBorder }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS_V2.steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="relative p-7 md:p-8 h-full text-center" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
                  {/* Icon circle */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: C.cream }}>
                    {stepIcons[i]}
                  </div>
                  {/* Step number */}
                  <p className="text-[11px] font-semibold tracking-wider uppercase mb-3" style={{ color: C.grayLight, fontFamily: sans }}>
                    Step {step.number}
                  </p>
                  <h3 className="text-[22px] font-normal leading-[1.3] mb-3" style={{ fontFamily: serif, color: C.black }}>
                    {step.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7]" style={{ color: C.gray, fontFamily: sans }}>
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Inline note */}
        <FadeIn delay={0.2} className="mt-10">
          <div className="p-6 md:p-7 max-w-[560px] mx-auto flex items-start gap-4" style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
            <svg className="shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.grayLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <div>
              <p className="text-[13px] font-medium mb-1" style={{ color: C.black, fontFamily: sans }}>How is this free?</p>
              <p className="text-[13px] leading-[1.7]" style={{ color: C.gray, fontFamily: sans }}>
                {HOW_IT_WORKS_V2.inlineNote}
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.25} className="text-center mt-10">
          <SectionCTA label="Get My Free Matches" onClick={scrollToForm} />
        </FadeIn>
      </div>
    </section>
  );
}

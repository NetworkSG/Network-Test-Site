import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { PAIN_POINT } from "../../content";

/* Inline Lucide-style SVG icons */
const IconDollar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
  </svg>
);
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);
const IconSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconCheckCircle = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
  </svg>
);

const painIcons = [<IconDollar />, <IconAlert />, <IconSearch />];

const agitateCards = [
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>, text: "Best firms don't advertise on classifieds" },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>, text: "Portfolios can be staged or cherry-picked" },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>, text: "Online reviews can be bought" },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>, text: "Cheapest quote is almost never the best" },
];

export function PainPoint({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ background: C.creamDark }}>
      <div className="max-w-[1080px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>{PAIN_POINT.label}</TagLabel>
        </FadeIn>

        <FadeIn delay={0.05} className="text-center mb-14">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            Choosing the wrong designer costs you months and thousands. <span style={{ color: C.gray }}>Here's how to avoid it.</span>
          </h2>
        </FadeIn>

        {/* Pain Question Cards — 3 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-14">
          {PAIN_POINT.painQuestions.map((q, i) => (
            <FadeIn key={i} delay={0.08 + i * 0.04}>
              <div className="p-6 md:p-7 h-full flex flex-col" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5" style={{ background: C.cream }}>
                  {painIcons[i]}
                </div>
                <p className="text-[15px] leading-[1.75] flex-1" style={{ color: C.gray, fontFamily: sans }}>
                  {q}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Agitate — 4 fact cards in 2x2 grid */}
        <FadeIn delay={0.2} className="mb-6">
          <p className="text-center text-[15px] leading-[1.75] max-w-[500px] mx-auto mb-8" style={{ color: C.gray, fontFamily: sans }}>
            Most homeowners spend 3 to 6 weeks researching. And after all that work, they still feel unsure. Here's why:
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[700px] mx-auto mb-14">
          {agitateCards.map((card, i) => (
            <FadeIn key={i} delay={0.22 + i * 0.03}>
              <div className="flex items-start gap-4 p-5" style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px" }}>
                <div className="shrink-0 mt-0.5">{card.icon}</div>
                <p className="text-[13px] leading-[1.6]" style={{ color: C.gray, fontFamily: sans }}>{card.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.24} className="mb-3">
          <p className="text-center text-[15px] leading-[1.75] max-w-[460px] mx-auto" style={{ color: C.grayLight, fontFamily: sans }}>
            Every week you delay is another week closer to key collection. Another week your dream home stays on a Pinterest board.
          </p>
        </FadeIn>

        {/* Solve Card */}
        <FadeIn delay={0.28} className="mt-10 mb-10">
          <div className="p-7 md:p-8 max-w-[700px] mx-auto" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
            <div className="flex items-center gap-3 mb-4">
              <IconCheckCircle />
              <p className="text-[16px] font-medium" style={{ fontFamily: sans, color: C.black }}>Here's what you actually need</p>
            </div>
            <p className="text-[15px] leading-[1.75]" style={{ fontFamily: sans, color: C.gray }}>
              A shortlist of 3 verified designers who already match your style, budget, and timeline. Our concierge team reviews your brief and handpicks them from 120+ verified designers. Free. In just 30 minutes. No obligations.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="text-center">
          <SectionCTA label={PAIN_POINT.cta} onClick={scrollToForm} />
        </FadeIn>
      </div>
    </section>
  );
}

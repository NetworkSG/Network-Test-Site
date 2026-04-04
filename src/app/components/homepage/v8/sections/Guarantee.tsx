import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { GUARANTEE } from "../../content";

const guaranteeIcons = [
  /* DollarSign off */
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
  </svg>,
  /* Handshake */
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88" /><path d="m2 2 20 20" /><path d="m8 8-2.5 2.5a1 1 0 0 0 3 3L10 12" />
  </svg>,
  /* BellOff */
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" /><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="m2 2 20 20" />
  </svg>,
  /* ShieldCheck */
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
  </svg>,
];

export function Guarantee({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      <div className="max-w-[1080px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>{GUARANTEE.label}</TagLabel>
        </FadeIn>

        {/* Shield icon */}
        <FadeIn delay={0.03} className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: C.cream }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </FadeIn>

        <FadeIn delay={0.05} className="text-center mb-12">
          <h2 className="font-normal leading-[1.15]" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            {GUARANTEE.headline}
          </h2>
        </FadeIn>

        {/* 2x2 Icon Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[800px] mx-auto mb-12">
          {GUARANTEE.bullets.map((bullet, i) => (
            <FadeIn key={i} delay={0.08 + i * 0.04}>
              <div className="p-6 md:p-7 h-full flex items-start gap-4" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: C.cream }}>
                  {guaranteeIcons[i]}
                </div>
                <p className="text-[15px] leading-[1.75]" style={{ color: C.gray, fontFamily: sans }}>
                  {bullet}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.25} className="text-center">
          <SectionCTA label={GUARANTEE.cta} onClick={scrollToForm} />
        </FadeIn>
      </div>
    </section>
  );
}

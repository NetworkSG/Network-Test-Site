import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { DIFFERENTIATORS } from "../../content";

const diffIcons = [
  /* BadgeCheck */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
  </svg>,
  /* DollarSign */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>,
  /* Phone */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>,
  /* Home */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>,
  /* Star */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>,
  /* Infinity */
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
  </svg>,
];

export function Differentiators({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>Why Network</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-16">
          <h2 className="font-normal leading-[1.15] max-w-[800px] mx-auto" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            Why homeowners trust Network over other options
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px] max-w-[1080px] mx-auto">
          {DIFFERENTIATORS.map((d, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="p-7 md:p-8 h-full" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
                  style={{ background: C.cream }}>
                  {diffIcons[i]}
                </div>
                <h3 className="text-[22px] font-medium leading-[1.3] mb-3" style={{ fontFamily: serif, color: C.black }}>
                  {d.headline}
                </h3>
                <p className="text-[13px] font-normal leading-[1.7]" style={{ color: C.gray, fontFamily: sans }}>
                  {d.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3} className="text-center mt-12">
          <SectionCTA label="Get My Free Matches" onClick={scrollToForm} />
        </FadeIn>
      </div>
    </section>
  );
}

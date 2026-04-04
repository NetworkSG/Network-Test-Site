import { C, FadeIn, TagLabel } from "../primitives";
import { SOCIAL_PROOF_IMAGES } from "../../content";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function SocialProof3() {
  const items = SOCIAL_PROOF_IMAGES.homeownerFeedback;

  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ background: C.creamDark }}>
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>Real feedback</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            What Homeowners Are Saying About Network
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-16">
          <p className="text-[15px] font-normal leading-[1.75] max-w-[560px] mx-auto" style={{ color: C.gray, fontFamily: sans }}>
            Real conversations between our concierge team and homeowners we've matched. No scripts, no edits, just genuine feedback from people who went through the process.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <FadeIn key={i} delay={i * 0.03}>
              <div className="overflow-hidden" style={{ borderRadius: "8px", border: `1px solid ${C.creamBorder}`, background: C.white }}>
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="px-3 py-2.5">
                  <p className="text-[12px] leading-[1.5]" style={{ color: C.gray, fontFamily: sans }}>
                    {item.caption}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { VALUE_PROPS } from "../../content";
const photos = [
  "/r2.jpeg",  // Verified quality — dining/living interior
  "/r5.jpeg",  // Matched in 30 minutes — modern kitchen
  "/r3.jpeg",  // Zero risk — green kitchen with dining
];

export function ValueProps({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>What's in it for you</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-16">
          <h2 className="font-normal leading-[1.15] max-w-[800px] mx-auto" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            What you get <span style={{ color: C.gray }}>when you sign up</span>
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-0">
          {VALUE_PROPS.map((prop, i) => {
            const isOdd = i % 2 === 1;
            return (
              <FadeIn key={i} delay={i * 0.05}>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center py-14 ${i > 0 ? "" : ""}`}
                  style={{ borderBottom: i < VALUE_PROPS.length - 1 ? `1px solid ${C.creamBorder}` : undefined }}
                >
                  {/* Image */}
                  <div className={`${isOdd ? "md:order-2" : ""} overflow-hidden`} style={{ borderRadius: "12px" }}>
                    <img
                      src={photos[i]}
                      alt={prop.label}
                      className="w-full h-[320px] md:h-[400px] object-cover"
                      style={{ borderRadius: "12px" }}
                    />
                  </div>

                  {/* Text */}
                  <div className={isOdd ? "md:order-1" : ""}>
                    <TagLabel>{prop.label}</TagLabel>
                    <h3 className="text-[24px] md:text-[28px] lg:text-[32px] font-normal leading-[1.2] mt-4 mb-5" style={{ fontFamily: serif, color: C.black }}>
                      {prop.headline}
                    </h3>
                    <p className="text-[15px] font-normal leading-[1.75] mb-8" style={{ color: C.gray, fontFamily: sans, whiteSpace: "pre-line" }}>
                      {prop.body}
                    </p>
                    <SectionCTA label={prop.cta} onClick={scrollToForm} />
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { C, serif, sans, TagLabel, FadeIn } from "../homepage/v8/primitives";
import { FUNNEL_PAIN_POINT } from "./content";

const PAIN_STATS: { anchor: string; anchorItalic?: string; body: string }[] = [
  {
    anchor: "40%",
    body: "Quotes swing between firms for the exact same scope.",
  },
  {
    anchor: "Hidden",
    body: "Portfolios hide the firms that actually deliver on time.",
  },
  {
    anchor: "Months",
    anchorItalic: " + tens of thousands",
    body: "One bad match costs you months — and tens of thousands.",
  },
];

export function PainPointSection() {
  return (
    <section
      className="px-6 md:px-10 py-[80px] md:py-[110px]"
      style={{ background: C.cream }}
    >
      <div className="max-w-[1120px] mx-auto">
        {/* Eyebrow */}
        <FadeIn className="flex items-center gap-2 mb-8 justify-center">
          <span
            className="w-6 h-[1.5px] inline-block"
            style={{ background: C.grayLight }}
          />
          <TagLabel>{FUNNEL_PAIN_POINT.eyebrow}</TagLabel>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.05} className="mb-14 md:mb-16 text-center">
          <h2
            className="font-normal leading-[1.15] max-w-[820px] mx-auto"
            style={{
              fontFamily: serif,
              color: C.black,
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "-0.01em",
            }}
          >
            {FUNNEL_PAIN_POINT.headline}{" "}
            <em style={{ color: C.gray }}>{FUNNEL_PAIN_POINT.headlineItalic}</em>
          </h2>
        </FadeIn>

        {/* Stat grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-14 md:mb-16"
          style={{ background: C.creamBorder }}
        >
          {PAIN_STATS.map((stat, i) => (
            <FadeIn key={stat.anchor} delay={0.1 + i * 0.06}>
              <div
                className="h-full px-6 md:px-8 py-10 md:py-12"
                style={{ background: C.cream }}
              >
                <div
                  className="mb-5"
                  style={{
                    fontFamily: serif,
                    color: C.black,
                    fontSize: "clamp(44px, 5vw, 64px)",
                    lineHeight: 1,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {stat.anchor}
                </div>
                <p
                  className="text-[15px] leading-[1.55]"
                  style={{ color: C.gray, fontFamily: sans, maxWidth: "28ch" }}
                >
                  {stat.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bridge callout */}
        <FadeIn delay={0.25} className="text-center">
          <p
            className="text-[17px] md:text-[19px] leading-[1.6] max-w-[720px] mx-auto"
            style={{ color: C.black, fontFamily: serif, fontStyle: "italic" }}
          >
            {FUNNEL_PAIN_POINT.bridge}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

import { UserRound, ShieldCheck, Clock } from "lucide-react";
import { C, serif, sans, TagLabel, FadeIn } from "../homepage/v8/primitives";
import { FUNNEL_VALUE_PROPS } from "./content";

const ICONS = { UserRound, ShieldCheck, Clock } as const;
type IconName = keyof typeof ICONS;

export function ValueProps() {
  return (
    <section
      className="px-6 md:px-10 py-[80px] md:py-[100px]"
      style={{ background: C.cream }}
    >
      <div className="max-w-[1160px] mx-auto">
        <FadeIn className="flex items-center gap-2 mb-7 justify-center">
          <span
            className="w-6 h-[1.5px] inline-block"
            style={{ background: C.grayLight }}
          />
          <TagLabel>{FUNNEL_VALUE_PROPS.eyebrow}</TagLabel>
        </FadeIn>

        <FadeIn delay={0.05} className="mb-14 text-center">
          <h2
            className="font-normal leading-[1.15] max-w-[720px] mx-auto"
            style={{
              fontFamily: serif,
              color: C.black,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              letterSpacing: "-0.01em",
            }}
          >
            {FUNNEL_VALUE_PROPS.headline}{" "}
            <em style={{ color: C.gray }}>{FUNNEL_VALUE_PROPS.headlineItalic}</em>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {FUNNEL_VALUE_PROPS.cards.map((card, i) => {
            const Icon = ICONS[card.icon as IconName];
            return (
              <FadeIn key={card.title} delay={0.1 + i * 0.05}>
                <div
                  className="h-full p-8"
                  style={{
                    background: C.cream,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: "16px",
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 mb-6"
                    style={{
                      background: C.white,
                      border: `1px solid ${C.creamBorder}`,
                      borderRadius: "12px",
                    }}
                  >
                    <Icon size={20} color={C.black} strokeWidth={1.75} />
                  </div>
                  <h3
                    className="font-normal leading-[1.2] mb-3"
                    style={{
                      fontFamily: serif,
                      color: C.black,
                      fontSize: "22px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-[15px] leading-[1.6]"
                    style={{ color: C.gray, fontFamily: sans }}
                  >
                    {card.body}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

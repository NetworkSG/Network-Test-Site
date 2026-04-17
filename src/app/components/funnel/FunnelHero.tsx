import { motion } from "motion/react";
import { Star, ShieldCheck, Gift } from "lucide-react";
import { C, serif, sans } from "../homepage/v8/primitives";
import { CompactLeadForm } from "./CompactLeadForm";
import { FUNNEL_HERO } from "./content";
import { useGoogleReviews } from "../useGoogleReviews";
import { useHomeownerCount } from "../homepage/v8/useHomeownerCount";

export function FunnelHero() {
  const homeownerCount = useHomeownerCount();
  const { payload } = useGoogleReviews("network");
  const rating = payload?.rating ? payload.rating.toFixed(1) : "4.5";
  const trustBullets: Array<{ text: string; icon: "star" | "shield" | "gift" }> = [
    { text: `Rated ${rating} on Google`, icon: "star" },
    { text: FUNNEL_HERO.trustBullets[1], icon: "shield" },
    { text: FUNNEL_HERO.trustBullets[2], icon: "gift" },
  ];
  return (
    <section
      className="relative pt-[88px] md:pt-[104px] pb-[56px] md:pb-[88px] px-6 md:px-10"
      style={{ background: C.cream }}
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-start">
          {/* ── LEFT: copy ── */}
          <div className="pt-2 lg:pt-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="inline-flex items-center gap-2.5 mb-7 pl-2.5 pr-3.5 py-1.5"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: 100,
              }}
            >
              <span className="relative inline-flex w-2 h-2">
                <span
                  className="absolute inline-flex w-full h-full rounded-full opacity-60"
                  style={{ background: "#22a06b", animation: "funnel-pulse 1.8s ease-out infinite" }}
                />
                <span
                  className="relative inline-flex w-2 h-2 rounded-full"
                  style={{ background: "#22a06b" }}
                />
              </span>
              <span
                className="text-[12px] md:text-[12.5px]"
                style={{
                  fontFamily: sans,
                  color: C.black,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {homeownerCount} homeowners matched · Singapore
              </span>
              <style>{`@keyframes funnel-pulse { 0% { transform: scale(1); opacity: 0.6; } 70% { transform: scale(2.4); opacity: 0; } 100% { opacity: 0; } }`}</style>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="leading-[1.08] mb-6"
            >
              <span
                className="block font-normal"
                style={{
                  fontFamily: serif,
                  color: C.black,
                  fontSize: "clamp(30px, 3.6vw, 52px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {FUNNEL_HERO.headline}
              </span>
              <span
                className="block font-normal italic"
                style={{
                  fontFamily: serif,
                  color: C.gray,
                  fontSize: "clamp(30px, 3.4vw, 48px)",
                }}
              >
                {FUNNEL_HERO.headlineItalic}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-[15px] leading-[1.7] mb-8 max-w-[520px]"
              style={{ color: C.gray, fontFamily: sans }}
            >
              {FUNNEL_HERO.subheadline}
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              {trustBullets.map((bullet) => (
                <li
                  key={bullet.text}
                  className="flex items-center gap-3 text-[15px] md:text-[16px] leading-[1.45]"
                  style={{ color: C.black, fontFamily: sans, fontWeight: 500 }}
                >
                  <span
                    className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full shrink-0"
                    style={{ background: C.black }}
                  >
                    {bullet.icon === "star" && (
                      <Star size={14} color={C.cream} fill={C.cream} strokeWidth={0} />
                    )}
                    {bullet.icon === "shield" && (
                      <ShieldCheck size={14} color={C.cream} strokeWidth={2} />
                    )}
                    {bullet.icon === "gift" && (
                      <Gift size={14} color={C.cream} strokeWidth={2} />
                    )}
                  </span>
                  {bullet.text}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* ── RIGHT: form ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-full lg:sticky lg:top-24"
          >
            <CompactLeadForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

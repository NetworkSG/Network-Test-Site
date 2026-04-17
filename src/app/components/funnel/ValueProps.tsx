import { motion } from "motion/react";
import { Phone, Check, Mail, User } from "lucide-react";
import { C, serif, sans, TagLabel, FadeIn } from "../homepage/v8/primitives";
import { FUNNEL_VALUE_PROPS } from "./content";

/* ── Visual 1: Submit form → Concierge calls ── */
function VisualSubmitToCall() {
  return (
    <div
      className="relative w-full h-[150px] mb-6 overflow-hidden"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "12px",
      }}
    >
      {/* Mini form card */}
      <motion.div
        className="absolute top-4 left-4 p-2.5"
        style={{
          background: C.cream,
          border: `1px solid ${C.creamBorder}`,
          borderRadius: "8px",
          width: "92px",
        }}
        animate={{ opacity: [1, 1, 0.35, 0.35, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="h-1.5 rounded-full mb-1.5"
          style={{ background: C.creamBorder, width: "60%" }}
        />
        <div
          className="h-1.5 rounded-full mb-1.5"
          style={{ background: C.creamBorder, width: "85%" }}
        />
        <div
          className="h-1.5 rounded-full mb-2"
          style={{ background: C.creamBorder, width: "45%" }}
        />
        <div
          className="h-4 rounded-[4px] flex items-center justify-center"
          style={{ background: C.black }}
        >
          <span
            style={{
              color: C.white,
              fontFamily: sans,
              fontSize: "6.5px",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            SUBMIT
          </span>
        </div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ x: [-6, 6, -6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <path
            d="M1 6h22m0 0l-5-5m5 5l-5 5"
            stroke={C.grayLight}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Concierge call chip */}
      <motion.div
        className="absolute top-6 right-4 flex items-center gap-1.5 px-2 py-1.5"
        style={{
          background: C.black,
          borderRadius: "8px",
        }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="relative inline-flex w-2 h-2">
          <span
            className="absolute inline-flex w-full h-full rounded-full"
            style={{
              background: "#22a06b",
              animation: "vp-pulse 1.4s ease-out infinite",
            }}
          />
          <span
            className="relative inline-flex w-2 h-2 rounded-full"
            style={{ background: "#22a06b" }}
          />
        </span>
        <Phone size={10} color={C.white} strokeWidth={2.2} />
        <span
          style={{
            color: C.white,
            fontFamily: sans,
            fontSize: "8.5px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Concierge
        </span>
      </motion.div>

      {/* Caption */}
      <div
        className="absolute bottom-3 left-0 right-0 text-center"
        style={{
          color: C.grayLight,
          fontFamily: sans,
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Form submitted · Call within the day
      </div>

      <style>{`@keyframes vp-pulse { 0% { transform: scale(1); opacity: 0.7; } 70% { transform: scale(2.6); opacity: 0; } 100% { opacity: 0; } }`}</style>
    </div>
  );
}

/* ── Visual 2: 3 firms verified ── */
function VisualVerifiedFirms() {
  return (
    <div
      className="relative w-full h-[150px] mb-6 p-3 flex flex-col gap-2 justify-center"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "12px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 px-2.5 py-2"
          style={{
            background: C.cream,
            border: `1px solid ${C.creamBorder}`,
            borderRadius: "8px",
          }}
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: C.creamBorder }}
          >
            <User size={10} color={C.gray} strokeWidth={2} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div
              className="h-1.5 rounded-full"
              style={{ background: C.creamBorder, width: "60%" }}
            />
            <div
              className="h-1 rounded-full"
              style={{ background: C.creamBorder, width: "40%" }}
            />
          </div>
          <motion.div
            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#22a06b" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.4 + i * 0.35,
              repeat: Infinity,
              repeatDelay: 3.2,
              repeatType: "loop",
            }}
          >
            <Check size={9} color={C.white} strokeWidth={3} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Visual 3: Inbox with 3 matches ── */
function VisualInboxMatches() {
  return (
    <div
      className="relative w-full h-[150px] mb-6 overflow-hidden"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "12px",
      }}
    >
      {/* Inbox header */}
      <div
        className="flex items-center gap-1.5 px-3 py-2"
        style={{ borderBottom: `1px solid ${C.creamBorder}` }}
      >
        <Mail size={11} color={C.black} strokeWidth={2} />
        <span
          style={{
            color: C.black,
            fontFamily: sans,
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Inbox
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "#22a06b" }}
          />
          <span
            style={{
              color: C.grayLight,
              fontFamily: sans,
              fontSize: "8.5px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            3 new
          </span>
        </span>
      </div>

      {/* Messages */}
      <div className="px-2 pt-1.5 flex flex-col gap-1">
        {["Studio A", "Design Co.", "Atelier 3"].map((firm, i) => (
          <motion.div
            key={firm}
            className="flex items-center gap-2 px-2 py-1.5"
            style={{ borderRadius: "6px" }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + i * 0.3,
              repeat: Infinity,
              repeatDelay: 2.6,
              repeatType: "loop",
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: C.black }}
            >
              <span
                style={{
                  color: C.white,
                  fontFamily: serif,
                  fontSize: "8px",
                  fontWeight: 500,
                }}
              >
                {firm[0]}
              </span>
            </div>
            <span
              className="flex-1 truncate"
              style={{
                color: C.black,
                fontFamily: sans,
                fontSize: "9.5px",
                fontWeight: 500,
              }}
            >
              {firm}
            </span>
            <span
              style={{
                color: C.grayLight,
                fontFamily: sans,
                fontSize: "8.5px",
              }}
            >
              now
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = [VisualSubmitToCall, VisualVerifiedFirms, VisualInboxMatches];

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
            const Visual = VISUALS[i] ?? VISUALS[0];
            return (
              <FadeIn key={card.title} delay={0.1 + i * 0.05}>
                <div
                  className="h-full p-6"
                  style={{
                    background: C.cream,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: "16px",
                  }}
                >
                  <Visual />
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

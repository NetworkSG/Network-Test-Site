import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Design Tokens
   ═══════════════════════════════════════════════════════════════════════════ */

export const C = {
  cream: "#f0ede6",
  creamDark: "#e8e4db",
  creamBorder: "#d8d3c8",
  black: "#0f0f0d",
  gray: "#5a574f",
  grayLight: "#6b6860",
  white: "#fafaf8",
  footerDark: "#0f0f0d",
} as const;

export const serif = "'EB Garamond', Georgia, serif";
export const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ═══════════════════════════════════════════════════════════════════════════
   Primitives
   ═══════════════════════════════════════════════════════════════════════════ */

export function FadeIn({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  return React.createElement(motion.div, {
    ref,
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.3, delay: reduce ? 0 : delay, ease: "ease" },
    className,
    children,
  });
}

export function TagLabel({ children }: { children: React.ReactNode }) {
  return React.createElement("p", {
    style: {
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em",
      textTransform: "uppercase" as const, color: C.grayLight, fontFamily: sans,
    },
    children,
  });
}

export function SectionCTA({ label, onClick }: { label: string; onClick: () => void }) {
  return React.createElement("button", {
    onClick,
    className: "h-[52px] px-8 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer",
    style: {
      background: C.black, color: C.white, borderRadius: "12px",
      fontFamily: sans, transition: "all 0.15s",
    },
    children: label,
  });
}

export function Divider() {
  return React.createElement("div", {
    className: "max-w-[1000px] mx-auto px-6 md:px-10",
    children: React.createElement("div", {
      className: "h-[1px]",
      style: { background: C.creamBorder },
    }),
  });
}

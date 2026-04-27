import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  cream: "#f0ede6",
  creamBorder: "#d8d3c8",
  black: "#0f0f0d",
  white: "#fafaf8",
  gray: "#5a574f",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Interior Designers", href: "/interior-designers" },
  { label: "Room Designer", href: "/render-tool" },
  { label: "Layout Planner", href: "/floorplan3d" },
  { label: "Cost Guide", href: "/cost-guide" },
  { label: "Handshake", href: "/networkxhandshake" },
];

interface HomepageNavProps {
  /**
   * Click handler for the "Get matched" CTA. On the homepage this scrolls to
   * the lead form; on inner pages it falls back to navigating to /get-matched.
   */
  onCtaClick?: () => void;
  ctaLabel?: string;
}

/**
 * The single nav used across the homepage and every in-nav landing page
 * (Interior Designers, Room Designer, Layout Planner, Cost Guide). Mirrors
 * the homepage's hide-on-scroll-down behaviour. Handshake intentionally
 * does NOT use this nav — it keeps its own.
 */
export function HomepageNav({ onCtaClick, ctaLabel = "Get matched" }: HomepageNavProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY || 0;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY || 0;
        if (y < 40) setNavHidden(false);
        else if (y > lastY + 4) setNavHidden(true);
        else if (y < lastY - 4) setNavHidden(false);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleCta = () => {
    if (onCtaClick) onCtaClick();
    else window.location.href = "/get-matched";
  };

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: C.cream,
        transform: navHidden && !mobileMenuOpen ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease",
      }}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
        <a href="/" aria-label="Network — home" className="cursor-pointer shrink-0 block" style={{
          width: "110px", height: "23px", background: C.black,
          maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
          WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
        }} />
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="text-[13px] font-normal cursor-pointer hover:opacity-60"
              style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
            >{l.label}</a>
          ))}
        </div>
        {/* Desktop CTA */}
        <button onClick={handleCta}
          className="hidden md:block text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
          style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, border: "none", transition: "all 0.15s" }}
        >{ctaLabel}</button>
        {/* Mobile hamburger */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          style={{ background: "transparent", border: "none" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.5" strokeLinecap="round">
            {mobileMenuOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
            )}
          </svg>
        </button>
      </div>
      <div className="h-[1px]" style={{ background: C.creamBorder }} />
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden absolute left-0 right-0 top-full"
            style={{
              background: C.cream,
              borderBottom: `1px solid ${C.creamBorder}`,
              boxShadow: "0 8px 24px rgba(15,15,13,0.06), 0 2px 6px rgba(15,15,13,0.04)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  className="py-3 text-[15px] font-normal cursor-pointer"
                  style={{ color: C.black, fontFamily: sans }}
                >{l.label}</a>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); handleCta(); }}
                className="w-full h-[48px] mt-2 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
                style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, border: "none", transition: "all 0.15s" }}
              >{ctaLabel}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

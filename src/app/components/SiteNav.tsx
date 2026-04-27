import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Interior Designers", href: "/interior-designers" },
  { label: "Room Designer", href: "/render-tool" },
  { label: "Layout Planner", href: "/floorplan3d" },
  { label: "Cost Guide", href: "/cost-guide" },
  // { label: "Style Quiz", href: "/style-quiz" },
  // { label: "Mood Board", href: "/mood-board" },
  { label: "Handshake", href: "/networkxhandshake" },
];

export function SiteNav({ logoImg, onLogoClick }: { logoImg: string; onLogoClick?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#f0ede6]">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
        {/* Logo */}
        <button
          type="button"
          aria-label="Network — home"
          className="w-[110px] h-[23px] bg-[#2b2b2b] shrink-0 cursor-pointer border-0 p-0"
          onClick={onLogoClick || (() => { window.location.href = "/"; })}
          style={{
            maskImage: `url('${logoImg}')`,
            maskSize: "111.804px 22.909px",
            maskRepeat: "no-repeat",
            maskPosition: "0px 0px",
            WebkitMaskImage: `url('${logoImg}')`,
            WebkitMaskSize: "111.804px 22.909px",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "0px 0px",
          }}
        />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-normal cursor-pointer hover:opacity-60"
              style={{ color: "#5a574f", fontFamily: sans, transition: "all 0.15s" }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <a
          href="/"
          className="hidden md:block text-[12px] font-medium px-5 py-2.5 hover:opacity-80 no-underline"
          style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
        >
          Get matched
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="1.5" strokeLinecap="round">
            {mobileMenuOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
            )}
          </svg>
        </button>
      </div>

      <div className="h-[1px]" style={{ background: "#d8d3c8" }} />

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ background: "#f0ede6", borderBottom: "1px solid #d8d3c8" }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-3 text-[15px] font-normal cursor-pointer"
                  style={{ color: "#0f0f0d", fontFamily: sans }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/"
                className="w-full h-[48px] mt-2 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98] flex items-center justify-center no-underline"
                style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
              >
                Get matched
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

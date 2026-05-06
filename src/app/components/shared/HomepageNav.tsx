import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { HomeownerSheet } from "./HomeownerSheet";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const serif = "'EB Garamond', Georgia, serif";

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

type AuthSnapshot = { signedIn: boolean; name: string; avatar: string };

function readAuthSnapshot(): AuthSnapshot {
  const signedIn = !!(typeof window !== "undefined" && localStorage.getItem("homeowner-token"));
  let name = "";
  let avatar = "";
  try {
    const lite = localStorage.getItem("homeowner-profile-cache");
    if (lite) {
      const p = JSON.parse(lite);
      name = p.name || "";
      avatar = p.avatar || "";
    }
  } catch {}
  return { signedIn, name, avatar };
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "·";
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
  const [auth, setAuth] = useState<AuthSnapshot>(() => (typeof window === "undefined" ? { signedIn: false, name: "", avatar: "" } : readAuthSnapshot()));
  const [sheetOpen, setSheetOpen] = useState(false);

  // Keep the avatar in sync with login/logout from anywhere in the app.
  useEffect(() => {
    const sync = () => setAuth(readAuthSnapshot());
    sync();
    window.addEventListener("homeowner-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("homeowner-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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

  // Avatar trigger — minimal-footprint button that opens the side sheet.
  // Sized to match the existing CTA pill height so the right edge of the
  // nav stays visually aligned.
  const renderAvatarTrigger = () => (
    <button
      type="button"
      onClick={() => setSheetOpen(true)}
      aria-label="Open your account"
      className="hidden md:flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.04] active:scale-[0.96]"
      style={{
        width: 36, height: 36, borderRadius: 999,
        background: auth.avatar ? "transparent" : C.black,
        border: `1px solid ${C.creamBorder}`,
        overflow: "hidden",
        padding: 0,
      }}
    >
      {auth.avatar ? (
        <img src={auth.avatar} alt={auth.name || "You"} className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: C.white, fontFamily: serif, fontSize: 14, lineHeight: 1 }}>
          {initialsFor(auth.name)}
        </span>
      )}
    </button>
  );

  return (
    <>
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
        {/* Desktop right cluster — avatar (when signed in) + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {auth.signedIn && renderAvatarTrigger()}
          <button onClick={handleCta}
            className="text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
            style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, border: "none", transition: "all 0.15s" }}
          >{ctaLabel}</button>
        </div>
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
              {auth.signedIn && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setSheetOpen(true); }}
                  className="flex items-center gap-3 py-3 text-left cursor-pointer"
                  style={{ background: "transparent", border: "none", padding: "12px 0" }}
                >
                  {auth.avatar ? (
                    <img src={auth.avatar} alt={auth.name || "You"} className="size-[36px] rounded-full object-cover" />
                  ) : (
                    <span
                      className="size-[36px] rounded-full flex items-center justify-center"
                      style={{ background: C.black, color: C.white, fontFamily: serif, fontSize: 14 }}
                    >
                      {initialsFor(auth.name)}
                    </span>
                  )}
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium" style={{ color: C.black, fontFamily: sans }}>
                      {auth.name || "Your account"}
                    </span>
                    <span className="block text-[12px]" style={{ color: C.gray, fontFamily: sans }}>
                      Tap to open your dashboard
                    </span>
                  </span>
                </button>
              )}
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
    <HomeownerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

import { useState, useEffect, useRef } from "react";
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
  { label: "Explore", href: "/explore" },
  { label: "Interior Designers", href: "/interior-designers" },
  { label: "Blog", href: "/blog" },
];

// Hover-dropdown content for the Interior Designers nav link. Each item is a
// real anchor so middle-click / right-click work; the directory reads
// ?budget= / ?region= on mount and pre-applies the matching chip.
const ID_DROPDOWN_FIRMS: { label: string; href: string }[] = [
  { label: "All Designers", href: "/interior-designers" },
  { label: "Top Rated", href: "/interior-designers" },
  { label: "Recently Joined", href: "/interior-designers" },
  { label: "Verified Firms", href: "/interior-designers" },
];
const ID_DROPDOWN_BUDGETS: { label: string; href: string }[] = [
  { label: "$40,000 and under", href: "/interior-designers?budget=40" },
  { label: "$60,000 and under", href: "/interior-designers?budget=60" },
  { label: "$80,000 and under", href: "/interior-designers?budget=80" },
];
const ID_DROPDOWN_LOCATIONS: { label: string; href: string }[] = [
  { label: "North", href: "/interior-designers?region=North" },
  { label: "North-East", href: "/interior-designers?region=North-East" },
  { label: "East", href: "/interior-designers?region=East" },
  { label: "West", href: "/interior-designers?region=West" },
  { label: "Central", href: "/interior-designers?region=Central" },
];

// Hover-dropdown content for the Explore nav link. Each item is a real anchor
// linking to /explore with a query param that the page reads on mount to
// pre-apply the matching filter.
const EXPLORE_DROPDOWN_PROPERTY: { label: string; href: string }[] = [
  { label: "HDB", href: "/explore?property=HDB" },
  { label: "Condo", href: "/explore?property=Condo" },
  { label: "Landed", href: "/explore?property=Landed" },
];
const EXPLORE_DROPDOWN_STYLES: { label: string; href: string }[] = [
  { label: "Modern", href: "/explore?style=Modern" },
  { label: "Minimalist", href: "/explore?style=Minimalist" },
  { label: "Scandinavian", href: "/explore?style=Scandinavian" },
  { label: "Industrial", href: "/explore?style=Industrial" },
  { label: "Japandi", href: "/explore?style=Japandi" },
  { label: "Contemporary", href: "/explore?style=Contemporary" },
];

/**
 * Hover-anchored container that wraps the "Interior Designers" nav link and
 * reveals a 2-column filter panel on hover. Uses a small close-delay so the
 * cursor can travel from the link onto the panel without it disappearing.
 */
function InteriorDesignersDropdown() {
  const [open, setOpen] = useState(false);
  // Keep the close timer on a ref so a rapid re-enter cancels the pending close.
  const closeTimerRef = useRef<number | null>(null);
  const handleEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };
  const handleLeave = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  const columnHeaderStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#9a9790",
    fontFamily: sans,
    marginBottom: 12,
  };

  const linkStyle: React.CSSProperties = {
    color: C.black,
    fontFamily: sans,
    fontSize: 13,
    lineHeight: 1.4,
    transition: "opacity 0.15s",
  };

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ position: "static" }}>
      <a
        href="/interior-designers"
        className="text-[15px] font-normal cursor-pointer hover:opacity-60"
        style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Interior Designers
      </a>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="menu"
            className="absolute left-0 right-0 top-full"
            style={{
              background: C.cream,
              borderTop: `1px solid ${C.creamBorder}`,
              borderBottom: `1px solid ${C.creamBorder}`,
              boxShadow: "0 12px 32px rgba(15,15,13,0.08), 0 2px 6px rgba(15,15,13,0.04)",
              fontFamily: sans,
            }}
          >
            {/* Invisible bridge so the cursor can travel from the link
                onto the panel without crossing a gap. */}
            <div style={{ position: "absolute", left: 0, right: 0, top: -8, height: 8 }} />
            <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-14 flex items-start justify-center gap-12">
              <div>
                <p style={columnHeaderStyle}>By Firms</p>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {ID_DROPDOWN_FIRMS.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} className="block cursor-pointer hover:opacity-60" style={linkStyle}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={columnHeaderStyle}>By Budget (S$)</p>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {ID_DROPDOWN_BUDGETS.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="block cursor-pointer hover:opacity-60" style={linkStyle}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={columnHeaderStyle}>By Location</p>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {ID_DROPDOWN_LOCATIONS.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="block cursor-pointer hover:opacity-60" style={linkStyle}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-4" style={{ borderLeft: `1px solid ${C.creamBorder}`, paddingLeft: 32, width: 280 }}>
                <a
                  href="/"
                  className="block cursor-pointer hover:opacity-90"
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    transition: "opacity 0.15s",
                  }}
                >
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.black, margin: 0, marginBottom: 4 }}>
                    Get matched
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: C.gray, margin: 0, lineHeight: 1.4 }}>
                    Tell us your needs and we'll pair you with the right designer.
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: C.black, margin: 0, marginTop: 8, fontWeight: 500 }}>
                    Start now ›
                  </p>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hover dropdown for the "Explore" nav link, mirroring the Interior Designers
 * panel — three filter columns plus the "Get matched" side card.
 */
function ExploreDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const handleEnter = () => {
    if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    setOpen(true);
  };
  const handleLeave = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => { if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); }, []);

  const columnHeaderStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#9a9790", fontFamily: sans, marginBottom: 12,
  };
  const linkStyle: React.CSSProperties = {
    color: C.black, fontFamily: sans, fontSize: 13, lineHeight: 1.4, transition: "opacity 0.15s",
  };

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ position: "static" }}>
      <a href="/explore"
        className="text-[15px] font-normal cursor-pointer hover:opacity-60"
        style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
        aria-haspopup="menu" aria-expanded={open}>
        Explore
      </a>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }} role="menu"
            className="absolute left-0 right-0 top-full"
            style={{
              background: C.cream,
              borderTop: `1px solid ${C.creamBorder}`,
              borderBottom: `1px solid ${C.creamBorder}`,
              boxShadow: "0 12px 32px rgba(15,15,13,0.08), 0 2px 6px rgba(15,15,13,0.04)",
              fontFamily: sans,
            }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: -8, height: 8 }} />
            <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-14 flex items-start justify-center gap-12">
              <div>
                <p style={columnHeaderStyle}>By Property Type</p>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {EXPLORE_DROPDOWN_PROPERTY.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="block cursor-pointer hover:opacity-60" style={linkStyle}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={columnHeaderStyle}>By Style</p>
                <ul className="flex flex-col gap-3 m-0 p-0 list-none">
                  {EXPLORE_DROPDOWN_STYLES.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="block cursor-pointer hover:opacity-60" style={linkStyle}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-4" style={{ borderLeft: `1px solid ${C.creamBorder}`, paddingLeft: 32, width: 280 }}>
                <a href="/cost-guide" className="block cursor-pointer hover:opacity-90"
                  style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 12, padding: "14px 16px", transition: "opacity 0.15s" }}>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.black, margin: 0, marginBottom: 4 }}>Cost guide</p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: C.gray, margin: 0, lineHeight: 1.4 }}>
                    See realistic renovation costs by property type, scope, and finish in Singapore.
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: C.black, margin: 0, marginTop: 8, fontWeight: 500 }}>View guide ›</p>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    {/* Sticky header stack — top utility bar + main nav slide together
        when the user scrolls up/down so the contact details and primary
        links share the same hide-on-scroll behaviour. */}
    <div
      className="sticky top-0 z-50"
      style={{
        transform: navHidden && !mobileMenuOpen ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease",
      }}
    >
    {/* Top utility bar — social icons (left) + contact details (right).
        Hidden on mobile where the information is moved into the
        hamburger menu instead. */}
    <div
      className="hidden md:block"
      style={{
        background: C.black,
        color: C.white,
        fontFamily: sans,
      }}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[44px] px-6 md:px-10 text-[13px]">
        <div className="flex items-center gap-5">
          <a
            href="https://www.instagram.com/networksingapore/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Network on Instagram"
            className="hover:opacity-70 transition-opacity"
            style={{ color: C.white }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/networksingapore/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Network on Facebook"
            className="hover:opacity-70 transition-opacity"
            style={{ color: C.white }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
            </svg>
          </a>
        </div>
        <div className="flex items-center gap-5">
          <a href="/render-tool" className="hover:opacity-70 transition-opacity" style={{ color: C.white }}>
            Room Designer
          </a>
          <a href="/floorplan3d" className="hover:opacity-70 transition-opacity" style={{ color: C.white }}>
            Layout Planner
          </a>
          <a href="/cost-guide" className="hover:opacity-70 transition-opacity" style={{ color: C.white }}>
            Cost Guide
          </a>
          <a href="/networkxhandshake" className="hover:opacity-70 transition-opacity" style={{ color: C.white }}>
            Protect Your Renovation
          </a>
          <button
            type="button"
            onClick={() => {
              // Signed-in users get the account drawer; signed-out users
              // go to /profile which renders the login / signup screen.
              if (auth.signedIn) setSheetOpen(true);
              else window.location.href = "/profile";
            }}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
            style={{ background: "transparent", border: "none", color: C.white, fontFamily: sans, fontSize: 13, padding: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {auth.signedIn ? (auth.name || "Account") : "Log in / Sign up"}
          </button>
        </div>
      </div>
    </div>
    <nav
      style={{
        background: C.cream,
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
          {NAV_LINKS.map((l) =>
            l.label === "Interior Designers" ? (
              <InteriorDesignersDropdown key={l.href} />
            ) : l.label === "Explore" ? (
              <ExploreDropdown key={l.href} />
            ) : (
              <a key={l.href} href={l.href}
                className="text-[15px] font-normal cursor-pointer hover:opacity-60"
                style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
              >{l.label}</a>
            )
          )}
        </div>
        {/* Desktop right cluster — CTA only.
            The signed-in avatar lives in the top utility bar already
            (rendered by Navbar), so we don't duplicate it here.
            Mobile keeps its own avatar inside the hamburger menu below
            since mobile doesn't show the utility bar. */}
        <div className="hidden md:flex items-center gap-3">
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

              {/* Utility links — mirror the desktop top utility bar
                  inside the mobile menu since mobile doesn't show that
                  bar. Same links, same order. */}
              <div className="h-px my-2" style={{ background: C.creamBorder }} />
              <a
                href="/render-tool"
                className="py-3 text-[15px] font-normal cursor-pointer"
                style={{ color: C.black, fontFamily: sans }}
              >Room Designer</a>
              <a
                href="/floorplan3d"
                className="py-3 text-[15px] font-normal cursor-pointer"
                style={{ color: C.black, fontFamily: sans }}
              >Layout Planner</a>
              <a
                href="/cost-guide"
                className="py-3 text-[15px] font-normal cursor-pointer"
                style={{ color: C.black, fontFamily: sans }}
              >Cost Guide</a>
              <a
                href="/networkxhandshake"
                className="py-3 text-[15px] font-normal cursor-pointer"
                style={{ color: C.black, fontFamily: sans }}
              >Protect Your Renovation</a>

              {!auth.signedIn && (
                <>
                  <div className="h-px my-2" style={{ background: C.creamBorder }} />
                  <a
                    href="/profile"
                    className="py-3 text-[15px] font-normal cursor-pointer flex items-center gap-2"
                    style={{ color: C.black, fontFamily: sans }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Log in / Sign up
                  </a>
                </>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); handleCta(); }}
                className="w-full h-[48px] mt-3 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
                style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, border: "none", transition: "all 0.15s" }}
              >{ctaLabel}</button>

              {/* Social icons row — also mirrors the left side of the
                  top utility bar so mobile users can reach IG / FB
                  without scrolling to the footer. */}
              <div className="flex items-center justify-center gap-6 pt-5 pb-1">
                <a
                  href="https://www.instagram.com/networksingapore/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Network on Instagram"
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: C.black }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/networksingapore/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Network on Facebook"
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: C.black }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </div>
    <HomeownerSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

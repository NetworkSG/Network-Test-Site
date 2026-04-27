import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { FOOTER } from "../homepage/content";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  black: "#0f0f0d",
  gray: "#5a574f",
  creamBorder: "#d8d3c8",
};

/**
 * The single footer used across the homepage and every in-nav landing page
 * (Interior Designers, Room Designer, Layout Planner, Cost Guide). Mirrors
 * the homepage exactly — logo + nav + socials + privacy + copyright.
 */
export function HomepageFooter() {
  return (
    <footer className="px-6 md:px-10 py-10 md:py-14">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 md:gap-6">
          <div className="flex flex-col gap-4 md:gap-0">
            <a href="/" aria-label="Network — home" className="block shrink-0" style={{
              width: "110px", height: "23px", background: C.black,
              maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
              WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
            }} />
            {/* Mobile-only: socials + privacy under logo */}
            <div className="flex md:hidden items-center justify-between">
              <div className="flex items-center gap-2 -ml-1.5">
                <a href="https://www.facebook.com/networksingapore/" target="_blank" rel="noopener noreferrer" aria-label="Network on Facebook"
                  className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                  style={{ color: C.gray, transition: "all 0.15s" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21.95V13.5h2.85l.43-3.32H13.5V8.06c0-.96.27-1.62 1.65-1.62h1.76V3.47a23.6 23.6 0 0 0-2.57-.13c-2.55 0-4.29 1.55-4.29 4.4v2.45H7.18v3.31h2.87v8.45z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/networksingapore/" target="_blank" rel="noopener noreferrer" aria-label="Network on Instagram"
                  className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                  style={{ color: C.gray, transition: "all 0.15s" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>
              <a href="/privacy-policy"
                className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 flex-wrap">
            {FOOTER.links
              .filter((link) => link.label !== "Privacy Policy")
              .map((link) => (
                <a key={link.label} href={link.href}
                  className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                  style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
                >{link.label}</a>
              ))}
          </div>
        </div>

        <div className="h-px my-6 md:my-8" style={{ background: C.creamBorder }} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="text-[12px] font-normal" style={{ color: C.gray, fontFamily: sans }}>
            {FOOTER.copyright}
          </span>
          <div className="hidden md:flex items-center gap-5">
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com/networksingapore/" target="_blank" rel="noopener noreferrer" aria-label="Network on Facebook"
                className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                style={{ color: C.gray, transition: "all 0.15s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21.95V13.5h2.85l.43-3.32H13.5V8.06c0-.96.27-1.62 1.65-1.62h1.76V3.47a23.6 23.6 0 0 0-2.57-.13c-2.55 0-4.29 1.55-4.29 4.4v2.45H7.18v3.31h2.87v8.45z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/networksingapore/" target="_blank" rel="noopener noreferrer" aria-label="Network on Instagram"
                className="inline-flex items-center justify-center w-8 h-8 hover:opacity-60 cursor-pointer"
                style={{ color: C.gray, transition: "all 0.15s" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
            <a href="/privacy-policy"
              className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
              style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

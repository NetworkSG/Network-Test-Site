import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png"

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const serif = "'EB Garamond', Georgia, serif"

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Room Designer", href: "/render-tool" },
  { label: "Layout Planner", href: "/floorplan3d" },
  { label: "Cost Guide", href: "/cost-guide" },
  // { label: "Style Quiz", href: "/style-quiz" },
  // { label: "Mood Board", href: "/mood-board" },
  { label: "Handshake", href: "/networkxhandshake" },
]

interface SiteFooterProps {
  ctaLabel?: string
  ctaHeadline?: string
  ctaDescription?: string
  ctaButtonLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
}

export function SiteFooter({
  ctaLabel = "Get started",
  ctaHeadline = "Ready to bring your style to life?",
  ctaDescription = "We'll match you with vetted interior designers who fit your style, budget, and timeline. Free, no obligations.",
  ctaButtonLabel = "Get Matched",
  ctaHref = "/get-matched",
  onCtaClick,
}: SiteFooterProps) {
  return (
    <>
      {/* CTA Banner */}
      <section className="px-6 md:px-10 pb-10">
        <div className="max-w-[1280px] mx-auto">
          <div
            className="px-8 py-16 md:px-16 md:py-20 text-center"
            style={{ background: "#0f0f0d", borderRadius: 12 }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#9a9790",
                fontFamily: sans,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{ctaLabel}</span>
            </p>
            <h2
              className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1] mt-6 mb-5"
              style={{ fontFamily: serif, color: "#ffffff" }}
            >
              {ctaHeadline}
            </h2>
            <p
              className="text-[14px] font-normal leading-[1.7] max-w-[480px] mx-auto mb-10"
              style={{ color: "rgba(255,255,255,0.55)", fontFamily: sans }}
            >
              {ctaDescription}
            </p>
            {onCtaClick ? (
              <button
                onClick={onCtaClick}
                className="h-[60px] px-9 text-[16px] font-normal hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{
                  background: "#ffffff",
                  color: "#0f0f0d",
                  borderRadius: 12,
                  fontFamily: sans,
                  transition: "all 0.15s",
                }}
              >
                {ctaButtonLabel}
              </button>
            ) : (
              <a
                href={ctaHref}
                className="inline-flex items-center justify-center h-[60px] px-9 text-[16px] font-normal hover:opacity-90 active:scale-[0.98] cursor-pointer no-underline"
                style={{
                  background: "#ffffff",
                  color: "#0f0f0d",
                  borderRadius: 12,
                  fontFamily: sans,
                  transition: "all 0.15s",
                }}
              >
                {ctaButtonLabel}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Slim Footer */}
      <footer className="px-6 md:px-10 py-10 md:py-14">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <a
                href="/"
                className="block shrink-0"
                style={{
                  width: 110,
                  height: 23,
                  background: "#0f0f0d",
                  maskImage: `url('${imgRectangle1}')`,
                  maskSize: "111.804px 22.909px",
                  maskRepeat: "no-repeat",
                  maskPosition: "0px 0px",
                  WebkitMaskImage: `url('${imgRectangle1}')`,
                  WebkitMaskSize: "111.804px 22.909px",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "0px 0px",
                }}
              />
              <div className="flex items-center gap-6 flex-wrap">
                {FOOTER_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                    style={{ color: "#9a9790", fontFamily: sans, transition: "all 0.15s" }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <span
              className="text-[12px] font-normal"
              style={{ color: "#9a9790", fontFamily: sans }}
            >
              Copyright &copy; 2026. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}

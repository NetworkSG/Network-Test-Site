import { C, FadeIn, TagLabel } from "../primitives";
import { Link } from "react-router";

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const tools = [
  {
    title: "3D Preview Tool",
    description: "Upload a photo of your space and see it transformed with AI in minutes. Test different styles before committing to any designer.",
    bullets: ["Realistic 3D visualizations", "Multiple style options", "Results in 5 minutes"],
    cta: "Create My Render",
    href: "/render-tool",
    time: "5 minutes • Free signup",
    image: "/inter2.webp",
  },
  {
    title: "Renovation Cost Guide",
    description: "Get an instant breakdown of what your budget can realistically achieve based on your home type, scope, and finishes.",
    bullets: ["Itemized cost estimates", "Budget by room breakdown", "Compare quality tiers"],
    cta: "Calculate My Budget",
    href: "/cost-guide",
    time: "2 minutes • Free signup",
    image: "/new interor 2.webp",
  },
  {
    title: "Layout Planner",
    description: "Upload any floor plan and convert it to 3D. Stage furniture, test layouts, and plan your renovation visually.",
    bullets: ["2D to 3D conversion", "Drag & drop furniture", "Free to use"],
    cta: "Plan My Layout",
    href: "/floorplan3d",
    time: "10 minutes • Free signup",
    image: "/DSC09723.webp",
  },
  {
    title: "Handshake Escrow",
    description: "Protect your renovation payments with MAS-regulated escrow. Funds held with DBS, released only when you approve.",
    bullets: ["MAS-regulated protection", "Funds held with DBS", "Free for homeowners"],
    cta: "Protect My Payments",
    href: "/networkxhandshake",
    time: "3 minutes • Free signup",
    image: "/r6.webp",
  },
];

function ArrowIcon() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 9">
      <path d="M0 4.36h16.18l-3.54-3.54L13.36 0 18 4.36 13.36 8.72l-.72-.82 3.54-3.54H0z" fill="black" />
    </svg>
  );
}

export function FreeTools() {
  return (
    <section className="px-6 md:px-10 py-[72px] md:py-[100px]" style={{ background: C.cream }}>
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>Free tools</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="font-normal leading-[1.15] max-w-[700px] mx-auto" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
            Start Planning <span style={{ color: C.gray }}>Before You Commit</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-14">
          <p className="text-[15px] font-normal leading-[1.75] max-w-[560px] mx-auto" style={{ color: C.gray, fontFamily: sans }}>
            Not ready to meet designers yet? Use our free tools to understand your budget and visualize your space first — at your own pace.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, i) => (
            <FadeIn key={tool.title} delay={i * 0.08}>
              <div className="relative group cursor-pointer isolate" style={{ minHeight: 520 }}>
                {/* Ambient glow on hover */}
                <div className="absolute -inset-[40px] z-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none hidden md:block">
                  <img src={tool.image} alt="" className="size-full object-cover blur-[60px] scale-110 saturate-150 brightness-110" loading="lazy" />
                </div>

                <div className="relative z-10 size-full bg-[#09090b] overflow-hidden" style={{ borderRadius: 20 }}>
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <img
                      alt=""
                      className="size-full object-cover scale-125 opacity-65 transition-transform duration-700 group-hover:scale-[1.35]"
                      src={tool.image}
                      loading="lazy"
                    />
                    {/* Subtle darken overlay */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-opacity duration-500" />
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Content */}
                  <div className="relative p-6 md:p-10 flex flex-col h-full justify-between" style={{ minHeight: 520 }}>
                    <div>
                      <h3
                        className="text-[24px] md:text-[28px] font-semibold text-white tracking-[-1px] max-w-[340px] mb-4"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                      >
                        {tool.title}
                      </h3>
                      <p className="text-[14px] md:text-[15px] text-white/90 leading-relaxed mb-5 max-w-[380px]" style={{ fontFamily: sans }}>
                        {tool.description}
                      </p>
                      {/* Bullets — reveal on hover (desktop) */}
                      <div className="flex flex-col gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
                        {tool.bullets.map((b) => (
                          <div key={b} className="flex items-center gap-2">
                            <span className="text-[#d4a843]">✓</span>
                            <span className="font-semibold text-[14px] md:text-[15px] text-white" style={{ fontFamily: sans }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-3 mt-6">
                      <Link
                        to={tool.href}
                        className="h-[52px] px-8 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 no-underline w-full md:w-auto"
                        style={{ background: C.white, color: C.black, borderRadius: 12, fontFamily: sans, transition: "all 0.15s" }}
                      >
                        {tool.cta}
                        <ArrowIcon />
                      </Link>
                      <p className="text-[13px] md:text-[14px] text-white/40" style={{ fontFamily: sans }}>
                        {tool.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

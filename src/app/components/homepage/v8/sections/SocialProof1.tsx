import { C, serif, sans, FadeIn, TagLabel, SectionCTA } from "../primitives";
import { TRUST_STATS, SOCIAL_PROOF } from "../../content";
import photo1 from "figma:asset/607f6408c4c8fd9005fe7498e2284a7b2995acda.png";
import photo2 from "figma:asset/561c829472a0cac14a59bfb33e444dc4e0ed8350.png";
import photo3 from "figma:asset/bc9ffe9973654a94a381c863292fc3780b81397b.png";

const photos = [photo1, photo2, photo3];

export function SocialProof1({ scrollToForm }: { scrollToForm: () => void }) {
  return (
    <>
      {/* Trust Stats Bar */}
      <section className="mt-10 md:mt-0" style={{ background: C.creamDark }}>
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: `1px solid ${C.creamBorder}` }}>
            {TRUST_STATS.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="py-6 md:py-10 px-5 md:px-8 group/stat cursor-default"
                  style={{ borderRight: `1px solid ${C.creamBorder}`, transition: "background 0.3s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cream; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div className="text-[32px] md:text-[64px] font-normal leading-[1] group-hover/stat:scale-110 origin-left" style={{ fontFamily: serif, color: C.black, transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>{stat.value}</div>
                  <p className="text-[11px] md:text-[13px] font-normal mt-1.5 md:mt-2 group-hover/stat:translate-x-1" style={{ color: C.grayLight, fontFamily: sans, transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Cards */}
      <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ overflow: "visible" }}>
        <div className="max-w-[1280px] mx-auto">
          <FadeIn className="mb-10">
            <TagLabel>{SOCIAL_PROOF.label}</TagLabel>
          </FadeIn>
          <FadeIn delay={0.05} className="mb-14">
            <h2 className="font-normal leading-[1.15] max-w-[700px]" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.5vw, 52px)", letterSpacing: "-0.01em" }}>
              Real homes. Real matches. <span style={{ color: C.gray }}>Real results.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]" style={{ overflow: "visible" }}>
            {SOCIAL_PROOF.projects.map((project, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <div className="group cursor-pointer h-full" style={{ position: "relative", zIndex: 0 }}>
                  <div className="absolute opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
                    style={{ inset: "-20px", filter: "blur(32px) saturate(1.5) brightness(1.1)", borderRadius: "28px", zIndex: -1 }}>
                    <img src={photos[i]} alt="" className="w-full h-full object-cover" style={{ borderRadius: "28px" }} />
                  </div>
                  <div className="relative h-[480px] md:h-[520px] overflow-hidden" style={{ borderRadius: "12px", zIndex: 1 }}>
                    <img src={photos[i]} alt={project.propertyTag}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)", borderRadius: "12px" }} />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7">
                      <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: sans, marginBottom: "12px" }}>{project.propertyTag}</p>
                      <p className="text-[17px] md:text-[20px] font-normal leading-[1.35] mb-4" style={{ fontFamily: serif, color: "#fff" }}>
                        {project.reviewQuote}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <svg key={j} width="12" height="12" viewBox="0 0 14 14" fill="#FACC15"><path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.17l-3.52 1.68.67-3.93L1.3 5.14l3.94-.57L7 1z" /></svg>
                          ))}
                        </div>
                        <span className="text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.6)", fontFamily: sans }}>Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.15} className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[15px] font-normal leading-[1.75] max-w-[480px]" style={{ color: C.gray, fontFamily: sans }}>
              {SOCIAL_PROOF.anchorLine}
            </p>
            <SectionCTA label="Get My Free Matches" onClick={scrollToForm} />
          </FadeIn>
        </div>
      </section>
    </>
  );
}

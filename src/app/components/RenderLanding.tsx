import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, useInView } from "motion/react";
import { ReactLenis } from "lenis/react";
import { SiteNav } from "./SiteNav";
import imgNetworkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import imgBefore from "figma:asset/c280f9f6aaab4ae8bddb90591c886526cb64a9c8.png";
import imgAfter from "figma:asset/f07ac02def74d08b83946b312fd388bd8374c28c.png";
import { LeadModal } from "./render/LeadModal";

// ─── Animation helper ────────────────────────────────────────────
function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Before/After slider ─────────────────────────────────────────
function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };
    const handleUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-[16px] overflow-hidden cursor-col-resize select-none shadow-[0px_25px_50px_rgba(0,0,0,0.12)]"
      onMouseDown={(e) => {
        isDragging.current = true;
        updatePosition(e.clientX);
      }}
      onTouchStart={(e) => {
        isDragging.current = true;
        updatePosition(e.touches[0].clientX);
      }}
    >
      <img
        src={imgAfter}
        alt="After — 3D Render"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        <img
          src={imgBefore}
          alt="Before — Wireframe"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white/90 pointer-events-none z-10"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
      />
      <div
        className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px] bg-white rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.25)] flex items-center justify-center pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0f0f0d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l6-6-6-6" />
          <path d="M9 6l-6 6 6 6" />
        </svg>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full pointer-events-none z-10">
        <span className="font-['DM_Sans',sans-serif] font-medium text-[11px]">
          After
        </span>
      </div>
      <div
        className="absolute bottom-4 bg-white/90 backdrop-blur-sm text-[#0f0f0d] px-3 py-1 rounded-full pointer-events-none z-10"
        style={{ left: `calc(${sliderPos}% - 60px)` }}
      >
        <span className="font-['DM_Sans',sans-serif] font-medium text-[11px]">
          Before
        </span>
      </div>
    </div>
  );
}

// ─── Main landing page ──────────────────────────────────────────
export function RenderLanding() {
  const navigate = useNavigate();
  const [leadOpen, setLeadOpen] = useState(false);

  const openLeadForm = () => setLeadOpen(true);

  return (
    <>
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div
        className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif] relative overflow-x-clip"
        style={{ color: "#0f0f0d" }}
      >
        <SiteNav logoImg={imgNetworkLogo} onLogoClick={() => navigate("/")} />

        {/* ── HERO ──────────────────────────────────────── */}
        <section className="relative pt-24 md:pt-32 pb-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fafaf8] border border-[#d8d3c8] mb-6">
                  <span className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
                  <span className="text-[12px] text-[#6b6860] font-medium">
                    AI-powered interior renders
                  </span>
                </div>
                <h1
                  className="font-normal leading-[1.02]"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    fontSize: "clamp(44px, 6vw, 76px)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  See your dream home
                  <br />
                  <span className="italic text-[#9a9790]">before you build it.</span>
                </h1>
                <p className="mt-6 text-[16px] md:text-[17px] text-[#6b6860] leading-[1.6] max-w-[520px]">
                  Upload your floor plan or reference photo, describe the look
                  you want, and get a photorealistic 3D render in about a minute.
                  No subscriptions, no credit card — five free renders a day.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={openLeadForm}
                    className="h-[56px] px-8 rounded-[14px] bg-[#0f0f0d] text-white text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
                  >
                    Render my space
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  {/* Browse designers button — hidden for now */}
                </div>
                <p className="mt-6 text-[12px] text-[#9a9790] leading-[1.5]">
                  5 renders per day · Interior design scenes only · Your prompts
                  stay private
                </p>
              </FadeIn>

              <FadeIn delay={0.15}>
                <BeforeAfterSlider />
                <p className="mt-4 text-[12px] text-[#9a9790] text-center">
                  Drag the slider to compare — wireframe vs. AI render
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <section className="py-20 md:py-24 bg-white border-y border-[#e5e1d6]">
          <div className="max-w-[1200px] mx-auto px-6">
            <FadeIn className="text-center mb-14">
              <p className="text-[12px] text-[#6b6860] uppercase tracking-wider font-medium mb-3">
                How it works
              </p>
              <h2
                className="font-normal leading-[1.05]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  letterSpacing: "-0.025em",
                }}
              >
                Three steps to a photorealistic render.
              </h2>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  n: "01",
                  t: "Upload your reference",
                  d: "Floor plan, moodboard, or any room photo. JPG, PNG, or WebP up to 20MB.",
                },
                {
                  n: "02",
                  t: "Describe your interior",
                  d: "Tell us the style, materials, and mood. Our prompt filter keeps it design-focused.",
                },
                {
                  n: "03",
                  t: "Render and refine",
                  d: "Get your first render in ~60 seconds. Refine with follow-up prompts until it's right.",
                },
              ].map((step, i) => (
                <FadeIn key={step.n} delay={i * 0.1}>
                  <div className="h-full p-7 rounded-[16px] bg-[#fafaf8] border border-[#e5e1d6]">
                    <div
                      className="text-[56px] text-[#d8d3c8] leading-[0.9] mb-4"
                      style={{
                        fontFamily: "'EB Garamond', Georgia, serif",
                        fontWeight: 400,
                      }}
                    >
                      {step.n}
                    </div>
                    <h3
                      className="text-[22px] text-[#0f0f0d] font-normal leading-[1.2] mb-3"
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                    >
                      {step.t}
                    </h3>
                    <p className="text-[14px] text-[#6b6860] leading-[1.6]">
                      {step.d}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY US ────────────────────────────────────── */}
        <section className="py-20 md:py-24 bg-white border-y border-[#e5e1d6]">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <FadeIn>
              <p className="text-[12px] text-[#6b6860] uppercase tracking-wider font-medium mb-3">
                Renders that go somewhere
              </p>
              <h2
                className="font-normal leading-[1.05]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  letterSpacing: "-0.025em",
                }}
              >
                AI renders are a great start.
                <br />
                <span className="italic text-[#9a9790]">
                  Humans finish them.
                </span>
              </h2>
              <p className="mt-6 text-[16px] text-[#6b6860] leading-[1.65] max-w-[640px] mx-auto">
                When you're ready, we'll match you with a NETWORK-verified
                interior designer who can turn your render into a real-world
                plan — with accurate materials, costs, and timelines.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-8 h-[52px] px-7 rounded-[12px] border border-[#0f0f0d] bg-white text-[14px] font-medium text-[#0f0f0d] hover:bg-[#f5f1e8] transition"
              >
                Get matched with a designer
              </button>
            </FadeIn>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section className="py-20 md:py-24">
          <div className="max-w-[760px] mx-auto px-6">
            <FadeIn className="text-center mb-12">
              <p className="text-[12px] text-[#6b6860] uppercase tracking-wider font-medium mb-3">
                FAQ
              </p>
              <h2
                className="font-normal leading-[1.05]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  letterSpacing: "-0.025em",
                }}
              >
                Before you render.
              </h2>
            </FadeIn>
            <div className="space-y-3">
              {[
                {
                  q: "How many renders do I get?",
                  a: "Five per day, per browser. Adjustments count as new renders. The quota resets at midnight SGT.",
                },
                {
                  q: "What kinds of prompts are allowed?",
                  a: "Interior design and architectural scenes only — rooms, styles, materials, lighting, furniture. Off-topic, explicit, or violent prompts are rejected automatically.",
                },
                {
                  q: "Why is there a watermark?",
                  a: "Every render you see is a NETWORK AI preview. Watermarks are baked into the image and can't be removed. Unmarked renders are only released to designers we match you with.",
                },
                {
                  q: "Will I be charged for anything?",
                  a: "No. The render tool is free. We make money when you hire a designer through NETWORK — not from your renders.",
                },
                {
                  q: "How accurate are the renders?",
                  a: "The AI is great for mood and direction, but not for structural accuracy. When you like a render, send it to a designer and we'll turn it into something you can actually build.",
                },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <details className="group bg-[#fafaf8] border border-[#e5e1d6] rounded-[12px] p-5 open:bg-white transition">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="text-[15px] text-[#0f0f0d] font-medium leading-[1.4]">
                        {item.q}
                      </span>
                      <svg
                        className="shrink-0 transition-transform group-open:rotate-180"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b6860"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-[13px] text-[#6b6860] leading-[1.65]">
                      {item.a}
                    </p>
                  </details>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ───────────────────────────────── */}
        <section className="py-20 md:py-24 bg-[#0f0f0d] text-white">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <FadeIn>
              <h2
                className="font-normal leading-[1.05]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(36px, 5vw, 60px)",
                  letterSpacing: "-0.025em",
                }}
              >
                Love your render?
                <br />
                <span className="italic text-[#9a9790]">
                  Talk to a designer.
                </span>
              </h2>
              <p className="mt-6 text-[15px] text-white/70 leading-[1.6] max-w-[600px] mx-auto">
                A NETWORK designer will WhatsApp you within the day with
                real-world feedback on what's buildable, what it'll cost, and
                what to do next.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={openLeadForm}
                  className="h-[52px] px-7 rounded-[12px] bg-white text-[#0f0f0d] text-[14px] font-medium hover:bg-[#f5f1e8] transition"
                >
                  Render my space
                </button>
                {/* Browse designers button — hidden for now */}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────── */}
        <footer className="bg-[#f0ede6] py-12 border-t border-[#e5e1d6]">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <p className="text-[12px] text-[#9a9790]">
              © {new Date().getFullYear()} NETWORK · All AI renders are
              NETWORK previews and are watermarked.
            </p>
          </div>
        </footer>
      </div>
    </ReactLenis>

    {/* Lead gate modal — rendered OUTSIDE ReactLenis + overflow-x-clip container */}
    <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
  </>
  );
}

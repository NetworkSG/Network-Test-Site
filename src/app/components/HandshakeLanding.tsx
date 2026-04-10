import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "motion/react";
import { supabase } from "./supabaseClient";
import { sendToZapier } from "@/app/utils/zapier";
import imgNetworkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
const imgHandshakeLogo = "/handshake-logo.webp";
import { ReactLenis } from "lenis/react";
import {
  Shield, CreditCard, Eye, MessageSquare, Check,
  AlertTriangle, Ban, MessagesSquare, Lightbulb, ArrowRight,
  Lock, DollarSign, Smartphone, Headphones, ChevronDown, X,
  Loader2, ExternalLink, Zap, BarChart3, Clock, Users,
  CheckCircle2, ArrowUpRight, Phone, Mail, MessageCircle,
  TrendingUp, Award, Star, Plus
} from "lucide-react";
import { Toaster, toast } from "sonner";

// ─── ANIMATION HELPERS ───────────────────────────────────────────
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, className = "", delay = 0, from = "left" }: { children: React.ReactNode; className?: string; delay?: number; from?: "left" | "right" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: from === "left" ? -40 : 40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SECTION LABEL (pill with icon) ─────────────────
function SectionLabel({ text, dark, icon: Icon, color = "#22C55E" }: { text: string; dark?: boolean; icon?: React.ComponentType<any>; color?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium tracking-[-0.2px] border rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
      dark ? "text-white/70 border-white/10 bg-white/[0.06]" : "text-[#6b6860] border-[#d8d3c8] bg-[#fafaf8]"
    }`}>
      {Icon ? <Icon size={14} style={{ color }} fill={color} strokeWidth={0} /> : <span className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: color }} />}
      {text}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export function HandshakeLanding() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif] relative overflow-x-clip">
        <Toaster position="top-center" richColors />
        <HandshakeNavbar />
        <HeroSection />
        <SocialProofMetrics />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FAQSection />
        <LeadCaptureForm />
      </div>
    </ReactLenis>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HANDSHAKE NAVBAR — Co-branded nav with NETWORK × Handshake
// ═══════════════════════════════════════════════════════════════════
function HandshakeLogo() {
  return (
    <img src={imgHandshakeLogo} alt="Handshake" className="h-[32px] w-auto shrink-0" />
  );
}

function HandshakeNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "#f0ede6" }}>
      <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
        {/* Logo: NETWORK × handshake */}
        <div className="flex items-center gap-2.5">
          <a href="/" className="cursor-pointer shrink-0 block w-[95px] h-[20px] bg-[#0f0f0d]"
            style={{
              maskImage: `url('${imgNetworkLogo}')`,
              maskSize: "95px 20px",
              maskRepeat: "no-repeat",
              maskPosition: "0px 0px",
              WebkitMaskImage: `url('${imgNetworkLogo}')`,
              WebkitMaskSize: "95px 20px",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "0px 0px",
            }}
          ></a>
          <span className="text-[12px] text-[#9a9790] font-light select-none">&times;</span>
          <img src={imgHandshakeLogo} alt="Handshake" className="h-[22px] w-auto shrink-0" />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Home</a>
          <a href="/render-tool" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>3D Render</a>
          <a href="/floorplan3d" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Floor Layout Planner</a>
          <a href="/cost-guide" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Cost Guide</a>
          {/* <a href="/style-quiz" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Style Quiz</a> */}
          {/* <a href="/mood-board" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Mood Board</a> */}
          <a href="/networkxhandshake" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Handshake</a>
        </div>

        {/* Desktop CTA */}
        <a href="#get-started"
          className="hidden md:block text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
          style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
          Protect My Payments
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
              <a href="/" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Home</a>
              <a href="/render-tool" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>3D Render</a>
              <a href="/floorplan3d" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Floor Layout Planner</a>
              <a href="/cost-guide" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Cost Guide</a>
              {/* <a href="/style-quiz" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Style Quiz</a> */}
              {/* <a href="/mood-board" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Mood Board</a> */}
              <a href="/networkxhandshake" className="py-3 text-[15px] font-normal cursor-pointer" style={{ color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}>Handshake</a>
              <a href="#get-started" onClick={() => setMobileMenuOpen(false)}
                className="w-full h-[48px] mt-2 text-[14px] font-medium cursor-pointer flex items-center justify-center hover:opacity-85 active:scale-[0.98]"
                style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                Protect My Payments
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HERO — Auten-style large type, clean and minimal
// ═══════════════════════════════════════════════════════════════════
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative flex flex-col pt-[140px] md:pt-[200px] pb-[60px] md:pb-[80px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#f0ede6] via-[#f0ede6] to-[#f0ede6]" />
      {/* Subtle dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.6]" style={{
        backgroundImage: 'radial-gradient(circle, #9a9790 1.2px, transparent 1.2px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Radial fade so dots fade at edges */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, #f0ede6 60%, #f0ede6 100%)',
      }} />

      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8 w-full">
        {/* Badge */}
        <FadeIn>
          <div className="flex justify-center mb-8">
            <div className="inline-flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 px-5 py-2.5 bg-[#fafaf8] border border-[#d8d3c8] text-[13px] font-medium text-[#6b6860] tracking-[-0.2px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center">
              <Shield size={14} className="text-[#22C55E] shrink-0" fill="#22C55E" />
              In collaboration with Handshake — MAS-Regulated Escrow
            </div>
          </div>
        </FadeIn>

        {/* Headline — Auten large centered */}
        <FadeIn delay={0.1}>
          <div className="text-center max-w-[840px] mx-auto">
            <h1 className="text-[40px] md:text-[62px] lg:text-[70px] font-medium text-[#6b6860] leading-[1.0] tracking-[-3px] md:tracking-[-4.8px]" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              <span className="font-semibold text-[#0f0f0d]">Your funds.</span><br />
              Protected until you say so.
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#5c5c5c] leading-[1.6] mt-6 max-w-[560px] mx-auto opacity-70">
              Milestone-based escrow for Singapore renovations. Funds held with DBS. Released only when you approve.
            </p>
          </div>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full max-w-[480px] sm:max-w-none mx-auto">
            <a href="#get-started"
              className="group w-full sm:w-auto px-8 py-4 bg-[#0f0f0d] text-white text-[15px] font-medium tracking-[-0.7px] hover:bg-[#1e1e1e] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-center"
              style={{ borderRadius: 100, boxShadow: "0 17px 33.4px rgba(0,0,0,0.17)" }}
            >
              Protect My Renovation Payments
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#d8d3c8] text-[#0f0f0d] text-[15px] font-medium tracking-[-0.7px] hover:bg-[#e8e4db] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer text-center block"
              style={{ borderRadius: 100 }}
            >
              See How It Works
            </a>
          </div>
        </FadeIn>

        {/* Trust Bar */}
        <TrustBar />

        {/* Hero Image */}
        <FadeIn delay={0.35}>
          <motion.div className="mt-16 relative overflow-hidden mx-auto max-w-[1100px]" style={{ borderRadius: 24, y: imgY }}>
            <motion.img
              src="/11284.webp"
              alt="Beautiful renovated interior"
              className="w-full h-[300px] md:h-[500px] object-cover will-change-transform"
              style={{ scale: imgScale }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRUST BAR — Scrolling marquee
// ═══════════════════════════════════════════════════════════════════
function TrustBar() {
  const items = [
    { icon: Shield, label: "MAS Regulated" },
    { icon: CreditCard, label: "Funds held with DBS" },
    { icon: DollarSign, label: "Credit card at 2%" },
    { icon: Users, label: "Free for homeowners" },
    { icon: Lock, label: "Milestone-based escrow" },
    { icon: CheckCircle2, label: "3,200+ homeowners matched" },
    { icon: BarChart3, label: "120+ verified firms" },
  ];
  return (
    <div className="pt-14 pb-8">
      <div className="max-w-[1200px] mx-auto relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[80px] bg-gradient-to-r from-[#f0ede6] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[80px] bg-gradient-to-l from-[#f0ede6] to-transparent z-10 pointer-events-none" />
        <div className="flex animate-[trustScroll_20s_linear_infinite] whitespace-nowrap">
          {[...items, ...items, ...items].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 px-5 py-3 mx-2 bg-[#e8e4db] text-[15px] font-medium text-[#0f0f0d] shrink-0 tracking-[-0.3px]"
              style={{ borderRadius: 100 }}
            >
              <item.icon size={18} className="text-[#6b6860]" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes trustScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROBLEM vs SOLUTION — Auten two-column split (like the screenshot)
// ═══════════════════════════════════════════════════════════════════
function ProblemSolutionSection() {
  const cards = [
    {
      icon: AlertTriangle,
      title: "Scams & ghosting",
      desc: "Contractors can shut down, disappear, or stop responding after receiving upfront payment. In an unregulated industry, this happens more often than most homeowners expect.",
    },
    {
      icon: Ban,
      title: "You lose leverage",
      desc: "Once money is transferred, quality control becomes difficult. If the work isn't right, rectification can be slow, inconsistent, or simply ignored.",
    },
    {
      icon: MessagesSquare,
      title: "Scattered communication",
      desc: "Payments, progress updates, and approvals are spread across WhatsApp, PDFs, and verbal agreements. There's no single place to see what's happening.",
    },
    {
      icon: Lightbulb,
      title: "There's a better way",
      desc: "What if your money was held somewhere safe, and only released when you confirm the work has been done? That's what escrow does.",
      isHighlight: true,
    },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#e8e4db]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Header — centered above grid */}
        <FadeIn>
          <div className="text-center mb-12 max-w-[900px] mx-auto">
            <SectionLabel text="The Problem" icon={AlertTriangle} color="#EF4444" />
            <h2 className="text-[36px] md:text-[50px] font-semibold text-[#0f0f0d] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Renovations require large upfront payments.<br />
              <span className="text-[#6b6860]">There are almost no safeguards.</span>
            </h2>
            <p className="text-[16px] text-[#5c5c5c] leading-[1.6] mt-5">
              In Singapore, most renovations require 30–50% of the total cost upfront. The industry is largely unregulated. Once money is transferred, homeowners lose most of their leverage.
            </p>
            <p className="text-[16px] text-[#5c5c5c] leading-[1.6] mt-4">
              This is not because all designers are bad. It's because the system relies on blind trust.
            </p>
          </div>
        </FadeIn>

        {/* Bento Grid: left cards | center image | right cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1fr] md:grid-rows-2 gap-4">
          {/* Left column — card 1 */}
          <FadeIn delay={0}>
            <div className="bg-[#fafaf8] border border-[#d8d3c8] p-7 h-full flex flex-col" style={{ borderRadius: 18 }}>
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-[#e8e4db]">
                {(() => { const Icon = cards[0].icon; return <Icon size={20} className="text-[#6b6860]" />; })()}
              </div>
              <h3 className="text-[18px] font-bold tracking-[-0.5px] mb-2 text-[#0f0f0d] mt-auto pt-8">{cards[0].title}</h3>
              <p className="text-[14px] leading-[1.6] text-[#5c5c5c]">{cards[0].desc}</p>
            </div>
          </FadeIn>

          {/* Center column — image spanning 2 rows */}
          <FadeIn delay={0.1} className="md:row-span-2">
            <div className="h-full overflow-hidden" style={{ borderRadius: 18 }}>
              <img
                src="/2148908401.webp"
                alt="Modern renovation interior"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>

          {/* Right column — card 3 */}
          <FadeIn delay={0.16}>
            <div className="bg-[#fafaf8] border border-[#d8d3c8] p-7 h-full flex flex-col" style={{ borderRadius: 18 }}>
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-[#e8e4db]">
                {(() => { const Icon = cards[2].icon; return <Icon size={20} className="text-[#6b6860]" />; })()}
              </div>
              <h3 className="text-[18px] font-bold tracking-[-0.5px] mb-2 text-[#0f0f0d] mt-auto pt-8">{cards[2].title}</h3>
              <p className="text-[14px] leading-[1.6] text-[#5c5c5c]">{cards[2].desc}</p>
            </div>
          </FadeIn>

          {/* Left column — card 2 */}
          <FadeIn delay={0.08}>
            <div className="bg-[#fafaf8] border border-[#d8d3c8] p-7 h-full flex flex-col" style={{ borderRadius: 18 }}>
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-[#e8e4db]">
                {(() => { const Icon = cards[1].icon; return <Icon size={20} className="text-[#6b6860]" />; })()}
              </div>
              <h3 className="text-[18px] font-bold tracking-[-0.5px] mb-2 text-[#0f0f0d] mt-auto pt-8">{cards[1].title}</h3>
              <p className="text-[14px] leading-[1.6] text-[#5c5c5c]">{cards[1].desc}</p>
            </div>
          </FadeIn>

          {/* Right column — card 4 */}
          <FadeIn delay={0.24}>
            <div className="bg-[#fafaf8] border border-[#d8d3c8] p-7 h-full flex flex-col" style={{ borderRadius: 18 }}>
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-[#e8e4db]">
                {(() => { const Icon = cards[3].icon; return <Icon size={20} className="text-[#6b6860]" />; })()}
              </div>
              <h3 className="text-[18px] font-bold tracking-[-0.5px] mb-2 text-[#0f0f0d] mt-auto pt-8">{cards[3].title}</h3>
              <p className="text-[14px] leading-[1.6] text-[#5c5c5c]">{cards[3].desc}</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WHY ESCROW — Auten dark section with 6-grid icons
// ═══════════════════════════════════════════════════════════════════
function WhyEscrowSection() {
  const features = [
    { icon: Clock, title: "Results in days, not months", desc: "Your escrow account is set up within days. Start protecting your renovation payments immediately." },
    { icon: DollarSign, title: "Never lose another dollar", desc: "Your money stays in a DBS custodian account until you confirm the work is done." },
    { icon: Smartphone, title: "Full control from your phone", desc: "Track milestones, approve payments, and monitor progress from anywhere." },
    { icon: Users, title: "Support when you need it", desc: "The Handshake team is available on WhatsApp to help with any questions." },
    { icon: BarChart3, title: "Scale with confidence", desc: "Whether your renovation is $30K or $300K, the protection is the same." },
    { icon: Mail, title: "Own it forever, no fees", desc: "Free for homeowners. A small 2% fee only applies for credit card payments." },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#141414] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFA929] opacity-[0.02] blur-[200px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Why escrow matters now" dark icon={Shield} color="#FFA929" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-white tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Get your money, safety,<br className="hidden md:block" />
              and peace of mind back
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="bg-white/[0.04] border border-white/[0.06] p-7 text-center group hover:bg-white/[0.06] transition-colors h-full flex flex-col items-center"
                style={{ borderRadius: 16 }}
              >
                <div className="w-[56px] h-[56px] bg-white/[0.06] border border-white/[0.08] rounded-[12px] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-colors">
                  <f.icon size={24} className="text-white/70" />
                </div>
                <h3 className="text-[18px] font-bold text-white tracking-[-0.5px]">{f.title}</h3>
                <p className="text-[14px] text-white/40 leading-[1.6] mt-2.5">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOW IT WORKS — Auten 3-card process with large numbers
// ═══════════════════════════════════════════════════════════════════
function HowItWorksCard({ step, index }: { step: { num: string; title: string; body: string; note: string }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Stacked start: all cards centered with slight rotation, then fan out (desktop only)
  const tilts = [-3, 0, 3];
  const stackedX = [120, 0, -120];

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, x: isDesktop ? stackedX[index] : 0, rotate: 0, y: 40 }}
      animate={inView ? { opacity: 1, x: 0, rotate: isDesktop ? tilts[index] : 0, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Arrow from card 1 to card 2 */}
      {index === 0 && (
        <motion.img
          src="/up-right-arrow.png" alt=""
          className="hidden lg:block absolute -right-10 -top-4 w-[60px] h-[60px] z-10 rotate-[55deg]"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      )}
      {/* Arrow from card 2 to card 3 — flipped */}
      {index === 1 && (
        <motion.img
          src="/up-right-arrow.png" alt=""
          className="hidden lg:block absolute -right-10 -bottom-4 w-[60px] h-[60px] z-10 scale-y-[-1] rotate-[-55deg]"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        />
      )}
      <div className="bg-[#e8e4db] p-8 md:p-10 flex flex-col md:min-h-[480px]" style={{ borderRadius: 12 }}>
        <span className="text-[13px] font-medium text-[#6b6860] tracking-[1px] mb-4">{step.num}</span>
        <h3 className="text-[28px] md:text-[32px] font-bold text-[#0f0f0d] tracking-[-1.5px] leading-[1.1] whitespace-pre-line" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{step.title}</h3>
        {step.num === "02" && (
          <div className="flex flex-col gap-3 mt-6">
            <img src="/DBS_Bank_Logo_(alternative).svg.png" alt="DBS Bank" className="h-[36px] w-auto object-contain self-start" />
            <img src="/Monetary-Authority-of-Singapore.png" alt="Monetary Authority of Singapore" className="h-[100px] w-auto object-contain self-start" />
          </div>
        )}
        <div className="flex-1" />
        <p className="text-[14px] text-[#5c5c5c] leading-[1.6]">{step.body}</p>
        <p className="text-[13px] text-[#5c5c5c] font-medium mt-4 italic">{step.note}</p>
      </div>
    </motion.div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01", title: "Join & Approve\nProject",
      body: "Your designer invites you to join your project on Handshake. All milestones and payment stages are clearly outlined and approved by you.",
      note: "Nothing moves until you review and accept.",
    },
    {
      num: "02", title: "Securely\nDeposit Funds",
      body: "You deposit your renovation funds into a DBS custodian account at each payment milestone. Funds are only released when you approve the work.",
      note: "Your money is not sitting with the contractor. It's held in a regulated escrow account.",
    },
    {
      num: "03", title: "Track, Approve\n& Relax",
      body: "As work progresses, you review and approve each completed milestone until your renovation is complete.",
      note: "Full control and safety at every step.",
    },
  ];

  return (
    <section id="how-it-works" className="py-[72px] md:py-[100px] bg-[#f0ede6] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-6">
            <SectionLabel text="How it works" icon={Zap} color="#3B82F6" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#0f0f0d] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Simple. Transparent. Secure.
            </h2>
          </div>
        </FadeIn>

        {/* Step cards with stack-to-fan animation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 relative items-end">
          {steps.map((s, i) => (
            <HowItWorksCard key={i} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BENEFITS — Feature showcase cards (Auten-style interactive mockups)
// ═══════════════════════════════════════════════════════════════════
function BenefitsSection() {
  return (
    <section className="py-[72px] md:py-[100px] bg-[#f0ede6]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Why homeowners love this" icon={Shield} color="#22C55E" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#0f0f0d] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Built for your peace of mind.
            </h2>
          </div>
        </FadeIn>

        {/* Feature 1 — Large card spanning full width */}
        <FadeIn delay={0.1}>
          <div className="bg-[#0f0f0d] p-8 md:p-12 mb-5 relative overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#22C55E] opacity-[0.04] blur-[150px] pointer-events-none" />
            <div className="relative max-w-[700px]">
              <div className="flex items-center gap-2 mb-6">
                <Shield size={20} className="text-[#22C55E]" fill="#22C55E" strokeWidth={0} />
                <span className="text-[13px] font-medium text-white/50 uppercase tracking-[1.5px]">Regulated & Protected</span>
              </div>
              <h3 className="text-[28px] md:text-[36px] font-bold text-white tracking-[-1.5px] leading-[1.1]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                MAS-Regulated. DBS-Backed.
              </h3>
              <p className="text-[15px] text-white/50 leading-[1.7] mt-5">
                All payment flows on Handshake are fully regulated by the Monetary Authority of Singapore. Your funds are held in segregated accounts with DBS — separate from the contractor and separate from Handshake's own accounts.
              </p>
              <div className="flex flex-wrap gap-2 mt-8">
                {["MAS Regulated", "DBS Custodian", "Bank-Grade Security"].map(tag => (
                  <span key={tag} className="px-4 py-2 text-[12px] font-medium text-white/70 bg-white/[0.06] border border-white/[0.08] rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Features 2 & 3 — Two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <FadeIn delay={0.15}>
            <div className="bg-[#e8e4db] p-8 md:p-10 h-full flex flex-col" style={{ borderRadius: 12 }}>
              {/* Credit card illustration */}
              <div className="bg-[#fafaf8] border border-[#d8d3c8] p-5 mb-6 flex items-center justify-between" style={{ borderRadius: 14 }}>
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-[#0f0f0d]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#0f0f0d]">Pay by credit card</p>
                    <p className="text-[12px] text-[#6b6860]">Earn miles on every payment</p>
                  </div>
                </div>
                <span className="text-[28px] font-bold text-[#0f0f0d] tracking-[-1px]">2%</span>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f0f0d] tracking-[-0.5px]">Earn miles while renovating</h3>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-2">
                You can pay by credit card at 2% — the lowest processing fee in the industry. Earn miles for your next holiday while your home gets renovated.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-[#e8e4db] p-8 md:p-10 h-full flex flex-col" style={{ borderRadius: 12 }}>
              {/* $0 illustration */}
              <div className="bg-[#fafaf8] border border-[#d8d3c8] p-5 mb-6 flex items-center justify-between" style={{ borderRadius: 14 }}>
                <div className="flex items-center gap-3">
                  <DollarSign size={24} className="text-[#22C55E]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#0f0f0d]">Homeowner cost</p>
                    <p className="text-[12px] text-[#6b6860]">No signup or platform fees</p>
                  </div>
                </div>
                <span className="text-[28px] font-bold text-[#22C55E] tracking-[-1px]">$0</span>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f0f0d] tracking-[-0.5px]">Free for homeowners</h3>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-2">
                There is no cost for homeowners to use Handshake. A small processing fee applies only if you choose to pay by credit card.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Features 4 & 5 — Two cards side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FadeIn delay={0.25}>
            <div className="bg-[#e8e4db] p-8 md:p-10 h-full flex flex-col" style={{ borderRadius: 12 }}>
              {/* Dashboard mockup */}
              <div className="bg-[#fafaf8] border border-[#d8d3c8] p-5 mb-6 space-y-3" style={{ borderRadius: 14 }}>
                {[
                  { icon: CheckCircle2, text: "Milestone 1 approved", color: "text-[#22C55E]" },
                  { icon: Clock, text: "Milestone 2 in progress", color: "text-[#FFA929]" },
                  { icon: Lock, text: "Milestone 3 funds secured", color: "text-[#6b6860]" },
                ].map((item, j) => (
                  <div key={j} className="flex items-center gap-3 px-3 py-2">
                    <item.icon size={16} className={item.color} />
                    <span className="text-[13px] text-[#0f0f0d]">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-[22px] font-bold text-[#0f0f0d] tracking-[-0.5px]">Full visibility & control</h3>
                <span className="text-[12px] font-medium text-[#6b6860] bg-[#fafaf8] border border-[#d8d3c8] px-3 py-1 rounded-full">24/7</span>
              </div>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6]">
                Track progress, approve milestones, and manage your payments from your phone. Everything is in one place — no more chasing updates on WhatsApp.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="bg-[#e8e4db] p-8 md:p-10 h-full flex flex-col" style={{ borderRadius: 12 }}>
              {/* WhatsApp support mockup */}
              <div className="bg-[#fafaf8] border border-[#d8d3c8] p-5 mb-6" style={{ borderRadius: 14 }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-[32px] h-[32px] bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div className="bg-[#e8e4db] px-4 py-2.5 text-[13px] text-[#5c5c5c]" style={{ borderRadius: "2px 12px 12px 12px" }}>
                    Hi! I'm new to escrow. How does it work for my renovation?
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-[#0f0f0d] px-4 py-2.5 text-[13px] text-white" style={{ borderRadius: "12px 2px 12px 12px" }}>
                    Happy to walk you through it! Let's start with your project details.
                  </div>
                </div>
              </div>
              <h3 className="text-[22px] font-bold text-[#0f0f0d] tracking-[-0.5px]">Handshake support team</h3>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-2">
                Not sure how it works? The Handshake team is always available to walk you through the process. Reach them anytime on WhatsApp.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CASE STUDIES — Auten-style with stats and images
// ═══════════════════════════════════════════════════════════════════
function CaseStudiesSection() {
  const cases = [
    {
      firm: "Network x Handshake",
      logo: "N",
      title: "Escrow that protected a $85K HDB renovation",
      desc: "Homeowner had full control over 5 milestones. Contractor delivered quality work knowing payments were guaranteed.",
      stats: [{ value: "$85K", label: "Protected" }, { value: "5", label: "Milestones" }],
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80",
    },
    {
      firm: "Singapore Reno",
      logo: "S",
      title: "Condo renovation with zero payment disputes",
      desc: "First-time homeowner used Handshake to manage a $120K condo renovation. Every payment was milestone-verified.",
      stats: [{ value: "$120K", label: "Protected" }, { value: "0", label: "Disputes" }],
      img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80",
    },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#f0ede6]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Case studies" icon={Award} color="#A855F7" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#0f0f0d] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Examples of renovations<br className="hidden md:block" />
              <span className="text-[#6b6860] font-medium">protected with escrow</span>
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-6">
          {cases.map((c, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="bg-[#fafaf8] border border-[#d8d3c8] p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center"
                style={{ borderRadius: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {/* Left — text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-[32px] h-[32px] bg-[#0f0f0d] rounded-[8px] flex items-center justify-center">
                      <span className="text-white text-[12px] font-bold">{c.logo}</span>
                    </div>
                    <span className="text-[14px] font-medium text-[#5c5c5c]">{c.firm}</span>
                  </div>

                  <h3 className="text-[24px] md:text-[28px] font-bold text-[#0f0f0d] tracking-[-1.2px] leading-[1.15]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{c.title}</h3>
                  <p className="text-[15px] text-[#5c5c5c] leading-[1.6] mt-3 opacity-70">{c.desc}</p>

                  <div className="flex items-center gap-8 mt-7">
                    {c.stats.map((s, j) => (
                      <div key={j}>
                        <p className="text-[32px] font-bold text-[#0f0f0d] tracking-[-2px] leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                        <p className="text-[13px] text-[#5c5c5c] mt-1 opacity-50">{s.label}</p>
                      </div>
                    ))}
                    <a href="#get-started" className="ml-auto px-5 py-2.5 bg-[#0f0f0d] text-white text-[13px] font-medium hover:bg-[#1e1e1e] hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 cursor-pointer flex items-center gap-1.5" style={{ borderRadius: 100 }}>
                      Read more
                    </a>
                  </div>
                </div>

                {/* Right — image */}
                <div className="w-full md:w-[340px] lg:w-[420px] h-[220px] md:h-[280px] overflow-hidden shrink-0" style={{ borderRadius: 16 }}>
                  <img src={c.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How are my renovation payments kept secure?", a: "All payments on Handshake are fully regulated by MAS. Your funds are held with trusted banks like DBS, in accounts that are completely separate from the contractor and from Handshake's own accounts." },
    { q: "Is Handshake free to use?", a: "Yes. Handshake is completely free for homeowners. A processing fee of 2% applies only if you choose to pay by credit card." },
    { q: "What payment options do I have?", a: "You can pay by credit card (and earn miles or rewards), bank transfer, or PayNow. Whichever works best for you." },
    { q: "What if work is delayed or stops?", a: "Your remaining funds stay protected in escrow and are not released until work resumes and you approve it. If any issues come up, the Handshake team will be there to guide you through next steps." },
    { q: "How do I get started?", a: 'Fill out the form below and our team will walk you through everything. You can also reach the Handshake team directly on WhatsApp.' },
    { q: "Am I bound to anything?", a: "No. Filling out the form does not lock you into anything. You are free to explore, ask questions, and walk away at any point. You stay in control throughout." },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#f0ede6]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left side — heading + CTA */}
          <FadeIn>
            <div className="lg:sticky lg:top-[140px]">
              <SectionLabel text="FAQs" icon={MessageSquare} color="#F59E0B" />
              <h2 className="text-[36px] md:text-[50px] font-semibold text-[#0f0f0d] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as never, fontFamily: "'EB Garamond', Georgia, serif" }}>
                Before You Start, Here's What Most Homeowners Ask
              </h2>
              <p className="text-[16px] text-[#5c5c5c] leading-[1.6] mt-5 max-w-[420px]">
                Still have questions? Reach the Handshake team anytime on WhatsApp.
              </p>
              <div className="flex items-center gap-3 mt-8">
                <a href="#get-started" className="inline-flex items-center gap-2.5 bg-[#0f0f0d] text-white px-6 py-3 text-[14px] font-medium hover:bg-[#0f0f0d]/90 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200" style={{ borderRadius: 100 }}>
                  Get started
                </a>
                <a href="https://wa.me/6580778295" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-[#fafaf8] border border-[#d8d3c8] text-[#0f0f0d] px-6 py-3 text-[14px] font-medium hover:bg-[#fafaf8] hover:scale-[1.05] active:scale-[0.95] transition-all duration-200" style={{ borderRadius: 100 }}>
                  <MessageSquare size={14} />
                  WhatsApp us
                </a>
              </div>
            </div>
          </FadeIn>

          {/* Right side — accordion */}
          <div className="space-y-0 divide-y divide-[#d8d3c8]">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="overflow-hidden">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full text-left py-5 md:py-6 cursor-pointer group hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[16px] md:text-[18px] font-semibold text-[#0f0f0d] tracking-[-0.3px]">{faq.q}</span>
                      <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
                        <Plus size={20} className="text-[#5c5c5c] shrink-0" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-[14px] md:text-[15px] text-[#5c5c5c] leading-[1.7] pb-5 md:pb-6 max-w-[500px]">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEAD CAPTURE FORM
// ═══════════════════════════════════════════════════════════════════
function LeadCaptureForm() {
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", propertyType: "", budget: "", timeline: "", hasDesigner: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappTouched, setWhatsappTouched] = useState(false);
  const whatsappErr = whatsappTouched && form.whatsapp.length > 0 && form.whatsapp.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.whatsapp.trim() || !form.email.trim() || !form.propertyType || !form.budget || !form.timeline || !form.hasDesigner) {
      toast.error("Please fill in all fields before submitting.");
      return;
    }
    if (form.whatsapp.length !== 8) {
      setWhatsappTouched(true);
      toast.error("Please enter a valid 8-digit Singapore number.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("handshake_leads").insert({
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email || null,
        property_type: form.propertyType || null,
        budget: form.budget || null,
        timeline: form.timeline || null,
        has_designer: form.hasDesigner || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("We'll be in touch soon!");

      // Send to Zapier via server proxy
      sendToZapier("handshake-lead", {
        "Name": form.name,
        "WhatsApp": form.whatsapp,
        "Email": form.email || "",
        "Property Type": form.propertyType || "",
        "Budget": form.budget || "",
        "Timeline": form.timeline || "",
        "Has Designer": form.hasDesigner || "",
        "Lead Form": "Handshake Lead Form",
      });
    } catch {
      toast.error("Something went wrong. Please try again or WhatsApp us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="get-started" className="bg-[#0A0A0A] pt-[72px] md:pt-[100px]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* CTA Card */}
        <FadeIn>
          <div className="bg-[#141414] border border-white/[0.06] p-8 md:p-12 lg:p-16 relative overflow-hidden" style={{ borderRadius: 24, backgroundImage: 'url(/004-page-2.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-[#141414]/65" style={{ borderRadius: 24 }} />
            {submitted ? (
              <div className="text-center py-8 relative z-10">
                <div className="w-[64px] h-[64px] bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={32} className="text-white" />
                </div>
                <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-[-2px]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>You're all set.</h2>
                <p className="text-[16px] text-white/50 leading-[1.7] mt-4 max-w-[440px] mx-auto">
                  Our team will reach out to walk you through how Handshake protects your renovation payments.
                </p>
                <p className="text-[15px] text-white/30 leading-[1.6] mt-3">
                  We're here to help — no pressure, no rush.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative z-10">
                {/* Left — heading + benefits */}
                <div>
                  <SectionLabel text="Get started" dark icon={ArrowRight} color="#22C55E" />
                  <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-[-2px] leading-[1.1] mt-6" style={{ textWrap: "balance" as never, fontFamily: "'EB Garamond', Georgia, serif" }}>
                    Protect your renovation payments today.
                  </h2>
                  <p className="text-[16px] text-white/40 leading-[1.7] mt-5 max-w-[400px]">
                    Fill in your details and our team will guide you through everything. No obligation, no hidden costs.
                  </p>
                  <div className="space-y-4 mt-8">
                    {[
                      "MAS-regulated escrow protection",
                      "Funds held with DBS — separate from contractor",
                      "100% free for homeowners",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-[22px] h-[22px] rounded-full bg-[#FFA929] flex items-center justify-center shrink-0">
                          <Check size={13} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[15px] text-white/70">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — form */}
                <div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Full Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="Your full name" required />
                    {/* WhatsApp — Singapore 8-digit validation */}
                    <div>
                      <label className="block text-[13px] font-medium text-white/50 mb-1.5">
                        WhatsApp Number<span className="text-[#FFA929] ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        required
                        placeholder="91234567"
                        value={form.whatsapp}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                          setForm({ ...form, whatsapp: val });
                        }}
                        onFocus={() => setWhatsappTouched(false)}
                        onBlur={() => setWhatsappTouched(true)}
                        className={`w-full h-[46px] px-4 bg-white/[0.06] border text-[14px] text-white placeholder:text-white/20 outline-none transition-colors ${
                          whatsappErr ? "border-red-400" : "border-white/[0.08] focus:border-white/30"
                        }`}
                        style={{ borderRadius: 10 }}
                      />
                      {whatsappErr && (
                        <p className="mt-1 text-[12px] text-red-400">
                          Please enter a valid 8-digit number
                        </p>
                      )}
                    </div>
                    <FormField label="Email Address" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} placeholder="you@email.com" type="email" required />
                    <FormSelect label="Property Type" value={form.propertyType} onChange={(v: string) => setForm({ ...form, propertyType: v })}
                      options={["BTO", "HDB", "Condo", "Resale", "Landed"]} required />
                    <FormSelect label="Estimated Budget" value={form.budget} onChange={(v: string) => setForm({ ...form, budget: v })}
                      options={["Under $30K", "$30K – $50K", "$50K – $100K", "$100K – $150K", "$150K+"]} required />
                    <FormSelect label="When do you plan to start?" value={form.timeline} onChange={(v: string) => setForm({ ...form, timeline: v })}
                      options={["Immediately", "1 – 3 months", "3 – 6 months", "6+ months", "Not sure yet"]} required />
                    <FormSelect label="Have you found an Interior Designer?" value={form.hasDesigner} onChange={(v: string) => setForm({ ...form, hasDesigner: v })}
                      options={["Yes", "No", "Still looking"]} required />

                    <button type="submit" disabled={loading}
                      className="w-full py-4 bg-white text-[#0f0f0d] text-[15px] font-semibold hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer mt-2"
                      style={{ borderRadius: 12 }}
                    >
                      {loading ? <Loader2 size={17} className="animate-spin" /> : <>Protect My Renovation Payments <ArrowRight size={16} /></>}
                    </button>

                    <p className="text-[12px] text-white/25 text-center mt-1">
                      100% Free for homeowners. Completely non-obligatory.
                    </p>
                  </form>
                </div>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Footer */}
        <div className="py-12 mt-12 border-t border-white/[0.06]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Logo + description */}
            <div className="max-w-[400px]">
              <div className="flex items-center gap-2.5 mb-4">
                <img src={imgNetworkLogo} alt="Network" className="h-[20px] w-auto brightness-0 invert" />
                <span className="text-[14px] text-white/30 font-light select-none">&times;</span>
                <img src={imgHandshakeLogo} alt="Handshake" className="h-[28px] w-auto brightness-0 invert" />
              </div>
              <p className="text-[13px] text-white/30 leading-[1.6]">
                All payment flows on Handshake are regulated by the Monetary Authority of Singapore (MAS)
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-white/50 uppercase tracking-[1.5px]">Contact</p>
                <a href="https://wa.me/6580778295" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                  <Phone size={13} /> WhatsApp
                </a>
                <a href="mailto:hello@networksg.net" className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                  <Mail size={13} /> Email
                </a>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-white/50 uppercase tracking-[1.5px]">Legal</p>
                <a href="#" className="block text-[13px] text-white/40 hover:text-white/70 transition-colors">Privacy Policy</a>
                <a href="#" className="block text-[13px] text-white/40 hover:text-white/70 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/20">&copy; {new Date().getFullYear()} Network Singapore. All rights reserved.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", required }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/50 mb-1.5">
        {label}{required && <span className="text-[#FFA929] ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full h-[46px] px-4 bg-white/[0.06] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
        style={{ borderRadius: 10 }}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options, required }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/50 mb-1.5">{label}{required && <span className="text-[#FFA929] ml-0.5">*</span>}</label>
      <div className="relative">
        <select value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} required={required}
          className="w-full h-[46px] px-4 bg-white/[0.06] border border-white/[0.08] text-[14px] text-white outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
          style={{ borderRadius: 10 }}
        >
          <option value="" className="bg-[#141414]">Select...</option>
          {options.map((o: string) => <option key={o} value={o} className="bg-[#141414]">{o}</option>)}
        </select>
        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SOCIAL PROOF METRICS — Animated counters
// ═══════════════════════════════════════════════════════════════════
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

function SocialProofMetrics() {
  const metrics = [
    { target: 3200, suffix: "+", label: "Homeowners matched through Network" },
    { target: 120, suffix: "+", label: "Verified renovation firms" },
    { value: "4.8", star: true, label: "Average homeowner rating" },
    { value: "$0", label: "Cost to homeowners" },
  ];

  return (
    <section className="py-[40px] md:py-[56px] bg-[#f0ede6]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((m, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-[#e8e4db] rounded-2xl px-6 py-6 h-full">
                <p className="text-[28px] md:text-[32px] font-bold text-[#0f0f0d] tracking-[-1.5px] leading-none">
                  {m.value ? <span className="inline-flex items-center gap-1" style={{ fontVariantNumeric: "tabular-nums" }}>{m.value}{m.star && <Star size={24} className="text-[#0f0f0d] inline" fill="#0f0f0d" strokeWidth={0} />}</span> : <AnimatedCounter target={m.target!} suffix={m.suffix} prefix={m.prefix} />}
                </p>
                <p className="text-[14px] text-[#6b6860] mt-3">{m.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WHATSAPP FLOATING CTA
// ═══════════════════════════════════════════════════════════════════
function WhatsAppFloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="https://wa.me/6591234567"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-50 w-[56px] h-[56px] bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-colors cursor-pointer group"
          style={{ boxShadow: "0 4px 20px rgba(37, 211, 102, 0.4)" }}
        >
          <MessageCircle size={26} className="text-white" />
          <span className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-[#FFA929] rounded-full animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-[#FFA929] rounded-full" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════
// Footer is now integrated into LeadCaptureForm

import { useState, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { Navbar } from "./Navbar";
import { ReactLenis } from "lenis/react";
import {
  Shield, CreditCard, Eye, MessageSquare, Check,
  AlertTriangle, Ban, MessagesSquare, Lightbulb, ArrowRight,
  Lock, DollarSign, Smartphone, Headphones, ChevronDown, X,
  Loader2, ExternalLink, Zap, BarChart3, Clock, Users,
  CheckCircle2, ArrowUpRight, Phone, Mail
} from "lucide-react";

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

// ─── SECTION LABEL (Auten-style: monospace pill) ─────────────────
function SectionLabel({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[2px] border ${
      dark ? "text-white/50 border-white/10 bg-white/[0.03]" : "text-[#71717A] border-[#E5E7EB] bg-[#F6F6F6]"
    }`} style={{ borderRadius: 100, fontFamily: "'Inter', monospace" }}>
      <span className={`w-[6px] h-[6px] rounded-full ${dark ? "bg-[#FFA929]" : "bg-[#09090B]"}`} />
      {text}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export function HandshakeLanding() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <div className="bg-[#fcfcfc] min-h-screen font-['Inter',sans-serif] relative overflow-x-clip">
        <Navbar />
        <HeroSection />
        <TrustBar />
        <ProblemSolutionSection />
        <WhyEscrowSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CaseStudiesSection />
        <FAQSection />
        <LeadCaptureForm />
        <HandshakeFooter />
      </div>
    </ReactLenis>
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
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-[140px] pb-[60px] md:pb-[80px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#fcfcfc] via-[#f7f7f7] to-[#fcfcfc]" />

      <div className="relative max-w-[1200px] mx-auto px-4 md:px-8 w-full">
        {/* Badge */}
        <FadeIn>
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFF6DC] border border-[#FFEAB1] text-[13px] font-medium text-[#92400E]"
              style={{ borderRadius: 100, boxShadow: "0 8px 33.4px rgba(0,0,0,0.06)" }}
            >
              <Shield size={14} />
              In collaboration with Handshake — MAS-Regulated Escrow
            </div>
          </div>
        </FadeIn>

        {/* Headline — Auten large centered */}
        <FadeIn delay={0.1}>
          <div className="text-center max-w-[840px] mx-auto">
            <h1 className="text-[44px] md:text-[72px] lg:text-[80px] font-semibold text-[#09090B] leading-[1.0] tracking-[-3px] md:tracking-[-4.8px]" style={{ textWrap: "balance" as any }}>
              Your funds. <br className="hidden md:block" />
              <span className="text-[#71717A] font-medium">Protected until you say so.</span>
            </h1>
            <p className="text-[16px] md:text-[18px] text-[#5c5c5c] leading-[1.6] mt-6 max-w-[560px] mx-auto opacity-70">
              Milestone-based escrow for Singapore renovations. Funds held with DBS. Released only when you approve.
            </p>
          </div>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <a href="#get-started"
              className="group px-8 py-4 bg-[#09090B] text-white text-[15px] font-medium tracking-[-0.7px] hover:bg-[#1e1e1e] transition-all cursor-pointer flex items-center gap-2"
              style={{ borderRadius: 100, boxShadow: "0 17px 33.4px rgba(0,0,0,0.17)" }}
            >
              Protect My Renovation Payments
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#how-it-works"
              className="px-8 py-4 bg-transparent border border-[#E5E7EB] text-[#09090B] text-[15px] font-medium tracking-[-0.7px] hover:bg-[#f0f0f0] transition-all cursor-pointer"
              style={{ borderRadius: 100 }}
            >
              See How It Works
            </a>
          </div>
        </FadeIn>

        {/* Hero Image */}
        <FadeIn delay={0.35}>
          <motion.div className="mt-16 relative overflow-hidden mx-auto max-w-[1100px]" style={{ borderRadius: 24, y: imgY }}>
            <motion.img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80"
              alt="Beautiful renovated interior"
              className="w-full h-[300px] md:h-[500px] object-cover will-change-transform"
              style={{ scale: imgScale }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
              {["MAS Regulated", "Funds held with DBS", "Free for homeowners"].map(tag => (
                <span key={tag} className="px-3.5 py-2 text-[12px] font-medium text-white bg-white/10 backdrop-blur-xl border border-white/15" style={{ borderRadius: 100 }}>
                  {tag}
                </span>
              ))}
            </div>
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
    "MAS Regulated", "Funds held with DBS", "Credit card at 2%", "Free for homeowners",
    "Milestone-based escrow", "3,200+ homeowners matched", "120+ verified firms",
  ];
  return (
    <div className="bg-[#141414] py-5 overflow-hidden">
      <div className="flex animate-[trustScroll_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-[13px] text-white/40 font-medium mx-8 flex items-center gap-2.5 shrink-0 tracking-[-0.3px]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#FFA929]" />
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes trustScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROBLEM vs SOLUTION — Auten two-column split (like the screenshot)
// ═══════════════════════════════════════════════════════════════════
function ProblemSolutionSection() {
  const problems = [
    { text: "Large payments made before work even starts." },
    { text: "Once money is transferred, leverage disappears." },
    { text: "Communication is scattered across WhatsApp and PDFs." },
    { text: "When contractors ghost, there's little recourse." },
    { text: "The system relies on blind trust — and hope." },
  ];
  const solutions = [
    { icon: Lock, text: "Funds held in regulated escrow until you approve." },
    { icon: Eye, text: "Full visibility on milestones, payments, and progress." },
    { icon: Headphones, text: "Dedicated support team available on WhatsApp." },
    { icon: Zap, text: "Payments linked directly to completed work stages." },
    { icon: Shield, text: "MAS-regulated. Bank-grade security with DBS." },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#fcfcfc]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Problem vs Solution" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#09090B] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any }}>
              Your time slips away because<br className="hidden md:block" />
              <span className="text-[#71717A] font-medium">everything depends on trust</span>
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Problem */}
          <SlideIn from="left" delay={0.1}>
            <div className="h-full">
              <h3 className="text-[22px] font-bold text-[#09090B] tracking-[-0.5px] mb-6 text-center">The Problem</h3>
              <div className="space-y-4">
                {problems.map((p, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white p-5 border border-[#f3f4f6]" style={{ borderRadius: 14 }}>
                    <X size={18} className="text-[#d1d5db] shrink-0 mt-0.5" />
                    <p className="text-[15px] text-[#5c5c5c] leading-[1.5]">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </SlideIn>

          {/* The Solution */}
          <SlideIn from="right" delay={0.15}>
            <div className="h-full">
              <h3 className="text-[22px] font-bold text-[#09090B] tracking-[-0.5px] mb-6 text-center">The Solution</h3>
              <div className="bg-[#141414] p-6 relative overflow-hidden" style={{ borderRadius: 18 }}>
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#FFA929] opacity-[0.04] blur-[100px]" />
                <div className="space-y-4 relative">
                  {solutions.map((s, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.04] border border-white/[0.06]" style={{ borderRadius: 12 }}>
                      <div className="w-[36px] h-[36px] bg-[#FFA929] rounded-[10px] flex items-center justify-center shrink-0">
                        <s.icon size={17} className="text-white" />
                      </div>
                      <p className="text-[15px] text-white/70 leading-[1.5] pt-1.5">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SlideIn>
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
            <SectionLabel text="Why escrow matters now" dark />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-white tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any }}>
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
                <div className="w-[56px] h-[56px] bg-white/[0.06] border border-white/[0.08] rounded-[14px] flex items-center justify-center mb-5 group-hover:bg-white/[0.1] transition-colors">
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
      note: "Your money is not sitting with the contractor.",
    },
    {
      num: "03", title: "Track, Approve\n& Relax",
      body: "As work progresses, you review and approve each completed milestone until your renovation is complete.",
      note: "Full control and safety at every step.",
    },
  ];

  return (
    <section id="how-it-works" className="py-[72px] md:py-[100px] bg-[#fcfcfc]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-6">
            <SectionLabel text="How our process works" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#09090B] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any }}>
              Three simple steps to protect<br className="hidden md:block" />
              <span className="text-[#71717A] font-medium">your renovation payments</span>
            </h2>
          </div>
        </FadeIn>

        {/* Curved arrow decoration */}
        <FadeIn delay={0.1}>
          <div className="flex justify-center my-6">
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-[#09090B] opacity-20">
              <path d="M5 35 C 5 10, 55 10, 55 35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M50 30 L55 37 L48 37Z" fill="currentColor" />
            </svg>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="bg-[#f8f8f8] border border-[#f0f0f0] p-8 md:p-10 h-full flex flex-col group hover:bg-[#f0f0f0] transition-colors relative overflow-hidden"
                style={{ borderRadius: 20 }}
              >
                {/* Large number — Auten style */}
                <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-[2px] mb-6" style={{ fontFamily: "'Inter', monospace" }}>
                  {s.num}
                </span>

                <h3 className="text-[28px] md:text-[32px] font-bold text-[#09090B] tracking-[-1.5px] leading-[1.1] whitespace-pre-line">{s.title}</h3>

                {/* Dot decoration */}
                <div className="w-[8px] h-[8px] bg-[#09090B] rounded-full my-6 opacity-10" />

                <p className="text-[14px] text-[#5c5c5c] leading-[1.6] flex-1 opacity-70">{s.body}</p>

                <p className="text-[13px] text-[#FFA929] font-medium mt-6 italic">{s.note}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom arrow */}
        <FadeIn delay={0.4}>
          <div className="flex justify-center mt-8">
            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-[#09090B] opacity-20 rotate-180">
              <path d="M5 35 C 5 10, 55 10, 55 35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M50 30 L55 37 L48 37Z" fill="currentColor" />
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BENEFITS — Feature showcase cards (Auten-style interactive mockups)
// ═══════════════════════════════════════════════════════════════════
function BenefitsSection() {
  return (
    <section className="py-[72px] md:py-[100px] bg-[#fcfcfc]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Complete protection solutions" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#09090B] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any }}>
              Everything your renovation<br className="hidden md:block" />
              <span className="text-[#71717A] font-medium">needs, protected</span>
            </h2>
          </div>
        </FadeIn>

        {/* Two large feature cards — Auten bento style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Milestone Dashboard mockup */}
          <FadeIn delay={0.1}>
            <div className="bg-white border border-[#f0f0f0] p-8 md:p-10 h-full" style={{ borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {/* Mock chat interface */}
              <div className="bg-[#fafafa] border border-[#f0f0f0] p-5 mb-6" style={{ borderRadius: 14 }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-[32px] h-[32px] bg-[#09090B] rounded-[8px] flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-bold">N</span>
                  </div>
                  <div className="bg-white border border-[#e5e7eb] px-4 py-2.5 text-[14px] text-[#5c5c5c]" style={{ borderRadius: "2px 14px 14px 14px" }}>
                    Your milestone has been approved. Funds released to contractor.
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-[#09090B] px-4 py-2.5 text-[14px] text-white" style={{ borderRadius: "14px 2px 14px 14px" }}>
                    Great! Kitchen looks perfect.
                  </div>
                </div>
              </div>

              <h3 className="text-[22px] font-bold text-[#09090B] tracking-[-0.5px]">Milestone Tracking</h3>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-2 opacity-70">
                Approve each stage before payments are released. Full visibility on every dollar.
              </p>
            </div>
          </FadeIn>

          {/* Workflow automation mockup */}
          <FadeIn delay={0.15}>
            <div className="bg-white border border-[#f0f0f0] p-8 md:p-10 h-full" style={{ borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {/* Mock workflow steps */}
              <div className="bg-[#fafafa] border border-[#f0f0f0] p-5 mb-6 space-y-3" style={{ borderRadius: 14 }}>
                {[
                  { icon: CheckCircle2, text: "Deposit received", status: "done" },
                  { icon: Zap, text: "Milestone 1 approved", status: "done" },
                  { icon: Clock, text: "Milestone 2 in progress", status: "active" },
                  { icon: Lock, text: "Funds secured for Milestone 3", status: "pending" },
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${
                    step.status === "active" ? "bg-white border border-[#e5e7eb]" : ""
                  }`} style={{ borderRadius: 10 }}>
                    <step.icon size={16} className={
                      step.status === "done" ? "text-[#16a34a]" :
                      step.status === "active" ? "text-[#FFA929]" : "text-[#d1d5db]"
                    } />
                    <span className={`text-[14px] ${step.status === "pending" ? "text-[#d1d5db]" : "text-[#09090B]"}`}>{step.text}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[22px] font-bold text-[#09090B] tracking-[-0.5px]">Payment Protection</h3>
              <p className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-2 opacity-70">
                Your renovation funds are held in a DBS custodian account. Released only when you say so.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Three small feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              mock: (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e7eb]" style={{ borderRadius: 8 }}>
                    <CheckCircle2 size={14} className="text-[#16a34a]" />
                    <span className="text-[13px] text-[#09090B]">1. Deposit to escrow</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[#d1d5db]">
                    <span className="text-[10px]">|</span>
                    <span className="text-[14px] font-bold">+</span>
                    <span className="text-[10px]">|</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e5e7eb]" style={{ borderRadius: 8 }}>
                    <CheckCircle2 size={14} className="text-[#16a34a]" />
                    <span className="text-[13px] text-[#09090B]">2. Work verified</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[#d1d5db]">
                    <span className="text-[10px]">|</span>
                    <span className="text-[14px] font-bold">+</span>
                    <span className="text-[10px]">|</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#FFA929]/30" style={{ borderRadius: 8 }}>
                    <Lock size={14} className="text-[#FFA929]" />
                    <span className="text-[13px] text-[#09090B]">3. Funds released</span>
                  </div>
                </div>
              ),
              title: "Automated Escrow Flow",
              desc: "Every payment follows a clear, auditable process from deposit to release.",
            },
            {
              mock: (
                <div className="space-y-3">
                  {[
                    { label: "We assess your renovation", sub: "Understand scope and budget." },
                    { label: "We match with escrow plan", sub: "Custom milestones for your project." },
                    { label: "We set up your dashboard", sub: "Ready to track from day one." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-[8px] h-[8px] rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-[#09090B]" : "bg-[#d1d5db]"}`} />
                      <div>
                        <p className="text-[13px] font-semibold text-[#09090B]">{item.label}</p>
                        <p className="text-[12px] text-[#5c5c5c] opacity-60">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ),
              title: "Onboarding Roadmap",
              desc: "We study your renovation, pick the right escrow structure, and set everything up.",
            },
            {
              mock: (
                <div className="bg-white border border-[#e5e7eb] p-4" style={{ borderRadius: 10 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-[#FFA929]" />
                    <span className="text-[12px] font-medium text-[#09090B]">Get a free consultation</span>
                  </div>
                  <div className="bg-[#fafafa] border border-[#f0f0f0] px-3 py-2 text-[12px] text-[#5c5c5c] mb-2" style={{ borderRadius: 8 }}>
                    Interested in protecting my $65K HDB reno...
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[11px] text-[#5c5c5c]">Send</span>
                    <ArrowUpRight size={12} className="text-[#09090B]" />
                  </div>
                </div>
              ),
              title: "Free Consultation",
              desc: "Not sure how it works? Get a free walkthrough with the Handshake team.",
            },
          ].map((card, i) => (
            <FadeIn key={i} delay={0.2 + i * 0.08}>
              <div className="bg-white border border-[#f0f0f0] p-6 md:p-8 h-full flex flex-col" style={{ borderRadius: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="bg-[#fafafa] border border-[#f0f0f0] p-5 mb-5 flex-1" style={{ borderRadius: 14 }}>
                  {card.mock}
                </div>
                <h3 className="text-[18px] font-bold text-[#09090B] tracking-[-0.5px]">{card.title}</h3>
                <p className="text-[13px] text-[#5c5c5c] leading-[1.5] mt-1.5 opacity-70">{card.desc}</p>
              </div>
            </FadeIn>
          ))}
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
    <section className="py-[72px] md:py-[100px] bg-[#f7f7f7]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-14">
            <SectionLabel text="Case studies" />
            <h2 className="text-[36px] md:text-[56px] font-semibold text-[#09090B] tracking-[-2.4px] leading-[1.05] mt-6" style={{ textWrap: "balance" as any }}>
              Examples of renovations<br className="hidden md:block" />
              <span className="text-[#71717A] font-medium">protected with escrow</span>
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-6">
          {cases.map((c, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div className="bg-white border border-[#f0f0f0] p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center"
                style={{ borderRadius: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                {/* Left — text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-[32px] h-[32px] bg-[#09090B] rounded-[8px] flex items-center justify-center">
                      <span className="text-white text-[12px] font-bold">{c.logo}</span>
                    </div>
                    <span className="text-[14px] font-medium text-[#5c5c5c]">{c.firm}</span>
                  </div>

                  <h3 className="text-[24px] md:text-[28px] font-bold text-[#09090B] tracking-[-1.2px] leading-[1.15]">{c.title}</h3>
                  <p className="text-[15px] text-[#5c5c5c] leading-[1.6] mt-3 opacity-70">{c.desc}</p>

                  <div className="flex items-center gap-8 mt-7">
                    {c.stats.map((s, j) => (
                      <div key={j}>
                        <p className="text-[32px] font-bold text-[#09090B] tracking-[-2px] leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
                        <p className="text-[13px] text-[#5c5c5c] mt-1 opacity-50">{s.label}</p>
                      </div>
                    ))}
                    <a href="#get-started" className="ml-auto px-5 py-2.5 bg-[#09090B] text-white text-[13px] font-medium hover:bg-[#1e1e1e] transition-colors cursor-pointer flex items-center gap-1.5" style={{ borderRadius: 100 }}>
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
    { q: "Is my money safe with Handshake?", a: "Yes. All funds are held in a segregated DBS custodian account, fully regulated by the Monetary Authority of Singapore (MAS). Your money is separate from both the contractor and Handshake." },
    { q: "How much does it cost?", a: "Handshake is free for homeowners. The only fee is 2% for credit card payments — the lowest in the industry. Bank transfers are completely free." },
    { q: "Can I pay by credit card?", a: "Yes. You can pay by credit card at 2% and earn miles, cashback, or rewards. Bank transfer is also available at no cost." },
    { q: "What if my renovation hits a delay?", a: "If a milestone isn't completed to your satisfaction, funds stay in escrow. The Handshake team can mediate between you and your contractor." },
    { q: "How do I get started?", a: "Fill out the form below or contact us on WhatsApp. We'll walk you through the process and set up your escrow account." },
    { q: "Am I locked in once I sign up?", a: "No. You can opt out at any time. Handshake is designed to give you more control, not less." },
  ];

  return (
    <section className="py-[72px] md:py-[100px] bg-[#fcfcfc]">
      <div className="max-w-[700px] mx-auto px-4 md:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <SectionLabel text="FAQ" />
            <h2 className="text-[36px] md:text-[48px] font-semibold text-[#09090B] tracking-[-2.4px] leading-[1.05] mt-6">
              Common questions
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left bg-white border border-[#f0f0f0] p-5 md:p-6 cursor-pointer group hover:bg-[#fafafa] transition-colors"
                style={{ borderRadius: 14 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[16px] font-semibold text-[#09090B] tracking-[-0.3px]">{faq.q}</span>
                  <ChevronDown size={18} className={`text-[#5c5c5c] shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
                </div>
                {open === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-[14px] text-[#5c5c5c] leading-[1.6] mt-3 opacity-70">
                    {faq.a}
                  </motion.p>
                )}
              </button>
            </FadeIn>
          ))}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <section id="get-started" className="py-[72px] md:py-[100px] bg-[#141414]">
        <div className="max-w-[600px] mx-auto px-4 md:px-8 text-center">
          <div className="w-[64px] h-[64px] bg-[#FFA929] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-[32px] font-bold text-white tracking-[-1.5px]">You're in!</h2>
          <p className="text-[16px] text-white/50 leading-[1.6] mt-3">We'll reach out via WhatsApp within 24 hours to walk you through the next steps.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="get-started" className="py-[72px] md:py-[100px] bg-[#141414] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FFA929] opacity-[0.03] blur-[150px]" />

      <div className="max-w-[600px] mx-auto px-4 md:px-8 relative">
        <FadeIn>
          <div className="text-center mb-10">
            <SectionLabel text="Get started" dark />
            <h2 className="text-[32px] md:text-[40px] font-semibold text-white tracking-[-2px] leading-[1.1] mt-6">
              Protect your renovation today
            </h2>
            <p className="text-[15px] text-white/40 mt-3">Fill in a few details. We'll get back to you within 24 hours.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Your full name" required />
            <FormField label="WhatsApp" value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} placeholder="91234567" required />
            <FormField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@email.com" type="email" />
            <FormSelect label="Property Type" value={form.propertyType} onChange={v => setForm({ ...form, propertyType: v })}
              options={["HDB", "Condo", "Landed", "Commercial"]} />
            <FormSelect label="Budget" value={form.budget} onChange={v => setForm({ ...form, budget: v })}
              options={["Below $30,000", "$30,000 – $50,000", "$50,000 – $80,000", "$80,000 – $120,000", "Above $120,000"]} />
            <FormSelect label="Timeline" value={form.timeline} onChange={v => setForm({ ...form, timeline: v })}
              options={["Already have keys", "Within 3 months", "3 – 6 months", "6 – 12 months", "Just exploring"]} />
            <FormSelect label="Do you have a designer?" value={form.hasDesigner} onChange={v => setForm({ ...form, hasDesigner: v })}
              options={["Yes", "No, I need one", "Still deciding"]} />

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#FFA929] text-[#09090B] text-[15px] font-semibold hover:bg-[#ffb84d] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              style={{ borderRadius: 14 }}
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <>Protect My Renovation <ArrowRight size={16} /></>}
            </button>

            <p className="text-[11px] text-white/20 text-center mt-3">
              By submitting, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", required }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/60 mb-1.5">
        {label}{required && <span className="text-[#FFA929] ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full h-[44px] px-4 bg-white/[0.06] border border-white/[0.08] text-[14px] text-white placeholder:text-white/20 outline-none focus:border-[#FFA929] transition-colors"
        style={{ borderRadius: 12 }}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-white/60 mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full h-[44px] px-4 bg-white/[0.06] border border-white/[0.08] text-[14px] text-white outline-none focus:border-[#FFA929] transition-colors appearance-none cursor-pointer"
          style={{ borderRadius: 12 }}
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
// FOOTER
// ═══════════════════════════════════════════════════════════════════
function HandshakeFooter() {
  return (
    <footer className="bg-[#fcfcfc] py-12 border-t border-[#f0f0f0]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-[36px] h-[36px] bg-[#09090B] rounded-[10px] flex items-center justify-center">
              <span className="text-white text-[13px] font-bold">N</span>
            </div>
            <span className="text-[14px] text-[#5c5c5c]">Network x Handshake</span>
          </div>

          <p className="text-[12px] text-[#5c5c5c] opacity-50 text-center">
            Handshake is regulated by the Monetary Authority of Singapore (MAS). All funds are held in segregated DBS custodian accounts.
          </p>

          <div className="flex items-center gap-4">
            <a href="https://wa.me/6591234567" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#5c5c5c] hover:text-[#09090B] transition-colors cursor-pointer flex items-center gap-1.5">
              <Phone size={14} /> WhatsApp
            </a>
            <a href="mailto:hello@networksg.net" className="text-[13px] text-[#5c5c5c] hover:text-[#09090B] transition-colors cursor-pointer flex items-center gap-1.5">
              <Mail size={14} /> Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, Box, Paintbrush, ArrowRight, Check, X, ChevronDown,
  Eye, EyeOff, Calculator, Palette, Users, Loader2,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EditorPreviewAnimation } from "./EditorPreviewAnimation";
import { Navbar } from "./Navbar";
import { FooterSection } from "./FooterSection";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const AUTH_H = { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" };

const IMG_HERO = "https://images.unsplash.com/photo-1772208392358-19e96bee3a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMGRlc2lnbiUyMGxpdmluZyUyMHJvb20lMjB3YXJtJTIwbGlnaHRpbmd8ZW58MXx8fHwxNzczNTI4MTM4fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_STEP1 = "https://images.unsplash.com/photo-1610650394144-a778795cf585?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmUlMjBmbG9vciUyMHBsYW4lMjBibHVlcHJpbnQlMjBkZXNrfGVufDF8fHx8MTc3MzUyODEzOHww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_STEP2 = "https://images.unsplash.com/photo-1758193431353-87812fbff5cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzRCUyMGFyY2hpdGVjdHVyYWwlMjByZW5kZXJpbmclMjBtb2Rlcm4lMjBhcGFydG1lbnR8ZW58MXx8fHwxNzczNTI4MTM5fDA&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TOOL1 = "https://images.unsplash.com/photo-1768321911908-01c691fcc5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW5vdmF0aW9uJTIwY2FsY3VsYXRvciUyMGhvbWUlMjBpbnRlcmlvciUyMHRvb2xzfGVufDF8fHx8MTc3MzUyODEzOXww&ixlib=rb-4.1.0&q=80&w=1080";
const IMG_TOOL2 = "https://images.unsplash.com/photo-1695634184046-93d24e779ea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMHN0eWxlJTIwcXVpeiUyMG1vb2QlMjBib2FyZHxlbnwxfHx8fDE3NzM1MjgxMzl8MA&ixlib=rb-4.1.0&q=80&w=1080";

const KEY_PERIODS = ["Keys Collected", "Within 3 months", "3-6 months", "6-12 months", "More than 12 months"];

/* ─── Pill CTA Button (double-layer) ─── */
function PillCTA({ label, onClick, size = "medium" }: { label: string; onClick?: () => void; size?: "small" | "medium" | "large" }) {
  const s = { small: "h-[56px] px-6", medium: "h-[70px] px-8", large: "h-[70px] px-10" }[size];
  return (
    <button onClick={onClick} className="bg-[#F6F6F6] border border-white rounded-[100px] p-[6px] shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.17)]">
      <div className={`bg-[#09090B] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center gap-3 ${s}`}>
        <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-white tracking-[-0.7px] whitespace-nowrap">{label}</span>
        <ArrowRight className="size-[18px] text-white" strokeWidth={2} />
      </div>
    </button>
  );
}

function SectionPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center bg-[#F6F6F6] border border-white rounded-[100px] px-5 py-2 mb-6">
      <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#09090B] tracking-[-0.8px]">{label}</span>
    </div>
  );
}

/* ─── Signup / Login Modal ─── */
function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ name: "", email: "", contactNumber: "", password: "", keyCollectionPeriod: "", wantIdShortlist: true });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSignup = useCallback(async () => {
    if (!form.name || !form.email || !form.password || !form.contactNumber || !form.keyCollectionPeriod) { setError("All fields are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/fp3d/signup`, { method: "POST", headers: AUTH_H, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      // Auto login after signup
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (loginErr) { setError("Account created, but login failed. Please log in manually."); setLoading(false); return; }
      // Also create homeowner session so profile page works
      try {
        const hRes = await fetch(`${API}/homeowner-login`, { method: "POST", headers: AUTH_H, body: JSON.stringify({ email: form.email, password: form.password }) });
        const hJson = await hRes.json();
        if (hJson.token) {
          localStorage.setItem("homeowner-token", hJson.token);
          localStorage.setItem("homeowner-userId", hJson.userId);
          localStorage.setItem("homeowner-profile-cache", JSON.stringify({ name: form.name || hJson.profile?.name || "", email: form.email, avatar: "" }));
          window.dispatchEvent(new Event("homeowner-auth-changed"));
        }
      } catch {}
      navigate("/floorplan3d/dashboard");
    } catch (e: any) { setError(e.message || "Network error"); }
    setLoading(false);
  }, [form, navigate]);

  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setLoading(true); setError("");
    try {
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (loginErr) { setError(loginErr.message); setLoading(false); return; }
      // Also create homeowner session so profile page works
      try {
        const hRes = await fetch(`${API}/homeowner-login`, { method: "POST", headers: AUTH_H, body: JSON.stringify({ email: form.email, password: form.password }) });
        const hJson = await hRes.json();
        if (hJson.token) {
          localStorage.setItem("homeowner-token", hJson.token);
          localStorage.setItem("homeowner-userId", hJson.userId);
          localStorage.setItem("homeowner-profile-cache", JSON.stringify({ name: hJson.profile?.name || "", email: form.email, avatar: "" }));
          window.dispatchEvent(new Event("homeowner-auth-changed"));
        }
      } catch {}
      navigate("/floorplan3d/dashboard");
    } catch (e: any) { setError(e.message || "Network error"); }
    setLoading(false);
  }, [form, navigate]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }} className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[480px] max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="font-['Inter',sans-serif] font-bold text-[24px] text-[#09090B] tracking-[-1.2px]">
                  {mode === "signup" ? "Create Your Account" : "Welcome Back"}
                </h2>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] mt-1">
                  {mode === "signup" ? (
                    <>Have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-[#09090B] underline">Login</button></>
                  ) : (
                    <>Don't have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-[#09090B] underline">Sign Up</button></>
                  )}
                </p>
              </div>
              <button onClick={onClose} className="size-[36px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors">
                <X className="size-[18px] text-[#71717A]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-[14px] p-3 font-['Inter',sans-serif] text-[13px] text-red-600">{error}</div>}

              {mode === "signup" && (
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Name</label>
                  <input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Your full name"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { handleSignup(); } }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                </div>
              )}

              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Email</label>
                <input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@example.com"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { mode === "signup" ? handleSignup() : handleLogin(); } }}
                  className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Contact Number</label>
                  <input type="tel" value={form.contactNumber} onChange={(e) => upd("contactNumber", e.target.value)} placeholder="91234567"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { handleSignup(); } }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                </div>
              )}

              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder="Min 6 characters"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { mode === "signup" ? handleSignup() : handleLogin(); } }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 pr-12 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPw ? <EyeOff className="size-[18px] text-[#99A1AF]" /> : <Eye className="size-[18px] text-[#99A1AF]" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Key Collection Period</label>
                    <div className="relative">
                      <select value={form.keyCollectionPeriod} onChange={(e) => upd("keyCollectionPeriod", e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { handleSignup(); } }}
                        className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 pr-10 font-['Inter',sans-serif] text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none">
                        <option value="">Select period</option>
                        {KEY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99A1AF] pointer-events-none" />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <div className={`size-[20px] rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${form.wantIdShortlist ? "bg-[#09090B] border-[#09090B]" : "bg-white border-[#E5E7EB]"}`}
                      onClick={() => upd("wantIdShortlist", !form.wantIdShortlist)}>
                      {form.wantIdShortlist && <Check className="size-[12px] text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-['Inter',sans-serif] text-[14px] text-[#09090B]">
                      Get a shortlist of Interior Designers <span className="bg-[#FFF6DC] border border-[#FFEAB1] rounded-[100px] px-2 py-0.5 text-[12px] font-bold ml-1">FREE</span>
                    </span>
                  </label>
                </>
              )}

              <button onClick={mode === "signup" ? handleSignup : handleLogin} disabled={loading}
                className="w-full h-[48px] bg-[#09090B] rounded-[14px] font-['Inter',sans-serif] font-semibold text-[14px] text-white tracking-[-0.35px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mt-2">
                {loading ? <Loader2 className="size-[18px] animate-spin" /> : null}
                {mode === "signup" ? "Create Account" : "Log In"}
              </button>

              <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] text-center mt-1">
                By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── Hero ─── */
function HeroSection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-[160px] md:pt-[220px] pb-[80px] md:pb-[100px] px-4 md:px-8 text-center">
      <div className="inline-flex items-center bg-[#FFF6DC] border border-[#FFEAB1] rounded-[100px] px-5 py-2 shadow-[0px_8px_33.4px_0px_rgba(0,0,0,0.18)] mb-8">
        <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-[#09090B] tracking-[-0.8px]">
          <span className="font-bold">AI-Powered</span> Floor Plan to 3D
        </span>
      </div>
      <h1 className="font-['Inter',sans-serif] font-semibold text-[36px] sm:text-[48px] md:text-[80px] text-[#09090B] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-4px] leading-[1.05] mb-0">Visualize Your Space</h1>
      <p className="font-['Inter',sans-serif] font-medium text-[36px] sm:text-[48px] md:text-[80px] text-[#71717A] tracking-[-2px] sm:tracking-[-2.8px] md:tracking-[-4.8px] leading-[1.05] mb-6 md:mb-8">Before You Renovate</p>
      <div className="max-w-[637px] mx-auto mb-10">
        <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717A] leading-[1.6]">
          Upload any floor plan, convert it to 3D, stage furniture, and customize finishes — all in your browser. Connect with trusted designers when you're ready.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <PillCTA label="Start Free Project" size="large" onClick={onSignup} />
      </div>
      <div className="max-w-[1170px] mx-auto relative">
        <div className="rounded-[29px] overflow-hidden border border-[#E5E7EB] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.15)]">
          <EditorPreviewAnimation />
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center mt-6">
          {[{ l: "Projects Created", v: "12,400+" }, { l: "Renders Generated", v: "48,000+" }, { l: "Active Users", v: "3,200+" }].map((s) => (
            <div key={s.l} className="bg-white border border-[#F3F4F6] rounded-[100px] px-3 md:px-5 py-1.5 md:py-2.5 shadow-[0px_8px_20px_rgba(0,0,0,0.05)]">
              <span className="font-['Inter',sans-serif] font-bold text-[12px] md:text-[14px] text-[#09090B] tracking-[-0.5px]">{s.v}</span>
              <span className="font-['Inter',sans-serif] text-[10px] md:text-[12px] text-[#71717A] ml-1 md:ml-1.5">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works (3-step) ─── */
function HowItWorksSection() {
  const steps = [
    { icon: Upload, num: "01", title: "Upload or Choose a Floor Plan", desc: "Drag and drop your PNG, JPG, or PDF file. Or select from our library of HDB and condo templates. Our AI parses room layouts automatically.", img: IMG_STEP1 },
    { icon: Box, num: "02", title: "Customize Layout in 3D", desc: "Stage furniture from our catalog, swap wall paint, floor materials, and adjust lighting. Move through rooms with orbit and pan controls.", img: IMG_STEP2 },
    { icon: Paintbrush, num: "03", title: "Save & Share with Your ID", desc: "Save your project, generate photorealistic renders, and share directly with interior designers. Get matched with vetted IDs for free.", img: IMG_HERO },
  ];
  return (
    <section id="how-it-works" className="py-[80px] md:py-[100px] px-4 md:px-8 bg-[#F6F6F6]">
      <div className="max-w-[1170px] mx-auto">
        <div className="text-center mb-14">
          <SectionPill label="How It Works" />
          <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] text-[#09090B] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1] mb-4">Three Simple Steps</h2>
          <p className="font-['Inter',sans-serif] font-medium text-[28px] sm:text-[36px] md:text-[48px] text-[#71717A] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1]">Plan to Perfection</p>
        </div>
        <div className="flex flex-col gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }} className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center`}>
              <div className="w-full md:w-1/2 rounded-[17px] overflow-hidden">
                <ImageWithFallback src={step.img} alt={step.title} className="w-full h-[260px] md:h-[340px] object-cover" />
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <div className="size-[56px] rounded-[14px] bg-[#09090B] flex items-center justify-center mb-5">
                  <step.icon className="size-[24px] text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[24px] text-[#09090B] tracking-[-1.2px] leading-[1.2] mb-3">{step.title}</h3>
                <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717A] leading-[1.6] max-w-[440px]">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Value Props / Cross-Sell ─── */
function ValuePropsSection() {
  const navigate = useNavigate();
  const cards = [
    { icon: Calculator, title: "Renovation Cost Guide", desc: "Estimate your renovation budget based on property type, room count, and design style. Get a detailed breakdown before committing.", cta: "Calculate Now", href: "/cost-guide", img: IMG_TOOL1 },
    { icon: Palette, title: "Style Quiz & ID Matching", desc: "Discover your interior design style and get matched with vetted designers who specialize in it. 100% free, no obligation.", cta: "Take the Quiz", href: "/get-matched", img: IMG_TOOL2 },
    { icon: Users, title: "Designer Directory", desc: "Browse verified interior designers in Singapore. Compare portfolios, read reviews, and request quotes directly.", cta: "Browse Designers", href: "/designers", img: IMG_HERO },
  ];
  return (
    <section id="tools" className="py-[80px] md:py-[100px] px-4 md:px-8">
      <div className="max-w-[1170px] mx-auto">
        <div className="text-center mb-14">
          <SectionPill label="Free Tools" />
          <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] text-[#09090B] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1] mb-4">Plan Smarter With</h2>
          <p className="font-['Inter',sans-serif] font-medium text-[28px] sm:text-[36px] md:text-[48px] text-[#71717A] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1]">Our Free Tools</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <motion.div key={c.title} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
              className="bg-white border border-[#F3F4F6] rounded-[17px] overflow-hidden shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] group cursor-pointer"
              onClick={() => navigate(c.href)}>
              <div className="h-[180px] overflow-hidden">
                <ImageWithFallback src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-[29px]">
                <div className="size-[48px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center mb-4">
                  <c.icon className="size-[22px] text-[#09090B]" strokeWidth={1.5} />
                </div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090B] tracking-[-0.5px] leading-[1.2] mb-3">{c.title}</h3>
                <p className="font-['Inter',sans-serif] text-[14px] text-[#747474] leading-[1.6] mb-5">{c.desc}</p>
                <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] tracking-[-0.3px] flex items-center gap-2 group-hover:gap-3 transition-all">
                  {c.cta} <ArrowRight className="size-[16px]" strokeWidth={2} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Lead Capture Form ─── */
function LeadCaptureSection() {
  const [form, setForm] = useState({ name: "", email: "", contactNumber: "", keyCollectionPeriod: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.contactNumber) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API}/fp3d/lead`, { method: "POST", headers: AUTH_H, body: JSON.stringify(form) });
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); }
  };

  return (
    <section className="py-[80px] md:py-[100px] px-4 md:px-8 bg-[#F6F6F6]">
      <div className="max-w-[700px] mx-auto">
        <div className="text-center mb-10">
          <SectionPill label="Get Matched" />
          <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] text-[#09090B] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1] mb-4">Want Designer Recommendations?</h2>
          <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717A] leading-[1.6]">
            Leave your details and we'll match you with verified interior designers based on your style, budget, and timeline. Completely free, no obligation.
          </p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] p-[29px]">
          {status === "success" ? (
            <div className="text-center py-6">
              <div className="size-[56px] rounded-full bg-[#09090B] flex items-center justify-center mx-auto mb-4">
                <Check className="size-[24px] text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090B] tracking-[-0.5px] mb-2">Thank you!</h3>
              <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">We'll be in touch with your personalized designer shortlist.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                </div>
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Contact Number</label>
                  <input type="tel" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="91234567"
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors" />
                </div>
                <div>
                  <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-[6px] block">Key Collection Period</label>
                  <div className="relative">
                    <select value={form.keyCollectionPeriod} onChange={(e) => setForm({ ...form, keyCollectionPeriod: e.target.value })}
                      className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 pr-10 font-['Inter',sans-serif] text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none">
                      <option value="">Select period</option>
                      {KEY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99A1AF] pointer-events-none" />
                  </div>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={status === "loading"}
                className="w-full h-[48px] bg-[#09090B] rounded-[14px] font-['Inter',sans-serif] font-semibold text-[14px] text-white tracking-[-0.35px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mt-2">
                {status === "loading" ? <Loader2 className="size-[18px] animate-spin" /> : null}
                Get My Free Shortlist
              </button>
              {status === "error" && <p className="font-['Inter',sans-serif] text-[13px] text-red-500 text-center">Something went wrong. Please try again.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "What file types are supported?", a: "We support PNG, JPG, BMP, and WebP images of floor plans. Our AI automatically detects walls, doors, windows, and room boundaries from the image." },
    { q: "Can I save and come back to my project?", a: "Yes! All projects are automatically saved to your account. You can access them from your dashboard at any time, rename them, or duplicate them." },
    { q: "How do I share my project with a designer?", a: "From the 3D editor, you can export photorealistic renders or share a direct link to your project. Matched designers can view your layout directly." },
    { q: "Is it really free?", a: "The core 3D planner is free to use. You can upload floor plans, stage furniture, customize materials, and save projects at no cost. Premium features like Ultra renders are available on paid plans." },
    { q: "What HDB layouts are supported?", a: "We support all standard HDB layouts including 2-Room, 3-Room, 4-Room, 5-Room, and Executive types. You can also upload custom floor plans for condos and landed properties." },
    { q: "Can I upload DWG files?", a: "DWG support is in development. Currently we support image-based floor plans (PNG, JPG). DWG files will be automatically converted using our server-side pipeline." },
  ];
  return (
    <section id="faq" className="py-[80px] md:py-[100px] px-4 md:px-8">
      <div className="max-w-[1170px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="lg:w-[380px] shrink-0">
            <SectionPill label="FAQs" />
            <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] sm:text-[36px] md:text-[48px] text-[#09090B] tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.4px] leading-[1.1] mb-4">Got Questions?</h2>
            <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717A] leading-[1.6]">
              Everything you need to know about FloorPlan3D. Can&apos;t find an answer? Reach out to our support team.
            </p>
          </div>
          <div className="flex-1">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#E5E7EB]">
                <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left">
                  <span className="font-['Inter',sans-serif] font-semibold text-[18px] md:text-[20px] text-[#09090B] tracking-[-0.5px] pr-4">{faq.q}</span>
                  <div className="size-[32px] rounded-full bg-[#F6F6F6] flex items-center justify-center shrink-0">
                    <motion.span animate={{ rotate: openIndex === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="font-['Inter',sans-serif] text-[20px] text-[#09090B] leading-none">+</motion.span>
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717A] leading-[1.6] pb-6">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ─��─ Main Landing Page ─── */
export function FloorPlan3DLanding() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const openSignup = useCallback(async () => {
    // If already logged in via homeowner token, validate it first
    const hToken = localStorage.getItem("homeowner-token");
    if (hToken) {
      try {
        const sRes = await fetch(`${API}/homeowner-session`, { headers: { ...AUTH_H, "X-Homeowner-Token": hToken } });
        if (sRes.ok) { navigate("/floorplan3d/dashboard"); return; }
        // Token invalid — clean up stale data
        localStorage.removeItem("homeowner-token");
        localStorage.removeItem("homeowner-userId");
        localStorage.removeItem("homeowner-profile-cache");
        localStorage.removeItem("homeowner-full-cache");
      } catch {}
    }
    // Check Supabase session — use refreshSession to verify it's actually valid, not just cached
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data?.session) { navigate("/floorplan3d/dashboard"); return; }
    } catch {}
    // No valid session — sign out to clear any stale cache, then show auth modal
    try { await supabase.auth.signOut(); } catch {}
    setShowAuth(true);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      <Navbar />
      <HeroSection onSignup={openSignup} />
      <HowItWorksSection />
      <ValuePropsSection />
      <LeadCaptureSection />
      <FAQSection />
      <FooterSection showCTA={false} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
import { useState, useCallback, useRef } from "react";
import { isValid8DigitPhone, PHONE_ERROR_MESSAGE } from "../utils/phone-validation";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { sanitizeInput, sanitizeEmail } from "../utils/sanitize";
import { recordAttribution } from "../utils/attribution";
// FloorPlan3DLanding — updated
import { motion, AnimatePresence, useInView, useReducedMotion } from "motion/react";
import {
  Upload, Box, Paintbrush, ArrowRight, Check, X, ChevronDown,
  Eye, EyeOff, Calculator, Palette, Users, Loader2,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EditorPreviewAnimation } from "./EditorPreviewAnimation";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { Seo } from "./shared/Seo";
import { HomepageNav } from "./shared/HomepageNav";
import { HomepageFooter } from "./shared/HomepageFooter";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const AUTH_H = { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" };

const IMG_HERO = "/r6.webp";
const IMG_STEP1 = "/r4.webp";
const IMG_STEP2 = "/r1.webp";

const KEY_PERIODS = ["Keys Collected", "Within 3 months", "3-6 months", "6-12 months", "More than 12 months"];

/* ═══════════════════════════════════════════════════════════════════════════
   Design Tokens — from GUIDELINES.md
   ═══════════════════════════════════════════════════════════════════════════ */
const C = {
  cream: "#f0ede6",
  creamDark: "#e8e4db",
  creamBorder: "#d8d3c8",
  black: "#0f0f0d",
  gray: "#6b6860",
  grayLight: "#9a9790",
  white: "#fafaf8",
  footerDark: "#0f0f0d",
} as const;

const serif = "'EB Garamond', Georgia, serif";
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ═══════════════════════════════════════════════════════════════════════════
   Primitives
   ═══════════════════════════════════════════════════════════════════════════ */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  return (
    <motion.div ref={ref}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: reduce ? 0 : delay, ease: "ease" }}
      className={className}
    >{children}</motion.div>
  );
}

function TagLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em",
      textTransform: "uppercase", color: C.grayLight, fontFamily: sans,
    }}>{children}</p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Auth Modal — restyled to Guidelines
   ═══════════════════════════════════════════════════════════════════════════ */
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
    if (!isValid8DigitPhone(form.contactNumber)) { setError(PHONE_ERROR_MESSAGE); return; }
    setLoading(true); setError("");
    try {
      const sanitizedForm = { ...form, name: sanitizeInput(form.name || "", 100), email: sanitizeEmail(form.email || ""), contactNumber: sanitizeInput(form.contactNumber || "", 20) };
      const res = await fetch(`${API}/fp3d/signup`, { method: "POST", headers: AUTH_H, body: JSON.stringify(sanitizedForm) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (loginErr) { setError("Account created, but login failed. Please log in manually."); setLoading(false); return; }
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

  const inputStyle = { background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(15,15,13,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[480px] max-h-[90vh] overflow-auto"
            style={{ background: C.white, borderRadius: "12px", border: `1px solid ${C.creamBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-[24px] font-normal leading-[1.2]" style={{ fontFamily: serif, color: C.black }}>
                  {mode === "signup" ? "Create Your Account" : "Welcome Back"}
                </h2>
                <p className="text-[14px] font-normal mt-1" style={{ color: C.grayLight, fontFamily: sans }}>
                  {mode === "signup" ? (
                    <>Have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }} className="font-semibold underline cursor-pointer" style={{ color: C.black }}>Login</button></>
                  ) : (
                    <>Don't have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold underline cursor-pointer" style={{ color: C.black }}>Sign Up</button></>
                  )}
                </p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-60 cursor-pointer" style={{ transition: "all 0.15s" }}>
                <X className="w-[18px] h-[18px]" style={{ color: C.grayLight }} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {error && <div className="p-3 text-[13px]" style={{ background: "#fdf2f2", border: "1px solid #fecaca", borderRadius: "10px", color: "#dc2626", fontFamily: sans }}>{error}</div>}

              {mode === "signup" && (
                <div>
                  <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Name</label>
                  <input required value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Your full name"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSignup(); }}
                    className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                </div>
              )}

              <div>
                <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Email</label>
                <input type="email" required value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@example.com"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { mode === "signup" ? handleSignup() : handleLogin(); } }}
                  className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Contact Number</label>
                  <input type="tel" required value={form.contactNumber} onChange={(e) => upd("contactNumber", e.target.value)} placeholder="91234567"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSignup(); }}
                    className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                </div>
              )}

              <div>
                <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} required value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder="Min 6 characters"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading) { mode === "signup" ? handleSignup() : handleLogin(); } }}
                    className="w-full h-[48px] px-4 pr-12 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                    {showPw ? <EyeOff className="w-[18px] h-[18px]" style={{ color: C.grayLight }} /> : <Eye className="w-[18px] h-[18px]" style={{ color: C.grayLight }} />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Key Collection Period</label>
                    <div className="relative">
                      <select required value={form.keyCollectionPeriod} onChange={(e) => upd("keyCollectionPeriod", e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSignup(); }}
                        className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none appearance-none" style={inputStyle}>
                        <option value="">Select period</option>
                        {KEY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.grayLight }} />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input type="checkbox" checked={form.wantIdShortlist} onChange={(e) => upd("wantIdShortlist", e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#0f0f0d] shrink-0" />
                    <span className="text-[14px]" style={{ color: C.black, fontFamily: sans }}>
                      Get a shortlist of Interior Designers <span style={{ background: "#fdf8e8", border: "1px solid #ffeab1", borderRadius: "100px", padding: "2px 8px", fontSize: "12px", fontWeight: 700, marginLeft: "4px" }}>FREE</span>
                    </span>
                  </label>
                </>
              )}

              <button onClick={mode === "signup" ? handleSignup : handleLogin} disabled={loading}
                className="w-full h-[60px] mt-2 text-[16px] font-normal hover:opacity-85 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, letterSpacing: "0.01em", transition: "all 0.15s" }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {mode === "signup" ? "Create Account" : "Log In"}
              </button>

              <p className="text-[12px] font-normal text-center mt-1" style={{ color: C.grayLight, fontFamily: sans }}>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="relative pt-[140px] md:pt-[200px] pb-[80px] md:pb-[100px] px-6 md:px-10 text-center">
      {/* Pill badge */}
      <FadeIn className="mb-8">
        <div className="inline-flex items-center px-5 py-2.5" style={{ background: "#fdf8e8", borderRadius: "100px" }}>
          <span className="text-[13px] font-normal" style={{ color: C.black, fontFamily: sans }}>
            <span className="font-bold">AI-Powered</span> Floor Plan to 3D
          </span>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <h1 className="leading-[1.1] mb-6 md:mb-8">
          <span className="block text-[36px] sm:text-[48px] md:text-[64px] lg:text-[72px] font-normal" style={{ fontFamily: serif, color: C.black }}>
            Visualize Your Space
          </span>
          <span className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[72px] font-normal italic" style={{ fontFamily: serif, color: C.grayLight }}>
            Before You Renovate
          </span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="max-w-[560px] mx-auto mb-10">
          <p className="text-[14px] md:text-[16px] font-normal leading-[1.7]" style={{ color: C.gray, fontFamily: sans }}>
            Upload any floor plan, convert it to 3D, stage furniture, and customize finishes — all in your browser. Connect with trusted designers when you're ready.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.15} className="mb-16">
        <button onClick={onSignup}
          className="h-[60px] px-10 text-[16px] font-normal hover:opacity-85 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-3"
          style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
          Start Free Project <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="max-w-[1170px] mx-auto">
          <div className="overflow-hidden" style={{ borderRadius: "12px", border: `1px solid ${C.creamBorder}` }}>
            <EditorPreviewAnimation />
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   How It Works (3-step)
   ═══════════════════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { icon: Upload, num: "01", title: "Upload or Choose a Floor Plan", eyebrow: "UPLOAD YOUR PLAN", desc: "Drag and drop your PNG, JPG, or PDF file. Or select from our library of HDB and condo templates. Our AI parses room layouts automatically.", img: IMG_STEP1 },
    { icon: Box, num: "02", title: "Customize Layout in 3D", eyebrow: "CUSTOMIZE IN 3D", desc: "Stage furniture from our catalog, swap wall paint, floor materials, and adjust lighting. Move through rooms with orbit and pan controls.", img: IMG_STEP2 },
    { icon: Paintbrush, num: "03", title: "Save & Share with Your ID", eyebrow: "SAVE & SHARE", desc: "Save your project, generate photorealistic renders, and share directly with interior designers. Get matched with vetted IDs for free.", img: IMG_HERO },
  ];
  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ background: C.creamDark }}>
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>How it works</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-14">
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1]" style={{ fontFamily: serif, color: C.black }}>
            Three Simple Steps
          </h2>
          <p className="text-[28px] md:text-[36px] lg:text-[44px] font-normal italic leading-[1.1] mt-1" style={{ fontFamily: serif, color: C.grayLight }}>
            Plan to Perfection
          </p>
        </FadeIn>

        <div className="flex flex-col gap-16 md:gap-20">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.05}>
              <div className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-12 items-center`}>
                <div className="w-full md:w-1/2 overflow-hidden" style={{ borderRadius: "12px" }}>
                  <ImageWithFallback src={step.img} alt={step.title} className="w-full h-[260px] md:h-[380px] object-cover" />
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <div className="flex gap-6 md:gap-8">
                    <div className="text-[64px] md:text-[80px] font-normal leading-[0.85] shrink-0" style={{ fontFamily: serif, color: C.creamBorder, minWidth: "70px" }}>
                      {step.num}
                    </div>
                    <div>
                      <p className="mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>
                        {step.eyebrow}
                      </p>
                      <h3 className="text-[24px] md:text-[28px] font-normal leading-[1.2] mb-4" style={{ fontFamily: serif, color: C.black }}>
                        {step.title}
                      </h3>
                      <p className="text-[14px] font-normal leading-[1.7] max-w-[440px]" style={{ color: C.gray, fontFamily: sans }}>{step.desc}</p>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Lead Capture Form
   ═══════════════════════════════════════════════════════════════════════════ */
function LeadCaptureSection() {
  const [form, setForm] = useState({ name: "", email: "", contactNumber: "", keyCollectionPeriod: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.contactNumber) return;
    setStatus("loading");
    try {
      // Save to Supabase
      const { error } = await supabase.from("homepage_leads").insert({
        name: form.name,
        email: form.email,
        phone: form.contactNumber,
        key_date: form.keyCollectionPeriod || null,
        source: "Floor Plan Landing",
      });
      if (error) throw error;
      setStatus("success");
      recordAttribution("homepage-lead", form.email);
    } catch { setStatus("error"); }
  };

  const inputStyle = { background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans };

  return (
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]" style={{ background: C.creamDark }}>
      <div className="max-w-[700px] mx-auto">
        <FadeIn className="text-center mb-10">
          <TagLabel>Get matched</TagLabel>
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1] mt-6 mb-5" style={{ fontFamily: serif, color: C.black }}>
            Want Designer Recommendations?
          </h2>
          <p className="text-[14px] font-normal leading-[1.7]" style={{ color: C.gray, fontFamily: sans }}>
            Leave your details and we'll match you with verified interior designers based on your style, budget, and timeline. Completely free, no obligation.
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="p-7 md:p-8" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
            {status === "success" ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: C.black }}>
                  <Check className="w-[22px] h-[22px] text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-[24px] font-normal mb-2" style={{ fontFamily: serif, color: C.black }}>Thank you!</h3>
                <p className="text-[14px] font-normal" style={{ color: C.gray, fontFamily: sans }}>We'll be in touch with your personalized designer shortlist.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"
                      className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
                      className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Contact Number</label>
                    <input type="tel" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} placeholder="91234567"
                      className="w-full h-[48px] px-4 text-[14px] font-normal focus-visible:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Key Collection Period</label>
                    <div className="relative">
                      <select value={form.keyCollectionPeriod} onChange={(e) => setForm({ ...form, keyCollectionPeriod: e.target.value })}
                        className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none appearance-none" style={inputStyle}>
                        <option value="">Select period</option>
                        {KEY_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.grayLight }} />
                    </div>
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={status === "loading"}
                  className="w-full h-[60px] mt-2 text-[16px] font-normal hover:opacity-85 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
                  {status === "loading" ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Get My Free Shortlist
                </button>
                {status === "error" && <p className="text-[13px] text-center" style={{ color: "#dc2626", fontFamily: sans }}>Something went wrong. Please try again.</p>}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════════════════ */
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
    <section className="px-6 md:px-10 py-[80px] md:py-[100px]">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-6">
          <TagLabel>FAQs</TagLabel>
        </FadeIn>
        <FadeIn delay={0.05} className="text-center mb-4">
          <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1]" style={{ fontFamily: serif, color: C.black }}>
            Got Questions?
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} className="text-center mb-14">
          <p className="text-[14px] font-normal leading-[1.7]" style={{ color: C.grayLight, fontFamily: sans }}>
            Everything you need to know about FloorPlan3D.
          </p>
        </FadeIn>

        <div className="max-w-[760px] mx-auto">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.02}>
              <div style={{ borderBottom: `1px solid ${C.creamBorder}` }}>
                <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full text-left py-6 cursor-pointer group flex items-center justify-between gap-6 hover:opacity-70"
                  aria-expanded={openIndex === i}
                  style={{ transition: "all 0.15s" }}>
                  <span className="text-[17px] md:text-[20px] font-normal leading-[1.3]" style={{ fontFamily: serif, color: C.black }}>{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[20px] shrink-0 w-7 h-7 flex items-center justify-center"
                    style={{ color: C.grayLight }}>+</motion.span>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="text-[14px] font-normal leading-[1.7] pb-6 max-w-[560px]" style={{ color: C.gray, fontFamily: sans }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer CTA
   ═══════════════════════════════════════════════════════════════════════════ */
function FooterCTASection({ onSignup }: { onSignup: () => void }) {
  return (
    <section className="px-6 md:px-10 pb-10">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn>
          <div className="px-8 py-16 md:px-16 md:py-20 text-center" style={{ background: C.footerDark, borderRadius: "12px" }}>
            <TagLabel><span style={{ color: "rgba(255,255,255,0.4)" }}>Get started</span></TagLabel>
            <h2 className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1] mt-6 mb-5" style={{ fontFamily: serif, color: "#ffffff" }}>
              Ready to visualize your space?
            </h2>
            <p className="text-[14px] font-normal leading-[1.7] max-w-[480px] mx-auto mb-10" style={{ color: "rgba(255,255,255,0.55)", fontFamily: sans }}>
              Start your free project today. Upload a floor plan, customize in 3D, and connect with trusted designers.
            </p>
            <button onClick={onSignup}
              className="h-[60px] px-9 text-[16px] font-normal hover:opacity-90 active:scale-[0.98] cursor-pointer"
              style={{ background: "#ffffff", color: C.footerDark, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
              Start Free Project
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════════════════ */
function FooterNav() {
  return (
    <footer className="px-6 md:px-10 py-10 md:py-14">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <a href="/" className="block shrink-0" style={{
              width: "110px", height: "23px", background: C.black,
              maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
              WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
            }} />
            <div className="flex items-center gap-6">
              {[{ label: "Home", href: "/" }, { label: "Room Designer", href: "/render-tool" }, { label: "Layout Planner", href: "/floorplan3d" }, { label: "Cost Guide", href: "/cost-guide" }, { label: "Handshake", href: "/networkxhandshake" }].map((link) => (
                <a key={link.label} href={link.href}
                  className="text-[13px] font-normal hover:opacity-60 cursor-pointer"
                  style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}>{link.label}</a>
              ))}
            </div>
          </div>
          <span className="text-[12px] font-normal" style={{ color: C.grayLight, fontFamily: sans }}>
            Copyright &copy; 2026. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function FloorPlan3DLanding() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const openSignup = useCallback(async () => {
    const hToken = localStorage.getItem("homeowner-token");
    if (hToken) {
      try {
        const sRes = await fetch(`${API}/homeowner-session`, { headers: { ...AUTH_H, "X-Homeowner-Token": hToken } });
        if (sRes.ok) { navigate("/floorplan3d/dashboard"); return; }
        localStorage.removeItem("homeowner-token");
        localStorage.removeItem("homeowner-userId");
        localStorage.removeItem("homeowner-profile-cache");
        localStorage.removeItem("homeowner-full-cache");
      } catch {}
    }
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data?.session) { navigate("/floorplan3d/dashboard"); return; }
    } catch {}
    try { await supabase.auth.signOut(); } catch {}
    setShowAuth(true);
  }, [navigate]);

  return (
    <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>
      <Seo
        title="3D Floor Plan & Layout Planner | Network"
        description="Plan your renovation in 3D. Sketch your layout, drop in furniture, and visualise your home before signing with a designer. Free for Singapore homeowners."
        canonical="/floorplan3d"
      />
      {/* Navbar */}
      <HomepageNav onCtaClick={openSignup} ctaLabel="Start Free" />

      <HeroSection onSignup={openSignup} />

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10">
        <div className="h-[1px]" style={{ background: C.creamBorder }} />
      </div>

      <HowItWorksSection />

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10">
        <div className="h-[1px]" style={{ background: C.creamBorder }} />
      </div>

      <LeadCaptureSection />

      {/* Divider */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-10">
        <div className="h-[1px]" style={{ background: C.creamBorder }} />
      </div>

      <FAQSection />

      <FooterCTASection onSignup={openSignup} />
      <HomepageFooter />

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

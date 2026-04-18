import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, serif, sans, FadeIn, TagLabel } from "../primitives";
import { HERO, QUALIFYING_QUESTIONS, COMPLETION, TESTIMONIALS } from "../../content";
import { useHomeownerCount } from "../useHomeownerCount";
import type { FormState, LeadFormData } from "../../types";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sendToZapier } from "@/app/utils/zapier";

import photo1 from "figma:asset/607f6408c4c8fd9005fe7498e2284a7b2995acda.png";
import photo2 from "figma:asset/561c829472a0cac14a59bfb33e444dc4e0ed8350.png";
import photo3 from "figma:asset/bc9ffe9973654a94a381c863292fc3780b81397b.png";
import heroPhoto from "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png";

/* ── Qualifying Flow ── */
function QualifyingFlow({ onComplete }: { onComplete: (answers: Record<string, string>) => void }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [consent, setConsent] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const question = QUALIFYING_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / 7) * 100;

  const ANSWER_KEYS = ["situation", "timeline", "home_type", "design_level", "biggest_concern", "is_decision_maker", "meeting_preference"];

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    const label = question.options[idx].label;
    const reveal = question.options[idx].reveal || "";
    const newAnswers = { ...answers, [ANSWER_KEYS[currentQ]]: label };
    if (reveal) newAnswers.budget_range = reveal;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    if (currentQ < 6) {
      setDirection(1);
      setSelectedOption(null);
      setCurrentQ(q => q + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) { setDirection(-1); setSelectedOption(null); setCurrentQ(q => q - 1); }
  };

  return (
    <div className="w-full max-w-[580px] mx-auto p-8 md:p-10"
      style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
      <div className="w-full h-[2px] rounded-full mb-8 overflow-hidden" style={{ background: C.creamBorder }}>
        <motion.div className="h-full rounded-full" style={{ background: C.black }} initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleBack} disabled={currentQ === 0}
          className="text-[13px] font-normal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 hover:opacity-60"
          style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Back
        </button>
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>{question.questionNumber} of {question.totalQuestions}</span>
      </div>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={currentQ} custom={direction} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -24 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}>
          <h3 className="text-[22px] md:text-[26px] leading-[1.3] mb-6" style={{ fontFamily: serif, color: C.black }}>{question.question}</h3>
          {question.note && <p className="text-[13px] mb-4" style={{ color: C.grayLight, fontFamily: sans }}>{question.note}</p>}
          <div className="flex flex-col gap-2.5">
            {question.options.map((opt, idx) => {
              const sel = selectedOption === idx;
              return (
                <button key={idx} onClick={() => handleSelect(idx)} aria-pressed={sel}
                  className="w-full text-left px-5 py-4 text-[14px] leading-[1.6] cursor-pointer"
                  style={{
                    borderRadius: "10px",
                    border: sel ? `1px solid ${C.black}` : `1px solid ${C.creamBorder}`,
                    background: sel ? C.creamDark : C.white,
                    color: sel ? C.black : C.gray,
                    fontFamily: sans, transition: "all 0.15s",
                  }}>{opt.label}</button>
              );
            })}
          </div>
          {/* Show response/reveal when selected */}
          <AnimatePresence>
            {selectedOption !== null && question.options[selectedOption].response && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-4 p-5" style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px" }}>
                  <p className="text-[13px] leading-[1.8] italic" style={{ color: C.gray, fontFamily: sans }}>{question.options[selectedOption].response}</p>
                  {question.options[selectedOption].reveal && (
                    <div className="mt-3 p-4 text-[13px] font-medium not-italic leading-[1.6]" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }}>
                      {question.options[selectedOption].reveal}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {currentQ === 6 && (
            <label className="flex items-start gap-3 mt-6 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0f0f0d] shrink-0" />
              <span className="text-[11px] leading-[1.8]" style={{ color: C.grayLight, fontFamily: sans }}>
                I consent to Network and its appointed partners contacting me via WhatsApp, SMS, or email to provide renovation quotations, 3D design previews, and complimentary renovation insurance. I agree to the collection, use, and disclosure of my personal data for these purposes in accordance with Singapore's Personal Data Protection Act (PDPA).
              </span>
            </label>
          )}
          {/* Next / Submit button */}
          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="w-full h-[52px] mt-6 text-[15px] font-medium hover:opacity-85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
          >
            {currentQ === 6 ? "Submit" : "Next"}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Inline validation helper ── */
function isValidSGPhone(phone: string) {
  const digits = phone.replace(/\s/g, "");
  return /^[89]\d{7}$/.test(digits);
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Main Hero Section ── */
interface HeroProps {
  formState: FormState;
  setFormState: (s: FormState) => void;
  form: LeadFormData;
  setForm: (f: LeadFormData) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  heroRef: React.RefObject<HTMLElement | null>;
}

export function HeroSection({ formState, setFormState, form, setForm, isSubmitting, handleSubmit, heroRef }: HeroProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const avatars = TESTIMONIALS.items.slice(0, 3).map(t => t.avatar);
  const homeownerCount = useHomeownerCount();

  return (
    <section ref={heroRef} id="lead-form" className="relative pt-[100px] md:pt-[100px] min-h-screen flex flex-col">
      {/* Ghost photo grid background */}
      <div className="absolute inset-0 pt-[64px] overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-full grid grid-cols-2 gap-3 p-6 opacity-[0.06]">
          <img src={photo1} alt="" className="w-full h-[50%] object-cover rounded-[4px]" />
          <img src={photo2} alt="" className="w-full h-[50%] object-cover rounded-[4px]" />
          <img src={photo3} alt="" className="w-full h-[50%] object-cover rounded-[4px]" />
          <img src={heroPhoto} alt="" className="w-full h-[50%] object-cover rounded-[4px]" />
        </div>
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto w-full">
          <AnimatePresence mode="wait">
            {formState === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-[80px] items-center">
                  {/* Left — headline */}
                  <div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
                      className="flex items-center gap-2 mb-8">
                      <span className="w-6 h-[1.5px] inline-block" style={{ background: C.grayLight }} />
                      <TagLabel>Trusted by {homeownerCount} Singapore homeowners this year</TagLabel>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                      className="leading-[1.1] mb-8">
                      <span className="block font-normal" style={{ fontFamily: serif, color: C.black, fontSize: "clamp(32px, 3.8vw, 52px)", letterSpacing: "-0.025em" }}>
                        {HERO.headline}
                      </span>
                      <span className="block font-normal italic" style={{ fontFamily: serif, color: C.grayLight, fontSize: "clamp(32px, 3.5vw, 52px)" }}>
                        {HERO.headlineItalic}
                      </span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
                      className="text-[15px] font-normal leading-[1.75] max-w-[440px]"
                      style={{ color: C.gray, fontFamily: sans }}>{HERO.subheadline}</motion.p>
                  </div>

                  {/* Right — Form card */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                    <div className="p-8 md:p-10" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px", borderTop: "none" }}>
                      <h2 className="text-[22px] md:text-[28px] font-normal leading-[1.2] mb-2" style={{ fontFamily: serif, color: C.black }}>
                        {HERO.formTitle}
                      </h2>
                      <p className="text-[14px] font-normal leading-[1.6] mb-5" style={{ color: C.gray, fontFamily: sans }}>
                        {HERO.formSubtitle}
                      </p>

                      {/* Inline social proof avatars */}
                      <div className="flex items-center gap-3 mb-8">
                        <div className="flex -space-x-2">
                          {avatars.map((a, i) => (
                            <img key={i} src={a} alt="" className="w-[28px] h-[28px] rounded-full object-cover border-2" style={{ borderColor: C.white }} />
                          ))}
                        </div>
                        <span className="text-[12px] font-medium" style={{ color: C.gray, fontFamily: sans }}>
                          {homeownerCount} homeowners matched this year
                        </span>
                      </div>

                      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Honeypot — hidden from users, bots fill this */}
                        <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true" tabIndex={-1}>
                          <input type="text" name="_hp_field" autoComplete="off" tabIndex={-1} />
                        </div>
                        {/* Name */}
                        <div>
                          <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Name</label>
                          <div className="relative">
                            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                              onBlur={() => setTouched(t => ({ ...t, name: true }))}
                              placeholder="Your full name" autoComplete="name"
                              className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none transition-all"
                              style={{ background: C.cream, border: `1px solid ${touched.name && form.name.trim() ? C.black : C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }}
                            />
                            {touched.name && form.name.trim() && (
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Phone</label>
                          <div className="flex">
                            <span className="inline-flex items-center justify-center h-[48px] px-3.5 text-[14px] font-normal shrink-0"
                              style={{ background: C.creamDark, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}`, borderLeft: `1px solid ${C.creamBorder}`, borderRadius: "10px 0 0 10px", color: C.grayLight, fontFamily: sans }}>+65</span>
                            <div className="relative flex-1">
                              <input type="tel" required maxLength={8} value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); setForm({ ...form, phone: v }); }}
                                onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                                placeholder="9123 4567" autoComplete="tel"
                                className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none transition-all"
                                style={{ background: C.cream, borderTop: `1px solid ${touched.phone && isValidSGPhone(form.phone) ? C.black : C.creamBorder}`, borderBottom: `1px solid ${touched.phone && isValidSGPhone(form.phone) ? C.black : C.creamBorder}`, borderRight: `1px solid ${touched.phone && isValidSGPhone(form.phone) ? C.black : C.creamBorder}`, borderLeft: "none", borderRadius: "0 10px 10px 0", color: C.black, fontFamily: sans }}
                              />
                              {touched.phone && isValidSGPhone(form.phone) && (
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Email</label>
                          <div className="relative">
                            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                              onBlur={() => setTouched(t => ({ ...t, email: true }))}
                              placeholder="you@email.com" autoComplete="email"
                              className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none transition-all"
                              style={{ background: C.cream, border: `1px solid ${touched.email && isValidEmail(form.email) ? C.black : C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }}
                            />
                            {touched.email && isValidEmail(form.email) && (
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={isSubmitting}
                          className="w-full h-[60px] mt-3 text-[16px] font-normal tracking-wide hover:opacity-85 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                          style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, letterSpacing: "0.01em", transition: "all 0.15s" }}>
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              {HERO.submitButton}
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </>
                          )}
                        </button>
                      </form>

                      {/* Trust micro-badges */}
                      <div className="flex items-center justify-center gap-5 mt-5">
                        {[
                          { icon: "✓", text: "Free, no cost" },
                          { icon: "🛡", text: "No obligations" },
                          { icon: "⏱", text: "2-minute process" },
                        ].map((badge) => (
                          <span key={badge.text} className="flex items-center gap-1.5 text-[11px] font-normal" style={{ color: C.grayLight, fontFamily: sans }}>
                            <span className="text-[10px]">{badge.icon}</span>
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {formState === "qualifying" && (
              <motion.div key="qualifying" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }} className="flex items-center justify-center min-h-[70vh] py-8">
                <QualifyingFlow onComplete={(answers) => {
                  setFormState("complete");
                  heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  // Save lead to Supabase homepage_leads table
                  const sbUrl = `https://${projectId}.supabase.co`;
                  const sbKey = publicAnonKey;
                  fetch(`${sbUrl}/rest/v1/homepage_leads`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "apikey": sbKey, "Authorization": `Bearer ${sbKey}` },
                    body: JSON.stringify({
                      name: form.name,
                      phone: form.phone,
                      email: form.email || null,
                      ...answers,
                    }),
                  }).then(r => { if (!r.ok) console.error("Lead save failed:", r.status); else console.log("Lead saved to homepage_leads"); })
                    .catch(err => console.error("Lead save error:", err));
                  // Send to Zapier via server proxy
                  sendToZapier("hero-lead", {
                    "First Name": form.name,
                    "Contact Phone": form.phone,
                    "Email Address": form.email || "",
                    "Situation": answers.situation || "",
                    "Key Date": answers.timeline || "",
                    "Property Type": answers.home_type || "",
                    "Design Level": answers.design_level || "",
                    "Renovation Budget": (answers.budget_range || "").match(/^\$[\d,]+K?\+?(?:[–\-]+\$[\d,]+K?\+?)?/)?.[0] || answers.budget_range || "",
                    "Biggest Concern": answers.biggest_concern || "",
                    "Decision Maker": answers.is_decision_maker || "",
                    "Meeting Preference": answers.meeting_preference || "",
                    "Lead Form": "Homepage Lead Form",
                  });
                }} />
              </motion.div>
            )}

            {formState === "complete" && (
              <motion.div key="complete" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }} className="flex items-center justify-center min-h-[70vh] py-8">
                <div className="text-center max-w-[520px] mx-auto">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-7" style={{ background: C.black }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h2 className="text-[40px] md:text-[52px] leading-[1.1] mb-5" style={{ fontFamily: serif, color: C.black }}>{COMPLETION.headline}</h2>
                  <p className="text-[14px] font-normal leading-[1.7] mb-3" style={{ color: C.gray, fontFamily: sans }}>{COMPLETION.subheadline}</p>
                  <p className="text-[14px] font-normal leading-[1.7] mb-10" style={{ color: C.grayLight, fontFamily: sans }}>{COMPLETION.body}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href={COMPLETION.cta1.href} className="h-[60px] px-7 text-[16px] font-normal flex items-center justify-center gap-2 hover:opacity-80"
                      style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>{COMPLETION.cta1.label}</a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {formState === "idle" && (
        <div className="hidden md:flex absolute bottom-8 right-10 items-center gap-2">
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans, writingMode: "vertical-lr" }}>Scroll</span>
        </div>
      )}
    </section>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Check } from "lucide-react";
import { C, serif, sans } from "../homepage/v8/primitives";
import { QUALIFYING_QUESTIONS } from "../homepage/content";
import { submitHomepageLead } from "../homepage/v8/submitHomepageLead";
import type { LeadFormData } from "../homepage/types";
import { FUNNEL_HERO, FUNNEL_COMPLETION } from "./content";
import { trackLead } from "@/app/utils/metaPixel";

const ANSWER_KEYS = [
  "situation",
  "timeline",
  "home_type",
  "design_level",
  "biggest_concern",
  "is_decision_maker",
  "meeting_preference",
] as const;

const PAGE2_INDEXES = [0, 1, 2, 3]; // Q1–Q4
const PAGE3_INDEXES = [4, 5, 6]; // Q5–Q7
const HOME_TYPE_OTHER_LABEL = QUALIFYING_QUESTIONS[2].options[QUALIFYING_QUESTIONS[2].options.length - 1].label;

function isValidSGPhone(phone: string) {
  return /^[689]\d{7}$/.test(phone.replace(/\s/g, ""));
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type Step = 1 | 2 | 3 | 4; // 4 = complete

export function CompactLeadForm({ mobileHero }: { mobileHero?: React.ReactNode } = {}) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [form, setForm] = useState<LeadFormData>({ name: "", phone: "", email: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherHomeText, setOtherHomeText] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const progress = step === 4 ? 100 : (step / 3) * 100;

  const p1Valid =
    form.name.trim().length > 0 && isValidSGPhone(form.phone) && isValidEmail(form.email);

  const selectAnswer = (qIdx: number, optIdx: number) => {
    const q = QUALIFYING_QUESTIONS[qIdx];
    const opt = q.options[optIdx];
    const key = ANSWER_KEYS[qIdx];
    setAnswers((prev) => {
      const next = { ...prev, [key]: opt.label };
      if (opt.reveal) next.budget_range = opt.reveal;
      return next;
    });
    if (qIdx === 2 && opt.label !== HOME_TYPE_OTHER_LABEL) setOtherHomeText("");
  };

  const page2Complete = PAGE2_INDEXES.every((i) => answers[ANSWER_KEYS[i]]);
  const page3Complete = PAGE3_INDEXES.every((i) => answers[ANSWER_KEYS[i]]) && consent;

  const goForward = (target: Step) => {
    setDirection(1);
    setStep(target);
  };
  const goBack = (target: Step) => {
    setDirection(-1);
    setStep(target);
  };

  const handlePage1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!p1Valid) {
      setTouched({ name: true, phone: true, email: true });
      return;
    }
    goForward(2);
  };

  const handleFinalSubmit = async () => {
    if (!page3Complete || submitting) return;
    setSubmitting(true);
    const finalAnswers = { ...answers };
    if (finalAnswers.home_type === HOME_TYPE_OTHER_LABEL && otherHomeText.trim()) {
      finalAnswers.home_type = `${HOME_TYPE_OTHER_LABEL} — ${otherHomeText.trim()}`;
    }
    try {
      await submitHomepageLead(form, finalAnswers as any, {
        leadFormLabel: "Funnel Lead Form (/get-matched)",
      });
    } finally {
      setSubmitting(false);
      trackLead("get-matched-quiz");
      goForward(4);
    }
  };

  return (
    <div
      className="w-full mx-auto"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        maxWidth: "440px",
      }}
    >
      <div className="p-6 md:p-7">
        {/* Header */}
        {step !== 4 && (
          <>
            {mobileHero && <div className="lg:hidden mb-5">{mobileHero}</div>}
            <div className={mobileHero ? "hidden lg:block" : ""}>
              <h2
                className="text-[22px] leading-[1.2] mb-1.5"
                style={{ fontFamily: serif, color: C.black }}
              >
                {FUNNEL_HERO.formTitle}
              </h2>
              <p
                className="text-[13px] leading-[1.5] mb-5"
                style={{ color: C.gray, fontFamily: sans }}
              >
                {FUNNEL_HERO.formSubtitle}
              </p>

              {/* Desktop: progress + back/step above form */}
              <div
                className="w-full h-[3px] rounded-full mb-5 overflow-hidden"
                style={{ background: C.creamBorder }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: C.black }}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => (step === 2 ? goBack(1) : step === 3 ? goBack(2) : undefined)}
                  disabled={step === 1}
                  className="text-[12px] flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:opacity-60"
                  style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: C.grayLight,
                    fontFamily: sans,
                  }}
                >
                  Step {step} of 3
                </span>
              </div>
            </div>
          </>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {/* ═══ STEP 1: Info ═══ */}
          {step === 1 && (
            <motion.form
              key="step1"
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePage1Submit}
              noValidate
              className="flex flex-col gap-3"
            >
              {/* Honeypot */}
              <div
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
                aria-hidden="true"
                tabIndex={-1}
              >
                <input type="text" name="_hp_field" autoComplete="off" tabIndex={-1} />
              </div>

              <Field
                label="Name"
                valid={!!form.name.trim()}
                touched={!!touched.name}
                error="Please enter your name"
              >
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full h-[48px] px-4 pr-10 text-[14px] focus-visible:outline-none"
                  style={{
                    background: C.cream,
                    border: `1px solid ${touched.name && form.name.trim() ? C.black : C.creamBorder}`,
                    borderRadius: "10px",
                    color: C.black,
                    fontFamily: sans,
                    transition: "all 0.15s",
                  }}
                />
              </Field>

              <Field
                label="Phone"
                valid={isValidSGPhone(form.phone)}
                touched={!!touched.phone}
                error="Enter a valid Singapore number (8 digits, starts with 6, 8, or 9)"
              >
                <div className="flex">
                  <span
                    className="inline-flex items-center justify-center h-[48px] px-3.5 text-[14px] shrink-0"
                    style={{
                      background: C.creamDark,
                      border: `1px solid ${C.creamBorder}`,
                      borderRight: "none",
                      borderRadius: "10px 0 0 10px",
                      color: C.gray,
                      fontFamily: sans,
                    }}
                  >
                    +65
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={8}
                    value={form.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setForm({ ...form, phone: v });
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="9123 4567"
                    autoComplete="tel"
                    className="flex-1 w-full h-[48px] px-4 pr-10 text-[14px] focus-visible:outline-none"
                    style={{
                      background: C.cream,
                      border: `1px solid ${touched.phone && isValidSGPhone(form.phone) ? C.black : C.creamBorder}`,
                      borderLeft: "none",
                      borderRadius: "0 10px 10px 0",
                      color: C.black,
                      fontFamily: sans,
                      transition: "all 0.15s",
                    }}
                  />
                </div>
              </Field>

              <Field
                label="Email"
                valid={isValidEmail(form.email)}
                touched={!!touched.email}
                error="Enter a valid email address"
              >
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="w-full h-[48px] px-4 pr-10 text-[14px] focus-visible:outline-none"
                  style={{
                    background: C.cream,
                    border: `1px solid ${touched.email && isValidEmail(form.email) ? C.black : C.creamBorder}`,
                    borderRadius: "10px",
                    color: C.black,
                    fontFamily: sans,
                    transition: "all 0.15s",
                  }}
                />
              </Field>

              <button
                type="submit"
                className="w-full h-[52px] mt-3 text-[15px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: C.black,
                  color: C.white,
                  borderRadius: "12px",
                  fontFamily: sans,
                  transition: "all 0.15s",
                  opacity: p1Valid ? 1 : 0.55,
                }}
              >
                {FUNNEL_HERO.page1CTA}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <p
                className="text-[11px] text-center mt-1"
                style={{ color: C.grayLight, fontFamily: sans }}
              >
                {FUNNEL_HERO.microTrust}
              </p>
            </motion.form>
          )}

          {/* ═══ STEP 2: Q1–Q4 ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {PAGE2_INDEXES.map((qIdx) => (
                <div key={qIdx} className="flex flex-col gap-2.5">
                  <QuestionBlock
                    qIdx={qIdx}
                    selectedLabel={answers[ANSWER_KEYS[qIdx]]}
                    onSelect={(optIdx) => selectAnswer(qIdx, optIdx)}
                  />
                  {qIdx === 2 && answers.home_type === HOME_TYPE_OTHER_LABEL && (
                    <input
                      type="text"
                      value={otherHomeText}
                      onChange={(e) => setOtherHomeText(e.target.value)}
                      placeholder="Tell us more about your property (optional)"
                      maxLength={120}
                      className="w-full h-[44px] px-4 text-[13px] focus-visible:outline-none"
                      style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => goForward(3)}
                disabled={!page2Complete}
                className="w-full h-[52px] mt-2 text-[15px] font-medium hover:opacity-85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: C.black,
                  color: C.white,
                  borderRadius: "12px",
                  fontFamily: sans,
                  transition: "all 0.15s",
                }}
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* ═══ STEP 3: Q5–Q7 + PDPA ═══ */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {PAGE3_INDEXES.map((qIdx) => (
                <QuestionBlock
                  key={qIdx}
                  qIdx={qIdx}
                  selectedLabel={answers[ANSWER_KEYS[qIdx]]}
                  onSelect={(optIdx) => selectAnswer(qIdx, optIdx)}
                />
              ))}

              <label className="flex items-start gap-2.5 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0f0f0d] shrink-0"
                />
                <span
                  className="text-[11px] leading-[1.7]"
                  style={{ color: C.grayLight, fontFamily: sans }}
                >
                  I consent to Network and its appointed partners contacting me via
                  WhatsApp, SMS, or email to provide renovation quotations and
                  design previews in accordance with Singapore's PDPA.
                </span>
              </label>

              <button
                onClick={handleFinalSubmit}
                disabled={!page3Complete || submitting}
                className="w-full h-[52px] mt-2 text-[15px] font-medium hover:opacity-85 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: C.black,
                  color: C.white,
                  borderRadius: "12px",
                  fontFamily: sans,
                  transition: "all 0.15s",
                }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  FUNNEL_HERO.finalCTA
                )}
              </button>
            </motion.div>
          )}

          {/* ═══ STEP 4: Complete ═══ */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="py-2 text-center"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: C.black }}
              >
                <Check size={22} color={C.white} strokeWidth={2.5} />
              </div>
              <h3
                className="text-[26px] leading-[1.2] mb-3"
                style={{ fontFamily: serif, color: C.black }}
              >
                {FUNNEL_COMPLETION.headline}
              </h3>
              <p
                className="text-[14px] leading-[1.65] mb-6"
                style={{ color: C.gray, fontFamily: sans }}
              >
                {FUNNEL_COMPLETION.body}
              </p>
              <a
                href={FUNNEL_COMPLETION.secondary.href}
                className="text-[13px] underline hover:opacity-70"
                style={{ color: C.black, fontFamily: sans }}
              >
                {FUNNEL_COMPLETION.secondary.label}
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 4 && (
          <div className="lg:hidden">
            <div
              className="w-full h-[3px] rounded-full mt-5 mb-4 overflow-hidden"
              style={{ background: C.creamBorder }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: C.black }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => (step === 2 ? goBack(1) : step === 3 ? goBack(2) : undefined)}
                disabled={step === 1}
                className="text-[12px] flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:opacity-60"
                style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}
              >
                <ChevronLeft size={14} /> Back
              </button>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.grayLight,
                  fontFamily: sans,
                }}
              >
                Step {step} of 3
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Subcomponents ── */

function Field({
  label,
  valid,
  touched,
  error,
  children,
}: {
  label: string;
  valid: boolean;
  touched: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const showError = touched && !valid && !!error;
  return (
    <div>
      <label
        className="block mb-1.5"
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: C.grayLight,
          fontFamily: sans,
        }}
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {touched && valid && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {showError && (
        <p
          className="mt-1 text-[11px]"
          style={{ color: "#b91c1c", fontFamily: sans }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function QuestionBlock({
  qIdx,
  selectedLabel,
  onSelect,
}: {
  qIdx: number;
  selectedLabel?: string;
  onSelect: (optIdx: number) => void;
}) {
  const q = QUALIFYING_QUESTIONS[qIdx];
  const selectedIdx = q.options.findIndex((o) => o.label === selectedLabel);
  return (
    <div>
      <label
        className="block text-[13px] leading-[1.4] mb-2"
        style={{ fontFamily: sans, color: C.black, fontWeight: 500 }}
      >
        {q.question}
      </label>
      <div className="relative">
        <select
          value={selectedIdx >= 0 ? String(selectedIdx) : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== "") onSelect(Number(v));
          }}
          className="w-full h-[44px] pl-4 pr-10 text-[13px] leading-[1.45] cursor-pointer appearance-none focus-visible:outline-none"
          style={{
            borderRadius: "10px",
            border: `1px solid ${selectedLabel ? C.black : C.creamBorder}`,
            background: C.white,
            color: selectedLabel ? C.black : C.grayLight,
            fontFamily: sans,
            fontWeight: selectedLabel ? 500 : 400,
            transition: "all 0.15s",
          }}
        >
          <option value="" disabled>
            Select an option…
          </option>
          {q.options.map((opt, idx) => (
            <option key={idx} value={String(idx)}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.gray}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

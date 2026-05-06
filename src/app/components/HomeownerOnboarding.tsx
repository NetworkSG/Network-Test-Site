import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { C, serif, sans } from "./homepage/v8/primitives";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

// Style tiles use real, verified-live project covers from designers in the
// Network catalog (the on-the-fly /render endpoint 403s on this bucket, so we
// hit the public object URL and let CSS object-fit downscale).
const styleImg = (path: string) =>
  `https://hycxkpassywjvdqduzrx.supabase.co/storage/v1/object/public/make-4808de5e-designers/${path}`;

const STYLES: { value: string; label: string; img: string }[] = [
  { value: "Eclectic",     label: "Eclectic",     img: styleImg("imported/3e60eab3-18bf-4a0b-8b97-80c6c0d1cbb2.jpeg") },
  { value: "Industrial",   label: "Industrial",   img: styleImg("imported/89874187-b112-4f97-a747-32120a7608b9.jpeg") },
  { value: "Modern",       label: "Modern",       img: styleImg("imported/ceace8ef-6acd-47c0-a1fe-72620d1e35e1.jpeg") },
  { value: "Contemporary", label: "Contemporary", img: styleImg("imported/3aa0b573-6f61-4ca8-a111-75ad6aa9ec70.jpeg") },
  { value: "Vintage",      label: "Vintage",      img: styleImg("imported/e709bafc-52bf-441d-9e19-eff4918be71c.jpeg") },
  { value: "Scandinavian", label: "Scandinavian", img: styleImg("imported/42e9ed93-349c-47ac-a537-75abd2b3ca75.jpeg") },
  { value: "Minimalist",   label: "Minimalist",   img: styleImg("imported/2b603095-24ab-4240-a4c5-0226a64ac98d.jpeg") },
  { value: "Japandi",      label: "Japandi",      img: styleImg("drive/2026-04-29/325eab12-169e-4bbe-b2f8-05ccbe128c2f.jpg") },
];

type Answers = {
  renovating: "yes" | "no" | "";
  hasKeys: "yes" | "no" | "";
  propertyType: string;
  propertyStatus: string;
  designStyles: string[];
  noPreference: boolean;
  budget: string;
  phone: string;
};

// Pill button — matches Network's outline-on-cream pattern. Active fills with
// the brand black; inactive shows the cream-border outline used elsewhere on
// the auth surface.
function PillButton({
  active, onClick, children, fullWidth = false,
}: { active: boolean; onClick: () => void; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[44px] px-5 rounded-[10px] text-[14px] font-medium transition-colors ${fullWidth ? "w-full" : ""}`}
      style={{
        fontFamily: sans,
        background: active ? C.black : C.white,
        color: active ? C.white : C.black,
        border: `1px solid ${active ? C.black : C.creamBorder}`,
      }}
    >
      {children}
    </button>
  );
}

function Question({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[14px] font-semibold" style={{ color: C.black, fontFamily: sans }}>{label}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
      {hint && <p className="text-[12px] mt-1" style={{ color: C.grayLight, fontFamily: sans }}>{hint}</p>}
    </div>
  );
}

export default function HomeownerOnboarding({
  userName,
  initialPhone,
  onComplete,
  onSkip,
}: {
  userName: string;
  initialPhone: string;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const firstName = (userName.trim().split(/\s+/)[0] || "there");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    renovating: "",
    hasKeys: "",
    propertyType: "",
    propertyStatus: "",
    designStyles: [],
    noPreference: false,
    budget: "",
    phone: initialPhone || "",
  });

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((a) => ({ ...a, [k]: v }));

  const toggleStyle = (val: string) => {
    setAnswers((a) => {
      if (a.noPreference) return a;
      const has = a.designStyles.includes(val);
      return { ...a, designStyles: has ? a.designStyles.filter((s) => s !== val) : [...a.designStyles, val] };
    });
  };

  const step1Valid = answers.renovating && answers.hasKeys && answers.propertyType && answers.propertyStatus;
  const step2Valid = answers.noPreference || answers.designStyles.length > 0;

  const persistAndExit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("homeowner-token") || "";
      await fetch(`${API}/homeowner-profile/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Homeowner-Token": token,
        },
        body: JSON.stringify({
          renovating: answers.renovating,
          hasKeys: answers.hasKeys,
          propertyType: answers.propertyType,
          propertyStatus: answers.propertyStatus,
          designStyles: answers.noPreference ? [] : answers.designStyles,
          budget: answers.budget,
        }),
      });
    } catch {}
    setSubmitting(false);
    onComplete();
  };

  const next = () => {
    if (step === 1 && step1Valid) setStep(2);
    else if (step === 2 && step2Valid) setStep(3);
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  const finish = () => { void persistAndExit(); };

  const heading =
    step === 1
      ? { kicker: "Step 1 of 3", main: "Let's set up", italic: `your profile, ${firstName}.`, sub: "Tell us a little about you and your renovation preferences." }
      : step === 2
      ? { kicker: "Step 2 of 3", main: "Pick the styles", italic: "you love.", sub: "We'll lean into these when matching designers and inspiration." }
      : { kicker: "Step 3 of 3", main: "Now is the time", italic: `to meet IDs, ${firstName}.`, sub: "Add a budget and we'll line up shortlisted designers. Free, no obligation." };

  return (
    <div className="w-full max-w-[520px] flex flex-col gap-7" style={{ fontFamily: sans }}>
      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-[3px] flex-1 rounded-full transition-colors"
            style={{ background: n <= step ? C.black : C.creamBorder }}
          />
        ))}
      </div>

      {/* Heading — same typographic system as AuthScreen */}
      <div>
        <p
          className="mb-3"
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
            textTransform: "uppercase", color: C.grayLight, fontFamily: sans,
          }}
        >
          {heading.kicker}
        </p>
        <h1
          className="leading-[1.1]"
          style={{ fontFamily: serif, color: C.black, letterSpacing: "-0.025em" }}
        >
          <span className="block font-normal" style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}>
            {heading.main}
          </span>
          <span
            className="block font-normal italic"
            style={{ fontSize: "clamp(28px, 3.2vw, 40px)", color: C.grayLight }}
          >
            {heading.italic}
          </span>
        </h1>
        <p
          className="text-[15px] leading-[1.65] mt-4"
          style={{ color: C.gray, fontFamily: sans, maxWidth: 440 }}
        >
          {heading.sub}
        </p>
      </div>

      {/* Step body */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-7"
          >
            <Question label="Are you planning to renovate?">
              <PillButton active={answers.renovating === "yes"} onClick={() => set("renovating", "yes")}>Yes</PillButton>
              <PillButton active={answers.renovating === "no"} onClick={() => set("renovating", "no")}>No</PillButton>
            </Question>

            <Question label="Have you collected your keys?">
              <PillButton active={answers.hasKeys === "yes"} onClick={() => set("hasKeys", "yes")}>Yes</PillButton>
              <PillButton active={answers.hasKeys === "no"} onClick={() => set("hasKeys", "no")}>No</PillButton>
            </Question>

            <Question label="What's your property type?">
              {["HDB", "Condo", "Landed", "Commercial"].map((opt) => (
                <PillButton key={opt} active={answers.propertyType === opt} onClick={() => set("propertyType", opt)}>
                  {opt}
                </PillButton>
              ))}
            </Question>

            <Question
              label="What's your property status?"
              hint="*Existing means you currently own / have access to the property."
            >
              {["New", "Resale", "Existing*"].map((opt) => (
                <PillButton key={opt} active={answers.propertyStatus === opt} onClick={() => set("propertyStatus", opt)}>
                  {opt}
                </PillButton>
              ))}
            </Question>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            <button
              type="button"
              onClick={() =>
                setAnswers((a) => ({
                  ...a,
                  noPreference: !a.noPreference,
                  designStyles: !a.noPreference ? [] : a.designStyles,
                }))
              }
              className="flex items-center gap-3 px-4 h-[48px] rounded-[10px] text-left transition-colors"
              style={{
                background: C.white,
                border: `1px solid ${answers.noPreference ? C.black : C.creamBorder}`,
              }}
            >
              <span
                className="size-[20px] rounded-[5px] flex items-center justify-center"
                style={{
                  background: answers.noPreference ? C.black : "transparent",
                  border: `1.5px solid ${answers.noPreference ? C.black : C.creamBorder}`,
                }}
              >
                {answers.noPreference && <Check size={14} style={{ color: C.white }} strokeWidth={3} />}
              </span>
              <span className="text-[14px] font-medium" style={{ color: C.black, fontFamily: sans }}>No preference</span>
            </button>

            <div
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${answers.noPreference ? "opacity-40 pointer-events-none" : ""}`}
            >
              {STYLES.map((s) => {
                const sel = answers.designStyles.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleStyle(s.value)}
                    className="group flex flex-col gap-2 text-left"
                  >
                    <div
                      className="relative aspect-[4/3] rounded-[10px] overflow-hidden transition-shadow"
                      style={{ border: `2px solid ${sel ? C.black : C.creamBorder}`, background: C.cream }}
                    >
                      <img src={s.img} alt={s.label} className="w-full h-full object-cover" loading="lazy" />
                      {sel && (
                        <span
                          className="absolute top-2 right-2 size-[24px] rounded-[6px] flex items-center justify-center"
                          style={{ background: C.black }}
                        >
                          <Check size={14} style={{ color: C.white }} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: C.black, fontFamily: sans }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: C.grayLight, fontFamily: sans,
                }}
              >
                Budget
              </label>
              <div
                className="flex items-center h-[48px] rounded-[10px] overflow-hidden"
                style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
              >
                <span className="px-4 text-[14px] font-medium" style={{ color: C.grayLight, fontFamily: sans }}>S$</span>
                <input
                  inputMode="numeric"
                  value={answers.budget}
                  onChange={(e) => set("budget", e.target.value.replace(/[^\d,]/g, ""))}
                  placeholder="Enter budget"
                  className="flex-1 h-full bg-transparent outline-none text-[14px]"
                  style={{ color: C.black, fontFamily: sans }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: C.grayLight, fontFamily: sans,
                }}
              >
                Contact Number
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center px-4 h-[48px] rounded-[10px]"
                  style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
                >
                  <span className="text-[14px] font-medium" style={{ color: C.black, fontFamily: sans }}>+65</span>
                </div>
                <input
                  inputMode="tel"
                  value={answers.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                  placeholder="Your contact number"
                  className="flex-1 h-[48px] px-4 rounded-[10px] outline-none text-[14px]"
                  style={{
                    background: C.cream,
                    border: `1px solid ${C.creamBorder}`,
                    color: C.black,
                    fontFamily: sans,
                  }}
                />
              </div>
              <p className="text-[12px] mt-1" style={{ color: C.grayLight, fontFamily: sans }}>
                This is free and non-obligatory. A Network team member may reach out to help shortlist designers.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 mt-2">
        <button
          type="button"
          onClick={step === 1 ? onSkip : back}
          className="h-[44px] px-4 rounded-[10px] text-[14px] font-medium flex items-center gap-2 transition-colors"
          style={{
            color: C.gray, fontFamily: sans,
            background: "transparent",
            border: `1px solid ${C.creamBorder}`,
          }}
        >
          {step === 1 ? "Skip for now" : (<><ArrowLeft size={15} /> Back</>)}
        </button>

        {step < 3 ? (
          <button
            type="button"
            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            onClick={next}
            className="h-[44px] px-6 rounded-[10px] text-[14px] font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85 active:scale-[0.98]"
            style={{ background: C.black, color: C.white, fontFamily: sans, border: "none" }}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={finish}
            className="h-[44px] px-6 rounded-[10px] text-[14px] font-semibold transition-opacity disabled:opacity-60 hover:opacity-85 active:scale-[0.98] flex items-center gap-2"
            style={{ background: C.black, color: C.white, fontFamily: sans, border: "none" }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {answers.budget || answers.phone ? "Submit" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}

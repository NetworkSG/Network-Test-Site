import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import {
  sanitizeInput,
  sanitizeEmail,
  isValidEmail,
  isValidPhone,
} from "@/app/utils/sanitize";
import { trackLead } from "@/app/utils/metaPixel";
import { recordAttribution } from "@/app/utils/attribution";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

// ALL option values MUST match the backend whitelists exactly
// (ALLOWED_PROPERTY_TYPES, ALLOWED_BUDGETS, ALLOWED_TIMELINES)
const PROPERTY_OPTIONS = ["HDB", "Condo", "Landed", "Commercial"];
const BUDGET_OPTIONS = [
  "Below $30,000",
  "$30,000 – $50,000",
  "$50,000 – $80,000",
  "$80,000 – $120,000",
  "Above $120,000",
];
const TIMELINE_OPTIONS = [
  "Already have keys",
  "Within 3 months",
  "3 – 6 months",
  "6 – 12 months",
];
const FINDING_ID_OPTIONS = [
  "Yes, match me with designers",
  "No, just exploring",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, this is a "send render to designer" modal (post-render). When null, it's a gate modal (pre-render). */
  taskId?: string | null;
  resultUrl?: string | null;
};

export function LeadModal({ open, onOpenChange, taskId = null, resultUrl = null }: Props) {
  const navigate = useNavigate();
  const isGateMode = !taskId;

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [findingId, setFindingId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 2 &&
    isValidPhone(whatsapp.trim()) &&
    isValidEmail(email.trim()) &&
    propertyType !== "" &&
    budget !== "" &&
    timeline !== "" &&
    findingId !== "" &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    if (isGateMode) {
      // Gate mode: submit lead info to a gate-specific endpoint, then navigate to studio
      try {
        const res = await fetch(`${API_BASE}/render-lead-gate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: sanitizeInput(name, 100),
            whatsapp: sanitizeInput(whatsapp, 20),
            email: sanitizeEmail(email),
            propertyType,
            budget,
            timeline,
            findingId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        // Save contact info for studio's "Send to designer" auto-submit
        try {
          sessionStorage.setItem(
            "render-gate-contact",
            JSON.stringify({
              name: sanitizeInput(name, 100),
              whatsapp: sanitizeInput(whatsapp, 20),
              email: sanitizeEmail(email),
              propertyType,
              budget,
              timeline,
              findingId,
            }),
          );
        } catch { /* non-fatal */ }
        // Navigate to studio page
        trackLead("render-tool-gate");
        recordAttribution("render-tool", sanitizeEmail(email));
        setSubmitted(true);
        setTimeout(() => navigate("/render-tool/studio"), 800);
      } catch {
        setError("Network error. Please try again.");
        setSubmitting(false);
      }
    } else {
      // Render mode: submit render to a designer
      try {
        const res = await fetch(`${API_BASE}/render-lead-submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            taskId,
            name: sanitizeInput(name, 100),
            whatsapp: sanitizeInput(whatsapp, 20),
            email: sanitizeEmail(email),
            propertyType,
            budget,
            timeline,
            findingId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        trackLead("render-tool-submit");
        setSubmitted(true);
      } catch {
        setError("Network error. Please try again.");
        setSubmitting(false);
      }
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTimeout(() => {
        setName("");
        setWhatsapp("");
        setEmail("");
        setPropertyType("");
        setBudget("");
        setTimeline("");
        setFindingId("");
        setSubmitting(false);
        setSubmitted(false);
        setError(null);
      }, 200);
    }
    onOpenChange(next);
  };

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lead-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['DM_Sans',sans-serif]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#fafaf8] border border-[#d8d3c8] rounded-[16px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
          >
            <button
              onClick={() => handleClose(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#6b6860] hover:bg-[#f0ede6] transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-[#0f0f0d] flex items-center justify-center mx-auto mb-5">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2
                  className="text-[24px] text-[#0f0f0d] leading-[1.2]"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    fontWeight: 400,
                  }}
                >
                  {isGateMode ? "You're all set!" : "Your render is on its way."}
                </h2>
                <p className="text-[14px] text-[#6b6860] mt-3 leading-[1.6]">
                  {isGateMode
                    ? "Taking you to the render studio..."
                    : "A designer from NETWORK will WhatsApp you within the day with real-world feedback and next steps."}
                </p>
                {!isGateMode && (
                  <button
                    onClick={() => handleClose(false)}
                    className="mt-6 h-[44px] px-6 rounded-[10px] bg-[#0f0f0d] text-white text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition"
                  >
                    Back to render
                  </button>
                )}
              </div>
            ) : (
              <>
                <h2
                  className="text-[26px] text-[#0f0f0d] leading-[1.15]"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    fontWeight: 400,
                    letterSpacing: "-0.015em",
                  }}
                >
                  {isGateMode
                    ? "Before you start rendering"
                    : "Send this render to a designer"}
                </h2>
                <p className="text-[13px] text-[#6b6860] mt-2 leading-[1.5]">
                  {isGateMode
                    ? "Tell us a bit about yourself so we can match you with the right designer when you're ready."
                    : "A NETWORK designer will reach out with real-world feedback — materials, costs, and what's actually buildable."}
                </p>

            {resultUrl && !isGateMode && (
              <div className="mt-4 rounded-[10px] overflow-hidden border border-[#e5e1d6]">
                <img
                  src={resultUrl}
                  alt="Your render"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <Field label="Full name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="WhatsApp (SG)">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="8123 4567"
                    className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                    required
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                    required
                  />
                </Field>
              </div>

              <Field label="Property type">
                <Select
                  value={propertyType}
                  onChange={setPropertyType}
                  options={PROPERTY_OPTIONS}
                  placeholder="Select..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Budget">
                  <Select
                    value={budget}
                    onChange={setBudget}
                    options={BUDGET_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
                <Field label="Timeline">
                  <Select
                    value={timeline}
                    onChange={setTimeline}
                    options={TIMELINE_OPTIONS}
                    placeholder="Select..."
                  />
                </Field>
              </div>

              <Field label="Finding an ID">
                <div className="grid grid-cols-2 gap-2">
                  {FINDING_ID_OPTIONS.map((opt) => {
                    const active = findingId === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFindingId(opt)}
                        aria-pressed={active}
                        className={`min-h-[44px] py-2 rounded-[10px] border px-3 text-[12px] font-medium leading-[1.3] text-center transition ${
                          active
                            ? "bg-[#0f0f0d] text-white border-[#0f0f0d]"
                            : "bg-white text-[#0f0f0d] border-[#d8d3c8] hover:border-[#0f0f0d]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {error && (
                <div className="p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[12px] text-[#991b1b] leading-[1.5]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-[48px] rounded-[10px] bg-[#0f0f0d] text-white text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {submitting
                  ? "Sending..."
                  : isGateMode
                    ? "Start rendering"
                    : "Send render to a designer"}
              </button>
              <p className="text-[11px] text-[#9a9790] text-center leading-[1.5]">
                {isGateMode
                  ? "Free to use. No credit card required."
                  : "We'll WhatsApp you within the day. No spam, no pressure."}
              </p>
            </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#6b6860] font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-3 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

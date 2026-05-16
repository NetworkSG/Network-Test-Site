import { useState } from "react";
import { useNavigate } from "react-router";
import { C, serif, sans } from "../homepage/v8/primitives";
import { isValid8DigitPhone } from "../../utils/phone-validation";
import { isValidEmail } from "../../utils/sanitize";

/** Shared hero lead-capture card. Matches the homepage's name / phone /
 *  email form visual so /interior-designers and / share the same hero
 *  conversion point. On submit we navigate to /get-matched with the
 *  contact details prefilled — unless a parent supplies its own
 *  `onSubmit` handler (e.g. to keep the homepage's qualifying flow). */
export interface HeroLeadFormData {
  name: string;
  phone: string;
  email: string;
}

export function HeroMatchForm({
  title = "Get Your Free Designer Match",
  subtitle = "Tell us your name, phone, and email. We'll follow up with 3 firms hand-picked for your style, budget, and timeline — free, within the day.",
  submitLabel = "Get My Free Matches",
  onSubmit,
}: {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onSubmit?: (data: HeroLeadFormData) => void;
} = {}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<HeroLeadFormData>({ name: "", phone: "", email: "" });
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !isValid8DigitPhone(form.phone) || !isValidEmail(form.email)) {
      setTouched({ name: true, phone: true, email: true });
      return;
    }
    if (onSubmit) {
      onSubmit(form);
      return;
    }
    setIsSubmitting(true);
    const params = new URLSearchParams();
    params.set("name", form.name);
    params.set("phone", form.phone);
    params.set("email", form.email);
    navigate(`/get-matched?${params.toString()}`);
  };

  return (
    <div className="p-8 md:p-10" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
      <h2 className="text-[22px] md:text-[28px] font-normal leading-[1.2] mb-2" style={{ fontFamily: serif, color: C.black }}>
        {title}
      </h2>
      <p className="text-[14px] font-normal leading-[1.6] mb-5" style={{ color: C.gray, fontFamily: sans }}>
        {subtitle}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
        {/* Honeypot - hidden from users, bots fill this */}
        <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true" tabIndex={-1}>
          <input type="text" name="_hp_field" autoComplete="off" tabIndex={-1} />
        </div>

        {/* Name */}
        <div>
          <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Name</label>
          <div className="relative">
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
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
              style={{ background: C.creamDark, borderTop: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : C.creamBorder}`, borderBottom: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : C.creamBorder}`, borderLeft: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : C.creamBorder}`, borderRadius: "10px 0 0 10px", color: C.grayLight, fontFamily: sans }}>+65</span>
            <div className="relative flex-1">
              <input type="tel" required maxLength={8} value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 8); setForm({ ...form, phone: v }); }}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                placeholder="9123 4567" autoComplete="tel"
                className="w-full h-[48px] px-4 pr-10 text-[14px] font-normal focus-visible:outline-none transition-all"
                style={{
                  background: C.cream,
                  borderTop: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : touched.phone && isValid8DigitPhone(form.phone) ? C.black : C.creamBorder}`,
                  borderBottom: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : touched.phone && isValid8DigitPhone(form.phone) ? C.black : C.creamBorder}`,
                  borderRight: `1px solid ${touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) ? "#c14" : touched.phone && isValid8DigitPhone(form.phone) ? C.black : C.creamBorder}`,
                  borderLeft: "none",
                  borderRadius: "0 10px 10px 0",
                  color: C.black,
                  fontFamily: sans,
                }}
              />
              {touched.phone && isValid8DigitPhone(form.phone) && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
          </div>
          {touched.phone && form.phone.length > 0 && !isValid8DigitPhone(form.phone) && (
            <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>
              Phone number must be exactly 8 digits.
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Email</label>
          <div className="relative">
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
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
              {submitLabel}
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
          { icon: "⏱", text: "3-minute process" },
        ].map((badge) => (
          <span key={badge.text} className="flex items-center gap-1.5 text-[11px] font-normal" style={{ color: C.grayLight, fontFamily: sans }}>
            <span className="text-[10px]">{badge.icon}</span>
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import networkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
// Same wireframe (before) + 3D render (after) assets used by the Room Designer hero.
import imgBefore from "figma:asset/c280f9f6aaab4ae8bddb90591c886526cb64a9c8.png";
import imgAfter from "figma:asset/f07ac02def74d08b83946b312fd388bd8374c28c.png";
import { Seo } from "./shared/Seo";
import { HomepageNav } from "./shared/HomepageNav";
import { QUALIFYING_QUESTIONS, COMPLETION } from "./homepage/content";
import { thumbnailUrl } from "../utils/image-url";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sendToZapier } from "@/app/utils/zapier";
import { recordAttribution } from "@/app/utils/attribution";
import { trackLead } from "@/app/utils/metaPixel";
import { isValid8DigitPhone } from "../utils/phone-validation";

/* ─────────────────────────────────────────────────────────────────
 * Relay-layout homepage variant ("network-homepage-relay") — mounted
 * at /test-homepage-v1.
 *
 * Port of the Claude Design "Network Homepage (Relay Layout)" handoff
 * (Relay's editorial structure recolored to Network's cream + clay
 * palette), wired to live data:
 *   • Nav     → the shared HomepageNav (same as the live homepage).
 *   • Hero    → name / email / phone capture; the "Get my free matches"
 *               CTA opens a modal with the live homepage's 7-question
 *               qualifying flow, restyled to this page's aesthetic. On
 *               completion it writes to homepage_leads + Zapier + Meta,
 *               exactly like HomepageV8.
 *   • Firms   → the three highest-signal real interior-design firms from
 *               the designers DB (logo + rating + review count).
 *   • Imagery → real firm project photography from Supabase storage,
 *               served resized/WebP through the weserv proxy (thumbnailUrl).
 * ──────────────────────────────────────────────────────────────── */

const MATCHED_COUNT = "3,663";
const FIRM_COUNT = "120+";
const CTA_LABEL = "Get my free matches";

// weserv-optimised URL (resized + WebP). All sources are public Supabase
// storage objects; thumbnailUrl falls through unchanged for non-http inputs.
const opt = (url: string, w: number) => thumbnailUrl(url, w, 70);

const SB = "https://hycxkpassywjvdqduzrx.supabase.co/storage/v1/object/public/make-4808de5e-designers";

// Real firm project photography (verified-live Supabase objects).
const IMG = {
  heroLiving: `${SB}/drive/2026-06-05/16da9e47-8f88-443f-8012-2ed667373b04.jpg`,
  heroMood: `${SB}/drive/2026-05-07/fe57d0f3-b457-4285-9adb-1a11d39699f6.jpg`,
  heroMoveIn: `${SB}/drive/2026-04-29/325eab12-169e-4bbe-b2f8-05ccbe128c2f.jpg`,
  heroPlan: `${SB}/drive/2026-06-05/28ea7dbb-cd80-4146-a723-87bb8cdbc305.jpg`,
  stats: `${SB}/drive/2026-06-05/8a039b68-9cb7-475f-ab9a-9b2713bed5b6.jpg`,
  portfolio: `${SB}/imported/e709bafc-52bf-441d-9e19-eff4918be71c.jpeg`,
  roomDesigner: `${SB}/drive/2026-06-05/f59015da-922c-4811-ade6-880f73862102.jpg`,
  why1: `${SB}/drive/2026-05-07/8d389281-dcbb-4047-8721-2e04a9ba0790.jpg`,
  why2: `${SB}/drive/2026-04-29/46b14398-32e8-4722-ac39-16b13359b8da.jpg`,
  why3: `${SB}/imported/e709bafc-52bf-441d-9e19-eff4918be71c.jpeg`,
  costGuide: `${SB}/drive/2026-04-29/cc4878c4-908e-41cd-a225-66a6e50dc46f.jpg`,
};

// The three highest-signal verified firms from the designers DB, ranked by
// Google rating × review volume. Logos are real Supabase storage objects.
const FIRMS = [
  { name: "Ciseern", style: "Modern · Contemporary", rating: "4.8", reviews: "866", logo: `${SB}/uploads/5037209e-e90b-454b-8be9-44609457169d-Untitled_design.jpg` },
  { name: "Magnificent Living", style: "Modern · Contemporary", rating: "4.9", reviews: "130", logo: `${SB}/uploads/bf5e7706-f612-4f76-bca4-a3e8c7e7066e-MLC.jpg` },
  { name: "Concrid Interior", style: "Modern · Contemporary", rating: "4.9", reviews: "37", logo: `${SB}/uploads/9d084a2f-664a-4953-9616-2b462b5bbbbf-Untitled_design-2.jpg` },
];

// Official Singapore authority logos — white-on-transparent versions
// (public/trust/), so they sit directly on the dark trust strip.
const TRUST_LOGOS = [
  { label: "HDB Registered", src: "/trust/hdb-white.png" },
  { label: "BCA Registered", src: "/trust/bca-white.png" },
  { label: "SIDAC Accredited", src: "/trust/sidac-white.png" },
  { label: "CaseTrust Accredited", src: "/trust/casetrust-white.png" },
];

// Homeowner testimonials for the auto-scrolling marquee (Lydia's real
// review + three from the live homepage's testimonial set).
const TESTIMONIALS_LIST = [
  { initial: "L", name: "Lydia Poh", role: "Homeowner", quote: "I had a Reno Customer Service officer, Hakeem, to thank heartily. Appreciated the patience and professionalism understanding my wants for my new nest, then connecting me to a more than satisfactory Build & Design company at our first meet up." },
  { initial: "S", name: "Sarah Lim", role: "Homeowner, Bishan HDB", quote: "The matching was spot on. Our designer understood exactly what we wanted before we could even explain it. The whole process felt effortless." },
  { initial: "J", name: "James Tan", role: "Homeowner, Clementi Condo", quote: "No chasing contractors, no guesswork. Network matched us with a firm that delivered exactly what was promised. Every detail was considered." },
  { initial: "R", name: "Rachel Wong", role: "Homeowner, Tampines HDB", quote: "We were nervous about our first renovation. Network made it easy to find a designer who fit our budget and style. Couldn't be happier with the result." },
];

// ── Scroll-reveal wrapper (Framer Motion) — fades + rises content into
//    view once. Used across the page for a cohesive entrance feel. ──
function Reveal({ children, delay = 0, y = 26, style }: { children: React.ReactNode; delay?: number; y?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Network wordmark — the brand logo is an alpha-mask PNG (white shape,
//    transparent bg); we render it by masking a colored box so it can take
//    any surface color. Ratio matches the homepage nav usage (~4.88:1). ──
function NetworkWordmark({ color = "#EFE9DC", height = 24 }: { color?: string; height?: number }) {
  return (
    <span
      aria-label="Network"
      role="img"
      style={{
        display: "block",
        height,
        width: height * 4.88,
        background: color,
        WebkitMaskImage: `url('${networkLogo}')`,
        maskImage: `url('${networkLogo}')`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
      }}
    />
  );
}

// ── Hero scrapbook polaroid — big white-framed photo, no caption. Photos
//    come from real firm projects (Supabase), served resized/WebP. ──
function Polaroid({ src, w = 250, rot = 0, z = 1, pos }: { src: string; w?: number; rot?: number; z?: number; pos: React.CSSProperties }) {
  return (
    <div
      className="rh-collage"
      style={{ position: "absolute", width: w, background: "#fff", padding: "12px 12px 18px", boxShadow: "0 28px 52px -22px rgba(40,30,18,.55)", transform: `rotate(${rot}deg)`, zIndex: z, ...pos }}
    >
      <div style={{ height: Math.round(w * 0.84), backgroundImage: `url('${opt(src, Math.round(w * 1.8))}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
    </div>
  );
}

// ── Logo avatar — real firm logo framed on white, contained so wide
//    wordmark logos aren't cropped. ──
function FirmLogo({ firm, size = 44 }: { firm: (typeof FIRMS)[number]; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 11, background: "#fff", border: "1px solid #E4DAC6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
      <img src={opt(firm.logo, size * 2)} alt={`${firm.name} logo`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
    </span>
  );
}

/* ── Lead capture state shared between the hero form and the modal ── */
interface Contact {
  name: string;
  email: string;
  phone: string;
}

/* ─────────────────────────────────────────────────────────────────
 * Match modal — the live homepage's 7-question qualifying flow, restyled
 * to this page's cream + clay aesthetic. Mirrors HomepageV8's answer keys,
 * "Other" free-text branch, budget reveal, consent gate, and lead-submit.
 * ──────────────────────────────────────────────────────────────── */
const ANSWER_KEYS = ["situation", "timeline", "home_type", "design_level", "biggest_concern", "is_decision_maker", "meeting_preference"];
const OTHER_PROPERTY_IDX = 5;
const TOTAL = 7;

function MatchModal({ open, onClose, contact }: { open: boolean; onClose: () => void; contact: Contact }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherPropertyText, setOtherPropertyText] = useState("");
  const [consent, setConsent] = useState(true);
  const [done, setDone] = useState(false);

  // Reset the flow each time the modal is freshly opened.
  useEffect(() => {
    if (open) {
      setCurrentQ(0);
      setSelectedOption(null);
      setAnswers({});
      setOtherPropertyText("");
      setConsent(true);
      setDone(false);
    }
  }, [open]);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const question = QUALIFYING_QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / TOTAL) * 100;

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    const label = question.options[idx].label;
    const reveal = (question.options[idx] as any).reveal || "";
    const next = { ...answers, [ANSWER_KEYS[currentQ]]: label };
    if (reveal) next.budget_range = reveal;
    setAnswers(next);
    if (currentQ === 2 && idx !== OTHER_PROPERTY_IDX) setOtherPropertyText("");
  };

  const submitLead = (finalAnswers: Record<string, string>) => {
    const sbUrl = `https://${projectId}.supabase.co`;
    const sbKey = publicAnonKey;
    fetch(`${sbUrl}/rest/v1/homepage_leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: sbKey, Authorization: `Bearer ${sbKey}` },
      body: JSON.stringify({ name: contact.name, phone: contact.phone, email: contact.email || null, ...finalAnswers }),
    }).then((r) => { if (!r.ok) console.error("Lead save failed:", r.status); }).catch((err) => console.error("Lead save error:", err));
    recordAttribution("homepage-lead", contact.email);
    trackLead("test-homepage-v1-lead", { email: contact.email, phone: contact.phone });
    sendToZapier("hero-lead", {
      "First Name": contact.name,
      "Contact Phone": contact.phone,
      "Email Address": contact.email || "",
      "Situation": finalAnswers.situation || "",
      "Key Date": finalAnswers.timeline || "",
      "Property Type": finalAnswers.home_type || "",
      "Design Level": finalAnswers.design_level || "",
      "Renovation Budget": (finalAnswers.budget_range || "").match(/^\$[\d,]+K?\+?(?:[–\-]+\$[\d,]+K?\+?)?/)?.[0] || finalAnswers.budget_range || "",
      "Biggest Concern": finalAnswers.biggest_concern || "",
      "Decision Maker": finalAnswers.is_decision_maker || "",
      "Meeting Preference": finalAnswers.meeting_preference || "",
      "Lead Form": "Test Homepage v1 (Relay) Lead Form",
    });
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    let finalAnswers = answers;
    if (currentQ === 2 && selectedOption === OTHER_PROPERTY_IDX && otherPropertyText.trim()) {
      finalAnswers = { ...answers, home_type: `${question.options[OTHER_PROPERTY_IDX].label} - ${otherPropertyText.trim()}` };
      setAnswers(finalAnswers);
    }
    if (currentQ < TOTAL - 1) {
      setSelectedOption(null);
      setCurrentQ((q) => q + 1);
    } else {
      submitLead(finalAnswers);
      setDone(true);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) { setSelectedOption(null); setCurrentQ((q) => q - 1); }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(21,20,15,.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 18px", overflowY: "auto" }}
    >
      <div style={{ width: "100%", maxWidth: 560, background: "#FBF8F1", border: "1px solid #E4DAC6", borderRadius: 20, padding: "30px 26px 30px", boxShadow: "0 40px 90px -40px rgba(20,15,8,.7)", animation: "rh-pop .22s ease-out" }}>
        {/* close */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8B816E", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {!done ? (
          <>
            {/* progress */}
            <div style={{ height: 3, borderRadius: 999, background: "#E4DAC6", overflow: "hidden", marginBottom: 22 }}>
              <div style={{ height: "100%", borderRadius: 999, background: "#C25B36", width: `${progress}%`, transition: "width .3s ease" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <button onClick={handleBack} disabled={currentQ === 0} style={{ border: "none", background: "transparent", cursor: currentQ === 0 ? "not-allowed" : "pointer", opacity: currentQ === 0 ? 0.3 : 1, color: "#8B816E", fontFamily: "'Hanken Grotesk'", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>‹ Back</button>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#8B816E" }}>{question.questionNumber} of {question.totalQuestions}</span>
            </div>

            <h3 style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.02em", color: "#15140F", marginBottom: 18 }}>{question.question}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {question.options.map((opt, idx) => {
                const sel = selectedOption === idx;
                const priceRange = (opt as any).reveal?.match(/^\$[\d,]+K?\+?(?:[–\-]+\$[\d,]+K?\+?)?/)?.[0] || null;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    aria-pressed={sel}
                    style={{ textAlign: "left", cursor: "pointer", padding: "15px 18px", fontSize: 14.5, lineHeight: 1.5, borderRadius: 12, border: `1px solid ${sel ? "#C25B36" : "#E4DAC6"}`, background: sel ? "#F7E9E1" : "#fff", color: sel ? "#15140F" : "#544C3F", fontFamily: "'Hanken Grotesk'", fontWeight: sel ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, transition: "all .15s" }}
                  >
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {priceRange && (
                      <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, borderRadius: 999, padding: "3px 10px", background: sel ? "#C25B36" : "#EFE9DC", color: sel ? "#fff" : "#15140F", fontFamily: "'Hanken Grotesk'" }}>{priceRange}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {currentQ === 2 && selectedOption === OTHER_PROPERTY_IDX && (
              <input
                type="text"
                value={otherPropertyText}
                onChange={(e) => setOtherPropertyText(e.target.value)}
                placeholder="Tell us more about your property (optional)"
                maxLength={120}
                className="rh-email"
                style={{ width: "100%", marginTop: 12, padding: "13px 16px", fontSize: 14, border: "1px solid #E4DAC6", borderRadius: 12, background: "#fff", color: "#15140F", fontFamily: "'Hanken Grotesk'", outline: "none" }}
              />
            )}

            {currentQ === TOTAL - 1 && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, cursor: "pointer" }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: "#C25B36", flexShrink: 0 }} />
                <span style={{ fontSize: 11, lineHeight: 1.7, color: "#8B816E", fontFamily: "'Hanken Grotesk'" }}>
                  I consent to Network and its appointed partners contacting me via WhatsApp, SMS, or email to provide renovation quotations, 3D design previews, and complimentary renovation insurance, in accordance with Singapore's PDPA.
                </span>
              </label>
            )}

            <button
              onClick={handleNext}
              disabled={selectedOption === null || (currentQ === TOTAL - 1 && !consent)}
              className="rh-cta"
              style={{ width: "100%", marginTop: 22, padding: "16px", fontSize: 15, fontWeight: 700, border: "none", borderRadius: 12, cursor: selectedOption === null ? "not-allowed" : "pointer", opacity: selectedOption === null || (currentQ === TOTAL - 1 && !consent) ? 0.4 : 1, background: "#C25B36", color: "#fff", fontFamily: "'Hanken Grotesk'", transition: "all .15s" }}
            >
              {currentQ === TOTAL - 1 ? "Submit" : "Next"}
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 6px 12px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#C25B36", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", textTransform: "uppercase", color: "#15140F" }}>{COMPLETION.headline}</h3>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: "#544C3F", fontFamily: "'Hanken Grotesk'", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{COMPLETION.subheadline}</p>
            <button onClick={onClose} className="rh-dark-cta" style={{ marginTop: 26, padding: "14px 30px", fontSize: 15, fontWeight: 700, border: "none", borderRadius: 12, cursor: "pointer", background: "#15140F", color: "#EFE9DC", fontFamily: "'Hanken Grotesk'" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RelayHomepage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const scrollToForm = () => {
    document.getElementById("match")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submitHero = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and phone.");
      return;
    }
    if (!isValid8DigitPhone(phone)) {
      setError("Phone number must be exactly 8 digits.");
      return;
    }
    setError(null);
    setModalOpen(true);
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #DCD2BE", background: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontFamily: "'Hanken Grotesk'", outline: "none", color: "#15140F" };

  return (
    <div style={{ overflowX: "hidden", fontFamily: "'Hanken Grotesk',sans-serif", background: "#EFE9DC", color: "#1A1610", WebkitFontSmoothing: "antialiased" }}>
      <Seo
        title="Network | Vetted firms. Fair quotes. Total confidence."
        description="Our concierge handpicks 3 verified Singapore interior design firms that fit your style, budget, and timeline. Free, within the day, no obligation."
        noindex
      />
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{`
        .rh-root ::selection{background:#C25B36;color:#fff}
        @keyframes rh-nudge{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
        @keyframes rh-pop{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
        .rh-root input::placeholder{color:#A89C86}
        .rh-cta:hover{background:#A8492A !important}
        .rh-dark-cta:hover{background:#000 !important}
        .rh-email:focus{border-color:#C25B36 !important}
        @keyframes rh-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .rh-marquee-track{display:flex;gap:24px;width:max-content;animation:rh-marquee 45s linear infinite}
        .rh-marquee:hover .rh-marquee-track{animation-play-state:paused}
        @media (prefers-reduced-motion: reduce){.rh-marquee-track{animation:none}}
        @keyframes rh-reveal{0%,14%{clip-path:inset(0 0 0 0)}48%,60%{clip-path:inset(0 0 0 100%)}94%,100%{clip-path:inset(0 0 0 0)}}
        .rh-sketch{animation:rh-reveal 8s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.rh-sketch{animation:none}}

        /* ── Mobile / tablet ── inline styles need !important to override. */
        @media (max-width: 768px){
          .rh-hero{padding:36px 20px 56px !important; min-height:0 !important}
          .rh-collage{display:none !important}
          .rh-h1{font-size:clamp(40px,13vw,62px) !important}
          .rh-h2big{font-size:clamp(32px,8.5vw,46px) !important}
          .rh-h2med{font-size:clamp(28px,8vw,40px) !important}
          .rh-h3big{font-size:clamp(25px,7vw,32px) !important}
          .rh-sec{padding:56px 20px !important}
          .rh-grid2{grid-template-columns:1fr !important; gap:34px !important}
          .rh-grid3{grid-template-columns:1fr !important; gap:24px !important}
          .rh-feat-rows{gap:60px !important}
          .rh-stats{grid-template-columns:1fr !important}
          .rh-stats-photo{min-height:200px !important; order:-1}
          .rh-mockup{height:auto !important}
          .rh-matchcard{position:static !important; width:100% !important; transform:none !important; margin-bottom:14px !important}
          .rh-testi{grid-template-columns:1fr !important; gap:22px !important; padding:32px 26px !important; text-align:center}
          .rh-testi-avatar{margin:0 auto !important}
          .rh-tabs{display:none !important}
          .rh-torn{padding-top:64px !important; padding-bottom:64px !important}
          .rh-footer{grid-template-columns:1fr 1fr !important; gap:28px 24px !important}
          .rh-trust{justify-content:center !important; gap:14px 20px !important}
          .rh-badge{display:block !important; font-size:12.5px !important; border-radius:16px !important; padding:10px 18px !important; line-height:1.5; text-align:center; max-width:320px}
          .rh-badge > span:first-child{display:inline-block; vertical-align:middle; margin:0 7px 2px 0}
        }
      `}</style>

      <MatchModal open={modalOpen} onClose={() => setModalOpen(false)} contact={{ name, email, phone }} />

      <div className="rh-root">
        {/* ===== NAV (shared homepage nav) ===== */}
        <HomepageNav onCtaClick={scrollToForm} ctaLabel="Get matched" />

        {/* ===== HERO (scrapbook collage) ===== */}
        <header className="rh-hero" style={{ position: "relative", background: "#EFE9DC", minHeight: 780, overflow: "hidden", padding: "70px 30px 90px" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 1px 1px,#D7CDB6 1px,transparent 0)", backgroundSize: "24px 24px", opacity: 0.5 }} />
          {/* scattered collage — big, stacked polaroids (real firm projects) */}
          {/* left cluster */}
          <Polaroid src={IMG.costGuide} w={206} rot={12} z={1} pos={{ top: 150, left: -56 }} />
          <Polaroid src={IMG.heroLiving} w={272} rot={-7} z={3} pos={{ top: 60, left: -26 }} />
          <Polaroid src={IMG.heroPlan} w={236} rot={6} z={2} pos={{ top: 290, left: 34 }} />
          <Polaroid src={IMG.why1} w={252} rot={-4} z={2} pos={{ bottom: 26, left: -30 }} />
          {/* right cluster */}
          <Polaroid src={IMG.portfolio} w={206} rot={-12} z={1} pos={{ top: 150, right: -58 }} />
          <Polaroid src={IMG.heroMood} w={276} rot={6} z={3} pos={{ top: 52, right: -28 }} />
          <Polaroid src={IMG.heroMoveIn} w={238} rot={-6} z={2} pos={{ top: 286, right: 28 }} />
          <Polaroid src={IMG.roomDesigner} w={254} rot={4} z={2} pos={{ bottom: 40, right: -28 }} />
          {/* mid-height fillers to close the vertical gap on each side */}
          <Polaroid src={IMG.stats} w={246} rot={7} z={1} pos={{ top: 486, left: -48 }} />
          <Polaroid src={IMG.why2} w={212} rot={-9} z={2} pos={{ top: 566, left: 32 }} />
          <Polaroid src={IMG.heroPlan} w={246} rot={-7} z={1} pos={{ top: 486, right: -50 }} />
          <Polaroid src={IMG.costGuide} w={212} rot={9} z={2} pos={{ top: 566, right: 30 }} />
          {/* handwritten note */}
          <div className="rh-collage" style={{ position: "absolute", bottom: 158, left: 104, zIndex: 4, width: 170, background: "#FBF4DF", padding: 16, boxShadow: "0 14px 30px -16px rgba(40,30,18,.45)", transform: "rotate(-3deg)", fontFamily: "'Instrument Serif'", fontStyle: "italic", fontSize: 17, color: "#6B5A3E", lineHeight: 1.3 }}>"3 firms, picked just for us. So easy."</div>
          {/* center column */}
          <div style={{ position: "relative", zIndex: 5, maxWidth: 760, margin: "0 auto", textAlign: "center", paddingTop: 18 }}>
            <div className="rh-badge" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #E0D6C2", borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#544C3F" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5E8C5C", flexShrink: 0 }} />
              Trusted by <span style={{ color: "#C25B36" }}>{MATCHED_COUNT}</span> Singapore homeowners this year
            </div>
            <motion.h1 className="rh-h1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }} style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 72, lineHeight: 0.96, letterSpacing: "-.03em", textTransform: "uppercase", marginTop: 24, color: "#15140F" }}>
              Vetted firms.<br />Fair quotes.<br />
              <span style={{ fontFamily: "'Instrument Serif'", fontStyle: "italic", fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#C25B36" }}>Total confidence.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }} style={{ marginTop: 22, fontSize: 18.5, lineHeight: 1.5, color: "#544C3F", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>Our concierge handpicks 3 verified interior design firms that fit your style, budget, and timeline. Free. Within the day. No obligation.</motion.p>

            {/* Lead capture — name / email / phone, then the CTA opens the match modal */}
            <motion.form id="match" onSubmit={submitHero} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} style={{ marginTop: 28, maxWidth: 460, marginLeft: "auto", marginRight: "auto", display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <input className="rh-email" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" style={inputStyle} />
              <div style={{ display: "flex" }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0 14px", border: "1px solid #DCD2BE", borderRight: "none", borderRadius: "12px 0 0 12px", background: "#F1EADB", color: "#8B816E", fontSize: 15, fontFamily: "'Hanken Grotesk'" }}>+65</span>
                <input className="rh-email" type="tel" inputMode="numeric" maxLength={8} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="9123 4567" autoComplete="tel" style={{ ...inputStyle, borderRadius: "0 12px 12px 0" }} />
              </div>
              <input className="rh-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" style={inputStyle} />
              <button type="submit" className="rh-dark-cta" style={{ border: "none", cursor: "pointer", background: "#15140F", color: "#EFE9DC", fontFamily: "'Hanken Grotesk'", fontWeight: 700, fontSize: 16, padding: "16px", borderRadius: 12, marginTop: 2 }}>{CTA_LABEL} →</button>
              {error && <div style={{ fontSize: 13, color: "#C0392B", fontWeight: 600 }}>{error}</div>}
            </motion.form>

            <div style={{ marginTop: 14, fontSize: 13, color: "#8B816E", fontWeight: 600, display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>Free, no cost · No obligation · 3-minute process</div>
          </div>
          <div style={{ position: "relative", textAlign: "center", marginTop: 42, color: "#8B816E", fontSize: 11.5, fontFamily: "monospace", letterSpacing: ".14em", textTransform: "uppercase" }}>
            Scroll
            <div style={{ animation: "rh-nudge 1.8s ease-in-out infinite", marginTop: 4 }}>↓</div>
          </div>
        </header>

        {/* ===== DARK STATS BAND ===== */}
        <section style={{ background: "#1A1812", color: "#EAE3D4" }}>
          <div className="rh-stats" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 1fr", alignItems: "stretch" }}>
            <div style={{ padding: "64px 56px 64px 30px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 46, lineHeight: 1, color: "#fff" }}>{MATCHED_COUNT}</div>
                <div style={{ marginTop: 6, fontSize: 13.5, color: "#A89C86" }}>homeowners matched this year</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "#3A332A" }} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 46, lineHeight: 1, color: "#fff" }}>{FIRM_COUNT}</div>
                <div style={{ marginTop: 6, fontSize: 13.5, color: "#A89C86" }}>verified design firms</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "#3A332A" }} />
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 46, lineHeight: 1, color: "#fff" }}>$0</div>
                <div style={{ marginTop: 6, fontSize: 13.5, color: "#A89C86" }}>fee to homeowners</div>
              </div>
            </div>
            <div className="rh-stats-photo" style={{ backgroundImage: `url('${opt(IMG.stats, 900)}')`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 180 }} aria-label="completed renovation" role="img" />
          </div>
        </section>

        {/* ===== TORN-PAPER STATEMENT ===== */}
        <section className="rh-torn" style={{ position: "relative", zIndex: 2, background: "#15140F", padding: "150px 30px", margin: "-1px 0", overflow: "visible" }}>
          {/* Realistic torn-paper edge (public/paper-tear.png) — replaces the
              old geometric clip-path. Centered across the bottom boundary
              (translateY 50%) so its torn edge — not a straight line — meets the
              cream section below, hiding the seam. z-index keeps the overhanging
              tear above the next section. */}
          <img src="/paper-tear.png" alt="" aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "auto", transform: "translateY(50%)", pointerEvents: "none", userSelect: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "#D88A60", fontWeight: 600 }}>Sound familiar?</div>
            <motion.h2 className="rh-h2big" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 58, lineHeight: 1.02, letterSpacing: "-.02em", textTransform: "uppercase", marginTop: 18, color: "#EFE9DC" }}>
              You deserve better than<br />
              <span style={{ fontFamily: "'Instrument Serif'", fontStyle: "italic", fontWeight: 400, textTransform: "none", color: "#E5A582" }}>"good enough."</span>
            </motion.h2>
            <p style={{ marginTop: 22, fontSize: 18, lineHeight: 1.6, color: "#BCB09A", maxWidth: 660, marginLeft: "auto", marginRight: "auto" }}>Most homeowners spend 3 to 6 weeks comparing quotes, scrolling portfolios that all look the same, and second-guessing every decision. The best firms don't advertise, reviews can be bought, and the cheapest quote is rarely the best. You shouldn't have to gamble on your home.</p>
          </div>
        </section>

        {/* ===== FEATURE ROWS ===== */}
        <section id="features" className="rh-sec" style={{ position: "relative", background: "#EFE9DC", padding: "96px 30px" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#E2D8C6 1px,transparent 1px),linear-gradient(90deg,#E2D8C6 1px,transparent 1px)", backgroundSize: "42px 42px", opacity: 0.4 }} />
          <div className="rh-feat-rows" style={{ position: "relative", maxWidth: 1080, margin: "0 auto", display: "flex", flexDirection: "column", gap: 104 }}>

            {/* row 1 — real firm match cards */}
            <div className="rh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>Concierge matching</div>
                <h3 className="rh-h3big" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: 12 }}>Matches that fit how you live.</h3>
                <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: "#544C3F" }}>A real person reads your brief and selects 3 firms, each chosen because they've done projects like yours before. Style, budget, timeline, home type. No auto-generated lists.</p>
                <a href="#match" style={{ display: "inline-block", marginTop: 18, textDecoration: "none", fontWeight: 700, color: "#C25B36", fontSize: 15.5, borderBottom: "2px solid #C25B36", paddingBottom: 2 }}>See your matches →</a>
              </div>
              <div className="rh-mockup" style={{ position: "relative", height: 300 }}>
                {FIRMS.map((firm, i) => {
                  const layout = [
                    { top: 0, right: 8, width: "78%", rotate: 2, z: 1 },
                    { top: 104, left: 0, width: "82%", rotate: -2, z: 2 },
                    { bottom: 0, right: 18, width: "76%", rotate: 3, z: 1 },
                  ][i];
                  return (
                    <div key={firm.name} className="rh-matchcard" style={{ position: "absolute", ...layout, background: "#fff", border: "1px solid #E4DAC6", borderRadius: 16, padding: 16, boxShadow: "0 20px 40px -24px rgba(40,30,18,.4)", transform: `rotate(${layout.rotate}deg)`, display: "flex", alignItems: "center", gap: 12, zIndex: layout.z }}>
                      <FirmLogo firm={firm} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{firm.name}</div>
                        <div style={{ fontSize: 12.5, color: "#8B816E" }}>{firm.style} · {firm.rating} ★</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#5E8C5C", fontWeight: 700 }}>✓</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* row 2 */}
            <div className="rh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div style={{ order: 2 }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>No commissions</div>
                <h3 className="rh-h3big" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: 12 }}>Quotes that stay honest.</h3>
                <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: "#544C3F" }}>We never take a cut from your project. Designers pay a subscription to be here, so there's no markup hidden in your quote. What they quote is exactly what you pay.</p>
                <a href="#tools" style={{ display: "inline-block", marginTop: 18, textDecoration: "none", fontWeight: 700, color: "#C25B36", fontSize: 15.5, borderBottom: "2px solid #C25B36", paddingBottom: 2 }}>Estimate my budget →</a>
              </div>
              <div style={{ order: 1, background: "#fff", border: "1px solid #E4DAC6", borderRadius: 18, padding: 26, boxShadow: "0 24px 50px -30px rgba(40,30,18,.4)" }}>
                <div style={{ fontSize: 13, color: "#8B816E", fontWeight: 600, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>HDB 4-room · full reno</div>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ color: "#544C3F" }}>Carpentry &amp; built-ins</span><span style={{ fontWeight: 600 }}>$24,500</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ color: "#544C3F" }}>Flooring &amp; tiling</span><span style={{ fontWeight: 600 }}>$11,200</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ color: "#544C3F" }}>Kitchen &amp; bathrooms</span><span style={{ fontWeight: 600 }}>$13,800</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ color: "#544C3F" }}>Electrical &amp; plumbing</span><span style={{ fontWeight: 600 }}>$6,400</span></div>
                  <div style={{ height: 1, background: "#E4DAC6", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}><span style={{ fontWeight: 700 }}>Total quote</span><span style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, color: "#C25B36" }}>$55,900</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#5E8C5C", fontWeight: 600 }}><span>Network commission</span><span>$0, never</span></div>
                </div>
              </div>
            </div>

            {/* row 3 — real verified firm profile */}
            <div className="rh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>Verified only</div>
                <h3 className="rh-h3big" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: 12 }}>Designers who earn their spot.</h3>
                <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: "#544C3F" }}>Every firm passes our vetting with real completed projects and real homeowner feedback. No paid placements. A firm can't buy its way onto your shortlist.</p>
                <a href="#why" style={{ display: "inline-block", marginTop: 18, textDecoration: "none", fontWeight: 700, color: "#C25B36", fontSize: 15.5, borderBottom: "2px solid #C25B36", paddingBottom: 2 }}>How we vet firms →</a>
              </div>
              <div style={{ background: "#fff", border: "1px solid #E4DAC6", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 50px -30px rgba(40,30,18,.4)" }}>
                <div style={{ height: 150, backgroundImage: `url('${opt(IMG.portfolio, 760)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="Ciseern portfolio cover" role="img" />
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 20 }}>{FIRMS[0].name}</div>
                    <span style={{ fontSize: 12, color: "#5E8C5C", fontWeight: 700, background: "#DCEBD9", padding: "4px 9px", borderRadius: 99 }}>✓ Verified</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 14, fontSize: 13.5, color: "#8B816E" }}><span>★ {FIRMS[0].rating} ({FIRMS[0].reviews} reviews)</span><span>Modern · Contemporary</span></div>
                  <div style={{ marginTop: 12, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, background: "#F3E4DB", color: "#A8492A", padding: "4px 10px", borderRadius: 99 }}>HDB</span>
                    <span style={{ fontSize: 12, background: "#F3E4DB", color: "#A8492A", padding: "4px 10px", borderRadius: 99 }}>Condo</span>
                    <span style={{ fontSize: 12, background: "#F3E4DB", color: "#A8492A", padding: "4px 10px", borderRadius: 99 }}>Landed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* row 4 */}
            <div className="rh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div style={{ order: 2 }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>Real feedback</div>
                <h3 className="rh-h3big" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: 12 }}>Reviews you can actually trust.</h3>
                <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: "#544C3F" }}>Read unfiltered WhatsApp conversations and project outcomes from homeowners matched through Network. No scripts, no edits, just genuine feedback from real renovations.</p>
                <a href="#why" style={{ display: "inline-block", marginTop: 18, textDecoration: "none", fontWeight: 700, color: "#C25B36", fontSize: 15.5, borderBottom: "2px solid #C25B36", paddingBottom: 2 }}>Read homeowner stories →</a>
              </div>
              <div style={{ order: 1, background: "#fff", border: "1px solid #E4DAC6", borderRadius: 18, padding: 24, boxShadow: "0 24px 50px -30px rgba(40,30,18,.4)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#EFE9DC", borderRadius: "14px 14px 14px 4px", padding: "12px 15px", fontSize: 14.5, color: "#2E281F" }}>Hi Lydia! Based on your brief I've shortlisted 3 firms. Sending portfolios now.</div>
                <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#DCEBD9", borderRadius: "14px 14px 4px 14px", padding: "12px 15px", fontSize: 14.5, color: "#27401F" }}>Wow that was fast! Ciseern looks exactly like what I pictured.</div>
                <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#EFE9DC", borderRadius: "14px 14px 14px 4px", padding: "12px 15px", fontSize: 14.5, color: "#2E281F" }}>They'll WhatsApp you directly to arrange a viewing. No charge, no obligation!</div>
                <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#DCEBD9", borderRadius: "14px 14px 4px 14px", padding: "12px 15px", fontSize: 14.5, color: "#27401F" }}>Thank you so much, this made everything so easy.</div>
              </div>
            </div>

          </div>
        </section>

        {/* ===== FOLDER-TAB EDITORIAL BAND ===== */}
        <section className="rh-sec" style={{ background: "#15140F", color: "#EFE9DC", padding: "90px 30px", position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
            <div className="rh-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 0.86fr", gap: 50, alignItems: "center" }}>
              {/* left: copy */}
              <div>
                <div className="rh-tabs" style={{ display: "flex", gap: 14, marginBottom: 28, paddingLeft: 6 }}>
                  <div style={{ width: 132, height: 92, borderRadius: "12px 12px 0 0", backgroundImage: `url('${opt(IMG.heroMood, 340)}')`, backgroundSize: "cover", backgroundPosition: "center", transform: "translateY(8px) rotate(-2deg)" }} aria-label="firm project" role="img" />
                  <div style={{ width: 150, height: 104, borderRadius: "12px 12px 0 0", backgroundImage: `url('${opt(IMG.heroPlan, 380)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="firm project" role="img" />
                  <div style={{ width: 132, height: 92, borderRadius: "12px 12px 0 0", backgroundImage: `url('${opt(IMG.why2, 340)}')`, backgroundSize: "cover", backgroundPosition: "center", transform: "translateY(8px) rotate(2deg)" }} aria-label="firm project" role="img" />
                </div>
                <motion.h2 className="rh-h2big" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 58, lineHeight: 0.96, letterSpacing: "-.03em", textTransform: "uppercase", textWrap: "balance" }}>
                  You've pictured your dream home. <span style={{ color: "#C2855B" }}>Now let's build it.</span>
                </motion.h2>
                <p style={{ marginTop: 22, fontSize: 18, lineHeight: 1.55, color: "#BCB09A", maxWidth: 480 }}>Every week you delay is another week closer to key collection, and another week your dream home stays on a mood board. Tell us about your project and we'll handle the matching.</p>
                <div style={{ marginTop: 28, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <a href="#match" className="rh-cta" style={{ textDecoration: "none", background: "#C25B36", color: "#fff", fontWeight: 700, fontSize: 16, padding: "16px 28px", borderRadius: 999 }}>{CTA_LABEL} →</a>
                </div>
              </div>
              {/* right: sketch-to-real reveal */}
              <Reveal>
                <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", aspectRatio: "4 / 3", border: "1px solid #2A251D", boxShadow: "0 44px 90px -45px rgba(0,0,0,.85)" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${imgAfter}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div className="rh-sketch" style={{ position: "absolute", inset: 0, backgroundImage: `url('${imgBefore}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <span style={{ position: "absolute", left: 14, bottom: 14, fontFamily: "monospace", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#fff", background: "rgba(21,20,15,.6)", padding: "5px 11px", borderRadius: 999, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>Wireframe to 3D render</span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===== TOOLS / DASHBOARD SHOWCASE ===== */}
        <section id="tools" className="rh-sec" style={{ background: "#EFE9DC", padding: "96px 30px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {/* room designer */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>Free tools</div>
              <motion.h2 className="rh-h2med" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 44, lineHeight: 1.04, letterSpacing: "-.025em", marginTop: 12 }}>
                Visualise before you <span style={{ fontFamily: "'Instrument Serif'", fontStyle: "italic", fontWeight: 400, color: "#C25B36" }}>commit.</span>
              </motion.h2>
              <p style={{ fontSize: 17, color: "#544C3F", maxWidth: 560, margin: "12px auto 0" }}>Use our free tools to understand your budget and see your space transformed, at your own pace, before meeting anyone.</p>
            </div>
            <div style={{ position: "relative", background: "#fff", border: "1px solid #E4DAC6", borderRadius: 22, padding: 14, boxShadow: "0 40px 80px -44px rgba(40,30,18,.5)" }}>
              <div style={{ height: 380, borderRadius: 14, backgroundImage: `url('${opt(IMG.roomDesigner, 1100)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="Room Designer AI render" role="img" />
              <div style={{ position: "absolute", bottom: 48, right: 40, width: 240, background: "#E8A35C", color: "#3A1E08", borderRadius: 14, padding: 18, transform: "rotate(-3deg)", boxShadow: "0 18px 36px -18px rgba(40,30,18,.6)" }}>
                <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 18, lineHeight: 1.1, textTransform: "uppercase" }}>Upload your photo &amp; we'll do the rest</div>
              </div>
            </div>
            {/* cost guide */}
            <div className="rh-grid2" style={{ marginTop: 96, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#C25B36", fontWeight: 600 }}>Cost guide</div>
                <h3 className="rh-h3big" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 38, lineHeight: 1.05, letterSpacing: "-.02em", marginTop: 12 }}>Budgets that stay realistic.</h3>
                <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.55, color: "#544C3F" }}>Get an instant, itemised breakdown of what your budget can realistically achieve, by home type, scope, and finishes. Compare quality tiers before any designer quotes you.</p>
                <a href="#match" style={{ display: "inline-block", marginTop: 18, textDecoration: "none", fontWeight: 700, color: "#C25B36", fontSize: 15.5, borderBottom: "2px solid #C25B36", paddingBottom: 2 }}>Calculate my budget →</a>
              </div>
              <div style={{ position: "relative", height: 320 }}>
                <div style={{ position: "absolute", inset: 0, border: "1px solid #E4DAC6", borderRadius: 16, backgroundImage: `url('${opt(IMG.costGuide, 760)}')`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 24px 50px -30px rgba(40,30,18,.4)" }} aria-label="interior render" role="img" />
                <div style={{ position: "absolute", top: -14, left: -14, background: "#fff", border: "1px solid #E4DAC6", borderRadius: 14, padding: "16px 20px", boxShadow: "0 16px 34px -18px rgba(40,30,18,.4)" }}>
                  <div style={{ fontSize: 12, color: "#8B816E" }}>Good tier</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 26, color: "#15140F" }}>$45,000</div>
                </div>
                <div style={{ position: "absolute", top: 96, right: -18, background: "#15140F", color: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 16px 34px -18px rgba(40,30,18,.5)" }}>
                  <div style={{ fontSize: 12, color: "#A89C86" }}>Better tier</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 26 }}>$62,000</div>
                </div>
                <div style={{ position: "absolute", bottom: -14, left: 24, background: "#C25B36", color: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 16px 34px -18px rgba(40,30,18,.5)" }}>
                  <div style={{ fontSize: 12, color: "#F6D8C9" }}>Network fee</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 26 }}>$0</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRESS / TRUST STRIP ===== */}
        <section style={{ background: "#1A1812", color: "#8B7F68", padding: "40px 30px" }}>
          <div className="rh-trust" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "#6B6353" }}>Built for Singapore homes</span>
            {TRUST_LOGOS.map((l) => (
              <img key={l.label} src={l.src} alt={l.label} title={l.label} loading="lazy" style={{ height: 40, width: "auto", objectFit: "contain", display: "block", opacity: 0.9, flexShrink: 0 }} />
            ))}
          </div>
        </section>

        {/* ===== WHY CHOOSE ===== */}
        <section id="why" className="rh-sec" style={{ background: "#EFE9DC", padding: "96px 30px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <motion.h2 className="rh-h2big" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 54, lineHeight: 1, letterSpacing: "-.03em", textTransform: "uppercase", maxWidth: 820, textWrap: "balance" }}>
              Why <span style={{ color: "#C25B36" }}>{MATCHED_COUNT}</span> homeowners choose Network
            </motion.h2>
            <div className="rh-grid3" style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
              <div>
                <div style={{ height: 180, borderRadius: 16, backgroundImage: `url('${opt(IMG.why1, 560)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="Matched homeowner's renovated home" role="img" />
                <h3 style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 22, marginTop: 18 }}>Concierge-matched</h3>
                <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: "#544C3F" }}>A real person reads your brief and handpicks 3 firms that genuinely fit, not an auto-generated list sold to whoever pays most.</p>
              </div>
              <div>
                <div style={{ height: 180, borderRadius: 16, backgroundImage: `url('${opt(IMG.why2, 560)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="Matched homeowner's renovated home" role="img" />
                <h3 style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 22, marginTop: 18 }}>No commissions, no markup</h3>
                <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: "#544C3F" }}>We never take a cut from your project. Designers pay to be here, so what they quote is exactly what you pay. Free for you, always.</p>
              </div>
              <div>
                <div style={{ height: 180, borderRadius: 16, backgroundImage: `url('${opt(IMG.why3, 560)}')`, backgroundSize: "cover", backgroundPosition: "center" }} aria-label="Matched homeowner's renovated home" role="img" />
                <h3 style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, fontSize: 22, marginTop: 18 }}>Proven to work</h3>
                <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, color: "#544C3F" }}>Vetted firms with real completed projects, real reviews, and a 4.8 average rating from homeowners who were matched through Network.</p>
              </div>
            </div>
            {/* testimonials — auto-scrolling marquee (pauses on hover) */}
            <Reveal style={{ marginTop: 48 }}>
              <div className="rh-marquee" style={{ overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)", maskImage: "linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)" }}>
                <div className="rh-marquee-track">
                  {[...TESTIMONIALS_LIST, ...TESTIMONIALS_LIST].map((t, i) => (
                    <div key={i} style={{ width: 380, flexShrink: 0, background: "#15140F", color: "#EFE9DC", borderRadius: 22, padding: 30, display: "flex", flexDirection: "column", gap: 16 }}>
                      <p style={{ fontFamily: "'Instrument Serif'", fontStyle: "italic", fontSize: 20, lineHeight: 1.45, color: "#EFE9DC", margin: 0 }}>"{t.quote}"</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: "auto" }}>
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#C25B36", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{t.initial}</div>
                        <div style={{ fontSize: 14, color: "#A89C86", lineHeight: 1.4 }}><strong style={{ color: "#fff", display: "block" }}>{t.name}</strong>{t.role} · <span style={{ color: "#7FB77E", fontWeight: 600 }}>✓ Verified</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <a href="#match" className="rh-cta" style={{ textDecoration: "none", background: "#C25B36", color: "#fff", fontWeight: 700, fontSize: 17, padding: "17px 34px", borderRadius: 999, display: "inline-block" }}>{CTA_LABEL} →</a>
              <div style={{ marginTop: 14, fontSize: 13.5, color: "#8B816E", fontWeight: 600 }}>7 questions · 2 minutes · free, no obligation</div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer style={{ background: "#121009", color: "#A89C86", padding: "64px 30px 0", overflow: "hidden" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="rh-footer" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 36, paddingBottom: 48 }}>
              <div>
                <NetworkWordmark color="#EFE9DC" height={26} />
                <p style={{ marginTop: 16, fontSize: 14.5, lineHeight: 1.6, maxWidth: 300 }}>Singapore's interior design matching service. Get paired with vetted firms that fit your style, budget, and timeline, free, no obligation.</p>
                <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #2E281F", display: "flex", alignItems: "center", justifyContent: "center", color: "#CDC2AD" }}>f</span>
                  <span style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #2E281F", display: "flex", alignItems: "center", justifyContent: "center", color: "#CDC2AD" }}>◎</span>
                </div>
              </div>
              <div>
                <div style={{ color: "#EFE9DC", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Explore</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5 }}>
                  <a href="/" style={{ color: "#A89C86", textDecoration: "none" }}>Home</a>
                  <a href="/interior-designers" style={{ color: "#A89C86", textDecoration: "none" }}>Interior Designers</a>
                  <a href="/blog" style={{ color: "#A89C86", textDecoration: "none" }}>Blog</a>
                  <a href="/explore" style={{ color: "#A89C86", textDecoration: "none" }}>Explore</a>
                </div>
              </div>
              <div>
                <div style={{ color: "#EFE9DC", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Free tools</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5 }}>
                  <a href="/render-tool" style={{ color: "#A89C86", textDecoration: "none" }}>Room Designer</a>
                  <a href="/floorplan3d" style={{ color: "#A89C86", textDecoration: "none" }}>Layout Planner</a>
                  <a href="/cost-guide" style={{ color: "#A89C86", textDecoration: "none" }}>Cost Guide</a>
                  <a href="/networkxhandshake" style={{ color: "#A89C86", textDecoration: "none" }}>Handshake Escrow</a>
                </div>
              </div>
              <div>
                <div style={{ color: "#EFE9DC", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Company</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14.5 }}>
                  <a href="/privacy-policy" style={{ color: "#A89C86", textDecoration: "none" }}>Privacy Policy</a>
                  <a href="#" style={{ color: "#A89C86", textDecoration: "none" }}>Contact</a>
                </div>
              </div>
            </div>
            <div style={{ padding: "22px 0", borderTop: "1px solid #2A251D", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#6B6353" }}>
              <span>Copyright 2026 Network. All rights reserved.</span>
              <span>Made for Singapore homeowners 🇸🇬</span>
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 800, fontSize: "clamp(90px,21vw,290px)", lineHeight: 0.8, letterSpacing: "-.04em", color: "#1C190F", textAlign: "center", margin: "0 -10px", userSelect: "none" }}>Network</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Seo } from "../shared/Seo";
import { LEAD_PAGE_CSS, LEAD_PAGE_CLASS, LeadPageFonts } from "../shared/leadPageStyles";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
import { useHomeownerCount } from "../homepage/v8/useHomeownerCount";
import { useGoogleReviews } from "../useGoogleReviews";
import { GoogleReviewsLive } from "./GoogleReviewsLive";
import { SocialProof3 } from "../homepage/v8/sections/SocialProof3";
import { FreeTools } from "../homepage/v8/sections/FreeTools";
import { FUNNEL_HERO, FUNNEL_VALUE_PROPS } from "./content";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

/**
 * /get-matched — primary lead-capture page.
 *
 * Copy + section order are preserved from the previous funnel layout
 * (FUNNEL_HERO + Google reviews + social proof + FUNNEL_VALUE_PROPS + Free
 * Tools + footer CTA). The visual design now uses the shared `lead-page`
 * system from /escrow (orange accent, Fraunces serif, Plus Jakarta Sans),
 * and the lead form is the qualifier-radio variant from /escrow.
 */
export function FunnelLeadPage() {
  const homeownerCount = useHomeownerCount();
  const { payload } = useGoogleReviews("network");
  const rating = payload?.rating ? payload.rating.toFixed(1) : "4.5";
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Smooth-scroll for in-page anchors that bypass the global router.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        (target as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <Seo
        title="Get Matched with Singapore Interior Designers | Network"
        description="Tell us about your home and we'll match you with 3 vetted interior design firms within the day. Free, no obligation."
        canonical="/get-matched"
      />

      <LeadPageFonts />
      <style>{LEAD_PAGE_CSS}</style>

      <div className={LEAD_PAGE_CLASS}>
        {/* ── NAV ────────────────────────────────────────────── */}
        <nav className="lead-nav">
          <div className="nav-inner">
            <a
              href="/"
              aria-label="Network — home"
              className="logo-mark"
              style={{
                width: "110px",
                height: "23px",
                background: "var(--ink)",
                display: "block",
                maskImage: `url('${logoImg}')`,
                maskSize: "111.804px 22.909px",
                maskRepeat: "no-repeat",
                maskPosition: "0px 0px",
                WebkitMaskImage: `url('${logoImg}')`,
                WebkitMaskSize: "111.804px 22.909px",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "0px 0px",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
              }}
            >
              {FUNNEL_HERO.microTrust}
            </span>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div>
                <div className="trust-badge">{homeownerCount.toLocaleString()} homeowners matched</div>
                <h1>
                  {FUNNEL_HERO.headline}{" "}
                  <em>{FUNNEL_HERO.headlineItalic}</em>
                </h1>
                <p className="hero-lede">{FUNNEL_HERO.subheadline}</p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    `Rated ${rating} on Google`,
                    FUNNEL_HERO.trustBullets[1],
                    FUNNEL_HERO.trustBullets[2],
                  ].map((bullet) => (
                    <li
                      key={bullet}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "15px",
                        color: "var(--ink)",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          background: "var(--accent)",
                          color: "white",
                          flexShrink: 0,
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                        aria-hidden
                      >✓</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── FORM (escrow-style qualifier radios) ── */}
              <div className="form-card" id="match">
                <div className="form-header">
                  <div className="form-eyebrow">{FUNNEL_HERO.eyebrow}</div>
                  <h2 className="form-title">{FUNNEL_HERO.formTitle}</h2>
                  <p className="form-sub">{FUNNEL_HERO.formSubtitle}</p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (submitting) return;
                    const formEl = e.currentTarget as HTMLFormElement;
                    setSubmitting(true);
                    setSubmitError("");
                    try {
                      const fd = new FormData(formEl);
                      const phone = String(fd.get("phone") || "").trim();
                      const data = {
                        "First Name": String(fd.get("name") || "").trim(),
                        "Contact Phone": phone ? `+65${phone.replace(/\s+/g, "")}` : "",
                        "Email Address": String(fd.get("email") || "").trim(),
                        "Property Type": String(fd.get("propertyType") || ""),
                        "Move-In Window": String(fd.get("movein") || ""),
                        "Renovation Budget": String(fd.get("budget") || ""),
                        "Source": "Get Matched Landing",
                        "Submitted At": new Date().toISOString(),
                      };
                      const r = await fetch(`${API}/zapier-proxy`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
                        body: JSON.stringify({ hook: "concierge-match-lead", data }),
                      });
                      if (!r.ok) {
                        const j = await r.json().catch(() => ({}));
                        throw new Error(j?.error || `Submit failed (${r.status})`);
                      }
                      formEl.reset();
                      setSubmitted(true);
                    } catch (err: any) {
                      setSubmitError(err?.message || "Submission failed. Please try again.");
                    }
                    setSubmitting(false);
                  }}
                >
                  <div className="field-group">
                    <label className="field-label" htmlFor="lead-name">Your name</label>
                    <input type="text" id="lead-name" name="name" placeholder="Jane Tan" required />
                  </div>

                  <div className="field-row-2">
                    <div className="field-group">
                      <label className="field-label" htmlFor="lead-phone">Mobile number</label>
                      <div className="phone-wrapper">
                        <span className="phone-prefix">+65</span>
                        <input
                          type="tel"
                          id="lead-phone"
                          name="phone"
                          placeholder="9123 4567"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={8}
                          pattern="[0-9]{8}"
                          title="Singapore mobile number — 8 digits"
                          onInput={(e) => {
                            const t = e.currentTarget;
                            const digits = t.value.replace(/\D+/g, "").slice(0, 8);
                            if (digits !== t.value) t.value = digits;
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="lead-email">Email</label>
                      <input type="email" id="lead-email" name="email" placeholder="jane@example.com" required />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Property type</label>
                    <div className="qualifier-group">
                      {[
                        { value: "HDB", label: "HDB" },
                        { value: "Condominium", label: "Condo" },
                        { value: "EC", label: "EC" },
                        { value: "Landed", label: "Landed" },
                        { value: "Commercial", label: "Commercial" },
                      ].map((opt, i) => (
                        <label key={opt.value} className="qualifier-option">
                          <input type="radio" name="propertyType" value={opt.value} required={i === 0} />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">
                      When do you need to move in?{" "}
                      <span className="field-label-sub">(filters intent)</span>
                    </label>
                    <div className="qualifier-group">
                      {[
                        { value: "have-keys", label: "Have keys" },
                        { value: "1-month", label: "< 1 month" },
                        { value: "1-3-months", label: "1–3 months" },
                        { value: "3-6-months", label: "3–6 months" },
                        { value: "6-plus", label: "6+ months" },
                        { value: "researching", label: "Researching" },
                      ].map((opt, i) => (
                        <label key={opt.value} className="qualifier-option">
                          <input type="radio" name="movein" value={opt.value} required={i === 0} />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Renovation budget</label>
                    <div className="qualifier-group">
                      {[
                        { value: "30-60k", label: "$30–60k" },
                        { value: "60-100k", label: "$60–100k" },
                        { value: "100-200k", label: "$100–200k" },
                        { value: "200k-plus", label: "$200k+" },
                      ].map((opt, i) => (
                        <label key={opt.value} className="qualifier-option">
                          <input type="radio" name="budget" value={opt.value} required={i === 0} />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={submitting || submitted}>
                    {submitted ? "Thanks — we'll be in touch within 24 hours." : submitting ? "Sending…" : FUNNEL_HERO.finalCTA}
                  </button>

                  {submitError && (
                    <p style={{ marginTop: 10, fontSize: 12, color: "#c14", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {submitError}
                    </p>
                  )}

                  <div className="form-trust">
                    <span>Free</span>
                    <span>·</span>
                    <span>No obligations</span>
                    <span>·</span>
                    <span>Unsubscribe anytime</span>
                  </div>
                </form>

                <div className="whatsapp-divider">or</div>

                <a
                  href="https://wa.me/6581424954?text=Hi%20Network%2C%20I%27d%20like%20to%20get%20matched%20with%203%20designers."
                  className="btn-whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = document.querySelector("#match form") as HTMLFormElement | null;
                    if (!form || !form.checkValidity()) {
                      form?.reportValidity();
                      form?.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }
                    const checkedLabel = (name: string) => {
                      const input = form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null;
                      return input?.parentElement?.querySelector("span")?.textContent?.trim() || "";
                    };
                    const fd = new FormData(form);
                    const get = (name: string) => String(fd.get(name) || "").trim();
                    const lines = [
                      `• Name: ${get("name")}`,
                      `• Phone: +65 ${get("phone").replace(/\s+/g, "")}`,
                      `• Email: ${get("email")}`,
                      `• Property: ${checkedLabel("propertyType")}`,
                      `• Move-in: ${checkedLabel("movein")}`,
                      `• Budget: ${checkedLabel("budget")}`,
                    ];
                    const msg = `Hi Network, I'd like to get matched with 3 designers. Here's my details:\n${lines.join("\n")}`;
                    const url = `https://wa.me/6581424954?text=${encodeURIComponent(msg)}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="#25D366">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Prefer WhatsApp? Chat with our concierge
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── GOOGLE REVIEWS (existing live component, original copy) ── */}
        <GoogleReviewsLive />

        {/* ── SOCIAL PROOF (existing component) ── */}
        <SocialProof3 />

        {/* ── VALUE PROPS — original FUNNEL_VALUE_PROPS copy, restyled ── */}
        <section className="why">
          <div className="container">
            <div className="why-header">
              <span className="section-eyebrow">{FUNNEL_VALUE_PROPS.eyebrow}</span>
              <h2>
                {FUNNEL_VALUE_PROPS.headline}{" "}
                <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>
                  {FUNNEL_VALUE_PROPS.headlineItalic}
                </em>
              </h2>
            </div>
            <div className="why-grid">
              {FUNNEL_VALUE_PROPS.cards.map((card, i) => (
                <div key={card.title} className={i === 0 ? "why-card featured" : "why-card"}>
                  <div className="why-card-icon" style={i === 0 ? { color: "white" } : undefined}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FREE TOOLS (existing component) ── */}
        <FreeTools />

        {/* ── FINAL CTA ──────────────────────────────────────── */}
        <section className="final-cta">
          <div className="container">
            <h2>Still <em>thinking about it?</em></h2>
            <p>
              {homeownerCount.toLocaleString()} homeowners used Network this year to find a designer they can trust. Free, within the day, zero obligations.
            </p>
            <a href="#match" className="btn-large">Get my free match</a>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <footer className="lead-footer">
          <div className="container">
            <p>© 2026 Network. <a href="/privacy-policy">Privacy</a></p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default FunnelLeadPage;

import { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Seo } from "./shared/Seo";
import { LEAD_PAGE_CSS, LEAD_PAGE_CLASS, LeadPageFonts } from "./shared/leadPageStyles";
import { trackLead } from "../utils/metaPixel";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/**
 * /escrow — alt landing page that leads with the DBS-protected escrow
 * positioning. Self-contained styling (Plus Jakarta Sans + Fraunces, scoped
 * via a single <style> block) so this concept can ship without touching the
 * main homepage palette.
 *
 * NOTE: this page intentionally does NOT use the shared HomepageNav / Footer
 * — the brief is a one-off variant for the escrow trust angle.
 */
// Floor to the nearest 10 with a "+" suffix — keeps the marketing tone
// ("120+ vetted firms") so the number stays a confidence signal even as the
// pipeline grows. Falls back to "120+" while the count loads.
function formatFirmCount(n: number | null): string {
  if (!n || n < 10) return "120+";
  return `${Math.floor(n / 10) * 10}+`;
}

export function Escrow() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [firmCount, setFirmCount] = useState<number | null>(null);

  // Pull the live firm count from the Airtable pipeline once on mount so the
  // hero stat reflects reality instead of a hardcoded "120+".
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/firm-onboarding/airtable-firms-count`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((r) => r.json())
      .then((j) => { if (!cancelled && typeof j?.count === "number" && j.count > 0) setFirmCount(j.count); })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const firmCountLabel = formatFirmCount(firmCount);

  // Smooth-scroll for in-page anchors that aren't covered by the global router.
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
        title="Network | Your Renovation Deposit, Protected by DBS Bank"
        description="Match with Singapore's most trusted interior designers within 24 hours. Bank-grade deposit protection via DBS escrow. Free for homeowners, 120+ vetted firms."
        canonical="/escrow"
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
            <div className="nav-links">
              <a href="#how">How it works</a>
              <a href="#why">Why Network</a>
              <a href="#tools">Free tools</a>
            </div>
            <a href="#match" className="btn-nav">Get matched</a>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────── */}
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div>
                <div className="trust-badge">MAS-regulated · Funds held with DBS</div>
                <h1>Your renovation deposit, <em>protected by DBS Bank.</em></h1>
                <p className="hero-lede">
                  Match with Singapore's most trusted interior designers — within 24 hours.
                  Free for homeowners. Bank-grade deposit protection. {firmCountLabel} vetted firms.
                </p>
                <div className="hero-stats">
                  <div>
                    <div className="hero-stat-num">2,735</div>
                    <div className="hero-stat-label">Matched 2026</div>
                  </div>
                  <div>
                    <div className="hero-stat-num">{firmCountLabel}</div>
                    <div className="hero-stat-label">Verified firms</div>
                  </div>
                  <div>
                    <div className="hero-stat-num">4.8</div>
                    <div className="hero-stat-label">Avg rating</div>
                  </div>
                  <div>
                    <div className="hero-stat-num">$0</div>
                    <div className="hero-stat-label">Cost to you</div>
                  </div>
                </div>
              </div>

              <div className="form-card" id="match">
                <div className="form-header">
                  <div className="form-eyebrow">3-Designer Concierge Match</div>
                  <h2 className="form-title">Get matched in 24 hours</h2>
                  <p className="form-sub">Tell us about your renovation. Our concierge handpicks 3 firms that fit.</p>
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
                        "Source": "Escrow Landing",
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
                      // Wipe inputs + radio selections so the form is ready for the
                      // next visitor without a manual page refresh.
                      formEl.reset();
                      trackLead("escrow-form");
                      setSubmitted(true);
                    } catch (err: any) {
                      setSubmitError(err?.message || "Submission failed. Please try again.");
                    }
                    setSubmitting(false);
                  }}
                >
                  <div className="field-group">
                    <label className="field-label" htmlFor="esc-name">Your name</label>
                    <input type="text" id="esc-name" name="name" placeholder="Jane Tan" required />
                  </div>

                  <div className="field-row-2">
                    <div className="field-group">
                      <label className="field-label" htmlFor="esc-phone">Mobile number</label>
                      <div className="phone-wrapper">
                        <span className="phone-prefix">+65</span>
                        <input
                          type="tel"
                          id="esc-phone"
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
                      <label className="field-label" htmlFor="esc-email">Email</label>
                      <input type="email" id="esc-email" name="email" placeholder="jane@example.com" required />
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
                    {submitted ? "Thanks — we'll be in touch within 24 hours." : submitting ? "Sending…" : "Match me with 3 designers"}
                  </button>

                  {submitError && (
                    <p style={{ marginTop: 10, fontSize: 12, color: "#c14", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {submitError}
                    </p>
                  )}

                  <div className="form-trust">
                    <span>Free</span>
                    <span>·</span>
                    <span>24-hour match</span>
                    <span>·</span>
                    <span>No obligation</span>
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
                    // Require the form to be complete before opening WhatsApp —
                    // surfaces the browser's native validation tooltip for any
                    // missing field and scrolls it into view.
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

        {/* ── WHY NETWORK ────────────────────────────────────── */}
        <section className="why" id="why">
          <div className="container">
            <div className="why-header">
              <span className="section-eyebrow">Why Network</span>
              <h2>The only platform with bank-grade renovation protection</h2>
              <p>Other platforms offer "guarantees". We offer escrow held by DBS — the same protection you'd get from a property purchase.</p>
            </div>

            <div className="why-grid">
              <div className="why-card featured">
                <div className="why-card-icon" style={{ color: "white" }}>$</div>
                <span className="why-card-tag">Exclusive to Network</span>
                <h3>Handshake Escrow by DBS</h3>
                <p>Your renovation deposit sits in a MAS-regulated escrow account, held with DBS. Funds release only when you approve milestones. Not an insurance promise — actual bank protection.</p>
              </div>

              <div className="why-card">
                <div className="why-card-icon">AI</div>
                <span className="why-card-tag">Free Tool</span>
                <h3>See your space transformed</h3>
                <p>Upload a photo of your room. Our AI shows it in 6 different styles in 5 minutes. Test before you commit to any designer.</p>
              </div>

              <div className="why-card">
                <div className="why-card-icon">24h</div>
                <span className="why-card-tag">Concierge</span>
                <h3>Matched by a person, not a bot</h3>
                <p>Our concierge reads your brief and handpicks 3 firms from {firmCountLabel} verified designers. WhatsApp intro within 24 hours.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section className="how" id="how">
          <div className="container">
            <div className="how-header">
              <span className="section-eyebrow">How it works</span>
              <h2>From brief to match in 24 hours</h2>
            </div>
            <div className="how-steps">
              <div className="how-step">
                <span className="how-step-num">01</span>
                <h3>Tell us your brief</h3>
                <p>Two minutes. Six questions about your home, style, budget, and timeline. No account needed.</p>
              </div>
              <div className="how-step">
                <span className="how-step-num">02</span>
                <h3>Concierge handpicks 3 firms</h3>
                <p>A real person reviews your brief and selects 3 verified designers from our network. Within the day.</p>
              </div>
              <div className="how-step">
                <span className="how-step-num">03</span>
                <h3>Meet, compare, decide</h3>
                <p>Designers WhatsApp you directly with portfolios and itemised quotes. Compare at your pace. Walk away anytime.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TOOLS ──────────────────────────────────────────── */}
        <section className="tools" id="tools">
          <div className="container">
            <div className="tools-header">
              <span className="section-eyebrow">Free for everyone</span>
              <h2>Plan smart. Match smarter.</h2>
              <p>Our renovation tools are free, no signup wall. Use them before you decide to engage anyone.</p>
            </div>

            <div className="tools-grid">
              <div className="tool-card">
                <span className="tool-card-tag">AI Render</span>
                <h3>Room Designer</h3>
                <p>Upload your room. See it transformed in 6 styles in 5 minutes. No commitment.</p>
                <a href="/render-tool" className="tool-card-cta">Try Room Designer →</a>
              </div>
              <div className="tool-card">
                <span className="tool-card-tag">Calculator</span>
                <h3>Cost Guide</h3>
                <p>Itemised renovation cost breakdown by room, scope, and finish quality. Honest numbers.</p>
                <a href="/cost-guide" className="tool-card-cta">Calculate budget →</a>
              </div>
              <div className="tool-card">
                <span className="tool-card-tag">3D Planner</span>
                <h3>Layout Planner</h3>
                <p>Convert any floor plan to 3D. Drag furniture, test layouts. Plan visually.</p>
                <a href="/floorplan3d" className="tool-card-cta">Plan layout →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────── */}
        <section className="final-cta">
          <div className="container">
            <h2>Match with designers you can <em>actually trust.</em></h2>
            <p>2,735 Singapore homeowners matched in 2026. Bank-grade escrow. 24-hour concierge match. Always free.</p>
            <a href="#match" className="btn-large">Get my 3 matches</a>
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


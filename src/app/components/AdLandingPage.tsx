import { useEffect, useState } from "react";
import { GOOGLE_REVIEWS } from "./homepage/v8/sections/GoogleReviews";
import { COMPLETION, TRUST_STATS, TESTIMONIALS } from "./homepage/content";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sendToZapier } from "@/app/utils/zapier";
import { recordAttribution } from "@/app/utils/attribution";
import { trackLead } from "@/app/utils/metaPixel";
import { isValid8DigitPhone } from "../utils/phone-validation";
import { isValidEmail } from "../utils/sanitize";
import { thumbnailUrl } from "../utils/image-url";
import { Seo } from "./shared/Seo";

/* ─────────────────────────────────────────────────────────────────
 * Ad landing page ("network-ad-lp"). Standalone direct-response page
 * for paid traffic: minimal nav (logo + CTA only, no menu leaks),
 * its own visual identity (paper / ink / orange, Instrument Serif +
 * Geist), and the same lead pipeline as the homepage — a name / phone /
 * email contact card that submits straight to homepage_leads + Zapier.
 *
 * Real content sourced from the homepage: trust stats, Google
 * reviews, testimonials, WhatsApp social-proof screenshots, and
 * featured-project photos from verified firms.
 * ──────────────────────────────────────────────────────────────── */

// Featured-project photos from verified firms (same Supabase bucket the
// directory cards pull from; all URLs verified 200 at build time).
const BUCKET = "https://hycxkpassywjvdqduzrx.supabase.co/storage/v1/object/public/make-4808de5e-designers";
const PHOTOS = {
  chip1: `${BUCKET}/drive/2026-04-29/46b14398-32e8-4722-ac39-16b13359b8da.jpg`,
  chip2: `${BUCKET}/drive/2026-04-29/325eab12-169e-4bbe-b2f8-05ccbe128c2f.jpg`,
  band: [
    `${BUCKET}/drive/2026-04-29/cc4878c4-908e-41cd-a225-66a6e50dc46f.jpg`,
    `${BUCKET}/imported/2bf17939-2a8d-44b7-b102-5c5defb7cf01.jpeg`,
    `${BUCKET}/imported/d9223fa7-bd1f-4463-9a67-de006917e7fc.jpeg`,
    `${BUCKET}/imported/5794fb19-148a-42f6-8c77-0202dc6b728d.jpeg`,
    `${BUCKET}/drive/2026-05-22/616b2d9d-8a56-4013-b48b-91a39c00406c.jpg`,
  ],
  feature: `${BUCKET}/drive/2026-05-12/dad6e91b-9fdf-488a-9237-bee363f35cc7.jpg`,
  stories: [
    `${BUCKET}/imported/a3abe03d-af81-4599-856b-b82fc1fdba56.jpeg`,
    `${BUCKET}/imported/86bf9664-7bbf-46b7-85c1-5a6ec7797db7.jpeg`,
    `${BUCKET}/imported/6b4cfa0f-8806-43f5-a6db-a8e8b391a6b8.jpeg`,
  ],
  proof: `${BUCKET}/imported/94ab90d9-21c9-447d-9da2-7f038f55c1bd.jpeg`,
};

// Real WhatsApp concierge-chat screenshots (homepage social-proof bucket).
const SUPABASE_SP = "https://ttalzucoummnkomjvcfr.supabase.co/storage/v1/object/public/social-proof";
const WHATSAPP_SHOTS = [
  { url: `${SUPABASE_SP}/ho-feedback/img-000.jpg`, tag: "WhatsApp · Concierge chat" },
  { url: `${SUPABASE_SP}/ho-feedback/img-005.jpg`, tag: "WhatsApp · After matching" },
];

const AVATARS = ["/Profile/avatar-1.webp", "/Profile/avatar-2.webp", "/Profile/avatar-3.webp"];

const img = (src: string, w: number) => thumbnailUrl(src, w, 72);

/** Persist an ad-LP lead: dedicated `ad_lp_leads` table (slim — the page
 *  captures no qualifying answers), ad attribution, and the "ad-lp-lead"
 *  Zapier hook with the same field names the CRM maps for hero leads. */
function submitAdLpLead(form: { name: string; phone: string; email: string }): void {
  fetch(`https://${projectId}.supabase.co/rest/v1/ad_lp_leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      source: "/match",
    }),
  })
    .then((r) => {
      if (!r.ok) console.error("Ad LP lead save failed:", r.status);
    })
    .catch((err) => console.error("Ad LP lead save error:", err));

  recordAttribution("homepage-lead", form.email);

  sendToZapier("ad-lp-lead", {
    "First Name": form.name,
    "Contact Phone": form.phone,
    "Email Address": form.email || "",
    "Lead Form": "Ad Landing Page",
  });
}

/* ── Lead funnel: LP-styled contact card → completion. Name / phone /
 *    email only — no qualifying questions on the ad LP, so the lead
 *    fires the moment the contact card is submitted. Same pipeline as
 *    the homepage / directory funnels, tagged "Ad Landing Page" so ops
 *    can split performance. ── */
function AdLeadFunnel({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<"capturing" | "complete">("capturing");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [touched, setTouched] = useState(false);

  if (state === "complete") {
    return (
      <div className="match-card" style={{ textAlign: "center" }}>
        <span className="mono">You're in</span>
        <h3>{COMPLETION.headline}</h3>
        <p>{COMPLETION.subheadline}</p>
      </div>
    );
  }

  const valid = form.name.trim() && isValid8DigitPhone(form.phone) && isValidEmail(form.email);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setTouched(true);
      return;
    }
    setState("complete");
    trackLead("ad-lp-lead", { email: form.email, phone: form.phone });
    submitAdLpLead(form);
  };

  return (
    <form className="match-card" onSubmit={submit} noValidate>
      <span className="mono">Free · 1 minute</span>
      <h3>Get your 3 designer matches</h3>
      <p>
        {compact
          ? "Handpicked by our concierge team, same day."
          : "Leave your details and our concierge will call to understand your brief, then handpick 3 firms that fit."}
      </p>
      {/* Honeypot — hidden from users, bots fill this */}
      <div style={{ position: "absolute", left: -9999, opacity: 0, height: 0, overflow: "hidden" }} aria-hidden tabIndex={-1}>
        <input type="text" name="_hp_field" autoComplete="off" tabIndex={-1} />
      </div>
      <div className="field">
        <input
          type="text"
          placeholder="Name"
          aria-label="Name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="field">
        <input
          type="tel"
          placeholder="+65 Phone (8 digits)"
          aria-label="Phone"
          autoComplete="tel"
          maxLength={8}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 8) })}
        />
      </div>
      <div className="field">
        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      {touched && !valid && (
        <p className="form-err">Please fill in your name, an 8-digit SG phone number, and a valid email.</p>
      )}
      <button className="btn" type="submit">
        Get my free matches <span className="arr">→</span>
      </button>
      <div className="assure">
        <span>✓ Free</span>
        <span>✓ No obligation</span>
        <span>✓ No spam, ever</span>
      </div>
    </form>
  );
}

function Btn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="btn" href={href}>
      {children} <span className="arr">→</span>
    </a>
  );
}

const TICKER_LINES = [
  "120+ verified firms · 0 paid placements",
  "★ 4.8 on Google",
  "3,214 homeowners matched this year",
  "Free for homeowners · No commissions, no markup",
  "Shortlist of 3 firms, same day",
  "Every firm vetted on completed projects",
];

export function AdLandingPage() {
  // The LP relies on in-page #match anchors; smooth-scroll lives on <html>,
  // which we can't reach from scoped CSS — set it for the page's lifetime.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  const reviews = [GOOGLE_REVIEWS[3], GOOGLE_REVIEWS[2], GOOGLE_REVIEWS[4]]; // sean, Ephraim, Leslie

  return (
    <div className="adlp">
      <Seo
        title="Get Matched With 3 Verified Interior Designers — Network Singapore"
        description="Tell us about your home. Our concierge handpicks 3 verified interior design firms that fit your style, budget, and timeline. Free, same day, no obligation."
        noindex
      />
      <style>{ADLP_CSS}</style>

      {/* Ticker */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-inner">
          {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      </div>

      {/* Nav: logo + CTA only, no leaks */}
      <nav>
        <div className="wrap nav-row">
          <a className="logo" href="#top">
            Network<sup>®</sup>
          </a>
          <span className="nav-proof">★ 4.8 on Google · 3,214 matched this year</span>
          <Btn href="#match">Get matched</Btn>
        </div>
      </nav>

      {/* 1. HERO + FORM */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div>
            <div className="hero-eyebrow">
              <span className="dot"></span>
              <span className="mono">Free designer matching · Singapore</span>
            </div>
            <h1>
              Renovate{" "}
              <span className="chip ph">
                <img src={img(PHOTOS.chip1, 240)} alt="" loading="eager" />
              </span>{" "}
              with confidence. Matched to a designer you can <em>trust</em>.
            </h1>
            <p className="hero-sub">
              Tell us about your home. Our concierge handpicks <strong>3 verified firms</strong> that fit your style,
              budget, and timeline. Free, within the day, no obligation.
            </p>
            <div className="avatar-row">
              <div className="faces">
                {AVATARS.map((a) => (
                  <img key={a} className="avatar" src={a} alt="" loading="lazy" />
                ))}
              </div>
              <span>
                <span className="stars">★★★★★</span> 4.8 · 3,214 matched this year
              </span>
            </div>
          </div>
          <div id="match">
            <AdLeadFunnel />
          </div>
        </div>
      </header>

      {/* 2. STATS — same numbers the homepage publishes */}
      <div className="stats">
        <div className="stats-row">
          <div className="stat">
            <b>
              120<em>+</em>
            </b>
            <span>Verified firms</span>
          </div>
          <div className="stat">
            <b>
              4.8<em>★</em>
            </b>
            <span>Google rating</span>
          </div>
          <div className="stat">
            <b>{TRUST_STATS[2].value}</b>
            <span>Matched this year</span>
          </div>
          <div className="stat">
            <b>$0</b>
            <span>Cost to you</span>
          </div>
        </div>
      </div>

      {/* 3. PROJECT PHOTO BAND — featured projects by verified firms */}
      <div className="photo-band">
        {PHOTOS.band.map((src, i) => (
          <div className="ph" key={i}>
            <img src={img(src, 640)} alt="Completed project by a verified Network firm" loading="lazy" />
            <span className="spec">Completed project · Verified firm</span>
          </div>
        ))}
      </div>

      {/* 4. FEATURED STORY */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">Matched homeowners</span>
              <h2>
                Proof you can <em>walk through</em>.
              </h2>
            </div>
            <p>Real reviews from matched homeowners, pulled straight from Google. Nothing staged.</p>
          </div>
          <div className="feature-story">
            <div className="fs-media">
              <img src={img(PHOTOS.feature, 960)} alt="Completed living room by a verified Network firm" loading="lazy" />
            </div>
            <div className="fs-body">
              <blockquote className="fs-quote">
                "She took the time to really understand what I was looking for and went the extra mile to match me with
                the <em>right</em> interior designers."
              </blockquote>
              <div className="fs-author">
                <a href={GOOGLE_REVIEWS[1].link} target="_blank" rel="noopener noreferrer">
                  Jonnie Josiah Soo · ★★★★★ Google review
                </a>
              </div>
              <dl className="meta-table">
                <div>
                  <dt>Shortlist</dt>
                  <dd>3 verified firms</dd>
                </div>
                <div>
                  <dt>Turnaround</dt>
                  <dd>Same day</dd>
                </div>
                <div>
                  <dt>Cost to you</dt>
                  <dd>$0</dd>
                </div>
                <div>
                  <dt>Obligation</dt>
                  <dd>None — walk away anytime</dd>
                </div>
              </dl>
              <Btn href="#match">Get matched like they did</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DARK PAIN + CTA */}
      <section className="dark">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono" style={{ color: "var(--orange)" }}>
                Sound familiar?
              </span>
              <h2>
                The wrong designer costs you months and <em>thousands</em>.
              </h2>
            </div>
            <p style={{ color: "rgba(245,239,227,.6)" }}>
              Most homeowners spend 3 to 6 weeks researching. After all that, they still feel unsure.
            </p>
          </div>
          <div className="pain-list">
            <div className="pain">
              <span className="mono">01</span>
              <p>Overwhelmed comparing quotes, unsure if you're overcharged or getting a fair deal.</p>
            </div>
            <div className="pain">
              <span className="mono">02</span>
              <p>Worried about a designer who looks great online but delivers sloppy work and broken promises.</p>
            </div>
            <div className="pain">
              <span className="mono">03</span>
              <p>Weeks of scrolling portfolios that all look the same, with no real way to tell who is actually good.</p>
            </div>
          </div>
          <div className="dark-cta">
            <Btn href="#match">Skip the research, get matched</Btn>
            <p>A shortlist of 3 verified designers, handpicked from 120+, matched to your style, budget, and timeline.</p>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">How it works</span>
              <h2>
                A shortlist in <em>three</em> steps.
              </h2>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="mono step-time">~1 min</span>
              <div className="num">01</div>
              <h3>Leave your details</h3>
              <p>Just your name, phone, and email. Our concierge calls to understand your home, style, budget, and timeline.</p>
            </div>
            <div className="step">
              <span className="mono step-time">Same day</span>
              <div className="num">02</div>
              <h3>We handpick 3 designers</h3>
              <p>Our concierge reads your brief and selects 3 verified firms with projects like yours.</p>
              <div className="team-cluster">
                <div className="faces">
                  {AVATARS.map((a) => (
                    <img key={a} className="avatar" src={a} alt="" loading="lazy" />
                  ))}
                </div>
                <span>Real people, not an algorithm</span>
              </div>
            </div>
            <div className="step">
              <span className="mono step-time">Your pace</span>
              <div className="num">03</div>
              <h3>Meet them on your terms</h3>
              <p>They reach out on WhatsApp with portfolios and itemised quotes. Walk away if nothing fits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA STRIP */}
      <div className="cta-strip">
        <div className="wrap">
          <p>
            3,214 matched this year. You're <em>one form</em> away.
          </p>
          <Btn href="#match">Get matched free</Btn>
        </div>
      </div>

      {/* 8. PROOF WALL — real Google reviews + real concierge WhatsApps */}
      <section className="proof-sec">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">The receipts</span>
              <h2>
                Reviews, WhatsApps, and finished <em>homes</em>.
              </h2>
            </div>
            <p>Pulled straight from Google and our concierge chats. Unedited.</p>
          </div>
          <div className="proof-wall">
            <div className="g-review">
              <div className="g-top">
                <span className="stars">★★★★★</span>
                <span className="mono">Google review</span>
              </div>
              <p>"{reviews[0].text}"</p>
              <a className="g-name" href={reviews[0].link} target="_blank" rel="noopener noreferrer">
                <span className="g-initial" style={{ background: reviews[0].color }}>
                  {reviews[0].initial}
                </span>
                <span>
                  <b>{reviews[0].name}</b>
                  <span>Verified · Homeowner</span>
                </span>
              </a>
            </div>
            <div className="proof-photo ph">
              <img src={img(PHOTOS.proof, 640)} alt="Completed home by a verified Network firm" loading="lazy" />
              <span className="spec">Completed project · Verified firm</span>
            </div>
            <div className="wa" data-tag={WHATSAPP_SHOTS[0].tag}>
              <img src={WHATSAPP_SHOTS[0].url} alt="WhatsApp message from a matched homeowner" loading="lazy" />
            </div>
            <div className="g-review">
              <div className="g-top">
                <span className="stars">★★★★★</span>
                <span className="mono">Google review</span>
              </div>
              <p>"{reviews[1].text}"</p>
              <a className="g-name" href={reviews[1].link} target="_blank" rel="noopener noreferrer">
                <span className="g-initial" style={{ background: reviews[1].color }}>
                  {reviews[1].initial}
                </span>
                <span>
                  <b>{reviews[1].name}</b>
                  <span>Verified · Homeowner</span>
                </span>
              </a>
            </div>
            <div className="wa" data-tag={WHATSAPP_SHOTS[1].tag}>
              <img src={WHATSAPP_SHOTS[1].url} alt="WhatsApp message from a matched homeowner" loading="lazy" />
            </div>
            <div className="g-review">
              <div className="g-top">
                <span className="stars">★★★★★</span>
                <span className="mono">Google review</span>
              </div>
              <p>"{reviews[2].text}"</p>
              <a className="g-name" href={reviews[2].link} target="_blank" rel="noopener noreferrer">
                <span className="g-initial" style={{ background: reviews[2].color }}>
                  {reviews[2].initial}
                </span>
                <span>
                  <b>{reviews[2].name}</b>
                  <span>Verified · Homeowner</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. STORY TILES — homepage testimonials over real project photos */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">More matched homes</span>
              <h2>
                Find someone with <em>your</em> floor plan.
              </h2>
            </div>
          </div>
          <div className="story-grid">
            {TESTIMONIALS.items.map((t, i) => (
              <a className="story-tile" key={t.name} href="#match">
                <div className="st-media ph">
                  <img src={img(PHOTOS.stories[i], 640)} alt="Completed project by a verified Network firm" loading="lazy" />
                </div>
                <div className="st-body">
                  <q>{t.quote}</q>
                  <div className="st-meta">
                    <b>{t.name}</b> · {t.role}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CONCIERGE BAND */}
      <section className="concierge">
        <div className="wrap cb-grid">
          <div className="cb-photo ph">
            <img src={img(PHOTOS.chip2, 640)} alt="Completed project by a verified Network firm" loading="lazy" />
          </div>
          <div className="cb-copy">
            <span className="mono" style={{ color: "var(--orange)" }}>
              Who does the matching
            </span>
            <h2>
              A person reads your brief. Not an <em>algorithm</em>.
            </h2>
            <p>
              Shawn and the concierge team read every brief that comes in. They know which firms do good HDB work,
              which ones handle condos, and which ones to never recommend.
            </p>
            <div className="cb-points">
              <div>
                <b>01</b>
                <span>Every brief read by a human, same day</span>
              </div>
              <div>
                <b>02</b>
                <span>Firms vetted on completed projects, not ad spend</span>
              </div>
              <div>
                <b>03</b>
                <span>We follow up after the match, until handover</span>
              </div>
            </div>
            <Btn href="#match">Send us your brief</Btn>
          </div>
        </div>
      </section>

      {/* 11. COMPARE */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">The difference</span>
              <h2>
                Six weeks of research, or <em>one short form</em>.
              </h2>
            </div>
          </div>
          <div className="compare">
            <div className="cmp-col cmp-alone">
              <h3>Searching on your own</h3>
              <ul>
                <li>
                  <span className="x">✕</span>3 to 6 weeks of research
                </li>
                <li>
                  <span className="x">✕</span>Portfolios that all look the same
                </li>
                <li>
                  <span className="x">✕</span>Reviews that can be bought
                </li>
                <li>
                  <span className="x">✕</span>Guessing if the quote is fair
                </li>
                <li>
                  <span className="x">✕</span>Pressure from salespeople
                </li>
              </ul>
            </div>
            <div className="cmp-col cmp-net">
              <h3>Matched through Network</h3>
              <ul>
                <li>
                  <span className="c">✓</span>A shortlist in one day
                </li>
                <li>
                  <span className="c">✓</span>Firms vetted on completed work
                </li>
                <li>
                  <span className="c">✓</span>Feedback from real matched homeowners
                </li>
                <li>
                  <span className="c">✓</span>Itemised quotes you can compare
                </li>
                <li>
                  <span className="c">✓</span>Walk away anytime, no obligation
                </li>
              </ul>
              <Btn href="#match">Get my 3 matches</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">Before you ask</span>
              <h2>
                Straight answers. No fine <em>print</em>.
              </h2>
            </div>
          </div>
          <div className="faq-wrap">
            <details>
              <summary>
                How is this free? What's the catch? <span className="mark">+</span>
              </summary>
              <p>
                Designers pay a subscription to be on our platform. We never take commissions from your project, so
                there's no markup. What they quote is what you pay. No catch.
              </p>
            </details>
            <details>
              <summary>
                Will I get spammed by salespeople? <span className="mark">+</span>
              </summary>
              <p>
                No. Only the 3 firms we match you with will contact you, via WhatsApp, with portfolios and quotes.
                Nobody else gets your number.
              </p>
            </details>
            <details>
              <summary>
                Can I trust the firms on Network? <span className="mark">+</span>
              </summary>
              <p>
                Every firm is vetted with real completed projects and real homeowner feedback before they're allowed
                on. No paid placements.
              </p>
            </details>
            <details>
              <summary>
                What if I don't like my matches? <span className="mark">+</span>
              </summary>
              <p>Tell us. We'll rematch you, or you can walk away entirely. There's no obligation at any point.</p>
            </details>
            <details>
              <summary>
                I just collected keys. Is it too early? <span className="mark">+</span>
              </summary>
              <p>
                No, it's the best time. Most homeowners get matched 2 to 4 months before key collection so quotes and
                designs are ready on day one.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* 13. FINAL: ORANGE + FORM */}
      <section className="final">
        <div className="big-n">3,214</div>
        <div className="wrap final-grid">
          <div>
            <span className="mono" style={{ color: "rgba(255,253,247,.8)" }}>
              Last step
            </span>
            <h2>
              Your home is <em>one form</em> away.
            </h2>
            <p className="final-sub">
              3,214 Singapore homeowners got matched this year. Takes a minute. Completely free.
            </p>
            <div className="avatar-row">
              <div className="faces">
                {AVATARS.map((a) => (
                  <img key={a} className="avatar" src={a} alt="" loading="lazy" />
                ))}
              </div>
              <span>★ 4.8 on Google</span>
            </div>
          </div>
          <AdLeadFunnel compact />
        </div>
      </section>

      <footer>
        <div className="wrap foot-row">
          <div className="foot-logo">
            Network<sup>®</sup>
          </div>
          <span>
            © 2026 Network · <a href="/privacy-policy">Privacy</a>
          </span>
        </div>
      </footer>

      <div className="sticky-cta">
        <Btn href="#match">Get my 3 free matches</Btn>
      </div>
    </div>
  );
}

/* ── Scoped styles, ported from network-ad-lp.html. Every selector is
 *    prefixed with .adlp so the LP's element-level resets and type rules
 *    can't leak into the rest of the app (incl. the embedded
 *    QualifyingFlow, whose Tailwind classes out-specify the * reset). ── */
const ADLP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');

.adlp{
  --paper:#F5EFE3;
  --paper-deep:#EFE7D6;
  --ink:#171208;
  --ink-soft:#5C5546;
  --orange:#F4500C;
  --line:rgba(23,18,8,.16);
  --line-strong:rgba(23,18,8,.55);
  --white:#FFFDF7;
  --serif:'Instrument Serif', Georgia, serif;
  --sans:'Geist', -apple-system, sans-serif;
  --mono:'Geist Mono', monospace;
  font-family:var(--sans);background:var(--paper);color:var(--ink);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.adlp *{margin:0;padding:0;box-sizing:border-box}
.adlp ::selection{background:var(--orange);color:var(--white)}
.adlp a{color:inherit;text-decoration:none}
.adlp .wrap{max-width:1240px;margin:0 auto;padding:0 clamp(20px,4vw,56px)}
.adlp .mono{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase}

/* photo slots */
.adlp .ph{position:relative;overflow:hidden}
.adlp .ph>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.adlp .ph .spec{position:absolute;left:10px;bottom:10px;z-index:2;font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--paper);background:rgba(23,18,8,.62);padding:4px 9px;border-radius:5px;max-width:calc(100% - 20px)}

/* buttons */
.adlp .btn{display:inline-flex;align-items:center;gap:10px;background:var(--orange);color:var(--white);font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:14px 26px;border:1px solid var(--orange);border-radius:999px;cursor:pointer;transition:background .15s,border-color .15s}
.adlp .btn:hover{background:var(--ink);border-color:var(--ink)}
.adlp .btn .arr{transition:transform .15s}
.adlp .btn:hover .arr{transform:translateX(3px)}

/* ticker */
.adlp .ticker{background:var(--ink);color:var(--paper);overflow:hidden;white-space:nowrap}
.adlp .ticker-inner{display:inline-flex;animation:adlp-scroll 38s linear infinite;padding:9px 0}
.adlp .ticker-inner span{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:0 28px;position:relative}
.adlp .ticker-inner span::after{content:"";position:absolute;right:-3px;top:50%;width:5px;height:5px;border-radius:50%;background:var(--orange);transform:translateY(-50%)}
@keyframes adlp-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.adlp .ticker-inner{animation:none}}

/* nav: logo + CTA only, no leaks */
.adlp nav{position:sticky;top:0;z-index:50;background:rgba(245,239,227,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.adlp .nav-row{display:flex;align-items:center;justify-content:space-between;height:60px}
.adlp .logo{font-family:var(--serif);font-size:25px}
.adlp .logo sup{font-size:11px;color:var(--orange)}
.adlp .nav-proof{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
@media(max-width:700px){.adlp .nav-proof{display:none}}

/* hero */
.adlp .hero{padding:clamp(40px,6vh,80px) 0 clamp(36px,5vh,64px)}
.adlp .hero-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(32px,5vw,72px);align-items:start}
.adlp .hero-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:24px;color:var(--ink-soft)}
.adlp .hero-eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--orange);animation:adlp-pulse 2.4s ease infinite}
@keyframes adlp-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.adlp .hero-eyebrow .dot{animation:none}}
.adlp h1{font-family:var(--serif);font-weight:400;font-size:clamp(40px,6.4vw,84px);line-height:1.02;letter-spacing:-.015em}
.adlp h1 em{font-style:italic;color:var(--orange)}
.adlp .chip{display:inline-block;vertical-align:baseline;width:clamp(64px,7.5vw,120px);height:clamp(34px,3.8vw,58px);border-radius:999px;margin:0 .06em;transform:translateY(clamp(4px,.5vw,8px));border:1px solid var(--line);background:linear-gradient(135deg,#C9B79B,#8C7B61 55%,#4F4536)}
.adlp .hero-sub{margin-top:26px;max-width:48ch;font-size:16.5px;color:var(--ink-soft)}
.adlp .hero-sub strong{color:var(--ink);font-weight:500}
.adlp .avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#C9B79B,#6E4F32);border:1px solid var(--line);object-fit:cover}
.adlp .avatar-row{display:flex;align-items:center;gap:12px;margin-top:24px}
.adlp .avatar-row .faces{display:flex}
.adlp .avatar-row .avatar{margin-left:-10px;border:2px solid var(--paper)}
.adlp .avatar-row .avatar:first-child{margin-left:0}
.adlp .avatar-row>span{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.adlp .stars{color:var(--orange);letter-spacing:2px;font-size:13px}

/* form card */
.adlp .match-card{position:relative;background:var(--white);border:1px solid var(--line);border-radius:20px;padding:26px;box-shadow:0 1px 0 var(--line),12px 12px 0 0 var(--orange)}
.adlp .match-card .mono{color:var(--orange)}
.adlp .match-card h3{font-family:var(--serif);font-weight:400;font-size:26px;margin:10px 0 4px}
.adlp .match-card p{font-size:13.5px;color:var(--ink-soft);margin-bottom:18px}
.adlp .field{margin-bottom:12px}
.adlp .field input{width:100%;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--paper);font-family:var(--sans);font-size:14px;color:var(--ink)}
.adlp .field input:focus{outline:2px solid var(--orange);outline-offset:1px;border-color:transparent}
.adlp .match-card .btn{width:100%;justify-content:center;border-radius:10px;padding:15px}
.adlp .form-err{color:#b3330f;font-size:12.5px;margin-bottom:12px}
.adlp .assure{display:flex;gap:16px;margin-top:14px;justify-content:center;flex-wrap:wrap}
.adlp .assure span{font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}
@media(max-width:920px){.adlp .hero-grid{grid-template-columns:1fr}}

/* stats */
.adlp .stats{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--paper-deep)}
.adlp .stats-row{display:grid;grid-template-columns:repeat(4,1fr)}
.adlp .stat{padding:24px clamp(16px,2vw,32px);border-left:1px solid var(--line)}
.adlp .stat:first-child{border-left:none}
.adlp .stat b{font-family:var(--serif);font-weight:400;font-size:clamp(26px,3vw,40px);display:block;line-height:1.05}
.adlp .stat b em{font-style:italic;color:var(--orange)}
.adlp .stat span{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
@media(max-width:760px){.adlp .stats-row{grid-template-columns:repeat(2,1fr)}.adlp .stat:nth-child(3){border-left:none;border-top:1px solid var(--line)}.adlp .stat:nth-child(4){border-top:1px solid var(--line)}}

/* full-bleed project photo band */
.adlp .photo-band{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;background:var(--ink)}
.adlp .photo-band .ph{height:clamp(140px,18vw,240px);background:linear-gradient(140deg,#D8C8AC,#A77F50 55%,#4A3115)}
@media(max-width:760px){.adlp .photo-band{grid-template-columns:repeat(3,1fr)}.adlp .photo-band .ph:nth-child(n+4){display:none}}

/* section scaffolding */
.adlp section{padding:clamp(56px,9vh,104px) 0}
.adlp .sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:clamp(32px,4vh,52px);flex-wrap:wrap}
.adlp .sec-head .mono{color:var(--orange)}
.adlp h2{font-family:var(--serif);font-weight:400;font-size:clamp(32px,4.4vw,58px);line-height:1.05;letter-spacing:-.01em;max-width:20ch;margin-top:10px}
.adlp h2 em{font-style:italic;color:var(--orange)}
.adlp .sec-head p{max-width:38ch;color:var(--ink-soft);font-size:15px}

/* slim CTA strip */
.adlp .cta-strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--white)}
.adlp .cta-strip .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:20px;padding-bottom:20px;flex-wrap:wrap}
.adlp .cta-strip p{font-family:var(--serif);font-size:clamp(19px,2.2vw,25px);letter-spacing:-.01em}
.adlp .cta-strip p em{font-style:italic;color:var(--orange)}

/* featured story */
.adlp .feature-story{display:grid;grid-template-columns:1.25fr 1fr;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:var(--white)}
.adlp .fs-media{min-height:400px;background:linear-gradient(150deg,#C9B79B,#7A6347 55%,#2E2517);position:relative;overflow:hidden}
.adlp .fs-media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.adlp .fs-body{padding:clamp(24px,3vw,40px);display:flex;flex-direction:column;gap:18px}
.adlp .fs-quote{font-family:var(--serif);font-size:clamp(21px,2.3vw,29px);line-height:1.2;letter-spacing:-.01em}
.adlp .fs-quote em{font-style:italic;color:var(--orange)}
.adlp .fs-author{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.adlp .fs-author a:hover{text-decoration:underline}
.adlp .meta-table{border-top:1px solid var(--line)}
.adlp .meta-table>div{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid var(--line)}
.adlp .meta-table dt{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}
.adlp .meta-table dd{font-size:13.5px;font-weight:500;text-align:right}
.adlp .feature-story .btn{justify-content:center}
@media(max-width:920px){.adlp .feature-story{grid-template-columns:1fr}.adlp .fs-media{min-height:280px}}

/* dark pain */
.adlp .dark{background:var(--ink);color:var(--paper)}
.adlp .dark h2 em{color:var(--orange)}
.adlp .pain-list{border-top:1px solid rgba(245,239,227,.18)}
.adlp .pain{display:grid;grid-template-columns:60px 1fr;gap:22px;padding:22px 0;border-bottom:1px solid rgba(245,239,227,.18);align-items:baseline}
.adlp .pain .mono{color:rgba(245,239,227,.45)}
.adlp .pain p{font-family:var(--serif);font-size:clamp(18px,2.1vw,25px);line-height:1.3;max-width:46ch}
.adlp .dark-cta{margin-top:40px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.adlp .dark-cta p{color:rgba(245,239,227,.65);font-size:14px;max-width:42ch}

/* steps */
.adlp .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.adlp .step{background:var(--paper);padding:clamp(22px,2.6vw,36px);position:relative}
.adlp .step .num{font-family:var(--serif);font-style:italic;font-size:clamp(40px,4.6vw,64px);color:var(--orange);line-height:1}
.adlp .step h3{font-family:var(--serif);font-weight:400;font-size:23px;margin:16px 0 9px}
.adlp .step p{font-size:14px;color:var(--ink-soft)}
.adlp .step .step-time{position:absolute;top:22px;right:22px;color:var(--ink-soft)}
.adlp .team-cluster{display:flex;align-items:center;gap:10px;margin-top:16px}
.adlp .team-cluster .faces{display:flex}
.adlp .team-cluster .avatar{width:30px;height:30px;margin-left:-8px;border:2px solid var(--paper)}
.adlp .team-cluster .avatar:first-child{margin-left:0}
.adlp .team-cluster>span{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}
@media(max-width:860px){.adlp .steps{grid-template-columns:1fr}}

/* proof wall (white) */
.adlp .proof-sec{background:var(--white);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.adlp .proof-wall{columns:3;column-gap:18px}
.adlp .proof-wall>div{break-inside:avoid;margin-bottom:18px}
.adlp .g-review{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:18px 20px}
.adlp .g-review .g-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.adlp .g-review .g-top .mono{font-size:9px;color:var(--ink-soft)}
.adlp .g-review>p{font-size:13.5px;line-height:1.5}
.adlp .g-review .g-name{margin-top:10px;display:flex;align-items:center;gap:10px}
.adlp .g-review .g-name:hover b{text-decoration:underline}
.adlp .g-initial{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;flex-shrink:0}
.adlp .g-review .g-name b{font-size:12.5px;font-weight:500;display:block}
.adlp .g-review .g-name span span{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}
.adlp .wa{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 18px;font-size:13px;line-height:1.5}
.adlp .wa::before{content:attr(data-tag);font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange);display:block;margin-bottom:10px}
.adlp .wa img{width:100%;border-radius:8px;border:1px solid var(--line);display:block}
.adlp .proof-photo{border-radius:14px;height:230px;border:1px solid var(--line);background:linear-gradient(140deg,#D8C8AC,#A77F50 55%,#4A3115)}
@media(max-width:980px){.adlp .proof-wall{columns:2}}
@media(max-width:640px){.adlp .proof-wall{columns:1}}

/* story tiles */
.adlp .story-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.adlp .story-tile{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--white);display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s;cursor:pointer}
.adlp .story-tile:hover{transform:translateY(-3px);box-shadow:8px 8px 0 0 var(--paper-deep),8px 8px 0 1px var(--line)}
.adlp .st-media{height:200px;position:relative;background:linear-gradient(140deg,#D8C8AC,#A77F50 55%,#4A3115)}
.adlp .st-body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:10px;flex:1}
.adlp .st-body q{font-family:var(--serif);font-size:18px;line-height:1.25;quotes:'"' '"';flex:1}
.adlp .st-meta{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);line-height:1.8}
.adlp .st-meta b{color:var(--orange);font-weight:500}
@media(max-width:860px){.adlp .story-grid{grid-template-columns:1fr}}

/* concierge band */
.adlp .concierge{background:var(--paper-deep);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.adlp .cb-grid{display:grid;grid-template-columns:380px 1fr;gap:clamp(28px,4vw,64px);align-items:center}
.adlp .cb-photo{border-radius:18px;height:360px;background:linear-gradient(150deg,#3B3225,#171208 70%);border:1px solid var(--line)}
.adlp .cb-copy h2{margin-top:14px}
.adlp .cb-copy>p{margin-top:18px;color:var(--ink-soft);font-size:15px;max-width:52ch}
.adlp .cb-points{margin-top:24px;display:flex;flex-direction:column;gap:10px}
.adlp .cb-points div{display:flex;gap:12px;align-items:baseline;font-size:14px}
.adlp .cb-points b{color:var(--orange);font-family:var(--mono);font-size:11px;font-weight:500}
.adlp .cb-copy .btn{margin-top:28px}
@media(max-width:920px){.adlp .cb-grid{grid-template-columns:1fr}.adlp .cb-photo{height:260px}}

/* compare table */
.adlp .compare{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:stretch}
.adlp .cmp-col{border-radius:18px;padding:clamp(22px,2.6vw,36px)}
.adlp .cmp-col h3{font-family:var(--serif);font-weight:400;font-size:24px;margin-bottom:18px}
.adlp .cmp-col ul{list-style:none}
.adlp .cmp-col li{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:14px;align-items:baseline}
.adlp .cmp-col li:last-child{border-bottom:none}
.adlp .cmp-alone{background:transparent;border:1px dashed var(--line-strong);color:var(--ink-soft)}
.adlp .cmp-alone .x{color:var(--ink-soft);font-family:var(--mono)}
.adlp .cmp-net{background:var(--ink);color:var(--paper);box-shadow:12px 12px 0 0 var(--orange)}
.adlp .cmp-net li{border-bottom-color:rgba(245,239,227,.18)}
.adlp .cmp-net .c{color:var(--orange);font-family:var(--mono)}
.adlp .cmp-net .btn{width:100%;justify-content:center;margin-top:20px;border-radius:10px}
@media(max-width:860px){.adlp .compare{grid-template-columns:1fr}}

/* faq */
.adlp .faq-wrap{max-width:820px}
.adlp details{border-bottom:1px solid var(--line)}
.adlp summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:20px 0;font-family:var(--serif);font-size:clamp(18px,2.1vw,23px)}
.adlp summary::-webkit-details-marker{display:none}
.adlp summary .mark{font-family:var(--serif);font-style:italic;color:var(--orange);transition:transform .2s;flex-shrink:0}
.adlp details[open] .mark{transform:rotate(45deg)}
.adlp details p{padding:0 0 20px;font-size:14px;color:var(--ink-soft);max-width:64ch}

/* final: orange w/ embedded form */
.adlp .final{background:var(--orange);color:var(--white);position:relative;overflow:hidden}
.adlp .final-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:clamp(32px,5vw,72px);align-items:center;position:relative;z-index:1}
.adlp .final h2{color:var(--white);max-width:14ch;font-size:clamp(40px,5.6vw,76px)}
.adlp .final h2 em{color:var(--ink)}
.adlp .final .final-sub{margin-top:20px;color:rgba(255,253,247,.85);font-size:15.5px;max-width:42ch}
.adlp .final .avatar-row>span{color:rgba(255,253,247,.85)}
.adlp .final .avatar-row .avatar{border-color:var(--orange)}
.adlp .final .match-card{box-shadow:12px 12px 0 0 var(--ink)}
.adlp .big-n{position:absolute;bottom:-.16em;right:-.05em;font-family:var(--serif);font-style:italic;font-size:clamp(160px,24vw,360px);color:rgba(255,253,247,.1);line-height:1;pointer-events:none}
@media(max-width:920px){.adlp .final-grid{grid-template-columns:1fr}}

/* footer minimal */
.adlp footer{background:var(--ink);color:var(--paper);padding:36px 0}
.adlp .foot-row{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.adlp .foot-logo{font-family:var(--serif);font-size:24px}
.adlp .foot-logo sup{font-size:10px;color:var(--orange)}
.adlp .foot-row>span,.adlp .foot-row a{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,239,227,.45)}

/* sticky mobile CTA */
.adlp .sticky-cta{display:none}
@media(max-width:760px){
  .adlp .sticky-cta{display:block;position:fixed;bottom:0;left:0;right:0;z-index:60;background:rgba(245,239,227,.95);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
  .adlp .sticky-cta .btn{width:100%;justify-content:center;border-radius:12px;padding:15px}
  .adlp{padding-bottom:74px}
}
`;

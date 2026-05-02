/**
 * Shared design system for the trust-led lead-capture pages (/escrow and
 * /get-matched). One CSS string, scoped under `.lead-page`, so both pages
 * stay visually in sync without dragging in the rest of the app's primitives.
 */
export const LEAD_PAGE_CLASS = "lead-page";

export const LEAD_PAGE_CSS = `
.lead-page {
  --bg: #F6F2EA;
  --bg-card: #FFFFFF;
  --bg-soft: #EFEAE0;
  --ink: #1A1614;
  --ink-soft: #5C5852;
  --ink-muted: #8B867E;
  --line: #DDD5C7;
  --line-soft: #EBE5D9;
  --accent: #E8481B;
  --accent-hover: #C13C16;
  --accent-soft: #FFE6DC;
  --accent-rgb: 232, 72, 27;
  --gold: #A87C4F;
  --whatsapp: #25D366;
  --shadow-sm: 0 1px 2px rgba(26, 22, 20, 0.04);
  --shadow-md: 0 4px 12px rgba(26, 22, 20, 0.06);
  --shadow-lg: 0 12px 32px rgba(26, 22, 20, 0.08);

  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--ink);
  line-height: 1.55;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}
.lead-page * { box-sizing: border-box; }
/* Headings inherit the serif look but NOT a default color — color is set
 * explicitly per section below, so reused homepage sections (FreeTools,
 * SocialProof, GoogleReviewsLive) keep their own dark/light text. */
:where(.lead-page) :where(h1, h2, h3) {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.1;
  margin: 0;
}
:where(.lead-page) :where(a) { color: inherit; text-decoration: none; }
.lead-page .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

/* NAV */
.lead-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(246, 242, 234, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line-soft);
}
.lead-page .nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; max-width: 1200px; margin: 0 auto;
}
.lead-page .nav-links { display: none; gap: 32px; font-size: 14px; color: var(--ink-soft); }
@media (min-width: 768px) { .lead-page .nav-links { display: flex; } }
.lead-page .nav-links a:hover { color: var(--ink); }
.lead-page .btn-nav {
  background: var(--ink); color: white; padding: 10px 20px;
  border-radius: 999px; font-size: 14px; font-weight: 500;
  transition: transform 0.15s ease, background 0.15s ease;
}
.lead-page .btn-nav:hover { background: var(--accent); transform: translateY(-1px); }

/* HERO */
.lead-page .hero { padding: 56px 0 80px; position: relative; overflow: hidden; }
@media (min-width: 1024px) { .lead-page .hero { padding: 80px 0 120px; } }
.lead-page .hero-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: start; }
@media (min-width: 1024px) { .lead-page .hero-grid { grid-template-columns: 1.1fr 1fr; gap: 64px; } }
.lead-page .trust-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-soft); color: var(--accent);
  border: 1px solid rgba(var(--accent-rgb), 0.18);
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 500; margin-bottom: 24px; letter-spacing: 0.02em;
}
.lead-page .trust-badge::before { content: ""; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
.lead-page .hero h1 { font-size: clamp(36px, 5.2vw, 64px); margin-bottom: 24px; letter-spacing: -0.02em; color: var(--ink); }
.lead-page .hero-lede { color: var(--ink-soft); }
.lead-page .hero h1 em { font-style: italic; color: var(--accent); font-weight: 300; }
.lead-page .hero-lede { font-size: clamp(16px, 1.4vw, 19px); line-height: 1.6; color: var(--ink-soft); max-width: 520px; margin-bottom: 36px; }
.lead-page .hero-stats {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
  padding: 24px 0; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft);
  max-width: 480px;
}
@media (min-width: 480px) { .lead-page .hero-stats { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
.lead-page .hero-stat-num { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 500; color: var(--ink); }
.lead-page .hero-stat-label { font-size: 12px; color: var(--ink-muted); letter-spacing: 0.04em; text-transform: uppercase; margin-top: 2px; }

/* FORM */
.lead-page .form-card { background: var(--bg-card); border: 1px solid var(--line); border-radius: 20px; padding: 32px; box-shadow: var(--shadow-lg); position: relative; }
@media (min-width: 768px) { .lead-page .form-card { padding: 40px; } }
.lead-page .form-header { margin-bottom: 28px; }
.lead-page .form-eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 8px; }
.lead-page .form-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 400; margin-bottom: 8px; letter-spacing: -0.01em; }
.lead-page .form-sub { font-size: 14px; color: var(--ink-soft); }
.lead-page .field-group { margin-bottom: 20px; }
/* Two field-groups side-by-side (used for phone + email). Stacks on
 * narrow widths so the form stays usable on mobile. */
.lead-page .field-row-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.lead-page .field-row-2 > .field-group { margin-bottom: 0; }
@media (min-width: 480px) {
  .lead-page .field-row-2 { grid-template-columns: 1fr 1fr; }
}
.lead-page .field-label { display: block; font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 8px; letter-spacing: 0.01em; }
.lead-page .field-label-sub { font-weight: 400; color: var(--ink-muted); margin-left: 4px; }
.lead-page input[type="text"], .lead-page input[type="tel"], .lead-page input[type="email"] {
  width: 100%; padding: 13px 16px; font-family: inherit; font-size: 15px;
  background: var(--bg-soft); border: 1px solid var(--line); border-radius: 10px;
  color: var(--ink); transition: border-color 0.15s, background 0.15s;
}
.lead-page input:focus { outline: none; border-color: var(--accent); background: white; }
.lead-page input::placeholder { color: var(--ink-muted); }
.lead-page .phone-wrapper { position: relative; }
.lead-page .phone-prefix { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 15px; color: var(--ink-soft); pointer-events: none; }
.lead-page .phone-wrapper input { padding-left: 52px; }
.lead-page .qualifier-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
@media (min-width: 480px) { .lead-page .qualifier-group { grid-template-columns: repeat(3, 1fr); } }
.lead-page .qualifier-option { position: relative; cursor: pointer; }
.lead-page .qualifier-option input { position: absolute; opacity: 0; }
.lead-page .qualifier-option span {
  display: block; padding: 11px 8px; text-align: center;
  background: var(--bg-soft); border: 1px solid var(--line); border-radius: 8px;
  font-size: 13px; color: var(--ink-soft); transition: all 0.15s ease;
}
.lead-page .qualifier-option:hover span { border-color: var(--ink-muted); color: var(--ink); }
.lead-page .qualifier-option input:checked + span { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 500; }
.lead-page .btn-primary {
  width: 100%; background: var(--ink); color: white; border: none;
  padding: 16px 24px; font-family: inherit; font-size: 15px; font-weight: 600;
  letter-spacing: 0.01em; border-radius: 12px; cursor: pointer;
  transition: background 0.15s, transform 0.15s; margin-top: 8px;
}
.lead-page .btn-primary:hover { background: var(--accent); transform: translateY(-1px); }
.lead-page .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.lead-page .form-trust {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  flex-wrap: wrap; font-size: 12px; color: var(--ink-muted); margin-top: 16px;
}
.lead-page .form-trust span { display: inline-flex; align-items: center; gap: 4px; }

/* WHATSAPP */
.lead-page .whatsapp-divider {
  display: flex; align-items: center; gap: 12px; margin: 24px 0 16px;
  color: var(--ink-muted); font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;
}
.lead-page .whatsapp-divider::before, .lead-page .whatsapp-divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.lead-page .btn-whatsapp {
  display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;
  background: white; color: var(--ink); border: 1.5px solid var(--whatsapp);
  padding: 14px 20px; border-radius: 12px; font-weight: 500; font-size: 14px;
  transition: background 0.15s;
}
.lead-page .btn-whatsapp:hover { background: rgba(37, 211, 102, 0.05); }
.lead-page .btn-whatsapp svg { width: 20px; height: 20px; flex-shrink: 0; }

/* WHY NETWORK */
.lead-page .why { padding: 80px 0; background: var(--bg-card); border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
.lead-page .why-header { text-align: center; max-width: 640px; margin: 0 auto 56px; }
.lead-page .section-eyebrow { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 14px; }
.lead-page .why-header h2 { font-size: clamp(28px, 3.5vw, 44px); margin-bottom: 16px; }
.lead-page .why-header p { font-size: 16px; }
.lead-page .why-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 768px) { .lead-page .why-grid { grid-template-columns: repeat(3, 1fr); } }
.lead-page .why-card { background: var(--bg); border: 1px solid var(--line); border-radius: 16px; padding: 32px; position: relative; transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
.lead-page .why-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
/* All three cards flip to the orange accent treatment on hover (icon, tag
   pill, headline + body, border, bg). At rest every card sits in the cream/
   soft-accent style. */
.lead-page .why-card:hover { background: var(--accent); border-color: var(--accent); }
.lead-page .why-card:hover h3,
.lead-page .why-card:hover p,
.lead-page .why-card:hover .why-card-tag { color: white; }
.lead-page .why-card:hover .why-card-tag { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.2); }
.lead-page .why-card-tag {
  display: inline-block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--accent); background: var(--accent-soft); border: 1px solid rgba(var(--accent-rgb), 0.18);
  padding: 4px 10px; border-radius: 999px; font-weight: 600; margin-bottom: 20px;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.lead-page .why-card h3 { font-size: 22px; margin-bottom: 12px; letter-spacing: -0.01em; transition: color 0.2s ease; }
.lead-page .why-card p { font-size: 14px; line-height: 1.6; transition: color 0.2s ease; }
.lead-page .why-card-icon {
  width: 40px; height: 40px; background: var(--accent-soft); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500; color: var(--accent);
  transition: color 0.2s ease, background-color 0.2s ease;
}
.lead-page .why-card:hover .why-card-icon { background: rgba(255, 255, 255, 0.15); color: white; }

/* HOW */
.lead-page .how { padding: 80px 0; }
.lead-page .how-header { text-align: center; max-width: 640px; margin: 0 auto 56px; }
.lead-page .how-header h2 { font-size: clamp(28px, 3.5vw, 44px); margin-bottom: 16px; }
.lead-page .how-steps { display: grid; grid-template-columns: 1fr; gap: 32px; max-width: 920px; margin: 0 auto; }
@media (min-width: 768px) { .lead-page .how-steps { grid-template-columns: repeat(3, 1fr); gap: 40px; } }
.lead-page .how-step { position: relative; }
.lead-page .how-step-num {
  font-family: 'Fraunces', serif; font-size: 56px; font-weight: 300; font-style: italic;
  color: var(--accent); line-height: 1; margin-bottom: 20px; display: block;
}
.lead-page .how-step h3 { font-size: 22px; margin-bottom: 12px; }
.lead-page .how-step p { font-size: 15px; line-height: 1.6; }

/* TOOLS */
.lead-page .tools { padding: 80px 0; background: var(--ink); color: white; }
.lead-page .tools-header { text-align: center; max-width: 640px; margin: 0 auto 56px; }
.lead-page .tools-header .section-eyebrow { color: var(--gold); }
.lead-page .tools-header h2 { color: white; font-size: clamp(28px, 3.5vw, 44px); margin-bottom: 16px; }
.lead-page .tools-header p { color: rgba(255, 255, 255, 0.7); }
.lead-page .tools-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { .lead-page .tools-grid { grid-template-columns: repeat(3, 1fr); } }
.lead-page .tool-card {
  background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px; padding: 28px; transition: background 0.2s, border-color 0.2s;
}
.lead-page .tool-card:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.2); }
.lead-page .tool-card-tag {
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--gold); font-weight: 600; margin-bottom: 16px; display: block;
}
.lead-page .tool-card h3 { color: white; font-size: 22px; margin-bottom: 10px; }
.lead-page .tool-card p { color: rgba(255, 255, 255, 0.7); font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
.lead-page .tool-card-cta {
  font-size: 14px; font-weight: 500; color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3); padding-bottom: 2px;
  transition: border-color 0.15s;
}
.lead-page .tool-card-cta:hover { border-color: white; }

/* FINAL CTA */
.lead-page .final-cta { padding: 100px 0; text-align: center; }
.lead-page .final-cta h2 { font-size: clamp(32px, 4.5vw, 56px); max-width: 720px; margin: 0 auto 24px; }
.lead-page .final-cta h2 em { font-style: italic; color: var(--accent); font-weight: 300; }
.lead-page .final-cta p { font-size: 17px; max-width: 540px; margin: 0 auto 40px; }
.lead-page .btn-large {
  display: inline-block; background: var(--ink); color: white; padding: 18px 36px;
  border-radius: 999px; font-size: 16px; font-weight: 600;
  transition: background 0.15s, transform 0.15s;
}
.lead-page .btn-large:hover { background: var(--accent); transform: translateY(-2px); }

/* FOOTER */
.lead-footer { padding: 40px 0 32px; border-top: 1px solid var(--line-soft); font-size: 13px; color: var(--ink-muted); text-align: center; }
.lead-footer a { color: var(--ink-soft); }
.lead-footer a:hover { color: var(--ink); }
`;

/** Pre-rendered <link> tags for the page-scoped Google Fonts. Both pages need
 *  Plus Jakarta Sans + Fraunces. */
export function LeadPageFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Plus+Jakarta+Sans:wght@300..700&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

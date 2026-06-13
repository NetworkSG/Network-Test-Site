import { useEffect, useRef, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { recordAttribution } from "@/app/utils/attribution";
import { trackLead } from "@/app/utils/metaPixel";
import { isValid8DigitPhone } from "../utils/phone-validation";
import { Seo } from "./shared/Seo";
import networkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

// The brand wordmark is an alpha-mask PNG (white shape, transparent bg), so
// we render it by masking a colored box — `color` sets the logo's color to
// match whichever surface it sits on. Ratio matches the homepage nav usage.
function NetworkWordmark({ color, height = 22, className, style }: { color: string; height?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={className}
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
        ...style,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Careers landing page ("network-careers-lp"). Standalone poster-style
 * recruiting page: bold Archivo type, paper / ink monochrome, hanging
 * lanyard badge hero, an honest "don't apply if…" filter, open roles,
 * and a short proof-of-work application form.
 *
 * The application form is name / phone / role / proof link / why — no
 * email by design (proof + a call is the funnel) — and writes to the
 * dedicated `careers_applications` table via the public REST endpoint.
 * Same anon-insert RLS pattern as ad_lp_leads.
 * ──────────────────────────────────────────────────────────────── */

// Real project photography (public assets) for the poster bands. No team
// photos exist yet, so these warm, moody interiors stand in as ambient
// texture for the industry Network works in — far better than the
// placeholder gradients, and not captioned as "the team".
const HERO_PHOTO = "/DSC09723.webp";
const BAND_PHOTOS = ["/r1.webp", "/r2.webp", "/r3.webp", "/r4.webp", "/r5.webp"];

// Pre-laid-out barcode bars for the ID badge (centred strip, varied widths).
const BADGE_BARCODE = (() => {
  const widths = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1];
  const gap = 1.6;
  const total = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * gap;
  let x = -total / 2;
  return widths.map((w) => {
    const bar = { x: +x.toFixed(2), w };
    x += w + gap;
    return bar;
  });
})();

const ROLES = [
  { title: "Sales Consultant", team: "Sales · Hunters", terms: "Full-time · Singapore" },
  { title: "Lead Concierge", team: "Concierge", terms: "Full-time · Singapore" },
  { title: "Account Manager", team: "Client Success", terms: "Full-time · SG / Remote MY" },
  { title: "Content Producer", team: "Marketing · Studio", terms: "Full-time · Singapore" },
  { title: "Video Editor", team: "Marketing · Studio", terms: "Full-time · SG / Remote" },
  { title: "None of these fit? Pitch us your role.", team: "Open application", terms: "Show us the proof" },
];

// Plain role options for the <select> (drops the open-application sentence).
const ROLE_OPTIONS = [
  "Sales Consultant",
  "Lead Concierge",
  "Account Manager",
  "Content Producer",
  "Video Editor",
  "Open application",
];

const TICKER_LINES = [
  "Now hiring · Sales consultants",
  "Now hiring · Lead concierge",
  "Now hiring · Account managers",
  "Now hiring · Content producers",
  "Proof of work beats resumes",
  "Decision in 7 days",
];

/* ── Application form: poster-styled card → confirmation. Writes to
 *    careers_applications, fires the careers-application pixel event,
 *    and ties any ad attribution to the inserted row. ── */
function ApplyForm({ presetRole, onRoleConsumed }: { presetRole?: string; onRoleConsumed?: () => void }) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", role: "", proof: "", why: "" });

  // When a role card is clicked, preselect it here.
  useEffect(() => {
    if (presetRole) {
      setForm((f) => ({ ...f, role: presetRole }));
      onRoleConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetRole]);

  if (done) {
    return (
      <div className="apply-card" style={{ textAlign: "center" }}>
        <span className="label">Application received</span>
        <h3>Thanks — we've got it.</h3>
        <p>
          We reply to every application within 48 hours, offer or not. Keep an eye on your phone — the first step is a
          quick 15-minute call.
        </p>
      </div>
    );
  }

  const valid =
    form.name.trim() && isValid8DigitPhone(form.phone) && form.role && form.proof.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) {
      setTouched(true);
      return;
    }
    setSubmitting(true);
    fetch(`https://${projectId}.supabase.co/rest/v1/careers_applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        role: form.role,
        proof_url: form.proof,
        why: form.why,
        source: "/careers",
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          console.error("Careers application save failed:", r.status);
          return;
        }
        // Tie ad attribution to the inserted row (no email on this form).
        try {
          const rows = await r.json();
          const id = Array.isArray(rows) ? rows[0]?.id : undefined;
          if (id) recordAttribution("careers-application", undefined, id);
        } catch {
          /* best-effort */
        }
      })
      .catch((err) => console.error("Careers application save error:", err))
      .finally(() => {
        setDone(true);
        trackLead("careers-application");
      });
  };

  return (
    <form className="apply-card" onSubmit={submit} noValidate>
      <span className="label">Apply · 3 minutes</span>
      <h3>Show us what you've got.</h3>
      <p>Short on purpose. The trial is where you'll really apply.</p>
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
        <select
          aria-label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={form.role ? { color: "var(--ink)" } : undefined}
        >
          <option value="">Role you're applying for</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <input
          type="url"
          placeholder="Link to your proof of work"
          aria-label="Proof of work link"
          value={form.proof}
          onChange={(e) => setForm({ ...form, proof: e.target.value })}
        />
      </div>
      <div className="field">
        <textarea
          placeholder="Why you. Two sentences max."
          aria-label="Why you"
          value={form.why}
          onChange={(e) => setForm({ ...form, why: e.target.value })}
        />
      </div>
      {touched && !valid && (
        <p className="form-err">Add your name, an 8-digit SG phone number, a role, and a link to your proof of work.</p>
      )}
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send my application"}
      </button>
      <div className="assure">
        <span>✓ Reply in 48h</span>
        <span>✓ Paid trial</span>
        <span>✓ Decision in 7 days</span>
      </div>
    </form>
  );
}

/* ── Interactive hanging lanyard badge. Grab it and drag: the cord
 *    stretches like fabric (thins + straightens under tension); fling it
 *    sideways and let go and it swings on a damped pendulum + spring back
 *    to rest. All physics runs on a rAF loop mutating SVG attributes
 *    directly (no per-frame React renders). Honours reduced-motion by
 *    rendering a static, non-animated badge. ── */
function LanyardBadge() {
  const svgRef = useRef<SVGSVGElement>(null);
  const strapLRef = useRef<SVGPathElement>(null);
  const strapRRef = useRef<SVGPathElement>(null);
  const badgeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const strapL = strapLRef.current;
    const strapR = strapRRef.current;
    const badge = badgeRef.current;
    if (!svg || !strapL || !strapR || !badge) return;

    // Geometry (viewBox units). A = anchor at top; the badge clip hangs L0 below it.
    const A = { x: 160, y: 8 };
    const L0 = 300;
    const REST = { x: A.x, y: A.y + L0 };
    const k = 240; // cord stiffness (only pulls when taut — strings don't push)
    const g = 1000; // gravity
    const radialDamp = 7; // kills along-cord bounce fast → rests dead-still
    const tanDamp = 0.7; // light cross-cord damping → swing lingers
    const cornerL = { x: -11, y: -15 };
    const cornerR = { x: 11, y: -15 };
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const rot = (p: { x: number; y: number }, a: number) => ({
      x: p.x * Math.cos(a) - p.y * Math.sin(a),
      y: p.x * Math.sin(a) + p.y * Math.cos(a),
    });

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const st = {
      P: { x: REST.x, y: REST.y },
      V: { x: 0, y: 0 },
      angle: 0,
      angVel: 0,
      dragging: false,
      pointerId: -1,
      grab: { x: 0, y: 0 },
      pointer: { x: REST.x, y: REST.y },
    };
    (svg as unknown as { __lanyard?: typeof st }).__lanyard = st;

    const toSvg = (cx: number, cy: number) => {
      const pt = svg.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      const m = svg.getScreenCTM();
      if (!m) return { x: cx, y: cy };
      const p = pt.matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    };

    const onDown = (e: PointerEvent) => {
      const p = toSvg(e.clientX, e.clientY);
      st.dragging = true;
      st.pointerId = e.pointerId;
      st.grab = { x: st.P.x - p.x, y: st.P.y - p.y };
      st.pointer = p;
      try {
        badge.setPointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
      badge.style.cursor = "grabbing";
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!st.dragging || e.pointerId !== st.pointerId) return;
      st.pointer = toSvg(e.clientX, e.clientY);
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== st.pointerId) return;
      st.dragging = false;
      st.pointerId = -1;
      badge.style.cursor = "grab";
      try {
        badge.releasePointerCapture(e.pointerId);
      } catch {
        /* no-op */
      }
    };

    badge.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const render = () => {
      const { P, angle } = st;
      badge.setAttribute(
        "transform",
        `translate(${P.x.toFixed(2)} ${P.y.toFixed(2)}) rotate(${((angle * 180) / Math.PI).toFixed(2)})`,
      );
      // Cord meets the (rotated) top corners of the clip.
      const cl = rot(cornerL, angle);
      const cr = rot(cornerR, angle);
      const eL = { x: P.x + cl.x, y: P.y + cl.y };
      const eR = { x: P.x + cr.x, y: P.y + cr.y };
      const len = Math.hypot(P.x - A.x, P.y - A.y);
      const stretch = len - L0;
      // More tension → straps go taut (less sag) and thin slightly: "fabric stretch".
      const sag = Math.max(0, 15 - stretch * 0.4);
      const sw = clamp((7 * L0) / Math.max(len, 1), 3.2, 7).toFixed(2);
      const strap = (end: { x: number; y: number }, side: number) => {
        const mx = (A.x + end.x) / 2;
        const my = (A.y + end.y) / 2;
        let dx = end.x - A.x;
        let dy = end.y - A.y;
        const l = Math.hypot(dx, dy) || 1;
        dx /= l;
        dy /= l;
        const cx = mx + -dy * sag * side;
        const cy = my + dx * sag * side;
        return `M ${A.x} ${A.y} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
      };
      strapL.setAttribute("d", strap(eL, 1));
      strapR.setAttribute("d", strap(eR, -1));
      strapL.setAttribute("stroke-width", sw);
      strapR.setAttribute("stroke-width", sw);
    };

    if (reducedMotion) {
      render();
      return () => {
        badge.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    }

    let raf = 0;
    let prev = 0;
    const step = (t: number) => {
      if (!prev) prev = t;
      let dt = (t - prev) / 1000;
      prev = t;
      dt = Math.min(dt, 0.032);
      if (dt > 0) {
        if (st.dragging) {
          const tx = clamp(st.pointer.x + st.grab.x, 44, 276);
          const ty = clamp(st.pointer.y + st.grab.y, 150, 560);
          // Derive velocity from the drag so it carries momentum on release.
          st.V.x = clamp((tx - st.P.x) / dt, -2200, 2200);
          st.V.y = clamp((ty - st.P.y) / dt, -2200, 2200);
          st.P.x = tx;
          st.P.y = ty;
        } else {
          const dirx = A.x - st.P.x;
          const diry = A.y - st.P.y;
          const len = Math.hypot(dirx, diry) || 1;
          const nx = dirx / len;
          const ny = diry / len;
          const stretch = len - L0;
          // String-like: only pull when taut (stretched past rest length).
          const springMag = stretch > 0 ? k * stretch : 0;
          st.V.x += nx * springMag * dt;
          st.V.y += (ny * springMag + g) * dt;
          // Directional damping: split velocity into along-cord (radial) and
          // cross-cord (tangential/swing). Damp the bounce hard, the swing gently.
          const vRad = st.V.x * nx + st.V.y * ny;
          const vTx = st.V.x - vRad * nx;
          const vTy = st.V.y - vRad * ny;
          const vRadKept = vRad * Math.max(0, 1 - radialDamp * dt);
          const tanKeep = Math.max(0, 1 - tanDamp * dt);
          st.V.x = vTx * tanKeep + vRadKept * nx;
          st.V.y = vTy * tanKeep + vRadKept * ny;
          st.P.x = clamp(st.P.x + st.V.x * dt, 30, 290);
          st.P.y = clamp(st.P.y + st.V.y * dt, 120, 580);
        }
        // Badge tilts to follow the cord, with a little lag + overshoot.
        const targetAng = Math.atan2(st.P.x - A.x, st.P.y - A.y);
        const aAcc = 90 * (targetAng - st.angle) - 6 * st.angVel;
        st.angVel += aAcc * dt;
        st.angle += st.angVel * dt;
      }
      render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      badge.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div className="hang" aria-hidden="true">
      <svg ref={svgRef} viewBox="0 0 320 620" xmlns="http://www.w3.org/2000/svg">
        {/* anchor knot */}
        <circle cx="160" cy="8" r="5.5" fill="#14110D" />
        {/* lanyard straps (paths set each frame) */}
        <path ref={strapLRef} stroke="#14110D" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path ref={strapRRef} stroke="#14110D" strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* badge — translated + rotated each frame; clip centre at local (0,0) */}
        <g ref={badgeRef} className="lanyard-badge">
          {/* clip + hole */}
          <rect x="-13" y="-17" width="26" height="32" rx="4" fill="#14110D" />
          <circle cx="0" cy="-3" r="5" fill="#F1EFE8" />
          {/* card body + inner frame */}
          <rect x="-58" y="17" width="116" height="172" rx="11" fill="#14110D" />
          <rect x="-52" y="23" width="104" height="160" rx="8" fill="none" stroke="#F1EFE8" strokeOpacity="0.14" strokeWidth="1.5" />
          {/* Network wordmark (white-on-transparent PNG → reads white on the dark card) */}
          <image href={networkLogo} x="-33" y="31" width="66" height="14" preserveAspectRatio="xMidYMid meet" />
          {/* divider */}
          <rect x="-40" y="53" width="80" height="1.5" fill="#F1EFE8" opacity="0.18" />
          {/* ID photo — cream tile with a person silhouette, clipped to rounded corners */}
          <clipPath id="lanyardPhoto">
            <rect x="-25" y="62" width="50" height="56" rx="5" />
          </clipPath>
          <rect x="-25" y="62" width="50" height="56" rx="5" fill="#F1EFE8" />
          <g clipPath="url(#lanyardPhoto)">
            <circle cx="0" cy="86" r="11" fill="#14110D" />
            <ellipse cx="0" cy="126" rx="20" ry="17" fill="#14110D" />
          </g>
          {/* name + role lines */}
          <rect x="-40" y="127" width="58" height="9" rx="3" fill="#F1EFE8" opacity="0.92" />
          <rect x="-40" y="141" width="40" height="7" rx="3" fill="#F1EFE8" opacity="0.5" />
          {/* barcode strip */}
          {BADGE_BARCODE.map((b, i) => (
            <rect key={i} x={b.x} y="158" width={b.w} height="17" fill="#F1EFE8" opacity="0.8" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function CareersLandingPage() {
  // The page relies on in-page #apply anchors; smooth-scroll lives on
  // <html>, which scoped CSS can't reach — set it for the page lifetime.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // Clicking a role preselects it in the apply form and jumps to it.
  const [presetRole, setPresetRole] = useState<string | undefined>(undefined);
  const pickRole = (title: string) => {
    // The open-application card maps to the "Open application" select value.
    setPresetRole(ROLE_OPTIONS.includes(title) ? title : "Open application");
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="careerslp">
      <Seo
        title="Work at Network — Careers in Singapore"
        description="Network runs growth for Singapore's interior design industry. High standards, real ownership, proof of work over resumes. Apply in 3 minutes, decision in 7 days."
        noindex
      />
      <style>{CAREERS_CSS}</style>

      {/* Nav */}
      <nav>
        <div className="wrap nav-row">
          <a className="logo" href="#top" aria-label="Network — top">
            <NetworkWordmark color="var(--ink)" height={20} />
          </a>
          <span className="nav-proof">Careers · 120+ client firms · Singapore</span>
          <a className="btn" href="#apply">
            Apply
          </a>
        </div>
      </nav>

      {/* ===== POSTER HERO ===== */}
      <header className="poster" id="top">
        <div className="poster-photo ph">
          <img src={HERO_PHOTO} alt="" loading="eager" />
          <span className="poster-photo-shade" aria-hidden="true" />
        </div>

        {/* hanging lanyard badge — interactive (drag to swing/stretch) */}
        <LanyardBadge />

        <div className="poster-body wrap">
          <h1 className="H">
            Most people shouldn't <span className="gap" /> work here. Maybe <em>you</em> should.
          </h1>
          <div className="poster-sub">
            <p>High standards. Real ownership. Zero babysitting.</p>
            <p className="muted">Read this page before you apply.</p>
          </div>
          <a className="btn" href="#apply">
            Apply now
          </a>
          <div className="poster-meta">
            <span>Singapore</span>
            <span>120+ client firms</span>
            <span>5 service lines</span>
          </div>
        </div>
      </header>

      {/* ticker */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-inner">
          {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      </div>

      {/* ===== WHAT WE DO ===== */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">What we do</span>
            <h2 className="H">
              We run growth for Singapore's interior design <em>industry.</em>
            </h2>
            <p className="sub">
              Network matches homeowners with verified design firms, and runs the lead generation, marketing, branding,
              events, and concierge behind 120+ of them. Small team. Real responsibility from week one.
            </p>
          </div>
        </div>
        <div className="stats">
          <div className="stats-row">
            <div className="stat">
              <b>120+</b>
              <span>Client firms</span>
            </div>
            <div className="stat">
              <b>27</b>
              <span>Teammates</span>
            </div>
            <div className="stat">
              <b>5</b>
              <span>Service lines</span>
            </div>
            <div className="stat">
              <b>7 days</b>
              <span>Apply to answer</span>
            </div>
          </div>
        </div>
      </section>

      {/* project photo band */}
      <div className="photo-band">
        {BAND_PHOTOS.map((src, i) => (
          <div className={`ph pb${i + 1}`} key={src}>
            <img src={src} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      {/* ===== THE FILTER (BLACK) ===== */}
      <section className="dark">
        <div className="wrap">
          <div className="sec-head">
            <span className="label">Read this first</span>
            <h2 className="H">
              We'd rather lose you now than <em>disappoint</em> you later.
            </h2>
            <p className="sub">
              This is a fast environment with visible scoreboards. Most days are good. None of them are slow.
            </p>
          </div>
          <div>
            <div className="pain">
              <span className="label">01</span>
              <p>Your work is measured. Weekly. Everyone can see it.</p>
            </div>
            <div className="pain">
              <span className="label">02</span>
              <p>Feedback is direct. To your face, same day.</p>
            </div>
            <div className="pain">
              <span className="label">03</span>
              <p>You own outcomes, not tasks. Nobody chases you.</p>
            </div>
            <div className="pain">
              <span className="label">04</span>
              <p>Good enough isn't. We redo work that doesn't meet the bar.</p>
            </div>
          </div>
          <div className="dark-cta">
            <a className="btn" href="#apply">
              Still here? Apply
            </a>
            <p>If you read that and felt relief instead of fear, keep scrolling.</p>
          </div>
        </div>
      </section>

      {/* ===== APPLY / DON'T APPLY ===== */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">The honest filter</span>
            <h2 className="H">
              Save us both the <em>interview.</em>
            </h2>
          </div>
          <div className="compare">
            <div className="cmp-col cmp-alone">
              <h3>Don't apply if you</h3>
              <ul>
                <li>✕ Need someone to assign every task</li>
                <li>✕ Treat deadlines as suggestions</li>
                <li>✕ Take feedback personally</li>
                <li>✕ Say "that's not my job"</li>
                <li>✕ Want a quiet place to coast</li>
              </ul>
            </div>
            <div className="cmp-col cmp-net">
              <h3>Apply if you</h3>
              <ul>
                <li>✓ Ship fast and fix it faster</li>
                <li>✓ Have proof of work, not just a resume</li>
                <li>✓ Say the hard thing to the person directly</li>
                <li>✓ Care how the work looks and reads</li>
                <li>✓ Want your output to decide your ceiling</li>
              </ul>
              <a className="btn" href="#apply">
                That's me. Apply
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW WE WORK ===== */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">How we work</span>
            <h2 className="H">
              Five rules. No <em>exceptions.</em>
            </h2>
          </div>
          <div className="principles">
            {[
              ["01", "Ownership.", "You run your lane end to end. If it's yours, it's yours. Nobody follows up twice."],
              ["02", "Speed.", "Done today beats perfect next week. We move, then we refine."],
              ["03", "Standards.", "Client-facing work carries our name. If it's not right, it doesn't go out."],
              ["04", "Directness.", "Problems get said to the person, not about them. Fast, plain, then move on."],
              ["05", "Proof.", "Work speaks. Titles don't. The best argument in the room is a result."],
            ].map(([num, title, body]) => (
              <div className="principle" key={num}>
                <div className="num">{num}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OPEN ROLES ===== */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">Open roles</span>
            <h2 className="H">
              Pick your <em>lane.</em>
            </h2>
          </div>
          <div className="roles">
            {ROLES.map((r) => (
              <button type="button" className="role" key={r.title} onClick={() => pickRole(r.title)}>
                <h3>{r.title}</h3>
                <span className="label">{r.team}</span>
                <span className="label">{r.terms}</span>
                <span className="arr">→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">The process</span>
            <h2 className="H">
              Seven days. Four steps. No <em>ghosting.</em>
            </h2>
          </div>
          <div className="steps">
            <div className="step">
              <span className="label">Day 0</span>
              <div className="num">01</div>
              <h3>Apply with proof.</h3>
              <p>The form below. Link to something you've made. Two sentences on why you.</p>
            </div>
            <div className="step">
              <span className="label">Day 1–2</span>
              <div className="num">02</div>
              <h3>15-min call.</h3>
              <p>Quick conversation. We tell you the pay range upfront. You ask anything.</p>
            </div>
            <div className="step">
              <span className="label">Day 3–5</span>
              <div className="num">03</div>
              <h3>Paid work trial.</h3>
              <p>A small, real task from the actual job. Paid. You see the work, we see yours.</p>
            </div>
            <div className="step">
              <span className="label">Day 7</span>
              <div className="num">04</div>
              <h3>Answer.</h3>
              <p>Offer or a straight no with reasons. Either way, you hear from us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="label">Before you ask</span>
            <h2 className="H">
              Straight answers. No fine <em>print.</em>
            </h2>
          </div>
          <div className="faq-wrap">
            <details>
              <summary>
                Do I need experience? <span className="mark">+</span>
              </summary>
              <p>
                Proof beats years. Show us something you've made, sold, built, or grown. A school project counts if it's
                good. Five years of coasting doesn't.
              </p>
            </details>
            <details>
              <summary>
                What's the pay? <span className="mark">+</span>
              </summary>
              <p>
                Market rate, plus commission on sales and concierge roles. We tell you the exact range in the first
                call, before you invest any more time.
              </p>
            </details>
            <details>
              <summary>
                Remote or office? <span className="mark">+</span>
              </summary>
              <p>
                Depends on the role. Sales and studio roles are in-person in Singapore. Account management has remote
                paths. The role listing states it.
              </p>
            </details>
            <details>
              <summary>
                What does "work trial" mean? <span className="mark">+</span>
              </summary>
              <p>
                A small real task from the role, scoped to a few hours, and we pay you for it. It's the fairest
                interview we know. No free work, ever.
              </p>
            </details>
            <details>
              <summary>
                How fast will I hear back? <span className="mark">+</span>
              </summary>
              <p>
                Every application gets a reply within 48 hours. The whole process runs in 7 days. If we're slower than
                that, chase us. Seriously.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ===== FINAL APPLY ===== */}
      <section className="final" id="apply">
        <div className="wrap final-grid">
          <div>
            <span className="label" style={{ color: "rgba(241,239,232,.5)" }}>
              Last step
            </span>
            <h2 className="H" style={{ marginTop: 14 }}>
              No resume. Just <em>proof.</em>
            </h2>
            <p className="sub">
              One link to something you've made. Two sentences on why you. That's the whole application. We reply within
              48 hours.
            </p>
            <div className="final-note">
              <p>
                What counts as proof: a portfolio, a sales record, a channel you grew, a system you built, a project you
                shipped. Anything with your fingerprints on a result.
              </p>
            </div>
          </div>
          <ApplyForm presetRole={presetRole} onRoleConsumed={() => setPresetRole(undefined)} />
        </div>
      </section>

      <footer>
        <div className="wrap foot-row">
          <NetworkWordmark color="var(--bg)" height={17} />
          <span>
            © 2026 Network · <a href="/privacy-policy">Privacy</a>
          </span>
        </div>
      </footer>

      <div className="sticky-cta">
        <a className="btn" href="#apply">
          Apply now
        </a>
      </div>
    </div>
  );
}

/* ── Scoped styles, ported from network-careers-lp.html. Every selector
 *    is prefixed with .careerslp so the page's element resets and bold
 *    Archivo type rules can't leak into the rest of the app. ── */
const CAREERS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap');

.careerslp{
  --bg:#F1EFE8;
  --bg-deep:#E9E6DC;
  --ink:#14110D;
  --ink-soft:#6B655A;
  --line:rgba(20,17,13,.18);
  --line-strong:rgba(20,17,13,.6);
  --white:#FAF9F4;
  font-family:'Archivo',-apple-system,sans-serif;font-stretch:92%;
  background:var(--bg);color:var(--ink);font-size:16px;line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
.careerslp *{margin:0;padding:0;box-sizing:border-box}
.careerslp ::selection{background:var(--ink);color:var(--bg)}
.careerslp a{color:inherit;text-decoration:none}
.careerslp .wrap{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,52px)}
.careerslp .label{font-weight:700;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-stretch:100%}
.careerslp .muted{color:var(--ink-soft)}

.careerslp .H{font-weight:800;font-stretch:85%;text-transform:uppercase;letter-spacing:-.005em;line-height:.99}
.careerslp .H em{font-style:italic;font-weight:800}
.careerslp h2.H{font-size:clamp(30px,4.6vw,58px);max-width:24ch}

/* photo slots */
.careerslp .ph{position:relative;overflow:hidden}
.careerslp .ph>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.careerslp .human-1::after{content:"";position:absolute;inset:0;pointer-events:none;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g fill='%23F1EFE8' opacity='0.75'><circle cx='50' cy='30' r='15'/><path d='M18 100c2-26 16-40 32-40s30 14 32 40z'/></g></svg>") bottom center / auto 78% no-repeat}
.careerslp .human-2::after{content:"";position:absolute;inset:0;pointer-events:none;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 100'><g fill='%23F1EFE8' opacity='0.75'><circle cx='55' cy='32' r='14'/><path d='M26 100c2-24 14-37 29-37s27 13 29 37z'/><circle cx='104' cy='28' r='15'/><path d='M73 100c2-26 15-40 31-40s29 14 31 40z'/></g></svg>") bottom center / auto 82% no-repeat}

/* buttons */
.careerslp .btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  background:var(--ink);color:var(--bg);
  font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-stretch:100%;
  padding:17px 30px;border:1px solid var(--ink);cursor:pointer;
  transition:background .15s,color .15s;
}
.careerslp .btn:hover{background:transparent;color:var(--ink)}
.careerslp .btn:disabled{opacity:.5;cursor:not-allowed}

/* nav */
.careerslp nav{position:sticky;top:0;z-index:50;background:rgba(241,239,232,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--ink)}
.careerslp .nav-row{display:flex;align-items:center;justify-content:space-between;height:58px}
.careerslp .logo{font-weight:900;font-stretch:85%;font-size:19px;letter-spacing:.02em;text-transform:uppercase}
.careerslp .logo sup{font-size:9px;font-weight:700}
.careerslp .nav-proof{font-weight:600;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-stretch:100%}
.careerslp nav .btn{padding:11px 20px}
@media(max-width:700px){.careerslp .nav-proof{display:none}}

/* poster hero */
.careerslp .poster{position:relative;text-align:center}
.careerslp .poster-photo{
  height:clamp(180px,28vh,300px);
  background:linear-gradient(165deg,#4A4338,#2C2820 45%,#17140E 80%);
  position:relative;
}
/* Darken the hero photo so it keeps the moody poster feel and the cream
   lanyard badge that overlaps below it stays cohesive. */
.careerslp .poster-photo-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(20,17,13,.45),rgba(20,17,13,.72))}
.careerslp .hang{position:absolute;left:50%;top:0;transform:translateX(-50%);z-index:5;pointer-events:none;height:clamp(380px,58vh,600px)}
.careerslp .hang svg{height:100%;width:auto;display:block;overflow:visible}
/* Only the badge itself is grabbable — the rest of .hang stays click-through
   so it never blocks the CTA below it. touch-action:none keeps a drag from
   scrolling the page on touch devices. */
.careerslp .lanyard-badge{pointer-events:auto;cursor:grab;touch-action:none}
@media(prefers-reduced-motion:reduce){.careerslp .lanyard-badge{cursor:default}}
.careerslp .poster-body{padding:clamp(176px,25vh,264px) 0 clamp(56px,9vh,90px);position:relative}
.careerslp h1.H{font-size:clamp(36px,6.8vw,88px);max-width:18ch;margin:0 auto}
.careerslp h1 .gap{display:inline-block;width:clamp(70px,9vw,128px)}
.careerslp .poster-sub{margin-top:clamp(36px,6vh,64px);display:flex;flex-direction:column;gap:10px}
.careerslp .poster-sub p{font-weight:700;font-size:clamp(15px,1.8vw,21px)}
.careerslp .poster-sub .muted{font-weight:600;color:var(--ink-soft)}
.careerslp .poster .btn{margin-top:clamp(28px,5vh,44px)}
.careerslp .poster-meta{margin-top:26px;display:flex;justify-content:center;gap:24px;flex-wrap:wrap}
.careerslp .poster-meta span{font-weight:600;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-stretch:100%}

/* ticker */
.careerslp .ticker{background:var(--ink);color:var(--bg);overflow:hidden;white-space:nowrap}
.careerslp .ticker-inner{display:inline-flex;animation:careers-scroll 40s linear infinite;padding:11px 0}
.careerslp .ticker-inner span{font-weight:700;font-size:10px;letter-spacing:.16em;text-transform:uppercase;padding:0 30px;font-stretch:100%}
@keyframes careers-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.careerslp .ticker-inner{animation:none}}

.careerslp section{padding:clamp(56px,9vh,104px) 0}
.careerslp .sec-head{margin-bottom:clamp(30px,4vh,48px)}
.careerslp .sec-head .label{color:var(--ink-soft);display:block;margin-bottom:14px}
.careerslp .sec-head .sub{margin-top:14px;color:var(--ink-soft);font-size:14.5px;max-width:54ch;font-weight:500}

/* stats */
.careerslp .stats{border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
.careerslp .stats-row{display:grid;grid-template-columns:repeat(4,1fr)}
.careerslp .stat{padding:24px clamp(14px,2vw,30px);border-left:1px solid var(--ink)}
.careerslp .stat:first-child{border-left:none}
.careerslp .stat b{font-weight:800;font-stretch:80%;font-size:clamp(30px,3.6vw,52px);display:block;line-height:1}
.careerslp .stat span{font-weight:600;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-stretch:100%}
@media(max-width:760px){.careerslp .stats-row{grid-template-columns:repeat(2,1fr)}.careerslp .stat:nth-child(3){border-left:none;border-top:1px solid var(--ink)}.careerslp .stat:nth-child(4){border-top:1px solid var(--ink)}}

/* photo band */
.careerslp .photo-band{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;background:var(--ink)}
.careerslp .photo-band .ph{height:clamp(140px,18vw,240px)}
.careerslp .pb1{background:linear-gradient(140deg,#9C8467,#5C4630 55%,#241A0F)}
.careerslp .pb2{background:linear-gradient(150deg,#8A8273,#55503F 60%,#1E1B12)}
.careerslp .pb3{background:linear-gradient(135deg,#4A4338,#17140E)}
.careerslp .pb4{background:linear-gradient(120deg,#B09A78,#6E5638 60%,#2A1F10)}
.careerslp .pb5{background:linear-gradient(150deg,#7A6E5A,#3A332A 60%,#14110D)}
@media(max-width:760px){.careerslp .photo-band{grid-template-columns:repeat(3,1fr)}.careerslp .photo-band .ph:nth-child(n+4){display:none}}

/* dark filter section */
.careerslp .dark{background:var(--ink);color:var(--bg)}
.careerslp .dark .sec-head .label{color:rgba(241,239,232,.5)}
.careerslp .dark .sub{color:rgba(241,239,232,.6)}
.careerslp .pain{display:grid;grid-template-columns:56px 1fr;gap:20px;padding:20px 0;border-bottom:1px solid rgba(241,239,232,.22);align-items:baseline}
.careerslp .pain:first-of-type{border-top:1px solid rgba(241,239,232,.22)}
.careerslp .pain .label{color:rgba(241,239,232,.45)}
.careerslp .pain p{font-weight:700;font-stretch:88%;text-transform:uppercase;font-size:clamp(15px,2vw,22px);line-height:1.15;max-width:52ch}
.careerslp .dark-cta{margin-top:36px;display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.careerslp .dark .btn{background:var(--bg);color:var(--ink);border-color:var(--bg)}
.careerslp .dark .btn:hover{background:transparent;color:var(--bg)}
.careerslp .dark-cta p{color:rgba(241,239,232,.6);font-size:13.5px;max-width:44ch;font-weight:500}

/* compare: don't apply / apply */
.careerslp .compare{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:stretch}
.careerslp .cmp-col{padding:clamp(22px,2.6vw,36px)}
.careerslp .cmp-col h3{font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:20px;margin-bottom:16px;line-height:1}
.careerslp .cmp-col ul{list-style:none}
.careerslp .cmp-col li{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px;font-weight:600;align-items:baseline}
.careerslp .cmp-col li:last-child{border-bottom:none}
.careerslp .cmp-alone{border:1px dashed var(--line-strong);color:var(--ink-soft)}
.careerslp .cmp-net{background:var(--ink);color:var(--bg)}
.careerslp .cmp-net li{border-bottom-color:rgba(241,239,232,.22)}
.careerslp .cmp-net .btn{width:100%;margin-top:18px;background:var(--bg);color:var(--ink);border-color:var(--bg)}
.careerslp .cmp-net .btn:hover{background:transparent;color:var(--bg)}
@media(max-width:860px){.careerslp .compare{grid-template-columns:1fr}}

/* principles */
.careerslp .principles{border:1px solid var(--ink)}
.careerslp .principle{display:grid;grid-template-columns:clamp(80px,10vw,140px) 280px 1fr;gap:clamp(16px,3vw,40px);padding:clamp(20px,2.4vw,30px) clamp(18px,2.4vw,34px);border-bottom:1px solid var(--ink);align-items:baseline;background:var(--bg)}
.careerslp .principle:last-child{border-bottom:none}
.careerslp .principle .num{font-weight:800;font-stretch:75%;font-style:italic;font-size:clamp(34px,4vw,56px);line-height:.9}
.careerslp .principle h3{font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:clamp(17px,2vw,22px);line-height:1.05}
.careerslp .principle p{font-size:13.5px;color:var(--ink-soft);font-weight:500;max-width:56ch}
@media(max-width:860px){.careerslp .principle{grid-template-columns:64px 1fr}.careerslp .principle p{grid-column:2}}

/* roles */
.careerslp .roles{border:1px solid var(--ink);background:var(--white)}
.careerslp .role{
  display:grid;grid-template-columns:1fr 200px 200px 60px;gap:20px;align-items:center;
  padding:22px clamp(18px,2.4vw,34px);border-bottom:1px solid var(--ink);
  transition:background .15s;cursor:pointer;width:100%;text-align:left;background:var(--white);
  font-family:inherit;
}
.careerslp .role:last-child{border-bottom:none}
.careerslp .role:hover{background:var(--bg-deep)}
.careerslp .role h3{font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:clamp(16px,2vw,21px);line-height:1}
.careerslp .role .label{color:var(--ink-soft)}
.careerslp .role .arr{font-weight:800;font-size:20px;text-align:right;transition:transform .15s}
.careerslp .role:hover .arr{transform:translateX(4px)}
@media(max-width:820px){.careerslp .role{grid-template-columns:1fr 60px}.careerslp .role .label{display:none}}

/* process steps */
.careerslp .steps{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--ink)}
.careerslp .step{padding:clamp(20px,2.4vw,32px);border-left:1px solid var(--ink);position:relative;background:var(--bg)}
.careerslp .step:first-child{border-left:none}
.careerslp .step .num{font-weight:800;font-stretch:75%;font-size:clamp(40px,4.6vw,68px);line-height:.9;font-style:italic}
.careerslp .step h3{font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:16px;margin:16px 0 8px;line-height:1.05}
.careerslp .step p{font-size:13px;color:var(--ink-soft);font-weight:500}
.careerslp .step .label{position:absolute;top:20px;right:20px;color:var(--ink-soft)}
@media(max-width:920px){.careerslp .steps{grid-template-columns:repeat(2,1fr)}.careerslp .step:nth-child(3){border-left:none;border-top:1px solid var(--ink)}.careerslp .step:nth-child(4){border-top:1px solid var(--ink)}}
@media(max-width:560px){.careerslp .steps{grid-template-columns:1fr}.careerslp .step{border-left:none;border-top:1px solid var(--ink)}.careerslp .step:first-child{border-top:none}}

/* faq */
.careerslp .faq-wrap{max-width:800px}
.careerslp details{border-bottom:1px solid var(--line)}
.careerslp details:first-of-type{border-top:1px solid var(--ink)}
.careerslp summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:20px 0;font-weight:800;font-stretch:88%;text-transform:uppercase;font-size:clamp(14px,1.9vw,18px);line-height:1.1}
.careerslp summary::-webkit-details-marker{display:none}
.careerslp summary .mark{font-style:italic;transition:transform .2s;flex-shrink:0}
.careerslp details[open] .mark{transform:rotate(45deg)}
.careerslp details p{padding:0 0 20px;font-size:13.5px;color:var(--ink-soft);max-width:64ch;font-weight:500}

/* final apply */
.careerslp .final{background:var(--ink);color:var(--bg)}
.careerslp .final-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(32px,5vw,72px);align-items:center}
.careerslp .final h2.H{font-size:clamp(34px,5.2vw,68px);max-width:15ch}
.careerslp .final .sub{margin-top:18px;color:rgba(241,239,232,.65);font-size:14.5px;max-width:44ch;font-weight:500}
.careerslp .apply-card{background:var(--bg);border:1px solid var(--bg);padding:28px;color:var(--ink);position:relative}
.careerslp .apply-card .label{display:block;margin-bottom:12px;color:var(--ink-soft)}
.careerslp .apply-card h3{font-weight:800;font-stretch:85%;text-transform:uppercase;font-size:22px;line-height:1.02;margin-bottom:8px}
.careerslp .apply-card>p{font-size:13px;color:var(--ink-soft);margin-bottom:18px;font-weight:500}
.careerslp .field{margin-bottom:10px}
.careerslp .field input,.careerslp .field select,.careerslp .field textarea{
  width:100%;padding:15px 16px;border:1px solid var(--ink);background:var(--white);
  font-family:'Archivo',sans-serif;font-size:14px;color:var(--ink);
}
.careerslp .field textarea{resize:vertical;min-height:84px}
.careerslp .field input::placeholder,.careerslp .field textarea::placeholder{color:var(--ink-soft);text-transform:uppercase;font-size:11px;letter-spacing:.1em;font-weight:600}
.careerslp .field input:focus,.careerslp .field select:focus,.careerslp .field textarea:focus{outline:2px solid var(--ink);outline-offset:-1px}
.careerslp .field select{appearance:none;text-transform:uppercase;font-size:11px;letter-spacing:.1em;font-weight:600;color:var(--ink-soft)}
.careerslp .form-err{color:#b3330f;font-size:12px;font-weight:600;margin:4px 0 10px}
.careerslp .apply-card .btn{width:100%;margin-top:4px}
.careerslp .assure{display:flex;gap:18px;margin-top:14px;justify-content:center;flex-wrap:wrap}
.careerslp .assure span{font-weight:600;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);font-stretch:100%}
.careerslp .final-note{margin-top:22px;padding-top:18px;border-top:1px solid rgba(241,239,232,.22)}
.careerslp .final-note p{font-weight:600;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(241,239,232,.5);font-stretch:100%;line-height:2}
@media(max-width:900px){.careerslp .final-grid{grid-template-columns:1fr}}

/* footer */
.careerslp footer{background:var(--ink);color:var(--bg);padding:28px 0;border-top:1px solid rgba(241,239,232,.22)}
.careerslp .foot-row{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.careerslp .foot-row .logo{font-size:16px}
.careerslp .foot-row span,.careerslp .foot-row a{font-weight:600;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(241,239,232,.5);font-stretch:100%}

/* sticky mobile */
.careerslp .sticky-cta{display:none}
@media(max-width:760px){
  .careerslp .sticky-cta{display:block;position:fixed;bottom:0;left:0;right:0;z-index:60;background:rgba(241,239,232,.96);backdrop-filter:blur(10px);border-top:1px solid var(--ink);padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
  .careerslp .sticky-cta .btn{width:100%;padding:16px}
  .careerslp{padding-bottom:72px}
  .careerslp h1 .gap{width:clamp(48px,14vw,70px)}
}
`;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SiteNav } from "./SiteNav";
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { C, serif, sans } from "./homepage/v8/primitives";
import { ChevronDown, Check, Lock, Star, ShieldCheck } from "lucide-react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
type Journey = "exploring" | "getting-ready" | "actively-planning" | "deep-in-quotes" | "already-chose";
type Property = "HDB" | "Condo" | "EC" | "Landed";
type NewResale = "new" | "resale";
type OCS = "yes" | "no";
type Intent = "basics" | "proper" | "special";
type LandedWork = "aa" | "reconstruction" | "rebuild" | "unsure";
type LandedScope = "under30" | "30-50" | "over50";
type Layout = "No" | "Some" | "Major";
type Carpentry = "Low" | "Medium" | "High";
type Finish = "Budget" | "Quality" | "Premium";
type Sourcing = "none" | "1-2" | "3+";

type ScreenId = 0 | "route" | 1 | 2 | 3 | 4 | 5 | 6;

interface ComputedState {
  anchor: number;
  adjustedAnchor: number;
  min: number;
  max: number;
  confidence: "high" | "medium" | "medium-low" | "low";
  bandPct: number;
  firmType: { type: string; desc: string } | null;
  breakdown: BreakdownItem[];
  isLanded?: boolean;
  workType?: LandedWork | "aa";
}

interface BreakdownItem {
  section: string;
  label: string;
  sub: string;
  value: number;
  valueMax?: number;
  kind: "base" | "add" | "sub" | "neutral" | "range";
  displayOverride?: string;
  isLanded?: boolean;
}

// ═══════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════
const UNIT_TYPES: Record<Property, { value: string; label: string }[]> = {
  HDB: [
    { value: "2-Room", label: "2-Room" },
    { value: "3-Room", label: "3-Room" },
    { value: "4-Room", label: "4-Room" },
    { value: "5-Room", label: "5-Room" },
  ],
  Condo: [
    { value: "1BR", label: "1-Bedroom (~500 sqft)" },
    { value: "2BR", label: "2-Bedroom (~700 sqft)" },
    { value: "3BR", label: "3-Bedroom (~1000 sqft)" },
    { value: "4BR", label: "4-Bedroom+ (~1400 sqft)" },
  ],
  EC: [
    { value: "1BR", label: "1-Bedroom (~500 sqft)" },
    { value: "2BR", label: "2-Bedroom (~700 sqft)" },
    { value: "3BR", label: "3-Bedroom (~1000 sqft)" },
    { value: "4BR", label: "4-Bedroom+ (~1400 sqft)" },
  ],
  Landed: [
    { value: "1500-2500", label: "1,500 – 2,500 sqft" },
    { value: "2500-4000", label: "2,500 – 4,000 sqft" },
    { value: "4000-6000", label: "4,000 – 6,000 sqft" },
    { value: "6000+", label: "6,000 sqft+" },
  ],
};

const ANCHORS: Record<string, { basics: number; proper: number; special: number }> = {
  "HDB_BTO_OCS_2-Room": { basics: 16320, proper: 25600, special: 33160 },
  "HDB_BTO_OCS_3-Room": { basics: 22440, proper: 39680, special: 48648 },
  "HDB_BTO_OCS_4-Room": { basics: 30600, proper: 51840, special: 62024 },
  "HDB_BTO_OCS_5-Room": { basics: 35360, proper: 61440, special: 72584 },
  "HDB_BTO_NOOCS_2-Room": { basics: 20400, proper: 32000, special: 40200 },
  "HDB_BTO_NOOCS_3-Room": { basics: 28050, proper: 49600, special: 59560 },
  "HDB_BTO_NOOCS_4-Room": { basics: 38250, proper: 64800, special: 76280 },
  "HDB_BTO_NOOCS_5-Room": { basics: 44200, proper: 76800, special: 89480 },
  "HDB_Resale_2-Room": { basics: 24000, proper: 40000, special: 49000 },
  "HDB_Resale_3-Room": { basics: 33000, proper: 62000, special: 73200 },
  "HDB_Resale_4-Room": { basics: 45000, proper: 81000, special: 94100 },
  "HDB_Resale_5-Room": { basics: 52000, proper: 96000, special: 110600 },
  "Condo_new_1BR": { basics: 18000, proper: 28000, special: 35000 },
  "Condo_new_2BR": { basics: 24000, proper: 40000, special: 52000 },
  "Condo_new_3BR": { basics: 32000, proper: 56000, special: 72000 },
  "Condo_new_4BR": { basics: 42000, proper: 74000, special: 94000 },
  "Condo_resale_1BR": { basics: 28800, proper: 48000, special: 57800 },
  "Condo_resale_2BR": { basics: 39600, proper: 74400, special: 86840 },
  "Condo_resale_3BR": { basics: 56250, proper: 101250, special: 116375 },
  "Condo_resale_4BR": { basics: 67600, proper: 134400, special: 152840 },
  "EC_new_1BR": { basics: 18000, proper: 28000, special: 35000 },
  "EC_new_2BR": { basics: 24000, proper: 40000, special: 52000 },
  "EC_new_3BR": { basics: 32000, proper: 56000, special: 72000 },
  "EC_new_4BR": { basics: 42000, proper: 74000, special: 94000 },
  "EC_resale_1BR": { basics: 28800, proper: 48000, special: 57800 },
  "EC_resale_2BR": { basics: 39600, proper: 74400, special: 86840 },
  "EC_resale_3BR": { basics: 56250, proper: 101250, special: 116375 },
  "EC_resale_4BR": { basics: 67600, proper: 134400, special: 152840 },
};

const LANDED_BUA: Record<string, number> = { "1500-2500": 2000, "2500-4000": 3250, "4000-6000": 5000, "6000+": 7000 };
const LANDED_PSF: Record<string, { low: number; high: number }> = {
  aa: { low: 180, high: 400 },
  reconstruction: { low: 250, high: 450 },
  rebuild: { low: 400, high: 700 },
};
const LANDED_AA_PCT: Record<string, number | null> = { under30: 0.25, "30-50": 0.40, over50: null };
const LANDED_SOFT = { min: 60000, max: 150000 };

const LAYOUT_ADJ: Record<Layout, number> = { No: 0, Some: 5, Major: 12 };
const CARPENTRY_ADJ: Record<Carpentry, number> = { Low: -5, Medium: 0, High: 10 };
const FINISH_ADJ: Record<Finish, number> = { Budget: -10, Quality: 0, Premium: 18 };

const OCS_PRICING: Record<string, Record<string, number>> = {
  flooring: { "2-Room": 2200, "3-Room": 3340, "4-Room": 4970, "5-Room": 6060 },
  doors: { "2-Room": 2200, "3-Room": 2770, "4-Room": 3180, "5-Room": 3180 },
};

// ═══════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════
const shell: React.CSSProperties = {
  background: C.cream,
  color: C.black,
  fontFamily: sans,
  minHeight: "100vh",
};

const app: React.CSSProperties = {
  maxWidth: 680,
  margin: "0 auto",
  padding: "32px 24px 80px",
};

const subHeroStyle: React.CSSProperties = {
  fontSize: 15,
  color: C.gray,
  lineHeight: 1.7,
  marginBottom: 28,
  maxWidth: 540,
};

const sub2Style: React.CSSProperties = {
  fontSize: 14,
  color: C.grayLight,
  marginBottom: 22,
  lineHeight: 1.6,
};

const qLabelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: C.black, marginBottom: 4 };
const qHelpStyle: React.CSSProperties = { fontSize: 12, color: C.grayLight, marginBottom: 12, lineHeight: 1.6 };

const inputFieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#faf8f2",
  border: `1px solid ${C.creamBorder}`,
  borderRadius: 8,
  fontSize: 14,
  color: C.black,
  fontFamily: sans,
  outline: "none",
};

// ═══════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        padding: "5px 12px",
        background: C.creamDark,
        color: C.gray,
        borderRadius: 3,
        marginBottom: 16,
      }}
    >
      {children}
    </span>
  );
}

function Hero({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: serif,
        fontSize: "clamp(28px, 4.2vw, 40px)",
        fontWeight: 400,
        lineHeight: 1.12,
        letterSpacing: "-0.02em",
        marginBottom: 14,
        color: C.black,
      }}
    >
      {children}
    </h1>
  );
}

function H2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2
      style={{
        fontFamily: serif,
        fontSize: "clamp(22px, 3vw, 28px)",
        fontWeight: 500,
        lineHeight: 1.2,
        marginBottom: 10,
        color: C.black,
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

function Em({ children }: { children: React.ReactNode }) {
  return <span style={{ fontStyle: "italic", color: C.grayLight }}>{children}</span>;
}

function Progress({ activeIndex, total = 6 }: { activeIndex: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            background: i < activeIndex ? "#5a9460" : i === activeIndex ? C.black : C.creamBorder,
            transition: "background 300ms",
          }}
        />
      ))}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
  anchor,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  anchor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "14px 16px",
        background: selected ? C.black : "#faf8f2",
        border: `1px solid ${selected ? C.black : C.creamBorder}`,
        borderRadius: 8,
        color: selected ? C.white : C.black,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: sans,
        transition: "all 150ms",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{title}</div>
      {desc && (
        <div style={{ fontSize: 12, color: selected ? "#bbb" : C.grayLight, lineHeight: 1.5 }}>{desc}</div>
      )}
      {anchor && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            marginTop: 6,
            letterSpacing: "0.04em",
            color: selected ? "#8eb895" : "#5a9460",
          }}
        >
          {anchor}
        </div>
      )}
    </button>
  );
}

function OptionPill({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "12px 14px",
        background: selected ? C.black : "#faf8f2",
        border: `1px solid ${selected ? C.black : C.creamBorder}`,
        borderRadius: 8,
        color: selected ? C.white : C.black,
        fontSize: 14,
        textAlign: "center",
        cursor: "pointer",
        fontFamily: sans,
        transition: "all 150ms",
      }}
    >
      {label}
    </button>
  );
}

function BtnRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 32,
        paddingTop: 20,
        borderTop: `1px solid ${C.creamBorder}`,
      }}
    >
      {children}
    </div>
  );
}

function BtnPrimary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "14px 22px",
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#bbb" : C.black,
        color: C.white,
        border: "none",
        fontFamily: sans,
        transition: "background 150ms",
      }}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 22px",
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        background: "transparent",
        color: C.gray,
        border: `1px solid ${C.creamBorder}`,
        cursor: "pointer",
        fontFamily: sans,
        transition: "all 150ms",
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export function CostGuide() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<ScreenId>(0);

  // Journey screener
  const [journey, setJourney] = useState<Journey | null>(null);

  // Property
  const [property, setProperty] = useState<Property | null>(null);
  const [newResale, setNewResale] = useState<NewResale | null>(null);
  const [ocs, setOcs] = useState<OCS | null>(null);
  const [ocsFlooring, setOcsFlooring] = useState(false);
  const [ocsDoors, setOcsDoors] = useState(false);
  const [unitType, setUnitType] = useState<string | null>(null);

  // Intent / Landed
  const [intent, setIntent] = useState<Intent | null>(null);
  const [landedWorkType, setLandedWorkType] = useState<LandedWork | null>(null);
  const [landedScopePct, setLandedScopePct] = useState<LandedScope | null>(null);

  // Confidence boosters
  const [layout, setLayout] = useState<Layout | null>(null);
  const [carpentry, setCarpentry] = useState<Carpentry | null>(null);
  const [finish, setFinish] = useState<Finish | null>(null);

  // Sourcing
  const [sourcing, setSourcing] = useState<Sourcing | null>(null);

  // Lead
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  // Math toggle on results
  const [mathOpen, setMathOpen] = useState(false);

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  // ─── Derived: anchor key and computed costs ────────────────
  const anchorKey = useMemo((): string | null => {
    if (!property || !newResale || !unitType) return null;
    if (property === "HDB" && newResale === "new") {
      if (ocs === "yes" && (ocsFlooring || ocsDoors)) return `HDB_BTO_OCS_${unitType}`;
      return `HDB_BTO_NOOCS_${unitType}`;
    }
    if (property === "HDB") return `HDB_Resale_${unitType}`;
    if (property === "Condo") return `Condo_${newResale}_${unitType}`;
    if (property === "EC") return `EC_${newResale}_${unitType}`;
    return null;
  }, [property, newResale, unitType, ocs, ocsFlooring, ocsDoors]);

  const computed = useMemo((): ComputedState => {
    // Landed branch
    if (property === "Landed") {
      return computeLanded();
    }
    const anchorObj = anchorKey ? ANCHORS[anchorKey] : null;
    if (!anchorObj || !intent) {
      return { anchor: 0, adjustedAnchor: 0, min: 0, max: 0, confidence: "low", bandPct: 18, firmType: null, breakdown: [] };
    }

    const base = anchorObj[intent];
    const breakdown: BreakdownItem[] = [];
    breakdown.push({
      section: "Starting point",
      label: anchorLabel(property!, newResale!, unitType!, ocs, ocsFlooring, ocsDoors),
      sub: intentLabelFor(intent),
      value: base,
      kind: "base",
    });

    let adjusted = base;

    // OCS partial adjustments
    if (property === "HDB" && newResale === "new" && ocs === "yes") {
      if (ocsFlooring && !ocsDoors) {
        const adj = base * 0.03;
        adjusted += adj;
        breakdown.push({ section: "Adjustments", label: "OCS: Flooring only", sub: "Doors + sanitary still need private work (+3%)", value: adj, kind: "add" });
      } else if (!ocsFlooring && ocsDoors) {
        const adj = base * 0.05;
        adjusted += adj;
        breakdown.push({ section: "Adjustments", label: "OCS: Doors + sanitary only", sub: "Flooring still needs private work (+5%)", value: adj, kind: "add" });
      } else if (ocsFlooring && ocsDoors) {
        breakdown.push({ section: "Adjustments", label: "OCS: Full (flooring + doors + sanitary)", sub: "Anchor already accounts for this — no adjustment", value: 0, kind: "neutral" });
      }
    }

    if (layout) {
      const pct = LAYOUT_ADJ[layout];
      const adj = (base * pct) / 100;
      adjusted += adj;
      if (pct !== 0) {
        breakdown.push({ section: "Adjustments", label: `Layout: ${layout} changes`, sub: `${pct > 0 ? "+" : ""}${pct}% of anchor`, value: adj, kind: pct > 0 ? "add" : "sub" });
      }
    }
    if (carpentry) {
      const pct = CARPENTRY_ADJ[carpentry];
      const adj = (base * pct) / 100;
      adjusted += adj;
      if (pct !== 0) {
        const carpLabel = carpentry === "Low" ? "Mostly ready-made" : carpentry === "High" ? "Mostly custom" : "Mix";
        breakdown.push({ section: "Adjustments", label: `Carpentry: ${carpLabel}`, sub: `${pct > 0 ? "+" : ""}${pct}% of anchor`, value: adj, kind: pct > 0 ? "add" : "sub" });
      }
    }
    if (finish) {
      const pct = FINISH_ADJ[finish];
      const adj = (base * pct) / 100;
      adjusted += adj;
      if (pct !== 0) {
        const finLabel = finish === "Budget" ? "Keeping costs down" : finish === "Premium" ? "Premium throughout" : "Quality";
        breakdown.push({ section: "Adjustments", label: `Finish: ${finLabel}`, sub: `${pct > 0 ? "+" : ""}${pct}% of anchor`, value: adj, kind: pct > 0 ? "add" : "sub" });
      }
    }

    const answered = [layout, carpentry, finish].filter(Boolean).length;
    let bandPct: number, confidence: ComputedState["confidence"];
    if (answered === 3) { bandPct = 8; confidence = "high"; }
    else if (answered === 2) { bandPct = 12; confidence = "medium"; }
    else if (answered === 1) { bandPct = 15; confidence = "medium-low"; }
    else { bandPct = 18; confidence = "low"; }

    const min = Math.round((adjusted * (1 - bandPct / 100)) / 100) * 100;
    const max = Math.round((adjusted * (1 + bandPct / 100)) / 100) * 100;

    return { anchor: base, adjustedAnchor: adjusted, min, max, confidence, bandPct, firmType: routeFirmType({ intent, property, layout, carpentry, finish }), breakdown };

    function computeLanded(): ComputedState {
      if (!landedWorkType || !unitType) return { anchor: 0, adjustedAnchor: 0, min: 0, max: 0, confidence: "low", bandPct: 0, firmType: null, breakdown: [], isLanded: true };
      const workType = landedWorkType === "unsure" ? "aa" : landedWorkType;
      const scopePct = landedWorkType === "unsure" ? "30-50" : landedScopePct;
      if (workType === "aa" && !scopePct) return { anchor: 0, adjustedAnchor: 0, min: 0, max: 0, confidence: "low", bandPct: 0, firmType: null, breakdown: [], isLanded: true };
      const bua = LANDED_BUA[unitType];
      const psf = LANDED_PSF[workType];
      if (!bua || !psf) return { anchor: 0, adjustedAnchor: 0, min: 0, max: 0, confidence: "low", bandPct: 0, firmType: null, breakdown: [], isLanded: true };

      let effectiveArea: number;
      let effectiveAreaLabel: string;
      if (workType === "aa") {
        const pctFactor = LANDED_AA_PCT[scopePct as string] || 0.40;
        effectiveArea = Math.round(bua * pctFactor);
        const pctDisplay = scopePct === "under30" ? "25%" : "40%";
        effectiveAreaLabel = `~${effectiveArea.toLocaleString()} sqft (${pctDisplay} of ${bua.toLocaleString()} sqft BUA)`;
      } else {
        effectiveArea = bua;
        effectiveAreaLabel = `${bua.toLocaleString()} sqft full BUA`;
      }

      const cMin = effectiveArea * psf.low;
      const cMax = effectiveArea * psf.high;
      const totalMin = Math.round((cMin + LANDED_SOFT.min) / 1000) * 1000;
      const totalMax = Math.round((cMax + LANDED_SOFT.max) / 1000) * 1000;
      const adj = (totalMin + totalMax) / 2;

      const breakdown: BreakdownItem[] = [
        { section: "Starting point", label: landedWorkLabel(workType), sub: effectiveAreaLabel, value: effectiveArea, kind: "base", isLanded: true, displayOverride: `${effectiveArea.toLocaleString()} sqft` },
        { section: "Construction cost", label: `PSF rate: $${psf.low} – $${psf.high}`, sub: `Industry range for ${landedWorkLabel(workType).toLowerCase()} works in 2025–2026`, value: cMin, valueMax: cMax, kind: "range", isLanded: true },
        { section: "Soft costs", label: "QP / PE fees, URA & BCA submissions, drainage, contingency", sub: "Typical flat addition across all landed projects", value: LANDED_SOFT.min, valueMax: LANDED_SOFT.max, kind: "range", isLanded: true },
      ];

      const conf: ComputedState["confidence"] = (workType === "aa" && scopePct) || workType !== "aa" ? "medium" : "low";
      return { anchor: cMin + LANDED_SOFT.min, adjustedAnchor: adj, min: totalMin, max: totalMax, confidence: conf, bandPct: 0, firmType: routeLandedFirmType(workType, scopePct as LandedScope | null), breakdown, isLanded: true, workType };
    }
  }, [property, anchorKey, intent, newResale, unitType, ocs, ocsFlooring, ocsDoors, layout, carpentry, finish, landedWorkType, landedScopePct]);

  // ─── Step-2 intent anchor previews ─────────────────────────
  const intentAnchors = useMemo(() => {
    if (!anchorKey) return null;
    const a = ANCHORS[anchorKey];
    if (!a) return null;
    const fmt = (v: number, open?: boolean) => {
      const min = Math.round((v * 0.9) / 100) * 100;
      if (open) return `Starts at $${min.toLocaleString()}+`;
      const max = Math.round((v * 1.1) / 100) * 100;
      return `Range: $${min.toLocaleString()} – $${max.toLocaleString()}`;
    };
    return { basics: fmt(a.basics), proper: fmt(a.proper), special: fmt(a.special, true) };
  }, [anchorKey]);

  // ─── Screen navigation ─────────────────────────────────────
  const progressIndex = (() => {
    if (screen === 0 || screen === "route") return 0;
    if (typeof screen === "number") return Math.min(screen, 5);
    return 0;
  })();

  const goFromJourney = () => {
    if (journey === "exploring" || journey === "already-chose") setScreen("route");
    else setScreen(1);
  };

  const goFromStep1 = () => setScreen(2);

  const goFromStep2 = () => {
    if (property === "Landed") setScreen(4); // landed skips confidence boosters
    else setScreen(3);
  };

  const step1Valid = (() => {
    if (!property || !newResale || !unitType) return false;
    if (property === "HDB" && newResale === "new" && !ocs) return false;
    return true;
  })();

  const step2Valid = (() => {
    if (property === "Landed") {
      if (!landedWorkType) return false;
      if (landedWorkType === "aa" && !landedScopePct) return false;
      return true;
    }
    return !!intent;
  })();

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={shell}>
      <SiteNav logoImg={imgRectangle1} onLogoClick={() => navigate("/")} />
      <div style={app}>
        {/* Progress dots */}
        <Progress activeIndex={progressIndex} />

        {screen === 0 && (
          <Screen0
            journey={journey}
            onJourney={setJourney}
            onContinue={goFromJourney}
          />
        )}

        {screen === "route" && (
          <ScreenRoute
            journey={journey}
            onBack={() => setScreen(0)}
            onContinueAnyway={() => setScreen(1)}
          />
        )}

        {screen === 1 && (
          <Screen1
            property={property}
            setProperty={(p) => {
              setProperty(p);
              setNewResale(null);
              setOcs(null);
              setOcsFlooring(false);
              setOcsDoors(false);
              setUnitType(null);
            }}
            newResale={newResale}
            setNewResale={(n) => {
              setNewResale(n);
              setOcs(null);
              setOcsFlooring(false);
              setOcsDoors(false);
            }}
            ocs={ocs}
            setOcs={(v) => {
              setOcs(v);
              if (v === "no") { setOcsFlooring(false); setOcsDoors(false); }
            }}
            ocsFlooring={ocsFlooring}
            setOcsFlooring={setOcsFlooring}
            ocsDoors={ocsDoors}
            setOcsDoors={setOcsDoors}
            unitType={unitType}
            setUnitType={setUnitType}
            onBack={() => setScreen(0)}
            onContinue={goFromStep1}
            canContinue={step1Valid}
          />
        )}

        {screen === 2 && (
          <Screen2
            property={property!}
            intent={intent}
            setIntent={setIntent}
            intentAnchors={intentAnchors}
            landedWorkType={landedWorkType}
            setLandedWorkType={(w) => {
              setLandedWorkType(w);
              if (w !== "aa") setLandedScopePct(null);
            }}
            landedScopePct={landedScopePct}
            setLandedScopePct={(s) => {
              if (s === "over50") {
                // auto-reroute to reconstruction
                setLandedWorkType("reconstruction");
                setLandedScopePct(null);
              } else {
                setLandedScopePct(s);
              }
            }}
            onBack={() => setScreen(1)}
            onContinue={goFromStep2}
            canContinue={step2Valid}
          />
        )}

        {screen === 3 && (
          <Screen3
            layout={layout}
            setLayout={setLayout}
            carpentry={carpentry}
            setCarpentry={setCarpentry}
            finish={finish}
            setFinish={setFinish}
            computed={computed}
            intent={intent}
            onBack={() => setScreen(2)}
            onContinue={() => setScreen(4)}
          />
        )}

        {screen === 4 && (
          <Screen4
            sourcing={sourcing}
            setSourcing={setSourcing}
            onBack={() => setScreen(property === "Landed" ? 2 : 3)}
            onContinue={() => setScreen(5)}
          />
        )}

        {screen === 5 && (
          <Screen5
            computed={computed}
            intent={intent}
            mathOpen={mathOpen}
            setMathOpen={setMathOpen}
            leadName={leadName}
            setLeadName={setLeadName}
            leadPhone={leadPhone}
            setLeadPhone={setLeadPhone}
            leadEmail={leadEmail}
            setLeadEmail={setLeadEmail}
            onBack={() => setScreen(4)}
            onSubmit={() => setScreen(6)}
          />
        )}

        {screen === 6 && <Screen6 />}
      </div>
    </div>
  );
}

export default CostGuide;

// ═══════════════════════════════════════════════════════════
// SCREEN 0 — JOURNEY SCREENER
// ═══════════════════════════════════════════════════════════
function Screen0({
  journey,
  onJourney,
  onContinue,
}: {
  journey: Journey | null;
  onJourney: (j: Journey) => void;
  onContinue: () => void;
}) {
  const opts: { value: Journey; title: string; desc: string }[] = [
    { value: "exploring", title: "Still exploring ideas", desc: "12+ months away, browsing inspiration, no firms yet." },
    { value: "getting-ready", title: "Getting ready to start", desc: "6–12 months away, starting to think about budget." },
    { value: "actively-planning", title: "Actively planning", desc: "3–6 months away, starting to look at firms." },
    { value: "deep-in-quotes", title: "Deep in quotes", desc: "Met 2+ firms, comparing proposals, need a sense check." },
    { value: "already-chose", title: "Already chose a firm", desc: "Signed or close to signing, just researching." },
  ];
  return (
    <div>
      <Badge>Step 1 of 5 · 30 seconds</Badge>
      <Hero>
        See what your renovation <Em>should actually cost</Em> — before anyone quotes you.
      </Hero>
      <p style={subHeroStyle}>
        Get a cost range based on homes like yours. Plus the firm type built for your scope. Takes under 2 minutes. The real numbers come when you talk to us.
      </p>

      <div style={{ marginBottom: 24 }}>
        <div style={qLabelStyle}>Where are you in your renovation journey?</div>
        <div style={qHelpStyle}>This helps us give you the right level of detail.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((o) => (
            <OptionCard
              key={o.value}
              selected={journey === o.value}
              onClick={() => onJourney(o.value)}
              title={o.title}
              desc={o.desc}
            />
          ))}
        </div>
      </div>

      <BtnRow>
        <BtnPrimary onClick={onContinue} disabled={!journey}>Continue</BtnPrimary>
      </BtnRow>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN ROUTE — for exploring / already-chose
// ═══════════════════════════════════════════════════════════
function ScreenRoute({
  journey,
  onBack,
  onContinueAnyway,
}: {
  journey: Journey | null;
  onBack: () => void;
  onContinueAnyway: () => void;
}) {
  const isExploring = journey === "exploring";
  return (
    <div>
      <Hero>
        This tool is built for <Em>homeowners closer to the decision.</Em>
      </Hero>
      <p style={subHeroStyle}>
        Our Cost Guide gives the sharpest range when you have some scope in mind and a real timeline. Based on what you said, there's a better tool for where you are right now.
      </p>

      <div
        style={{
          background: C.white,
          padding: "28px 26px",
          border: `1px solid ${C.creamBorder}`,
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        {isExploring ? (
          <>
            <H2 style={{ marginBottom: 12 }}>You're in the inspiration phase.</H2>
            <p style={{ color: C.gray, lineHeight: 1.6, fontSize: 14 }}>
              12+ months out, gathering ideas. The Cost Guide works best when you have a scope in mind and a real timeline. You can still run it now as a rough benchmark — just know the range will feel more real closer to your keys.
            </p>
            <div
              style={{
                background: "#f5f2eb",
                borderLeft: `3px solid ${C.black}`,
                padding: "14px 16px",
                margin: "16px 0 0",
                fontFamily: serif,
                fontSize: 16,
                fontStyle: "italic",
                color: C.black,
                lineHeight: 1.5,
              }}
            >
              "Homeowners who run the Cost Guide more than 12 months out often revisit it closer to their keys. The numbers feel more actionable then."
            </div>
          </>
        ) : (
          <>
            <H2 style={{ marginBottom: 12 }}>You're past where Network usually helps.</H2>
            <p style={{ color: C.gray, lineHeight: 1.6, fontSize: 14 }}>
              If you've already chosen a firm, our matching service isn't for you right now. But if you want to sense-check your quote against market rates, the Cost Guide is still useful.
            </p>
          </>
        )}
      </div>

      <BtnRow>
        <BtnSecondary onClick={onBack}>Go back</BtnSecondary>
        <BtnPrimary onClick={onContinueAnyway}>Continue anyway</BtnPrimary>
      </BtnRow>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 1 — PROPERTY
// ═══════════════════════════════════════════════════════════
function Screen1({
  property, setProperty,
  newResale, setNewResale,
  ocs, setOcs,
  ocsFlooring, setOcsFlooring,
  ocsDoors, setOcsDoors,
  unitType, setUnitType,
  onBack, onContinue, canContinue,
}: any) {
  const showNewResale = !!property;
  const showOcs = property === "HDB" && newResale === "new";
  const showOcsComponents = showOcs && ocs === "yes";
  const showUnitType = !!property && !!newResale && (!showOcs || !!ocs);

  const newResaleChoices: { value: NewResale; label: string }[] = property === "HDB"
    ? [{ value: "new", label: "BTO (new)" }, { value: "resale", label: "Resale" }]
    : property === "Condo" || property === "EC"
      ? [{ value: "new", label: "New launch" }, { value: "resale", label: "Resale" }]
      : [{ value: "new", label: "New build" }, { value: "resale", label: "Existing" }];

  const floorPrice = unitType && OCS_PRICING.flooring[unitType];
  const doorPrice = unitType && OCS_PRICING.doors[unitType];

  return (
    <div>
      <H2>Tell us about your home</H2>
      <p style={sub2Style}>Pricing depends heavily on property type and condition. Resale flats need hacking and rewiring. BTO flats with OCS have less private work.</p>

      <div style={{ marginBottom: 24 }}>
        <div style={qLabelStyle}>Property type</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {(["HDB", "Condo", "EC", "Landed"] as Property[]).map((p) => (
            <OptionPill key={p} label={p === "Condo" ? "Condominium" : p === "EC" ? "Executive Condo" : p} selected={property === p} onClick={() => setProperty(p)} />
          ))}
        </div>
      </div>

      {showNewResale && (
        <div style={{ marginBottom: 24 }}>
          <div style={qLabelStyle}>
            {property === "HDB" ? "New (BTO) or resale?" : property === "Landed" ? "New build or existing?" : "New launch or resale?"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {newResaleChoices.map((c) => (
              <OptionPill key={c.value} label={c.label} selected={newResale === c.value} onClick={() => setNewResale(c.value)} />
            ))}
          </div>
        </div>
      )}

      {showOcs && (
        <div style={{ marginBottom: 24 }}>
          <div style={qLabelStyle}>Did you take HDB's Optional Component Scheme (OCS)?</div>
          <div style={qHelpStyle}>OCS is HDB's package — you pay them directly for flooring, doors, and sanitary fittings. Decided at flat booking. If you don't remember choosing it, you probably didn't.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <OptionCard selected={ocs === "yes"} onClick={() => setOcs("yes")} title="Yes, I took OCS" desc="HDB will hand over with some components already installed." />
            <OptionCard selected={ocs === "no"} onClick={() => setOcs("no")} title="No, I opted out" desc="Everything will be done privately after key collection." />
          </div>
        </div>
      )}

      {showOcsComponents && (
        <div style={{ marginBottom: 24 }}>
          <div style={qLabelStyle}>Which OCS packages did you take?</div>
          <div style={qHelpStyle}>HDB offers two packages. You can take one or both.</div>
          <OcsCheck
            checked={ocsFlooring}
            onToggle={() => setOcsFlooring(!ocsFlooring)}
            title="Flooring package"
            desc="Vinyl strips in bedrooms, porcelain tiles in living/dining."
            price={floorPrice ? `HDB charges: $${floorPrice.toLocaleString()} for ${unitType}` : "HDB charges: $4,970 for 4-room"}
          />
          <OcsCheck
            checked={ocsDoors}
            onToggle={() => setOcsDoors(!ocsDoors)}
            title="Internal doors + sanitary fittings package"
            desc="Bedroom and bathroom doors, basin, taps, shower mixers."
            price={doorPrice ? `HDB charges: $${doorPrice.toLocaleString()} for ${unitType}` : "HDB charges: $3,180 for 4-room and above"}
          />
        </div>
      )}

      {showUnitType && (
        <div style={{ marginBottom: 24 }}>
          <div style={qLabelStyle}>Unit type</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {UNIT_TYPES[property as Property].map((u) => (
              <OptionPill key={u.value} label={u.label} selected={unitType === u.value} onClick={() => setUnitType(u.value)} />
            ))}
          </div>
        </div>
      )}

      <BtnRow>
        <BtnSecondary onClick={onBack}>Back</BtnSecondary>
        <BtnPrimary onClick={onContinue} disabled={!canContinue}>Continue</BtnPrimary>
      </BtnRow>
    </div>
  );
}

function OcsCheck({ checked, onToggle, title, desc, price }: { checked: boolean; onToggle: () => void; title: string; desc: string; price: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        padding: "14px 16px",
        background: "#faf8f2",
        border: `1px solid ${C.creamBorder}`,
        borderRadius: 8,
        marginBottom: 8,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: sans,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          marginTop: 2,
          borderRadius: 3,
          background: checked ? C.black : C.white,
          border: `1.5px solid ${checked ? C.black : C.creamBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={11} strokeWidth={3} style={{ color: C.white }} />}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.black, marginBottom: 2 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: C.grayLight, lineHeight: 1.5 }}>{desc}</span>
        <span style={{ display: "block", fontSize: 11, color: "#5a9460", fontWeight: 600, marginTop: 4, letterSpacing: "0.04em" }}>{price}</span>
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 2 — INTENT / LANDED WORK TYPE
// ═══════════════════════════════════════════════════════════
function Screen2({
  property, intent, setIntent, intentAnchors,
  landedWorkType, setLandedWorkType,
  landedScopePct, setLandedScopePct,
  onBack, onContinue, canContinue,
}: any) {
  const isLanded = property === "Landed";
  const intentOpts: { value: Intent; title: string; desc: string }[] = [
    { value: "basics", title: "Move-in ready basics", desc: "Wet areas done, basic finishes, painting, ready-made furniture. Priority: get in and start living. Custom carpentry only where essential." },
    { value: "proper", title: "A proper home renovation", desc: "Everything done, custom where it matters, unified design. Priority: a home that works and looks good. Built-in carpentry in main rooms." },
    { value: "special", title: "Something special", desc: "Fully designed, premium materials, custom throughout. Priority: a home that reflects who you are. Design-led from concept to completion." },
  ];
  const landedOpts: { value: LandedWork; title: string; desc: string; anchor: string }[] = [
    { value: "aa", title: "A&A (Additions & Alterations)", desc: "Keeping the existing structure. Modifying or extending less than 50% of the building. No additional storey, no change in housing form. The fastest approval pathway.", anchor: "$180 – $400 PSF on affected area" },
    { value: "reconstruction", title: "Reconstruction", desc: "Substantial rebuild while retaining some existing structure. Works exceeding 50% of the existing building, adding a storey, or changing housing form. Must comply with current URA Envelope Control.", anchor: "$250 – $450 PSF on full built-up area" },
    { value: "rebuild", title: "Rebuild (New Erection)", desc: "Full demolition and build from scratch. Complete design flexibility. Requires fresh URA planning permission and full BCA submission.", anchor: "$400 – $700 PSF and above" },
    { value: "unsure", title: "Not sure yet, still exploring", desc: "We'll walk through the best pathway during the concierge call based on your goals, site conditions, and BCA/URA constraints.", anchor: "Range calculated as A&A baseline" },
  ];

  return (
    <div>
      <H2>{isLanded ? "What kind of landed works are you planning?" : "What kind of renovation are you thinking about?"}</H2>
      <p style={sub2Style}>
        {isLanded
          ? "Landed renovations fall into three categories under BCA and URA. Each has very different cost, timeline, and submission requirements."
          : "This is the most important question — it shapes everything else. Don't overthink it. Pick the one closest to what you're imagining."}
      </p>

      {isLanded ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {landedOpts.map((o) => (
              <OptionCard
                key={o.value}
                selected={landedWorkType === o.value}
                onClick={() => setLandedWorkType(o.value)}
                title={o.title}
                desc={o.desc}
                anchor={o.anchor}
              />
            ))}
          </div>

          {landedWorkType === "aa" && (
            <>
              <div style={{ height: 1, background: C.creamDark, margin: "24px 0 22px" }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: C.black, marginBottom: 6, lineHeight: 1.35 }}>
                Roughly how much of the total floor area is being renovated?
              </h3>
              <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.5, marginBottom: 14 }}>
                A&amp;A is defined by the portion of the building being altered. This tightens the estimate.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <OptionCard selected={landedScopePct === "under30"} onClick={() => setLandedScopePct("under30")} title="Less than 30%" desc="Minor additions or alterations. Specific rooms or a single extension." />
                <OptionCard selected={landedScopePct === "30-50"} onClick={() => setLandedScopePct("30-50")} title="30 – 50%" desc="Substantial A&A. Multiple rooms, significant structural work, but within A&A limits." />
                <OptionCard selected={landedScopePct === "over50"} onClick={() => setLandedScopePct("over50")} title="More than 50%" desc="Past A&A territory. We'll switch your estimate to Reconstruction pricing." />
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {intentOpts.map((o) => (
            <OptionCard
              key={o.value}
              selected={intent === o.value}
              onClick={() => setIntent(o.value)}
              title={o.title}
              desc={o.desc}
              anchor={intentAnchors ? (intentAnchors as any)[o.value] : "Range: calculating…"}
            />
          ))}
        </div>
      )}

      <BtnRow>
        <BtnSecondary onClick={onBack}>Back</BtnSecondary>
        <BtnPrimary onClick={onContinue} disabled={!canContinue}>Continue</BtnPrimary>
      </BtnRow>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 3 — CONFIDENCE BOOSTERS
// ═══════════════════════════════════════════════════════════
function Screen3({
  layout, setLayout,
  carpentry, setCarpentry,
  finish, setFinish,
  computed, intent,
  onBack, onContinue,
}: any) {
  const answered = [layout, carpentry, finish].filter(Boolean).length;
  const rangeText = intent === "special"
    ? `$${computed.min.toLocaleString()}+`
    : `$${computed.min.toLocaleString()} – $${computed.max.toLocaleString()}`;
  const labels: Record<string, string> = { high: "High confidence", medium: "Medium confidence", "medium-low": "Medium-low confidence", low: "Range only" };
  return (
    <div>
      <H2>Want a more specific number?</H2>
      <p style={sub2Style}>Answer any of these to tighten your range. Skip any you don't know yet — your concierge will walk through them on the call.</p>

      <div style={{ background: C.creamDark, borderRadius: 8, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: C.gray, lineHeight: 1.6 }}>
        <strong style={{ color: C.black }}>The more you answer, the narrower your range.</strong> Watch the estimate update in real time.
      </div>

      <BoosterGroup
        label="Any layout changes?"
        help="Moving walls, opening up spaces, major reconfiguration."
        value={layout}
        onSelect={setLayout}
        options={[
          { value: "No", title: "No changes", desc: "Keeping the current walls and layout." },
          { value: "Some", title: "Some changes", desc: "Maybe a wall or two opened." },
          { value: "Major", title: "Major reconfiguration", desc: "Open plan, multiple walls, significant rework." },
        ]}
      />
      <BoosterGroup
        label="How much custom carpentry?"
        help="Built-in wardrobes, TV consoles, kitchen cabinetry, custom storage."
        value={carpentry}
        onSelect={setCarpentry}
        options={[
          { value: "Low", title: "Mostly ready-made", desc: "Free-standing furniture, IKEA-style storage." },
          { value: "Medium", title: "Mix of ready-made and custom", desc: "Custom where it matters, ready-made elsewhere." },
          { value: "High", title: "Mostly custom built-ins", desc: "Full custom carpentry throughout." },
        ]}
      />
      <BoosterGroup
        label="Finish level?"
        help="Material quality across tiles, countertops, fixtures, fittings."
        value={finish}
        onSelect={setFinish}
        options={[
          { value: "Budget", title: "Keeping costs down", desc: "Stock materials, entry-level brands, function over finish." },
          { value: "Quality", title: "Quality that lasts", desc: "Mid-range materials, reliable brands, balanced choices." },
          { value: "Premium", title: "Premium throughout", desc: "High-end materials, designer brands, premium finishes." },
        ]}
      />

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: C.black,
          color: C.white,
          padding: "16px 20px",
          borderRadius: 8,
          marginTop: 20,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Your estimated range</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, letterSpacing: "-0.5px" }}>{rangeText}</div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{answered} of 3 answered · {labels[computed.confidence]}</div>
      </div>

      <BtnRow>
        <BtnSecondary onClick={onBack}>Back</BtnSecondary>
        <BtnPrimary onClick={onContinue}>Continue</BtnPrimary>
      </BtnRow>
    </div>
  );
}

function BoosterGroup<T extends string>({
  label, help, value, onSelect, options,
}: {
  label: string; help: string;
  value: T | null;
  onSelect: (v: T) => void;
  options: { value: T; title: string; desc: string }[];
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={qLabelStyle}>{label}</div>
      <div style={qHelpStyle}>{help}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o) => (
          <OptionCard key={o.value} selected={value === o.value} onClick={() => onSelect(o.value)} title={o.title} desc={o.desc} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 4 — SOURCING
// ═══════════════════════════════════════════════════════════
function Screen4({ sourcing, setSourcing, onBack, onContinue }: any) {
  return (
    <div>
      <H2>One last question</H2>
      <p style={sub2Style}>This helps us route you to the right firms — and makes sure we don't match you too early.</p>

      <div style={{ marginBottom: 24 }}>
        <div style={qLabelStyle}>Have you started meeting firms yet?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <OptionCard selected={sourcing === "none"} onClick={() => setSourcing("none")} title="Not yet" desc="Still gathering ideas before reaching out to anyone." />
          <OptionCard selected={sourcing === "1-2"} onClick={() => setSourcing("1-2")} title="Met 1–2 firms" desc="Starting to get a sense of what's out there." />
          <OptionCard selected={sourcing === "3+"} onClick={() => setSourcing("3+")} title="Met 3+ firms" desc="Deep in it — quotes don't match, hard to decide." />
        </div>
      </div>

      <BtnRow>
        <BtnSecondary onClick={onBack}>Back</BtnSecondary>
        <BtnPrimary onClick={onContinue} disabled={!sourcing}>See my cost range</BtnPrimary>
      </BtnRow>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 5 — RESULT + LEAD CAPTURE
// ═══════════════════════════════════════════════════════════
function Screen5({
  computed, intent,
  mathOpen, setMathOpen,
  leadName, setLeadName,
  leadPhone, setLeadPhone,
  leadEmail, setLeadEmail,
  onBack, onSubmit,
}: any) {
  const isRebuild = computed.isLanded && computed.workType === "rebuild";
  const useOpenEnded = intent === "special" || isRebuild;
  const rangeText = useOpenEnded ? `$${computed.min.toLocaleString()}+` : `$${computed.min.toLocaleString()} – $${computed.max.toLocaleString()}`;

  const pillLabels: Record<string, { text: string; bg: string; color: string }> = {
    high: { text: "High confidence", bg: "rgba(90, 148, 96, 0.2)", color: "#8eb895" },
    medium: { text: "Medium confidence", bg: "rgba(210, 165, 60, 0.18)", color: "#d2a53c" },
    "medium-low": { text: "Medium-low confidence", bg: "rgba(210, 165, 60, 0.18)", color: "#d2a53c" },
    low: { text: "Range only", bg: "rgba(180, 120, 100, 0.18)", color: "#c8907a" },
  };
  const pill = pillLabels[computed.confidence];

  const landedConfCopy: Record<string, string> = {
    aa: "Range based on BCA/URA industry PSF data for A&A works in 2025–2026. The concierge call extracts site conditions, QP requirements, and scope specifics that tighten this further.",
    reconstruction: "Range based on BCA/URA industry PSF data for reconstruction works in 2025–2026, applied to your full built-up area. Soft costs cover QP, PE, URA, and BCA submissions.",
    rebuild: "Range based on BCA/URA industry PSF data for new erection in 2025–2026. No hard ceiling — premium rebuilds with luxury finishes can exceed $1,000 PSF. Soft costs cover QP, PE, URA, BCA submissions, and contingency.",
  };
  const confDesc: Record<string, string> = {
    high: "Based on all three scope indicators you answered. This is a narrow, defensible range.",
    medium: "Based on two of three scope indicators. The band reflects what we don't yet know.",
    "medium-low": "Only one scope indicator answered. The band accounts for remaining variables.",
    low: "Intent-level estimate only. Your concierge call will tighten this significantly.",
  };
  const confidenceText = computed.isLanded
    ? (landedConfCopy[computed.workType || "aa"] || "Landed renovations have high variability.")
    : `${confDesc[computed.confidence]} Your actual cost depends on specific material choices and site conditions, which we'll walk through on the call.${intent === "special" ? " No hard ceiling at this tier — scope at this level depends on design direction and material choices." : ""}`;

  return (
    <div>
      {/* Cost range hero */}
      <div
        style={{
          padding: "36px 28px",
          background: C.black,
          color: C.white,
          borderRadius: 10,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 14 }}>Your estimated range</div>
        <div style={{ fontFamily: serif, fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 500, lineHeight: 1, letterSpacing: "-1.5px", marginBottom: 14 }}>{rangeText}</div>
        <div
          style={{
            display: "inline-block",
            padding: "3px 10px",
            background: pill.bg,
            color: pill.color,
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {pill.text}
        </div>
        <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>{confidenceText}</div>
      </div>

      {/* Math toggle */}
      <button
        type="button"
        onClick={() => setMathOpen(!mathOpen)}
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: mathOpen ? 0 : 20,
          width: "100%",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: C.black,
          fontFamily: sans,
          fontWeight: 600,
        }}
      >
        <span>Show me how we got this number</span>
        <ChevronDown
          size={18}
          style={{
            color: C.grayLight,
            transform: mathOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms",
          }}
        />
      </button>
      {mathOpen && (
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.creamBorder}`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            padding: "20px 24px",
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <MathBreakdown computed={computed} intent={intent} />
        </div>
      )}

      {/* Firm type */}
      {computed.firmType && (
        <div
          style={{
            background: "#faf8f2",
            border: `1px solid ${C.creamBorder}`,
            borderRadius: 8,
            padding: "22px 24px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grayLight, marginBottom: 8 }}>Recommended renovator type for your scope</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.black, marginBottom: 8, lineHeight: 1.25 }}>{computed.firmType.type}</div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7 }}>{computed.firmType.desc}</div>
        </div>
      )}

      {/* Why Network */}
      <div style={{ background: "#faf8f2", border: `1px solid ${C.creamBorder}`, borderRadius: 8, padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grayLight, marginBottom: 14 }}>Why homeowners use Network</div>
        {["Brief once. Not six times.", "Three firms, not thirty to sort through.", "Aligned to your scope before first consultation.", "48 hours from brief to match."].map((line, i, arr) => (
          <div
            key={i}
            style={{
              fontFamily: serif,
              fontSize: 16,
              color: C.black,
              lineHeight: 1.5,
              padding: "6px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #f0ede6" : "none",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Next steps */}
      <div style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 8, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grayLight, marginBottom: 14 }}>Here's what happens next</div>
        {[
          "Your PDF cost breakdown lands in your inbox within the hour.",
          "A Network concierge WhatsApps you within 24 hours to walk through your scope.",
          "Three firms built for your scope, briefed and introduced within 48 hours.",
        ].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "9px 0", fontSize: 13, lineHeight: 1.55 }}>
            <span
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                background: "#5a9460",
                color: C.white,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                marginTop: 1,
              }}
            >
              <Check size={11} strokeWidth={3} />
            </span>
            <span style={{ color: "#333" }}>{t}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0ede6", fontSize: 12, color: C.grayLight, fontStyle: "italic", textAlign: "center" }}>
          No spam. One concierge message. Three matched firms.
        </div>
      </div>

      <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.5px", color: C.black, marginBottom: 10 }}>
        The real conversation starts with <Em>three firms built for your scope.</Em>
      </h2>
      <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.6, marginBottom: 22 }}>
        The range above is the starting point. The concierge call is where we extract specific scope, match you with aligned firms, and give you clarity on what your actual budget should be.
      </p>

      <LeadInput label="Full name" value={leadName} onChange={setLeadName} placeholder="Your name" />
      <LeadInput label="WhatsApp number" type="tel" value={leadPhone} onChange={setLeadPhone} placeholder="+65 xxxx xxxx" />
      <LeadInput label="Email" type="email" value={leadEmail} onChange={setLeadEmail} placeholder="you@example.com" />

      <BtnRow>
        <BtnSecondary onClick={onBack}>Back</BtnSecondary>
        <BtnPrimary onClick={onSubmit}>Submit and get matched</BtnPrimary>
      </BtnRow>

      {/* Trust bar */}
      <div style={{ marginTop: 18, padding: "16px 18px", background: "#faf8f2", border: `1px solid ${C.creamBorder}`, borderRadius: 8, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 10 }}>
          <TrustBadge icon={<Lock size={14} style={{ color: "#5a9460" }} />} text="MAS-regulated escrow" />
          <TrustBadge icon={<ShieldCheck size={14} style={{ color: "#5a9460" }} />} text="Insured renovators only" />
          <TrustBadge icon={<Star size={14} style={{ color: "#5a9460" }} />} text="180+ verified" />
        </div>
        <div style={{ fontSize: 11, color: C.grayLight, lineHeight: 1.5, fontStyle: "italic" }}>
          We're partnered with Handshake, a MAS-regulated escrow, to protect your renovation funds.
        </div>
      </div>
    </div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#333", letterSpacing: "0.02em" }}>
      {icon}
      <span>{text}</span>
    </div>
  );
}

function LeadInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.black, marginBottom: 6, display: "block" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputFieldStyle}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SCREEN 6 — CONFIRMATION
// ═══════════════════════════════════════════════════════════
function Screen6() {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div
        style={{
          width: 48,
          height: 48,
          background: "#5a9460",
          borderRadius: "50%",
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.white,
        }}
      >
        <Check size={24} strokeWidth={3} />
      </div>
      <Hero>
        Thanks. <Em>We'll be in touch.</Em>
      </Hero>
      <p style={{ ...subHeroStyle, margin: "0 auto 20px" }}>
        Check your email for the full PDF breakdown. A Network concierge will WhatsApp you within 24 hours to walk through your scope and match you with the right firms.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MATH BREAKDOWN
// ═══════════════════════════════════════════════════════════
function MathBreakdown({ computed, intent }: { computed: ComputedState; intent: Intent | null }) {
  if (computed.isLanded) {
    const start = computed.breakdown.find((b) => b.section === "Starting point");
    const cost = computed.breakdown.find((b) => b.section === "Construction cost");
    const soft = computed.breakdown.find((b) => b.section === "Soft costs");
    const isRebuild = computed.workType === "rebuild";
    return (
      <div>
        {start && (
          <>
            <SectionLabel>Starting point</SectionLabel>
            <MathRow label={start.label} sub={start.sub} value={start.displayOverride || start.value.toLocaleString()} />
          </>
        )}
        {cost && (
          <>
            <SectionLabel>Construction cost</SectionLabel>
            <MathRow
              label={cost.label}
              sub={cost.sub}
              value={`$${Math.round(cost.value).toLocaleString()} – $${Math.round(cost.valueMax!).toLocaleString()}`}
            />
          </>
        )}
        {soft && (
          <>
            <SectionLabel>Soft costs</SectionLabel>
            <MathRow
              label={soft.label}
              sub={soft.sub}
              value={`$${soft.value.toLocaleString()} – $${soft.valueMax!.toLocaleString()}`}
            />
          </>
        )}
        <MathRow
          total
          label="Total estimated range"
          sub="Construction + soft costs combined"
          value={isRebuild ? `$${computed.min.toLocaleString()}+` : `$${computed.min.toLocaleString()} – $${computed.max.toLocaleString()}`}
        />
        <div style={{ fontSize: 12, color: C.grayLight, lineHeight: 1.6, paddingTop: 14, marginTop: 14, borderTop: "1px solid #f0ede6", fontStyle: "italic" }}>
          PSF ranges based on 2025–2026 Singapore industry data for landed works. Soft costs include QP fees, PE endorsement, URA planning submissions, BCA building plan submissions, drainage compliance, and contingency buffer. Your concierge call extracts site-specific conditions that tighten this range.
        </div>
      </div>
    );
  }

  const start = computed.breakdown.filter((b) => b.section === "Starting point");
  const adjs = computed.breakdown.filter((b) => b.section === "Adjustments");
  return (
    <div>
      {start.length > 0 && <SectionLabel>Starting point</SectionLabel>}
      {start.map((item, i) => (
        <MathRow key={i} label={item.label} sub={item.sub} value={`$${Math.round(item.value).toLocaleString()}`} />
      ))}
      {adjs.length > 0 && <SectionLabel>Adjustments</SectionLabel>}
      {adjs.map((item, i) => {
        const sign = item.kind === "add" ? "+" : item.kind === "sub" ? "−" : "";
        const val = Math.abs(Math.round(item.value));
        const color = item.kind === "add" ? "#5a9460" : item.kind === "sub" ? "#c26a5a" : C.black;
        return <MathRow key={i} label={item.label} sub={item.sub} value={`${sign}$${val.toLocaleString()}`} valueColor={color} />;
      })}
      <MathRow total label="Mid-point of your range" value={`$${Math.round(computed.adjustedAnchor).toLocaleString()}`} />
      <MathRow
        label={intent === "special" ? "Starting floor" : `Confidence band (±${computed.bandPct}%)`}
        sub={intent === "special" ? "No hard ceiling — scope at this tier depends on design direction and material choices" : "Accounts for specific material choices and site conditions"}
        value={intent === "special" ? `$${computed.min.toLocaleString()}+` : `$${computed.min.toLocaleString()} – $${computed.max.toLocaleString()}`}
      />
      <div style={{ fontSize: 12, color: C.grayLight, lineHeight: 1.6, paddingTop: 14, marginTop: 14, borderTop: "1px solid #f0ede6", fontStyle: "italic" }}>
        Anchor values are based on 2025–2026 market data from transparency-positioned Singapore ID firms. Your actual quote will vary based on firm, material specifications, and project conditions extracted during the concierge call.
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: C.grayLight,
        margin: "18px 0 8px",
        paddingTop: 12,
        borderTop: "1px solid #f0ede6",
      }}
    >
      {children}
    </div>
  );
}

function MathRow({ label, sub, value, total, valueColor }: { label: string; sub?: string; value: string; total?: boolean; valueColor?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: total ? "14px 0 0" : "10px 0",
        borderBottom: total ? "none" : "1px solid #f0ede6",
        borderTop: total ? `2px solid ${C.black}` : "none",
        marginTop: total ? 8 : 0,
        fontWeight: total ? 700 : 400,
      }}
    >
      <div style={{ color: C.gray, flex: 1 }}>
        {label}
        {sub && <span style={{ fontSize: 11, color: C.grayLight, display: "block", marginTop: 2 }}>{sub}</span>}
      </div>
      <div style={{ fontWeight: 600, color: valueColor || C.black, textAlign: "right" }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LABELS + ROUTING HELPERS
// ═══════════════════════════════════════════════════════════
function anchorLabel(property: Property, newResale: NewResale, unitType: string, ocs: OCS | null, ocsFlooring: boolean, ocsDoors: boolean) {
  if (property === "HDB") {
    if (newResale === "new") {
      if (ocs === "yes" && (ocsFlooring || ocsDoors)) return `${unitType} HDB BTO with OCS`;
      return `${unitType} HDB BTO (no OCS)`;
    }
    return `${unitType} HDB Resale`;
  }
  if (property === "Condo") return `${unitType} Condo ${newResale === "new" ? "New Launch" : "Resale"}`;
  if (property === "EC") return `${unitType} EC ${newResale === "new" ? "New" : "Resale"}`;
  return `Landed, ${unitType} sqft BUA`;
}

function intentLabelFor(intent: Intent) {
  return {
    basics: "Move-in ready basics — market median",
    proper: "Proper home renovation — market median",
    special: "Something special — market median",
  }[intent];
}

function landedWorkLabel(wt: string) {
  return ({ aa: "A&A (Additions & Alterations)", reconstruction: "Reconstruction", rebuild: "Rebuild (New Erection)" } as Record<string, string>)[wt] || wt;
}

function routeFirmType({ intent, property, layout, carpentry, finish }: { intent: Intent | null; property: Property | null; layout: Layout | null; carpentry: Carpentry | null; finish: Finish | null }) {
  if (!intent) return null;
  const hasHighCarp = carpentry === "High";
  const hasMajorLayout = layout === "Major";
  const hasPremiumFinish = finish === "Premium";
  const hasLowCarp = carpentry === "Low";
  const noLayout = layout === "No";

  if (intent === "special" && (hasHighCarp || hasMajorLayout || hasPremiumFinish)) {
    return {
      type: "Design Consultant",
      desc: "Design-centric firm. Fewer projects, personally involved from concept to completion. Right fit when design expertise justifies the investment, especially when custom carpentry, layout changes, or premium materials are in play.",
    };
  }
  if (intent === "basics" && (hasLowCarp || carpentry === null) && (noLayout || layout === null) && !hasPremiumFinish) {
    return {
      type: "Direct Contractor",
      desc: "Execution-focused firm. Reliable delivery without paying for a design journey you don't need. Best when you have a clear scope and just need the works done well.",
    };
  }
  let dnbDesc = "Process, design input, and execution under one roof. One point of contact, clear pricing, balanced value. The default fit for most Network homeowners.";
  if (intent === "basics") {
    dnbDesc = "Design & build firm, leaning toward the execution end. You want some design input and custom carpentry, but the priority is efficient delivery. Right fit for practical homeowners who want structure without a full design journey.";
  } else if (intent === "special" && !hasHighCarp && !hasMajorLayout && !hasPremiumFinish) {
    dnbDesc = "Design & build firm with strong portfolio work. You want something special without going full design consultant territory — a firm that brings design thinking while keeping the process streamlined.";
  } else if (intent === "proper") {
    dnbDesc = "Process, design input, and execution under one roof. One point of contact, clear pricing, balanced value. The default fit for homeowners doing a proper renovation without needing a dedicated design consultant.";
  }
  return { type: "Design & Build Firm", desc: dnbDesc };
}

function routeLandedFirmType(workType: string, scopePct: LandedScope | null) {
  if (workType === "aa" && scopePct === "under30") {
    return { type: "Design & Build Firm", desc: "Landed A&A at this scope is workable with a strong design & build firm. One point of contact, clear pricing, managed execution. Right fit when the works are focused and well-scoped." };
  }
  if (workType === "aa") {
    return { type: "Design Consultant", desc: "Substantial A&A at this scope typically needs design-led firms. Fewer projects, deep involvement from concept through BCA submission, and coordination with QP and PE for structural works." };
  }
  if (workType === "reconstruction") {
    return { type: "Design Consultant", desc: "Reconstruction requires design-led coordination — URA Envelope Control compliance, new Household Shelter, and full structural PE endorsement. A design consultant with landed experience manages this end to end." };
  }
  return { type: "Design Consultant", desc: "Full rebuild means fresh URA planning permission, complete architectural and structural submissions, and design freedom at the highest level. A design consultant or specialised landed builder leads this from concept to completion." };
}

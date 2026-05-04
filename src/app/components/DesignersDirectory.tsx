import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Search, Star, MapPin, ChevronDown, ArrowRight, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { HomepageNav } from "./shared/HomepageNav";
import { HomepageFooter } from "./shared/HomepageFooter";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

// Hero image: a warm-toned interior from a real Qanvast-imported project
// (Divine & Glitz / Aalto). Served through Supabase's native image transform
// so the browser gets a right-sized WebP via the Accept header.
const heroPhoto =
  "https://hycxkpassywjvdqduzrx.supabase.co/storage/v1/render/image/public/make-4808de5e-designers/imported/1c453438-da3c-46ad-a26e-888d43a17880.jpeg?width=1600&quality=80";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReactLenis } from "lenis/react";
import { C, serif, sans, FadeIn, TagLabel } from "./homepage/v8/primitives";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { resolveAsset } from "../utils/resolveAsset";
import { Seo } from "./shared/Seo";
import { collapseBudgetRange } from "./DesignerProfile";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/* ─── TYPES ─── */
interface DesignerCard {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  logo: string;
  rating: number;
  reviews: number;
  projects: number;
  location: string;
  propertyTypes: string[];
  styles: string[];
  budget: string;
  verified: boolean;
  yearsActive: number;
  accreditations: string[];
}

/* ─── MAP API DATA → CARD ─── */
function mapDesigner(d: any): DesignerCard {
  const stats = d.stats || {};
  const images = d.images || {};
  const bInfo: { label: string; value: string }[] = d.businessInfo || [];
  const coverProject = d.coverProject || {};
  const btoPackage = d.btoPackage || {};

  // Styles: prefer designStyles array, then businessInfo, then legacy
  let styles: string[] = d.designStyles || [];
  if (!styles.length) {
    const styleEntry = bInfo.find((b: any) => b.label === "Style specialisation");
    if (styleEntry?.value) styles = styleEntry.value.split(/\s*\u00b7\s*/).filter(Boolean);
  }
  if (!styles.length) {
    if (coverProject.style) styles.push(coverProject.style);
    if (btoPackage.tags?.length) btoPackage.tags.forEach((t: string) => { if (!styles.includes(t)) styles.push(t); });
  }

  // Property types from businessInfo, then legacy text matching
  let propertyTypes: string[] = [];
  const ptEntry = bInfo.find((b: any) => b.label === "Project types");
  if (ptEntry?.value) {
    const raw = ptEntry.value.split(/\s*\u00b7\s*/).filter(Boolean);
    propertyTypes = raw.map((t: string) => {
      if (/hdb/i.test(t)) return "HDB";
      if (/executive\s*condo/i.test(t) || /\bec\b/i.test(t)) return "EC";
      if (/condo/i.test(t)) return "Condo";
      if (/landed/i.test(t)) return "Landed";
      if (/commercial/i.test(t)) return "Commercial";
      return t;
    });
    propertyTypes = [...new Set(propertyTypes)];
  }
  if (!propertyTypes.length) {
    const allText = `${btoPackage.title || ""} ${(btoPackage.tags || []).join(" ")} ${d.bio || ""}`.toLowerCase();
    if (allText.includes("hdb") || allText.includes("bto")) propertyTypes.push("HDB");
    if (allText.includes("condo")) propertyTypes.push("Condo");
    if (allText.includes("landed")) propertyTypes.push("Landed");
  }

  // Budget from businessInfo, then btoPackage. Collapse multi-segment ranges
  // ("$30K–$50K — Essential, $50K–$80K — Full") to a single floor-to-ceiling
  // range ("$30K – $80K") with no descriptions, matching the public profile.
  const budgetEntry = bInfo.find((b: any) => b.label?.toLowerCase().includes("budget"));
  const budgetRaw = budgetEntry?.value || (btoPackage.startingPrice ? `From ${btoPackage.startingPrice}` : "");
  const budget = collapseBudgetRange(budgetRaw);

  // Prefer the firm's own office address over the service-area region list
  // (which on the directory card just looks like "West, East, North, ...").
  const addressEntry = bInfo.find((b: any) => /office\s*address/i.test(b.label || ""));
  const location = String(addressEntry?.value || d.officeAddress || d.location || "").trim();

  // Accreditations from credentials block + businessInfo "Licenses" row.
  const credentials = d.credentials || {};
  const accreditations: string[] = [];
  if (credentials.hdb?.active) accreditations.push("HDB Licensed");
  if (credentials.bca?.active) accreditations.push("BCA Registered");
  if (credentials.landedEligible) accreditations.push("Landed Eligible");
  const licensesEntry = bInfo.find((b: any) => /licens/i.test(b.label || ""));
  if (licensesEntry?.value) {
    // Normalise license tokens so "HDB License" / "BCA" don't double up with
    // the structured credentials block above. First-word match against
    // existing tags is enough to suppress the common duplicates.
    for (const piece of String(licensesEntry.value).split(/[,·]/).map((s) => s.trim()).filter(Boolean)) {
      const head = piece.split(/\s+/)[0]?.toLowerCase();
      const dupe = accreditations.some((a) => {
        const aHead = a.split(/\s+/)[0]?.toLowerCase();
        return a.toLowerCase() === piece.toLowerCase() || (head && aHead && head === aHead);
      });
      if (!dupe) accreditations.push(piece);
    }
  }

  const currentYear = new Date().getFullYear();
  const yearsActive = d.foundedYear ? currentYear - d.foundedYear : parseInt(stats.years) || 0;

  return {
    id: d.slug || "",
    slug: d.slug || "",
    name: d.name || "Untitled Designer",
    tagline: d.tagline || "",
    image: images.cover || "",
    logo: images.logo || "",
    rating: parseFloat(stats.rating) || 0,
    reviews: parseInt(stats.reviewCount) || 0,
    projects: d.totalProjects || 0,
    location,
    propertyTypes,
    styles,
    budget,
    verified: d.verified || false,
    yearsActive,
    accreditations,
  };
}

const PROPERTY_FILTERS = ["All", "HDB", "Condo", "EC", "Landed", "Commercial"];
const STYLE_FILTERS = ["All Styles", "Modern", "Contemporary", "Scandinavian", "Industrial", "Japandi", "Minimalist", "Mid-Century", "Luxury/High-End"];
const BUDGET_FILTERS = ["Any Budget", "Under $30K", "$30K – $60K", "$60K – $120K", "$120K+"];
const SORT_OPTIONS = ["Most Reviewed", "Highest Rated", "Most Projects", "Newest"];
// Multi-select license options. Filter tests against d.accreditations[] using
// a substring/regex match so different stored phrasings ("BCA Registered" vs
// "BCA Licensed") still match the same option.
const LICENSE_FILTERS: { label: string; match: RegExp }[] = [
  { label: "HDB Licensed", match: /\bhdb\b/i },
  { label: "BCA Licensed", match: /\bbca\b/i },
  { label: "Landed Eligible", match: /landed/i },
  { label: "CaseTrust", match: /case\s*trust/i },
  { label: "ISO", match: /\biso\b/i },
  { label: "BizSafe", match: /biz\s*safe/i },
];

/* ─── PLACEHOLDER LOGO ─── */
const PLACEHOLDER_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e8e4db' width='80' height='80' rx='40'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' font-family='DM Sans,sans-serif' font-size='28' font-weight='500' fill='%239a9790'%3E%3F%3C/text%3E%3C/svg%3E`;

/* ─── FILTER DROPDOWN ─── */
function FilterDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-[100px] px-5 py-[10px] text-[14px] transition-all"
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          fontFamily: sans,
          color: value === options[0] ? C.grayLight : C.black,
          fontWeight: value === options[0] ? 400 : 500,
        }}
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: C.grayLight }} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-40 rounded-[14px] py-2 min-w-[180px]"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-[10px] text-[14px] transition-colors"
                  style={{
                    fontFamily: sans,
                    color: value === opt ? C.black : C.gray,
                    fontWeight: value === opt ? 500 : 400,
                    background: value === opt ? C.cream : "transparent",
                  }}
                  onMouseEnter={(e) => { if (value !== opt) (e.target as HTMLElement).style.background = C.cream; }}
                  onMouseLeave={(e) => { if (value !== opt) (e.target as HTMLElement).style.background = "transparent"; }}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MULTI-SELECT CHECKBOX DROPDOWN ─── */
function MultiCheckboxDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (opt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonLabel = selected.size === 0 ? label : `${label} (${selected.size})`;
  const isActive = selected.size > 0;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-[100px] px-5 py-[10px] text-[14px] transition-all"
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          fontFamily: sans,
          color: isActive ? C.black : C.grayLight,
          fontWeight: isActive ? 500 : 400,
        }}
      >
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: C.grayLight }} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 z-40 rounded-[14px] py-2 min-w-[200px]"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              }}
            >
              {options.map((opt) => {
                const checked = selected.has(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => onToggle(opt)}
                    className="w-full text-left px-4 py-[10px] text-[14px] transition-colors flex items-center gap-3"
                    style={{
                      fontFamily: sans,
                      color: C.black,
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.cream; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center shrink-0 rounded-[4px]"
                      style={{
                        width: 16,
                        height: 16,
                        background: checked ? C.black : C.white,
                        border: `1px solid ${checked ? C.black : C.creamBorder}`,
                      }}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.5L4.5 9L10 3" stroke={C.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DESIGNER CARD ─── */
function DesignerCardComponent({ designer, index }: { designer: DesignerCard; index: number }) {
  const navigate = useNavigate();
  const logoSrc = designer.logo ? resolveAsset(designer.logo) : PLACEHOLDER_LOGO;
  const initial = designer.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <FadeIn delay={index * 0.04}>
      <div
        onClick={() => navigate(`/designer/${designer.slug}`)}
        className="group cursor-pointer rounded-[16px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Cover image */}
        <div className="relative h-[220px] overflow-hidden">
          <ImageWithFallback
            src={resolveAsset(designer.image)}
            alt={designer.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Verified badge */}
          {designer.verified && (
            <div
              className="absolute top-3 left-3 rounded-[100px] px-3 py-[5px] flex items-center gap-1.5"
              style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 0L8.57 2.52L11.55 1.91L11.09 4.91L13.67 6.36L11.45 8.22L12.33 11.11L9.48 10.16L7.5 12.68L6.22 10L3.33 10.68L3.89 7.69L1.33 6L3.71 4.36L3.12 1.36L5.99 2.27L7 0Z" fill={C.black}/>
              </svg>
              <span className="text-[11px] font-semibold" style={{ fontFamily: sans, color: C.black }}>Verified</span>
            </div>
          )}

          {/* Project count pill */}
          {designer.projects > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-[100px] px-3 py-[5px]">
              <span className="text-[12px] font-medium" style={{ fontFamily: sans, color: C.black }}>
                {designer.projects} projects
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 pb-6">
          {/* Logo + Name + Rating row */}
          <div className="flex items-start gap-3 mb-2">
            <img
              src={logoSrc}
              alt=""
              className="size-[36px] rounded-full object-cover shrink-0"
              style={{ border: `1px solid ${C.creamBorder}` }}
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_LOGO; }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="text-[20px] font-normal leading-[1.2] line-clamp-1"
                  style={{ fontFamily: serif, color: C.black }}
                >
                  {designer.name}
                </h3>
                {designer.rating > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-[14px] h-[14px] fill-[#FFA929] text-[#FFA929]" />
                    <span className="font-medium text-[14px]" style={{ fontFamily: sans, color: C.black }}>{designer.rating}</span>
                    {designer.reviews > 0 && (
                      <span className="text-[12px]" style={{ fontFamily: sans, color: C.grayLight }}>({designer.reviews})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tagline */}
          {designer.tagline && (
            <p
              className="text-[14px] leading-[1.5] mb-4 line-clamp-2"
              style={{ fontFamily: sans, color: C.gray }}
            >
              {designer.tagline}
            </p>
          )}

          {/* Location */}
          {designer.location && (
            <div className="flex items-center gap-1.5 mb-4 min-w-0">
              <MapPin className="w-[14px] h-[14px] shrink-0" style={{ color: C.grayLight }} />
              <span
                className="text-[13px] truncate min-w-0"
                style={{ fontFamily: sans, color: C.gray }}
                title={designer.location}
              >{designer.location}</span>
              {designer.yearsActive > 0 && (
                <span className="text-[13px] ml-1 shrink-0" style={{ fontFamily: sans, color: C.grayLight }}>{designer.yearsActive} yrs</span>
              )}
            </div>
          )}

          {/* Accreditations row — show 2 inline, hide the rest behind a +N pill (hover for full list). */}
          {designer.accreditations.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mb-5">
              {designer.accreditations.slice(0, 2).map((a) => (
                <span
                  key={a}
                  className="rounded-[100px] px-3 py-[5px] text-[12px] font-medium inline-flex items-center gap-1"
                  style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, fontFamily: sans, color: C.black }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#22c55e" }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {a}
                </span>
              ))}
              {designer.accreditations.length > 2 && (
                <span
                  className="rounded-[100px] px-3 py-[5px] text-[12px] font-medium cursor-help"
                  style={{ background: C.white, border: `1px solid ${C.creamBorder}`, fontFamily: sans, color: C.gray }}
                  title={designer.accreditations.slice(2).join(" · ")}
                >
                  +{designer.accreditations.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Budget + CTA row */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
            <div>
              {designer.budget && (
                <>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ fontFamily: sans, color: C.grayLight }}
                  >
                    Budget range
                  </span>
                  <p className="text-[14px] font-medium" style={{ fontFamily: sans, color: C.black }}>{designer.budget}</p>
                </>
              )}
            </div>
            <button
              className="flex items-center gap-1.5 px-5 py-[9px] text-[13px] font-medium rounded-[12px] transition-all hover:opacity-85 active:scale-[0.98]"
              style={{ background: C.black, color: C.white, fontFamily: sans }}
            >
              View Profile
              <ArrowRight className="w-[14px] h-[14px]" />
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ─── MAIN PAGE ─── */
export function DesignersDirectory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [styleFilter, setStyleFilter] = useState("All Styles");
  const [budgetFilter, setBudgetFilter] = useState("Any Budget");
  const [licenseFilter, setLicenseFilter] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("Most Reviewed");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [designers, setDesigners] = useState<DesignerCard[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleLicense = (opt: string) => setLicenseFilter((prev) => {
    const next = new Set(prev);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    return next;
  });

  const activeFilterCount = [propertyFilter !== "All", styleFilter !== "All Styles", budgetFilter !== "Any Budget", licenseFilter.size > 0].filter(Boolean).length;

  const filteredDesigners = useMemo(() => {
    let result = [...designers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tagline.toLowerCase().includes(q) ||
          d.styles.some((s) => s.toLowerCase().includes(q)) ||
          d.location.toLowerCase().includes(q)
      );
    }

    if (propertyFilter !== "All") {
      result = result.filter((d) => d.propertyTypes.includes(propertyFilter));
    }

    if (styleFilter !== "All Styles") {
      result = result.filter((d) => d.styles.some((s) => s.toLowerCase().includes(styleFilter.toLowerCase())));
    }

    if (budgetFilter !== "Any Budget") {
      result = result.filter((d) => {
        const min = parseInt(d.budget.replace(/[^0-9]/g, ""));
        if (isNaN(min)) return true;
        if (budgetFilter === "Under $30K") return min < 30;
        if (budgetFilter === "$30K – $60K") return min >= 30 && min <= 60;
        if (budgetFilter === "$60K – $120K") return min >= 60 && min <= 120;
        if (budgetFilter === "$120K+") return min >= 120;
        return true;
      });
    }

    // Multi-license filter — designer must hold ALL selected licenses.
    if (licenseFilter.size > 0) {
      const selectedMatchers = LICENSE_FILTERS.filter((l) => licenseFilter.has(l.label));
      result = result.filter((d) =>
        selectedMatchers.every((l) => d.accreditations.some((a) => l.match.test(a))),
      );
    }

    if (sortBy === "Most Reviewed") result.sort((a, b) => b.reviews - a.reviews);
    if (sortBy === "Highest Rated") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "Most Projects") result.sort((a, b) => b.projects - a.projects);
    if (sortBy === "Newest") result.sort((a, b) => a.yearsActive - b.yearsActive);

    return result;
  }, [search, propertyFilter, styleFilter, budgetFilter, licenseFilter, sortBy, designers]);

  const clearAllFilters = () => {
    setSearch("");
    setPropertyFilter("All");
    setStyleFilter("All Styles");
    setBudgetFilter("Any Budget");
    setLicenseFilter(new Set());
    setSortBy("Most Reviewed");
  };

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await fetch(`${API}/designers?limit=100`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        const designersList = json.data || [];
        setDesigners(designersList.filter((d: any) => d.active !== false).map(mapDesigner));
      } catch (error) {
        console.error("Error fetching designers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDesigners();
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <Seo
        title="Verified Interior Designers in Singapore | Network"
        description="Browse 120+ verified interior design firms in Singapore. Filter by style, budget, and property type — and request a match through Network."
        canonical="/designers"
      />
      <div className="min-h-screen relative overflow-x-clip" style={{ background: C.cream }}>
        <HomepageNav />

        {/* ─── HERO PHOTO BAND ─── */}
        <section className="pt-8 md:pt-12 px-6 md:px-10">
          <div className="max-w-[1280px] mx-auto">
            <FadeIn>
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 24, height: "clamp(360px, 48vw, 480px)" }}
              >
                <img
                  src={heroPhoto}
                  alt="Interior design inspiration"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/35" />
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6 md:px-10">
                  <p
                    className="mb-4"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: sans,
                    }}
                  >
                    Interior Designers
                  </p>
                  <h1
                    className="font-normal leading-[1.1] mb-1"
                    style={{ fontFamily: serif, color: C.white, fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.02em" }}
                  >
                    Find Your Designer
                  </h1>
                  <p
                    className="font-normal leading-[1.1] mb-5 md:mb-6"
                    style={{ fontFamily: serif, color: "rgba(255,255,255,0.85)", fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.02em" }}
                  >
                    Browse & Compare
                  </p>
                  <p
                    className="text-[14px] md:text-[16px] max-w-[560px] leading-[1.6]"
                    style={{ fontFamily: sans, color: "rgba(255,255,255,0.88)" }}
                  >
                    Explore our curated directory of verified interior designers. Filter by style, budget, and property type to find your perfect match.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Floating search card overlapping the photo's bottom edge */}
            <FadeIn delay={0.1}>
              <div
                className="relative z-10 mx-auto"
                style={{ marginTop: -32, maxWidth: 720 }}
              >
                <div
                  className="relative"
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 100,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
                  }}
                >
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: C.grayLight }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, style, or location..."
                    className="w-full h-[60px] rounded-[100px] pl-14 pr-12 text-[15px] focus:outline-none bg-transparent"
                    style={{
                      fontFamily: sans,
                      color: C.black,
                    }}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer">
                      <X className="w-4 h-4 transition-colors" style={{ color: C.grayLight }} />
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ─── FILTERS + GRID ─── */}
        <section className="px-6 md:px-10 pt-10 md:pt-14 pb-20 md:pb-28">
          <div className="max-w-[1280px] mx-auto">
            {/* Filter bar — Desktop */}
            <FadeIn delay={0.05}>
              <div className="hidden md:flex items-center justify-between mb-8 flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-[6px] mr-2 flex-wrap">
                    {PROPERTY_FILTERS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setPropertyFilter(f)}
                        className="rounded-[100px] px-5 py-[10px] text-[14px] transition-all cursor-pointer"
                        style={{
                          fontFamily: sans,
                          ...(propertyFilter === f
                            ? { background: C.black, color: C.white, fontWeight: 500 }
                            : { background: C.white, border: `1px solid ${C.creamBorder}`, color: C.black }),
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-8" style={{ background: C.creamBorder }} />

                  <FilterDropdown options={STYLE_FILTERS} value={styleFilter} onChange={setStyleFilter} />
                  <FilterDropdown options={BUDGET_FILTERS} value={budgetFilter} onChange={setBudgetFilter} />
                  <MultiCheckboxDropdown
                    label="License"
                    options={LICENSE_FILTERS.map((l) => l.label)}
                    selected={licenseFilter}
                    onToggle={toggleLicense}
                  />
                </div>

                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[13px] underline transition-colors cursor-pointer"
                      style={{ fontFamily: sans, color: C.grayLight }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = C.black; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = C.grayLight; }}
                    >
                      Clear all
                    </button>
                  )}
                  <FilterDropdown options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
                </div>
              </div>
            </FadeIn>

            {/* Filter bar — Mobile */}
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 rounded-[100px] px-4 py-[10px] shrink-0 cursor-pointer"
                  style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
                >
                  <SlidersHorizontal className="w-4 h-4" style={{ color: C.black }} />
                  <span className="text-[13px] font-medium" style={{ fontFamily: sans, color: C.black }}>Filters</span>
                  {activeFilterCount > 0 && (
                    <span
                      className="rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-semibold"
                      style={{ background: C.black, color: C.white }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {PROPERTY_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setPropertyFilter(f)}
                    className="rounded-[100px] px-4 py-[10px] text-[13px] shrink-0 transition-all cursor-pointer"
                    style={{
                      fontFamily: sans,
                      ...(propertyFilter === f
                        ? { background: C.black, color: C.white, fontWeight: 500 }
                        : { background: C.white, border: `1px solid ${C.creamBorder}`, color: C.black }),
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile filter sheet */}
            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 left-0 right-0 rounded-t-[24px] p-6 max-h-[80vh] overflow-y-auto"
                    style={{ background: C.white }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[22px] font-normal" style={{ fontFamily: serif, color: C.black }}>Filters</h3>
                      <button onClick={() => setShowMobileFilters(false)} className="cursor-pointer">
                        <X className="w-6 h-6" style={{ color: C.black }} />
                      </button>
                    </div>

                    {/* Style */}
                    <div className="mb-6">
                      <label className="text-[14px] font-medium block mb-3" style={{ fontFamily: sans, color: C.black }}>Style</label>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_FILTERS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStyleFilter(s)}
                            className="rounded-[100px] px-4 py-[9px] text-[13px] transition-all cursor-pointer"
                            style={{
                              fontFamily: sans,
                              ...(styleFilter === s
                                ? { background: C.black, color: C.white, fontWeight: 500 }
                                : { background: C.cream, color: C.black }),
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="mb-8">
                      <label className="text-[14px] font-medium block mb-3" style={{ fontFamily: sans, color: C.black }}>Budget</label>
                      <div className="flex flex-wrap gap-2">
                        {BUDGET_FILTERS.map((b) => (
                          <button
                            key={b}
                            onClick={() => setBudgetFilter(b)}
                            className="rounded-[100px] px-4 py-[9px] text-[13px] transition-all cursor-pointer"
                            style={{
                              fontFamily: sans,
                              ...(budgetFilter === b
                                ? { background: C.black, color: C.white, fontWeight: 500 }
                                : { background: C.cream, color: C.black }),
                            }}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="mb-8">
                      <label className="text-[14px] font-medium block mb-3" style={{ fontFamily: sans, color: C.black }}>Sort by</label>
                      <div className="flex flex-wrap gap-2">
                        {SORT_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className="rounded-[100px] px-4 py-[9px] text-[13px] transition-all cursor-pointer"
                            style={{
                              fontFamily: sans,
                              ...(sortBy === s
                                ? { background: C.black, color: C.white, fontWeight: 500 }
                                : { background: C.cream, color: C.black }),
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={clearAllFilters}
                        className="flex-1 h-[48px] rounded-[12px] text-[14px] font-medium cursor-pointer"
                        style={{ border: `1px solid ${C.creamBorder}`, fontFamily: sans, color: C.black, background: "transparent" }}
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 h-[48px] rounded-[12px] text-[14px] font-semibold cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all"
                        style={{ background: C.black, color: C.white, fontFamily: sans }}
                      >
                        Show Results
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <FadeIn>
              <div className="flex items-center justify-between mb-6">
                <p className="text-[14px]" style={{ fontFamily: sans, color: C.gray }}>
                  Showing <span className="font-medium" style={{ color: C.black }}>{filteredDesigners.length}</span> designer{filteredDesigners.length !== 1 ? "s" : ""}
                </p>
              </div>
            </FadeIn>

            {/* ─── GRID ─── */}
            {loading ? (
              <div className="text-center py-20">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-5" style={{ color: C.black }} />
                <h3 className="text-[22px] font-normal mb-2" style={{ fontFamily: serif, color: C.black }}>
                  Loading designers...
                </h3>
              </div>
            ) : filteredDesigners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {filteredDesigners.map((designer, i) => (
                  <DesignerCardComponent key={designer.id} designer={designer} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: C.creamDark }}
                >
                  <Search className="w-6 h-6" style={{ color: C.grayLight }} />
                </div>
                <h3 className="text-[22px] font-normal mb-2" style={{ fontFamily: serif, color: C.black }}>
                  No designers found
                </h3>
                <p className="text-[15px] mb-6 max-w-[360px] mx-auto" style={{ fontFamily: sans, color: C.gray }}>
                  Try adjusting your filters or search terms to see more results.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="text-[14px] font-medium underline cursor-pointer"
                  style={{ fontFamily: sans, color: C.black }}
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* ─── BOTTOM CTA ─── */}
            <FadeIn>
              <div className="mt-16 md:mt-24">
                <div
                  className="px-8 py-16 md:px-16 md:py-20 text-center"
                  style={{ background: C.footerDark, borderRadius: "16px" }}
                >
                  <TagLabel>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>Need help?</span>
                  </TagLabel>
                  <h2
                    className="font-normal leading-[1.15] mt-6 mb-2"
                    style={{ fontFamily: serif, color: "#ffffff", fontSize: "clamp(28px, 3.5vw, 48px)", letterSpacing: "-0.01em" }}
                  >
                    Not sure where to start?
                  </h2>
                  <p
                    className="font-normal leading-[1.15] mb-5 md:mb-6"
                    style={{ fontFamily: serif, color: "rgba(255,255,255,0.5)", fontSize: "clamp(28px, 3.5vw, 48px)", letterSpacing: "-0.01em" }}
                  >
                    Let us match you.
                  </p>
                  <p
                    className="text-[15px] md:text-[17px] font-normal leading-[1.65] max-w-[480px] mx-auto mb-10"
                    style={{ color: "rgba(255,255,255,0.55)", fontFamily: sans }}
                  >
                    Answer a few quick questions and we'll recommend designers tailored to your project, style, and budget.
                  </p>
                  <button
                    onClick={() => navigate("/get-matched")}
                    className="h-[52px] px-9 text-[15px] font-medium cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: "#ffffff", color: C.footerDark, borderRadius: "12px", fontFamily: sans }}
                  >
                    Get Matched Free
                  </button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <HomepageFooter />
      </div>
    </ReactLenis>
  );
}

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Search, Star, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, SlidersHorizontal, X, Calculator, Check } from "lucide-react";
import { HomepageNav } from "./shared/HomepageNav";
import { HomepageFooter } from "./shared/HomepageFooter";
import { HeroMatchForm, type HeroLeadFormData } from "./shared/HeroMatchForm";
import { QualifyingFlow } from "./homepage/v8/sections/HeroSection";
import { COMPLETION } from "./homepage/content";
import { sendToZapier } from "@/app/utils/zapier";
import { recordAttribution } from "@/app/utils/attribution";
import { trackLead } from "@/app/utils/metaPixel";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

// Hero image: a warm-toned interior from a real Qanvast-imported project.
// Picked algorithmically by warmth + low center-window across the active
// designer pool — wood-slatted feature wall with cove lighting, no windows.
// Public storage URL (the /render/image/ endpoint is disabled on this
// Supabase tenant). SmartImage routes the resize through weserv.nl.
const heroPhoto =
  "https://hycxkpassywjvdqduzrx.supabase.co/storage/v1/object/public/make-4808de5e-designers/imported/94ab90d9-21c9-447d-9da2-7f038f55c1bd.jpeg";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { SmartImage } from "./shared/SmartImage";
import { ReactLenis } from "lenis/react";
import { C, serif, sans, FadeIn, TagLabel } from "./homepage/v8/primitives";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { resolveAsset } from "../utils/resolveAsset";
import { thumbnailUrl } from "../utils/image-url";
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
  /** Cover photos for the firm's published projects. Drives the
   *  auto-scrolling carousel at the top of each directory card. Falls
   *  back to `[image]` when the firm has no project gallery yet. */
  projectImages: string[];
  logo: string;
  rating: number;
  reviews: number;
  projects: number;
  location: string;
  propertyTypes: string[];
  styles: string[];
  budget: string;
  /** Longer "why choose us" paragraph from the firm's profile, shown in
   *  the gray description box on the directory card. Falls back to tagline. */
  bio: string;
  /** Each tier is a [minThousands, maxThousands] range. Multi-tier firms
   * (e.g. Essential + Full Renovation packages) get one entry per tier so
   * the budget filter can do precise overlap checks instead of squashing
   * everything into the displayed floor-to-ceiling string. */
  budgetTiers: Array<[number, number]>;
  verified: boolean;
  yearsActive: number;
  accreditations: string[];
  /** Service-area regions as stored on the designer record, e.g.
   *  ["West", "East", "North"]. Drives the new Location filter. */
  regions: string[];
}

/** Parse a single token like "$30K", "30K", "30,000", "$30000" into a number
 * in thousands. Returns null if the token doesn't contain a number. */
function parseBudgetToken(token: string): number | null {
  const m = token.match(/(\d[\d,]*(?:\.\d+)?)\s*([Kk])?/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[2]) return n;
  if (n >= 1000) return n / 1000;
  return n;
}

/** Parse the raw businessInfo budget string into one or more tiers, each
 * expressed as [min, max] in thousands. Splits on commas (multi-segment
 * package strings) and "From" / "Up to" qualifiers. */
function parseBudgetTiers(raw: string): Array<[number, number]> {
  if (!raw) return [];
  const tiers: Array<[number, number]> = [];
  // Each comma-separated segment is one package/tier (e.g. Essential, Full).
  for (const segment of raw.split(/,\s*/)) {
    const cleaned = segment.trim();
    if (!cleaned) continue;
    const matches = [...cleaned.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([Kk])?/g)];
    if (matches.length === 0) continue;
    const nums = matches
      .map((m) => parseBudgetToken(m[0]))
      .filter((n): n is number => n != null);
    if (nums.length === 0) continue;
    if (nums.length === 1) {
      const n = nums[0];
      if (/from|starts?\s*at|onwards?/i.test(cleaned)) tiers.push([n, Infinity]);
      else if (/up\s*to|under|below/i.test(cleaned)) tiers.push([0, n]);
      else tiers.push([n, n]);
    } else {
      tiers.push([Math.min(...nums), Math.max(...nums)]);
    }
  }
  return tiers;
}

/** Map a Singapore address (street name + 6-digit postal code) to one of
 *  the five planning regions the directory filter uses. Returns null when
 *  the address is missing / too ambiguous to classify, so callers can
 *  fall back to whatever the firm self-reported as their service area.
 *
 *  Strategy: pattern-match common neighbourhood and road keywords first
 *  (cheap + high signal), then fall back to the postal-sector prefix
 *  (first two digits of the 6-digit postal code). The prefix-to-region
 *  table follows URA / SingPost sector boundaries and intentionally
 *  resolves the messy "border" sectors (15, 21, 38, 58, 77) toward the
 *  region where each sector's main town centre sits. */
function inferShowroomRegion(address: string): string | null {
  if (!address) return null;
  const a = address.toLowerCase();

  // Neighbourhood keyword pass — these win when present because they're
  // unambiguous (a road like "Tampines North Drive" is always East even
  // if the postal code somehow looks otherwise).
  const KEYWORDS: Array<[RegExp, string]> = [
    [/\b(woodlands|sembawang|yishun|admiralty|kranji|mandai|sungei kadut)\b/, "North"],
    [/\b(hougang|sengkang|punggol|serangoon|ang mo kio|bishan|lorong chuan|seletar|buangkok)\b/, "North-East"],
    [/\b(tampines|bedok|pasir ris|changi|simei|tanah merah|eunos|kembangan|aljunied|geylang|katong|marine parade|joo chiat|paya lebar|ubi|loyang|east coast)\b/, "East"],
    [/\b(jurong|bukit batok|bukit panjang|choa chu kang|clementi|tuas|boon lay|pioneer|lakeside|buona vista|dover|pandan|tengah|west coast)\b/, "West"],
    [/\b(orchard|tanglin|newton|novena|toa payoh|bukit timah|holland|queenstown|tiong bahru|outram|chinatown|bugis|beach road|lavender|kallang|macpherson|braddell|thomson|whampoa|balestier|rochor|tanjong pagar|raffles|marina|river valley|cairnhill)\b/, "Central"],
  ];
  for (const [re, region] of KEYWORDS) if (re.test(a)) return region;

  // Postal-sector fallback — pull the 6-digit code, take the first two
  // digits, look it up in the table.
  const m = a.match(/\b(\d{6})\b/);
  if (!m) return null;
  const sector = parseInt(m[1].slice(0, 2), 10);
  const SECTOR_REGION: Record<number, string> = {
    // Central (CBD, Orchard, Bukit Timah, Toa Payoh, Newton, Novena)
    1: "Central", 2: "Central", 3: "Central", 4: "Central", 5: "Central",
    6: "Central", 7: "Central", 8: "Central", 9: "Central", 10: "Central",
    11: "Central", 22: "Central", 23: "Central", 24: "Central", 25: "Central",
    26: "Central", 27: "Central", 28: "Central", 29: "Central", 30: "Central",
    31: "Central", 32: "Central", 33: "Central", 34: "Central", 35: "Central",
    36: "Central", 37: "Central",
    // East (Geylang, Katong, Bedok, Tampines, Pasir Ris, Changi)
    14: "East", 15: "East", 16: "East", 17: "East", 18: "East", 19: "East",
    38: "East", 39: "East", 40: "East", 41: "East", 42: "East", 43: "East",
    44: "East", 45: "East", 46: "East", 47: "East", 48: "East", 49: "East",
    50: "East", 51: "East", 52: "East", 81: "East",
    // North-East (Hougang, Sengkang, Punggol, Ang Mo Kio, Bishan)
    20: "North-East", 53: "North-East", 54: "North-East", 55: "North-East",
    56: "North-East", 57: "North-East", 79: "North-East", 80: "North-East",
    82: "North-East",
    // West (Buona Vista, Jurong, Bukit Batok, Choa Chu Kang, Tengah)
    12: "West", 13: "West", 21: "West", 58: "West", 59: "West",
    60: "West", 61: "West", 62: "West", 63: "West", 64: "West", 65: "West",
    66: "West", 67: "West", 68: "West", 69: "West", 70: "West", 71: "West",
    // North (Woodlands, Sembawang, Yishun, Mandai, Sungei Kadut)
    72: "North", 73: "North", 74: "North", 75: "North", 76: "North",
    77: "North", 78: "North",
  };
  return SECTOR_REGION[sector] ?? null;
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
  const budgetTiers = parseBudgetTiers(budgetRaw);

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
    // Card hero image: prefer the firm's first featured project so the
    // static fallback shows the same curated shot they promote on their
    // profile. Falls back to `images.cover` for firms without any
    // featured projects.
    image: (() => {
      const all: any[] = Array.isArray(d.projects) ? d.projects : [];
      const firstFeatured = all.find((p) => p?.isFeatured);
      const featuredSrc = firstFeatured?.coverImage || firstFeatured?.featuredImage || firstFeatured?.image || firstFeatured?.images?.cover || "";
      return featuredSrc || images.cover || "";
    })(),
    projectImages: (() => {
      // Carousel order: the firm-curated `isFeatured` projects first
      // (same set the profile page promotes), then the firm's main cover
      // as a final fallback so the card never strands on an all-broken
      // image set — many `imported/*.jpeg` rows in the API point at
      // files that no longer exist on Supabase storage, and the carousel
      // auto-skips broken slides via its onError handler.
      const all: any[] = Array.isArray(d.projects) ? d.projects : [];
      const featured = all.filter((p) => p?.isFeatured).slice(0, 5);
      const seen = new Set<string>();
      const out: string[] = [];
      for (const p of featured) {
        const src = p?.featuredImage || p?.coverImage || p?.image || p?.images?.cover || "";
        if (src && !seen.has(src)) { seen.add(src); out.push(src); }
      }
      if (images.cover && !seen.has(images.cover)) out.push(images.cover);
      return out;
    })(),
    logo: images.logo || "",
    // Prefer the live Google rating + total ratings (Outscraper / Places)
    // when present, falling back to the manual stats fields. This keeps the
    // "Highest Rated" / "Most Reviewed" sorts honest instead of ranking by
    // hand-typed numbers.
    rating: (typeof d.googleMeta?.rating === "number" && d.googleMeta.rating > 0)
      ? d.googleMeta.rating
      : (parseFloat(stats.rating) || 0),
    reviews: (typeof d.googleMeta?.totalRatings === "number" && d.googleMeta.totalRatings > 0)
      ? d.googleMeta.totalRatings
      : (parseInt(stats.reviewCount) || 0),
    projects: d.totalProjects || 0,
    location,
    propertyTypes,
    styles,
    budget,
    bio: String(d.bio || d.tagline || "").trim(),
    budgetTiers,
    verified: d.verified || false,
    yearsActive,
    accreditations,
    // Region the "All Locations" filter matches against. Prefer the
    // showroom region inferred from the office address (what users
    // actually care about when filtering "where is their studio?"), then
    // fall back to the firm's self-declared service-area regions.
    regions: (() => {
      const showroom = inferShowroomRegion(location);
      if (showroom) return [showroom];
      return Array.isArray(d?.serviceArea?.regions) ? d.serviceArea.regions : [];
    })(),
  };
}

const PROPERTY_FILTERS = ["Any Property", "HDB", "Condo", "EC", "Landed", "Commercial"];
const STYLE_FILTERS = ["All Styles", "Modern", "Contemporary", "Scandinavian", "Industrial", "Japandi", "Minimalist", "Mid-Century", "Luxury/High-End"];
const BUDGET_FILTERS = ["Any Budget", "$40,000 and under", "$60,000 and under", "$80,000 and under"];
const LOCATION_FILTERS = ["All Locations", "North", "North-East", "East", "West", "Central"];
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

/** Bundled authority logo file + the fraction of the source PNG that is the
 *  actual mark (the rest is the "BCA Registered" / "HDB Registered" text we
 *  want to crop off). Files live in public/credentials/. */
/** Bundled square authority logo for each accreditation we recognise. Files
 *  live in public/credentials/ and are already cropped to a square mark. The
 *  `?v=2` query string busts any stale browser cache from earlier non-square
 *  versions that were served from this directory. */
const CREDENTIAL_LOGOS: Array<{ match: RegExp; src: string }> = [
  { match: /hdb/i, src: "/credentials/hdb.png?v=2" },
  { match: /bca/i, src: "/credentials/bca.png?v=2" },
  { match: /case/i, src: "/credentials/casetrust.png?v=2" },
  { match: /biz\s*safe/i, src: "/credentials/bizsafe.png?v=2" },
];

/** Renders the official authority logo cropped to just the mark, framed in a
 *  rounded bordered tile. Falls back to a colored monogram pill for
 *  accreditations we don't have a bundled file for. */
function AccreditationLogo({ label }: { label: string }) {
  const entry = CREDENTIAL_LOGOS.find((c) => c.match.test(label));
  if (entry) {
    return (
      <div
        title={label}
        className="shrink-0 overflow-hidden"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: `1px solid ${C.creamBorder}`,
          background: C.white,
        }}
        role="img"
        aria-label={label}
      >
        <img
          src={entry.src}
          alt=""
          className="w-full h-full object-contain"
          style={{ display: "block" }}
        />
      </div>
    );
  }
  const upper = label.toUpperCase();
  let mono = "";
  let color = C.black;
  if (upper.includes("LANDED")) { mono = "LE"; color = "#7c3aed"; }
  else if (upper.includes("ISO")) { mono = "ISO"; color = "#0f172a"; }
  else {
    mono = label.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase().slice(0, 3) || label.slice(0, 3).toUpperCase();
  }
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center rounded-[8px] text-[10px] font-bold tracking-wide"
      style={{
        height: 32,
        padding: "0 10px",
        background: C.white,
        border: `1.5px solid ${color}`,
        color,
        fontFamily: sans,
      }}
    >
      {mono}
    </span>
  );
}

/** Three-state lead funnel for the directory hero: captures contact
 *  details, runs the same 7-question qualifying flow the homepage uses,
 *  and persists the result to Supabase / Zapier so the lead lands in the
 *  same pipeline. Falls back to a thank-you panel on completion. */
function DirectoryLeadFunnel() {
  const [state, setState] = useState<"capturing" | "qualifying" | "complete">("capturing");
  const [contact, setContact] = useState<HeroLeadFormData>({ name: "", phone: "", email: "" });

  if (state === "capturing") {
    return (
      <HeroMatchForm
        onSubmit={(data) => {
          setContact(data);
          setState("qualifying");
        }}
      />
    );
  }

  if (state === "qualifying") {
    return (
      <QualifyingFlow
        onComplete={(answers) => {
          setState("complete");
          trackLead("directory-hero-lead", { email: contact.email, phone: contact.phone });
          // Persist to Supabase homepage_leads — same table the homepage
          // funnel writes to, so ops only watches one stream.
          const sbUrl = `https://${projectId}.supabase.co`;
          const sbKey = publicAnonKey;
          fetch(`${sbUrl}/rest/v1/homepage_leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: sbKey, Authorization: `Bearer ${sbKey}` },
            body: JSON.stringify({
              name: contact.name,
              phone: contact.phone,
              email: contact.email || null,
              ...answers,
            }),
          }).catch((err) => console.error("Lead save error:", err));
          recordAttribution("homepage-lead", contact.email);
          sendToZapier("hero-lead", {
            "First Name": contact.name,
            "Contact Phone": contact.phone,
            "Email Address": contact.email || "",
            "Situation": answers.situation || "",
            "Key Date": answers.timeline || "",
            "Property Type": answers.home_type || "",
            "Design Level": answers.design_level || "",
            "Renovation Budget":
              (answers.budget_range || "").match(/^\$[\d,]+K?\+?(?:[–\-]+\$[\d,]+K?\+?)?/)?.[0] || answers.budget_range || "",
            "Biggest Concern": answers.biggest_concern || "",
            "Decision Maker": answers.is_decision_maker || "",
            "Meeting Preference": answers.meeting_preference || "",
            "Lead Form": "Directory Lead Form",
          });
        }}
      />
    );
  }

  return (
    <div
      className="p-8 md:p-10 text-center"
      style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 12 }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: C.black }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-[26px] md:text-[32px] leading-[1.15] mb-3" style={{ fontFamily: serif, color: C.black }}>
        {COMPLETION.headline}
      </h2>
      <p className="text-[14px] font-normal leading-[1.7] mb-2" style={{ color: C.gray, fontFamily: sans }}>
        {COMPLETION.subheadline}
      </p>
      <p className="text-[13px] font-normal leading-[1.7]" style={{ color: C.grayLight, fontFamily: sans }}>
        {COMPLETION.body}
      </p>
    </div>
  );
}

/** FAQ copy specific to the directory page — addresses the top conversion
 *  objections (cost, trust, process, alternatives) for shopping-stage
 *  homeowners. Answers are 1-3 sentences, no fabricated claims. */
const DIRECTORY_FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is Network really free for homeowners?",
    a: "Yes. You pay nothing to browse, match, or message firms. Designers only pay us when they win your project.",
  },
  {
    q: "How are these firms verified?",
    a: "Every firm is checked against HDB, BCA, CaseTrust, and bizSAFE credentials before going live, and we monitor Google reviews afterwards.",
  },
  {
    q: "How does the matching work?",
    a: "Tell us your property, style, and budget. We hand-pick up to three firms whose past work matches your brief — usually within a day.",
  },
  {
    q: "What if I don't like the matches?",
    a: "Reply once and we'll re-pitch with different firms. No fees, no commitment, no obligation to hire any of them.",
  },
  {
    q: "Can I contact a firm directly without getting matched?",
    a: "Yes. Open any profile and reach out — matching is a shortcut, not a gate.",
  },
  {
    q: "What does a renovation in Singapore actually cost?",
    a: "HDB Essential packages start around $30K and full Condo or Landed renovations run $80K–$120K+. The Cost Guide gives a project-specific estimate in under a minute.",
  },
  {
    q: "How do I know what my home will look like before signing?",
    a: "Use Room Designer to generate AI renders from a photo, and Layout Planner for a 3D floor plan — both free, no firm needed.",
  },
  {
    q: "Is my deposit protected if something goes wrong?",
    a: "Handshake holds milestone payments and only releases them when work is approved. The firm gets paid as work passes, not before.",
  },
  {
    q: "How long does the whole process take?",
    a: "Most homeowners receive their first round of matches within 24 hours. Quotes typically come back in 3–5 days after that.",
  },
  {
    q: "Why use Network instead of walking into showrooms?",
    a: "One brief beats five Saturdays of door-to-door. You get pre-vetted firms, side-by-side quotes, and Handshake payment protection — without the showroom pitch.",
  },
];

/** Accordion-style FAQ block rendered at the bottom of the directory. Only
 *  one row is open at a time; opening another collapses the previous. */
function DirectoryFAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="mt-16 md:mt-24">
      <h2
        className="font-normal mb-8"
        style={{ fontFamily: serif, color: C.black, fontSize: "clamp(26px, 3vw, 40px)", letterSpacing: "-0.01em" }}
      >
        Frequently Asked Questions
      </h2>
      <div
        className="rounded-[16px] overflow-hidden"
        style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
      >
        {DIRECTORY_FAQS.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={item.q}
              style={i > 0 ? { borderTop: `1px solid ${C.creamBorder}` } : undefined}
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-start justify-between gap-6 text-left cursor-pointer px-6 py-5 md:px-8 md:py-6"
                style={{ background: "transparent", border: "none" }}
                aria-expanded={open}
              >
                <span
                  className="text-[15px] md:text-[17px] font-medium"
                  style={{ fontFamily: sans, color: C.black, lineHeight: 1.4 }}
                >
                  {item.q}
                </span>
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 mt-0.5"
                  style={{ color: C.gray }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      className="text-[14px] md:text-[15px] px-6 md:px-8 pb-6 md:pb-7"
                      style={{ fontFamily: sans, color: C.gray, lineHeight: 1.65, margin: 0, maxWidth: 760 }}
                    >
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Cover-slot carousel that swipes through up to ~6 featured project shots
 *  for a firm. Auto-advances every 4.5 s; pauses while the user is hovering
 *  the card. Prev/next buttons let the user step through manually, and a
 *  dot row shows position. Clicks on the buttons swallow propagation so they
 *  don't trigger the card-level "navigate to profile" handler. */
function DesignerCoverCarousel({ designer }: { designer: DesignerCard }) {
  const rawSlides = designer.projectImages.length > 0 ? designer.projectImages : [designer.image];
  // Track which sources have failed to load (e.g. bucket entries blocked by
  // ORB / CORS) so the carousel can skip past them instead of stranding the
  // user on a broken-image fallback tile.
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const slides = rawSlides.filter((s) => !failed.has(s));
  const safeSlides = slides.length > 0 ? slides : [rawSlides[0]];
  const [index, setIndex] = useState(0);

  // Clamp the active index when the visible-slide set shrinks (e.g. an
  // image just failed and was filtered out).
  useEffect(() => {
    if (index >= safeSlides.length) setIndex(0);
  }, [safeSlides.length, index]);

  const go = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIndex((i) => (i + delta + safeSlides.length) % safeSlides.length);
  };
  const jumpTo = (i: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIndex(i);
  };
  const markFailed = (src: string) =>
    setFailed((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });

  // Track which slide images have finished decoding so the visible <img>
  // can fade in from a cream placeholder instead of flashing white while
  // the network request is in flight.
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const markLoaded = (src: string) =>
    setLoaded((prev) => {
      if (prev.has(src)) return prev;
      const out = new Set(prev);
      out.add(src);
      return out;
    });
  const currentSrc = safeSlides[index];
  const isLoaded = loaded.has(currentSrc);

  // Cached-image race: when the visible <img> is served from cache, the
  // browser can finish before React attaches onLoad, leaving the slide at
  // opacity 0. After each src swap, check the element directly.
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) markLoaded(currentSrc);
  }, [currentSrc]);

  // Only warm hidden slides once the card has actually scrolled near the
  // viewport. Previously every card preloaded all of its slides on mount,
  // which fired dozens of concurrent weserv resize requests on page load
  // and starved the covers the user could actually see.
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Warm the browser cache for non-visible slides so swiping doesn't
  // restart the flash cycle — but one at a time, at low fetch priority,
  // and only after the visible slide has finished. Each completed warm
  // updates `loaded`, which re-runs the effect and pulls the next slide.
  useEffect(() => {
    if (!inView || !isLoaded) return;
    const next = rawSlides.find((s) => !loaded.has(s) && !failed.has(s));
    if (!next) return;
    const img = new Image();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok) markLoaded(next);
      else markFailed(next);
    };
    img.decoding = "async";
    (img as any).fetchPriority = "low";
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = thumbnailUrl(resolveAsset(next), 480, 70);
    // If the image was already cached, onload may never fire — check now.
    if (img.complete && img.naturalWidth > 0) done(true);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, isLoaded, loaded, failed, rawSlides.join("|")]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(135deg, #ece8df 0%, #f4f1ea 50%, #ece8df 100%)",
      }}
    >
      {/* Single <img> that swaps src on slide change. The key includes
          the slide src so the browser fetches the new image on demand
          but the DOM node is reused — avoids the AnimatePresence
          removeChild race we hit on iOS Safari with popLayout mode.
          opacity is driven by `loaded` so the image fades in instead
          of popping after the cream placeholder. loading="lazy" keeps
          below-the-fold cards from competing with visible covers. */}
      <img
        key={`${designer.id}-${currentSrc}`}
        ref={imgRef}
        src={thumbnailUrl(resolveAsset(currentSrc), 480, 70)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 0.35s ease" }}
        decoding="async"
        loading="lazy"
        onLoad={() => markLoaded(currentSrc)}
        onError={() => markFailed(currentSrc)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

      {/* Swipe controls — only rendered when there's more than one slide. */}
      {safeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={go(-1)}
            aria-label="Previous project"
            className="absolute top-1/2 -translate-y-1/2 left-2 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.92)", border: "none", color: C.black, backdropFilter: "blur(4px)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={go(1)}
            aria-label="Next project"
            className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ width: 32, height: 32, background: "rgba(255,255,255,0.92)", border: "none", color: C.black, backdropFilter: "blur(4px)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {safeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={jumpTo(i)}
                aria-label={`Show project ${i + 1}`}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === index ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
                  border: "none",
                  cursor: "pointer",
                  transition: "width 0.25s ease, background 0.25s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Skeleton placeholder rendered while the firm list is being fetched.
 *  Mirrors the real card's silhouette so the grid doesn't reflow when data
 *  arrives. Uses a single shimmering keyframe shared across all blocks. */
function DesignerCardSkeleton() {
  const block: React.CSSProperties = {
    background: "linear-gradient(90deg, #ece8df 0%, #f4f1ea 50%, #ece8df 100%)",
    backgroundSize: "200% 100%",
    animation: "designer-skeleton-shimmer 1.4s linear infinite",
    borderRadius: 8,
  };
  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
      aria-hidden
    >
      <div style={{ ...block, height: 220, borderRadius: 0 }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ ...block, width: 52, height: 52, borderRadius: 999 }} />
          <div style={{ ...block, height: 18, flex: 1, maxWidth: 180 }} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ ...block, height: 22, width: 56 }} />
          <div style={{ ...block, height: 14, width: 88 }} />
          <div style={{ ...block, height: 14, width: 72 }} />
        </div>
        <div style={{ ...block, height: 78, marginBottom: 16 }} />
        <div className="flex items-center gap-2 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...block, width: 40, height: 40 }} />
          ))}
        </div>
        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
          <div>
            <div style={{ ...block, height: 10, width: 80, marginBottom: 6 }} />
            <div style={{ ...block, height: 14, width: 100 }} />
          </div>
          <div style={{ ...block, height: 36, width: 110, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Notion-style calculator ─── */
// Self-contained inline SVG with SMIL animations:
//   - whole body gently bobs up and down (translate y, 2.8s)
//   - display cycles through three budget figures (opacity, 6s)
//   - the orange-equivalent operator key pulses (fill, 1.6s)
// 64×64 viewBox so it slots into the existing white badge tile.
function AnimatedCalculator() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="#0f0f0d"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -1.5; 0 0"
          dur="2.8s"
          repeatCount="indefinite"
        />

        {/* Body */}
        <rect
          x="10"
          y="6"
          width="44"
          height="52"
          rx="6"
          fill="#fafaf8"
          strokeWidth="2.5"
        />

        {/* Halftone shading on the bottom-right */}
        <g fill="#0f0f0d" stroke="none">
          {[
            [44, 52], [47, 52], [50, 52],
            [44, 55], [47, 55], [50, 55],
            [50, 49], [47, 49],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.7" />
          ))}
        </g>

        {/* Display */}
        <rect
          x="14"
          y="10"
          width="36"
          height="13"
          rx="2"
          fill="#0f0f0d"
          stroke="none"
        />

        {/* Cycling display values */}
        <g
          stroke="none"
          fill="#fafaf8"
          fontFamily="'DM Sans', sans-serif"
          fontSize="7"
          fontWeight="700"
          textAnchor="end"
        >
          <text x="46" y="20">
            <animate
              attributeName="opacity"
              values="1;1;0;0;0;0"
              keyTimes="0;0.30;0.34;0.66;0.99;1"
              dur="6s"
              repeatCount="indefinite"
            />
            $42K
          </text>
          <text x="46" y="20">
            <animate
              attributeName="opacity"
              values="0;0;1;1;0;0"
              keyTimes="0;0.33;0.37;0.63;0.66;1"
              dur="6s"
              repeatCount="indefinite"
            />
            $58K
          </text>
          <text x="46" y="20">
            <animate
              attributeName="opacity"
              values="0;0;0;1;1;0"
              keyTimes="0;0.66;0.70;0.74;0.97;1"
              dur="6s"
              repeatCount="indefinite"
            />
            $75K
          </text>
        </g>

        {/* Buttons — 3 cols on the left + tall operator column on the right */}
        <g strokeWidth="1.6" fill="#fafaf8">
          {/* Row 1 (digits) */}
          <rect x="14" y="27" width="8" height="6" rx="1.6" />
          <rect x="24" y="27" width="8" height="6" rx="1.6" />
          <rect x="34" y="27" width="8" height="6" rx="1.6" />
          {/* Row 2 (digits) */}
          <rect x="14" y="35" width="8" height="6" rx="1.6" />
          <rect x="24" y="35" width="8" height="6" rx="1.6" />
          <rect x="34" y="35" width="8" height="6" rx="1.6" />
          {/* Row 3 (digits) */}
          <rect x="14" y="43" width="8" height="6" rx="1.6" />
          <rect x="24" y="43" width="8" height="6" rx="1.6" />
          <rect x="34" y="43" width="8" height="6" rx="1.6" />
          {/* Bottom wide zero */}
          <rect x="14" y="51" width="18" height="6" rx="1.6" />
          <rect x="34" y="51" width="8" height="6" rx="1.6" />

          {/* Operator column on the right — pulsing */}
          <rect x="44" y="27" width="6" height="14" rx="1.6" fill="#0f0f0d">
            <animate
              attributeName="opacity"
              values="1;0.55;1"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </rect>
          {/* Equals key (taller) */}
          <rect x="44" y="43" width="6" height="14" rx="1.6" fill="#0f0f0d" />
        </g>
      </g>
    </svg>
  );
}

/* ─── COST GUIDE INLINE CTA ─── */
// Slides into the directory grid as a full-width band after every 6 cards.
// Copy is outcome-led (the homeowner *gets* an honest estimate) and
// reuses claims we can actually back up from /cost-guide — no fabricated
// statistics, no "thousands of reviews" filler.
function CostGuideInlineCTA() {
  const navigate = useNavigate();
  return (
    <div
      className="col-span-full flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 p-6 md:p-7 rounded-[20px] my-2"
      style={{
        background: C.black,
        border: `1px solid ${C.black}`,
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          background: C.white,
          borderRadius: "16px",
          color: C.black,
        }}
      >
        <AnimatedCalculator />
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className="text-[22px] md:text-[24px] leading-[1.2] m-0 mb-2"
          style={{ color: C.white, fontFamily: serif, fontWeight: 500 }}
        >
          Not Sure What Your Renovation Should Cost?
        </h3>
        <ul
          className="flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-1.5 m-0 p-0 list-none text-[13.5px]"
          style={{ color: "#c9c5bc", fontFamily: sans }}
        >
          {[
            "See real cost breakdowns by HDB, condo, and landed scope",
            "Built from honest line items, not designer marketing",
            "Free, 3 minutes, no email required",
          ].map((line) => (
            <li key={line} className="inline-flex items-center gap-2">
              <Check size={14} strokeWidth={2.4} style={{ color: C.white }} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => navigate("/cost-guide")}
        className="shrink-0 inline-flex items-center gap-1.5 h-[48px] px-6 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
        style={{
          background: C.white,
          color: C.black,
          borderRadius: "12px",
          fontFamily: sans,
          border: "none",
          transition: "all 0.15s",
        }}
      >
        Estimate my budget
        <ArrowRight size={14} strokeWidth={2} />
      </button>
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
        {/* Cover — slide-based featured-project carousel. Auto-advances
            every 4.5s and pauses on hover; prev/next buttons let the user
            jump manually. Falls back to a static hero image when there is
            only one image to show. */}
        <div className="relative h-[220px] overflow-hidden">
          <DesignerCoverCarousel designer={designer} />

          {/* Verified badge */}
          {designer.verified && (
            <div
              className="absolute top-3 left-3 rounded-[100px] px-3 py-[5px] flex items-center gap-1.5 z-10"
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
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-[100px] px-3 py-[5px] z-10">
              <span className="text-[12px] font-medium" style={{ fontFamily: sans, color: C.black }}>
                {designer.projects} projects
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 pb-6">
          {/* Logo + Name */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={logoSrc}
              alt=""
              className="size-[52px] rounded-full object-cover shrink-0"
              style={{ border: `1px solid ${C.creamBorder}` }}
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_LOGO; }}
            />
            <h3
              className="text-[20px] font-normal leading-[1.2] line-clamp-1 flex-1 min-w-0"
              style={{ fontFamily: serif, color: C.black }}
            >
              {designer.name}
            </h3>
          </div>

          {/* Rating · Reviews · Projects · Accreditations row. The
              accreditation cluster is pushed to the right and capped at
              three logos; any extra marks fold into a "+N" pill so the
              row keeps a fixed width. */}
          <div className="flex items-center gap-3 mb-4 text-[13px]" style={{ fontFamily: sans, color: C.gray }}>
            {designer.rating > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-[8px] px-2 py-[3px]"
                style={{ background: "#fff7e8" }}
              >
                <Star className="w-[14px] h-[14px] fill-[#FFA929] text-[#FFA929]" />
                <span className="font-semibold" style={{ color: C.black }}>{designer.rating}</span>
              </span>
            )}
            {designer.reviews > 0 && (
              <>
                <span style={{ color: C.grayLight }}>|</span>
                <span><span style={{ color: C.black, fontWeight: 500 }}>{designer.reviews}</span> Reviews</span>
              </>
            )}
            {(() => {
              const visible = designer.accreditations.filter((a) => {
                const u = a.toUpperCase();
                return !u.includes("LANDED") && !u.includes("ISO");
              });
              if (visible.length === 0) return null;
              const shown = visible.slice(0, 3);
              const overflow = visible.length - shown.length;
              return (
                <div className="flex items-center gap-1.5 ml-auto">
                  {shown.map((a) => (
                    <AccreditationLogo key={a} label={a} />
                  ))}
                  {overflow > 0 && (
                    <span
                      title={visible.slice(3).join(" · ")}
                      className="inline-flex items-center justify-center shrink-0 text-[11px] font-semibold"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: C.white,
                        border: `1px solid ${C.creamBorder}`,
                        color: C.gray,
                        fontFamily: sans,
                      }}
                    >
                      +{overflow}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Why choose — bio in a gray box, 3 lines max with ellipsis */}
          {designer.bio && (
            <div
              className="rounded-[10px] px-3.5 py-3 mb-4"
              style={{ background: C.cream }}
            >
              <p
                className="text-[13px] leading-[1.55] line-clamp-3"
                style={{ fontFamily: sans, color: C.gray, margin: 0 }}
              >
                {designer.bio}
              </p>
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
  const [propertyFilter, setPropertyFilter] = useState("Any Property");
  const [styleFilter, setStyleFilter] = useState("All Styles");
  const [budgetFilter, setBudgetFilter] = useState("Any Budget");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [licenseFilter, setLicenseFilter] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("Most Reviewed");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [designers, setDesigners] = useState<DesignerCard[]>([]);
  const [loading, setLoading] = useState(true);
  // Pagination — show 6 cards initially, reveal 6 more per "Load more" click.
  const PAGE_SIZE = 6;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Seed budget / location filters from query params on first mount so the
  // homepage-nav dropdown (and any other deep-link) can pre-apply filters.
  // Only runs once — once the user is here we don't want to fight their edits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const budget = params.get("budget");
    if (budget === "40") setBudgetFilter("$40,000 and under");
    else if (budget === "60") setBudgetFilter("$60,000 and under");
    else if (budget === "80") setBudgetFilter("$80,000 and under");
    const region = params.get("region");
    if (region && LOCATION_FILTERS.includes(region)) setLocationFilter(region);
  }, []);

  const toggleLicense = (opt: string) => setLicenseFilter((prev) => {
    const next = new Set(prev);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    return next;
  });

  const activeFilterCount = [propertyFilter !== "Any Property", styleFilter !== "All Styles", budgetFilter !== "Any Budget", locationFilter !== "All Locations", licenseFilter.size > 0].filter(Boolean).length;

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

    if (propertyFilter !== "Any Property") {
      result = result.filter((d) => d.propertyTypes.includes(propertyFilter));
    }

    if (styleFilter !== "All Styles") {
      result = result.filter((d) => d.styles.some((s) => s.toLowerCase().includes(styleFilter.toLowerCase())));
    }

    if (budgetFilter !== "Any Budget") {
      // Match against each designer's parsed budget tiers (one tier per
      // package they offer) so a multi-segment string like
      // "$30K-$50K Essential, $80K-$120K Full" only matches the bands its
      // tiers actually overlap, instead of being squashed into a single
      // $30K-$120K floor-to-ceiling range.
      const bands: Record<string, [number, number]> = {
        "$40,000 and under": [0, 40],
        "$60,000 and under": [0, 60],
        "$80,000 and under": [0, 80],
      };
      const [bMin, bMax] = bands[budgetFilter] || [0, Infinity];
      result = result.filter((d) => {
        const tiers = d.budgetTiers || [];
        if (tiers.length === 0) return true; // no budget data — keep visible
        return tiers.some(([fMin, fMax]) => fMin < bMax && fMax >= bMin);
      });
    }

    if (locationFilter !== "All Locations") {
      result = result.filter((d) => d.regions.includes(locationFilter));
    }

    // Multi-license filter — designer must hold ALL selected licenses.
    if (licenseFilter.size > 0) {
      const selectedMatchers = LICENSE_FILTERS.filter((l) => licenseFilter.has(l.label));
      result = result.filter((d) =>
        selectedMatchers.every((l) => d.accreditations.some((a) => l.match.test(a))),
      );
    }

    // Sorts use review count as a tiebreaker so a firm with 5.0 (2 reviews)
    // doesn't outrank a firm with 5.0 (200 reviews), and "Most Reviewed" ties
    // fall back to higher rating.
    if (sortBy === "Most Reviewed") result.sort((a, b) => (b.reviews - a.reviews) || (b.rating - a.rating));
    if (sortBy === "Highest Rated") result.sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
    if (sortBy === "Most Projects") result.sort((a, b) => b.projects - a.projects);
    if (sortBy === "Newest") result.sort((a, b) => a.yearsActive - b.yearsActive);

    return result;
  }, [search, propertyFilter, styleFilter, budgetFilter, locationFilter, licenseFilter, sortBy, designers]);

  // Reset pagination whenever the filter/sort/search changes so the user
  // never lands on "show 12 of 4" after narrowing the list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, propertyFilter, styleFilter, budgetFilter, locationFilter, licenseFilter, sortBy]);

  const visibleDesigners = filteredDesigners.slice(0, visibleCount);
  const hasMoreDesigners = filteredDesigners.length > visibleCount;

  const clearAllFilters = () => {
    setSearch("");
    setPropertyFilter("Any Property");
    setStyleFilter("All Styles");
    setBudgetFilter("Any Budget");
    setLocationFilter("All Locations");
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

        {/* ─── HERO — two-column lead-capture band ─── */}
        <section className="pt-8 md:pt-12 px-6 md:px-10">
          <div className="max-w-[1280px] mx-auto">
            <FadeIn>
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: 24, minHeight: "clamp(420px, 52vw, 540px)" }}
              >
                <SmartImage
                  src={heroPhoto}
                  alt="Interior design inspiration"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
                <div className="relative grid md:grid-cols-[1fr_minmax(340px,440px)] gap-8 md:gap-12 items-center py-12 px-6 md:px-12">
                  {/* Left — value proposition + browse CTA */}
                  <div className="text-left">
                    <h1
                      className="font-normal leading-[1.05] mb-4 md:mb-5"
                      style={{ fontFamily: serif, color: C.white, fontSize: "clamp(34px, 4.5vw, 56px)", letterSpacing: "-0.02em" }}
                    >
                      Find your designer. Skip the showroom marathon.
                    </h1>
                    <p
                      className="text-[14px] md:text-[16px] max-w-[520px] leading-[1.65] mb-7 md:mb-8"
                      style={{ fontFamily: sans, color: "rgba(255,255,255,0.85)" }}
                    >
                      Every firm here is checked against HDB, BCA, CaseTrust, and bizSAFE — and Handshake protects your deposit. Browse the directory, or share your brief for a 3-firm shortlist.
                    </p>
                    <a
                      href="#designer-grid"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("designer-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex items-center gap-2 h-[48px] px-7 text-[14px] font-medium cursor-pointer hover:opacity-90 active:scale-[0.98]"
                      style={{ background: C.white, color: C.black, borderRadius: 12, fontFamily: sans, transition: "all 0.15s" }}
                    >
                      Browse Designers
                      <ChevronDown className="w-4 h-4" />
                    </a>
                  </div>
                  {/* Right — lead capture → 7-question qualifying flow → completion. */}
                  <DirectoryLeadFunnel />
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ─── FILTERS + GRID ─── */}
        <section id="designer-grid" className="px-6 md:px-10 pt-10 md:pt-14 pb-20 md:pb-28 scroll-mt-20">
          <div className="max-w-[1280px] mx-auto">
            {/* Combined search + filter row — keeps the input, the five
                filter pills, the "Clear all" affordance, and the Search
                submit button on the same line so users see everything
                they can narrow by at a glance. Wraps on smaller widths. */}
            <FadeIn>
              <div className="hidden md:flex items-center mb-8 flex-wrap gap-3">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="relative flex-1 min-w-[260px] max-w-[420px]"
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 100,
                  }}
                >
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.grayLight }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, style, or location..."
                    className="w-full h-[48px] rounded-[100px] pl-12 pr-10 text-[14px] focus:outline-none bg-transparent"
                    style={{ fontFamily: sans, color: C.black }}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch("")} className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer">
                      <X className="w-4 h-4" style={{ color: C.grayLight }} />
                    </button>
                  )}
                </form>
                <FilterDropdown options={PROPERTY_FILTERS} value={propertyFilter} onChange={setPropertyFilter} />
                <FilterDropdown options={STYLE_FILTERS} value={styleFilter} onChange={setStyleFilter} />
                <FilterDropdown options={BUDGET_FILTERS} value={budgetFilter} onChange={setBudgetFilter} />
                <FilterDropdown options={LOCATION_FILTERS} value={locationFilter} onChange={setLocationFilter} />
                <MultiCheckboxDropdown
                  label="License"
                  options={LICENSE_FILTERS.map((l) => l.label)}
                  selected={licenseFilter}
                  onToggle={toggleLicense}
                />
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="ml-auto text-[13px] underline transition-colors cursor-pointer"
                    style={{ fontFamily: sans, color: C.grayLight }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = C.black; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = C.grayLight; }}
                  >
                    Clear all
                  </button>
                )}
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

                    {/* Location */}
                    <div className="mb-8">
                      <label className="text-[14px] font-medium block mb-3" style={{ fontFamily: sans, color: C.black }}>Location</label>
                      <div className="flex flex-wrap gap-2">
                        {LOCATION_FILTERS.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => setLocationFilter(loc)}
                            className="rounded-[100px] px-4 py-[9px] text-[13px] transition-all cursor-pointer"
                            style={{
                              fontFamily: sans,
                              ...(locationFilter === loc
                                ? { background: C.black, color: C.white, fontWeight: 500 }
                                : { background: C.cream, color: C.black }),
                            }}
                          >
                            {loc}
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
            <style>{`
              @keyframes designer-skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
              @keyframes directory-cover-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
              .directory-cover-marquee:hover > .flex { animation-play-state: paused !important; }
            `}</style>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <DesignerCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredDesigners.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {visibleDesigners.map((designer, i) => {
                    const isPageBoundary =
                      (i + 1) % PAGE_SIZE === 0 && i + 1 < visibleDesigners.length;
                    return (
                      <React.Fragment key={designer.id}>
                        <DesignerCardComponent designer={designer} index={i} />
                        {isPageBoundary && <CostGuideInlineCTA />}
                      </React.Fragment>
                    );
                  })}
                </div>
                {hasMoreDesigners && (
                  <div className="mt-12 md:mt-14 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                      className="h-[52px] px-8 text-[14px] font-medium cursor-pointer hover:opacity-85 active:scale-[0.98]"
                      style={{
                        background: C.black,
                        color: C.white,
                        borderRadius: "12px",
                        fontFamily: sans,
                        border: "none",
                        transition: "all 0.15s",
                      }}
                    >
                      Load more designers
                    </button>
                    <span className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
                      Showing {visibleDesigners.length} of {filteredDesigners.length}
                    </span>
                  </div>
                )}
              </>
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

            {/* ─── FAQ ─── */}
            <FadeIn>
              <DirectoryFAQs />
            </FadeIn>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <HomepageFooter />
      </div>
    </ReactLenis>
  );
}

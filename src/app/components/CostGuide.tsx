import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// ─── Types ───────────────────────────────────────────────
type PropertyType = "HDB" | "Condominium" | "Executive Condo (EC)" | "Landed";
type RoomKey = "Living/Dining" | "Kitchen" | "Bedrooms" | "Bathrooms" | "Others";
type ScopeLevel = "Light" | "Moderate" | "Extensive";
type CarpentryLevel = "Low" | "Medium" | "High";
type LayoutLevel = "No" | "Some" | "Major";

interface RoomScope {
  level: ScopeLevel;
  count?: number;
}

interface FullHomeScope {
  scope: ScopeLevel;
  carpentry: CarpentryLevel;
  layout: LayoutLevel;
}

interface CostEstimate {
  estMin: number;
  estMax: number;
  isFloor: boolean;
}

// ─── Constants ───────────────────────────────────────────
const TOTAL_STEPS = 7;
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

const HERO_IMAGE = "https://images.unsplash.com/photo-1768144092684-c1a5dd6c7aad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBpbnRlcmlvciUyMHJlbm92YXRpb24lMjBsaXZpbmclMjByb29tJTIwd2FybSUyMGxpZ2h0aW5nfGVufDF8fHx8MTc3MzI5NjkzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const UNIT_OPTIONS: Record<PropertyType, string[]> = {
  HDB: ["2-Room Flexi", "3-Room", "4-Room", "5-Room", "Executive", "DBSS"],
  Condominium: ["Studio", "1-Bedroom", "2-Bedroom", "3-Bedroom", "4-Bedroom", "Penthouse"],
  "Executive Condo (EC)": ["2-Bedroom", "3-Bedroom", "4-Bedroom", "5-Bedroom"],
  Landed: ["Terrace", "Semi-Detached", "Detached / Bungalow", "Good Class Bungalow"],
};

const TIMELINE_OPTIONS = [
  "Already have keys",
  "Within 3 months",
  "3–6 months",
  "6–12 months",
  "Just exploring",
];

const ALL_ROOMS: RoomKey[] = ["Living/Dining", "Kitchen", "Bedrooms", "Bathrooms", "Others"];

const SCOPE_DATA: Record<RoomKey, Record<ScopeLevel, string[]>> = {
  "Living/Dining": {
    Light: ["Repainting", "Small carpentry", "Simple fixtures"],
    Moderate: ["Custom carpentry", "New flooring", "Updated lighting"],
    Extensive: ["Full flooring change", "Feature wall", "Extensive carpentry"],
  },
  Kitchen: {
    Light: ["Change cabinet doors", "Small carpentry", "Basic tiling"],
    Moderate: ["New cabinetry", "Updated appliances", "Partial tiling"],
    Extensive: ["Layout changes", "New cabinetry", "Full tiling"],
  },
  Bedrooms: {
    Light: ["Paint", "Lighting", "Basic wardrobes"],
    Moderate: ["New flooring", "Custom wardrobes", "Lighting updates"],
    Extensive: ["Full carpentry fit-out", "Flooring", "Layout changes"],
  },
  Bathrooms: {
    Light: ["Replace fixtures", "Partial tiling"],
    Moderate: ["New fixtures", "Partial wall/floor tiling"],
    Extensive: ["Full tiling", "Custom vanity", "Layout changes"],
  },
  Others: {
    Light: ["Basic finishing", "Minor carpentry"],
    Moderate: ["New flooring", "Partial carpentry"],
    Extensive: ["Full custom carpentry and flooring"],
  },
};

// ─── Pricing Constants (from renovation-cost-ref.md) ─────

// Stage 1: Property Factor
const PROPERTY_FACTOR: Record<PropertyType, number> = {
  HDB: 1.0,
  Condominium: 1.05,
  "Executive Condo (EC)": 1.05,
  Landed: 1.25,
};

// Stage 1: Resale Uplift (applied only when isResale = true)
const RESALE_FACTOR: Record<PropertyType, number> = {
  HDB: 1.1,
  Condominium: 1.08,
  "Executive Condo (EC)": 1.08,
  Landed: 1.12,
};

// Stage 1: Size Weight (baseline: HDB 4-Room = 1.00)
const SIZE_WEIGHT: Record<PropertyType, Record<string, number>> = {
  HDB: {
    "2-Room Flexi": 0.65,
    "3-Room": 0.8,
    "4-Room": 1.0,
    "5-Room": 1.2,
    Executive: 1.3,
    DBSS: 1.4,
  },
  Condominium: {
    Studio: 0.6,
    "1-Bedroom": 0.75,
    "2-Bedroom": 0.9,
    "3-Bedroom": 1.05,
    "4-Bedroom": 1.25,
    Penthouse: 1.25,
  },
  "Executive Condo (EC)": {
    "2-Bedroom": 0.9,
    "3-Bedroom": 1.05,
    "4-Bedroom": 1.25,
    "5-Bedroom": 1.25,
  },
  Landed: {
    Terrace: 1.4,
    "Semi-Detached": 1.6,
    "Detached / Bungalow": 1.8,
    "Good Class Bungalow": 1.8,
  },
};

// Stage 2 Path A: Full Home Package Values
const FULL_HOME_PACKAGES: Record<ScopeLevel, { min: number; max: number }> = {
  Light: { min: 12000, max: 25000 },
  Moderate: { min: 28000, max: 55000 },
  Extensive: { min: 60000, max: 110000 },
};

// Full Home: Carpentry Adjustment
const CARPENTRY_ADJ_FULL: Record<CarpentryLevel, number> = {
  Low: 0.9,
  Medium: 1.0,
  High: 1.15,
};

// Full Home: Layout Adjustment
const LAYOUT_ADJ_FULL: Record<LayoutLevel, number> = {
  No: 1.0,
  Some: 1.07,
  Major: 1.15,
};

// Stage 2 Path B: Room Package Values (per unit, at reference home)
const ROOM_PACKAGES: Record<RoomKey, Record<ScopeLevel, { min: number; max: number }>> = {
  "Living/Dining": {
    Light: { min: 1000, max: 2000 },
    Moderate: { min: 3000, max: 6000 },
    Extensive: { min: 7000, max: 12000 },
  },
  Kitchen: {
    Light: { min: 3000, max: 6000 },
    Moderate: { min: 8000, max: 14000 },
    Extensive: { min: 15000, max: 25000 },
  },
  Bedrooms: {
    Light: { min: 1000, max: 2000 },
    Moderate: { min: 2500, max: 4500 },
    Extensive: { min: 5000, max: 8000 },
  },
  Bathrooms: {
    Light: { min: 1500, max: 3000 },
    Moderate: { min: 4000, max: 7000 },
    Extensive: { min: 8000, max: 12000 },
  },
  Others: {
    Light: { min: 800, max: 1500 },
    Moderate: { min: 2000, max: 3500 },
    Extensive: { min: 4000, max: 6000 },
  },
};

// Contingency buffer on max
const CONTINGENCY_MAX = 1.1;

// Rounding helper
function roundTo(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

// ─── Cost Computation Engine ─────────────────────────────
function computeEstimate(
  propertyType: PropertyType,
  isResale: boolean,
  unitType: string,
  selectedRooms: RoomKey[],
  roomScopes: Partial<Record<RoomKey, RoomScope>>,
  fullHomeScope: FullHomeScope | null
): CostEstimate {
  // Stage 1 multipliers
  const pf = PROPERTY_FACTOR[propertyType];
  const rf = isResale ? RESALE_FACTOR[propertyType] : 1;
  const sw = SIZE_WEIGHT[propertyType]?.[unitType] ?? 1.0;

  let sumMin = 0;
  let sumMax = 0;

  const isFullHome =
    selectedRooms.length === ALL_ROOMS.length &&
    ALL_ROOMS.every((r) => selectedRooms.includes(r));

  if (isFullHome && fullHomeScope) {
    // Path A: Full Home
    const base = FULL_HOME_PACKAGES[fullHomeScope.scope];
    const carpAdj = CARPENTRY_ADJ_FULL[fullHomeScope.carpentry];
    const layAdj = LAYOUT_ADJ_FULL[fullHomeScope.layout];
    sumMin = base.min * carpAdj * layAdj;
    sumMax = base.max * carpAdj * layAdj;
  } else {
    // Path B: Specific Rooms
    for (const room of selectedRooms) {
      const scope = roomScopes[room];
      if (!scope?.level) continue;
      const pkg = ROOM_PACKAGES[room][scope.level];
      const count = scope.count ?? 1;
      sumMin += pkg.min * count;
      sumMax += pkg.max * count;
    }
  }

  // Final formula
  const estMin = roundTo(sumMin * pf * rf * sw, 100);
  const estMax = roundTo(sumMax * pf * rf * sw * CONTINGENCY_MAX, 100);

  // Floor rule: if estMin < $5,000 → show $30k–$35k (safety net for unrealistically low estimates)
  const isFloor = estMin < 5000;

  return { estMin, estMax, isFloor };
}

// Format currency for display
function formatCurrency(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${value.toLocaleString()}`;
}

// ═══════════════════════════════════════════════════════════
// STEP 1 — Property Type
// ══════════════════════════════════════════════════════���════
function StepProperty({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options: { label: PropertyType; sub: string }[] = [
    { label: "HDB", sub: "BTO, resale, DBSS" },
    { label: "Condominium", sub: "Private apartments" },
    { label: "Executive Condo (EC)", sub: "EC units" },
    { label: "Landed", sub: "Terrace, semi-D, bungalow" },
  ];

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        What's your property type?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-8">
        Different property types have different cost structures.
      </p>

      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.label)}
            className={`w-full flex items-center justify-between px-5 py-[18px] rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              selected === opt.label
                ? "border-[#0f0f0d] shadow-[0_0_0_1px_#0f0f0d]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <div>
              <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d] block">
                {opt.label}
              </span>
              <span className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790] block mt-0.5">
                {opt.sub}
              </span>
            </div>
            {selected === opt.label && (
              <div className="w-[22px] h-[22px] rounded-full bg-[#0f0f0d] flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 2 — Unit Type + Resale
// ═══════════════════════════════════════════════════════════
function StepUnit({
  propertyType,
  unitType,
  isResale,
  onUnitChange,
  onResaleChange,
}: {
  propertyType: PropertyType;
  unitType: string;
  isResale: boolean;
  onUnitChange: (v: string) => void;
  onResaleChange: (v: boolean) => void;
}) {
  const units = UNIT_OPTIONS[propertyType] || [];

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Which unit type?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-8">
        Choose the closest match to your home.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {units.map((unit) => (
          <button
            key={unit}
            onClick={() => onUnitChange(unit)}
            className={`w-full flex items-center justify-between px-5 py-[18px] rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              unitType === unit
                ? "border-[#0f0f0d] shadow-[0_0_0_1px_#0f0f0d]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {unit}
            </span>
            {unitType === unit && (
              <div className="w-[22px] h-[22px] rounded-full bg-[#0f0f0d] flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Resale toggle */}
      <div className="flex items-center justify-between px-5 py-4 rounded-[12px] border border-[#d8d3c8] bg-[#fafaf8]">
        <div>
          <span className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] block">
            Resale property
          </span>
          <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] block mt-0.5">
            Resale homes typically cost more to renovate
          </span>
        </div>
        <button
          onClick={() => onResaleChange(!isResale)}
          className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 ml-4 ${
            isResale ? "bg-[#0f0f0d]" : "bg-[#d8d3c8]"
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
              isResale ? "translate-x-[20px]" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 3 — Rooms
// ═══════════════════════════════════════════════════════════
function StepRooms({
  selected,
  onToggle,
}: {
  selected: RoomKey[];
  onToggle: (room: RoomKey) => void;
}) {
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Which rooms are you renovating?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-8">
        Select all that apply.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {ALL_ROOMS.map((room) => {
          const isSelected = selected.includes(room);
          const iconMap: Record<RoomKey, JSX.Element> = {
            "Living/Dining": (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                <path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5H6V11a2 2 0 0 0-4 0v5z" />
                <path d="M4 18v2" /><path d="M20 18v2" />
              </svg>
            ),
            Kitchen: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
              </svg>
            ),
            Bedrooms: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" />
                <path d="M2 17h20" /><path d="M6 8v9" />
              </svg>
            ),
            Bathrooms: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" />
                <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" />
                <path d="M4 21l1-1.5" /><path d="M20 21l-1-1.5" />
              </svg>
            ),
            Others: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
                <path d="M12 12v4" /><path d="M10 14h4" />
              </svg>
            ),
          };
          return (
            <button
              key={room}
              onClick={() => onToggle(room)}
              className={`flex flex-col items-start p-4 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left relative ${
                isSelected
                  ? "border-[#0f0f0d] shadow-[0_0_0_1px_#0f0f0d]"
                  : "border-[#d8d3c8] hover:border-[#9a9790]"
              }${room === "Others" ? " col-span-2" : ""}`}
            >
              {/* Checkbox top-right */}
              <div
                className={`absolute top-3.5 right-3.5 w-[20px] h-[20px] rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isSelected
                    ? "bg-[#0f0f0d] border-[#0f0f0d]"
                    : "bg-[#fafaf8] border-[#d8d3c8]"
                }`}
              >
                {isSelected && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              {/* Icon */}
              <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center mb-3 transition-colors duration-200 ${isSelected ? "bg-[#0f0f0d] text-white" : "bg-[#e8e4db] text-[#6b6860]"}`}>
                {iconMap[room]}
              </div>
              {/* Label */}
              <span className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] leading-[1.3]">
                {room === "Others" ? "Others (Study, Balcony, etc.)" : room}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4b — Full Home Scope (when all rooms selected)
// ═══════════════════════════════════════════════════════════
function StepFullHomeScope({ data, onChange }: { data: FullHomeScope; onChange: (u: Partial<FullHomeScope>) => void }) {
  const scopes: { level: ScopeLevel; sub: string }[] = [
    { level: "Light", sub: "Cosmetic refresh — paint, fixtures, minor touch-ups" },
    { level: "Moderate", sub: "New flooring, carpentry, updated finishes throughout" },
    { level: "Extensive", sub: "Full overhaul — everything new, custom throughout" },
  ];
  const carpentry: { level: CarpentryLevel; sub: string }[] = [
    { level: "Low", sub: "Minimal built-in cabinetry" },
    { level: "Medium", sub: "Standard wardrobes & kitchen cabinetry" },
    { level: "High", sub: "Custom full-height carpentry, feature walls" },
  ];
  const layout: { level: LayoutLevel; sub: string }[] = [
    { level: "No", sub: "Keep the existing layout as-is" },
    { level: "Some", sub: "Minor wall changes, open up one area" },
    { level: "Major", sub: "Significant hacking, new room configurations" },
  ];

  function renderSection<T extends string>(title: string, subtitle: string, options: { level: T; sub: string }[], current: T, onSelect: (v: T) => void) {
    return (
      <div className="mb-10">
        <h3 className="font-['DM_Sans',sans-serif] font-semibold text-[18px] text-[#0f0f0d] tracking-[-0.4px] mb-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{title}</h3>
        <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790] leading-[1.5] mb-4">{subtitle}</p>
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button key={opt.level} onClick={() => onSelect(opt.level)} className={`w-full flex items-center justify-between px-5 py-[18px] rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${current === opt.level ? "border-[#0f0f0d] shadow-[0_0_0_1px_#0f0f0d]" : "border-[#d8d3c8] hover:border-[#9a9790]"}`}>
              <div>
                <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d] block">{opt.level}</span>
                <span className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790] block mt-0.5">{opt.sub}</span>
              </div>
              {current === opt.level && (
                <div className="w-[22px] h-[22px] rounded-full bg-[#0f0f0d] flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Full home renovation scope</h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-10">Since you're renovating every room, tell us about the overall scope.</p>
      {renderSection("How big is the upgrade?", "Overall renovation intensity", scopes, data.scope, (v) => onChange({ scope: v }))}
      {renderSection("How much custom carpentry?", "Built-in furniture and cabinetry", carpentry, data.carpentry, (v) => onChange({ carpentry: v }))}
      {renderSection("Any major layout changes?", "Wall hacking, room reconfigurations", layout, data.layout, (v) => onChange({ layout: v }))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4 — Scope per room
// ═══════════════════════════════════════════════════════════
function StepScope({
  rooms,
  scopes,
  onUpdate,
}: {
  rooms: RoomKey[];
  scopes: Partial<Record<RoomKey, RoomScope>>;
  onUpdate: (room: RoomKey, updates: Partial<RoomScope>) => void;
}) {
  const levels: ScopeLevel[] = ["Light", "Moderate", "Extensive"];

  return (
    <div className="w-full max-w-[580px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        How extensive is each room?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-10">
        Pick a scope level for each room. Your designer will refine the details later.
      </p>

      <div className="space-y-8">
        {rooms.map((room, roomIdx) => {
          const scope = scopes[room];
          if (!scope) return null;
          const hasCount = room === "Bedrooms" || room === "Bathrooms";

          return (
            <div key={room}>
              {/* Room header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['DM_Sans',sans-serif] font-semibold text-[18px] text-[#0f0f0d] tracking-[-0.4px]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  {room === "Others" ? "Others (Study, Balcony, etc.)" : room}
                </h3>
                {hasCount && (
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => onUpdate(room, { count: n })}
                        className={`w-[36px] h-[36px] rounded-[8px] font-['DM_Sans',sans-serif] font-medium text-[13px] transition-all duration-150 ${
                          scope.count === n
                            ? "bg-[#0f0f0d] text-white"
                            : "bg-[#e8e4db] text-[#6b6860] hover:bg-[#d8d3c8]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Scope pills — horizontal row */}
              <div className="grid grid-cols-3 gap-3">
                {levels.map((level) => {
                  const active = scope.level === level;
                  const items = SCOPE_DATA[room][level];
                  return (
                    <button
                      key={level}
                      onClick={() => onUpdate(room, { level })}
                      className={`text-left p-5 rounded-[12px] border transition-all duration-200 ${
                        active
                          ? "border-[#0f0f0d] bg-[#0f0f0d]"
                          : "border-[#d8d3c8] bg-[#fafaf8] hover:border-[#9a9790]"
                      }`}
                    >
                      <p
                        className={`font-['DM_Sans',sans-serif] font-semibold text-[15px] tracking-[-0.3px] mb-2.5 ${
                          active ? "text-white" : "text-[#0f0f0d]"
                        }`}
                      >
                        {level}
                      </p>
                      <ul className="space-y-1">
                        {items.map((item, i) => (
                          <li
                            key={i}
                            className={`font-['DM_Sans',sans-serif] text-[13px] leading-[1.5] ${
                              active ? "text-white/60" : "text-[#9a9790]"
                            }`}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {roomIdx < rooms.length - 1 && (
                <div className="h-px bg-[#e8e4db] mt-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// STEP 5 — Timeline
// ═══════════════════════════════════════════════════════════
function StepTimeline({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        When do you plan to start?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-8">
        This helps us connect you with available designers.
      </p>

      <div className="flex flex-col gap-3">
        {TIMELINE_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`w-full flex items-center justify-between px-5 py-[18px] rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              selected === opt
                ? "border-[#0f0f0d] shadow-[0_0_0_1px_#0f0f0d]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {opt}
            </span>
            {selected === opt && (
              <div className="w-[22px] h-[22px] rounded-full bg-[#0f0f0d] flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 6 — Contact Details
// ═══════════════════════════════════════════════════════════
function StepContact({
  data,
  onChange,
}: {
  data: { name: string; whatsapp: string; email: string };
  onChange: (field: string, value: string) => void;
}) {
  const [touched, setTouched] = useState<{ whatsapp: boolean; email: boolean }>({
    whatsapp: false,
    email: false,
  });

  const whatsappErr = touched.whatsapp && data.whatsapp.length > 0 && data.whatsapp.length < 8;
  const emailErr =
    touched.email &&
    data.email.length > 0 &&
    !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(data.email);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <h1 className="font-['DM_Sans',sans-serif] font-semibold text-[26px] md:text-[32px] text-[#0f0f0d] tracking-[-1.2px] leading-[1.15] mb-2" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Where should we send your cost guide?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[1.6] mb-8">
        We'll also connect you with renovation specialists who match your
        project.
      </p>

      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d] mb-1.5 block">
            Full name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full border border-[#d8d3c8] rounded-[10px] h-[46px] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#9a9790] outline-none focus:border-[#0f0f0d] transition-colors bg-[#fafaf8]"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d] mb-1.5 block">
            WhatsApp number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="8-digit number"
            value={data.whatsapp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              onChange("whatsapp", val);
            }}
            onFocus={() => setTouched((t) => ({ ...t, whatsapp: false }))}
            onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
            className={`w-full border rounded-[10px] h-[46px] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#9a9790] outline-none transition-colors bg-[#fafaf8] ${
              whatsappErr ? "border-red-400" : "border-[#d8d3c8] focus:border-[#0f0f0d]"
            }`}
          />
          {whatsappErr && (
            <p className="mt-1 font-['DM_Sans',sans-serif] text-[12px] text-red-500">
              Please enter a valid 8-digit number
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d] mb-1.5 block">
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            onFocus={() => setTouched((t) => ({ ...t, email: false }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={`w-full border rounded-[10px] h-[46px] px-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#9a9790] outline-none transition-colors bg-[#fafaf8] ${
              emailErr ? "border-red-400" : "border-[#d8d3c8] focus:border-[#0f0f0d]"
            }`}
          />
          {emailErr && (
            <p className="mt-1 font-['DM_Sans',sans-serif] text-[12px] text-red-500">
              Please enter a valid email address
            </p>
          )}
        </div>
      </div>

      <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790] leading-[1.6] mt-6">
        By submitting, you agree to be contacted by our renovation partners.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 7 — Results
// ═══════════════════════════════════════════════════════════
// CraftMyPDF template ID
const CRAFTMYPDF_TEMPLATE_ID = "28177b236b53ee54";

function StepResults({ estimate, propertyType, unitType, isResale, selectedRooms, isFullHomePath, roomScopes, fullHomeScope, timeline, quoteRequestId }: { estimate: CostEstimate; propertyType: string; unitType: string; isResale: boolean; selectedRooms: RoomKey[]; isFullHomePath: boolean; roomScopes: Partial<Record<RoomKey, RoomScope>>; fullHomeScope: FullHomeScope | null; timeline: string; quoteRequestId: string | null }) {
  const navigate = useNavigate();
  const displayRange = estimate.isFloor ? "$30K – $35K" : `${formatCurrency(estimate.estMin)} – ${formatCurrency(estimate.estMax)}`;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch(`${API_BASE}/cost-guide-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          propertyType, isResale, unitType, selectedRooms, timeline,
          roomScopes, fullHomeScope: isFullHomePath ? fullHomeScope : null,
          estimate, templateId: CRAFTMYPDF_TEMPLATE_ID,
          quoteRequestId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.pdfUrl) {
        console.error("PDF generation failed:", data);
        setPdfError(data.error || "Failed to generate PDF");
        return;
      }
      setPdfUrl(data.pdfUrl);
      // Open PDF in new tab
      window.open(data.pdfUrl, "_blank");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setPdfError("Something went wrong. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        {/* Check icon */}
        <div className="w-14 h-14 rounded-full bg-[#0f0f0d] flex items-center justify-center mx-auto mb-7">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>

        <h1 className="text-center leading-[1.15] mb-3" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          <span className="block font-normal text-[#0f0f0d]" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.025em" }}>
            Thank You for Using Our Cost Guide.
          </span>
          <span className="font-normal italic text-[#9a9790]" style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
            Our team will reach out to you shortly.
          </span>
        </h1>

        <p className="font-['DM_Sans',sans-serif] text-[15px] text-[#6b6860] leading-[1.75] mb-10 text-center max-w-[420px] mx-auto">
          We've received your renovation details. A member of our team will contact you via WhatsApp to share your personalized cost breakdown and help you plan your next steps.
        </p>

        {/* What's next card */}
        <div className="bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] p-7 mb-10">
          <p className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d] mb-4">What happens next</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">Our team will reach out within 1 business day</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">You'll receive your personalized cost breakdown via WhatsApp</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">Get matched to verified designers who fit your budget</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => navigate("/")}
            className="h-[52px] px-8 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer"
            style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
            Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Progress Bar
// ═══════════════════════════════════════════════════════════
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div className="w-full h-[3px] bg-[#d8d3c8] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#0f0f0d] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════
export function CostGuide() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [unitType, setUnitType] = useState("");
  const [isResale, setIsResale] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<RoomKey[]>([]);
  const [roomScopes, setRoomScopes] = useState<Partial<Record<RoomKey, RoomScope>>>({});
  const [fullHomeScope, setFullHomeScope] = useState<FullHomeScope>({ scope: "Moderate", carpentry: "Medium", layout: "No" });
  const [timeline, setTimeline] = useState("");
  const [contact, setContact] = useState({ name: "", whatsapp: "", email: "" });
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [quoteRequestId, setQuoteRequestId] = useState<string | null>(null);

  // Determine if all rooms selected → Full Home path
  const isFullHomePath = selectedRooms.length === ALL_ROOMS.length && ALL_ROOMS.every((r) => selectedRooms.includes(r));

  const toggleRoom = (room: RoomKey) => {
    if (selectedRooms.includes(room)) {
      setSelectedRooms((p) => p.filter((r) => r !== room));
      setRoomScopes((p) => {
        const n = { ...p };
        delete n[room];
        return n;
      });
    } else {
      setSelectedRooms((p) => [...p, room]);
      setRoomScopes((p) => ({
        ...p,
        [room]: {
          level: "Moderate" as ScopeLevel,
          count: room === "Bedrooms" || room === "Bathrooms" ? 1 : undefined,
        },
      }));
    }
  };

  const updateScope = (room: RoomKey, updates: Partial<RoomScope>) => {
    setRoomScopes((p) => ({ ...p, [room]: { ...p[room]!, ...updates } }));
  };

  const canNext = () => {
    switch (step) {
      case 1:
        return propertyType !== "";
      case 2:
        return unitType !== "";
      case 3:
        return selectedRooms.length > 0;
      case 4:
        if (isFullHomePath) return true;
        return selectedRooms.every((r) => roomScopes[r]?.level);
      case 5:
        return timeline !== "";
      case 6:
        return (
          contact.name.trim() !== "" &&
          contact.whatsapp.length === 8 &&
          /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(contact.email)
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else if (step === 1) setStep(0);
    else navigate("/");
  };

  const handleSubmit = async () => {
    if (submitting || !propertyType) return;
    setSubmitting(true);
    // Compute estimate client-side
    const est = computeEstimate(propertyType as PropertyType, isResale, unitType, selectedRooms, roomScopes, isFullHomePath ? fullHomeScope : null);
    setEstimate(est);
    try {
      const res = await fetch(`${API_BASE}/cost-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ propertyType, isResale, unitType, selectedRooms, timeline, roomScopes, fullHomeScope: isFullHomePath ? fullHomeScope : null, contact, estimate: est }),
      });
      const data = await res.json();
      if (!res.ok) console.error("Cost guide submission failed:", data);
      else {
        console.log("Cost guide submitted:", data);
        if (data.qrId) setQuoteRequestId(data.qrId);
      }
      setStep(7);

      // Generate PDF then send to Zapier with PDF URL in background
      (async () => {
        try {
          const pdfRes = await fetch(`${API_BASE}/cost-guide-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
            body: JSON.stringify({
              propertyType, isResale, unitType, selectedRooms, timeline,
              roomScopes, fullHomeScope: isFullHomePath ? fullHomeScope : null,
              estimate: est, templateId: CRAFTMYPDF_TEMPLATE_ID,
              quoteRequestId: data.qrId || null,
            }),
          });
          const pdfData = await pdfRes.json();
          const pdfUrl = pdfData.pdfUrl || null;
          console.log("PDF generated:", pdfUrl);

          // Send to Zapier with all data + PDF URL
          const fmtK = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
          const budgetRange = est.isFloor ? "$30K - $35K" : `${fmtK(est.estMin)} - ${fmtK(est.estMax)}`;
          const formData = new FormData();
          formData.append("Email Address", contact.email);
          formData.append("Property Type", propertyType);
          formData.append("Renovation Budget", budgetRange);
          formData.append("Craftpdf Link", pdfUrl || "");
          formData.append("First Name", contact.name);
          formData.append("Hook Id", data.qrId || "");
          formData.append("Lead Form", "Cost Guide Lead Form");
          formData.append("Key Date", timeline);
          formData.append("Contact Phone", contact.whatsapp);
          await fetch("https://hooks.zapier.com/hooks/catch/20249199/u5ds4ij/", {
            method: "POST",
            body: formData,
          });
        } catch (bgErr) {
          console.error("Background PDF/Zapier error:", bgErr);
        }
      })();
    } catch (err) {
      console.error("Error submitting cost guide:", err);
      setStep(7);
    } finally {
      setSubmitting(false);
    }
  };

  // Landing page (step 0)
  if (step === 0) {
    return (
      <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif] flex flex-col overflow-x-hidden">
        {/* Header */}
        <header className="px-6 md:px-12 pt-8 md:pt-10 pb-4">
          <div className="max-w-[1293px] mx-auto">
            <div
              className="w-[110px] h-[23px] bg-[#2b2b2b] shrink-0 cursor-pointer"
              onClick={() => navigate("/")}
              style={{
                maskImage: `url('${imgRectangle1}')`,
                maskSize: "111.804px 22.909px",
                maskRepeat: "no-repeat",
                maskPosition: "0px 0px",
                WebkitMaskImage: `url('${imgRectangle1}')`,
                WebkitMaskSize: "111.804px 22.909px",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "0px 0px",
              }}
            />
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center px-6 md:px-12">
          <div className="max-w-[1293px] mx-auto w-full py-12 md:py-20">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
              {/* Left — text content */}
              <div className="flex-1 max-w-[540px]">
                

                <h1 className="leading-[1.1] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  <span className="block font-normal text-[#0f0f0d]" style={{ fontSize: "clamp(32px, 3.8vw, 52px)", letterSpacing: "-0.025em" }}>
                    Know Your Renovation Cost Before You Commit.
                  </span>
                  <span className="font-normal italic text-[#9a9790]" style={{ fontSize: "clamp(24px, 2.8vw, 38px)" }}>
                    Personalized estimates in under 2 minutes.
                  </span>
                </h1>

                <p className="font-['DM_Sans',sans-serif] text-[16px] md:text-[18px] text-[#6b6860] leading-[1.6] mb-8 max-w-[440px]">
                  Get a personalized renovation cost estimate based on your
                  property type, rooms, and scope of work. Takes under 2 minutes.
                </p>

                {/* Value props */}
                <div className="flex flex-col gap-4 mb-10">
                  {[
                    "Tailored to your exact property & rooms",
                    "Based on real Singapore renovation data",
                    "Instantly delivered to your email & WhatsApp",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-[22px] h-[22px] rounded-full bg-[#FFCB2B] flex items-center justify-center shrink-0 mt-0.5">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="black"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="font-['DM_Sans',sans-serif] text-[15px] text-[#0f0f0d] leading-[1.5]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 bg-[#e8e4db] border border-white rounded-[100px] p-[5px] pl-[5px]"
                  >
                    <span className="inline-flex items-center gap-2 bg-[#0f0f0d] text-white rounded-[100px] px-7 py-3.5 font-['DM_Sans',sans-serif] font-medium text-[15px] tracking-[-0.7px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
                      Get your estimate
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </button>
                  <span className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790]">
                    Takes ~2 min
                  </span>
                </div>
              </div>

              {/* Right — image */}
              <div className="flex-1 max-w-[560px] w-full">
                <div className="relative rounded-[12px] overflow-hidden shadow-[0_25px_35.9px_rgba(0,0,0,0.07)]">
                  <ImageWithFallback
                    src={HERO_IMAGE}
                    alt="Modern renovated interior"
                    className="w-full h-[340px] md:h-[460px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Trust strip */}
            
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif] flex flex-col overflow-x-hidden">
      {/* ── Header ── */}
      <header className="px-6 md:px-12 pt-8 md:pt-10 pb-4">
        <div className="max-w-[1293px] mx-auto">
          <div
            className="w-[110px] h-[23px] bg-[#2b2b2b] shrink-0 cursor-pointer"
            onClick={() => navigate("/")}
            style={{
              maskImage: `url('${imgRectangle1}')`,
              maskSize: "111.804px 22.909px",
              maskRepeat: "no-repeat",
              maskPosition: "0px 0px",
              WebkitMaskImage: `url('${imgRectangle1}')`,
              WebkitMaskSize: "111.804px 22.909px",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "0px 0px",
            }}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 flex items-center px-6 md:px-12">
        <div className="max-w-[1293px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {step === 1 && (
                <StepProperty
                  selected={propertyType}
                  onSelect={(v) => {
                    setPropertyType(v as PropertyType);
                    setUnitType("");
                  }}
                />
              )}
              {step === 2 && propertyType && (
                <StepUnit
                  propertyType={propertyType as PropertyType}
                  unitType={unitType}
                  isResale={isResale}
                  onUnitChange={setUnitType}
                  onResaleChange={setIsResale}
                />
              )}
              {step === 3 && (
                <StepRooms selected={selectedRooms} onToggle={toggleRoom} />
              )}
              {step === 4 && isFullHomePath && (
                <StepFullHomeScope data={fullHomeScope} onChange={(u) => setFullHomeScope((p) => ({ ...p, ...u }))} />
              )}
              {step === 4 && !isFullHomePath && (
                <StepScope rooms={selectedRooms} scopes={roomScopes} onUpdate={updateScope} />
              )}
              {step === 5 && (
                <StepTimeline selected={timeline} onSelect={setTimeline} />
              )}
              {step === 6 && (
                <StepContact
                  data={contact}
                  onChange={(field, value) =>
                    setContact((p) => ({ ...p, [field]: value }))
                  }
                />
              )}
              {step === 7 && estimate && (
                <StepResults estimate={estimate} propertyType={propertyType} unitType={unitType} isResale={isResale} selectedRooms={selectedRooms} isFullHomePath={isFullHomePath} roomScopes={roomScopes} fullHomeScope={isFullHomePath ? fullHomeScope : null} timeline={timeline} quoteRequestId={quoteRequestId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer nav ── */}
      {step >= 1 && step <= 6 && (
        <footer className="px-6 md:px-12 pb-8 md:pb-10">
          <div className="max-w-[1293px] mx-auto">
            <div className="mb-6">
              <ProgressBar step={step} total={6} />
            </div>

            <div className="flex items-center justify-between mt-4">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-8 py-3 hover:bg-[#e8e4db] transition-colors"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={() => setStep(0)}
                  className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-8 py-3 hover:bg-[#e8e4db] transition-colors"
                >
                  Back
                </button>
              )}

              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790] tracking-[0.5px] uppercase">
                {step === 6 ? "Last step" : `Step ${step} of 6`}
              </p>

              <button
                onClick={step === 6 ? handleSubmit : handleNext}
                disabled={!canNext() || (step === 6 && submitting)}
                className={`font-['DM_Sans',sans-serif] font-medium text-[14px] text-white rounded-[10px] px-8 py-3 transition-all duration-200 ${
                  canNext() && !(step === 6 && submitting)
                    ? "bg-[#0f0f0d] hover:bg-[#0f0f0d]"
                    : "bg-[#d8d3c8] cursor-not-allowed"
                }`}
              >
                {step === 6
                  ? submitting
                    ? "Calculating..."
                    : "Get my cost guide"
                  : "Continue"}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
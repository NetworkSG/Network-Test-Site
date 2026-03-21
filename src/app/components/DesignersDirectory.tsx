import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, Star, MapPin, ChevronDown, ArrowRight, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Navbar } from "./Navbar";
import { FooterSection } from "./FooterSection";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReactLenis } from "lenis/react";
import imgRectangle647 from "figma:asset/76052c3a0de6dc113f1a421beb45eac4e773b8e8.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { resolveAsset } from "../utils/resolveAsset";

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
}

/* ─── MAP API DATA → CARD ─── */
function mapDesigner(d: any): DesignerCard {
  const stats = d.stats || {};
  const images = d.images || {};
  const coverProject = d.coverProject || {};
  const btoPackage = d.btoPackage || {};

  // Extract styles from coverProject.style and btoPackage.tags
  const styles: string[] = [];
  if (coverProject.style) styles.push(coverProject.style);
  if (btoPackage.tags?.length) {
    btoPackage.tags.forEach((t: string) => {
      if (!styles.includes(t)) styles.push(t);
    });
  }

  // Extract property types from btoPackage title/tags or default
  const propertyTypes: string[] = [];
  const allText = `${btoPackage.title || ""} ${(btoPackage.tags || []).join(" ")} ${d.bio || ""}`.toLowerCase();
  if (allText.includes("hdb") || allText.includes("bto")) propertyTypes.push("HDB");
  if (allText.includes("condo")) propertyTypes.push("Condo");
  if (allText.includes("landed")) propertyTypes.push("Landed");

  // Budget from btoPackage starting price
  const budget = btoPackage.startingPrice
    ? `From ${btoPackage.startingPrice}`
    : "";

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
    location: d.location || "",
    propertyTypes,
    styles,
    budget,
    verified: d.verified || false,
    yearsActive,
  };
}

const PROPERTY_FILTERS = ["All", "HDB", "Condo", "Landed"];
const STYLE_FILTERS = ["All Styles", "Scandinavian", "Minimalist", "Japandi", "Modern", "Industrial", "Luxury", "Contemporary"];
const BUDGET_FILTERS = ["Any Budget", "Under $40K", "$40K – $80K", "$80K – $150K", "$150K+"];
const SORT_OPTIONS = ["Most Reviewed", "Highest Rated", "Most Projects", "Newest"];

/* ─── FILTER DROPDOWN ─── */
function FilterDropdown({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-[100px] px-5 py-[10px] font-['Inter',sans-serif] text-[14px] text-[#09090b] transition-all hover:border-[#09090b]/30"
      >
        <span className={value === options[0] ? "text-[#71717a]" : "text-[#09090b] font-medium"}>{value}</span>
        <ChevronDown className={`w-4 h-4 text-[#71717a] transition-transform ${open ? "rotate-180" : ""}`} />
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
              className="absolute top-full left-0 mt-2 z-40 bg-white rounded-[14px] border border-[#F3F4F6] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] py-2 min-w-[180px]"
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-[10px] font-['Inter',sans-serif] text-[14px] transition-colors ${
                    value === opt ? "text-[#09090b] font-medium bg-[#F6F6F6]" : "text-[#71717a] hover:bg-[#F9FAFB]"
                  }`}
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

/* ─── DESIGNER CARD ─── */
function DesignerCardComponent({ designer, index }: { designer: DesignerCard; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => navigate(`/designer/${designer.slug}`)}
      className="group cursor-pointer bg-white rounded-[17px] border border-[#F3F4F6] shadow-[0px_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] transition-shadow duration-300 overflow-hidden"
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
          <div className="absolute top-3 left-3 bg-[#FFF6DC] border border-[#FFEAB1] rounded-[100px] px-3 py-[5px] flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.57 2.52L11.55 1.91L11.09 4.91L13.67 6.36L11.45 8.22L12.33 11.11L9.48 10.16L7.5 12.68L6.22 10L3.33 10.68L3.89 7.69L1.33 6L3.71 4.36L3.12 1.36L5.99 2.27L7 0Z" fill="#09090b"/>
            </svg>
            <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090b]">Verified</span>
          </div>
        )}

        {/* Project count pill */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-[100px] px-3 py-[5px]">
          <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#09090b]">
            {designer.projects} projects
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pb-6">
        {/* Name + Rating row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090b] tracking-[-0.5px] leading-[1.2] line-clamp-1">
            {designer.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-[14px] h-[14px] fill-[#FFCC55] text-[#FFCC55]" />
            <span className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#FFCC55]">{designer.rating}</span>
            <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB]">({designer.reviews})</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-['Inter',sans-serif] text-[14px] text-[#71717a] leading-[1.5] mb-4 line-clamp-2">
          {designer.tagline}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin className="w-[14px] h-[14px] text-[#ABABAB]" />
          <span className="font-['Inter',sans-serif] text-[13px] text-[#71717a]">{designer.location}</span>
          <span className="font-['Inter',sans-serif] text-[13px] text-[#ABABAB] ml-1">{designer.yearsActive}+ yrs</span>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-[6px] mb-5">
          {designer.propertyTypes.map((t) => (
            <span key={t} className="bg-[#F6F6F6] rounded-[100px] px-3 py-[5px] font-['Inter',sans-serif] text-[12px] text-[#09090b] font-medium">
              {t}
            </span>
          ))}
          {designer.styles.map((s) => (
            <span key={s} className="border border-[#E5E7EB] rounded-[100px] px-3 py-[5px] font-['Inter',sans-serif] text-[12px] text-[#71717a]">
              {s}
            </span>
          ))}
        </div>

        {/* Budget + CTA row */}
        <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6]">
          <div>
            <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] uppercase tracking-[0.5px]">Typical budget</span>
            <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#09090b] tracking-[-0.3px]">{designer.budget}</p>
          </div>
          <div className="bg-[#F6F6F6] border border-white rounded-[100px] p-[5px]">
            <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-1.5 px-4 py-[7px] transition-transform duration-200 group-hover:scale-[1.02]">
              <span className="font-['Inter',sans-serif] font-medium text-[13px] text-white tracking-[-0.5px]">View Profile</span>
              <ArrowRight className="w-[14px] h-[14px] text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export function DesignersDirectory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [styleFilter, setStyleFilter] = useState("All Styles");
  const [budgetFilter, setBudgetFilter] = useState("Any Budget");
  const [sortBy, setSortBy] = useState("Most Reviewed");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [designers, setDesigners] = useState<DesignerCard[]>([]);
  const [loading, setLoading] = useState(true);

  const activeFilterCount = [propertyFilter !== "All", styleFilter !== "All Styles", budgetFilter !== "Any Budget"].filter(Boolean).length;

  const filteredDesigners = useMemo(() => {
    let result = [...designers];

    // Search
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

    // Property filter
    if (propertyFilter !== "All") {
      result = result.filter((d) => d.propertyTypes.includes(propertyFilter));
    }

    // Style filter
    if (styleFilter !== "All Styles") {
      result = result.filter((d) => d.styles.some((s) => s.toLowerCase().includes(styleFilter.toLowerCase())));
    }

    // Budget filter
    if (budgetFilter !== "Any Budget") {
      // Simple heuristic based on min budget
      result = result.filter((d) => {
        const min = parseInt(d.budget.replace(/[^0-9]/g, ""));
        if (budgetFilter === "Under $40K") return min < 40;
        if (budgetFilter === "$40K – $80K") return min >= 28 && min <= 80;
        if (budgetFilter === "$80K – $150K") return min >= 60 && min <= 150;
        if (budgetFilter === "$150K+") return min >= 100;
        return true;
      });
    }

    // Sort
    if (sortBy === "Most Reviewed") result.sort((a, b) => b.reviews - a.reviews);
    if (sortBy === "Highest Rated") result.sort((a, b) => b.rating - a.rating);
    if (sortBy === "Most Projects") result.sort((a, b) => b.projects - a.projects);
    if (sortBy === "Newest") result.sort((a, b) => a.yearsActive - b.yearsActive);

    return result;
  }, [search, propertyFilter, styleFilter, budgetFilter, sortBy, designers]);

  const clearAllFilters = () => {
    setSearch("");
    setPropertyFilter("All");
    setStyleFilter("All Styles");
    setBudgetFilter("Any Budget");
    setSortBy("Most Reviewed");
  };

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await fetch(`${API}/designers`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        console.log("Designers API response:", json);
        const designersList = json.data || [];
        const mappedDesigners = designersList.map(mapDesigner);
        setDesigners(mappedDesigners);
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
      <div className="bg-[#f9fafb] min-h-screen font-['Inter',sans-serif] relative overflow-x-clip">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-[92px] z-40 pointer-events-none">
          <img alt="" className="size-full object-cover" src={imgRectangle647} />
        </div>
        <div
          className="fixed top-0 left-0 right-0 h-[120px] z-[39] pointer-events-none backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
          }}
        />

        <Navbar />

        {/* ─── HERO ─── */}
        <section className="pt-[180px] md:pt-[220px] pb-12 md:pb-16 px-4 md:px-8">
          <div className="max-w-[1170px] mx-auto text-center">
            {/* Section label pill */}
            <div className="inline-flex items-center bg-[#F6F6F6] border border-white rounded-[100px] px-5 py-2 mb-6">
              <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[16px] text-[#09090b] tracking-[-0.8px]">
                Interior Designers
              </span>
            </div>

            <h1 className="font-['Inter',sans-serif] font-semibold text-[40px] md:text-[64px] text-[#09090b] tracking-[-2px] md:tracking-[-3.2px] leading-[1.05] mb-2">
              Find Your Designer
            </h1>
            <p className="font-['Inter',sans-serif] font-medium text-[40px] md:text-[64px] text-[#71717a] tracking-[-2px] md:tracking-[-3.8px] leading-[1.05] mb-6 md:mb-8">
              Browse & Compare
            </p>
            <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] max-w-[520px] mx-auto leading-[1.6] mb-10 md:mb-14">
              Explore our curated directory of verified interior designers. Filter by style, budget, and property type to find your perfect match.
            </p>

            {/* Search bar */}
            <div className="max-w-[640px] mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#99A1AF]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, style, or location..."
                  className="w-full h-[54px] bg-white border border-[#E5E7EB] rounded-[100px] pl-13 pr-5 font-['Inter',sans-serif] text-[15px] text-[#09090b] placeholder:text-[#99A1AF] focus:outline-none focus:border-[#09090b]/30 transition-colors shadow-[0px_2px_12px_rgba(0,0,0,0.04)]"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-5 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-[#99A1AF] hover:text-[#09090b]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FILTERS + GRID ─── */}
        <section className="px-4 md:px-8 pb-20 md:pb-28">
          <div className="max-w-[1170px] mx-auto">
            {/* Filter bar — Desktop */}
            <div className="hidden md:flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {/* Property type pills */}
                <div className="flex items-center gap-[6px] mr-2">
                  {PROPERTY_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setPropertyFilter(f)}
                      className={`rounded-[100px] px-5 py-[10px] font-['Inter',sans-serif] text-[14px] transition-all ${
                        propertyFilter === f
                          ? "bg-[#09090b] text-white font-medium shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
                          : "bg-white border border-[#E5E7EB] text-[#09090b] hover:border-[#09090b]/30"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="w-px h-8 bg-[#E5E7EB]" />

                <FilterDropdown label="Style" options={STYLE_FILTERS} value={styleFilter} onChange={setStyleFilter} />
                <FilterDropdown label="Budget" options={BUDGET_FILTERS} value={budgetFilter} onChange={setBudgetFilter} />
              </div>

              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="font-['Inter',sans-serif] text-[13px] text-[#71717a] hover:text-[#09090b] underline transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <FilterDropdown label="Sort" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Filter bar — Mobile */}
            <div className="md:hidden mb-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-[100px] px-4 py-[10px] shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#09090b]" />
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#09090b] font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-[#09090b] text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {PROPERTY_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setPropertyFilter(f)}
                    className={`rounded-[100px] px-4 py-[10px] font-['Inter',sans-serif] text-[13px] shrink-0 transition-all ${
                      propertyFilter === f
                        ? "bg-[#09090b] text-white font-medium"
                        : "bg-white border border-[#E5E7EB] text-[#09090b]"
                    }`}
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
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] p-6 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090b] tracking-[-0.5px]">Filters</h3>
                      <button onClick={() => setShowMobileFilters(false)}>
                        <X className="w-6 h-6 text-[#09090b]" />
                      </button>
                    </div>

                    {/* Style */}
                    <div className="mb-6">
                      <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] mb-3 block">Style</label>
                      <div className="flex flex-wrap gap-2">
                        {STYLE_FILTERS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStyleFilter(s)}
                            className={`rounded-[100px] px-4 py-[9px] font-['Inter',sans-serif] text-[13px] transition-all ${
                              styleFilter === s
                                ? "bg-[#09090b] text-white font-medium"
                                : "bg-[#F6F6F6] text-[#09090b]"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="mb-8">
                      <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] mb-3 block">Budget</label>
                      <div className="flex flex-wrap gap-2">
                        {BUDGET_FILTERS.map((b) => (
                          <button
                            key={b}
                            onClick={() => setBudgetFilter(b)}
                            className={`rounded-[100px] px-4 py-[9px] font-['Inter',sans-serif] text-[13px] transition-all ${
                              budgetFilter === b
                                ? "bg-[#09090b] text-white font-medium"
                                : "bg-[#F6F6F6] text-[#09090b]"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="mb-8">
                      <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] mb-3 block">Sort by</label>
                      <div className="flex flex-wrap gap-2">
                        {SORT_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className={`rounded-[100px] px-4 py-[9px] font-['Inter',sans-serif] text-[13px] transition-all ${
                              sortBy === s
                                ? "bg-[#09090b] text-white font-medium"
                                : "bg-[#F6F6F6] text-[#09090b]"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={clearAllFilters}
                        className="flex-1 h-[48px] rounded-[14px] border border-[#E5E7EB] font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b]"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 h-[48px] rounded-[14px] bg-[#09090b] font-['Inter',sans-serif] font-semibold text-[14px] text-white"
                      >
                        Show Results
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="font-['Inter',sans-serif] text-[14px] text-[#71717a]">
                Showing <span className="font-semibold text-[#09090b]">{filteredDesigners.length}</span> designer{filteredDesigners.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* ─── GRID ─── */}
            {loading ? (
              <div className="text-center py-20">
                <Loader2 className="w-16 h-16 text-[#09090b] animate-spin mx-auto mb-5" />
                <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090b] tracking-[-0.5px] mb-2">
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
                <div className="w-16 h-16 bg-[#F6F6F6] rounded-full flex items-center justify-center mx-auto mb-5">
                  <Search className="w-6 h-6 text-[#ABABAB]" />
                </div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090b] tracking-[-0.5px] mb-2">
                  No designers found
                </h3>
                <p className="font-['Inter',sans-serif] text-[15px] text-[#71717a] mb-6 max-w-[360px] mx-auto">
                  Try adjusting your filters or search terms to see more results.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* ─── BOTTOM CTA ─── */}
            <div className="mt-16 md:mt-24 text-center">
              <div className="bg-white rounded-[29px] border border-[#F3F4F6] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] p-10 md:p-16 max-w-[900px] mx-auto">
                <h2 className="font-['Inter',sans-serif] font-semibold text-[28px] md:text-[40px] text-[#09090b] tracking-[-1.5px] md:tracking-[-2px] leading-[1.1] mb-2">
                  Not sure where to start?
                </h2>
                <p className="font-['Inter',sans-serif] font-medium text-[28px] md:text-[40px] text-[#71717a] tracking-[-1.5px] md:tracking-[-2px] leading-[1.1] mb-5 md:mb-6">
                  Let us match you.
                </p>
                <p className="font-['Inter',sans-serif] text-[15px] md:text-[18px] text-[#71717a] max-w-[440px] mx-auto leading-[1.6] mb-8">
                  Answer a few quick questions and we'll recommend designers tailored to your project, style, and budget.
                </p>
                <div
                  onClick={() => navigate("/get-matched")}
                  className="bg-[#F6F6F6] border border-white rounded-[100px] inline-block p-[7px] cursor-pointer"
                >
                  <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-2 px-8 py-4">
                    <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                      Get Matched Free
                    </span>
                    <ArrowRight className="w-[18px] h-[18px] text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FooterSection showCTA={false} />

        {/* Bottom blur */}
        <div
          className="fixed bottom-0 left-0 right-0 h-[80px] z-[39] pointer-events-none backdrop-blur-xl"
          style={{
            maskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 30%, transparent 100%)",
          }}
        />
      </div>
    </ReactLenis>
  );
}
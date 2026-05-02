import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, X, ChevronLeft, ChevronRight, ArrowUp, ArrowRight, Star, BadgeCheck,
  ChevronDown, CheckCircle,
  Hammer, Layers, Square as SquareIcon, Wind, Zap, Droplet, Paintbrush, Lightbulb,
  LayoutPanelTop,
} from "lucide-react";
import { C, serif, sans, FadeIn, TagLabel } from "./homepage/v8/primitives";
import { useIsFloorPlan } from "../utils/floor-plan-detect";
import { SiteNav } from "./SiteNav";
import { useDesignerData } from "./useDesignerData";
import { transformApiData } from "./DesignerProfile";
import logoMarkImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { Seo } from "./shared/Seo";
import { projectId as supaProjectId, publicAnonKey } from "/utils/supabase/info";

const SUPABASE_STORAGE = `https://${supaProjectId}.supabase.co/storage/v1/object/public/`;

function resolveImg(src: string | undefined) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `${SUPABASE_STORAGE}${src}`;
}

const WORKS_MAP: Record<string, { icon: any; label: string }> = {
  carpentry: { icon: Hammer, label: "Carpentry" },
  "feature-wall": { icon: Layers, label: "Feature Wall" },
  tiling: { icon: SquareIcon, label: "Tiling" },
  aircon: { icon: Wind, label: "Aircon" },
  electrical: { icon: Zap, label: "Electrical Rewiring" },
  plumbing: { icon: Droplet, label: "Plumbing" },
  painting: { icon: Paintbrush, label: "Painting" },
  lighting: { icon: Lightbulb, label: "Lighting" },
};

// ─── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: {
  images: string[]; currentIndex: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "ArrowRight") onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
  }, [handleKeyDown]);

  // Render via portal into document.body so position:fixed resolves against
  // the viewport, not the transformed <main> ancestor (which would otherwise
  // push the lightbox into an off-screen position).
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(15,15,13,0.95)" }} onClick={onClose}>
      <button className="absolute top-5 right-5 z-[110] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2" onClick={onClose}><X size={22} /></button>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[110] text-white/70 text-[12px] tracking-[0.12em] uppercase font-medium" style={{ fontFamily: sans }}>{currentIndex + 1} / {images.length}</div>
      {images.length > 1 && <button className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft size={24} /></button>}
      <div className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={images[currentIndex]} alt="" className="max-w-[92vw] max-h-[88vh] object-contain" style={{ borderRadius: "12px" }} />
      </div>
      {images.length > 1 && <button className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3" onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight size={24} /></button>}
    </div>,
    document.body,
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
function ThumbnailCarousel({
  images,
  activeIndex,
  onSelect,
}: {
  images: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [updateArrows, images.length]);

  // Keep the active thumb visible as the main image changes.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>(`[data-thumb-index="${activeIndex}"]`);
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeIndex]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="mt-4 relative">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" as any }}
      >
        <style>{`.thumb-carousel::-webkit-scrollbar { display: none; }`}</style>
        {images.map((img, i) => (
          <button
            key={i}
            data-thumb-index={i}
            onClick={() => onSelect(i)}
            className="relative overflow-hidden transition-all shrink-0 snap-start"
            style={{
              borderRadius: "10px",
              border: `1px solid ${i === activeIndex ? C.black : C.creamBorder}`,
              height: "clamp(60px, 9vw, 92px)",
              width: "clamp(90px, 13vw, 140px)",
              opacity: i === activeIndex ? 1 : 0.7,
            }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {canPrev && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous thumbnails"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white rounded-full shadow-md p-2 hover:bg-[#fafafa] transition-colors"
          style={{ border: `1px solid ${C.creamBorder}` }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next thumbnails"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white rounded-full shadow-md p-2 hover:bg-[#fafafa] transition-colors"
          style={{ border: `1px solid ${C.creamBorder}` }}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

export function ProjectPage() {
  const { slug, projectId: projectIdParam } = useParams();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Fetch designer data
  const { data: apiData, loading } = useDesignerData(slug);
  const ctxValue = useMemo(() => apiData ? transformApiData(apiData) : null, [apiData]);

  // Find the matching project
  const project = useMemo(() => {
    if (!ctxValue?.projects?.length || !projectIdParam) return null;
    const decoded = decodeURIComponent(projectIdParam);
    return ctxValue.projects.find((p: any) => p.name === decoded) || null;
  }, [ctxValue, projectIdParam]);

  // Other projects from same designer (exclude current)
  const otherProjects = useMemo(() => {
    if (!ctxValue?.projects?.length || !project) return [];
    return ctxValue.projects.filter((p: any) => p.name !== project.name);
  }, [ctxValue, project]);

  // Designer info
  const firmName = ctxValue?.profile?.name || "Designer";
  const firmLogo = ctxValue?.profile?.images?.logo ? resolveImg(ctxValue.profile.images.logo) : null;
  const firmInitials = firmName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const firmSlug = slug || "";
  const isVerified = ctxValue?.profile?.verified ?? false;
  const stats = ctxValue?.profile?.stats;
  const location = ctxValue?.profile?.location || "Singapore";

  // Project images — cover + gallery
  const projectImage = resolveImg(project?.coverImage || project?.img || project?.image);
  const galleryImages = (project?.gallery || []).map((g: any) => resolveImg(g.src || g)).filter(Boolean);
  const rawImages = [projectImage, ...galleryImages].filter(Boolean);
  const rawCaptions = ["", ...(project?.gallery || []).map((g: any) => g.caption || "")];
  const explicitFloorPlan = project?.floorPlan ? resolveImg(project.floorPlan) : "";
  // Auto-detect floor plan in the first image when the project doesn't have an
  // explicit floorPlan field. Qanvast imports historically dropped the floor
  // plan into the cover slot, so we look at images[0] only and check whether
  // the pixels are near-grayscale (typical of architectural plans).
  const autoDetected = useIsFloorPlan(!explicitFloorPlan ? rawImages[0] || "" : "");
  const detectedAsFloorPlan = autoDetected === true && !explicitFloorPlan && !!rawImages[0];
  const projectFloorPlan = explicitFloorPlan || (detectedAsFloorPlan ? rawImages[0] : "");
  // Always hide the floor plan from the scrolling gallery — only the Floor Plan
  // button + modal should ever show it. Filter by URL so it works regardless of
  // whether the floor plan came from explicit data or auto-detection.
  const images = projectFloorPlan
    ? rawImages.filter((u) => u !== projectFloorPlan)
    : rawImages;
  const galleryCaptions = projectFloorPlan
    ? rawImages.map((u, i) => rawCaptions[i]).filter((_, i) => rawImages[i] !== projectFloorPlan).slice(1)
    : rawCaptions.slice(1);

  // Rich metadata
  const projectLocation = project?.location || "";
  const projectCost = project?.cost || "";
  const projectSize = project?.size || "";
  const projectYear = project?.year || "";
  const projectPropertyType = project?.propertyTypeDisplay || project?.propertyType || "";
  const projectStyle = project?.style || "";
  const worksIncluded: string[] = project?.worksIncluded || [];

  // Build metadata cards from available fields
  const metaCards = [
    { label: "Renovation Cost", value: projectCost },
    { label: "Area Size", value: projectSize },
    { label: "Year of Completion", value: projectYear },
    { label: "Property Type", value: projectPropertyType },
    { label: "Interior Style", value: projectStyle },
  ].filter((m) => m.value);

  // Breadcrumbs
  const breadcrumbs = [
    { label: "Designers", href: "/interior-designers" },
    { label: firmName, href: `/designer/${firmSlug}` },
    { label: project?.name || "Project" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <div className="w-8 h-8 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans }}>
        <SiteNav logoImg={logoMarkImg} />
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-20 text-center">
          <h1 className="text-[28px] mb-4" style={{ fontFamily: serif, color: C.black }}>Project not found</h1>
          <p className="text-[15px] mb-8" style={{ color: C.gray }}>This project may have been removed or the link is incorrect.</p>
          <Link
            to={slug ? `/designer/${slug}` : "/interior-designers"}
            className="inline-flex items-center gap-2 h-[48px] px-7 text-[14px] font-medium hover:opacity-85"
            style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans }}
          >
            <ChevronLeft size={15} /> Back to {firmName}
          </Link>
        </div>
      </div>
    );
  }

  const projectName = project?.name || "Project";
  const projectMeta = project?.meta || "";
  const seoDesc = `${projectName} by ${firmName} — ${projectMeta || "Singapore interior design project"}. See full photos, scope, and request a quote on Network.`;

  return (
    <div className="min-h-screen" style={{ background: C.cream, color: C.black, fontFamily: sans }}>
      <Seo
        title={`${projectName} — ${firmName} | Network`}
        description={seoDesc.slice(0, 200)}
        canonical={`/designer/${slug || ""}/project/${projectIdParam || ""}`}
      />
      <SiteNav logoImg={logoMarkImg} />

      {/* ═══ BREADCRUMB ══════════════════════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-8">
        <nav className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px]" style={{ color: C.gray, fontFamily: sans }}>
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {b.href ? (
                <Link to={b.href} className="hover:opacity-70 transition-opacity" style={{ color: C.gray }}>{b.label}</Link>
              ) : (
                <span style={{ color: C.black }}>{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span style={{ color: C.grayLight }}>/</span>}
            </span>
          ))}
        </nav>
      </div>

      {/* ═══ HERO ════════════════════════════════════════════════════════════ */}
      <FadeIn>
        <section className="max-w-[1280px] mx-auto px-6 md:px-10 pt-8 pb-[60px] md:pb-[80px]">
          <div className="mb-6">
            <TagLabel>Renovation Project</TagLabel>
            <h1
              className="mt-3"
              style={{
                fontFamily: serif,
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: C.black,
              }}
            >
              {project.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ color: C.gray }}>
              <Link to={`/designer/${firmSlug}`} className="text-[15px] hover:opacity-70 transition-opacity flex items-center gap-2">
                {firmLogo ? (
                  <img src={firmLogo} alt={firmName} className="w-7 h-7 rounded-full object-cover" style={{ border: `1px solid ${C.creamBorder}` }} />
                ) : (
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: C.creamDark, color: C.black, border: `1px solid ${C.creamBorder}` }}>{firmInitials}</span>
                )}
                <span style={{ color: C.black }}>{firmName}</span>
              </Link>
              {(projectLocation || location) && <span className="flex items-center gap-1.5 text-[14px]"><MapPin size={14} /> {projectLocation || location}</span>}
            </div>
          </div>

          {/* Main image */}
          {projectImage && (
            <div
              className="relative overflow-hidden cursor-pointer group"
              style={{
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "12px",
                background: C.white,
                height: "clamp(360px, 55vw, 620px)",
              }}
              onClick={() => setLightboxIndex(activeImage)}
            >
              <img
                src={images[activeImage] || projectImage}
                alt={project.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {galleryCaptions[activeImage - 1] && (
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4" style={{ background: "linear-gradient(to top, rgba(15,15,13,0.55) 0%, rgba(15,15,13,0) 100%)" }}>
                  <span className="text-white text-[13px]" style={{ fontFamily: sans }}>{galleryCaptions[activeImage - 1]}</span>
                </div>
              )}
              {projectFloorPlan && !floorPlanOpen && (
                isDesktop ? (
                  <motion.button
                    layoutId="floor-plan-card"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFloorPlanOpen(true); }}
                    className="absolute bottom-5 left-5 overflow-hidden cursor-pointer"
                    style={{
                      width: "120px",
                      height: "90px",
                      background: C.white,
                      border: "none",
                      padding: 0,
                      borderRadius: "10px",
                      boxShadow: "0 4px 14px rgba(15,15,13,0.28)",
                    }}
                    aria-label="View floor plan"
                    whileHover={{ scale: 1.04 }}
                    transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
                  >
                    <motion.img
                      layoutId="floor-plan-image"
                      src={projectFloorPlan}
                      alt={`${project.name} floor plan thumbnail`}
                      className="w-full h-full object-contain"
                      style={{ background: C.white }}
                      transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center gap-1.5 pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, rgba(15,15,13,0.85) 0%, rgba(15,15,13,0) 100%)",
                        color: C.white,
                      }}
                    >
                      <LayoutPanelTop size={11} strokeWidth={2.5} />
                      <span className="text-[10px] font-semibold tracking-wide" style={{ fontFamily: sans }}>Floor Plan</span>
                    </div>
                  </motion.button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFloorPlanOpen(true); }}
                    className="absolute bottom-4 left-4 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      height: "40px",
                      padding: "0 14px",
                      background: "rgba(255,255,255,0.95)",
                      color: C.black,
                      border: "none",
                      borderRadius: "10px",
                      fontFamily: sans,
                      fontSize: "13px",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(15,15,13,0.18)",
                    }}
                    aria-label="View floor plan"
                  >
                    <LayoutPanelTop size={16} strokeWidth={2} />
                    <span>Floor Plan</span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Floor plan modal — portaled to body so ancestor transforms don't break fixed positioning. Image shares a layoutId with the thumbnail for the zoom transition. */}
          {projectFloorPlan && createPortal(
            <AnimatePresence>
              {floorPlanOpen && (
                <motion.div
                  key="fp-backdrop"
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                  initial={{ backgroundColor: "rgba(15,15,13,0)" }}
                  animate={{ backgroundColor: "rgba(15,15,13,0.85)" }}
                  exit={{ backgroundColor: "rgba(15,15,13,0)" }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setFloorPlanOpen(false)}
                >
                  <motion.div
                    {...(isDesktop ? { layoutId: "floor-plan-card" } : { initial: { scale: 0.92, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 } })}
                    className="relative w-full max-w-[920px] max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: C.white, borderRadius: "16px" }}
                    onClick={(e) => e.stopPropagation()}
                    transition={{ duration: 0.3, layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
                  >
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.creamBorder}` }}>
                      <div className="flex items-center gap-2">
                        <LayoutPanelTop size={18} style={{ color: C.black }} />
                        <h3 className="text-[15px] font-semibold" style={{ color: C.black, fontFamily: sans }}>Floor Plan</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFloorPlanOpen(false)}
                        aria-label="Close floor plan"
                        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"
                        style={{ background: C.cream, color: C.black, border: "none" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto flex items-center justify-center" style={{ background: C.cream }}>
                      <motion.img
                        {...(isDesktop ? { layoutId: "floor-plan-image" } : {})}
                        src={projectFloorPlan}
                        alt={`${project.name} floor plan`}
                        className="w-full h-auto object-contain"
                        transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Thumbnail carousel */}
          {images.length > 1 && (
            <ThumbnailCarousel
              images={images}
              activeIndex={activeImage}
              onSelect={setActiveImage}
            />
          )}
        </section>
      </FadeIn>

      {/* ═══ PROJECT METADATA + WORKS INCLUDED + LEAD FORM ═══════════════════ */}
      <FadeIn>
        <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-[60px] md:pb-[80px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left column — metadata + works included */}
            <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
              {/* Metadata card */}
              {metaCards.length > 0 && (
                <div
                  className="grid grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden"
                  style={{
                    background: C.creamBorder,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: "12px",
                  }}
                >
                  {metaCards.map((m) => (
                    <div key={m.label} className="p-5 md:p-6" style={{ background: C.white }}>
                      <TagLabel>{m.label}</TagLabel>
                      <p className="mt-2" style={{ fontFamily: serif, fontSize: "20px", lineHeight: 1.25, color: C.black }}>{m.value}</p>
                    </div>
                  ))}
                  {/* Designer name tile */}
                  <div className="p-5 md:p-6" style={{ background: C.white }}>
                    <TagLabel>Interior Designer</TagLabel>
                    <p className="mt-2" style={{ fontFamily: serif, fontSize: "20px", lineHeight: 1.25, color: C.black }}>
                      {project?.designerName || firmName}
                    </p>
                  </div>
                </div>
              )}

              {/* Works Included */}
              {worksIncluded.length > 0 && (
                <div>
                  <div className="mb-6">
                    <TagLabel>Scope of Work</TagLabel>
                    <h2 className="mt-3" style={{ fontFamily: serif, fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1.15, letterSpacing: "-0.01em", color: C.black }}>
                      Works Included
                    </h2>
                  </div>
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                    style={{
                      padding: "28px 24px",
                      background: C.white,
                      border: `1px solid ${C.creamBorder}`,
                      borderRadius: "12px",
                    }}
                  >
                    {worksIncluded.map((key) => {
                      const work = WORKS_MAP[key];
                      if (!work) return null;
                      const Icon = work.icon;
                      return (
                        <div key={key} className="flex flex-col items-center gap-3 text-center">
                          <div
                            className="w-14 h-14 flex items-center justify-center rounded-full"
                            style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
                          >
                            <Icon size={22} style={{ color: C.black }} strokeWidth={1.6} />
                          </div>
                          <span className="text-[12px]" style={{ color: C.gray, fontFamily: sans }}>{work.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — sticky lead form */}
            <div className="lg:col-span-1">
              <LeadFormCard firmName={firmName} />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ DESIGNER PROFILE SNIPPET ═══════════════════════════════════════ */}
      <FadeIn>
        <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-[80px] md:pb-[100px]">
          <div className="mb-8">
            <TagLabel>About the Designer</TagLabel>
            <h2 className="mt-3" style={{ fontFamily: serif, fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1.15, letterSpacing: "-0.01em", color: C.black }}>
              {firmName}
            </h2>
          </div>

          <div
            className="p-6 md:p-8"
            style={{
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "12px",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
              {/* Avatar */}
              {firmLogo ? (
                <img src={firmLogo} alt={firmName} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shrink-0" style={{ border: `1px solid ${C.creamBorder}` }} />
              ) : (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, fontFamily: serif, fontSize: "32px", color: C.black }}
                >
                  {firmInitials}
                </div>
              )}

              {/* Firm details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 style={{ fontFamily: serif, fontSize: "24px", color: C.black }}>{firmName}</h3>
                  {isVerified && <BadgeCheck size={18} style={{ color: C.black }} />}
                </div>

                {/* Rating + project count */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-3">
                  {stats?.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} fill={C.black} style={{ color: C.black }} />
                      <span className="text-[14px] font-semibold" style={{ color: C.black }}>{stats.rating}</span>
                      {stats.reviewCount && <span className="text-[13px]" style={{ color: C.gray }}>({stats.reviewCount} reviews)</span>}
                    </div>
                  )}
                  {stats?.projectCount && <span className="text-[13px]" style={{ color: C.gray }}>{stats.projectCount} projects</span>}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 shrink-0 md:items-end">
                <Link
                  to={`/designer/${firmSlug}`}
                  className="h-[52px] px-7 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
                >
                  View Portfolio <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ═══ MORE PROJECTS ══════════════════════════════════════════════════ */}
      {otherProjects.length > 0 && (
        <FadeIn>
          <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-[80px] md:pb-[100px]">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <TagLabel>More Inspiration</TagLabel>
                <h2
                  className="mt-3"
                  style={{
                    fontFamily: serif,
                    fontSize: "clamp(28px, 3.5vw, 40px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.01em",
                    color: C.black,
                  }}
                >
                  More Projects by {firmName}
                </h2>
              </div>
              <Link
                to={`/designer/${firmSlug}`}
                className="text-[13px] hover:opacity-70 transition-opacity flex items-center gap-1.5 shrink-0"
                style={{ color: C.gray, fontFamily: sans }}
              >
                View All Projects <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherProjects.slice(0, 4).map((p: any) => (
                <Link
                  key={p.name}
                  to={`/designer/${firmSlug}/project/${encodeURIComponent(p.name)}`}
                  className="group block overflow-hidden cursor-pointer"
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: "12px",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
                    <img
                      src={resolveImg(p.img || p.image)}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-5">
                    <h3
                      className="mb-1.5"
                      style={{ fontFamily: serif, fontSize: "20px", lineHeight: 1.25, color: C.black }}
                    >
                      {p.name}
                    </h3>
                    {p.meta && (
                      <p className="text-[12px]" style={{ color: C.gray, fontFamily: sans }}>
                        {p.meta}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* ═══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="px-6 md:px-10 py-10 md:py-14" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <a href="/" className="block shrink-0" style={{
              width: "110px", height: "23px", background: C.black,
              maskImage: `url('${logoMarkImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
              WebkitMaskImage: `url('${logoMarkImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
            }} />
            <span className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
              © 2026 Network. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* ═══ BACK TO TOP ═════════════════════════════════════════════════════ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-85"
        style={{ background: C.black, boxShadow: "0 4px 16px rgba(15,15,13,0.18)" }}
        aria-label="Back to top"
      >
        <ArrowUp size={16} className="text-white" />
      </button>

      {/* ═══ LIGHTBOX ════════════════════════════════════════════════════════ */}
      {lightboxIndex !== null && images.length > 0 && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => i === null ? null : (i - 1 + images.length) % images.length)}
          onNext={() => setLightboxIndex((i) => i === null ? null : (i + 1) % images.length)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// LEAD FORM CARD
// ════════════════════════════════════════════════════════════════════════════════
function LeadFormCard({ firmName }: { firmName: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", propertyType: "", budget: "", keyCollection: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="lg:sticky lg:top-[80px] p-6 md:p-7"
      style={{
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: "12px",
      }}
    >
      {submitted ? (
        <div className="py-10 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: C.cream, border: `1px solid ${C.creamBorder}` }}
          >
            <CheckCircle size={26} style={{ color: C.black }} />
          </div>
          <h3 style={{ fontFamily: serif, fontSize: "22px", color: C.black }}>Enquiry sent</h3>
          <p className="text-[14px] leading-[1.55] max-w-[260px]" style={{ color: C.gray, fontFamily: sans }}>
            {firmName} will review your details and reply within 1–2 business days.
          </p>
        </div>
      ) : (
        <>
          <h3 style={{ fontFamily: serif, fontSize: "24px", lineHeight: 1.2, color: C.black }}>
            Get a Free Quote
          </h3>
          <p className="mt-2 text-[14px] leading-[1.55]" style={{ color: C.gray, fontFamily: sans }}>
            Speak with {firmName} within 24 hours. No hard sell, just honest advice.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
            <LeadField label="Name" type="text" placeholder="Your full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <LeadPhoneField value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <LeadField label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <div className="grid grid-cols-2 gap-3">
              <LeadSelect label="Property Type" value={form.propertyType} options={["HDB", "Condominium", "Landed", "Commercial"]} onChange={(v) => setForm({ ...form, propertyType: v })} />
              <LeadSelect label="Budget (S$)" value={form.budget} options={["Under S$30k", "S$30k–S$60k", "S$60k–S$100k", "S$100k–S$150k", "S$150k+"]} onChange={(v) => setForm({ ...form, budget: v })} />
            </div>
            <LeadSelect label="Key Collection" value={form.keyCollection} options={["Keys Collected", "Within 3 months", "3–6 months", "6–12 months", "More than 12 months"]} onChange={(v) => setForm({ ...form, keyCollection: v })} />

            <button
              type="submit"
              className="h-[52px] mt-1 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}
            >
              Send Enquiry <ArrowRight size={15} />
            </button>
            <p className="text-center text-[11px] mt-1" style={{ color: C.grayLight, fontFamily: sans }}>
              Free consultation · No obligation · Confidential
            </p>
          </form>
        </>
      )}
    </div>
  );
}

function LeadField({
  label, type, placeholder, value, onChange, required,
}: {
  label: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[48px] px-4 text-[14px] focus-visible:outline-none transition-colors"
        style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }}
        onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
      />
    </div>
  );
}

function LeadPhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Phone</label>
      <div className="flex">
        <span
          className="inline-flex items-center justify-center h-[48px] px-3.5 text-[14px] shrink-0"
          style={{ background: C.creamDark, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}`, borderLeft: `1px solid ${C.creamBorder}`, borderRadius: "10px 0 0 10px", color: C.grayLight, fontFamily: sans }}
        >
          +65
        </span>
        <input
          type="tel"
          required
          maxLength={8}
          value={value}
          placeholder="9123 4567"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="flex-1 h-[48px] px-4 text-[14px] focus-visible:outline-none transition-colors"
          style={{ background: C.cream, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}`, borderRight: `1px solid ${C.creamBorder}`, borderLeft: "none", borderRadius: "0 10px 10px 0", color: C.black, fontFamily: sans }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
      </div>
    </div>
  );
}

function LeadSelect({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block mb-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none h-[48px] px-4 pr-10 text-[14px] focus-visible:outline-none transition-colors"
          style={{ background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: value ? C.black : C.grayLight, fontFamily: sans }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        >
          <option value="" disabled>Select</option>
          {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.grayLight }} />
      </div>
    </div>
  );
}

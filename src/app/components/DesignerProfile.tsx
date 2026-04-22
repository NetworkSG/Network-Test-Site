import { useState, useRef, useCallback, useEffect, createContext, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router";
import { sanitizeInput, sanitizeEmail } from "../utils/sanitize";
import { Navbar } from "./Navbar";
import { DesignerProfileFooter } from "./DesignerProfileFooter";
import { SiteNav } from "./SiteNav";
import { FOOTER } from "./homepage/content";
import { C, serif, sans, FadeIn, TagLabel } from "./homepage/v8/primitives";
import { useDesignerData } from "./useDesignerData";
import { useGoogleReviews } from "./useGoogleReviews";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import logoMarkImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

// All Figma assets
import imgCover from "figma:asset/e4acf7c6e5d5f1811aa7429b53350cf1b67c5f4e.png";
import imgLogo from "figma:asset/aa188101b5fbbac719eb441e4b9accb610458b0c.png";
import imgChloe from "figma:asset/026b3e78c31a76fc3722139c09208c6cc7d88bef.png";
import imgMarcus from "figma:asset/cea54ef0f554c631157697f929f8165a7aa20f93.png";
import imgSuLin from "figma:asset/764080aebb8990bae415c1d32da309e78b076802.png";
import imgHafiz from "figma:asset/f13abbb8a968f0d63754415ad9d7f0e5a067d7a9.png";
import imgAiken from "figma:asset/772d5ab73165b6c6919706089e98ec03e7c8d086.png";
import imgRachel from "figma:asset/a3218feba2b82b2fde4d5ba04b711e31e28c2bba.png";
import imgFelicia from "figma:asset/de1f917c8bf2b7a9d1ce0dd9b4cb7ea763a941c2.png";
import imgWoodlands from "figma:asset/ffd9ddd9c56ad6f3d25ba20494e45bfec9148e73.png";
import imgHdb from "figma:asset/353919418b571292ef4b918498a0af1081842bf9.png";
import imgBca from "figma:asset/e75107ea0a4bae3c90b327e26766d1616f06a552.png";
import imgProject1 from "figma:asset/0fc1637b7695f77c9a097438445025b14c96f5ea.png";
import imgProject2 from "figma:asset/bf7d0cf68bdcc66437a7818f2fc4ab1a7e5ea3c2.png";
import imgCaseStudy1 from "figma:asset/236738fc0010876d79202e07c551861413d12dd6.png";
import imgCaseStudy2 from "figma:asset/0463a32823a04486d6fd9c60bda1c48ae00b08c5.png";
import imgCaseStudy3 from "figma:asset/1180c2e58a96bb22ca91228fda602596c093082a.png";
import imgCaseStudy4 from "figma:asset/33fe462b9db17890de38439d66dfffcaad5f4c80.png";
import imgVideo from "figma:asset/cc50b8df382d8beabfb66e5f78006760af98950e.png";
import imgGoogle from "figma:asset/9d8e189b03a63d29ac5b3a7d20746b2e0a65c2ed.png";
import imgReview1 from "figma:asset/8e4350324e724a21b5e34ff048fc9e3409e5bda6.png";
import imgReview2 from "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png";
import imgReview3 from "figma:asset/7faf17d5deb54541e63777bc7ad7d74990b0b1dd.png";
import imgReview4 from "figma:asset/3bf4f3e38477a9fe4019ae13c814f9abec16f515.png";
import imgReview5 from "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png";
import imgMap from "figma:asset/d920b76cda9183f0e3d76af83d25ee01ebb6afb9.png";
import svgPaths from "../../imports/svg-73ttrm48v1";
import { motion } from "motion/react";

/* ─── PLACEHOLDER IMAGES (neutral, non-Sora) ─── */
export const PLACEHOLDER_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23e5e2dc'/%3E%3Cstop offset='100%25' stop-color='%23d8d3c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='500'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-family='Inter,sans-serif' font-size='20' fill='%239a9790'%3EUpload your cover image%3C/text%3E%3C/svg%3E";
export const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect fill='%230f0f0d' width='160' height='160' rx='80'/%3E%3C/svg%3E";
export const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect fill='%23f0ede6' width='160' height='160'/%3E%3Ccircle cx='80' cy='62' r='26' fill='%23d8d3c8'/%3E%3Cpath d='M30 140 Q80 90 130 140 Z' fill='%23d8d3c8'/%3E%3C/svg%3E";
export const PLACEHOLDER_MEDIA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23f0ede6' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-family='Inter,sans-serif' font-size='18' fill='%239a9790'%3EUpload an image%3C/text%3E%3C/svg%3E";

/* ─── IMAGE MAP: maps KV store figma:asset references → resolved import URLs ─── */
const IMAGE_MAP: Record<string, string> = {
  "figma:asset/e4acf7c6e5d5f1811aa7429b53350cf1b67c5f4e.png": imgCover,
  "figma:asset/aa188101b5fbbac719eb441e4b9accb610458b0c.png": imgLogo,
  "figma:asset/026b3e78c31a76fc3722139c09208c6cc7d88bef.png": imgChloe,
  "figma:asset/cea54ef0f554c631157697f929f8165a7aa20f93.png": imgMarcus,
  "figma:asset/764080aebb8990bae415c1d32da309e78b076802.png": imgSuLin,
  "figma:asset/f13abbb8a968f0d63754415ad9d7f0e5a067d7a9.png": imgHafiz,
  "figma:asset/772d5ab73165b6c6919706089e98ec03e7c8d086.png": imgAiken,
  "figma:asset/a3218feba2b82b2fde4d5ba04b711e31e28c2bba.png": imgRachel,
  "figma:asset/de1f917c8bf2b7a9d1ce0dd9b4cb7ea763a941c2.png": imgFelicia,
  "figma:asset/ffd9ddd9c56ad6f3d25ba20494e45bfec9148e73.png": imgWoodlands,
  "figma:asset/353919418b571292ef4b918498a0af1081842bf9.png": imgHdb,
  "figma:asset/e75107ea0a4bae3c90b327e26766d1616f06a552.png": imgBca,
  "figma:asset/0fc1637b7695f77c9a097438445025b14c96f5ea.png": imgProject1,
  "figma:asset/bf7d0cf68bdcc66437a7818f2fc4ab1a7e5ea3c2.png": imgProject2,
  "figma:asset/236738fc0010876d79202e07c551861413d12dd6.png": imgCaseStudy1,
  "figma:asset/0463a32823a04486d6fd9c60bda1c48ae00b08c5.png": imgCaseStudy2,
  "figma:asset/1180c2e58a96bb22ca91228fda602596c093082a.png": imgCaseStudy3,
  "figma:asset/33fe462b9db17890de38439d66dfffcaad5f4c80.png": imgCaseStudy4,
  "figma:asset/cc50b8df382d8beabfb66e5f78006760af98950e.png": imgVideo,
  "figma:asset/9d8e189b03a63d29ac5b3a7d20746b2e0a65c2ed.png": imgGoogle,
  "figma:asset/8e4350324e724a21b5e34ff048fc9e3409e5bda6.png": imgReview1,
  "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png": imgReview2,
  "figma:asset/7faf17d5deb54541e63777bc7ad7d74990b0b1dd.png": imgReview3,
  "figma:asset/3bf4f3e38477a9fe4019ae13c814f9abec16f515.png": imgReview4,
  "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png": imgReview5,
  "figma:asset/d920b76cda9183f0e3d76af83d25ee01ebb6afb9.png": imgMap,
};

/** Resolve a figma:asset reference or pass through URLs */
import { resolveAsset } from "../utils/resolveAsset";
export function resolveImg(ref: string): string {
  return IMAGE_MAP[ref] || resolveAsset(ref) || ref;
}

/* ─── DESIGNER DATA CONTEXT ─── */
interface DesignerCtxType {
  teamMembers: any[];
  businessInfo: any[];
  caseStudyPhases: any[];
  reviews: any[];
  reviewsData: any[];
  /** Google Place reviews (cached server-side, refreshed monthly). When the
   *  Google Places API key is wired up server-side this populates from the
   *  live Google response; until then it's an empty array. */
  googleReviews?: any[];
  /** Optional metadata for the cached Google reviews payload (rating, total). */
  googleMeta?: { rating: number; totalRatings: number; source: string; fetchedAt: string; placeId?: string | null } | null;
  profile: any;
  projects: any[];
  serviceArea: any;
}

export const DesignerDataContext = createContext<DesignerCtxType | null>(null);
function useDesignerCtx() {
  return useContext(DesignerDataContext);
}

/* ─── PROFILE EDIT CONTEXT ───
 * When provided (by /edit-profile), public sections render text/images via
 * EditableText / EditableImage helpers that become click-to-edit in place.
 * Default null = view mode (public profile renders unchanged).
 */
export type ProfileEditCtxType = {
  save: (path: string, value: any) => void | Promise<any>;
  saveCollection?: (section: string, data: any) => void | Promise<any>;
  uploadImage?: (file: File) => Promise<string | null>;
  /** Opens the editor's "Add Project" modal (mounted at the editor level). */
  openAddProjectModal?: () => void;
  /** Opens the editor's "Edit Project" modal for the project at the given index. */
  openEditProjectModal?: (index: number) => void;
};
export const ProfileEditContext = createContext<ProfileEditCtxType | null>(null);

/** EditableText: in view mode renders the value; in edit mode is click-to-edit in place. */
export function EditableText({
  value,
  path,
  placeholder,
  multiline = false,
  className = "",
  style,
}: {
  value: string;
  path: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const editCtx = useContext(ProfileEditContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { (inputRef.current as HTMLInputElement).select?.(); } catch {}
    }
  }, [editing]);

  if (!editCtx) {
    // View mode — just render the text plainly.
    return <span className={className} style={style}>{value || placeholder || ""}</span>;
  }

  const commit = async () => {
    setEditing(false);
    if (draft === value) return;
    setSaving(true);
    try { await Promise.resolve(editCtx.save(path, draft)); }
    finally { setSaving(false); }
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <span
        onClick={(e) => { if (saving) return; e.stopPropagation(); setEditing(true); }}
        className={`${className} ${saving ? "cursor-wait opacity-60" : "cursor-text hover:bg-[rgba(15,15,13,0.06)] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#e4e4e7] hover:outline-offset-2"} rounded-[4px] transition-colors inline-flex items-center gap-1.5`}
        style={style}
        title={saving ? "Saving…" : "Click to edit"}
      >
        {value || <span style={{ color: "#a8a8a8" }}>{placeholder || "Click to edit"}</span>}
        {saving && (
          <svg className="size-[12px] animate-spin shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: "#71717a" }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={(el) => { inputRef.current = el; }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") cancel(); if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit(); }}
        className={`${className} bg-white border border-[#0f0f0d] rounded-[6px] px-2 py-1 outline-none w-full resize-none`}
        style={{ ...style, minHeight: "3em" }}
        rows={3}
      />
    );
  }

  return (
    <input
      ref={(el) => { inputRef.current = el; }}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
      className={`${className} bg-white border border-[#0f0f0d] rounded-[6px] px-2 py-1 outline-none`}
      style={style}
    />
  );
}

/** EditableImage: in view mode just an <img>; in edit mode shows hover overlay → click → upload. */
export function EditableImage({
  src,
  alt,
  path,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  path: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const editCtx = useContext(ProfileEditContext);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!editCtx) {
    return <img src={src} alt={alt} className={className} style={style} />;
  }

  const handlePick = async (file: File) => {
    if (!editCtx.uploadImage) return;
    setUploading(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (url) editCtx.save(path, url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-full h-full group/img">
      <img src={src} alt={alt} className={className} style={style} />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer z-[5]"
        style={{ background: "rgba(15,15,13,0.45)", color: "#fff" }}
        title="Click to replace image"
        aria-label="Click to replace image"
      >
        {uploading ? (
          <svg className="size-[22px] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePick(f); e.currentTarget.value = ""; }}
      />
    </div>
  );
}

/** Transform raw API data into shapes matching the hardcoded constants */
export function transformApiData(api: any): DesignerCtxType {
  return {
    profile: api,

    teamMembers: api.team?.map((m: any) => ({
      ...m,
      img: resolveImg(m.image),
    })) ?? [],

    businessInfo: api.businessInfo ?? [],

    caseStudyPhases: api.caseStudies?.map((cs: any) => ({
      ...cs,
      img: resolveImg(cs.image),
    })) ?? [],

    reviews: api.reviews?.map((r: any) => ({
      ...r,
      img: resolveImg(r.image),
    })) ?? [],

    reviewsData: api.latestReviews ?? [],

    projects: api.projects?.map((p: any) => ({
      ...p,
      img: resolveImg(p.image),
    })) ?? [],

    serviceArea: api.serviceArea ?? {},
  };
}

/* ─── DATA ─── */
const teamMembers: any[] = [];

const businessInfo: { label: string; value: string }[] = [];

const caseStudyPhases: any[] = [];

const reviews: any[] = [];

/* ─── STAR ICON ─── */
function StarIcon({ className = "size-[14px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <path
        d="M7 0.5L8.91 5.09L14 5.64L10.18 9.09L11.18 14L7 11.59L2.82 14L3.82 9.09L0 5.64L5.09 5.09L7 0.5Z"
        fill="#FFA929"
      />
    </svg>
  );
}

function Stars({ count = 5, size = "size-[14px]" }: { count?: number; size?: string }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={i} className={size} />
      ))}
    </div>
  );
}

/* ─── HERO SECTION (Compact Horizontal Layout) ─── */
export function HeroSection() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const p = ctx?.profile;
  const cp = p?.coverProject;
  // Check for a featured project in the projects array as override
  const featuredProject = ctx?.projects?.find((proj: any) => proj.isFeatured);
  const coverImg = featuredProject?.coverImage ? resolveImg(featuredProject.coverImage) : (featuredProject?.image ? resolveImg(featuredProject.image) : (p?.images?.cover ? resolveImg(p.images.cover) : PLACEHOLDER_COVER));
  const logoImg = p?.images?.logo ? resolveImg(p.images.logo) : PLACEHOLDER_LOGO;
  const companyName = p?.name || "Input Interior Designer name";
  const taglineText = p?.tagline || "Add your tagline";
  const availText = p?.availability || "";
  const locText = p?.location || "Singapore Based";
  const isVerified = p?.verified ?? false;
  const hasGoogleR = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const rating = hasGoogleR ? String(ctx!.googleMeta!.rating) : (p?.stats?.rating || "4.9");
  const coverName = featuredProject?.name || featuredProject?.title || cp?.name || "Featured project name";
  const coverCost = featuredProject?.cost || cp?.cost || "";
  const coverArea = featuredProject?.size || cp?.area || "";
  const coverYear = featuredProject?.year || cp?.year || "";
  const coverStyle = featuredProject?.style || cp?.style || "";

  return (
    <section className="relative w-full">
      {/* Full-width cover banner — acts as the page header */}
      <div className="group relative w-full h-[260px] md:h-[420px] lg:h-[480px] rounded-[20px] overflow-hidden">
        <img
          src={coverImg}
          alt={`${companyName} project`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Project name overlay */}
        <div className="absolute bottom-5 left-6 md:bottom-7 md:left-9 z-[2]">
          <p style={{ fontFamily: sans }} className="font-semibold text-[13px] md:text-[14px] text-white/90 tracking-wide uppercase">{coverName}</p>
          <div className="flex items-center gap-3 mt-1">
            {coverCost && <span style={{ fontFamily: sans }} className="text-[12px] md:text-[13px] text-white/75">{coverCost}</span>}
            {coverArea && <span style={{ fontFamily: sans }} className="text-[12px] md:text-[13px] text-white/75">{coverArea}</span>}
            {coverStyle && <span style={{ fontFamily: sans }} className="text-[12px] md:text-[13px] text-white/75">{coverStyle}</span>}
          </div>
        </div>

      </div>

    </section>
  );
}

/* ─── STUDIO INFO (logo + name + rating + location + availability) ───
 * Lives in its own component so the public/editor pages can render it
 * side-by-side with the QuoteCard form below the cover banner. */
export function StudioInfo() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const p = ctx?.profile;
  const logoImg = p?.images?.logo ? resolveImg(p.images.logo) : PLACEHOLDER_LOGO;
  const companyName = p?.name || "Input Interior Designer name";
  const taglineText = p?.tagline || "Add your tagline";
  const availText = p?.availability || "";
  const locText = p?.location || "Singapore Based";
  const isVerified = p?.verified ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative rounded-full size-[100px] md:size-[128px] border-[3px] border-[#d8d3c8] shrink-0 overflow-hidden flex items-center justify-center mb-4" style={{ background: C.cream }}>
        <EditableImage src={logoImg} alt={companyName} path="images.logo" className="w-full h-full object-cover rounded-full" />
      </div>

      {/* Name */}
      <h1 style={{ fontFamily: serif, color: C.black, fontSize: "clamp(28px, 3.5vw, 42px)" }} className="font-normal leading-tight mb-2">
        <EditableText value={companyName} path="name" placeholder="Studio name" />
        {isVerified && (
          <span className="inline-flex items-center justify-center bg-[#16a34a] rounded-full size-[20px] ml-2 align-middle">
            <svg className="size-[12px]" viewBox="0 0 10 7.5" fill="none">
              <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </span>
        )}
      </h1>

      {/* Tagline */}
      <p style={{ fontFamily: sans, color: C.gray }} className="text-[15px] md:text-[17px] leading-[1.5] mb-4">
        <EditableText value={taglineText} path="tagline" placeholder="Tagline" multiline />
      </p>

      {/* Location + Availability */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" style={{ fontFamily: sans }}>
        {(availText || editCtx) && (
          <span className="flex items-center gap-1.5 text-[14px]" style={{ color: C.gray }}>
            <span className="bg-[#00c950] rounded-full size-2 inline-block" />
            <EditableText
              value={availText}
              path="availability"
              placeholder="Available now"
            />
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[14px]" style={{ color: C.grayLight }}>
          <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <EditableText value={locText} path="location" placeholder="Location" />
        </span>
      </div>

      {/* Key Metrics — 2x2 grid below location */}
      <div className="mt-6">
        <KeyMetrics cols={2} />
      </div>
    </div>
  );
}

/* ─── QUOTE CARD (Full-width enquiry section) ─── */
export function QuoteCard({ compact = false }: { compact?: boolean } = {}) {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const slug = ctx?.profile?.slug || "";
  const companyName = ctx?.profile?.name || "this designer";
  const logoImg = ctx?.profile?.images?.logo ? resolveImg(ctx.profile.images.logo) : PLACEHOLDER_LOGO;
  const hasGoogleQ = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const rating = hasGoogleQ ? String(ctx!.googleMeta!.rating) : (ctx?.profile?.stats?.rating || "4.9");
  const [form, setForm] = useState({ name: "", phone: "", email: "", propertyType: "", budget: "", keyCollection: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const goToStep2 = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please fill in your name and contact number.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.propertyType || !form.budget || !form.keyCollection) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!slug) { setError("Designer not found."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4808de5e/designer-inquiry/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          name: sanitizeInput(form.name, 100),
          phone: sanitizeInput(form.phone, 20),
          email: sanitizeEmail(form.email),
          propertyType: form.propertyType,
          budget: form.budget,
          keyCollection: form.keyCollection,
          message: sanitizeInput(form.message, 2000),
          timeline: "",
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to submit. Please try again."); }
      else { setSubmitted(true); }
    } catch (err: any) {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const inputCls = `w-full border border-[${C.creamBorder}] rounded-[10px] px-4 h-[44px] text-[14px] outline-none focus:border-[${C.black}] transition-colors`;
  const selectCls = `w-full border border-[${C.creamBorder}] rounded-[10px] px-4 h-[44px] text-[14px] outline-none focus:border-[${C.black}] transition-colors appearance-none`;

  // Editor mode: show placeholder
  if (editCtx) {
    return (
      <div className="bg-[#fafaf8] rounded-[16px] border border-[#d8d3c8] p-8 md:p-12">
        <TagLabel>GET A FREE QUOTE</TagLabel>
        <h2 style={{ fontFamily: serif, color: C.black }} className="font-normal text-[24px] md:text-[28px] mt-3 mb-2">Start Your Renovation Journey</h2>
        <p style={{ fontFamily: sans, color: C.gray }} className="text-[15px] mb-8">Form preview — this section is live on the public page.</p>
        <div className={compact ? "" : "grid md:grid-cols-[1fr_300px] gap-8"}>
          <div className="space-y-4">
            {["Full Name", "Contact Number", "Property Type", "Budget Range", "Key Collection"].map((l) => (
              <div key={l}>
                <div className="h-[14px] w-[100px] rounded-[4px] mb-1.5" style={{ background: C.cream }} />
                <div className="h-[48px] w-full rounded-[10px] border border-[#d8d3c8]" style={{ background: C.cream }} />
              </div>
            ))}
            <div className="h-[52px] w-full rounded-[12px] flex items-center justify-center" style={{ background: C.black }}>
              <span style={{ fontFamily: sans }} className="font-medium text-[14px] text-white">Get Free Quotes &rarr;</span>
            </div>
          </div>
          {!compact && (
            <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-[12px] border border-[#d8d3c8]" style={{ background: C.cream }}>
              <div className="size-[56px] rounded-full bg-black overflow-hidden mb-3">
                <img src={logoImg} alt="" className="w-full h-full object-cover" />
              </div>
              <p style={{ fontFamily: sans, color: C.black }} className="text-[14px] font-medium">{companyName}</p>
              <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[12px] mt-1">Typically replies within 24h</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-[#fafaf8] rounded-[16px] border border-[#d8d3c8] p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: serif, color: C.black }} className="font-normal text-[24px] mb-2">Quote Request Sent!</h2>
        <p style={{ fontFamily: sans, color: C.gray }} className="text-[16px] leading-[1.6]">
          Thank you, {form.name.split(" ")[0]}! {companyName} will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf8] rounded-[16px] border border-[#d8d3c8] p-5 md:p-6 lg:p-7 h-full flex flex-col">
      <TagLabel>GET A FREE QUOTE</TagLabel>
      <h2 style={{ fontFamily: serif, color: C.black }} className="font-normal text-[20px] md:text-[22px] mt-2 mb-1.5">Start Your Renovation Journey</h2>
      <p style={{ fontFamily: sans, color: C.gray }} className="text-[14px] mb-4 leading-[1.55]">
        Speak with our designers within 24 hours. No hard sell, just honest advice.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="size-[24px] rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ fontFamily: sans, background: C.black, color: "white" }}>1</div>
          <span style={{ fontFamily: sans, color: step === 1 ? C.black : C.grayLight }} className="text-[13px] font-medium">Your Info</span>
        </div>
        <div className="flex-1 h-px" style={{ background: step === 2 ? C.black : C.creamBorder }} />
        <div className="flex items-center gap-2">
          <div className="size-[24px] rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ fontFamily: sans, background: step === 2 ? C.black : C.cream, color: step === 2 ? "white" : C.grayLight, border: step === 2 ? "none" : `1px solid ${C.creamBorder}` }}>2</div>
          <span style={{ fontFamily: sans, color: step === 2 ? C.black : C.grayLight }} className="text-[13px] font-medium">Project</span>
        </div>
      </div>

      <div className={compact ? "flex-1 flex flex-col" : "grid md:grid-cols-[1fr_280px] gap-8 lg:gap-12 flex-1"}>
        {/* Left: Form — children distribute evenly so the column fills the card */}
        <div className="flex-1 flex flex-col justify-between gap-3">
          {step === 1 ? (
            <>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Full Name</label>
                <input type="text" required placeholder="e.g. Jing Wei Tan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} style={{ fontFamily: sans, color: C.black, background: C.cream }} />
              </div>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Contact Number</label>
                <input type="tel" required placeholder="+65 9XXX XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} style={{ fontFamily: sans, color: C.black, background: C.cream }} />
              </div>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Email</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} style={{ fontFamily: sans, color: C.black, background: C.cream }} />
              </div>
              {error && <p style={{ fontFamily: sans }} className="text-[13px] text-red-500">{error}</p>}
              <button
                onClick={goToStep2}
                className="w-full text-white font-medium text-[14px] rounded-[12px] h-[48px] hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: sans, background: C.black }}
              >
                Next <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.33 8H12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" /><path d="M8 3.33L12.67 8L8 12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" /></svg>
              </button>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Property Type</label>
                <select required value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} className={selectCls} style={{ fontFamily: sans, color: form.propertyType ? C.black : C.grayLight, background: C.cream }}>
                  <option value="">Select</option>
                  <option value="HDB">HDB</option>
                  <option value="Condo">Condo</option>
                  <option value="Landed">Landed</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Budget Range</label>
                <select required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className={selectCls} style={{ fontFamily: sans, color: form.budget ? C.black : C.grayLight, background: C.cream }}>
                  <option value="">Select</option>
                  <option value="Below $30,000">Below $30k</option>
                  <option value="$30,000 – $50,000">$30k – $50k</option>
                  <option value="$50,000 – $80,000">$50k – $80k</option>
                  <option value="$80,000 – $120,000">$80k – $120k</option>
                  <option value="Above $120,000">Above $120k</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: sans, color: C.black }} className="font-medium text-[13px] block mb-1">Key Collection</label>
                <select required value={form.keyCollection} onChange={e => setForm({ ...form, keyCollection: e.target.value })} className={selectCls} style={{ fontFamily: sans, color: form.keyCollection ? C.black : C.grayLight, background: C.cream }}>
                  <option value="">Select</option>
                  <option value="Keys Collected">Keys Collected</option>
                  <option value="Within 3 months">Within 3 months</option>
                  <option value="3–6 months">3–6 months</option>
                  <option value="6–12 months">6–12 months</option>
                  <option value="More than 12 months">More than 12 months</option>
                </select>
              </div>
              {error && <p style={{ fontFamily: sans }} className="text-[13px] text-red-500">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setError(""); setStep(1); }}
                  className="font-medium text-[14px] rounded-[12px] h-[48px] px-5 hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer border"
                  style={{ fontFamily: sans, color: C.black, background: C.cream, borderColor: C.creamBorder }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 text-white font-medium text-[14px] rounded-[12px] h-[48px] hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontFamily: sans, background: C.black }}
                >
                  {submitting ? (
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                  ) : (
                    <>Get Free Quotes <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.33 8H12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" /><path d="M8 3.33L12.67 8L8 12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" /></svg></>
                  )}
                </button>
              </div>
            </>
          )}
          <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[12px] text-center">
            No spam. No obligation. 100% free consultation.
          </p>
        </div>

        {/* Right: Designer mini card (hidden in compact mode — used when QuoteCard
            sits side-by-side with the StudioInfo column under the hero banner) */}
        {!compact && (
          <div className="hidden md:flex flex-col items-center justify-start pt-6">
            <div className="flex flex-col items-center p-6 rounded-[12px] border border-[#d8d3c8] w-full" style={{ background: C.cream }}>
              <div className="size-[64px] rounded-full bg-black overflow-hidden mb-3">
                <img src={logoImg} alt={companyName} className="w-full h-full object-cover" />
              </div>
              <p style={{ fontFamily: sans, color: C.black }} className="text-[15px] font-medium text-center">{companyName}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <svg className="size-[13px]" viewBox="0 0 24 24" fill="#FFA929"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <span style={{ fontFamily: sans, color: C.black }} className="text-[13px] font-medium">{rating}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[#d8d3c8] w-full text-center">
                <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[12px]">Typically replies within</p>
                <p style={{ fontFamily: sans, color: C.black }} className="text-[14px] font-medium mt-0.5">24 hours</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 space-y-2 w-full">
              {[
                { icon: "✓", text: "Free consultation" },
                { icon: "✓", text: "No obligation quote" },
                { icon: "✓", text: "Licensed & insured" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-2">
                  <span className="size-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-[#16a34a]" style={{ background: "rgba(22,163,74,0.1)" }}>{b.icon}</span>
                  <span style={{ fontFamily: sans, color: C.gray }} className="text-[13px]">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── STATS ROW ─── */
export function StatsRow() {
  const ctx = useDesignerCtx();
  const s = ctx?.profile?.stats;
  const hasGoogle = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const displayRating = hasGoogle ? String(ctx!.googleMeta!.rating) : (s?.rating || "4.9");
  const displayReviewCount = hasGoogle ? String(ctx!.googleMeta!.totalRatings) : (s?.reviewCount || "0");
  const stats = [
    {
      icon: (
        <svg className="size-[17px]" viewBox="0 0 14.4436 13.7722" fill="none">
          <path d="M7.22 0.5L9.07 4.82L13.94 5.33L10.27 8.62L11.22 13.27L7.22 11.02L3.22 13.27L4.17 8.62L0.5 5.33L5.37 4.82L7.22 0.5Z" fill="#FFA929" />
        </svg>
      ),
      label: `${displayRating} Rating`,
      sub: `${displayReviewCount} Reviews`,
    },
    {
      icon: (
        <svg className="size-[15px]" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2.5" width="14" height="12.5" rx="1.5" stroke="#FFA929" strokeWidth="1.4" />
          <path d="M1 6.5H15" stroke="#FFA929" strokeWidth="1.4" />
          <path d="M5 1V4" stroke="#FFA929" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11 1V4" stroke="#FFA929" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      label: `${s?.years || "12"} Years`,
      sub: "Experience",
    },
    {
      icon: (
        <svg className="size-[15px]" viewBox="0 0 16 16" fill="none">
          <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke="#FFA929" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1" y="1" width="14" height="14" rx="3" stroke="#FFA929" strokeWidth="1.4" />
        </svg>
      ),
      label: (s?.hdbCert ?? true) ? "HDB Cert." : "Registered",
      sub: (s?.bcaLicensed ?? true) ? "BCA Licensed" : "Licensed",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#f5f1e8] border border-[#d8d3c8] rounded-[12px] flex items-center gap-2.5 px-4 py-3 min-w-0">
          <div className="shrink-0">{s.icon}</div>
          <div>
            <p style={{fontFamily: sans}} className="font-semibold text-[14px] md:text-[15px] text-[#0f0f0d] leading-tight">{s.label}</p>
            <p style={{fontFamily: sans}} className="text-[11px] md:text-[12px] text-[#9a9790] tracking-[0.15px]">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── TEAM AVATARS ─── */
export function TeamAvatars() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const members = ctx?.teamMembers ?? teamMembers;
  const [selectedMember, setSelectedMember] = useState<(typeof members)[number] | null>(null);
  const [clickOrigin, setClickOrigin] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);

  const [selectedProject, setSelectedProject] = useState<(typeof members)[number] | null>(null);
  const [reelIndex, setReelIndex] = useState(0);
  const [isProjectClosing, setIsProjectClosing] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const reelContainerRef = useRef<HTMLDivElement>(null);

  // Edit-mode helpers
  const addStoryFileRef = useRef<HTMLInputElement>(null);
  const [uploadingMember, setUploadingMember] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  // Build the canonical "team" payload to save back to the server: keep all
  // existing fields, but write `image` (not the resolved `img`) so URLs persist.
  const serializeTeam = (next: any[]) => next.map(({ img, ...rest }: any) => ({ ...rest, image: rest.image ?? img ?? "" }));

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

  const handleAddMember = async (file: File, name: string, designation: string) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setUploadingMember(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const newMember = { name, image: url, type: "person", role: designation || "Designer", specialty: "", projects: 0, experience: "", bio: "", designs: [] };
      await editCtx.saveCollection("team", serializeTeam([...members, newMember]));
    } finally { setUploadingMember(false); }
  };

  const handleAddStory = async (file: File, title: string, description: string, location: string) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setUploadingStory(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const existingStories = members.find((m: any) => m.type === "project" && m.name === "Stories");
      const newReel = { img: url, caption: title || "New story", description: description || "", location: location || "", likes: 0, comments: 0 };
      let next: any[];
      if (existingStories) {
        next = members.map((m: any) => m === existingStories ? { ...m, reels: [...((m as any).reels || []), newReel] } : m);
      } else {
        next = [...members, { name: "Stories", image: url, type: "project", reels: [newReel] }];
      }
      await editCtx.saveCollection("team", serializeTeam(next));
    } finally { setUploadingStory(false); }
  };

  const handleRemoveMember = async (idx: number) => {
    if (!editCtx?.saveCollection) return;
    await editCtx.saveCollection("team", serializeTeam(members.filter((_: any, i: number) => i !== idx)));
  };

  const handleRenameMember = async (idx: number, name: string) => {
    if (!editCtx?.saveCollection) return;
    await editCtx.saveCollection("team", serializeTeam(members.map((m: any, i: number) => i === idx ? { ...m, name } : m)));
  };

  const handleProjectClose = () => {
    setIsProjectClosing(true);
    setTimeout(() => {
      setSelectedProject(null);
      setIsProjectClosing(false);
      setReelIndex(0);
    }, 350);
  };

  const handleAvatarClick = (m: (typeof members)[number], e: React.MouseEvent) => {
    if (m.type === "project") {
      setIsProjectClosing(false);
      setReelIndex(0);
      setSelectedProject(m);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setClickOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsClosing(false);
    setSelectedMember(m);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedMember(null);
      setIsClosing(false);
    }, 350);
  };

  return (
    <>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {members.map((m, idx) => (
          <div
            key={`${m.name}-${idx}`}
            className="relative flex flex-col items-center gap-2 shrink-0 cursor-pointer group/avatar"
            onClick={(e) => handleAvatarClick(m, e)}
          >
            <div className={`rounded-full size-[74px] md:size-[80px] border-[3px] ${m.type === "project" ? "border-[#0f0f0d]" : "border-[#0f0f0d]"} bg-white p-[3px] transition-transform duration-200 hover:scale-110`}>
              <img src={resolveImg(m.img)} alt={m.name} className="rounded-full size-full object-cover" />
            </div>
            <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#0f0f0d]">{m.name}</span>
            {editCtx && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveMember(idx); }}
                className="absolute -top-1 -right-1 size-[22px] rounded-full bg-white border border-[#e4e4e7] shadow-sm flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:bg-[#0f0f0d] hover:text-white text-[#0f0f0d] z-10"
                title="Remove"
              >
                <svg className="size-[10px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        ))}

        {/* Edit-mode "+" buttons */}
        {editCtx && (
          <>
            {/* Add Member */}
            <div
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => setAddMemberModalOpen(true)}
              title="Add a team member"
            >
              <div className="rounded-full size-[74px] md:size-[80px] border-[3px] border-dashed border-[#e4e4e7] bg-[#f6f6f6] flex items-center justify-center hover:border-[#0f0f0d] hover:bg-white transition-colors">
                {uploadingMember ? (
                  <svg className="size-5 animate-spin text-[#71717a]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="size-7 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                )}
              </div>
              <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#71717a]">Add member</span>
            </div>

            {/* Add Story / Reel */}
            <div
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => setStoryModalOpen(true)}
              title="Upload a story / reel"
            >
              <div className="rounded-full size-[74px] md:size-[80px] border-[3px] border-dashed border-[#e4e4e7] bg-[#f6f6f6] flex items-center justify-center hover:border-[#0f0f0d] hover:bg-white transition-colors">
                {uploadingStory ? (
                  <svg className="size-5 animate-spin text-[#71717a]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="size-7 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M16 3v6M8 3v6" />
                  </svg>
                )}
              </div>
              <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#71717a]">Add story</span>
            </div>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      {addMemberModalOpen && createPortal(
        <AddMemberModal
          onClose={() => setAddMemberModalOpen(false)}
          onSave={async (file, name, designation) => {
            await handleAddMember(file, name, designation);
            setAddMemberModalOpen(false);
          }}
          saving={uploadingMember}
        />,
        document.body
      )}

      {/* Add Story Modal */}
      {storyModalOpen && createPortal(
        <AddStoryModal
          onClose={() => setStoryModalOpen(false)}
          onSave={async (file, title, description, location) => {
            await handleAddStory(file, title, description, location);
            setStoryModalOpen(false);
          }}
          saving={uploadingStory}
        />,
        document.body
      )}

      {/* Instagram-style popup overlay — portaled to body to escape transformed ancestors */}
      {selectedMember && selectedMember.type === "person" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? "animate-[fadeOut_0.35s_ease-in_forwards]" : "animate-[fadeIn_0.3s_ease-out_forwards]"}`} />
          <div
            className={`relative bg-white rounded-[20px] w-full max-w-[380px] overflow-hidden shadow-2xl ${isClosing ? "animate-[flyOut_0.35s_cubic-bezier(0.7,0,0.84,0)_forwards]" : "animate-[flyIn_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]"}`}
            style={{
              "--origin-x": `${clickOrigin.x}px`,
              "--origin-y": `${clickOrigin.y}px`,
            } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            >
              <svg className="size-4 text-[#364153]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {/* Profile header — no gradient */}
            <div className="pt-7 pb-4 px-6 flex flex-col items-center text-center">
              <div className="rounded-full size-[110px] border-[3px] border-[#0f0f0d] bg-white p-[3px] shadow-lg">
                <img src={resolveImg(selectedMember.img)} alt={selectedMember.name} className="rounded-full size-full object-cover" />
              </div>
              {editCtx ? (
                <>
                  <input
                    className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] mt-3 text-center bg-transparent border-b border-dashed border-[#e4e4e7] focus:border-[#0f0f0d] outline-none w-full transition-colors"
                    value={selectedMember.name}
                    placeholder="Name"
                    onChange={(e) => {
                      const idx = members.findIndex((m: any) => m === selectedMember);
                      if (idx >= 0) {
                        const updated = { ...selectedMember, name: e.target.value };
                        setSelectedMember(updated);
                        const next = members.map((m: any, i: number) => i === idx ? { ...m, name: e.target.value } : m);
                        editCtx.saveCollection?.("team", serializeTeam(next));
                      }
                    }}
                  />
                  <input
                    className="font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] font-medium mt-0.5 text-center bg-transparent border-b border-dashed border-[#e4e4e7] focus:border-[#0f0f0d] outline-none w-full transition-colors"
                    value={"role" in selectedMember ? selectedMember.role : ""}
                    placeholder="Role / Designation"
                    onChange={(e) => {
                      const idx = members.findIndex((m: any) => m === selectedMember);
                      if (idx >= 0) {
                        const updated = { ...selectedMember, role: e.target.value };
                        setSelectedMember(updated);
                        const next = members.map((m: any, i: number) => i === idx ? { ...m, role: e.target.value } : m);
                        editCtx.saveCollection?.("team", serializeTeam(next));
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] mt-3">{selectedMember.name}</h3>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] font-medium mt-0.5">{"role" in selectedMember ? selectedMember.role : ""}</p>
                </>
              )}
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#71717a] mt-0.5">{"specialty" in selectedMember ? selectedMember.specialty : ""}</p>

              {/* Stats row */}
              <div className="flex justify-center gap-5 mt-4 w-full">
                <div className="text-center flex-1">
                  <p className="font-['DM_Sans',sans-serif] font-bold text-[17px] text-[#0f0f0d]">{"projects" in selectedMember ? selectedMember.projects : 0}</p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#71717a]">Projects</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e4e4e7] mx-4" />

            {/* Designs grid */}
            {"designs" in selectedMember && selectedMember.designs && (
              <div className="grid grid-cols-2 gap-2 p-4">
                {selectedMember.designs.map((d: { img: string; label: string }) => (
                  <div key={d.label} className="relative rounded-[12px] overflow-hidden aspect-square group/design">
                    <img src={resolveImg(d.img)} alt={d.label} className="size-full object-cover transition-transform duration-300 group-hover/design:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/design:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                      <span className="font-['DM_Sans',sans-serif] text-[11px] font-medium text-white">{d.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Instagram Reels-style popup for projects — portaled to body to escape transformed ancestors */}
      {selectedProject && "reels" in selectedProject && selectedProject.reels && (() => {
        const reels = selectedProject.reels as { img: string; caption: string; location: string; likes: number; comments: number }[];
        return createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleProjectClose}
          >
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-black/90 ${isProjectClosing ? "animate-[fadeOut_0.35s_ease-in_forwards]" : "animate-[fadeIn_0.25s_ease-out_forwards]"}`} />

            {/* Reels container */}
            <div
              className={`relative w-full max-w-[400px] h-[85vh] max-h-[720px] ${isProjectClosing ? "animate-[reelOut_0.35s_ease-in_forwards]" : "animate-[reelIn_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleProjectClose}
                className="absolute -top-10 right-0 z-20 size-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>

              {/* Reel card */}
              <div
                ref={reelContainerRef}
                className="relative w-full h-full rounded-[16px] overflow-hidden snap-y snap-mandatory overflow-y-auto scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollTop / el.clientHeight);
                  if (idx !== reelIndex && idx >= 0 && idx < reels.length) setReelIndex(idx);
                }}
              >
                {reels.map((reel, i) => (
                  <div key={reel.caption} className="relative w-full h-full snap-start snap-always shrink-0">
                    {/* Full-bleed image */}
                    <img
                      src={resolveImg(reel.img)}
                      alt={reel.caption}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

                    {/* Top bar — project name + location */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-3">
                      <div className="size-[36px] rounded-full border-2 border-white/80 overflow-hidden shrink-0">
                        <img src={resolveImg(selectedProject.img)} alt={selectedProject.name} className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] text-white leading-tight truncate">{selectedProject.name} Projects</p>
                        <p className="font-['DM_Sans',sans-serif] text-[11px] text-white/70 leading-tight truncate">{reel.location}</p>
                      </div>
                    </div>

                    {/* Right side action buttons */}
                    <div className="absolute right-3 bottom-[140px] flex flex-col items-center gap-5">
                      <button
                        className="flex flex-col items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLikedReels(prev => {
                            const next = new Set(prev);
                            if (next.has(reel.caption)) next.delete(reel.caption);
                            else next.add(reel.caption);
                            return next;
                          });
                        }}
                      >
                        <svg className={`size-7 transition-colors ${likedReels.has(reel.caption) ? "text-red-500 fill-red-500" : "text-white"}`} viewBox="0 0 24 24" fill={likedReels.has(reel.caption) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                        <span className="font-['DM_Sans',sans-serif] text-[11px] text-white font-medium">{likedReels.has(reel.caption) ? reel.likes + 1 : reel.likes}</span>
                      </button>

                    </div>

                    {/* Bottom caption area */}
                    <div className="absolute bottom-0 left-0 right-14 p-4">
                      <p className="font-['DM_Sans',sans-serif] font-semibold text-[14px] text-white leading-snug mb-1">{reel.caption}</p>
                      <div className="flex items-center gap-1.5">
                        <svg className="size-[12px] text-white/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span className="font-['DM_Sans',sans-serif] text-[12px] text-white/70">{reel.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reel progress dots */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                {reels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (reelContainerRef.current) {
                        reelContainerRef.current.scrollTo({ top: i * reelContainerRef.current.clientHeight, behavior: "smooth" });
                      }
                    }}
                    className={`rounded-full transition-all duration-300 ${i === reelIndex ? "w-[6px] h-[18px] bg-white" : "size-[6px] bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flyIn {
          0% {
            opacity: 0;
            transform: translate(
              calc(var(--origin-x) - 50vw),
              calc(var(--origin-y) - 50vh)
            ) scale(0.12);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes flyOut {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(var(--origin-x) - 50vw),
              calc(var(--origin-y) - 50vh)
            ) scale(0.12);
          }
        }
        @keyframes reelIn {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes reelOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(60px) scale(0.92);
          }
        }
      `}</style>
    </>
  );
}

/* ─── BIO TEXT ─── */
export function BioText() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const bio = ctx?.profile?.bio;
  const name = ctx?.profile?.name || "Us";

  const bioContent = editCtx ? (
    <EditableText
      value={bio || ""}
      path="bio"
      placeholder="Add a short description about your studio."
      multiline
    />
  ) : bio ? bio : "Add a short description about your studio.";

  return (
    <FadeIn>
      <TagLabel>ABOUT US</TagLabel>
      <h2 style={{ fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3 mb-4">
        Why Choose {name}?
      </h2>
      <p className="text-[16px] md:text-[18px] leading-[1.8] max-w-[720px]" style={{ fontFamily: sans, color: C.gray }}>
        {bioContent}
      </p>
    </FadeIn>
  );
}

/* ─── TRUSTED SINCE ─── */
export function TrustedSince() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const p = ctx?.profile;
  const ts = p?.trustedSince;
  const title = ts?.title || "Trusted Since —";
  const desc = ts?.description || "Add your studio's story here.";
  const badges = ts?.badges ?? [];
  // Hide on live page when no meaningful data
  if (!editCtx) {
    const hasTitle = ts?.title && ts.title !== "Trusted Since —" && ts.title.trim() !== "";
    const hasDesc = ts?.description && ts.description !== "Add your studio's story here." && ts.description.trim() !== "";
    const hasBadges = badges.length > 0;
    if (!hasTitle && !hasDesc && !hasBadges) return null;
  }

  const badgeIcons = [
    <svg key="dep" className="size-[15px] shrink-0" viewBox="0 0 13.5 16.5" fill="none"><rect height="15" stroke="#00A63E" strokeLinejoin="round" strokeWidth="1.5" width="12" x="0.75" y="0.75" /><path d="M4.5 8.25L6 9.75L9 6.75" stroke="#00A63E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
    <svg key="time" className="size-[15px] shrink-0" viewBox="0 0 16.5 16.5" fill="none"><rect height="15" stroke="#155DFC" strokeLinejoin="round" strokeWidth="1.5" width="15" x="0.75" y="0.75" /><path d="M8.25 4.5V8.25L10.75 9.5" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
    <svg key="award" className="size-[18px] shrink-0" viewBox="0 0 18 18" fill="none"><path d="M9 1L11.47 6.01L17 6.82L13 10.72L13.94 16.24L9 13.65L4.06 16.24L5 10.72L1 6.82L6.53 6.01L9 1Z" stroke="#FE9A00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  ];

  // Build timeline items from credentials + badges
  const timelineItems: { icon: React.ReactNode; title: string; sub: string; color: string }[] = [];
  const savedCreds = ctx?.profile?.credentials;

  // Official HDB & BCA brand marks — bundled assets imported at the top of the
  // file (`imgHdb` / `imgBca`) so they ship with the build and resolve through
  // Vite, no /public path required.
  const HdbLogo = (
    <img
      src={imgHdb}
      alt="Housing & Development Board"
      className="shrink-0 object-contain"
      style={{ height: 40, width: "auto", maxWidth: 110 }}
    />
  );

  const BcaLogo = (
    <img
      src={imgBca}
      alt="Building and Construction Authority"
      className="shrink-0 object-contain"
      style={{ height: 40, width: "auto", maxWidth: 110 }}
    />
  );

  if (savedCreds?.hdb?.active) {
    timelineItems.push({
      icon: HdbLogo,
      title: savedCreds.hdb.title || "HDB Registered Contractor",
      sub: [savedCreds.hdb.firm, savedCreds.hdb.reg].filter(Boolean).join(" · "),
      color: "#c8102e",
    });
  }
  if (savedCreds?.bca?.active) {
    timelineItems.push({
      icon: BcaLogo,
      title: savedCreds.bca.title || "BCA Licensed Builder",
      sub: [savedCreds.bca.firm, savedCreds.bca.reg].filter(Boolean).join(" · "),
      color: "#003a70",
    });
  }
  if (savedCreds?.landedEligible) {
    timelineItems.push({
      icon: <svg className="size-[16px]" viewBox="0 0 24 24" fill="none" stroke="#FFA929" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
      title: "Landed Home Eligible",
      sub: "Certified for full A&A works on landed properties",
      color: "#FFA929",
    });
  }
  badges.forEach((badge: string, i: number) => {
    timelineItems.push({
      icon: badgeIcons[i % badgeIcons.length],
      title: badge,
      sub: "",
      color: "#0f0f0d",
    });
  });

  return (
    <section className="py-[40px] md:py-[64px]">
      <FadeIn>
        <TagLabel>TRUST &amp; CREDENTIALS</TagLabel>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3 mb-3">{title}</h2>
        <p style={{ fontFamily: sans, color: C.gray }} className="text-[16px] md:text-[18px] leading-[1.7] mb-6">
          {desc}
        </p>

        {/* Credentials list */}
        {timelineItems.length > 0 && (
          <div className="space-y-4">
            {timelineItems.map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] p-4 md:p-5 flex items-center gap-4">
                  <div className="shrink-0">{item.icon}</div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: sans, color: C.black }} className="font-medium text-[14px] md:text-[15px]">{item.title}</p>
                    {item.sub && <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[13px] mt-0.5">{item.sub}</p>}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </FadeIn>
    </section>
  );
}

/* ─── BTO PACKAGE CTA ─── */
export function BtoPackageCta() {
  const ctx = useDesignerCtx();
  const bto = ctx?.profile?.btoPackage;
  const btoTitle = bto?.title || "Add a package title";
  const btoDesc = bto?.description || "Add a short description of your package.";
  const btoTags = bto?.tags ?? [];
  const tagColors = [
    "bg-[#dbeafe] text-[#1447e6]",
    "bg-[#dcfce7] text-[#008236]",
    "bg-[#fef3c7] text-[#d97706]",
    "bg-[#e9d5ff] text-[#7c3aed]",
  ];

  return (
    <div className="bg-gradient-to-r from-[#eff6ff] to-[#eef2ff] border border-[#dbeafe] rounded-[12px] px-6 md:px-16 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="bg-white rounded-full size-[48px] shadow-sm shrink-0 flex items-center justify-center">
          <svg className="size-[24px]" viewBox="0 0 20 22" fill="none">
            <path d="M14 11H6M10 7V15M19 11C19 15.97 14.97 20 10 20C5.03 20 1 15.97 1 11C1 6.03 5.03 2 10 2C14.97 2 19 6.03 19 11Z" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[17px] md:text-[18px] text-[#0f0f0d] mb-1">{btoTitle}</h3>
          <p className="font-['DM_Sans',sans-serif] text-[13px] md:text-[14px] text-[#71717a] leading-[20px]">
            {btoDesc}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {btoTags.map((tag: string, i: number) => (
              <span key={tag} className={`${tagColors[i % tagColors.length]} font-['DM_Sans',sans-serif] font-medium text-[10px] px-2.5 py-1 rounded-full`}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <button className="bg-[#0f0f0d] text-white font-medium text-[14px] rounded-[12px] h-[52px] px-8 whitespace-nowrap hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2" style={{fontFamily: sans}}>
        View Packages
        <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
          <path d="M3.33 8H12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
          <path d="M8 3.33L12.67 8L8 12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
        </svg>
      </button>
    </div>
  );
}

/* ─── PROJECTS SECTION ─── */
function ProjectCard({ p, idx, slug, editCtx, onRemove, onEdit }: { p: any; idx: number; slug: string; editCtx: any; onRemove?: (i: number) => void; onEdit?: (i: number) => void }) {
  // In edit mode with an onEdit handler, the card opens the editor modal instead
  // of navigating to the project detail page.
  const overlay = editCtx && onEdit ? (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(idx); }}
      className="absolute inset-0 z-[1] cursor-pointer bg-transparent border-0 p-0"
      title="Edit project"
      aria-label="Edit project"
    />
  ) : (
    <Link to={`/designer/${slug}/project/${encodeURIComponent(p.name)}`} className="absolute inset-0 z-[1]" />
  );

  return (
    <div className="relative group isolate h-[280px] md:h-[400px] cursor-pointer">
      {/* Ambient glow on hover (desktop only) */}
      <div className="absolute -inset-6 opacity-0 group-hover:opacity-40 transition-opacity duration-700 hidden md:block" style={{ filter: "blur(60px)", transform: "scale(1.1)" }}>
        <img src={resolveImg(p.img)} alt="" className="w-full h-full object-cover saturate-150 brightness-110" />
      </div>
      {/* Card inner */}
      <div className="relative z-10 bg-[#0f0f0d] rounded-[16px] overflow-hidden h-full">
        {/* Image layer — full color, subtle zoom on hover */}
        <img src={resolveImg(p.img)} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        {/* Gradient overlay for caption legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        {overlay}
        <div className="absolute bottom-4 left-5 z-[2] pointer-events-none">
          <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] md:text-[14px] text-white leading-[22px] tracking-[0.08px]">{p.name}</p>
          <p className="font-['DM_Sans',sans-serif] text-[12px] md:text-[14px] text-[#bab7b3] tracking-[0.08px]">{p.meta}</p>
        </div>
        {/* Featured badge */}
        {p.isFeatured && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 shadow-sm">
            <svg className="size-[12px]" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#d97706", fontFamily: "'DM_Sans',sans-serif" }}>Featured</span>
          </div>
        )}
        {editCtx && onRemove && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(idx); }}
            className="absolute top-3 right-3 z-10 size-[28px] rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-[#0f0f0d] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove project"
          >
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function AllProjectsModal({ projs, slug, onClose }: { projs: any[]; slug: string; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");

  const filtered = useMemo(() => {
    let list = [...projs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name?.toLowerCase().includes(q) || p.meta?.toLowerCase().includes(q));
    }
    if (sort === "name") list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    else if (sort === "oldest") list.reverse();
    return list;
  }, [projs, search, sort]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-[3vh] mb-[3vh] w-[95vw] max-w-[1100px] max-h-[94vh] bg-white rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#e4e4e7]">
          <div>
            <h2 className="font-['EB_Garamond',Georgia,serif] font-semibold text-[24px] md:text-[28px] text-[#0f0f0d] tracking-[-1.2px]">All Projects</h2>
            <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#71717a] mt-0.5">{projs.length} project{projs.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="size-[36px] rounded-full bg-[#f6f6f6] hover:bg-[#f6f6f6] flex items-center justify-center transition-colors cursor-pointer" title="Close">
            <svg className="size-[18px] text-[#0f0f0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 px-6 md:px-8 py-4 border-b border-[#e4e4e7]">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99a1af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-[40px] pl-10 pr-4 bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f0f0d] placeholder:text-[#99a1af] outline-none focus:border-[#0f0f0d] transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-[40px] px-3 bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-[#0f0f0d] outline-none focus:border-[#0f0f0d] transition-colors appearance-none cursor-pointer pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6860' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="size-[48px] text-[#e4e4e7] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <p className="font-['DM_Sans',sans-serif] text-[15px] text-[#71717a]">No projects found</p>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#99a1af] mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p: any, idx: number) => (
                <Link
                  key={`${p.name}-${idx}`}
                  to={`/designer/${slug}/project/${encodeURIComponent(p.name)}`}
                  onClick={onClose}
                  className="relative rounded-[20px] overflow-hidden h-[220px] group cursor-pointer block"
                >
                  <img src={resolveImg(p.img)} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent to-[55%]" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] text-white leading-[20px] tracking-[0.08px]">{p.name}</p>
                    <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#bab7b3] tracking-[0.08px] mt-0.5">{p.meta}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ProjectsSection() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const projs = ctx?.projects ?? [];
  const slug = window.location.pathname.split('/designer/')[1]?.split('/')[0] || 'studio';
  const [showAll, setShowAll] = useState(false);

  const addProjectFileRef = useRef<HTMLInputElement>(null);
  const [uploadingProject, setUploadingProject] = useState(false);

  const serializeProjects = (next: any[]) => next.map(({ img, ...rest }: any) => ({ ...rest, image: rest.image ?? img ?? "" }));

  const handleAddProject = async (file: File) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setUploadingProject(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const newProject = { name: "New Project", meta: "HDB · $0 · 2026", image: url };
      await editCtx.saveCollection("projects", serializeProjects([...projs, newProject]));
    } finally {
      setUploadingProject(false);
    }
  };

  const handleRemoveProject = async (idx: number) => {
    if (!editCtx?.saveCollection) return;
    const name = projs[idx]?.name || "this project";
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    await editCtx.saveCollection("projects", serializeProjects(projs.filter((_: any, i: number) => i !== idx)));
  };

  const VISIBLE_COUNT = 6;
  const hasMore = !editCtx && projs.length > VISIBLE_COUNT;
  const visibleProjs = !editCtx ? projs.slice(0, VISIBLE_COUNT) : projs;

  return (
    <section className="py-[40px] md:py-[64px]">
      <FadeIn>
      <div className="flex items-end justify-between mb-6">
        <div>
          <TagLabel>OUR PROJECTS</TagLabel>
          <h2 style={{fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black}} className="font-normal tracking-[-0.03em] mt-3 mb-1">Featured Projects</h2>
          <p style={{fontFamily: sans, color: C.gray}} className="text-[16px] md:text-[18px]">Recent completed renovations</p>
        </div>
      </div>
      </FadeIn>

      {/* Horizontal carousel */}
      {editCtx ? (
        /* Editor: keep grid for easier editing */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projs.map((p: any, idx: number) => (
            <ProjectCard
              key={`${p.name}-${idx}`}
              p={p}
              idx={idx}
              slug={slug}
              editCtx={editCtx}
              onRemove={handleRemoveProject}
              onEdit={editCtx.openEditProjectModal}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              if (editCtx.openAddProjectModal) {
                editCtx.openAddProjectModal();
              } else {
                addProjectFileRef.current?.click();
              }
            }}
            className="relative rounded-[16px] overflow-hidden h-[280px] md:h-[400px] border-2 border-dashed border-[#d8d3c8] hover:border-[#0f0f0d] transition-colors flex flex-col items-center justify-center gap-3 group/add"
            style={{ background: C.cream }}
            title="Add a project"
          >
            {uploadingProject ? (
              <svg className="size-9 animate-spin" style={{ color: C.grayLight }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <>
                <div className="size-[64px] rounded-full border-2 border-dashed border-[#d8d3c8] flex items-center justify-center group-hover/add:border-[#0f0f0d] transition-colors" style={{ background: C.white }}>
                  <svg className="size-8 group-hover/add:text-[#0f0f0d] transition-colors" style={{ color: C.grayLight }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </div>
                <span style={{ fontFamily: sans, color: C.grayLight }} className="text-[14px] font-medium group-hover/add:text-[#0f0f0d] transition-colors">Add a project</span>
              </>
            )}
            <input
              ref={addProjectFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddProject(f); e.currentTarget.value = ""; }}
            />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {visibleProjs.map((p: any, idx: number) => (
            <ProjectCard key={`${p.name}-${idx}`} p={p} idx={idx} slug={slug} editCtx={editCtx} />
          ))}
        </div>
      )}

      {/* View All Projects */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-white rounded-[12px] h-[52px] px-8 text-[14px] font-medium flex items-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer"
            style={{ fontFamily: sans, background: C.black }}
          >
            View All Projects
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {showAll && <AllProjectsModal projs={projs} slug={slug} onClose={() => setShowAll(false)} />}
    </section>
  );
}

/* ─── BUSINESS INFO INLINE CELL ─── */
function BusinessInfoCell({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);

  // Sync draft when external value changes (e.g. after save round-trip)
  useEffect(() => { setDraft(value); setDirty(false); }, [value]);

  const commit = () => {
    if (draft !== value) onSave(draft);
    setDirty(false);
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); if (e.key === "Escape") { setDraft(value); setDirty(false); (e.currentTarget as HTMLInputElement).blur(); } }}
      placeholder={placeholder}
      className="bg-transparent border-0 rounded-[6px] px-2 py-1 outline-none w-full text-[14px] md:text-[15px] font-medium text-[#0f0f0d] focus:bg-white focus:ring-1 focus:ring-[#e4e4e7] transition-colors placeholder:text-[#a8a8a8] placeholder:font-normal"
    />
  );
}

/* ─── TRUST & CREDENTIALS ─── */
const DEFAULT_BUSINESS_LABELS = [
  "ACRA / UEN",
  "Years in operation",
  "Office address",
  "Project types",
  "Style specialisation",
  "Budget range",
];

export function TrustCredentials() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const rawBInfo = ctx?.businessInfo ?? businessInfo;

  // Always render the default labels; merge in saved values where available.
  const bInfo = DEFAULT_BUSINESS_LABELS.map((label) => {
    const found = rawBInfo.find((r: any) => r.label === label);
    return { label, value: found?.value ?? "" };
  });
  // Append any custom rows that aren't in the default list (preserve user data).
  const extras = rawBInfo.filter((r: any) => !DEFAULT_BUSINESS_LABELS.includes(r.label));
  const allRows = [...bInfo, ...extras];

  const handleBusinessSave = (label: string, value: string) => {
    if (!editCtx) return;
    const next = [...allRows];
    const idx = next.findIndex((r) => r.label === label);
    if (idx >= 0) next[idx] = { label, value };
    else next.push({ label, value });
    // Strip empty default rows so we don't persist noise.
    const cleaned = next.filter((r) => r.value !== "" || extras.some((e: any) => e.label === r.label));
    editCtx.save("businessInfo", cleaned);
  };

  // Credentials data — read from profile with hardcoded fallback
  // Note: descriptions are always the static defaults below (not user-editable)
  const HDB_DESC = "Authorised to carry out renovation works in HDB flats across Singapore.";
  const BCA_DESC = "Building & Construction Authority licensed contractor for structural and A&A works.";
  const parseSub = (sub: string | undefined, defaultReg: string) => {
    if (!sub) return { firm: "", reg: "" };
    const parts = sub.split(" \u00b7 ");
    if (parts.length >= 2) return { firm: parts[0], reg: parts.slice(1).join(" \u00b7 ") };
    return { firm: sub, reg: defaultReg };
  };
  const savedCreds = ctx?.profile?.credentials;
  const hdbParsed = parseSub(savedCreds?.hdb?.sub, "");
  const bcaParsed = parseSub(savedCreds?.bca?.sub, "");
  const credentials = {
    hdb: {
      active: savedCreds?.hdb?.active ?? true,
      title: savedCreds?.hdb?.title || "HDB Registered Contractor",
      firm: savedCreds?.hdb?.firm || hdbParsed.firm,
      reg: savedCreds?.hdb?.reg || hdbParsed.reg,
      desc: HDB_DESC,
    },
    bca: {
      active: savedCreds?.bca?.active ?? true,
      title: savedCreds?.bca?.title || "BCA Licensed Builder",
      firm: savedCreds?.bca?.firm || bcaParsed.firm,
      reg: savedCreds?.bca?.reg || bcaParsed.reg,
      desc: BCA_DESC,
    },
    landedEligible: savedCreds?.landedEligible ?? true,
  };

  const [credEditing, setCredEditing] = useState(false);
  const [credDraft, setCredDraft] = useState(credentials);

  useEffect(() => { if (!credEditing) setCredDraft(credentials); }, [savedCreds, credEditing]);

  const handleCredSave = async () => {
    if (!editCtx) return;
    const payload = {
      hdb: {
        active: credDraft.hdb.active,
        title: credDraft.hdb.title,
        firm: credDraft.hdb.firm,
        reg: credDraft.hdb.reg,
        sub: `${credDraft.hdb.firm} \u00b7 ${credDraft.hdb.reg}`,
      },
      bca: {
        active: credDraft.bca.active,
        title: credDraft.bca.title,
        firm: credDraft.bca.firm,
        reg: credDraft.bca.reg,
        sub: `${credDraft.bca.firm} \u00b7 ${credDraft.bca.reg}`,
      },
      landedEligible: credDraft.landedEligible,
    };
    await editCtx.save("credentials", payload);
    setCredEditing(false);
  };

  const hasActiveCredentials = credentials.hdb.active || credentials.bca.active || credentials.landedEligible;
  const hasBusinessInfo = allRows.some((r) => r.value.trim() !== "");

  // Hide entire section on live page when no credentials and no business info
  if (!editCtx && !hasActiveCredentials && !hasBusinessInfo) return null;

  return (
    <section className="py-[40px] md:py-[64px] px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn>
        <TagLabel>TRUST &amp; CREDENTIALS</TagLabel>
        <h2 style={{fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black}} className="font-normal tracking-[-0.03em] mt-3 mb-2">Trust &amp; Credentials</h2>
        <p style={{fontFamily: sans, color: C.gray}} className="text-[16px] md:text-[18px] mb-6">Verified licences and registrations</p>
        </FadeIn>

        <div className={`grid grid-cols-1 ${!editCtx && !hasActiveCredentials ? "" : "lg:grid-cols-[1fr_1fr]"} gap-6 lg:gap-8`}>
          {/* Left column: Credential cards — hidden on live page when no active credentials */}
          {(editCtx || hasActiveCredentials) && (<div className="relative flex flex-col gap-3">
            {/* Edit pencil — only when editCtx is present */}
            {editCtx && !credEditing && (
              <button
                type="button"
                onClick={() => setCredEditing(true)}
                className="absolute -top-2 -right-2 z-10 flex items-center gap-1.5 bg-white hover:bg-[#0f0f0d] hover:text-white text-[#0f0f0d] border border-[#e4e4e7] rounded-full px-3 py-1.5 shadow-sm transition-colors"
                title="Edit credentials"
              >
                <svg className="size-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.08em]">Edit</span>
              </button>
            )}

            {!credEditing && [
              { img: imgHdb, ...credentials.hdb },
              { img: imgBca, ...credentials.bca },
            ].filter((c) => c.active).map((c) => (
              <div key={c.title} className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] p-5 flex gap-4">
                <div className="bg-[#f8fafc] rounded-[12px] size-[69px] shrink-0 flex items-center justify-center">
                  <img src={resolveImg(c.img)} alt={c.title} className="h-[44px] w-[50px] object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-['DM_Sans',sans-serif] font-semibold text-[15px] md:text-[16px] text-[#0f0f0d] tracking-[-0.09px]">{c.title}</p>
                    <span className="bg-[rgba(22,163,74,0.08)] text-[#16a34a] font-['DM_Sans',sans-serif] font-medium text-[12px] px-2.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#71717a] tracking-[0.08px]">{c.firm} &middot; {c.reg}</p>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#99a1af] tracking-[0.08px] mt-1">{c.desc}</p>
                </div>
              </div>
            ))}

            {/* Landed renovations badge */}
            {!credEditing && credentials.landedEligible && (
              <div className="bg-[rgba(255,169,41,0.06)] border border-[rgba(255,169,41,0.27)] rounded-[12px] px-5 py-4 flex items-center gap-4">
                <svg className="size-[17px] shrink-0" viewBox="0 0 18.156 18.156" fill="none">
                  <rect height="16.5" stroke="#FFA929" strokeLinejoin="round" strokeWidth="1.65" width="16.5" x="0.825" y="0.825" />
                  <path d="M5 9L8 12L14 6" stroke="#FFA929" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
                </svg>
                <div>
                  <p className="font-['DM_Sans',sans-serif] font-semibold text-[14px] md:text-[15px] text-[#0f0f0d]">Eligible for Landed Home Renovations</p>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#71717a] tracking-[0.08px]">Certified to undertake full A&amp;A works on landed properties</p>
                </div>
              </div>
            )}

            {/* Credential edit panel */}
            {editCtx && credEditing && (
              <div className="bg-white border border-[#e4e4e7] rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e4e7] bg-[#f6f6f6]">
                  <div className="flex items-center gap-2">
                    <svg className="size-[14px] text-[#0f0f0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f0f0d]">Editing · Credentials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCredEditing(false)} className="font-['DM_Sans',sans-serif] text-[13px] text-[#71717a] hover:text-[#0f0f0d] px-3 py-1.5 rounded-[8px] transition-colors">Cancel</button>
                    <button type="button" onClick={handleCredSave} className="font-['DM_Sans',sans-serif] text-[13px] font-medium text-white bg-[#0f0f0d] hover:opacity-85 px-4 py-1.5 rounded-[8px] transition-opacity">Save</button>
                  </div>
                </div>
                <div className="p-5 space-y-6">
                  {/* HDB */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717a]">HDB Registered Contractor</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={credDraft.hdb.active}
                          onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, active: e.target.checked } })}
                          className="size-[16px] accent-[#0f0f0d] cursor-pointer"
                        />
                        <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#71717a]">Show this credential</span>
                      </label>
                    </div>
                    <div className={`space-y-3 ${credDraft.hdb.active ? "" : "opacity-50 pointer-events-none"}`}>
                      <input
                        type="text"
                        value={credDraft.hdb.title}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, title: e.target.value } })}
                        placeholder="Title"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.hdb.firm}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, firm: e.target.value } })}
                        placeholder="ID firm (e.g. Your Studio Pte Ltd)"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.hdb.reg}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, reg: e.target.value } })}
                        placeholder="Registration date (e.g. Registered 2014)"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                    </div>
                  </div>

                  {/* BCA */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717a]">BCA Licensed Builder</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={credDraft.bca.active}
                          onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, active: e.target.checked } })}
                          className="size-[16px] accent-[#0f0f0d] cursor-pointer"
                        />
                        <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#71717a]">Show this credential</span>
                      </label>
                    </div>
                    <div className={`space-y-3 ${credDraft.bca.active ? "" : "opacity-50 pointer-events-none"}`}>
                      <input
                        type="text"
                        value={credDraft.bca.title}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, title: e.target.value } })}
                        placeholder="Title"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.bca.firm}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, firm: e.target.value } })}
                        placeholder="ID firm (e.g. Your Studio Pte Ltd)"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.bca.reg}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, reg: e.target.value } })}
                        placeholder="Registration date (e.g. Licensed since 2015)"
                        className="w-full h-[42px] bg-[#f6f6f6] border border-[#e4e4e7] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                    </div>
                  </div>

                  {/* Landed eligibility toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={credDraft.landedEligible}
                      onChange={(e) => setCredDraft({ ...credDraft, landedEligible: e.target.checked })}
                      className="size-[18px] accent-[#0f0f0d] cursor-pointer"
                    />
                    <span className="font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d]">Show "Eligible for Landed Home Renovations" badge</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Right column: Business info table */}
          <div className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] overflow-hidden">
            <div className="border-b border-[#d8d3c8] px-5 py-3.5">
              <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] text-[#71717a] tracking-[0.42px] uppercase">Business Information</p>
            </div>
            {(editCtx ? allRows : allRows.filter((r) => r.value.trim() !== "")).map((info: any, i: number, arr: any[]) => (
              <div key={info.label} className={`flex gap-5 px-5 py-3 ${i < arr.length - 1 ? "border-b border-[#e4e4e7]" : ""}`}>
                <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#71717a] w-[160px] md:w-[180px] shrink-0">{info.label}</p>
                <div className="font-['DM_Sans',sans-serif] font-medium text-[14px] md:text-[15px] text-[#0f0f0d] flex-1 min-w-0">
                  {editCtx ? (
                    <BusinessInfoCell
                      value={info.value}
                      placeholder={`Add ${info.label.toLowerCase()}`}
                      onSave={(v) => handleBusinessSave(info.label, v)}
                    />
                  ) : (
                    <span>{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TAG ICON ─── */
function TagIcon({ icon, color }: { icon: string; color: string }) {
  const size = 12;
  switch (icon) {
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7" y="1" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1" y="7" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7" y="7" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dollar":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "palette":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="0.5" y="0.5" width="11" height="11" rx="1" stroke={color} strokeLinejoin="round" />
          <rect x="3" y="3" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="6.5" y="3" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="3" y="6.5" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="6.5" y="6.5" width="2.5" height="2.5" rx="0.5" fill={color} />
        </svg>
      );
    case "search":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="5.5" cy="5.5" r="3.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 10.5L8 8" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ruler":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1" stroke={color} strokeLinejoin="round" />
          <path d="M1 4H3.5M1 6H2.5M1 8H3.5" stroke={color} strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1" stroke={color} strokeLinejoin="round" />
          <path d="M3.5 6L5.5 8L8.5 4" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chart":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="6" width="2.5" height="5" rx="0.5" stroke={color} strokeLinejoin="round" />
          <rect x="4.75" y="3" width="2.5" height="8" rx="0.5" stroke={color} strokeLinejoin="round" />
          <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L2 3V6C2 8.5 3.8 10.7 6 11.5C8.2 10.7 10 8.5 10 6V3L6 1Z" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 3V6L8 7" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sparkle":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.2 4.8L11 6L7.2 7.2L6 11L4.8 7.2L1 6L4.8 4.8L6 1Z" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "key":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="4" cy="7" r="2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 5.5L9 2.5M9 2.5L11 4.5M9 2.5V2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── CASE STUDIES REMOVED ─── */

export function CaseStudies() { return null; }

/* ─── WHAT HOMEOWNERS SAY ─── */
function GoogleIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17.3308 17.3308" fill="none">
      <path d={svgPaths.p1299d240} fill="#4285F4" />
      <path d={svgPaths.pa779380} fill="#34A853" />
      <path d={svgPaths.p23f86e80} fill="#FBBC05" />
      <path d={svgPaths.p8c10180} fill="#EA4335" />
    </svg>
  );
}

const reviewsData: { name: string; initial: string; time: string; text: string }[] = [];

const reviewTabs = [
  { label: "Network Reviews", icon: "network" as const },
  { label: "Google Reviews", icon: "google" as const },
];

function AddMemberModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (file: File, name: string, designation: string) => Promise<void>;
  saving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, saving]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || saving) return;
    await onSave(file, name.trim(), designation.trim());
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px", background: "#f6f6f6",
    border: "1px solid #e4e4e7", borderRadius: "10px", color: "#0f0f0d",
    fontFamily: "'DM Sans', sans-serif", fontSize: "14px", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#9a9790", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: "6px",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,13,0.55)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden flex flex-col"
        style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", boxShadow: "0 24px 60px rgba(15,15,13,0.25)", fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #e4e4e7", background: "#f6f6f6" }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#9a9790" }}>Team</div>
            <h2 className="mt-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "22px", color: "#0f0f0d", lineHeight: 1.2 }}>Add Team Member</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-40" style={{ background: "#fff", border: "1px solid #e4e4e7", color: "#71717a" }} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Photo upload */}
          <div>
            <label style={labelStyle}>Photo <span style={{ color: "#c14" }}>*</span></label>
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div
                className="size-[72px] rounded-full shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: preview ? "transparent" : "#f6f6f6", border: preview ? "3px solid #0f0f0d" : "2px dashed #d8d3c8" }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="size-full object-cover rounded-full" />
                ) : (
                  <svg className="size-6 text-[#9a9790]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-[14px] font-medium" style={{ color: "#0f0f0d" }}>{preview ? "Change photo" : "Upload a photo"}</p>
                <p className="text-[12px]" style={{ color: "#9a9790" }}>JPG, PNG — square recommended</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Name <span style={{ color: "#c14" }}>*</span></label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Tan" />
          </div>

          {/* Designation */}
          <div>
            <label style={labelStyle}>Designation</label>
            <input style={inputStyle} value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Designer" />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || !name.trim() || saving}
            className="h-[48px] rounded-[12px] text-[14px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "#0f0f0d", color: "#fafaf8", fontFamily: "'DM Sans', sans-serif" }}
          >
            {saving ? "Saving…" : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddStoryModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (file: File, title: string, description: string, location: string) => Promise<void>;
  saving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const isVideo = file?.type.startsWith("video/");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, saving]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || saving) return;
    await onSave(file, title, description, location);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px", background: "#f6f6f6",
    border: "1px solid #e4e4e7", borderRadius: "10px", color: "#0f0f0d",
    fontFamily: "'DM Sans', sans-serif", fontSize: "14px", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#9a9790", fontFamily: "'DM Sans', sans-serif", display: "block", marginBottom: "6px",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,13,0.55)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative w-full max-w-[480px] overflow-hidden flex flex-col"
        style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: "16px", boxShadow: "0 24px 60px rgba(15,15,13,0.25)", fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #e4e4e7", background: "#f6f6f6" }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#9a9790" }}>New Story</div>
            <h2 className="mt-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "22px", color: "#0f0f0d", lineHeight: 1.2 }}>Add Story</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-40" style={{ background: "#fff", border: "1px solid #e4e4e7", color: "#71717a" }} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* File upload */}
          <div>
            <label style={labelStyle}>Photo or Video <span style={{ color: "#c14" }}>*</span></label>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-full overflow-hidden cursor-pointer group/cover"
              style={{ aspectRatio: "9/16", maxHeight: "320px", background: "#f6f6f6", border: "2px dashed #e4e4e7", borderRadius: "12px" }}
            >
              {preview ? (
                <>
                  {isVideo ? (
                    <video src={preview} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/0 group-hover/cover:bg-black/30">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/cover:opacity-100 transition-opacity"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9a9790" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M16 3v6M8 3v6"/></svg>
                  <span className="text-[12px]" style={{ color: "#9a9790" }}>Click to upload photo or video</span>
                </div>
              )}
            </button>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input type="text" value={title} placeholder="e.g. Kitchen Renovation Reveal" onChange={(e) => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0f0f0d"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e4e4e7"; }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} placeholder="e.g. A quick look at the completed kitchen makeover" onChange={(e) => setDescription(e.target.value)}
              className="w-full px-[14px] py-3 text-[14px] outline-none transition-colors resize-none"
              rows={3}
              style={{ background: "#f6f6f6", border: "1px solid #e4e4e7", borderRadius: "10px", color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0f0f0d"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e4e4e7"; }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input type="text" value={location} placeholder="e.g. Toa Payoh, Singapore" onChange={(e) => setLocation(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0f0f0d"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e4e4e7"; }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="h-10 px-4 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40" style={{ background: "#fff", color: "#0f0f0d", border: "1px solid #e4e4e7", borderRadius: "10px" }}>Cancel</button>
            <button type="submit" disabled={!file || saving} className="h-10 px-5 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 flex items-center gap-2" style={{ background: "#0f0f0d", color: "#fff", border: "1px solid #0f0f0d", borderRadius: "10px" }}>
              {saving ? (
                <><svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Uploading…</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Add Story</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VideoUploadSlot({ onUploaded }: { onUploaded: (url: string) => void }) {
  const editCtx = useContext(ProfileEditContext);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { return; }
    if (file.size > 50 * 1024 * 1024) { return; }
    setUploading(true);
    try {
      const url = await editCtx?.uploadImage?.(file);
      if (url) onUploaded(url);
    } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => !uploading && fileRef.current?.click()}
        disabled={uploading}
        className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ aspectRatio: "16/9", background: "#f6f6f6", border: "2px dashed #e4e4e7", borderRadius: "14px" }}
      >
        {uploading ? (
          <div className="w-6 h-6 border-2 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a9790" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9a9790" }}>Upload video (16:9)</span>
          </>
        )}
      </button>
    </>
  );
}

export function HomeownersSay() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const rData = ctx?.reviewsData ?? reviewsData;
  const hasGoogleH = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const rating = hasGoogleH ? String(ctx!.googleMeta!.rating) : (ctx?.profile?.stats?.rating || "4.9");

  // Hide on live page when no reviews and no Google data exist
  if (!editCtx && !rData.length && !hasGoogleH) return null;

  return (
    <section className="py-[40px] md:py-[64px] px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Centered header */}
        <FadeIn>
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <TagLabel>HOMEOWNER REVIEWS</TagLabel>
          <h2 style={{fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black}} className="font-normal tracking-[-0.03em] mt-3 text-center">
            What Homeowners Say
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Stars count={5} size="size-[16px]" />
            <span style={{fontFamily: sans}} className="font-medium text-[16px] text-[#9a9790]">{rating}/5 Average Rating</span>
          </div>
        </div>
        </FadeIn>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[38px]">
          {/* LEFT: Latest Reviews */}
          <div className="w-full lg:flex-[1_1_0]">
            <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] leading-[28px] mb-4">
              Latest Reviews
            </h3>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-3 mb-5">
              {reviewTabs.map((tab) => (
                <button
                  key={tab.label}
                  className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[100px] px-[14px] py-[8px] flex items-center gap-[7px] cursor-pointer hover:bg-[#e8e4db] transition-colors"
                >
                  {tab.icon === "network" ? (
                    <img src="/002 Page 1.jpg" alt="Network" className="size-[17px] shrink-0 rounded-[3px] object-cover" />
                  ) : (
                    <GoogleIcon className="size-[17px] shrink-0" />
                  )}
                  <span className="font-['DM_Sans',sans-serif] font-medium text-[13.6px] text-[#364153] tracking-[0.08px] whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-4">
              {rData.map((r: any, i: number) => (
                <div
                  key={`latest-${i}`}
                  className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] p-[21px]"
                >
                  {/* Header: avatar + name/time */}
                  <div className="flex items-center justify-between mb-[15px]">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#ffedd4] rounded-full size-[32px] flex items-center justify-center shrink-0">
                        <span className="font-['DM_Sans',sans-serif] font-bold text-[12px] text-[#f54900]">{r.initial}</span>
                      </div>
                      <div>
                        <p className="font-['DM_Sans',sans-serif] font-semibold text-[14px] text-[#0f0f0d] leading-[20px]">{r.name}</p>
                        <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#99a1af] leading-[16px]">{r.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-[5px] mb-[15px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="size-[12px]" viewBox="0 0 12 12" fill="none">
                        <path d={svgPaths.p295e8380} fill="#FFB900" stroke="#FFB900" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#71717a] leading-[22.75px]">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Video Tours & Stories */}
          <div className="w-full lg:w-[544px] shrink-0">
            <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] leading-[28px] mb-4">
              Video Tours &amp; Stories
            </h3>

            <div className="flex flex-col gap-6">
              {(ctx?.profile?.videoTours || []).map((v: any, i: number) => (
                <div key={i} className="relative rounded-[16px] overflow-hidden border border-[#d8d3c8] cursor-pointer group" style={{ aspectRatio: "16/9" }}>
                  <video src={resolveImg(v.src)} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full size-[64px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="size-[24px] ml-1" viewBox="0 0 24 24" fill="none">
                        <path d="M6 3L20 12L6 21V3Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  {v.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16">
                      <p className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-white leading-[24px]">{v.title}</p>
                    </div>
                  )}
                  {editCtx && (
                    <button
                      onClick={() => editCtx.saveCollection?.("removeVideoTour", i)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer"
                      style={{ background: "rgba(15,15,13,0.7)", color: "#fff" }}
                      aria-label="Remove video"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Upload slots in editor — max 2 videos */}
              {editCtx && (ctx?.profile?.videoTours || []).length < 2 && (
                <VideoUploadSlot
                  onUploaded={(url) => editCtx.saveCollection?.("addVideoTour", url)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GOOGLE REVIEW CARDS (with images) ─── */
function ReviewCard({ review, index }: { review: typeof reviews[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const ctx = useDesignerCtx();
  const placeId = ctx?.googleMeta?.placeId;
  const googleReviewsUrl = placeId
    ? `https://search.google.com/local/reviews?placeid=${placeId}`
    : null;
  const starRating = typeof review.rating === "number" ? review.rating : 5;

  return (
    <div className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] overflow-hidden">
      {/* Image — only render when the review has one (Google Place reviews don't supply images) */}
      {review.img && (
        <div className={`relative w-full overflow-hidden ${review.hasVideo ? "h-[253px]" : "h-[160px]"}`}>
          <img
            src={resolveImg(review.img)}
            alt={review.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {review.hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-full size-[32px] flex items-center justify-center shadow-md">
                <svg className="size-[16px] ml-0.5" viewBox="0 0 13.3333 13.3333" fill="none">
                  <path d="M0.666667 0.666667L10 6.66667L0.666667 12.6667V0.666667Z" fill="#515151" stroke="#515151" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Stars + Verified — clickable to Google Reviews */}
        <a
          href={googleReviewsUrl || "#"}
          target={googleReviewsUrl ? "_blank" : undefined}
          rel={googleReviewsUrl ? "noopener noreferrer" : undefined}
          className="flex items-center justify-between mb-1 no-underline cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => { if (!googleReviewsUrl) e.preventDefault(); }}
        >
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="size-[14px]" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.167L8.682 4.702L12.6 5.232L9.8 7.955L10.521 11.856L7 10.069L3.479 11.856L4.2 7.955L1.4 5.232L5.318 4.702L7 1.167Z" fill={i < starRating ? "#FFA929" : "#E0DDD7"} />
              </svg>
            ))}
          </div>
          <div className="flex items-center gap-[6px]">
            <img src={imgGoogle} alt="Google" className="size-[16px] object-contain" />
            <span className="font-['DM_Sans',sans-serif] font-medium text-[12px] text-[#34a42f] leading-[16px]">Verified</span>
          </div>
        </a>

        {/* Title */}
        <h4 className="font-['DM_Sans',sans-serif] font-semibold text-[16px] text-[#242424] leading-[22px] mt-1.5 mb-2">
          {review.title}
        </h4>

        {/* Text + Read more / Read less */}
        <div className="mb-3">
          <motion.div
            initial={false}
            animate={{ height: expanded ? "auto" : "68px" }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden relative"
            ref={contentRef}
          >
            <p className="font-['DM_Sans',sans-serif] font-normal text-[14px] text-[#4a4a4a] leading-[22.75px]">
              {expanded ? review.fullText : review.text}
            </p>
          </motion.div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] mt-1 cursor-pointer hover:underline"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        </div>

        {/* Divider + Reviewer */}
        <div className="border-t border-[#e4e4e7] pt-3 flex items-center gap-[10px]">
          <div className={`${review.bgColor} rounded-full size-[36px] flex items-center justify-center shrink-0`}>
            <span className={`font-['DM_Sans',sans-serif] font-semibold text-[14px] ${review.textColor} leading-[20px]`}>
              {review.initial}
            </span>
          </div>
          <div>
            <p className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#1f1f1f] leading-[20px]">{review.name}</p>
            <p className="font-['DM_Sans',sans-serif] font-normal text-[12px] text-[#9a9a9a] leading-[16px]">{review.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoogleReviewCards() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  // Prefer cached Google Place reviews when the server returned any.
  // Fall back to the designer-authored `reviews` array (or the empty
  // module-level fallback) so the section still renders during dev.
  const googleRvws = ctx?.googleReviews ?? [];
  const rvws = googleRvws.length > 0 ? googleRvws : (ctx?.reviews ?? reviews);
  const googlePlaceId = ctx?.googleMeta?.placeId;
  const totalRatings = ctx?.googleMeta?.totalRatings;
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const COLLAPSED_HEIGHT = 420;

  // Distribute reviews across 3 columns dynamically (masonry-style)
  const col1 = rvws.filter((_: any, i: number) => i % 3 === 0);
  const col2 = rvws.filter((_: any, i: number) => i % 3 === 1);
  const col3 = rvws.filter((_: any, i: number) => i % 3 === 2);

  // Measure the full grid height whenever it renders / resizes / data changes
  useEffect(() => {
    if (!gridRef.current) return;
    const measure = () => setContentHeight(gridRef.current?.scrollHeight ?? 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [rvws.length]);

  // Hide on live page when no reviews exist
  if (!editCtx && !rvws.length) return null;

  const showViewMore = rvws.length > 8;

  const toggle = () => {
    if (expanded) {
      // collapsing — scroll section into view after the animation starts
      setExpanded(false);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setExpanded(true);
    }
  };

  return (
    <section ref={sectionRef} className="py-[40px] md:py-[64px] px-4 md:px-8 border-b border-[#d8d3c8] scroll-mt-[80px]">
      <div className="max-w-[1280px] mx-auto">

        {/* Header lives in <RatingBreakdown /> directly above this section
            (which is now the "HOMEOWNER REVIEWS / What Homeowners Say" header
            for the combined reviews block). No centered header needed here. */}

        {/* ── Reviews container with animated max-height ── */}
        <div className="relative">
          <div
            ref={gridRef}
            style={{
              maxHeight: !showViewMore ? "none" : expanded ? `${contentHeight}px` : `${COLLAPSED_HEIGHT}px`,
              transition: "max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: showViewMore ? "hidden" : "visible",
            }}
          >
            {/* Desktop: masonry 3-column layout — dynamically distributes any number of reviews */}
            <div className="hidden md:grid grid-cols-3 gap-5">
              {/* Column 1 */}
              <div className="flex flex-col gap-5">
                {col1.map((review: any, i: number) => (
                  <ReviewCard key={`col1-${i}`} review={review} index={i * 3} />
                ))}
              </div>
              {/* Column 2 */}
              <div className="flex flex-col gap-5">
                {col2.map((review: any, i: number) => (
                  <ReviewCard key={`col2-${i}`} review={review} index={i * 3 + 1} />
                ))}
              </div>
              {/* Column 3 */}
              <div className="flex flex-col gap-5">
                {col3.map((review: any, i: number) => (
                  <ReviewCard key={`col3-${i}`} review={review} index={i * 3 + 2} />
                ))}
              </div>
            </div>
            {/* Mobile: single column */}
            <div className="md:hidden flex flex-col gap-5">
              {rvws.map((review: any, i: number) => (
                <ReviewCard key={`review-m-${i}`} review={review} index={i} />
              ))}
            </div>
          </div>

          {/* Gradient fade — only show when there are more than 8 reviews */}
          {showViewMore && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-[2]"
              style={{
                background: "linear-gradient(to bottom, rgba(240,237,230,0) 0%, rgba(240,237,230,0.85) 50%, rgba(240,237,230,1) 100%)",
                opacity: expanded ? 0 : 1,
                transition: "opacity 0.5s ease",
              }}
            />
          )}
        </div>

        {/* ── View More / View Less button — only when more than 8 reviews ── */}
        {showViewMore && (
          <button
            onClick={toggle}
            className="flex flex-col items-center gap-[8px] mx-auto mt-7 cursor-pointer border-none bg-transparent p-2 group"
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#333] leading-[32px] tracking-[0.01em]">
              {expanded ? "View Less" : "View More"}
            </span>
            <div
              className="size-[44px] rounded-full border-[1.5px] border-[#ccc] flex items-center justify-center group-hover:border-[#888] group-hover:bg-black/[0.04]"
              style={{
                transition: "transform 0.4s ease, border-color 0.3s ease, background 0.3s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg className="size-[18px] text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </button>
        )}

        {/* ── View all reviews on Google ── */}
        {googlePlaceId && (
          <a
            href={`https://search.google.com/local/reviews?placeid=${googlePlaceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mx-auto mt-6 px-6 h-[44px] rounded-full border border-[#d8d3c8] bg-white hover:bg-[#fafaf8] transition no-underline group"
          >
            <img src={imgGoogle} alt="Google" className="size-[18px] object-contain" />
            <span className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#333] group-hover:text-[#0f0f0d]">
              View all {totalRatings ? `${totalRatings} ` : ""}reviews on Google
            </span>
            <svg className="size-[14px] text-[#999] group-hover:text-[#555] transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

      </div>
    </section>
  );
}

/* ─── SERVICE AREA ─── */
const SG_ROUTES = [
  "via Central Expressway (CTE)",
  "via Pan Island Expressway (PIE)",
  "via Ayer Rajah Expressway (AYE)",
  "via East Coast Parkway (ECP)",
  "via Orchard Road",
  "via Bukit Timah Road",
];
const DEST_LABEL = "Singapore";

// Ubi HQ coordinates
const HQ_LAT = 1.3271;
const HQ_LNG = 103.8918;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function lookupPostalCode(postal: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postal}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const match = data.results.find((r: any) => r.POSTAL === postal);
    if (!match) return null;
    return {
      lat: parseFloat(match.LATITUDE),
      lng: parseFloat(match.LONGITUDE),
      address: match.ADDRESS || match.SEARCHVAL || postal,
    };
  } catch {
    return null;
  }
}

function isValidSGPostal(v: string) {
  if (!/^\d{6}$/.test(v)) return false;
  const prefix = parseInt(v.slice(0, 2));
  return prefix >= 1 && prefix <= 82;
}

export function ServiceArea() {
  const ctx = useDesignerCtx();
  const sa = ctx?.serviceArea;
  const hqLat = sa?.hqLat || HQ_LAT;
  const hqLng = sa?.hqLng || HQ_LNG;
  const destLabel = sa?.hqAddress || DEST_LABEL;
  const saDesc = sa?.description || "Add your service coverage description.";
  const mapUrl = sa?.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.4!2d103.8918!3d1.3271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da181f5dc73855%3A0x0!2s33+Ubi+Ave+3%2C+Singapore+408868!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg";
  const companyName = ctx?.profile?.name || "Your Studio";

  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    mins: number;
    km: string;
    arrive: string;
    route: string;
    mapsUrl: string;
  } | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const getETA = async () => {
    setError("");
    if (!postalCode) {
      setError("Please enter a Singapore postal code.");
      return;
    }
    if (!isValidSGPostal(postalCode)) {
      setError("Please enter a valid 6-digit Singapore postal code (e.g. 238859).");
      return;
    }

    setLoading(true);
    setResult(null);

    // Verify postal code exists via Singapore OneMap API
    const location = await lookupPostalCode(postalCode);
    if (!location) {
      setLoading(false);
      setError("Address not found — this postal code doesn't exist in Singapore.");
      return;
    }

    const gmUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(location.address)}&destination=${encodeURIComponent(destLabel)}&travelmode=driving`;

    // Calculate realistic distance & ETA from real coordinates
    const straightKm = haversineKm(location.lat, location.lng, hqLat, hqLng);
    const roadKm = straightKm * (1.3 + Math.random() * 0.2); // road factor ~1.3-1.5x
    const km = Math.max(0.5, roadKm).toFixed(1);
    const avgSpeedKmh = 30 + Math.random() * 15; // 30-45 km/h avg Singapore driving
    const mins = Math.max(3, Math.round((roadKm / avgSpeedKmh) * 60));
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + mins);
    const arrStr = eta.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    const route = SG_ROUTES[Math.floor(Math.random() * SG_ROUTES.length)];

    setResult({ mins, km, arrive: arrStr, route, mapsUrl: gmUrl });
    setLoading(false);
  };

  const etaDisplay = result
    ? result.mins >= 60
      ? { num: `${Math.floor(result.mins / 60)}${result.mins % 60 ? `:${String(result.mins % 60).padStart(2, "0")}` : ""}`, unit: "hr" }
      : { num: String(result.mins), unit: "min" }
    : null;

  return (
    <section className="py-[40px] md:py-[64px] px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn>
        <div className="text-center mb-8">
          <TagLabel>SERVICE AREA</TagLabel>
          <h2 style={{fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black}} className="font-normal tracking-[-0.03em] mt-3 mb-2">Our Service Area</h2>
          <p style={{fontFamily: sans, color: C.gray}} className="text-[16px] md:text-[18px] max-w-[464px] mx-auto leading-[1.7]">
            {saDesc}
          </p>
        </div>
        </FadeIn>

        {/* Map card */}
        <div className="relative rounded-[16px] overflow-hidden h-[400px] md:h-[537px] group border border-[#d8d3c8]">
          {/* Google Maps iframe with dark filter */}
          <iframe
            className="absolute inset-0 w-full h-full border-none pointer-events-none"
            style={{
              filter: "saturate(0.18) brightness(0.48) hue-rotate(200deg)",
              transition: "filter 0.5s",
            }}
            src={`${mapUrl}&gestureHandling=none&zoomControl=false&mapTypeControl=false&scaleControl=false&streetViewControl=false&rotateControl=false&fullscreenControl=false`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Service Area Map"
          />

          {/* Animated Pin */}
          <div className="absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[9px] z-[2] pointer-events-none">
            <div
              className="size-[78px] rounded-full flex items-center justify-center"
              style={{
                background: "rgba(220, 48, 48, 0.2)",
                animation: "serviceAreaBreathe 2.4s ease-in-out infinite",
              }}
            >
              <div
                className="size-[52px] rounded-full flex items-center justify-center"
                style={{ background: "rgba(220, 48, 48, 0.35)" }}
              >
                <div
                  className="size-[32px] rounded-full bg-[#dc3030] flex items-center justify-center"
                  style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px rgba(220,48,48,0.5)" }}
                >
                  <svg className="size-[14px] fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.94] text-[#1a1f2e] text-[11px] font-medium tracking-[0.02em] px-[14px] py-[5px] rounded-full whitespace-nowrap font-['DM_Sans',sans-serif]">
              {companyName} HQ
            </div>
          </div>

          {/* ETA Result Card */}
          {(loading || result) && (
            <div
              className="absolute bottom-[90px] left-0 right-0 mx-auto z-[3] font-['DM_Sans',sans-serif]"
              style={{
                width: "min(480px, calc(100% - 40px))",
                animation: "serviceAreaFadeDown 0.3s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              <div className="bg-white/[0.97] rounded-[16px] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-baseline">
                      {loading ? (
                        <span
                          className="inline-block size-5 rounded-full border-[2.5px] border-[#dde1ec] align-middle"
                          style={{
                            borderTopColor: "#3b4260",
                            animation: "serviceAreaSpin 0.7s linear infinite",
                          }}
                        />
                      ) : (
                        <>
                          <span className="text-[32px] font-medium text-[#1a1f2e] leading-none">{etaDisplay?.num}</span>
                          <span className="text-[14px] text-[#9aa0b4] font-normal ml-[3px]">{etaDisplay?.unit}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9aa0b4] mt-1">
                      {loading ? "Finding best route\u2026" : result?.route}
                    </div>
                  </div>
                  {result && (
                    <a
                      href={result.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-[#1a1f2e] text-white rounded-[10px] px-[14px] py-[9px] text-[11px] font-medium tracking-[0.04em] inline-flex items-center gap-[5px] no-underline whitespace-nowrap hover:bg-[#2d3449] transition-colors"
                    >
                      <svg className="size-[11px] fill-current" viewBox="0 0 24 24">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                      </svg>
                      Open in Maps
                    </a>
                  )}
                </div>
                {result && (
                  <>
                    <div className="h-px bg-[#edf0f5] my-[13px]" />
                    <div className="flex gap-6">
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Distance</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">{result.km} km</span>
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Arrive by</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">{result.arrive}</span>
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Mode</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">Driving</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Postal Code Input — always fixed at bottom */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3]"
            style={{ width: "min(480px, calc(100% - 40px))" }}
          >
            <div className="flex items-center gap-[10px] bg-white/[0.96] rounded-[14px] py-[9px] pr-[9px] pl-[15px]">
              <svg className="shrink-0 size-[17px] text-[#b0b8cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={postalCode}
                onChange={handleInput}
                onKeyDown={(e) => e.key === "Enter" && getETA()}
                placeholder="Enter Postal Code"
                className="flex-1 bg-transparent border-none outline-none font-['DM_Sans',sans-serif] text-[13.5px] font-normal text-[#1a1f2e] placeholder:text-[#b8bece] min-w-0"
              />
              <button
                onClick={getETA}
                className="shrink-0 size-[42px] rounded-[10px] bg-[#3b4260] border-none cursor-pointer flex items-center justify-center hover:bg-[#4e5580] active:scale-[0.93] transition-all"
                title="Get ETA"
              >
                <svg className="size-4 fill-white" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-[#c0392b] text-center mt-[7px] font-['DM_Sans',sans-serif]">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes serviceAreaBreathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes serviceAreaFadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes serviceAreaSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

/* ─── MOBILE QUOTE CARD ─── */
function MobileQuoteSection() {
  return (
    <div className="lg:hidden">
      <QuoteCard />
    </div>
  );
}

/* ─── BREADCRUMBS ─── */
function Breadcrumbs() {
  const ctx = useDesignerCtx();
  const name = ctx?.profile?.name || "Designer";
  return (
    <nav className="py-4" style={{ fontFamily: sans }}>
      <div className="flex items-center gap-2 text-[13px]" style={{ color: C.grayLight }}>
        <Link to="/" className="hover:underline" style={{ color: C.gray, textDecoration: "none" }}>Home</Link>
        <svg className="size-[10px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        <Link to="/interior-designers" className="hover:underline" style={{ color: C.gray, textDecoration: "none" }}>Interior Designers</Link>
        <svg className="size-[10px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        <span style={{ color: C.black }}>{name}</span>
      </div>
    </nav>
  );
}

/* ─── KEY METRICS ─── */
export function KeyMetrics({ cols = 4 }: { cols?: 2 | 4 } = {}) {
  const ctx = useDesignerCtx();
  const s = ctx?.profile?.stats;
  const projectCount = ctx?.projects?.length ?? 0;
  const bInfo = ctx?.businessInfo ?? [];
  const yearsEntry = bInfo.find((b: any) => b.label?.toLowerCase().includes("year"));
  const yearsVal = String(s?.years ?? yearsEntry?.value ?? "10+");
  const budgetEntry = bInfo.find((b: any) => b.label?.toLowerCase().includes("budget"));
  const budgetVal = budgetEntry?.value?.trim() || "$30k – $120k";

  // Prefer Google rating when available
  const hasGoogle = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const googleRating = hasGoogle ? ctx!.googleMeta!.rating : null;

  type Metric = {
    value: string;
    valuePath: string | undefined;
    suffix: string;
    label: string;
    icon: any;
    /** Optional override for the value font size — used when the value is a long string (e.g. budget range). */
    valueClassName?: string;
    /** When set, the value is rendered through BusinessInfoEditCell so it can be inline-edited
     *  as a row in the profile's businessInfo array (matching the Quick Facts grid). */
    businessInfoLabel?: string;
  };

  const metrics: Metric[] = [
    {
      value: googleRating ? String(googleRating) : (s?.rating || "4.9"),
      valuePath: undefined,
      suffix: "/5.0",
      label: "Average Rating",
      icon: <svg className="size-[20px]" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFA929" /></svg>,
    },
    {
      value: projectCount > 0 ? String(projectCount) : "50+",
      valuePath: undefined,
      suffix: "",
      label: "Projects Completed",
      icon: <svg className="size-[20px]" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    },
    {
      value: yearsVal,
      valuePath: "stats.years",
      suffix: yearsVal.includes("+") ? "" : " yrs",
      label: "Industry Experience",
      icon: <svg className="size-[20px]" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
    },
    {
      value: budgetVal,
      valuePath: undefined,
      suffix: "",
      label: "Budget Range",
      // Smaller font + tracking-tight so longer strings like "$30,000 – $120,000" stay on one line.
      valueClassName: "text-[18px] md:text-[20px] font-normal leading-tight tracking-tight",
      // Routes through BusinessInfoEditCell so the value can be edited inline and persisted
      // to the businessInfo array under the "Budget range" label.
      businessInfoLabel: "Budget range",
      icon: <svg className="size-[20px]" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    },
  ];

  const gridCls = cols === 2
    ? "grid grid-cols-2 gap-3 md:gap-4"
    : "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4";

  return (
    <FadeIn>
      <div className={gridCls}>
        {metrics.map((m) => (
          <div key={m.label} className="bg-[#f5f1e8] border border-[#d8d3c8] rounded-[12px] p-5 md:p-6">
            <div className="mb-3">{m.icon}</div>
            <div className="flex items-baseline gap-0.5">
              {m.valuePath ? (
                <EditableText
                  value={m.value}
                  path={m.valuePath}
                  placeholder="—"
                  className={m.valueClassName ?? "text-[32px] md:text-[36px] font-normal leading-none"}
                  style={{ fontFamily: serif, color: C.black }}
                />
              ) : m.businessInfoLabel ? (
                <BusinessInfoEditCell
                  index={-1}
                  value={m.value}
                  label={m.businessInfoLabel}
                  placeholder="$30k – $120k"
                  displayClassName={m.valueClassName ?? "text-[32px] md:text-[36px] font-normal leading-none"}
                  inputClassName={m.valueClassName ?? "text-[32px] md:text-[36px] font-normal leading-none"}
                  displayStyle={{ fontFamily: serif, color: C.black }}
                  inputStyle={{ fontFamily: serif, color: C.black }}
                />
              ) : (
                <span
                  style={{ fontFamily: serif, color: C.black }}
                  className={m.valueClassName ?? "text-[32px] md:text-[36px] font-normal leading-none"}
                >
                  {m.value}
                </span>
              )}
              {m.suffix && <span style={{ fontFamily: sans, color: C.grayLight }} className="text-[14px]">{m.suffix}</span>}
            </div>
            <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[13px] md:text-[14px] mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

/* ─── RATING BREAKDOWN ─── */
export function RatingBreakdown() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);

  // Prefer Google data when available, fall back to manual stats
  const hasGoogle = ctx?.googleMeta && ctx.googleMeta.source === "google" && ctx.googleMeta.totalRatings > 0;
  const rating = hasGoogle
    ? ctx!.googleMeta!.rating
    : parseFloat(ctx?.profile?.stats?.rating || "4.9");
  const reviewCount = ctx?.reviewsData?.length ?? 0;
  const totalReviews = hasGoogle
    ? ctx!.googleMeta!.totalRatings
    : (ctx?.profile?.stats?.reviewCount || reviewCount || "186");

  const categories = [
    { label: "Design Quality", score: Math.min(5, rating + 0.05) },
    { label: "Communication", score: Math.min(5, rating - 0.1) },
    { label: "Value for Money", score: Math.min(5, rating - 0.15) },
    { label: "Timeliness", score: Math.min(5, rating - 0.05) },
    { label: "Workmanship", score: rating },
  ];

  if (!editCtx && !reviewCount && !hasGoogle && !ctx?.profile?.stats?.rating) return null;

  return (
    <section className="py-[40px] md:py-[64px]">
      <FadeIn>
        <div className="flex flex-col items-center text-center mb-8">
          <TagLabel>HOMEOWNER REVIEWS</TagLabel>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3">
            What Homeowners Say
          </h2>
        </div>

        <div className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[16px] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Left: Overall score */}
            <div className="flex flex-col items-center md:items-start shrink-0 md:w-[180px]">
              <span style={{ fontFamily: serif, color: C.black }} className="text-[56px] md:text-[64px] font-normal leading-none">{rating.toFixed(1)}</span>
              <div className="flex gap-[2px] mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="size-[16px]" viewBox="0 0 24 24" fill={i < Math.round(rating) ? "#FFA929" : "#d8d3c8"}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[14px] mt-2">{totalReviews} reviews</p>
            </div>

            {/* Right: Category bars */}
            <div className="flex-1 flex flex-col gap-4">
              {categories.map((cat) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span style={{ fontFamily: sans, color: C.gray }} className="text-[14px] w-[130px] shrink-0">{cat.label}</span>
                  <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: C.creamBorder }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cat.score / 5) * 100}%`, background: C.black }} />
                  </div>
                  <span style={{ fontFamily: sans, color: C.black }} className="text-[14px] font-medium w-[32px] text-right">{cat.score.toFixed(1)}</span>
                </div>
              ))}
              <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[12px] mt-1">Based on overall rating</p>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* Inline editable cell for a single businessInfo row.
 * businessInfo is stored as an array on the profile and saved via the
 * "businessinfo" server section as a whole array — so we rebuild the full
 * array on commit and route through editCtx.save("businessInfo", arr).
 *
 * Optional className/style props let callers reuse this cell in places that
 * need different typography (e.g. the KeyMetrics budget tile uses serif/large). */
function BusinessInfoEditCell({
  index,
  value,
  label,
  displayClassName,
  displayStyle,
  inputClassName,
  inputStyle,
  placeholder = "Click to edit",
}: {
  index: number;
  value: string;
  label: string;
  displayClassName?: string;
  displayStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  placeholder?: string;
}) {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.select(); } catch {}
    }
  }, [editing]);

  if (!editCtx) {
    return (
      <span
        style={displayStyle ?? { fontFamily: sans, color: C.black }}
        className={displayClassName ?? "text-[14px] md:text-[15px] font-medium flex-1"}
      >
        {value}
      </span>
    );
  }

  const commit = async () => {
    setEditing(false);
    if (draft === value) return;
    setSaving(true);
    try {
      const current = (ctx?.businessInfo ?? []) as any[];
      // Identify the row by label, not by the (potentially stale) index. This
      // also lets virtual default rows — which start with biIndex === -1 —
      // create a new entry on first save instead of overwriting the array.
      const existingIdx = current.findIndex((b: any) => b?.label === label);
      const next = existingIdx >= 0
        ? current.map((b, i) => (i === existingIdx ? { ...b, value: draft } : b))
        : [...current, { label, value: draft }];
      await Promise.resolve(editCtx.save("businessInfo", next));
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  const baseDisplayCls = displayClassName ?? "text-[14px] md:text-[15px] font-medium flex-1";
  const baseInputCls = inputClassName ?? "text-[14px] md:text-[15px] font-medium flex-1";
  const baseDisplayStyle = displayStyle ?? { fontFamily: sans, color: C.black };
  const baseInputStyle = inputStyle ?? { fontFamily: sans, color: C.black };

  if (!editing) {
    return (
      <span
        onClick={(e) => { if (saving) return; e.stopPropagation(); setEditing(true); }}
        className={`${baseDisplayCls} ${saving ? "cursor-wait opacity-60" : "cursor-text hover:bg-[rgba(15,15,13,0.06)] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#e4e4e7] hover:outline-offset-2"} rounded-[4px] transition-colors inline-flex items-center gap-1.5`}
        style={baseDisplayStyle}
        title={saving ? "Saving…" : placeholder}
      >
        {value || <span style={{ color: "#a8a8a8" }}>{placeholder}</span>}
        {saving && (
          <svg className="size-[12px] animate-spin shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: "#71717a" }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
    );
  }

  return (
    <input
      ref={(el) => { inputRef.current = el; }}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
      className={`${baseInputCls} bg-white border border-[#0f0f0d] rounded-[6px] px-2 py-1 outline-none`}
      style={baseInputStyle}
    />
  );
}

/* Multi-select dropdown for Quick Fact list-type fields ("Project types",
 * "Style specialisation"). Stores the selection back into businessInfo as a
 * middle-dot (·) separated string matching the public-page chip renderer. */
function BusinessInfoMultiSelect({
  value,
  label,
  options,
}: {
  value: string;
  label: string;
  options: string[];
}) {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Parse ·-separated value into a Set for fast lookups.
  // Primary delimiter is middle dot (·). For backward compat with data saved
  // using commas, also try extracting known options from the raw string.
  const rawParts = (value || "")
    .split(/\s*\u00b7\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  // If the split produced a blob that doesn't match any option, try extracting
  // known options from it (handles legacy comma-separated data where values
  // like "HDB (BTO, Resale, Maisonette)" contain commas themselves).
  const parsed: string[] = [];
  for (const part of rawParts) {
    if (options.includes(part)) {
      parsed.push(part);
    } else {
      // Try to find known options within this part
      let remaining = part;
      let found = false;
      for (const opt of options) {
        if (remaining.includes(opt)) {
          parsed.push(opt);
          remaining = remaining.replace(opt, "");
          found = true;
        }
      }
      if (!found) parsed.push(part); // keep as-is (custom extra)
    }
  }
  const selectedSet = new Set(parsed);
  // Anything the studio previously typed that isn't in the predefined options
  // (e.g. a custom style) — show it at the bottom so it isn't silently lost.
  const customExtras = Array.from(selectedSet).filter((s) => !options.includes(s));

  if (!editCtx) {
    return (
      <span style={{ fontFamily: sans, color: C.black }} className="text-[14px] md:text-[15px] font-medium flex-1">
        {value}
      </span>
    );
  }

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const persist = async (nextSelected: Set<string>) => {
    // Preserve any custom extras the user typed previously, then append the
    // currently selected predefined options in their canonical order.
    const orderedSelections = options.filter((o) => nextSelected.has(o));
    const finalList = [...orderedSelections, ...customExtras.filter((c) => nextSelected.has(c))];
    const next = finalList.join(" · ");
    if (next === value) return;
    setSaving(true);
    try {
      const current = (ctx?.businessInfo ?? []) as any[];
      const existingIdx = current.findIndex((b: any) => b?.label === label);
      const arr = existingIdx >= 0
        ? current.map((b, i) => (i === existingIdx ? { ...b, value: next } : b))
        : [...current, { label, value: next }];
      await Promise.resolve(editCtx.save("businessInfo", arr));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (option: string) => {
    const nextSet = new Set(selectedSet);
    if (nextSet.has(option)) nextSet.delete(option);
    else nextSet.add(option);
    persist(nextSet);
  };

  // Compact summary chip row + dropdown trigger button
  const selectedInOrder = options.filter((o) => selectedSet.has(o));
  const allSelected = [...selectedInOrder, ...customExtras];

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-[14px] md:text-[15px] font-medium flex items-center gap-2 px-2 py-1 rounded-[6px] transition-colors cursor-pointer ${saving ? "opacity-60 cursor-wait" : "hover:bg-[rgba(15,15,13,0.06)] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#e4e4e7] hover:outline-offset-2"}`}
        style={{ fontFamily: sans, color: C.black, background: "transparent", border: "none" }}
        title={saving ? "Saving…" : `Select ${label.toLowerCase()}`}
        disabled={saving}
      >
        {allSelected.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {allSelected.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-[12px] font-medium px-2.5 py-1 rounded-full border"
                style={{ background: C.cream, color: C.black, borderColor: C.creamBorder, fontFamily: sans }}
              >
                {s}
              </span>
            ))}
            {allSelected.length > 2 && (
              <span
                className="text-[12px] font-medium px-2.5 py-1 rounded-full border relative group/more"
                style={{ background: C.cream, color: C.grayLight, borderColor: C.creamBorder, fontFamily: sans, cursor: "default" }}
                title={allSelected.slice(2).join(", ")}
              >
                +{allSelected.length - 2} more
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg text-[12px] font-medium leading-relaxed bg-[#0f0f0d] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover/more:opacity-100 transition-opacity z-50"
                  style={{ fontFamily: sans }}
                >
                  {allSelected.slice(2).join(" · ")}
                </span>
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: "#a8a8a8" }}>Click to select</span>
        )}
        <svg
          className="size-[14px] shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#71717a" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[220px] rounded-[10px] border bg-white py-1.5"
          style={{
            borderColor: C.creamBorder,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            fontFamily: sans,
          }}
        >
          {options.map((opt) => {
            const checked = selectedSet.has(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#f5f1e8] transition-colors"
              >
                <span
                  className="size-[16px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: checked ? C.black : C.creamBorder,
                    background: checked ? C.black : C.white,
                  }}
                >
                  {checked && (
                    <svg className="size-[11px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="sr-only"
                />
                <span className="text-[14px]" style={{ color: C.black }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── EXPERIENCE TABLE ─── */
export function ExperienceTable({ inline = false }: { inline?: boolean } = {}) {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const p = ctx?.profile;
  const creds = p?.credentials;
  const bInfo = ctx?.businessInfo ?? [];
  const teamCount = ctx?.teamMembers?.length ?? 0;

  type Row = { label: string; value: string; path?: string; biIndex?: number };
  const rows: Row[] = [];

  if (creds?.hdb?.active && creds?.hdb?.reg) rows.push({ label: "HDB License", value: `${creds.hdb.firm || ""} · ${creds.hdb.reg}`.replace(/^ · /, "") });
  if (creds?.bca?.active && creds?.bca?.reg) rows.push({ label: "BCA Registration", value: `${creds.bca.firm || ""} · ${creds.bca.reg}`.replace(/^ · /, "") });

  // Add business info entries (in edit mode include empty rows so they're discoverable).
  // Skip labels that are already surfaced inside the KeyMetrics tiles to avoid duplication.
  const HIDDEN_BUSINESS_LABELS = new Set(["Years in operation", "Budget range"]);

  // Default Quick Fact fields shown to every studio in edit mode (and on the
  // public page once filled in). The order here is the order they render in
  // the 3-column grid: ACRA / UEN → Office address → Project types →
  // Style specialisation. Team Members is appended below.
  const DEFAULT_FIELDS: { label: string; placeholder: string }[] = [
    { label: "ACRA / UEN", placeholder: "e.g. 201203456R" },
    { label: "Office address", placeholder: "e.g. 5855 W Century, Ang Mo Kio, Singapore" },
    { label: "Project types", placeholder: "e.g. HDB, Condo, Landed, Commercial" },
    { label: "Style specialisation", placeholder: "e.g. Modern, Japandi, Minimalist" },
    { label: "Service area", placeholder: "e.g. Island-wide, Central, East" },
    { label: "Specialisation", placeholder: "e.g. Design & Build, Full Home Renovation" },
    { label: "Services", placeholder: "e.g. Design + Build, Consultation" },
    { label: "Phone", placeholder: "e.g. +65 9123 4567" },
    { label: "Financing", placeholder: "e.g. 0% Interest Instalment Plan" },
  ];

  // Build a label → biIndex map of what the studio already has saved so we
  // can render the existing value (and keep the same edit index) when present.
  const existingByLabel = new Map<string, number>();
  bInfo.forEach((b: any, i: number) => {
    if (b?.label && !HIDDEN_BUSINESS_LABELS.has(b.label)) {
      existingByLabel.set(b.label, i);
    }
  });

  // Render the default fields in their fixed order. If a default has a saved
  // value, show it; otherwise (in edit mode) show an empty editable row that
  // BusinessInfoEditCell will create on first edit.
  DEFAULT_FIELDS.forEach(({ label }) => {
    const idx = existingByLabel.get(label);
    if (idx !== undefined) {
      const entry = bInfo[idx];
      if (editCtx || entry?.value?.trim()) {
        rows.push({ label, value: entry?.value || "", biIndex: idx });
      }
      existingByLabel.delete(label);
    } else if (editCtx) {
      // Virtual row — BusinessInfoEditCell will append a new entry on save.
      rows.push({ label, value: "", biIndex: -1 });
    }
  });

  // Any other custom businessInfo entries the studio has added beyond the
  // defaults — render them after the defaults so the layout stays predictable.
  existingByLabel.forEach((idx, label) => {
    const entry = bInfo[idx];
    if (editCtx || entry?.value?.trim()) {
      rows.push({ label, value: entry?.value || "", biIndex: idx });
    }
  });

  // Surface team size here (it was previously a KeyMetrics tile).
  if (teamCount > 0 || editCtx) {
    rows.push({ label: "Team Members", value: teamCount > 0 ? String(teamCount) : "—" });
  }

  if (!editCtx && rows.length === 0) return null;

  // Icon-led list redesign — no more striped table.
  const iconFor = (label: string) => {
    const stroke = C.black;
    const cls = "size-[16px]";
    switch (label) {
      case "ACRA / UEN":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        );
      case "Office address":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        );
      case "Project types":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "Style specialisation":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" />
            <circle cx="17.5" cy="10.5" r=".5" />
            <circle cx="8.5" cy="7.5" r=".5" />
            <circle cx="6.5" cy="12.5" r=".5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        );
      case "Budget range":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case "Service area":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case "Specialisation":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case "Services":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case "Phone":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        );
      case "Financing":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case "Team Members":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "HDB License":
      case "BCA Registration":
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return (
          <svg className={cls} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const CHIP_FIELDS = new Set(["Project types", "Style specialisation", "Service area", "Specialisation", "Services"]);
  const isChipField = (label: string) => CHIP_FIELDS.has(label);

  // Predefined option lists for the multi-select dropdown fields. Add to these
  // arrays to surface more options to studios — order here is the order they
  // render in the dropdown and on the public page.
  const MULTI_SELECT_OPTIONS: Record<string, string[]> = {
    "Project types": [
      "HDB (BTO, Resale, Maisonette)",
      "Executive Condominium (EC)",
      "Condominium (New Launch, Resale)",
      "Landed Homes (if applicable)",
      "Commercial",
    ],
    "Style specialisation": [
      "Modern",
      "Contemporary",
      "Scandinavian",
      "Industrial",
      "Japandi",
      "Minimalist",
      "Mid-Century",
      "Luxury/High-End",
      "Classic/Traditional",
      "Eclectic",
      "Muji-style",
      "Resort-style",
    ],
    "Service area": [
      "West",
      "East",
      "North",
      "North-East",
      "Central",
      "Island-wide",
    ],
    "Specialisation": [
      "Design & Build",
      "Commercial",
      "Carpentry-Focused",
      "Full Home Renovation",
      "Partial Renovation",
    ],
    "Services": [
      "Design + Build",
      "Design-Only Services",
      "Project management",
      "Consultation",
    ],
  };

  const renderValue = (row: Row) => {
    // Editable single-value (e.g. user-edits the source field). Keep inline edit affordance.
    if (row.path) {
      return (
        <EditableText
          value={row.value}
          path={row.path}
          placeholder="Click to edit"
          className="text-[15px] md:text-[16px] font-medium leading-[1.4] block mt-1"
          style={{ fontFamily: sans, color: C.black }}
        />
      );
    }
    if (row.biIndex !== undefined) {
      // In edit mode keep the existing input cell so the value stays editable.
      if (editCtx) {
        // List-type fields ("Project types", "Style specialisation") use a
        // checkbox dropdown instead of a free-text input so studios just pick
        // from a predefined set.
        if (MULTI_SELECT_OPTIONS[row.label]) {
          return (
            <div className="mt-1">
              <BusinessInfoMultiSelect
                value={row.value}
                label={row.label}
                options={MULTI_SELECT_OPTIONS[row.label]}
              />
            </div>
          );
        }
        return (
          <div className="mt-1">
            <BusinessInfoEditCell index={row.biIndex} value={row.value} label={row.label} />
          </div>
        );
      }
      // Public mode — chip rendering for list-type fields.
      if (isChipField(row.label) && row.value) {
        const chips = row.value.split(/\s*\u00b7\s*/).map((s: string) => s.trim()).filter(Boolean);
        const visible = chips.slice(0, 2);
        const overflow = chips.slice(2);
        return (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {visible.map((chip) => (
              <span
                key={chip}
                className="text-[12px] font-medium px-2.5 py-1 rounded-full border"
                style={{ background: C.cream, color: C.black, borderColor: C.creamBorder, fontFamily: sans }}
              >
                {chip}
              </span>
            ))}
            {overflow.length > 0 && (
              <span
                className="text-[12px] font-medium px-2.5 py-1 rounded-full border relative group/more"
                style={{ background: C.cream, color: C.grayLight, borderColor: C.creamBorder, fontFamily: sans, cursor: "default" }}
              >
                +{overflow.length} more
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg text-[12px] font-medium leading-relaxed bg-[#0f0f0d] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover/more:opacity-100 transition-opacity z-50"
                  style={{ fontFamily: sans }}
                >
                  {overflow.join(" · ")}
                </span>
              </span>
            )}
          </div>
        );
      }
    }
    return (
      <p
        className="text-[15px] md:text-[16px] font-medium leading-[1.4] mt-1"
        style={{ fontFamily: sans, color: C.black }}
      >
        {row.value || (editCtx ? <span style={{ color: C.grayLight }}>—</span> : null)}
      </p>
    );
  };

  const inner = (
    <FadeIn>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 list-none p-0 m-0">
        {rows.map((row, i) => (
          <li key={`${row.label}-${i}`} className="flex items-start gap-3.5">
            <div
              className="size-10 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
            >
              {iconFor(row.label)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ fontFamily: sans, color: C.grayLight }}
              >
                {row.label}
              </p>
              {renderValue(row)}
            </div>
          </li>
        ))}
      </ul>
    </FadeIn>
  );

  if (inline) return inner;

  return (
    <section className="py-[40px] md:py-[64px]">
      {inner}
    </section>
  );
}

/* ─── FAQ ─── */
function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.creamBorder}` }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 px-5 md:px-6 text-left cursor-pointer bg-transparent border-none"
        style={{ fontFamily: sans }}
      >
        <span style={{ color: C.black }} className="text-[15px] md:text-[16px] font-medium pr-4">{question}</span>
        <svg
          className="size-[18px] shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: C.grayLight }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "300px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <p className="px-5 md:px-6 pb-5 text-[14px] md:text-[15px] leading-[1.7]" style={{ fontFamily: sans, color: C.gray }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const ctx = useDesignerCtx();
  const name = ctx?.profile?.name || "us";
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = [
    {
      q: `How do I get started with ${name}?`,
      a: `Getting started is simple — fill out the free quote form on this page or contact us directly. We'll schedule a no-obligation consultation to understand your vision, budget, and timeline. From there, we'll provide a personalised proposal tailored to your space.`,
    },
    {
      q: "What does the design process look like?",
      a: "Our process typically follows these stages: initial consultation, concept development with mood boards and 3D renders, detailed design documentation, material selection, and finally construction oversight. We keep you involved at every stage to ensure the result matches your vision.",
    },
    {
      q: "How long does a typical renovation take?",
      a: "Timelines vary depending on scope and property type. A typical HDB renovation takes 8–12 weeks, condos take 10–14 weeks, and landed properties can take 16–24 weeks. We'll provide a detailed timeline during the proposal stage.",
    },
    {
      q: "What is included in the quotation?",
      a: "Our quotations cover design fees, material costs, carpentry work, electrical and plumbing works, painting, and project management. We provide transparent, itemised quotes so you know exactly what you're paying for — no hidden costs.",
    },
    {
      q: "Do you handle HDB, condo, and landed renovations?",
      a: "Yes, we handle all property types in Singapore including HDB flats (BTO and resale), private condominiums, and landed homes. Our team is HDB-registered and BCA-licensed, so you can be confident your project is in qualified hands.",
    },
  ];

  return (
    <section className="py-[40px] md:py-[64px]">
      <FadeIn>
        <TagLabel>FREQUENTLY ASKED</TagLabel>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3 mb-6">
          Common Questions
        </h2>

        <div className="rounded-[16px] overflow-hidden border border-[#d8d3c8]" style={{ background: C.white }}>
          {items.map((item, i) => (
            <FAQItem
              key={i}
              question={item.q}
              answer={item.a}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

/* ─── LOADING SKELETON ─── */
export function ProfileLoadingSkeleton() {
  return (
    <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]">
      <SiteNav logoImg={logoMarkImg} />
      <main className="pt-[24px] md:pt-[40px]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          {/* Cover shimmer */}
          <div className="w-full h-[260px] md:h-[462px] rounded-[16px] bg-[#e4e4e7] animate-pulse" />
          {/* Profile row shimmer */}
          <div className="flex items-start gap-5 md:gap-7 mt-[-50px] md:mt-[-80px] pl-4 md:pl-8">
            <div className="size-[90px] md:size-[160px] rounded-full bg-[#e4e4e7] animate-pulse border-4 border-white shrink-0" />
            <div className="hidden md:block pt-[90px] space-y-3 flex-1 max-w-[520px]">
              <div className="h-7 w-[200px] bg-[#e4e4e7] rounded-lg animate-pulse" />
              <div className="h-5 w-[360px] bg-[#e4e4e7] rounded-lg animate-pulse" />
              <div className="h-4 w-[240px] bg-[#e4e4e7] rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Stats shimmer */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2.5 max-w-[790px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[60px] bg-[#e4e4e7] rounded-[16px] animate-pulse" />
            ))}
          </div>
          {/* Bio shimmer */}
          <div className="mt-6 max-w-[768px] space-y-2">
            <div className="h-4 w-full bg-[#e4e4e7] rounded animate-pulse" />
            <div className="h-4 w-[80%] bg-[#e4e4e7] rounded animate-pulse" />
          </div>
          {/* Team shimmer */}
          <div className="mt-6 flex gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="size-[74px] md:size-[80px] rounded-full bg-[#e4e4e7] animate-pulse" />
                <div className="h-3 w-12 bg-[#e4e4e7] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── MAIN PROFILE PAGE ─── */
export function DesignerProfile() {
  const { slug } = useParams();
  const { data: apiData, loading, error } = useDesignerData(slug);
  const { payload: googlePayload, uiReviews: googleUiReviews } = useGoogleReviews(slug);

  // Transform API data into component-compatible shapes
  const ctxValue = useMemo<DesignerCtxType | null>(() => {
    if (!apiData) return null;
    const base = transformApiData(apiData);
    return {
      ...base,
      googleReviews: googleUiReviews,
      googleMeta: googlePayload
        ? {
            rating: googlePayload.rating,
            totalRatings: googlePayload.totalRatings,
            source: googlePayload.source,
            fetchedAt: googlePayload.fetchedAt,
            placeId: googlePayload.placeId,
          }
        : null,
    };
  }, [apiData, googleUiReviews, googlePayload]);

  // Show loading skeleton while fetching
  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  // Log data source for debugging
  if (ctxValue) {
    console.log("DesignerProfile: Rendering with API data for slug:", slug);
  } else {
    console.log("DesignerProfile: Rendering with hardcoded fallback data (API returned:", error || "empty", ")");
  }

  return (
    <DesignerDataContext.Provider value={ctxValue}>
      <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans }}>
        <SiteNav logoImg={logoMarkImg} />

        <main className="pt-[16px] md:pt-[24px]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            {/* 1. Breadcrumbs */}
            <Breadcrumbs />

            {/* 2. Cover Banner (header) */}
            <HeroSection />

            {/* 3. Studio Info (with KeyMetrics inside) + Lead Form (side-by-side under hero banner) */}
            <div className="mt-8 md:mt-10">
              <div className="grid md:grid-cols-[3fr_2fr] gap-8 md:gap-10 items-stretch">
                <StudioInfo />
                <FadeIn className="h-full">
                  <QuoteCard compact />
                </FadeIn>
              </div>
            </div>

            {/* 5. Bio */}
            <div className="mt-16 md:mt-24 lg:max-w-[768px]">
              <BioText />
            </div>

            {/* 5b. Quick Facts (full-width 3-column grid) */}
            <div className="mt-10 md:mt-14">
              <ExperienceTable inline />
            </div>

            {/* 6. Team Avatars — hidden when no team data */}
            {(ctxValue?.teamMembers?.length ?? 0) > 0 && (
            <div className="mt-16 md:mt-24">
              <FadeIn>
                <TagLabel>OUR TEAM</TagLabel>
                <h2 style={{ fontFamily: serif, fontSize: "clamp(24px, 3vw, 36px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3 mb-5">
                  Meet the Team
                </h2>
                <TeamAvatars />
              </FadeIn>
            </div>
            )}

            {/* 7. Projects Carousel */}
            <ProjectsSection />

            {/* 8. Rating Breakdown */}
            <RatingBreakdown />
          </div>

          {/* 9. Homeowner Reviews */}
          <GoogleReviewCards />

          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            {/* 10. Trusted Since (timeline) */}
            <TrustedSince />

            {/* 13. FAQ */}
            <FAQ />
          </div>

          {/* 14. Service Area */}
          <ServiceArea />
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-10 py-10 md:py-14 mt-12 md:mt-16">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <a href="/" className="block shrink-0" style={{
                  width: "110px", height: "23px", background: C.black,
                  maskImage: `url('${logoMarkImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
                  WebkitMaskImage: `url('${logoMarkImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
                }} />
                <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
                  {FOOTER.links.map((link: { label: string; href: string }) => (
                    <a key={link.label} href={link.href}
                      className="text-[13px] font-normal hover:opacity-60 cursor-pointer no-underline"
                      style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}
                    >{link.label}</a>
                  ))}
                </div>
              </div>
              <span className="text-[12px] font-normal" style={{ color: C.grayLight, fontFamily: sans }}>
                {FOOTER.copyright}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </DesignerDataContext.Provider>
  );
}
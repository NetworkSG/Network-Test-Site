import { useState, useRef, useCallback, useEffect, createContext, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, Link } from "react-router";
import { sanitizeInput, sanitizeEmail } from "../utils/sanitize";
import { Navbar } from "./Navbar";
import { DesignerProfileFooter } from "./DesignerProfileFooter";
import { SiteNav } from "./SiteNav";
import { FOOTER } from "./homepage/content";
import { useDesignerData } from "./useDesignerData";
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
        className={`${className} ${saving ? "cursor-wait opacity-60" : "cursor-text hover:bg-[rgba(15,15,13,0.06)] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#d8d3c8] hover:outline-offset-2"} rounded-[4px] transition-colors inline-flex items-center gap-1.5`}
        style={style}
        title={saving ? "Saving…" : "Click to edit"}
      >
        {value || <span style={{ color: "#a8a8a8" }}>{placeholder || "Click to edit"}</span>}
        {saving && (
          <svg className="size-[12px] animate-spin shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: "#6b6860" }}>
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

/* ─── HERO SECTION ─── */
export function HeroSection() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const p = ctx?.profile;
  const cp = p?.coverProject;
  const coverImg = p?.images?.cover ? resolveImg(p.images.cover) : PLACEHOLDER_COVER;
  const logoImg = p?.images?.logo ? resolveImg(p.images.logo) : PLACEHOLDER_LOGO;
  const companyName = p?.name || "Input Interior Designer name";
  const taglineText = p?.tagline || "Add your tagline";
  const availText = p?.availability || "";
  const locText = p?.location || "Singapore Based";
  const isVerified = p?.verified ?? false;
  const coverName = cp?.name || "Featured project name";
  const coverCost = cp?.cost || "";
  const coverArea = cp?.area || "";
  const coverYear = cp?.year || "";
  const coverStyle = cp?.style || "";

  // Cover editor state — when in edit mode, the cover image + project metadata
  // are edited together via a wrapper panel rather than inline.
  const [coverEditing, setCoverEditing] = useState(false);
  const [coverDraft, setCoverDraft] = useState({ name: coverName, cost: coverCost, area: coverArea, year: coverYear, style: coverStyle });
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!coverEditing) {
      setCoverDraft({ name: coverName, cost: coverCost, area: coverArea, year: coverYear, style: coverStyle });
    }
  }, [coverName, coverCost, coverArea, coverYear, coverStyle, coverEditing]);

  const handleCoverImagePick = async (file: File) => {
    if (!editCtx?.uploadImage) return;
    setCoverUploading(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (url) await editCtx.save("images.cover", url);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverSave = async () => {
    if (!editCtx) return;
    if (coverDraft.name !== coverName) await editCtx.save("coverProject.name", coverDraft.name);
    if (coverDraft.cost !== coverCost) await editCtx.save("coverProject.cost", coverDraft.cost);
    if (coverDraft.area !== coverArea) await editCtx.save("coverProject.area", coverDraft.area);
    if (coverDraft.year !== coverYear) await editCtx.save("coverProject.year", coverDraft.year);
    if (coverDraft.style !== coverStyle) await editCtx.save("coverProject.style", coverDraft.style);
    setCoverEditing(false);
  };

  return (
    <section className="relative w-full">
      {/* Cover Image */}
      <div className="group relative w-full h-[260px] md:h-[462px] rounded-[16px] md:rounded-[20px] overflow-hidden">
        <img
          src={coverImg}
          alt={`${companyName} project`}
          className="absolute inset-0 w-full h-full object-cover scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none" />

        {/* Project tag */}
        <div className="absolute top-3 md:top-4 left-3 md:left-4 z-10">
          <span className="font-['DM_Sans',sans-serif] font-semibold text-[13px] md:text-[15px] text-white">
            {coverName}
          </span>
        </div>

        {/* Edit pencil — only when editCtx is present */}
        {editCtx && !coverEditing && (
          <button
            type="button"
            onClick={() => setCoverEditing(true)}
            className="absolute top-3 md:top-4 right-3 md:right-4 z-20 flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#0f0f0d] rounded-full px-3 py-1.5 shadow-md transition-colors"
            title="Edit cover image and project details"
          >
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <span className="font-['DM_Sans',sans-serif] text-[12px] font-medium uppercase tracking-[0.08em]">Edit cover</span>
          </button>
        )}

        {/* Project details - desktop left sidebar */}
        <div className="hidden lg:block absolute left-0 top-0 h-full w-[320px] bg-gradient-to-r from-black to-transparent -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <div className="p-8 pt-14 space-y-5">
            <div>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#a8a8a8]">Renovation Cost</p>
              <p className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-white">{coverCost}</p>
            </div>
            <div>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#a8a8a8]">Area Size</p>
              <p className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-white">{coverArea}</p>
            </div>
            <div>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#a8a8a8]">Year of Completion</p>
              <p className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-white">{coverYear}</p>
            </div>
            <div>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#a8a8a8]">Interior Style</p>
              <p className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-white">{coverStyle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cover edit panel — opens below the cover image when pencil is clicked */}
      {editCtx && coverEditing && (
        <div className="relative z-20 mt-4 mx-2 md:mx-0 lg:mr-[440px] bg-white border border-[#d8d3c8] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#d8d3c8] bg-[#f0ede6]">
            <div className="flex items-center gap-2">
              <svg className="size-[14px] text-[#0f0f0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f0f0d]">Editing · Cover</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCoverEditing(false)} className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] hover:text-[#0f0f0d] px-3 py-1.5 rounded-[8px] transition-colors">Cancel</button>
              <button type="button" onClick={handleCoverSave} className="font-['DM_Sans',sans-serif] text-[13px] font-medium text-white bg-[#0f0f0d] hover:opacity-85 px-4 py-1.5 rounded-[8px] transition-opacity">Save</button>
            </div>
          </div>
          <div className="p-6 grid md:grid-cols-[280px_1fr] gap-6">
            {/* Image upload tile */}
            <div>
              <p className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860] mb-2">Cover photo</p>
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                className="relative w-full h-[160px] rounded-[12px] overflow-hidden border-2 border-dashed border-[#d8d3c8] bg-[#f0ede6] hover:border-[#0f0f0d] transition-colors group/cover"
              >
                <img src={coverImg} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="font-['DM_Sans',sans-serif] text-[12px] font-medium text-white">{coverUploading ? "Uploading…" : "Click to replace"}</span>
                </div>
              </button>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverImagePick(f); e.currentTarget.value = ""; }}
              />
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 block">
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">Project name</span>
                <input
                  type="text"
                  value={coverDraft.name}
                  onChange={(e) => setCoverDraft({ ...coverDraft, name: e.target.value })}
                  className="mt-1 w-full h-[44px] bg-white border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                  placeholder="Serangoon Terrace"
                />
              </label>
              <label className="block">
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">Renovation cost</span>
                <input
                  type="text"
                  value={coverDraft.cost}
                  onChange={(e) => setCoverDraft({ ...coverDraft, cost: e.target.value })}
                  className="mt-1 w-full h-[44px] bg-white border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                  placeholder="$128,500"
                />
              </label>
              <label className="block">
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">Area size</span>
                <input
                  type="text"
                  value={coverDraft.area}
                  onChange={(e) => setCoverDraft({ ...coverDraft, area: e.target.value })}
                  className="mt-1 w-full h-[44px] bg-white border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                  placeholder="145m²"
                />
              </label>
              <label className="block">
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">Year completed</span>
                <input
                  type="text"
                  value={coverDraft.year}
                  onChange={(e) => setCoverDraft({ ...coverDraft, year: e.target.value })}
                  className="mt-1 w-full h-[44px] bg-white border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                  placeholder="2024"
                />
              </label>
              <label className="block">
                <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">Interior style</span>
                <input
                  type="text"
                  value={coverDraft.style}
                  onChange={(e) => setCoverDraft({ ...coverDraft, style: e.target.value })}
                  className="mt-1 w-full h-[44px] bg-white border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                  placeholder="Modern Contemporary"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Quote Card - desktop right */}
      <div className="hidden lg:block absolute right-6 top-[340px] w-[400px] z-10">
        <QuoteCard />
      </div>

      {/* Profile info row */}
      <div className={`relative ${coverEditing ? "mt-6" : "mt-[-50px] md:mt-[-80px]"} pl-4 md:pl-8 flex items-start gap-5 md:gap-7`}>
        {/* Logo */}
        <div className="relative bg-black rounded-full size-[90px] md:size-[160px] border-[3px] md:border-4 border-white shadow-lg shrink-0 overflow-hidden flex items-center justify-center z-[1]">
          <EditableImage src={logoImg} alt={companyName} path="images.logo" className="w-[90%] h-[90%] object-cover rounded-full" />
        </div>

        {/* Name + info - desktop */}
        <div className="hidden md:block pt-[90px] lg:max-w-[520px]">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d]">
              <EditableText value={companyName} path="name" placeholder="Studio name" />
            </h1>
            {isVerified && (
              <div className="bg-[#0f0f0d] rounded-full size-[16px] flex items-center justify-center">
                <svg className="size-[10px]" viewBox="0 0 10 7.5" fill="none">
                  <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
          <p className="font-['DM_Sans',sans-serif] text-[16px] text-[#6b6860] leading-[24px] mb-2">
            <EditableText value={taglineText} path="tagline" placeholder="Tagline" multiline />
          </p>
          <div className="flex items-center gap-4 text-[14px] text-[#6b6860] font-['DM_Sans',sans-serif]">
            <span className="flex items-center gap-1.5">
              <span className="bg-[#00c950] rounded-full size-2 inline-block" />
              <EditableText value={availText} path="availability" placeholder="Availability" />
            </span>
            <span>&bull;</span>
            <span><EditableText value={locText} path="location" placeholder="Location" /></span>
          </div>
        </div>
      </div>

      {/* Name + info - mobile */}
      <div className="md:hidden px-2 mt-3">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#0f0f0d]">
            <EditableText value={companyName} path="name" placeholder="Studio name" />
          </h1>
          {isVerified && (
            <div className="bg-[#0f0f0d] rounded-full size-[14px] flex items-center justify-center">
              <svg className="size-[8px]" viewBox="0 0 10 7.5" fill="none">
                <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          )}
        </div>
        <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[22px] mb-2">
          <EditableText value={taglineText} path="tagline" placeholder="Tagline" multiline />
        </p>
        <div className="flex items-center gap-3 text-[13px] text-[#6b6860] font-['DM_Sans',sans-serif]">
          <span className="flex items-center gap-1.5">
            <span className="bg-[#00c950] rounded-full size-2 inline-block" />
            <EditableText value={availText} path="availability" placeholder="Availability" />
          </span>
          <span>&bull;</span>
          <span><EditableText value={locText} path="location" placeholder="Location" /></span>
        </div>
      </div>
    </section>
  );
}

/* ─── QUOTE CARD ─── */
function QuoteCard() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const slug = ctx?.profile?.slug || "";
  const [form, setForm] = useState({ name: "", phone: "", email: "", propertyType: "", budget: "", keyCollection: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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

  // Editor mode: show dummy placeholder form
  if (editCtx) {
    return (
      <div className="bg-white rounded-[12px] border border-[#d8d3c8] shadow-[0px_25px_35.9px_0px_rgba(0,0,0,0.07)] p-6 md:p-7">
        <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#09090b] mb-1">Get Your Free Quote</h2>
        <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#747474] mb-5 leading-[22px]">
          Speak with our designers within 24 hours. No hard sell, just honest advice.
        </p>
        <div className="space-y-4">
          <div>
            <div className="h-[14px] w-[80px] bg-[#e8e4db] rounded-[4px] mb-1.5" />
            <div className="h-[42px] w-full bg-[#e8e4db] border border-[#d8d3c8] rounded-[14px]" />
          </div>
          <div>
            <div className="h-[14px] w-[110px] bg-[#e8e4db] rounded-[4px] mb-1.5" />
            <div className="h-[42px] w-full bg-[#e8e4db] border border-[#d8d3c8] rounded-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="h-[14px] w-[80px] bg-[#e8e4db] rounded-[4px] mb-1.5" />
              <div className="h-[42px] w-full bg-[#e8e4db] border border-[#d8d3c8] rounded-[14px]" />
            </div>
            <div>
              <div className="h-[14px] w-[85px] bg-[#e8e4db] rounded-[4px] mb-1.5" />
              <div className="h-[42px] w-full bg-[#e8e4db] border border-[#d8d3c8] rounded-[14px]" />
            </div>
          </div>
          <div>
            <div className="h-[14px] w-[120px] bg-[#e8e4db] rounded-[4px] mb-1.5" />
            <div className="h-[42px] w-full bg-[#e8e4db] border border-[#d8d3c8] rounded-[14px]" />
          </div>
          <div className="w-full bg-[#09090b] rounded-[14px] h-[44px] flex items-center justify-center">
            <span className="font-['DM_Sans',sans-serif] font-semibold text-[14px] text-white tracking-[-0.35px]">Get Free Quotes &rarr;</span>
          </div>
          <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#ababab] text-center">
            No spam. No obligation. 100% free consultation.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-[12px] border border-[#d8d3c8] shadow-[0px_25px_35.9px_0px_rgba(0,0,0,0.07)] p-6 md:p-7 text-center">
        <div className="w-14 h-14 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#09090b] mb-2">Quote Request Sent!</h2>
        <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#747474] leading-[22px]">
          Thank you, {form.name.split(" ")[0]}! The team will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  const inputCls = "w-full bg-[#fafaf8] border border-[#d8d3c8] rounded-[14px] px-4 py-2.5 text-[14px] font-['DM_Sans',sans-serif] text-[#09090b] placeholder:text-[#99a1af] outline-none focus:border-[#0f0f0d] transition-colors";
  const selectCls = "w-full bg-[#fafaf8] border border-[#d8d3c8] rounded-[14px] px-4 py-2.5 text-[14px] font-['DM_Sans',sans-serif] outline-none focus:border-[#0f0f0d] transition-colors appearance-none";

  return (
    <div className="bg-white rounded-[12px] border border-[#d8d3c8] shadow-[0px_25px_35.9px_0px_rgba(0,0,0,0.07)] p-6 md:p-7">
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[20px] text-[#09090b] mb-1">Get Your Free Quote</h2>
      <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#747474] mb-5 leading-[22px]">
        Speak with our designers within 24 hours. No hard sell, just honest advice.
      </p>
      <div className="space-y-4">
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Full Name</label>
          <input type="text" required placeholder="e.g. Jing Wei Tan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Contact Number</label>
          <input type="tel" required placeholder="+65 9XXX XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Property Type</label>
            <select required value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} className={selectCls} style={{ color: form.propertyType ? "#09090b" : "#99a1af" }}>
              <option value="">Select</option>
              <option value="HDB">HDB</option>
              <option value="Condo">Condo</option>
              <option value="Landed">Landed</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Budget Range</label>
            <select required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className={selectCls} style={{ color: form.budget ? "#09090b" : "#99a1af" }}>
              <option value="">Select</option>
              <option value="Below $30,000">Below $30k</option>
              <option value="$30,000 – $50,000">$30k – $50k</option>
              <option value="$50,000 – $80,000">$50k – $80k</option>
              <option value="$80,000 – $120,000">$80k – $120k</option>
              <option value="Above $120,000">Above $120k</option>
            </select>
          </div>
        </div>
        <div>
          <label className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Key Collection</label>
          <select required value={form.keyCollection} onChange={e => setForm({ ...form, keyCollection: e.target.value })} className={selectCls} style={{ color: form.keyCollection ? "#09090b" : "#99a1af" }}>
            <option value="">Select</option>
            <option value="Keys Collected">Keys Collected</option>
            <option value="Within 3 months">Within 3 months</option>
            <option value="3–6 months">3–6 months</option>
            <option value="6–12 months">6–12 months</option>
            <option value="More than 12 months">More than 12 months</option>
          </select>
        </div>
        {error && <p className="font-['DM_Sans',sans-serif] text-[13px] text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#09090b] text-white font-['DM_Sans',sans-serif] font-semibold text-[14px] rounded-[14px] h-[44px] tracking-[-0.35px] hover:bg-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
          ) : (
            <>Get Free Quotes &rarr;</>
          )}
        </button>
        <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#ababab] text-center">
          No spam. No obligation. 100% free consultation.
        </p>
      </div>
    </div>
  );
}

/* ─── STATS ROW ─── */
export function StatsRow() {
  const ctx = useDesignerCtx();
  const s = ctx?.profile?.stats;
  const stats = [
    {
      icon: (
        <svg className="size-[17px]" viewBox="0 0 14.4436 13.7722" fill="none">
          <path d="M7.22 0.5L9.07 4.82L13.94 5.33L10.27 8.62L11.22 13.27L7.22 11.02L3.22 13.27L4.17 8.62L0.5 5.33L5.37 4.82L7.22 0.5Z" fill="#FFA929" />
        </svg>
      ),
      label: `${s?.rating || "4.9"} Rating`,
      sub: `${s?.reviewCount || "186"} Reviews`,
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
        <div key={s.label} className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[12px] flex items-center gap-2.5 px-4 py-3 min-w-0">
          <div className="shrink-0">{s.icon}</div>
          <div>
            <p className="font-['DM_Sans',sans-serif] font-semibold text-[14px] md:text-[15px] text-[#0f0f0d] leading-tight">{s.label}</p>
            <p className="font-['DM_Sans',sans-serif] text-[11px] md:text-[12px] text-[#6b6860] tracking-[0.15px]">{s.sub}</p>
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
  const addMemberFileRef = useRef<HTMLInputElement>(null);
  const addStoryFileRef = useRef<HTMLInputElement>(null);
  const [uploadingMember, setUploadingMember] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  // Build the canonical "team" payload to save back to the server: keep all
  // existing fields, but write `image` (not the resolved `img`) so URLs persist.
  const serializeTeam = (next: any[]) => next.map(({ img, ...rest }: any) => ({ ...rest, image: rest.image ?? img ?? "" }));

  const handleAddMember = async (file: File) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setUploadingMember(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const newMember = { name: "New Member", image: url, type: "person", role: "Designer", specialty: "", projects: 0, experience: "", bio: "", designs: [] };
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
                className="absolute -top-1 -right-1 size-[22px] rounded-full bg-white border border-[#d8d3c8] shadow-sm flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:bg-[#0f0f0d] hover:text-white text-[#0f0f0d] z-10"
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
              onClick={() => addMemberFileRef.current?.click()}
              title="Add a team member"
            >
              <div className="rounded-full size-[74px] md:size-[80px] border-[3px] border-dashed border-[#d8d3c8] bg-[#f0ede6] flex items-center justify-center hover:border-[#0f0f0d] hover:bg-white transition-colors">
                {uploadingMember ? (
                  <svg className="size-5 animate-spin text-[#6b6860]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="size-7 text-[#6b6860]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                )}
              </div>
              <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860]">Add member</span>
              <input
                ref={addMemberFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddMember(f); e.currentTarget.value = ""; }}
              />
            </div>

            {/* Add Story / Reel */}
            <div
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              onClick={() => setStoryModalOpen(true)}
              title="Upload a story / reel"
            >
              <div className="rounded-full size-[74px] md:size-[80px] border-[3px] border-dashed border-[#d8d3c8] bg-[#f0ede6] flex items-center justify-center hover:border-[#0f0f0d] hover:bg-white transition-colors">
                {uploadingStory ? (
                  <svg className="size-5 animate-spin text-[#6b6860]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="size-7 text-[#6b6860]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M16 3v6M8 3v6" />
                  </svg>
                )}
              </div>
              <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860]">Add story</span>
            </div>
          </>
        )}
      </div>

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
                    className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] text-[#0f0f0d] mt-3 text-center bg-transparent border-b border-dashed border-[#d8d3c8] focus:border-[#0f0f0d] outline-none w-full transition-colors"
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
                    className="font-['DM_Sans',sans-serif] text-[13px] text-[#0f0f0d] font-medium mt-0.5 text-center bg-transparent border-b border-dashed border-[#d8d3c8] focus:border-[#0f0f0d] outline-none w-full transition-colors"
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
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] mt-0.5">{"specialty" in selectedMember ? selectedMember.specialty : ""}</p>

              {/* Stats row */}
              <div className="flex justify-center gap-5 mt-4 w-full">
                <div className="text-center flex-1">
                  <p className="font-['DM_Sans',sans-serif] font-bold text-[17px] text-[#0f0f0d]">{"projects" in selectedMember ? selectedMember.projects : 0}</p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#6b6860]">Projects</p>
                </div>
                <div className="w-px bg-[#d8d3c8]" />
                <div className="text-center flex-1">
                  <p className="font-['DM_Sans',sans-serif] font-bold text-[17px] text-[#0f0f0d]">{"experience" in selectedMember ? selectedMember.experience : ""}</p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#6b6860]">Experience</p>
                </div>
                <div className="w-px bg-[#d8d3c8]" />
                <div className="text-center flex-1">
                  <p className="font-['DM_Sans',sans-serif] font-bold text-[17px] text-[#0f0f0d]">
                    <svg className="inline size-[13px] text-[#0f0f0d] mr-0.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    4.9
                  </p>
                  <p className="font-['DM_Sans',sans-serif] text-[11px] text-[#6b6860]">Rating</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#d8d3c8] mx-4" />

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
  // In edit mode, always render an EditableText so the field is clickable even if currently empty.
  if (editCtx) {
    return (
      <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6b6860] leading-[26px] tracking-[-0.09px]">
        <EditableText
          value={bio || ""}
          path="bio"
          placeholder="Add a short description about your studio."
          multiline
        />
      </p>
    );
  }
  if (bio) {
    return (
      <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6b6860] leading-[26px] tracking-[-0.09px]">
        {bio}
      </p>
    );
  }
  return (
    <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6b6860] leading-[26px] tracking-[-0.09px]">
      Add a short description about your studio.
    </p>
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

  return (
    <div>
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[22px] md:text-[24px] text-[#0f0f0d] tracking-[-0.6px] mb-3">{title}</h2>
      <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6b6860] leading-[26px] mb-4">
        {desc}
      </p>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          {badges.map((badge: string, i: number) => (
            <span key={badge} className="flex items-center gap-2 font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#364153]">
              {badgeIcons[i % badgeIcons.length]}
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
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
    <div className="bg-gradient-to-r from-[#eff6ff] to-[#eef2ff] border border-[#dbeafe] rounded-[14px] px-6 md:px-16 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="bg-white rounded-full size-[48px] shadow-sm shrink-0 flex items-center justify-center">
          <svg className="size-[24px]" viewBox="0 0 20 22" fill="none">
            <path d="M14 11H6M10 7V15M19 11C19 15.97 14.97 20 10 20C5.03 20 1 15.97 1 11C1 6.03 5.03 2 10 2C14.97 2 19 6.03 19 11Z" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[17px] md:text-[18px] text-[#0f0f0d] mb-1">{btoTitle}</h3>
          <p className="font-['DM_Sans',sans-serif] text-[13px] md:text-[14px] text-[#6b6860] leading-[20px]">
            {btoDesc}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {btoTags.map((tag: string, i: number) => (
              <span key={tag} className={`${tagColors[i % tagColors.length]} font-['DM_Sans',sans-serif] font-medium text-[10px] px-2.5 py-1 rounded-full`}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <button className="bg-[#0f0f0d] text-white font-['DM_Sans',sans-serif] font-medium text-[14px] rounded-[10px] shadow-md px-5 py-2.5 whitespace-nowrap hover:bg-[#2b2b2b] transition-colors cursor-pointer flex items-center gap-2">
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
function ProjectCard({ p, idx, slug, editCtx, onRemove }: { p: any; idx: number; slug: string; editCtx: any; onRemove?: (i: number) => void }) {
  return (
    <div className="relative rounded-[12px] overflow-hidden h-[280px] md:h-[507px] group cursor-pointer">
      <img src={resolveImg(p.img)} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <Link to={`/designer/${slug}/project/${encodeURIComponent(p.name)}`} className="absolute inset-0 bg-gradient-to-t from-black/42 to-transparent to-[55%] z-[1]" />
      <div className="absolute bottom-4 left-5">
        <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] md:text-[14px] text-white leading-[22px] tracking-[0.08px]">{p.name}</p>
        <p className="font-['DM_Sans',sans-serif] text-[12px] md:text-[14px] text-[#bab7b3] tracking-[0.08px]">{p.meta}</p>
      </div>
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
      <div className="relative mt-[3vh] mb-[3vh] w-[95vw] max-w-[1100px] max-h-[94vh] bg-white rounded-[16px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#e8e4db]">
          <div>
            <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[22px] md:text-[26px] text-[#0f0f0d] tracking-[-0.5px]">All Projects</h2>
            <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] mt-0.5">{projs.length} project{projs.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="size-[36px] rounded-full bg-[#f5f3ef] hover:bg-[#e8e4db] flex items-center justify-center transition-colors cursor-pointer" title="Close">
            <svg className="size-[18px] text-[#0f0f0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 px-6 md:px-8 py-4 border-b border-[#f0ede6]">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99a1af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-[40px] pl-10 pr-4 bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] text-[14px] font-['DM_Sans',sans-serif] text-[#0f0f0d] placeholder:text-[#99a1af] outline-none focus:border-[#0f0f0d] transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-[40px] px-3 bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] text-[13px] font-['DM_Sans',sans-serif] text-[#0f0f0d] outline-none focus:border-[#0f0f0d] transition-colors appearance-none cursor-pointer pr-8"
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
              <svg className="size-[48px] text-[#d8d3c8] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <p className="font-['DM_Sans',sans-serif] text-[15px] text-[#6b6860]">No projects found</p>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#99a1af] mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p: any, idx: number) => (
                <Link
                  key={`${p.name}-${idx}`}
                  to={`/designer/${slug}/project/${encodeURIComponent(p.name)}`}
                  onClick={onClose}
                  className="relative rounded-[12px] overflow-hidden h-[220px] group cursor-pointer block"
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

  // On live page show only first 2; editor shows all
  const visibleProjs = editCtx ? projs : projs.slice(0, 2);
  const hasMore = !editCtx && projs.length > 2;

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[19px] md:text-[20px] text-[#0f0f0d] tracking-[-0.88px]">Projects</h2>
        <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860]">Recent completed renovations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleProjs.map((p: any, idx: number) => (
          <ProjectCard key={`${p.name}-${idx}`} p={p} idx={idx} slug={slug} editCtx={editCtx} onRemove={editCtx ? handleRemoveProject : undefined} />
        ))}

        {/* Add project tile (edit mode only) */}
        {editCtx && (
          <button
            type="button"
            onClick={() => addProjectFileRef.current?.click()}
            className="relative rounded-[12px] overflow-hidden h-[280px] md:h-[507px] border-2 border-dashed border-[#d8d3c8] bg-[#f0ede6] hover:border-[#0f0f0d] hover:bg-white transition-colors flex flex-col items-center justify-center gap-3 group/add"
            title="Add a project"
          >
            {uploadingProject ? (
              <svg className="size-9 animate-spin text-[#6b6860]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <>
                <div className="size-[64px] rounded-full border-2 border-dashed border-[#d8d3c8] bg-white flex items-center justify-center group-hover/add:border-[#0f0f0d] transition-colors">
                  <svg className="size-8 text-[#6b6860] group-hover/add:text-[#0f0f0d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                </div>
                <span className="font-['DM_Sans',sans-serif] text-[14px] font-medium text-[#6b6860] group-hover/add:text-[#0f0f0d] transition-colors">Add a project</span>
                <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#99a1af]">Click to upload an image</span>
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
        )}
      </div>

      {/* View All Projects button (live page only, when more than 2) */}
      {hasMore && (
        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="font-['DM_Sans',sans-serif] font-semibold text-[14px] text-[#0f0f0d] bg-white border border-[#d8d3c8] rounded-[12px] px-8 h-[44px] hover:bg-[#f5f3ef] transition-colors cursor-pointer flex items-center gap-2"
          >
            View All Projects
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* All projects modal */}
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
      className="bg-transparent border-0 rounded-[6px] px-2 py-1 outline-none w-full text-[14px] md:text-[15px] font-medium text-[#0f0f0d] focus:bg-white focus:ring-1 focus:ring-[#d8d3c8] transition-colors placeholder:text-[#a8a8a8] placeholder:font-normal"
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
    <section className="bg-[#fafaf8] py-10 md:py-14 px-4 md:px-8">
      <div className="max-w-[1293px] mx-auto">
        <div className="mb-5">
          <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[19px] md:text-[20px] text-[#0f0f0d] tracking-[-0.88px]">Trust &amp; Credentials</h2>
          <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860]">Verified licences and registrations</p>
        </div>

        <div className={`grid grid-cols-1 ${!editCtx && !hasActiveCredentials ? "" : "lg:grid-cols-[1fr_1fr]"} gap-6 lg:gap-8`}>
          {/* Left column: Credential cards — hidden on live page when no active credentials */}
          {(editCtx || hasActiveCredentials) && (<div className="relative flex flex-col gap-3">
            {/* Edit pencil — only when editCtx is present */}
            {editCtx && !credEditing && (
              <button
                type="button"
                onClick={() => setCredEditing(true)}
                className="absolute -top-2 -right-2 z-10 flex items-center gap-1.5 bg-white hover:bg-[#0f0f0d] hover:text-white text-[#0f0f0d] border border-[#d8d3c8] rounded-full px-3 py-1.5 shadow-sm transition-colors"
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
              <div key={c.title} className="bg-white border border-[#d8d3c8] rounded-[12px] p-5 flex gap-4">
                <div className="bg-[#f8fafc] rounded-[12px] size-[69px] shrink-0 flex items-center justify-center">
                  <img src={resolveImg(c.img)} alt={c.title} className="h-[44px] w-[50px] object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-['DM_Sans',sans-serif] font-semibold text-[15px] md:text-[16px] text-[#0f0f0d] tracking-[-0.09px]">{c.title}</p>
                    <span className="bg-[rgba(22,163,74,0.08)] text-[#16a34a] font-['DM_Sans',sans-serif] font-medium text-[12px] px-2.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] tracking-[0.08px]">{c.firm} &middot; {c.reg}</p>
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
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] tracking-[0.08px]">Certified to undertake full A&amp;A works on landed properties</p>
                </div>
              </div>
            )}

            {/* Credential edit panel */}
            {editCtx && credEditing && (
              <div className="bg-white border border-[#d8d3c8] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#d8d3c8] bg-[#f0ede6]">
                  <div className="flex items-center gap-2">
                    <svg className="size-[14px] text-[#0f0f0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    <span className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f0f0d]">Editing · Credentials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCredEditing(false)} className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] hover:text-[#0f0f0d] px-3 py-1.5 rounded-[8px] transition-colors">Cancel</button>
                    <button type="button" onClick={handleCredSave} className="font-['DM_Sans',sans-serif] text-[13px] font-medium text-white bg-[#0f0f0d] hover:opacity-85 px-4 py-1.5 rounded-[8px] transition-opacity">Save</button>
                  </div>
                </div>
                <div className="p-5 space-y-6">
                  {/* HDB */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">HDB Registered Contractor</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={credDraft.hdb.active}
                          onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, active: e.target.checked } })}
                          className="size-[16px] accent-[#0f0f0d] cursor-pointer"
                        />
                        <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860]">Show this credential</span>
                      </label>
                    </div>
                    <div className={`space-y-3 ${credDraft.hdb.active ? "" : "opacity-50 pointer-events-none"}`}>
                      <input
                        type="text"
                        value={credDraft.hdb.title}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, title: e.target.value } })}
                        placeholder="Title"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.hdb.firm}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, firm: e.target.value } })}
                        placeholder="ID firm (e.g. Your Studio Pte Ltd)"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.hdb.reg}
                        onChange={(e) => setCredDraft({ ...credDraft, hdb: { ...credDraft.hdb, reg: e.target.value } })}
                        placeholder="Registration date (e.g. Registered 2014)"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                    </div>
                  </div>

                  {/* BCA */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-['DM_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6860]">BCA Licensed Builder</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={credDraft.bca.active}
                          onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, active: e.target.checked } })}
                          className="size-[16px] accent-[#0f0f0d] cursor-pointer"
                        />
                        <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860]">Show this credential</span>
                      </label>
                    </div>
                    <div className={`space-y-3 ${credDraft.bca.active ? "" : "opacity-50 pointer-events-none"}`}>
                      <input
                        type="text"
                        value={credDraft.bca.title}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, title: e.target.value } })}
                        placeholder="Title"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.bca.firm}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, firm: e.target.value } })}
                        placeholder="ID firm (e.g. Your Studio Pte Ltd)"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
                      />
                      <input
                        type="text"
                        value={credDraft.bca.reg}
                        onChange={(e) => setCredDraft({ ...credDraft, bca: { ...credDraft.bca, reg: e.target.value } })}
                        placeholder="Registration date (e.g. Licensed since 2015)"
                        className="w-full h-[42px] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-3 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] focus:ring-2 focus:ring-[#0f0f0d]/10"
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
          <div className="bg-white border border-[#d8d3c8] rounded-[12px] overflow-hidden">
            <div className="border-b border-[#d8d3c8] px-5 py-3.5">
              <p className="font-['DM_Sans',sans-serif] font-semibold text-[13px] text-[#6b6860] tracking-[0.42px] uppercase">Business Information</p>
            </div>
            {(editCtx ? allRows : allRows.filter((r) => r.value.trim() !== "")).map((info: any, i: number, arr: any[]) => (
              <div key={info.label} className={`flex gap-5 px-5 py-3 ${i < arr.length - 1 ? "border-b border-[#d8d3c8]" : ""}`}>
                <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] w-[160px] md:w-[180px] shrink-0">{info.label}</p>
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

/* ─── CASE STUDIES ─── */
function PhaseTextField({ value, placeholder, multiline, onSave, className, style }: { value: string; placeholder: string; multiline?: boolean; onSave: (v: string) => void; className?: string; style?: React.CSSProperties }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { if (draft !== value) onSave(draft); };
  const common = {
    value: draft,
    onChange: (e: any) => setDraft(e.target.value),
    onBlur: commit,
    placeholder,
    className: `${className || ""} bg-transparent border-0 outline-none w-full rounded-[6px] px-2 -mx-2 focus:bg-white focus:ring-1 focus:ring-[#d8d3c8] transition-colors placeholder:text-[#a8a8a8]`,
    style,
  };
  if (multiline) {
    return <textarea {...(common as any)} rows={3} onKeyDown={(e: any) => { if (e.key === "Escape") { setDraft(value); e.currentTarget.blur(); } }} />;
  }
  return <input type="text" {...(common as any)} onKeyDown={(e: any) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setDraft(value); e.currentTarget.blur(); } }} />;
}

export function CaseStudies() {
  const ctx = useDesignerCtx();
  const editCtx = useContext(ProfileEditContext);
  const phases = ctx?.caseStudyPhases ?? caseStudyPhases;

  // Hide on live page when no phases exist
  if (!editCtx && !phases.length) return null;

  const addPhaseFileRef = useRef<HTMLInputElement>(null);
  const replaceImgRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploadingPhase, setUploadingPhase] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);

  const serializePhases = (next: any[]) => next.map(({ img, ...rest }: any) => ({ ...rest, image: rest.image ?? img ?? "" }));

  const handleAddPhase = async (file: File) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setUploadingPhase(true);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const nextNum = phases.length + 1;
      const newPhase = { phase: `Phase ${nextNum}`, title: "New Phase", desc: "Description", image: url, tags: [] };
      await editCtx.saveCollection("casestudies", serializePhases([...phases, newPhase]));
    } finally { setUploadingPhase(false); }
  };

  const handleRemovePhase = async (idx: number) => {
    if (!editCtx?.saveCollection) return;
    await editCtx.saveCollection("casestudies", serializePhases(phases.filter((_: any, i: number) => i !== idx)));
  };

  const handleUpdatePhase = async (idx: number, field: string, value: string) => {
    if (!editCtx?.saveCollection) return;
    const next = phases.map((p: any, i: number) => i === idx ? { ...p, [field]: value } : p);
    await editCtx.saveCollection("casestudies", serializePhases(next));
  };

  const handleReplacePhaseImage = async (idx: number, file: File) => {
    if (!editCtx?.uploadImage || !editCtx?.saveCollection) return;
    setReplacingIdx(idx);
    try {
      const url = await editCtx.uploadImage(file);
      if (!url) return;
      const next = phases.map((p: any, i: number) => i === idx ? { ...p, image: url, img: url } : p);
      await editCtx.saveCollection("casestudies", serializePhases(next));
    } finally { setReplacingIdx(null); }
  };

  return (
    <section className="bg-[#fafaf8] py-10 md:py-14 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1293px] mx-auto">
        {/* Left-aligned header */}
        <div className="mb-8 md:mb-12">
          <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[19px] md:text-[20px] text-[#0f0f0d] tracking-[-0.88px] leading-[48px]">
            Case Study: From Blueprint to Completion
          </h2>
          <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] max-w-[684px] leading-[26px]">
            A structured overview of how this residence progressed from concept planning to final handover.
          </p>
        </div>

        {/* Timeline rows – image LEFT, dot CENTER, card RIGHT */}
        <div className="relative flex flex-col gap-10 lg:gap-14">
          {/* Vertical connecting line between dots */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[11px] bottom-[11px] w-[2px] bg-[#e5e5e5] pointer-events-none" />

          {phases.map((phase: any, idx: number) => (
            <div
              key={`${phase.phase}-${idx}`}
              className="flex flex-col lg:flex-row items-start lg:items-stretch relative group/phase"
            >
              {/* Image – left column */}
              <div className="w-full lg:w-[38%] shrink-0">
                <div className="relative rounded-[10px] overflow-hidden shadow-[0px_10px_30px_0px_rgba(0,0,0,0.04)] h-[220px] md:h-[335px]">
                  <img src={resolveImg(phase.img)} alt={phase.title} className="w-full h-full object-cover" />
                  {editCtx && (
                    <>
                      <button
                        type="button"
                        onClick={() => replaceImgRefs.current[idx]?.click()}
                        className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                        title="Replace image"
                      >
                        {replacingIdx === idx ? (
                          <svg className="size-9 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white">
                            <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            <span className="font-['DM_Sans',sans-serif] text-[12px] font-medium">Replace image</span>
                          </div>
                        )}
                      </button>
                      <input
                        ref={(el) => { replaceImgRefs.current[idx] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplacePhaseImage(idx, f); e.currentTarget.value = ""; }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Timeline dot – center (absolutely positioned at true center) */}
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-2 z-10">
                <div className="size-[18px] bg-[#e5e5e5] rounded-full flex items-center justify-center">
                  <div className="size-[4px] rounded-full" />
                </div>
              </div>

              {/* Content card – right column */}
              <div className="w-full lg:flex-1 mt-4 lg:mt-0 relative">
                {editCtx && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(idx)}
                    className="absolute -top-2 -right-2 z-10 size-[28px] rounded-full bg-white hover:bg-[#0f0f0d] text-[#0f0f0d] hover:text-white border border-[#d8d3c8] shadow-sm flex items-center justify-center opacity-0 group-hover/phase:opacity-100 transition-all"
                    title="Remove phase"
                  >
                    <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
                <div className="bg-white border border-[#d8d3c8] rounded-[12px] h-full p-6 flex flex-col justify-center max-w-[495px] ml-auto">
                  {editCtx ? (
                    <>
                      <PhaseTextField
                        value={phase.phase}
                        placeholder="Phase 1"
                        onSave={(v) => handleUpdatePhase(idx, "phase", v)}
                        className="font-['DM_Sans',sans-serif] font-bold text-[12px] text-[#0f0f0d] tracking-[1.44px] leading-[18px] mb-2 uppercase"
                      />
                      <PhaseTextField
                        value={phase.title}
                        placeholder="Title"
                        onSave={(v) => handleUpdatePhase(idx, "title", v)}
                        className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] md:text-[20px] text-[#0f0f0d] leading-[40px] mb-1"
                      />
                      <PhaseTextField
                        value={phase.desc}
                        placeholder="Description"
                        multiline
                        onSave={(v) => handleUpdatePhase(idx, "desc", v)}
                        className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] leading-[27px] mb-5 resize-none"
                      />
                    </>
                  ) : (
                    <>
                      <p className="font-['DM_Sans',sans-serif] font-bold text-[12px] text-[#0f0f0d] tracking-[1.44px] leading-[18px] mb-2">{phase.phase}</p>
                      <h3 className="font-['EB_Garamond',Georgia,serif] font-normal text-[18px] md:text-[20px] text-[#0f0f0d] leading-[40px] mb-1">{phase.title}</h3>
                      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] leading-[27px] mb-5 max-w-[405px]">{phase.desc}</p>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(phase.tags || []).map((t: any) => (
                      <span
                        key={t.label}
                        className={`${t.bg} ${t.text} font-['DM_Sans',sans-serif] font-medium text-[12px] leading-[18px] pl-[10px] pr-3 py-1 rounded-full inline-flex items-center gap-[4px]`}
                      >
                        <TagIcon icon={t.icon} color={t.iconColor} />
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add phase tile (edit mode only) */}
          {editCtx && (
            <div className="flex flex-col lg:flex-row items-start lg:items-stretch relative">
              <div className="w-full lg:w-[38%] shrink-0">
                <button
                  type="button"
                  onClick={() => addPhaseFileRef.current?.click()}
                  className="w-full rounded-[10px] h-[220px] md:h-[335px] border-2 border-dashed border-[#d8d3c8] bg-[#f0ede6] hover:border-[#0f0f0d] hover:bg-white transition-colors flex flex-col items-center justify-center gap-3 group/add"
                  title="Add phase"
                >
                  {uploadingPhase ? (
                    <svg className="size-9 animate-spin text-[#6b6860]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <>
                      <div className="size-[64px] rounded-full border-2 border-dashed border-[#d8d3c8] bg-white flex items-center justify-center group-hover/add:border-[#0f0f0d] transition-colors">
                        <svg className="size-8 text-[#6b6860] group-hover/add:text-[#0f0f0d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                      </div>
                      <span className="font-['DM_Sans',sans-serif] text-[14px] font-medium text-[#6b6860] group-hover/add:text-[#0f0f0d] transition-colors">Add phase</span>
                      <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#99a1af]">Click to upload an image</span>
                    </>
                  )}
                </button>
                <input
                  ref={addPhaseFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddPhase(f); e.currentTarget.value = ""; }}
                />
              </div>
              <div className="w-full lg:flex-1 mt-4 lg:mt-0">
                <div className="border-2 border-dashed border-[#d8d3c8] rounded-[12px] h-full p-6 flex items-center justify-center max-w-[495px] ml-auto bg-[#f0ede6]/40">
                  <span className="font-['DM_Sans',sans-serif] text-[13px] text-[#99a1af] text-center">Upload an image to start a new phase. Title and description appear here.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

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
    width: "100%", height: "44px", padding: "0 14px", background: "#fafaf8",
    border: "1px solid #d8d3c8", borderRadius: "10px", color: "#0f0f0d",
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
        style={{ background: "#fff", border: "1px solid #d8d3c8", borderRadius: "16px", boxShadow: "0 24px 60px rgba(15,15,13,0.25)", fontFamily: "'DM Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #d8d3c8", background: "#f0ede6" }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#9a9790" }}>New Story</div>
            <h2 className="mt-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "22px", color: "#0f0f0d", lineHeight: 1.2 }}>Add Story</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-40" style={{ background: "#fff", border: "1px solid #d8d3c8", color: "#6b6860" }} aria-label="Close">
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
              style={{ aspectRatio: "9/16", maxHeight: "320px", background: "#f0ede6", border: "2px dashed #d8d3c8", borderRadius: "12px" }}
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
              onBlur={(e) => { e.currentTarget.style.borderColor = "#d8d3c8"; }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} placeholder="e.g. A quick look at the completed kitchen makeover" onChange={(e) => setDescription(e.target.value)}
              className="w-full px-[14px] py-3 text-[14px] outline-none transition-colors resize-none"
              rows={3}
              style={{ background: "#fafaf8", border: "1px solid #d8d3c8", borderRadius: "10px", color: "#0f0f0d", fontFamily: "'DM Sans', sans-serif" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0f0f0d"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#d8d3c8"; }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
            <input type="text" value={location} placeholder="e.g. Toa Payoh, Singapore" onChange={(e) => setLocation(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#0f0f0d"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#d8d3c8"; }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="h-10 px-4 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40" style={{ background: "#fff", color: "#0f0f0d", border: "1px solid #d8d3c8", borderRadius: "10px" }}>Cancel</button>
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
        style={{ aspectRatio: "16/9", background: "#f0ede6", border: "2px dashed #d8d3c8", borderRadius: "14px" }}
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
  const rating = ctx?.profile?.stats?.rating || "4.9";

  // Hide on live page when no reviews exist
  if (!editCtx && !rData.length) return null;

  return (
    <section className="py-10 md:py-16 px-4 md:px-8 border-b border-[#d8d3c8]">
      <div className="max-w-[1293px] mx-auto">
        {/* Centered header */}
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[24px] text-[#0f0f0d] tracking-[-0.6px] leading-[32px] text-center">
            What Homeowners Say
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Stars count={5} size="size-[16px]" />
            <span className="font-['DM_Sans',sans-serif] font-medium text-[16px] text-[#6b6860]">{rating}/5 Average Rating</span>
          </div>
        </div>

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
                  className="bg-[#f8fafc] border border-[#d8d3c8] rounded-full px-[14px] py-[8px] flex items-center gap-[7px] cursor-pointer hover:bg-[#f1f3f5] transition-colors"
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
                  className="bg-white border border-[#d8d3c8] rounded-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] p-[21px]"
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
                  <p className="font-['DM_Sans',sans-serif] text-[14px] text-[#6b6860] leading-[22.75px]">{r.text}</p>
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
                <div key={i} className="relative rounded-[14px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] cursor-pointer group" style={{ aspectRatio: "16/9" }}>
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

  return (
    <div className="bg-white border border-[#d8d3c8] rounded-[16px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      {/* Image */}
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

      {/* Content */}
      <div className="p-5">
        {/* Stars + Verified */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="size-[14px]" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.167L8.682 4.702L12.6 5.232L9.8 7.955L10.521 11.856L7 10.069L3.479 11.856L4.2 7.955L1.4 5.232L5.318 4.702L7 1.167Z" fill="#FFA929" />
              </svg>
            ))}
          </div>
          <div className="flex items-center gap-[6px]">
            <img src={imgGoogle} alt="Google" className="size-[16px] object-contain" />
            <span className="font-['DM_Sans',sans-serif] font-medium text-[12px] text-[#34a42f] leading-[16px]">Verified</span>
          </div>
        </div>

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
        <div className="border-t border-[#e8e4db] pt-3 flex items-center gap-[10px]">
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
  const rvws = ctx?.reviews ?? reviews;
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
    <section ref={sectionRef} className="py-10 md:py-16 px-4 md:px-8 border-b border-[#d8d3c8] scroll-mt-[80px]">
      <div className="max-w-[1293px] mx-auto">

        {/* ── Reviews container with animated max-height ── */}
        <div className="relative">
          <div
            ref={gridRef}
            style={{
              maxHeight: expanded ? `${contentHeight}px` : `${COLLAPSED_HEIGHT}px`,
              transition: "max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
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

          {/* Gradient fade — fades out when expanded */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-[2]"
            style={{
              background: "linear-gradient(to bottom, rgba(240,237,230,0) 0%, rgba(240,237,230,0.85) 50%, rgba(240,237,230,1) 100%)",
              opacity: expanded ? 0 : 1,
              transition: "opacity 0.5s ease",
            }}
          />
        </div>

        {/* ── View More / View Less button ── */}
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
    <section className="bg-[#e8e4db] border-t border-[#d8d3c8] rounded-[12px] py-10 md:py-14 px-4 md:px-8">
      <div className="max-w-[1293px] mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[22px] md:text-[24px] text-[#0f0f0d] tracking-[-0.6px] mb-2">Our Service Area</h2>
          <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6b6860] max-w-[464px] mx-auto leading-[24px]">
            {saDesc}
          </p>
        </div>

        {/* Map card */}
        <div className="relative rounded-[22px] overflow-hidden h-[400px] md:h-[537px] group">
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

/* ─── LOADING SKELETON ─── */
export function ProfileLoadingSkeleton() {
  return (
    <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]">
      <SiteNav logoImg={logoMarkImg} />
      <main className="pt-[24px] md:pt-[40px]">
        <div className="max-w-[1293px] mx-auto px-4 md:px-8">
          {/* Cover shimmer */}
          <div className="w-full h-[260px] md:h-[462px] rounded-[16px] md:rounded-[20px] bg-[#d8d3c8] animate-pulse" />
          {/* Profile row shimmer */}
          <div className="flex items-start gap-5 md:gap-7 mt-[-50px] md:mt-[-80px] pl-4 md:pl-8">
            <div className="size-[90px] md:size-[160px] rounded-full bg-[#d8d3c8] animate-pulse border-4 border-white shrink-0" />
            <div className="hidden md:block pt-[90px] space-y-3 flex-1 max-w-[520px]">
              <div className="h-7 w-[200px] bg-[#d8d3c8] rounded-lg animate-pulse" />
              <div className="h-5 w-[360px] bg-[#d8d3c8] rounded-lg animate-pulse" />
              <div className="h-4 w-[240px] bg-[#d8d3c8] rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Stats shimmer */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2.5 max-w-[790px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[60px] bg-[#d8d3c8] rounded-[12px] animate-pulse" />
            ))}
          </div>
          {/* Bio shimmer */}
          <div className="mt-6 max-w-[768px] space-y-2">
            <div className="h-4 w-full bg-[#d8d3c8] rounded animate-pulse" />
            <div className="h-4 w-[80%] bg-[#d8d3c8] rounded animate-pulse" />
          </div>
          {/* Team shimmer */}
          <div className="mt-6 flex gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="size-[74px] md:size-[80px] rounded-full bg-[#d8d3c8] animate-pulse" />
                <div className="h-3 w-12 bg-[#d8d3c8] rounded animate-pulse" />
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

  // Transform API data into component-compatible shapes
  const ctxValue = useMemo<DesignerCtxType | null>(() => {
    if (!apiData) return null;
    return transformApiData(apiData);
  }, [apiData]);

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
      <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]">
        <SiteNav logoImg={logoMarkImg} />

        <main className="pt-[24px] md:pt-[40px]">
          <div className="max-w-[1293px] mx-auto px-4 md:px-8">
            {/* Hero + Profile */}
            <HeroSection />

            {/* Stats */}
            <div className="mt-6 md:mt-8 lg:max-w-[790px]">
              <StatsRow />
            </div>

            {/* Bio */}
            <div className="mt-6 lg:max-w-[768px]">
              <BioText />
            </div>

            {/* Team Avatars */}
            <div className="mt-6">
              <TeamAvatars />
            </div>

            {/* Mobile Quote Card */}
            <div className="mt-6">
              <MobileQuoteSection />
            </div>

            {/* Trusted Since */}
            <div className={`mt-8 md:mt-12${!(ctxValue?.teamMembers?.length) ? " lg:max-w-[768px]" : ""}`}>
              <TrustedSince />
            </div>

            {/* Projects */}
            <div className="mt-12 md:mt-16">
              <ProjectsSection />
            </div>
          </div>

          {/* Trust & Credentials (full width bg) */}
          <div className="mt-12 md:mt-16">
            <TrustCredentials />
          </div>

          {/* Case Studies */}
          <div className="mt-0">
            <CaseStudies />
          </div>

          {/* What Homeowners Say */}
          <div className="mt-0">
            <HomeownersSay />
          </div>

          {/* Google Review Cards with Images */}
          <div className="mt-0">
            <GoogleReviewCards />
          </div>

          {/* Service Area */}
          <div className="mt-0">
            <ServiceArea />
          </div>
        </main>

        {/* Footer (homepage style) */}
        <footer className="px-6 md:px-10 py-10 md:py-14 mt-12 md:mt-16">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <a href="/" className="block shrink-0" style={{
                  width: "110px", height: "23px", background: "#0f0f0d",
                  maskImage: `url('${logoMarkImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
                  WebkitMaskImage: `url('${logoMarkImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
                }} />
                <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
                  {FOOTER.links.map((link: { label: string; href: string }) => (
                    <a key={link.label} href={link.href}
                      className="text-[13px] font-normal hover:opacity-60 cursor-pointer no-underline font-['DM_Sans',sans-serif]"
                      style={{ color: "#9a9790", transition: "all 0.15s" }}
                    >{link.label}</a>
                  ))}
                </div>
              </div>
              <span className="text-[12px] font-normal font-['DM_Sans',sans-serif]" style={{ color: "#9a9790" }}>
                {FOOTER.copyright}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </DesignerDataContext.Provider>
  );
}
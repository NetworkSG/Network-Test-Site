import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { useParams } from "react-router";
import { createPortal } from "react-dom";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import { useFloorPlanSet, classifyFloorPlan } from "../utils/floor-plan-detect";
import {
  DesignerDataContext,
  ProfileEditContext,
  transformApiData,
  resolveImg,
  HeroSection,
  StudioInfo,
  QuoteCard,
  BioText,
  TeamAvatars,
  BtoPackageCta,
  ProjectsSection,
  TrustedSince,
  RatingBreakdown,
  ExperienceTable,
  FAQ,
  GoogleReviewCards,
  ServiceArea,
  ProfileLoadingSkeleton,
} from "./DesignerProfile";
import { useGoogleReviews } from "./useGoogleReviews";
import {
  LogOut, Pencil, X, Check, Loader2, Plus, Trash2, Save, Eye,
  Upload, MapPin, Star, Users, Briefcase, FileText,
  MessageSquare, Globe, Camera, ArrowLeft, Shield, Award,
  Hammer, Layers, Square as SquareIcon, Wind, Zap, Droplet, Paintbrush, Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { C, serif, sans, FadeIn, TagLabel } from "./homepage/v8/primitives";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

// Neutral placeholder images (SVG data URIs) so Sora fallback never shows
const PLACEHOLDER_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23e5e2dc'/%3E%3Cstop offset='100%25' stop-color='%23d8d3c8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1200' height='500'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-family='Inter,sans-serif' font-size='20' fill='%239a9790'%3EUpload your cover image%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect fill='%230f0f0d' width='160' height='160' rx='80'/%3E%3C/svg%3E";

// ─── API helpers ──────────────────────────────────────────────────
// Cached admin Supabase JWT — set once when the editor is opened from /admin.
// Lets admin users bypass the portal designer-token auth.
let cachedAdminToken: string | null = null;
export function setCachedAdminToken(t: string | null) { cachedAdminToken = t; }
function editorApi(path: string, opts: any = {}) {
  const token = localStorage.getItem("designer-token") || "";
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(token ? { "X-Designer-Token": token } : {}),
      ...(cachedAdminToken ? { "X-User-Token": cachedAdminToken } : {}),
      ...(opts.headers || {}),
    },
  });
}

// ─── Editor Context ───────────────────────────────────────────────
interface EditorCtx {
  editing: string | null;
  setEditing: (section: string | null) => void;
  saving: boolean;
  rawData: any;
  slug: string;
  saveSection: (section: string, data: any) => Promise<boolean>;
  refetchData: () => void;
}
const EditorContext = createContext<EditorCtx | null>(null);
function useEditor() { return useContext(EditorContext)!; }

// ─── LOGIN SCREEN ─────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${API}/portal-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Login failed"); setLoading(false); return; }
      localStorage.setItem("designer-token", json.token);
      onLogin();
    } catch (err: any) {
      setError(err.name === "AbortError" ? "Login timed out. Please try again." : (err.message || "Network error"));
    }
    setLoading(false);
  };

  const inputCls = "w-full h-[52px] px-4 outline-none transition-colors text-[15px]";
  const inputStyle: React.CSSProperties = {
    background: C.white,
    border: `1px solid ${C.creamBorder}`,
    borderRadius: "12px",
    fontFamily: sans,
    color: C.black,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.cream, fontFamily: sans, color: C.black }}
    >
      <div
        className="w-full max-w-[420px] p-8"
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          borderRadius: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div className="text-center mb-8">
          <h1
            style={{
              fontFamily: serif,
              fontSize: "36px",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Editor Access
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: C.gray }}>
            Sign in to edit designer profiles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5"><TagLabel>Username</TagLabel></div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your portal username"
              required
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <div className="mb-1.5"><TagLabel>Password</TagLabel></div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {error && <p className="text-[13px]" style={{ color: "#c0392b" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] text-[15px] font-medium hover:opacity-85 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: C.black,
              color: C.white,
              borderRadius: "12px",
              fontFamily: sans,
              transition: "all 0.15s",
            }}
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── EDITABLE SECTION WRAPPER ─────────────────────────────────────
function EditableSection({
  sectionKey,
  label,
  icon: Icon,
  children,
}: {
  sectionKey: string;
  label: string;
  icon: any;
  children: React.ReactNode;
}) {
  const { editing, setEditing } = useEditor();
  const isEditing = editing === sectionKey;
  const childArray = Array.isArray(children) ? children : [children];
  const displayContent = childArray[0];
  const editFormContent = childArray[1];

  return (
    <div className="group relative">
      {/* Pencil button — top right of section, visible on hover (or always while editing) */}
      <button
        onClick={() => setEditing(isEditing ? null : sectionKey)}
        className={`absolute top-3 right-3 z-30 ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} w-9 h-9 flex items-center justify-center hover:opacity-85 transition-all cursor-pointer`}
        style={{
          background: isEditing ? C.black : C.white,
          color: isEditing ? C.white : C.black,
          border: `1px solid ${C.creamBorder}`,
          borderRadius: "10px",
          fontFamily: sans,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        aria-label={isEditing ? `Close ${label} editor` : `Edit ${label}`}
        title={isEditing ? "Close" : `Edit ${label}`}
      >
        {isEditing ? <X size={15} /> : <Pencil size={14} />}
      </button>

      {/* Soft hover ring to hint that the section is editable */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
        style={{
          border: `1px ${isEditing ? "solid" : "dashed"} ${isEditing ? C.black : C.creamBorder}`,
          borderRadius: "12px",
        }}
      />

      {/* View mode = the public section. Edit mode = the inline edit form, in place. */}
      <AnimatePresence initial={false} mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="relative"
            style={{
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              fontFamily: sans,
            }}
          >
            <div
              className="px-6 py-4 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ borderBottom: `1px solid ${C.creamBorder}`, color: C.gray }}
            >
              <Icon size={14} /> Editing · {label}
            </div>
            <div className="p-6">{editFormContent}</div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {displayContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── INLINE EDIT COMPONENT ────────────────────────────────────────
function InlineEdit({
  value,
  placeholder,
  onSave,
  className = "",
  inputClassName = "",
  multiline = false,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => any;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = async () => {
    setEditing(false);
    if (draft === value) return;
    setSaving(true);
    try { await Promise.resolve(onSave(draft)); }
    finally { setSaving(false); }
  };

  if (editing) {
    const sharedClass = `px-3 py-2 outline-none ${inputClassName}`;
    const sharedStyle: React.CSSProperties = {
      background: C.white,
      border: `1px solid ${C.creamBorder}`,
      borderRadius: "10px",
      fontFamily: sans,
      color: C.black,
    };
    return multiline ? (
      <textarea
        ref={inputRef as any}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        rows={3}
        className={`${sharedClass} resize-y w-full`}
        style={sharedStyle}
      />
    ) : (
      <input
        ref={inputRef as any}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={sharedClass}
        style={sharedStyle}
      />
    );
  }

  return (
    <span
      className={`group/inline inline-flex items-center gap-1.5 ${saving ? "cursor-wait opacity-60" : "cursor-pointer hover:border-b hover:border-dashed"} transition-colors ${className}`}
      style={{ borderBottomColor: C.creamBorder }}
      onClick={() => { if (!saving) setEditing(true); }}
    >
      <span className={!value || value === placeholder ? "opacity-40 italic" : ""}>{value || placeholder || "Click to edit"}</span>
      {saving ? (
        <Loader2 size={12} className="animate-spin shrink-0" style={{ color: C.gray }} />
      ) : (
        <Pencil size={12} className="opacity-0 group-hover/inline:opacity-60 shrink-0 transition-opacity" style={{ color: C.gray }} />
      )}
    </span>
  );
}

// Inline image edit — click to change URL
function InlineImageEdit({ src, onSave, className = "", overlayText = "Change image" }: {
  src: string; onSave: (url: string) => void; className?: string; overlayText?: string;
}) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState(src);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(src); }, [src]);
  useEffect(() => { if (showInput) inputRef.current?.focus(); }, [showInput]);

  const commit = () => {
    setShowInput(false);
    if (url !== src) onSave(url);
  };

  return (
    <div className={`relative group/img ${className}`}>
      {showInput && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3 flex gap-2" style={{ background: "rgba(15,15,13,0.85)" }}>
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setUrl(src); setShowInput(false); } }}
            placeholder="Paste image URL..."
            className="flex-1 h-[40px] px-3 text-[13px] outline-none"
            style={{
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "10px",
              color: C.black,
              fontFamily: sans,
            }}
          />
        </div>
      )}
      {!showInput && (
        <div
          onClick={() => setShowInput(true)}
          className="absolute inset-0 z-10 hover:bg-black/30 transition-colors cursor-pointer flex items-center justify-center"
        >
          <span
            className="opacity-0 group-hover/img:opacity-100 text-[11px] font-semibold uppercase tracking-[0.12em] px-3 py-1.5 flex items-center gap-1.5 transition-opacity"
            style={{ background: C.black, color: C.white, borderRadius: "10px", fontFamily: sans }}
          >
            <Camera size={13} /> {overlayText}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── FIELD COMPONENTS ─────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    background: C.white,
    border: `1px solid ${C.creamBorder}`,
    borderRadius: "12px",
    color: C.black,
    fontFamily: sans,
  };
  return (
    <div>
      <div className="mb-1.5"><TagLabel>{label}</TagLabel></div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 text-[14px] outline-none transition-colors resize-y"
          style={inputStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[44px] px-4 text-[14px] outline-none transition-colors"
          style={inputStyle}
        />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className="w-9 h-5 rounded-full transition-colors relative"
        style={{ background: checked ? C.black : C.creamBorder }}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${checked ? "left-[18px]" : "left-0.5"}`} style={{ background: C.white }} />
      </div>
      <span className="text-[13px]" style={{ color: C.gray, fontFamily: sans }}>{label}</span>
    </label>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="h-[48px] px-6 text-[13px] font-medium hover:opacity-85 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
      style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans }}
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {saving ? "Saving..." : "Save Changes"}
    </button>
  );
}

// ─── EDIT FORMS ───────────────────────────────────────────────────

// CoverEditForm removed — featured project is now managed via the toggle in Add/Edit Project modals

// ─── HERO EDIT FORM (covers everything in the hero section) ──────
function HeroEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const p = rawData || {};
  const [form, setForm] = useState({
    name: p.name || "",
    tagline: p.tagline || "",
    availability: p.availability || "",
    location: p.location || "",
    verified: p.verified ?? true,
    coverImage: p.images?.cover || "",
    logoImage: p.images?.logo || "",
    coverProjectName: p.coverProject?.name || "",
    coverProjectCost: p.coverProject?.cost || "",
    coverProjectArea: p.coverProject?.area || "",
    coverProjectYear: p.coverProject?.year || "",
    coverProjectStyle: p.coverProject?.style || "",
  });

  const handleSave = async () => {
    const ok = await saveSection("profile", {
      name: form.name,
      tagline: form.tagline,
      availability: form.availability,
      location: form.location,
      verified: form.verified,
      images: { ...(p.images || {}), cover: form.coverImage, logo: form.logoImage },
      coverProject: {
        name: form.coverProjectName,
        cost: form.coverProjectCost,
        area: form.coverProjectArea,
        year: form.coverProjectYear,
        style: form.coverProjectStyle,
      },
    });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Studio Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Input Interior Designer name" />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Singapore Based" />
      </div>
      <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} multiline placeholder="Crafting bespoke interiors..." />
      <Field label="Availability" value={form.availability} onChange={(v) => setForm({ ...form, availability: v })} placeholder="Available for Q3 2026" />
      <Toggle label="Verified Studio" checked={form.verified} onChange={(v) => setForm({ ...form, verified: v })} />
      <Field label="Logo Image URL" value={form.logoImage} onChange={(v) => setForm({ ...form, logoImage: v })} placeholder="https://..." />
      <Field label="Cover Image URL" value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} placeholder="https://..." />
      <div className="mt-4"><TagLabel>Featured Project Details</TagLabel></div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Project Name" value={form.coverProjectName} onChange={(v) => setForm({ ...form, coverProjectName: v })} placeholder="Serangoon Terrace" />
        <Field label="Cost" value={form.coverProjectCost} onChange={(v) => setForm({ ...form, coverProjectCost: v })} placeholder="$128,500" />
        <Field label="Area" value={form.coverProjectArea} onChange={(v) => setForm({ ...form, coverProjectArea: v })} placeholder="145m²" />
        <Field label="Year" value={form.coverProjectYear} onChange={(v) => setForm({ ...form, coverProjectYear: v })} placeholder="2024" />
      </div>
      <Field label="Interior Style" value={form.coverProjectStyle} onChange={(v) => setForm({ ...form, coverProjectStyle: v })} placeholder="Modern Contemporary Luxe" />
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

// ─── INLINE STATS ROW ────────────────────────────────────────────
function InlineStatsRow() {
  const { rawData, saveSection } = useEditor();
  const s = rawData?.stats || {};
  const rating = s.rating || "0";
  const reviewCount = s.reviewCount || "0";
  const years = s.years || "1";
  const hdbCert = s.hdbCert ?? false;
  const bcaLicensed = s.bcaLicensed ?? false;

  const save = (patch: any) => saveSection("profile", { stats: { ...s, ...patch } });

  const cardStyle: React.CSSProperties = {
    background: C.white,
    border: `1px solid ${C.creamBorder}`,
    borderRadius: "12px",
    fontFamily: sans,
  };
  const numberStyle: React.CSSProperties = {
    fontFamily: serif,
    fontSize: "clamp(32px, 4.5vw, 52px)",
    color: C.black,
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
  };

  return (
    <section className="py-[60px] md:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Rating */}
            <div className="p-7" style={cardStyle}>
              <p style={numberStyle}>
                <InlineEdit
                  value={rating}
                  placeholder="4.9"
                  onSave={(v) => save({ rating: v })}
                  inputClassName="w-[120px]"
                />
              </p>
              <div className="mt-3">
                <TagLabel>Average Rating</TagLabel>
              </div>
              <p className="mt-1.5 text-[14px]" style={{ color: C.gray }}>
                <InlineEdit
                  value={reviewCount}
                  placeholder="0"
                  onSave={(v) => save({ reviewCount: v })}
                  inputClassName="w-[80px]"
                />{" "}
                Reviews
              </p>
            </div>

            {/* Years */}
            <div className="p-7" style={cardStyle}>
              <p style={numberStyle}>
                <InlineEdit
                  value={years}
                  placeholder="12"
                  onSave={(v) => save({ years: v })}
                  inputClassName="w-[120px]"
                />
              </p>
              <div className="mt-3">
                <TagLabel>Years Experience</TagLabel>
              </div>
              <p className="mt-1.5 text-[14px]" style={{ color: C.gray }}>Established</p>
            </div>

            {/* Certifications — toggles */}
            <div className="p-7" style={cardStyle}>
              <button
                onClick={() => save({ hdbCert: !hdbCert })}
                style={numberStyle}
                className="block text-left hover:opacity-70 transition-opacity cursor-pointer"
                title="Click to toggle HDB certification"
              >
                {hdbCert ? "HDB" : "Reg."}
              </button>
              <div className="mt-3">
                <TagLabel>Certified</TagLabel>
              </div>
              <button
                onClick={() => save({ bcaLicensed: !bcaLicensed })}
                className="block text-left mt-1.5 text-[14px] hover:opacity-70 transition-opacity cursor-pointer"
                style={{ color: C.gray, fontFamily: sans }}
                title="Click to toggle BCA license"
              >
                {bcaLicensed ? "BCA Licensed" : "Licensed"}
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── INLINE BIO TEXT ─────────────────────────────────────────────
function InlineBioText() {
  const { rawData, saveSection } = useEditor();
  const bio = rawData?.bio || "";
  return (
    <section className="py-[60px] md:py-[80px]">
      <div className="max-w-[760px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>About the studio</TagLabel>
          <div
            className="mt-4"
            style={{
              fontFamily: sans,
              fontSize: "17px",
              lineHeight: 1.65,
              color: C.gray,
            }}
          >
            <InlineEdit
              value={bio}
              placeholder="Describe your studio — renovation specialties, property types, styles, and budget range."
              onSave={(v) => saveSection("profile", { bio: v })}
              className="w-full"
              inputClassName="w-full"
              multiline
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── INLINE TRUSTED SINCE ────────────────────────────────────────
function InlineTrustedSince() {
  const { rawData, saveSection } = useEditor();
  const ctx = useContext(DesignerDataContext);
  const p = ctx?.profile;
  const ts = rawData?.trustedSince || {};
  const title = ts.title || "";
  const desc = ts.description || "";
  const badges: string[] = ts.badges || [];
  const save = (patch: any) => saveSection("profile", { trustedSince: { ...ts, ...patch } });
  const saveBadge = (i: number, v: string) => {
    const next = [...badges];
    next[i] = v;
    save({ badges: next });
  };
  const addBadge = () => save({ badges: [...badges, "New Badge"] });
  const removeBadge = (i: number) => save({ badges: badges.filter((_, j) => j !== i) });

  return (
    <div>
      <FadeIn>
        <TagLabel>Trust & guarantees</TagLabel>
        <h2
          className="mt-3"
          style={{
            fontFamily: serif,
            fontSize: "clamp(28px, 3.2vw, 42px)",
            color: C.black,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          <InlineEdit
            value={title}
            placeholder="Trusted Since 2014"
            onSave={(v) => save({ title: v })}
            inputClassName="w-full"
          />
        </h2>
        <div className="mt-4 text-[16px] leading-[1.65]" style={{ color: C.gray, fontFamily: sans }}>
          <InlineEdit
            value={desc}
            placeholder="Share your studio's story — founder, years of experience, what you stand for."
            onSave={(v) => save({ description: v })}
            className="w-full"
            inputClassName="w-full"
            multiline
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 items-center">
          {badges.map((badge: string, i: number) => (
            <span
              key={i}
              className="group/badge inline-flex items-center gap-2 px-4 py-2 text-[13px]"
              style={{
                background: C.cream,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "9999px",
                color: C.black,
                fontFamily: sans,
                fontWeight: 500,
              }}
            >
              <span className="rounded-full size-2 inline-block" style={{ background: C.black }} />
              <InlineEdit
                value={badge}
                placeholder="Trust badge"
                onSave={(v) => saveBadge(i, v)}
                inputClassName="w-[200px]"
              />
              <button
                onClick={() => removeBadge(i)}
                className="opacity-0 group-hover/badge:opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: C.gray }}
                title="Remove badge"
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={addBadge}
            className="inline-flex items-center gap-1 px-3 py-2 text-[13px] hover:opacity-70 transition-opacity cursor-pointer"
            style={{
              border: `1px dashed ${C.creamBorder}`,
              borderRadius: "9999px",
              color: C.gray,
              fontFamily: sans,
            }}
          >
            <Plus size={12} /> Add Badge
          </button>
        </div>

      </FadeIn>
    </div>
  );
}

// ─── INLINE BTO PACKAGE ──────────────────────────────────────────
function InlineBtoPackage() {
  const { rawData, saveSection } = useEditor();
  const b = rawData?.btoPackage || {};
  const title = b.title || "";
  const desc = b.description || "";
  const tags: string[] = b.tags || [];

  const save = (patch: any) => saveSection("profile", { btoPackage: { ...b, ...patch } });
  const updateTag = (i: number, v: string) => { const next = [...tags]; next[i] = v; save({ tags: next }); };
  const addTag = () => save({ tags: [...tags, "New Tag"] });
  const removeTag = (i: number) => save({ tags: tags.filter((_, j) => j !== i) });

  return (
    <section className="py-[60px] md:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <div
            className="px-8 py-12 md:px-14 md:py-16"
            style={{
              background: C.footerDark,
              color: C.white,
              borderRadius: "16px",
              fontFamily: sans,
            }}
          >
            <div className="max-w-[640px]">
              <p className="text-[11px] uppercase" style={{ letterSpacing: "0.12em", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                BTO Package
              </p>
              <h3
                className="mt-3"
                style={{
                  fontFamily: serif,
                  fontSize: "clamp(28px, 3.4vw, 44px)",
                  color: C.white,
                  fontWeight: 400,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                }}
              >
                <InlineEdit
                  value={title}
                  placeholder="All-Inclusive BTO Packages"
                  onSave={(v) => save({ title: v })}
                  inputClassName="w-full"
                />
              </h3>
              <div className="mt-4 text-[16px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.75)" }}>
                <InlineEdit
                  value={desc}
                  placeholder="Describe your BTO package — what's included, starting price, key features."
                  onSave={(v) => save({ description: v })}
                  className="w-full"
                  inputClassName="w-full"
                  multiline
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-2 items-center">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="group/tag inline-flex items-center gap-1 px-4 py-1.5 text-[12px]"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "9999px",
                      color: C.white,
                      fontFamily: sans,
                      fontWeight: 500,
                    }}
                  >
                    <InlineEdit
                      value={tag}
                      placeholder="Tag"
                      onSave={(v) => updateTag(i, v)}
                      inputClassName="w-[120px]"
                    />
                    <button onClick={() => removeTag(i)} className="opacity-0 group-hover/tag:opacity-100 transition-opacity cursor-pointer" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={addTag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] hover:opacity-80 transition-opacity cursor-pointer"
                  style={{
                    border: "1px dashed rgba(255,255,255,0.3)",
                    borderRadius: "9999px",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: sans,
                  }}
                >
                  <Plus size={10} /> Add Tag
                </button>
              </div>
              <button
                className="mt-8 h-[52px] px-8 text-[14px] font-medium pointer-events-none"
                style={{
                  background: C.white,
                  color: C.black,
                  borderRadius: "12px",
                  fontFamily: sans,
                }}
              >
                View Packages →
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── INLINE TEAM ─────────────────────────────────────────────────
function InlineTeam() {
  const { rawData, saveSection } = useEditor();
  const team: any[] = rawData?.team || [];
  const [editingStoryIdx, setEditingStoryIdx] = useState<number | null>(null);

  const updateMember = (i: number, patch: any) => {
    const next = team.map((m, j) => (j === i ? { ...m, ...patch } : m));
    saveSection("team", next);
  };
  const removeMember = (i: number) => {
    saveSection("team", team.filter((_, j) => j !== i));
    if (editingStoryIdx === i) setEditingStoryIdx(null);
  };
  const addMember = () => saveSection("team", [...team, { name: "New Member", role: "Designer", specialty: "", projects: 0, experience: "", bio: "", image: "", type: "person" }]);
  const addStory = () => {
    const newIdx = team.length;
    saveSection("team", [...team, { name: "New Story", image: "", type: "project", reels: [] }]);
    setEditingStoryIdx(newIdx);
  };

  const updateReel = (memberIdx: number, reelIdx: number, patch: any) => {
    const m = team[memberIdx];
    if (!m) return;
    const reels = (m.reels || []).map((r: any, j: number) => (j === reelIdx ? { ...r, ...patch } : r));
    updateMember(memberIdx, { reels });
  };
  const removeReel = (memberIdx: number, reelIdx: number) => {
    const m = team[memberIdx];
    if (!m) return;
    const reels = (m.reels || []).filter((_: any, j: number) => j !== reelIdx);
    updateMember(memberIdx, { reels });
  };
  const addReel = (memberIdx: number) => {
    const m = team[memberIdx];
    if (!m) return;
    const reels = [...(m.reels || []), { img: "", caption: "New post", location: "", likes: 0, comments: 0 }];
    updateMember(memberIdx, { reels });
  };

  const editingMember = editingStoryIdx !== null ? team[editingStoryIdx] : null;

  return (
    <section className="py-[60px] md:py-[80px]" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>Our team & stories</TagLabel>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide items-start">
              {team.map((m, i) => {
                const isProject = m.type === "project";
                const borderStyle = isProject
                  ? `2px solid ${C.black}`
                  : `2px solid ${C.creamBorder}`;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 shrink-0 group/member relative">
                    <div
                      className="rounded-full size-[74px] md:size-[80px] p-[3px] overflow-hidden"
                      style={{ background: C.white, border: borderStyle }}
                    >
                      <InlineImageUpload
                        src={m.image ? resolveImg(m.image) : ""}
                        alt={m.name || "Member"}
                        onUploaded={(url) => updateMember(i, { image: url })}
                        className="w-full h-full"
                        rounded="rounded-full"
                        iconSize={20}
                      />
                    </div>
                    <span className="text-[13px] text-center max-w-[100px]" style={{ color: C.black, fontFamily: sans }}>
                      <InlineEdit
                        value={m.name || ""}
                        placeholder="Name"
                        onSave={(v) => updateMember(i, { name: v })}
                        inputClassName="w-[90px] text-center"
                      />
                    </span>
                    {isProject ? (
                      <button
                        onClick={() => setEditingStoryIdx(editingStoryIdx === i ? null : i)}
                        className="text-[11px] uppercase hover:opacity-70 cursor-pointer"
                        style={{ color: C.gray, fontFamily: sans, letterSpacing: "0.08em" }}
                      >
                        {editingStoryIdx === i ? "Close" : `Reels (${(m.reels || []).length})`}
                      </button>
                    ) : (
                      <span className="text-[12px] text-center max-w-[100px]" style={{ color: C.gray, fontFamily: sans }}>
                        <InlineEdit
                          value={m.role || ""}
                          placeholder="Role"
                          onSave={(v) => updateMember(i, { role: v })}
                          inputClassName="w-[90px] text-center"
                        />
                      </span>
                    )}
                    <button
                      onClick={() => removeMember(i)}
                      className="absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-opacity cursor-pointer"
                      style={{ background: C.white, border: `1px solid ${C.creamBorder}`, color: C.gray, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                      title={isProject ? "Remove story" : "Remove team member"}
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={addMember}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group/add"
              >
                <div
                  className="rounded-full size-[74px] md:size-[80px] flex items-center justify-center transition-colors"
                  style={{
                    background: C.cream,
                    border: `2px dashed ${C.creamBorder}`,
                  }}
                >
                  <Plus size={24} style={{ color: C.gray }} />
                </div>
                <span className="text-[12px]" style={{ color: C.gray, fontFamily: sans }}>Add Member</span>
              </button>

              <button
                onClick={addStory}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
              >
                <div
                  className="rounded-full size-[74px] md:size-[80px] flex items-center justify-center transition-colors"
                  style={{
                    background: C.cream,
                    border: `2px dashed ${C.black}`,
                  }}
                >
                  <Plus size={24} style={{ color: C.black }} />
                </div>
                <span className="text-[12px]" style={{ color: C.black, fontFamily: sans }}>Add Story</span>
              </button>
            </div>

            {/* Reel editor (project-type stories) */}
            {editingMember && editingStoryIdx !== null && editingMember.type === "project" && (
              <div
                className="p-5 md:p-6"
                style={{
                  background: C.white,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "12px",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h4 style={{ fontFamily: serif, fontSize: "20px", color: C.black, fontWeight: 400 }}>
                    Reels for "{editingMember.name || "Story"}"
                  </h4>
                  <button
                    onClick={() => setEditingStoryIdx(null)}
                    className="hover:opacity-70 cursor-pointer"
                    style={{ color: C.gray }}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(editingMember.reels || []).map((reel: any, ri: number) => {
                    const reelSrc = reel.img ? resolveImg(reel.img) : "";
                    return (
                      <div
                        key={ri}
                        className="p-3 group/reel relative"
                        style={{
                          background: C.white,
                          border: `1px solid ${C.creamBorder}`,
                          borderRadius: "12px",
                        }}
                      >
                        <div className="aspect-[9/16] overflow-hidden mb-3" style={{ borderRadius: "10px", background: C.cream }}>
                          <InlineMediaUpload
                            src={reelSrc}
                            alt={reel.caption || "Reel"}
                            onUploaded={(url) => updateReel(editingStoryIdx, ri, { img: url })}
                            className="w-full h-full"
                            rounded="rounded-[10px]"
                            iconSize={28}
                          />
                        </div>
                        <div className="text-[13px] mb-1" style={{ color: C.black, fontFamily: sans }}>
                          <InlineEdit
                            value={reel.caption || ""}
                            placeholder="Caption"
                            onSave={(v) => updateReel(editingStoryIdx, ri, { caption: v })}
                            className="w-full"
                            inputClassName="w-full"
                            multiline
                          />
                        </div>
                        <div className="text-[11px]" style={{ color: C.gray, fontFamily: sans }}>
                          <InlineEdit
                            value={reel.location || ""}
                            placeholder="Location"
                            onSave={(v) => updateReel(editingStoryIdx, ri, { location: v })}
                            className="w-full"
                            inputClassName="w-full"
                          />
                        </div>
                        <button
                          onClick={() => removeReel(editingStoryIdx, ri)}
                          className="absolute -top-1.5 -right-1.5 size-5 rounded-full flex items-center justify-center opacity-0 group-hover/reel:opacity-100 transition-opacity cursor-pointer"
                          style={{ background: C.white, border: `1px solid ${C.creamBorder}`, color: C.gray, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                          title="Remove reel"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => addReel(editingStoryIdx)}
                    className="flex flex-col items-center justify-center gap-1 cursor-pointer aspect-[9/16] min-h-[160px]"
                    style={{
                      background: C.cream,
                      border: `2px dashed ${C.creamBorder}`,
                      borderRadius: "12px",
                    }}
                  >
                    <Plus size={24} style={{ color: C.gray }} />
                    <span className="text-[12px]" style={{ color: C.gray, fontFamily: sans }}>Add Reel</span>
                    <span className="text-[10px] uppercase" style={{ color: C.grayLight, fontFamily: sans, letterSpacing: "0.08em" }}>Image / Video</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── PROJECT FORM CONSTANTS ──────────────────────────────────────
const PROPERTY_TYPES = ["HDB", "Condominium", "Landed", "Commercial"];
const AVAILABLE_WORKS = [
  { key: "carpentry", icon: Hammer, label: "Carpentry" },
  { key: "feature-wall", icon: Layers, label: "Feature Wall" },
  { key: "tiling", icon: SquareIcon, label: "Tiling" },
  { key: "aircon", icon: Wind, label: "Aircon" },
  { key: "electrical", icon: Zap, label: "Electrical Rewiring" },
  { key: "plumbing", icon: Droplet, label: "Plumbing" },
  { key: "painting", icon: Paintbrush, label: "Painting" },
  { key: "lighting", icon: Lightbulb, label: "Lighting" },
];

function slugifyTitle(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

/** Inspect a project draft and, if any of its images is a floor plan, route
 *  that image to `floorPlan` and rebuild `coverImage` + `gallery` so it never
 *  appears in the scrolling photos. Returns a new draft (no mutation). */
async function applyFloorPlanDetection(draft: NewProjectDraft): Promise<NewProjectDraft> {
  // Already explicitly set — trust it.
  if (draft.floorPlan) return draft;
  const candidates: string[] = [];
  if (draft.coverImage) candidates.push(draft.coverImage);
  for (const g of draft.gallery) if (g.src) candidates.push(g.src);
  if (!candidates.length) return draft;
  const verdicts = await Promise.all(
    candidates.map(async (u) => ({ u, isFp: await classifyFloorPlan(u) }))
  );
  const fpUrl = verdicts.find((v) => v.isFp)?.u;
  if (!fpUrl) return draft;
  const isCoverFp = draft.coverImage === fpUrl;
  const remainingGallery = draft.gallery.filter((g) => g.src !== fpUrl);
  let nextCover = draft.coverImage;
  let nextGallery = remainingGallery;
  if (isCoverFp) {
    // Promote the first remaining gallery image to cover so the project still
    // has a non-floor-plan hero shot.
    nextCover = remainingGallery[0]?.src || "";
    nextGallery = remainingGallery.slice(1);
  }
  return {
    ...draft,
    coverImage: nextCover,
    gallery: nextGallery,
    floorPlan: fpUrl,
    featuredImage: draft.featuredImage === fpUrl ? "" : draft.featuredImage,
  };
}

// ─── ADD PROJECT MODAL ───────────────────────────────────────────
interface NewProjectDraft {
  title: string;
  location: string;
  cost: string;
  size: string;
  year: string;
  propertyType: string;
  propertySubType: string;
  style: string;
  coverImage: string;
  gallery: { src: string; caption: string }[];
  worksIncluded: string[];
  designerName: string;
  isFeatured: boolean;
  featuredImage: string;
}

/** Auto-format a cost string: strip non-digits, add $ prefix and thousand separators */
function formatCost(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return "$" + Number(digits).toLocaleString("en-US");
}


/** Extract numeric digits from a size string */
function parseSizeDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

/** Format size: number with thousand separators */
function formatSizeNumber(raw: string): string {
  const digits = parseSizeDigits(raw);
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

/** Combine number + sqm unit into display string */
function buildSizeString(num: string): string {
  if (!num) return "sqm";
  return `${num} sqm`;
}

function AddProjectModal({
  open,
  onClose,
  onSave,
  saving,
  teamMembers = [],
  existingProjects = [],
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: NewProjectDraft) => Promise<void> | void;
  saving: boolean;
  teamMembers?: any[];
  existingProjects?: any[];
}) {
  const [draft, setDraft] = useState<NewProjectDraft>({
    title: "",
    location: "",
    cost: "",
    size: "",
    year: String(new Date().getFullYear()),
    propertyType: "",
    propertySubType: "",
    style: "",
    coverImage: "",
    gallery: [],
    worksIncluded: [],
    designerName: "",
    isFeatured: false,
    featuredImage: "",
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Detect floor plans among the cover + gallery so they can be excluded
  // from the featured photo picker.
  const pickerCandidates = useMemo(
    () => [draft.coverImage, ...draft.gallery.map((g) => g.src)].filter(Boolean) as string[],
    [draft.coverImage, draft.gallery]
  );
  const floorPlanSet = useFloorPlanSet(pickerCandidates);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setDraft({
        title: "", location: "", cost: "", size: "", year: String(new Date().getFullYear()),
        propertyType: "", propertySubType: "", style: "", coverImage: "", gallery: [], worksIncluded: [],
        designerName: "", isFeatured: false, featuredImage: "",
      });
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, saving]);

  if (!open || typeof document === "undefined") return null;

  const patch = (p: Partial<NewProjectDraft>) => setDraft((d) => ({ ...d, ...p }));

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingCover(true);
    try {
      const url = await uploadDesignerImage(file);
      patch({ coverImage: url });
      toast.success("Cover image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingCover(false);
    if (coverRef.current) coverRef.current.value = "";
  };

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: { src: string; caption: string }[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: over 5MB`); continue; }
        const url = await uploadDesignerImage(file);
        uploaded.push({ src: url, caption: "" });
      }
      if (uploaded.length) {
        setDraft((d) => ({ ...d, gallery: [...d.gallery, ...uploaded] }));
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingGallery(false);
    if (galleryRef.current) galleryRef.current.value = "";
  };

  const updateGalleryCaption = (i: number, caption: string) => {
    setDraft((d) => ({ ...d, gallery: d.gallery.map((g, j) => (j === i ? { ...g, caption } : g)) }));
  };
  const removeGalleryImage = (i: number) => {
    setDraft((d) => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }));
  };

  const toggleWork = (key: string) => {
    setDraft((d) => ({
      ...d,
      worksIncluded: d.worksIncluded.includes(key)
        ? d.worksIncluded.filter((k) => k !== key)
        : [...d.worksIncluded, key],
    }));
  };

  // Validation
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = "Project title is required";
  if (!draft.cost.trim()) errors.cost = "Renovation cost is required";
  if (!parseSizeDigits(draft.size)) errors.size = "Area size is required";
  if (!draft.year.trim()) errors.year = "Year is required";
  if (!draft.propertyType) errors.propertyType = "Select a property type";
  if (!draft.style.trim()) errors.style = "Interior style is required";
  if (!draft.coverImage) errors.coverImage = "Upload a cover image";
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    const adjusted = await applyFloorPlanDetection(draft);
    await onSave(adjusted);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: C.grayLight,
    fontFamily: sans,
    display: "block",
    marginBottom: "6px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 14px",
    background: C.white,
    border: `1px solid ${C.creamBorder}`,
    borderRadius: "10px",
    color: C.black,
    fontFamily: sans,
    fontSize: "14px",
    outline: "none",
  };
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    height: "auto",
    minHeight: "44px",
    padding: "10px 14px",
    resize: "vertical",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,13,0.55)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative w-full max-w-[720px] max-h-[92vh] overflow-hidden flex flex-col"
        style={{
          background: C.white,
          border: `1px solid ${C.creamBorder}`,
          borderRadius: "16px",
          boxShadow: "0 24px 60px rgba(15,15,13,0.25)",
          fontFamily: sans,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${C.creamBorder}`, background: C.cream }}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.grayLight }}>
              New Project
            </div>
            <h2 className="mt-0.5" style={{ fontFamily: serif, fontSize: "22px", color: C.black, lineHeight: 1.2 }}>
              Add a Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-40"
            style={{ background: C.white, border: `1px solid ${C.creamBorder}`, color: C.gray }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* Cover image */}
            <div>
              <label style={labelStyle}>Cover Image <span style={{ color: "#c14" }}>*</span></label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              <button
                type="button"
                onClick={() => !uploadingCover && coverRef.current?.click()}
                disabled={uploadingCover}
                className="relative w-full overflow-hidden cursor-pointer group/cover"
                style={{
                  aspectRatio: "16/9",
                  background: C.cream,
                  border: `2px dashed ${C.creamBorder}`,
                  borderRadius: "12px",
                }}
              >
                {draft.coverImage ? (
                  <>
                    <img src={draft.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/0 group-hover/cover:bg-black/30">
                      <Camera size={22} className="opacity-0 group-hover/cover:opacity-100 transition-opacity" style={{ color: C.white }} />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    {uploadingCover ? (
                      <Loader2 size={22} className="animate-spin" style={{ color: C.gray }} />
                    ) : (
                      <>
                        <Camera size={22} style={{ color: C.grayLight }} />
                        <span className="text-[12px]" style={{ color: C.gray }}>Click to upload cover (16:9)</span>
                      </>
                    )}
                  </div>
                )}
              </button>
              {errors.coverImage && <p className="mt-1.5 text-[11px]" style={{ color: "#c14" }}>{errors.coverImage}</p>}
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Project Title <span style={{ color: "#c14" }}>*</span></label>
              <input
                type="text"
                value={draft.title}
                placeholder="e.g. The Aldrich Residence"
                onChange={(e) => patch({ title: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
              />
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                value={draft.location}
                placeholder="e.g. Orchard Road, Singapore"
                onChange={(e) => patch({ location: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
              />
            </div>

            {/* Cost + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Renovation Cost <span style={{ color: "#c14" }}>*</span></label>
                <input
                  type="text"
                  value={draft.cost}
                  placeholder="e.g. $120,000"
                  onChange={(e) => patch({ cost: formatCost(e.target.value) })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Area Size <span style={{ color: "#c14" }}>*</span></label>
                <div className="flex gap-0">
                  <input
                    type="text"
                    value={formatSizeNumber(draft.size)}
                    placeholder="e.g. 110"
                    onChange={(e) => {
                      const num = formatSizeNumber(e.target.value);
                      patch({ size: buildSizeString(num) });
                    }}
                    style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: "none", flex: 1 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                  />
                  <div
                    style={{
                      ...inputStyle,
                      width: "80px",
                      flex: "none",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      background: C.cream,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.black,
                    }}
                  >
                    sqm
                  </div>
                </div>
              </div>
            </div>

            {/* Property type + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Property Type <span style={{ color: "#c14" }}>*</span></label>
                <select
                  value={draft.propertyType}
                  onChange={(e) => patch({ propertyType: e.target.value })}
                  style={{ ...inputStyle, appearance: "none", paddingRight: "36px", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9790' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                >
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year of Completion <span style={{ color: "#c14" }}>*</span></label>
                <input
                  type="number"
                  value={draft.year}
                  placeholder="e.g. 2024"
                  min={1990}
                  max={2100}
                  onChange={(e) => patch({ year: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
              </div>
            </div>

            {/* Sub-type + Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Property Sub-type</label>
                <input
                  type="text"
                  value={draft.propertySubType}
                  placeholder="e.g. Resale, BTO, 5-Room"
                  onChange={(e) => patch({ propertySubType: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Interior Style <span style={{ color: "#c14" }}>*</span></label>
                <input
                  type="text"
                  value={draft.style}
                  placeholder="e.g. Modern Luxe"
                  onChange={(e) => patch({ style: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
              </div>
            </div>

            {/* Designer name */}
            <div>
              <label style={labelStyle}>Designer Name</label>
              <select value={draft.designerName} onChange={(e) => patch({ designerName: e.target.value })} style={{ ...inputStyle, appearance: "none", paddingRight: "36px", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9790' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}>
                <option value="">Select designer…</option>
                {teamMembers.filter((m: any) => m.type !== "project").map((m: any, i: number) => <option key={i} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* Works included */}
            <div>
              <label style={labelStyle}>Works Included</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AVAILABLE_WORKS.map(({ key, icon: Icon, label }) => {
                  const active = draft.worksIncluded.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleWork(key)}
                      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        background: active ? C.black : C.white,
                        color: active ? C.white : C.black,
                        border: `1px solid ${active ? C.black : C.creamBorder}`,
                        borderRadius: "10px",
                        fontFamily: sans,
                      }}
                    >
                      <Icon size={14} strokeWidth={1.6} />
                      <span className="text-[12px]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label style={labelStyle}>Gallery Images</label>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFile} />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {draft.gallery.map((img, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "1/1",
                      background: C.cream,
                      border: `1px solid ${C.creamBorder}`,
                      borderRadius: "10px",
                    }}
                  >
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer"
                      style={{ background: "rgba(15,15,13,0.7)", color: C.white }}
                      aria-label="Remove image"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => !uploadingGallery && galleryRef.current?.click()}
                  disabled={uploadingGallery}
                  className="flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:opacity-80"
                  style={{
                    aspectRatio: "1/1",
                    background: C.cream,
                    border: `2px dashed ${C.creamBorder}`,
                    borderRadius: "10px",
                  }}
                >
                  {uploadingGallery ? (
                    <Loader2 size={18} className="animate-spin" style={{ color: C.gray }} />
                  ) : (
                    <>
                      <Plus size={18} style={{ color: C.gray }} />
                      <span className="text-[10px]" style={{ color: C.gray }}>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Featured Project Toggle ── */}
          <div className="px-6 pb-2">
            {(() => {
              const FEATURED_MAX = 5;
              const featuredOthers = existingProjects.filter((p: any) => p.isFeatured).length;
              const remaining = Math.max(0, FEATURED_MAX - featuredOthers - (draft.isFeatured ? 1 : 0));
              const atCap = !draft.isFeatured && featuredOthers >= FEATURED_MAX;
              return (
                <div className="relative">
                  <div
                    className="flex items-center justify-between px-4 py-3.5"
                    style={{ background: draft.isFeatured ? "#fef9e7" : C.cream, border: `1px solid ${draft.isFeatured ? "#f59e0b" : C.creamBorder}`, borderRadius: "12px", transition: "all 0.2s", opacity: atCap ? 0.6 : 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill={draft.isFeatured ? "#f59e0b" : "none"} stroke={draft.isFeatured ? "#f59e0b" : C.grayLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.black, fontFamily: sans }}>Set as Featured Project</p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.gray, fontFamily: sans }}>
                          Up to 5 featured projects rotate in your hero carousel ({featuredOthers + (draft.isFeatured ? 1 : 0)}/{FEATURED_MAX} used)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={atCap}
                      onClick={() => {
                        if (atCap) return;
                        const next = !draft.isFeatured;
                        patch({
                          isFeatured: next,
                          featuredImage: next && !draft.featuredImage ? draft.coverImage : draft.featuredImage,
                        });
                      }}
                      className="relative w-[44px] h-[24px] rounded-full transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
                      style={{ background: draft.isFeatured ? "#f59e0b" : "#d1d5db", border: "none" }}
                    >
                      <div
                        className="absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform"
                        style={{ left: draft.isFeatured ? "22px" : "2px" }}
                      />
                    </button>
                  </div>
                  {atCap && (
                    <p className="mt-2 text-[11px] px-1" style={{ color: "#d97706", fontFamily: sans }}>
                      You've reached the {FEATURED_MAX}-project limit. Unfeature another project first.
                    </p>
                  )}

                  {/* Featured photo picker — appears when toggle is on */}
                  {draft.isFeatured && (() => {
                    const choices: { src: string; label: string }[] = [];
                    const seen = new Set<string>();
                    if (draft.coverImage && !seen.has(draft.coverImage) && !floorPlanSet.has(draft.coverImage)) { choices.push({ src: draft.coverImage, label: "Cover" }); seen.add(draft.coverImage); }
                    draft.gallery.forEach((g, i) => { if (g.src && !seen.has(g.src) && !floorPlanSet.has(g.src)) { choices.push({ src: g.src, label: `Gallery ${i + 1}` }); seen.add(g.src); } });
                    if (choices.length === 0) return null;
                    const selected = draft.featuredImage || draft.coverImage;
                    return (
                      <div className="mt-3 px-1">
                        <p className="text-[11px] font-semibold mb-2" style={{ color: C.black, fontFamily: sans, letterSpacing: "0.04em" }}>
                          Choose featured hero photo
                        </p>
                        <p className="text-[11px] mb-2.5" style={{ color: C.gray, fontFamily: sans }}>
                          This photo will appear in your profile hero carousel.
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {choices.map((c) => {
                            const isSel = c.src === selected;
                            return (
                              <button
                                key={c.src}
                                type="button"
                                onClick={() => patch({ featuredImage: c.src })}
                                className="relative overflow-hidden cursor-pointer hover:opacity-90"
                                style={{
                                  aspectRatio: "1/1",
                                  borderRadius: "10px",
                                  border: isSel ? "2px solid #f59e0b" : `1px solid ${C.creamBorder}`,
                                  outline: isSel ? "2px solid rgba(245,158,11,0.25)" : "none",
                                  outlineOffset: "1px",
                                  background: C.cream,
                                }}
                                aria-label={`Select ${c.label} as featured photo`}
                              >
                                <img src={c.src} alt={c.label} className="w-full h-full object-cover" />
                                {isSel && (
                                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#f59e0b", color: C.white }}>
                                    <Check size={11} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          {/* Footer — sticky */}
          <div
            className="sticky bottom-0 px-6 py-4 flex items-center justify-between gap-3"
            style={{ background: C.white, borderTop: `1px solid ${C.creamBorder}` }}
          >
            <p className="text-[11px]" style={{ color: C.grayLight }}>
              Fields marked <span style={{ color: "#c14" }}>*</span> are required
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-10 px-4 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40"
                style={{ background: C.white, color: C.black, border: `1px solid ${C.creamBorder}`, borderRadius: "10px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || saving}
                className="h-10 px-5 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 flex items-center gap-2"
                style={{ background: C.black, color: C.white, border: `1px solid ${C.black}`, borderRadius: "10px" }}
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Project</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── EDIT PROJECT MODAL ─────────────────────────────────────────
function EditProjectModal({
  project,
  onClose,
  onSave,
  saving,
  teamMembers = [],
  existingProjects = [],
}: {
  project: any;
  onClose: () => void;
  onSave: (draft: NewProjectDraft) => Promise<void> | void;
  saving: boolean;
  teamMembers?: any[];
  existingProjects?: any[];
}) {
  const [draft, setDraft] = useState<NewProjectDraft>({
    title: project.title || project.name || "",
    location: project.location || "",
    cost: project.cost || "",
    size: project.size || "",
    year: project.year || String(new Date().getFullYear()),
    propertyType: project.propertyType || "",
    propertySubType: project.propertySubType || "",
    style: project.style || "",
    coverImage: project.coverImage || project.image || "",
    gallery: project.gallery || [],
    worksIncluded: project.worksIncluded || [],
    designerName: project.designerName || "",
    isFeatured: project.isFeatured || false,
    featuredImage: project.featuredImage || project.coverImage || project.image || "",
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Detect floor plans so they can be hidden from the featured photo picker.
  const pickerCandidates = useMemo(
    () => [draft.coverImage, ...draft.gallery.map((g) => g.src)].filter(Boolean) as string[],
    [draft.coverImage, draft.gallery]
  );
  const floorPlanSet = useFloorPlanSet(pickerCandidates);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, saving]);

  const patch = (p: Partial<NewProjectDraft>) => setDraft((d) => ({ ...d, ...p }));

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploadingCover(true);
    try {
      const url = await uploadDesignerImage(file);
      patch({ coverImage: url });
      toast.success("Cover image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingCover(false);
    if (coverRef.current) coverRef.current.value = "";
  };

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: { src: string; caption: string }[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name}: not an image`); continue; }
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: over 5MB`); continue; }
        const url = await uploadDesignerImage(file);
        uploaded.push({ src: url, caption: "" });
      }
      if (uploaded.length) {
        setDraft((d) => ({ ...d, gallery: [...d.gallery, ...uploaded] }));
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingGallery(false);
    if (galleryRef.current) galleryRef.current.value = "";
  };

  const updateGalleryCaption = (i: number, caption: string) => {
    setDraft((d) => ({ ...d, gallery: d.gallery.map((g, j) => (j === i ? { ...g, caption } : g)) }));
  };
  const removeGalleryImage = (i: number) => {
    setDraft((d) => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }));
  };

  const toggleWork = (key: string) => {
    setDraft((d) => ({
      ...d,
      worksIncluded: d.worksIncluded.includes(key)
        ? d.worksIncluded.filter((k) => k !== key)
        : [...d.worksIncluded, key],
    }));
  };

  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = "Project title is required";
  if (!draft.cost.trim()) errors.cost = "Renovation cost is required";
  if (!parseSizeDigits(draft.size)) errors.size = "Area size is required";
  if (!draft.year.trim()) errors.year = "Year is required";
  if (!draft.propertyType) errors.propertyType = "Select a property type";
  if (!draft.style.trim()) errors.style = "Interior style is required";
  if (!draft.coverImage) errors.coverImage = "Upload a cover image";
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    const adjusted = await applyFloorPlanDetection(draft);
    await onSave(adjusted);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
    color: C.grayLight, fontFamily: sans, display: "block", marginBottom: "6px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", height: "44px", padding: "0 14px", background: C.white,
    border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans, fontSize: "14px", outline: "none",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,13,0.55)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative w-full max-w-[720px] max-h-[92vh] overflow-hidden flex flex-col"
        style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "16px", boxShadow: "0 24px 60px rgba(15,15,13,0.25)", fontFamily: sans }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.creamBorder}`, background: C.cream }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.grayLight }}>Edit Project</div>
            <h2 className="mt-0.5" style={{ fontFamily: serif, fontSize: "22px", color: C.black, lineHeight: 1.2 }}>{draft.title || "Untitled"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer disabled:opacity-40" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, color: C.gray }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* Cover image */}
            <div>
              <label style={labelStyle}>Cover Image <span style={{ color: "#c14" }}>*</span></label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              <button type="button" onClick={() => !uploadingCover && coverRef.current?.click()} disabled={uploadingCover} className="relative w-full overflow-hidden cursor-pointer group/cover" style={{ aspectRatio: "16/9", background: C.cream, border: `2px dashed ${C.creamBorder}`, borderRadius: "12px" }}>
                {draft.coverImage ? (
                  <>
                    <img src={draft.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/0 group-hover/cover:bg-black/30">
                      <Camera size={22} className="opacity-0 group-hover/cover:opacity-100 transition-opacity" style={{ color: C.white }} />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    {uploadingCover ? <Loader2 size={22} className="animate-spin" style={{ color: C.gray }} /> : (
                      <><Camera size={22} style={{ color: C.grayLight }} /><span className="text-[12px]" style={{ color: C.gray }}>Click to upload cover (16:9)</span></>
                    )}
                  </div>
                )}
              </button>
              {errors.coverImage && <p className="mt-1.5 text-[11px]" style={{ color: "#c14" }}>{errors.coverImage}</p>}
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Project Title <span style={{ color: "#c14" }}>*</span></label>
              <input type="text" value={draft.title} placeholder="e.g. The Aldrich Residence" onChange={(e) => patch({ title: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" value={draft.location} placeholder="e.g. Orchard Road, Singapore" onChange={(e) => patch({ location: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
            </div>

            {/* Cost + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Renovation Cost <span style={{ color: "#c14" }}>*</span></label>
                <input type="text" value={draft.cost} placeholder="e.g. $120,000" onChange={(e) => patch({ cost: formatCost(e.target.value) })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
              </div>
              <div>
                <label style={labelStyle}>Area Size <span style={{ color: "#c14" }}>*</span></label>
                <div className="flex gap-0">
                  <input type="text" value={formatSizeNumber(draft.size)} placeholder="e.g. 110" onChange={(e) => { const num = formatSizeNumber(e.target.value); patch({ size: buildSizeString(num) }); }} style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: "none", flex: 1 }} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
                  <div style={{ ...inputStyle, width: "80px", flex: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", color: C.black }}>sqm</div>
                </div>
              </div>
            </div>

            {/* Property type + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Property Type <span style={{ color: "#c14" }}>*</span></label>
                <select value={draft.propertyType} onChange={(e) => patch({ propertyType: e.target.value })} style={{ ...inputStyle, appearance: "none", paddingRight: "36px", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9790' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}>
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year of Completion <span style={{ color: "#c14" }}>*</span></label>
                <input type="number" value={draft.year} placeholder="e.g. 2024" min={1990} max={2100} onChange={(e) => patch({ year: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
              </div>
            </div>

            {/* Sub-type + Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Property Sub-type</label>
                <input type="text" value={draft.propertySubType} placeholder="e.g. Resale, BTO, 5-Room" onChange={(e) => patch({ propertySubType: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
              </div>
              <div>
                <label style={labelStyle}>Interior Style <span style={{ color: "#c14" }}>*</span></label>
                <input type="text" value={draft.style} placeholder="e.g. Modern Luxe" onChange={(e) => patch({ style: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
              </div>
            </div>

            {/* Designer name */}
            <div>
              <label style={labelStyle}>Designer Name</label>
              <select value={draft.designerName} onChange={(e) => patch({ designerName: e.target.value })} style={{ ...inputStyle, appearance: "none", paddingRight: "36px", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9790' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}>
                <option value="">Select designer…</option>
                {teamMembers.filter((m: any) => m.type !== "project").map((m: any, i: number) => <option key={i} value={m.name}>{m.name}</option>)}
              </select>
            </div>

            {/* Works included */}
            <div>
              <label style={labelStyle}>Works Included</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {AVAILABLE_WORKS.map(({ key, icon: Icon, label }) => {
                  const active = draft.worksIncluded.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleWork(key)} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors" style={{ background: active ? C.black : C.white, color: active ? C.white : C.black, border: `1px solid ${active ? C.black : C.creamBorder}`, borderRadius: "10px", fontFamily: sans }}>
                      <Icon size={14} strokeWidth={1.6} /><span className="text-[12px]">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label style={labelStyle}>Gallery Images</label>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFile} />
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {draft.gallery.map((img, i) => (
                  <div key={i} className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: C.cream, border: `1px solid ${C.creamBorder}`, borderRadius: "10px" }}>
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer" style={{ background: "rgba(15,15,13,0.7)", color: C.white }} aria-label="Remove image"><X size={11} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => !uploadingGallery && galleryRef.current?.click()} disabled={uploadingGallery} className="flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:opacity-80" style={{ aspectRatio: "1/1", background: C.cream, border: `2px dashed ${C.creamBorder}`, borderRadius: "10px" }}>
                  {uploadingGallery ? <Loader2 size={18} className="animate-spin" style={{ color: C.gray }} /> : (<><Plus size={18} style={{ color: C.gray }} /><span className="text-[10px]" style={{ color: C.gray }}>Add</span></>)}
                </button>
              </div>
            </div>
          </div>

          {/* ── Featured Project Toggle ── */}
          <div className="px-6 pb-2">
            {(() => {
              const FEATURED_MAX = 5;
              const featuredOthers = existingProjects.filter((p: any) => p.isFeatured && p.id !== project.id && p.name !== project.name).length;
              const atCap = !draft.isFeatured && featuredOthers >= FEATURED_MAX;
              return (
                <div className="relative">
                  <div
                    className="flex items-center justify-between px-4 py-3.5"
                    style={{ background: draft.isFeatured ? "#fef9e7" : C.cream, border: `1px solid ${draft.isFeatured ? "#f59e0b" : C.creamBorder}`, borderRadius: "12px", transition: "all 0.2s", opacity: atCap ? 0.6 : 1 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill={draft.isFeatured ? "#f59e0b" : "none"} stroke={draft.isFeatured ? "#f59e0b" : C.grayLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.black, fontFamily: sans }}>Set as Featured Project</p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.gray, fontFamily: sans }}>
                          Up to 5 featured projects rotate in your hero carousel ({featuredOthers + (draft.isFeatured ? 1 : 0)}/{FEATURED_MAX} used)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={atCap}
                      onClick={() => {
                        if (atCap) return;
                        const next = !draft.isFeatured;
                        patch({
                          isFeatured: next,
                          featuredImage: next && !draft.featuredImage ? draft.coverImage : draft.featuredImage,
                        });
                      }}
                      className="relative w-[44px] h-[24px] rounded-full transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
                      style={{ background: draft.isFeatured ? "#f59e0b" : "#d1d5db", border: "none" }}
                    >
                      <div
                        className="absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform"
                        style={{ left: draft.isFeatured ? "22px" : "2px" }}
                      />
                    </button>
                  </div>
                  {atCap && (
                    <p className="mt-2 text-[11px] px-1" style={{ color: "#d97706", fontFamily: sans }}>
                      You've reached the {FEATURED_MAX}-project limit. Unfeature another project first.
                    </p>
                  )}

                  {/* Featured photo picker — appears when toggle is on */}
                  {draft.isFeatured && (() => {
                    const choices: { src: string; label: string }[] = [];
                    const seen = new Set<string>();
                    if (draft.coverImage && !seen.has(draft.coverImage) && !floorPlanSet.has(draft.coverImage)) { choices.push({ src: draft.coverImage, label: "Cover" }); seen.add(draft.coverImage); }
                    draft.gallery.forEach((g, i) => { if (g.src && !seen.has(g.src) && !floorPlanSet.has(g.src)) { choices.push({ src: g.src, label: `Gallery ${i + 1}` }); seen.add(g.src); } });
                    if (choices.length === 0) return null;
                    const selected = draft.featuredImage || draft.coverImage;
                    return (
                      <div className="mt-3 px-1">
                        <p className="text-[11px] font-semibold mb-2" style={{ color: C.black, fontFamily: sans, letterSpacing: "0.04em" }}>
                          Choose featured hero photo
                        </p>
                        <p className="text-[11px] mb-2.5" style={{ color: C.gray, fontFamily: sans }}>
                          This photo will appear in your profile hero banner.
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {choices.map((c) => {
                            const isSel = c.src === selected;
                            return (
                              <button
                                key={c.src}
                                type="button"
                                onClick={() => patch({ featuredImage: c.src })}
                                className="relative overflow-hidden cursor-pointer hover:opacity-90"
                                style={{
                                  aspectRatio: "1/1",
                                  borderRadius: "10px",
                                  border: isSel ? "2px solid #f59e0b" : `1px solid ${C.creamBorder}`,
                                  outline: isSel ? "2px solid rgba(245,158,11,0.25)" : "none",
                                  outlineOffset: "1px",
                                  background: C.cream,
                                }}
                                aria-label={`Select ${c.label} as featured photo`}
                              >
                                <img src={c.src} alt={c.label} className="w-full h-full object-cover" />
                                {isSel && (
                                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#f59e0b", color: C.white }}>
                                    <Check size={11} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 flex items-center justify-between gap-3" style={{ background: C.white, borderTop: `1px solid ${C.creamBorder}` }}>
            <p className="text-[11px]" style={{ color: C.grayLight }}>Fields marked <span style={{ color: "#c14" }}>*</span> are required</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} disabled={saving} className="h-10 px-4 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40" style={{ background: C.white, color: C.black, border: `1px solid ${C.creamBorder}`, borderRadius: "10px" }}>Cancel</button>
              <button type="submit" disabled={!isValid || saving} className="h-10 px-5 text-[13px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 flex items-center gap-2" style={{ background: C.black, color: C.white, border: `1px solid ${C.black}`, borderRadius: "10px" }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Update Project</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── INLINE PROJECTS ─────────────────────────────────────────────
function InlineProjects() {
  const { rawData, saveSection } = useEditor();
  const projects: any[] = rawData?.projects || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const updateProject = (i: number, patch: any) => {
    const next = projects.map((p, j) => (j === i ? { ...p, ...patch } : p));
    saveSection("projects", next);
  };
  const removeProject = (i: number) => {
    const name = projects[i]?.name || "this project";
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    saveSection("projects", projects.filter((_, j) => j !== i));
  };

  const handleEditProject = async (draft: NewProjectDraft) => {
    if (editIndex === null) return;
    setSavingEdit(true);
    try {
      const propertyTypeCombined = draft.propertySubType
        ? `${draft.propertyType}, ${draft.propertySubType}`
        : draft.propertyType;
      const updated = {
        ...projects[editIndex],
        id: slugifyTitle(draft.title) || projects[editIndex].id || `project-${Date.now()}`,
        name: draft.title,
        meta: `${propertyTypeCombined} · ${draft.cost} · ${draft.year}`,
        image: draft.coverImage,
        title: draft.title,
        location: draft.location,
        cost: draft.cost,
        size: draft.size,
        year: draft.year,
        propertyType: draft.propertyType,
        propertySubType: draft.propertySubType,
        propertyTypeDisplay: propertyTypeCombined,
        style: draft.style,
        coverImage: draft.coverImage,
        gallery: draft.gallery,
        worksIncluded: draft.worksIncluded,
        designerName: draft.designerName,
        isFeatured: draft.isFeatured,
        featuredImage: draft.isFeatured ? (draft.featuredImage || draft.coverImage) : "",
        floorPlan: draft.floorPlan || "",
      };
      const next = projects.map((p, j) => (j === editIndex ? updated : p));
      const ok = await saveSection("projects", next);
      if (ok) {
        if (draft.isFeatured) {
          await saveSection("profile", {
            coverProject: { name: draft.title, cost: draft.cost, area: draft.size, year: draft.year, style: draft.style },
            images: { ...(rawData?.images || {}), cover: draft.featuredImage || draft.coverImage },
          });
        }
        toast.success("Project updated");
        setEditIndex(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveNewProject = async (draft: NewProjectDraft) => {
    setSavingNew(true);
    try {
      const propertyTypeCombined = draft.propertySubType
        ? `${draft.propertyType}, ${draft.propertySubType}`
        : draft.propertyType;

      const newProject = {
        id: slugifyTitle(draft.title) || `project-${Date.now()}`,
        name: draft.title,
        meta: `${propertyTypeCombined} · ${draft.cost} · ${draft.year}`,
        image: draft.coverImage,
        title: draft.title,
        location: draft.location,
        cost: draft.cost,
        size: draft.size,
        year: draft.year,
        propertyType: draft.propertyType,
        propertySubType: draft.propertySubType,
        propertyTypeDisplay: propertyTypeCombined,
        style: draft.style,
        coverImage: draft.coverImage,
        gallery: draft.gallery,
        worksIncluded: draft.worksIncluded,
        designerName: draft.designerName,
        isFeatured: draft.isFeatured,
        featuredImage: draft.isFeatured ? (draft.featuredImage || draft.coverImage) : "",
        floorPlan: draft.floorPlan || "",
      };

      const ok = await saveSection("projects", [...projects, newProject]);
      if (ok) {
        if (draft.isFeatured) {
          await saveSection("profile", {
            coverProject: { name: draft.title, cost: draft.cost, area: draft.size, year: draft.year, style: draft.style },
            images: { ...(rawData?.images || {}), cover: draft.featuredImage || draft.coverImage },
          });
        }
        toast.success("Project added");
        setModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project");
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <section className="py-[80px] md:py-[100px]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>Recent projects</TagLabel>
          <h2
            className="mt-3 mb-8"
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.2vw, 42px)",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Recent completed renovations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {projects.map((p, i) => (
              <div
                key={i}
                className="overflow-hidden group/proj relative"
                style={{
                  background: C.white,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "12px",
                }}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => setEditIndex(i)}
                >
                <div className="relative aspect-[4/5] overflow-hidden group/img">
                  {p.image ? (
                    <img src={resolveImg(p.image)} alt={p.name || "Project"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: C.cream, border: `2px dashed ${C.creamBorder}` }}>
                      <Camera size={32} style={{ color: C.grayLight }} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/img:bg-black/30 transition-colors">
                    <Pencil size={20} className="opacity-0 group-hover/img:opacity-100 transition-opacity" style={{ color: C.white }} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 style={{ fontFamily: serif, fontSize: "20px", color: C.black, fontWeight: 400, lineHeight: 1.2 }}>
                    {p.name || "Untitled Project"}
                  </h3>
                  <p className="mt-2 text-[13px]" style={{ color: C.gray, fontFamily: sans }}>
                    {p.meta || "Click to edit"}
                  </p>
                </div>
              </div>
                <button
                  onClick={() => removeProject(i)}
                  className="absolute top-3 right-3 z-[3] size-7 rounded-full flex items-center justify-center opacity-0 group-hover/proj:opacity-100 transition-opacity cursor-pointer"
                  style={{ background: C.white, border: `1px solid ${C.creamBorder}`, color: C.gray, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                  title="Remove project"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {/* Add project tile */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[400px] hover:opacity-80 transition-opacity"
              style={{
                background: C.cream,
                border: `2px dashed ${C.creamBorder}`,
                borderRadius: "12px",
              }}
            >
              <Plus size={32} style={{ color: C.gray }} />
              <span className="text-[13px]" style={{ color: C.gray, fontFamily: sans }}>Add Project</span>
            </button>
          </div>
        </FadeIn>
      </div>

      <AddProjectModal
        open={modalOpen}
        onClose={() => { if (!savingNew) setModalOpen(false); }}
        onSave={handleSaveNewProject}
        saving={savingNew}
        teamMembers={rawData?.team || []}
        existingProjects={projects}
      />

      {editIndex !== null && (
        <EditProjectModal
          project={projects[editIndex]}
          onClose={() => { if (!savingEdit) setEditIndex(null); }}
          onSave={handleEditProject}
          saving={savingEdit}
          teamMembers={rawData?.team || []}
          existingProjects={projects}
        />
      )}
    </section>
  );
}

// ─── INLINE TRUST CREDENTIALS / BUSINESS INFO ────────────────────
function InlineTrustCredentials() {
  const { rawData, saveSection } = useEditor();
  const items: any[] = rawData?.businessInfo || [];

  const updateItem = (i: number, patch: any) => {
    const next = items.map((it, j) => (j === i ? { ...it, ...patch } : it));
    saveSection("businessinfo", next);
  };
  const removeItem = (i: number) => saveSection("businessinfo", items.filter((_, j) => j !== i));
  const addItem = () => saveSection("businessinfo", [...items, { label: "New Field", value: "" }]);

  return (
    <section
      className="py-[80px] md:py-[100px]"
      style={{ background: C.creamDark, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-10">
            <TagLabel>Trust & credentials</TagLabel>
            <h2
              className="mt-3"
              style={{
                fontFamily: serif,
                fontSize: "clamp(28px, 3.2vw, 42px)",
                color: C.black,
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              Business Information
            </h2>
          </div>

          <div
            className="overflow-hidden mx-auto"
            style={{
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "12px",
              maxWidth: "760px",
            }}
          >
            {items.map((info, i) => (
              <div
                key={i}
                className="group/biz flex gap-5 px-6 py-4"
                style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.creamBorder}` : undefined }}
              >
                <div className="w-[160px] md:w-[180px] shrink-0">
                  <TagLabel>
                    <InlineEdit
                      value={info.label || ""}
                      placeholder="Label"
                      onSave={(v) => updateItem(i, { label: v })}
                      inputClassName="w-[160px]"
                    />
                  </TagLabel>
                </div>
                <div className="flex-1 text-[15px]" style={{ color: C.black, fontFamily: sans }}>
                  <InlineEdit
                    value={info.value || ""}
                    placeholder="Value"
                    onSave={(v) => updateItem(i, { value: v })}
                    inputClassName="w-full"
                  />
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="opacity-0 group-hover/biz:opacity-100 transition-opacity cursor-pointer self-center hover:opacity-100"
                  style={{ color: C.gray }}
                  title="Remove row"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="w-full px-6 py-4 text-[13px] flex items-center justify-center gap-2 transition-opacity cursor-pointer hover:opacity-70"
              style={{
                color: C.gray,
                borderTop: `1px solid ${C.creamBorder}`,
                fontFamily: sans,
              }}
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── INLINE CASE STUDIES ─────────────────────────────────────────
function InlineCaseStudies() {
  const { rawData, saveSection } = useEditor();
  const phases: any[] = rawData?.caseStudies || [];

  const updatePhase = (i: number, patch: any) => {
    const next = phases.map((p, j) => (j === i ? { ...p, ...patch } : p));
    saveSection("casestudies", next);
  };
  const removePhase = (i: number) => saveSection("casestudies", phases.filter((_, j) => j !== i));
  const addPhase = () => saveSection("casestudies", [...phases, { phase: `Phase ${phases.length + 1}`, title: "New Phase", desc: "Description", image: "", tags: [] }]);

  return (
    <section className="py-[80px] md:py-[100px] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>Case study</TagLabel>
          <h2
            className="mt-3 max-w-[760px]"
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            From blueprint to completion
          </h2>
          <p className="mt-4 max-w-[680px] text-[16px] leading-[1.65]" style={{ color: C.gray, fontFamily: sans }}>
            A structured overview of how this residence progressed from concept planning to final handover.
          </p>
        </FadeIn>

        <div className="mt-14 relative flex flex-col gap-10 lg:gap-14">
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[11px] bottom-[11px] w-px pointer-events-none" style={{ background: C.creamBorder }} />

          {phases.map((phase, i) => (
            <div key={i} className="flex flex-col lg:flex-row items-start lg:items-stretch relative group/phase">
              {/* Image */}
              <div className="w-full lg:w-[40%] shrink-0">
                <div
                  className="overflow-hidden h-[220px] md:h-[335px]"
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${C.creamBorder}`,
                  }}
                >
                  <InlineImageUpload
                    src={phase.image ? resolveImg(phase.image) : ""}
                    alt={phase.title || "Phase"}
                    onUploaded={(url) => updatePhase(i, { image: url })}
                    className="w-full h-full"
                    rounded="rounded-none"
                    iconSize={32}
                  />
                </div>
              </div>

              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-2 z-10 pointer-events-none">
                <div className="size-[14px] rounded-full" style={{ background: C.white, border: `2px solid ${C.creamBorder}` }} />
              </div>

              <div className="w-full lg:flex-1 mt-4 lg:mt-0">
                <div
                  className="h-full p-7 flex flex-col justify-center max-w-[495px] ml-auto relative"
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: "12px",
                  }}
                >
                  <button
                    onClick={() => removePhase(i)}
                    className="absolute top-3 right-3 opacity-0 group-hover/phase:opacity-100 transition-opacity cursor-pointer hover:opacity-80"
                    style={{ color: C.gray }}
                    title="Remove phase"
                  >
                    <Trash2 size={14} />
                  </button>
                  <TagLabel>
                    <InlineEdit
                      value={phase.phase || ""}
                      placeholder="PHASE 1"
                      onSave={(v) => updatePhase(i, { phase: v })}
                      inputClassName="w-[140px] uppercase"
                    />
                  </TagLabel>
                  <h3
                    className="mt-3"
                    style={{
                      fontFamily: serif,
                      fontSize: "26px",
                      color: C.black,
                      fontWeight: 400,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <InlineEdit
                      value={phase.title || ""}
                      placeholder="Phase title"
                      onSave={(v) => updatePhase(i, { title: v })}
                      inputClassName="w-full"
                    />
                  </h3>
                  <div className="mt-3 text-[15px] leading-[1.65] max-w-[405px]" style={{ color: C.gray, fontFamily: sans }}>
                    <InlineEdit
                      value={phase.desc || ""}
                      placeholder="Describe what happened in this phase."
                      onSave={(v) => updatePhase(i, { desc: v })}
                      className="w-full"
                      inputClassName="w-full"
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addPhase}
            className="py-8 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: C.cream,
              border: `2px dashed ${C.creamBorder}`,
              borderRadius: "12px",
            }}
          >
            <Plus size={20} style={{ color: C.gray }} />
            <span className="text-[14px]" style={{ color: C.gray, fontFamily: sans }}>Add Phase</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── INLINE LATEST REVIEWS (HomeownersSay) ───────────────────────
function InlineLatestReviews() {
  const { rawData, saveSection } = useEditor();
  const reviews: any[] = rawData?.latestReviews || [];
  const rating = rawData?.stats?.rating || "0";

  const updateReview = (i: number, patch: any) => {
    const next = reviews.map((r, j) => (j === i ? { ...r, ...patch } : r));
    saveSection("latestreviews", next);
  };
  const removeReview = (i: number) => saveSection("latestreviews", reviews.filter((_, j) => j !== i));
  const addReview = () => saveSection("latestreviews", [...reviews, { name: "New Customer", initial: "N", time: "Just now", text: "Add the review text here." }]);

  return (
    <section className="py-[80px] md:py-[100px]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <div className="flex flex-col items-center text-center max-w-[760px] mx-auto">
            <TagLabel>Reviews</TagLabel>
            <h2
              className="mt-3"
              style={{
                fontFamily: serif,
                fontSize: "clamp(32px, 3.6vw, 48px)",
                color: C.black,
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              What homeowners say
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="size-[16px]" viewBox="0 0 14 14" fill={C.black}><path d="M7 0.5L8.91 5.09L14 5.64L10.18 9.09L11.18 14L7 11.59L2.82 14L3.82 9.09L0 5.64L5.09 5.09L7 0.5Z" /></svg>
                ))}
              </div>
              <span className="text-[14px]" style={{ color: C.gray, fontFamily: sans }}>{rating}/5 average rating</span>
            </div>
          </div>
        </FadeIn>

        <div className="mt-12 max-w-[760px] mx-auto">
          <FadeIn>
            <h3 className="mb-5" style={{ fontFamily: serif, fontSize: "24px", color: C.black, fontWeight: 400 }}>
              Latest reviews
            </h3>
          </FadeIn>
          <div className="flex flex-col gap-4">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="p-6 group/rev relative"
                style={{
                  background: C.white,
                  border: `1px solid ${C.creamBorder}`,
                  borderRadius: "12px",
                }}
              >
                <button
                  onClick={() => removeReview(i)}
                  className="absolute top-3 right-3 opacity-0 group-hover/rev:opacity-100 transition-opacity cursor-pointer hover:opacity-80"
                  style={{ color: C.gray }}
                  title="Remove review"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="rounded-full size-[40px] flex items-center justify-center shrink-0"
                    style={{ background: C.cream }}
                  >
                    <span className="text-[14px]" style={{ fontFamily: serif, color: C.black, fontWeight: 400 }}>
                      <InlineEdit
                        value={r.initial || ""}
                        placeholder="A"
                        onSave={(v) => updateReview(i, { initial: v.slice(0, 1).toUpperCase() })}
                        inputClassName="w-[24px] text-center"
                      />
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px]" style={{ color: C.black, fontFamily: sans, fontWeight: 600 }}>
                      <InlineEdit
                        value={r.name || ""}
                        placeholder="Customer name"
                        onSave={(v) => updateReview(i, { name: v })}
                        inputClassName="w-[200px]"
                      />
                    </p>
                    <p className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
                      <InlineEdit
                        value={r.time || ""}
                        placeholder="2 months ago"
                        onSave={(v) => updateReview(i, { time: v })}
                        inputClassName="w-[140px]"
                      />
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} className="size-[12px]" viewBox="0 0 14 14" fill={C.black}><path d="M7 0.5L8.91 5.09L14 5.64L10.18 9.09L11.18 14L7 11.59L2.82 14L3.82 9.09L0 5.64L5.09 5.09L7 0.5Z" /></svg>
                  ))}
                </div>
                <div className="text-[15px] leading-[1.65]" style={{ color: C.gray, fontFamily: sans }}>
                  <InlineEdit
                    value={r.text || ""}
                    placeholder="Review text..."
                    onSave={(v) => updateReview(i, { text: v })}
                    className="w-full"
                    inputClassName="w-full"
                    multiline
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addReview}
              className="py-6 flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                background: C.cream,
                border: `2px dashed ${C.creamBorder}`,
                borderRadius: "12px",
              }}
            >
              <Plus size={18} style={{ color: C.gray }} />
              <span className="text-[14px]" style={{ color: C.gray, fontFamily: sans }}>Add Review</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── GOOGLE PLACE ID INPUT ──────────────────────────────────────
function GooglePlaceIdInput() {
  const { rawData, saveSection, slug } = useEditor();
  const [inputValue, setInputValue] = useState("");
  const [resolvedPlaceId, setResolvedPlaceId] = useState(rawData?.googlePlaceId || "");
  const [resolvedName, setResolvedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const token = sessionStorage.getItem("designer-token");

  // Sync from rawData when it changes
  useEffect(() => {
    if (rawData?.googlePlaceId && rawData.googlePlaceId !== resolvedPlaceId) {
      setResolvedPlaceId(rawData.googlePlaceId);
    }
  }, [rawData?.googlePlaceId]);

  /**
   * Extract a Place ID from various Google Maps URL formats, or return the
   * raw input if it already looks like a Place ID (starts with "ChIJ").
   */
  const extractPlaceId = async (input: string): Promise<{ placeId: string; name?: string; lat?: number; lng?: number; address?: string }> => {
    const trimmed = input.trim();

    // Already a Place ID — still resolve via backend to get location data
    if (/^ChIJ[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
      try {
        const res = await fetch(`${API}/google-reviews/resolve-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            ...(token ? { "X-Designer-Token": token } : {}),
          },
          body: JSON.stringify({ url: `place_id=${trimmed}` }),
        });
        if (res.ok) {
          const data = await res.json();
          return { placeId: data.placeId || trimmed, name: data.name, lat: data.lat, lng: data.lng, address: data.address };
        }
      } catch { /* fallback */ }
      return { placeId: trimmed };
    }

    // Google Maps URL — resolve via backend
    if (trimmed.includes("google") || trimmed.includes("maps") || trimmed.includes("goo.gl")) {
      const res = await fetch(`${API}/google-reviews/resolve-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          ...(token ? { "X-Designer-Token": token } : {}),
        },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to resolve Google Maps link");
      }
      const data = await res.json();
      if (!data.placeId) throw new Error("Could not find a Place ID from that link");
      return { placeId: data.placeId, name: data.name, lat: data.lat, lng: data.lng, address: data.address };
    }

    throw new Error("Please paste a Google Maps link (e.g. https://maps.google.com/...)");
  };

  const handleConnect = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSaving(true);
    setResolving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      // Step 1: Resolve to Place ID (+ location data)
      const resolved = await extractPlaceId(trimmed);
      setResolvedPlaceId(resolved.placeId);
      if (resolved.name) setResolvedName(resolved.name);
      setResolving(false);

      // Step 2: Save Place ID to profile
      const ok = await saveSection("profile", { googlePlaceId: resolved.placeId });
      if (!ok) { setStatus("error"); setErrorMsg("Failed to save"); return; }

      // Step 2b: Auto-update Service Area map using the place's location
      if (resolved.lat && resolved.lng) {
        const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.4!2d${resolved.lng}!3d${resolved.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${encodeURIComponent(resolved.placeId)}!2s${encodeURIComponent(resolved.address || "")}!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg`;
        await saveSection("servicearea", {
          hqLat: resolved.lat,
          hqLng: resolved.lng,
          hqAddress: resolved.address || resolved.name || "",
          mapEmbedUrl,
        });
      }

      // Step 3: Trigger refresh to warm the cache
      try {
        await fetch(`${API}/google-reviews/${slug}/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            ...(token ? { "X-Designer-Token": token } : {}),
          },
        });
        try { sessionStorage.removeItem(`google-reviews:${slug}`); } catch {}
        toast.success("Google reviews connected!");
      } catch {
        toast.success("Connected — reviews will appear after next refresh.");
      }
      setStatus("saved");
      setInputValue("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setSaving(false);
      setResolving(false);
    }
  };

  const isConnected = !!rawData?.googlePlaceId;

  return (
    <section className="py-[32px] md:py-[48px]">
      <FadeIn>
        <div className="flex flex-col items-center text-center mb-6">
          <TagLabel>GOOGLE REVIEWS</TagLabel>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(20px, 2.5vw, 28px)", color: C.black }} className="font-normal tracking-[-0.03em] mt-3">
            Connect Your Google Reviews
          </h2>
          <p style={{ fontFamily: sans, color: C.grayLight }} className="text-[13px] mt-2 max-w-[480px]">
            Paste your Google Maps link below to automatically display your Google reviews and rating on your profile.
          </p>
        </div>

        <div className="bg-[#fafaf8] border border-[#d8d3c8] rounded-[16px] p-6 max-w-[600px] mx-auto">
          <label style={{ fontFamily: sans }} className="block text-[12px] font-medium text-[#6b6860] uppercase tracking-wider mb-2">
            Google Maps Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setStatus("idle"); setErrorMsg(""); }}
              placeholder="https://maps.google.com/maps?cid=..."
              style={{ fontFamily: sans }}
              className="flex-1 h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-3 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d] placeholder:text-[#c4c0b8]"
            />
            <button
              onClick={handleConnect}
              disabled={saving || !inputValue.trim()}
              className="h-[44px] px-5 rounded-[10px] bg-[#0f0f0d] text-white text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              )}
              {resolving ? "Resolving..." : saving ? "Connecting..." : "Connect"}
            </button>
          </div>

          {isConnected && status !== "error" && (
            <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ fontFamily: sans, color: "#166534" }}>
              <Check className="w-3.5 h-3.5" />
              <span>Connected{resolvedName ? ` — ${resolvedName}` : ""} — reviews refresh automatically every month</span>
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ fontFamily: sans, color: "#dc2626" }}>
              <X className="w-3.5 h-3.5" />
              <span>{errorMsg || "Failed to connect. Please try again."}</span>
            </div>
          )}
        </div>
      </FadeIn>
    </section>
  );
}

// ─── INLINE GOOGLE REVIEWS ───────────────────────────────────────
function InlineGoogleReviews() {
  const { rawData, saveSection } = useEditor();
  const reviews: any[] = rawData?.reviews || [];

  const updateReview = (i: number, patch: any) => {
    const next = reviews.map((r, j) => (j === i ? { ...r, ...patch } : r));
    saveSection("reviews", next);
  };
  const removeReview = (i: number) => saveSection("reviews", reviews.filter((_, j) => j !== i));
  const addReview = () => saveSection("reviews", [...reviews, { name: "New Reviewer", time: "Just now", stars: 5, text: "Review text", fullText: "Review text", image: "" }]);

  return (
    <section className="py-[80px] md:py-[100px]" style={{ background: C.cream }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>Google reviews</TagLabel>
          <h2
            className="mt-3 mb-8"
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.2vw, 42px)",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Imported from your Google Business profile
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="p-6 group/grev relative"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "12px",
              }}
            >
              <button
                onClick={() => removeReview(i)}
                className="absolute top-3 right-3 opacity-0 group-hover/grev:opacity-100 transition-opacity cursor-pointer hover:opacity-80"
                style={{ color: C.gray }}
                title="Remove review"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={idx} className="size-[12px]" viewBox="0 0 14 14" fill={C.black}><path d="M7 0.5L8.91 5.09L14 5.64L10.18 9.09L11.18 14L7 11.59L2.82 14L3.82 9.09L0 5.64L5.09 5.09L7 0.5Z" /></svg>
                ))}
              </div>
              <div className="mb-4 text-[14px] leading-[1.65]" style={{ color: C.gray, fontFamily: sans }}>
                <InlineEdit
                  value={r.fullText || r.text || ""}
                  placeholder="Review text..."
                  onSave={(v) => updateReview(i, { fullText: v, text: v })}
                  className="w-full"
                  inputClassName="w-full"
                  multiline
                />
              </div>
              <div className="pt-4 flex items-center gap-3" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
                <div>
                  <p className="text-[14px]" style={{ color: C.black, fontFamily: sans, fontWeight: 600 }}>
                    <InlineEdit
                      value={r.name || ""}
                      placeholder="Reviewer name"
                      onSave={(v) => updateReview(i, { name: v })}
                      inputClassName="w-[200px]"
                    />
                  </p>
                  <p className="text-[12px]" style={{ color: C.grayLight, fontFamily: sans }}>
                    <InlineEdit
                      value={r.time || ""}
                      placeholder="2 months ago"
                      onSave={(v) => updateReview(i, { time: v })}
                      inputClassName="w-[140px]"
                    />
                  </p>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addReview}
            className="min-h-[160px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: C.creamDark,
              border: `2px dashed ${C.creamBorder}`,
              borderRadius: "12px",
            }}
          >
            <Plus size={18} style={{ color: C.gray }} />
            <span className="text-[14px]" style={{ color: C.gray, fontFamily: sans }}>Add Review</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── INLINE SERVICE AREA ─────────────────────────────────────────
function InlineServiceArea() {
  const { rawData, saveSection } = useEditor();
  const sa = rawData?.serviceArea || {};
  const description = sa.description || "";
  const hqAddress = sa.hqAddress || "";

  const save = (patch: any) => saveSection("servicearea", { ...sa, ...patch });

  return (
    <section
      className="py-[80px] md:py-[100px]"
      style={{ background: C.creamDark, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <TagLabel>Where we work</TagLabel>
          <h2
            className="mt-3 mb-4"
            style={{
              fontFamily: serif,
              fontSize: "clamp(28px, 3.2vw, 42px)",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Service area
          </h2>
          <div className="max-w-[680px] mb-8 text-[16px] leading-[1.65]" style={{ color: C.gray, fontFamily: sans }}>
            <InlineEdit
              value={description}
              placeholder="Describe your service area — neighborhoods covered, travel scope."
              onSave={(v) => save({ description: v })}
              className="w-full"
              inputClassName="w-full"
              multiline
            />
          </div>

          <div
            className="p-6 max-w-[680px]"
            style={{
              background: C.cream,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "12px",
            }}
          >
            <div className="flex items-start gap-3">
              <MapPin size={20} className="shrink-0 mt-1" style={{ color: C.black }} />
              <div className="flex-1">
                <TagLabel>HQ Address</TagLabel>
                <div className="mt-2 text-[15px]" style={{ color: C.black, fontFamily: sans }}>
                  <InlineEdit
                    value={hqAddress}
                    placeholder="33 Ubi Ave 3, Singapore 408868"
                    onSave={(v) => save({ hqAddress: v })}
                    inputClassName="w-[400px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── REUSABLE IMAGE UPLOAD ───────────────────────────────────────
// Client-side image compression. Resizes any image down to MAX_DIMENSION on its
// longest edge and re-encodes as JPEG at QUALITY. Skips non-images (videos),
// animated GIFs, and SVGs. Returns the original file if compression made it
// larger (e.g. tiny images).
const COMPRESS_MAX_DIMENSION = 2000;
const COMPRESS_QUALITY = 0.82;
async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });

    const { width: w, height: h } = img;
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file; // compression didn't help

    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

async function uploadDesignerImage(file: File): Promise<string> {
  const optimized = await compressImageFile(file);
  const formData = new FormData();
  formData.append("file", optimized);
  const token = localStorage.getItem("designer-token") || "";
  const res = await fetch(`${API}/designer-upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Designer-Token": token },
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.url;
}

function InlineImageUpload({
  src,
  alt,
  onUploaded,
  className = "",
  rounded = "rounded-lg",
  iconSize = 18,
}: {
  src: string;
  alt: string;
  onUploaded: (url: string) => void;
  className?: string;
  rounded?: string;
  iconSize?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const url = await uploadDesignerImage(file);
      onUploaded(url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className={`relative group/imgup cursor-pointer ${className}`}
      onClick={(e) => { e.stopPropagation(); !uploading && fileRef.current?.click(); }}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {src ? (
        <img src={src} alt={alt} className={`w-full h-full object-cover ${rounded}`} />
      ) : (
        <div
          className={`w-full h-full ${rounded} flex items-center justify-center`}
          style={{ background: C.cream, border: `2px dashed ${C.creamBorder}` }}
        >
          <Camera size={iconSize} style={{ color: C.grayLight }} />
        </div>
      )}
      <div className={`absolute inset-0 ${rounded} flex items-center justify-center transition-colors ${uploading ? "bg-black/50" : "bg-black/0 group-hover/imgup:bg-black/30"}`}>
        {uploading ? (
          <Loader2 size={iconSize} className="animate-spin" style={{ color: C.white }} />
        ) : (
          <Camera size={iconSize} className="opacity-0 group-hover/imgup:opacity-100 transition-opacity" style={{ color: C.white }} />
        )}
      </div>
    </div>
  );
}

// ─── INLINE MEDIA UPLOAD (image OR video) ────────────────────────
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase().split("?")[0];
  return u.endsWith(".mp4") || u.endsWith(".mov") || u.endsWith(".webm") || u.endsWith(".m4v");
}

function InlineMediaUpload({
  src,
  alt,
  onUploaded,
  className = "",
  rounded = "rounded-lg",
  iconSize = 24,
}: {
  src: string;
  alt: string;
  onUploaded: (url: string) => void;
  className?: string;
  rounded?: string;
  iconSize?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) { toast.error("Please select an image or video"); return; }
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isVideo ? "Video must be under 50MB" : "Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadDesignerImage(file);
      onUploaded(url);
      toast.success(isVideo ? "Video uploaded" : "Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const showVideo = src && isVideoUrl(src);

  return (
    <div
      className={`relative group/medup cursor-pointer ${className}`}
      onClick={(e) => { e.stopPropagation(); !uploading && fileRef.current?.click(); }}
    >
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
      {src ? (
        showVideo ? (
          <video src={src} className={`w-full h-full object-cover ${rounded}`} muted loop playsInline autoPlay />
        ) : (
          <img src={src} alt={alt} className={`w-full h-full object-cover ${rounded}`} />
        )
      ) : (
        <div
          className={`w-full h-full ${rounded} flex flex-col items-center justify-center gap-1`}
          style={{ background: C.cream, border: `2px dashed ${C.creamBorder}` }}
        >
          <Camera size={iconSize} style={{ color: C.grayLight }} />
          <span className="text-[10px] uppercase" style={{ color: C.grayLight, fontFamily: sans, letterSpacing: "0.08em" }}>Image / Video</span>
        </div>
      )}
      <div className={`absolute inset-0 ${rounded} flex items-center justify-center transition-colors ${uploading ? "bg-black/50" : "bg-black/0 group-hover/medup:bg-black/30"}`}>
        {uploading ? (
          <Loader2 size={iconSize} className="animate-spin" style={{ color: C.white }} />
        ) : (
          <Camera size={iconSize} className="opacity-0 group-hover/medup:opacity-100 transition-opacity" style={{ color: C.white }} />
        )}
      </div>
    </div>
  );
}

// ─── LOGO UPLOAD ─────────────────────────────────────────────────
function LogoUpload({ src, alt, onUploaded }: { src: string; alt: string; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    try {
      const url = await uploadDesignerImage(file);
      onUploaded(url);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className="relative rounded-full size-[96px] md:size-[160px] shrink-0 overflow-hidden flex items-center justify-center z-[1] group/logo cursor-pointer"
      style={{
        background: C.white,
        border: `3px solid ${C.cream}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
      onClick={() => !uploading && fileRef.current?.click()}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <img src={src} alt={alt} className="w-[90%] h-[90%] object-cover rounded-full" />
      {/* Camera overlay */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center transition-colors"
        style={{ background: uploading ? "rgba(15,15,13,0.5)" : "transparent" }}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin" style={{ color: C.white }} />
        ) : (
          <Camera size={24} className="opacity-0 group-hover/logo:opacity-100 transition-opacity" style={{ color: C.white }} />
        )}
      </div>
      <div className="absolute inset-0 rounded-full transition-colors group-hover/logo:bg-black/30 pointer-events-none" />
    </div>
  );
}

// ─── EDITABLE HERO ────────────────────────────────────────────────
// Cover image + project details = form overlay (EditableSection)
// Logo, name, tagline, availability, location = inline pencil edits
function EditableHero() {
  const { rawData, saveSection, editing } = useEditor();
  const ctx = useContext(DesignerDataContext);
  const p = ctx?.profile;
  const cp = p?.coverProject;

  const coverImg = p?.images?.cover ? resolveImg(p.images.cover) : PLACEHOLDER_COVER;
  const logoImg = p?.images?.logo ? resolveImg(p.images.logo) : PLACEHOLDER_LOGO;
  const companyName = p?.name || "Your Studio Name";
  const taglineText = p?.tagline || "Add your tagline here";
  const availText = p?.availability || "Available for ...";
  const locText = p?.location || "Singapore Based";
  const coverName = cp?.name || "Your Featured Project";
  const coverCost = cp?.cost || "";
  const coverArea = cp?.area || "";
  const coverYear = cp?.year || "";
  const coverStyle = cp?.style || "";

  // Save a single field into the profile section
  const save = (patch: any) => saveSection("profile", patch);
  const saveImage = (field: string, url: string) => {
    save({ images: { ...(rawData?.images || {}), [field]: url } });
  };

  return (
    <section className="relative w-full pt-[60px] md:pt-[80px]">
      {/* Cover Image — auto-populated from featured project */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: "clamp(360px, 50vw, 520px)",
          borderRadius: "12px",
          border: `1px solid ${C.creamBorder}`,
        }}
      >
        <img
          src={coverImg}
          alt={`${companyName} project`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Project tag */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold"
            style={{
              background: "rgba(15,15,13,0.85)",
              color: C.white,
              borderRadius: "999px",
              fontFamily: sans,
            }}
          >
            {coverName}
          </span>
        </div>
      </div>

      {/* Profile info row — inline pencil edits */}
      <div className="relative mt-[-60px] md:mt-[-80px] pl-4 md:pl-8 flex items-start gap-5 md:gap-7">
        {/* Logo */}
        <LogoUpload src={logoImg} alt={companyName} onUploaded={(url) => saveImage("logo", url)} />

        {/* Name + info */}
        <div className="pt-[70px] md:pt-[100px] lg:max-w-[600px]">
          <div className="mb-1">
            <InlineEdit
              value={companyName}
              placeholder="Your Studio Name"
              onSave={(v) => save({ name: v })}
              className="block"
              inputClassName="text-[36px] w-[400px]"
            />
          </div>
          <div
            style={{
              fontFamily: serif,
              fontSize: "clamp(36px, 4.2vw, 56px)",
              color: C.black,
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              display: "none",
            }}
          />
          <div className="mb-3" style={{ fontFamily: serif, fontStyle: "italic", fontSize: "20px", color: C.gray }}>
            <InlineEdit
              value={taglineText}
              placeholder="Add your tagline here — describe what makes your studio unique."
              onSave={(v) => save({ tagline: v })}
              className="w-full"
              inputClassName="text-[18px] w-full"
              multiline
            />
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap" style={{ fontFamily: sans }}>
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold"
              style={{
                background: C.cream,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "999px",
                color: C.gray,
              }}
            >
              <span className="rounded-full size-2 inline-block" style={{ background: "#00c950" }} />
              <InlineEdit
                value={availText}
                placeholder="Available for Q3 2026"
                onSave={(v) => save({ availability: v })}
                inputClassName="text-[11px] w-[180px]"
              />
            </span>
            <span className="text-[13px]" style={{ color: C.gray }}>
              <InlineEdit
                value={locText}
                placeholder="Singapore Based"
                onSave={(v) => save({ location: v })}
                inputClassName="text-[13px] w-[140px]"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const s = rawData?.stats || {};
  const [form, setForm] = useState({
    rating: s.rating || "4.9",
    reviewCount: s.reviewCount || "0",
    years: s.years || "1",
    hdbCert: s.hdbCert ?? false,
    bcaLicensed: s.bcaLicensed ?? false,
  });

  const handleSave = async () => {
    const ok = await saveSection("profile", { stats: form });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Rating" value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} placeholder="4.9" />
        <Field label="Review Count" value={form.reviewCount} onChange={(v) => setForm({ ...form, reviewCount: v })} placeholder="186" />
        <Field label="Years Experience" value={form.years} onChange={(v) => setForm({ ...form, years: v })} placeholder="12" />
      </div>
      <div className="flex gap-6">
        <Toggle label="HDB Certified" checked={form.hdbCert} onChange={(v) => setForm({ ...form, hdbCert: v })} />
        <Toggle label="BCA Licensed" checked={form.bcaLicensed} onChange={(v) => setForm({ ...form, bcaLicensed: v })} />
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function BioEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [bio, setBio] = useState(rawData?.bio || "");

  const handleSave = async () => {
    const ok = await saveSection("profile", { bio });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Field label="Company Bio" value={bio} onChange={setBio} multiline placeholder="Tell homeowners about your studio..." />
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function BtoPackageEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const b = rawData?.btoPackage || {};
  const [form, setForm] = useState({
    title: b.title || "",
    description: b.description || "",
    startingPrice: b.startingPrice || "",
    tags: b.tags || [],
  });

  const handleSave = async () => {
    const ok = await saveSection("profile", { btoPackage: form });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="All-Inclusive BTO Packages" />
        <Field label="Starting Price" value={form.startingPrice} onChange={(v) => setForm({ ...form, startingPrice: v })} placeholder="$28,888" />
      </div>
      <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
      <div>
        <p className="text-[12px] font-semibold text-[#0f0f0d]/40 uppercase tracking-wider mb-2">Tags</p>
        {form.tags.map((t: string, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input value={t} onChange={(e) => { const a = [...form.tags]; a[i] = e.target.value; setForm({ ...form, tags: a }); }} className="flex-1 h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
            <button onClick={() => setForm({ ...form, tags: form.tags.filter((_: any, j: number) => j !== i) })} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => setForm({ ...form, tags: [...form.tags, ""] })} className="text-[12px] text-[#0f0f0d]/50 flex items-center gap-1 hover:text-[#0f0f0d] cursor-pointer"><Plus size={12} /> Add Tag</button>
      </div>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function TeamEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [team, setTeam] = useState<any[]>(rawData?.team || []);

  const updateMember = (i: number, field: string, value: any) => {
    const a = [...team]; a[i] = { ...a[i], [field]: value }; setTeam(a);
  };

  const handleSave = async () => {
    const ok = await saveSection("team", team);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      {team.map((m, i) => (
        <div key={i} className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f0f0d]">Team Member {i + 1}</p>
            <button onClick={() => setTeam(team.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={m.name || ""} onChange={(v) => updateMember(i, "name", v)} />
            <Field label="Role" value={m.role || ""} onChange={(v) => updateMember(i, "role", v)} />
            <Field label="Specialty" value={m.specialty || ""} onChange={(v) => updateMember(i, "specialty", v)} />
            <Field label="Experience" value={m.experience || ""} onChange={(v) => updateMember(i, "experience", v)} />
            <Field label="Projects Count" value={String(m.projects || 0)} onChange={(v) => updateMember(i, "projects", parseInt(v) || 0)} />
            <Field label="Image URL" value={m.image || ""} onChange={(v) => updateMember(i, "image", v)} />
          </div>
          <Field label="Bio" value={m.bio || ""} onChange={(v) => updateMember(i, "bio", v)} multiline />
        </div>
      ))}
      <button
        onClick={() => setTeam([...team, { name: "", role: "", specialty: "", experience: "", projects: 0, bio: "", image: "", type: "person" }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Team Member
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function BusinessInfoEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [items, setItems] = useState<any[]>(rawData?.businessInfo || []);

  const handleSave = async () => {
    const ok = await saveSection("businessinfo", items);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item.label || ""} onChange={(e) => { const a = [...items]; a[i] = { ...a[i], label: e.target.value }; setItems(a); }} placeholder="Label" className="w-[180px] h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
          <input value={item.value || ""} onChange={(e) => { const a = [...items]; a[i] = { ...a[i], value: e.target.value }; setItems(a); }} placeholder="Value" className="flex-1 h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
          <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={() => setItems([...items, { label: "", value: "" }])} className="text-[12px] text-[#0f0f0d]/50 flex items-center gap-1 hover:text-[#0f0f0d] cursor-pointer"><Plus size={12} /> Add Row</button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function ProjectsEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [projects, setProjects] = useState<any[]>(rawData?.projects || []);

  const handleSave = async () => {
    const ok = await saveSection("projects", projects);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      {projects.map((p, i) => (
        <div key={i} className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f0f0d]">Project {i + 1}</p>
            <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={p.name || ""} onChange={(v) => { const a = [...projects]; a[i] = { ...a[i], name: v }; setProjects(a); }} />
            <Field label="Meta (e.g. HDB 5-Room · $85K · 2024)" value={p.meta || ""} onChange={(v) => { const a = [...projects]; a[i] = { ...a[i], meta: v }; setProjects(a); }} />
          </div>
          <Field label="Image URL" value={p.image || ""} onChange={(v) => { const a = [...projects]; a[i] = { ...a[i], image: v }; setProjects(a); }} />
        </div>
      ))}
      <button
        onClick={() => setProjects([...projects, { name: "", meta: "", image: "" }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Project
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function CaseStudiesEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [phases, setPhases] = useState<any[]>(rawData?.caseStudies || []);

  const handleSave = async () => {
    const ok = await saveSection("casestudies", phases);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      {phases.map((p, i) => (
        <div key={i} className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f0f0d]">Phase {i + 1}</p>
            <button onClick={() => setPhases(phases.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phase Label" value={p.phase || ""} onChange={(v) => { const a = [...phases]; a[i] = { ...a[i], phase: v }; setPhases(a); }} placeholder="Phase 1" />
            <Field label="Title" value={p.title || ""} onChange={(v) => { const a = [...phases]; a[i] = { ...a[i], title: v }; setPhases(a); }} />
          </div>
          <Field label="Description" value={p.desc || ""} onChange={(v) => { const a = [...phases]; a[i] = { ...a[i], desc: v }; setPhases(a); }} multiline />
          <Field label="Image URL" value={p.image || ""} onChange={(v) => { const a = [...phases]; a[i] = { ...a[i], image: v }; setPhases(a); }} />
        </div>
      ))}
      <button
        onClick={() => setPhases([...phases, { phase: `Phase ${phases.length + 1}`, title: "", desc: "", image: "", tags: [] }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Phase
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function ReviewsEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const [reviews, setReviews] = useState<any[]>(rawData?.reviews || []);

  const handleSave = async () => {
    const ok = await saveSection("reviews", reviews);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      {reviews.map((r, i) => (
        <div key={i} className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f0f0d]">Review {i + 1}</p>
            <button onClick={() => setReviews(reviews.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={r.name || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], name: v }; setReviews(a); }} />
            <Field label="Time" value={r.time || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], time: v }; setReviews(a); }} placeholder="2 months ago" />
            <Field label="Stars (1-5)" value={String(r.stars || 5)} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], stars: parseInt(v) || 5 }; setReviews(a); }} />
          </div>
          <Field label="Review Text" value={r.fullText || r.text || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], fullText: v, text: v }; setReviews(a); }} multiline />
          <Field label="Image URL" value={r.image || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], image: v }; setReviews(a); }} />
        </div>
      ))}
      <button
        onClick={() => setReviews([...reviews, { name: "", time: "", stars: 5, text: "", fullText: "", image: "" }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Review
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function LatestReviewsEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  // Edit the `reviews` array — this is the field that GoogleReviewCards
  // falls back to when there are no Google reviews to display.
  // (Previously this form edited `latestReviews`, which is no longer rendered
  // anywhere on the public page after the HomeownersSay removal.)
  const [reviews, setReviews] = useState<any[]>(rawData?.reviews || []);

  const handleSave = async () => {
    const ok = await saveSection("reviews", reviews);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#6b6860] leading-[1.6]">
        Manual reviews are shown when Google reviews are not yet connected (or while they refresh).
        Once your Google Place ID is set, real Google reviews will replace these automatically.
      </p>
      {reviews.map((r, i) => (
        <div key={i} className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#0f0f0d]">Review {i + 1}</p>
            <button onClick={() => setReviews(reviews.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={r.name || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], name: v }; setReviews(a); }} />
            <Field label="Initial" value={r.initial || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], initial: v }; setReviews(a); }} placeholder="A" />
            <Field label="Date" value={r.date || r.time || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], date: v, time: v }; setReviews(a); }} placeholder="2 months ago" />
          </div>
          <Field label="Title" value={r.title || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], title: v }; setReviews(a); }} placeholder="Short summary headline" />
          <Field label="Review Text" value={r.text || r.fullText || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], text: v, fullText: v }; setReviews(a); }} multiline />
        </div>
      ))}
      <button
        onClick={() => setReviews([...reviews, { name: "", initial: "", date: "", title: "", text: "", fullText: "", bgColor: "bg-[#fef3c7]", textColor: "text-[#a16207]" }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Review
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function TrustedSinceEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const ts = rawData?.trustedSince || {};
  const creds = rawData?.credentials || {};
  const [form, setForm] = useState({
    title: ts.title || "",
    description: ts.description || "",
    badges: Array.isArray(ts.badges) ? [...ts.badges] : [],
    hdbActive: !!creds?.hdb?.active,
    hdbTitle: creds?.hdb?.title || "",
    hdbFirm: creds?.hdb?.firm || "",
    hdbReg: creds?.hdb?.reg || "",
    bcaActive: !!creds?.bca?.active,
    bcaTitle: creds?.bca?.title || "",
    bcaFirm: creds?.bca?.firm || "",
    bcaReg: creds?.bca?.reg || "",
    landedEligible: !!creds?.landedEligible,
  });

  const handleSave = async () => {
    // trustedSince + credentials both live on the profile object,
    // so we save via the "profile" section which deep-merges these keys.
    const payload = {
      trustedSince: {
        ...(ts || {}),
        title: form.title,
        description: form.description,
        badges: form.badges.filter((b) => b.trim() !== ""),
      },
      credentials: {
        ...(creds || {}),
        hdb: {
          active: form.hdbActive,
          title: form.hdbTitle,
          firm: form.hdbFirm,
          reg: form.hdbReg,
        },
        bca: {
          active: form.bcaActive,
          title: form.bcaTitle,
          firm: form.bcaFirm,
          reg: form.bcaReg,
        },
        landedEligible: form.landedEligible,
      },
    };
    const ok = await saveSection("profile", payload);
    if (ok) setEditing(null);
  };

  const updateBadge = (i: number, v: string) => {
    const a = [...form.badges];
    a[i] = v;
    setForm({ ...form, badges: a });
  };

  return (
    <div className="space-y-5">
      <Field
        label="Section Title"
        value={form.title}
        onChange={(v) => setForm({ ...form, title: v })}
        placeholder="e.g. Trusted Since 2015"
      />
      <Field
        label="Description"
        value={form.description}
        onChange={(v) => setForm({ ...form, description: v })}
        placeholder="Tell homeowners about your studio's history and approach."
        multiline
      />

      {/* ── Badges ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <TagLabel>Custom Badges</TagLabel>
          <button
            onClick={() => setForm({ ...form, badges: [...form.badges, ""] })}
            className="text-[12px] text-[#0f0f0d]/70 hover:text-[#0f0f0d] flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> Add badge
          </button>
        </div>
        {form.badges.length === 0 && (
          <p className="text-[12px] text-[#9a9790]">No badges yet. Add a free-form credential like "ISO 9001 Certified".</p>
        )}
        {form.badges.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={b}
              onChange={(e) => updateBadge(i, e.target.value)}
              placeholder="e.g. Houzz Best of Service 2024"
              className="flex-1 h-[44px] px-4 text-[14px] outline-none transition-colors"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "12px",
                color: C.black,
                fontFamily: sans,
              }}
            />
            <button
              onClick={() => setForm({ ...form, badges: form.badges.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 cursor-pointer p-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ── HDB Credentials ── */}
      <div className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Toggle label="HDB Registered Contractor" checked={form.hdbActive} onChange={(v) => setForm({ ...form, hdbActive: v })} />
          {form.hdbActive && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#bbf7d0] bg-[#f0fdf4]">
              <svg className="size-[14px] shrink-0" viewBox="0 0 13.5 16.5" fill="none">
                <rect height="15" stroke="#16a34a" strokeLinejoin="round" strokeWidth="1.5" width="12" x="0.75" y="0.75" />
                <path d="M4.5 8.25L6 9.75L9 6.75" stroke="#16a34a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#166534]" style={{ fontFamily: sans }}>HDB</span>
            </div>
          )}
        </div>
        {form.hdbActive && (
          <div className="space-y-3 pt-1">
            <Field label="Title" value={form.hdbTitle} onChange={(v) => setForm({ ...form, hdbTitle: v })} placeholder="HDB Registered Contractor" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Firm" value={form.hdbFirm} onChange={(v) => setForm({ ...form, hdbFirm: v })} placeholder="Your firm name" />
              <Field label="Registration #" value={form.hdbReg} onChange={(v) => setForm({ ...form, hdbReg: v })} placeholder="HDB-XXXX" />
            </div>
          </div>
        )}
      </div>

      {/* ── BCA Credentials ── */}
      <div className="border border-[#e5e2dc] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Toggle label="BCA Licensed Builder" checked={form.bcaActive} onChange={(v) => setForm({ ...form, bcaActive: v })} />
          {form.bcaActive && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#bfdbfe] bg-[#eff6ff]">
              <svg className="size-[14px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="#155DFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#1e40af]" style={{ fontFamily: sans }}>BCA</span>
            </div>
          )}
        </div>
        {form.bcaActive && (
          <div className="space-y-3 pt-1">
            <Field label="Title" value={form.bcaTitle} onChange={(v) => setForm({ ...form, bcaTitle: v })} placeholder="BCA Licensed Builder" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Firm" value={form.bcaFirm} onChange={(v) => setForm({ ...form, bcaFirm: v })} placeholder="Your firm name" />
              <Field label="License #" value={form.bcaReg} onChange={(v) => setForm({ ...form, bcaReg: v })} placeholder="BCA-XXXX" />
            </div>
          </div>
        )}
      </div>

      {/* ── Landed eligibility ── */}
      <div className="border border-[#e5e2dc] rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <Toggle label="Landed Home Eligible" checked={form.landedEligible} onChange={(v) => setForm({ ...form, landedEligible: v })} />
          {form.landedEligible && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#fed7aa] bg-[#fff7ed]">
              <svg className="size-[14px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="#FFA929" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#9a3412]" style={{ fontFamily: sans }}>LANDED</span>
            </div>
          )}
        </div>
      </div>

      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function ServiceAreaEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const sa = rawData?.serviceArea || {};
  const [form, setForm] = useState({
    hqAddress: sa.hqAddress || "",
    mapEmbedUrl: sa.mapEmbedUrl || "",
  });

  const handleSave = async () => {
    const ok = await saveSection("servicearea", form);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Field label="ID Firm Name" value={form.hqAddress} onChange={(v) => setForm({ ...form, hqAddress: v })} placeholder="e.g. OneHome Interior Design" />
      <Field label="Google Maps Embed URL" value={form.mapEmbedUrl} onChange={(v) => setForm({ ...form, mapEmbedUrl: v })} placeholder="https://www.google.com/maps/embed?..." />
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

// ─── MAIN EDITOR COMPONENT ───────────────────────────────────────

function EditorView({ slug }: { slug: string }) {
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { payload: googlePayload, uiReviews: googleUiReviews } = useGoogleReviews(slug);

  // ── Project modal state (Add / Edit) ──
  // Mounted at the editor level so the click-to-add and click-to-edit chrome
  // inside ProjectsSection (which lives in DesignerProfile.tsx) can open them
  // via callbacks wired into ProfileEditContext.
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [savingNewProject, setSavingNewProject] = useState(false);
  const [editProjectIndex, setEditProjectIndex] = useState<number | null>(null);
  const [savingEditProject, setSavingEditProject] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await editorApi(`/designer-profile-data/${slug}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setRawData(json.data || null);
    } catch (err) {
      console.error("Failed to fetch designer data:", err);
      toast.error("Failed to load profile data");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveSection = useCallback(async (section: string, data: any) => {
    setSaving(true);

    // Server stores sections under lowercase keys but the GET response remaps
    // them to camelCase. Optimistic update must use the same camelCase key
    // the editor components read from.
    const sectionKeyMap: Record<string, string> = {
      casestudies: "caseStudies",
      latestreviews: "latestReviews",
      servicearea: "serviceArea",
      businessinfo: "businessInfo",
    };

    // ── Optimistic update: apply changes to rawData immediately ──
    const prevRawData = rawData;
    setRawData((prev: any) => {
      if (!prev) return prev;
      if (section === "profile") {
        // Merge patch into top-level rawData (images, coverProject, name, etc.)
        const merged = { ...prev };
        for (const [key, val] of Object.entries(data)) {
          if (key === "images") {
            merged.images = { ...(prev.images || {}), ...(val as any) };
          } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            merged[key] = { ...(prev[key] || {}), ...(val as any) };
          } else {
            merged[key] = val;
          }
        }
        return merged;
      }
      // Section data (team, projects, reviews, etc.) — map to camelCase key when needed
      const key = sectionKeyMap[section] || section;
      return { ...prev, [key]: data };
    });

    try {
      const res = await editorApi(`/designer-profile-data/${slug}/${section}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      toast.success("Saved successfully");
      setSaving(false);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
      // Revert optimistic update on failure
      setRawData(prevRawData);
      setSaving(false);
      return false;
    }
  }, [slug, rawData]);

  const handleLogout = () => {
    editorApi("/portal-logout", { method: "POST" });
    localStorage.removeItem("designer-token");
    window.location.reload();
  };

  // Build context for DesignerProfile components — always provide data so Sora fallback never shows
  const ctxValue = useMemo(() => {
    const blankProfile = {
      name: rawData?.name || "Your Studio Name",
      slug,
      tagline: rawData?.tagline || "Add your tagline here — describe what makes your studio unique.",
      availability: rawData?.availability || "",
      location: rawData?.location || "Singapore Based",
      verified: rawData?.verified ?? false,
      bio: rawData?.bio || "",
      stats: rawData?.stats || { rating: "0", reviewCount: "0", years: "1", hdbCert: false, bcaLicensed: false },
      images: {
        cover: rawData?.images?.cover || PLACEHOLDER_COVER,
        logo: rawData?.images?.logo || PLACEHOLDER_LOGO,
        map: rawData?.images?.map || "",
        video: "", google: "", bcaCert: "", hdbCert: "",
        ...(rawData?.images || {}),
        // Re-apply placeholders if the actual values are empty
        ...(!rawData?.images?.cover ? { cover: PLACEHOLDER_COVER } : {}),
        ...(!rawData?.images?.logo ? { logo: PLACEHOLDER_LOGO } : {}),
      },
      coverProject: rawData?.coverProject || { name: "Your Featured Project", cost: "", area: "", year: "", style: "" },
      trustedSince: rawData?.trustedSince || { title: "", description: "", badges: [], certifications: [] },
      btoPackage: rawData?.btoPackage || { title: "", description: "", startingPrice: "", tags: [] },
      credentials: rawData?.credentials,
      founder: rawData?.founder || "",
      foundedYear: rawData?.foundedYear || new Date().getFullYear(),
      totalProjects: rawData?.totalProjects || 0,
      team: rawData?.team || [],
      projects: rawData?.projects || [],
      caseStudies: rawData?.caseStudies || [],
      reviews: rawData?.reviews || [],
      latestReviews: rawData?.latestReviews || [],
      serviceArea: rawData?.serviceArea || {},
      businessInfo: rawData?.businessInfo || [],
    };
    const base = transformApiData(blankProfile);
    return {
      ...base,
      googleReviews: googleUiReviews,
      googleMeta: googlePayload
        ? { rating: googlePayload.rating, totalRatings: googlePayload.totalRatings, source: googlePayload.source, fetchedAt: googlePayload.fetchedAt, placeId: googlePayload.placeId }
        : null,
    };
  }, [rawData, slug, googlePayload, googleUiReviews]);

  if (loading) return <ProfileLoadingSkeleton />;

  // Inline-edit save: dotted paths like "name", "tagline", "coverProject.cost", "images.cover".
  // Maps the path to the right server section (profile vs others) and merges into rawData.
  const editSave = (path: string, value: any) => {
    const parts = path.split(".");
    const top = parts[0];
    // businessInfo has its own server section — route directly
    if (top === "businessInfo") {
      return saveSection("businessinfo", value);
    }
    // All hero/profile fields live under the "profile" section on the server
    const profileKeys = new Set(["name", "tagline", "availability", "location", "verified", "bio", "stats", "images", "coverProject", "founder", "foundedYear", "trustedSince", "btoPackage", "hqAddress", "credentials"]);
    if (profileKeys.has(top)) {
      // Build the nested patch
      let patch: any = value;
      for (let i = parts.length - 1; i > 0; i--) {
        patch = { [parts[i]]: patch };
      }
      // Merge with existing top-level value if it's an object so we don't drop sibling keys
      const existing = (rawData as any)?.[top];
      if (existing && typeof existing === "object" && !Array.isArray(existing) && typeof patch === "object") {
        // Deep-merge one level for the immediate sub-object
        const subKey = parts[1];
        if (subKey && typeof existing[subKey] === "object" && !Array.isArray(existing[subKey])) {
          patch = { ...existing, [subKey]: { ...existing[subKey], ...patch[subKey] } };
        } else {
          patch = { ...existing, ...patch };
        }
      }
      return saveSection("profile", { [top]: patch });
    }
    // Fallback — treat as direct top-level field
    return saveSection("profile", { [top]: value });
  };

  const editUpload = async (file: File): Promise<string | null> => {
    try { return await uploadDesignerImage(file); }
    catch (e: any) { toast.error(e?.message || "Upload failed"); return null; }
  };

  const editSaveCollection = (section: string, data: any) => {
    if (section === "addVideoTour") {
      const current = rawData?.videoTours || [];
      return saveSection("profile", { videoTours: [...current, { src: data, title: "" }] });
    }
    if (section === "removeVideoTour") {
      const current = rawData?.videoTours || [];
      return saveSection("profile", { videoTours: current.filter((_: any, i: number) => i !== data) });
    }
    return saveSection(section, data);
  };

  // ── Project modal save handlers ──
  // (Mirrors the logic that previously lived inside InlineProjects so the
  //  AddProjectModal / EditProjectModal can be reused from the live
  //  ProjectsSection component.)
  const handleSaveNewProject = async (draft: NewProjectDraft) => {
    const projects: any[] = rawData?.projects || [];
    setSavingNewProject(true);
    try {
      const propertyTypeCombined = draft.propertySubType
        ? `${draft.propertyType}, ${draft.propertySubType}`
        : draft.propertyType;

      const newProject = {
        id: slugifyTitle(draft.title) || `project-${Date.now()}`,
        name: draft.title,
        meta: `${propertyTypeCombined} · ${draft.cost} · ${draft.year}`,
        image: draft.coverImage,
        title: draft.title,
        location: draft.location,
        cost: draft.cost,
        size: draft.size,
        year: draft.year,
        propertyType: draft.propertyType,
        propertySubType: draft.propertySubType,
        propertyTypeDisplay: propertyTypeCombined,
        style: draft.style,
        coverImage: draft.coverImage,
        gallery: draft.gallery,
        worksIncluded: draft.worksIncluded,
        designerName: draft.designerName,
        isFeatured: draft.isFeatured,
        featuredImage: draft.isFeatured ? (draft.featuredImage || draft.coverImage) : "",
        floorPlan: draft.floorPlan || "",
      };

      const ok = await saveSection("projects", [...projects, newProject]);
      if (ok) {
        // Sync featured project to cover/hero section
        if (draft.isFeatured) {
          await saveSection("profile", {
            coverProject: {
              name: draft.title,
              cost: draft.cost,
              area: draft.size,
              year: draft.year,
              style: draft.style,
            },
            images: { ...(rawData?.images || {}), cover: draft.featuredImage || draft.coverImage },
          });
        }
        toast.success("Project added");
        setAddProjectModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project");
    } finally {
      setSavingNewProject(false);
    }
  };

  const handleEditProjectSave = async (draft: NewProjectDraft) => {
    if (editProjectIndex === null) return;
    const projects: any[] = rawData?.projects || [];
    setSavingEditProject(true);
    try {
      const propertyTypeCombined = draft.propertySubType
        ? `${draft.propertyType}, ${draft.propertySubType}`
        : draft.propertyType;
      const updated = {
        ...projects[editProjectIndex],
        id: slugifyTitle(draft.title) || projects[editProjectIndex]?.id || `project-${Date.now()}`,
        name: draft.title,
        meta: `${propertyTypeCombined} · ${draft.cost} · ${draft.year}`,
        image: draft.coverImage,
        title: draft.title,
        location: draft.location,
        cost: draft.cost,
        size: draft.size,
        year: draft.year,
        propertyType: draft.propertyType,
        propertySubType: draft.propertySubType,
        propertyTypeDisplay: propertyTypeCombined,
        style: draft.style,
        coverImage: draft.coverImage,
        gallery: draft.gallery,
        worksIncluded: draft.worksIncluded,
        designerName: draft.designerName,
        isFeatured: draft.isFeatured,
        featuredImage: draft.isFeatured ? (draft.featuredImage || draft.coverImage) : "",
        floorPlan: draft.floorPlan || "",
      };
      const next = projects.map((p, j) => (j === editProjectIndex ? updated : p));
      const ok = await saveSection("projects", next);
      if (ok) {
        // Sync featured project to cover/hero section
        if (draft.isFeatured) {
          await saveSection("profile", {
            coverProject: {
              name: draft.title,
              cost: draft.cost,
              area: draft.size,
              year: draft.year,
              style: draft.style,
            },
            images: { ...(rawData?.images || {}), cover: draft.featuredImage || draft.coverImage },
          });
        }
        toast.success("Project updated");
        setEditProjectIndex(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project");
    } finally {
      setSavingEditProject(false);
    }
  };

  return (
    <EditorContext.Provider value={{ editing, setEditing, saving, rawData, slug, saveSection, refetchData: fetchData }}>
      <DesignerDataContext.Provider value={ctxValue}>
        <ProfileEditContext.Provider value={{
          save: editSave,
          saveCollection: editSaveCollection,
          uploadImage: editUpload,
          openAddProjectModal: () => setAddProjectModalOpen(true),
          openEditProjectModal: (i: number) => setEditProjectIndex(i),
        }}>
        <Toaster position="top-right" richColors />

        <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]" style={{ color: C.black }}>
          {/* Floating editor toolbar */}
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-2"
            style={{
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontFamily: sans,
            }}
          >
            <span className="text-[10px] uppercase tracking-[0.12em] font-semibold pl-1" style={{ color: C.grayLight }}>
              Editing · {rawData?.name || slug}
            </span>
            <a
              href={`/designer/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5 hover:opacity-85 transition-opacity no-underline"
              style={{ background: C.cream, color: C.black, borderRadius: "10px", fontFamily: sans }}
            >
              <Eye size={13} /> Preview
            </a>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-[12px] font-medium flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer"
              style={{ background: C.black, color: C.white, borderRadius: "10px", fontFamily: sans }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>

          <main className="pt-[64px] md:pt-[72px]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8">
              {/* 1. Cover Banner (header) — fully inline */}
              <HeroSection />

              {/* 2. Studio Info (with KeyMetrics inside) + Lead Form (side-by-side under hero banner) */}
              <div className="mt-8 md:mt-10">
                <div className="grid md:grid-cols-[3fr_2fr] gap-8 md:gap-10 items-start">
                  <StudioInfo />
                  <FadeIn>
                    <QuoteCard compact />
                  </FadeIn>
                </div>
              </div>

              {/* 4. Bio — click text to edit inline */}
              <div className="mt-16 md:mt-24 lg:max-w-[768px]">
                <BioText />
              </div>

              {/* 4b. Quick Facts (full-width 3-column grid) */}
              <div className="mt-10 md:mt-14">
                <ExperienceTable inline />
              </div>


              {/* 6. Projects Carousel — fully inline (use the + tile to add a project) */}
              <ProjectsSection />

              {/* 7. Google Place ID + Rating Breakdown */}
              <GooglePlaceIdInput />
              <RatingBreakdown />
            </div>

            {/* 8. Homeowner Reviews — read-only (sourced from Google; no inline editing) */}
            <GoogleReviewCards />

            <div className="max-w-[1280px] mx-auto px-4 md:px-8">
              {/* 9. Trusted Since — editable via overlay form (title, description, badges, credentials) */}
              <EditableSection sectionKey="trustedsince" label="Trust & Credentials" icon={Shield}>
                <TrustedSince />
                <TrustedSinceEditForm />
              </EditableSection>

              {/* 11. FAQ */}
              <FAQ />
            </div>

            {/* 12. Service Area */}
            <EditableSection sectionKey="servicearea" label="Service Area" icon={MapPin}>
              <ServiceArea />
              <ServiceAreaEditForm />
            </EditableSection>
          </main>

          {/* ── Project Add/Edit Modals ── (mounted at editor level so the live
              ProjectsSection component can open them via ProfileEditContext) */}
          <AddProjectModal
            open={addProjectModalOpen}
            onClose={() => { if (!savingNewProject) setAddProjectModalOpen(false); }}
            onSave={handleSaveNewProject}
            saving={savingNewProject}
            teamMembers={rawData?.team || []}
            existingProjects={rawData?.projects || []}
          />
          {editProjectIndex !== null && (rawData?.projects?.[editProjectIndex]) && (
            <EditProjectModal
              project={rawData.projects[editProjectIndex]}
              onClose={() => { if (!savingEditProject) setEditProjectIndex(null); }}
              onSave={handleEditProjectSave}
              saving={savingEditProject}
              teamMembers={rawData?.team || []}
              existingProjects={rawData?.projects || []}
            />
          )}
        </div>
        </ProfileEditContext.Provider>
      </DesignerDataContext.Provider>
    </EditorContext.Provider>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────

export function DesignerProfileEditor() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check existing session on mount. Priority:
  //   1) portal designer-token (firm portal login)
  //   2) admin Supabase session (lets admins skip the login screen)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("designer-token");
      if (token) {
        try {
          const r = await fetch(`${API}/portal-session`, {
            headers: { Authorization: `Bearer ${publicAnonKey}`, "X-Designer-Token": token },
          });
          const json = await r.json();
          if (!cancelled && json.valid) { setAuthed(true); setChecking(false); return; }
          if (!json.valid) localStorage.removeItem("designer-token");
        } catch {}
      }
      // Admin fallback — verify the Supabase session is an admin.
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;
        if (accessToken) {
          const r = await fetch(`${API}/fp3d/admin/verify`, {
            headers: { Authorization: `Bearer ${publicAnonKey}`, "X-User-Token": accessToken },
          });
          const json = await r.json();
          if (!cancelled && json?.isAdmin === true) {
            setCachedAdminToken(accessToken);
            setAuthed(true);
          }
        }
      } catch {}
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!urlSlug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.cream, fontFamily: sans, color: C.gray }}
      >
        <p className="text-[15px]">No designer specified.</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.cream, fontFamily: sans }}
      >
        <Loader2 size={24} style={{ color: C.gray }} className="animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginScreen
        onLogin={() => setAuthed(true)}
      />
    );
  }

  return <EditorView slug={urlSlug} />;
}

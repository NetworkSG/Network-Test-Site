import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import {
  DesignerDataContext,
  ProfileEditContext,
  transformApiData,
  resolveImg,
  HeroSection,
  StatsRow,
  BioText,
  TeamAvatars,
  TrustedSince,
  BtoPackageCta,
  ProjectsSection,
  TrustCredentials,
  CaseStudies,
  HomeownersSay,
  GoogleReviewCards,
  ServiceArea,
  ProfileLoadingSkeleton,
} from "./DesignerProfile";
import {
  LogOut, Pencil, X, Check, Loader2, Plus, Trash2, Save, Eye,
  Upload, Building2, MapPin, Star, Users, Briefcase, FileText,
  MessageSquare, Globe, Camera, ArrowLeft,
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
function editorApi(path: string, opts: any = {}) {
  const token = localStorage.getItem("designer-token") || "";
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      "X-Designer-Token": token,
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
function LoginScreen({ onLogin }: { onLogin: (token: string, slug: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/portal-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Login failed"); setLoading(false); return; }
      localStorage.setItem("designer-token", json.token);
      localStorage.setItem("designer-slug", json.slug);
      onLogin(json.token, json.slug);
    } catch (err: any) {
      setError(err.message || "Network error");
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
            Edit your profile
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: C.gray }}>
            Sign in with your portal credentials
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

// ─── COVER EDIT FORM (overlay for cover image + project details) ──
function CoverEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const p = rawData || {};
  const [form, setForm] = useState({
    coverImage: p.images?.cover || "",
    coverProjectName: p.coverProject?.name || "",
    coverProjectCost: p.coverProject?.cost || "",
    coverProjectArea: p.coverProject?.area || "",
    coverProjectYear: p.coverProject?.year || "",
    coverProjectStyle: p.coverProject?.style || "",
  });

  const handleSave = async () => {
    const ok = await saveSection("profile", {
      images: { ...(p.images || {}), cover: form.coverImage },
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
      <Field label="Cover Image URL" value={form.coverImage} onChange={(v) => setForm({ ...form, coverImage: v })} placeholder="https://..." />
      <p className="text-[11px] font-semibold text-[#0f0f0d]/40 uppercase tracking-wider mt-2">Featured Project Details</p>
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
  const certs: any[] = ts.certifications || [{ name: "", license: "" }, { name: "", license: "" }];

  const hdbImg = p?.images?.hdbCert ? resolveImg(p.images.hdbCert) : null;
  const bcaImg = p?.images?.bcaCert ? resolveImg(p.images.bcaCert) : null;

  const save = (patch: any) => saveSection("profile", { trustedSince: { ...ts, ...patch } });
  const saveBadge = (i: number, v: string) => {
    const next = [...badges];
    next[i] = v;
    save({ badges: next });
  };
  const addBadge = () => save({ badges: [...badges, "New Badge"] });
  const removeBadge = (i: number) => save({ badges: badges.filter((_, j) => j !== i) });
  const saveCert = (i: number, patch: any) => {
    const next = [...certs];
    next[i] = { ...(next[i] || {}), ...patch };
    save({ certifications: next });
  };

  return (
    <section
      className="py-[80px] md:py-[100px]"
      style={{ background: C.creamDark, borderTop: `1px solid ${C.creamBorder}`, borderBottom: `1px solid ${C.creamBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <FadeIn>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
            <div className="flex-1 max-w-[640px]">
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
            </div>

            {/* Certification logos */}
            <div
              className="flex items-center gap-8 p-7 shrink-0"
              style={{
                background: C.white,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: "12px",
              }}
            >
              {[0, 1].map((i) => {
                const cert = certs[i] || { name: "", license: "" };
                const img = i === 0 ? hdbImg : bcaImg;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    {img ? (
                      <img src={img} alt={cert.name || "Certification"} className="h-[45px] w-[170px] object-contain" />
                    ) : (
                      <div
                        className="h-[45px] w-[170px] flex items-center justify-center"
                        style={{
                          background: C.cream,
                          border: `1px dashed ${C.creamBorder}`,
                          borderRadius: "8px",
                        }}
                      >
                        <span className="text-[10px] uppercase" style={{ color: C.grayLight, letterSpacing: "0.12em", fontFamily: sans }}>Cert logo</span>
                      </div>
                    )}
                    <div className="text-[10px] uppercase" style={{ color: C.grayLight, letterSpacing: "0.12em", fontWeight: 600, fontFamily: sans }}>
                      <InlineEdit
                        value={cert.license || ""}
                        placeholder="Lic. XX-00-0000X"
                        onSave={(v) => saveCert(i, { license: v })}
                        inputClassName="w-[140px] uppercase"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
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
}

function AddProjectModal({
  open,
  onClose,
  onSave,
  saving,
  teamMembers = [],
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: NewProjectDraft) => Promise<void> | void;
  saving: boolean;
  teamMembers?: any[];
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
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setDraft({
        title: "", location: "", cost: "", size: "", year: String(new Date().getFullYear()),
        propertyType: "", propertySubType: "", style: "", coverImage: "", gallery: [], worksIncluded: [],
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
  if (!draft.size.trim()) errors.size = "Area size is required";
  if (!draft.year.trim()) errors.year = "Year is required";
  if (!draft.propertyType) errors.propertyType = "Select a property type";
  if (!draft.style.trim()) errors.style = "Interior style is required";
  if (!draft.coverImage) errors.coverImage = "Upload a cover image";
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    await onSave(draft);
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
                  placeholder="e.g. S$120,000"
                  onChange={(e) => patch({ cost: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Area Size <span style={{ color: "#c14" }}>*</span></label>
                <input
                  type="text"
                  value={draft.size}
                  placeholder="e.g. 1,450 sqft"
                  onChange={(e) => patch({ size: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
                />
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
                    <input
                      type="text"
                      value={img.caption}
                      placeholder="Caption"
                      onChange={(e) => updateGalleryCaption(i, e.target.value)}
                      className="absolute bottom-0 left-0 right-0 h-7 px-2 text-[11px] outline-none"
                      style={{ background: "rgba(255,255,255,0.92)", color: C.black, fontFamily: sans, borderTop: `1px solid ${C.creamBorder}` }}
                    />
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
}: {
  project: any;
  onClose: () => void;
  onSave: (draft: NewProjectDraft) => Promise<void> | void;
  saving: boolean;
  teamMembers?: any[];
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
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

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
  if (!draft.size.trim()) errors.size = "Area size is required";
  if (!draft.year.trim()) errors.year = "Year is required";
  if (!draft.propertyType) errors.propertyType = "Select a property type";
  if (!draft.style.trim()) errors.style = "Interior style is required";
  if (!draft.coverImage) errors.coverImage = "Upload a cover image";
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    await onSave(draft);
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
                <input type="text" value={draft.cost} placeholder="e.g. S$120,000" onChange={(e) => patch({ cost: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
              </div>
              <div>
                <label style={labelStyle}>Area Size <span style={{ color: "#c14" }}>*</span></label>
                <input type="text" value={draft.size} placeholder="e.g. 1,450 sqft" onChange={(e) => patch({ size: e.target.value })} style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }} onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }} />
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
                    <input type="text" value={img.caption} placeholder="Caption" onChange={(e) => updateGalleryCaption(i, e.target.value)} className="absolute bottom-0 left-0 right-0 h-7 px-2 text-[11px] outline-none" style={{ background: "rgba(255,255,255,0.92)", color: C.black, fontFamily: sans, borderTop: `1px solid ${C.creamBorder}` }} />
                    <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer" style={{ background: "rgba(15,15,13,0.7)", color: C.white }} aria-label="Remove image"><X size={11} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => !uploadingGallery && galleryRef.current?.click()} disabled={uploadingGallery} className="flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:opacity-80" style={{ aspectRatio: "1/1", background: C.cream, border: `2px dashed ${C.creamBorder}`, borderRadius: "10px" }}>
                  {uploadingGallery ? <Loader2 size={18} className="animate-spin" style={{ color: C.gray }} /> : (<><Plus size={18} style={{ color: C.gray }} /><span className="text-[10px]" style={{ color: C.gray }}>Add</span></>)}
                </button>
              </div>
            </div>
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
      };
      const next = projects.map((p, j) => (j === editIndex ? updated : p));
      const ok = await saveSection("projects", next);
      if (ok) {
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
        // Stable id for /designer/:slug/project/:projectId routing
        id: slugifyTitle(draft.title) || `project-${Date.now()}`,

        // Legacy fields — preserved so the existing ProjectsSection listing still renders
        name: draft.title,
        meta: `${propertyTypeCombined} · ${draft.cost} · ${draft.year}`,
        image: draft.coverImage,

        // Full project detail fields used by ProjectPage
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
      };

      const ok = await saveSection("projects", [...projects, newProject]);
      if (ok) {
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
      />

      {editIndex !== null && (
        <EditProjectModal
          project={projects[editIndex]}
          onClose={() => { if (!savingEdit) setEditIndex(null); }}
          onSave={handleEditProject}
          saving={savingEdit}
          teamMembers={rawData?.team || []}
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
      {/* Cover Image + Project Details — form overlay */}
      <EditableSection sectionKey="cover" label="Cover & Project" icon={Camera}>
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
        <CoverEditForm />
      </EditableSection>

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

function TrustedSinceEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const t = rawData?.trustedSince || {};
  const [form, setForm] = useState({
    title: t.title || "",
    description: t.description || "",
    badges: t.badges || [],
    certifications: t.certifications || [],
  });

  const handleSave = async () => {
    const ok = await saveSection("profile", { trustedSince: form });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Trusted Since 2014" />
      <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />

      <div>
        <p className="text-[12px] font-semibold text-[#0f0f0d]/40 uppercase tracking-wider mb-2">Trust Badges</p>
        {form.badges.map((b: string, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              value={b}
              onChange={(e) => { const a = [...form.badges]; a[i] = e.target.value; setForm({ ...form, badges: a }); }}
              className="flex-1 h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d] bg-[#fafaf8] outline-none"
            />
            <button onClick={() => { const a = form.badges.filter((_: any, j: number) => j !== i); setForm({ ...form, badges: a }); }} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => setForm({ ...form, badges: [...form.badges, ""] })} className="text-[12px] text-[#0f0f0d]/50 flex items-center gap-1 hover:text-[#0f0f0d] cursor-pointer"><Plus size={12} /> Add Badge</button>
      </div>

      <div>
        <p className="text-[12px] font-semibold text-[#0f0f0d]/40 uppercase tracking-wider mb-2">Certifications</p>
        {form.certifications.map((c: any, i: number) => (
          <div key={i} className="grid grid-cols-3 gap-2 mb-2">
            <input value={c.name || ""} onChange={(e) => { const a = [...form.certifications]; a[i] = { ...a[i], name: e.target.value }; setForm({ ...form, certifications: a }); }} placeholder="Cert name" className="h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
            <input value={c.since || ""} onChange={(e) => { const a = [...form.certifications]; a[i] = { ...a[i], since: e.target.value }; setForm({ ...form, certifications: a }); }} placeholder="Since" className="h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
            <div className="flex gap-2">
              <input value={c.license || ""} onChange={(e) => { const a = [...form.certifications]; a[i] = { ...a[i], license: e.target.value }; setForm({ ...form, certifications: a }); }} placeholder="License #" className="flex-1 h-[36px] px-3 border border-[#d8d3c8] rounded-lg text-[13px] bg-[#fafaf8] outline-none" />
              <button onClick={() => { const a = form.certifications.filter((_: any, j: number) => j !== i); setForm({ ...form, certifications: a }); }} className="text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <button onClick={() => setForm({ ...form, certifications: [...form.certifications, { name: "", since: "", license: "" }] })} className="text-[12px] text-[#0f0f0d]/50 flex items-center gap-1 hover:text-[#0f0f0d] cursor-pointer"><Plus size={12} /> Add Certification</button>
      </div>

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
  const [reviews, setReviews] = useState<any[]>(rawData?.latestReviews || []);

  const handleSave = async () => {
    const ok = await saveSection("latestreviews", reviews);
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
            <Field label="Initial" value={r.initial || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], initial: v }; setReviews(a); }} placeholder="A" />
            <Field label="Time" value={r.time || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], time: v }; setReviews(a); }} placeholder="2 months ago" />
          </div>
          <Field label="Review Text" value={r.text || ""} onChange={(v) => { const a = [...reviews]; a[i] = { ...a[i], text: v }; setReviews(a); }} multiline />
        </div>
      ))}
      <button
        onClick={() => setReviews([...reviews, { name: "", initial: "", time: "", text: "" }])}
        className="w-full py-2.5 border-2 border-dashed border-[#d8d3c8] rounded-lg text-[13px] text-[#0f0f0d]/50 hover:text-[#0f0f0d] hover:border-[#0f0f0d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={14} /> Add Review
      </button>
      <SaveButton onClick={handleSave} saving={saving} />
    </div>
  );
}

function ServiceAreaEditForm() {
  const { rawData, saveSection, saving, setEditing } = useEditor();
  const sa = rawData?.serviceArea || {};
  const [form, setForm] = useState({
    hqAddress: sa.hqAddress || "",
    hqLat: String(sa.hqLat || ""),
    hqLng: String(sa.hqLng || ""),
    description: sa.description || "",
    mapEmbedUrl: sa.mapEmbedUrl || "",
  });

  const handleSave = async () => {
    const ok = await saveSection("servicearea", {
      ...form,
      hqLat: parseFloat(form.hqLat) || 0,
      hqLng: parseFloat(form.hqLng) || 0,
    });
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Field label="HQ Address" value={form.hqAddress} onChange={(v) => setForm({ ...form, hqAddress: v })} placeholder="33 Ubi Ave 3, Singapore 408868" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" value={form.hqLat} onChange={(v) => setForm({ ...form, hqLat: v })} placeholder="1.3271" />
        <Field label="Longitude" value={form.hqLng} onChange={(v) => setForm({ ...form, hqLng: v })} placeholder="103.8918" />
      </div>
      <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
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
    localStorage.removeItem("designer-slug");
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
    return transformApiData(blankProfile);
  }, [rawData, slug]);

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

  const editSaveCollection = (section: string, data: any) => saveSection(section, data);

  return (
    <EditorContext.Provider value={{ editing, setEditing, saving, rawData, slug, saveSection, refetchData: fetchData }}>
      <DesignerDataContext.Provider value={ctxValue}>
        <ProfileEditContext.Provider value={{ save: editSave, saveCollection: editSaveCollection, uploadImage: editUpload }}>
        <Toaster position="top-right" richColors />

        <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]" style={{ color: C.black }}>
          {/* Floating editor toolbar */}
          <div
            className="fixed top-4 right-4 md:right-6 z-[60] flex items-center gap-2 px-3 py-2"
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
            <div className="max-w-[1293px] mx-auto px-4 md:px-8">
              {/* Hero + Profile — fully inline (click any text/image to edit) */}
              <HeroSection />

              {/* Stats */}
              <div className="mt-6 md:mt-8 lg:max-w-[790px]">
                <EditableSection sectionKey="stats" label="Stats" icon={Star}>
                  <StatsRow />
                  <StatsEditForm />
                </EditableSection>
              </div>

              {/* Bio — click text to edit inline */}
              <div className="mt-6 lg:max-w-[768px]">
                <BioText />
              </div>

              {/* Team Avatars — fully inline (use the + tiles to add members / stories) */}
              <div className="mt-6">
                <TeamAvatars />
              </div>

              {/* Trusted Since */}
              <div className="mt-8 md:mt-12">
                <EditableSection sectionKey="trustedsince" label="Trusted Since" icon={Building2}>
                  <TrustedSince />
                  <TrustedSinceEditForm />
                </EditableSection>
              </div>

              {/* Projects — fully inline (use the + tile to add a project) */}
              <div className="mt-12 md:mt-16">
                <InlineProjects />
              </div>
            </div>

            {/* Business Info / Trust & Credentials — credentials uses inline pencil + form, business info is inline-editable */}
            <div className="mt-12 md:mt-16">
              <TrustCredentials />
            </div>

            {/* Case Studies — fully inline (use the + tile to add a phase) */}
            <div className="mt-0">
              <CaseStudies />
            </div>

            {/* What Homeowners Say */}
            <div className="mt-0">
              <EditableSection sectionKey="latestreviews" label="Latest Reviews" icon={MessageSquare}>
                <HomeownersSay />
                <LatestReviewsEditForm />
              </EditableSection>
            </div>

            {/* Google Review Cards */}
            <div className="mt-0">
              <EditableSection sectionKey="reviews" label="Google Reviews" icon={Star}>
                <GoogleReviewCards />
                <ReviewsEditForm />
              </EditableSection>
            </div>

            {/* Service Area */}
            <div className="mt-0">
              <EditableSection sectionKey="servicearea" label="Service Area" icon={MapPin}>
                <ServiceArea />
                <ServiceAreaEditForm />
              </EditableSection>
            </div>
          </main>
        </div>
        </ProfileEditContext.Provider>
      </DesignerDataContext.Provider>
    </EditorContext.Provider>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────

export function DesignerProfileEditor() {
  const [authed, setAuthed] = useState(false);
  const [slug, setSlug] = useState("");
  const [checking, setChecking] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("designer-token");
    const savedSlug = localStorage.getItem("designer-slug");
    if (!token || !savedSlug) { setChecking(false); return; }

    fetch(`${API}/portal-session`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "X-Designer-Token": token,
      },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.valid) {
          setAuthed(true);
          setSlug(json.slug || savedSlug);
        } else {
          localStorage.removeItem("designer-token");
          localStorage.removeItem("designer-slug");
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

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
        onLogin={(token, s) => {
          setAuthed(true);
          setSlug(s);
        }}
      />
    );
  }

  return <EditorView slug={slug} />;
}

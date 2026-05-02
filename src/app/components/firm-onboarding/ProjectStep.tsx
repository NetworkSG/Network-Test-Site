import { useEffect, useState } from "react";
import { C, serif, sans } from "../homepage/v8/primitives";
import {
  Hammer,
  Layers,
  Square as SquareIcon,
  Wind,
  Zap,
  Droplet,
  Paintbrush,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { ProjectSubmission, previewDriveFolder } from "./onboardingApi";

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

function formatCost(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return "$" + Number(digits).toLocaleString("en-US");
}
function parseSizeDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
function formatSizeNumber(raw: string): string {
  const digits = parseSizeDigits(raw);
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}
function buildSizeString(num: string): string {
  if (!num) return "sqm";
  return `${num} sqm`;
}

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
const selectBgImg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9790' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

function isValidDriveUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!/^https:\/\//i.test(trimmed)) return false;
  return /(drive\.google\.com|docs\.google\.com|photos\.app\.goo\.gl|photos\.google\.com)/i.test(trimmed);
}

export function validateProject(p: ProjectSubmission): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.title.trim()) e.title = "Project title is required";
  if (!p.location.trim()) e.location = "Location is required";
  if (p.year.trim() && p.year.length !== 4) e.year = "Enter a 4-digit year";
  if (!p.style.trim()) e.style = "Interior style is required";
  if (!isValidDriveUrl(p.driveUrl))
    e.driveUrl = "Paste a Google Drive, Docs, or Photos share link (must start with https://)";
  return e;
}

export function ProjectStep({
  value,
  onChange,
  submitAttempted,
}: {
  value: ProjectSubmission;
  onChange: (v: ProjectSubmission) => void;
  submitAttempted: boolean;
}) {
  const errors = submitAttempted ? validateProject(value) : {};

  const patch = (p: Partial<ProjectSubmission>) => onChange({ ...value, ...p });

  const toggleWork = (key: string) =>
    onChange({
      ...value,
      worksIncluded: value.worksIncluded.includes(key)
        ? value.worksIncluded.filter((k) => k !== key)
        : [...value.worksIncluded, key],
    });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          className="font-normal leading-[1.15] mb-2"
          style={{ fontFamily: serif, color: C.black, fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "-0.01em" }}
        >
          Submit a project
        </h2>
        <p className="text-[14px] leading-[1.6]" style={{ color: C.gray, fontFamily: sans }}>
          Share one completed project. You can add more anytime from your dashboard.
        </p>
      </div>

      {/* Google Drive link */}
      <div>
        <label style={labelStyle}>
          Project Photos · Google Drive Link <span style={{ color: "#c14" }}>*</span>
        </label>
        <input
          type="url"
          value={value.driveUrl}
          placeholder="https://drive.google.com/…"
          onChange={(e) => patch({ driveUrl: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        <p className="mt-1 text-[11px]" style={{ color: C.grayLight, fontFamily: sans }}>
          Paste a shareable link to the project folder. Make sure link access is set to <strong>Anyone with the link</strong>.
        </p>
        {errors.driveUrl && <p className="text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.driveUrl}</p>}
        <DriveFolderPreview url={value.driveUrl} />
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>
          Project Title <span style={{ color: "#c14" }}>*</span>
        </label>
        <input
          type="text"
          value={value.title}
          placeholder="e.g. The Aldrich Residence"
          onChange={(e) => patch({ title: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        {errors.title && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.title}</p>}
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>
          Location <span style={{ color: "#c14" }}>*</span>
        </label>
        <input
          type="text"
          value={value.location}
          placeholder="e.g. Orchard Road, Singapore"
          onChange={(e) => patch({ location: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
        />
        {errors.location && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.location}</p>}
      </div>

      {/* Cost + Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>
            Renovation Cost
          </label>
          <input
            type="text"
            value={value.cost}
            placeholder="e.g. $120,000"
            onChange={(e) => patch({ cost: formatCost(e.target.value) })}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
          />
          {errors.cost && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.cost}</p>}
        </div>
        <div>
          <label style={labelStyle}>Area Size</label>
          <div className="flex gap-0">
            <input
              type="text"
              value={formatSizeNumber(value.size)}
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
          {errors.size && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.size}</p>}
        </div>
      </div>

      {/* Property type + year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>
            Property Type
          </label>
          <select
            value={value.propertyType}
            onChange={(e) => patch({ propertyType: e.target.value })}
            style={{ ...inputStyle, appearance: "none", paddingRight: "36px", backgroundImage: selectBgImg, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
          >
            <option value="">Select type…</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.propertyType && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.propertyType}</p>}
        </div>
        <div>
          <label style={labelStyle}>
            Year of Completion
          </label>
          <input
            type="number"
            value={value.year}
            placeholder="e.g. 2024"
            min={1990}
            max={2100}
            onChange={(e) => patch({ year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
          />
          {errors.year && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.year}</p>}
        </div>
      </div>

      {/* Sub-type + style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Property Sub-type</label>
          <input
            type="text"
            value={value.propertySubType}
            placeholder="e.g. Resale, BTO, 5-Room"
            onChange={(e) => patch({ propertySubType: e.target.value })}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Interior Style <span style={{ color: "#c14" }}>*</span>
          </label>
          <input
            type="text"
            value={value.style}
            placeholder="e.g. Modern Luxe"
            onChange={(e) => patch({ style: e.target.value })}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.black; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.creamBorder; }}
          />
          {errors.style && <p className="mt-1.5 text-[11px]" style={{ color: "#c14", fontFamily: sans }}>{errors.style}</p>}
        </div>
      </div>

      {/* Works included */}
      <div>
        <label style={labelStyle}>Works Included</label>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ border: `1px solid ${C.creamBorder}`, borderRadius: "10px", overflow: "hidden" }}>
          {AVAILABLE_WORKS.map(({ key, icon: Icon, label }, i) => {
            const isYes = value.worksIncluded.includes(key);
            const setYes = () => {
              if (!isYes) patch({ worksIncluded: [...value.worksIncluded, key] });
            };
            const setNo = () => {
              if (isYes) patch({ worksIncluded: value.worksIncluded.filter((k) => k !== key) });
            };
            const pillStyle = (active: boolean) => ({
              padding: "4px 12px",
              fontSize: "11px",
              fontFamily: sans,
              fontWeight: 500,
              background: active ? C.black : "transparent",
              color: active ? C.white : C.gray,
              border: `1px solid ${active ? C.black : C.creamBorder}`,
              borderRadius: "999px",
              cursor: "pointer",
              transition: "background-color 150ms, color 150ms, border-color 150ms",
            });
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{
                  background: C.white,
                  borderTop: i < 2 ? "none" : `1px solid ${C.creamBorder}`,
                  borderLeft: i % 2 === 1 ? `1px solid ${C.creamBorder}` : "none",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} strokeWidth={1.6} style={{ color: C.black }} />
                  <span className="text-[13px]" style={{ color: C.black, fontFamily: sans }}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={setYes} style={pillStyle(isYes)}>Yes</button>
                  <button type="button" onClick={setNo} style={pillStyle(!isYes)}>No</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Inline grid that previews the images in a Drive folder as the firm types
// the URL. Debounced by 600ms; errors render inline. Image bytes aren't
// downloaded — Drive's public thumbnail endpoint is used.
function DriveFolderPreview({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<{ id: string; name: string; thumbnailUrl: string }[]>([]);

  useEffect(() => {
    const trimmed = url.trim();
    // Only preview when it looks like a Drive folder link.
    const isFolder = /drive\.google\.com/i.test(trimmed) && (/\/folders\//.test(trimmed) || /[?&]id=/.test(trimmed));
    if (!isFolder) { setStatus("idle"); setMessage(""); setImages([]); return; }
    setStatus("loading");
    setMessage("");
    const t = setTimeout(async () => {
      const res = await previewDriveFolder(trimmed);
      if (res.ok) {
        setStatus("ready");
        setImages(res.images);
        setMessage(`${res.count} image${res.count === 1 ? "" : "s"} found`);
      } else {
        setStatus("error");
        setImages([]);
        setMessage(res.message);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [url]);

  if (status === "idle") return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 11, color: C.grayLight, fontFamily: sans, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {status === "loading" ? "Loading preview…" : status === "error" ? "Preview unavailable" : "Preview"}
        </span>
        {status !== "loading" && (
          <span style={{ fontSize: 11, color: status === "error" ? "#c14" : C.grayLight, fontFamily: sans }}>
            {message}
          </span>
        )}
      </div>

      {status === "loading" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0" }}>
          <Loader2 size={14} className="animate-spin" style={{ color: C.grayLight }} />
          <span style={{ fontSize: 12, color: C.grayLight, fontFamily: sans }}>Checking Drive folder…</span>
        </div>
      )}

      {status === "ready" && images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: 8,
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              title={img.name}
              style={{
                aspectRatio: "1 / 1",
                background: C.cream,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <img
                src={img.thumbnailUrl}
                alt={img.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

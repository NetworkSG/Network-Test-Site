import { useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { C, sans, serif } from "../homepage/v8/primitives";
import { OnboardingShell } from "../firm-onboarding/OnboardingShell";
import {
  Hammer,
  Layers,
  Square as SquareIcon,
  Wind,
  Zap,
  Droplet,
  Paintbrush,
  Lightbulb,
} from "lucide-react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type ImportedProject = {
  title: string;
  location: string;
  cost: string;
  size: string;
  sizeUnit: string;
  year: string;
  propertyType: string;
  propertySubType: string;
  style: string;
  worksIncluded: string[];
  driveUrl: string;
  images: string[];
  sourceUrl: string;
};

type ScrapeResult = {
  ok: boolean;
  url?: string;
  kind?: "firm" | "project" | "unknown";
  status?: number;
  elapsedMs?: number;
  firm?: { name: string; qanvastId?: string } | null;
  imported?: ImportedProject[];
  message?: string;
};

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

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: C.grayLight,
  fontFamily: sans,
  display: "block",
  marginBottom: 6,
};

const readonlyInputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: C.white,
  border: `1px solid ${C.creamBorder}`,
  borderRadius: 10,
  color: C.black,
  fontFamily: sans,
  fontSize: 14,
  outline: "none",
};

function Field({
  label,
  value,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: "#c14" }}>*</span>}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        style={{
          ...readonlyInputStyle,
          color: value ? C.black : C.grayLight,
          background: value ? C.white : C.cream,
        }}
      />
    </div>
  );
}

function SizeField({ size, unit }: { size: string; unit: string }) {
  return (
    <div>
      <label style={labelStyle}>
        Area Size <span style={{ color: "#c14" }}>*</span>
      </label>
      <div style={{ display: "flex", gap: 0 }}>
        <input
          type="text"
          value={size}
          readOnly
          placeholder="e.g. 1,450"
          style={{
            ...readonlyInputStyle,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderRight: "none",
            color: size ? C.black : C.grayLight,
            background: size ? C.white : C.cream,
          }}
        />
        <div
          style={{
            height: 44,
            padding: "0 16px",
            background: C.white,
            border: `1px solid ${C.creamBorder}`,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            display: "flex",
            alignItems: "center",
            color: C.black,
            fontFamily: sans,
            fontSize: 14,
            minWidth: 80,
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>{unit || "sqft"}</span>
          <span style={{ color: C.grayLight, fontSize: 10 }}>▾</span>
        </div>
      </div>
    </div>
  );
}

function PropertyTypeField({ value }: { value: string }) {
  return (
    <div>
      <label style={labelStyle}>
        Property Type <span style={{ color: "#c14" }}>*</span>
      </label>
      <div
        style={{
          ...readonlyInputStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: value ? C.black : C.grayLight,
          background: value ? C.white : C.cream,
        }}
      >
        <span>{value || "Select type…"}</span>
        <span style={{ color: C.grayLight, fontSize: 10 }}>▾</span>
      </div>
    </div>
  );
}

function WorkToggle({
  icon: Icon,
  label,
  on,
}: {
  icon: any;
  label: string;
  on: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: C.white,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: 10,
        padding: "10px 14px",
        minHeight: 48,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={16} color={C.black} strokeWidth={1.6} />
        <span style={{ fontFamily: sans, fontSize: 14, color: C.black }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "4px 12px",
            borderRadius: 999,
            background: on ? C.black : "transparent",
            color: on ? C.white : C.grayLight,
            border: on ? "none" : `1px solid ${C.creamBorder}`,
          }}
        >
          Yes
        </span>
        <span
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            padding: "4px 12px",
            borderRadius: 999,
            background: !on ? C.black : "transparent",
            color: !on ? C.white : C.grayLight,
            border: !on ? "none" : `1px solid ${C.creamBorder}`,
          }}
        >
          No
        </span>
      </div>
    </div>
  );
}

export function QanvastImportTest() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/qanvast-scrape`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res
        .json()
        .catch(() => ({ ok: false, message: `Bad JSON (${res.status})` }));
      setResult(json);
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Network error" });
    }
    setLoading(false);
  };

  const p = result?.ok ? result.imported?.[0] : undefined;

  return (
    <OnboardingShell eyebrow="Dev Tool — Qanvast Import">
      <div style={{ fontFamily: sans }}>
        <h1
          style={{
            fontFamily: serif,
            color: C.black,
            fontSize: "clamp(28px, 3.5vw, 40px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            marginBottom: 8,
          }}
        >
          Paste a Qanvast URL
        </h1>
        <p
          style={{
            color: C.gray,
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Fetches a Qanvast project and pre-fills the firm-onboarding form
          below. Preview only — nothing is saved.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && run()}
            placeholder="https://qanvast.com/sg/..."
            style={{
              flex: "1 1 340px",
              height: 44,
              padding: "0 14px",
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: 10,
              color: C.black,
              fontFamily: sans,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={run}
            disabled={loading || !url.trim()}
            style={{
              height: 44,
              padding: "0 22px",
              background: C.black,
              color: C.white,
              border: "none",
              borderRadius: 10,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: loading || !url.trim() ? "not-allowed" : "pointer",
              opacity: loading || !url.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Fetching…" : "Fetch & Parse"}
          </button>
        </div>

        {result && !result.ok && (
          <div
            style={{
              color: "#c14",
              fontSize: 13,
              fontFamily: sans,
              padding: 12,
              background: C.cream,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: 10,
            }}
          >
            Error: {result.message || "unknown"}
          </div>
        )}

        {p && (
          <>
            {/* Form preview */}
            <div
              style={{
                background: C.cream,
                border: `1px solid ${C.creamBorder}`,
                borderRadius: 14,
                padding: 24,
                display: "grid",
                gap: 18,
              }}
            >
              <Field
                label="Project Title"
                value={p.title}
                placeholder="e.g. The Aldrich Residence"
                required
              />
              <Field
                label="Location"
                value={p.location}
                placeholder="e.g. Orchard Road, Singapore"
                required
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field
                  label="Renovation Cost"
                  value={p.cost}
                  placeholder="e.g. $120,000"
                  required
                />
                <SizeField size={p.size} unit={p.sizeUnit} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                }}
              >
                <PropertyTypeField value={p.propertyType} />
                <Field
                  label="Year of Completion"
                  value={p.year}
                  placeholder="e.g. 2024"
                  required
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                }}
              >
                <Field
                  label="Property Sub-Type"
                  value={p.propertySubType}
                  placeholder="e.g. Resale, BTO, 5-Room"
                />
                <Field
                  label="Interior Style"
                  value={p.style}
                  placeholder="e.g. Modern Luxe"
                  required
                />
              </div>

              {/* Works */}
              <div>
                <label style={labelStyle}>Works Included</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 10,
                  }}
                >
                  {AVAILABLE_WORKS.map((w) => (
                    <WorkToggle
                      key={w.key}
                      icon={w.icon}
                      label={w.label}
                      on={(p.worksIncluded || []).includes(w.key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Photos */}
            {(() => {
              const imgs720 = (p.images || []).filter((src) => /\/720-width(?:$|\?)/.test(src));
              return imgs720.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <label style={labelStyle}>Project Photos</label>
                  <span
                    style={{
                      fontSize: 12,
                      color: C.grayLight,
                      fontFamily: sans,
                    }}
                  >
                    {imgs720.length} found
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {imgs720.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading="lazy"
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: 10,
                        background: C.cream,
                        border: `1px solid ${C.creamBorder}`,
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.2";
                      }}
                    />
                  ))}
                </div>
              </div>
            );
            })()}
          </>
        )}
      </div>
    </OnboardingShell>
  );
}

export default QanvastImportTest;

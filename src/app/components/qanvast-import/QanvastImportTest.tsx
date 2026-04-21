import { useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { C, sans, serif } from "../homepage/v8/primitives";
import { OnboardingShell } from "../firm-onboarding/OnboardingShell";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type ScrapeResult = {
  ok: boolean;
  url?: string;
  kind?: "firm" | "project" | "unknown";
  status?: number;
  elapsedMs?: number;
  firm?: { name: string; qanvastId?: string } | null;
  projects?: Array<{
    title: string;
    description: string;
    homeType?: string;
    budget?: string;
    size?: string;
    year?: string;
    rooms?: string;
    style?: string;
    images: string[];
    sourceUrl: string;
  }>;
  imported?: Array<{
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
  }>;
  raw?: any;
  message?: string;
};

export function QanvastImportTest() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`${API}/qanvast-scrape`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json().catch(() => ({ ok: false, message: `Bad JSON (${res.status})` }));
      setResult(json);
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Network error" });
    }
    setLoading(false);
  };

  const copyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

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
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Diagnostic tool — fetches a firm or project page from qanvast.com server-side, parses it,
          and shows what we can extract. Nothing is saved.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && run()}
            placeholder="https://qanvast.com/sg/firm/..."
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

        {result && (
          <div style={{ color: C.grayLight, fontSize: 12, marginBottom: 20, fontFamily: sans }}>
            {result.ok ? (
              <>
                <strong style={{ color: C.black }}>{result.kind?.toUpperCase()}</strong> ·{" "}
                {result.projects?.length ?? 0} project{(result.projects?.length ?? 0) === 1 ? "" : "s"} ·{" "}
                HTTP {result.status} · {result.elapsedMs}ms ·{" "}
                Next.js data: {result.raw?.hasNextData ? "yes" : "no"} · {result.raw?.imageCount ?? 0} images
              </>
            ) : (
              <span style={{ color: "#c14" }}>Error: {result.message || "unknown"}</span>
            )}
          </div>
        )}

        {result?.ok && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
            {/* Firm summary */}
            {result.firm && (
              <div style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, marginBottom: 6 }}>
                  Firm
                </div>
                <div style={{ fontFamily: serif, fontSize: 24, color: C.black }}>{result.firm.name}</div>
                {result.firm.qanvastId && (
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Qanvast ID: {result.firm.qanvastId}</div>
                )}
              </div>
            )}

            {/* Projects */}
            {(result.projects ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, marginBottom: 10 }}>
                  Parsed projects ({result.projects!.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                  {result.projects!.map((p, i) => (
                    <div key={i} style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontFamily: serif, fontSize: 18, color: C.black, marginBottom: 8, lineHeight: 1.3 }}>
                        {p.title || "(untitled)"}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        {[p.homeType, p.budget, p.size, p.year, p.rooms, p.style].filter(Boolean).map((chip, j) => (
                          <span key={j} style={{
                            fontSize: 11, padding: "3px 8px", borderRadius: 999,
                            background: C.cream, border: `1px solid ${C.creamBorder}`, color: C.gray,
                          }}>
                            {String(chip)}
                          </span>
                        ))}
                      </div>
                      {p.description && (
                        <p style={{ fontSize: 12, color: C.gray, lineHeight: 1.5, marginBottom: 10 }}>
                          {p.description.slice(0, 200)}{p.description.length > 200 ? "…" : ""}
                        </p>
                      )}
                      {p.images?.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                          {p.images.slice(0, 6).map((src, j) => (
                            <img
                              key={j}
                              src={src}
                              alt=""
                              loading="lazy"
                              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 6, background: C.cream }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready-to-import payload — shaped like ProjectSubmission */}
            {(result.imported ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, marginBottom: 10 }}>
                  Mapped → firm-onboarding/project fields
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  {result.imported!.map((p, i) => {
                    const rows: Array<[string, string]> = [
                      ["Title", p.title],
                      ["Location", p.location],
                      ["Cost", p.cost],
                      ["Size", p.size ? `${p.size} ${p.sizeUnit}` : ""],
                      ["Year", p.year],
                      ["Property type", p.propertyType],
                      ["Sub-type", p.propertySubType],
                      ["Style", p.style],
                      ["Works", (p.worksIncluded || []).join(", ")],
                      ["Drive URL", p.driveUrl],
                      ["Images", `${p.images?.length || 0} found`],
                      ["Source", p.sourceUrl],
                    ];
                    return (
                      <div key={i} style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "6px 14px", fontSize: 13 }}>
                          {rows.flatMap(([label, value]) => [
                            <div key={label + "-l"} style={{ color: C.grayLight, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", paddingTop: 2 }}>
                              {label}
                            </div>,
                            <div key={label + "-v"} style={{ color: value ? C.black : "#c14", wordBreak: "break-all", fontFamily: sans }}>
                              {value || <em style={{ color: "#c14", fontStyle: "normal", fontSize: 12 }}>— missing —</em>}
                            </div>,
                          ])}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight }}>
                  Raw response
                </div>
                <button
                  onClick={copyJson}
                  style={{
                    fontSize: 11, padding: "5px 10px", borderRadius: 6,
                    background: C.white, border: `1px solid ${C.creamBorder}`,
                    color: C.black, cursor: "pointer", fontFamily: sans, fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}
                >
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre style={{
                background: "#0f0f0d", color: "#e8e4db", padding: 16, borderRadius: 10,
                fontSize: 11, lineHeight: 1.5, overflow: "auto", maxHeight: 480,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}

export default QanvastImportTest;

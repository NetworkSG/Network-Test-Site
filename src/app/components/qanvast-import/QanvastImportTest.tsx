import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { C, sans, serif } from "../homepage/v8/primitives";
import { OnboardingShell } from "../firm-onboarding/OnboardingShell";
import { FirmCombobox } from "../firm-onboarding/FirmCombobox";
import { listAirtableFirms, submitOnboarding } from "../firm-onboarding/onboardingApi";
import { classifyFloorPlan } from "../../utils/floor-plan-detect";
import {
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
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
  floorPlan?: string;
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

type JobStatus = "pending" | "fetching" | "saving" | "done" | "error";

type Job = {
  url: string;
  status: JobStatus;
  project?: ImportedProject;
  error?: string;
};

const CONCURRENCY = 2;

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

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: C.grayLight,
  fetching: "#b8860b",
  saving: "#b8860b",
  done: "#1f7a3a",
  error: "#c14",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Queued",
  fetching: "Fetching…",
  saving: "Saving…",
  done: "Saved",
  error: "Failed",
};

function parseUrls(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"));
}

export function QanvastImportTest() {
  const [rawText, setRawText] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const abortRef = useRef(false);

  const [recordId, setRecordId] = useState("");
  const [firmName, setFirmName] = useState("");
  const [firmEmail, setFirmEmail] = useState("");
  const [firmRefreshKey, setFirmRefreshKey] = useState(0);

  useEffect(() => {
    if (!recordId) { setFirmEmail(""); return; }
    let cancelled = false;
    (async () => {
      try {
        const firms = await listAirtableFirms();
        if (cancelled) return;
        const hit = firms.find((f) => f.id === recordId);
        setFirmEmail(hit?.contactEmail || "");
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [recordId]);

  const urls = useMemo(() => parseUrls(rawText), [rawText]);

  const counts = useMemo(() => {
    const c = { done: 0, error: 0, total: jobs.length };
    for (const j of jobs) {
      if (j.status === "done") c.done++;
      if (j.status === "error") c.error++;
    }
    return c;
  }, [jobs]);

  const processAll = useCallback(async () => {
    if (!recordId || !firmEmail) return;
    abortRef.current = false;
    const urlList = parseUrls(rawText);
    if (!urlList.length) return;

    const initial: Job[] = urlList.map((u) => ({ url: u, status: "pending" }));
    setJobs(initial);
    setRunning(true);

    const update = (idx: number, patch: Partial<Job>) =>
      setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, ...patch } : j)));

    const processOne = async (idx: number) => {
      if (abortRef.current) return;
      update(idx, { status: "fetching" });

      try {
        const res = await fetch(`${API}/qanvast-scrape`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: urlList[idx] }),
        });
        const json: ScrapeResult = await res
          .json()
          .catch(() => ({ ok: false, message: `Bad JSON (${res.status})` }));

        if (!json.ok || !json.imported?.[0]) {
          update(idx, { status: "error", error: json.message || "No project data returned" });
          return;
        }

        const p = json.imported[0];
        update(idx, { status: "saving", project: p });

        if (abortRef.current) return;

        const imgsWidth = (p.images || []).filter((src) => /\/\d+-width(?:$|\?)/.test(src));
        const baseImages = imgsWidth.length ? imgsWidth : (p.images || []).slice(0, 30);

        let detectedFloorPlan = p.floorPlan || "";
        if (!detectedFloorPlan) {
          const verdicts = await Promise.all(
            baseImages.slice(0, 8).map(async (u) => ({ u, fp: await classifyFloorPlan(u) }))
          );
          detectedFloorPlan = verdicts.find((v) => v.fp)?.u || "";
        }

        const imagesToMirror = detectedFloorPlan
          ? baseImages.filter((u) => u !== detectedFloorPlan)
          : baseImages;

        await submitOnboarding({
          variant: "project-only",
          contactEmail: firmEmail,
          firmName,
          airtableRecordId: recordId,
          project: {
            title: p.title,
            location: p.location,
            cost: p.cost,
            size: p.size,
            sizeUnit: p.sizeUnit,
            year: p.year,
            propertyType: p.propertyType,
            propertySubType: p.propertySubType,
            style: p.style,
            worksIncluded: p.worksIncluded || [],
            driveUrl: p.sourceUrl || urlList[idx],
            images: imagesToMirror,
            floorPlan: detectedFloorPlan,
            sourceUrl: p.sourceUrl || urlList[idx],
          } as any,
        });

        update(idx, { status: "done" });
      } catch (err: any) {
        update(idx, { status: "error", error: err?.message || "Network error" });
      }
    };

    // Process with concurrency limit
    let next = 0;
    const total = urlList.length;
    const run = async () => {
      while (next < total && !abortRef.current) {
        const idx = next++;
        await processOne(idx);
      }
    };
    const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => run());
    await Promise.all(workers);

    setRunning(false);
  }, [rawText, recordId, firmName, firmEmail]);

  const stop = () => {
    abortRef.current = true;
  };

  const canStart = urls.length > 0 && !!recordId && !!firmEmail && !running;
  const hasResults = jobs.length > 0;

  return (
    <OnboardingShell eyebrow="Dev Tool — Qanvast Bulk Import">
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
          Bulk Qanvast Import
        </h1>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Paste project URLs (one per line), pick the firm, then hit start.
          Each project is fetched, parsed, and saved automatically.
        </p>

        {/* ── Step 1: URLs ── */}
        <div
          style={{
            background: C.cream,
            border: `1px solid ${C.creamBorder}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <label style={labelStyle}>
            Project URLs{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              — {urls.length} link{urls.length !== 1 ? "s" : ""} detected
            </span>
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              "https://qanvast.com/sg/interior-design-singapore/...\nhttps://qanvast.com/sg/interior-design-singapore/...\nhttps://qanvast.com/sg/interior-design-singapore/..."
            }
            disabled={running}
            rows={8}
            style={{
              width: "100%",
              padding: 14,
              background: C.white,
              border: `1px solid ${C.creamBorder}`,
              borderRadius: 10,
              color: C.black,
              fontFamily: sans,
              fontSize: 13,
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {/* ── Step 2: Firm ── */}
        <div
          style={{
            background: C.cream,
            border: `1px solid ${C.creamBorder}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={labelStyle}>
              Firm on ID Profiles <span style={{ color: "#c14" }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setFirmRefreshKey((k) => k + 1)}
              title="Refresh firms list"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: C.grayLight,
                fontFamily: sans,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          <FirmCombobox
            key={firmRefreshKey}
            value={firmName}
            recordId={recordId}
            onSelect={(id, name) => {
              setRecordId(id);
              setFirmName(name);
            }}
          />
          <p style={{ marginTop: 6, fontSize: 11, color: C.grayLight, fontFamily: sans }}>
            {recordId
              ? firmEmail
                ? `Matched. Contact: ${firmEmail}`
                : "Matched — no contact email on record."
              : "Pick the firm first. All projects will be saved under this firm."}
          </p>
        </div>

        {/* ── Start / Stop ── */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
          {!running ? (
            <button
              onClick={processAll}
              disabled={!canStart}
              style={{
                height: 44,
                padding: "0 28px",
                background: C.black,
                color: C.white,
                border: "none",
                borderRadius: 10,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: canStart ? "pointer" : "not-allowed",
                opacity: canStart ? 1 : 0.5,
              }}
            >
              Fetch &amp; Save All ({urls.length})
            </button>
          ) : (
            <button
              onClick={stop}
              style={{
                height: 44,
                padding: "0 28px",
                background: "#c14",
                color: C.white,
                border: "none",
                borderRadius: 10,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Stop
            </button>
          )}

          {hasResults && (
            <span style={{ fontSize: 13, color: C.gray, fontFamily: sans }}>
              {counts.done} saved
              {counts.error > 0 && <span style={{ color: "#c14" }}> · {counts.error} failed</span>}
              {" "}/ {counts.total}
            </span>
          )}
        </div>

        {/* ── Progress bar ── */}
        {hasResults && (
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: C.creamBorder,
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background: counts.error > 0 ? "#c14" : "#1f7a3a",
                width: `${((counts.done + counts.error) / Math.max(counts.total, 1)) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* ── Job list ── */}
        {hasResults && (
          <div style={{ display: "grid", gap: 6 }}>
            {jobs.map((job, idx) => {
              const expanded = expandedIdx === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.creamBorder}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {/* Row header */}
                  <div
                    onClick={() => setExpandedIdx(expanded ? null : idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <StatusIcon status={job.status} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: sans,
                        fontSize: 13,
                        color: C.black,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {job.project?.title || shortenUrl(job.url)}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: STATUS_COLORS[job.status],
                        fontFamily: sans,
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}
                    >
                      {STATUS_LABELS[job.status]}
                    </span>
                    {expanded ? (
                      <ChevronUp size={14} color={C.grayLight} />
                    ) : (
                      <ChevronDown size={14} color={C.grayLight} />
                    )}
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div
                      style={{
                        padding: "0 14px 14px",
                        borderTop: `1px solid ${C.creamBorder}`,
                        paddingTop: 12,
                      }}
                    >
                      <div style={{ fontSize: 12, fontFamily: sans, color: C.gray, marginBottom: 6 }}>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.gray, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          {job.url} <ExternalLink size={10} />
                        </a>
                      </div>
                      {job.error && (
                        <p style={{ fontSize: 12, color: "#c14", fontFamily: sans }}>{job.error}</p>
                      )}
                      {job.project && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "6px 16px",
                            fontSize: 12,
                            fontFamily: sans,
                            color: C.gray,
                          }}
                        >
                          <Detail label="Location" value={job.project.location} />
                          <Detail label="Cost" value={job.project.cost} />
                          <Detail label="Size" value={`${job.project.size} ${job.project.sizeUnit}`} />
                          <Detail label="Type" value={job.project.propertyType} />
                          <Detail label="Style" value={job.project.style} />
                          <Detail label="Year" value={job.project.year} />
                          <Detail label="Photos" value={`${(job.project.images || []).length}`} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OnboardingShell>
  );
}

function StatusIcon({ status }: { status: JobStatus }) {
  if (status === "done")
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#e8f5ec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={12} color="#1f7a3a" strokeWidth={3} />
      </div>
    );
  if (status === "error")
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fde8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertCircle size={12} color="#c14" strokeWidth={2.5} />
      </div>
    );
  if (status === "fetching" || status === "saving")
    return <Loader2 size={18} className="animate-spin" style={{ color: "#b8860b", flexShrink: 0 }} />;
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: C.cream,
        border: `1px solid ${C.creamBorder}`,
        flexShrink: 0,
      }}
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value || value === "undefined") return null;
  return (
    <div>
      <span style={{ color: C.grayLight, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <br />
      <span style={{ color: C.black }}>{value}</span>
    </div>
  );
}

function shortenUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1]?.replace(/-/g, " ") || url;
  } catch {
    return url;
  }
}

export default QanvastImportTest;

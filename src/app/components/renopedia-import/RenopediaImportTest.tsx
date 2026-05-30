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
  status?: number;
  elapsedMs?: number;
  firm?: { name: string; url?: string } | null;
  imported?: ImportedProject[];
  message?: string;
};

type JobStatus = "pending" | "fetching" | "fetched" | "saving" | "done" | "error";

type Job = {
  url: string;
  status: JobStatus;
  project?: ImportedProject;
  scrapedFirm?: string;
  error?: string;
};

const CONCURRENCY = 2;

// Field options mirrored from the firm-onboarding project form.
const PROPERTY_TYPES = ["HDB", "Condominium", "Landed", "Commercial"];
const SIZE_UNITS = ["sqft", "sqm", "m²"];
const AVAILABLE_WORKS: { key: string; label: string }[] = [
  { key: "carpentry", label: "Carpentry" },
  { key: "feature-wall", label: "Feature Wall" },
  { key: "tiling", label: "Tiling" },
  { key: "aircon", label: "Aircon" },
  { key: "electrical", label: "Electrical Rewiring" },
  { key: "plumbing", label: "Plumbing" },
  { key: "painting", label: "Painting" },
  { key: "lighting", label: "Lighting" },
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

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: C.grayLight,
  fontFamily: sans,
  display: "block",
  marginBottom: 4,
};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: C.white,
  border: `1px solid ${C.creamBorder}`,
  borderRadius: 8,
  color: C.black,
  fontFamily: sans,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: C.grayLight,
  fetching: "#b8860b",
  fetched: "#1f6feb",
  saving: "#b8860b",
  done: "#1f7a3a",
  error: "#c14",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Queued",
  fetching: "Fetching…",
  fetched: "Ready — review & save",
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

export function RenopediaImportTest() {
  const [rawText, setRawText] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(false);
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
    const c = { done: 0, error: 0, fetched: 0, total: jobs.length };
    for (const j of jobs) {
      if (j.status === "done") c.done++;
      if (j.status === "error") c.error++;
      if (j.status === "fetched" || j.status === "saving") c.fetched++;
    }
    return c;
  }, [jobs]);

  const update = useCallback((idx: number, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, ...patch } : j))), []);

  // Edit a single field on a fetched project.
  const editField = useCallback((idx: number, key: keyof ImportedProject, value: any) => {
    setJobs((prev) => prev.map((j, i) =>
      i === idx && j.project ? { ...j, project: { ...j.project, [key]: value } } : j));
  }, []);

  const toggleWork = useCallback((idx: number, key: string) => {
    setJobs((prev) => prev.map((j, i) => {
      if (i !== idx || !j.project) return j;
      const set = new Set(j.project.worksIncluded || []);
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...j, project: { ...j.project, worksIncluded: Array.from(set) } };
    }));
  }, []);

  // Fetch a single URL by job index (used by Fetch All, Retry Failed, and the
  // per-row Retry button). Operates in place — never rebuilds the job list — so
  // edits/saves on other rows are preserved.
  const runFetchForIndex = useCallback(async (idx: number, url: string) => {
    update(idx, { status: "fetching", error: undefined });
    try {
      const res = await fetch(`${API}/renopedia-scrape`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const json: ScrapeResult = await res
        .json()
        .catch(() => ({ ok: false, message: `Bad JSON (${res.status})` }));

      if (!json.ok || !json.imported?.[0]) {
        update(idx, { status: "error", error: json.message || "No project data returned" });
        return false;
      }
      const p = json.imported[0];
      // Default the size unit so the dropdown isn't empty.
      if (!p.sizeUnit) p.sizeUnit = "sqft";
      update(idx, { status: "fetched", project: p, scrapedFirm: json.firm?.name });
      return true;
    } catch (err: any) {
      update(idx, { status: "error", error: err?.message || "Network error" });
      return false;
    }
  }, [update]);

  // Run a set of indices through the fetcher with a concurrency cap.
  const runBatch = useCallback(async (entries: { idx: number; url: string }[]) => {
    if (!entries.length) return;
    abortRef.current = false;
    setFetching(true);
    let next = 0;
    const run = async () => {
      while (next < entries.length && !abortRef.current) {
        const { idx, url } = entries[next++];
        await runFetchForIndex(idx, url);
      }
    };
    const workers = Array.from({ length: Math.min(CONCURRENCY, entries.length) }, () => run());
    await Promise.all(workers);
    setFetching(false);
  }, [runFetchForIndex]);

  // ── Step A: Fetch all URLs from the textarea (fresh run) ──
  const fetchAll = useCallback(async () => {
    const urlList = parseUrls(rawText);
    if (!urlList.length) return;
    const initial: Job[] = urlList.map((u) => ({ url: u, status: "pending" }));
    setJobs(initial);
    setExpandedIdx(null);
    await runBatch(urlList.map((url, idx) => ({ idx, url })));
    // Auto-open the first row to make editing discoverable.
    setExpandedIdx((cur) => (cur == null ? 0 : cur));
  }, [rawText, runBatch]);

  // Re-fetch ONLY the rows that failed — keeps fetched/edited/saved rows intact.
  const retryFailed = useCallback(async () => {
    const entries = jobs
      .map((j, idx) => ({ idx, url: j.url, status: j.status }))
      .filter((x) => x.status === "error")
      .map(({ idx, url }) => ({ idx, url }));
    await runBatch(entries);
  }, [jobs, runBatch]);

  // Re-fetch a single row.
  const refetchOne = useCallback(async (idx: number) => {
    const job = jobs[idx];
    if (!job) return;
    await runFetchForIndex(idx, job.url);
  }, [jobs, runFetchForIndex]);

  // ── Step B: Save one fetched (and possibly edited) project ──
  const saveOne = useCallback(async (idx: number) => {
    const job = jobs[idx];
    if (!job?.project) return;
    if (!recordId || !firmEmail) return;
    const p = job.project;
    update(idx, { status: "saving", error: undefined });
    try {
      const baseImages = (p.images || []).slice(0, 30);
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
          driveUrl: p.sourceUrl || job.url,
          images: imagesToMirror,
          floorPlan: detectedFloorPlan,
          sourceUrl: p.sourceUrl || job.url,
        } as any,
      });
      update(idx, { status: "done" });
    } catch (err: any) {
      update(idx, { status: "error", error: err?.message || "Save failed" });
    }
  }, [jobs, recordId, firmEmail, firmName, update]);

  const stop = () => { abortRef.current = true; };

  const canFetch = urls.length > 0 && !fetching;
  const canSave = !!recordId && !!firmEmail;
  const hasResults = jobs.length > 0;

  return (
    <OnboardingShell eyebrow="Dev Tool — Renopedia Bulk Import">
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
          Bulk Renopedia Import
        </h1>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Paste Renopedia inspiration URLs and <strong>Fetch</strong> them. Renopedia
          doesn’t expose every field, so open each result, fill in the missing
          details, then hit <strong>Save</strong> on that row.
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
              "https://renopedia.sg/inspirations/warm-japandi-contemporary-living/\nhttps://renopedia.sg/inspirations/minimalist-bto-home/\nhttps://renopedia.sg/inspirations/..."
            }
            disabled={fetching}
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
              : "Pick the firm before saving. All projects are saved under this firm."}
          </p>
        </div>

        {/* ── Fetch / Stop ── */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
          {!fetching ? (
            <button
              onClick={fetchAll}
              disabled={!canFetch}
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
                cursor: canFetch ? "pointer" : "not-allowed",
                opacity: canFetch ? 1 : 0.5,
              }}
            >
              Fetch All ({urls.length})
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

          {!fetching && counts.error > 0 && (
            <button
              onClick={retryFailed}
              style={{
                height: 44,
                padding: "0 20px",
                background: C.white,
                color: "#c14",
                border: "1px solid #c14",
                borderRadius: 10,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={13} /> Retry Failed ({counts.error})
            </button>
          )}

          {hasResults && (
            <span style={{ fontSize: 13, color: C.gray, fontFamily: sans }}>
              {counts.done} saved
              {counts.fetched > 0 && <span style={{ color: "#1f6feb" }}> · {counts.fetched} ready</span>}
              {counts.error > 0 && <span style={{ color: "#c14" }}> · {counts.error} failed</span>}
              {" "}/ {counts.total}
            </span>
          )}
        </div>

        {!canSave && hasResults && (
          <p style={{ fontSize: 12, color: "#b8860b", fontFamily: sans, marginBottom: 16 }}>
            Pick a firm above to enable the per-row Save buttons.
          </p>
        )}

        {/* ── Job list ── */}
        {hasResults && (
          <div style={{ display: "grid", gap: 6 }}>
            {jobs.map((job, idx) => {
              const expanded = expandedIdx === idx;
              const p = job.project;
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
                      {p?.title || shortenUrl(job.url)}
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

                  {/* Expanded details / editor */}
                  {expanded && (
                    <div
                      style={{
                        padding: "12px 14px 16px",
                        borderTop: `1px solid ${C.creamBorder}`,
                      }}
                    >
                      <div style={{ fontSize: 12, fontFamily: sans, color: C.gray, marginBottom: 10 }}>
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
                        <p style={{ fontSize: 12, color: "#c14", fontFamily: sans, marginBottom: 10 }}>{job.error}</p>
                      )}

                      {/* Per-row retry for failed fetches (e.g. Renopedia cache-warming). */}
                      {job.status === "error" && (
                        <button
                          onClick={() => refetchOne(idx)}
                          disabled={fetching}
                          style={{
                            height: 36,
                            padding: "0 18px",
                            background: C.white,
                            color: "#c14",
                            border: "1px solid #c14",
                            borderRadius: 9,
                            fontFamily: sans,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            cursor: fetching ? "not-allowed" : "pointer",
                            opacity: fetching ? 0.5 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <RefreshCw size={12} /> Retry Fetch
                        </button>
                      )}

                      {p && (
                        <>
                          {/* Read-only scraped summary */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                            <Pill label="Scraped firm" value={job.scrapedFirm || "—"} />
                            <Pill label="Photos" value={`${(p.images || []).length}`} />
                          </div>

                          {/* Editable fields */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px 16px",
                            }}
                          >
                            <Field label="Title" full>
                              <input style={fieldInputStyle} value={p.title} disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "title", e.target.value)} />
                            </Field>

                            <Field label="Location">
                              <input style={fieldInputStyle} value={p.location} placeholder="e.g. Punggol"
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "location", e.target.value)} />
                            </Field>

                            <Field label="Cost">
                              <input style={fieldInputStyle} value={p.cost} placeholder="e.g. $50,000"
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "cost", e.target.value)} />
                            </Field>

                            <Field label="Size">
                              <div style={{ display: "flex", gap: 8 }}>
                                <input style={{ ...fieldInputStyle, flex: 1 }} value={p.size} placeholder="e.g. 1100"
                                  disabled={job.status === "saving"}
                                  onChange={(e) => editField(idx, "size", e.target.value)} />
                                <select style={{ ...fieldInputStyle, width: 90 }} value={p.sizeUnit || "sqft"}
                                  disabled={job.status === "saving"}
                                  onChange={(e) => editField(idx, "sizeUnit", e.target.value)}>
                                  {SIZE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </div>
                            </Field>

                            <Field label="Year">
                              <input style={fieldInputStyle} value={p.year} placeholder="e.g. 2025"
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "year", e.target.value)} />
                            </Field>

                            <Field label="Property Type">
                              <select style={fieldInputStyle} value={p.propertyType}
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "propertyType", e.target.value)}>
                                <option value="">— Select —</option>
                                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </Field>

                            <Field label="Property Sub-Type">
                              <input style={fieldInputStyle} value={p.propertySubType} placeholder="e.g. 4-Room, BTO"
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "propertySubType", e.target.value)} />
                            </Field>

                            <Field label="Style">
                              <input style={fieldInputStyle} value={p.style} placeholder="e.g. Japandi"
                                disabled={job.status === "saving"}
                                onChange={(e) => editField(idx, "style", e.target.value)} />
                            </Field>

                            <Field label="Works Included" full>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {AVAILABLE_WORKS.map(({ key, label }) => {
                                  const on = (p.worksIncluded || []).includes(key);
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      disabled={job.status === "saving"}
                                      onClick={() => toggleWork(idx, key)}
                                      style={{
                                        fontFamily: sans,
                                        fontSize: 12,
                                        padding: "5px 10px",
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        border: `1px solid ${on ? C.black : C.creamBorder}`,
                                        background: on ? C.black : C.white,
                                        color: on ? C.white : C.gray,
                                      }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </Field>
                          </div>

                          {/* Save button for this row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                            <button
                              onClick={() => saveOne(idx)}
                              disabled={!canSave || job.status === "saving"}
                              style={{
                                height: 38,
                                padding: "0 22px",
                                background: job.status === "done" ? "#1f7a3a" : C.black,
                                color: C.white,
                                border: "none",
                                borderRadius: 9,
                                fontFamily: sans,
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                cursor: !canSave || job.status === "saving" ? "not-allowed" : "pointer",
                                opacity: !canSave || job.status === "saving" ? 0.5 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {job.status === "saving" && <Loader2 size={13} className="animate-spin" />}
                              {job.status === "done" ? "Saved ✓" : job.status === "saving" ? "Saving…" : "Save This Project"}
                            </button>
                            {job.status === "done" && (
                              <span style={{ fontSize: 12, color: "#1f7a3a", fontFamily: sans }}>
                                Saved under {firmName}. You can re-save after edits.
                              </span>
                            )}
                          </div>
                        </>
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
      <div style={iconWrap("#e8f5ec")}>
        <Check size={12} color="#1f7a3a" strokeWidth={3} />
      </div>
    );
  if (status === "error")
    return (
      <div style={iconWrap("#fde8e8")}>
        <AlertCircle size={12} color="#c14" strokeWidth={2.5} />
      </div>
    );
  if (status === "fetching" || status === "saving")
    return <Loader2 size={18} className="animate-spin" style={{ color: "#b8860b", flexShrink: 0 }} />;
  if (status === "fetched")
    return (
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1f6feb" }} />
      </div>
    );
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

function iconWrap(bg: string): React.CSSProperties {
  return {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        fontFamily: sans,
        fontSize: 11,
        color: C.gray,
        background: C.cream,
        border: `1px solid ${C.creamBorder}`,
        borderRadius: 999,
        padding: "4px 10px",
      }}
    >
      <span style={{ color: C.grayLight, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 6 }}>{label}</span>
      {value}
    </span>
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

export default RenopediaImportTest;

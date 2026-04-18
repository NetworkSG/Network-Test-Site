import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Building2, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "../supabaseClient";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

async function authHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) h["X-User-Token"] = data.session.access_token;
  } catch (_) {}
  return h;
}

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...(await authHeaders()), ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return res.json();
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface PendingDesigner {
  slug: string;
  name: string;
  tagline: string;
  contactEmail: string;
  submittedAt: string;
}

interface PendingProject {
  slug: string;
  index: number;
  name: string;
  meta: string;
  driveUrl: string;
  submittedAt: string;
}

export type PendingTab = "designers" | "projects";

export function PendingQueueModal({
  open,
  initialTab,
  onClose,
  onPublished,
}: {
  open: boolean;
  initialTab: PendingTab;
  onClose: () => void;
  onPublished?: () => void;
}) {
  const [tab, setTab] = useState<PendingTab>(initialTab);
  const [designers, setDesigners] = useState<PendingDesigner[] | null>(null);
  const [projects, setProjects] = useState<PendingProject[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, p] = await Promise.all([
        apiFetch<{ designers: PendingDesigner[] }>("/admin/pending-designers"),
        apiFetch<{ projects: PendingProject[] }>("/admin/pending-projects"),
      ]);
      setDesigners(d.designers || []);
      setProjects(p.projects || []);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const publishDesigner = async (slug: string) => {
    setBusyKey(`d:${slug}`);
    try { await apiFetch(`/admin/publish-designer/${slug}`, { method: "POST" }); await load(); onPublished?.(); }
    catch (err: any) { setError(String(err?.message || err)); }
    finally { setBusyKey(null); }
  };

  const rejectDesigner = async (slug: string) => {
    if (!confirm(`Reject and permanently delete ${slug}?`)) return;
    setBusyKey(`d:${slug}`);
    try { await apiFetch(`/admin/reject-designer/${slug}`, { method: "POST" }); await load(); onPublished?.(); }
    catch (err: any) { setError(String(err?.message || err)); }
    finally { setBusyKey(null); }
  };

  const publishProject = async (p: PendingProject) => {
    setBusyKey(`p:${p.slug}:${p.index}`);
    try { await apiFetch(`/admin/publish-project/${p.slug}`, { method: "POST", body: JSON.stringify({ index: p.index }) }); await load(); onPublished?.(); }
    catch (err: any) { setError(String(err?.message || err)); }
    finally { setBusyKey(null); }
  };

  const rejectProject = async (p: PendingProject) => {
    if (!confirm(`Remove project "${p.name}" from ${p.slug}?`)) return;
    setBusyKey(`p:${p.slug}:${p.index}`);
    try { await apiFetch(`/admin/reject-project/${p.slug}`, { method: "POST", body: JSON.stringify({ index: p.index }) }); await load(); onPublished?.(); }
    catch (err: any) { setError(String(err?.message || err)); }
    finally { setBusyKey(null); }
  };

  if (!open) return null;

  const designerCount = designers?.length ?? 0;
  const projectCount = projects?.length ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-[760px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#101828]" />
            <h3 className="font-bold text-[16px] text-[#101828]">Pending Review</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Refresh
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f3f4f6] cursor-pointer" aria-label="Close">
              <X className="size-4 text-[#6a7282]" />
            </button>
          </div>
        </header>

        <div className="flex items-center gap-1 px-6 pt-4 border-b border-[#e5e7eb] shrink-0">
          {(["designers", "projects"] as const).map((t) => {
            const active = tab === t;
            const count = t === "designers" ? designerCount : projectCount;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  active ? "text-[#101828] border-[#101828]" : "text-[#6a7282] border-transparent hover:text-[#101828]"
                }`}
              >
                {t === "designers" ? "Pending Designers" : "Pending Projects"}
                <span className={`text-[11px] rounded-full px-2 py-0.5 ${active ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#6a7282]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b] flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === "designers" && (
            <>
              {!designers && !error && (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#9ca3af]">
                  <Loader2 className="size-4 animate-spin mr-2" /> Loading…
                </div>
              )}
              {designers && designers.length === 0 && (
                <div className="text-[13px] text-[#9ca3af] py-12 text-center">No pending firms.</div>
              )}
              {designers && designers.length > 0 && (
                <div className="divide-y divide-[#f1f5f9]">
                  {designers.map((d) => {
                    const k = `d:${d.slug}`;
                    const busy = busyKey === k;
                    return (
                      <div key={d.slug} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#101828] truncate flex items-center gap-1.5">
                            <a href={`/designer/${d.slug}?preview=1`} target="_blank" rel="noreferrer" className="hover:underline">
                              {d.name || d.slug}
                            </a>
                            <ExternalLink className="size-3 text-[#9ca3af]" />
                          </p>
                          <p className="text-[11px] text-[#6a7282] truncate">
                            {d.tagline || "—"} · {d.contactEmail || "no email"}{d.submittedAt ? ` · ${timeAgo(d.submittedAt)}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => publishDesigner(d.slug)}
                            disabled={busy}
                            className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#101828] rounded-lg hover:bg-black transition cursor-pointer disabled:opacity-50"
                          >
                            {busy ? "…" : "Publish"}
                          </button>
                          <button
                            onClick={() => rejectDesigner(d.slug)}
                            disabled={busy}
                            className="px-3 py-1.5 text-[12px] font-medium text-[#991b1b] border border-[#fecaca] rounded-lg hover:bg-[#fef2f2] transition cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "projects" && (
            <>
              {!projects && !error && (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#9ca3af]">
                  <Loader2 className="size-4 animate-spin mr-2" /> Loading…
                </div>
              )}
              {projects && projects.length === 0 && (
                <div className="text-[13px] text-[#9ca3af] py-12 text-center">No pending projects.</div>
              )}
              {projects && projects.length > 0 && (
                <div className="divide-y divide-[#f1f5f9]">
                  {projects.map((p) => {
                    const k = `p:${p.slug}:${p.index}`;
                    const busy = busyKey === k;
                    return (
                      <div key={k} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#101828] truncate">
                            {p.name || "(untitled)"} <span className="text-[#9ca3af] font-normal">— {p.slug}</span>
                          </p>
                          <p className="text-[11px] text-[#6a7282] truncate">
                            {p.meta || "—"}
                            {p.driveUrl && (
                              <>
                                {" · "}
                                <a href={p.driveUrl} target="_blank" rel="noreferrer" className="text-[#101828] hover:underline">Drive link</a>
                              </>
                            )}
                            {p.submittedAt && <> · {timeAgo(p.submittedAt)}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => publishProject(p)}
                            disabled={busy}
                            className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#101828] rounded-lg hover:bg-black transition cursor-pointer disabled:opacity-50"
                          >
                            {busy ? "…" : "Publish"}
                          </button>
                          <button
                            onClick={() => rejectProject(p)}
                            disabled={busy}
                            className="px-3 py-1.5 text-[12px] font-medium text-[#991b1b] border border-[#fecaca] rounded-lg hover:bg-[#fef2f2] transition cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function usePendingCounts(enabled: boolean) {
  const [counts, setCounts] = useState<{ designers: number; projects: number } | null>(null);
  const refresh = async () => {
    try {
      const [d, p] = await Promise.all([
        apiFetch<{ total: number }>("/admin/pending-designers"),
        apiFetch<{ total: number }>("/admin/pending-projects"),
      ]);
      setCounts({ designers: d.total || 0, projects: p.total || 0 });
    } catch {
      setCounts(null);
    }
  };
  useEffect(() => { if (enabled) refresh(); }, [enabled]);
  return { counts, refresh };
}

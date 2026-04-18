import { useEffect, useMemo, useRef, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Zap,
  BarChart3,
  Bug,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/** Auth headers identical to AdminDashboard's getAdminAuthHeaders */
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

async function debugFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`.slice(0, 300));
  return res.json();
}

type HealthStatus = "ok" | "degraded" | "down" | "unknown";
interface HealthResult {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  detail: string;
}

interface FunnelRow {
  name: string;
  source: string;
  last24h: number;
  last7d: number;
  last30d: number;
}

interface ErrorEntry {
  source: "client" | "server";
  severity: "info" | "warn" | "error";
  event?: string;
  message?: string;
  route?: string;
  stack?: string;
  userAgent?: string;
  ip?: string;
  ts: string;
  [k: string]: any;
}

interface ZapierEntry {
  hook: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  ts: string;
  payloadKeys: string[];
  error?: string;
}

const statusStyle: Record<HealthStatus, { dot: string; bg: string; text: string; label: string }> = {
  ok: { dot: "bg-[#22c55e]", bg: "bg-[#f0fdf4]", text: "text-[#166534]", label: "OK" },
  degraded: { dot: "bg-[#f59e0b]", bg: "bg-[#fffbeb]", text: "text-[#92400e]", label: "Degraded" },
  down: { dot: "bg-[#ef4444]", bg: "bg-[#fef2f2]", text: "text-[#991b1b]", label: "Down" },
  unknown: { dot: "bg-[#94a3b8]", bg: "bg-[#f8fafc]", text: "text-[#475569]", label: "Unknown" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

/* ─── Section: System Health ─────────────────────────────────── */
function SystemHealthCard() {
  const [data, setData] = useState<{ services: HealthResult[]; ts: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await debugFetch<{ services: HealthResult[]; ts: string }>("/debug/health");
      setData(j);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-[#101828]" />
          <h3 className="font-bold text-[16px] text-[#101828]">System Health</h3>
          {data && <span className="text-[11px] text-[#9ca3af]">checked {timeAgo(data.ts)}</span>}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b] flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(data?.services || []).map((s) => {
          const st = statusStyle[s.status];
          return (
            <div key={s.name} className={`${st.bg} border border-[#e5e7eb] rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#101828]">{s.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${st.dot}`} />
                  <span className={`text-[11px] font-semibold ${st.text}`}>{st.label}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#6a7282] leading-snug break-words">{s.detail}</p>
              <p className="text-[10px] text-[#9ca3af] mt-1.5">{s.latencyMs}ms</p>
            </div>
          );
        })}
        {!data && !error && (
          <div className="col-span-full flex items-center justify-center py-8 text-[13px] text-[#9ca3af]">
            <Loader2 className="size-4 animate-spin mr-2" /> Running health checks…
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Section: Funnel Metrics ────────────────────────────────── */
function FunnelMetricsCard() {
  const [rows, setRows] = useState<FunnelRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await debugFetch<{ funnels: FunnelRow[] }>("/debug/funnel-metrics");
      setRows(j.funnels || []);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    if (!rows) return null;
    return rows.reduce(
      (acc, r) => ({
        last24h: acc.last24h + Math.max(0, r.last24h),
        last7d: acc.last7d + Math.max(0, r.last7d),
        last30d: acc.last30d + Math.max(0, r.last30d),
      }),
      { last24h: 0, last7d: 0, last30d: 0 },
    );
  }, [rows]);

  return (
    <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[#101828]" />
          <h3 className="font-bold text-[16px] text-[#101828]">Funnel Metrics</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b] flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb]">
              <th className="py-2 pr-4">Funnel</th>
              <th className="py-2 px-3 text-right">24h</th>
              <th className="py-2 px-3 text-right">7d</th>
              <th className="py-2 px-3 text-right">30d</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => {
              const dormant = r.last24h === 0 && r.last7d > 0; // had traffic in 7d but nothing in 24h
              return (
                <tr key={r.name} className={`border-b border-[#f3f4f6] ${dormant ? "bg-[#fffbeb]" : ""}`}>
                  <td className="py-2.5 pr-4">
                    <div className="font-medium text-[#101828]">{r.name}</div>
                    <div className="text-[10px] text-[#9ca3af] font-mono">{r.source}</div>
                  </td>
                  <td className={`py-2.5 px-3 text-right tabular-nums ${dormant ? "text-[#b45309] font-semibold" : "text-[#101828]"}`}>
                    {r.last24h < 0 ? "—" : r.last24h}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#101828]">{r.last7d < 0 ? "—" : r.last7d}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[#101828]">{r.last30d < 0 ? "—" : r.last30d}</td>
                </tr>
              );
            })}
            {totals && (
              <tr className="font-semibold text-[#101828] bg-[#f9fafb]">
                <td className="py-2.5 pr-4">Total</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{totals.last24h}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{totals.last7d}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{totals.last30d}</td>
              </tr>
            )}
            {!rows && !error && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[13px] text-[#9ca3af]">
                  <Loader2 className="size-4 animate-spin inline mr-2" /> Loading metrics…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Section: Recent Errors ─────────────────────────────────── */
function RecentErrorsCard() {
  const [logs, setLogs] = useState<ErrorEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<"" | "client" | "server">("");
  const [severityFilter, setSeverityFilter] = useState<"" | "error" | "warn" | "info">("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: "100" });
      if (sourceFilter) qs.set("source", sourceFilter);
      if (severityFilter) qs.set("severity", severityFilter);
      const j = await debugFetch<{ logs: ErrorEntry[] }>(`/debug/logs?${qs.toString()}`);
      setLogs(j.logs || []);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sourceFilter, severityFilter]);

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const sevBadge = (sev: string) => {
    const style =
      sev === "error" ? "bg-[#fef2f2] text-[#991b1b]" :
      sev === "warn" ? "bg-[#fffbeb] text-[#92400e]" :
      "bg-[#f0f9ff] text-[#075985]";
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${style}`}>{sev}</span>;
  };

  return (
    <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bug className="size-5 text-[#101828]" />
          <h3 className="font-bold text-[16px] text-[#101828]">Recent Errors</h3>
          {logs && <span className="text-[11px] text-[#9ca3af]">{logs.length} shown</span>}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[11px] text-[#9ca3af] font-semibold uppercase tracking-wider">Source:</span>
        {[
          { v: "", l: "All" },
          { v: "client", l: "Client" },
          { v: "server", l: "Server" },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setSourceFilter(o.v as any)}
            className={`px-2.5 py-1 text-[11px] rounded-md cursor-pointer transition-colors ${
              sourceFilter === o.v ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#6a7282] hover:bg-[#e5e7eb]"
            }`}
          >
            {o.l}
          </button>
        ))}
        <span className="ml-3 text-[11px] text-[#9ca3af] font-semibold uppercase tracking-wider">Severity:</span>
        {[
          { v: "", l: "All" },
          { v: "error", l: "Error" },
          { v: "warn", l: "Warn" },
          { v: "info", l: "Info" },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setSeverityFilter(o.v as any)}
            className={`px-2.5 py-1 text-[11px] rounded-md cursor-pointer transition-colors ${
              severityFilter === o.v ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#6a7282] hover:bg-[#e5e7eb]"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b] flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-h-[440px] overflow-y-auto border border-[#f3f4f6] rounded-lg divide-y divide-[#f3f4f6]">
        {(logs || []).map((entry, i) => {
          const open = expanded.has(i);
          const label = entry.message || entry.event || "—";
          return (
            <div key={i} className="p-3 text-[12px] hover:bg-[#f9fafb]">
              <button onClick={() => toggle(i)} className="w-full flex items-start gap-2 text-left cursor-pointer">
                {open ? <ChevronDown className="size-3.5 text-[#9ca3af] shrink-0 mt-0.5" /> : <ChevronRight className="size-3.5 text-[#9ca3af] shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {sevBadge(entry.severity || "info")}
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${entry.source === "client" ? "bg-[#eef2ff] text-[#3730a3]" : "bg-[#f0fdf4] text-[#166534]"}`}>
                      {entry.source}
                    </span>
                    <span className="text-[10px] text-[#9ca3af] font-mono">{timeAgo(entry.ts)}</span>
                    {entry.route && <span className="text-[10px] text-[#6a7282] font-mono truncate">{entry.route}</span>}
                  </div>
                  <div className="mt-1 text-[#101828] font-medium truncate">{label}</div>
                </div>
              </button>
              {open && (
                <div className="mt-2 ml-5 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[11px] font-mono text-[#364153] whitespace-pre-wrap break-all">
                  {entry.stack && <div className="mb-2"><span className="text-[#9ca3af]">stack:</span>{"\n"}{entry.stack}</div>}
                  {entry.userAgent && <div className="mb-1"><span className="text-[#9ca3af]">ua:</span> {entry.userAgent}</div>}
                  {entry.ip && <div className="mb-1"><span className="text-[#9ca3af]">ip:</span> {entry.ip}</div>}
                  <div><span className="text-[#9ca3af]">raw:</span> {JSON.stringify(entry, null, 2)}</div>
                </div>
              )}
            </div>
          );
        })}
        {logs && logs.length === 0 && (
          <div className="p-8 text-center text-[13px] text-[#9ca3af] flex flex-col items-center gap-2">
            <CheckCircle2 className="size-8 text-[#22c55e]" />
            No errors to show
          </div>
        )}
        {!logs && !error && (
          <div className="p-8 text-center text-[13px] text-[#9ca3af]">
            <Loader2 className="size-4 animate-spin inline mr-2" /> Loading…
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Section: Zapier Activity ───────────────────────────────── */
function ZapierActivityCard() {
  const [entries, setEntries] = useState<ZapierEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await debugFetch<{ entries: ZapierEntry[] }>("/debug/zapier-activity");
      setEntries(j.entries || []);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (e: ZapierEntry) => {
    const ok = e.ok;
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ok ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#fef2f2] text-[#991b1b]"}`}>
        {e.status || "—"}
      </span>
    );
  };

  return (
    <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-[#101828]" />
          <h3 className="font-bold text-[16px] text-[#101828]">Zapier Activity</h3>
          {entries && <span className="text-[11px] text-[#9ca3af]">last {entries.length}</span>}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[12px] text-[#991b1b] flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto border border-[#f3f4f6] rounded-lg divide-y divide-[#f3f4f6]">
        {(entries || []).map((e, i) => (
          <div key={i} className="p-3 text-[12px] flex items-start gap-3">
            <Clock className="size-3.5 text-[#9ca3af] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#101828] font-mono">{e.hook}</span>
                {statusBadge(e)}
                <span className="text-[10px] text-[#9ca3af]">{timeAgo(e.ts)}</span>
                <span className="text-[10px] text-[#9ca3af] tabular-nums">{e.latencyMs}ms</span>
              </div>
              {e.payloadKeys?.length > 0 && (
                <div className="mt-1 text-[10px] text-[#6a7282] font-mono truncate">
                  keys: {e.payloadKeys.join(", ")}
                </div>
              )}
              {e.error && (
                <div className="mt-1 text-[11px] text-[#991b1b] font-mono">error: {e.error}</div>
              )}
            </div>
          </div>
        ))}
        {entries && entries.length === 0 && (
          <div className="p-8 text-center text-[13px] text-[#9ca3af]">
            No Zapier activity yet
          </div>
        )}
        {!entries && !error && (
          <div className="p-8 text-center text-[13px] text-[#9ca3af]">
            <Loader2 className="size-4 animate-spin inline mr-2" /> Loading…
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Main Panel ─────────────────────────────────────────────── */
export function AdminDebugPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-[22px] text-[#101828] tracking-tight">Debug & Monitoring</h2>
        <p className="text-[14px] text-[#6a7282] mt-0.5">Live health checks, lead funnels, and recent errors across the whole site.</p>
      </div>
      <SystemHealthCard />
      <FunnelMetricsCard />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentErrorsCard />
        <ZapierActivityCard />
      </div>
    </div>
  );
}

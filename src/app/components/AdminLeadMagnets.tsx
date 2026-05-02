import { useEffect, useState, useCallback } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import {
  FileText,
  Sparkles,
  MessageSquare,
  Building2,
  UserPlus,
  Inbox,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type Magnet = {
  key: string;
  name: string;
  source?: string;
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  sparkline: { date: string; count: number }[];
  details?: Record<string, number>;
  error?: string;
};

type MetricsResponse = {
  magnets: Magnet[];
  computedAt: string;
  cached?: boolean;
};

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers["X-User-Token"] = data.session.access_token;
    }
  } catch (_) {}
  return headers;
}

// Each lead magnet gets its own icon + accent — keeps the wall of cards
// scannable. Color also feeds the sparkline gradient.
const MAGNET_META: Record<string, { icon: any; color: string; gradient: string; description: string }> = {
  "cost-guide": {
    icon: FileText,
    color: "#3b82f6",
    gradient: "rgba(59, 130, 246, 0.18)",
    description: "Renovation cost-guide submissions and PDF downloads.",
  },
  "render-tool": {
    icon: Sparkles,
    color: "#8b5cf6",
    gradient: "rgba(139, 92, 246, 0.18)",
    description: "AI render-tool tasks fired by visitors.",
  },
  "designer-inquiry": {
    icon: MessageSquare,
    color: "#f97316",
    gradient: "rgba(249, 115, 22, 0.18)",
    description: "Inquiries sent through designer profile pages.",
  },
  "firm-onboarding": {
    icon: Building2,
    color: "#22c55e",
    gradient: "rgba(34, 197, 94, 0.18)",
    description: "Firms onboarded + projects added via the firm form.",
  },
  "homeowner-signups": {
    icon: UserPlus,
    color: "#ec4899",
    gradient: "rgba(236, 72, 153, 0.18)",
    description: "Homeowner accounts created across the site.",
  },
  "quote-requests": {
    icon: Inbox,
    color: "#0ea5e9",
    gradient: "rgba(14, 165, 233, 0.18)",
    description: "All Quote Request rows — Sales' canonical lead bucket.",
  },
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min ago`;
  return `${Math.round(ms / 3_600_000)} h ago`;
}

function MagnetCard({ magnet }: { magnet: Magnet }) {
  const meta = MAGNET_META[magnet.key] || { icon: Inbox, color: "#6b7280", gradient: "rgba(107,114,128,0.18)", description: "" };
  const Icon = meta.icon;

  // Compare last7d vs the prior 7d (week-over-week) using the sparkline.
  const recent = magnet.sparkline.slice(-7).reduce((a, p) => a + p.count, 0);
  const prior = magnet.sparkline.slice(0, 7).reduce((a, p) => a + p.count, 0);
  const trend = prior === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prior) / prior) * 100);
  const trendPositive = trend >= 0;

  return (
    <div className="bg-white border border-[#e8eaed] rounded-2xl p-5 flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="size-[40px] rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: meta.gradient }}
          >
            <Icon className="size-[18px]" style={{ color: meta.color }} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] text-[#101828] leading-tight truncate">{magnet.name}</h3>
            <p className="text-[11px] text-[#9ca3af] truncate">{meta.description}</p>
          </div>
        </div>
        {magnet.error ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fef2f2] text-[#dc2626]" title={magnet.error}>
            error
          </span>
        ) : (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              trendPositive ? "bg-[#ecfdf5] text-[#15803d]" : "bg-[#fef2f2] text-[#b91c1c]"
            }`}
          >
            {trendPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trendPositive ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>

      {/* Big number + windowed counts */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[28px] font-bold text-[#101828] leading-none tracking-tight">
            {magnet.total.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6a7282] mt-1.5">total to date</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <div>
            <div className="text-[14px] font-semibold text-[#101828]">{magnet.last24h}</div>
            <div className="text-[10px] text-[#9ca3af] tracking-wide">24H</div>
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#101828]">{magnet.last7d}</div>
            <div className="text-[10px] text-[#9ca3af] tracking-wide">7D</div>
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#101828]">{magnet.last30d}</div>
            <div className="text-[10px] text-[#9ca3af] tracking-wide">30D</div>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="-mx-2 -mb-1" style={{ height: 60 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={magnet.sparkline} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${magnet.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e7eb" }}
              labelStyle={{ color: "#6a7282" }}
              formatter={(value: any) => [value, "leads"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={meta.color}
              strokeWidth={1.75}
              fill={`url(#grad-${magnet.key})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Details (per-magnet specific) */}
      {magnet.details && Object.keys(magnet.details).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#f3f4f6]">
          {Object.entries(magnet.details).map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-1 bg-[#f9fafb] border border-[#e5e7eb] rounded-md text-[11px] text-[#364153]"
            >
              <span className="text-[#9ca3af]">{k}:</span>{" "}
              <span className="font-semibold">{(v as number).toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminLeadMagnets() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/admin/lead-magnet-metrics`, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as MetricsResponse;
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load lead-magnet metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clarityId = (import.meta as any).env?.VITE_CLARITY_ID as string | undefined;

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-[22px] text-[#101828] tracking-tight">Lead Magnets</h2>
          <p className="text-[14px] text-[#6a7282] mt-0.5">
            Per-magnet conversion data across cost guide, render tool, inquiries, onboarding, and signups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.computedAt && (
            <span className="text-[11px] text-[#9ca3af]" title={data.computedAt}>
              Updated {relativeTime(data.computedAt)}
              {data.cached ? " · cached" : ""}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] transition-all cursor-pointer disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-[13px] text-[#b91c1c]">
          Couldn't load metrics: {error}
        </div>
      )}

      {/* Cards grid */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20 text-[#9ca3af]">
          <Loader2 className="size-5 animate-spin mr-2" />
          Loading lead-magnet metrics…
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.magnets.map((m) => (
            <MagnetCard key={m.key} magnet={m} />
          ))}
        </div>
      ) : null}

      {/* Session recording — Microsoft Clarity */}
      <div className="mt-10 p-5 bg-white border border-[#e8eaed] rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="size-[40px] rounded-xl bg-[#fef3c7] flex items-center justify-center shrink-0">
            <Eye className="size-[18px] text-[#d97706]" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-[#101828] leading-tight">Session Recording · Microsoft Clarity</h3>
            <p className="text-[12px] text-[#6a7282] mt-1 leading-relaxed">
              Heatmaps and session replays for behavioral insight.{" "}
              {clarityId
                ? "Active on this build."
                : "Not configured — set VITE_CLARITY_ID in your environment to enable."}
            </p>
            {clarityId && (
              <a
                href={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-medium text-[#3b82f6] hover:text-[#2563eb]"
              >
                Open Clarity dashboard
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLeadMagnets;

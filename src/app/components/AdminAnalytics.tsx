import { useEffect, useState, useMemo } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import { Eye, Inbox, Loader2, RefreshCw, Search, TrendingUp, ArrowUpDown } from "lucide-react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type Row = {
  slug: string;
  name: string;
  totalViews: number;
  views7: number;
  views30: number;
  totalInquiries: number;
  inquiries7: number;
  inquiries30: number;
  conversion: number;
};

type Summary = {
  totalViews: number;
  totalInquiries: number;
  views7: number;
  inquiries7: number;
  views30: number;
  inquiries30: number;
};

type Resp = { asOf: string; summary: Summary; rows: Row[] };

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
  } catch {}
  return headers;
}

type RangeKey = "7d" | "30d" | "all";
type SortKey = "views" | "inquiries" | "conversion" | "name";

export function AdminAnalytics() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/admin/designer-analytics`, { headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as Resp;
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const viewsField = range === "7d" ? "views7" : range === "30d" ? "views30" : "totalViews";
  const inquiriesField = range === "7d" ? "inquiries7" : range === "30d" ? "inquiries30" : "totalInquiries";
  const summaryViews = !data ? 0 : range === "7d" ? data.summary.views7 : range === "30d" ? data.summary.views30 : data.summary.totalViews;
  const summaryInquiries = !data ? 0 : range === "7d" ? data.summary.inquiries7 : range === "30d" ? data.summary.inquiries30 : data.summary.totalInquiries;
  const summaryConversion = summaryViews > 0 ? (summaryInquiries / summaryViews) * 100 : 0;

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    let list = data.rows.map((r) => ({
      ...r,
      _views: (r as any)[viewsField] as number,
      _inquiries: (r as any)[inquiriesField] as number,
      _conversion: (r as any)[viewsField] > 0 ? ((r as any)[inquiriesField] / (r as any)[viewsField]) : 0,
    }));
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
    list.sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "inquiries": return (a._inquiries - b._inquiries) * dir;
        case "conversion": return (a._conversion - b._conversion) * dir;
        case "views":
        default: return (a._views - b._views) * dir;
      }
    });
    return list;
  }, [data, query, viewsField, inquiriesField, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const fmtNum = (n: number) => n.toLocaleString("en-US");
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#101828]">Designer Analytics</h1>
          <p className="text-[13px] text-[#6a7282] mt-1">Profile visits and lead-form submissions per designer.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 h-9 rounded-lg border border-[#e5e7eb] bg-white text-[13px] text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </button>
      </div>

      {/* Range picker */}
      <div className="flex items-center gap-1 mb-5">
        {(["7d", "30d", "all"] as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 h-8 rounded-md text-[12px] font-medium transition cursor-pointer ${
              range === r ? "bg-[#101828] text-white" : "bg-white text-[#6a7282] border border-[#e5e7eb] hover:bg-[#f3f4f6]"
            }`}
          >
            {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<Eye className="size-5" />}
          label="Profile Visits"
          value={fmtNum(summaryViews)}
          tone="#3b82f6"
        />
        <SummaryCard
          icon={<Inbox className="size-5" />}
          label="Lead Form Submissions"
          value={fmtNum(summaryInquiries)}
          tone="#10b981"
        />
        <SummaryCard
          icon={<TrendingUp className="size-5" />}
          label="Conversion Rate"
          value={`${summaryConversion.toFixed(1)}%`}
          tone="#f59e0b"
          subtle="Submissions ÷ Visits"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designer name or slug"
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-[#e5e7eb] bg-white text-[13px] text-[#101828] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#101828]"
          />
        </div>
        <span className="text-[12px] text-[#9ca3af]">{rows.length} designers</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        {error ? (
          <div className="p-6 text-[13px] text-red-600">Error: {error}</div>
        ) : loading && !data ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#9ca3af]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-[#6a7282]">No designers match your search.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr className="text-left">
                <Th label="Designer" sortKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th label="Profile Visits" sortKey="views" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                <Th label="Lead Submissions" sortKey="inquiries" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                <Th label="Conversion" sortKey="conversion" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#101828]">{r.name}</div>
                    <a
                      href={`/designer/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#6a7282] hover:text-[#101828] hover:underline"
                    >
                      /{r.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#101828]">{fmtNum(r._views)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#101828]">{fmtNum(r._inquiries)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#6a7282]">
                    {r._views > 0 ? fmtPct(r._conversion) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && (
        <p className="text-[11px] text-[#9ca3af] mt-3">
          As of {new Date(data.asOf).toLocaleDateString()}. Profile visits are deduped per IP per calendar day.
        </p>
      )}
    </div>
  );
}

function SummaryCard({
  icon, label, value, tone, subtle,
}: { icon: React.ReactNode; label: string; value: string; tone: string; subtle?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: tone }} className="flex items-center">{icon}</span>
        <span className="text-[12px] font-medium text-[#6a7282] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[28px] font-semibold text-[#101828] tabular-nums">{value}</div>
      {subtle && <div className="text-[11px] text-[#9ca3af] mt-1">{subtle}</div>}
    </div>
  );
}

function Th({
  label, sortKey: key, current, dir, onSort, align = "left",
}: { label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void; align?: "left" | "right" }) {
  const active = current === key;
  return (
    <th className={`px-4 py-2.5 font-semibold text-[#6a7282] text-[12px] ${align === "right" ? "text-right" : ""}`}>
      <button
        onClick={() => onSort(key)}
        className={`inline-flex items-center gap-1 cursor-pointer hover:text-[#101828] ${align === "right" ? "flex-row-reverse" : ""} ${active ? "text-[#101828]" : ""}`}
      >
        {label}
        <ArrowUpDown className={`size-3 ${active ? "opacity-100" : "opacity-40"} ${active && dir === "asc" ? "rotate-180" : ""}`} />
      </button>
    </th>
  );
}

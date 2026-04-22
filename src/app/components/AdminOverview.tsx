import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./supabaseClient";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderOpen,
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  Globe,
  MousePointerClick,
  Eye,
  FileText,
  Calendar,
  ChevronDown,
  ExternalLink,
  Loader2,
  BarChart3,
  Activity,
  Clock,
  Zap,
  UserPlus,
  Image as ImageIcon,
  Building2,
  ChevronRight,
  X,
  Inbox,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const AUTH = { Authorization: `Bearer ${publicAnonKey}` };

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

/* ─── Mini sparkline data generators ─── */
function generateSparkline(base: number, variance: number, points = 14): number[] {
  return Array.from({ length: points }, (_, i) => {
    const trend = base + (i / points) * (base * 0.15);
    return Math.max(0, Math.round(trend + (Math.random() - 0.4) * variance));
  });
}

function generateDailyData(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      projects: Math.floor(Math.random() * 8 + 2),
      renders: Math.floor(Math.random() * 5 + 1),
      signups: Math.floor(Math.random() * 4 + 1),
    });
  }
  return data;
}

function generateWeeklyActivity() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  return days.map((day) => ({
    day,
    hours: hours.map((hour) => ({
      hour,
      value: Math.floor(Math.random() * 10),
    })),
  }));
}

/* ─── Sparkline Component ─── */
function MiniSparkline({ data, color = "#3b82f6", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, change, changeLabel, sparkData, color, tag, isNew }: {
  label: string; value: string | number; change: number; changeLabel?: string;
  sparkData: number[]; color: string; tag?: string; isNew?: boolean;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white border border-[#e8eaed] rounded-xl p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-[#6a7282] tracking-wide">{label}</span>
        {tag && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#eef4ff] text-[#3b82f6]">{tag}</span>
        )}
        {isNew && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fef3c7] text-[#d97706]">New</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-[28px] text-[#101828] tracking-tight leading-none mb-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`flex items-center gap-0.5 font-semibold ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {isPositive ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
              {isPositive ? "+" : ""}{change}%
            </span>
            {changeLabel && <span className="text-[#9ca3af]">{changeLabel}</span>}
          </div>
        </div>
        <MiniSparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-[16px] text-[#101828] tracking-[-0.3px]">{title}</h3>
      {actionLabel && (
        <button onClick={onAction} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3b82f6] text-white text-[12px] font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Traffic Source Row ─── */
function SourceRow({ name, type, change, value, isPositive }: {
  name: string; type?: string; change: number; value: number; isPositive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] text-[#3b82f6] font-medium truncate">{name}</span>
        {type && <span className="text-[10px] text-[#9ca3af] shrink-0">({type})</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[11px] font-medium ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-[14px] font-semibold text-[#101828] w-[50px] text-right">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ─── Page Row ─── */
function PageRow({ name, change, value, color = "#3b82f6" }: {
  name: string; change: number; value: number; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="size-[6px] rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[13px] text-[#3b82f6] font-medium truncate">{name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[11px] font-medium ${change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-[14px] font-semibold text-[#101828] w-[50px] text-right">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ─── Engagement Stat ─── */
function EngagementStat({ icon, label, value, change, suffix }: {
  icon: React.ReactNode; label: string; value: string; change: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="text-[#9ca3af]">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-[#6a7282]">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[11px] font-medium ${change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-[14px] font-semibold text-[#101828]">{value}</span>
        {suffix && <span className="text-[11px] text-[#9ca3af]">{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── Button Click Row ─── */
function ButtonClickRow({ label, sublabel, count }: { label: string; sublabel?: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0">
        <span className="text-[13px] font-medium text-[#101828] block truncate">{label}</span>
        {sublabel && <span className="text-[11px] text-[#3b82f6] truncate block">on {sublabel}</span>}
      </div>
      <span className="text-[14px] font-semibold text-[#101828] shrink-0">{count}</span>
    </div>
  );
}

/* ─── Blog Post Row ─── */
function BlogRow({ title, date, views, viewsChange, clicks, avgRead }: {
  title: string; date: string; views: number; viewsChange: number; clicks: number; avgRead: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#f3f4f6] last:border-b-0">
      <div className="size-[42px] rounded-lg bg-[#f3f4f6] flex items-center justify-center shrink-0">
        <FileText className="size-[18px] text-[#9ca3af]" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-[#101828] block truncate">{title}</span>
        <span className="text-[11px] text-[#9ca3af]">{date}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0 w-[60px]">
        <span className={`text-[10px] font-medium ${viewsChange >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {viewsChange >= 0 ? "+" : ""}{viewsChange}%
        </span>
        <span className="text-[13px] font-semibold text-[#101828]">{views}</span>
      </div>
      <div className="w-[30px] text-center shrink-0">
        <span className="text-[13px] text-[#6a7282]">{clicks}</span>
      </div>
      <div className="w-[60px] text-right shrink-0">
        <span className="text-[13px] text-[#6a7282]">{avgRead}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN OVERVIEW COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function AdminOverview({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTemplates: 0,
    totalDesigners: 0,
    totalRenders: 0,
    totalLeads: 0,
    activeTemplates: 0,
  });
  const [dateRange] = useState("Last 30 days");

  // Onboarding submissions modal
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState("");
  const [subs, setSubs] = useState<any[]>([]);
  const [subsFilter, setSubsFilter] = useState<"all" | "full" | "project-only" | "backfill">("all");

  // Submitted firms modal (firm-onboarding variant=full)
  const [firmsOpen, setFirmsOpen] = useState(false);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [firmsError, setFirmsError] = useState("");
  const [firms, setFirms] = useState<any[]>([]);
  const [firmsFilter, setFirmsFilter] = useState<"all" | "active" | "pending">("all");

  const openFirms = useCallback(async () => {
    setFirmsOpen(true);
    setFirmsLoading(true);
    setFirmsError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/admin/submitted-firms`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      const rows = Array.isArray(json.firms) ? json.firms : [];
      setFirms(rows);
    } catch (err: any) {
      setFirmsError(err?.message || "Failed to load firms");
    }
    setFirmsLoading(false);
  }, []);

  // Lock body scroll while either modal is open so the page doesn't scroll
  // behind the overlay and the modal stays fully within the viewport.
  useEffect(() => {
    if (!subsOpen && !firmsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [subsOpen, firmsOpen]);

  const openSubmissions = useCallback(async () => {
    setSubsOpen(true);
    setSubsLoading(true);
    setSubsError("");
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/admin/designer-projects`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      // Normalize designer_projects rows into the shape the modal renders.
      const projects = Array.isArray(json.projects) ? json.projects : [];
      const normalized = projects.map((r: any) => ({
        id: r.id,
        variant: r.variant === "project-only" ? "project-only" : r.variant === "backfill" ? "backfill" : "full",
        slug: r.designer_slug,
        contactEmail: r.contact_email,
        ts: r.submitted_at || r.created_at,
        project: {
          title: r.title,
          location: r.location,
          cost: r.cost,
          size: r.size,
          sizeUnit: r.size_unit,
          year: r.year,
          propertyType: r.property_type,
          propertySubType: r.property_sub_type,
          style: r.style,
          driveUrl: r.drive_url,
          sourceUrl: r.source_url,
          images: Array.isArray(r.images) ? r.images : [],
        },
      }));
      setSubs(normalized);
    } catch (err: any) {
      setSubsError(err?.message || "Failed to load submissions");
    }
    setSubsLoading(false);
  }, []);

  // Live visitor tracking — Vercel realtime + heartbeat detail
  const [vercelRealtime, setVercelRealtime] = useState<{ total: number; devices: number; bounceRate?: number }>({ total: 0, devices: 0 });
  const [liveVisitors, setLiveVisitors] = useState<{ count: number; visitors: { visitorId: string; page: string; lastSeen: number }[] }>({ count: 0, visitors: [] });

  const fetchLiveData = useCallback(async () => {
    try {
      const headers = await getAdminAuthHeaders();
      // Fetch Vercel realtime + heartbeat visitors in parallel
      const [realtimeRes, heartbeatRes] = await Promise.allSettled([
        fetch(`${API}/vercel-realtime`, { headers }),
        fetch(`${API}/live-visitors`, { headers }),
      ]);
      if (realtimeRes.status === "fulfilled" && realtimeRes.value.ok) {
        setVercelRealtime(await realtimeRes.value.json());
      }
      if (heartbeatRes.status === "fulfilled" && heartbeatRes.value.ok) {
        setLiveVisitors(await heartbeatRes.value.json());
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15_000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Vercel Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsError, setAnalyticsError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const headers = await getAdminAuthHeaders();
      const from = new Date(Date.now() - 30 * 86400000).toISOString();
      const to = new Date().toISOString();
      const res = await fetch(`${API}/vercel-analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.error) { setAnalyticsError(true); } else { setAnalytics(data); }
      } else { setAnalyticsError(true); }
    } catch (_) { setAnalyticsError(true); }
  }, []);

  // Generate fallback sparklines for non-analytics stats
  const [sparkTemplates] = useState(() => generateSparkline(24, 8));

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch multiple endpoints in parallel
      const [templatesRes, designersRes] = await Promise.allSettled([
        fetch(`${API}/fp3d/templates?all=true`, { headers: AUTH }),
        fetch(`${API}/designers`, { headers: AUTH }),
      ]);

      let totalTemplates = 0, activeTemplates = 0, totalDesigners = 0;

      if (templatesRes.status === "fulfilled" && templatesRes.value.ok) {
        const json = await templatesRes.value.json();
        const templates = json.templates || [];
        totalTemplates = templates.length;
        activeTemplates = templates.filter((t: any) => t.isActive).length;
      }

      if (designersRes.status === "fulfilled" && designersRes.value.ok) {
        const json = await designersRes.value.json();
        totalDesigners = (json.data || []).length;
      }

      setStats({
        totalProjects: 0,
        totalTemplates,
        totalDesigners,
        totalRenders: 0,
        totalLeads: 0,
        activeTemplates,
      });
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); fetchAnalytics(); }, [fetchStats, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-[#9ca3af] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-[24px] text-[#101828] tracking-[-0.5px]">Analytics Highlights</h2>
          <p className="text-[14px] text-[#6a7282] mt-0.5">
            Get a complete overview of your platform's activity across all areas.{" "}
            <button className="text-[#3b82f6] hover:underline cursor-pointer">Learn more</button>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openSubmissions} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            <Inbox className="size-3.5" /> Submitted Projects
          </button>
          <button onClick={openFirms} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            <Building2 className="size-3.5" /> Submitted Firms
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            Alerts and Emails <ChevronDown className="size-3.5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            All Reports <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ Submitted Projects Modal ═══ */}
      {subsOpen && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSubsOpen(false)}>
          <div className="bg-white w-full max-w-[960px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed]">
              <div>
                <h3 className="font-bold text-[16px] text-[#101828]">Submitted Projects</h3>
                <p className="text-[12px] text-[#6a7282] mt-0.5">From firm-onboarding and project-import flows.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-1">
                  {(["all", "full", "project-only", "backfill"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSubsFilter(v)}
                      className={`px-3 py-1 rounded text-[12px] font-medium transition-colors cursor-pointer ${subsFilter === v ? "bg-white text-[#101828] shadow-sm" : "text-[#6a7282] hover:text-[#101828]"}`}
                    >
                      {v === "all" ? "All" : v === "full" ? "Firm onboarding" : v === "project-only" ? "Project import" : "Backfill"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setSubsOpen(false)} className="size-[34px] rounded-full hover:bg-[#f6f6f6] flex items-center justify-center cursor-pointer">
                  <X className="size-4 text-[#6a7282]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              {subsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 text-[#9ca3af] animate-spin" />
                </div>
              ) : subsError ? (
                <p className="text-[13px] text-[#c14] py-8 text-center">{subsError}</p>
              ) : (() => {
                const filtered = subs.filter((s) => subsFilter === "all" ? true : s?.variant === subsFilter);
                if (!filtered.length) {
                  return <p className="text-[13px] text-[#6a7282] py-12 text-center">No submissions yet.</p>;
                }
                return (
                  <div className="flex flex-col gap-2">
                    {filtered.map((s) => {
                      const firmLabel = s?.slug || s?.studio?.firmName || "(no firm)";
                      const projTitle = s?.project?.title || "(no project title)";
                      const ts = s?.ts ? new Date(s.ts).toLocaleString() : "";
                      const variantLabel = s?.variant === "project-only" ? "Project import" : s?.variant === "backfill" ? "Backfill" : "Firm onboarding";
                      const projectHref = s?.slug && projTitle !== "(no project title)"
                        ? `/designer/${s.slug}/project/${encodeURIComponent(projTitle)}?preview=1`
                        : null;
                      const CardInner = (
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f6f6f6] text-[#6a7282]">{variantLabel}</span>
                              <span className="text-[12px] text-[#9ca3af]">{ts}</span>
                            </div>
                            <div className="font-semibold text-[14px] text-[#101828] truncate">{projTitle}</div>
                            <div className="text-[12px] text-[#6a7282] mt-0.5 truncate">
                              {firmLabel} · {s?.contactEmail || "(no email)"}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9ca3af] flex-wrap">
                              {s?.project?.propertyType && <span>{s.project.propertyType}</span>}
                              {s?.project?.location && <span>· {s.project.location}</span>}
                              {s?.project?.cost && <span>· {s.project.cost}</span>}
                              {s?.project?.size && <span>· {s.project.size}{s?.project?.sizeUnit || ""}</span>}
                              {s?.project?.year && <span>· {s.project.year}</span>}
                            </div>
                          </div>
                          {s?.project?.sourceUrl && (
                            <a
                              href={s.project.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[12px] text-[#3b82f6] hover:underline inline-flex items-center gap-1 shrink-0"
                            >
                              Source <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      );
                      return projectHref ? (
                        <a
                          key={s.id}
                          href={projectHref}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-[#e8eaed] rounded-xl p-4 hover:bg-[#fafafa] transition-colors no-underline"
                        >
                          {CardInner}
                        </a>
                      ) : (
                        <div key={s.id} className="border border-[#e8eaed] rounded-xl p-4 hover:bg-[#fafafa] transition-colors">
                          {CardInner}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="px-6 py-3 border-t border-[#e8eaed] text-[12px] text-[#6a7282] flex items-center justify-between">
              <span>{subs.length} total submission{subs.length === 1 ? "" : "s"}</span>
              <button onClick={openSubmissions} className="text-[#3b82f6] hover:underline cursor-pointer">Refresh</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ═══ Submitted Firms Modal ═══ */}
      {firmsOpen && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setFirmsOpen(false)}>
          <div className="bg-white w-full max-w-[960px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed]">
              <div>
                <h3 className="font-bold text-[16px] text-[#101828]">Submitted Firms</h3>
                <p className="text-[12px] text-[#6a7282] mt-0.5">Firms submitted via /firm-onboarding, newest first.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#f6f6f6] rounded-lg p-1">
                  {(["all", "active", "pending"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFirmsFilter(v)}
                      className={`px-3 py-1 rounded text-[12px] font-medium transition-colors cursor-pointer ${firmsFilter === v ? "bg-white text-[#101828] shadow-sm" : "text-[#6a7282] hover:text-[#101828]"}`}
                    >
                      {v === "all" ? "All" : v === "active" ? "Active" : "Pending activation"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setFirmsOpen(false)} className="size-[34px] rounded-full hover:bg-[#f6f6f6] flex items-center justify-center cursor-pointer">
                  <X className="size-4 text-[#6a7282]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              {firmsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 text-[#9ca3af] animate-spin" />
                </div>
              ) : firmsError ? (
                <p className="text-[13px] text-[#c14] py-8 text-center">{firmsError}</p>
              ) : (() => {
                const filtered = firms.filter((f) =>
                  firmsFilter === "all" ? true :
                  firmsFilter === "active" ? f.active === true :
                  f.active !== true
                );
                if (!filtered.length) {
                  return <p className="text-[13px] text-[#6a7282] py-12 text-center">No firms match this filter.</p>;
                }
                return (
                  <div className="flex flex-col gap-2">
                    {filtered.map((f) => {
                      const ts = f.submittedAt ? new Date(f.submittedAt).toLocaleString() : "";
                      const status = f.active === true ? "Active" : "Pending";
                      const statusCls = f.active === true ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fef3c7] text-[#92400e]";
                      const verified = f.verified === true;
                      return (
                        <a
                          key={f.slug}
                          href={`/designer/${f.slug}?preview=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="block border border-[#e8eaed] rounded-xl p-4 hover:bg-[#fafafa] transition-colors no-underline"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusCls}`}>{status}</span>
                                {verified && <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#dbeafe] text-[#1e40af]">Verified</span>}
                                <span className="text-[12px] text-[#9ca3af]">{ts}</span>
                              </div>
                              <div className="font-semibold text-[14px] text-[#101828] truncate">{f.name || f.slug}</div>
                              <div className="text-[12px] text-[#6a7282] mt-0.5 truncate">
                                {f.slug} · {f.contactEmail || "(no email)"}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9ca3af] flex-wrap">
                                {f.acraUen && <span>{f.acraUen}</span>}
                                {f.yearsExperience && <span>· {f.yearsExperience}y exp</span>}
                                {Array.isArray(f.serviceArea) && f.serviceArea.length > 0 && <span>· {f.serviceArea.join(", ")}</span>}
                                {f.completeness && <span>· {f.completeness.filled}/{f.completeness.total} complete</span>}
                              </div>
                            </div>
                            <ChevronRight className="size-4 text-[#9ca3af] shrink-0 mt-1" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="px-6 py-3 border-t border-[#e8eaed] text-[12px] text-[#6a7282] flex items-center justify-between">
              <span>{firms.length} total firm{firms.length === 1 ? "" : "s"}</span>
              <button onClick={openFirms} className="text-[#3b82f6] hover:underline cursor-pointer">Refresh</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ═══ Live Activity ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5 flex items-center gap-5">
        <div className="relative">
          <div className={`size-[12px] rounded-full ${vercelRealtime.devices > 0 ? "bg-[#22c55e] animate-pulse" : "bg-[#d1d5db]"}`} />
        </div>
        <span className="text-[32px] font-bold text-[#101828] tracking-tight leading-none">
          {vercelRealtime.devices}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold text-[#101828]">
            live visitor{vercelRealtime.devices !== 1 ? "s" : ""}
          </span>
          <span className="text-[12px] text-[#9ca3af]">
            {vercelRealtime.total} page view{vercelRealtime.total !== 1 ? "s" : ""}
            {vercelRealtime.bounceRate !== undefined && vercelRealtime.bounceRate > 0 && (
              <> &middot; {vercelRealtime.bounceRate}% bounce</>
            )}
          </span>
        </div>
      </div>

      {/* ═══ Date Range ═══ */}
      <div className="flex items-center gap-3 text-[13px] text-[#6a7282]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg">
          <Calendar className="size-[14px]" />
          <span className="font-medium">{dateRange}</span>
          <ChevronDown className="size-3" />
        </div>
        {analytics?.meta && (
          <>
            <span className="text-[#9ca3af]">~</span>
            <span>{new Date(analytics.meta.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(analytics.meta.to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </>
        )}
      </div>

      {/* ═══ Key Stats from Vercel Analytics ═══ */}
      {(() => {
        // Compute totals from timeseries (Vercel uses "total" for page views, "devices" for unique visitors)
        const ts = analytics?.timeseries || [];
        const totalPageViews = ts.reduce((s: number, d: any) => s + (d.total || 0), 0);
        const totalVisitors = ts.reduce((s: number, d: any) => s + (d.devices || 0), 0);
        const sparkPV = ts.length > 1 ? ts.map((d: any) => d.total || 0) : generateSparkline(50, 15);
        const sparkV = ts.length > 1 ? ts.map((d: any) => d.devices || 0) : generateSparkline(30, 10);

        // Compute % change (first half vs second half)
        const half = Math.floor(ts.length / 2);
        const firstHalfPV = ts.slice(0, half).reduce((s: number, d: any) => s + (d.total || 0), 0);
        const secondHalfPV = ts.slice(half).reduce((s: number, d: any) => s + (d.total || 0), 0);
        const pvChange = firstHalfPV > 0 ? Math.round(((secondHalfPV - firstHalfPV) / firstHalfPV) * 100) : 0;
        const firstHalfV = ts.slice(0, half).reduce((s: number, d: any) => s + (d.devices || 0), 0);
        const secondHalfV = ts.slice(half).reduce((s: number, d: any) => s + (d.devices || 0), 0);
        const vChange = firstHalfV > 0 ? Math.round(((secondHalfV - firstHalfV) / firstHalfV) * 100) : 0;

        return (
          <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[15px] text-[#101828]">
                Key stats
                {analytics && <span className="text-[11px] font-normal text-[#22c55e] ml-2">Live from Vercel</span>}
                {analyticsError && <span className="text-[11px] font-normal text-[#f59e0b] ml-2">Vercel not connected</span>}
              </h3>
              <button onClick={fetchAnalytics} className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer flex items-center gap-1">
                <Activity className="size-3" /> Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Page views"
                value={totalPageViews}
                change={pvChange}
                changeLabel="last 30 days"
                sparkData={sparkPV}
                color="#3b82f6"
              />
              <StatCard
                label="Unique visitors"
                value={totalVisitors}
                change={vChange}
                changeLabel="last 30 days"
                sparkData={sparkV}
                color="#8b5cf6"
              />
              {(() => {
                // Compute average bounce rate from timeseries
                const withBounce = ts.filter((d: any) => d.bounceRate !== undefined && d.total > 0);
                const avgBounce = withBounce.length > 0
                  ? Math.round(withBounce.reduce((s: number, d: any) => s + (d.bounceRate || 0), 0) / withBounce.length)
                  : 0;
                const sparkBounce = ts.length > 1 ? ts.map((d: any) => d.bounceRate || 0) : generateSparkline(50, 15);
                // Bounce rate change (first half vs second half)
                const firstHalfB = ts.slice(0, half).filter((d: any) => d.total > 0);
                const secondHalfB = ts.slice(half).filter((d: any) => d.total > 0);
                const avgFirst = firstHalfB.length > 0 ? firstHalfB.reduce((s: number, d: any) => s + (d.bounceRate || 0), 0) / firstHalfB.length : 0;
                const avgSecond = secondHalfB.length > 0 ? secondHalfB.reduce((s: number, d: any) => s + (d.bounceRate || 0), 0) / secondHalfB.length : 0;
                const bChange = avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0;
                return (
                  <StatCard
                    label="Bounce rate"
                    value={`${avgBounce}%`}
                    change={bChange}
                    changeLabel="last 30 days"
                    sparkData={sparkBounce}
                    color="#f59e0b"
                  />
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* ═══ Devices, Browsers & OS ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Devices, Browsers & OS" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Devices */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Devices</h4>
            {analytics?.devices?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.devices.slice(0, 6).map((d: any, i: number) => (
                  <PageRow key={i} name={d.key || "Unknown"} change={0} value={d.total} color={["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4"][i % 6]} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel" : analytics ? "No device data yet" : "Loading..."}</p>
            )}
          </div>

          {/* Browsers */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Browsers</h4>
            {analytics?.browsers?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.browsers.slice(0, 6).map((b: any, i: number) => (
                  <PageRow key={i} name={b.key || "Unknown"} change={0} value={b.total} color={["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#06b6d4"][i % 6]} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel" : analytics ? "No browser data yet" : "Loading..."}</p>
            )}
          </div>

          {/* Operating Systems */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Operating Systems</h4>
            {analytics?.os?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.os.slice(0, 6).map((o: any, i: number) => (
                  <PageRow key={i} name={o.key || "Unknown"} change={0} value={o.total} color={["#3b82f6","#f59e0b","#22c55e","#8b5cf6","#ef4444","#06b6d4"][i % 6]} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel" : analytics ? "No OS data yet" : "Loading..."}</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Visitor Engagement (Vercel Analytics) ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Explore platform engagement" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Pages — from Vercel */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Top pages</h4>
            {analytics?.pages?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.pages.slice(0, 6).map((p: any, i: number) => (
                  <PageRow key={i} name={p.key} change={0} value={p.total} color={["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4"][i % 6]} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel to see top pages" : analytics ? "No page data yet" : "Loading..."}</p>
            )}
          </div>

          {/* Top Referrers — from Vercel */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Top referrers</h4>
            {analytics?.referrers?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.referrers.slice(0, 6).map((r: any, i: number) => (
                  <SourceRow key={i} name={r.key} change={0} value={r.total} isPositive={true} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel to see referrers" : analytics ? "No referrer data yet" : "Loading..."}</p>
            )}
          </div>

          {/* Countries — from Vercel */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Visitors by country</h4>
            {analytics?.countries?.length > 0 ? (
              <div className="space-y-0 divide-y divide-[#f3f4f6]">
                {analytics.countries.slice(0, 6).map((c: any, i: number) => (
                  <PageRow key={i} name={c.key} change={0} value={c.total} color={["#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ef4444","#06b6d4"][i % 6]} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9ca3af]">{analyticsError ? "Connect Vercel to see countries" : analytics ? "No country data yet" : "Loading..."}</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Marketing Performance ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Analyze platform performance" actionLabel="Go to Marketing Overview" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search Console */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-[36px] rounded-lg bg-[#f3f4f6] flex items-center justify-center">
                <Globe className="size-[18px] text-[#6a7282]" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#101828]">Search Console</h4>
                <p className="text-[11px] text-[#9ca3af]">See how people find you on Google</p>
              </div>
            </div>
            <p className="text-[12px] text-[#6a7282] mb-3">
              Connect to Google to see performance in search results.
            </p>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer">Connect to Google</button>
          </div>

          {/* User queries */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-[12px] text-[#8b5cf6]" />
              <h4 className="text-[13px] font-semibold text-[#101828]">User queries on AI by page</h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fef3c7] text-[#d97706]">New</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[24px] font-bold text-[#101828]">97</span>
              <span className="text-[11px] font-medium text-[#22c55e]">↑ 20%</span>
            </div>
            <div className="space-y-0 divide-y divide-[#f3f4f6]">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-[#3b82f6] flex items-center gap-1">/homepage <ExternalLink className="size-2.5" /></span>
                <div className="flex items-center gap-2"><span className="text-[10px] text-[#22c55e]">+6%</span><span className="text-[13px] font-semibold text-[#101828]">62</span></div>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-[#3b82f6] flex items-center gap-1">/about <ExternalLink className="size-2.5" /></span>
                <div className="flex items-center gap-2"><span className="text-[10px] text-[#22c55e]">+31%</span><span className="text-[13px] font-semibold text-[#101828]">8</span></div>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-[#3b82f6] flex items-center gap-1">/get-matched <ExternalLink className="size-2.5" /></span>
                <div className="flex items-center gap-2"><span className="text-[10px] text-[#ef4444]">-98%</span><span className="text-[13px] font-semibold text-[#101828]">6</span></div>
              </div>
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* Email Marketing */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-[36px] rounded-lg bg-[#f3f4f6] flex items-center justify-center">
                <UserPlus className="size-[18px] text-[#6a7282]" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#101828]">Grow your audience with emails</h4>
                <p className="text-[11px] text-[#9ca3af]">Reach out to potential customers</p>
              </div>
            </div>
            <p className="text-[12px] text-[#6a7282] mb-3">
              Reach out to potential customers with customized email campaigns.
            </p>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer">Create Your First Email</button>
          </div>
        </div>

        {/* AI visibility banner */}
        <div className="mt-5 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg flex items-center justify-between">
          <span className="text-[12px] text-[#6a7282]">
            See how your site appears on AI platforms and what people learn about your brand.
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg text-[12px] font-medium text-[#364153] hover:bg-[#f3f4f6] transition-colors cursor-pointer shrink-0 ml-4">
            <Sparkles className="size-3" /> Go to AI Visibility Overview <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      {/* ═══ Traffic Over Time (Vercel Analytics) ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Traffic over time" />
        {(() => {
          const ts = analytics?.timeseries || [];
          const chartData = ts.map((d: any) => ({
            date: new Date(d.key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            pageViews: d.total || 0,
            visitors: d.devices || 0,
          }));
          if (chartData.length === 0) return (
            <p className="text-[13px] text-[#9ca3af] py-8 text-center">{analyticsError ? "Connect Vercel Analytics to see traffic data" : "Loading traffic data..."}</p>
          );
          return (
            <div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} interval={Math.max(0, Math.floor(chartData.length / 7) - 1)} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#3b82f6" strokeWidth={2} fill="url(#pvGrad)" />
                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#8b5cf6" strokeWidth={2} fill="url(#vGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2 text-[11px]">
                <div className="flex items-center gap-1.5"><div className="size-[8px] rounded-sm bg-[#3b82f6]" /> Page Views</div>
                <div className="flex items-center gap-1.5"><div className="size-[8px] rounded-sm bg-[#8b5cf6]" /> Visitors</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

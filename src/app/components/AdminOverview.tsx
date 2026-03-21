import { useState, useEffect, useCallback } from "react";
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

  // Live visitor tracking
  const [liveVisitors, setLiveVisitors] = useState<{ count: number; visitors: { visitorId: string; page: string; lastSeen: number }[] }>({ count: 0, visitors: [] });

  const fetchLiveVisitors = useCallback(async () => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/live-visitors`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLiveVisitors(data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchLiveVisitors();
    const interval = setInterval(fetchLiveVisitors, 15_000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchLiveVisitors]);

  // Generate mock data once
  const [dailyData] = useState(() => generateDailyData(30));
  const [sparkProjects] = useState(() => generateSparkline(120, 30));
  const [sparkTemplates] = useState(() => generateSparkline(24, 8));
  const [sparkRenders] = useState(() => generateSparkline(45, 15));
  const [sparkLeads] = useState(() => generateSparkline(85, 25));

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAdminAuthHeaders();
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
        totalProjects: Math.floor(Math.random() * 200 + 150), // Simulated - would need a real admin endpoint
        totalTemplates,
        totalDesigners,
        totalRenders: Math.floor(Math.random() * 100 + 50),
        totalLeads: Math.floor(Math.random() * 300 + 100),
        activeTemplates,
      });
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

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
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            Alerts and Emails <ChevronDown className="size-3.5" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors cursor-pointer">
            All Reports <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ Live Activity + AI Search ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live activity */}
        <div className="bg-white border border-[#e8eaed] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className={`size-[8px] rounded-full ${liveVisitors.count > 0 ? "bg-[#22c55e] animate-pulse" : "bg-[#d1d5db]"}`} />
            </div>
            <span className="text-[14px] font-semibold text-[#101828]">
              {liveVisitors.count} live visitor{liveVisitors.count !== 1 ? "s" : ""}
            </span>
            <div className="size-[28px] rounded-full bg-[#3b82f6] flex items-center justify-center ml-auto">
              <Users className="size-[14px] text-white" />
            </div>
          </div>
          {liveVisitors.visitors.length > 0 ? (
            <div className="flex flex-col gap-1 mb-2 max-h-[80px] overflow-y-auto">
              {liveVisitors.visitors.slice(0, 5).map((v, i) => (
                <p key={i} className="text-[12px] text-[#9ca3af]">
                  <span className="text-[#6a7282]">{v.visitorId.slice(0, 12)}...</span> is viewing{" "}
                  <span className="text-[#3b82f6]">{v.page}</span>
                </p>
              ))}
              {liveVisitors.visitors.length > 5 && (
                <p className="text-[11px] text-[#9ca3af]">+{liveVisitors.visitors.length - 5} more</p>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-[#9ca3af] mb-2">No active visitors right now</p>
          )}
          <button onClick={fetchLiveVisitors} className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer">Refresh</button>
        </div>

        {/* AI Search */}
        <div className="bg-white border border-[#e8eaed] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-[14px] text-[#3b82f6]" />
            <span className="text-[14px] font-semibold text-[#101828]">Find stats with the help of AI</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Which page has the highest bounce rate?"
              className="flex-1 h-[36px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 text-[13px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#3b82f6] transition-colors"
            />
            <button className="px-4 h-[36px] bg-[#3b82f6] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer">
              Start Chat
            </button>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {["Which pages have the highest bounce rate?", "What are the top traffic sources?"].map((q) => (
              <button key={q} className="shrink-0 px-3 py-1 rounded-full border border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors cursor-pointer truncate max-w-[280px]">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Date Range ═══ */}
      <div className="flex items-center gap-3 text-[13px] text-[#6a7282]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-lg">
          <Calendar className="size-[14px]" />
          <span className="font-medium">{dateRange}</span>
          <ChevronDown className="size-3" />
        </div>
        <span className="text-[#9ca3af]">~</span>
        <span>compared to previous period (Feb 16 - Mar 17, 2026)</span>
      </div>

      {/* ═══ Key Stats ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px] text-[#101828]">Key stats</h3>
          <div className="flex items-center gap-2">
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer flex items-center gap-1">
              <Activity className="size-3" /> Create Alert
            </button>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer flex items-center gap-1 ml-4">
              + Add Stats
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total projects"
            value={stats.totalProjects}
            change={4}
            changeLabel={`${Math.floor(stats.totalProjects * 0.03)} today`}
            sparkData={sparkProjects}
            color="#3b82f6"
          />
          <StatCard
            label="AI renders"
            value={stats.totalRenders}
            change={23}
            changeLabel="0 today"
            sparkData={sparkRenders}
            color="#8b5cf6"
            tag="AI"
          />
          <StatCard
            label="Active templates"
            value={stats.activeTemplates}
            change={7}
            changeLabel={`${stats.totalTemplates} total`}
            sparkData={sparkTemplates}
            color="#22c55e"
          />
          <StatCard
            label="Leads captured"
            value={stats.totalLeads}
            change={-2}
            changeLabel="via contact forms"
            sparkData={sparkLeads}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* ═══ Know Your Users ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Get to know your users" actionLabel="Go to User Overview" onAction={() => onNavigate?.("designers")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Projects by type */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Projects by source</h4>
            <div className="space-y-0 divide-y divide-[#f3f4f6]">
              <SourceRow name="Blank canvas" type="New" change={6} value={3661} isPositive={true} />
              <SourceRow name="From template" type="Import" change={-4} value={421} isPositive={false} />
              <SourceRow name="Floor plan upload" type="AI" change={4} value={330} isPositive={true} />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* Top templates */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Top templates used</h4>
            <div className="space-y-0 divide-y divide-[#f3f4f6]">
              <PageRow name="4-Room BTO Standard" change={12} value={89} color="#3b82f6" />
              <PageRow name="5-Room Resale HDB" change={8} value={67} color="#8b5cf6" />
              <PageRow name="3-Room BTO Compact" change={-3} value={45} color="#f59e0b" />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* AI Platform usage */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-[12px] text-[#8b5cf6]" />
              <h4 className="text-[13px] font-semibold text-[#101828]">AI Features usage</h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#fef3c7] text-[#d97706]">New</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[28px] font-bold text-[#101828]">{stats.totalRenders}</span>
              <span className="text-[11px] font-medium text-[#22c55e]">↑ 105%</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "AI Floor Plan Analysis", pct: "(100%)", count: stats.totalRenders },
                { name: "Auto-Furnish", pct: "(87%)", count: Math.floor(stats.totalRenders * 0.87) },
                { name: "Style Rendering", pct: "(65%)", count: Math.floor(stats.totalRenders * 0.65) },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-[6px] rounded-full bg-[#8b5cf6] shrink-0" />
                    <span className="text-[#6a7282] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#9ca3af]">{item.pct}</span>
                    <span className="font-semibold text-[#101828]">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Visitor Engagement ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Explore platform engagement" actionLabel="Go to Behavior Overview" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Most visited pages */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Most active features</h4>
            <div className="space-y-0 divide-y divide-[#f3f4f6]">
              <PageRow name="/floorplan3d/dashboard" change={6} value={4822} color="#3b82f6" />
              <PageRow name="/floorplan3d/editor" change={9} value={232} color="#22c55e" />
              <PageRow name="/designer/*" change={17} value={194} color="#f59e0b" />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* Engagement stats */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Engagement stats</h4>
            <div className="divide-y divide-[#f3f4f6]">
              <EngagementStat
                icon={<Eye className="size-[14px]" />}
                label="Avg pages per session"
                value="1.3"
                change={7}
              />
              <EngagementStat
                icon={<Clock className="size-[14px]" />}
                label="Avg session duration"
                value="2m 17s"
                change={28}
              />
              <EngagementStat
                icon={<Zap className="size-[14px]" />}
                label="Bounce rate"
                value="87.9%"
                change={-1}
              />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* Most clicked buttons */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Most clicked buttons</h4>
            <div className="divide-y divide-[#f3f4f6]">
              <ButtonClickRow label="New Project" sublabel="/floorplan3d/dashboard" count={65} />
              <ButtonClickRow label="Get Matched" sublabel="/floorplan3d/editor" count={53} />
              <ButtonClickRow label="Start my Cost Guide" sublabel="/cost-guide" count={31} />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
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

      {/* ═══ Activity Chart ═══ */}
      <div className="bg-white border border-[#e8eaed] rounded-xl p-5">
        <SectionHeader title="Monitor platform activity" actionLabel="Go to Activity Overview" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blog-style table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-semibold text-[#101828]">
                Recent activity by <button className="text-[#3b82f6] underline cursor-pointer">date</button> ↓
              </h4>
              <div className="flex items-center gap-6 text-[11px] font-medium text-[#9ca3af]">
                <span>Projects</span>
                <span>Renders</span>
                <span>Avg. time</span>
              </div>
            </div>
            <div>
              <BlogRow title="How to Tell if a Renovation Quote is Overpriced (and W..." date="Dec 24, 2025" views={14} viewsChange={22} clicks={3} avgRead="2m 30s" />
              <BlogRow title="Interior Designer vs Contractor in Singapore: Which On..." date="Dec 24, 2025" views={4} viewsChange={-23} clicks={1} avgRead="1m 36s" />
              <BlogRow title="2026 Renovation Cost in Singapore: The Complete Guide" date="Dec 24, 2025" views={9} viewsChange={-18} clicks={3} avgRead="1m 15s" />
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>

          {/* Activity Chart */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#101828] mb-3">Projects created by time of day</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData.slice(-7)} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renders" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-[11px]">
              <div className="flex items-center gap-1.5"><div className="size-[8px] rounded-sm bg-[#3b82f6]" /> Projects</div>
              <div className="flex items-center gap-1.5"><div className="size-[8px] rounded-sm bg-[#e2e8f0]" /> Renders</div>
            </div>
            <button className="text-[12px] font-medium text-[#3b82f6] hover:underline cursor-pointer mt-3">View Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}

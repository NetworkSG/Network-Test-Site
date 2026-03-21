import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { resolveAsset } from "../utils/resolveAsset";
import {
  LayoutDashboard, MessageSquare, FolderOpen, Star, Users, Settings,
  LogOut, Plus, Trash2, Pencil, Eye, ChevronDown, X, Check, Search,
  Clock, Mail, Phone, Building2, DollarSign, CalendarDays, ArrowUpRight,
  Loader2, AlertCircle, ExternalLink, Upload, Save, TrendingUp, Award,
  MapPin, Globe, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

function api(path: string, opts: any = {}) {
  const token = localStorage.getItem("designer-token") || "";
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      "X-Designer-Token": token,
      ...(opts.headers || {}),
    },
  });
}

// ─── Types ─────────────────────────────────────────────────────────
interface Inquiry {
  id: string; name: string; email: string; phone: string;
  propertyType: string; budget: string; timeline: string;
  message: string; status: string; createdAt: string;
}

// ─── LOGIN SCREEN ──────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string, slug: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ slug: "", email: "", password: "", setupCode: "" });
  const [setupMsg, setSetupMsg] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/designer-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Login failed"); setLoading(false); return; }
      localStorage.setItem("designer-token", json.token);
      localStorage.setItem("designer-slug", json.slug);
      onLogin(json.token, json.slug);
    } catch (err: any) {
      setError(err.message || "Network error");
    }
    setLoading(false);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupMsg(""); setSetupError(""); setSetupLoading(true);
    try {
      const res = await fetch(`${API}/designer-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(setupForm),
      });
      const json = await res.json();
      if (!res.ok) { setSetupError(json.error || "Failed"); }
      else { setSetupMsg(`Credentials created for ${json.slug} (${json.email}). You can now sign in.`); setSetupForm({ slug: "", email: "", password: "", setupCode: "" }); }
    } catch (err: any) { setSetupError(err.message); }
    setSetupLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center px-4 font-['Inter',sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white border border-[#F3F4F6] p-8 md:p-10"
        style={{ borderRadius: 20, boxShadow: "0 25px 35.9px rgba(0,0,0,0.04)" }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#09090B] flex items-center justify-center text-white" style={{ borderRadius: 16 }}>
            <Briefcase size={24} />
          </div>
        </div>
        <h1 className="text-[24px] font-bold text-[#09090B] tracking-[-1px] text-center">Designer Portal</h1>
        <p className="text-[14px] text-[#71717A] text-center mt-1 mb-8">Sign in to manage your profile and inquiries</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@company.com" />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="Enter your password" />
          {error && <p className="text-[13px] text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full h-[46px] bg-[#09090B] text-white text-[15px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
            style={{ borderRadius: 14 }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#F3F4F6]">
          <button onClick={() => setShowSetup(!showSetup)} className="text-[13px] text-[#71717A] hover:text-[#09090B] flex items-center gap-1 mx-auto">
            {showSetup ? "Hide" : "Show"} setup <ChevronDown size={14} className={`transition-transform ${showSetup ? "rotate-180" : ""}`} />
          </button>
          {showSetup && (
            <form onSubmit={handleSetup} className="mt-4 space-y-3">
              <Field label="Designer Slug" value={setupForm.slug} onChange={(v: string) => setSetupForm({ ...setupForm, slug: v })} placeholder="e.g. sora-studios" />
              <Field label="Login Email" value={setupForm.email} onChange={(v: string) => setSetupForm({ ...setupForm, email: v })} type="email" placeholder="designer@email.com" />
              <Field label="Set Password" value={setupForm.password} onChange={(v: string) => setSetupForm({ ...setupForm, password: v })} type="password" placeholder="Choose a password" />
              <Field label="Admin Setup Code" value={setupForm.setupCode} onChange={(v: string) => setSetupForm({ ...setupForm, setupCode: v })} placeholder="Enter admin code" />
              {setupError && <p className="text-[13px] text-red-500">{setupError}</p>}
              {setupMsg && <p className="text-[13px] text-green-600">{setupMsg}</p>}
              <button type="submit" disabled={setupLoading}
                className="w-full h-[42px] bg-[#09090B] text-white text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ borderRadius: 14 }}
              >
                {setupLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Credentials"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "#09090B" }: { label: string; value: number | string; icon: any; color?: string }) {
  return (
    <div className="bg-white border border-[#F3F4F6] p-5 flex items-center gap-4" style={{ borderRadius: 17 }}>
      <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{ borderRadius: 12, background: color + "10" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-[24px] font-bold text-[#09090B] tracking-[-1.2px] leading-[1.1]">{value}</p>
        <p className="text-[13px] text-[#71717A] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── MODAL WRAPPER ─────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-[560px] max-h-[85vh] overflow-y-auto"
          style={{ borderRadius: 17, boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center justify-between p-6 border-b border-[#F3F4F6]">
            <h3 className="text-[20px] font-bold text-[#09090B] tracking-[-0.5px]">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#F6F6F6] transition-colors" style={{ borderRadius: 8 }}>
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── FIELD COMPONENT ───────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", rows, required }: any) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#09090B] mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {rows ? (
        <textarea
          value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          className="w-full px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors resize-none"
          style={{ borderRadius: 14 }}
        />
      ) : (
        <input
          type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-[42px] px-4 bg-[#F9FAFB] border border-[#E5E7EB] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors"
          style={{ borderRadius: 14 }}
        />
      )}
    </div>
  );
}

// ─── DATA HELPERS ──────────────────────────────────────────────────
// Normalize different data formats from the public profile
function getCompanyName(d: any): string { return d?.companyName || d?.name || ""; }
function getContactName(d: any): string { return d?.founder || ""; }
function getBio(d: any): string { return d?.description || d?.bio || ""; }
function getTagline(d: any): string { return d?.tagline || ""; }
function getLocation(d: any): string { return d?.address || d?.location || ""; }
function getLogo(d: any): string { return d?.logo || d?.images?.logo || ""; }
function getHeroImage(d: any): string { return d?.heroImage || d?.images?.hero || d?.coverProject?.image || ""; }
function getStats(d: any) {
  return {
    years: d?.yearsInBusiness || d?.stats?.years || "",
    rating: d?.rating || d?.stats?.rating || "",
    reviewCount: d?.reviewCount || d?.stats?.reviewCount || "",
    totalProjects: d?.projectsCompleted || d?.totalProjects || "",
  };
}
function getTeamMembers(d: any): any[] {
  return (d?.team || []).filter((m: any) => m.type === "person" || (!m.type && m.role));
}
function getProjects(d: any): any[] {
  // Normalize: public profile uses {name, meta, image}, dashboard uses {title, type, image}
  return (d?.projects || []).map((p: any, i: number) => ({
    id: p.id || `proj-${i}`,
    title: p.title || p.name || "",
    type: p.type || p.meta || "",
    image: p.image || "",
    location: p.location || "",
    budget: p.budget || "",
    duration: p.duration || "",
    description: p.description || "",
    // Keep original fields for save
    _original: p,
  }));
}
function getCaseStudies(d: any): any[] { return d?.caseStudies || []; }
function getReviews(d: any): any[] {
  // Normalize: public uses {name, text, date}, dashboard uses {reviewer, text, date, rating}
  const all = [...(d?.latestReviews || []), ...(d?.reviews || [])];
  return all.map((r: any, i: number) => ({
    id: r.id || `rev-${i}`,
    reviewer: r.reviewer || r.name || "",
    rating: r.rating || 5,
    text: r.text || "",
    date: r.date || "",
    verified: r.verified ?? true,
    avatar: r.avatar || "",
    _original: r,
  }));
}

// ─── TAB DEFINITIONS ───────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "testimonials", label: "Testimonials", icon: Star },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Edit Page", icon: Settings },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── MAIN DASHBOARD ────────────────────────────────────────────────
export function DesignerDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [slug, setSlug] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("designer-token");
    const savedSlug = localStorage.getItem("designer-slug");
    if (!token || !savedSlug) { setAuthed(false); return; }
    api("/designer-session").then(r => r.json()).then(json => {
      if (json.valid) { setSlug(json.slug); setAuthed(true); }
      else { localStorage.removeItem("designer-token"); localStorage.removeItem("designer-slug"); setAuthed(false); }
    }).catch(() => setAuthed(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api(`/designer-dashboard/${slug}`);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (err) { console.error("Failed to fetch dashboard data:", err); }
    setLoading(false);
  }, [slug]);

  useEffect(() => { if (authed && slug) fetchData(); }, [authed, slug, fetchData]);

  const handleLogout = async () => {
    await api("/designer-logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("designer-token");
    localStorage.removeItem("designer-slug");
    setAuthed(false);
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6]">
        <Loader2 className="text-[#09090B] animate-spin" size={28} />
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={(t, s) => { setSlug(s); setAuthed(true); }} />;
  }

  const companyName = getCompanyName(data);
  const logo = getLogo(data);

  return (
    <div className="min-h-screen bg-[#F6F6F6] font-['Inter',sans-serif] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[260px] bg-white border-r border-[#F3F4F6] z-50 flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={resolveAsset(logo)} alt="" className="w-10 h-10 object-cover" style={{ borderRadius: 10 }} />
            ) : (
              <div className="w-10 h-10 bg-[#09090B] flex items-center justify-center text-white font-bold text-[14px]" style={{ borderRadius: 10 }}>
                {(companyName || "D").charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#09090B] truncate">{companyName || "Dashboard"}</p>
              <p className="text-[12px] text-[#71717A] truncate">Designer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] transition-colors ${tab === t.id ? "bg-[#09090B] text-white font-medium" : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"}`}
              style={{ borderRadius: 10 }}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#F3F4F6]">
          <Link
            to={`/designer/${slug}`} target="_blank"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B] transition-colors mb-0.5"
            style={{ borderRadius: 10 }}
          >
            <ExternalLink size={18} /> View Public Page
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] text-[#71717A] hover:bg-red-50 hover:text-red-600 transition-colors"
            style={{ borderRadius: 10 }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#F3F4F6] sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F6F6F6]" style={{ borderRadius: 8 }}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M1 1h16M1 7h16M1 13h16" stroke="#09090B" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <p className="text-[14px] font-semibold text-[#09090B]">{TABS.find(t => t.id === tab)?.label}</p>
          <div className="w-9" />
        </div>

        <div className="p-4 md:p-8 max-w-[1100px]">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="text-[#09090B] animate-spin" size={28} />
            </div>
          ) : (
            <>
              {tab === "overview" && <OverviewTab data={data} onNavigate={setTab} />}
              {tab === "inquiries" && <InquiriesTab slug={slug} data={data} refreshData={fetchData} />}
              {tab === "projects" && <ProjectsTab slug={slug} data={data} refreshData={fetchData} />}
              {tab === "testimonials" && <TestimonialsTab slug={slug} data={data} refreshData={fetchData} />}
              {tab === "team" && <TeamTab slug={slug} data={data} refreshData={fetchData} />}
              {tab === "settings" && <EditPageTab slug={slug} data={data} refreshData={fetchData} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── OVERVIEW TAB ──────────────────────────────────────────────────
function OverviewTab({ data, onNavigate }: { data: any; onNavigate: (tab: TabId) => void }) {
  const inquiries: Inquiry[] = data?.inquiries || [];
  const newInquiries = inquiries.filter(i => i.status === "new");
  const recentInquiries = inquiries.slice(0, 5);
  const stats = getStats(data);
  const team = getTeamMembers(data);
  const reviews = getReviews(data);
  const projects = getProjects(data);
  const contactName = getContactName(data);
  const companyName = getCompanyName(data);

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-[32px] md:text-[40px] font-semibold text-[#09090B] tracking-[-2px] leading-[1.1]">
          Welcome back{contactName ? `, ${contactName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[16px] text-[#71717A] mt-2">
          Here's an overview of <span className="font-medium text-[#09090B]">{companyName}</span>
        </p>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white border border-[#F3F4F6] p-5 md:p-6 mb-6" style={{ borderRadius: 17 }}>
        <div className="flex items-start gap-4">
          {getLogo(data) ? (
            <img src={resolveAsset(getLogo(data))} alt="" className="w-14 h-14 object-cover shrink-0" style={{ borderRadius: 12 }} />
          ) : (
            <div className="w-14 h-14 bg-[#09090B] text-white flex items-center justify-center text-[20px] font-bold shrink-0" style={{ borderRadius: 12 }}>
              {companyName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#09090B] tracking-[-0.5px]">{companyName}</h2>
            <p className="text-[13px] text-[#71717A] mt-0.5 line-clamp-2">{getTagline(data) || getBio(data)}</p>
            <div className="flex items-center gap-4 mt-3 text-[12px] text-[#71717A]">
              {getLocation(data) && <span className="flex items-center gap-1"><MapPin size={12} />{getLocation(data)}</span>}
              {stats.years && <span className="flex items-center gap-1"><Briefcase size={12} />{stats.years} years</span>}
              {stats.rating && <span className="flex items-center gap-1"><Star size={12} className="text-[#D97706] fill-[#D97706]" />{stats.rating}</span>}
            </div>
          </div>
          <Link to={`/designer/${data?.slug}`} target="_blank"
            className="px-3.5 py-2 text-[12px] font-medium text-[#71717A] border border-[#E5E7EB] hover:bg-[#F6F6F6] shrink-0 flex items-center gap-1.5"
            style={{ borderRadius: 100 }}
          >
            <ExternalLink size={12} /> View Page
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard label="Inquiries" value={inquiries.length} icon={MessageSquare} color="#09090B" />
        <StatCard label="Projects" value={stats.totalProjects || projects.length} icon={FolderOpen} color="#09090B" />
        <StatCard label="Team Members" value={team.length} icon={Users} color="#09090B" />
        <StatCard label="Reviews" value={stats.reviewCount || reviews.length} icon={Star} color="#D97706" />
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white border border-[#F3F4F6] p-5 md:p-6 mb-6" style={{ borderRadius: 17 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-[#09090B] tracking-[-0.5px]">Recent Inquiries</h2>
          <button onClick={() => onNavigate("inquiries")} className="text-[13px] font-medium text-[#09090B] hover:underline flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </button>
        </div>
        {recentInquiries.length === 0 ? (
          <p className="text-[14px] text-[#ABABAB] py-8 text-center">No inquiries yet. They'll appear here when homeowners contact you.</p>
        ) : (
          <div className="space-y-3">
            {recentInquiries.map(inq => (
              <div key={inq.id} className="flex items-center gap-3 p-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors cursor-pointer" style={{ borderRadius: 12 }}>
                <div className="w-9 h-9 bg-[#09090B] text-white flex items-center justify-center shrink-0 text-[13px] font-semibold" style={{ borderRadius: "50%" }}>
                  {inq.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-[#09090B] truncate">{inq.name}</p>
                  <p className="text-[12px] text-[#71717A] truncate">{inq.propertyType} &middot; {inq.budget}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-[11px] font-medium ${inq.status === "new" ? "bg-[#FFF6DC] text-[#92400E] border border-[#FFEAB1]" : "bg-[#F6F6F6] text-[#71717A] border border-[#E5E7EB]"}`} style={{ borderRadius: 100 }}>
                    {inq.status}
                  </span>
                  <p className="text-[11px] text-[#ABABAB] mt-1">{new Date(inq.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Manage Projects", desc: `${projects.length} portfolio items`, tab: "projects" as TabId, icon: FolderOpen },
          { label: "Edit Testimonials", desc: `${reviews.length} reviews`, tab: "testimonials" as TabId, icon: Star },
          { label: "Update Team", desc: `${team.length} members`, tab: "team" as TabId, icon: Users },
        ].map(a => (
          <button key={a.tab} onClick={() => onNavigate(a.tab)}
            className="bg-white border border-[#F3F4F6] p-4 md:p-5 text-left hover:border-[#09090B] transition-colors group"
            style={{ borderRadius: 17 }}
          >
            <a.icon size={20} className="text-[#71717A] group-hover:text-[#09090B] transition-colors mb-3" />
            <p className="text-[14px] font-medium text-[#09090B]">{a.label}</p>
            <p className="text-[12px] text-[#ABABAB] mt-0.5">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── INQUIRIES TAB ─────────────────────────────────────────────────
function InquiriesTab({ slug, data, refreshData }: { slug: string; data: any; refreshData: () => void }) {
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const inquiries: Inquiry[] = data?.inquiries || [];

  const filtered = inquiries.filter(inq => {
    if (filter !== "all" && inq.status !== filter) return false;
    if (search && !inq.name.toLowerCase().includes(search.toLowerCase()) && !inq.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    await api(`/designer-inquiries/${slug}/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    refreshData();
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    await api(`/designer-inquiries/${slug}/${id}`, { method: "DELETE" });
    setSelected(null);
    refreshData();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#09090B] tracking-[-1.4px]">Inquiries</h1>
          <p className="text-[14px] text-[#71717A]">{inquiries.length} total inquiries</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#99A1AF]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-[42px] pl-10 pr-4 bg-white border border-[#E5E7EB] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B]"
            style={{ borderRadius: 14 }}
          />
        </div>
        <div className="flex gap-2">
          {["all", "new", "contacted", "archived"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[13px] font-medium border transition-colors capitalize ${filter === f ? "bg-[#09090B] text-white border-[#09090B]" : "bg-white text-[#71717A] border-[#E5E7EB] hover:border-[#09090B] hover:text-[#09090B]"}`}
              style={{ borderRadius: 100 }}
            >
              {f === "all" ? `All (${inquiries.length})` : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] py-16 text-center" style={{ borderRadius: 17 }}>
          <MessageSquare size={32} className="text-[#ABABAB] mx-auto mb-3" />
          <p className="text-[14px] text-[#71717A]">{inquiries.length === 0 ? "No inquiries yet. They'll appear here when homeowners contact you." : "No inquiries match your filter"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inq => (
            <div key={inq.id} onClick={() => setSelected(inq)}
              className="bg-white border border-[#F3F4F6] hover:border-[#E5E7EB] p-4 flex items-start gap-3 cursor-pointer transition-colors"
              style={{ borderRadius: 14 }}
            >
              <div className="w-10 h-10 bg-[#09090B] text-white flex items-center justify-center shrink-0 text-[14px] font-semibold" style={{ borderRadius: "50%" }}>
                {inq.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] font-semibold text-[#09090B]">{inq.name}</p>
                  <span className={`px-2 py-0.5 text-[11px] font-medium ${inq.status === "new" ? "bg-[#FFF6DC] text-[#92400E] border border-[#FFEAB1]" : inq.status === "contacted" ? "bg-green-50 text-green-700 border border-green-200" : "bg-[#F6F6F6] text-[#71717A] border border-[#E5E7EB]"}`} style={{ borderRadius: 100 }}>
                    {inq.status}
                  </span>
                </div>
                <p className="text-[13px] text-[#71717A] truncate mt-0.5">{inq.email} &middot; {inq.phone}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#ABABAB]">
                  <span className="flex items-center gap-1"><Building2 size={12} />{inq.propertyType}</span>
                  <span className="flex items-center gap-1"><DollarSign size={12} />{inq.budget}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{inq.timeline}</span>
                </div>
              </div>
              <p className="text-[12px] text-[#ABABAB] shrink-0">{new Date(inq.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Inquiry Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#09090B] text-white flex items-center justify-center text-[18px] font-semibold" style={{ borderRadius: "50%" }}>
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#09090B]">{selected.name}</p>
                <p className="text-[13px] text-[#71717A]">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F9FAFB] p-3" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-0.5">Email</p><p className="text-[13px] text-[#09090B]">{selected.email}</p></div>
              <div className="bg-[#F9FAFB] p-3" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-0.5">Phone</p><p className="text-[13px] text-[#09090B]">{selected.phone}</p></div>
              <div className="bg-[#F9FAFB] p-3" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-0.5">Property Type</p><p className="text-[13px] text-[#09090B]">{selected.propertyType}</p></div>
              <div className="bg-[#F9FAFB] p-3" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-0.5">Budget</p><p className="text-[13px] text-[#09090B]">{selected.budget}</p></div>
              <div className="bg-[#F9FAFB] p-3 col-span-2" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-0.5">Timeline</p><p className="text-[13px] text-[#09090B]">{selected.timeline}</p></div>
            </div>
            {selected.message && (
              <div className="bg-[#F9FAFB] p-4" style={{ borderRadius: 10 }}><p className="text-[11px] text-[#ABABAB] mb-1">Message</p><p className="text-[14px] text-[#09090B] leading-[1.6]">{selected.message}</p></div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <label className="text-[13px] text-[#71717A] shrink-0">Status:</label>
              {["new", "contacted", "archived"].map(s => (
                <button key={s} onClick={() => { updateStatus(selected.id, s); setSelected({ ...selected, status: s }); }}
                  className={`px-3 py-1.5 text-[12px] font-medium border capitalize transition-colors ${selected.status === s ? "bg-[#09090B] text-white border-[#09090B]" : "text-[#71717A] border-[#E5E7EB] hover:border-[#09090B]"}`}
                  style={{ borderRadius: 100 }}
                >{s}</button>
              ))}
              <div className="flex-1" />
              <button onClick={() => deleteInquiry(selected.id)} className="p-2 text-[#ABABAB] hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── PROJECTS TAB ──────────────────────────────────────────────────
function ProjectsTab({ slug, data, refreshData }: { slug: string; data: any; refreshData: () => void }) {
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const projects = getProjects(data);
  const caseStudies = getCaseStudies(data);

  const openNew = () => {
    setEditingProject({ id: crypto.randomUUID(), title: "", type: "", image: "", location: "", budget: "", duration: "", description: "" });
    setIsNew(true);
  };

  const saveProject = async () => {
    if (!editingProject) return;
    setSaving(true);
    const rawProjects = (data?.projects || []);
    let updated: any[];
    // Save in the format the public page expects: {name, meta, image}
    const saveItem = {
      name: editingProject.title,
      meta: editingProject.type,
      image: editingProject.image,
      id: editingProject.id,
      location: editingProject.location,
      budget: editingProject.budget,
      duration: editingProject.duration,
      description: editingProject.description,
    };
    if (isNew) {
      updated = [...rawProjects, saveItem];
    } else {
      updated = rawProjects.map((p: any, i: number) => (p.id || `proj-${i}`) === editingProject.id ? { ...p, ...saveItem } : p);
    }
    await api(`/designers/${slug}/projects`, { method: "PUT", body: JSON.stringify({ data: updated }) });
    setEditingProject(null);
    setSaving(false);
    refreshData();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const rawProjects = (data?.projects || []);
    const updated = rawProjects.filter((p: any, i: number) => (p.id || `proj-${i}`) !== id);
    await api(`/designers/${slug}/projects`, { method: "PUT", body: JSON.stringify({ data: updated }) });
    refreshData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#09090B] tracking-[-1.4px]">Projects</h1>
          <p className="text-[14px] text-[#71717A]">{projects.length} portfolio projects{caseStudies.length > 0 ? ` · ${caseStudies.length} case studies` : ""}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          style={{ borderRadius: 100 }}
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {projects.length === 0 && caseStudies.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] py-16 text-center" style={{ borderRadius: 17 }}>
          <FolderOpen size={32} className="text-[#ABABAB] mx-auto mb-3" />
          <p className="text-[14px] text-[#71717A]">No projects yet. Add your first project.</p>
        </div>
      ) : (
        <>
          {/* Portfolio Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white border border-[#F3F4F6] overflow-hidden group" style={{ borderRadius: 17 }}>
                <div className="h-[180px] bg-[#F6F6F6] relative overflow-hidden">
                  {p.image ? (
                    <img src={resolveAsset(p.image)} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#ABABAB]"><FolderOpen size={32} /></div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingProject({ ...p }); setIsNew(false); }} className="w-8 h-8 bg-white flex items-center justify-center shadow-md hover:bg-[#F6F6F6]" style={{ borderRadius: 8 }}><Pencil size={14} /></button>
                    <button onClick={() => deleteProject(p.id)} className="w-8 h-8 bg-white flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600" style={{ borderRadius: 8 }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">{p.title || "Untitled"}</p>
                  <p className="text-[13px] text-[#71717A] mt-1">{p.type}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Case Studies */}
          {caseStudies.length > 0 && (
            <div>
              <h2 className="text-[18px] font-bold text-[#09090B] tracking-[-0.5px] mb-4">Case Studies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseStudies.map((cs: any, i: number) => (
                  <div key={i} className="bg-white border border-[#F3F4F6] overflow-hidden" style={{ borderRadius: 17 }}>
                    <div className="h-[140px] bg-[#F6F6F6] overflow-hidden">
                      {cs.image && <img src={resolveAsset(cs.image)} alt={cs.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <p className="text-[15px] font-semibold text-[#09090B] tracking-[-0.3px]">{cs.title}</p>
                      {cs.description && <p className="text-[13px] text-[#71717A] mt-1 line-clamp-2">{cs.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={!!editingProject} onClose={() => setEditingProject(null)} title={isNew ? "Add Project" : "Edit Project"}>
        {editingProject && (
          <div className="space-y-4">
            <Field label="Project Title" value={editingProject.title} onChange={(v: string) => setEditingProject({ ...editingProject, title: v })} placeholder="e.g. Modern Japandi HDB" required />
            <Field label="Property Type / Meta" value={editingProject.type} onChange={(v: string) => setEditingProject({ ...editingProject, type: v })} placeholder="e.g. HDB · $87,460 · 2024" />
            <Field label="Image URL" value={editingProject.image} onChange={(v: string) => setEditingProject({ ...editingProject, image: v })} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" value={editingProject.location} onChange={(v: string) => setEditingProject({ ...editingProject, location: v })} placeholder="e.g. Woodlands" />
              <Field label="Budget" value={editingProject.budget} onChange={(v: string) => setEditingProject({ ...editingProject, budget: v })} placeholder="e.g. $65,000" />
            </div>
            <Field label="Description" value={editingProject.description} onChange={(v: string) => setEditingProject({ ...editingProject, description: v })} placeholder="Brief project description" rows={3} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingProject(null)} className="px-4 py-2 text-[13px] text-[#71717A] border border-[#E5E7EB] hover:bg-[#F6F6F6]" style={{ borderRadius: 100 }}>Cancel</button>
              <button onClick={saveProject} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
                style={{ borderRadius: 100 }}
              >{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{isNew ? "Add" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── TESTIMONIALS TAB ──────────────────────────────────────────────
function TestimonialsTab({ slug, data, refreshData }: { slug: string; data: any; refreshData: () => void }) {
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const reviews = getReviews(data);

  const openNew = () => {
    setEditing({ id: crypto.randomUUID(), reviewer: "", rating: 5, text: "", date: new Date().toISOString().slice(0, 10), verified: true });
    setIsNew(true);
  };

  const saveReview = async () => {
    if (!editing) return;
    setSaving(true);
    // Save in the format the public page expects: {name, text, date, rating}
    const saveItem = { id: editing.id, name: editing.reviewer, reviewer: editing.reviewer, text: editing.text, date: editing.date, rating: editing.rating, verified: editing.verified };
    const rawReviews = data?.latestReviews || [];
    let updated: any[];
    if (isNew) {
      updated = [...rawReviews, saveItem];
    } else {
      updated = rawReviews.map((r: any, i: number) => (r.id || `rev-${i}`) === editing.id ? { ...r, ...saveItem } : r);
    }
    await api(`/designers/${slug}/latestreviews`, { method: "PUT", body: JSON.stringify({ data: updated }) });
    setEditing(null);
    setSaving(false);
    refreshData();
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const rawReviews = data?.latestReviews || [];
    const updated = rawReviews.filter((r: any, i: number) => (r.id || `rev-${i}`) !== id);
    await api(`/designers/${slug}/latestreviews`, { method: "PUT", body: JSON.stringify({ data: updated }) });
    refreshData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#09090B] tracking-[-1.4px]">Testimonials</h1>
          <p className="text-[14px] text-[#71717A]">{reviews.length} reviews</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90"
          style={{ borderRadius: 100 }}
        >
          <Plus size={16} /> Add Review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] py-16 text-center" style={{ borderRadius: 17 }}>
          <Star size={32} className="text-[#ABABAB] mx-auto mb-3" />
          <p className="text-[14px] text-[#71717A]">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white border border-[#F3F4F6] p-4 flex items-start gap-3 group" style={{ borderRadius: 14 }}>
              <div className="w-10 h-10 bg-[#F6F6F6] text-[#09090B] flex items-center justify-center text-[14px] font-semibold shrink-0" style={{ borderRadius: "50%" }}>
                {(r.reviewer || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#09090B]">{r.reviewer}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={12} className={j < r.rating ? "text-[#D97706] fill-[#D97706]" : "text-[#E5E7EB]"} />
                    ))}
                  </div>
                </div>
                <p className="text-[13px] text-[#71717A] mt-1 line-clamp-2">{r.text}</p>
                {r.date && <p className="text-[12px] text-[#ABABAB] mt-1">{r.date}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { setEditing({ ...r }); setIsNew(false); }} className="w-7 h-7 flex items-center justify-center hover:bg-[#F6F6F6]" style={{ borderRadius: 6 }}><Pencil size={13} /></button>
                <button onClick={() => deleteReview(r.id)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 hover:text-red-600" style={{ borderRadius: 6 }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? "Add Review" : "Edit Review"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Reviewer Name" value={editing.reviewer} onChange={(v: string) => setEditing({ ...editing, reviewer: v })} placeholder="John Smith" required />
            <div>
              <label className="block text-[14px] font-medium text-[#09090B] mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setEditing({ ...editing, rating: n })} className="p-1">
                    <Star size={22} className={n <= editing.rating ? "text-[#D97706] fill-[#D97706]" : "text-[#E5E7EB]"} />
                  </button>
                ))}
              </div>
            </div>
            <Field label="Review Text" value={editing.text} onChange={(v: string) => setEditing({ ...editing, text: v })} placeholder="What did the client say?" rows={4} required />
            <Field label="Date" value={editing.date} onChange={(v: string) => setEditing({ ...editing, date: v })} placeholder="e.g. March 2024" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-[13px] text-[#71717A] border border-[#E5E7EB] hover:bg-[#F6F6F6]" style={{ borderRadius: 100 }}>Cancel</button>
              <button onClick={saveReview} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
                style={{ borderRadius: 100 }}
              >{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{isNew ? "Add" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── TEAM TAB ──────────────────────────────────────────────────────
function TeamTab({ slug, data, refreshData }: { slug: string; data: any; refreshData: () => void }) {
  const [editing, setEditing] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const team = getTeamMembers(data);

  const openNew = () => { setEditing({ name: "", role: "", image: "", bio: "", specialty: "", experience: "" }); setIsNew(true); };

  const saveTeamMember = async () => {
    if (!editing) return;
    setSaving(true);
    const rawTeam = data?.team || [];
    const personEntries = rawTeam.filter((m: any) => m.type === "person" || (!m.type && m.role));
    const otherEntries = rawTeam.filter((m: any) => m.type && m.type !== "person" && !m.role);
    const saveItem = { name: editing.name, role: editing.role, image: editing.image, bio: editing.bio || "", specialty: editing.specialty || "", experience: editing.experience || "", type: "person" };
    let updatedPersons: any[];
    if (isNew) {
      updatedPersons = [...personEntries, saveItem];
    } else {
      updatedPersons = personEntries.map((m: any, i: number) => i === editing._idx ? { ...m, ...saveItem } : m);
    }
    await api(`/designers/${slug}/team`, { method: "PUT", body: JSON.stringify({ data: [...updatedPersons, ...otherEntries] }) });
    setEditing(null);
    setSaving(false);
    refreshData();
  };

  const deleteMember = async (idx: number) => {
    if (!confirm("Remove this team member?")) return;
    const rawTeam = data?.team || [];
    const personEntries = rawTeam.filter((m: any) => m.type === "person" || (!m.type && m.role));
    const otherEntries = rawTeam.filter((m: any) => m.type && m.type !== "person" && !m.role);
    const updatedPersons = personEntries.filter((_: any, i: number) => i !== idx);
    await api(`/designers/${slug}/team`, { method: "PUT", body: JSON.stringify({ data: [...updatedPersons, ...otherEntries] }) });
    refreshData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#09090B] tracking-[-1.4px]">Team</h1>
          <p className="text-[14px] text-[#71717A]">{team.length} members</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90"
          style={{ borderRadius: 100 }}
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {team.length === 0 ? (
        <div className="bg-white border border-[#F3F4F6] py-16 text-center" style={{ borderRadius: 17 }}>
          <Users size={32} className="text-[#ABABAB] mx-auto mb-3" />
          <p className="text-[14px] text-[#71717A]">No team members yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((m: any, i: number) => (
            <div key={i} className="bg-white border border-[#F3F4F6] p-5 group relative flex items-start gap-4" style={{ borderRadius: 17 }}>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing({ ...m, _idx: i }); setIsNew(false); }} className="w-7 h-7 flex items-center justify-center bg-white shadow hover:bg-[#F6F6F6]" style={{ borderRadius: 6 }}><Pencil size={12} /></button>
                <button onClick={() => deleteMember(i)} className="w-7 h-7 flex items-center justify-center bg-white shadow hover:bg-red-50 hover:text-red-600" style={{ borderRadius: 6 }}><Trash2 size={12} /></button>
              </div>
              <div className="w-14 h-14 shrink-0 bg-[#F6F6F6] overflow-hidden" style={{ borderRadius: "50%", border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                {m.image ? (
                  <img src={resolveAsset(m.image)} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#ABABAB] text-[18px] font-bold">{(m.name || "?").charAt(0)}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#09090B]">{m.name}</p>
                <p className="text-[13px] text-[#71717A] mt-0.5">{m.role}</p>
                {m.specialty && <p className="text-[12px] text-[#ABABAB] mt-1">{m.specialty}{m.experience ? ` · ${m.experience}` : ""}</p>}
                {m.bio && <p className="text-[12px] text-[#71717A] mt-2 line-clamp-2">{m.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? "Add Team Member" : "Edit Team Member"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Name" value={editing.name} onChange={(v: string) => setEditing({ ...editing, name: v })} placeholder="Full name" required />
            <Field label="Role" value={editing.role} onChange={(v: string) => setEditing({ ...editing, role: v })} placeholder="e.g. Lead Designer" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Specialty" value={editing.specialty} onChange={(v: string) => setEditing({ ...editing, specialty: v })} placeholder="e.g. Modern Minimalist" />
              <Field label="Experience" value={editing.experience} onChange={(v: string) => setEditing({ ...editing, experience: v })} placeholder="e.g. 6 years" />
            </div>
            <Field label="Bio" value={editing.bio} onChange={(v: string) => setEditing({ ...editing, bio: v })} placeholder="Brief description..." rows={3} />
            <Field label="Photo URL" value={editing.image} onChange={(v: string) => setEditing({ ...editing, image: v })} placeholder="https://..." />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-[13px] text-[#71717A] border border-[#E5E7EB] hover:bg-[#F6F6F6]" style={{ borderRadius: 100 }}>Cancel</button>
              <button onClick={saveTeamMember} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
                style={{ borderRadius: 100 }}
              >{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{isNew ? "Add" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── EDIT PAGE TAB ─────────────────────────────────────────────────
function EditPageTab({ slug, data, refreshData }: { slug: string; data: any; refreshData: () => void }) {
  const [profile, setProfile] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const stats = getStats(data);
      setProfile({
        name: getContactName(data) || getCompanyName(data),
        companyName: getCompanyName(data),
        tagline: getTagline(data),
        description: getBio(data),
        heroImage: getHeroImage(data),
        logo: getLogo(data),
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        address: getLocation(data),
        yearsInBusiness: stats.years,
        projectsCompleted: stats.totalProjects,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
      });
    }
  }, [data]);

  const saveProfile = async () => {
    setSaving(true);
    const saveData = {
      ...profile,
      // Sync to public profile field names
      founder: profile.name,
      bio: profile.description,
      location: profile.address,
      totalProjects: profile.projectsCompleted,
      stats: {
        ...(data?.stats || {}),
        years: profile.yearsInBusiness,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
      },
    };
    await api(`/designers/${slug}/profile`, { method: "PUT", body: JSON.stringify({ data: saveData }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refreshData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#09090B] tracking-[-1.4px]">Edit Page</h1>
          <p className="text-[14px] text-[#71717A]">Update your public profile information</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/designer/${slug}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-[13px] text-[#71717A] border border-[#E5E7EB] hover:bg-[#F6F6F6]"
            style={{ borderRadius: 100 }}
          >
            <Eye size={14} /> Preview
          </Link>
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#09090B] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
            style={{ borderRadius: 100 }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#F3F4F6] p-5 md:p-6" style={{ borderRadius: 17 }}>
          <h2 className="text-[16px] font-bold text-[#09090B] tracking-[-0.5px] mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" value={profile.companyName} onChange={(v: string) => setProfile({ ...profile, companyName: v })} placeholder="Your Company Name" />
            <Field label="Contact / Founder Name" value={profile.name} onChange={(v: string) => setProfile({ ...profile, name: v })} placeholder="Marcus Tan" />
            <Field label="Email" value={profile.email} onChange={(v: string) => setProfile({ ...profile, email: v })} type="email" placeholder="hello@company.com" />
            <Field label="Phone" value={profile.phone} onChange={(v: string) => setProfile({ ...profile, phone: v })} placeholder="+65 9123 4567" />
            <Field label="Website" value={profile.website} onChange={(v: string) => setProfile({ ...profile, website: v })} placeholder="https://..." />
            <Field label="Location / Address" value={profile.address} onChange={(v: string) => setProfile({ ...profile, address: v })} placeholder="Singapore Based" />
          </div>
        </div>

        <div className="bg-white border border-[#F3F4F6] p-5 md:p-6" style={{ borderRadius: 17 }}>
          <h2 className="text-[16px] font-bold text-[#09090B] tracking-[-0.5px] mb-4">Profile Content</h2>
          <div className="space-y-4">
            <Field label="Tagline" value={profile.tagline} onChange={(v: string) => setProfile({ ...profile, tagline: v })} placeholder="Your design philosophy in one line" />
            <Field label="Description / Bio" value={profile.description} onChange={(v: string) => setProfile({ ...profile, description: v })} placeholder="Tell potential clients about your studio..." rows={4} />
          </div>
        </div>

        <div className="bg-white border border-[#F3F4F6] p-5 md:p-6" style={{ borderRadius: 17 }}>
          <h2 className="text-[16px] font-bold text-[#09090B] tracking-[-0.5px] mb-4">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Field label="Hero Image URL" value={profile.heroImage} onChange={(v: string) => setProfile({ ...profile, heroImage: v })} placeholder="https://..." />
              {profile.heroImage && (
                <div className="mt-2 h-[120px] bg-[#F6F6F6] overflow-hidden" style={{ borderRadius: 10 }}>
                  <img src={resolveAsset(profile.heroImage)} alt="Hero" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <Field label="Logo URL" value={profile.logo} onChange={(v: string) => setProfile({ ...profile, logo: v })} placeholder="https://..." />
              {profile.logo && (
                <div className="mt-2 h-[120px] bg-[#F6F6F6] flex items-center justify-center overflow-hidden" style={{ borderRadius: 10 }}>
                  <img src={resolveAsset(profile.logo)} alt="Logo" className="max-h-full max-w-full object-contain p-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#F3F4F6] p-5 md:p-6" style={{ borderRadius: 17 }}>
          <h2 className="text-[16px] font-bold text-[#09090B] tracking-[-0.5px] mb-4">Stats & Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Years in Business" value={profile.yearsInBusiness} onChange={(v: string) => setProfile({ ...profile, yearsInBusiness: v })} placeholder="12" />
            <Field label="Projects Completed" value={profile.projectsCompleted} onChange={(v: string) => setProfile({ ...profile, projectsCompleted: v })} placeholder="300" />
            <Field label="Rating" value={profile.rating} onChange={(v: string) => setProfile({ ...profile, rating: v })} placeholder="4.9" />
            <Field label="Review Count" value={profile.reviewCount} onChange={(v: string) => setProfile({ ...profile, reviewCount: v })} placeholder="186" />
          </div>
        </div>
      </div>
    </div>
  );
}

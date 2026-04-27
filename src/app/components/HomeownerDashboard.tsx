import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import {
  User, Home, MessageSquare, Box, LogOut, Loader2, AlertCircle,
  ChevronDown, X, Save, Phone, Mail, MapPin, Calendar, DollarSign,
  Building2, Ruler, BedDouble, Bath, StickyNote, ExternalLink,
  Clock, Eye, ArrowUpRight, Check, Pencil, ChevronRight, Plus,
  Search, Settings, Star, Shield, Target, Palette, FileText,
  Activity, Hash, Layers, Compass, Zap
} from "lucide-react";
import { motion } from "motion/react";
import { Navbar } from "./Navbar";
import { supabase } from "./supabaseClient";
import imgNetworkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { FloorPlanThumbnail } from "./FloorPlan3DDashboard";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

function api(path: string, opts: any = {}) {
  const token = localStorage.getItem("homeowner-token") || "";
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      "X-Homeowner-Token": token,
      ...(opts.headers || {}),
    },
  });
}

// ─── FIELD ────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", rows, required, icon: Icon, inputMode, autoComplete }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#101828] mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6A7282] pointer-events-none z-[1]" />}
        {rows ? (
          <textarea
            value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            className="w-full px-4 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-[14px] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#FFA929] transition-colors resize-none"
            style={{ paddingLeft: Icon ? 38 : 16 }}
          />
        ) : (
          <input
            type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            inputMode={inputMode} autoComplete={autoComplete} data-lpignore="true" data-1p-ignore="true"
            className="w-full h-[42px] px-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-[14px] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#FFA929] transition-colors"
            style={{ paddingLeft: Icon ? 38 : 16, paddingRight: 16 }}
          />
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required }: any) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-[#101828] mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}
          className="w-full h-[42px] px-4 bg-[#f9fafb] border border-[#e5e7eb] text-[14px] text-[#101828] outline-none focus:border-[#FFA929] transition-colors appearance-none cursor-pointer"
          style={{ borderRadius: 14 }}
        >
          <option value="">{placeholder || "Select..."}</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6A7282] pointer-events-none" />
      </div>
    </div>
  );
}

// ─── SKELETON PRIMITIVES ──────────────────────────────────────────
function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-[#e5e7eb] animate-pulse ${className}`} style={{ borderRadius: 8, ...style }} />;
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-['Inter',sans-serif]">
      <Navbar />
      <div className="max-w-[1293px] mx-auto px-4 md:px-8 pt-[120px] md:pt-[150px]">
        <Bone className="w-full h-[200px] md:h-[300px]" style={{ borderRadius: 20 }} />
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-5 px-2 md:px-4 mt-[16px] md:mt-[10px]">
          <div className="shrink-0 mt-[-56px] md:mt-[-80px]">
            <Bone className="w-[90px] h-[90px] md:w-[140px] md:h-[140px]" style={{ borderRadius: 9999 }} />
          </div>
          <div className="flex-1 pt-3 pb-2 space-y-2.5">
            <Bone className="w-[180px] md:w-[240px] h-[26px]" />
            <Bone className="w-[220px] md:w-[300px] h-[16px]" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mt-5 px-2 md:px-4">
          {[1,2,3,4,5].map(i => <Bone key={i} className="h-[60px]" style={{ borderRadius: 17 }} />)}
        </div>
        <div className="flex gap-1.5 mt-6 px-2 md:px-4 border-b border-[#f3f4f6] pb-3">
          {[80,90,85,100,110,90].map((w, i) => <Bone key={i} className="h-[18px]" style={{ width: w, borderRadius: 6 }} />)}
        </div>
      </div>
      <div className="max-w-[1293px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="px-2 md:px-4">
          <ContentSkeleton />
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 space-y-5 min-w-0">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white border border-[#f3f4f6] p-5 md:p-6" style={{ borderRadius: 17 }}>
            <div className="flex items-center justify-between mb-4">
              <Bone className="w-[100px] h-[18px]" />
              <Bone className="w-[50px] h-[14px]" />
            </div>
            <div className="space-y-3">
              {[1,2,3].map(j => (
                <div key={j} className="flex items-center gap-3">
                  <Bone className="w-[16px] h-[16px]" style={{ borderRadius: 4 }} />
                  <Bone className="flex-1 h-[16px] max-w-[280px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:w-[380px] shrink-0 space-y-5">
        <div className="bg-white border border-[#f3f4f6] p-5 md:p-6" style={{ borderRadius: 17, boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
          <Bone className="w-[110px] h-[18px] mb-4" />
          <div className="space-y-2.5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Bone className="w-[36px] h-[36px] shrink-0" style={{ borderRadius: 10 }} />
                <div className="flex-1 space-y-1.5">
                  <Bone className="w-[100px] h-[14px]" />
                  <Bone className="w-[130px] h-[12px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (token: string, userId: string) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/homeowner-signup" : "/homeowner-login";
      const payload: any = { email, password };
      if (mode === "signup") { payload.name = name; payload.phone = phone; }
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setLoading(false); return; }
      localStorage.setItem("homeowner-token", json.token);
      localStorage.setItem("homeowner-userId", json.userId);
      try { await supabase.auth.signInWithPassword({ email, password }); } catch {}
      try {
        const cached = json.profile
          ? { name: json.profile.name || name || "", email: json.profile.email || email || "", avatar: "" }
          : { name: name || "", email: email || "", avatar: "" };
        localStorage.setItem("homeowner-profile-cache", JSON.stringify(cached));
        window.dispatchEvent(new Event("homeowner-auth-changed"));
      } catch {}
      onAuth(json.token, json.userId);
    } catch (err: any) { setError(err.message || "Network error"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-['Inter',sans-serif]">
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80" alt="Interior design" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="font-bold text-[32px] text-white leading-[1.2] tracking-[-1px] mb-3">Your dream home<br />starts here.</h2>
          <p className="text-[15px] text-white/75 leading-[1.6] max-w-[400px]">Get matched with top designers, plan your layout in 3D, and bring your renovation vision to life.</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white min-h-screen">
        <div className="flex items-center justify-between px-8 md:px-12 pt-8 md:pt-10">
          <div className="h-[23px] w-[111px] bg-[#09090b] shrink-0 cursor-pointer" onClick={() => navigate("/")}
            style={{ maskImage: `url('${imgNetworkLogo}')`, WebkitMaskImage: `url('${imgNetworkLogo}')`, maskSize: "111px 23px", WebkitMaskSize: "111px 23px", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "0 0", WebkitMaskPosition: "0 0" }}
          />
          <button onClick={() => navigate("/")} className="w-[36px] h-[36px] rounded-full bg-[#f6f6f6] hover:bg-[#edeef0] flex items-center justify-center transition-colors cursor-pointer">
            <X size={18} className="text-[#6A7282]" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="w-full max-w-[420px]">
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#101828] tracking-[-1px] leading-[1.15]">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[15px] text-[#6A7282] mt-2 mb-8 leading-[1.5]">
              {mode === "login" ? "Sign in to manage your renovation projects and connect with designers." : "Join Network to plan your dream home, get matched with designers, and more."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <Field label="Full Name" value={name} onChange={setName} placeholder="John Doe" required />
                  <Field label="Phone" value={phone} onChange={setPhone} placeholder="91234567" />
                </>
              )}
              <Field label="Email" value={email} onChange={setEmail} type="text" inputMode="email" autoComplete="off" placeholder="you@email.com" required />
              <Field label="Password" value={password} onChange={setPassword} type="password" placeholder={mode === "signup" ? "Min. 6 characters" : "Enter password"} required />
              {error && (
                <div className="flex items-center gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3.5 py-2.5">
                  <AlertCircle size={14} className="text-[#dc2626] shrink-0" />
                  <span className="text-[13px] text-[#dc2626]">{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-[48px] bg-[#09090b] text-white text-[15px] font-semibold rounded-[14px] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity cursor-pointer mt-2"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-[12px] text-[#9ca3af] uppercase tracking-[1px]">or</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>
            <p className="text-center text-[14px] text-[#6A7282]">
              {mode === "login" ? (
                <>Don't have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold text-[#101828] hover:underline cursor-pointer">Sign up</button></>
              ) : (
                <>Already have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }} className="font-semibold text-[#101828] hover:underline cursor-pointer">Sign in</button></>
              )}
            </p>
          </motion.div>
        </div>
        <div className="px-8 md:px-12 pb-8 md:pb-10">
          <p className="text-[12px] text-[#9ca3af]">By signing in, you agree to our Terms of Service and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#6b7280]">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
}

// ─── TAB DEFINITIONS ──────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "renovation", label: "Renovation" },
  { id: "activity", label: "Activity" },
  { id: "inquiries", label: "Inquiries" },
  { id: "floorplan", label: "FloorPlan 3D" },
  { id: "inspiration", label: "Inspiration" },
  { id: "contact", label: "Contact" },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export function HomeownerDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("homeowner-full-cache");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(!data);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("homeowner-token");
    const savedId = localStorage.getItem("homeowner-userId");
    if (!token || !savedId) { setAuthed(false); return; }
    setUserId(savedId);
    setAuthed(true);
    api("/homeowner-session").then(r => r.json()).then(json => {
      if (!json.valid) {
        localStorage.removeItem("homeowner-token");
        localStorage.removeItem("homeowner-userId");
        localStorage.removeItem("homeowner-full-cache");
        setAuthed(false);
        setData(null);
      }
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    if (!data) setLoading(true);
    try {
      const res = await api("/homeowner-profile");
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        try {
          localStorage.setItem("homeowner-full-cache", JSON.stringify(json.data));
          localStorage.setItem("homeowner-profile-cache", JSON.stringify({ name: json.data.name || "", email: json.data.email || "", avatar: json.data.avatar || "" }));
          window.dispatchEvent(new Event("homeowner-auth-changed"));
        } catch {}
      }
    } catch (err) { console.error("Failed to fetch profile:", err); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (authed && userId) fetchData(); }, [authed, userId, fetchData]);

  if (authed === null && !data) return <ProfileSkeleton />;
  if (authed === false) return <AuthScreen onAuth={(t, id) => { setUserId(id); setAuthed(true); }} />;
  if (!data) return <ProfileSkeleton />;

  const userName = data?.name || "Homeowner";
  const userEmail = data?.email || "";
  const house = data?.house || {};
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = data?.avatar || null;
  const inquiries = data?.inquiries || [];
  const fp3d = data?.fp3dProjects || [];
  const renders = data?.fp3dRenders || [];

  const showSkeleton = loading && !data;

  // Derived status
  const readiness = house.timeline || "Just exploring";
  const isActive = inquiries.length > 0 || fp3d.length > 0;
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [customStatus, setCustomStatus] = useState<string | null>(data?.status || null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const currentStatus = customStatus || (isActive ? "Actively exploring" : "New");
  const STATUS_OPTIONS = [
    { id: "Actively exploring", color: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.15)" },
    { id: "Looking for designer", color: "#2b7fff", bg: "rgba(43,127,255,0.08)", border: "rgba(43,127,255,0.15)" },
    { id: "Renovation in progress", color: "#FFA929", bg: "#FFF6DC", border: "#FFEAB1" },
    { id: "Just browsing", color: "#6A7282", bg: "#f3f4f6", border: "#e5e7eb" },
    { id: "Completed", color: "#16a34a", bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.15)" },
  ];
  const activeStatusDef = STATUS_OPTIONS.find(s => s.id === currentStatus) || STATUS_OPTIONS[0];

  useEffect(() => {
    if (!showStatusMenu) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("touchstart", handleClick); };
  }, [showStatusMenu]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => { reader.onload = () => res(reader.result as string); reader.onerror = rej; reader.readAsDataURL(file); });
      const resp = await api("/homeowner-profile/avatar", { method: "PUT", body: JSON.stringify({ avatar: dataUrl }) });
      if (resp.ok) {
        setData((prev: any) => prev ? { ...prev, avatar: dataUrl } : prev);
      }
    } catch { /* ignore */ }
    setUploadingAvatar(false);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Inter',sans-serif]">
      <Navbar />

      {/* ── HERO / COVER ── */}
      <div className="max-w-[1293px] mx-auto px-4 md:px-8 pt-[120px] md:pt-[150px]">
        {/* Cover Image */}
        <div className="relative w-full h-[200px] md:h-[300px] overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #09090b 0%, #1a1a2e 35%, #2d2d44 60%, #1a1a2e 80%, #09090b 100%)" }} />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 50% 80%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px, 60px 60px, 50px 50px" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-5 px-2 md:px-4 mt-[16px] md:mt-[10px] relative z-10">
          {/* Avatar */}
          <div className="shrink-0 relative group mt-[-56px] md:mt-[-80px]">
            <div className="w-[90px] h-[90px] md:w-[140px] md:h-[140px] rounded-full border-[3px] md:border-4 border-white bg-[#09090b] flex items-center justify-center text-white font-bold text-[28px] md:text-[42px] overflow-hidden"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
            >
              {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : initials}
            </div>
            <label className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[34px] md:h-[34px] bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md border border-[#e5e7eb] hover:bg-[#f8fafc] transition-colors"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            >
              {uploadingAvatar ? <Loader2 size={14} className="text-[#6A7282] animate-spin" /> : <Pencil size={14} className="text-[#6A7282]" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>

          {/* Name + Quick Info */}
          <div className="flex-1 min-w-0 pt-3 md:pt-3 pb-1 md:pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] md:text-[28px] font-bold text-[#101828] tracking-[-1px] leading-tight truncate">{userName}</h1>
              {/* Status Pill — clickable to change */}
              <div className="relative" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderRadius: 100, backgroundColor: activeStatusDef.bg, color: activeStatusDef.color, borderColor: activeStatusDef.border }}
                >
                  <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: activeStatusDef.color }} />
                  {currentStatus}
                  <ChevronDown size={10} style={{ color: activeStatusDef.color }} />
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full mt-1 left-0 z-50 bg-white rounded-[12px] border border-[#f3f4f6] shadow-[0_12px_32px_rgba(0,0,0,0.12)] py-1 min-w-[200px]">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setCustomStatus(opt.id);
                          setShowStatusMenu(false);
                          // Save to backend
                          api("/homeowner-profile/personal", { method: "PUT", body: JSON.stringify({ status: opt.id }) }).catch(() => {});
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#f9fafb] transition-colors ${currentStatus === opt.id ? "bg-[#f9fafb]" : ""}`}
                      >
                        <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                        <span className="text-[13px] font-medium text-[#101828]">{opt.id}</span>
                        {currentStatus === opt.id && <Check size={14} className="ml-auto text-[#16a34a]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[14px] text-[#6A7282]">
              {house.address && <span className="flex items-center gap-1"><MapPin size={13} className="text-[#FFA929]" />{house.address}</span>}
              {house.propertyType && <span className="flex items-center gap-1"><Building2 size={13} className="text-[#FFA929]" />{house.propertyType}</span>}
              {house.size && <span className="flex items-center gap-1"><Ruler size={13} className="text-[#6A7282]" />{house.size} sqft</span>}
              {house.budget && <span className="flex items-center gap-1"><DollarSign size={13} className="text-[#6A7282]" />{house.budget}</span>}
              {house.timeline && <span className="flex items-center gap-1"><Calendar size={13} className="text-[#6A7282]" />{house.timeline}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-1 md:pb-2 shrink-0">
            <Link to="/get-matched" className="px-4 py-2 bg-[#09090b] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5" style={{ borderRadius: 100 }}>
              <Search size={14} /> Get Matched
            </Link>
            <Link to="/floorplan3d/dashboard" className="px-4 py-2 bg-white border border-[#e5e7eb] text-[#101828] text-[13px] font-semibold hover:bg-[#f8fafc] transition-colors cursor-pointer flex items-center gap-1.5" style={{ borderRadius: 100 }}>
              <Box size={14} /> FloorPlan 3D
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mt-5 px-2 md:px-4">
          <StatChip icon={MapPin} iconColor="#FFA929" label="Location" value={house.address?.split(",")[0] || house.postalCode || "—"} />
          <StatChip icon={Building2} iconColor="#FFA929" label="Property" value={house.propertyType || "—"} />
          <StatChip icon={DollarSign} iconColor="#FFA929" label="Budget" value={house.budget || "—"} />
          <StatChip icon={MessageSquare} iconColor="#FFA929" label="Inquiries" value={String(inquiries.length)} />
          <StatChip icon={Box} iconColor="#FFA929" label="Floor Plans" value={String(fp3d.length)} />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 mt-6 px-2 md:px-4 overflow-x-auto scrollbar-hide border-b border-[#f3f4f6]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[14px] font-medium whitespace-nowrap border-b-[2.5px] transition-colors cursor-pointer ${
                tab === t.id ? "text-[#101828] border-[#09090b]" : "text-[#6A7282] border-transparent hover:text-[#101828]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[1293px] mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="px-2 md:px-4">
          {showSkeleton ? (
            <ContentSkeleton />
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {tab === "overview" && <OverviewSection data={data} setTab={setTab} refreshData={fetchData} />}
              {tab === "renovation" && <RenovationSection data={data} refreshData={fetchData} />}
              {tab === "activity" && <ActivitySection data={data} />}
              {tab === "inquiries" && <InquiriesSection data={data} />}
              {tab === "floorplan" && <FloorPlanSection data={data} />}
              {tab === "inspiration" && <InspirationSection />}
              {tab === "contact" && <ContactSection data={data} refreshData={fetchData} />}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STAT CHIP ────────────────────────────────────────────────────
function StatChip({ icon: Icon, iconColor, label, value }: { icon: any; iconColor: string; label: string; value: string }) {
  return (
    <div className="bg-[#fafafa] border border-[#f3f4f6] flex items-center gap-2.5 px-4 py-3" style={{ borderRadius: 17 }}>
      <Icon size={18} style={{ color: iconColor }} />
      <div className="min-w-0">
        <p className="text-[16px] font-bold text-[#101828] leading-tight truncate">{value}</p>
        <p className="text-[12px] text-[#6A7282]">{label}</p>
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────
function Card({ children, className = "", noPad, prominent }: { children: React.ReactNode; className?: string; noPad?: boolean; prominent?: boolean }) {
  return (
    <div className={`bg-white border border-[#f3f4f6] ${noPad ? "" : "p-5 md:p-6"} ${className}`}
      style={{ borderRadius: 17, boxShadow: prominent ? "0 25px 35.9px rgba(0,0,0,0.07)" : "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, action, icon: Icon }: { title: string; action?: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-[#FFA929]" />}
        <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828] tracking-[-0.5px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — OVERVIEW (Homeowner at a glance)
// ═══════════════════════════════════════════════════════════════════
function OverviewSection({ data, setTab, refreshData }: { data: any; setTab: (t: TabId) => void; refreshData: () => void }) {
  const house = data?.house || {};
  const inquiries = data?.inquiries || [];
  const fp3d = data?.fp3dProjects || [];
  const renders = data?.fp3dRenders || [];
  const readiness = house.timeline || "Just exploring";

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT COLUMN */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Homeowner Overview Card */}
        <Card>
          <SectionHeader title="Homeowner Profile" icon={User} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <OverviewItem label="Location" value={house.address || "Not set"} icon={MapPin} />
            <OverviewItem label="Property Type" value={house.propertyType || "Not set"} icon={Building2} />
            <OverviewItem label="Estimated Size" value={house.size ? `${house.size} sqft` : "Not set"} icon={Ruler} />
            <OverviewItem label="Budget Range" value={house.budget || "Not set"} icon={DollarSign} />
            <OverviewItem label="Key Collection" value={readiness} icon={Calendar} />
            <OverviewItem label="Status" value={inquiries.length > 0 || fp3d.length > 0 ? "Actively exploring" : "New"} icon={Activity}
              valueClass={inquiries.length > 0 || fp3d.length > 0 ? "text-[#16a34a]" : "text-[#92400E]"} />
          </div>
        </Card>

        {/* Inspiration Preview */}
        <InspirationPreview setTab={setTab} />

        {/* Renovation Goals Summary */}
        {(house.budget || house.timeline || house.notes || house.renovationScope || house.preferredStyle) && (
          <Card>
            <SectionHeader title="Renovation Goals" icon={Target} action={
              <button onClick={() => setTab("renovation")} className="text-[13px] text-[#6A7282] hover:text-[#101828] flex items-center gap-1 cursor-pointer transition-colors">
                Details <ChevronRight size={14} />
              </button>
            } />
            <div className="space-y-2">
              {house.renovationScope && <GoalItem label={house.renovationScope === "full" ? "Full renovation" : house.renovationScope === "partial" ? "Partial renovation" : house.renovationScope} />}
              {house.preferredStyle && <GoalItem label={`${house.preferredStyle} style`} />}
              {house.timeline && <GoalItem label={house.timeline === "Already have keys" ? "Ready to start" : `Looking to start ${house.timeline.toLowerCase()}`} />}
              {house.budget && <GoalItem label={`Budget: ${house.budget}`} />}
              {house.notes && <p className="text-[13px] text-[#6A7282] mt-2 pl-6">{house.notes}</p>}
            </div>
          </Card>
        )}

        {/* Recent Inquiries Preview */}
        {inquiries.length > 0 && (
          <Card noPad>
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#FFA929]" />
                <h3 className="text-[16px] font-bold text-[#101828]">Recent Inquiries</h3>
              </div>
              <button onClick={() => setTab("inquiries")} className="text-[13px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors">View all ({inquiries.length})</button>
            </div>
            <div className="px-5 md:px-6 pb-2">
              {inquiries.slice(0, 3).map((inq: any, i: number) => (
                <div key={inq.id || i} className="flex items-center gap-3 py-3 border-b border-[#f3f4f6] last:border-0">
                  <div className="w-[36px] h-[36px] bg-[#ffedd4] rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold text-[#FFA929]">
                    {(inq.designerName || inq.designer || "D").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#101828] truncate">{inq.designerName || inq.designer || "Designer"}</p>
                    <p className="text-[12px] text-[#6A7282] truncate">{[inq.propertyType, inq.budget].filter(Boolean).join(" · ")}</p>
                  </div>
                  <StatusPill status={inq.status} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity Preview */}
        {(() => {
          const activities: { label: string; date: string; icon: any; color: string }[] = [];
          inquiries.forEach((inq: any) => activities.push({ label: `Enquired with ${inq.designerName || inq.designer || "a designer"}`, date: inq.createdAt || "", icon: MessageSquare, color: "#FFA929" }));
          fp3d.forEach((proj: any) => activities.push({ label: `Created floor plan: ${proj.title || "Untitled"}`, date: proj.createdAt || "", icon: Box, color: "#2b7fff" }));
          renders.filter((r: any) => r.status === "success" || r.status === "completed").forEach((r: any) => activities.push({ label: "AI Render completed", date: r.createdAt || "", icon: Eye, color: "#00c950" }));
          activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (activities.length === 0) return null;
          return (
            <Card noPad>
              <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#FFA929]" />
                  <h3 className="text-[16px] font-bold text-[#101828]">Recent Activity</h3>
                </div>
                <button onClick={() => setTab("activity")} className="text-[13px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors">View all</button>
              </div>
              <div className="px-5 md:px-6 pb-2">
                {activities.slice(0, 3).map((act, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f3f4f6] last:border-0">
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0" style={{ background: act.color + "14" }}>
                      <act.icon size={14} style={{ color: act.color }} />
                    </div>
                    <p className="text-[14px] text-[#101828] flex-1 min-w-0 truncate">{act.label}</p>
                    {act.date && <p className="text-[12px] text-[#9ca3af] shrink-0">{new Date(act.date).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* Floor Plans + Renders Preview */}
        {(fp3d.length > 0 || renders.length > 0) && (
          <Card noPad>
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
              <div className="flex items-center gap-2">
                <Box size={18} className="text-[#FFA929]" />
                <h3 className="text-[16px] font-bold text-[#101828]">FloorPlan 3D</h3>
              </div>
              <button onClick={() => setTab("floorplan")} className="text-[13px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors">View all</button>
            </div>
            <div className="px-5 md:px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {fp3d.slice(0, 4).map((proj: any, i: number) => {
                  const roomDefs = proj.projectData?.roomDefinitions as any[] | undefined;
                  return (
                    <Link key={proj.id || i} to={`/floorplan3d/editor/${proj.id}`} className="group cursor-pointer">
                      <div className="aspect-[4/3] overflow-hidden bg-white border border-[#f3f4f6]" style={{ borderRadius: 12 }}>
                        {roomDefs && roomDefs.length > 0 ? (
                          <div className="w-full h-full p-1.5 group-hover:scale-105 transition-transform duration-300">
                            <FloorPlanThumbnail roomDefs={roomDefs} size="small" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Box size={20} className="text-[#d1d5db]" /></div>
                        )}
                      </div>
                      <p className="text-[12px] font-medium text-[#101828] mt-1.5 truncate">{proj.title || `Project ${i + 1}`}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN — Quick Actions + Matching */}
      <div className="lg:w-[380px] shrink-0 space-y-5">
        {/* Quick Actions */}
        <Card prominent>
          <h3 className="text-[16px] font-bold text-[#101828] mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            <ActionLink to="/get-matched" icon={Search} color="#FFA929" label="Get Matched" desc="Find your ideal designer" />
            <ActionLink to="/floorplan3d/dashboard" icon={Box} color="#2b7fff" label="New Floor Plan" desc="Create 3D layout" />
            <ActionLink to="/interior-designers" icon={Eye} color="#00c950" label="Browse Designers" desc="Explore portfolios" />
            <ActionLink to="/cost-guide" icon={DollarSign} color="#FFA929" label="Cost Guide" desc="Renovation pricing" />
          </div>
        </Card>

        {/* Contact Info Preview */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#FFA929]" />
              <h3 className="text-[14px] font-bold text-[#101828]">Contact Info</h3>
            </div>
            <button onClick={() => setTab("contact")} className="text-[12px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors flex items-center gap-0.5">
              Edit <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px]">
              <Mail size={13} className="text-[#6A7282] shrink-0" />
              <span className={data?.email ? "text-[#101828]" : "text-[#d1d5db]"}>{data?.email || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <Phone size={13} className="text-[#6A7282] shrink-0" />
              <span className={data?.phone ? "text-[#101828]" : "text-[#d1d5db]"}>{data?.phone || "Not provided"}</span>
            </div>
            {data?.preferredContact && (
              <div className="flex items-center gap-2 text-[13px]">
                <Compass size={13} className="text-[#6A7282] shrink-0" />
                <span className="text-[#101828]">Prefers {data.preferredContact}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-3 flex items-center gap-1"><Shield size={10} />Shared only with contacted firms</p>
        </Card>

        {/* Matching Data Card */}
        <Card>
          <SectionHeader title="Matching Tags" icon={Hash} />
          <div className="flex flex-wrap gap-1.5">
            {house.propertyType && <Tag>{house.propertyType}</Tag>}
            {house.budget && <Tag>{house.budget}</Tag>}
            {house.renovationScope && <Tag>{house.renovationScope === "full" ? "Full renovation" : house.renovationScope}</Tag>}
            {house.address && <Tag>{house.address.split(",")[0]}</Tag>}
            {house.preferredStyle && <Tag>{house.preferredStyle}</Tag>}
            {!house.propertyType && !house.budget && (
              <p className="text-[13px] text-[#6A7282]">Add property details to generate matching tags</p>
            )}
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-3">These tags help us match you with the right designers.</p>
        </Card>
      </div>
    </div>
  );
}

function OverviewItem({ label, value, icon: Icon, valueClass }: { label: string; value: string; icon: any; valueClass?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-[30px] h-[30px] bg-[#fafafa] border border-[#f3f4f6] rounded-[8px] flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-[#FFA929]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[#6A7282] uppercase tracking-[0.5px] font-medium">{label}</p>
        <p className={`text-[14px] font-semibold truncate mt-0.5 ${valueClass || (value === "Not set" ? "text-[#d1d5db]" : "text-[#101828]")}`}>{value}</p>
      </div>
    </div>
  );
}

function GoalItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[5px] h-[5px] rounded-full bg-[#FFA929] shrink-0" />
      <p className="text-[14px] text-[#101828]">{label}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 text-[12px] font-medium text-[#101828] bg-[#f3f4f6] border border-[#e5e7eb]" style={{ borderRadius: 100 }}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — RENOVATION INTENT
// ═══════════════════════════════════════════════════════════════════
function RenovationSection({ data, refreshData }: { data: any; refreshData: () => void }) {
  const house = data?.house || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    propertyType: house.propertyType || "", size: house.size || "", rooms: house.rooms || "",
    bathrooms: house.bathrooms || "", yearBuilt: house.yearBuilt || "", address: house.address || "",
    postalCode: house.postalCode || "", notes: house.notes || "", budget: house.budget || "",
    timeline: house.timeline || "", renovationScope: house.renovationScope || "", preferredStyle: house.preferredStyle || "",
  });

  const handleSave = async () => {
    setSaving(true);
    await api("/homeowner-profile/house", { method: "PUT", body: JSON.stringify(form) }).catch(() => {});
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setEditing(false); refreshData(); setSaving(false);
  };

  const hasData = house.propertyType || house.size || house.address;

  return (
    <div className="max-w-[780px] space-y-5">
      {/* Property Details */}
      <Card>
        <SectionHeader title="Property Details" icon={Building2} action={
          <button onClick={() => setEditing(!editing)}
            className="text-[13px] text-[#6A7282] hover:text-[#101828] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {editing ? "Cancel" : hasData ? <><Pencil size={12} /> Edit</> : <><Plus size={12} /> Add</>}
          </button>
        } />

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Property Type" value={form.propertyType} onChange={(v: string) => setForm({ ...form, propertyType: v })}
                options={["HDB", "Condo", "Landed", "Commercial"]} placeholder="Select type" required />
              <Field label="Size (sqft)" value={form.size} onChange={(v: string) => setForm({ ...form, size: v })} placeholder="1200" icon={Ruler} />
              <Field label="Bedrooms" value={form.rooms} onChange={(v: string) => setForm({ ...form, rooms: v })} placeholder="3" icon={BedDouble} />
              <Field label="Bathrooms" value={form.bathrooms} onChange={(v: string) => setForm({ ...form, bathrooms: v })} placeholder="2" icon={Bath} />
              <Field label="Year Built" value={form.yearBuilt} onChange={(v: string) => setForm({ ...form, yearBuilt: v })} placeholder="2010" icon={Calendar} />
              <Field label="Postal Code" value={form.postalCode} onChange={(v: string) => setForm({ ...form, postalCode: v })} placeholder="520123" />
            </div>
            <Field label="Address" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="Block 123, Street Name #01-01" icon={MapPin} />
            <SaveButton saving={saving} saved={saved} onClick={handleSave} />
          </div>
        ) : hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-4">
            {house.propertyType && <PropItem label="Type" value={house.propertyType} />}
            {house.size && <PropItem label="Size" value={`${house.size} sqft`} />}
            {house.rooms && <PropItem label="Bedrooms" value={house.rooms} />}
            {house.bathrooms && <PropItem label="Bathrooms" value={house.bathrooms} />}
            {house.yearBuilt && <PropItem label="Year Built" value={house.yearBuilt} />}
            {house.postalCode && <PropItem label="Postal Code" value={house.postalCode} />}
            {house.address && <div className="col-span-2 md:col-span-3"><PropItem label="Address" value={house.address} /></div>}
          </div>
        ) : (
          <EmptyState icon={Building2} title="No property details yet" actionLabel="Add Property Info" onAction={() => setEditing(true)} />
        )}
      </Card>

      {/* Renovation Scope & Style */}
      <Card>
        <SectionHeader title="Renovation Goals" icon={Target} action={
          !editing ? (
            <button onClick={() => setEditing(true)} className="text-[13px] text-[#6A7282] hover:text-[#101828] flex items-center gap-1 cursor-pointer transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : undefined
        } />

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Renovation Scope" value={form.renovationScope} onChange={(v: string) => setForm({ ...form, renovationScope: v })}
                options={["Partial", "Full", "Design & Build", "Design Only"]} placeholder="Select scope" />
              <SelectField label="Preferred Style" value={form.preferredStyle} onChange={(v: string) => setForm({ ...form, preferredStyle: v })}
                options={["Modern", "Minimalist", "Scandinavian", "Industrial", "Contemporary", "Japanese", "Muji", "Luxurious", "Classic", "Other"]}
                placeholder="Select style" />
              <SelectField label="Budget" value={form.budget} onChange={(v: string) => setForm({ ...form, budget: v })}
                options={["Below $30,000", "$30,000 – $50,000", "$50,000 – $80,000", "$80,000 – $120,000", "Above $120,000"]} placeholder="Select budget" />
              <SelectField label="Timeline" value={form.timeline} onChange={(v: string) => setForm({ ...form, timeline: v })}
                options={["Already have keys", "Within 3 months", "3 – 6 months", "6 – 12 months", "Just exploring"]} placeholder="When to start?" />
            </div>
            <Field label="Notes" value={form.notes} onChange={(v: string) => setForm({ ...form, notes: v })} placeholder="Special requirements, must-haves, design inspiration..." rows={3} />
            <SaveButton saving={saving} saved={saved} onClick={handleSave} />
          </div>
        ) : (
          <div className="space-y-3">
            <InfoLine icon={Layers} label="Renovation Scope" value={house.renovationScope} />
            <InfoLine icon={Palette} label="Preferred Style" value={house.preferredStyle} />
            <InfoLine icon={DollarSign} label="Budget" value={house.budget} />
            <InfoLine icon={Clock} label="Timeline" value={house.timeline} />
            {house.notes && <InfoLine icon={StickyNote} label="Notes" value={house.notes} />}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — ACTIVITY HISTORY (Timeline)
// ═══════════════════════════════════════════════════════════════════
function ActivitySection({ data }: { data: any }) {
  const inquiries = data?.inquiries || [];
  const fp3d = data?.fp3dProjects || [];
  const renders = data?.fp3dRenders || [];

  // Build a unified timeline from all activities
  const activities: { type: string; label: string; detail: string; date: string; icon: any; color: string }[] = [];

  inquiries.forEach((inq: any) => {
    activities.push({
      type: "inquiry",
      label: `Enquired with ${inq.designerName || inq.designer || "a designer"}`,
      detail: [inq.propertyType, inq.budget].filter(Boolean).join(" · "),
      date: inq.createdAt || "",
      icon: MessageSquare,
      color: "#FFA929",
    });
  });

  fp3d.forEach((proj: any) => {
    activities.push({
      type: "project",
      label: `Created floor plan: ${proj.title || "Untitled"}`,
      detail: proj.template || "",
      date: proj.createdAt || "",
      icon: Box,
      color: "#2b7fff",
    });
  });

  renders.filter((r: any) => r.status === "success" || r.status === "completed").forEach((r: any) => {
    activities.push({
      type: "render",
      label: `AI Render completed`,
      detail: r.projectName || "",
      date: r.createdAt || "",
      icon: Eye,
      color: "#00c950",
    });
  });

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-[780px] space-y-5">
      <Card>
        <SectionHeader title="Activity Log" icon={Activity} />
        {activities.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" desc="Start by exploring designers or creating a floor plan" />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[2px] bg-[#f3f4f6]" />
            <div className="space-y-0">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-3.5 py-3 relative">
                  <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 relative z-[1]"
                    style={{ background: act.color + "14", border: `1px solid ${act.color}22` }}
                  >
                    <act.icon size={14} style={{ color: act.color }} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[14px] font-medium text-[#101828]">{act.label}</p>
                    {act.detail && <p className="text-[12px] text-[#6A7282] mt-0.5">{act.detail}</p>}
                  </div>
                  {act.date && (
                    <p className="text-[12px] text-[#9ca3af] shrink-0 pt-1">{new Date(act.date).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — INQUIRIES
// ═══════════════════════════════════════════════════════════════════
function InquiriesSection({ data }: { data: any }) {
  const inquiries = data?.inquiries || [];

  return (
    <div className="max-w-[780px] space-y-5">
      {inquiries.length === 0 ? (
        <Card className="!p-10 text-center">
          <MessageSquare size={28} className="mx-auto text-[#d1d5db] mb-2" />
          <p className="text-[16px] font-semibold text-[#101828]">No inquiries yet</p>
          <p className="text-[14px] text-[#6A7282] mt-1 mb-5">Start by browsing designers or getting matched</p>
          <div className="flex items-center justify-center gap-2.5">
            <Link to="/get-matched" className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 cursor-pointer" style={{ borderRadius: 100 }}>Get Matched</Link>
            <Link to="/interior-designers" className="px-5 py-2.5 text-[13px] font-semibold text-[#101828] border border-[#e5e7eb] hover:bg-[#f8fafc] cursor-pointer" style={{ borderRadius: 100 }}>Browse Designers</Link>
          </div>
        </Card>
      ) : (
        <Card noPad>
          <div className="px-5 md:px-6 pt-5 md:pt-6 pb-1">
            <SectionHeader title={`Enquiries Made (${inquiries.length})`} icon={MessageSquare} />
          </div>
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_100px] gap-3 px-5 md:px-6 py-2 text-[11px] font-medium text-[#6A7282] uppercase tracking-[0.5px] border-b border-[#f3f4f6]">
            <span>Date</span>
            <span>Firm</span>
            <span>Details</span>
            <span>Status</span>
          </div>
          <div className="px-5 md:px-6 pb-3">
            {inquiries.map((inq: any, i: number) => (
              <div key={inq.id || i} className="flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_100px] md:items-center gap-1 md:gap-3 py-3.5 border-b border-[#f3f4f6] last:border-0">
                <p className="text-[13px] text-[#6A7282]">{inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : "—"}</p>
                <div className="flex items-center gap-2">
                  <div className="w-[28px] h-[28px] bg-[#ffedd4] rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-[#FFA929]">
                    {(inq.designerName || inq.designer || "D").charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[14px] font-medium text-[#101828] truncate">{inq.designerName || inq.designer || "Designer"}</p>
                </div>
                <p className="text-[13px] text-[#6A7282] truncate">{[inq.propertyType, inq.budget].filter(Boolean).join(" · ") || "—"}</p>
                <StatusPill status={inq.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — FLOORPLAN 3D (preserved from original)
// ═══════════════════════════════════════════════════════════════════
function FloorPlanSection({ data }: { data: any }) {
  const projects = data?.fp3dProjects || [];
  const renders = data?.fp3dRenders || [];
  const [view, setView] = useState<"projects" | "renders">("projects");

  return (
    <div className="space-y-5">
      {/* Toggle + New */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#f8fafc] border border-[#e5e7eb] p-1" style={{ borderRadius: 100 }}>
          {(["projects", "renders"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-[14px] py-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                view === v ? "bg-white text-[#101828] shadow-sm" : "text-[#6A7282] hover:text-[#101828]"
              }`}
              style={{ borderRadius: 100 }}
            >
              {v === "projects" ? `Projects (${projects.length})` : `Renders (${renders.length})`}
            </button>
          ))}
        </div>
        <Link to="/floorplan3d/dashboard"
          className="px-4 py-2 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
          style={{ borderRadius: 100 }}
        >
          <Plus size={14} /> New Project
        </Link>
      </div>

      {/* Projects */}
      {view === "projects" && (
        projects.length === 0 ? (
          <Card className="!p-10 text-center">
            <Box size={28} className="mx-auto text-[#d1d5db] mb-2" />
            <p className="text-[16px] font-semibold text-[#101828]">No floor plans yet</p>
            <p className="text-[14px] text-[#6A7282] mt-1 mb-5">Create your first 3D floor plan</p>
            <div className="flex items-center justify-center gap-2.5">
              <Link to="/floorplan3d/editor" className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 cursor-pointer" style={{ borderRadius: 100 }}>Create</Link>
              <Link to="/floorplan3d" className="px-5 py-2.5 text-[13px] font-semibold text-[#101828] border border-[#e5e7eb] hover:bg-[#f8fafc] cursor-pointer" style={{ borderRadius: 100 }}>Learn more</Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj: any, i: number) => {
              const roomDefs = proj.projectData?.roomDefinitions as any[] | undefined;
              return (
                <Link key={proj.id || i} to={`/floorplan3d/editor/${proj.id}`} className="group cursor-pointer">
                  <div className="relative overflow-hidden h-[200px] md:h-[280px] bg-white border border-[#f3f4f6]" style={{ borderRadius: 17 }}>
                    {roomDefs && roomDefs.length > 0 ? (
                      <div className="w-full h-full p-4 group-hover:scale-105 transition-transform duration-300">
                        <FloorPlanThumbnail roomDefs={roomDefs} size="large" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#f3f4f6] flex items-center justify-center"><Box size={32} className="text-[#d1d5db]" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/42 to-transparent to-[55%]" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-[16px] font-semibold text-white">{proj.title || `Project ${i + 1}`}</p>
                      <p className="text-[13px] text-white/70 mt-0.5">{proj.updatedAt ? `Updated ${new Date(proj.updatedAt).toLocaleDateString()}` : ""}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* Renders */}
      {view === "renders" && (
        renders.length === 0 ? (
          <Card className="!p-10 text-center">
            <Eye size={28} className="mx-auto text-[#d1d5db] mb-2" />
            <p className="text-[16px] font-semibold text-[#101828]">No renders yet</p>
            <p className="text-[14px] text-[#6A7282] mt-1 mb-5">Use AI render in the floor plan editor</p>
            <Link to="/floorplan3d/editor" className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 cursor-pointer inline-block" style={{ borderRadius: 100 }}>Open Editor</Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renders.map((r: any, i: number) => (
              <div key={r.renderId || i} className="relative overflow-hidden" style={{ borderRadius: 17 }}>
                {r.resultUrl ? (
                  <a href={r.resultUrl} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group">
                    <div className="aspect-[4/3] overflow-hidden bg-[#f3f4f6]">
                      <img src={r.thumbnailUrl || r.resultUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  </a>
                ) : (
                  <div className="aspect-[4/3] bg-[#f3f4f6] flex items-center justify-center">
                    {r.status === "processing" ? <Loader2 size={20} className="text-[#d1d5db] animate-spin" /> : <Box size={28} className="text-[#d1d5db]" />}
                  </div>
                )}
                <div className="bg-white border border-[#f3f4f6] border-t-0 p-3" style={{ borderRadius: "0 0 17px 17px" }}>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[13px] font-semibold text-[#101828] truncate">{r.projectName || `Render ${i + 1}`}</p>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium border shrink-0 ${
                      r.status === "success" || r.status === "completed" ? "bg-[rgba(22,163,74,0.08)] text-[#16a34a] border-[rgba(22,163,74,0.15)]" :
                      r.status === "processing" ? "bg-[#FFF6DC] text-[#92400E] border-[#FFEAB1]" :
                      "bg-[#fef2f2] text-[#991B1B] border-[#fecaca]"
                    }`} style={{ borderRadius: 100 }}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6A7282] mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <ActionLink to="/floorplan3d" icon={Box} color="#FFA929" label="FloorPlan 3D" desc="Templates & info" />
        <ActionLink to="/floorplan3d/dashboard" icon={Eye} color="#2b7fff" label="FP3D Dashboard" desc="All saved projects" />
        <ActionLink to="/floorplan3d/dashboard" icon={Plus} color="#00c950" label="New Project" desc="Start from scratch" />
      </div>
    </div>
  );
}

// ─── INSPIRATION PREVIEW (for Overview tab) ──────────────────────
function InspirationPreview({ setTab }: { setTab: (t: TabId) => void }) {
  const savedDesigns: any[] = (() => {
    try {
      const saved = localStorage.getItem("saved-inspirations");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })();

  if (savedDesigns.length === 0) {
    return (
      <Card noPad>
        <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-[#FFA929]" />
            <h3 className="text-[16px] font-bold text-[#101828]">Inspiration</h3>
          </div>
          <Link to="/explore" className="text-[13px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors">Explore</Link>
        </div>
        <div className="px-5 md:px-6 py-6 text-center">
          <Star size={24} className="mx-auto text-[#d1d5db] mb-2" />
          <p className="text-[13px] text-[#6A7282]">Save designs you love from the Explore page</p>
          <Link to="/explore" className="text-[12px] text-[#FFA929] font-medium mt-1 inline-block hover:underline">Browse designs →</Link>
        </div>
      </Card>
    );
  }

  return (
    <Card noPad>
      <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-[#FFA929]" />
          <h3 className="text-[16px] font-bold text-[#101828]">Inspiration</h3>
        </div>
        <button onClick={() => setTab("inspiration")} className="text-[13px] text-[#6A7282] hover:text-[#101828] cursor-pointer transition-colors">View all ({savedDesigns.length})</button>
      </div>
      <div className="px-5 md:px-6 py-4">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {savedDesigns.slice(0, 4).map((design: any, i: number) => (
            <div key={i} className="aspect-[3/4] rounded-[10px] overflow-hidden bg-[#f3f4f6]">
              <img src={design.imageUrl} alt={design.title || ""} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INSPIRATION — Saved interior design styles from Explore page
// ═══════════════════════════════════════════════════════════════════
function InspirationSection() {
  const navigate = useNavigate();
  const [savedDesigns, setSavedDesigns] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("saved-inspirations");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const removeDesign = (index: number) => {
    const updated = savedDesigns.filter((_, i) => i !== index);
    setSavedDesigns(updated);
    localStorage.setItem("saved-inspirations", JSON.stringify(updated));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-[#FFA929]" />
          <h2 className="text-[18px] md:text-[20px] font-semibold text-[#101828] tracking-[-0.5px]">My Inspiration Board</h2>
        </div>
        <Link to="/explore"
          className="px-4 py-2 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
          style={{ borderRadius: 100 }}
        >
          <Search size={14} /> Explore Designs
        </Link>
      </div>

      {savedDesigns.length === 0 ? (
        <Card className="!p-10 text-center">
          <Star size={28} className="mx-auto text-[#d1d5db] mb-2" />
          <p className="text-[16px] font-semibold text-[#101828]">No saved inspirations yet</p>
          <p className="text-[14px] text-[#6A7282] mt-1 mb-5">
            Browse interior designs on the Explore page and save the ones you love
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#09090b] hover:opacity-90 cursor-pointer inline-block"
            style={{ borderRadius: 100 }}
          >
            Browse Designs
          </button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {savedDesigns.map((design: any, i: number) => (
              <div key={i} className="group relative cursor-pointer" style={{ borderRadius: 14, overflow: "hidden" }}>
                <div className="aspect-[3/4] bg-[#f3f4f6] overflow-hidden">
                  <img
                    src={design.imageUrl}
                    alt={design.title || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent to-[50%] opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[13px] font-semibold text-white truncate">{design.title || "Untitled"}</p>
                  {design.designer && (
                    <p className="text-[11px] text-white/70 truncate">{design.designer}</p>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeDesign(i); }}
                  className="absolute top-2 right-2 w-[28px] h-[28px] bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                >
                  <X size={14} className="text-[#6A7282]" />
                </button>
                {/* Style tag */}
                {design.style && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-0.5 bg-white/90 text-[10px] font-medium text-[#101828] rounded-full">{design.style}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#9ca3af] text-center mt-2">
            {savedDesigns.length} design{savedDesigns.length !== 1 ? "s" : ""} saved · <Link to="/explore" className="text-[#FFA929] hover:underline">Explore more</Link>
          </p>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 6 — CONTACT & PREFERENCES
// ═══════════════════════════════════════════════════════════════════
function ContactSection({ data, refreshData }: { data: any; refreshData: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: data?.name || "", phone: data?.phone || "", address: data?.address || "",
    preferredContact: data?.preferredContact || "",
  });

  const handleSave = async () => {
    setSaving(true);
    await api("/homeowner-profile/personal", { method: "PUT", body: JSON.stringify(form) }).catch(() => {});
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setEditing(false); refreshData(); setSaving(false);
  };

  return (
    <div className="max-w-[780px] space-y-5">
      <Card>
        <SectionHeader title="Contact Information" icon={Mail} action={
          <button onClick={() => setEditing(!editing)}
            className="text-[13px] text-[#6A7282] hover:text-[#101828] flex items-center gap-1 cursor-pointer transition-colors"
          >
            {editing ? "Cancel" : <><Pencil size={12} /> Edit</>}
          </button>
        } />

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Full Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} placeholder="John Doe" icon={User} />
              <Field label="Phone" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} placeholder="91234567" icon={Phone} />
            </div>
            <Field label="Address" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} placeholder="Your address" icon={MapPin} />
            <SelectField label="Preferred Contact Method" value={form.preferredContact} onChange={(v: string) => setForm({ ...form, preferredContact: v })}
              options={["WhatsApp", "Phone Call", "Email", "SMS"]} placeholder="Select preferred method" />
            <SaveButton saving={saving} saved={saved} onClick={handleSave} />
          </div>
        ) : (
          <div className="space-y-3">
            <InfoLine icon={User} label="Name" value={data?.name} />
            <InfoLine icon={Mail} label="Email" value={data?.email} />
            <InfoLine icon={Phone} label="Phone" value={data?.phone} />
            <InfoLine icon={MapPin} label="Address" value={data?.address} />
            <InfoLine icon={Compass} label="Preferred Contact" value={data?.preferredContact} />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
          <p className="text-[12px] text-[#9ca3af] flex items-center gap-1.5">
            <Shield size={12} />
            This information is shared only with firms you have contacted.
          </p>
          {data?.updatedAt && (
            <p className="text-[11px] text-[#d1d5db] mt-1">Last updated: {new Date(data.updatedAt).toLocaleDateString()}</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── SHARED HELPERS ───────────────────────────────────────────────
function InfoLine({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[32px] h-[32px] bg-[#fafafa] border border-[#f3f4f6] rounded-[10px] flex items-center justify-center shrink-0">
        <Icon size={15} className="text-[#6A7282]" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[#6A7282]">{label}</p>
        <p className={`text-[14px] font-medium truncate ${value ? "text-[#101828]" : "text-[#d1d5db]"}`}>{value || "Not provided"}</p>
      </div>
    </div>
  );
}

function PropItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#6A7282] uppercase tracking-[0.5px] font-medium">{label}</p>
      <p className="text-[14px] font-semibold text-[#101828] mt-0.5">{value}</p>
    </div>
  );
}

function ActionLink({ to, icon: Icon, color, label, desc }: { to: string; icon: any; color: string; label: string; desc: string }) {
  return (
    <Link to={to}
      className="flex items-center gap-3 px-3.5 py-3 bg-[#fafafa] border border-[#f3f4f6] hover:border-[#e5e7eb] transition-colors cursor-pointer group"
      style={{ borderRadius: 14 }}
    >
      <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: color + "14" }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#101828]">{label}</p>
        <p className="text-[12px] text-[#6A7282]">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-[#d1d5db] ml-auto shrink-0 group-hover:text-[#6A7282] transition-colors" />
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status || "pending";
  const cls =
    s === "new" ? "bg-[#FFF6DC] text-[#92400E] border-[#FFEAB1]" :
    s === "contacted" ? "bg-[rgba(22,163,74,0.08)] text-[#16a34a] border-[rgba(22,163,74,0.15)]" :
    "bg-[#f3f4f6] text-[#6A7282] border-[#e5e7eb]";
  return <span className={`inline-block px-2 py-0.5 text-[11px] font-medium border shrink-0 ${cls}`} style={{ borderRadius: 100 }}>{s}</span>;
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-1">
      <button onClick={onClick} disabled={saving}
        className="px-4 py-2 text-[13px] font-medium text-white bg-[#09090b] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        style={{ borderRadius: 100 }}
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }: { icon: any; title: string; desc?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="text-center py-8">
      <Icon size={28} className="mx-auto text-[#d1d5db] mb-2" />
      <p className="text-[14px] text-[#6A7282]">{title}</p>
      {desc && <p className="text-[13px] text-[#9ca3af] mt-1">{desc}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-3 px-4 py-2 text-[13px] font-medium text-white bg-[#09090b] hover:opacity-90 cursor-pointer" style={{ borderRadius: 100 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import { resolveAsset } from "../utils/resolveAsset";
import { FloorPlanThumbnail } from "./FloorPlan3DDashboard";
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  FolderOpen,
  Star,
  MessageSquare,
  MapPin,
  Briefcase,
  Image,
  Shield,
  BookOpen,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  PenLine,
  Eye,
  LayoutTemplate,
  Lock,
  LogOut,
  EyeOff,
  UserPlus,
  KeyRound,
  Upload,
  X,
  Sparkles,
  ArrowRight,
  Check,
  Power,
  Search,
  Filter,
  Activity,
  Magnet,
  BarChart3,
} from "lucide-react";
import { AdminFloorPlanTemplates } from "./AdminFloorPlanTemplates";
import { analyzeFloorPlanAI, storeAIDefs, type ParsedHouseRoomDef } from "./floor-plan-analyzer";
import { AdminOverview } from "./AdminOverview";
import { AdminDebugPanel } from "./AdminDebugPanel";
import { AdminLeadMagnets } from "./AdminLeadMagnets";
import { AdminAnalytics } from "./AdminAnalytics";

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

/* ─────────────────── ADMIN LOGIN GATE ─────────────────── */

function AdminLoginGate({ onAuthenticated }: { onAuthenticated: (info: { userId: string; email: string; name: string }) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // First-time setup state
  const [showSetup, setShowSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");

  // Check if user already has an active admin session
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          const headers = await getAdminAuthHeaders();
          const res = await fetch(`${API}/fp3d/admin/verify`, { headers });
          const json = await res.json();
          if (json.isAdmin) {
            onAuthenticated({
              userId: json.userId,
              email: data.session.user?.email || "",
              name: data.session.user?.user_metadata?.name || data.session.user?.email || "",
            });
            return;
          }
        }
      } catch (e) {
        console.error("Admin session check failed:", e);
      }
      setCheckingSession(false);
    })();
  }, [onAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/fp3d/admin/login`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Login failed");
        setLoading(false);
        return;
      }
      // Also sign in on the client so session persists
      await supabase.auth.signInWithPassword({ email, password });
      onAuthenticated({ userId: json.userId, email: json.email, name: json.name });
    } catch (e: any) {
      setError(e.message || "Network error");
    }
    setLoading(false);
  };

  const handleSetup = async () => {
    if (!setupEmail || !setupCode) { setSetupError("Email and setup code are required"); return; }
    setSetupLoading(true);
    setSetupError("");
    setSetupSuccess("");
    try {
      const res = await fetch(`${API}/fp3d/admin/promote`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({ email: setupEmail, setupCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSetupError(json.error || "Setup failed");
        setSetupLoading(false);
        return;
      }
      setSetupSuccess(`Admin access granted to ${setupEmail}. You can now log in.`);
      setEmail(setupEmail);
      setTimeout(() => setShowSetup(false), 2000);
    } catch (e: any) {
      setSetupError(e.message || "Network error");
    }
    setSetupLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#f1f3f5] font-['Inter',sans-serif] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-10 text-[#9ca3af] animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-[#6a7282]">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f5] font-['Inter',sans-serif] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="bg-[#101828] rounded-2xl size-[56px] flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Shield className="size-7 text-white" />
          </div>
          <h1 className="font-['Inter',sans-serif] font-bold text-[28px] text-[#101828] tracking-[-1.4px] leading-tight">Admin Dashboard</h1>
          <p className="font-['Inter',sans-serif] text-[15px] text-[#6a7282] mt-2">Sign in with an administrator account to continue</p>
        </div>

        {!showSetup ? (
          /* ── Login Form ── */
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] p-7">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
                <AlertCircle className="size-[18px] text-red-500 mt-0.5 shrink-0" />
                <p className="font-['Inter',sans-serif] text-[13px] text-red-700 leading-[1.5]">{error}</p>
              </div>
            )}

            {setupSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-start gap-2.5">
                <CheckCircle2 className="size-[18px] text-green-600 mt-0.5 shrink-0" />
                <p className="font-['Inter',sans-serif] text-[13px] text-green-700 leading-[1.5]">{setupSuccess}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] mb-[6px] block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full h-[44px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 font-['Inter',sans-serif] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#101828] focus:ring-2 focus:ring-[#101828]/5 transition-all"
                />
              </div>

              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] mb-[6px] block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full h-[44px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 pr-12 font-['Inter',sans-serif] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#101828] focus:ring-2 focus:ring-[#101828]/5 transition-all"
                  />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                    {showPw ? <EyeOff className="size-[18px] text-[#99A1AF]" /> : <Eye className="size-[18px] text-[#99A1AF]" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-[46px] bg-[#101828] rounded-xl font-['Inter',sans-serif] font-semibold text-[14px] text-white tracking-[-0.35px] flex items-center justify-center gap-2 hover:bg-[#1f2937] transition-colors disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? <Loader2 className="size-[18px] animate-spin" /> : <Lock className="size-[16px]" />}
                {loading ? "Signing in..." : "Sign In as Admin"}
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-[#f3f4f6]">
              <button
                onClick={() => setShowSetup(true)}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] transition-colors cursor-pointer py-1"
              >
                <KeyRound className="size-[14px]" />
                First-time setup? Register admin access
              </button>
            </div>

            <div className="mt-3">
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-medium text-[#9ca3af] hover:text-[#6a7282] transition-colors cursor-pointer py-1"
              >
                <ChevronLeft className="size-[14px]" />
                Back to site
              </button>
            </div>
          </div>
        ) : (
          /* ── First-Time Setup Form ── */
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-50 rounded-lg size-[40px] flex items-center justify-center">
                <KeyRound className="size-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#101828]">First-Time Admin Setup</h3>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#6a7282]">Grant admin access to a registered user</p>
              </div>
            </div>

            {setupError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2.5">
                <AlertCircle className="size-[18px] text-red-500 mt-0.5 shrink-0" />
                <p className="font-['Inter',sans-serif] text-[13px] text-red-700 leading-[1.5]">{setupError}</p>
              </div>
            )}

            {setupSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-start gap-2.5">
                <CheckCircle2 className="size-[18px] text-green-600 mt-0.5 shrink-0" />
                <p className="font-['Inter',sans-serif] text-[13px] text-green-700 leading-[1.5]">{setupSuccess}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] mb-[6px] block">User Email</label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="The user's registered email"
                  className="w-full h-[44px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 font-['Inter',sans-serif] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#101828] focus:ring-2 focus:ring-[#101828]/5 transition-all"
                />
                <p className="text-[11px] text-[#9ca3af] mt-1.5">The user must have already signed up on the platform.</p>
              </div>

              <div>
                <label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] mb-[6px] block">Setup Code</label>
                <input
                  type="text"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  placeholder="Enter setup code"
                  onKeyDown={(e) => e.key === "Enter" && handleSetup()}
                  className="w-full h-[44px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 font-['Inter',sans-serif] text-[14px] text-[#101828] placeholder:text-[#99A1AF] outline-none focus:border-[#101828] focus:ring-2 focus:ring-[#101828]/5 transition-all font-mono tracking-wider"
                />
                <p className="text-[11px] text-[#9ca3af] mt-1.5">This is the admin setup code you configured in your environment secrets.</p>
              </div>

              <button
                onClick={handleSetup}
                disabled={setupLoading}
                className="w-full h-[46px] bg-[#101828] rounded-xl font-['Inter',sans-serif] font-semibold text-[14px] text-white tracking-[-0.35px] flex items-center justify-center gap-2 hover:bg-[#1f2937] transition-colors disabled:opacity-60 cursor-pointer mt-2"
              >
                {setupLoading ? <Loader2 className="size-[18px] animate-spin" /> : <UserPlus className="size-[16px]" />}
                {setupLoading ? "Granting access..." : "Grant Admin Access"}
              </button>

              <button
                onClick={() => { setShowSetup(false); setSetupError(""); setSetupSuccess(""); }}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] transition-colors cursor-pointer py-1"
              >
                <ChevronLeft className="size-[14px]" />
                Back to login
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-[#9ca3af] mt-6">
          Admin access is restricted to authorized personnel only.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────── TYPES ─────────────────── */

interface TeamMember {
  name: string;
  type: "person" | "project";
  role?: string;
  specialty?: string;
  projects?: number;
  experience?: string;
  bio?: string;
  image: string;
  designs?: { img: string; label: string }[];
  reels?: { img: string; caption: string; location: string; likes: number; comments: number }[];
}

interface ProjectItem {
  name: string;
  meta: string;
  image: string;
}

interface CaseStudyTag {
  label: string;
  bg: string;
  text: string;
  iconColor: string;
  icon: string;
}

interface CaseStudy {
  phase: string;
  title: string;
  desc: string;
  tags: CaseStudyTag[];
  image: string;
}

interface ReviewCard {
  title: string;
  text: string;
  fullText: string;
  name: string;
  date: string;
  initial: string;
  bgColor: string;
  textColor: string;
  image: string;
  hasVideo: boolean;
}

interface LatestReview {
  name: string;
  initial: string;
  time: string;
  text: string;
}

interface BusinessInfoItem {
  label: string;
  value: string;
}

interface DesignerFormData {
  slug: string;
  name: string;
  verified: boolean;
  tagline: string;
  availability: string;
  location: string;
  bio: string;
  founder: string;
  foundedYear: number;
  totalProjects: number;
  coverProject: { name: string; cost: string; area: string; year: string; style: string };
  stats: { rating: string; reviewCount: string; years: string; hdbCert: boolean; bcaLicensed: boolean };
  trustedSince: {
    title: string;
    description: string;
    badges: string[];
    certifications: { name: string; license: string; since: string }[];
  };
  btoPackage: { title: string; startingPrice: string; description: string; tags: string[] };
  images: Record<string, string>;
  team: TeamMember[];
  projects: ProjectItem[];
  caseStudies: CaseStudy[];
  reviews: ReviewCard[];
  latestReviews: LatestReview[];
  serviceArea: { hqAddress: string; hqLat: number; hqLng: number; description: string; mapEmbedUrl: string };
  businessInfo: BusinessInfoItem[];
}

/* ─────────────────── DEFAULTS ─────────────────── */

function emptyForm(): DesignerFormData {
  return {
    slug: "",
    name: "",
    verified: false,
    tagline: "",
    availability: "",
    location: "Singapore Based",
    bio: "",
    founder: "",
    foundedYear: new Date().getFullYear(),
    totalProjects: 0,
    coverProject: { name: "", cost: "", area: "", year: String(new Date().getFullYear()), style: "" },
    stats: { rating: "4.9", reviewCount: "0", years: "1", hdbCert: false, bcaLicensed: false },
    trustedSince: { title: "", description: "", badges: [], certifications: [] },
    btoPackage: { title: "", startingPrice: "", description: "", tags: [] },
    images: { cover: "", logo: "", hdbCert: "", bcaCert: "", video: "", google: "", map: "" },
    team: [],
    projects: [],
    caseStudies: [],
    reviews: [],
    latestReviews: [],
    serviceArea: { hqAddress: "", hqLat: 1.3521, hqLng: 103.8198, description: "", mapEmbedUrl: "" },
    businessInfo: [],
  };
}

function emptyTeamPerson(): TeamMember {
  return { name: "", type: "person", role: "", specialty: "", projects: 0, experience: "", bio: "", image: "", designs: [] };
}

function emptyTeamProject(): TeamMember {
  return { name: "", type: "project", image: "", reels: [] };
}

function emptyProject(): ProjectItem {
  return { name: "", meta: "", image: "" };
}

function emptyCaseStudy(): CaseStudy {
  return { phase: "", title: "", desc: "", tags: [], image: "" };
}

function emptyReview(): ReviewCard {
  return { title: "", text: "", fullText: "", name: "", date: "", initial: "", bgColor: "bg-[#f55]", textColor: "text-white", image: "", hasVideo: false };
}

function emptyLatestReview(): LatestReview {
  return { name: "", initial: "", time: "", text: "" };
}

function emptyBizInfo(): BusinessInfoItem {
  return { label: "", value: "" };
}

/* ─────────────────── REUSABLE UI ─────────────────── */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-[#364153] tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#9ca3af]">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", className = "" }: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-[14px] text-[#101828] placeholder:text-[#9ca3af] outline-none focus:border-[#2b7fff] focus:ring-2 focus:ring-[#2b7fff]/10 transition-all ${className}`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-[14px] text-[#101828] placeholder:text-[#9ca3af] outline-none focus:border-[#2b7fff] focus:ring-2 focus:ring-[#2b7fff]/10 transition-all resize-y"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <div className={`relative w-[42px] h-[24px] rounded-full transition-colors ${checked ? "bg-[#2b7fff]" : "bg-[#d1d5db]"}`}>
        <div className={`absolute top-[2px] size-[20px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
      </div>
      <span className="text-[13px] text-[#4a5565] group-hover:text-[#101828] transition-colors">{label}</span>
    </button>
  );
}

function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-[#f9fafb] transition-colors cursor-pointer"
      >
        <div className="text-[#6a7282]">{icon}</div>
        <span className="font-semibold text-[15px] text-[#101828] flex-1 text-left">{title}</span>
        <ChevronDown className={`size-5 text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-[#f3f4f6]">{children}</div>}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-[13px] font-medium text-[#2b7fff] hover:text-[#1a5fd6] transition-colors cursor-pointer py-2"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-8 rounded-lg flex items-center justify-center text-[#d1d5db] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all cursor-pointer"
      title="Remove"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function ItemCard({ children, onRemove, label }: { children: React.ReactNode; onRemove: () => void; label: string }) {
  return (
    <div className="border border-[#e5e7eb] rounded-xl p-4 space-y-3 bg-[#fafbfc] relative group">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-widest">{label}</span>
        <RemoveButton onClick={onRemove} />
      </div>
      {children}
    </div>
  );
}

/* ─────────────────── SLUG HELPER ─────────────────── */

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ─────────────────── IMAGE UPLOAD ─────────────────── */

function ImageUpload({ value, onChange, label }: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API}/designer-upload`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          fileName: file.name,
          contentType: file.type,
        }),
      });
      const json = await res.json();
      if (json.success && json.url) {
        onChange(json.url);
      } else {
        setError(json.error || "Upload failed");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f9fafb]">
          <img
            src={value}
            alt={label}
            className="w-full h-[120px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white rounded-lg text-[12px] font-medium text-[#09090B] hover:bg-[#f3f4f6] transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 bg-white rounded-lg text-[12px] font-medium text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative flex flex-col items-center justify-center h-[100px] border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            dragOver ? "border-[#2b7fff] bg-[#eff6ff]" : "border-[#d1d5db] bg-[#f9fafb] hover:border-[#9ca3af] hover:bg-[#f3f4f6]"
          }`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="size-5 text-[#2b7fff] animate-spin mb-1" />
          ) : (
            <Upload className="size-5 text-[#9ca3af] mb-1" />
          )}
          <span className="text-[12px] text-[#6a7282] font-medium">
            {uploading ? "Uploading..." : "Click or drag to upload"}
          </span>
          <span className="text-[11px] text-[#9ca3af]">PNG, JPG up to 10MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-[12px] text-[#ef4444]">{error}</p>}
    </div>
  );
}

/* ─────────────────── TAB DEFINITIONS ─────────────────── */

const TABS = [
  { id: "profile", label: "Profile", icon: <Building2 className="size-4" /> },
  { id: "images", label: "Images", icon: <Image className="size-4" /> },
  { id: "team", label: "Team", icon: <Users className="size-4" /> },
  { id: "projects", label: "Projects", icon: <FolderOpen className="size-4" /> },
  { id: "casestudies", label: "Case Studies", icon: <BookOpen className="size-4" /> },
  { id: "reviews", label: "Reviews", icon: <Star className="size-4" /> },
  { id: "credentials", label: "Credentials", icon: <Shield className="size-4" /> },
  { id: "service", label: "Service Area", icon: <MapPin className="size-4" /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ─────────────────── UPLOAD FLOOR PLAN MODAL ─────────────────── */

interface AIResult { defs: ParsedHouseRoomDef[]; planName: string; confidence: number; roomCount: number; }

function UploadFloorPlanModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (defs: ParsedHouseRoomDef[], planName: string) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [stage, setStage] = useState<"idle" | "preview" | "processing" | "done" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const serverBaseUrl = `https://${projectId}.supabase.co/functions/v1`;

  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });

  const processFile = useCallback(async (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"];
    if (!validTypes.includes(file.type)) { setErrorMsg("Unsupported file type. Please upload PNG, JPG, or BMP."); setStage("error"); return; }
    if (file.size > 5 * 1024 * 1024) { setErrorMsg("File too large. Maximum size is 5 MB."); setStage("error"); return; }
    setFileName(file.name); setStage("preview");
    try { setPreviewUrl(await readFileAsDataUrl(file)); } catch { setErrorMsg("Failed to read image file."); setStage("error"); }
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!previewUrl) return;
    setStage("processing"); setProgressPct(0); setProgressMsg("Initializing...");
    try {
      const result = await analyzeFloorPlanAI(previewUrl, serverBaseUrl, publicAnonKey, (msg, pct) => { setProgressMsg(msg); setProgressPct(pct); });
      setAiResult(result); setStage("done");
    } catch (e: any) { console.error("AI floor plan analysis error:", e); setErrorMsg(`Analysis failed: ${e.message || "Unknown error"}`); setStage("error"); }
  }, [previewUrl, serverBaseUrl]);

  const handleConfirm = useCallback(() => {
    if (aiResult) { storeAIDefs(aiResult.defs); onConfirm(aiResult.defs, aiResult.planName); }
  }, [aiResult, onConfirm]);

  const handleReset = useCallback(() => {
    setStage("idle"); setPreviewUrl(null); setAiResult(null); setErrorMsg(""); setProgressPct(0); setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[640px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="size-[40px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center">
              <Upload className="size-[20px] text-[#09090B]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090B] tracking-[-0.5px]">Upload Floor Plan</h3>
              <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">Import a floor plan image to create a template</p>
            </div>
          </div>
          <button onClick={onClose} className="size-[34px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors">
            <X className="size-[18px] text-[#71717A]" />
          </button>
        </div>

        <div className="p-6">
          {stage === "idle" && (
            <div
              onDragOver={(e) => { handleDrag(e); setIsDragOver(true); }}
              onDragLeave={(e) => { handleDrag(e); setIsDragOver(false); }}
              onDrop={(e) => { handleDrag(e); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
              className={`border-2 border-dashed rounded-[17px] p-10 flex flex-col items-center text-center cursor-pointer transition-colors ${isDragOver ? "border-[#09090B] bg-[#F6F6F6]" : "border-[#E5E7EB] bg-[#FAFAFA]"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
              <div className="size-[56px] rounded-[14px] bg-[#F6F6F6] border border-[#E5E7EB] flex items-center justify-center mb-4">
                <Upload className="size-[24px] text-[#09090B]" strokeWidth={1.5} />
              </div>
              <h4 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px] mb-1.5">Upload your floor plan</h4>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] mb-4 max-w-[380px]">Drag and drop your floor plan image, or click to browse. Max 5 MB.</p>
              <div className="flex items-center gap-2">
                {["PNG", "JPG", "BMP", "WebP"].map((fmt) => (
                  <span key={fmt} className="px-2.5 py-1 rounded-[100px] bg-white border border-[#E5E7EB] font-['Inter',sans-serif] text-[11px] font-medium text-[#09090B]">.{fmt}</span>
                ))}
              </div>
            </div>
          )}

          {stage === "preview" && previewUrl && (
            <div className="bg-[#F6F6F6] rounded-[17px] border border-[#F3F4F6] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-[#EEEEEE] p-4 flex items-center justify-center min-h-[200px]">
                  <img src={previewUrl} alt="Floor plan preview" className="max-w-full max-h-[240px] rounded-[8px] object-contain" />
                </div>
                <div className="md:w-1/2 p-5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-[36px] rounded-[14px] bg-white flex items-center justify-center"><Image className="size-[18px] text-[#09090B]" strokeWidth={1.5} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#09090B] tracking-[-0.3px] truncate">{fileName}</p>
                      <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A]">Ready to analyze</p>
                    </div>
                  </div>
                  <div className="bg-white border border-[#F3F4F6] rounded-[14px] p-3.5 mb-5">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="size-[14px] text-[#09090B] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="font-['Inter',sans-serif] text-[11px] text-[#71717A] leading-relaxed">
                        <p className="font-medium text-[#09090B] mb-0.5">AI Analysis Pipeline</p>
                        <ul className="list-disc pl-3.5 space-y-0.5"><li>Room detection & segmentation</li><li>Wall, door, window identification</li><li>3D model generation</li></ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleReset} className="flex-1 h-[38px] rounded-[100px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors">Change</button>
                    <button onClick={startAnalysis} className="flex-1 flex items-center justify-center gap-1.5 h-[38px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
                      Analyze <ArrowRight className="size-[14px]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === "processing" && (
            <div className="py-10 flex flex-col items-center text-center">
              <Loader2 className="size-[36px] text-[#09090B] animate-spin mb-5" strokeWidth={1.5} />
              <h4 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px] mb-1.5">Analyzing floor plan...</h4>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] mb-5">{progressMsg}</p>
              <div className="w-full max-w-[360px] h-[5px] bg-[#F6F6F6] rounded-full overflow-hidden">
                <div style={{ width: `${progressPct}%` }} className="h-full bg-[#09090B] rounded-full transition-all duration-300" />
              </div>
              <p className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] mt-2">{progressPct}% complete</p>
            </div>
          )}

          {stage === "done" && aiResult && (
            <div className="bg-[#F6F6F6] rounded-[17px] border border-[#F3F4F6] overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 bg-[#EEEEEE] p-4 flex items-center justify-center min-h-[200px]">
                  {previewUrl && <img src={previewUrl} alt="Analyzed floor plan" className="max-w-full max-h-[240px] rounded-[8px] object-contain" />}
                </div>
                <div className="md:w-1/2 p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-[32px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check className="size-[16px] text-white" strokeWidth={2.5} /></div>
                    <div>
                      <p className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.3px]">Floor plan analyzed</p>
                      <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A]">{aiResult.roomCount} rooms detected</p>
                    </div>
                  </div>
                  <div className="max-h-[130px] overflow-auto rounded-[14px] border border-[#F3F4F6] bg-white mb-4">
                    {aiResult.defs.map((room, i) => (
                      <div key={room.id} className={`flex items-center gap-2.5 px-3.5 py-2 ${i < aiResult.defs.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                        <div className="size-[7px] rounded-full shrink-0" style={{ backgroundColor: room.accent }} />
                        <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B] flex-1 tracking-[-0.2px]">{room.label}</span>
                        <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">{((room.bounds[1] - room.bounds[0]) * (room.bounds[3] - room.bounds[2])).toFixed(1)} m²</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={handleReset} className="flex-1 h-[38px] rounded-[100px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors">Different File</button>
                    <button onClick={handleConfirm} className="flex-1 flex items-center justify-center gap-1.5 h-[38px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
                      Open in Editor <ArrowRight className="size-[14px]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="size-[48px] rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="size-[22px] text-red-500" />
              </div>
              <h4 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px] mb-1">Analysis Failed</h4>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] mb-5 max-w-[380px]">{errorMsg}</p>
              <button onClick={handleReset} className="h-[38px] px-6 rounded-[100px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── ADMIN TEMPLATE EDITOR TAB ─────────────────── */

interface TemplateListItem {
  id: string;
  name: string;
  category: string;
  unitType: string;
  description: string;
  isActive: boolean;
  projectData: any;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══ Category & Unit Type constants ═══
const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "bto", label: "BTO" },
  { value: "resale", label: "Resale HDB" },
  { value: "condo", label: "Condo" },
  { value: "landed", label: "Landed" },
  { value: "commercial", label: "Commercial" },
] as const;

const TEMPLATE_SORT_OPTIONS = [
  { value: "updated-desc", label: "Recently Updated" },
  { value: "updated-asc", label: "Oldest Updated" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "created-desc", label: "Newest Created" },
] as const;

type SortOption = typeof TEMPLATE_SORT_OPTIONS[number]["value"];

// ═══ Version History types ═══
interface VersionEntry { versionId: string; savedAt: string; name: string; roomCount: number; furnitureCount: number; thumbnailUrl: string | null; }

function AdminTemplateEditorTab() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ═══ Filtering / Search / Sort ═══
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "hasData" | "noData">("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated-desc");

  // ═══ Selection / Bulk ═══
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // ═══ Version History ═══
  const [versionModalTemplateId, setVersionModalTemplateId] = useState<string | null>(null);
  const [versionModalTemplateName, setVersionModalTemplateName] = useState("");
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  // ═══ Delete confirmation ═══
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteConfirmPermanent, setDeleteConfirmPermanent] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // ═══ Toast ═══
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/fp3d/templates?all=true`, { headers: AUTH });
      const json = await res.json();
      setTemplates((json.templates || []).sort((a: TemplateListItem, b: TemplateListItem) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      setError("Failed to load templates");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleNewTemplate = () => navigate("/admin/template-editor?scratch=true");
  const handleEditTemplate = (id: string) => navigate(`/admin/template-editor/${id}`);

  const handleUploadConfirm = async (defs: ParsedHouseRoomDef[], planName: string) => {
    setShowUploadModal(false);
    storeAIDefs(defs);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/fp3d/templates`, {
        method: "POST", headers,
        body: JSON.stringify({
          name: planName || `Imported Plan (${defs.length} rooms)`,
          category: "bto",
          unitType: defs.length <= 4 ? "3-Room" : defs.length <= 6 ? "4-Room" : "5-Room",
          description: `Imported from floor plan image with ${defs.length} rooms`,
          projectData: { roomDefinitions: defs, furniture: Object.fromEntries(defs.map((d) => [d.id, []])) },
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const newId = d.template?.id;
        if (newId) { navigate(`/admin/template-editor/${newId}?import=image`); return; }
      }
    } catch (e) { console.error("[AdminTemplateEditor] Upload error:", e); }
    navigate("/admin/template-editor?import=image");
  };

  // ═══ Individual Actions ═══
  const handleDuplicate = useCallback(async (id: string) => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/fp3d/templates/${id}/duplicate`, { method: "POST", headers });
      if (res.ok) { showToast("Template duplicated"); await fetchTemplates(); }
      else { const e = await res.text(); console.error("Duplicate failed:", e); showToast("Failed to duplicate"); }
    } catch (e) { console.error("Duplicate error:", e); showToast("Duplicate failed"); }
  }, [fetchTemplates, showToast]);

  const handleToggleActive = useCallback(async (id: string, currentActive: boolean) => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/fp3d/templates/${id}`, {
        method: "PUT", headers, body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) { showToast(currentActive ? "Template deactivated" : "Template activated"); await fetchTemplates(); }
      else { showToast("Failed to update status"); }
    } catch (e) { console.error("Toggle active error:", e); showToast("Update failed"); }
  }, [fetchTemplates, showToast]);

  const handleDelete = useCallback(async (id: string, permanent: boolean) => {
    setDeleteLoading(true);
    try {
      const headers = await getAdminAuthHeaders();
      const url = permanent ? `${API}/fp3d/templates/${id}/permanent` : `${API}/fp3d/templates/${id}`;
      const res = await fetch(url, { method: "DELETE", headers });
      if (res.ok) {
        showToast(permanent ? "Template permanently deleted" : "Template deactivated");
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        await fetchTemplates();
      } else { showToast("Delete failed"); }
    } catch (e) { console.error("Delete error:", e); showToast("Delete failed"); }
    setDeleteLoading(false);
    setDeleteConfirmId(null);
  }, [fetchTemplates, showToast]);

  // ═══ Bulk Actions ═══
  const handleBulkDuplicate = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const headers = await getAdminAuthHeaders();
    let ok = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API}/fp3d/templates/${id}/duplicate`, { method: "POST", headers });
        if (res.ok) ok++;
      } catch (_) {}
    }
    showToast(`Duplicated ${ok} template${ok !== 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    await fetchTemplates();
    setBulkActionLoading(false);
  }, [selectedIds, fetchTemplates, showToast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const headers = await getAdminAuthHeaders();
    let ok = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API}/fp3d/templates/${id}`, { method: "DELETE", headers });
        if (res.ok) ok++;
      } catch (_) {}
    }
    showToast(`Deactivated ${ok} template${ok !== 1 ? "s" : ""}`);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    await fetchTemplates();
    setBulkActionLoading(false);
  }, [selectedIds, fetchTemplates, showToast]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  // ═══ Version History ═══
  const openVersionHistory = useCallback(async (templateId: string, templateName: string) => {
    setVersionModalTemplateId(templateId);
    setVersionModalTemplateName(templateName);
    setVersionsLoading(true);
    setVersions([]);
    try {
      const res = await fetch(`${API}/fp3d/templates/${templateId}/versions`, { headers: AUTH });
      const json = await res.json();
      setVersions(json.versions || []);
    } catch (e) { console.error("Failed to fetch versions:", e); }
    setVersionsLoading(false);
  }, []);

  const handleRestoreVersion = useCallback(async (templateId: string, versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/fp3d/templates/${templateId}/versions/${versionId}/restore`, { method: "POST", headers });
      if (res.ok) {
        showToast("Version restored successfully");
        setVersionModalTemplateId(null);
        await fetchTemplates();
      } else { showToast("Failed to restore version"); }
    } catch (e) { console.error("Restore version error:", e); showToast("Restore failed"); }
    setRestoringVersionId(null);
  }, [fetchTemplates, showToast]);

  // ═══ Filtering & Sorting Logic ═══
  const filteredTemplates = (() => {
    let result = [...templates];
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.unitType?.toLowerCase().includes(q)
      );
    }
    // Category
    if (filterCategory !== "all") result = result.filter((t) => t.category === filterCategory);
    // Status
    if (filterStatus === "active") result = result.filter((t) => t.isActive);
    else if (filterStatus === "inactive") result = result.filter((t) => !t.isActive);
    else if (filterStatus === "hasData") result = result.filter((t) => t.projectData);
    else if (filterStatus === "noData") result = result.filter((t) => !t.projectData);
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "updated-asc": return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "created-desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    return result;
  })();

  // Category counts
  const categoryCounts = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-['Inter',sans-serif] font-bold text-[22px] text-[#101828] tracking-tight">Template Editor</h2>
          <p className="font-['Inter',sans-serif] text-[14px] text-[#6a7282] mt-0.5">
            Create, edit, duplicate, and manage floor plan templates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#101828] px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#F6F6F6] transition-colors cursor-pointer">
            <Upload className="size-4" /> Upload Floor Plan
          </button>
          <button onClick={handleNewTemplate} className="flex items-center gap-2 bg-[#101828] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#1f2937] transition-colors cursor-pointer shadow-sm">
            <Plus className="size-4" /> New Template
          </button>
        </div>
      </div>

      {/* ═══ Filter Bar ═══ */}
      {templates.length > 0 && (
        <div className="space-y-3 mb-5">
          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-[16px] text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name, description, or unit type..."
                className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] pl-10 pr-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 size-[18px] rounded-full bg-[#E5E7EB] flex items-center justify-center hover:bg-[#D4D4D8] transition-colors">
                  <X className="size-[10px] text-[#6a7282]" />
                </button>
              )}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[13px] text-[#09090B] outline-none focus:border-[#09090B] appearance-none cursor-pointer min-w-[180px]">
              {TEMPLATE_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Category pills + status pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills */}
            {TEMPLATE_CATEGORIES.map((cat) => {
              const count = cat.value === "all" ? templates.length : (categoryCounts[cat.value] || 0);
              const isActive = filterCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[100px] text-[13px] font-medium transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-[#09090B] text-white border-[#09090B]"
                      : "bg-white text-[#09090B] border-[#E5E7EB] hover:bg-[#F6F6F6]"
                  }`}
                >
                  {cat.label}
                  <span className={`text-[11px] ${isActive ? "text-white/70" : "text-[#9ca3af]"}`}>{count}</span>
                </button>
              );
            })}

            <div className="w-px h-[24px] bg-[#E5E7EB] mx-1" />

            {/* Status pills */}
            {([
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "hasData", label: "Has Layout" },
              { value: "noData", label: "No Layout" },
            ] as const).map((s) => {
              const isActive = filterStatus === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFilterStatus(s.value)}
                  className={`px-3 py-1.5 rounded-[100px] text-[12px] font-medium transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-[#F6F6F6] text-[#09090B] border-[#09090B]"
                      : "bg-white text-[#6a7282] border-[#E5E7EB] hover:bg-[#F6F6F6]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Bulk Action Bar ═══ */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-5 bg-[#F6F6F6] border border-[#E5E7EB] rounded-[14px] px-4 py-2.5">
          <button onClick={() => setSelectedIds((prev) => prev.size === filteredTemplates.length ? new Set() : new Set(filteredTemplates.map((t) => t.id)))} className="size-[20px] rounded border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F6F6F6] cursor-pointer transition-colors">
            {selectedIds.size === filteredTemplates.length ? <Check className="size-[12px] text-[#09090B]" /> : <span className="size-[8px] rounded-sm bg-[#09090B]" />}
          </button>
          <span className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#09090B]">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={handleBulkDuplicate}
            disabled={bulkActionLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[100px] bg-white border border-[#E5E7EB] text-[12px] font-medium text-[#09090B] hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50"
          >
            {bulkActionLoading ? <Loader2 className="size-3 animate-spin" /> : <FolderOpen className="size-3" />}
            Duplicate
          </button>
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            disabled={bulkActionLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[100px] bg-red-50 border border-red-200 text-[12px] font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            Deactivate
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="size-[24px] rounded-full hover:bg-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer">
            <X className="size-[14px] text-[#6a7282]" />
          </button>
        </div>
      )}

      {/* ═══ Upload Floor Plan Modal ═══ */}
      {showUploadModal && <UploadFloorPlanModal onClose={() => setShowUploadModal(false)} onConfirm={handleUploadConfirm} />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="size-5 text-red-500 mt-0.5 shrink-0" />
          <p className="font-['Inter',sans-serif] text-[14px] text-red-700">{error}</p>
        </div>
      )}

      {/* ═══ Template Grid ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-[#9ca3af] animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-12 text-center">
          <div className="bg-[#f3f4f6] rounded-2xl size-[64px] flex items-center justify-center mx-auto mb-5">
            <PenLine className="size-7 text-[#9ca3af]" />
          </div>
          <h3 className="font-['Inter',sans-serif] font-semibold text-[18px] text-[#101828] mb-2">No templates yet</h3>
          <p className="font-['Inter',sans-serif] text-[14px] text-[#6a7282] mb-6 max-w-md mx-auto">
            Create your first template from scratch or upload a floor plan image.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#101828] px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#F6F6F6] transition-colors cursor-pointer">
              <Upload className="size-4" /> Upload Floor Plan
            </button>
            <button onClick={handleNewTemplate} className="inline-flex items-center gap-2 bg-[#101828] text-white px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#1f2937] transition-colors cursor-pointer shadow-sm">
              <Plus className="size-4" /> Create from Scratch
            </button>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-10 text-center">
          <p className="font-['Inter',sans-serif] text-[14px] text-[#6a7282]">
            No templates match your filters. <button onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterStatus("all"); }} className="text-[#09090B] underline font-medium cursor-pointer">Clear filters</button>
          </p>
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds((prev) => prev.size === filteredTemplates.length ? new Set() : new Set(filteredTemplates.map((t) => t.id)))} className="size-[18px] rounded border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F6F6F6] cursor-pointer transition-colors">
                {selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0 ? <Check className="size-[10px] text-[#09090B]" /> : null}
              </button>
              <span className="font-['Inter',sans-serif] text-[12px] text-[#6a7282]">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
                {(searchQuery || filterCategory !== "all" || filterStatus !== "all") && ` (filtered from ${templates.length})`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => (
              <TemplateEditorCard
                key={t.id}
                template={t}
                isSelected={selectedIds.has(t.id)}
                onToggleSelect={() => toggleSelect(t.id)}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicate}
                onToggleActive={handleToggleActive}
                onDelete={(id, name) => { setDeleteConfirmId(id); setDeleteConfirmName(name); setDeleteConfirmPermanent(false); }}
                onPermanentDelete={(id, name) => { setDeleteConfirmId(id); setDeleteConfirmName(name); setDeleteConfirmPermanent(true); }}
                onViewVersions={openVersionHistory}
              />
            ))}
          </div>
        </>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteConfirmId(null)}>
          <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`size-[40px] rounded-[14px] flex items-center justify-center ${deleteConfirmPermanent ? "bg-red-50" : "bg-[#F6F6F6]"}`}>
                <Trash2 className={`size-[20px] ${deleteConfirmPermanent ? "text-red-500" : "text-[#09090B]"}`} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px]">
                  {deleteConfirmPermanent ? "Permanently Delete?" : "Deactivate Template?"}
                </h3>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{deleteConfirmName}</p>
              </div>
            </div>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] mb-5">
              {deleteConfirmPermanent
                ? "This will permanently delete this template and all its version history. This action cannot be undone."
                : "This will deactivate the template. It won't appear in user template lists but can be reactivated later."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} disabled={deleteLoading} className="flex-1 h-[40px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId, deleteConfirmPermanent)}
                disabled={deleteLoading}
                className={`flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[14px] font-['Inter',sans-serif] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  deleteConfirmPermanent ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#09090B] text-white hover:opacity-90"
                }`}
              >
                {deleteLoading && <Loader2 className="size-3.5 animate-spin" />}
                {deleteConfirmPermanent ? "Delete Forever" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Bulk Delete Confirmation ═══ */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !bulkActionLoading && setBulkDeleteConfirm(false)}>
          <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px] mb-2">
              Deactivate {selectedIds.size} template{selectedIds.size !== 1 ? "s" : ""}?
            </h3>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] mb-5">
              These templates will be deactivated and hidden from user lists. They can be reactivated later.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} disabled={bulkActionLoading} className="flex-1 h-[40px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkActionLoading} className="flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[14px] bg-red-600 text-white font-['Inter',sans-serif] text-[13px] font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">
                {bulkActionLoading && <Loader2 className="size-3.5 animate-spin" />}
                Deactivate All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Version History Modal ═══ */}
      {versionModalTemplateId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setVersionModalTemplateId(null)}>
          <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[560px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <div className="size-[40px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center">
                  <BookOpen className="size-[20px] text-[#09090B]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px]">Version History</h3>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A] truncate max-w-[280px]">{versionModalTemplateName}</p>
                </div>
              </div>
              <button onClick={() => setVersionModalTemplateId(null)} className="size-[34px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors cursor-pointer">
                <X className="size-[18px] text-[#71717A]" />
              </button>
            </div>

            {/* Versions list */}
            <div className="flex-1 overflow-y-auto p-6">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 text-[#9ca3af] animate-spin" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="size-8 text-[#D4D4D8] mx-auto mb-3" strokeWidth={1} />
                  <p className="font-['Inter',sans-serif] text-[14px] text-[#6a7282] mb-1">No version history yet</p>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#9ca3af]">Versions are created automatically each time you save changes in the editor.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v, i) => (
                    <div key={v.versionId} className="flex items-center gap-4 p-3.5 bg-[#FAFAFA] border border-[#F3F4F6] rounded-[14px] hover:bg-[#F6F6F6] transition-colors group/ver">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`size-[10px] rounded-full border-2 ${i === 0 ? "bg-[#09090B] border-[#09090B]" : "bg-white border-[#D4D4D8]"}`} />
                        {i < versions.length - 1 && <div className="w-px h-[20px] bg-[#E5E7EB]" />}
                      </div>

                      {/* Thumbnail */}
                      {v.thumbnailUrl ? (
                        <div className="size-[48px] rounded-[8px] overflow-hidden bg-[#EEEEEE] shrink-0">
                          <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="size-[48px] rounded-[8px] bg-[#EEEEEE] flex items-center justify-center shrink-0">
                          <LayoutTemplate className="size-[18px] text-[#D4D4D8]" strokeWidth={1} />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#09090B] tracking-[-0.2px] truncate">{v.name}</p>
                        <p className="font-['Inter',sans-serif] text-[11px] text-[#9ca3af]">
                          {new Date(v.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          {" · "}{v.roomCount} room{v.roomCount !== 1 ? "s" : ""}, {v.furnitureCount} item{v.furnitureCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Restore button */}
                      <button
                        onClick={() => handleRestoreVersion(versionModalTemplateId!, v.versionId)}
                        disabled={restoringVersionId === v.versionId}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[100px] bg-white border border-[#E5E7EB] text-[11px] font-medium text-[#09090B] hover:bg-[#F6F6F6] transition-colors cursor-pointer opacity-0 group-hover/ver:opacity-100 disabled:opacity-50"
                      >
                        {restoringVersionId === v.versionId ? <Loader2 className="size-3 animate-spin" /> : <ArrowRight className="size-3 rotate-180" />}
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast ═══ */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#09090B] text-white rounded-[100px] px-5 py-3 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.2)] animate-[fadeInUp_0.2s_ease]">
          <Check className="size-[14px]" strokeWidth={2.5} />
          <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

// ═══ Template Card with selection, context menu, version access ═══
interface TemplateCardProps {
  template: TemplateListItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string, name: string) => void;
  onPermanentDelete: (id: string, name: string) => void;
  onViewVersions: (id: string, name: string) => void;
}

function TemplateEditorCard({ template, isSelected, onToggleSelect, onEdit, onDuplicate, onToggleActive, onDelete, onPermanentDelete, onViewVersions }: TemplateCardProps) {
  const hasData = !!template.projectData;
  const roomCount = template.projectData?.roomDefinitions?.length || template.projectData?.roomDefs?.length || 0;
  const furnitureCount = template.projectData?.furniture
    ? Object.values(template.projectData.furniture).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] transition-all duration-200 group relative ${
      isSelected ? "border-[#09090B] ring-1 ring-[#09090B]" : "border-[#e5e7eb]"
    }`}>
      {/* Selection checkbox (top-left, over thumbnail) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className={`absolute top-3 left-3 z-10 size-[22px] rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
          isSelected
            ? "bg-[#09090B] border-[#09090B]"
            : "bg-white/80 border-[#D4D4D8] backdrop-blur-sm opacity-0 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check className="size-[12px] text-white" strokeWidth={3} />}
      </button>

      {/* Context menu button (top-right) */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="size-[28px] rounded-[8px] bg-white/80 backdrop-blur-sm border border-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all cursor-pointer shadow-sm"
        >
          <svg className="size-[14px] text-[#6a7282]" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" /></svg>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full right-0 mt-1 bg-white rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#F3F4F6] overflow-hidden w-[190px] z-50">
              <button onClick={() => { onEdit(template.id); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors">
                <PenLine className="size-[14px] text-[#6a7282]" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B]">{hasData ? "Edit in Editor" : "Open in Editor"}</span>
              </button>
              <button onClick={() => { onDuplicate(template.id); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors">
                <FolderOpen className="size-[14px] text-[#6a7282]" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B]">Duplicate</span>
              </button>
              <button onClick={() => { onViewVersions(template.id, template.name); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors">
                <BookOpen className="size-[14px] text-[#6a7282]" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B]">Version History</span>
              </button>
              <button onClick={() => { onToggleActive(template.id, template.isActive); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors">
                {template.isActive ? <EyeOff className="size-[14px] text-[#6a7282]" strokeWidth={1.5} /> : <Eye className="size-[14px] text-[#6a7282]" strokeWidth={1.5} />}
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B]">{template.isActive ? "Deactivate" : "Activate"}</span>
              </button>
              <div className="h-px bg-[#F3F4F6]" />
              <button onClick={() => { onDelete(template.id, template.name); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors">
                <Trash2 className="size-[14px] text-[#6a7282]" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B]">Deactivate</span>
              </button>
              <button onClick={() => { onPermanentDelete(template.id, template.name); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-red-50 transition-colors">
                <Trash2 className="size-[14px] text-red-500" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-red-600 font-medium">Delete Forever</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Thumbnail — 2D floor plan */}
      <div className="relative w-full h-[140px] bg-white cursor-pointer flex items-center justify-center overflow-hidden" onClick={() => onEdit(template.id)}>
        {template.projectData?.roomDefinitions?.length > 0 ? (
          <div className="w-full h-full p-2">
            <FloorPlanThumbnail roomDefs={template.projectData.roomDefinitions} size="small" />
          </div>
        ) : (
          <LayoutTemplate className="size-8 text-[#D4D4D8]" strokeWidth={1} />
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm ${
            hasData ? "bg-green-50/90 text-green-700 border border-green-200" : "bg-white/80 text-[#6a7282] border border-[#e5e7eb]"
          }`}>
            {hasData ? <><CheckCircle2 className="size-2.5" /> Layout</> : <><LayoutTemplate className="size-2.5" /> No Layout</>}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
            template.isActive ? "bg-green-50/90 text-green-600" : "bg-red-50/90 text-red-500"
          }`}>
            {template.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Template info */}
        <h4 className="font-['Inter',sans-serif] font-bold text-[15px] text-[#101828] tracking-[-0.3px] mb-0.5 truncate cursor-pointer hover:text-[#374151]" onClick={() => onEdit(template.id)}>{template.name}</h4>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-[100px] bg-[#F6F6F6] border border-[#E5E7EB] font-['Inter',sans-serif] text-[10px] font-medium text-[#6a7282]">{template.category.toUpperCase()}</span>
          <span className="px-2 py-0.5 rounded-[100px] bg-[#F6F6F6] border border-[#E5E7EB] font-['Inter',sans-serif] text-[10px] font-medium text-[#6a7282]">{template.unitType}</span>
        </div>

        {template.description && (
          <p className="font-['Inter',sans-serif] text-[12px] text-[#6a7282] mb-2.5 line-clamp-2 leading-relaxed">{template.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-[#9ca3af] font-['Inter',sans-serif]">
          {hasData && (
            <>
              <span className="flex items-center gap-1"><Building2 className="size-3" />{roomCount} room{roomCount !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Package className="size-3" />{furnitureCount} item{furnitureCount !== 1 ? "s" : ""}</span>
              <span className="text-[#D4D4D8]">·</span>
            </>
          )}
          <span>{new Date(template.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(template.id)}
            className="flex-1 flex items-center justify-center gap-1.5 h-[36px] bg-[#101828] text-white rounded-xl text-[12px] font-semibold hover:bg-[#1f2937] transition-colors cursor-pointer"
          >
            <PenLine className="size-3" />
            {hasData ? "Edit" : "Open Editor"}
          </button>
          <button
            onClick={() => onDuplicate(template.id)}
            className="h-[36px] px-3 border border-[#E5E7EB] rounded-xl text-[12px] font-medium text-[#6a7282] hover:bg-[#F6F6F6] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Duplicate"
          >
            <FolderOpen className="size-3" />
          </button>
          <button
            onClick={() => onViewVersions(template.id, template.name)}
            className="h-[36px] px-3 border border-[#E5E7EB] rounded-xl text-[12px] font-medium text-[#6a7282] hover:bg-[#F6F6F6] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Version History"
          >
            <BookOpen className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN ADMIN COMPONENT ─────────────────── */

export function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<{ userId: string; email: string; name: string } | null>(null);

  if (!adminUser) {
    return <AdminLoginGate onAuthenticated={setAdminUser} />;
  }

  return <AdminDashboardContent adminUser={adminUser} onLogout={() => { supabase.auth.signOut(); setAdminUser(null); }} />;
}

function AdminDashboardContent({ adminUser, onLogout }: { adminUser: { userId: string; email: string; name: string }; onLogout: () => void }) {
  const navigate = useNavigate();
  const [designers, setDesigners] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<DesignerFormData>(emptyForm());
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [designerToggleConfirm, setDesignerToggleConfirm] = useState<{ slug: string; currentlyActive: boolean } | null>(null);
  const [designerDeleteConfirm, setDesignerDeleteConfirm] = useState<{ slug: string; name: string } | null>(null);
  const [deletingDesigner, setDeletingDesigner] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<"overview" | "lead-magnets" | "analytics" | "designers" | "templates" | "template-editor" | "debug" | "deleted">("overview");
  const [designerSearch, setDesignerSearch] = useState("");
  const [designerStatusFilter, setDesignerStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [salesRepFilter, setSalesRepFilter] = useState<string>("all");
  // Map: lowercased firm name → primary sales rep, sourced from Airtable
  // (Clients Pipeline → ALL view → Sales Representatives field).
  const [salesRepByFirm, setSalesRepByFirm] = useState<Map<string, string>>(new Map());

  // Pull the firms list once so we can drive the Sales Rep filter without
  // adding a second admin endpoint. Cached server-side for ~5 minutes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/firm-onboarding/airtable-firms`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const firms: any[] = Array.isArray(json?.firms) ? json.firms : [];
        if (cancelled) return;
        const m = new Map<string, string>();
        for (const f of firms) {
          const name = String(f?.firmName || "").trim().toLowerCase();
          const rep = String(f?.salesRep || "").trim();
          if (name && rep) m.set(name, rep);
        }
        setSalesRepByFirm(m);
      } catch { /* surface nothing — filter just stays empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const repForDesigner = useCallback((d: any): string => {
    const name = String(d?.name || "").trim().toLowerCase();
    return name ? (salesRepByFirm.get(name) || "") : "";
  }, [salesRepByFirm]);

  const salesRepOptions = useMemo(() => {
    const set = new Set<string>();
    salesRepByFirm.forEach((rep) => { if (rep) set.add(rep); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [salesRepByFirm]);

  // Filtered designers — active firms always render first, then the rest
  // alphabetically by name. Keeps the admin's own actionable set at the top.
  const filteredDesigners = designers
    .filter((d: any) => {
      const matchesSearch = !designerSearch ||
        (d.name || "").toLowerCase().includes(designerSearch.toLowerCase()) ||
        (d.slug || "").toLowerCase().includes(designerSearch.toLowerCase()) ||
        (d.tagline || "").toLowerCase().includes(designerSearch.toLowerCase());
      const matchesStatus = designerStatusFilter === "all" ||
        (designerStatusFilter === "active" && d.active !== false) ||
        (designerStatusFilter === "inactive" && d.active === false);
      const rep = repForDesigner(d);
      const matchesRep = salesRepFilter === "all"
        || (salesRepFilter === "__unassigned" ? !rep : rep === salesRepFilter);
      return matchesSearch && matchesStatus && matchesRep;
    })
    .sort((a: any, b: any) => {
      const aActive = a.active !== false ? 0 : 1;
      const bActive = b.active !== false ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return (a.name || a.slug || "").localeCompare(b.name || b.slug || "");
    });

  // Permanently delete a designer profile + all its sections.
  const deleteDesigner = useCallback(async (slug: string) => {
    setDeletingDesigner(slug);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/designers/${encodeURIComponent(slug)}`, { method: "DELETE", headers });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToast({ type: "success", message: `Archived "${slug}" — view in Deleted Designers to restore or remove forever` });
        setDesigners((prev) => prev.filter((d: any) => d.slug !== slug));
      } else {
        setToast({ type: "error", message: json.error || `Archive failed (${res.status})` });
      }
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Network error" });
    }
    setDeletingDesigner(null);
    setDesignerDeleteConfirm(null);
  }, []);

  // Fetch designer list
  const fetchDesigners = useCallback(async () => {
    setLoadingList(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`${API}/admin/designers`, { headers });
      const json = await res.json();
      setDesigners(json.data || []);
    } catch (err) {
      console.error("Failed to fetch designers:", err);
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchDesigners();
  }, [fetchDesigners]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Load existing designer for editing
  const loadDesigner = async (slug: string) => {
    try {
      const res = await fetch(`${API}/designers/${slug}`, { headers: AUTH });
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        setForm({
          slug: d.slug || slug,
          name: d.name || "",
          verified: d.verified || false,
          tagline: d.tagline || "",
          availability: d.availability || "",
          location: d.location || "",
          bio: d.bio || "",
          founder: d.founder || "",
          foundedYear: d.foundedYear || new Date().getFullYear(),
          totalProjects: d.totalProjects || 0,
          coverProject: d.coverProject || { name: "", cost: "", area: "", year: "", style: "" },
          stats: d.stats || { rating: "4.9", reviewCount: "0", years: "1", hdbCert: false, bcaLicensed: false },
          trustedSince: d.trustedSince || { title: "", description: "", badges: [], certifications: [] },
          btoPackage: d.btoPackage || { title: "", startingPrice: "", description: "", tags: [] },
          images: d.images || {},
          team: d.team || [],
          projects: d.projects || [],
          caseStudies: d.caseStudies || [],
          reviews: d.reviews || [],
          latestReviews: d.latestReviews || [],
          serviceArea: d.serviceArea || { hqAddress: "", hqLat: 1.3521, hqLng: 103.8198, description: "", mapEmbedUrl: "" },
          businessInfo: d.businessInfo || [],
        });
        setEditingSlug(slug);
        setActiveTab("profile");
        setShowForm(true);
      }
    } catch (err) {
      console.error("Failed to load designer:", err);
      setToast({ type: "error", message: "Failed to load designer profile" });
    }
  };

  // Toggle designer active/inactive
  const toggleDesignerActive = async (slug: string, currentlyActive: boolean) => {
    setDesignerToggleConfirm(null);
    setToggling(slug);
    const newActive = !currentlyActive;
    try {
      const toggleHeaders = await getAdminAuthHeaders();
      const res = await fetch(`${API}/designers/${slug}?preview=1`, { headers: toggleHeaders });
      const json = await res.json();
      if (json.data) {
        const updated = { ...json.data, active: newActive };
        const saveRes = await fetch(`${API}/designers/${slug}/profile`, {
          method: "PUT",
          headers: { ...toggleHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ data: updated }),
        });
        const saveJson = await saveRes.json();
        if (saveJson.success) {
          setToast({ type: "success", message: `Designer "${slug}" ${newActive ? "activated" : "deactivated"} successfully` });
          fetchDesigners();
        } else {
          setToast({ type: "error", message: saveJson.error || "Toggle failed" });
        }
      } else {
        setToast({ type: "error", message: "Could not load designer data" });
      }
    } catch (err) {
      setToast({ type: "error", message: "Network error during status toggle" });
    }
    setToggling(null);
  };

  // Save designer
  const saveDesigner = async () => {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Company name is required" });
      setActiveTab("profile");
      return;
    }
    // Auto-generate slug from name if empty
    const finalSlug = form.slug.trim() || generateSlug(form.name);
    if (!finalSlug) {
      setToast({ type: "error", message: "Could not generate URL slug from company name" });
      setActiveTab("profile");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: finalSlug,
        profile: {
          slug: finalSlug,
          name: form.name,
          verified: form.verified,
          tagline: form.tagline,
          availability: form.availability,
          location: form.location,
          bio: form.bio,
          founder: form.founder,
          foundedYear: form.foundedYear,
          totalProjects: form.totalProjects,
          coverProject: form.coverProject,
          stats: form.stats,
          trustedSince: form.trustedSince,
          btoPackage: form.btoPackage,
          images: form.images,
        },
        team: form.team,
        projects: form.projects,
        caseStudies: form.caseStudies,
        reviews: form.reviews,
        latestReviews: form.latestReviews,
        serviceArea: form.serviceArea,
        businessInfo: form.businessInfo,
      };

      const authHeaders = await getAdminAuthHeaders();
      const res = await fetch(`${API}/designers`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setToast({ type: "success", message: `Designer "${form.name}" saved successfully (${json.keysWritten} keys)` });
        updateForm("slug", finalSlug);
        setEditingSlug(finalSlug);
        fetchDesigners();
      } else {
        setToast({ type: "error", message: json.error || "Save failed" });
      }
    } catch (err) {
      console.error("Save error:", err);
      setToast({ type: "error", message: "Network error while saving" });
    }
    setSaving(false);
  };

  // Start new designer
  const startNew = () => {
    setForm(emptyForm());
    setEditingSlug(null);
    setActiveTab("profile");
    setShowForm(true);
  };

  // Helper to update nested form state
  const updateForm = <K extends keyof DesignerFormData>(key: K, value: DesignerFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ─── RENDER ─── */

  return (
    <div className="min-h-screen bg-[#f1f3f5] font-['Inter',sans-serif] flex flex-col">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-[14px] font-medium animate-[slideIn_0.3s_ease-out] ${
          toast.type === "success"
            ? "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]"
            : "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="size-5 text-[#22c55e]" /> : <AlertCircle className="size-5 text-[#ef4444]" />}
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#101828] rounded-xl size-[38px] flex items-center justify-center">
            <LayoutDashboard className="size-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[18px] text-[#101828] leading-tight">Admin Dashboard</h1>
            <p className="text-[12px] text-[#9ca3af]">{adminSection === "overview" ? "Platform Analytics & Insights" : adminSection === "lead-magnets" ? "Per-magnet conversion data" : adminSection === "analytics" ? "Designer profile visits & lead-form submissions" : adminSection === "designers" ? "Manage Designer Profiles" : adminSection === "templates" ? "Manage Floor Plan Templates" : adminSection === "debug" ? "Debug & Monitoring" : "Create & Edit Floor Plan Templates"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showForm && adminSection === "designers" && (
            <button
              onClick={() => { setShowForm(false); setEditingSlug(null); }}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              Back to List
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f3f4f6] rounded-lg mr-1">
            <div className="size-[26px] rounded-full bg-[#101828] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">{(adminUser.name || adminUser.email)[0]?.toUpperCase()}</span>
            </div>
            <span className="text-[12px] font-medium text-[#364153] max-w-[120px] truncate hidden sm:block">{adminUser.name || adminUser.email}</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-all cursor-pointer"
          >
            View Site
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#ef4444] hover:text-[#dc2626] border border-[#fecaca] rounded-xl hover:bg-[#fef2f2] transition-all cursor-pointer"
            title="Sign out of admin"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Sidebar + Content Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-[220px] bg-white border-r border-[#e5e7eb] p-3 flex flex-col gap-1 shrink-0">
          {([
            { key: "overview" as const, icon: LayoutDashboard, label: "Overview" },
            { key: "lead-magnets" as const, icon: Magnet, label: "Lead Magnets" },
            { key: "analytics" as const, icon: BarChart3, label: "Designer Analytics" },
            { key: "designers" as const, icon: Users, label: "Designer Profiles" },
            { key: "template-editor" as const, icon: PenLine, label: "Template Editor" },
            ...((adminUser.email || "").toLowerCase() === "raemerdr@gmail.com"
              ? [
                  { key: "deleted" as const, icon: Trash2, label: "Deleted Designers" },
                  { key: "debug" as const, icon: Activity, label: "Debug" },
                ]
              : []),
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => { setAdminSection(s.key); if (s.key !== "designers") setShowForm(false); }}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
                adminSection === s.key
                  ? "bg-[#101828] text-white"
                  : "text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#101828]"
              }`}
            >
              <s.icon className="size-4" strokeWidth={1.5} />
              {s.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {adminSection === "overview" ? (
          <AdminOverview onNavigate={(section) => setAdminSection(section as any)} />
        ) : adminSection === "lead-magnets" ? (
          <AdminLeadMagnets />
        ) : adminSection === "analytics" ? (
          <AdminAnalytics />
        ) : adminSection === "template-editor" ? (
          <AdminTemplateEditorTab />
        ) : adminSection === "debug" ? (
          (adminUser.email || "").toLowerCase() === "raemerdr@gmail.com"
            ? <AdminDebugPanel />
            : <div className="p-8 text-center text-[#6a7282]">Access restricted.</div>
        ) : adminSection === "deleted" ? (
          (adminUser.email || "").toLowerCase() === "raemerdr@gmail.com"
            ? <DeletedDesignersPanel />
            : <div className="p-8 text-center text-[#6a7282]">Access restricted.</div>
        ) : !showForm ? (
          /* ──────── DESIGNER LIST VIEW ──────── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[22px] text-[#101828] tracking-tight">Designer Profiles</h2>
                <p className="text-[14px] text-[#6a7282] mt-0.5">
                  {loadingList ? "Loading..." : `${filteredDesigners.length} of ${designers.length} profile${designers.length !== 1 ? "s" : ""}`}
                  {!loadingList && designers.length > 0 && (
                    <span className="ml-3 text-[13px]">
                      · <span className="text-[#22c55e] font-medium">{designers.filter((d: any) => d.completeness?.missing?.length === 0).length}</span> complete
                      · <span className="text-[#f59e0b] font-medium">{designers.filter((d: any) => d.completeness?.missing?.length > 0).length}</span> incomplete
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search by name, slug, or tagline..."
                  value={designerSearch}
                  onChange={(e) => setDesignerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-[14px] text-[#101828] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2b7fff]/20 focus:border-[#2b7fff] transition-all"
                />
                {designerSearch && (
                  <button onClick={() => setDesignerSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6a7282] cursor-pointer">
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
                {(["all", "active", "inactive"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setDesignerStatusFilter(status)}
                    className={`px-4 py-2.5 text-[13px] font-medium transition-all cursor-pointer capitalize ${
                      designerStatusFilter === status
                        ? status === "active" ? "bg-[#f0fdf4] text-[#16a34a] border-r border-[#e5e7eb]"
                        : status === "inactive" ? "bg-[#fffbeb] text-[#d97706] border-r border-[#e5e7eb]"
                        : "bg-[#f3f4f6] text-[#364153] border-r border-[#e5e7eb]"
                        : "text-[#6a7282] hover:bg-[#f9fafb] border-r border-[#e5e7eb] last:border-r-0"
                    }`}
                  >
                    {status === "all" ? `All (${designers.length})` : status === "active" ? `Active (${designers.filter((d: any) => d.active !== false).length})` : `Inactive (${designers.filter((d: any) => d.active === false).length})`}
                  </button>
                ))}
              </div>
              {/* Sales Representative — sourced from Airtable Clients Pipeline */}
              <select
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                className="h-[42px] pl-3 pr-8 bg-white border border-[#e5e7eb] rounded-xl text-[13px] text-[#364153] outline-none focus:border-[#2b7fff] cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6860' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                title="Filter by sales representative"
              >
                <option value="all">All sales reps</option>
                {salesRepOptions.map((rep) => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
                <option value="__unassigned">— Unassigned</option>
              </select>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="size-8 text-[#9ca3af] animate-spin" />
              </div>
            ) : filteredDesigners.length === 0 && designers.length === 0 ? (
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-12 text-center">
                <div className="bg-[#f3f4f6] rounded-full size-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="size-7 text-[#9ca3af]" />
                </div>
                <h3 className="font-semibold text-[18px] text-[#101828] mb-2">No designers yet</h3>
                <p className="text-[14px] text-[#6a7282] mb-6 max-w-[400px] mx-auto">
                  Create your first designer profile to get started. You can also seed sample data from the /seed page.
                </p>
                <button
                  onClick={startNew}
                  className="bg-[#2b7fff] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#1a5fd6] transition-colors cursor-pointer"
                >
                  Create First Designer
                </button>
              </div>
            ) : filteredDesigners.length === 0 ? (
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-12 text-center">
                <div className="bg-[#f3f4f6] rounded-full size-16 flex items-center justify-center mx-auto mb-4">
                  <Search className="size-7 text-[#9ca3af]" />
                </div>
                <h3 className="font-semibold text-[18px] text-[#101828] mb-2">No matching designers</h3>
                <p className="text-[14px] text-[#6a7282] mb-4">Try adjusting your search or filter criteria.</p>
                <button onClick={() => { setDesignerSearch(""); setDesignerStatusFilter("all"); }} className="text-[14px] font-medium text-[#2b7fff] hover:underline cursor-pointer">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDesigners.map((d: any) => (
                  <div
                    key={d.slug}
                    className={`bg-white border border-[#e5e7eb] rounded-2xl p-5 hover:shadow-md transition-shadow group ${d.active === false ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {d.images?.logo ? (
                        <div className="size-[52px] rounded-full bg-[#f3f4f6] shrink-0 overflow-hidden border border-[#e5e7eb]">
                          <img src={resolveAsset(d.images.logo)} alt="" className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      ) : (
                        <div className="size-[52px] rounded-full bg-[#f3f4f6] shrink-0 flex items-center justify-center border border-[#e5e7eb]">
                          <Building2 className="size-6 text-[#9ca3af]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[16px] text-[#101828] truncate">{d.name || d.slug}</h3>
                          {d.verified && (
                            <div className="bg-[#2b7fff] rounded-full size-[14px] flex items-center justify-center shrink-0">
                              <svg className="size-[8px]" viewBox="0 0 10 7.5" fill="none"><path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[12px] text-[#9ca3af]">/{d.slug}</p>
                          {d.active === false ? (
                            <span className="text-[10px] font-medium text-[#f59e0b] bg-[#fffbeb] border border-[#fde68a] rounded-full px-1.5 py-0.5 leading-none">Inactive</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#22c55e] bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-1.5 py-0.5 leading-none">
                              <span className="size-[6px] rounded-full bg-[#22c55e] inline-block" />Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {d.tagline && (
                      <p className="text-[13px] text-[#6a7282] leading-[20px] mb-3 line-clamp-2">{d.tagline}</p>
                    )}
                    {/* Profile Completeness */}
                    {d.completeness && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-[#6a7282]">Profile</span>
                          <span className={`text-[11px] font-semibold ${d.completeness.missing.length === 0 ? "text-[#22c55e]" : d.completeness.filled / d.completeness.total >= 0.7 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
                            {d.completeness.filled}/{d.completeness.total}
                          </span>
                        </div>
                        <div className="w-full h-[5px] bg-[#f3f4f6] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${d.completeness.missing.length === 0 ? "bg-[#22c55e]" : d.completeness.filled / d.completeness.total >= 0.7 ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`}
                            style={{ width: `${Math.round((d.completeness.filled / d.completeness.total) * 100)}%` }}
                          />
                        </div>
                        {d.completeness.missing.length > 0 && (
                          <p className="text-[10px] text-[#9ca3af] mt-1 line-clamp-1" title={d.completeness.missing.join(", ")}>
                            Missing: {d.completeness.missing.slice(0, 3).join(", ")}{d.completeness.missing.length > 3 ? ` +${d.completeness.missing.length - 3} more` : ""}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/edit-profile/${d.slug}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-2 text-[13px] font-medium text-[#364153] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                      >
                        <PenLine className="size-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => navigate(`/designer/${d.slug}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-2 text-[13px] font-medium text-[#364153] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
                      >
                        <Eye className="size-3.5" /> View
                      </button>
                      <button
                        onClick={() => setDesignerToggleConfirm({ slug: d.slug, currentlyActive: d.active !== false })}
                        disabled={toggling === d.slug}
                        className={`size-[34px] flex items-center justify-center border rounded-lg transition-all cursor-pointer disabled:opacity-50 ${d.active === false ? "border-[#e5e7eb] text-[#d1d5db] hover:text-[#22c55e] hover:border-[#bbf7d0] hover:bg-[#f0fdf4]" : "border-[#e5e7eb] text-[#d1d5db] hover:text-[#f59e0b] hover:border-[#fde68a] hover:bg-[#fffbeb]"}`}
                        title={d.active === false ? "Activate" : "Deactivate"}
                      >
                        {toggling === d.slug ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                      </button>
                      <button
                        onClick={() => setDesignerDeleteConfirm({ slug: d.slug, name: d.name || d.slug })}
                        disabled={deletingDesigner === d.slug}
                        className="size-[34px] flex items-center justify-center border border-[#e5e7eb] text-[#d1d5db] rounded-lg transition-all cursor-pointer hover:text-[#ef4444] hover:border-[#fecaca] hover:bg-[#fef2f2] disabled:opacity-50"
                        title="Delete designer"
                      >
                        {deletingDesigner === d.slug ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ──────── DESIGNER FORM VIEW ──────── */
          <div>
            {/* Form Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-[22px] text-[#101828] tracking-tight">
                  {editingSlug ? `Editing: ${form.name || editingSlug}` : "New Designer Profile"}
                </h2>
                <p className="text-[14px] text-[#6a7282] mt-0.5">
                  {editingSlug ? `Slug: ${editingSlug}` : "Fill in the details to create a new designer profile"}
                </p>
              </div>
              <button
                onClick={saveDesigner}
                disabled={saving}
                className="flex items-center gap-2 bg-[#2b7fff] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#1a5fd6] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border border-[#e5e7eb] rounded-2xl p-1.5 mb-6 flex gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#101828] text-white shadow-sm"
                      : "text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-5">
              {/* ── PROFILE TAB ── */}
              {activeTab === "profile" && (
                <>
                  <SectionCard title="Basic Information" icon={<Building2 className="size-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Field label="Company Name">
                        <Input value={form.name} onChange={(v) => {
                          updateForm("name", v);
                          if (!editingSlug) updateForm("slug", generateSlug(v));
                        }} placeholder="e.g. Sora Studios" />
                      </Field>
                      <Field label="URL Slug" hint={`/designer/${form.slug || "..."}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-[40px] bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl px-4 flex items-center text-[14px] text-[#6a7282] font-mono overflow-hidden">
                            {form.slug || "auto-generated-from-name"}
                          </div>
                          {editingSlug && (
                            <span className="text-[11px] text-[#9ca3af] shrink-0 italic">locked</span>
                          )}
                        </div>
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Tagline">
                          <TextArea
                            value={form.tagline}
                            onChange={(v) => updateForm("tagline", v)}
                            placeholder="Short description shown under the company name"
                            rows={2}
                          />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Bio">
                          <TextArea
                            value={form.bio}
                            onChange={(v) => updateForm("bio", v)}
                            placeholder="Longer description shown in the body section"
                            rows={3}
                          />
                        </Field>
                      </div>
                      <Field label="Founder Name">
                        <Input value={form.founder} onChange={(v) => updateForm("founder", v)} placeholder="e.g. Marcus Tan" />
                      </Field>
                      <Field label="Founded Year">
                        <Input type="number" value={form.foundedYear} onChange={(v) => updateForm("foundedYear", parseInt(v) || 0)} placeholder="2014" />
                      </Field>
                      <Field label="Total Projects">
                        <Input type="number" value={form.totalProjects} onChange={(v) => updateForm("totalProjects", parseInt(v) || 0)} placeholder="300" />
                      </Field>
                      <Field label="Location">
                        <Input value={form.location} onChange={(v) => updateForm("location", v)} placeholder="Singapore Based" />
                      </Field>
                      <Field label="Availability">
                        <Input value={form.availability} onChange={(v) => updateForm("availability", v)} placeholder="Available for Q3 2026" />
                      </Field>
                      <div className="flex items-end">
                        <Toggle checked={form.verified} onChange={(v) => updateForm("verified", v)} label="Verified Badge" />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Cover Project (Hero)" icon={<FolderOpen className="size-5" />} defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Field label="Project Name">
                        <Input value={form.coverProject.name} onChange={(v) => updateForm("coverProject", { ...form.coverProject, name: v })} placeholder="Serangoon Terrace" />
                      </Field>
                      <Field label="Renovation Cost">
                        <Input value={form.coverProject.cost} onChange={(v) => updateForm("coverProject", { ...form.coverProject, cost: v })} placeholder="$128,500" />
                      </Field>
                      <Field label="Area Size">
                        <Input value={form.coverProject.area} onChange={(v) => updateForm("coverProject", { ...form.coverProject, area: v })} placeholder="145m2" />
                      </Field>
                      <Field label="Year">
                        <Input value={form.coverProject.year} onChange={(v) => updateForm("coverProject", { ...form.coverProject, year: v })} placeholder="2024" />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Interior Style">
                          <Input value={form.coverProject.style} onChange={(v) => updateForm("coverProject", { ...form.coverProject, style: v })} placeholder="Modern Contemporary Luxe" />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Stats" icon={<Star className="size-5" />} defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <Field label="Rating">
                        <Input value={form.stats.rating} onChange={(v) => updateForm("stats", { ...form.stats, rating: v })} placeholder="4.9" />
                      </Field>
                      <Field label="Review Count">
                        <Input value={form.stats.reviewCount} onChange={(v) => updateForm("stats", { ...form.stats, reviewCount: v })} placeholder="186" />
                      </Field>
                      <Field label="Years Experience">
                        <Input value={form.stats.years} onChange={(v) => updateForm("stats", { ...form.stats, years: v })} placeholder="12" />
                      </Field>
                    </div>
                    <div className="flex gap-6 pt-2">
                      <Toggle checked={form.stats.hdbCert} onChange={(v) => updateForm("stats", { ...form.stats, hdbCert: v })} label="HDB Certified" />
                      <Toggle checked={form.stats.bcaLicensed} onChange={(v) => updateForm("stats", { ...form.stats, bcaLicensed: v })} label="BCA Licensed" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Trusted Since" icon={<Shield className="size-5" />} defaultOpen={false}>
                    <div className="space-y-4 pt-4">
                      <Field label="Section Title">
                        <Input value={form.trustedSince.title} onChange={(v) => updateForm("trustedSince", { ...form.trustedSince, title: v })} placeholder="Trusted Since 2014" />
                      </Field>
                      <Field label="Description">
                        <TextArea value={form.trustedSince.description} onChange={(v) => updateForm("trustedSince", { ...form.trustedSince, description: v })} placeholder="About the company's trust story..." />
                      </Field>
                      <Field label="Trust Badges (comma-separated)">
                        <Input
                          value={form.trustedSince.badges.join(", ")}
                          onChange={(v) => updateForm("trustedSince", { ...form.trustedSince, badges: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                          placeholder="100% Deposit Guarantee, On-Time Completion, Award Winning Design"
                        />
                      </Field>
                      <div>
                        <span className="text-[13px] font-semibold text-[#364153]">Certifications</span>
                        <div className="space-y-2 mt-2">
                          {form.trustedSince.certifications.map((cert, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <Input value={cert.name} onChange={(v) => { const c = [...form.trustedSince.certifications]; c[i] = { ...c[i], name: v }; updateForm("trustedSince", { ...form.trustedSince, certifications: c }); }} placeholder="Name" className="flex-1" />
                              <Input value={cert.license} onChange={(v) => { const c = [...form.trustedSince.certifications]; c[i] = { ...c[i], license: v }; updateForm("trustedSince", { ...form.trustedSince, certifications: c }); }} placeholder="License #" className="flex-1" />
                              <Input value={cert.since} onChange={(v) => { const c = [...form.trustedSince.certifications]; c[i] = { ...c[i], since: v }; updateForm("trustedSince", { ...form.trustedSince, certifications: c }); }} placeholder="Since" className="w-24" />
                              <RemoveButton onClick={() => { const c = form.trustedSince.certifications.filter((_, j) => j !== i); updateForm("trustedSince", { ...form.trustedSince, certifications: c }); }} />
                            </div>
                          ))}
                          <AddButton label="Add Certification" onClick={() => updateForm("trustedSince", { ...form.trustedSince, certifications: [...form.trustedSince.certifications, { name: "", license: "", since: "" }] })} />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="BTO Package CTA" icon={<Package className="size-5" />} defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Field label="Title">
                        <Input value={form.btoPackage.title} onChange={(v) => updateForm("btoPackage", { ...form.btoPackage, title: v })} placeholder="All-Inclusive BTO Packages" />
                      </Field>
                      <Field label="Starting Price">
                        <Input value={form.btoPackage.startingPrice} onChange={(v) => updateForm("btoPackage", { ...form.btoPackage, startingPrice: v })} placeholder="$28,888" />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Description">
                          <TextArea value={form.btoPackage.description} onChange={(v) => updateForm("btoPackage", { ...form.btoPackage, description: v })} rows={2} placeholder="Package details..." />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Tags (comma-separated)">
                          <Input
                            value={form.btoPackage.tags.join(", ")}
                            onChange={(v) => updateForm("btoPackage", { ...form.btoPackage, tags: v.split(",").map((s) => s.trim()).filter(Boolean) })}
                            placeholder="0% Interest Installments, No Hidden Costs"
                          />
                        </Field>
                      </div>
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ── IMAGES TAB ── */}
              {activeTab === "images" && (
                <SectionCard title="Image Uploads" icon={<Image className="size-5" />}>
                  <p className="text-[13px] text-[#6a7282] pt-4 pb-2">
                    Upload images for the designer profile. Drag & drop or click to browse.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      ["cover", "Cover Image"],
                      ["logo", "Company Logo"],
                      ["hdbCert", "HDB Certificate"],
                      ["bcaCert", "BCA Certificate"],
                      ["video", "Video Thumbnail"],
                      ["google", "Google Icon"],
                      ["map", "Map Background"],
                    ].map(([key, label]) => (
                      <Field key={key} label={label}>
                        <ImageUpload
                          value={form.images[key] || ""}
                          onChange={(url) => updateForm("images", { ...form.images, [key]: url })}
                          label={label}
                        />
                      </Field>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* ── TEAM TAB ── */}
              {activeTab === "team" && (
                <SectionCard title="Team Members" icon={<Users className="size-5" />}>
                  <div className="space-y-4 pt-4">
                    {form.team.map((member, i) => (
                      <ItemCard key={i} label={member.type === "person" ? `Team Member #${i + 1}` : `Project Area #${i + 1}`} onRemove={() => updateForm("team", form.team.filter((_, j) => j !== i))}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Name">
                            <Input value={member.name} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], name: v }; updateForm("team", t); }} placeholder="Name" />
                          </Field>
                          <Field label="Type">
                            <select
                              value={member.type}
                              onChange={(e) => { const t = [...form.team]; t[i] = { ...t[i], type: e.target.value as "person" | "project" }; updateForm("team", t); }}
                              className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-[14px] text-[#101828] outline-none focus:border-[#2b7fff] transition-all"
                            >
                              <option value="person">Team Person</option>
                              <option value="project">Project Area</option>
                            </select>
                          </Field>
                          <Field label="Photo">
                            <ImageUpload value={member.image} onChange={(url) => { const t = [...form.team]; t[i] = { ...t[i], image: url }; updateForm("team", t); }} label="Member photo" />
                          </Field>
                          {member.type === "person" && (
                            <>
                              <Field label="Role">
                                <Input value={member.role || ""} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], role: v }; updateForm("team", t); }} placeholder="Lead Designer" />
                              </Field>
                              <Field label="Specialty">
                                <Input value={member.specialty || ""} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], specialty: v }; updateForm("team", t); }} placeholder="Modern Minimalist" />
                              </Field>
                              <Field label="Projects Count">
                                <Input type="number" value={member.projects || 0} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], projects: parseInt(v) || 0 }; updateForm("team", t); }} placeholder="48" />
                              </Field>
                              <Field label="Experience">
                                <Input value={member.experience || ""} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], experience: v }; updateForm("team", t); }} placeholder="6 years" />
                              </Field>
                              <div className="md:col-span-2">
                                <Field label="Bio">
                                  <TextArea value={member.bio || ""} onChange={(v) => { const t = [...form.team]; t[i] = { ...t[i], bio: v }; updateForm("team", t); }} rows={2} placeholder="Short bio..." />
                                </Field>
                              </div>
                              <div className="md:col-span-2">
                                <span className="text-[12px] font-semibold text-[#9ca3af]">DESIGNS</span>
                                <div className="space-y-2 mt-1">
                                  {(member.designs || []).map((d, di) => (
                                    <div key={di} className="flex gap-2 items-start">
                                      <div className="flex-[2]">
                                        <ImageUpload value={d.img} onChange={(url) => { const t = [...form.team]; const des = [...(t[i].designs || [])]; des[di] = { ...des[di], img: url }; t[i] = { ...t[i], designs: des }; updateForm("team", t); }} label="Design image" />
                                      </div>
                                      <div className="flex-1 pt-8">
                                        <Input value={d.label} onChange={(v) => { const t = [...form.team]; const des = [...(t[i].designs || [])]; des[di] = { ...des[di], label: v }; t[i] = { ...t[i], designs: des }; updateForm("team", t); }} placeholder="Label" />
                                      </div>
                                      <div className="pt-8">
                                        <RemoveButton onClick={() => { const t = [...form.team]; t[i] = { ...t[i], designs: (t[i].designs || []).filter((_, j) => j !== di) }; updateForm("team", t); }} />
                                      </div>
                                    </div>
                                  ))}
                                  <AddButton label="Add Design" onClick={() => { const t = [...form.team]; t[i] = { ...t[i], designs: [...(t[i].designs || []), { img: "", label: "" }] }; updateForm("team", t); }} />
                                </div>
                              </div>
                            </>
                          )}
                          {member.type === "project" && (
                            <div className="md:col-span-2">
                              <span className="text-[12px] font-semibold text-[#9ca3af]">REELS</span>
                              <div className="space-y-2 mt-1">
                                {(member.reels || []).map((r, ri) => (
                                  <div key={ri} className="border border-[#e5e7eb] rounded-lg p-3 bg-white space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-[#9ca3af]">REEL #{ri + 1}</span>
                                      <RemoveButton onClick={() => { const t = [...form.team]; t[i] = { ...t[i], reels: (t[i].reels || []).filter((_, j) => j !== ri) }; updateForm("team", t); }} />
                                    </div>
                                    <ImageUpload value={r.img} onChange={(url) => { const t = [...form.team]; const reels = [...(t[i].reels || [])]; reels[ri] = { ...reels[ri], img: url }; t[i] = { ...t[i], reels }; updateForm("team", t); }} label="Reel image" />
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input value={r.caption} onChange={(v) => { const t = [...form.team]; const reels = [...(t[i].reels || [])]; reels[ri] = { ...reels[ri], caption: v }; t[i] = { ...t[i], reels }; updateForm("team", t); }} placeholder="Caption" />
                                      <Input value={r.location} onChange={(v) => { const t = [...form.team]; const reels = [...(t[i].reels || [])]; reels[ri] = { ...reels[ri], location: v }; t[i] = { ...t[i], reels }; updateForm("team", t); }} placeholder="Location" />
                                    </div>
                                    <Input type="number" value={r.likes} onChange={(v) => { const t = [...form.team]; const reels = [...(t[i].reels || [])]; reels[ri] = { ...reels[ri], likes: parseInt(v) || 0 }; t[i] = { ...t[i], reels }; updateForm("team", t); }} placeholder="Likes" />
                                  </div>
                                ))}
                                <AddButton label="Add Reel" onClick={() => { const t = [...form.team]; t[i] = { ...t[i], reels: [...(t[i].reels || []), { img: "", caption: "", location: "", likes: 0, comments: 0 }] }; updateForm("team", t); }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </ItemCard>
                    ))}
                    <div className="flex gap-3">
                      <AddButton label="Add Team Person" onClick={() => updateForm("team", [...form.team, emptyTeamPerson()])} />
                      <AddButton label="Add Project Area" onClick={() => updateForm("team", [...form.team, emptyTeamProject()])} />
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* ── PROJECTS TAB ── */}
              {activeTab === "projects" && (
                <SectionCard title="Featured Projects" icon={<FolderOpen className="size-5" />}>
                  <div className="space-y-4 pt-4">
                    {form.projects.map((proj, i) => (
                      <ItemCard key={i} label={`Project #${i + 1}`} onRemove={() => updateForm("projects", form.projects.filter((_, j) => j !== i))}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Project Name">
                            <Input value={proj.name} onChange={(v) => { const p = [...form.projects]; p[i] = { ...p[i], name: v }; updateForm("projects", p); }} placeholder="Tiong Bahru Condo" />
                          </Field>
                          <Field label="Meta Info">
                            <Input value={proj.meta} onChange={(v) => { const p = [...form.projects]; p[i] = { ...p[i], meta: v }; updateForm("projects", p); }} placeholder="HDB . $87,460 . 2024" />
                          </Field>
                          <div className="md:col-span-2">
                            <Field label="Project Photo">
                              <ImageUpload value={proj.image} onChange={(url) => { const p = [...form.projects]; p[i] = { ...p[i], image: url }; updateForm("projects", p); }} label="Project photo" />
                            </Field>
                          </div>
                        </div>
                      </ItemCard>
                    ))}
                    <AddButton label="Add Project" onClick={() => updateForm("projects", [...form.projects, emptyProject()])} />
                  </div>
                </SectionCard>
              )}

              {/* ── CASE STUDIES TAB ── */}
              {activeTab === "casestudies" && (
                <SectionCard title="Case Study Phases" icon={<BookOpen className="size-5" />}>
                  <div className="space-y-4 pt-4">
                    {form.caseStudies.map((cs, i) => (
                      <ItemCard key={i} label={cs.phase || `Phase #${i + 1}`} onRemove={() => updateForm("caseStudies", form.caseStudies.filter((_, j) => j !== i))}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Phase Label">
                            <Input value={cs.phase} onChange={(v) => { const c = [...form.caseStudies]; c[i] = { ...c[i], phase: v }; updateForm("caseStudies", c); }} placeholder="PHASE I" />
                          </Field>
                          <Field label="Title">
                            <Input value={cs.title} onChange={(v) => { const c = [...form.caseStudies]; c[i] = { ...c[i], title: v }; updateForm("caseStudies", c); }} placeholder="Concept & Spatial Planning" />
                          </Field>
                          <div className="md:col-span-2">
                            <Field label="Description">
                              <TextArea value={cs.desc} onChange={(v) => { const c = [...form.caseStudies]; c[i] = { ...c[i], desc: v }; updateForm("caseStudies", c); }} rows={3} placeholder="Phase description..." />
                            </Field>
                          </div>
                          <div className="md:col-span-2">
                            <Field label="Phase Photo">
                              <ImageUpload value={cs.image} onChange={(url) => { const c = [...form.caseStudies]; c[i] = { ...c[i], image: url }; updateForm("caseStudies", c); }} label="Case study photo" />
                            </Field>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-[12px] font-semibold text-[#9ca3af]">TAGS</span>
                            <div className="space-y-2 mt-1">
                              {cs.tags.map((tag, ti) => (
                                <div key={ti} className="flex gap-2 items-center">
                                  <Input value={tag.label} onChange={(v) => { const c = [...form.caseStudies]; const tags = [...c[i].tags]; tags[ti] = { ...tags[ti], label: v }; c[i] = { ...c[i], tags }; updateForm("caseStudies", c); }} placeholder="Tag label" className="flex-1" />
                                  <Input value={tag.icon} onChange={(v) => { const c = [...form.caseStudies]; const tags = [...c[i].tags]; tags[ti] = { ...tags[ti], icon: v }; c[i] = { ...c[i], tags }; updateForm("caseStudies", c); }} placeholder="Icon" className="w-24" />
                                  <Input value={tag.iconColor} onChange={(v) => { const c = [...form.caseStudies]; const tags = [...c[i].tags]; tags[ti] = { ...tags[ti], iconColor: v }; c[i] = { ...c[i], tags }; updateForm("caseStudies", c); }} placeholder="#color" className="w-28" />
                                  <Input value={tag.bg} onChange={(v) => { const c = [...form.caseStudies]; const tags = [...c[i].tags]; tags[ti] = { ...tags[ti], bg: v }; c[i] = { ...c[i], tags }; updateForm("caseStudies", c); }} placeholder="bg class" className="w-32" />
                                  <Input value={tag.text} onChange={(v) => { const c = [...form.caseStudies]; const tags = [...c[i].tags]; tags[ti] = { ...tags[ti], text: v }; c[i] = { ...c[i], tags }; updateForm("caseStudies", c); }} placeholder="text class" className="w-32" />
                                  <RemoveButton onClick={() => { const c = [...form.caseStudies]; c[i] = { ...c[i], tags: c[i].tags.filter((_, j) => j !== ti) }; updateForm("caseStudies", c); }} />
                                </div>
                              ))}
                              <AddButton label="Add Tag" onClick={() => { const c = [...form.caseStudies]; c[i] = { ...c[i], tags: [...c[i].tags, { label: "", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "grid" }] }; updateForm("caseStudies", c); }} />
                            </div>
                          </div>
                        </div>
                      </ItemCard>
                    ))}
                    <AddButton label="Add Case Study Phase" onClick={() => updateForm("caseStudies", [...form.caseStudies, emptyCaseStudy()])} />
                  </div>
                </SectionCard>
              )}

              {/* ── REVIEWS TAB ── */}
              {activeTab === "reviews" && (
                <>
                  <SectionCard title="Google Review Cards (with images)" icon={<Star className="size-5" />}>
                    <div className="space-y-4 pt-4">
                      {form.reviews.map((review, i) => (
                        <ItemCard key={i} label={`Review #${i + 1}`} onRemove={() => updateForm("reviews", form.reviews.filter((_, j) => j !== i))}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Title">
                              <Input value={review.title} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], title: v }; updateForm("reviews", r); }} placeholder="Review title" />
                            </Field>
                            <Field label="Reviewer Name">
                              <Input value={review.name} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], name: v, initial: v.charAt(0).toUpperCase() }; updateForm("reviews", r); }} placeholder="Emily Chen" />
                            </Field>
                            <Field label="Short Text (preview)">
                              <TextArea value={review.text} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], text: v }; updateForm("reviews", r); }} rows={2} placeholder="Short preview text..." />
                            </Field>
                            <Field label="Full Text">
                              <TextArea value={review.fullText} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], fullText: v }; updateForm("reviews", r); }} rows={2} placeholder="Full review text..." />
                            </Field>
                            <Field label="Date">
                              <Input value={review.date} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], date: v }; updateForm("reviews", r); }} placeholder="March 2024" />
                            </Field>
                            <Field label="Review Photo">
                              <ImageUpload value={review.image} onChange={(url) => { const r = [...form.reviews]; r[i] = { ...r[i], image: url }; updateForm("reviews", r); }} label="Review photo" />
                            </Field>
                            <Field label="Avatar BG Color">
                              <Input value={review.bgColor} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], bgColor: v }; updateForm("reviews", r); }} placeholder="bg-[#f55]" />
                            </Field>
                            <Field label="Avatar Text Color">
                              <Input value={review.textColor} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], textColor: v }; updateForm("reviews", r); }} placeholder="text-white" />
                            </Field>
                            <div>
                              <Toggle checked={review.hasVideo} onChange={(v) => { const r = [...form.reviews]; r[i] = { ...r[i], hasVideo: v }; updateForm("reviews", r); }} label="Has Video" />
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                      <AddButton label="Add Review Card" onClick={() => updateForm("reviews", [...form.reviews, emptyReview()])} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Latest Reviews (sidebar)" icon={<MessageSquare className="size-5" />} defaultOpen={false}>
                    <div className="space-y-4 pt-4">
                      {form.latestReviews.map((review, i) => (
                        <ItemCard key={i} label={`Latest Review #${i + 1}`} onRemove={() => updateForm("latestReviews", form.latestReviews.filter((_, j) => j !== i))}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Reviewer Name">
                              <Input value={review.name} onChange={(v) => { const r = [...form.latestReviews]; r[i] = { ...r[i], name: v, initial: v.charAt(0).toUpperCase() }; updateForm("latestReviews", r); }} placeholder="Alex Goh" />
                            </Field>
                            <Field label="Time Ago">
                              <Input value={review.time} onChange={(v) => { const r = [...form.latestReviews]; r[i] = { ...r[i], time: v }; updateForm("latestReviews", r); }} placeholder="2 months ago" />
                            </Field>
                            <div className="md:col-span-2">
                              <Field label="Review Text">
                                <TextArea value={review.text} onChange={(v) => { const r = [...form.latestReviews]; r[i] = { ...r[i], text: v }; updateForm("latestReviews", r); }} rows={2} placeholder="Review text..." />
                              </Field>
                            </div>
                          </div>
                        </ItemCard>
                      ))}
                      <AddButton label="Add Latest Review" onClick={() => updateForm("latestReviews", [...form.latestReviews, emptyLatestReview()])} />
                    </div>
                  </SectionCard>
                </>
              )}

              {/* ── CREDENTIALS TAB ── */}
              {activeTab === "credentials" && (
                <SectionCard title="Business Information" icon={<Briefcase className="size-5" />}>
                  <div className="space-y-3 pt-4">
                    {form.businessInfo.map((info, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input value={info.label} onChange={(v) => { const b = [...form.businessInfo]; b[i] = { ...b[i], label: v }; updateForm("businessInfo", b); }} placeholder="Label (e.g. ACRA / UEN)" className="flex-1" />
                        <Input value={info.value} onChange={(v) => { const b = [...form.businessInfo]; b[i] = { ...b[i], value: v }; updateForm("businessInfo", b); }} placeholder="Value (e.g. 201203456R)" className="flex-1" />
                        <RemoveButton onClick={() => updateForm("businessInfo", form.businessInfo.filter((_, j) => j !== i))} />
                      </div>
                    ))}
                    <AddButton label="Add Business Info Row" onClick={() => updateForm("businessInfo", [...form.businessInfo, emptyBizInfo()])} />
                  </div>
                </SectionCard>
              )}

              {/* ── SERVICE AREA TAB ── */}
              {activeTab === "service" && (
                <SectionCard title="Service Area" icon={<MapPin className="size-5" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="md:col-span-2">
                      <Field label="HQ Address">
                        <Input value={form.serviceArea.hqAddress} onChange={(v) => updateForm("serviceArea", { ...form.serviceArea, hqAddress: v })} placeholder="33 Ubi Ave 3, Singapore 408868" />
                      </Field>
                    </div>
                    <Field label="HQ Latitude">
                      <Input type="number" value={form.serviceArea.hqLat} onChange={(v) => updateForm("serviceArea", { ...form.serviceArea, hqLat: parseFloat(v) || 0 })} placeholder="1.3271" />
                    </Field>
                    <Field label="HQ Longitude">
                      <Input type="number" value={form.serviceArea.hqLng} onChange={(v) => updateForm("serviceArea", { ...form.serviceArea, hqLng: parseFloat(v) || 0 })} placeholder="103.8918" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <TextArea value={form.serviceArea.description} onChange={(v) => updateForm("serviceArea", { ...form.serviceArea, description: v })} placeholder="Based in Ubi, we cover all HDB estates..." rows={2} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Google Maps Embed URL" hint="The full embed URL for the iframe">
                        <TextArea value={form.serviceArea.mapEmbedUrl} onChange={(v) => updateForm("serviceArea", { ...form.serviceArea, mapEmbedUrl: v })} placeholder="https://www.google.com/maps/embed?..." rows={2} />
                      </Field>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Floating Save Bar */}
            <div className="sticky bottom-0 bg-white border-t border-[#e5e7eb] -mx-6 px-6 py-4 mt-8 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <div className="text-[13px] text-[#9ca3af]">
                {editingSlug ? (
                  <span>Editing <strong className="text-[#364153]">{editingSlug}</strong></span>
                ) : (
                  <span>Creating new designer profile</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {editingSlug && (
                  <button
                    onClick={() => navigate(`/designer/${editingSlug}`)}
                    className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#6a7282] border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-all cursor-pointer"
                  >
                    <Eye className="size-4" />
                    Preview
                  </button>
                )}
                <button
                  onClick={saveDesigner}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#2b7fff] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#1a5fd6] transition-colors cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>{/* close sidebar + content flex wrapper */}

      {/* Designer Activate/Deactivate Confirmation Modal */}
      {designerDeleteConfirm && typeof document !== "undefined" && document.body && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !deletingDesigner && setDesignerDeleteConfirm(null)}>
          <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-[40px] rounded-[14px] flex items-center justify-center bg-red-50">
                <Trash2 className="size-[20px] text-red-600" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px]">Delete designer?</h3>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{designerDeleteConfirm.slug}</p>
              </div>
            </div>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] mb-5">
              <strong>{designerDeleteConfirm.name}</strong> will be archived and hidden from the public site. You can restore it from the <em>Deleted Designers</em> tab at any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDesignerDeleteConfirm(null)} disabled={!!deletingDesigner} className="flex-1 h-[40px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={() => deleteDesigner(designerDeleteConfirm.slug)}
                disabled={!!deletingDesigner}
                className="flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[14px] text-white font-['Inter',sans-serif] text-[13px] font-semibold bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingDesigner === designerDeleteConfirm.slug ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {designerToggleConfirm && typeof document !== "undefined" && document.body && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !toggling && setDesignerToggleConfirm(null)}>
          <div className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`size-[40px] rounded-[14px] flex items-center justify-center ${designerToggleConfirm.currentlyActive ? "bg-[#fffbeb]" : "bg-[#f0fdf4]"}`}>
                <Power className={`size-[20px] ${designerToggleConfirm.currentlyActive ? "text-[#f59e0b]" : "text-[#22c55e]"}`} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px]">
                  {designerToggleConfirm.currentlyActive ? "Deactivate Designer?" : "Activate Designer?"}
                </h3>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{designerToggleConfirm.slug}</p>
              </div>
            </div>
            <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] mb-5">
              {designerToggleConfirm.currentlyActive
                ? "This will hide the designer profile from the public directory. The profile data will be preserved and can be reactivated at any time."
                : "This will make the designer profile visible again in the public directory. All existing profile data will be restored."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDesignerToggleConfirm(null)} className="flex-1 h-[40px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => toggleDesignerActive(designerToggleConfirm.slug, designerToggleConfirm.currentlyActive)}
                className={`flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[14px] text-white font-['Inter',sans-serif] text-[13px] font-semibold transition-colors cursor-pointer ${designerToggleConfirm.currentlyActive ? "bg-[#f59e0b] hover:bg-[#d97706]" : "bg-[#22c55e] hover:bg-[#16a34a]"}`}
              >
                {designerToggleConfirm.currentlyActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Keyframe for toast */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────── DELETED DESIGNERS PANEL ─────────────────── */

function DeletedDesignersPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [purgeConfirm, setPurgeConfirm] = useState<{ slug: string; name: string } | null>(null);

  // Fetch helper that gracefully handles non-JSON responses (e.g. when the
  // Supabase function hasn't been deployed yet and the platform returns
  // plain-text 404 / auth errors instead of our normal `{error}` JSON).
  const callApi = async (path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: any; text?: string }> => {
    const headers = await getAdminAuthHeaders();
    const res = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json, text };
  };
  const explain = (r: { status: number; json: any; text?: string }, fallback: string) => {
    if (r.json?.error) return r.json.error;
    if (r.status === 404) return "Endpoint not found — the deployed Supabase function is older than this client. Redeploy `make-server-4808de5e` to pick up the new admin/deleted-designers routes.";
    if (r.status === 401 || r.status === 403) return "Not authorised. Sign out and back in, or confirm your email is on the admin allowlist.";
    return r.text?.slice(0, 200) || fallback;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await callApi("/admin/deleted-designers");
      if (r.ok && r.json) setItems(r.json.data || []);
      else setError(explain(r, `Failed (${r.status})`));
    } catch (e: any) {
      setError(e?.message || "Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const restore = async (slug: string) => {
    setBusy(slug);
    try {
      const r = await callApi(`/admin/deleted-designers/${encodeURIComponent(slug)}/restore`, { method: "POST" });
      if (r.ok && r.json?.success) setItems((prev) => prev.filter((d) => d.slug !== slug));
      else setError(explain(r, `Restore failed (${r.status})`));
    } catch (e: any) {
      setError(e?.message || "Network error");
    }
    setBusy(null);
  };

  const purge = async (slug: string) => {
    setBusy(slug);
    try {
      const r = await callApi(`/admin/deleted-designers/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (r.ok && r.json?.success) setItems((prev) => prev.filter((d) => d.slug !== slug));
      else setError(explain(r, `Purge failed (${r.status})`));
    } catch (e: any) {
      setError(e?.message || "Network error");
    }
    setBusy(null);
    setPurgeConfirm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-[22px] text-[#101828] tracking-tight">Deleted Interior Designers</h2>
          <p className="text-[14px] text-[#6a7282] mt-0.5">
            {loading ? "Loading…" : `${items.length} archived profile${items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#e5e7eb] text-[#364153] px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-[#f9fafb] transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700">{error}</div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-12 text-center">
          <Trash2 className="size-12 text-[#d1d5db] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[15px] font-medium text-[#374151]">No deleted designers</p>
          <p className="text-[13px] text-[#6a7282] mt-1">Soft-deleted profiles will appear here for restore or permanent removal.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#374151]">Name</th>
                <th className="px-4 py-3 font-semibold text-[#374151]">Slug</th>
                <th className="px-4 py-3 font-semibold text-[#374151]">Deleted at</th>
                <th className="px-4 py-3 font-semibold text-[#374151]">Deleted by</th>
                <th className="px-4 py-3 font-semibold text-[#374151] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.slug} className="border-b border-[#f3f4f6] last:border-b-0">
                  <td className="px-4 py-3 text-[#101828] font-medium">{d.name || d.slug}</td>
                  <td className="px-4 py-3 text-[#6a7282]">/{d.slug}</td>
                  <td className="px-4 py-3 text-[#6a7282]">{d.deletedAt ? new Date(d.deletedAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-[#6a7282]">{d.deletedBy || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => restore(d.slug)}
                        disabled={busy === d.slug}
                        className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#364153] rounded-lg text-[12px] font-medium hover:bg-[#f0fdf4] hover:border-[#bbf7d0] hover:text-[#15803d] cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {busy === d.slug ? "…" : "Restore"}
                      </button>
                      <button
                        onClick={() => setPurgeConfirm({ slug: d.slug, name: d.name || d.slug })}
                        disabled={busy === d.slug}
                        className="px-3 py-1.5 bg-white border border-[#e5e7eb] text-[#364153] rounded-lg text-[12px] font-medium hover:bg-[#fef2f2] hover:border-[#fecaca] hover:text-red-600 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {purgeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setPurgeConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-[#101828]">Permanently delete this profile?</h3>
                <p className="text-[13px] text-[#6a7282] mt-1">
                  <strong>{purgeConfirm.name}</strong> will be removed from the database, including all sections and projects. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPurgeConfirm(null)}
                className="px-4 py-2 bg-white border border-[#e5e7eb] text-[#364153] rounded-lg text-[13px] font-medium hover:bg-[#f9fafb] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => purge(purgeConfirm.slug)}
                disabled={busy === purgeConfirm.slug}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {busy === purgeConfirm.slug ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, Plus, Search, MoreHorizontal, Clock, FolderOpen, ArrowRight,
  Grid3X3, List, Trash2, Copy, Pencil, ChevronLeft, LogOut, Settings,
  User, Check, Image as ImageIcon, Loader2, AlertCircle, Sparkles, X,
  LayoutTemplate, ChevronDown, Sofa, Home, Download, RefreshCw,
  PenLine, FileDown,
} from "lucide-react";
import { analyzeFloorPlanAI, storeAIDefs, type ParsedHouseRoomDef } from "./floor-plan-analyzer";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase as supabaseClient } from "./supabaseClient";
import imgNetworkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

interface FP3DProject {
  id: string; userId: string; title: string; thumbnailUrl: string | null;
  sourceType: "upload" | "template"; sourceFileId: string | null;
  projectData: any; createdAt: string; updatedAt: string;
}

interface FP3DTemplate {
  id: string; name: string; category: string; unitType: string;
  description: string; thumbnailUrl: string | null; dwgFileUrl: string | null;
  isActive: boolean; createdAt: string; projectData?: any;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Always use publicAnonKey for Authorization to pass the Supabase Edge Function gateway.
  // The user's access token goes in X-User-Token for our server to identify the user.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    // Try refreshing the session first to get a valid token
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.warn("[Auth] getSession error, attempting refresh:", error.message);
      const { data: refreshData } = await supabaseClient.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        headers["X-User-Token"] = refreshData.session.access_token;
      }
    } else if (data?.session?.access_token) {
      headers["X-User-Token"] = data.session.access_token;
    }
  } catch (e) {
    console.error("[Auth] Failed to get auth token:", e);
  }
  return headers;
}

/* ─── Sidebar ─── */
function Sidebar({ collapsed, onToggle, userName, avatarUrl, onLogout, activeTab, onTabChange }: {
  collapsed: boolean; onToggle: () => void; userName: string; avatarUrl?: string | null; onLogout: () => void;
  activeTab: "projects" | "renders"; onTabChange: (tab: "projects" | "renders") => void;
}) {
  const navigate = useNavigate();
  const navItems = [
    { icon: FolderOpen, label: "Projects", id: "projects" as const },
    { icon: Sparkles, label: "Renders", id: "renders" as const },
    { icon: Settings, label: "Settings", id: null },
  ];
  return (
    <motion.aside animate={{ width: collapsed ? 72 : 260 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-white border-r border-[#F3F4F6] flex flex-col shrink-0 sticky top-0">
      <div className="h-[72px] flex items-center px-5 border-b border-[#F3F4F6]">
        {!collapsed && <div className="h-[23px] w-[111px] bg-[#2B2B2B] cursor-pointer shrink-0" onClick={() => navigate("/floorplan3d")} style={{ maskImage: `url('${imgNetworkLogo}')`, WebkitMaskImage: `url('${imgNetworkLogo}')`, maskSize: '111px 23px', WebkitMaskSize: '111px 23px', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: '0 0', WebkitMaskPosition: '0 0' }} />}
        <button onClick={onToggle} className={`size-[36px] rounded-[10px] bg-[#F6F6F6] flex items-center justify-center hover:bg-[#EDEDED] transition-colors ${collapsed ? "mx-auto" : "ml-auto"}`}>
          <ChevronLeft className={`size-[16px] text-[#09090B] transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
      {!collapsed && userName && (
        <div className="px-5 py-3 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-[32px] rounded-full object-cover shrink-0" />
            ) : (
              <div className="size-[32px] rounded-full bg-[#09090B] flex items-center justify-center shrink-0">
                <span className="font-['Inter',sans-serif] font-bold text-[13px] text-white">{userName[0]?.toUpperCase()}</span>
              </div>
            )}
            <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#09090B] truncate">{userName}</span>
          </div>
        </div>
      )}
      <nav className="flex-1 py-4 px-3">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button key={item.label} onClick={() => item.id && onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-[12px] mb-1 transition-colors ${isActive ? "bg-[#09090B] text-white" : "text-[#71717A] hover:bg-[#F6F6F6]"}`}>
              <item.icon className="size-[20px] shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px]">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-[#F3F4F6] p-3">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] text-[#71717A] hover:bg-[#F6F6F6] transition-colors">
          <LogOut className="size-[20px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span className="font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px]">Log Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}

/* ─── Mobile Bottom Nav ─── */
function MobileBottomNav({ activeTab, onTabChange }: {
  activeTab: "projects" | "renders"; onTabChange: (tab: "projects" | "renders") => void;
}) {
  const tabs = [
    { id: "projects" as const, icon: FolderOpen, label: "Projects" },
    { id: "renders" as const, icon: Sparkles, label: "Renders" },
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-[16.75px] border-t border-[#F3F4F6]">
      <div className="flex items-center justify-around h-[64px] px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${active ? "text-[#09090B]" : "text-[#ABABAB]"}`}>
              <tab.icon className="size-[20px]" strokeWidth={active ? 2 : 1.5} />
              <span className={`font-['Inter',sans-serif] text-[11px] tracking-[-0.2px] ${active ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mobile Profile Dropdown ─── */
function MobileProfileDropdown({ userName, avatarUrl, onLogout }: { userName: string; avatarUrl?: string | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer active:scale-95 transition-transform"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-[32px] rounded-full object-cover shrink-0 border border-[#E5E7EB]" />
        ) : (
          <div className="size-[32px] rounded-full bg-[#09090B] flex items-center justify-center shrink-0">
            <span className="font-['Inter',sans-serif] font-bold text-[12px] text-white">{userName[0]?.toUpperCase()}</span>
          </div>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] right-0 z-[100] w-[200px] bg-white rounded-[14px] border border-[#F3F4F6] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] overflow-hidden"
          >

            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              <LogOut className="size-[16px] text-[#ef4444]" strokeWidth={1.5} />
              <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#ef4444]">Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Upload Zone ─── */
interface AIResult { defs: ParsedHouseRoomDef[]; planName: string; confidence: number; roomCount: number; }

function UploadZone({ onConfirm }: { onConfirm: (result: AIResult) => void }) {
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
    if (!validTypes.includes(file.type)) { setErrorMsg(`Unsupported file type. Please upload PNG, JPG, or BMP.`); setStage("error"); return; }
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

  const handleConfirm = useCallback(() => { if (aiResult) { storeAIDefs(aiResult.defs); onConfirm(aiResult); } }, [aiResult, onConfirm]);
  const handleReset = useCallback(() => { setStage("idle"); setPreviewUrl(null); setAiResult(null); setErrorMsg(""); setProgressPct(0); setFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }, []);

  if (stage === "idle") {
    return (
      <motion.div onDragOver={(e) => { handleDrag(e); setIsDragOver(true); }} onDragLeave={(e) => { handleDrag(e); setIsDragOver(false); }}
        onDrop={(e) => { handleDrag(e); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
        animate={{ borderColor: isDragOver ? "#09090B" : "#E5E7EB", backgroundColor: isDragOver ? "#F6F6F6" : "#FAFAFA" }}
        className="border-2 border-dashed rounded-[17px] p-10 md:p-14 flex flex-col items-center text-center cursor-pointer transition-colors"
        onClick={() => fileInputRef.current?.click()}>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="hidden" />
        <motion.div animate={{ scale: isDragOver ? 1.1 : 1 }} className="size-[64px] rounded-[14px] bg-[#F6F6F6] border border-[#E5E7EB] flex items-center justify-center mb-5">
          <Upload className="size-[28px] text-[#09090B]" strokeWidth={1.5} />
        </motion.div>
        <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090B] tracking-[-0.5px] mb-2">Upload your floor plan</h3>
        <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] mb-4 max-w-[400px]">Drag and drop your floor plan image, or click to browse. Max 5 MB.</p>
        <div className="flex items-center gap-2 mb-6">
          {["PNG", "JPG", "BMP", "WebP"].map((fmt) => (
            <span key={fmt} className="px-3 py-1.5 rounded-[100px] bg-white border border-[#E5E7EB] font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B]">.{fmt}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#09090B] text-white rounded-[14px] h-[42px] px-6 font-['Inter',sans-serif] font-semibold text-[14px] tracking-[-0.35px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
            Upload & Analyze
          </button>
        </div>
      </motion.div>
    );
  }

  if (stage === "preview") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#F6F6F6] p-6 flex items-center justify-center min-h-[280px]">
            {previewUrl && <img src={previewUrl} alt="Floor plan preview" className="max-w-full max-h-[320px] rounded-[12px] object-contain shadow-sm" />}
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-[40px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center"><ImageIcon className="size-[20px] text-[#09090B]" strokeWidth={1.5} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#09090B] tracking-[-0.3px] truncate">{fileName}</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">Ready to analyze</p>
              </div>
              <button onClick={handleReset} className="size-[34px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors"><X className="size-[18px] text-[#71717A]" /></button>
            </div>
            <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="size-[16px] text-[#09090B] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="font-['Inter',sans-serif] text-[12px] text-[#71717A] leading-relaxed">
                  <p className="font-medium text-[#09090B] mb-1">AI Analysis Pipeline</p>
                  <ul className="list-disc pl-4 space-y-0.5"><li>Room detection & segmentation</li><li>Wall, door, window identification</li><li>3D model generation with materials</li></ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 h-[44px] rounded-[100px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] hover:bg-[#F6F6F6] transition-colors">Choose Different</button>
              <div className="flex-1 bg-[#F6F6F6] border border-white rounded-[100px] p-[4px]">
                <button onClick={startAnalysis} className="w-full flex items-center justify-center gap-2 h-[36px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.7px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
                  Analyze Floor Plan <ArrowRight className="size-[15px]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "processing") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] p-8 md:p-12">
        <div className="flex flex-col items-center text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="mb-6"><Loader2 className="size-[40px] text-[#09090B]" strokeWidth={1.5} /></motion.div>
          <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090B] tracking-[-0.5px] mb-2">Analyzing floor plan...</h3>
          <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] mb-6">{progressMsg}</p>
          <div className="w-full max-w-[400px] h-[6px] bg-[#F6F6F6] rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3, ease: "easeOut" }} className="h-full bg-[#09090B] rounded-full" />
          </div>
          <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] mt-3">{progressPct}% complete</p>
        </div>
      </motion.div>
    );
  }

  if (stage === "done" && aiResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#F6F6F6] p-6 flex items-center justify-center min-h-[280px]">
            {previewUrl && <img src={previewUrl} alt="Analyzed floor plan" className="max-w-full max-h-[320px] rounded-[12px] object-contain shadow-sm" />}
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-[36px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check className="size-[18px] text-white" strokeWidth={2.5} /></div>
              <div>
                <p className="font-['Inter',sans-serif] text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">Floor plan analyzed</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{aiResult.roomCount} rooms detected</p>
              </div>
            </div>
            <div className="max-h-[140px] overflow-auto rounded-[14px] border border-[#F3F4F6] mb-5">
              {aiResult.defs.map((room, i) => (
                <div key={room.id} className={`flex items-center gap-3 px-4 py-2.5 ${i < aiResult.defs.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                  <div className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: room.accent }} />
                  <span className="font-['Inter',sans-serif] text-[13px] font-medium text-[#09090B] flex-1 tracking-[-0.2px]">{room.label}</span>
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">{((room.bounds[1] - room.bounds[0]) * (room.bounds[3] - room.bounds[2])).toFixed(1)} m&sup2;</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-auto">
              <button onClick={handleReset} className="flex-1 h-[44px] rounded-[100px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] hover:bg-[#F6F6F6] transition-colors">Upload Different</button>
              <div className="flex-1 bg-[#F6F6F6] border border-white rounded-[100px] p-[4px]">
                <button onClick={handleConfirm} className="w-full flex items-center justify-center gap-2 h-[36px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.7px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
                  Open in 3D Editor <ArrowRight className="size-[15px]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] p-8">
      <div className="flex flex-col items-center text-center">
        <div className="size-[56px] rounded-full bg-red-50 flex items-center justify-center mb-4"><AlertCircle className="size-[28px] text-red-500" strokeWidth={1.5} /></div>
        <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090B] tracking-[-0.5px] mb-2">Analysis Failed</h3>
        <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] mb-6 max-w-[400px]">{errorMsg}</p>
        <button onClick={handleReset} className="bg-[#09090B] text-white rounded-[14px] h-[42px] px-6 font-['Inter',sans-serif] font-semibold text-[14px] tracking-[-0.35px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">Try Again</button>
      </div>
    </motion.div>
  );
}

/* ─── 2D Floor Plan Thumbnail ─── */
const THUMB_ROOM_COLORS: Record<string, string> = {
  kitchen: "#FDF6EC", bath2: "#EDF5F2", bath1: "#EDF5F2", bedroom: "#F0ECF8",
  bedroom2: "#ECF0F8", bedroom3: "#F8F0EC", living: "#FFF9F0", corridor: "#F5F5F5",
  yard: "#F0F7F0", storeroom: "#F2F2F2", bomb: "#F2EDED",
};
export function FloorPlanThumbnail({ roomDefs, size = "large" }: {
  roomDefs: any[]; size?: "large" | "small";
}) {
  if (!roomDefs || roomDefs.length === 0) return null;

  let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
  for (const r of roomDefs) {
    if (!r.bounds || r.bounds.length < 4) continue;
    if (r.bounds[0] < mnX) mnX = r.bounds[0];
    if (r.bounds[1] > mxX) mxX = r.bounds[1];
    if (r.bounds[2] < mnZ) mnZ = r.bounds[2];
    if (r.bounds[3] > mxZ) mxZ = r.bounds[3];
  }
  if (!isFinite(mnX)) return null;

  const pad = size === "small" ? 8 : 14;
  const totalW = mxX - mnX || 1;
  const totalD = mxZ - mnZ || 1;
  const svgW = 400;
  const scale = (svgW - pad * 2) / Math.max(totalW, totalD);
  const svgH = Math.round(totalD * scale + pad * 2);
  const wallT = size === "small" ? 1.5 : 2;
  const fontSize = size === "small" ? 7 : 9;
  const toX = (v: number) => (v - mnX) * scale + pad;
  const toY = (v: number) => (v - mnZ) * scale + pad;
  const uid = `tg-${roomDefs.map(r => r.id).join("-")}`;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <rect width={svgW} height={svgH} fill="#FFFFFF" />
      <defs>
        <pattern id={uid} width={scale * 0.5} height={scale * 0.5} patternUnits="userSpaceOnUse">
          <circle cx={scale * 0.25} cy={scale * 0.25} r="0.5" fill="#E5E7EB" opacity="0.5" />
        </pattern>
      </defs>
      <rect width={svgW} height={svgH} fill={`url(#${uid})`} />
      {roomDefs.map((r: any) => {
        if (!r.bounds || r.bounds.length < 4) return null;
        const x = toX(r.bounds[0]);
        const y = toY(r.bounds[2]);
        const w = (r.bounds[1] - r.bounds[0]) * scale;
        const h = (r.bounds[3] - r.bounds[2]) * scale;
        const fill = r.floorColor || THUMB_ROOM_COLORS[r.id] || "#F6F6F6";
        const hasPoly = r.polygon && Array.isArray(r.polygon) && r.polygon.length >= 3;
        // Compute polygon centroid for label placement
        let labelX = x + w / 2, labelY = y + h / 2;
        if (hasPoly) {
          let pcx = 0, pcy = 0;
          for (const pt of r.polygon) { pcx += toX(pt[0]); pcy += toY(pt[1]); }
          labelX = pcx / r.polygon.length; labelY = pcy / r.polygon.length;
        }
        return (
          <g key={r.id}>
            {hasPoly ? (
              <>
                <polygon points={r.polygon.map((pt: [number, number]) => `${toX(pt[0])},${toY(pt[1])}`).join(" ")} fill={fill} />
                <polygon points={r.polygon.map((pt: [number, number]) => `${toX(pt[0])},${toY(pt[1])}`).join(" ")} fill="none" stroke="#09090B" strokeWidth={wallT} strokeLinejoin="round" />
              </>
            ) : (
              <>
                <rect x={x} y={y} width={w} height={h} fill={fill} rx={2} />
                <rect x={x} y={y} width={w} height={h} fill="none" stroke="#09090B" strokeWidth={wallT} rx={2} />
              </>
            )}
            {w > 20 && h > 14 && (
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="central"
                fill="#09090B" opacity={0.55} fontSize={fontSize} fontFamily="Inter, sans-serif" fontWeight="600"
                letterSpacing="-0.3">
                {r.shortLabel || r.label || r.id}
              </text>
            )}
            {(r.doors || []).map((d: any, i: number) => {
              const side = d.side;
              const dw = (d.width || d.w || 0.8) * scale;
              let dx = 0, dy = 0, dWidth = dw, dHeight = wallT * 2.5;
              if (side === "north") { dx = x + w * (d.t || 0.5) - dw / 2; dy = y - wallT; }
              else if (side === "south") { dx = x + w * (d.t || 0.5) - dw / 2; dy = y + h - wallT; }
              else if (side === "west") { dx = x - wallT; dy = y + h * (d.t || 0.5) - dw / 2; dWidth = wallT * 2.5; dHeight = dw; }
              else if (side === "east") { dx = x + w - wallT; dy = y + h * (d.t || 0.5) - dw / 2; dWidth = wallT * 2.5; dHeight = dw; }
              return <rect key={`d-${i}`} x={dx} y={dy} width={dWidth} height={dHeight} fill="#FFFFFF" stroke="#E8A87C" strokeWidth={0.8} rx={1} />;
            })}
            {(r.windows || []).map((win: any, i: number) => {
              const side = win.side;
              const ww = (win.width || win.w || 1) * scale;
              const thick = wallT * 1.5;
              if (side === "north") { const wx = x + w * (win.t || 0.5) - ww / 2; const wy = y - thick / 2; return <line key={`w-${i}`} x1={wx} y1={wy} x2={wx + ww} y2={wy} stroke="#6BA3BE" strokeWidth={thick} strokeLinecap="round" opacity={0.7} />; }
              if (side === "south") { const wx = x + w * (win.t || 0.5) - ww / 2; const wy = y + h + thick / 2; return <line key={`w-${i}`} x1={wx} y1={wy} x2={wx + ww} y2={wy} stroke="#6BA3BE" strokeWidth={thick} strokeLinecap="round" opacity={0.7} />; }
              if (side === "west") { const wx = x - thick / 2; const wy = y + h * (win.t || 0.5) - ww / 2; return <line key={`w-${i}`} x1={wx} y1={wy} x2={wx} y2={wy + ww} stroke="#6BA3BE" strokeWidth={thick} strokeLinecap="round" opacity={0.7} />; }
              if (side === "east") { const wx = x + w + thick / 2; const wy = y + h * (win.t || 0.5) - ww / 2; return <line key={`w-${i}`} x1={wx} y1={wy} x2={wx} y2={wy + ww} stroke="#6BA3BE" strokeWidth={thick} strokeLinecap="round" opacity={0.7} />; }
              return null;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Project Card ─── */
function getProjectStats(pd: any) {
  if (!pd || typeof pd !== "object") return null;
  const roomDefs = pd.roomDefinitions;
  const roomCount = Array.isArray(roomDefs) ? roomDefs.length : 0;
  const furniture = pd.furniture;
  let furnitureCount = 0;
  if (furniture && typeof furniture === "object") {
    for (const rid of Object.keys(furniture)) {
      if (Array.isArray(furniture[rid])) furnitureCount += furniture[rid].length;
    }
  }
  const materials = pd.materials as { walls?: string; floors?: string; ceiling?: string } | undefined;
  return { roomCount, furnitureCount, materials: materials || null };
}

function ProjectCard({ project, view, onClick, onRename, onDuplicate, onDelete }: {
  project: FP3DProject; view: "grid" | "list"; onClick: () => void;
  onRename: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timeAgo = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    if (ms < 604800000) return `${Math.floor(ms / 86400000)}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const stats = getProjectStats(project.projectData);
  const roomDefs = project.projectData?.roomDefinitions as any[] | undefined;

  if (view === "list") {
    return (
      <motion.div whileHover={{ backgroundColor: "#FAFAFA" }} className={`flex items-center gap-4 p-4 rounded-[14px] border border-[#F3F4F6] cursor-pointer group relative ${menuOpen ? "z-50" : ""}`} onClick={onClick}>
        <div className="size-[56px] rounded-[10px] overflow-hidden shrink-0 bg-white border border-[#F3F4F6] flex items-center justify-center">
          {roomDefs && roomDefs.length > 0 ? (
            <div className="w-full h-full p-1">
              <FloorPlanThumbnail roomDefs={roomDefs} size="small" />
            </div>
          ) : <Grid3X3 className="size-[20px] text-[#ABABAB]" strokeWidth={1} />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#09090B] tracking-[-0.3px] truncate">{project.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {stats && stats.roomCount > 0 ? (
              <>
                <span className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{stats.roomCount} room{stats.roomCount !== 1 ? "s" : ""}</span>
                {stats.furnitureCount > 0 && (
                  <>
                    <span className="text-[#E5E7EB]">&middot;</span>
                    <span className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{stats.furnitureCount} item{stats.furnitureCount !== 1 ? "s" : ""}</span>
                  </>
                )}
              </>
            ) : (
              <span className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">{project.sourceType === "template" ? "From template" : "Uploaded"}</span>
            )}
          </div>
        </div>
        <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] hidden sm:block">{timeAgo(project.updatedAt)}</span>
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="size-[32px] rounded-[8px] hover:bg-[#F6F6F6] flex items-center justify-center">
            <MoreHorizontal className="size-[16px] text-[#71717A]" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-[40px] bg-white border border-[#F3F4F6] rounded-[12px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] py-2 z-[60] min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                {[{ icon: Pencil, label: "Rename", action: onRename }, { icon: Copy, label: "Duplicate", action: onDuplicate }, { icon: Trash2, label: "Delete", action: onDelete, danger: true }].map((item) => (
                  <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F6F6F6] transition-colors ${"danger" in item && item.danger ? "text-red-500" : "text-[#09090B]"}`}
                    onClick={() => { setMenuOpen(false); item.action(); }}>
                    <item.icon className="size-[14px]" strokeWidth={1.5} />
                    <span className="font-['Inter',sans-serif] text-[13px]">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
      className={`bg-white border border-[#F3F4F6] rounded-[14px] md:rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] cursor-pointer group relative ${menuOpen ? "z-50" : ""}`}
      onClick={onClick}>
      <div className="relative h-[130px] md:h-[180px] overflow-hidden rounded-t-[14px] md:rounded-t-[17px] bg-white flex items-center justify-center">
        {roomDefs && roomDefs.length > 0 ? (
          <div className="w-full h-full p-2 transition-transform duration-500 group-hover:scale-105">
            <FloorPlanThumbnail roomDefs={roomDefs} size="large" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-[#ABABAB]">
            <Grid3X3 className="size-[32px]" strokeWidth={1} />
            <span className="font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px]">Empty project</span>
          </div>
        )}
      </div>
      <div className="p-3 md:p-5">
        <div className="flex items-start justify-between mb-1.5 md:mb-2">
          <h4 className="font-['Inter',sans-serif] font-bold text-[14px] md:text-[18px] text-[#09090B] tracking-[-0.5px] leading-[1.2] line-clamp-1">{project.title}</h4>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="size-[32px] rounded-[8px] hover:bg-[#F6F6F6] flex items-center justify-center shrink-0">
              <MoreHorizontal className="size-[16px] text-[#71717A]" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-[36px] bg-white border border-[#F3F4F6] rounded-[12px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] py-2 z-[60] min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                  {[{ icon: Pencil, label: "Rename", action: onRename }, { icon: Copy, label: "Duplicate", action: onDuplicate }, { icon: Trash2, label: "Delete", action: onDelete, danger: true }].map((item) => (
                    <button key={item.label} className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F6F6F6] transition-colors ${"danger" in item && item.danger ? "text-red-500" : "text-[#09090B]"}`}
                      onClick={() => { setMenuOpen(false); item.action(); }}>
                      <item.icon className="size-[14px]" strokeWidth={1.5} />
                      <span className="font-['Inter',sans-serif] text-[13px]">{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {stats && stats.roomCount > 0 && (
          <div className="flex items-center gap-2 mt-1.5 mb-1.5">
            <span className="px-2.5 py-1 rounded-[100px] bg-[#F6F6F6] border border-[#E5E7EB] font-['Inter',sans-serif] text-[11px] font-medium text-[#71717A] flex items-center gap-1">
              <Home className="size-[11px]" strokeWidth={1.5} />
              {stats.roomCount} room{stats.roomCount !== 1 ? "s" : ""}
            </span>
            {stats.furnitureCount > 0 && (
              <span className="px-2.5 py-1 rounded-[100px] bg-[#F6F6F6] border border-[#E5E7EB] font-['Inter',sans-serif] text-[11px] font-medium text-[#71717A] flex items-center gap-1">
                <Sofa className="size-[11px]" strokeWidth={1.5} />
                {stats.furnitureCount} item{stats.furnitureCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-2">
          <Clock className="size-[12px] text-[#ABABAB]" />
          <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB]">{timeAgo(project.updatedAt)}</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── New Project Modal ─── */
function NewProjectModal({ open, onClose, templates, onUseTemplate }: {
  open: boolean; onClose: () => void; templates: FP3DTemplate[];
  onUseTemplate: (t: FP3DTemplate) => void;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }} className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[960px] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4 shrink-0">
              <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                <div className="size-[36px] md:size-[40px] rounded-[12px] bg-[#F6F6F6] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <LayoutTemplate className="size-[18px] md:size-[20px] text-[#09090B]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-['Inter',sans-serif] font-bold text-[20px] md:text-[24px] text-[#09090B] tracking-[-1.2px]">Choose a Template</h2>
                  <p className="font-['Inter',sans-serif] text-[12px] md:text-[13px] text-[#71717A]">{templates.length} template{templates.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>
              <button onClick={onClose} className="size-[36px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors"><X className="size-[18px] text-[#71717A]" /></button>
            </div>
            <div className="px-6 pb-6 overflow-auto flex-1">
              {templates.length === 0 ? (
                <div className="text-center py-16">
                  <LayoutTemplate className="size-[48px] text-[#E5E7EB] mx-auto mb-4" strokeWidth={1} />
                  <p className="font-['Inter',sans-serif] text-[16px] text-[#71717A]">No templates available yet.</p>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#ABABAB] mt-1">Templates are managed by administrators.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {templates.map((t) => (
                    <motion.div key={t.id} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
                      className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] overflow-hidden cursor-pointer hover:border-[#09090B] hover:shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] transition-all group"
                      onClick={() => onUseTemplate(t)}>
                      <div className="relative h-[120px] bg-[#FFFFFF] flex items-center justify-center overflow-hidden">
                        {t.projectData?.roomDefinitions?.length > 0 ? (
                          <div className="w-full h-full p-2">
                            <FloorPlanThumbnail roomDefs={t.projectData.roomDefinitions} size="small" />
                          </div>
                        ) : t.thumbnailUrl ? <img src={t.thumbnailUrl} alt={t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <LayoutTemplate className="size-[32px] text-[#ABABAB]" strokeWidth={1} />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-[100px] bg-white/90 backdrop-blur-sm font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B] tracking-[-0.3px]">
                            Use Template <ArrowRight className="size-[12px]" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-['Inter',sans-serif] font-semibold text-[13px] text-[#09090B] tracking-[-0.2px] truncate mb-1">{t.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-[100px] bg-white border border-[#E5E7EB] font-['Inter',sans-serif] text-[10px] font-medium text-[#71717A]">{t.unitType}</span>
                          <span className="px-2 py-0.5 rounded-[100px] bg-white border border-[#E5E7EB] font-['Inter',sans-serif] text-[10px] font-medium text-[#71717A] uppercase">{t.category}</span>
                        </div>
                        {t.description && (
                          <p className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] mt-1.5 line-clamp-2 leading-[1.4]">{t.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Dashboard ─── */
export function FloorPlan3DDashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "created">("updated");
  const [projects, setProjects] = useState<FP3DProject[]>([]);
  const [templates, setTemplates] = useState<FP3DTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);
  const [showImportZone, setShowImportZone] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "renders">("projects");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "project" | "render"; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Renders state
  interface RenderItem {
    renderId: string; taskId: string; projectId: string | null;
    projectName: string; aspectRatio: string; status: string;
    resultUrl: string | null; createdAt: string; completedAt: string | null;
  }
  const [renders, setRenders] = useState<RenderItem[]>([]);
  const [rendersLoading, setRendersLoading] = useState(false);
  const [rendersLoaded, setRendersLoaded] = useState(false);

  const loadRenders = useCallback(async () => {
    setRendersLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/fp3d/renders`, { headers });
      if (res.ok) {
        const d = await res.json();
        setRenders(d.renders || []);
      } else {
        console.error("[Dashboard] Failed to load renders:", res.status);
      }
    } catch (e) { console.error("Failed to load renders:", e); }
    setRendersLoading(false);
    setRendersLoaded(true);
  }, []);

  // Load renders when switching to tab
  useEffect(() => {
    if (activeTab === "renders" && !rendersLoaded) loadRenders();
  }, [activeTab, rendersLoaded, loadRenders]);

  const requestDeleteRender = (renderId: string, name: string) => {
    setDeleteConfirm({ type: "render", id: renderId, name });
  };

  const handleDeleteRender = async (renderId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/fp3d/renders/${renderId}`, { method: "DELETE", headers });
      if (res.ok) setRenders((r) => r.filter((x) => x.renderId !== renderId));
    } catch (e) { console.error("Failed to delete render:", e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    if (deleteConfirm.type === "project") await handleDelete(deleteConfirm.id);
    else await handleDeleteRender(deleteConfirm.id);
    setDeleteLoading(false);
    setDeleteConfirm(null);
  };

  const timeAgoFn = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    if (ms < 604800000) return `${Math.floor(ms / 86400000)}d ago`;
    return new Date(d).toLocaleDateString();
  };

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      // Attempt to refresh session first to ensure we have a valid token
      let session = null;
      try {
        const { data: refreshData } = await supabaseClient.auth.refreshSession();
        session = refreshData?.session;
      } catch (e) {
        console.warn("[Dashboard] Session refresh failed, trying getSession:", e);
      }
      if (!session) {
        const { data } = await supabaseClient.auth.getSession();
        session = data?.session;
      }
      if (!session) { navigate("/floorplan3d"); return; }
      setUserName(session.user?.user_metadata?.name || session.user?.email || "User");
      // Load avatar from homeowner profile cache
      try {
        const cached = localStorage.getItem("homeowner-profile-cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.avatar) setUserAvatar(parsed.avatar);
          if (parsed.name && !session.user?.user_metadata?.name) setUserName(parsed.name);
        }
      } catch {}
      // Load projects
      try {
        const headers = await getAuthHeaders();
        console.log("[Dashboard] Fetching projects and templates...");
        const [projRes, tmplRes] = await Promise.all([
          fetch(`${API}/fp3d/projects`, { headers }),
          fetch(`${API}/fp3d/templates`, { headers }),
        ]);
        if (projRes.ok) { const d = await projRes.json(); console.log("[Dashboard] Projects loaded:", d.projects?.length || 0); setProjects(d.projects || []); }
        else { const errText = await projRes.text(); console.error("[Dashboard] Failed to load projects:", projRes.status, errText); }
        if (tmplRes.ok) { const d = await tmplRes.json(); console.log("[Dashboard] Templates loaded:", d.templates?.length || 0, d.templates); setTemplates(d.templates || []); }
        else { const errText = await tmplRes.text(); console.error("[Dashboard] Failed to load templates:", tmplRes.status, errText); }
      } catch (e) { console.error("Failed to load dashboard data:", e); }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    // Also clear homeowner session so all pages (Navbar, /profile) log out too
    const hToken = localStorage.getItem("homeowner-token");
    if (hToken) {
      fetch(`${API}/homeowner-logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}`, "X-Homeowner-Token": hToken },
      }).catch(() => {});
    }
    localStorage.removeItem("homeowner-token");
    localStorage.removeItem("homeowner-userId");
    localStorage.removeItem("homeowner-profile-cache");
    localStorage.removeItem("homeowner-full-cache");
    window.dispatchEvent(new Event("homeowner-auth-changed"));
    navigate("/floorplan3d");
  };

  const handleCreateProject = async (title: string, sourceType: "upload" | "template", sourceFileId?: string, projectData?: any) => {
    try {
      const headers = await getAuthHeaders();
      const body: any = { title, sourceType, sourceFileId };
      if (projectData) body.projectData = projectData;
      const res = await fetch(`${API}/fp3d/projects`, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) { const d = await res.json(); setProjects((p) => [d.project, ...p]); return d.project; }
    } catch (e) { console.error("Failed to create project:", e); }
    return null;
  };

  const handleRename = async (id: string, title: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/fp3d/projects/${id}`, { method: "PUT", headers, body: JSON.stringify({ title }) });
      if (res.ok) setProjects((p) => p.map((proj) => proj.id === id ? { ...proj, title, updatedAt: new Date().toISOString() } : proj));
    } catch (e) { console.error("Failed to rename project:", e); }
    setRenamingId(null);
  };

  const handleDuplicate = async (project: FP3DProject) => {
    await handleCreateProject(`${project.title} (Copy)`, project.sourceType, project.sourceFileId);
  };

  const requestDeleteProject = (id: string, name: string) => {
    setDeleteConfirm({ type: "project", id, name });
  };

  const handleDelete = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/fp3d/projects/${id}`, { method: "DELETE", headers });
      if (res.ok) setProjects((p) => p.filter((proj) => proj.id !== id));
    } catch (e) { console.error("Failed to delete project:", e); }
  };

  const handleUseTemplate = async (template: FP3DTemplate) => {
    setShowNewModal(false);
    setTemplateLoading(true);
    try {
      // Copy template's projectData (room definitions, furniture, materials, lighting) into the new project
      const project = await handleCreateProject(`${template.name} Plan`, "template", template.id, template.projectData || undefined);
      if (project) navigate(`/floorplan3d/editor/${project.id}`);
    } finally {
      setTemplateLoading(false);
    }
  };

  const sortedProjects = [...projects]
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="size-[32px] text-[#09090B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white font-['Inter',sans-serif]">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} userName={userName} avatarUrl={userAvatar} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <main className="flex-1 overflow-auto pb-[80px] md:pb-0">
        {activeTab === "renders" ? (
        /* ═══ RENDERS TAB ═══ */
        <>
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-[#F3F4F6] z-20 px-4 md:px-10 h-[64px] md:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-['Inter',sans-serif] font-semibold text-[18px] md:text-[24px] text-[#09090B] tracking-[-1px]">AI Renders</h1>
          </div>
          <button onClick={() => { setRendersLoaded(false); loadRenders(); }}
            className="h-[36px] md:h-[42px] px-3 md:px-5 rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] font-semibold text-[13px] md:text-[14px] tracking-[-0.35px] flex items-center gap-2 hover:bg-[#F6F6F6] transition-colors">
            <RefreshCw className={`size-[14px] md:size-[16px] ${rendersLoading ? "animate-spin" : ""}`} strokeWidth={1.5} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        <div className="px-4 md:px-10 py-6 md:py-8 max-w-[1270px]">
          {rendersLoading && renders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-[32px] text-[#09090B] animate-spin mb-4" />
              <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">Loading renders...</p>
            </div>
          ) : renders.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="size-[48px] text-[#E5E7EB] mx-auto mb-4" strokeWidth={1} />
              <p className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#09090B] tracking-[-0.3px] mb-1">No renders yet</p>
              <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] max-w-[400px] mx-auto">
                Open a project in the 3D editor, enter Render Mode, and click &ldquo;AI Render&rdquo; to generate photorealistic renders. They process server-side even if you leave.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {renders.map((r) => (
                <motion.div key={r.renderId} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
                  className="bg-white border border-[#F3F4F6] rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)] overflow-hidden group">
                  <div className="relative h-[200px] bg-[#F6F6F6] flex items-center justify-center overflow-hidden">
                    {r.status === "completed" && r.resultUrl ? (
                      <img src={r.resultUrl} alt={r.projectName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : r.status === "processing" ? (
                      <div className="flex flex-col items-center gap-3">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                          <Loader2 className="size-[32px] text-[#09090B]" strokeWidth={1.5} />
                        </motion.div>
                        <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] font-medium">Processing...</p>
                        <p className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">AI is rendering your scene</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="size-[32px] text-red-400" strokeWidth={1.5} />
                        <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A]">Render failed</p>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[11px] font-medium backdrop-blur-sm ${
                        r.status === "completed" ? "bg-emerald-50/90 text-emerald-700 border border-emerald-200"
                          : r.status === "processing" ? "bg-[#FFF6DC]/90 text-[#09090B] border border-[#FFEAB1]"
                          : "bg-red-50/90 text-red-600 border border-red-200"
                      }`}>
                        {r.status === "completed" ? "Completed" : r.status === "processing" ? "Processing" : "Failed"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-[100px] bg-black/40 backdrop-blur-sm font-['Inter',sans-serif] text-[10px] font-medium text-white">
                        {r.aspectRatio}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.5px] leading-[1.2] truncate">{r.projectName}</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock className="size-[12px] text-[#ABABAB]" />
                          <span className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB]">{timeAgoFn(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {r.status === "completed" && r.resultUrl && (
                          <a href={r.resultUrl} target="_blank" rel="noopener noreferrer" download
                            className="size-[34px] rounded-[10px] bg-[#09090B] flex items-center justify-center hover:opacity-80 transition-opacity">
                            <Download className="size-[16px] text-white" strokeWidth={1.5} />
                          </a>
                        )}
                        <button onClick={() => requestDeleteRender(r.renderId, r.projectName || "Render")}
                          className="size-[34px] rounded-[10px] hover:bg-red-50 flex items-center justify-center transition-colors">
                          <Trash2 className="size-[16px] text-[#ABABAB] hover:text-red-500 transition-colors" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        </>
        ) : (
        /* ═══ PROJECTS TAB ═══ */
        <>
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-[#F3F4F6] z-20 px-4 md:px-10">
          {/* Mobile search bar (expandable) */}
          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-b border-[#F3F4F6]">
                <div className="flex items-center gap-2 py-3">
                  <div className="flex-1 flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 h-[40px]">
                    <Search className="size-[16px] text-[#99A1AF] shrink-0" strokeWidth={1.5} />
                    <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                      className="flex-1 bg-transparent font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none min-w-0" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="shrink-0"><X className="size-[14px] text-[#99A1AF]" /></button>
                    )}
                  </div>
                  <button onClick={() => setMobileSearchOpen(false)} className="font-['Inter',sans-serif] text-[13px] font-medium text-[#71717A] shrink-0">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-[64px] md:h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile: Network logo */}
              <div className="md:hidden h-[20px] w-[95px] bg-[#09090b] shrink-0 cursor-pointer"
                onClick={() => navigate("/")}
                style={{ maskImage: `url('${imgNetworkLogo}')`, WebkitMaskImage: `url('${imgNetworkLogo}')`, maskSize: "95px 20px", WebkitMaskSize: "95px 20px", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "0 0", WebkitMaskPosition: "0 0" }}
              />
              <h1 className="hidden md:block font-['Inter',sans-serif] font-semibold text-[24px] text-[#09090B] tracking-[-1px]">My 3D Floor Plans</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Mobile: search + sort toggles */}
              <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden size-[36px] rounded-[10px] bg-[#F6F6F6] flex items-center justify-center">
                <Search className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
              </button>
              {/* Desktop search */}
              <div className="hidden sm:flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 h-[42px] w-[240px]">
                <Search className="size-[16px] text-[#99A1AF]" strokeWidth={1.5} />
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none" />
              </div>
              {/* Sort */}
              <div className="hidden sm:block relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-[42px] bg-[#F6F6F6] border border-[#E5E7EB] rounded-[14px] px-4 pr-9 font-['Inter',sans-serif] text-[13px] text-[#09090B] appearance-none outline-none cursor-pointer">
                  <option value="updated">Last Modified</option>
                  <option value="name">Name A-Z</option>
                  <option value="created">Date Created</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[14px] text-[#99A1AF] pointer-events-none" />
              </div>
              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-[#F6F6F6] rounded-[10px] p-1">
                <button onClick={() => setViewMode("grid")} className={`size-[32px] rounded-[8px] flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}>
                  <Grid3X3 className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
                </button>
                <button onClick={() => setViewMode("list")} className={`size-[32px] rounded-[8px] flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}>
                  <List className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
                </button>
              </div>
              {/* Desktop: New button */}
              <button onClick={() => setShowNewModal(true)}
                className="hidden md:flex bg-[#09090B] text-white rounded-[14px] h-[42px] px-5 font-['Inter',sans-serif] font-semibold text-[14px] tracking-[-0.35px] items-center gap-2 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
                <Plus className="size-[16px]" strokeWidth={2} />New
              </button>
              {/* Mobile: Profile photo with dropdown */}
              <div className="md:hidden">
                <MobileProfileDropdown userName={userName} avatarUrl={userAvatar} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-10 py-6 md:py-8 max-w-[1270px]">
          {/* ═══ Quick Action Buttons ═══ */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
            {/* Start from scratch */}
            <motion.button
              whileHover={{ y: -3, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={async () => {
                const project = await handleCreateProject("Untitled Floor Plan", "upload", undefined, {
                  roomDefinitions: [],
                  furniture: {},
                });
                if (project) navigate(`/floorplan3d/editor/${project.id}?scratch=true`);
                else navigate("/floorplan3d/editor?scratch=true");
              }}
              className="bg-[#FFF6DC] hover:bg-[#FFF0C7] border border-[#FFEAB1] rounded-[14px] md:rounded-[17px] p-4 md:p-6 flex flex-col items-center gap-2.5 md:gap-4 transition-colors cursor-pointer group"
            >
              <div className="size-[40px] md:size-[56px] rounded-[12px] md:rounded-[14px] bg-white/80 border border-[#FFEAB1] flex items-center justify-center group-hover:scale-105 transition-transform">
                <PenLine className="size-[20px] md:size-[26px] text-[#09090B]" strokeWidth={1.5} />
              </div>
              <span className="font-['Inter',sans-serif] font-semibold text-[12px] md:text-[14px] text-[#09090B] tracking-[-0.3px] text-center leading-tight">Start from scratch</span>
            </motion.button>

            {/* Import a plan */}
            <motion.button
              whileHover={{ y: -3, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowImportZone((v) => !v)}
              className={`border rounded-[14px] md:rounded-[17px] p-4 md:p-6 flex flex-col items-center gap-2.5 md:gap-4 transition-colors cursor-pointer group ${
                showImportZone
                  ? "bg-[#FFF0C7] border-[#09090B]"
                  : "bg-[#FFF6DC] hover:bg-[#FFF0C7] border-[#FFEAB1]"
              }`}
            >
              <div className="size-[40px] md:size-[56px] rounded-[12px] md:rounded-[14px] bg-white/80 border border-[#FFEAB1] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileDown className="size-[20px] md:size-[26px] text-[#09090B]" strokeWidth={1.5} />
              </div>
              <span className="font-['Inter',sans-serif] font-semibold text-[12px] md:text-[14px] text-[#09090B] tracking-[-0.3px] text-center leading-tight">Import a plan</span>
            </motion.button>

            {/* Templates */}
            <motion.button
              whileHover={{ y: -3, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowNewModal(true)}
              className="bg-[#FFF6DC] hover:bg-[#FFF0C7] border border-[#FFEAB1] rounded-[14px] md:rounded-[17px] p-4 md:p-6 flex flex-col items-center gap-2.5 md:gap-4 transition-colors cursor-pointer group"
            >
              <div className="size-[40px] md:size-[56px] rounded-[12px] md:rounded-[14px] bg-white/80 border border-[#FFEAB1] flex items-center justify-center group-hover:scale-105 transition-transform">
                <LayoutTemplate className="size-[20px] md:size-[26px] text-[#09090B]" strokeWidth={1.5} />
              </div>
              <span className="font-['Inter',sans-serif] font-semibold text-[12px] md:text-[14px] text-[#09090B] tracking-[-0.3px] text-center leading-tight">Templates</span>
            </motion.button>
          </div>

          {/* ═══ Collapsible Upload Zone ═══ */}
          <AnimatePresence>
            {showImportZone && (
              <motion.div
                ref={uploadRef}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <UploadZone
                  onConfirm={async (aiResult) => {
                    const title = aiResult.planName || `Floor Plan (${aiResult.roomCount} rooms)`;
                    try {
                      const headers = await getAuthHeaders();
                      const res = await fetch(`${API}/fp3d/projects`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          title,
                          sourceType: "upload",
                          projectData: {
                            roomDefinitions: aiResult.defs,
                            furniture: Object.fromEntries(aiResult.defs.map((d) => [d.id, []])),
                          },
                        }),
                      });
                      if (res.ok) {
                        const d = await res.json();
                        const newProjectId = d.project?.id;
                        if (newProjectId) {
                          setProjects((p) => [d.project, ...p]);
                          console.log("[Dashboard] Created project for imported plan:", newProjectId, title);
                          navigate(`/floorplan3d/editor/${newProjectId}?import=image`);
                          return;
                        }
                      }
                      console.error("[Dashboard] Failed to create project, falling back to sessionStorage-only navigation");
                    } catch (e) {
                      console.error("[Dashboard] Project creation error:", e);
                    }
                    navigate("/floorplan3d/editor?import=image");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Projects */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-['Inter',sans-serif] font-semibold text-[20px] text-[#09090B] tracking-[-0.5px]">Recent Projects</h2>
            <span className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">{sortedProjects.length} project{sortedProjects.length !== 1 ? "s" : ""}</span>
          </div>

          {sortedProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="size-[48px] text-[#E5E7EB] mx-auto mb-4" strokeWidth={1} />
              <p className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#09090B] tracking-[-0.3px] mb-1">No projects yet</p>
              <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">Upload a floor plan or use a template to get started.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {sortedProjects.map((project, idx) => (
                <ProjectCard key={project.id || `project-${idx}`} project={project} view="grid" onClick={() => navigate(`/floorplan3d/editor/${project.id}`)}
                  onRename={() => { setRenamingId(project.id); setRenameVal(project.title); }}
                  onDuplicate={() => handleDuplicate(project)} onDelete={() => requestDeleteProject(project.id, project.title)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedProjects.map((project, idx) => (
                <ProjectCard key={project.id || `project-${idx}`} project={project} view="list" onClick={() => navigate(`/floorplan3d/editor/${project.id}`)}
                  onRename={() => { setRenamingId(project.id); setRenameVal(project.title); }}
                  onDuplicate={() => handleDuplicate(project)} onDelete={() => requestDeleteProject(project.id, project.title)} />
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <NewProjectModal open={showNewModal} onClose={() => setShowNewModal(false)} templates={templates}
        onUseTemplate={handleUseTemplate} />

      {/* Rename dialog */}
      <AnimatePresence>
        {renamingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setRenamingId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090B] tracking-[-0.5px] mb-4">Rename Project</h3>
              <input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} autoFocus
                className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors mb-4"
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(renamingId, renameVal); }} />
              <div className="flex gap-3">
                <button onClick={() => setRenamingId(null)} className="flex-1 h-[42px] rounded-[14px] border border-[#E5E7EB] font-['Inter',sans-serif] text-[14px] font-medium text-[#09090B] hover:bg-[#F6F6F6] transition-colors">Cancel</button>
                <button onClick={() => handleRename(renamingId, renameVal)} className="flex-1 h-[42px] rounded-[14px] bg-[#09090B] font-['Inter',sans-serif] text-[14px] font-semibold text-white tracking-[-0.35px] hover:opacity-90 transition-opacity">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template loading overlay */}
      <AnimatePresence>
        {templateLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-[32px] text-[#09090B] animate-spin" />
              <p className="font-['Inter',sans-serif] text-[14px] font-medium text-[#09090B] tracking-[-0.3px]">Creating project from template...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleteLoading && setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-full max-w-[420px] p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-[40px] rounded-[14px] bg-red-50 flex items-center justify-center">
                  <Trash2 className="size-[20px] text-red-500" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090B] tracking-[-0.3px]">
                    Delete {deleteConfirm.type === "project" ? "Project" : "Render"}?
                  </h3>
                  <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A] truncate max-w-[280px]">{deleteConfirm.name}</p>
                </div>
              </div>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] mb-5">
                {deleteConfirm.type === "project"
                  ? "This will permanently delete this project and all its data. This action cannot be undone."
                  : "This will permanently delete this render. This action cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} disabled={deleteLoading}
                  className="flex-1 h-[40px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[13px] font-medium hover:bg-[#F6F6F6] transition-colors cursor-pointer disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 h-[40px] rounded-[14px] bg-red-600 text-white font-['Inter',sans-serif] text-[13px] font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">
                  {deleteLoading && <Loader2 className="size-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
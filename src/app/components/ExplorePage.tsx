import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Heart, Search, X, Check, SlidersHorizontal, Palette, Building2, DollarSign, Bookmark, Plus, CheckCircle } from "lucide-react";
import { useMoodBoardList } from "@/app/hooks/useMoodBoardList";
import { useAuth } from "@/app/hooks/useAuth";
import type { MoodBoard, BoardPin } from "@/app/utils/mood-board-types";
import { useColorExtractor } from "@/app/hooks/useColorExtractor";
import { uploadImageFromUrl } from "@/app/utils/mood-board-storage";
import { supabase } from "@/app/components/supabaseClient";
import logoImg from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { Seo } from "./shared/Seo";

/* ═══ Design Tokens (from GUIDELINES.md) ═══ */
const C = {
  cream: "#f0ede6", creamDark: "#e8e4db", creamBorder: "#d8d3c8",
  black: "#0f0f0d", gray: "#6b6860", grayLight: "#9a9790",
  white: "#fafaf8", footerDark: "#0f0f0d",
} as const;
const serif = "'EB Garamond', Georgia, serif";
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

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

// ─── SAMPLE DATA ──────────────────────────────────────────────────
const SAMPLES = [
  { projectId: "s1", title: "Modern Minimalist Living", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80", meta: "HDB · $65,000 · 2024", propertyType: "HDB", budget: "$65,000", style: "Modern", designerName: "Sora Studios", designerSlug: "sora-studios", verified: true },
  { projectId: "s2", title: "Japandi Bedroom Retreat", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", meta: "Condo · $42,000 · 2024", propertyType: "Condo", budget: "$42,000", style: "Japandi", designerName: "Muji Space", designerSlug: "muji-space", verified: true },
  { projectId: "s3", title: "Scandinavian Open Kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", meta: "HDB · $38,000 · 2023", propertyType: "HDB", budget: "$38,000", style: "Scandinavian", designerName: "Nordic Haus", designerSlug: "nordic-haus", verified: false },
  { projectId: "s4", title: "Industrial Loft Conversion", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80", meta: "Landed · $120,000 · 2024", propertyType: "Landed", budget: "$120,000", style: "Industrial", designerName: "Raw Design Co", designerSlug: "raw-design", verified: true },
  { projectId: "s5", title: "Cozy Reading Nook", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80", meta: "Condo · $28,000 · 2023", propertyType: "Condo", budget: "$28,000", style: "Contemporary", designerName: "Warm Spaces", designerSlug: "warm-spaces", verified: false },
  { projectId: "s6", title: "Luxury Master Suite", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80", meta: "Condo · $95,000 · 2024", propertyType: "Condo", budget: "$95,000", style: "Luxurious", designerName: "Prestige Interiors", designerSlug: "prestige", verified: true },
  { projectId: "s7", title: "Bright Airy Bathroom", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80", meta: "HDB · $18,000 · 2024", propertyType: "HDB", budget: "$18,000", style: "Minimalist", designerName: "Clean Lines", designerSlug: "clean-lines", verified: true },
  { projectId: "s8", title: "Dark Moody Kitchen", image: "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&q=80", meta: "Landed · $85,000 · 2023", propertyType: "Landed", budget: "$85,000", style: "Contemporary", designerName: "Noir Studio", designerSlug: "noir-studio", verified: false },
  { projectId: "s9", title: "Coastal Living Room", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80", meta: "Condo · $55,000 · 2024", propertyType: "Condo", budget: "$55,000", style: "Modern", designerName: "Sora Studios", designerSlug: "sora-studios", verified: true },
  { projectId: "s10", title: "Warm Wood Dining Area", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80", meta: "HDB · $32,000 · 2024", propertyType: "HDB", budget: "$32,000", style: "Japandi", designerName: "Muji Space", designerSlug: "muji-space", verified: true },
  { projectId: "s11", title: "White Marble Entryway", image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80", meta: "Landed · $45,000 · 2023", propertyType: "Landed", budget: "$45,000", style: "Luxurious", designerName: "Prestige Interiors", designerSlug: "prestige", verified: true },
  { projectId: "s12", title: "Kids Playroom Design", image: "https://images.unsplash.com/photo-1617104678098-de229db51175?w=600&q=80", meta: "HDB · $15,000 · 2024", propertyType: "HDB", budget: "$15,000", style: "Scandinavian", designerName: "Nordic Haus", designerSlug: "nordic-haus", verified: false },
  { projectId: "s13", title: "Zen Bathroom Oasis", image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&q=80", meta: "Condo · $22,000 · 2024", propertyType: "Condo", budget: "$22,000", style: "Japandi", designerName: "Muji Space", designerSlug: "muji-space", verified: true },
  { projectId: "s14", title: "Home Office Setup", image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&q=80", meta: "HDB · $8,000 · 2023", propertyType: "HDB", budget: "$8,000", style: "Modern", designerName: "Clean Lines", designerSlug: "clean-lines", verified: true },
  { projectId: "s15", title: "Open Concept BTO", image: "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80", meta: "HDB · $48,000 · 2024", propertyType: "HDB", budget: "$48,000", style: "Minimalist", designerName: "Sora Studios", designerSlug: "sora-studios", verified: true },
  { projectId: "s16", title: "Rustic Landed Kitchen", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80", meta: "Landed · $72,000 · 2024", propertyType: "Landed", budget: "$72,000", style: "Industrial", designerName: "Raw Design Co", designerSlug: "raw-design", verified: true },
  { projectId: "s17", title: "Penthouse Living Space", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80", meta: "Condo · $150,000 · 2024", propertyType: "Condo", budget: "$150,000", style: "Luxurious", designerName: "Prestige Interiors", designerSlug: "prestige", verified: true },
  { projectId: "s18", title: "Compact Studio Design", image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80", meta: "Condo · $25,000 · 2023", propertyType: "Condo", budget: "$25,000", style: "Minimalist", designerName: "Warm Spaces", designerSlug: "warm-spaces", verified: false },
  { projectId: "s19", title: "Outdoor Patio Lounge", image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80", meta: "Landed · $35,000 · 2024", propertyType: "Landed", budget: "$35,000", style: "Contemporary", designerName: "Noir Studio", designerSlug: "noir-studio", verified: false },
  { projectId: "s20", title: "Walk-in Wardrobe", image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&q=80", meta: "Condo · $18,000 · 2024", propertyType: "Condo", budget: "$18,000", style: "Modern", designerName: "Clean Lines", designerSlug: "clean-lines", verified: true },
  { projectId: "s21", title: "Terrazzo Feature Wall", image: "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=600&q=80", meta: "HDB · $12,000 · 2023", propertyType: "HDB", budget: "$12,000", style: "Scandinavian", designerName: "Nordic Haus", designerSlug: "nordic-haus", verified: false },
  { projectId: "s22", title: "Black & Gold Dining", image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80", meta: "Condo · $62,000 · 2024", propertyType: "Condo", budget: "$62,000", style: "Luxurious", designerName: "Prestige Interiors", designerSlug: "prestige", verified: true },
  { projectId: "s23", title: "Muji-Style Storage", image: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=600&q=80", meta: "HDB · $22,000 · 2024", propertyType: "HDB", budget: "$22,000", style: "Muji", designerName: "Muji Space", designerSlug: "muji-space", verified: true },
  { projectId: "s24", title: "Concrete & Glass Study", image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600&q=80", meta: "Landed · $55,000 · 2023", propertyType: "Landed", budget: "$55,000", style: "Industrial", designerName: "Raw Design Co", designerSlug: "raw-design", verified: true },
];

const STYLES = ["Modern", "Minimalist", "Scandinavian", "Industrial", "Japandi", "Contemporary", "Luxurious", "Muji"];
const PROPERTY_TYPES = ["HDB", "Condo", "Landed"];
const BUDGETS = ["Below $30K", "$30K–$50K", "$50K–$80K", "$80K–$120K", "Above $120K"];

// ─── Deterministic aspect ratio from string ───────────────────────
function hashAspect(id: string, mini?: boolean): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  const min = mini ? 60 : 70;
  const max = mini ? 100 : 145;
  return min + (Math.abs(h) % (max - min));
}

// ─── MAIN ─────────────────────────────────────────────────────────
export function ExplorePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>(SAMPLES);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalProject, setModalProject] = useState<any | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [activePropTypes, setActivePropTypes] = useState<Set<string>>(new Set());
  const [activeBudgets, setActiveBudgets] = useState<Set<string>>(new Set());
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [pinnedToBoard, setPinnedToBoard] = useState<string | null>(null);
  const { boards, createBoard, updateBoardSummary } = useMoodBoardList();
  const { extract } = useColorExtractor();
  const { user, isLoggedIn } = useAuth();
  const hasFilters = activeStyles.size > 0 || activePropTypes.size > 0 || activeBudgets.size > 0 || searchQuery.length > 0;

  // Try loading real data in background (only replace samples if real data has valid images)
  useEffect(() => {
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const res = await api("/explore-projects", { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const json = await res.json();
          // Only use real data if it has projects with actual image URLs
          const valid = (json.data || []).filter((p: any) => p.image && p.image.startsWith("http"));
          if (valid.length > 0) setProjects(valid);
        }
      } catch {}
    })();
  }, []);

  // Load saved
  useEffect(() => {
    if (!localStorage.getItem("homeowner-token")) return;
    (async () => {
      try {
        const res = await api("/homeowner-saved-projects");
        const json = await res.json();
        if (json.data) setSavedIds(new Set(json.data.map((s: any) => s.projectId)));
      } catch {}
    })();
  }, []);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = modalProject ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalProject]);

  const toggleSave = useCallback(async (proj: any) => {
    if (!localStorage.getItem("homeowner-token")) { navigate("/profile"); return; }
    const id = proj.projectId;
    const was = savedIds.has(id);
    setSavedIds(prev => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });
    try {
      if (was) await api(`/homeowner-saved-projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      else await api("/homeowner-saved-projects", { method: "POST", body: JSON.stringify({ projectId: id, title: proj.title, image: proj.image, designerName: proj.designerName, designerSlug: proj.designerSlug, meta: proj.meta }) });
    } catch {
      setSavedIds(prev => { const n = new Set(prev); was ? n.add(id) : n.delete(id); return n; });
    }
  }, [savedIds, navigate]);

  const pinToBoard = useCallback(async (boardId: string) => {
    if (!modalProject) return;
    const key = `network-mood-board-${boardId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const board: MoodBoard = JSON.parse(raw);

    // Upload image to Supabase Storage if logged in
    let imageUrl = modalProject.image;
    if (isLoggedIn && user) {
      const { url: storageUrl } = await uploadImageFromUrl(imageUrl, user.email);
      if (storageUrl) imageUrl = storageUrl;
    }

    const colors = await extract(imageUrl);
    const pin: BoardPin = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      type: 'image',
      imageUrl,
      colors,
      label: modalProject.title || '',
      createdAt: Date.now(),
    };
    board.pins.push(pin);
    board.updatedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(board));
    updateBoardSummary(board);

    // Sync to Supabase immediately
    if (isLoggedIn && user) {
      supabase.from('mood_boards').upsert({
        id: board.id,
        user_id: user.email,
        name: board.name,
        pins: board.pins,
        extracted_palette: [...new Set(board.pins.flatMap(p => p.colors))],
        updated_at: new Date().toISOString(),
      });
    }

    setPinnedToBoard(boardId);
    setTimeout(() => { setPinnedToBoard(null); setShowBoardPicker(false); }, 1200);
  }, [modalProject, extract, updateBoardSummary, isLoggedIn, user]);

  const pinToNewBoard = useCallback(async () => {
    if (!modalProject) return;
    const id = createBoard();
    // Small delay to ensure localStorage is written
    await new Promise(r => setTimeout(r, 50));
    await pinToBoard(id);
  }, [modalProject, createBoard, pinToBoard]);

  const toggle = (s: Set<string>, fn: (v: Set<string>) => void, v: string) => {
    const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); fn(n);
  };

  const clearAll = () => { setActiveStyles(new Set()); setActivePropTypes(new Set()); setActiveBudgets(new Set()); setSearchQuery(""); };

  const filtered = useMemo(() => projects.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(p.title || "").toLowerCase().includes(q) && !(p.designerName || "").toLowerCase().includes(q) && !(p.meta || "").toLowerCase().includes(q) && !(p.style || "").toLowerCase().includes(q)) return false;
    }
    if (activeStyles.size > 0 && ![...activeStyles].some(s => (p.style || "").toLowerCase().includes(s.toLowerCase()) || (p.meta || "").toLowerCase().includes(s.toLowerCase()))) return false;
    if (activePropTypes.size > 0 && ![...activePropTypes].some(t => (p.propertyType || "").toLowerCase().includes(t.toLowerCase()))) return false;
    if (activeBudgets.size > 0 && ![...activeBudgets].some(b => (p.budget || "").toLowerCase().includes(b.toLowerCase().replace(/[$,k–]/g, "")))) return false;
    return true;
  }), [projects, searchQuery, activeStyles, activePropTypes, activeBudgets]);

  const suggestions = useMemo(() =>
    modalProject ? projects.filter(p => p.projectId !== modalProject.projectId).sort(() => Math.random() - 0.5).slice(0, 12) : [],
    [modalProject, projects]
  );

  const openInModal = (proj: any) => {
    setModalProject(proj);
    // Always scroll modal overlay to top so card is centered
    setTimeout(() => {
      if (modalRef.current) modalRef.current.scrollTo({ top: 0 });
      const left = document.getElementById("explore-modal-left");
      if (left) left.scrollTop = 0;
    }, 0);
  };

  return (
    <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>
      <Seo
        title="Explore Singapore Interior Design Projects | Network"
        description="Browse real Singapore HDB, condo, and landed renovation projects. Save your favourites and use them as a brief when getting matched with a designer."
        canonical="/explore"
      />
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: C.cream }}>
        <div className="max-w-[1800px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
          <a href="/" className="cursor-pointer shrink-0 block" style={{
            width: "110px", height: "23px", background: C.black,
            maskImage: `url('${logoImg}')`, maskSize: "111.804px 22.909px", maskRepeat: "no-repeat", maskPosition: "0px 0px",
            WebkitMaskImage: `url('${logoImg}')`, WebkitMaskSize: "111.804px 22.909px", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "0px 0px",
          }} />
          <div className="hidden md:flex items-center gap-8">
            <a href="/explore" className="text-[13px] font-medium cursor-pointer" style={{ color: C.black, fontFamily: sans }}>Explore</a>
            <a href="/interior-designers" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Designers</a>
            <a href="/floorplan3d" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Layout Planner</a>
            <a href="/cost-guide" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.gray, fontFamily: sans, transition: "all 0.15s" }}>Cost Guide</a>
          </div>
          <a href="/" className="text-[12px] font-medium cursor-pointer px-5 py-2.5 hover:opacity-80"
            style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>
            Get matched
          </a>
        </div>
        <div className="h-[1px]" style={{ background: C.creamBorder }} />
      </nav>

      {/* HEADER */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pt-[100px] md:pt-[120px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="mb-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Explore</p>
            <h1 className="text-[28px] md:text-[36px] lg:text-[44px] font-normal leading-[1.1]" style={{ fontFamily: serif, color: C.black }}>Discover interior design inspiration</h1>
            <p className="text-[14px] font-normal leading-[1.7] mt-2" style={{ color: C.gray, fontFamily: sans }}>from verified designers</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.grayLight }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects, designers..."
              className="w-full h-[48px] pl-11 pr-10 text-[14px] font-normal focus-visible:outline-none"
              style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "10px", color: C.black, fontFamily: sans }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"><X size={14} style={{ color: C.grayLight }} /></button>}
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium cursor-pointer"
              style={{ background: showFilters || hasFilters ? C.black : C.white, color: showFilters || hasFilters ? C.white : C.gray, border: `1px solid ${showFilters || hasFilters ? C.black : C.creamBorder}`, borderRadius: "10px", fontFamily: sans, transition: "all 0.15s" }}>
              <SlidersHorizontal size={14} /> Filters
              {hasFilters && <span className="ml-1 w-[18px] h-[18px] rounded-full bg-[#FFA929] text-white text-[10px] font-bold flex items-center justify-center">{activeStyles.size + activePropTypes.size + activeBudgets.size}</span>}
            </button>
            {hasFilters && <button onClick={clearAll} className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}>Clear all</button>}
          </div>

          {showFilters && (
            <div className="p-5 md:p-6 space-y-4 mb-4" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "12px" }}>
              <FilterGroup icon={Palette} label="Design Style" items={STYLES} active={activeStyles} toggle={v => toggle(activeStyles, setActiveStyles, v)} />
              <FilterGroup icon={Building2} label="Property Type" items={PROPERTY_TYPES} active={activePropTypes} toggle={v => toggle(activePropTypes, setActivePropTypes, v)} />
              <FilterGroup icon={DollarSign} label="Budget Range" items={BUDGETS} active={activeBudgets} toggle={v => toggle(activeBudgets, setActiveBudgets, v)} />
            </div>
          )}
        </div>
      </div>

      {/* MASONRY GRID */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search size={40} className="mx-auto mb-3" style={{ color: C.creamBorder }} />
            <p className="text-[20px] font-normal" style={{ fontFamily: serif, color: C.black }}>{hasFilters ? "No projects match your filters" : "No projects yet"}</p>
            <p className="text-[14px] font-normal mt-2 mb-5" style={{ color: C.grayLight, fontFamily: sans }}>{hasFilters ? "Try adjusting your filters" : "Projects will appear here"}</p>
            {hasFilters && <button onClick={clearAll} className="px-6 py-2.5 text-[14px] font-normal cursor-pointer hover:opacity-85"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>Clear Filters</button>}
          </div>
        ) : (
          <>
            <p className="text-[13px] font-normal mb-3" style={{ color: C.grayLight, fontFamily: sans }}>{filtered.length} project{filtered.length !== 1 ? "s" : ""}{hasFilters ? " found" : ""}</p>
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4">
              {filtered.map(p => (
                <Pin key={p.projectId} project={p} saved={savedIds.has(p.projectId)} onSave={() => toggleSave(p)} onOpen={() => openInModal(p)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {modalProject && createPortal(
        <div ref={modalRef} className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "rgba(15,15,13,0.5)", backdropFilter: "blur(4px)", fontFamily: sans }}
          onClick={e => { if (e.target === e.currentTarget) { setModalProject(null); setShowBoardPicker(false); } }}>
          <div className="w-[98%] max-w-[1700px] flex overflow-hidden relative max-[900px]:flex-col max-[900px]:w-full max-[900px]:max-h-[100vh] max-[900px]:overflow-y-auto"
            style={{ background: C.white, borderRadius: "12px", border: `1px solid ${C.creamBorder}`, height: "92vh" }}>

            {/* Close */}
            <button onClick={() => setModalProject(null)}
              className="absolute top-5 right-6 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-50 hover:opacity-60 active:scale-95 max-[900px]:w-8 max-[900px]:h-8 max-[900px]:top-4 max-[900px]:right-4"
              style={{ background: C.white, border: `1px solid ${C.creamBorder}`, transition: "all 0.15s" }}>
              <X size={20} style={{ color: C.gray }} className="max-[900px]:w-4 max-[900px]:h-4" />
            </button>

            {/* Left */}
            <div id="explore-modal-left" className="w-[65%] p-10 overflow-y-auto flex flex-col max-[900px]:w-full max-[900px]:p-5 max-[900px]:overflow-visible">
              <img src={modalProject.image} alt={modalProject.title}
                className="w-full mb-6 object-contain"
                style={{ maxHeight: "80vh", borderRadius: "12px", background: C.cream }} />
              <h2 className="text-[28px] font-normal leading-[1.2] mb-2 max-[900px]:text-[22px]" style={{ fontFamily: serif, color: C.black }}>{modalProject.title}</h2>
              <p className="text-[14px] font-normal mb-5" style={{ color: C.grayLight, fontFamily: sans }}>{modalProject.meta}</p>

              <div className="flex items-center gap-4 pt-4" style={{ borderTop: `1px solid ${C.creamBorder}` }}>
                <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.black }}>
                  {modalProject.designerLogo
                    ? <img src={modalProject.designerLogo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[20px] font-semibold" style={{ color: C.white, fontFamily: sans }}>{(modalProject.designerName || "D")[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[16px] font-semibold" style={{ color: C.black, fontFamily: sans }}>{modalProject.designerName}</span>
                    {modalProject.verified && <span className="w-4 h-4 rounded-full bg-[#2b7fff] inline-flex items-center justify-center"><Check size={9} className="text-white" strokeWidth={3} /></span>}
                  </div>
                  <Link to={`/designer/${modalProject.designerSlug}`} onClick={() => setModalProject(null)} className="text-[13px] font-normal hover:opacity-60" style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s" }}>View profile →</Link>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleSave(modalProject)}
                    className="px-4 py-2.5 text-[13px] font-medium cursor-pointer flex items-center gap-1.5"
                    style={{ background: savedIds.has(modalProject.projectId) ? "#FFA929" : C.cream, color: savedIds.has(modalProject.projectId) ? "white" : C.black, borderRadius: "10px", border: savedIds.has(modalProject.projectId) ? "none" : `1px solid ${C.creamBorder}`, fontFamily: sans, transition: "all 0.15s" }}>
                    <Heart size={14} fill={savedIds.has(modalProject.projectId) ? "white" : "none"} />
                    {savedIds.has(modalProject.projectId) ? "Saved" : "Save"}
                  </button>
                  <div className="relative">
                    <button onClick={() => { setShowBoardPicker(!showBoardPicker); setPinnedToBoard(null); }}
                      className="px-4 py-2.5 text-[13px] font-medium cursor-pointer flex items-center gap-1.5"
                      style={{ background: C.cream, color: C.black, borderRadius: "10px", border: `1px solid ${C.creamBorder}`, fontFamily: sans, transition: "all 0.15s" }}>
                      <Bookmark size={14} />
                      Pin
                    </button>
                    {showBoardPicker && (
                      <div className="absolute right-0 top-full mt-2 w-[260px] z-[100] shadow-lg overflow-hidden"
                        style={{ background: C.white, borderRadius: "12px", border: `1px solid ${C.creamBorder}` }}>
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: C.grayLight, fontFamily: sans }}>Pin to board</p>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto">
                          {boards.map(b => (
                            <button key={b.id} onClick={() => pinToBoard(b.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0ede6] cursor-pointer transition-colors duration-100 text-left"
                              style={{ fontFamily: sans }}>
                              <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0" style={{ background: C.creamDark }}>
                                {b.thumbnail ? <img src={b.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Bookmark size={14} style={{ color: C.grayLight }} /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-medium block truncate" style={{ color: C.black }}>{b.name}</span>
                                <span className="text-[11px]" style={{ color: C.grayLight }}>{b.pinCount} {b.pinCount === 1 ? 'pin' : 'pins'}</span>
                              </div>
                              {pinnedToBoard === b.id && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                            </button>
                          ))}
                        </div>
                        <div className="border-t" style={{ borderColor: C.creamBorder }}>
                          <button onClick={pinToNewBoard}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0ede6] cursor-pointer transition-colors duration-100"
                            style={{ fontFamily: sans }}>
                            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ background: C.creamDark }}>
                              <Plus size={16} style={{ color: C.gray }} />
                            </div>
                            <span className="text-[13px] font-medium" style={{ color: C.black }}>Create new board</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link to={`/designer/${modalProject.designerSlug}`} onClick={() => setModalProject(null)}
                    className="px-4 py-2.5 text-[13px] font-medium no-underline flex items-center gap-1.5"
                    style={{ background: C.black, color: C.white, borderRadius: "10px", fontFamily: sans }}>
                    Enquire
                  </Link>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="w-[35%] p-8 overflow-y-auto max-[900px]:w-full max-[900px]:border-l-0 max-[900px]:overflow-visible"
              style={{ background: C.cream, borderLeft: `1px solid ${C.creamBorder}` }}>
              <p className="text-[20px] font-normal mb-5" style={{ fontFamily: serif, color: C.black }}>More to explore</p>
              <div className="columns-2 gap-3">
                {suggestions.map(p => (
                  <Pin key={`m-${p.projectId}`} project={p} saved={savedIds.has(p.projectId)} onSave={() => toggleSave(p)} onOpen={() => openInModal(p)} mini />
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── PIN COMPONENT ────────────────────────────────────────────────
function Pin({ project, saved, onSave, onOpen, mini }: { project: any; saved: boolean; onSave: () => void; onOpen: () => void; mini?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const aspect = useMemo(() => hashAspect(project.projectId || "x", mini), [project.projectId, mini]);

  if (err) return null;

  return (
    <div
      className={`relative overflow-hidden cursor-zoom-in group transition-transform duration-200 hover:scale-[1.02] ${mini ? "mb-3" : "mb-4"}`}
      style={{ paddingBottom: `${aspect}%`, height: 0, backgroundColor: C.creamDark, borderRadius: "12px" }}
      onClick={onOpen}
    >
      {/* Shimmer skeleton */}
      {!loaded && (
        <div className="absolute inset-0 z-0" style={{
          background: `linear-gradient(90deg, ${C.creamDark} 25%, ${C.creamBorder} 50%, ${C.creamDark} 75%)`,
          backgroundSize: "200% 100%",
          animation: "exploreShimmer 1.5s infinite",
          borderRadius: "12px",
        }} />
      )}

      {/* Image */}
      <img
        src={project.image} alt={project.title} loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover z-[1] transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} group-hover:scale-105`}
        style={{ borderRadius: "12px" }}
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
      />

      {/* Hover gradient */}
      <div className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-250 opacity-0 group-hover:opacity-100"
        style={{ background: mini
          ? "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 40%)"
          : "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.55) 100%)",
          borderRadius: "12px",
        }} />

      {/* Designer hover (top-left) */}
      <div className="absolute top-3 left-3 z-[5] flex items-center gap-2 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none"
        style={mini ? { top: 8, left: 8, gap: 6 } : undefined}>
        <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white"
          style={{ width: mini ? 24 : 32, height: mini ? 24 : 32, background: C.black }}>
          {project.designerLogo
            ? <img src={project.designerLogo} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-semibold" style={{ fontSize: mini ? 9 : 11, fontFamily: sans }}>{(project.designerName || "D")[0].toUpperCase()}</span>}
        </div>
        <span className="text-white font-semibold drop-shadow-md" style={{ fontSize: mini ? 11 : 13, fontFamily: sans }}>{project.designerName}</span>
        {project.verified && (
          <span className="rounded-full bg-[#2b7fff] inline-flex items-center justify-center" style={{ width: mini ? 12 : 14, height: mini ? 12 : 14 }}>
            <Check size={mini ? 7 : 8} className="text-white" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Save button (main only) */}
      {!mini && (
        <button onClick={e => { e.stopPropagation(); onSave(); }}
          className="absolute top-3 right-3 z-[6] w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border-none"
          style={{ background: saved ? "#FFA929" : "rgba(255,255,255,0.85)", backdropFilter: saved ? "none" : "blur(8px)" }}>
          <Heart size={16} className={saved ? "text-white fill-white" : ""} style={saved ? {} : { color: C.gray }} />
        </button>
      )}

      {/* Bottom info (main only) */}
      {!mini && (
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-[5] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none">
          <p className="text-white font-semibold text-[14px] leading-tight" style={{ fontFamily: sans }}>{project.title}</p>
          <p className="text-white/70 text-[12px] mt-0.5" style={{ fontFamily: sans }}>{project.meta}</p>
        </div>
      )}
    </div>
  );
}

// ─── FILTER GROUP ─────────────────────────────────────────────────
function FilterGroup({ icon: Icon, label, items, active, toggle }: { icon: any; label: string; items: string[]; active: Set<string>; toggle: (v: string) => void }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>
        <Icon size={12} /> {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <button key={item} onClick={() => toggle(item)}
            className="px-3.5 py-[7px] text-[13px] font-medium cursor-pointer shrink-0 whitespace-nowrap"
            style={{ background: active.has(item) ? C.black : C.white, color: active.has(item) ? C.white : C.gray, border: `1px solid ${active.has(item) ? C.black : C.creamBorder}`, borderRadius: "10px", fontFamily: sans, transition: "all 0.15s" }}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

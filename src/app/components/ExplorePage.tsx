import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Heart, Search, X, Check, SlidersHorizontal, Palette, Building2, DollarSign, Bookmark, Plus, CheckCircle, Star, MapPin } from "lucide-react";
import { useMoodBoardList } from "@/app/hooks/useMoodBoardList";
import { useAuth } from "@/app/hooks/useAuth";
import type { MoodBoard, BoardPin } from "@/app/utils/mood-board-types";
import { useColorExtractor } from "@/app/hooks/useColorExtractor";
import { uploadImageFromUrl } from "@/app/utils/mood-board-storage";
import { supabase } from "@/app/components/supabaseClient";
import { Seo } from "./shared/Seo";
import { HomepageNav } from "./shared/HomepageNav";
import { thumbnailUrl } from "@/app/utils/image-url";

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

const STYLES = ["Modern", "Minimalist", "Scandinavian", "Industrial", "Japandi", "Contemporary", "Luxurious", "Muji"];
const PROPERTY_TYPES = ["HDB", "Condo", "Landed"];
const BUDGETS = ["Below $30K", "$30K–$50K", "$50K–$80K", "$80K–$120K", "Above $120K"];
const MAX_PINS_PER_PROJECT = 6;

function projectImages(p: any): string[] {
  const arr = Array.isArray(p?.images) ? p.images.filter((u: any) => typeof u === "string" && u.startsWith("http")) : [];
  if (arr.length > 0) return arr;
  return typeof p?.image === "string" && p.image.startsWith("http") ? [p.image] : [];
}

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
  const location = useLocation();
  const projectIdParam = useMemo(() => {
    const m = location.pathname.match(/^\/explore\/project\/([^/?#]+)/);
    return m ? m[1] : undefined;
  }, [location.pathname]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Project view is driven by URL (/explore/project/:projectId) instead of modal state.
  const modalProject = useMemo(() => {
    if (!projectIdParam) return null;
    const decoded = decodeURIComponent(projectIdParam);
    return projects.find(p => p.projectId === decoded) || null;
  }, [projectIdParam, projects]);

  const closeProjectView = useCallback(() => {
    navigate("/explore");
  }, [navigate]);

  // Measure the project card height so the bottom-left masonry columns can start right below it.
  const projectCardRef = useRef<HTMLDivElement>(null);
  const [projectCardHeight, setProjectCardHeight] = useState(0);

  // Stable random pin order for the project page's "More to explore" feed.
  // Each project contributes ONLY its cover photo here so the user sees variety
  // across many different homes and designers, not 6 photos from the same project.
  const projectMorePinPool = useMemo(() => {
    if (!modalProject) return [] as { pinId: string; imageIndex: number; image: string; project: any }[];
    const others = projects.filter(p => p.projectId !== modalProject.projectId);
    // Fisher-Yates shuffle
    const shuffled = [...others];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled
      .map(p => ({
        pinId: `more-${p.projectId}`,
        imageIndex: 0,
        image: projectImages(p)[0],
        project: p,
      }))
      .filter(s => s.image);
  }, [modalProject?.projectId, projects]);
  // Progressive load count for the project page's "more to explore" feed.
  const [projectMoreCount, setProjectMoreCount] = useState(36);
  const moreSentinelRef = useRef<HTMLDivElement>(null);
  // Main hero image: load it before revealing so it doesn't pop in after the smaller pins.
  const [mainImageLoaded, setMainImageLoaded] = useState(false);
  useEffect(() => { setMainImageLoaded(false); }, [projectIdParam, modalImageIndex]);
  useEffect(() => { setProjectMoreCount(36); }, [projectIdParam]);
  useEffect(() => {
    if (!modalProject) return;
    const el = moreSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setProjectMoreCount(c => c + 36);
    }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [modalProject, projectMoreCount]);
  useEffect(() => {
    if (!modalProject) { setProjectCardHeight(0); return; }
    const el = projectCardRef.current;
    if (!el) return;
    const update = () => setProjectCardHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [modalProject]);

  // Reset image index when project URL changes
  useEffect(() => { setModalImageIndex(0); }, [projectIdParam]);
  // Scroll to top when entering project view
  // Restore explore-grid scroll position on Back from a project page. Runs BEFORE paint
  // (useLayoutEffect) so there's no visible flash at scroll=0 before the restore.
  useLayoutEffect(() => {
    if (projectIdParam) {
      window.scrollTo(0, 0);
      return;
    }
    let target = 0;
    try { target = parseInt(sessionStorage.getItem("explore-scroll-y") || "0", 10) || 0; } catch {}
    if (target <= 0) return;
    // Immediate try
    window.scrollTo(0, target);
    // If page not tall enough yet, retry a couple of frames until grid finishes rendering.
    let attempts = 20;
    const tick = () => {
      if (--attempts <= 0) return;
      if (document.body.scrollHeight >= target + window.innerHeight - 100) {
        if (window.scrollY !== target) window.scrollTo(0, target);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [projectIdParam, loading]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("network-recent-searches") || "[]"); }
    catch { return []; }
  });
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [ratingsBySlug, setRatingsBySlug] = useState<Record<string, { rating: number; totalRatings: number }>>({});
  const [colCount, setColCount] = useState(() => {
    if (typeof window === "undefined") return 5;
    const w = window.innerWidth;
    return w >= 1536 ? 6 : w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 640 ? 3 : 2;
  });
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setColCount(w >= 1536 ? 6 : w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 640 ? 3 : 2);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Initial filter state — reads ?style=, ?property=, ?budget= from the URL so
  // deep links from the Explore nav dropdown pre-apply the matching filter.
  const initialFilters = useMemo(() => {
    const out = { style: new Set<string>(), property: new Set<string>(), budget: new Set<string>() };
    if (typeof window === "undefined") return out;
    try {
      const params = new URLSearchParams(window.location.search);
      const style = params.get("style"); if (style) out.style.add(style);
      const property = params.get("property"); if (property) out.property.add(property);
      const budget = params.get("budget"); if (budget) out.budget.add(budget);
    } catch {}
    return out;
  }, []);
  const [activeStyles, setActiveStyles] = useState<Set<string>>(initialFilters.style);
  const [activePropTypes, setActivePropTypes] = useState<Set<string>>(initialFilters.property);
  const [activeBudgets, setActiveBudgets] = useState<Set<string>>(initialFilters.budget);

  // Progressive load count for the main /explore grid. Persisted to sessionStorage so it
  // survives navigation (e.g. visiting a project page and coming back).
  const [exploreVisibleCount, setExploreVisibleCount] = useState(() => {
    try {
      const stored = sessionStorage.getItem("explore-visible-count");
      const n = stored ? parseInt(stored, 10) : NaN;
      return Number.isFinite(n) && n >= 48 ? n : 48;
    } catch { return 48; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("explore-visible-count", String(exploreVisibleCount)); } catch {}
  }, [exploreVisibleCount]);
  const exploreSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loading || modalProject) return;
    const el = exploreSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setExploreVisibleCount(c => c + 36);
    }, { rootMargin: "1000px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, modalProject, exploreVisibleCount]);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [pinnedToBoard, setPinnedToBoard] = useState<string | null>(null);
  const { boards, createBoard, updateBoardSummary } = useMoodBoardList();
  const { extract } = useColorExtractor();
  const { user, isLoggedIn } = useAuth();
  const hasFilters = activeStyles.size > 0 || activePropTypes.size > 0 || activeBudgets.size > 0 || searchQuery.length > 0;

  // Load real projects from active designers
  useEffect(() => {
    (async () => {
      try {
        const res = await api("/explore-projects");
        if (res.ok) {
          const json = await res.json();
          const valid = (json.data || []).filter((p: any) => projectImages(p).length > 0);
          setProjects(valid);
        }
      } catch {}
      setLoading(false);
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

  // Outside-click closes search dropdown
  useEffect(() => {
    if (!searchFocused) return;
    const onDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchFocused]);

  const commitRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      try { localStorage.setItem("network-recent-searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeRecent = useCallback((q: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem("network-recent-searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleSave = useCallback(async (proj: any, clickedImage?: string) => {
    if (!localStorage.getItem("homeowner-token")) { navigate("/profile"); return; }
    const id = proj.projectId;
    const was = savedIds.has(id);
    const thumb = clickedImage || proj.image;
    setSavedIds(prev => { const n = new Set(prev); was ? n.delete(id) : n.add(id); return n; });

    // Mirror to the homeowner dashboard's Inspiration board (localStorage source)
    try {
      const raw = localStorage.getItem("saved-inspirations");
      const list: any[] = raw ? JSON.parse(raw) : [];
      const next = was
        ? list.filter(d => d.projectId !== id)
        : [...list, { projectId: id, imageUrl: thumb, title: proj.title, designer: proj.designerName, designerSlug: proj.designerSlug, style: proj.style || "", meta: proj.meta || "" }];
      localStorage.setItem("saved-inspirations", JSON.stringify(next));
    } catch { /* ignore */ }

    try {
      if (was) await api(`/homeowner-saved-projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      else await api("/homeowner-saved-projects", { method: "POST", body: JSON.stringify({ projectId: id, title: proj.title, image: thumb, designerName: proj.designerName, designerSlug: proj.designerSlug, meta: proj.meta }) });
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

    // Upload image to Supabase Storage if logged in — use the currently displayed photo
    const allImgs = projectImages(modalProject);
    let imageUrl = allImgs[Math.min(modalImageIndex, Math.max(0, allImgs.length - 1))] || modalProject.image;
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
  }, [modalProject, modalImageIndex, extract, updateBoardSummary, isLoggedIn, user]);

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

  const filtered = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter(p => {
      if (tokens.length > 0) {
        const hay = [p.title, p.designerName, p.designerSlug, p.meta, p.style, p.propertyType, p.budget, p.year].filter(Boolean).join(" ").toLowerCase();
        if (!tokens.every(t => hay.includes(t))) return false;
      }
      if (activeStyles.size > 0 && ![...activeStyles].some(s => (p.style || "").toLowerCase().includes(s.toLowerCase()) || (p.meta || "").toLowerCase().includes(s.toLowerCase()))) return false;
      if (activePropTypes.size > 0 && ![...activePropTypes].some(t => (p.propertyType || "").toLowerCase().includes(t.toLowerCase()))) return false;
      if (activeBudgets.size > 0 && ![...activeBudgets].some(b => (p.budget || "").toLowerCase().includes(b.toLowerCase().replace(/[$,k–]/g, "")))) return false;
      return true;
    });
  }, [projects, searchQuery, activeStyles, activePropTypes, activeBudgets]);

  // Live search suggestions for the dropdown
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // Unique designers
    const designerMap = new Map<string, any>();
    for (const p of projects) {
      if (!designerMap.has(p.designerSlug)) designerMap.set(p.designerSlug, p);
    }
    const designers = [...designerMap.values()]
      .filter(p => (p.designerName || "").toLowerCase().includes(q))
      .slice(0, 3);

    // Matching projects
    const projectMatches = projects
      .filter(p => {
        const hay = [p.title, p.meta, p.style, p.propertyType].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 5);

    const styleMatches = STYLES.filter(s => s.toLowerCase().includes(q));
    const propMatches = PROPERTY_TYPES.filter(t => t.toLowerCase().includes(q));

    const hasAny = designers.length || projectMatches.length || styleMatches.length || propMatches.length;
    return hasAny ? { designers, projectMatches, styleMatches, propMatches } : null;
  }, [searchQuery, projects]);

  const trendingChips = useMemo(() => ["Modern", "Scandinavian", "Japandi", "Minimalist", "HDB", "Condo", "Living room", "Kitchen"], []);

  // Top 3 designers matching the current search/filters — shown only when the user is actively searching.
  const recommendedDesigners = useMemo(() => {
    if (!searchQuery.trim() && activeStyles.size === 0 && activePropTypes.size === 0 && activeBudgets.size === 0) return [];
    const byDesigner = new Map<string, { designer: any; matches: any[] }>();
    for (const p of filtered) {
      const slug = p.designerSlug || "";
      if (!slug) continue;
      if (!byDesigner.has(slug)) byDesigner.set(slug, { designer: p, matches: [] });
      byDesigner.get(slug)!.matches.push(p);
    }
    return [...byDesigner.values()]
      .sort((a, b) => b.matches.length - a.matches.length)
      .slice(0, 3);
  }, [filtered, searchQuery, activeStyles, activePropTypes, activeBudgets]);

  // Fetch ratings for the recommended designers (cached per-slug in component state)
  useEffect(() => {
    const slugs = recommendedDesigners.map(d => d.designer.designerSlug).filter(s => s && !(s in ratingsBySlug));
    if (slugs.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(slugs.map(async slug => {
        try {
          const res = await api(`/google-reviews/${encodeURIComponent(slug)}`);
          if (!res.ok) return [slug, null] as const;
          const json = await res.json();
          const d = json?.data;
          if (d && typeof d.rating === "number") {
            return [slug, { rating: d.rating, totalRatings: typeof d.totalRatings === "number" ? d.totalRatings : 0 }] as const;
          }
          return [slug, null] as const;
        } catch { return [slug, null] as const; }
      }));
      if (cancelled) return;
      setRatingsBySlug(prev => {
        const next = { ...prev };
        for (const [slug, val] of results) next[slug] = val || { rating: 0, totalRatings: 0 };
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [recommendedDesigners]);

  // Expand filtered projects into one pin per image (up to MAX_PINS_PER_PROJECT each).
  // Pins are interleaved across projects so a single designer doesn't dominate runs of the grid.
  const pins = useMemo(() => {
    const rows = filtered.map(p => {
      const imgs = projectImages(p).slice(0, MAX_PINS_PER_PROJECT);
      return imgs.map((image, i) => ({
        pinId: `${p.projectId}__${i}`,
        imageIndex: i,
        image,
        project: p,
      }));
    });
    const out: { pinId: string; imageIndex: number; image: string; project: any }[] = [];
    const max = Math.max(0, ...rows.map(r => r.length));
    for (let i = 0; i < max; i++) {
      for (const row of rows) if (row[i]) out.push(row[i]);
    }
    return out;
  }, [filtered]);

  const suggestions = useMemo(() => {
    if (!modalProject) return [];
    return projects
      .filter(p => p.projectId !== modalProject.projectId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 12)
      .map(p => ({ pinId: `s-${p.projectId}`, imageIndex: 0, image: projectImages(p)[0], project: p }));
  }, [modalProject, projects]);

  const openInModal = (proj: any, imageIndex = 0) => {
    if (!proj?.projectId) return;
    // Snapshot scroll position synchronously before navigating, so going back can restore it
    // without depending on the scroll listener (which can race the navigation).
    try { sessionStorage.setItem("explore-scroll-y", String(window.scrollY)); } catch {}
    navigate(`/explore/project/${encodeURIComponent(proj.projectId)}`);
    setModalImageIndex(imageIndex);
  };

  return (
    <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans, color: C.black }}>
      <Seo
        title="Explore Singapore Interior Design Projects | Network"
        description="Browse real Singapore HDB, condo, and landed renovation projects. Save your favourites and use them as a brief when getting matched with a designer."
        canonical="/explore"
      />
      {/* ═══ NAVBAR ═══ */}
      <HomepageNav />

      {/* Grid wrapper — kept mounted (even on project view) so Pin state and scroll position survive navigation */}
      <div style={{ display: projectIdParam ? "none" : "block" }}>
      {/* HEADER */}
      <div className="max-w-[1293px] mx-auto px-6 md:px-10 pt-[100px] md:pt-[120px]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 mb-7 md:mb-9">
          <div className="flex-1 max-w-[860px]">
            <p className="mb-4 flex items-center gap-2" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>
              <span>Explore</span>
              <span aria-hidden style={{ width: 3, height: 3, borderRadius: "50%", background: C.creamBorder }} />
              <span>Singapore</span>
            </p>
            <h1 className="text-[40px] md:text-[56px] lg:text-[68px] font-normal leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: serif, color: C.black }}>
              Real Singapore homes,<br />
              <span style={{ color: C.gray, fontStyle: "italic" }}>by verified designers.</span>
            </h1>
            <p className="text-[15px] md:text-[16px] font-normal leading-[1.6] mt-4 md:mt-5 max-w-[640px]" style={{ color: C.gray, fontFamily: sans }}>
              Browse completed HDB, condo, and landed projects. Save the ones you love, and your saves become the brief we send to your matched designer.
            </p>
          </div>

          {/* Hero illustration */}
          <div className="hidden lg:flex flex-1 items-center justify-end">
            <img
              src="/explore-hero-illustration.png"
              alt="Two friends browsing interior design inspiration together"
              className="w-full max-w-[820px] h-auto object-contain scale-110 origin-center"
              loading="eager"
            />
          </div>
        </div>

        {/* Search + Filters bar */}
        <div className="mb-5">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1" ref={searchBoxRef}>
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none z-[2]" style={{ color: C.gray }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === "Escape") { setSearchFocused(false); (e.target as HTMLInputElement).blur(); }
                  if (e.key === "Enter" && searchQuery.trim()) { commitRecent(searchQuery); setSearchFocused(false); }
                }}
                placeholder="Search the home you love"
                className="w-full h-[56px] pl-[52px] pr-12 text-[15px] font-normal focus-visible:outline-none relative z-[1]"
                style={{ background: C.white, border: `1px solid ${searchFocused ? C.black : C.creamBorder}`, borderRadius: "14px", color: C.black, fontFamily: sans, boxShadow: searchFocused ? "0 4px 16px rgba(15,15,13,0.06)" : "0 1px 2px rgba(15,15,13,0.03)", transition: "all 0.15s" }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer hover:opacity-70 z-[2]"
                  style={{ background: C.cream, transition: "all 0.15s" }}>
                  <X size={14} style={{ color: C.gray }} />
                </button>
              )}

              {/* Search dropdown */}
              {searchFocused && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[20] overflow-hidden"
                  style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "14px", boxShadow: "0 12px 32px rgba(15,15,13,0.08)" }}>
                  {/* Empty state: recent + trending */}
                  {!searchQuery.trim() && (
                    <div className="p-4 space-y-4">
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Recent</p>
                            <button onClick={() => { setRecentSearches([]); try { localStorage.removeItem("network-recent-searches"); } catch {} }}
                              className="text-[12px] cursor-pointer hover:opacity-60" style={{ color: C.grayLight, fontFamily: sans }}>Clear</button>
                          </div>
                          <div className="space-y-1">
                            {recentSearches.map(s => (
                              <div key={s} className="group flex items-center gap-2 px-2 py-1.5 rounded-[8px] hover:bg-[#f0ede6] cursor-pointer"
                                onClick={() => { setSearchQuery(s); commitRecent(s); setSearchFocused(false); }}>
                                <Search size={13} style={{ color: C.grayLight }} />
                                <span className="text-[14px] flex-1" style={{ color: C.black, fontFamily: sans }}>{s}</span>
                                <button onClick={e => { e.stopPropagation(); removeRecent(s); }}
                                  className="opacity-0 group-hover:opacity-100 cursor-pointer" aria-label="Remove">
                                  <X size={13} style={{ color: C.grayLight }} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="mb-2" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Trending</p>
                        <div className="flex flex-wrap gap-1.5">
                          {trendingChips.map(t => (
                            <button key={t} onClick={() => { setSearchQuery(t); commitRecent(t); setSearchFocused(false); }}
                              className="px-3 py-1.5 text-[13px] cursor-pointer hover:opacity-80"
                              style={{ background: C.cream, color: C.black, border: `1px solid ${C.creamBorder}`, borderRadius: 999, fontFamily: sans, transition: "all 0.15s" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live suggestions */}
                  {searchSuggestions && (
                    <div className="max-h-[480px] overflow-y-auto">
                      {(searchSuggestions.styleMatches.length > 0 || searchSuggestions.propMatches.length > 0) && (
                        <div className="p-3 border-b" style={{ borderColor: C.creamBorder }}>
                          <p className="mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Filter by</p>
                          <div className="flex flex-wrap gap-1.5">
                            {searchSuggestions.styleMatches.map(s => (
                              <button key={`s-${s}`} onClick={() => { toggle(activeStyles, setActiveStyles, s); setSearchQuery(""); setSearchFocused(false); }}
                                className="px-3 py-1.5 text-[13px] cursor-pointer hover:opacity-80 flex items-center gap-1.5"
                                style={{ background: C.cream, color: C.black, border: `1px solid ${C.creamBorder}`, borderRadius: 999, fontFamily: sans, transition: "all 0.15s" }}>
                                <Palette size={12} /> {s}
                              </button>
                            ))}
                            {searchSuggestions.propMatches.map(t => (
                              <button key={`p-${t}`} onClick={() => { toggle(activePropTypes, setActivePropTypes, t); setSearchQuery(""); setSearchFocused(false); }}
                                className="px-3 py-1.5 text-[13px] cursor-pointer hover:opacity-80 flex items-center gap-1.5"
                                style={{ background: C.cream, color: C.black, border: `1px solid ${C.creamBorder}`, borderRadius: 999, fontFamily: sans, transition: "all 0.15s" }}>
                                <Building2 size={12} /> {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchSuggestions.designers.length > 0 && (
                        <div className="p-3 border-b" style={{ borderColor: C.creamBorder }}>
                          <p className="mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Designers</p>
                          {searchSuggestions.designers.map(d => (
                            <Link key={d.designerSlug} to={`/designer/${d.designerSlug}`}
                              onClick={() => { commitRecent(d.designerName); setSearchFocused(false); }}
                              className="flex items-center gap-3 px-2 py-2 rounded-[8px] hover:bg-[#f0ede6] no-underline"
                              style={{ color: C.black, fontFamily: sans }}>
                              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: C.black }}>
                                {d.designerLogo
                                  ? <img src={d.designerLogo} alt="" className="w-full h-full object-cover" />
                                  : <span className="text-[14px] font-semibold" style={{ color: C.white }}>{(d.designerName || "D")[0].toUpperCase()}</span>}
                              </div>
                              <span className="flex-1 text-[14px] font-medium flex items-center gap-1.5">
                                {d.designerName}
                                {d.verified && <span className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center" style={{ background: "#2b7fff" }}><Check size={8} className="text-white" strokeWidth={3} /></span>}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchSuggestions.projectMatches.length > 0 && (
                        <div className="p-3">
                          <p className="mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grayLight, fontFamily: sans }}>Projects</p>
                          {searchSuggestions.projectMatches.map(p => (
                            <div key={p.projectId}
                              onClick={() => { commitRecent(p.title); setSearchFocused(false); openInModal(p, 0); }}
                              className="flex items-center gap-3 px-2 py-2 rounded-[8px] hover:bg-[#f0ede6] cursor-pointer">
                              <div className="w-12 h-12 rounded-[8px] overflow-hidden shrink-0" style={{ background: C.creamDark }}>
                                <img src={projectImages(p)[0]} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium truncate" style={{ color: C.black, fontFamily: sans }}>{p.title}</p>
                                <p className="text-[12px] truncate" style={{ color: C.grayLight, fontFamily: sans }}>{p.designerName}{p.meta ? ` · ${p.meta}` : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No matches */}
                  {searchQuery.trim() && !searchSuggestions && (
                    <div className="p-6 text-center">
                      <p className="text-[14px]" style={{ color: C.grayLight, fontFamily: sans }}>
                        No matches for <span style={{ color: C.black, fontWeight: 600 }}>"{searchQuery}"</span>. Press Enter to search anyway.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 h-[56px] px-5 text-[14px] font-medium cursor-pointer shrink-0 md:min-w-[140px]"
              style={{ background: showFilters || hasFilters ? C.black : C.white, color: showFilters || hasFilters ? C.white : C.black, border: `1px solid ${showFilters || hasFilters ? C.black : C.creamBorder}`, borderRadius: "14px", fontFamily: sans, transition: "all 0.15s" }}>
              <SlidersHorizontal size={15} />
              Filters
              {hasFilters && (
                <span className="ml-0.5 w-[20px] h-[20px] rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums"
                  style={{ background: "#FFA929", color: C.white }}>
                  {activeStyles.size + activePropTypes.size + activeBudgets.size}
                </span>
              )}
            </button>
          </div>

          {/* Quick style chips (always visible) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium mr-1" style={{ color: C.grayLight, fontFamily: sans, letterSpacing: "0.04em" }}>Popular:</span>
            {STYLES.slice(0, 6).map(item => {
              const isActive = activeStyles.has(item);
              return (
                <button key={item} onClick={() => toggle(activeStyles, setActiveStyles, item)}
                  className="px-3.5 py-[7px] text-[13px] font-medium cursor-pointer whitespace-nowrap"
                  style={{ background: isActive ? C.black : "transparent", color: isActive ? C.white : C.gray, border: `1px solid ${isActive ? C.black : C.creamBorder}`, borderRadius: "999px", fontFamily: sans, transition: "all 0.15s" }}>
                  {item}
                </button>
              );
            })}
            {hasFilters && (
              <button onClick={clearAll} className="ml-1 text-[13px] font-normal cursor-pointer hover:opacity-60"
                style={{ color: C.grayLight, fontFamily: sans, transition: "all 0.15s", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className="p-5 md:p-6 space-y-4 mt-4" style={{ background: C.white, border: `1px solid ${C.creamBorder}`, borderRadius: "14px" }}>
              <FilterGroup icon={Palette} label="Design Style" items={STYLES} active={activeStyles} toggle={v => toggle(activeStyles, setActiveStyles, v)} />
              <FilterGroup icon={Building2} label="Property Type" items={PROPERTY_TYPES} active={activePropTypes} toggle={v => toggle(activePropTypes, setActivePropTypes, v)} />
              <FilterGroup icon={DollarSign} label="Budget Range" items={BUDGETS} active={activeBudgets} toggle={v => toggle(activeBudgets, setActiveBudgets, v)} />
            </div>
          )}
        </div>
      </div>

      {/* MASONRY GRID */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 pb-16">
        {loading ? (
          <>
            <div className="h-[18px] w-[100px] mb-3 rounded" style={{ background: C.creamDark }} />
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4">
              {Array.from({ length: 18 }).map((_, i) => <PinSkeleton key={i} index={i} />)}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search size={40} className="mx-auto mb-3" style={{ color: C.creamBorder }} />
            <p className="text-[20px] font-normal" style={{ fontFamily: serif, color: C.black }}>{hasFilters ? "No projects match your filters" : "No projects yet"}</p>
            <p className="text-[14px] font-normal mt-2 mb-5" style={{ color: C.grayLight, fontFamily: sans }}>{hasFilters ? "Try adjusting your filters" : "Projects from verified designers will appear here"}</p>
            {hasFilters && <button onClick={clearAll} className="px-6 py-2.5 text-[14px] font-normal cursor-pointer hover:opacity-85"
              style={{ background: C.black, color: C.white, borderRadius: "12px", fontFamily: sans, transition: "all 0.15s" }}>Clear Filters</button>}
          </div>
        ) : (() => {
          // Only render up to `exploreVisibleCount` pins; more load on scroll.
          const visiblePins = pins.slice(0, exploreVisibleCount);
          const hasMoreExplore = exploreVisibleCount < pins.length;
          const SPLIT_AT = colCount * 4;
          const showStudiosBreak = recommendedDesigners.length > 0 && visiblePins.length > SPLIT_AT + colCount;

          // Distribute pins into balanced columns using shortest-column-first.
          // hashAspect returns paddingBottom% (image's aspect-derived height).
          // +6 approximates the 16px mb-4 gap as % of a column width.
          const pinH = (pin: typeof pins[number]) => hashAspect(`${pin.project.projectId}-${pin.image}`) + 6;
          const distribute = (items: typeof pins) => {
            const cols: { items: typeof pins; h: number }[] = Array.from({ length: colCount }, () => ({ items: [], h: 0 }));
            for (const pin of items) {
              let shortestIdx = 0;
              for (let i = 1; i < cols.length; i++) if (cols[i].h < cols[shortestIdx].h) shortestIdx = i;
              cols[shortestIdx].items.push(pin);
              cols[shortestIdx].h += pinH(pin);
            }
            return cols;
          };

          // Build first batch with flush-bottom trim: distribute, then pop pins from
          // tall columns until all columns end near the shortest column's height.
          let firstBatch: typeof pins = [];
          let secondBatch: typeof pins = [];
          if (showStudiosBreak) {
            const initial = visiblePins.slice(0, SPLIT_AT);
            const remaining = visiblePins.slice(SPLIT_AT);
            const trimCols = distribute(initial);
            // Track original index for stable re-ordering
            const indexOf = new Map(initial.map((p, i) => [p.pinId, i]));
            const overflow: typeof pins = [];
            const minH = Math.min(...trimCols.map(c => c.h));
            for (const col of trimCols) {
              while (col.items.length > 1 && col.h - minH > 15) {
                const popped = col.items.pop()!;
                overflow.push(popped);
                col.h -= pinH(popped);
              }
            }
            // Sort overflow by original index so order is preserved
            overflow.sort((a, b) => (indexOf.get(a.pinId) || 0) - (indexOf.get(b.pinId) || 0));
            firstBatch = trimCols.flatMap(c => c.items);
            // Re-sort firstBatch by original index too for consistency
            firstBatch.sort((a, b) => (indexOf.get(a.pinId) || 0) - (indexOf.get(b.pinId) || 0));
            secondBatch = [...overflow, ...remaining];
          } else {
            firstBatch = visiblePins;
          }

          const renderColumns = (items: typeof pins) => (
            <div className="flex gap-4">
              {distribute(items).map((col, ci) => (
                <div key={ci} className="flex-1 min-w-0">
                  {col.items.map(pin => (
                    <Pin key={pin.pinId} project={pin.project} image={pin.image} saved={savedIds.has(pin.project.projectId)} onSave={() => toggleSave(pin.project, pin.image)} onOpen={() => openInModal(pin.project, pin.imageIndex)} />
                  ))}
                </div>
              ))}
            </div>
          );

          return (
            <>
              {renderColumns(firstBatch)}

              {/* Studios break — inline within the masonry */}
              {showStudiosBreak && (
                <div className="my-6 md:my-8 p-6 md:p-8" style={{ background: C.black, borderRadius: 16, color: C.white, fontFamily: sans }}>
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="text-[22px] md:text-[26px] font-normal" style={{ fontFamily: serif, color: C.white }}>
                      Studios for you
                    </h2>
                    <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Ranked by matches
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {recommendedDesigners.map(({ designer, matches }) => {
                      const previews = matches.slice(0, 3).map(m => projectImages(m)[0]).filter(Boolean);
                      const r = ratingsBySlug[designer.designerSlug];
                      const propTypes = Array.from(new Set(matches.map(m => m.propertyType).filter(Boolean))).slice(0, 3);
                      return (
                        <Link key={designer.designerSlug} to={`/designer/${designer.designerSlug}`}
                          className="group p-4 flex flex-col gap-3 no-underline cursor-pointer hover:scale-[1.01]"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, fontFamily: sans, color: C.white, transition: "all 0.15s" }}>
                          {/* Top row: logo + name + meta */}
                          <div className="flex gap-3 items-start">
                            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)" }}>
                              {designer.designerLogo
                                ? <img src={designer.designerLogo} alt="" className="w-full h-full object-cover" />
                                : <span className="text-[20px] font-semibold" style={{ color: C.white }}>{(designer.designerName || "D")[0].toUpperCase()}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[15px] font-semibold truncate" style={{ color: C.white }}>{designer.designerName}</span>
                                {designer.verified && (
                                  <span className="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0" style={{ background: "#2b7fff" }}>
                                    <Check size={9} className="text-white" strokeWidth={3} />
                                  </span>
                                )}
                              </div>
                              {/* Rating row */}
                              <div className="flex items-center gap-1.5 text-[12px] tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
                                {r && r.rating > 0 ? (
                                  <>
                                    <Star size={12} fill="#FFA929" stroke="#FFA929" />
                                    <span className="font-semibold">{r.rating.toFixed(1)}</span>
                                    <span style={{ color: "rgba(255,255,255,0.45)" }}>({r.totalRatings.toLocaleString()} reviews)</span>
                                  </>
                                ) : r === undefined ? (
                                  <span style={{ color: "rgba(255,255,255,0.35)" }}>Loading rating…</span>
                                ) : (
                                  <span style={{ color: "rgba(255,255,255,0.45)" }}>New on Network</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stat row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                            <span><span className="tabular-nums font-semibold" style={{ color: C.white }}>{matches.length}</span> matching project{matches.length !== 1 ? "s" : ""}</span>
                            {propTypes.length > 0 && (
                              <>
                                <span aria-hidden style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                                <span className="flex items-center gap-1"><MapPin size={11} />{propTypes.join(" · ")}</span>
                              </>
                            )}
                          </div>

                          {/* Thumbnail strip */}
                          <div className="flex gap-1.5">
                            {previews.map((src, i) => (
                              <div key={i} className="flex-1 aspect-square rounded-[8px] overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            ))}
                          </div>

                          {/* CTA pill */}
                          <span className="inline-flex items-center justify-center gap-1.5 mt-1 px-3 py-2 text-[12px] font-medium rounded-[8px] group-hover:opacity-90"
                            style={{ background: C.white, color: C.black, transition: "all 0.15s" }}>
                            View studio →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {secondBatch.length > 0 && renderColumns(secondBatch)}

              {/* Skeleton row while next batch is being added on scroll */}
              {hasMoreExplore && (
                <div className="flex gap-4 mt-4">
                  {Array.from({ length: colCount }).map((_, ci) => (
                    <div key={ci} className="flex-1 min-w-0">
                      {Array.from({ length: 2 }).map((_, si) => <PinSkeleton key={si} index={ci * 9 + si} />)}
                    </div>
                  ))}
                </div>
              )}
              {/* Sentinel for infinite scroll */}
              <div ref={exploreSentinelRef} aria-hidden style={{ height: 1, width: "100%" }} />
            </>
          );
        })()}
      </div>
      </div>

      {/* Project loading state — keeps the grid hidden while we resolve the project from the URL */}
      {projectIdParam && !modalProject && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-[100px] md:pt-[120px] pb-16" style={{ fontFamily: sans }}>
          <div className="flex gap-4 max-[900px]:flex-col">
            <div className="w-[50%] max-[900px]:w-full overflow-hidden h-[60vh]"
              style={{ background: C.creamDark, borderRadius: 24 }} />
            <div className="w-[50%] max-[900px]:w-full grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4]" style={{ background: C.creamDark, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROJECT PAGE — full-screen view at /explore/project/:projectId */}
      {modalProject && (() => {
        const allImgs = projectImages(modalProject);
        const safeIdx = Math.min(modalImageIndex, Math.max(0, allImgs.length - 1));
        const current = allImgs[safeIdx] || modalProject.image;
        const isSaved = savedIds.has(modalProject.projectId);

        // Build "More to explore" pin list — first 6 stack vertically next to the image card,
        // the rest flow into a full-width balanced masonry below.
        // Slice the stable shuffled pool by the current page-size — no re-shuffle on scroll.
        const allMorePins = projectMorePinPool.slice(0, projectMoreCount);
        const hasMore = projectMoreCount < projectMorePinPool.length;
        // ONE 6-column masonry. Left 3 cols are virtually "preloaded" with the project card's
        // height so the shortest-column-first algorithm fills the right 3 cols first (next to
        // the card), then continues evenly across all 6 cols (below the card). This makes the
        // masonry visually flow around the card without an empty gap.
        const PAGE_COLS = 6;
        // Convert card-height (px) into a virtual column-height percentage. Each column is
        // roughly (pageWidth - padding - gaps) / PAGE_COLS wide. Approximate at ~210px.
        const APPROX_COL_WIDTH = 210;
        const cardVirtualH = projectCardHeight > 0 ? (projectCardHeight / APPROX_COL_WIDTH) * 100 : 0;
        const unifiedCols: { items: typeof allMorePins; h: number }[] = Array.from({ length: PAGE_COLS }, (_, i) => ({
          items: [],
          h: i < 3 ? cardVirtualH : 0, // left 3 start "tall", right 3 start at 0
        }));
        for (const pin of allMorePins) {
          const aspect = hashAspect(`${pin.project.projectId}-${pin.image}`);
          let shortest = 0;
          for (let i = 1; i < unifiedCols.length; i++) if (unifiedCols[i].h < unifiedCols[shortest].h) shortest = i;
          unifiedCols[shortest].items.push(pin);
          unifiedCols[shortest].h += aspect + 6;
        }

        return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-[90px] md:pt-[100px] pb-16" style={{ fontFamily: sans }}>
          {/* Top action bar */}
          <div className="flex items-center mb-5">
            <button onClick={closeProjectView}
              className="inline-flex items-center gap-1.5 h-10 pl-2 pr-4 rounded-full cursor-pointer hover:opacity-70"
              aria-label="Back to explore"
              style={{ background: "transparent", color: C.black, fontFamily: sans, transition: "all 0.15s" }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>‹</span>
              <span className="text-[14px] font-medium">Back</span>
            </button>
          </div>

          {/* Unified Pinterest layout: project card absolute over left half,
              one 6-col masonry that flows around it with no empty gaps. */}
          <div className="relative max-[900px]:static">

            {/* PROJECT CARD — absolute on lg+, normal flow on mobile */}
            <div ref={projectCardRef}
              className="lg:absolute lg:top-0 lg:left-0 w-[calc(50%-8px)] max-[900px]:w-full max-[900px]:mb-4 overflow-hidden flex flex-col z-[1]"
              style={{ background: C.white, borderRadius: 24, border: `1px solid ${C.creamBorder}`, boxShadow: "0 4px 24px rgba(15,15,13,0.05)" }}>

              {/* Single clicked image — preload smaller WebP, reveal once loaded */}
              <div className="relative flex items-center justify-center p-4 md:p-5" style={{ background: C.cream }}>
                {!mainImageLoaded && (
                  <div className="w-full" style={{
                    minHeight: "50vh",
                    borderRadius: 14,
                    background: `linear-gradient(90deg, ${C.creamDark} 25%, ${C.creamBorder} 50%, ${C.creamDark} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "exploreShimmer 1.5s infinite",
                  }} />
                )}
                <img
                  key={current}
                  src={thumbnailUrl(current, 1200, 80)}
                  srcSet={`${thumbnailUrl(current, 800, 75)} 1x, ${thumbnailUrl(current, 1600, 80)} 2x`}
                  alt={modalProject.title}
                  loading="eager"
                  decoding="async"
                  {...({ fetchpriority: "high" } as any)}
                  onLoad={() => setMainImageLoaded(true)}
                  className="w-full object-contain"
                  style={{
                    maxHeight: "70vh",
                    borderRadius: 14,
                    background: C.white,
                    position: mainImageLoaded ? "static" : "absolute",
                    opacity: mainImageLoaded ? 1 : 0,
                    transition: "opacity 0.2s",
                  }}
                />
              </div>

              {/* Project info — below the photo */}
              <div className="p-7 md:p-9 flex flex-col">
                {/* Top action row: Pin to board + Save */}
                <div className="flex items-center justify-end gap-2 mb-5">
                  <div className="relative">
                    <button onClick={() => {
                      if (!localStorage.getItem("homeowner-token")) { navigate("/profile"); return; }
                      setShowBoardPicker(!showBoardPicker);
                      setPinnedToBoard(null);
                    }}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium cursor-pointer hover:opacity-80"
                      style={{ background: C.cream, color: C.black, borderRadius: 999, border: `1px solid ${C.creamBorder}`, fontFamily: sans, transition: "all 0.15s" }}>
                      <Bookmark size={14} />
                      Pin to board
                    </button>
                    {showBoardPicker && (
                      <div className="absolute right-0 top-full mt-2 w-[260px] z-[100] shadow-lg overflow-hidden"
                        style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.creamBorder}` }}>
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
                  <button onClick={() => toggleSave(modalProject, current)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[13px] font-semibold cursor-pointer hover:opacity-90 active:scale-95"
                    style={{ background: isSaved ? "#FFA929" : C.black, color: C.white, borderRadius: 999, fontFamily: sans, transition: "all 0.15s" }}>
                    <Heart size={14} fill={isSaved ? "white" : "none"} strokeWidth={2.5} />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>

                <h1 className="text-[32px] md:text-[40px] font-normal leading-[1.1] mb-3" style={{ fontFamily: serif, color: C.black }}>{modalProject.title}</h1>
                <p className="text-[14px] font-normal mb-7" style={{ color: C.grayLight, fontFamily: sans }}>{modalProject.meta}</p>

                {/* Designer profile */}
                <div className="flex items-center gap-4 pb-6 mb-6" style={{ borderBottom: `1px solid ${C.creamBorder}` }}>
                  <Link to={`/designer/${modalProject.designerSlug}`} onClick={() => closeProjectView()}
                    className="w-[56px] h-[56px] rounded-full overflow-hidden shrink-0 flex items-center justify-center no-underline" style={{ background: C.black }}>
                    {modalProject.designerLogo
                      ? <img src={modalProject.designerLogo} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[20px] font-semibold" style={{ color: C.white, fontFamily: sans }}>{(modalProject.designerName || "D")[0].toUpperCase()}</span>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/designer/${modalProject.designerSlug}`} onClick={() => closeProjectView()}
                      className="flex items-center gap-1.5 no-underline" style={{ color: C.black }}>
                      <span className="text-[16px] font-semibold" style={{ fontFamily: sans }}>{modalProject.designerName}</span>
                      {modalProject.verified && <span className="w-4 h-4 rounded-full inline-flex items-center justify-center" style={{ background: "#2b7fff" }}><Check size={9} className="text-white" strokeWidth={3} /></span>}
                    </Link>
                  </div>
                  <Link to={`/designer/${modalProject.designerSlug}`} onClick={() => closeProjectView()}
                    className="h-9 px-4 text-[13px] font-medium no-underline flex items-center"
                    style={{ background: C.cream, color: C.black, borderRadius: 999, border: `1px solid ${C.creamBorder}`, fontFamily: sans }}>
                    View profile
                  </Link>
                </div>

                {/* Enquire CTA — goes to the designer's full project page where the enquiry form lives */}
                <Link to={`/designer/${modalProject.designerSlug}/project/${encodeURIComponent(modalProject.projectId)}`} onClick={() => closeProjectView()}
                  className="inline-flex items-center justify-center w-full h-12 text-[15px] font-semibold no-underline hover:opacity-90 active:scale-[0.99]"
                  style={{ background: C.black, color: C.white, borderRadius: 12, fontFamily: sans, transition: "all 0.15s" }}>
                  Enquire about this project
                </Link>
              </div>
            </div>

            {/* UNIFIED 6-COL MASONRY — left 3 cols start below the card, right 3 start at top */}
            <div className="flex gap-4">
              {unifiedCols.map((col, ci) => (
                <div key={ci} className="flex-1 min-w-0"
                  style={{ paddingTop: ci < 3 && projectCardHeight > 0 ? projectCardHeight + 16 : 0 }}>
                  {col.items.map(pin => (
                    <Pin key={pin.pinId} project={pin.project} image={pin.image} saved={savedIds.has(pin.project.projectId)} onSave={() => toggleSave(pin.project, pin.image)} onOpen={() => openInModal(pin.project, pin.imageIndex)} />
                  ))}
                </div>
              ))}
            </div>
            {/* Loading skeletons for the next batch (shown only when more pins are still available) */}
            {hasMore && (
              <div className="flex gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, ci) => (
                  <div key={ci} className="flex-1 min-w-0">
                    {Array.from({ length: 2 }).map((_, si) => <PinSkeleton key={si} index={ci * 7 + si} />)}
                  </div>
                ))}
              </div>
            )}
            {/* Sentinel for infinite scroll — when this enters the viewport, load more pins */}
            <div ref={moreSentinelRef} aria-hidden style={{ height: 1, width: "100%" }} />
          </div>

        </div>
        );
      })()}
    </div>
  );
}

// ─── PIN COMPONENT ────────────────────────────────────────────────
function PinSkeleton({ index }: { index: number }) {
  const aspect = useMemo(() => hashAspect(`sk-${index}`), [index]);
  return (
    <div
      className="relative overflow-hidden mb-4"
      style={{
        paddingBottom: `${aspect}%`,
        height: 0,
        background: `linear-gradient(90deg, ${C.creamDark} 25%, ${C.creamBorder} 50%, ${C.creamDark} 75%)`,
        backgroundSize: "200% 100%",
        animation: "exploreShimmer 1.5s infinite",
        borderRadius: "12px",
      }}
    />
  );
}

function Pin({ project, image, saved, onSave, onOpen, mini }: { project: any; image?: string; saved: boolean; onSave: () => void; onOpen: () => void; mini?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const src = image || project.image;
  const aspect = useMemo(() => hashAspect(`${project.projectId || "x"}-${src || ""}`, mini), [project.projectId, src, mini]);

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

      {/* Image — served as a smaller WebP thumbnail for the grid */}
      <img
        src={thumbnailUrl(src, mini ? 240 : 480, 70)}
        srcSet={mini
          ? `${thumbnailUrl(src, 240, 70)} 1x, ${thumbnailUrl(src, 480, 70)} 2x`
          : `${thumbnailUrl(src, 480, 70)} 1x, ${thumbnailUrl(src, 960, 70)} 2x`}
        alt={project.title} loading="lazy" decoding="async"
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

      {/* Designer hover (top-left). Right inset reserves space for the save button so long
          studio names wrap to a second line instead of sliding under the heart. */}
      <div className="absolute top-3 left-3 right-12 z-[5] flex items-start gap-2 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none"
        style={mini ? { top: 8, left: 8, right: 36, gap: 6 } : undefined}>
        <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 border-white"
          style={{ width: mini ? 24 : 32, height: mini ? 24 : 32, background: C.black }}>
          {project.designerLogo
            ? <img src={project.designerLogo} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-semibold" style={{ fontSize: mini ? 9 : 11, fontFamily: sans }}>{(project.designerName || "D")[0].toUpperCase()}</span>}
        </div>
        <span className="text-white font-semibold drop-shadow-md min-w-0 flex-1"
          style={{
            fontSize: mini ? 11 : 13,
            fontFamily: sans,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}>{project.designerName}</span>
        {project.verified && (
          <span className="rounded-full bg-[#2b7fff] inline-flex items-center justify-center shrink-0 mt-1" style={{ width: mini ? 12 : 14, height: mini ? 12 : 14 }}>
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

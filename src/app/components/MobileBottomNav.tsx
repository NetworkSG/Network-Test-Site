import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sofa, TreePine, Search, Hammer,
  Square, PenTool, DoorOpen, Grid3X3, Trash2,
  Undo2, Redo2, Check, X, Sparkles,
  ChevronUp, Paintbrush, ChevronRight, ChevronLeft,
  Home, Bed, Box, Armchair, CookingPot, Bath, Lamp,
  Monitor, Flower2, Footprints, ShowerHead, CircleDot, Fan, Wine, Circle,
  // Additional icons
  Lightbulb, Plug, Tv, Laptop, Speaker, Flame, Music, Dumbbell,
  Waves, User, Frame, Thermometer, Baby, UtensilsCrossed,
  PawPrint, Car, Landmark, Building2, Wind, Archive,
  Fish, Bike, Gamepad2, Layers,
  FileText,
} from "lucide-react";
import type { EditorTool } from "./BuildPanel";

/** Custom L-shaped room icon */
function RoomLIcon({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4v16h16v-9h-9V4z" />
    </svg>
  );
}

/* ===================================================================
   Types
   =================================================================== */
export type MobileNavTab = "construction" | "interior" | "search";

interface RoomDef {
  id: string;
  label: string;
  shortLabel: string;
  accent: string;
}

interface CatalogItemDef {
  id: string;
  name: string;
  category: string;
  icon: typeof Sofa;
  dimensions: [number, number, number];
  color: string;
}

export interface MobileBottomNavProps {
  is2DMode: boolean;
  onToggleMode: (mode: boolean) => void;
  rooms: RoomDef[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  catalog: CatalogItemDef[];
  onAddFurniture: (item: CatalogItemDef) => void;
  onAutoFurnish?: () => void;
  activeRoomLabel?: string;
  onOpenCustomize?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRender?: () => void;
  visible?: boolean;
  renderThumbnail?: (itemId: string, color: string) => string | null;
  onAddRoomShape?: (shape: { id: string; polygon?: [number, number][]; width: number; depth: number }) => void;
}

/* ===================================================================
   Constants
   =================================================================== */
const PEEK_HEIGHT = 340;
const FULL_HEIGHT_VH = 78;
const SNAP_THRESHOLD = 60;

const TABS: { id: MobileNavTab; icon: typeof Hammer; label: string }[] = [
  { id: "construction", icon: Home, label: "Construc..." },
  { id: "interior", icon: Sofa, label: "Interior" },
  { id: "search", icon: Search, label: "Search" },
];

const CONSTRUCTION_TOOLS: { id: EditorTool; icon: typeof Square; label: string; desc: string }[] = [
  { id: "draw-room", icon: Square, label: "Draw Room", desc: "Draw rectangular rooms" },
  { id: "draw-walls", icon: PenTool, label: "Draw Walls", desc: "Draw custom wall segments" },
  { id: "add-door", icon: DoorOpen, label: "Add Door", desc: "Place doors on walls" },
  { id: "add-window", icon: Grid3X3, label: "Add Window", desc: "Place windows on walls" },
  { id: "delete", icon: Trash2, label: "Delete", desc: "Remove elements" },
];

/* ── Category definitions for each tab ── */
interface CategoryDef {
  id: string;
  label: string;
  icon: typeof Sofa;
  catalogCategories: string[];
}

interface CategoryGroup {
  title?: string;
  categories: CategoryDef[];
}

const CONSTRUCTION_CATEGORIES: CategoryDef[] = [
  { id: "c-windows", label: "Windows", icon: Grid3X3, catalogCategories: [] },
  { id: "c-archs", label: "Archs", icon: DoorOpen, catalogCategories: [] },
  { id: "c-doors", label: "Doors", icon: DoorOpen, catalogCategories: [] },
  { id: "c-partitions", label: "Partitions", icon: Landmark, catalogCategories: [] },
  { id: "c-stairs", label: "Stairs", icon: Footprints, catalogCategories: [] },
  { id: "c-columns", label: "Columns", icon: Landmark, catalogCategories: [] },
  { id: "c-garage-doors", label: "Garage Doors", icon: Building2, catalogCategories: [] },
  { id: "c-fences", label: "Fences and gates", icon: Square, catalogCategories: [] },
  { id: "c-roofs", label: "Roofs", icon: Home, catalogCategories: [] },
  { id: "c-terraces", label: "Terraces", icon: Building2, catalogCategories: [] },
];

const INTERIOR_GROUPS: CategoryGroup[] = [
  {
    title: "Furniture",
    categories: [
      { id: "upholstered", label: "Upholstered furniture", icon: Sofa, catalogCategories: ["seating"] },
      { id: "beds-cat", label: "Beds", icon: Bed, catalogCategories: ["beds"] },
      { id: "storage-cat", label: "Storage", icon: Archive, catalogCategories: ["storage"] },
      { id: "tables-chairs", label: "Tables, chairs", icon: Square, catalogCategories: ["tables"] },
      { id: "office-cat", label: "Office furniture", icon: Monitor, catalogCategories: ["office"] },
      { id: "children-cat", label: "Children's furniture", icon: Baby, catalogCategories: ["children"] },
      { id: "kitchen-cat", label: "Kitchen", icon: CookingPot, catalogCategories: ["kitchen"] },
      { id: "bathroom-cat", label: "Bathroom", icon: Bath, catalogCategories: ["bathroom"] },
      { id: "public-spaces-cat", label: "Furniture for public spaces", icon: Building2, catalogCategories: ["public-spaces"] },
    ],
  },
  {
    title: "Electrical appliances",
    categories: [
      { id: "lighting-cat", label: "Lighting", icon: Lightbulb, catalogCategories: ["lighting"] },
      { id: "sockets-cat", label: "Sockets, switches", icon: Plug, catalogCategories: ["sockets"] },
      { id: "household-cat", label: "Household appliances", icon: CookingPot, catalogCategories: ["household"] },
      { id: "video-tv-cat", label: "Video and TV", icon: Monitor, catalogCategories: ["video-tv"] },
      { id: "kitchen-app-cat", label: "Kitchen appliances", icon: CookingPot, catalogCategories: ["kitchen-appliances"] },
      { id: "climate-cat", label: "Climate", icon: Thermometer, catalogCategories: ["climate"] },
      { id: "computers-cat", label: "Computers", icon: Laptop, catalogCategories: ["computers"] },
      { id: "audio-cat", label: "Audio", icon: Music, catalogCategories: ["audio"] },
      { id: "equipment-cat", label: "Equipment", icon: Dumbbell, catalogCategories: ["equipment"] },
    ],
  },
  {
    title: "Misc",
    categories: [
      { id: "decor-cat", label: "Decor", icon: Frame, catalogCategories: ["decor"] },
      { id: "curtains-cat", label: "Curtains, blinds", icon: Layers, catalogCategories: ["curtains"] },
      { id: "rugs-cat", label: "Rugs", icon: Circle, catalogCategories: ["rugs"] },
      { id: "kitchenware-cat", label: "Kitchenware", icon: UtensilsCrossed, catalogCategories: ["kitchenware"] },
      { id: "fireplaces-cat", label: "Fireplaces", icon: Flame, catalogCategories: ["fireplaces"] },
      { id: "plants-cat", label: "Plants", icon: Flower2, catalogCategories: ["plants"] },
      { id: "people-cat", label: "People", icon: User, catalogCategories: ["people"] },
      { id: "musical-cat", label: "Musical Instruments", icon: Music, catalogCategories: ["musical-instruments"] },
      { id: "sport-cat", label: "Sport", icon: Dumbbell, catalogCategories: ["sport"] },
      { id: "holidays-cat", label: "Holidays", icon: TreePine, catalogCategories: ["holidays"] },
      { id: "pets-cat", label: "Pets", icon: PawPrint, catalogCategories: ["pets"] },
    ],
  },
];

/* Room shape presets — SVG path for display + polygon/dimensions for placement */
const ROOM_SHAPES: {
  id: string; path: string;
  width: number; depth: number;
  polygon?: [number, number][];
}[] = [
  // Rectangles
  { id: "rect", path: "M3 5h18v14H3z", width: 4.0, depth: 3.0 },
  { id: "rect-wide", path: "M2 7h20v10H2z", width: 5.0, depth: 2.5 },
  { id: "square", path: "M4 4h16v16H4z", width: 3.5, depth: 3.5 },
  { id: "rect-tall", path: "M6 2h12v20H6z", width: 2.5, depth: 4.0 },
  // L-shapes (polygon coordinates relative to 0,0 origin)
  { id: "l-shape-1", path: "M3 3v18h10v-10h8V3z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[5,0],[5,2.5],[2.5,2.5],[2.5,5],[0,5]] },
  { id: "l-shape-2", path: "M3 3v8h8v10h10V3z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[5,0],[5,5],[2.5,5],[2.5,2.2],[0,2.2]] },
  { id: "l-shape-3", path: "M3 3h18v18h-10v-10H3z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[5,0],[5,5],[2.5,5],[2.5,2.5],[0,2.5]] },
  { id: "l-shape-4", path: "M13 3v10h8v8H3V3z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[2.5,0],[2.5,2.5],[5,2.5],[5,5],[0,5]] },
  // T-shapes
  { id: "t-shape", path: "M2 3h20v7h-6v11H8V10H2z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[5,0],[5,2],[3.5,2],[3.5,5],[1.5,5],[1.5,2],[0,2]] },
  { id: "t-shape-inv", path: "M8 3h8v11h6v7H2v-7h6z", width: 5.0, depth: 5.0,
    polygon: [[1.5,0],[3.5,0],[3.5,3],[5,3],[5,5],[0,5],[0,3],[1.5,3]] },
  // U-shape
  { id: "u-shape", path: "M3 3h5v12h8V3h5v18H3z", width: 5.0, depth: 5.0,
    polygon: [[0,0],[1.5,0],[1.5,3.5],[3.5,3.5],[3.5,0],[5,0],[5,5],[0,5]] },
  // Plus
  { id: "plus", path: "M8 3h8v5h5v8h-5v5H8v-5H3v-8h5z", width: 5.0, depth: 5.0,
    polygon: [[1.5,0],[3.5,0],[3.5,1.5],[5,1.5],[5,3.5],[3.5,3.5],[3.5,5],[1.5,5],[1.5,3.5],[0,3.5],[0,1.5],[1.5,1.5]] },
];

/* ===================================================================
   Sub-Components
   =================================================================== */

/** Category list row — used in Construction, Interior, Exterior tabs */
function CategoryRow({ cat, onSelect }: { cat: CategoryDef; onSelect: () => void }) {
  const Icon = cat.icon;
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left active:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-b-0"
    >
      <div className="size-[36px] rounded-[10px] bg-[#F6F6F6] flex items-center justify-center shrink-0">
        <Icon className="size-[18px] text-[#71717A]" strokeWidth={1.5} />
      </div>
      <span className="font-['Inter',sans-serif] text-[15px] text-[#09090B] tracking-[-0.3px] flex-1 min-w-0 truncate">
        {cat.label}
      </span>
      <ChevronRight className="size-[16px] text-[#C0C0C0] shrink-0" strokeWidth={1.5} />
    </button>
  );
}

/** Single item thumbnail with lazy 3D render */
function ItemThumbnail({ item, renderFn }: { item: CatalogItemDef; renderFn?: (id: string, color: string) => string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const Icon = item.icon;

  useEffect(() => {
    if (!renderFn) return;
    const id = requestAnimationFrame(() => {
      try { setSrc(renderFn(item.id, item.color)); } catch { /* fallback to icon */ }
    });
    return () => cancelAnimationFrame(id);
  }, [item.id, item.color, renderFn]);

  if (src) {
    return <img src={src} alt={item.name} className="w-[60%] h-[60%] object-contain" draggable={false} />;
  }
  return <Icon className="size-[32%] text-[#71717A]" strokeWidth={1.2} />;
}

/** Items grid — shown when a category is selected */
function ItemsGrid({ items, onAdd, renderThumbnail }: { items: CatalogItemDef[]; onAdd: (item: CatalogItemDef) => void; renderThumbnail?: (id: string, color: string) => string | null }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Box className="size-[32px] text-[#E5E7EB] mx-auto mb-2" strokeWidth={1} />
        <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A]">No items in this category yet</p>
        <p className="font-['Inter',sans-serif] text-[11px] text-[#C0C0C0] mt-1">Coming soon</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAdd(item)}
          className="group flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className="w-full aspect-square bg-[#F9FAFB] rounded-[12px] flex items-center justify-center border border-[#F3F4F6] group-active:bg-[#F3F4F6] transition-colors">
            <ItemThumbnail item={item} renderFn={renderThumbnail} />
          </div>
          <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A] text-center leading-tight line-clamp-2">
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Sub-header with back button for drill-down views */
function DrillDownHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F3F4F6]">
      <button
        onClick={onBack}
        className="size-[32px] rounded-full bg-[#F6F6F6] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
      >
        <ChevronLeft className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
      </button>
      <h3 className="font-['Inter',sans-serif] text-[15px] font-bold text-[#09090B] tracking-[-0.5px] truncate flex-1">
        {title}
      </h3>
    </div>
  );
}

/* ===================================================================
   Main Component
   =================================================================== */
export function MobileBottomNav({
  is2DMode, onToggleMode,
  rooms, activeRoomId, onSelectRoom,
  activeTool, onToolChange,
  catalog, onAddFurniture, onAutoFurnish, activeRoomLabel,
  onOpenCustomize,
  onUndo, onRedo, canUndo, canRedo,
  onRender,
  visible = true,
  renderThumbnail,
  onAddRoomShape,
}: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState<MobileNavTab>("construction");
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Drill-down state: selected category within a tab
  const [selectedCategory, setSelectedCategory] = useState<CategoryDef | null>(null);
  // Construction sub-view: "categories" or "tools"
  const [constructionView, setConstructionView] = useState<"categories" | "tools">("categories");

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const isDraggingSheet = useRef(false);

  const fullHeightPx = typeof window !== "undefined" ? window.innerHeight * FULL_HEIGHT_VH / 100 : 600;

  const handleTabPress = useCallback((tab: MobileNavTab) => {
    if (activeTab === tab) {
      if (expanded) {
        setExpanded(false);
        setSheetHeight(0);
      } else {
        setExpanded(true);
        setSheetHeight(PEEK_HEIGHT);
      }
    } else {
      setActiveTab(tab);
      setSelectedCategory(null);
      setConstructionView("categories");
      if (!expanded) {
        setExpanded(true);
        setSheetHeight(PEEK_HEIGHT);
      }
    }
  }, [activeTab, expanded]);

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
    isDraggingSheet.current = true;
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingSheet.current) return;
    const delta = dragStartY.current - clientY;
    const newHeight = Math.max(0, Math.min(fullHeightPx, dragStartHeight.current + delta));
    setSheetHeight(newHeight);
  }, [fullHeightPx]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingSheet.current) return;
    isDraggingSheet.current = false;
    if (sheetHeight < SNAP_THRESHOLD) {
      setSheetHeight(0);
      setExpanded(false);
    } else if (sheetHeight < (PEEK_HEIGHT + fullHeightPx) / 2) {
      setSheetHeight(PEEK_HEIGHT);
      setExpanded(true);
    } else {
      setSheetHeight(fullHeightPx);
      setExpanded(true);
    }
  }, [sheetHeight, fullHeightPx]);

  const onHandleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onHandleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleDragEnd();
  }, [handleDragEnd]);

  // Filter catalog items by selected category
  const getCategoryItems = useCallback((cat: CategoryDef) => {
    return catalog.filter(item => cat.catalogCategories.includes(item.category));
  }, [catalog]);

  const searchResults = searchQuery.trim()
    ? catalog.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (!visible) return null;

  const contentHeight = Math.max(0, sheetHeight);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45]" style={{ touchAction: "none" }}>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {expanded && sheetHeight > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[-1]"
            onClick={() => { setExpanded(false); setSheetHeight(0); }}
          />
        )}
      </AnimatePresence>

      {/* ═══ Floating Controls — above the nav bar ═══ */}
      <div className="flex items-center justify-between px-3 pb-2.5">
        {/* 2D / 3D Toggle — above-left */}
        <div className="bg-white rounded-[100px] p-[3px] flex items-center gap-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-[#F3F4F6]">
          <button
            onClick={() => onToggleMode(false)}
            className={`px-3.5 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all active:scale-95 ${
              !is2DMode ? "bg-[#09090B] text-white shadow-sm" : "text-[#71717A]"
            }`}
          >3D</button>
          <button
            onClick={() => onToggleMode(true)}
            className={`px-3.5 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all active:scale-95 ${
              is2DMode ? "bg-[#09090B] text-white shadow-sm" : "text-[#71717A]"
            }`}
          >2D</button>
        </div>

        {/* Undo / Redo — above-right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`size-[38px] rounded-[12px] bg-white border border-[#F3F4F6] shadow-[0_4px_16px_rgba(0,0,0,0.10)] flex items-center justify-center transition-all active:scale-95 ${
              canUndo ? "text-[#09090B]" : "text-[#C0C0C0]"
            }`}
          >
            <Undo2 className="size-[16px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`size-[38px] rounded-[12px] bg-white border border-[#F3F4F6] shadow-[0_4px_16px_rgba(0,0,0,0.10)] flex items-center justify-center transition-all active:scale-95 ${
              canRedo ? "text-[#09090B]" : "text-[#C0C0C0]"
            }`}
          >
            <Redo2 className="size-[16px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ═══ Main Nav Bar ═══ */}
      <div
        ref={sheetRef}
        className="relative bg-[#F6F6F6] rounded-t-[20px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-[#E5E7EB]/50"
        style={{ touchAction: "none" }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-12 h-[5px] bg-[#C0C0C0] rounded-full" />
        </div>

        {/* Tab Bar */}
        <div className="flex items-end justify-around px-1 pb-2 pt-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab.id)}
                className="flex flex-col items-center gap-1 py-1 px-1.5 min-w-[48px] transition-all duration-200 active:scale-95"
              >
                <div className="size-[28px] flex items-center justify-center transition-colors duration-200">
                  <tab.icon
                    className={`size-[22px] transition-colors duration-200 ${isActive ? "text-[#09090B]" : "text-[#71717A]"}`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </div>
                <span className={`font-['Inter',sans-serif] text-[10px] tracking-[-0.2px] transition-colors duration-200 ${
                  isActive ? "text-[#09090B] font-semibold" : "text-[#71717A] font-medium"
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══ Expandable Content Area ═══ */}
        <div
          className="overflow-hidden"
          style={{ height: contentHeight, transition: isDraggingSheet.current ? "none" : "height 0.25s ease-out" }}
        >
          <AnimatePresence mode="wait">
            {expanded && contentHeight > 0 && (
              <motion.div
                key={activeTab + (selectedCategory?.id || "")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-t-[16px] mx-1 overflow-auto"
                style={{ height: contentHeight, maxHeight: contentHeight }}
              >
                {/* ═══════════════════════════════════════
                     ROOMS TAB
                   ═══════════════════════════════════════ */}
                {/* ═══════════════════════════════════════
                     CONSTRUCTION TAB
                   ═══════════════════════════════════════ */}
                {activeTab === "construction" && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <div className="px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-semibold tracking-[-0.3px] bg-[#09090B] text-white border border-[#09090B]">
                        Drawing Tools
                      </div>
                      {!is2DMode && (
                        <button
                          onClick={() => onToggleMode(true)}
                          className="ml-auto text-[#71717A] font-['Inter',sans-serif] text-[11px] font-medium active:scale-95"
                        >
                          Switch to 2D
                        </button>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      {CONSTRUCTION_TOOLS.map((tool) => {
                        const isActive = activeTool === tool.id && is2DMode;
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              if (!is2DMode) onToggleMode(true);
                              onToolChange(isActive ? "select" : tool.id);
                            }}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-[14px] border transition-all text-left active:scale-[0.98] ${
                              isActive
                                ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                                : "bg-[#F9FAFB] text-[#09090B] border-[#F3F4F6]"
                            }`}
                          >
                            <div className={`size-[36px] rounded-[10px] flex items-center justify-center shrink-0 ${
                              isActive ? "bg-white/15" : "bg-[#F3F4F6]"
                            }`}>
                              <Icon className="size-[18px]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] ${
                                isActive ? "text-white" : "text-[#09090B]"
                              }`}>{tool.label}</div>
                              <div className={`font-['Inter',sans-serif] text-[11px] mt-0.5 ${
                                isActive ? "text-white/60" : "text-[#71717A]"
                              }`}>{tool.desc}</div>
                            </div>
                            {isActive && (
                              <div className="size-[24px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Check className="size-[12px]" strokeWidth={2.5} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════
                     INTERIOR TAB
                   ═══════════════════════════════════════ */}
                {activeTab === "interior" && !selectedCategory && (
                  <div className="pb-4">
                    {INTERIOR_GROUPS.map((group, gi) => (
                      <div key={gi}>
                        {group.title && (
                          <div className="px-4 pt-4 pb-2">
                            <h4 className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.3px]">
                              {group.title}
                            </h4>
                          </div>
                        )}
                        {group.categories.map((cat) => (
                          <CategoryRow
                            key={cat.id}
                            cat={cat}
                            onSelect={() => setSelectedCategory(cat)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interior drill-down */}
                {activeTab === "interior" && selectedCategory && (
                  <div>
                    <DrillDownHeader
                      title={selectedCategory.label}
                      onBack={() => setSelectedCategory(null)}
                    />
                    <div className="p-4">
                      <ItemsGrid
                        items={getCategoryItems(selectedCategory)}
                        onAdd={(item) => { onAddFurniture(item); setExpanded(false); setSheetHeight(0); }}
                        renderThumbnail={renderThumbnail}
                      />
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════
                     SEARCH TAB
                   ═══════════════════════════════════════ */}
                {activeTab === "search" && (
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99A1AF]" strokeWidth={1.5} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search furniture, rooms..."
                          className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] pl-10 pr-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 size-[20px] rounded-full bg-[#E5E7EB] flex items-center justify-center"
                          >
                            <X className="size-[10px] text-[#71717A]" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                    {searchQuery.trim() ? (
                      <>
                        <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A] mb-3">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                        </p>
                        <ItemsGrid items={searchResults} onAdd={(item) => { onAddFurniture(item); setExpanded(false); setSheetHeight(0); }} renderThumbnail={renderThumbnail} />
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="size-[32px] text-[#E5E7EB] mx-auto mb-2" strokeWidth={1} />
                        <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A]">Search for furniture items</p>
                        <p className="font-['Inter',sans-serif] text-[11px] text-[#C0C0C0] mt-1">Try "sofa", "bed", "piano", "pool"...</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active tool indicator (when collapsed and a tool is active) */}
        <AnimatePresence>
          {!expanded && activeTool !== "select" && is2DMode && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2"
            >
              <div className="bg-[#09090B] text-white rounded-[100px] px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center gap-2">
                <span className="font-['Inter',sans-serif] text-[11px] font-medium whitespace-nowrap">
                  {activeTool === "draw-room" && "Drawing Room"}
                  {activeTool === "draw-walls" && "Drawing Walls"}
                  {activeTool === "add-door" && "Placing Door"}
                  {activeTool === "add-window" && "Placing Window"}
                  {activeTool === "delete" && "Delete Mode"}
                </span>
                <button
                  onClick={() => onToolChange("select")}
                  className="size-[18px] rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="size-[9px]" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
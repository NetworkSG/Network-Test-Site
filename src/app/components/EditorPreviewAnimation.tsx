import { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Move, Plus, MousePointer2, Sofa, Bed, CookingPot,
  Bath, Monitor, Square, Armchair, Lamp, Archive,
  ChevronLeft, ChevronRight, Save, Sparkles, Undo2, Redo2,
  FileText, Home, TreePine, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { renderFurnitureTopDown } from "./FurnitureTopDown";

/*
 * EditorPreviewAnimation
 * Desktop: side panel layout matching the editor toolbar
 * Mobile: bottom sheet layout matching the mobile editor (tabs + category list)
 */

/* ─── Floor plan origin & total span ─── */
const FP_OX = -3.05;
const FP_OZ = -5.85;
const FP_W = 6.1;
const FP_H = 11.7;

/* ─── Layout state ─── */
interface Layout {
  scale: number;
  stretchX: number;
  offX: number;
  offY: number;
  canW: number;
  canH: number;
}

const DEFAULT_LAYOUT: Layout = { scale: 30, stretchX: 1.9, offX: 0, offY: 0, canW: 400, canH: 300 };

/* ─── Room definitions (metres) ─── */
interface RoomDef {
  id: string;
  label: string;
  x1: number; z1: number;
  x2: number; z2: number;
  floor: string;
}

const ROOMS: RoomDef[] = [
  { id: "kitchen",  label: "Kitchen",   x1: -3.05, z1: -5.85, x2: -0.95, z2: -0.05, floor: "#F0EDE8" },
  { id: "bath2",    label: "Bath 2",    x1: -0.95, z1: -5.85, x2:  0.55, z2: -4.35, floor: "#D6E4E0" },
  { id: "bath1",    label: "Bath 1",    x1: -0.95, z1: -4.35, x2:  0.55, z2: -2.85, floor: "#D6E4E0" },
  { id: "master",   label: "Master",    x1:  0.55, z1: -4.85, x2:  3.05, z2: -0.35, floor: "#D4B896" },
  { id: "store",    label: "Store",     x1: -1.85, z1: -1.25, x2: -0.45, z2: -0.05, floor: "#B8B0A6" },
  { id: "corridor", label: "Corridor",  x1: -0.45, z1: -2.85, x2:  0.55, z2: -0.05, floor: "#C8C3BC" },
  { id: "living",   label: "Living",    x1: -3.05, z1: -0.05, x2:  0.15, z2:  5.15, floor: "#E8DCCA" },
  { id: "bedroom",  label: "Bedroom 2", x1:  0.15, z1:  0.95, x2:  3.05, z2:  5.15, floor: "#D4B896" },
  { id: "balcony",  label: "Balcony",   x1: -3.05, z1:  5.15, x2:  3.05, z2:  5.85, floor: "#B8B0A6" },
];

/* ─── Furniture definitions ─── */
interface FurnitureDef {
  id: string;
  fid: string;
  label: string;
  x: number; z: number;
  w: number; h: number;
  color: string;
}

const FURNITURE: FurnitureDef[] = [
  { id: "counter",  fid: "kitchen-counter", label: "L-Counter",   x: -2.9,  z: -5.6,  w: 1.6,  h: 0.6,  color: "#FFFFFF" },
  { id: "fridge",   fid: "fridge",          label: "Fridge",       x: -2.9,  z: -3.5,  w: 0.7,  h: 0.78, color: "#D0D0D0" },
  { id: "sofa",     fid: "sofa",            label: "3-Seat Sofa",  x: -2.9,  z: 0.2,   w: 2.1,  h: 0.85, color: "#8A8A8A" },
  { id: "coffee",   fid: "coffee-table",    label: "Coffee Table", x: -2.0,  z: 1.8,   w: 1.0,  h: 0.5,  color: "#C4A46C" },
  { id: "tv",       fid: "tv-console",      label: "TV Console",   x: -2.8,  z: 4.2,   w: 1.8,  h: 0.4,  color: "#6B4E35" },
  { id: "armchair", fid: "armchair",        label: "Armchair",     x: -0.65, z: 2.8,   w: 0.8,  h: 0.8,  color: "#8A8A8A" },
  { id: "bed",      fid: "queen-bed",       label: "Queen Bed",    x: 0.75,  z: -4.0,  w: 1.53, h: 2.03, color: "#E8E0D4" },
  { id: "wardrobe", fid: "wardrobe",        label: "Wardrobe",     x: 2.4,   z: -4.6,  w: 0.5,  h: 1.2,  color: "#FFFFFF" },
  { id: "single",   fid: "single-bed",      label: "Single Bed",   x: 0.4,   z: 1.5,   w: 0.91, h: 1.9,  color: "#E8E0D4" },
  { id: "desk",     fid: "desk",            label: "Study Desk",   x: 1.8,   z: 1.5,   w: 1.0,  h: 0.6,  color: "#C4A46C" },
  { id: "toilet",   fid: "toilet",          label: "Toilet",       x: -0.8,  z: -4.0,  w: 0.4,  h: 0.65, color: "#F5F5F5" },
  { id: "basin",    fid: "wash-basin",      label: "Basin",        x: 0.0,   z: -4.0,  w: 0.45, h: 0.4,  color: "#F5F5F5" },
];

const FURNITURE_MOVED: Record<string, { x: number; z: number }> = {
  sofa:   { x: -2.8, z: 0.3 },
  coffee: { x: -1.9, z: 1.9 },
  bed:    { x: 0.85, z: -3.9 },
};

/* ─── Desktop panel items ─── */
const PANEL_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Sofa,      label: "Seating" },
  { icon: Bed,       label: "Beds" },
  { icon: Square,    label: "Tables" },
  { icon: CookingPot,label: "Kitchen" },
  { icon: Bath,      label: "Bath" },
  { icon: Monitor,   label: "Office" },
  { icon: Lamp,      label: "Lighting" },
  { icon: Archive,   label: "Storage" },
];

/* ─── Mobile bottom sheet category items (matches editor) ─── */
const MOBILE_CATEGORIES: { icon: LucideIcon; label: string }[] = [
  { icon: Sofa,      label: "Upholstered furniture" },
  { icon: Bed,       label: "Beds" },
  { icon: Archive,   label: "Storage" },
  { icon: Square,    label: "Tables, chairs" },
  { icon: Monitor,   label: "Office furniture" },
  { icon: CookingPot,label: "Kitchen" },
  { icon: Bath,      label: "Bathroom" },
];

/* ─── Mobile bottom nav tabs (matches editor) ─── */
const MOBILE_TABS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "rooms",        icon: FileText, label: "Rooms" },
  { id: "construction", icon: Home,     label: "Construc..." },
  { id: "interior",     icon: Sofa,     label: "Interior" },
  { id: "exterior",     icon: TreePine, label: "Exterior" },
  { id: "search",       icon: Search,   label: "Search" },
];

/* ─── Coordinate helpers ─── */
function metresToCanvasPx(mx: number, mz: number, lay: Layout) {
  return {
    x: lay.offX + (mx - FP_OX) * lay.scale * lay.stretchX,
    y: lay.offY + (mz - FP_OZ) * lay.scale,
  };
}

/* ─── Grid background ─── */
function GridBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="ed-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ed-grid)" />
    </svg>
  );
}

/* ─── Room rect ─── */
function RoomRect({ room, lay, selected, showDim }: {
  room: RoomDef; lay: Layout; selected: boolean; showDim: boolean;
}) {
  const left = lay.offX + (room.x1 - FP_OX) * lay.scale * lay.stretchX;
  const top  = lay.offY + (room.z1 - FP_OZ) * lay.scale;
  const w    = (room.x2 - room.x1) * lay.scale * lay.stretchX;
  const h    = (room.z2 - room.z1) * lay.scale;
  const rw   = room.x2 - room.x1;
  const rh   = room.z2 - room.z1;
  return (
    <div
      className="absolute transition-all duration-700 ease-in-out"
      style={{
        left, top, width: w, height: h,
        backgroundColor: room.floor,
        border: selected ? "2px solid #3B82F6" : "1.5px solid #09090B",
        boxShadow: selected ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
        borderRadius: "1px",
      }}
    >
      <span
        className="absolute top-[3px] left-[4px] font-['Inter',sans-serif] font-semibold tracking-[-0.3px] opacity-55"
        style={{ fontSize: w > 70 ? "9px" : w > 40 ? "7px" : "5px", color: "#09090B" }}
      >
        {room.label}
      </span>
      <AnimatePresence>
        {showDim && w > 50 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[7px] text-[#09090B] whitespace-nowrap"
          >
            {rw.toFixed(1)}m × {rh.toFixed(1)}m
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Furniture item ─── */
function FurnitureItem({ item, lay, moved }: {
  item: FurnitureDef; lay: Layout; moved?: { x: number; z: number };
}) {
  const mx = moved ? moved.x : item.x;
  const mz = moved ? moved.z : item.z;
  const left = lay.offX + (mx - FP_OX) * lay.scale * lay.stretchX;
  const top  = lay.offY + (mz - FP_OZ) * lay.scale;
  const pw   = item.w * lay.scale * lay.stretchX;
  const pd   = item.h * lay.scale;
  return (
    <div className="absolute z-[3] transition-all duration-500 ease-out" style={{ left, top, width: pw, height: pd }}>
      <svg width={pw} height={pd} viewBox={`${-pw / 2} ${-pd / 2} ${pw} ${pd}`} className="overflow-visible">
        {renderFurnitureTopDown(item.fid, pw, pd, false, false, "#8B8B8B", item.label, item.color)}
      </svg>
    </div>
  );
}

/* ─── Cursor + tooltip (shared) ─── */
function AnimatedCursor({ cursorPx, clicking, tooltipText, isMobile }: {
  cursorPx: { x: number; y: number }; clicking: boolean; tooltipText: string; isMobile?: boolean;
}) {
  return (
    <>
      <motion.div
        className="absolute z-20 pointer-events-none"
        animate={{ left: cursorPx.x, top: cursorPx.y }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={isMobile ? { marginLeft: -18, marginTop: -18 } : undefined}
      >
        {isMobile ? (
          /* Touch circle for mobile */
          <>
            <motion.div
              animate={{ scale: clicking ? 0.7 : 1, opacity: clicking ? 0.6 : 0.35 }}
              transition={{ duration: 0.15 }}
              className="w-[36px] h-[36px] rounded-full border-2 border-[#09090B]/50 bg-[#09090B]/15 shadow-[0_0_12px_rgba(0,0,0,0.10)]"
            />
            <AnimatePresence>
              {clicking && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-full border-2 border-[#3B82F6]/60"
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Mouse pointer for desktop */
          <>
            <motion.svg width="18" height="22" viewBox="0 0 18 22" fill="none"
              animate={{ scale: clicking ? 0.8 : 1 }} transition={{ duration: 0.1 }} className="drop-shadow-md">
              <path d="M1 1L15 10.5L9 11.5L6.5 18L1 1Z" fill="#09090B" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </motion.svg>
            <AnimatePresence>
              {clicking && (
                <motion.div initial={{ scale: 0.3, opacity: 0.6 }} animate={{ scale: 2, opacity: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }} className="absolute -left-3 -top-3 w-8 h-8 rounded-full border-2 border-[#3B82F6]" />
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
      <AnimatePresence>
        {tooltipText && (
          <motion.div initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: 1, y: 0,
              left: cursorPx.x + (isMobile ? 24 : 22),
              top: cursorPx.y + (isMobile ? -6 : -4),
            }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.25 }}
            className="absolute z-20 pointer-events-none">
            <div className="bg-[#09090B] text-white text-[8px] md:text-[9px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg">
              {tooltipText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function EditorPreviewAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [cursorPx, setCursorPx] = useState({ x: 200, y: 200 });
  const [activeTool, setActiveTool] = useState("select");
  const [showPanel, setShowPanel] = useState(false);
  const [panelHighlight, setPanelHighlight] = useState(-1);
  const [showDimensions, setShowDimensions] = useState(false);
  const [furnitureVisible, setFurnitureVisible] = useState<Set<string>>(new Set());
  const [furnitureMoved, setFurnitureMoved] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  // Mobile-specific state
  const [mobileActiveTab, setMobileActiveTab] = useState("rooms");
  const [mobileCatHighlight, setMobileCatHighlight] = useState(-1);

  // Detect mobile from container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setIsMobile(entry.contentRect.width < 500);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Canvas insets differ between mobile and desktop
  const getInsets = useCallback(() => {
    if (isMobile) return { l: 4, t: 44, r: 4, b: 0 };
    return { l: 12, t: 48, r: 86, b: 36 };
  }, [isMobile]);

  const computeLayout = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return DEFAULT_LAYOUT;
    const canW = el.offsetWidth;
    const canH = el.offsetHeight;
    const pad = 6;
    const stretchX = isMobile ? 1.6 : 1.9;
    const scale = Math.min((canW - pad * 2) / (FP_W * stretchX), (canH - pad * 2) / FP_H);
    const fpW = FP_W * scale * stretchX;
    const fpH = FP_H * scale;
    return { scale, stretchX, offX: (canW - fpW) / 2, offY: (canH - fpH) / 2, canW, canH };
  }, [isMobile]);

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setLayout(computeLayout()));
    obs.observe(el);
    setLayout(computeLayout());
    return () => obs.disconnect();
  }, [computeLayout]);

  const getContainerSize = () => {
    const el = containerRef.current;
    return el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 375, h: 600 };
  };

  // ── Animation loop ──
  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const click = async () => { setClicking(true); await wait(200); setClicking(false); };

    const getLay = (): Layout => {
      const el = canvasRef.current;
      if (!el) return DEFAULT_LAYOUT;
      const canW = el.offsetWidth;
      const canH = el.offsetHeight;
      const pad = 6;
      const mob = (containerRef.current?.offsetWidth ?? 600) < 500;
      const stretchX = mob ? 1.6 : 1.9;
      const scale = Math.min((canW - pad * 2) / (FP_W * stretchX), (canH - pad * 2) / FP_H);
      const fpW = FP_W * scale * stretchX;
      const fpH = FP_H * scale;
      return { scale, stretchX, offX: (canW - fpW) / 2, offY: (canH - fpH) / 2, canW, canH };
    };

    const isMob = () => (containerRef.current?.offsetWidth ?? 600) < 500;

    // Convert metres → outer container px
    const metresToOuter = (mx: number, mz: number) => {
      const lay = getLay();
      const c = metresToCanvasPx(mx, mz, lay);
      const ins = isMob() ? { l: 4, t: 44 } : { l: 12, t: 48 };
      return { x: ins.l + c.x, y: ins.t + c.y };
    };

    const moveToMetres = async (mx: number, mz: number, ms = 600) => {
      setCursorPx(metresToOuter(mx, mz));
      await wait(ms);
    };

    const moveToRoomCenter = async (room: RoomDef, ms = 600) => {
      await moveToMetres((room.x1 + room.x2) / 2, (room.z1 + room.z2) / 2, ms);
    };

    const moveToFurnitureCenter = async (f: FurnitureDef, ms = 500) => {
      await moveToMetres(f.x + f.w / 2, f.z + f.h / 2, ms);
    };

    // Desktop: move to side panel item
    const moveToPanel = async (panelIdx: number, ms = 350) => {
      const s = getContainerSize();
      setCursorPx({ x: s.w - 49, y: 123 + panelIdx * 43 });
      await wait(ms);
    };

    // Mobile: move to bottom sheet category row
    const moveToCategoryRow = async (catIdx: number, ms = 350) => {
      const s = getContainerSize();
      // Bottom sheet starts at ~55% of container height
      // Tab bar ~48px, then categories start. Each row ~44px.
      const sheetTop = s.h * 0.55;
      const tabBarH = 48;
      const catY = sheetTop + tabBarH + 8 + catIdx * 44 + 22; // center of row
      setCursorPx({ x: s.w / 2, y: catY });
      await wait(ms);
    };

    // Mobile: move to a bottom tab
    const moveToTab = async (tabIdx: number, ms = 350) => {
      const s = getContainerSize();
      const sheetTop = s.h * 0.55;
      const tabW = s.w / 5;
      setCursorPx({ x: tabW * tabIdx + tabW / 2, y: sheetTop + 24 });
      await wait(ms);
    };

    const animate = async () => {
      while (!canvasRef.current && !cancelled) await wait(50);
      if (cancelled) return;

      while (!cancelled) {
        const mob = isMob();

        // ── Reset ──
        setShowPanel(false);
        setPanelHighlight(-1);
        setActiveTool("select");
        setShowDimensions(false);
        setFurnitureVisible(new Set());
        setFurnitureMoved(false);
        setSelectedRoom(null);
        setTooltipText("");
        setMobileActiveTab("rooms");
        setMobileCatHighlight(-1);
        await moveToMetres(0, 0, 100);
        await wait(1500);
        if (cancelled) break;

        // ── Step 1: Click Living Room ──
        const living = ROOMS[6];
        await moveToRoomCenter(living, 700);
        if (cancelled) break;
        setSelectedRoom("living");
        await click();
        setTooltipText("Living Room — 3.2m × 5.2m");
        await wait(1000);
        if (cancelled) break;

        // ── Step 2: Show dimensions ──
        setShowDimensions(true);
        await wait(1200);
        if (cancelled) break;
        setShowDimensions(false);
        setSelectedRoom(null);
        setTooltipText("");

        // ── Step 3: Open furniture picker ──
        if (mob) {
          // Tap Interior tab
          await moveToTab(2, 500);
          if (cancelled) break;
          setMobileActiveTab("interior");
          await click();
          await wait(600);
        } else {
          setShowPanel(true);
          setTooltipText("Add furniture");
          await wait(800);
        }
        if (cancelled) break;

        // ── Step 4: Place furniture ──
        // Desktop: panelIdx, Mobile: catIdx
        // Mobile categories: 0=Upholstered, 1=Beds, 2=Storage, 3=Tables, 4=Office, 5=Kitchen, 6=Bathroom
        const placements: { panelIdx: number; mobileCat: number; furnitureId: string }[] = [
          { panelIdx: 3, mobileCat: 5, furnitureId: "counter" },
          { panelIdx: 3, mobileCat: 5, furnitureId: "fridge" },
          { panelIdx: 0, mobileCat: 0, furnitureId: "sofa" },
          { panelIdx: 2, mobileCat: 3, furnitureId: "coffee" },
          { panelIdx: 2, mobileCat: 3, furnitureId: "tv" },
          { panelIdx: 0, mobileCat: 0, furnitureId: "armchair" },
          { panelIdx: 1, mobileCat: 1, furnitureId: "bed" },
          { panelIdx: 2, mobileCat: 2, furnitureId: "wardrobe" },
          { panelIdx: 1, mobileCat: 1, furnitureId: "single" },
          { panelIdx: 2, mobileCat: 3, furnitureId: "desk" },
          { panelIdx: 4, mobileCat: 6, furnitureId: "toilet" },
          { panelIdx: 4, mobileCat: 6, furnitureId: "basin" },
        ];

        for (const p of placements) {
          if (cancelled) break;
          const fItem = FURNITURE.find(f => f.id === p.furnitureId)!;

          if (mob) {
            setMobileCatHighlight(p.mobileCat);
            await moveToCategoryRow(p.mobileCat, 400);
          } else {
            setPanelHighlight(p.panelIdx);
            await moveToPanel(p.panelIdx, 400);
          }
          if (cancelled) break;
          await click();
          await wait(100);
          if (cancelled) break;

          setTooltipText(fItem.label);
          await moveToFurnitureCenter(fItem, 500);
          if (cancelled) break;
          await click();

          setFurnitureVisible((prev) => new Set([...prev, p.furnitureId]));
          setPanelHighlight(-1);
          setMobileCatHighlight(-1);
          setTooltipText("");
          await wait(200);
          if (cancelled) break;
        }

        await wait(500);
        if (cancelled) break;

        // ── Step 5: Reposition ──
        setActiveTool("move");
        setTooltipText("Adjusting layout");

        const sofa = FURNITURE[2];
        await moveToMetres(sofa.x + sofa.w / 2, sofa.z + sofa.h / 2, 400);
        if (cancelled) break;
        await click();
        const sofaM = FURNITURE_MOVED.sofa;
        await moveToMetres(sofaM.x + sofa.w / 2, sofaM.z + sofa.h / 2, 500);
        if (cancelled) break;

        const bed = FURNITURE[6];
        await moveToMetres(bed.x + bed.w / 2, bed.z + bed.h / 2, 400);
        if (cancelled) break;
        await click();
        const bedM = FURNITURE_MOVED.bed;
        await moveToMetres(bedM.x + bed.w / 2, bedM.z + bed.h / 2, 500);
        if (cancelled) break;

        setFurnitureMoved(true);
        setTooltipText("");
        await wait(300);
        if (cancelled) break;

        // ── Step 6: Admire ──
        setActiveTool("select");
        await moveToMetres(0, 0, 600);
        if (cancelled) break;
        await wait(3500);
        if (cancelled) break;
      }
    };

    animate();
    return () => { cancelled = true; };
  }, []);

  const ins = getInsets();

  /* ═══════════════════════════════════════════════════════════
     MOBILE RENDER
     ═══════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div ref={containerRef} className="relative w-full h-[580px] bg-[#FAFAFA] rounded-[20px] overflow-hidden select-none flex flex-col">
        {/* ── Top bar (matches editor) ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 z-10">
          <div className="size-[36px] rounded-full bg-[#09090B] flex items-center justify-center">
            <ChevronLeft className="size-[18px] text-white" strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-2">
            <div className="size-[36px] rounded-full bg-[#09090B]/80 flex items-center justify-center">
              <Save className="size-[16px] text-white" strokeWidth={1.8} />
            </div>
            <div className="size-[36px] rounded-full bg-[#09090B] flex items-center justify-center">
              <Sparkles className="size-[16px] text-white" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* ── Canvas area ── */}
        <div className="relative flex-1 min-h-0">
          <GridBg />
          <div ref={canvasRef} className="absolute" style={{ top: 0, bottom: 0, left: ins.l, right: ins.r }}>
            {ROOMS.map((room) => (
              <RoomRect key={room.id} room={room} lay={layout} selected={selectedRoom === room.id} showDim={showDimensions} />
            ))}
            {FURNITURE.map((f) => {
              if (!furnitureVisible.has(f.id)) return null;
              const moved = furnitureMoved ? FURNITURE_MOVED[f.id] : undefined;
              return <FurnitureItem key={f.id} item={f} lay={layout} moved={moved} />;
            })}
          </div>

          {/* 3D/2D toggle */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="bg-white rounded-[100px] p-[3px] flex items-center gap-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-[#F3F4F6]">
              <div className="px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[11px] font-medium text-[#71717A]">3D</div>
              <div className="px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[11px] font-medium bg-[#09090B] text-white shadow-sm">2D</div>
            </div>
          </div>

          {/* Undo/Redo */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
            <div className="size-[32px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#F3F4F6] flex items-center justify-center">
              <Undo2 className="size-[14px] text-[#C0C0C0]" strokeWidth={1.5} />
            </div>
            <div className="size-[32px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#F3F4F6] flex items-center justify-center">
              <Redo2 className="size-[14px] text-[#C0C0C0]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* ── Bottom sheet (matches editor mobile) ── */}
        <div className="bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] flex flex-col z-10" style={{ height: "45%" }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full" />
          </div>

          {/* Tab bar */}
          <div className="flex items-end justify-around px-1 pb-2 pt-0.5 border-b border-[#F3F4F6]">
            {MOBILE_TABS.map((tab) => {
              const isActive = mobileActiveTab === tab.id;
              return (
                <div key={tab.id} className="flex flex-col items-center gap-1 py-1 px-1.5 min-w-[48px]">
                  <div className="size-[24px] flex items-center justify-center">
                    <tab.icon
                      className={`size-[18px] transition-colors duration-200 ${isActive ? "text-[#09090B]" : "text-[#71717A]"}`}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  </div>
                  <span className={`font-['Inter',sans-serif] text-[9px] tracking-[-0.2px] ${
                    isActive ? "text-[#09090B] font-semibold" : "text-[#71717A] font-medium"
                  }`}>
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Category list (visible when Interior tab is active) */}
          <div className="flex-1 overflow-hidden">
            {mobileActiveTab === "interior" ? (
              <div className="flex flex-col">
                <div className="px-4 pt-3 pb-1.5">
                  <span className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px]">Furniture</span>
                </div>
                {MOBILE_CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.label}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-[#F3F4F6] transition-colors duration-200 ${
                        mobileCatHighlight === i ? "bg-[#F0F7FF]" : ""
                      }`}
                    >
                      <div className="size-[30px] rounded-[8px] bg-[#F6F6F6] flex items-center justify-center shrink-0">
                        <Icon className="size-[15px] text-[#71717A]" strokeWidth={1.5} />
                      </div>
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] tracking-[-0.3px] flex-1 truncate">
                        {cat.label}
                      </span>
                      <ChevronRight className="size-[14px] text-[#C0C0C0] shrink-0" strokeWidth={1.5} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-[12px] text-[#C0C0C0] font-medium">Select a tool to begin</span>
              </div>
            )}
          </div>
        </div>

        {/* Cursor + tooltip */}
        <AnimatedCursor cursorPx={cursorPx} clicking={clicking} tooltipText={tooltipText} isMobile />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     DESKTOP RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div ref={containerRef} className="relative w-full h-[480px] md:h-[620px] bg-[#FAFAFA] rounded-[29px] overflow-hidden select-none">
      <GridBg />

      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-xl px-2 py-1.5 shadow-sm">
        {[
          { id: "select", label: "Select", icon: MousePointer2 },
          { id: "move", label: "Move", icon: Move },
          { id: "add", label: "Add Room", icon: Plus },
        ].map((t) => (
          <div key={t.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 ${
              activeTool === t.id ? "bg-[#09090B] text-white" : "text-[#71717A]"
            }`}
          >
            <t.icon className="size-3.5" strokeWidth={1.8} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Side panel */}
      <div
        className="absolute right-3 top-14 bottom-10 w-[72px] bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-xl shadow-sm z-10 overflow-hidden transition-all duration-400"
        style={{ opacity: showPanel ? 1 : 0, transform: showPanel ? "translateX(0)" : "translateX(20px)" }}
      >
        <div className="px-2 py-2 border-b border-[#F3F4F6]">
          <span className="text-[8px] font-semibold text-[#71717A] uppercase tracking-wider px-1">Furniture</span>
        </div>
        <div className="flex flex-col gap-0.5 px-1 py-1">
          {PANEL_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200 ${
                  panelHighlight === i ? "bg-[#F0F7FF] border border-[#93C5FD]" : "border border-transparent"
                }`}
              >
                <Icon className="size-3.5 text-[#71717A]" strokeWidth={1.5} />
                <span className="text-[7px] text-[#71717A] font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="absolute" style={{ top: ins.t, bottom: ins.b, left: ins.l, right: ins.r }}>
        {ROOMS.map((room) => (
          <RoomRect key={room.id} room={room} lay={layout} selected={selectedRoom === room.id} showDim={showDimensions} />
        ))}
        {FURNITURE.map((f) => {
          if (!furnitureVisible.has(f.id)) return null;
          const moved = furnitureMoved ? FURNITURE_MOVED[f.id] : undefined;
          return <FurnitureItem key={f.id} item={f} lay={layout} moved={moved} />;
        })}
      </div>

      <AnimatedCursor cursorPx={cursorPx} clicking={clicking} tooltipText={tooltipText} />

      {/* Bottom chrome */}
      <div className="absolute bottom-2.5 left-3 flex items-center gap-2 z-10">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1">
          <div className="w-[28px] h-[1px] bg-[#71717A]" />
          <span className="text-[8px] font-mono text-[#71717A]">1m</span>
        </div>
        <div className="bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-lg px-2.5 py-1">
          <span className="text-[9px] font-medium text-[#71717A]">4-Room HDB</span>
        </div>
      </div>
      <div className="absolute bottom-2.5 right-[86px] flex items-center z-10">
        <div className="flex items-center bg-white/90 backdrop-blur-sm border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-2 py-1 text-[10px] font-medium text-[#71717A] border-r border-[#E5E7EB]">−</div>
          <div className="px-2.5 py-1 text-[8px] font-mono text-[#71717A]">100%</div>
          <div className="px-2 py-1 text-[10px] font-medium text-[#71717A] border-l border-[#E5E7EB]">+</div>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none rounded-[29px]" style={{
        background: "radial-gradient(ellipse at center, transparent 65%, rgba(249,250,251,0.4) 100%)",
      }} />
    </div>
  );
}

import { useState, type RefObject } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MousePointer2, Move, RotateCw, Trash2,
  X, Copy, Undo2, Redo2, Ruler, Paintbrush,
  Sofa, Grid3X3, Magnet, ZoomIn, ZoomOut, Maximize2,
  ChevronDown, Check, ChevronLeft, Pencil
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
export type Editor3DTool = "select" | "move" | "rotate" | "place" | "delete";

interface PlacedItem {
  id: string;
  furnitureId: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  dimensions: [number, number, number];
  color: string;
  category: string;
  locked?: boolean;
  elevation?: number;
}

interface RoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number];
  accent: string;
  floorColor: string;
  wallColor: string;
}

/* ═══════════════════════════════════════════════════════
   Helper
   ═══════════════════════════════════════════════════════ */
function formatDim(meters: number, unit: "metric" | "imperial"): string {
  if (unit === "imperial") {
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  if (meters >= 1) return `${meters.toFixed(2)}m`;
  return `${(meters * 100).toFixed(0)}cm`;
}

function formatArea(sqMeters: number, unit: "metric" | "imperial"): string {
  if (unit === "imperial") return `${(sqMeters * 10.7639).toFixed(1)} ft\u00B2`;
  return `${sqMeters.toFixed(1)} m\u00B2`;
}

/* ═══════════════════════════════════════════════════════
   3D Tool Bar (right side, matching 2D ToolBar)
   ═══════════════════════════════════════════════════════ */
export function Editor3DToolbar({
  activeTool,
  onToolChange,
  onOpenFurniture,
  onOpenCustomize,
  isFurnitureOpen,
  isCustomizeOpen,
}: {
  activeTool: Editor3DTool;
  onToolChange: (t: Editor3DTool) => void;
  onOpenFurniture: () => void;
  onOpenCustomize: () => void;
  isFurnitureOpen: boolean;
  isCustomizeOpen: boolean;
}) {
  const tools: { id: Editor3DTool; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { id: "move", icon: Move, label: "Move", shortcut: "G" },
    { id: "rotate", icon: RotateCw, label: "Rotate", shortcut: "R" },
    { id: "delete", icon: Trash2, label: "Delete", shortcut: "Del" },
  ];

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-3 z-30 hidden md:flex flex-col gap-2">
      {/* Main tools */}
      <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] p-1.5 flex flex-col gap-0.5">
        {tools.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            className={`size-[34px] rounded-[10px] flex items-center justify-center transition-all relative group ${
              activeTool === id
                ? id === "delete"
                  ? "bg-red-600 text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)]"
                  : "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
            }`}
            title={`${label} (${shortcut})`}
          >
            <Icon className="size-[15px]" strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#09090B] text-white rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-['Inter',sans-serif] font-medium">
              {label}
              <span className="ml-1.5 text-white/40">{shortcut}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Panel toggles */}
      <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] p-1.5 flex flex-col gap-0.5">
        <button
          onClick={onOpenFurniture}
          className={`size-[34px] rounded-[10px] flex items-center justify-center transition-all relative group ${
            isFurnitureOpen
              ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
          }`}
          title="Furniture (F)"
        >
          <Sofa className="size-[15px]" strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#09090B] text-white rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-['Inter',sans-serif] font-medium">
            Furniture
            <span className="ml-1.5 text-white/40">F</span>
          </div>
        </button>
        <button
          onClick={onOpenCustomize}
          className={`size-[34px] rounded-[10px] flex items-center justify-center transition-all relative group ${
            isCustomizeOpen
              ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
          }`}
          title="Customize (C)"
        >
          <Paintbrush className="size-[15px]" strokeWidth={1.5} />
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#09090B] text-white rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-['Inter',sans-serif] font-medium">
            Customize
            <span className="ml-1.5 text-white/40">C</span>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Info Bar (top-left, matching 2D Info Bar)
   ═══════════════════════════════════════════════════════ */
export function Editor3DInfoBar({
  activeRoom,
  allRooms,
  totalObjects,
  unitSystem,
  showPanel,
  houseName,
  isEditingName,
  nameInputRef,
  onNameChange,
  onStartEditing,
  onStopEditing,
  onBack,
}: {
  activeRoom: RoomDef | null;
  allRooms: RoomDef[];
  totalObjects: number;
  unitSystem: "metric" | "imperial";
  showPanel: boolean;
  houseName: string;
  isEditingName: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  onNameChange: (name: string) => void;
  onStartEditing: () => void;
  onStopEditing: (fallback?: string) => void;
  onBack: () => void;
}) {
  const totalArea = allRooms.reduce(
    (sum, r) => sum + (r.bounds[1] - r.bounds[0]) * (r.bounds[3] - r.bounds[2]),
    0
  );

  return (
    <div
      className="absolute top-3 z-20 flex flex-col gap-2 pointer-events-none left-3 md:transition-[left] md:duration-300 md:ease-in-out"
      style={typeof window !== "undefined" && window.innerWidth >= 768 && showPanel ? { left: "360px" } : undefined}
    >
      {/* Back + Title + Mode badge */}
      <div className="bg-[#09090B] text-white rounded-[100px] px-3 py-1.5 h-[40px] md:h-auto shadow-[0_4px_12px_rgba(0,0,0,0.2)] pointer-events-auto flex items-center gap-1.5">
        <button
          onClick={onBack}
          className="flex size-[28px] rounded-full bg-white/15 hover:bg-white/25 items-center justify-center transition-colors shrink-0 active:scale-90"
          title="Back to Dashboard"
        >
          <ChevronLeft className="size-[14px] text-white" strokeWidth={2} />
        </button>
        <div className="hidden md:block min-w-0 flex-1">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={houseName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={() => onStopEditing("Untitled Project")}
              onKeyDown={(e) => {
                if (e.key === "Enter") onStopEditing("Untitled Project");
                if (e.key === "Escape") onStopEditing();
              }}
              autoFocus
              className="font-['Inter',sans-serif] text-[12px] font-semibold tracking-[-0.3px] bg-transparent border-b border-white/50 outline-none text-white w-full max-w-[200px]"
            />
          ) : (
            <span
              onClick={onStartEditing}
              className="font-['Inter',sans-serif] text-[12px] font-semibold tracking-[-0.3px] truncate cursor-text hover:bg-white/10 rounded-[6px] px-1 py-0.5 transition-colors inline-flex items-center gap-1.5 max-w-[220px]"
            >
              <span className="truncate">{houseName}</span>
              <Pencil className="size-[10px] text-white/50 shrink-0" strokeWidth={1.5} />
            </span>
          )}
        </div>
        <div className="hidden md:block w-px h-[16px] bg-white/20 mx-0.5" />
        <span className="hidden md:inline font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] text-white/60 shrink-0 pr-1">
          3D
        </span>
      </div>

      {/* Stats card — desktop only */}
      <div className="hidden md:block bg-white/80 backdrop-blur-[8px] rounded-[14px] px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 pointer-events-auto">
        <div className="flex items-center gap-3">
          {activeRoom && (
            <>
              <div>
                <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Room</p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="size-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: activeRoom.accent }}
                  />
                  <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px]">
                    {activeRoom.shortLabel}
                  </p>
                </div>
              </div>
              <div className="w-px h-[24px] bg-[#E5E7EB]" />
            </>
          )}
          <div>
            <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Total Area</p>
            <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px] tabular-nums">
              {formatArea(totalArea, unitSystem)}
            </p>
          </div>
          <div className="w-px h-[24px] bg-[#E5E7EB]" />
          <div>
            <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Objects</p>
            <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px] tabular-nums">
              {totalObjects}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Properties Bar (bottom floating, matching 2D)
   ═══════════════════════════════════════════════════════ */
export function Editor3DPropertiesBar({
  selectedItem,
  activeRoom,
  unitSystem,
  onRotate,
  onDelete,
  onDuplicate,
  onDeselect,
  isOverlapping,
}: {
  selectedItem: PlacedItem | null;
  activeRoom: RoomDef | null;
  unitSystem: "metric" | "imperial";
  onRotate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeselect: () => void;
  isOverlapping: boolean;
}) {
  if (!selectedItem) return null;

  const [w, h, d] = selectedItem.dimensions;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 hidden md:block"
    >
      <div
        className={`bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border px-3 py-2 flex items-center gap-2 ${
          isOverlapping ? "border-red-200" : "border-[#F3F4F6]"
        }`}
      >
        {/* Item indicator */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-[#E5E7EB]">
          <div
            className={`size-[6px] rounded-full shrink-0 ${
              isOverlapping ? "bg-red-500" : "bg-[#09090B]"
            }`}
          />
          <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090B] tracking-[-0.3px] max-w-[100px] truncate">
            {selectedItem.name}
          </span>
        </div>

        {/* Dimensions */}
        <div className="flex items-center gap-1.5">
          <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">
            W
          </label>
          <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums">
            {formatDim(w, unitSystem)}
          </span>
        </div>
        <span className="font-['Inter',sans-serif] text-[9px] text-[#ABABAB]">x</span>
        <div className="flex items-center gap-1.5">
          <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">
            D
          </label>
          <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums">
            {formatDim(d, unitSystem)}
          </span>
        </div>
        <span className="font-['Inter',sans-serif] text-[9px] text-[#ABABAB]">x</span>
        <div className="flex items-center gap-1.5">
          <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">
            H
          </label>
          <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums">
            {formatDim(h, unitSystem)}
          </span>
        </div>

        <div className="w-px h-[20px] bg-[#E5E7EB]" />

        {/* Rotation */}
        <div className="flex items-center gap-1.5">
          <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">
            Rot
          </label>
          <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums">
            {selectedItem.rotation}°
          </span>
        </div>

        <div className="w-px h-[20px] bg-[#E5E7EB]" />

        {/* Action buttons */}
        <button
          onClick={onRotate}
          className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors"
          title="Rotate 45°"
        >
          <RotateCw className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDuplicate}
          className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors"
          title="Duplicate"
        >
          <Copy className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
        </button>
        <button
          onClick={onDelete}
          className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-red-50 transition-colors group"
          title="Delete"
        >
          <Trash2
            className="size-[13px] text-[#71717A] group-hover:text-red-500"
            strokeWidth={1.5}
          />
        </button>
        <button
          onClick={onDeselect}
          className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors"
          title="Deselect (Esc)"
        >
          <X className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D View Toggle (top-center, 2D/3D switch)
   ═══════════════════════════════════════════════════════ */
export function Editor3DViewToggle({
  is2DMode,
  onToggleMode,
}: {
  is2DMode: boolean;
  onToggleMode: (mode: boolean) => void;
}) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[25] hidden md:block">
      <div className="bg-white/80 backdrop-blur-[8px] rounded-[100px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 p-[3px] flex items-center gap-[2px]">
        <button
          onClick={() => onToggleMode(false)}
          className={`px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all duration-200 ${
            !is2DMode
              ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              : "text-[#71717A] hover:text-[#09090B]"
          }`}
        >
          3D
        </button>
        <button
          onClick={() => onToggleMode(true)}
          className={`px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all duration-200 ${
            is2DMode
              ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              : "text-[#71717A] hover:text-[#09090B]"
          }`}
        >
          2D
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Bottom Controls (matching 2D zoom + help style)
   ═══════════════════════════════════════════════════════ */
export function Editor3DBottomBar({
  zoomLevel,
  showGrid,
  onToggleGrid,
  snapEnabled,
  onToggleSnap,
  showMeasurements,
  onToggleMeasurements,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  unitSystem,
  onSetUnit,
}: {
  zoomLevel: number;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  showMeasurements: boolean;
  onToggleMeasurements: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  unitSystem: "metric" | "imperial";
  onSetUnit: (u: "metric" | "imperial") => void;
}) {
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  return (
    <>
      {/* Zoom indicator (bottom-left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-20 hidden md:block">
        <div className="bg-white/60 backdrop-blur-[8px] rounded-[100px] px-3 py-1.5 border border-white/30">
          <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A] tabular-nums">
            {Math.round(zoomLevel)}%
          </span>
        </div>
      </div>

      {/* Controls (bottom-right) */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-2">
        {/* Zoom */}
        <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 flex items-center px-1.5 py-1.5 gap-0.5">
          <button
            onClick={onZoomOut}
            className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-90"
            title="Zoom Out"
          >
            <ZoomOut className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
          </button>
          <button
            onClick={onZoomIn}
            className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-90"
            title="Zoom In"
          >
            <ZoomIn className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
          </button>
          <div className="w-px h-[18px] bg-[#E5E7EB] mx-0.5" />
          <button
            onClick={onZoomFit}
            className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-90"
            title="Zoom to Fit"
          >
            <Maximize2 className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Toggles */}
        <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 flex items-center px-1.5 py-1.5 gap-0.5">
          <button
            onClick={onToggleGrid}
            className={`size-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              showGrid
                ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                : "hover:bg-[#F6F6F6] text-[#71717A]"
            }`}
            title={`Grid ${showGrid ? "On" : "Off"}`}
          >
            <Grid3X3 className="size-[14px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={onToggleSnap}
            className={`size-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              snapEnabled
                ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                : "hover:bg-[#F6F6F6] text-[#71717A]"
            }`}
            title={`Snap ${snapEnabled ? "On" : "Off"}`}
          >
            <Magnet className="size-[14px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={onToggleMeasurements}
            className={`size-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              showMeasurements
                ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                : "hover:bg-[#F6F6F6] text-[#71717A]"
            }`}
            title="Show Measurements"
          >
            <Ruler className="size-[14px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Unit */}
        <div className="relative">
          <button
            onClick={() => setShowUnitMenu(!showUnitMenu)}
            className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 flex items-center px-3 py-1.5 gap-1.5 hover:bg-white/90 transition-colors"
          >
            <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B]">
              {unitSystem === "metric" ? "m" : "ft"}
            </span>
            <ChevronDown className="size-[12px] text-[#71717A]" strokeWidth={1.5} />
          </button>
          <AnimatePresence>
            {showUnitMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUnitMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#F3F4F6] overflow-hidden w-[160px] z-50"
                >
                  {[
                    { id: "metric" as const, label: "Metric (m, cm)" },
                    { id: "imperial" as const, label: "Imperial (ft, in)" },
                  ].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSetUnit(u.id);
                        setShowUnitMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors ${
                        unitSystem === u.id ? "bg-[#F9FAFB]" : ""
                      }`}
                    >
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] flex-1">
                        {u.label}
                      </span>
                      {unitSystem === u.id && (
                        <Check className="size-[14px] text-[#09090B]" strokeWidth={2} />
                      )}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Help Tips (bottom-right, matching 2D)
   ═══════════════════════════════════════════════════════ */
export function Editor3DHelpTips({
  activeTool,
  selectedItem,
  isDragging,
}: {
  activeTool: Editor3DTool;
  selectedItem: boolean;
  isDragging: boolean;
}) {
  let tip = "";
  if (isDragging) {
    tip = "Release to place item";
  } else if (activeTool === "select" && !selectedItem) {
    tip = "Click an object to select it \u00B7 Drag to reposition";
  } else if (activeTool === "select" && selectedItem) {
    tip = "Drag to move \u00B7 R to rotate \u00B7 Del to delete";
  } else if (activeTool === "move") {
    tip = "Click an object, then drag to move it";
  } else if (activeTool === "rotate") {
    tip = "Click an object to rotate it 45\u00B0";
  } else if (activeTool === "place") {
    tip = "Select furniture from the panel, then click to place";
  } else if (activeTool === "delete") {
    tip = "Click any object to delete it";
  }

  return (
    <div className="absolute bottom-14 right-4 pointer-events-none z-20 hidden md:block">
      <div className="bg-white/60 backdrop-blur-[8px] rounded-[100px] px-3 py-1.5 border border-white/30">
        <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A]">{tip}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Active Tool Indicator (matching 2D)
   ═══════════════════════════════════════════════════════ */
export function Editor3DActiveToolIndicator({
  activeTool,
  onReset,
}: {
  activeTool: Editor3DTool;
  onReset: () => void;
}) {
  if (activeTool === "select") return null;

  const labels: Record<Editor3DTool, string> = {
    select: "",
    move: "Move Mode",
    rotate: "Rotate Mode",
    place: "Placing Furniture",
    delete: "Delete Mode",
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-20 right-4 z-[25] hidden md:block"
    >
      <div className="bg-[#09090B] text-white rounded-[100px] px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center gap-2">
        <span className="font-['Inter',sans-serif] text-[11px] font-medium">
          {labels[activeTool]}
        </span>
        <button
          onClick={onReset}
          className="size-[20px] rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <X className="size-[10px]" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Room Switcher (bottom center, compact pills)
   ═══════════════════════════════════════════════════════ */
export function Editor3DRoomSwitcher({
  rooms,
  activeRoomId,
  onSelectRoom,
}: {
  rooms: RoomDef[];
  activeRoomId: string;
  onSelectRoom: (id: string) => void;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex">
      <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 px-2 py-1.5 flex items-center gap-1">
        {/* Room pills — click to navigate camera */}
        <div className="flex items-center gap-0.5 max-w-[500px] overflow-x-auto scrollbar-hide">
          {rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`h-[30px] px-3 rounded-[100px] font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                    : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
                }`}
              >
                <div
                  className="size-[6px] rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? "#FFFFFF" : room.accent }}
                />
                {room.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3D Left Panel Toggle (when panel is closed)
   ═══════════════════════════════════════════════════════ */
export function Editor3DPanelToggle({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    null
  );
}
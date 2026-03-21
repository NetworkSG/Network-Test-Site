import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet, Ruler,
  ChevronDown, Check
} from "lucide-react";

interface BottomBarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  unitSystem: "metric" | "imperial";
  onSetUnit: (unit: "metric" | "imperial") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  zoomLevel: number;
  showMeasurements: boolean;
  onToggleMeasurements: () => void;
}

export function EditorBottomBar({
  showGrid, onToggleGrid,
  snapEnabled, onToggleSnap,
  unitSystem, onSetUnit,
  onZoomIn, onZoomOut, onZoomFit,
  zoomLevel,
  showMeasurements, onToggleMeasurements,
}: BottomBarProps) {
  const [showUnitMenu, setShowUnitMenu] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-2">
      {/* Zoom Controls */}
      <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 flex items-center px-1.5 py-1.5 gap-0.5">
        <button
          onClick={onZoomOut}
          className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-90"
          title="Zoom Out"
        >
          <ZoomOut className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
        </button>
        <div className="w-[40px] text-center">
          <span className="font-['Inter',sans-serif] text-[11px] font-medium text-[#71717A] tabular-nums">
            {Math.round(zoomLevel)}%
          </span>
        </div>
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
        {/* Grid */}
        <button
          onClick={onToggleGrid}
          className={`size-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            showGrid
              ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              : "hover:bg-[#F6F6F6] text-[#71717A]"
          }`}
          title={`Grid ${showGrid ? "On" : "Off"} (G)`}
        >
          <Grid3X3 className="size-[14px]" strokeWidth={1.5} />
        </button>

        {/* Snap */}
        <button
          onClick={onToggleSnap}
          className={`size-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
            snapEnabled
              ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              : "hover:bg-[#F6F6F6] text-[#71717A]"
          }`}
          title={`Snap ${snapEnabled ? "On" : "Off"} (S)`}
        >
          <Magnet className="size-[14px]" strokeWidth={1.5} />
        </button>

        {/* Measurements */}
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

      {/* Unit Selector */}
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
                  onClick={() => { onSetUnit(u.id); setShowUnitMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors ${
                    unitSystem === u.id ? "bg-[#F9FAFB]" : ""
                  }`}
                >
                  <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] flex-1">{u.label}</span>
                  {unitSystem === u.id && <Check className="size-[14px] text-[#09090B]" strokeWidth={2} />}
                </button>
              ))}
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
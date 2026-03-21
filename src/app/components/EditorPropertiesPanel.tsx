import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, ChevronDown, ChevronRight, Copy, Trash2, RotateCw,
  Lock, Unlock, FlipHorizontal, Ruler, Square, Paintbrush,
  Maximize2, Home, Box, Layers, Settings, Check
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
export interface PlacedItem {
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

export interface RoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number];
  accent: string;
  floorColor: string;
  wallColor: string;
}

export interface SceneMaterials {
  walls: string;
  floors: string;
  ceiling: string;
}

interface PropertiesPanelProps {
  selectedItem: PlacedItem | null;
  activeRoom: RoomDef | null;
  allRooms: RoomDef[];
  totalObjects: number;
  materials: SceneMaterials;
  unitSystem: "metric" | "imperial";
  onClose: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeselect: () => void;
  onUpdateItem: (id: string, updates: Partial<PlacedItem>) => void;
  onSelectRoom: (roomId: string) => void;
  onMaterialChange: (cat: string, val: string) => void;
}

/* ═══════════════════════════════════════════════════════
   Helpers
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
  if (unit === "imperial") return `${(sqMeters * 10.7639).toFixed(1)} ft²`;
  return `${sqMeters.toFixed(1)} m²`;
}

/* ═══════════════════════════════════════════════════════
   Section component
   ═══════════════════════════════════════════════════════ */
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: typeof Box; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#F3F4F6] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors"
      >
        <Icon className="size-[14px] text-[#71717A]" strokeWidth={1.5} />
        <span className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#09090B] tracking-[-0.3px] flex-1 text-left">{title}</span>
        <ChevronDown className={`size-[14px] text-[#ABABAB] transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} strokeWidth={1.5} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Input Row
   ═══════════════════════════════════════════════════════ */
function InputRow({ label, value, suffix, onChange, disabled }: {
  label: string; value: string; suffix?: string; onChange?: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-['Inter',sans-serif] text-[12px] text-[#71717A] w-[32px] shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] h-[34px] px-3">
        <input
          type="text"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={disabled || !onChange}
          className="flex-1 bg-transparent font-['Inter',sans-serif] text-[13px] text-[#09090B] outline-none min-w-0 tabular-nums"
        />
        {suffix && <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Properties Panel
   ═══════════════════════════════════════════════════════ */
export function EditorPropertiesPanel({
  selectedItem, activeRoom, allRooms, totalObjects,
  materials, unitSystem, onClose, onRotate, onDelete,
  onDuplicate, onDeselect, onUpdateItem, onSelectRoom,
  onMaterialChange,
}: PropertiesPanelProps) {

  // ═══ Furniture/Object Selected ═══
  if (selectedItem) {
    const [w, h, d] = selectedItem.dimensions;
    const unitSuffix = unitSystem === "imperial" ? "ft" : "m";
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[#F3F4F6]">
          <div className="size-[36px] rounded-[12px] bg-[#F6F6F6] flex items-center justify-center shrink-0">
            <Box className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.5px] truncate">{selectedItem.name}</h3>
            <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A] capitalize">{selectedItem.category}</p>
          </div>
          <button onClick={onClose} className="size-[30px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors shrink-0">
            <X className="size-[13px] text-[#09090B]" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-styled">
          {/* Dimensions */}
          <Section title="Dimensions" icon={Ruler}>
            <div className="flex flex-col gap-2">
              <InputRow label="W" value={formatDim(w, unitSystem)} suffix={unitSuffix} disabled />
              <InputRow label="D" value={formatDim(d, unitSystem)} suffix={unitSuffix} disabled />
              <InputRow label="H" value={formatDim(h, unitSystem)} suffix={unitSuffix} disabled />
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
              <Lock className="size-[11px] text-[#ABABAB]" strokeWidth={1.5} />
              <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">Aspect ratio locked</span>
            </div>
          </Section>

          {/* Position */}
          <Section title="Position" icon={Maximize2}>
            <div className="flex flex-col gap-2">
              <InputRow label="X" value={selectedItem.position[0].toFixed(2)} suffix={unitSuffix} disabled />
              <InputRow label="Z" value={selectedItem.position[2].toFixed(2)} suffix={unitSuffix} disabled />
            </div>
          </Section>

          {/* Transform */}
          <Section title="Transform" icon={RotateCw}>
            <div className="flex flex-col gap-2">
              <InputRow label="Rot" value={`${selectedItem.rotation}`} suffix="°" disabled />
              <InputRow label="Elev" value={formatDim(selectedItem.elevation || 0, unitSystem)} suffix={unitSuffix} disabled />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onRotate}
                className="flex-1 h-[34px] rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center gap-1.5 hover:bg-[#F6F6F6] transition-colors active:scale-[0.97]"
              >
                <RotateCw className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
                <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B] font-medium">Rotate 45°</span>
              </button>
              <button className="h-[34px] px-3 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-[0.97]" title="Flip">
                <FlipHorizontal className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
              </button>
            </div>
          </Section>

          {/* Material zone */}
          <Section title="Material" icon={Paintbrush} defaultOpen={false}>
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB]">
              <div className="size-[32px] rounded-[8px] border border-[#E5E7EB]" style={{ backgroundColor: selectedItem.color }} />
              <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">Base color</span>
            </div>
          </Section>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 border-t border-[#F3F4F6] flex gap-2">
          <button
            onClick={onDuplicate}
            className="flex-1 h-[38px] rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center gap-1.5 hover:bg-[#F6F6F6] transition-colors active:scale-[0.97]"
          >
            <Copy className="size-[13px] text-[#71717A]" strokeWidth={1.5} />
            <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B] font-medium">Duplicate</span>
          </button>
          <button
            onClick={onDelete}
            className="h-[38px] px-4 rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center gap-1.5 hover:bg-red-50 hover:border-red-200 transition-colors active:scale-[0.97] group"
          >
            <Trash2 className="size-[13px] text-[#71717A] group-hover:text-red-500" strokeWidth={1.5} />
            <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B] group-hover:text-red-500 font-medium">Delete</span>
          </button>
        </div>
      </div>
    );
  }

  // ═══ Room Selected (nothing selected, show room info) ═══
  if (activeRoom) {
    const roomW = activeRoom.bounds[1] - activeRoom.bounds[0];
    const roomD = activeRoom.bounds[3] - activeRoom.bounds[2];
    const area = roomW * roomD;

    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[#F3F4F6]">
          <div className="size-[36px] rounded-[12px] flex items-center justify-center shrink-0" style={{ backgroundColor: activeRoom.accent + "20" }}>
            <div className="size-[10px] rounded-full" style={{ backgroundColor: activeRoom.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.5px] truncate">{activeRoom.label}</h3>
            <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A]">Room Properties</p>
          </div>
          <button onClick={onClose} className="size-[30px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors shrink-0">
            <X className="size-[13px] text-[#09090B]" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-styled">
          {/* Room Dimensions */}
          <Section title="Dimensions" icon={Ruler}>
            <div className="flex flex-col gap-2">
              <InputRow label="W" value={formatDim(roomW, unitSystem)} disabled />
              <InputRow label="D" value={formatDim(roomD, unitSystem)} disabled />
              <InputRow label="H" value={formatDim(2.6, unitSystem)} disabled />
            </div>
            <div className="mt-3 p-3 bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">Floor Area</span>
                <span className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.3px]">{formatArea(area, unitSystem)}</span>
              </div>
            </div>
          </Section>

          {/* Materials */}
          <Section title="Surface Materials" icon={Paintbrush}>
            {[
              { key: "walls", label: "Walls", value: materials.walls },
              { key: "floors", label: "Floor", value: materials.floors },
              { key: "ceiling", label: "Ceiling", value: materials.ceiling },
            ].map((surface) => (
              <div key={surface.key} className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-b-0">
                <span className="font-['Inter',sans-serif] text-[13px] text-[#71717A]">{surface.label}</span>
                <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] font-medium">{surface.value}</span>
              </div>
            ))}
          </Section>

          {/* All Rooms Quick Nav */}
          <Section title="All Rooms" icon={Home} defaultOpen={false}>
            <div className="flex flex-col gap-1.5">
              {allRooms.map((room) => {
                const isActive = room.id === activeRoom.id;
                const w = room.bounds[1] - room.bounds[0];
                const d = room.bounds[3] - room.bounds[2];
                return (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-all duration-200 ${
                      isActive ? "bg-[#09090B] text-white" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: isActive ? "#FFFFFF" : room.accent }} />
                    <span className="font-['Inter',sans-serif] text-[12px] font-medium flex-1">{room.label}</span>
                    <span className={`font-['Inter',sans-serif] text-[11px] ${isActive ? "text-white/60" : "text-[#ABABAB]"}`}>
                      {formatArea(w * d, unitSystem)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Project Stats */}
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <div className="bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB] p-3 flex items-center justify-around">
            <div className="text-center">
              <p className="font-['Inter',sans-serif] text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">{allRooms.length}</p>
              <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Rooms</p>
            </div>
            <div className="w-px h-[28px] bg-[#E5E7EB]" />
            <div className="text-center">
              <p className="font-['Inter',sans-serif] text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">{totalObjects}</p>
              <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Objects</p>
            </div>
            <div className="w-px h-[28px] bg-[#E5E7EB]" />
            <div className="text-center">
              <p className="font-['Inter',sans-serif] text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">
                {formatArea(allRooms.reduce((sum, r) => sum + (r.bounds[1] - r.bounds[0]) * (r.bounds[3] - r.bounds[2]), 0), unitSystem)}
              </p>
              <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Total Area</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Nothing Selected — shouldn't render, but fallback ═══
  return (
    <div className="flex flex-col h-full bg-white items-center justify-center px-8">
      <div className="size-[48px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center mb-3">
        <Settings className="size-[20px] text-[#ABABAB]" strokeWidth={1.5} />
      </div>
      <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A] text-center">Select an object or room to view properties</p>
    </div>
  );
}

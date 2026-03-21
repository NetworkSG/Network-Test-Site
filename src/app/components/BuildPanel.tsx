import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, X, ChevronLeft, ChevronDown, ChevronRight,
  Plus, Square, PenTool, DoorOpen, Grid3X3,
  Layers, Minus, Move
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
export type EditorTool = 
  | "select" 
  | "draw-room" 
  | "draw-walls" 
  | "add-door" 
  | "add-window" 
  | "delete";

export interface RoomTemplate {
  id: string;
  name: string;
  width: number;  // meters
  depth: number;  // meters
  icon: string;   // emoji or label
}

interface BuildPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onAddRoomTemplate: (template: RoomTemplate) => void;
  onImportFloorPlan?: () => void;
}

/* ═══════════════════════════════════════════════════════
   Build Panel Component
   ═══════════════════════════════════════════════════════ */
export function BuildPanel({
  isOpen, onClose, activeTool, onToolChange, onAddRoomTemplate, onImportFloorPlan,
}: BuildPanelProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="absolute top-3 left-[68px] z-30 w-[280px] max-h-[calc(100%-24px)] flex flex-col"
    >
      {/* Content removed */}
    </motion.div>
  );
}

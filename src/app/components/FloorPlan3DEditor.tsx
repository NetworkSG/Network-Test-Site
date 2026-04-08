import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { buildFurnitureModel } from "./furniture-models";
import { retrieveAnalysis, clearStoredAnalysis } from "./floor-plan-analyzer";
import type { ParsedHouseRoomDef } from "./floor-plan-analyzer";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase as supabaseClient } from "./supabaseClient";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

async function getEditorAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      // Session may be expired — try refreshing
      const { data: refreshData } = await supabaseClient.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        headers["X-User-Token"] = refreshData.session.access_token;
      }
    } else if (data?.session?.access_token) {
      headers["X-User-Token"] = data.session.access_token;
    }
  } catch (e) {
    console.error("[Editor Auth] Failed to get auth token:", e);
  }
  return headers;
}
import {
  ChevronLeft,
  ChevronDown,
  X,
  Search,
  Plus,
  Trash2,
  RotateCw,
  Move,
  Sofa,
  Armchair,
  Square,
  Bed,
  Box,
  Lamp,
  CookingPot,
  Monitor,
  Bath,
  Grid3X3,
  Paintbrush,
  Sun,
  Camera,
  Pencil,
  Eye,
  CircleHelp,
  Settings,
  Maximize2,
  Info,
  Check,
  Clock,
  Sparkles,
  TreePine,
  Flower2,
  Footprints,
  ShowerHead,
  CircleDot,
  Fan,
  Wine,
  Circle,
  Home,
  Layers,
  ChevronRight,
  ArrowRight,
  Undo2,
  Redo2,
  Save,
  Loader2,
  AlertTriangle,
  Download,
  Image,
  Copy,
  MoreHorizontal,
  FlipHorizontal2,

  Keyboard,
  ZoomIn,
  ZoomOut,

  // Additional icons for expanded catalog
  Lightbulb,
  Plug,
  Tv,
  Laptop,
  Speaker,
  Flame,
  Music,
  Dumbbell,
  Waves,
  User,
  Frame,
  Thermometer,
  Baby,
  UtensilsCrossed,
  PawPrint,
  Car,
  Landmark,
  Building2,
  Wind,
  Archive,
  Headphones,
  Fish,
  Bike,
  Gamepad2,
  FileText,
} from "lucide-react";
import { Editor2DView, type EditableRoom, type StandaloneWall } from "./Editor2DView";
import { MobileBottomNav } from "./MobileBottomNav";
import type { EditorTool } from "./BuildPanel";
import { RenderModeOverlay } from "./RenderModeOverlay";
import {
  Editor3DToolbar,
  Editor3DInfoBar,
  Editor3DPropertiesBar,
  Editor3DViewToggle,
  Editor3DBottomBar,
  Editor3DHelpTips,
  Editor3DActiveToolIndicator,
  Editor3DRoomSwitcher,
  Editor3DPanelToggle,
  type Editor3DTool,
} from "./Editor3DOverlay";

/* ═══════════════════════════════════════════════════════
   Types & Interfaces
   ═══════════════════════════════════════════════════════ */
type LeftPanel = "furniture" | "customize" | null;
type CustomizeTab = "materials" | "lighting" | "camera";

interface PlacedItem {
  id: string;
  furnitureId: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  dimensions: [number, number, number];
  color: string;
  category: string;
}

interface SceneMaterials {
  walls: string;
  floors: string;
  ceiling: string;
}

interface SceneLighting {
  timeOfDay: number;
  intensity: number;
  ceilingLight: boolean;
  floorLamp: boolean;
  accentLight: boolean;
  underCabinet: boolean;
}

/* ═══════════════════════════════════════════════════════
   Furniture Catalog
   ═══════════════════════════════════════════════════════ */
interface CatalogItem {
  id: string;
  name: string;
  category: string;
  icon: typeof Sofa;
  dimensions: [number, number, number];
  color: string;
}

const FURNITURE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "seating", label: "Seating" },
  { id: "tables", label: "Tables" },
  { id: "beds", label: "Beds" },
  { id: "storage", label: "Storage" },
  { id: "office", label: "Office" },
  { id: "children", label: "Children" },
  { id: "kitchen", label: "Kitchen" },
  { id: "kitchen-appliances", label: "Appliances" },
  { id: "bathroom", label: "Bathroom" },
  { id: "lighting", label: "Lighting" },
  { id: "video-tv", label: "TV & Media" },
  { id: "household", label: "Household" },
  { id: "climate", label: "Climate" },
  { id: "computers", label: "Computers" },
  { id: "audio", label: "Audio" },
  { id: "decor", label: "Decor" },
  { id: "plants", label: "Plants" },
  { id: "rugs", label: "Rugs" },
  { id: "curtains", label: "Curtains" },
  { id: "kitchenware", label: "Kitchenware" },
  { id: "fireplaces", label: "Fireplaces" },
  { id: "equipment", label: "Equipment" },
  { id: "sport", label: "Sport" },
  { id: "musical-instruments", label: "Instruments" },
  { id: "pets", label: "Pets" },
  { id: "people", label: "People" },
  { id: "sockets", label: "Sockets" },
  { id: "holidays", label: "Holidays" },
  { id: "public-spaces", label: "Public" },
  { id: "garage", label: "Garage" },
];

const CATALOG: CatalogItem[] = [
  // ══════════════════════════════════════
  // INTERIOR > FURNITURE
  // ══════════════════════════════════════
  // ── Upholstered / Seating ──
  { id: "sofa", name: "3-Seater Sofa", category: "seating", icon: Sofa, dimensions: [2.1, 0.85, 0.9], color: "#8A8A8A" },
  { id: "sofa-2", name: "2-Seater Sofa", category: "seating", icon: Sofa, dimensions: [1.5, 0.85, 0.9], color: "#8A8A8A" },
  { id: "armchair", name: "Armchair", category: "seating", icon: Armchair, dimensions: [0.8, 0.85, 0.8], color: "#8A8A8A" },
  { id: "settee", name: "Settee", category: "seating", icon: Sofa, dimensions: [1.4, 0.75, 0.7], color: "#8A8A8A" },
  { id: "lounge-chair", name: "Lounge Chair", category: "seating", icon: Armchair, dimensions: [0.8, 0.9, 0.85], color: "#8A8A8A" },
  { id: "bar-stool", name: "Bar Stool", category: "seating", icon: Armchair, dimensions: [0.4, 0.75, 0.4], color: "#8A8A8A" },
  { id: "dining-chair", name: "Dining Chair", category: "seating", icon: Armchair, dimensions: [0.45, 0.85, 0.5], color: "#C4A46C" },
  { id: "ottoman", name: "Ottoman / Pouf", category: "seating", icon: CircleDot, dimensions: [0.56, 0.35, 0.56], color: "#8A8A8A" },
  { id: "recliner", name: "Recliner", category: "seating", icon: Armchair, dimensions: [0.85, 1.0, 1.1], color: "#6B4E35" },
  { id: "bean-bag", name: "Bean Bag", category: "seating", icon: CircleDot, dimensions: [0.8, 0.7, 0.9], color: "#B0B0B0" },
  { id: "l-sofa", name: "L-Shaped Sofa", category: "seating", icon: Sofa, dimensions: [2.6, 0.85, 2.0], color: "#8A8A8A" },
  // ── Beds ──
  { id: "queen-bed", name: "Queen Bed", category: "beds", icon: Bed, dimensions: [1.53, 0.5, 2.03], color: "#E8E0D4" },
  { id: "king-bed", name: "King Bed", category: "beds", icon: Bed, dimensions: [1.83, 0.5, 2.03], color: "#D4C4B0" },
  { id: "single-bed", name: "Single Bed", category: "beds", icon: Bed, dimensions: [0.91, 0.5, 1.9], color: "#E8E0D4" },
  { id: "super-single", name: "Super Single Bed", category: "beds", icon: Bed, dimensions: [1.07, 0.5, 1.9], color: "#E8E0D4" },
  { id: "nightstand", name: "Bedside Table", category: "beds", icon: Box, dimensions: [0.5, 0.55, 0.4], color: "#C4A46C" },
  { id: "daybed", name: "Daybed", category: "beds", icon: Bed, dimensions: [2.0, 0.6, 0.9], color: "#D4C4B0" },
  { id: "murphy-bed", name: "Murphy Bed", category: "beds", icon: Bed, dimensions: [1.53, 2.1, 0.4], color: "#FFFFFF" },
  // ── Storage ──
  { id: "bookshelf", name: "Bookshelf", category: "storage", icon: Box, dimensions: [0.8, 1.8, 0.35], color: "#C4A46C" },
  { id: "bookshelf-sm", name: "Bookshelf (Small)", category: "storage", icon: Box, dimensions: [0.6, 1.2, 0.3], color: "#C4A46C" },
  { id: "tv-console", name: "TV Console", category: "storage", icon: Box, dimensions: [1.8, 0.5, 0.4], color: "#6B4E35" },
  { id: "shoe-cabinet", name: "Shoe Cabinet", category: "storage", icon: Box, dimensions: [1.0, 0.9, 0.35], color: "#FFFFFF" },
  { id: "wardrobe", name: "Wardrobe (2-Door)", category: "storage", icon: Box, dimensions: [1.2, 2.1, 0.6], color: "#FFFFFF" },
  { id: "wardrobe-3", name: "Wardrobe (3-Door)", category: "storage", icon: Box, dimensions: [1.8, 2.1, 0.6], color: "#FFFFFF" },
  { id: "dresser", name: "Dresser / Vanity", category: "storage", icon: Box, dimensions: [1.0, 0.75, 0.45], color: "#FFFFFF" },
  { id: "wine-rack", name: "Wine Rack", category: "storage", icon: Wine, dimensions: [0.6, 0.9, 0.3], color: "#8A8A8A" },
  { id: "storage-rack", name: "Storage Rack", category: "storage", icon: Box, dimensions: [0.9, 1.8, 0.45], color: "#A0A0A0" },
  { id: "sideboard", name: "Sideboard", category: "storage", icon: Box, dimensions: [1.5, 0.8, 0.45], color: "#C4A46C" },
  { id: "hall-closet", name: "Hall Closet", category: "storage", icon: Box, dimensions: [1.0, 2.1, 0.6], color: "#FFFFFF" },
  // ── Tables, Chairs ──
  { id: "dining-table", name: "Dining Table (4-Pax)", category: "tables", icon: Square, dimensions: [1.2, 0.75, 0.8], color: "#C4A46C" },
  { id: "dining-table-6", name: "Dining Table (6-Pax)", category: "tables", icon: Square, dimensions: [1.6, 0.75, 0.9], color: "#C4A46C" },
  { id: "coffee-table", name: "Coffee Table", category: "tables", icon: Square, dimensions: [1.2, 0.45, 0.6], color: "#C4A46C" },
  { id: "round-table", name: "Round Dining Table", category: "tables", icon: Circle, dimensions: [1.1, 0.76, 1.1], color: "#C4A46C" },
  { id: "side-table", name: "Side Table", category: "tables", icon: Square, dimensions: [0.5, 0.55, 0.5], color: "#8A8A8A" },
  { id: "console-table", name: "Console Table", category: "tables", icon: Square, dimensions: [1.2, 0.78, 0.35], color: "#8A8A8A" },
  { id: "bar-counter", name: "Bar Countertop", category: "tables", icon: Square, dimensions: [1.5, 1.0, 0.5], color: "#8A8A8A" },
  { id: "folding-table", name: "Folding Table", category: "tables", icon: Square, dimensions: [1.2, 0.75, 0.6], color: "#D0D0D0" },
  { id: "nesting-tables", name: "Nesting Tables", category: "tables", icon: Square, dimensions: [0.5, 0.5, 0.4], color: "#C4A46C" },
  // ── Office Furniture ──
  { id: "office-chair", name: "Office Chair", category: "office", icon: Armchair, dimensions: [0.6, 1.0, 0.6], color: "#2D2D2D" },
  { id: "desk", name: "Study Desk", category: "office", icon: Monitor, dimensions: [1.2, 0.75, 0.6], color: "#C4A46C" },
  { id: "desk-setup", name: "Desktop Setup", category: "office", icon: Monitor, dimensions: [1.4, 0.75, 0.7], color: "#8A8A8A" },
  { id: "standing-desk", name: "Standing Desk", category: "office", icon: Monitor, dimensions: [1.4, 1.1, 0.7], color: "#C4A46C" },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "office", icon: Archive, dimensions: [0.4, 0.7, 0.5], color: "#A0A0A0" },
  { id: "office-bookshelf", name: "Office Bookshelf", category: "office", icon: Box, dimensions: [0.9, 1.8, 0.35], color: "#C4A46C" },
  { id: "whiteboard", name: "Whiteboard", category: "office", icon: Frame, dimensions: [1.2, 0.9, 0.05], color: "#FFFFFF" },
  // ── Children's Furniture ──
  { id: "crib", name: "Baby Crib", category: "children", icon: Baby, dimensions: [0.7, 0.9, 1.3], color: "#FFFFFF" },
  { id: "bunk-bed", name: "Bunk Bed", category: "children", icon: Bed, dimensions: [1.0, 1.6, 2.0], color: "#C4A46C" },
  { id: "toy-box", name: "Toy Storage Box", category: "children", icon: Box, dimensions: [0.8, 0.5, 0.5], color: "#E8E0D4" },
  { id: "kids-desk", name: "Kids Study Desk", category: "children", icon: Square, dimensions: [0.8, 0.6, 0.5], color: "#C4A46C" },
  { id: "kids-chair", name: "Kids Chair", category: "children", icon: Armchair, dimensions: [0.4, 0.6, 0.4], color: "#8A8A8A" },
  { id: "changing-table", name: "Changing Table", category: "children", icon: Square, dimensions: [0.9, 0.9, 0.6], color: "#FFFFFF" },
  // ── Kitchen (structural) ──
  { id: "kitchen-counter", name: "Kitchen Counter (L-Shape)", category: "kitchen", icon: CookingPot, dimensions: [2.1, 0.9, 0.6], color: "#FFFFFF" },
  { id: "kitchen-island", name: "Kitchen Island", category: "kitchen", icon: CookingPot, dimensions: [1.58, 0.9, 0.72], color: "#8A8A8A" },
  { id: "upper-cabinet", name: "Upper Cabinet", category: "kitchen", icon: Box, dimensions: [0.6, 0.7, 0.35], color: "#FFFFFF" },
  { id: "lower-cabinet", name: "Lower Cabinet", category: "kitchen", icon: Box, dimensions: [0.6, 0.85, 0.6], color: "#FFFFFF" },
  { id: "kitchen-sink", name: "Kitchen Sink", category: "kitchen", icon: CookingPot, dimensions: [0.8, 0.2, 0.5], color: "#C0C0C0" },
  { id: "pantry-shelf", name: "Pantry Shelf", category: "kitchen", icon: Box, dimensions: [0.8, 1.8, 0.4], color: "#C4A46C" },
  // ── Bathroom ──
  { id: "toilet", name: "Toilet Bowl", category: "bathroom", icon: Bath, dimensions: [0.4, 0.4, 0.7], color: "#F5F5F5" },
  { id: "wash-basin", name: "Wash Basin (Wall)", category: "bathroom", icon: Bath, dimensions: [0.5, 0.2, 0.4], color: "#F5F5F5" },
  { id: "vanity-cabinet", name: "Vanity Cabinet", category: "bathroom", icon: Bath, dimensions: [0.6, 0.8, 0.45], color: "#FFFFFF" },
  { id: "shower", name: "Shower Screen", category: "bathroom", icon: ShowerHead, dimensions: [0.9, 1.9, 0.05], color: "#E8E8E8" },
  { id: "bathtub", name: "Bathtub", category: "bathroom", icon: Bath, dimensions: [1.7, 0.6, 0.75], color: "#F0F0F0" },
  { id: "towel-rack", name: "Towel Rack", category: "bathroom", icon: Bath, dimensions: [0.6, 0.05, 0.1], color: "#C0C0C0" },
  { id: "bath-mirror", name: "Bathroom Mirror", category: "bathroom", icon: Circle, dimensions: [0.6, 0.8, 0.05], color: "#E0E0E0" },
  { id: "bidet", name: "Bidet", category: "bathroom", icon: Bath, dimensions: [0.4, 0.4, 0.6], color: "#F5F5F5" },
  { id: "laundry-basket", name: "Laundry Basket", category: "bathroom", icon: Box, dimensions: [0.4, 0.6, 0.3], color: "#C4A46C" },
  // ── Public Spaces ──
  { id: "reception-desk", name: "Reception Desk", category: "public-spaces", icon: Square, dimensions: [2.0, 1.1, 0.8], color: "#C4A46C" },
  { id: "waiting-bench", name: "Waiting Bench", category: "public-spaces", icon: Sofa, dimensions: [1.8, 0.45, 0.5], color: "#8A8A8A" },
  { id: "display-shelf", name: "Display Shelf", category: "public-spaces", icon: Box, dimensions: [1.2, 1.8, 0.4], color: "#FFFFFF" },
  { id: "locker-unit", name: "Locker Unit", category: "public-spaces", icon: Box, dimensions: [0.9, 1.8, 0.5], color: "#A0A0A0" },

  // ══════════════════════════════════════
  // INTERIOR > ELECTRICAL APPLIANCES
  // ══════════════════════════════════════
  // ── Lighting ──
  { id: "floor-lamp", name: "Floor Lamp", category: "lighting", icon: Lamp, dimensions: [0.3, 1.6, 0.3], color: "#2D2D2D" },
  { id: "pendant", name: "Pendant Light", category: "lighting", icon: Lamp, dimensions: [0.4, 0.3, 0.4], color: "#8A8A8A" },
  { id: "table-lamp", name: "Table Lamp", category: "lighting", icon: Lamp, dimensions: [0.25, 0.45, 0.25], color: "#E8E0D4" },
  { id: "wall-sconce", name: "Wall Sconce", category: "lighting", icon: Lightbulb, dimensions: [0.15, 0.25, 0.12], color: "#C4A46C" },
  { id: "chandelier", name: "Chandelier", category: "lighting", icon: Lightbulb, dimensions: [0.6, 0.5, 0.6], color: "#C4A46C" },
  { id: "led-strip", name: "LED Strip Light", category: "lighting", icon: Lightbulb, dimensions: [2.0, 0.02, 0.02], color: "#FFFFFF" },
  { id: "desk-lamp", name: "Desk Lamp", category: "lighting", icon: Lamp, dimensions: [0.2, 0.45, 0.2], color: "#2D2D2D" },
  // ── Sockets, Switches ──
  { id: "wall-socket", name: "Wall Socket", category: "sockets", icon: Plug, dimensions: [0.08, 0.08, 0.04], color: "#FFFFFF" },
  { id: "light-switch", name: "Light Switch", category: "sockets", icon: Plug, dimensions: [0.07, 0.12, 0.03], color: "#FFFFFF" },
  { id: "usb-outlet", name: "USB Wall Outlet", category: "sockets", icon: Plug, dimensions: [0.08, 0.08, 0.04], color: "#FFFFFF" },
  // ── Household Appliances ──
  { id: "washer", name: "Washing Machine", category: "household", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#E8E8E8" },
  { id: "dryer", name: "Clothes Dryer", category: "household", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#E8E8E8" },
  { id: "ironing-board", name: "Ironing Board", category: "household", icon: Box, dimensions: [0.4, 1.2, 0.15], color: "#E0E0E0" },
  { id: "vacuum", name: "Vacuum Cleaner", category: "household", icon: Box, dimensions: [0.35, 1.1, 0.3], color: "#808080" },
  { id: "robot-vacuum", name: "Robot Vacuum", category: "household", icon: Circle, dimensions: [0.35, 0.1, 0.35], color: "#2D2D2D" },
  { id: "steam-mop", name: "Steam Mop", category: "household", icon: Box, dimensions: [0.3, 1.2, 0.2], color: "#A0A0A0" },
  // ── Video and TV ──
  { id: "tv", name: "Wall TV 65\"", category: "video-tv", icon: Monitor, dimensions: [1.45, 0.85, 0.08], color: "#1A1A1A" },
  { id: "tv-55", name: "Wall TV 55\"", category: "video-tv", icon: Monitor, dimensions: [1.22, 0.72, 0.08], color: "#1A1A1A" },
  { id: "projector", name: "Projector", category: "video-tv", icon: Monitor, dimensions: [0.3, 0.12, 0.25], color: "#FFFFFF" },
  { id: "projector-screen", name: "Projector Screen", category: "video-tv", icon: Frame, dimensions: [2.0, 1.2, 0.05], color: "#FFFFFF" },
  // ── Kitchen Appliances ──
  { id: "oven", name: "Kitchen Range / Oven", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.74, 0.9, 0.64], color: "#D0D0D0" },
  { id: "microwave", name: "Microwave", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.5, 0.3, 0.4], color: "#2D2D2D" },
  { id: "fridge", name: "Refrigerator", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.7, 1.7, 0.78], color: "#D0D0D0" },
  { id: "dishwasher", name: "Dishwasher", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#D0D0D0" },
  { id: "coffee-machine", name: "Coffee Machine", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.25, 0.4, 0.35], color: "#2D2D2D" },
  { id: "toaster-oven", name: "Toaster Oven", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.4, 0.25, 0.3], color: "#D0D0D0" },
  { id: "range-hood", name: "Range Hood", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.6, 0.4, 0.5], color: "#D0D0D0" },
  // ── Climate ──
  { id: "ceiling-fan", name: "Ceiling Fan", category: "climate", icon: Fan, dimensions: [0.8, 0.35, 0.8], color: "#888888" },
  { id: "air-conditioner", name: "Wall AC Unit", category: "climate", icon: Wind, dimensions: [0.9, 0.3, 0.2], color: "#FFFFFF" },
  { id: "space-heater", name: "Space Heater", category: "climate", icon: Thermometer, dimensions: [0.3, 0.6, 0.2], color: "#D0D0D0" },
  { id: "humidifier", name: "Humidifier", category: "climate", icon: Wind, dimensions: [0.25, 0.35, 0.25], color: "#FFFFFF" },
  { id: "tower-fan", name: "Tower Fan", category: "climate", icon: Fan, dimensions: [0.3, 1.0, 0.3], color: "#2D2D2D" },
  // ── Computers ──
  { id: "desktop-pc", name: "Desktop Computer", category: "computers", icon: Monitor, dimensions: [0.2, 0.45, 0.45], color: "#2D2D2D" },
  { id: "laptop", name: "Laptop", category: "computers", icon: Laptop, dimensions: [0.35, 0.02, 0.25], color: "#C0C0C0" },
  { id: "monitor-stand", name: "Monitor Stand", category: "computers", icon: Monitor, dimensions: [0.5, 0.08, 0.25], color: "#2D2D2D" },
  { id: "printer", name: "Printer", category: "computers", icon: Box, dimensions: [0.45, 0.2, 0.35], color: "#2D2D2D" },
  // ── Audio ──
  { id: "bt-speaker", name: "Bluetooth Speaker", category: "audio", icon: Speaker, dimensions: [0.2, 0.12, 0.1], color: "#2D2D2D" },
  { id: "soundbar", name: "Soundbar", category: "audio", icon: Speaker, dimensions: [1.0, 0.08, 0.1], color: "#2D2D2D" },
  { id: "bookshelf-speakers", name: "Bookshelf Speakers", category: "audio", icon: Speaker, dimensions: [0.2, 0.3, 0.2], color: "#6B4E35" },
  { id: "turntable", name: "Turntable", category: "audio", icon: Music, dimensions: [0.45, 0.15, 0.4], color: "#C4A46C" },
  // ── Equipment ──
  { id: "treadmill", name: "Treadmill", category: "equipment", icon: Dumbbell, dimensions: [0.8, 1.4, 1.9], color: "#2D2D2D" },
  { id: "exercise-bike", name: "Exercise Bike", category: "equipment", icon: Bike, dimensions: [0.55, 1.2, 1.1], color: "#2D2D2D" },
  { id: "weight-bench", name: "Weight Bench", category: "equipment", icon: Dumbbell, dimensions: [0.65, 0.5, 1.3], color: "#A0A0A0" },
  { id: "elliptical", name: "Elliptical Machine", category: "equipment", icon: Dumbbell, dimensions: [0.7, 1.7, 1.7], color: "#2D2D2D" },

  // ══════════════════════════════════════
  // INTERIOR > MISC
  // ══════════════════════════════════════
  // ── Decor ──
  { id: "mirror", name: "Wall Mirror (Round)", category: "decor", icon: Circle, dimensions: [0.72, 0.72, 0.04], color: "#888888" },
  { id: "wall-art", name: "Wall Art / Canvas", category: "decor", icon: Frame, dimensions: [0.8, 0.6, 0.03], color: "#E8E0D4" },
  { id: "vase", name: "Decorative Vase", category: "decor", icon: Flower2, dimensions: [0.2, 0.4, 0.2], color: "#C8B8A0" },
  { id: "wall-clock", name: "Wall Clock", category: "decor", icon: Circle, dimensions: [0.35, 0.35, 0.05], color: "#2D2D2D" },
  { id: "photo-frames", name: "Photo Frame Set", category: "decor", icon: Frame, dimensions: [0.6, 0.4, 0.03], color: "#C4A46C" },
  { id: "sculpture", name: "Decorative Sculpture", category: "decor", icon: Box, dimensions: [0.25, 0.5, 0.25], color: "#D4C4B0" },
  // ── Curtains, Blinds ──
  { id: "curtain", name: "Window Curtain", category: "curtains", icon: Layers, dimensions: [1.5, 2.4, 0.1], color: "#E8E0D4" },
  { id: "roman-blind", name: "Roman Blind", category: "curtains", icon: Layers, dimensions: [1.2, 1.5, 0.08], color: "#D4C4B0" },
  { id: "roller-shade", name: "Roller Shade", category: "curtains", icon: Layers, dimensions: [1.2, 1.5, 0.05], color: "#FFFFFF" },
  { id: "sheer-curtain", name: "Sheer Curtain", category: "curtains", icon: Layers, dimensions: [1.5, 2.4, 0.05], color: "#FAFAFA" },
  // ── Rugs ──
  { id: "rug", name: "Area Rug", category: "rugs", icon: Footprints, dimensions: [2.0, 0.02, 1.4], color: "#C8B8A0" },
  { id: "runner-rug", name: "Runner Rug", category: "rugs", icon: Footprints, dimensions: [2.4, 0.02, 0.7], color: "#8A8A8A" },
  { id: "round-rug", name: "Round Rug", category: "rugs", icon: Circle, dimensions: [1.5, 0.02, 1.5], color: "#D4C4B0" },
  { id: "bath-mat", name: "Bath Mat", category: "rugs", icon: Footprints, dimensions: [0.8, 0.02, 0.5], color: "#FFFFFF" },
  // ── Kitchenware ──
  { id: "knife-block", name: "Knife Block", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.12, 0.35, 0.1], color: "#C4A46C" },
  { id: "fruit-bowl", name: "Fruit Bowl", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.3, 0.15, 0.3], color: "#C8B8A0" },
  { id: "spice-rack", name: "Spice Rack", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.4, 0.3, 0.1], color: "#C4A46C" },
  { id: "dish-rack", name: "Dish Drying Rack", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.45, 0.3, 0.3], color: "#C0C0C0" },
  // ── Fireplaces ──
  { id: "electric-fireplace", name: "Electric Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.2, 0.9, 0.3], color: "#2D2D2D" },
  { id: "wood-fireplace", name: "Wood Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.4, 1.2, 0.5], color: "#A0603A" },
  { id: "gas-fireplace", name: "Gas Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.0, 0.8, 0.3], color: "#2D2D2D" },
  // ── Plants ──
  { id: "plant", name: "Potted Plant (Small)", category: "plants", icon: Flower2, dimensions: [0.3, 0.6, 0.3], color: "#C8B8A0" },
  { id: "floor-plant", name: "Floor Plant (Large)", category: "plants", icon: TreePine, dimensions: [0.4, 1.2, 0.4], color: "#D0C0A8" },
  { id: "hanging-plant", name: "Hanging Plant", category: "plants", icon: Flower2, dimensions: [0.3, 0.5, 0.3], color: "#C8B8A0" },
  { id: "succulent-set", name: "Succulent Set", category: "plants", icon: Flower2, dimensions: [0.35, 0.15, 0.2], color: "#A0B090" },
  { id: "herb-garden", name: "Herb Garden Box", category: "plants", icon: Flower2, dimensions: [0.5, 0.3, 0.2], color: "#A0B090" },
  { id: "fiddle-leaf", name: "Fiddle Leaf Fig", category: "plants", icon: TreePine, dimensions: [0.5, 1.5, 0.5], color: "#D0C0A8" },
  // ── People ──
  { id: "standing-figure", name: "Standing Figure", category: "people", icon: User, dimensions: [0.45, 1.75, 0.3], color: "#D4C4B0" },
  { id: "seated-figure", name: "Seated Figure", category: "people", icon: User, dimensions: [0.45, 1.2, 0.5], color: "#D4C4B0" },
  // ── Musical Instruments ──
  { id: "upright-piano", name: "Upright Piano", category: "musical-instruments", icon: Music, dimensions: [1.5, 1.2, 0.65], color: "#2D2D2D" },
  { id: "grand-piano", name: "Grand Piano", category: "musical-instruments", icon: Music, dimensions: [1.55, 1.0, 2.2], color: "#2D2D2D" },
  { id: "guitar-stand", name: "Guitar Stand", category: "musical-instruments", icon: Music, dimensions: [0.4, 1.0, 0.3], color: "#C4A46C" },
  { id: "drum-kit", name: "Drum Kit", category: "musical-instruments", icon: Music, dimensions: [1.5, 1.2, 1.2], color: "#C0C0C0" },
  // ── Sport ──
  { id: "yoga-mat", name: "Yoga Mat", category: "sport", icon: Dumbbell, dimensions: [0.6, 0.01, 1.8], color: "#A0B090" },
  { id: "punching-bag", name: "Punching Bag", category: "sport", icon: Dumbbell, dimensions: [0.35, 1.0, 0.35], color: "#8A8A8A" },
  { id: "dumbbell-rack", name: "Dumbbell Rack", category: "sport", icon: Dumbbell, dimensions: [1.0, 0.8, 0.55], color: "#A0A0A0" },
  // ── Holidays ──
  { id: "christmas-tree", name: "Christmas Tree", category: "holidays", icon: TreePine, dimensions: [0.8, 1.8, 0.8], color: "#2D6B2D" },
  { id: "menorah", name: "Menorah", category: "holidays", icon: Lightbulb, dimensions: [0.4, 0.35, 0.1], color: "#C4A46C" },
  // ── Pets ──
  { id: "pet-bed", name: "Pet Bed", category: "pets", icon: PawPrint, dimensions: [0.6, 0.2, 0.5], color: "#D4C4B0" },
  { id: "cat-tree", name: "Cat Tree", category: "pets", icon: PawPrint, dimensions: [0.5, 1.5, 0.5], color: "#C4A46C" },
  { id: "fish-tank", name: "Fish Tank", category: "pets", icon: Fish, dimensions: [0.8, 0.5, 0.35], color: "#E0E0E0" },
  { id: "pet-crate", name: "Pet Crate", category: "pets", icon: PawPrint, dimensions: [0.8, 0.6, 0.5], color: "#A0A0A0" },

  // ══════════════════════════════════════
  // EXTERIOR
  // ══════════════════════════════════════
  // ── Garage ──
  { id: "car", name: "Sedan Car", category: "garage", icon: Car, dimensions: [1.8, 1.5, 4.5], color: "#8A8A8A" },
  { id: "suv", name: "SUV", category: "garage", icon: Car, dimensions: [2.0, 1.7, 4.8], color: "#2D2D2D" },
  { id: "tool-bench", name: "Tool Workbench", category: "garage", icon: Box, dimensions: [1.5, 0.9, 0.6], color: "#A0A0A0" },
  { id: "storage-shelving", name: "Garage Shelving", category: "garage", icon: Box, dimensions: [1.2, 1.8, 0.4], color: "#A0A0A0" },
];

// Dining table + chair IDs that can overlap each other (chairs tucked under table)
const DINING_TABLE_IDS = new Set(["dining-table", "dining-table-6", "round-table"]);
const DINING_CHAIR_IDS = new Set(["dining-chair", "bar-stool"]);

const MATERIAL_DEFS = {
  walls: {
    "White Paint": "#FAFAFA", "Warm White Paint": "#F5F0E8", "Cream Paint": "#F5EDE0",
    "Light Gray Paint": "#E0DDD8", "Sage Green Paint": "#B8C5B2", "Dusty Rose Paint": "#D4B5B0",
    "Gray Paint": "#D0D0D0", "Charcoal Accent": "#3A3A3A",
    "Wallpaper - Linen": "#E8DCC8", "Wallpaper - Geometric": "#D4C8B8",
    "Exposed Brick": "#A0603A", "Wood Paneling": "#C9A87C",
    "Concrete": "#ACA79E", "Subway Tile": "#FFFFFF",
  } as Record<string, string>,
  floors: {
    "Porcelain Tile (White)": "#F0EDE8", "Porcelain Tile (Gray)": "#C8C3BC",
    "Vinyl Plank (Light Oak)": "#D4B896", "Vinyl Plank (Walnut)": "#7A5C42",
    "Oak Hardwood": "#C4A46C", "Walnut Hardwood": "#6B4E35",
    "Engineered Wood (Ash)": "#E8DCCA", "Engineered Wood (Teak)": "#B5875A",
    "White Marble": "#F0EDE8", "Cement Screed": "#B8B0A6",
    "Terrazzo": "#E2DAD0", "Mosaic Tile": "#D6E4E0",
    "Gray Tile": "#A0A0A0", "Concrete": "#B0B0B0",
  } as Record<string, string>,
  ceiling: {
    "Flat White": "#FAFAFA", "Matte Gray": "#E0E0E0",
    "Wood Panels": "#C8A870", "Exposed Beams": "#8B6E4E",
    "Cove Lighting": "#F5F5F0", "False Ceiling": "#F0F0F0",
  } as Record<string, string>,
};

const MATERIALS_UI = [
  { id: "walls", label: "Walls", options: Object.keys(MATERIAL_DEFS.walls) },
  { id: "floors", label: "Floors", options: Object.keys(MATERIAL_DEFS.floors) },
  { id: "ceiling", label: "Ceiling", options: Object.keys(MATERIAL_DEFS.ceiling) },
];

// ROOMS is derived after HOUSE_ROOM_DEFS + import override (see below)

/* ═══════════════════════════════════════════════════════
   Room Hotspot Zones — 3D positions & camera presets
   ═══════════════════════════════════════════════════════ */
interface RoomZone {
  id: string;
  label: string;
  icon: string;
  position: [number, number, number]; // 3D hotspot anchor
  camera: [number, number, number];   // camera fly-to position
  target: [number, number, number];   // controls.target fly-to
}

const ROOM_ZONES: RoomZone[] = [
  { id: "living", label: "Living Area", icon: "🛋️", position: [1.5, 0.05, 0.6], camera: [4.5, 3.2, 4.2], target: [1.5, 0.3, 0.5] },
  { id: "reading", label: "Reading Nook", icon: "📚", position: [-2.5, 0.05, -1.6], camera: [-0.5, 3.0, 0.5], target: [-2.5, 0.4, -1.6] },
  { id: "entrance", label: "Entrance", icon: "🚪", position: [-2.6, 0.05, 0.8], camera: [-0.5, 2.5, 3.5], target: [-2.6, 0.4, 0.8] },
  { id: "window", label: "Window Side", icon: "🪟", position: [2.5, 0.05, -0.8], camera: [0.5, 3.0, -3.5], target: [2.5, 0.6, -0.8] },
  { id: "center", label: "Room Center", icon: "✦", position: [0, 0.05, 0], camera: [6, 5, 6], target: [0, 0.5, 0] },
];

/* ═══════════════════════════════════════════════════════
   Multi-Room House Definitions
   ═══════════════════════════════════════════════════════ */
const WALL_H = 2.6;
const WALL_THICK = 0.12; // Wall thickness in meters (120mm)

interface HouseRoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number]; // xMin, xMax, zMin, zMax
  polygon?: [number, number][]; // Optional polygon for L/T/+ shaped rooms
  floorColor: string;
  wallColor: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  svg: { x: number; y: number; w: number; h: number };
  accent: string;
  furniture: [string, number, number, number, number][]; // [furnitureId, x, y, z, rotDeg]
  doors: { side: "north" | "south" | "east" | "west"; t: number; w: number; flipped?: boolean }[];
  windows: { side: "north" | "south" | "east" | "west"; t: number; w: number; h: number; sillH: number }[];
  defaultMaterials: SceneMaterials;
  defaultLighting: SceneLighting;
}

interface RoomBounds {
  minX: number; maxX: number; minZ: number; maxZ: number;
  polygon?: [number, number][]; // inset polygon for polygon-shaped rooms
}

/** Ray-casting point-in-polygon test (works for any simple polygon) */
function pointInPoly(poly: [number, number][], px: number, pz: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (((zi > pz) !== (zj > pz)) && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi))
      inside = !inside;
  }
  return inside;
}

/** Check if all 4 corners of an axis-aligned box are inside a polygon */
function boxInPoly(poly: [number, number][], bMinX: number, bMaxX: number, bMinZ: number, bMaxZ: number): boolean {
  return pointInPoly(poly, bMinX, bMinZ) && pointInPoly(poly, bMaxX, bMinZ) &&
         pointInPoly(poly, bMinX, bMaxZ) && pointInPoly(poly, bMaxX, bMaxZ);
}

/** Inset a rectilinear polygon by a uniform distance (shrinks the polygon inward).
 *  Uses per-vertex offset along the bisector of adjacent edges' inward normals. */
function insetPolygon(poly: [number, number][], dist: number): [number, number][] {
  const n = poly.length;
  if (n < 3) return poly;
  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area2 > 0 ? 1 : -1;
  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const prev = poly[(i - 1 + n) % n], curr = poly[i], next = poly[(i + 1) % n];
    const e1x = curr[0] - prev[0], e1z = curr[1] - prev[1];
    const e2x = next[0] - curr[0], e2z = next[1] - curr[1];
    const len1 = Math.sqrt(e1x * e1x + e1z * e1z) || 1;
    const len2 = Math.sqrt(e2x * e2x + e2z * e2z) || 1;
    const n1x = sign * e1z / len1, n1z = sign * (-e1x) / len1;
    const n2x = sign * e2z / len2, n2z = sign * (-e2x) / len2;
    let bx = n1x + n2x, bz = n1z + n2z;
    const bLen = Math.sqrt(bx * bx + bz * bz) || 1;
    bx /= bLen; bz /= bLen;
    const dot = n1x * bx + n1z * bz;
    const offset = dot > 0.01 ? dist / dot : dist;
    result.push([curr[0] + bx * offset, curr[1] + bz * offset]);
  }
  return result;
}

function getRoomBounds(def: HouseRoomDef): RoomBounds {
  const inset = WALL_THICK + 0.03; // wall thickness + small padding
  const rb: RoomBounds = { minX: def.bounds[0] + inset, maxX: def.bounds[1] - inset, minZ: def.bounds[2] + inset, maxZ: def.bounds[3] - inset };
  if (def.polygon && def.polygon.length >= 3) {
    rb.polygon = insetPolygon(def.polygon, inset);
  }
  return rb;
}

/** Check if a point is inside a room's interior (bounding box + polygon check) */
function isPointInRoom(def: HouseRoomDef, x: number, z: number, inset: number): boolean {
  if (x < def.bounds[0] + inset || x > def.bounds[1] - inset ||
      z < def.bounds[2] + inset || z > def.bounds[3] - inset) return false;
  if (def.polygon && def.polygon.length >= 3) {
    return pointInPoly(insetPolygon(def.polygon, inset), x, z);
  }
  return true;
}

/** Check if an AABB is entirely inside a room's interior (bounding box + polygon check) */
function isBoxInRoom(def: HouseRoomDef, bMinX: number, bMaxX: number, bMinZ: number, bMaxZ: number, inset: number): boolean {
  if (bMinX < def.bounds[0] + inset || bMaxX > def.bounds[1] - inset ||
      bMinZ < def.bounds[2] + inset || bMaxZ > def.bounds[3] - inset) return false;
  if (def.polygon && def.polygon.length >= 3) {
    return boxInPoly(insetPolygon(def.polygon, inset), bMinX, bMaxX, bMinZ, bMaxZ);
  }
  return true;
}

/** Find which room a world-space (x, z) point falls inside (using inset bounds). Returns room id or null. */
function findRoomForPosition(x: number, z: number): string | null {
  const inset = WALL_THICK + 0.03;
  for (const def of HOUSE_ROOM_DEFS) {
    if (isPointInRoom(def, x, z, inset)) return def.id;
  }
  return null;
}

/** Check if a bounding box fits inside any room (used during drag for cross-room moves) */
function findRoomForBox(minX: number, maxX: number, minZ: number, maxZ: number): string | null {
  const inset = WALL_THICK + 0.03;
  for (const def of HOUSE_ROOM_DEFS) {
    if (isBoxInRoom(def, minX, maxX, minZ, maxZ, inset)) return def.id;
  }
  return null;
}

interface SharedWallNeighbor { neighborId: string; neighborSide: string; }
interface SharedWallData { sides: Set<string>; neighbors: Map<string, SharedWallNeighbor[]>; }

/**
 * Convert a door/window t-parameter from one wall's coordinate system to the shared neighbor's.
 * Wall t → world position mapping:
 *   north: worldX = xMin + t * w     south: worldX = xMax - t * w
 *   east:  worldZ = zMin + t * d     west:  worldZ = zMax - t * d
 */
function convertTBetweenWalls(
  srcSide: string, srcBounds: [number, number, number, number], srcT: number,
  dstSide: string, dstBounds: [number, number, number, number],
): number | null {
  const [sxMin, sxMax, szMin, szMax] = srcBounds;
  const [dxMin, dxMax, dzMin, dzMax] = dstBounds;
  const sw = sxMax - sxMin, sd = szMax - szMin;
  const dw = dxMax - dxMin, dd = dzMax - dzMin;
  let worldPos: number, isXAxis: boolean;
  if (srcSide === "north") { worldPos = sxMin + srcT * sw; isXAxis = true; }
  else if (srcSide === "south") { worldPos = sxMax - srcT * sw; isXAxis = true; }
  else if (srcSide === "east") { worldPos = szMin + srcT * sd; isXAxis = false; }
  else { worldPos = szMax - srcT * sd; isXAxis = false; }
  let dstT: number;
  if (isXAxis) {
    if (dstSide === "north") dstT = (worldPos - dxMin) / dw;
    else if (dstSide === "south") dstT = (dxMax - worldPos) / dw;
    else return null;
  } else {
    if (dstSide === "east") dstT = (worldPos - dzMin) / dd;
    else if (dstSide === "west") dstT = (dzMax - worldPos) / dd;
    else return null;
  }
  if (dstT < -0.05 || dstT > 1.05) return null;
  return Math.max(0, Math.min(1, dstT));
}

/** Compute world position of a door/window for ANY room definition (standalone version). */
function computeOpeningWorldPos(def: HouseRoomDef, side: string, t: number): [number, number] {
  const [xMin, xMax, zMin, zMax] = def.bounds;
  const w = xMax - xMin, d = zMax - zMin;
  const defaultPos = (): [number, number] => {
    if (side === "north") return [xMin + t * w, zMax];
    if (side === "south") return [xMax - t * w, zMin];
    if (side === "east") return [xMax, zMin + t * d];
    return [xMin, zMax - t * d];
  };
  if (!def.polygon) return defaultPos();
  const poly = def.polygon;
  let a2 = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    a2 += a[0] * b[1] - b[0] * a[1];
  }
  const nSign = a2 > 0 ? 1 : -1;
  const isHorizSide = side === "north" || side === "south";
  if (isHorizSide) {
    const worldX = side === "north" ? xMin + t * w : xMax - t * w;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
      const edx = p2[0] - p1[0], edz = p2[1] - p1[1];
      if (Math.abs(edz) > 0.001 || Math.abs(edx) < 0.01) continue;
      const nz = nSign * (-edx) / Math.abs(edx);
      if (side === "north" && nz <= 0) continue;
      if (side === "south" && nz >= 0) continue;
      const eMinX = Math.min(p1[0], p2[0]), eMaxX = Math.max(p1[0], p2[0]);
      if (worldX >= eMinX - 0.01 && worldX <= eMaxX + 0.01) {
        return [Math.max(eMinX, Math.min(eMaxX, worldX)), p1[1]];
      }
    }
    return defaultPos();
  }
  const worldZ = side === "east" ? zMin + t * d : zMax - t * d;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
    const edx = p2[0] - p1[0], edz = p2[1] - p1[1];
    if (Math.abs(edx) > 0.001 || Math.abs(edz) < 0.01) continue;
    const nx = nSign * edz / Math.abs(edz);
    if (side === "east" && nx <= 0) continue;
    if (side === "west" && nx >= 0) continue;
    const eMinZ = Math.min(p1[1], p2[1]), eMaxZ = Math.max(p1[1], p2[1]);
    if (worldZ >= eMinZ - 0.01 && worldZ <= eMaxZ + 0.01) {
      return [p1[0], Math.max(eMinZ, Math.min(eMaxZ, worldZ))];
    }
  }
  return defaultPos();
}

function computeSharedWallData(defs: HouseRoomDef[]): Map<string, SharedWallData> {
  const result = new Map<string, SharedWallData>();
  const ensure = (id: string): SharedWallData => {
    if (!result.has(id)) result.set(id, { sides: new Set(), neighbors: new Map() });
    return result.get(id)!;
  };
  const T = 0.02;
  const link = (id: string, side: string, nId: string, nSide: string) => {
    const d = ensure(id);
    d.sides.add(side);
    if (!d.neighbors.has(side)) d.neighbors.set(side, []);
    const existing = d.neighbors.get(side)!;
    if (!existing.some(e => e.neighborId === nId && e.neighborSide === nSide)) {
      existing.push({ neighborId: nId, neighborSide: nSide });
    }
  };
  for (let i = 0; i < defs.length; i++) {
    for (let j = i + 1; j < defs.length; j++) {
      const a = defs[i], b = defs[j];
      const [axMin, axMax, azMin, azMax] = a.bounds;
      const [bxMin, bxMax, bzMin, bzMax] = b.bounds;
      const xOvlp = Math.min(axMax, bxMax) - Math.max(axMin, bxMin);
      const zOvlp = Math.min(azMax, bzMax) - Math.max(azMin, bzMin);
      if (Math.abs(azMax - bzMin) < T && xOvlp > T) { link(a.id, "north", b.id, "south"); link(b.id, "south", a.id, "north"); }
      if (Math.abs(azMin - bzMax) < T && xOvlp > T) { link(a.id, "south", b.id, "north"); link(b.id, "north", a.id, "south"); }
      if (Math.abs(axMax - bxMin) < T && zOvlp > T) { link(a.id, "east", b.id, "west"); link(b.id, "west", a.id, "east"); }
      if (Math.abs(axMin - bxMax) < T && zOvlp > T) { link(a.id, "west", b.id, "east"); link(b.id, "east", a.id, "west"); }

      // ── Polygon inner-edge shared wall detection ──
      // Check polygon edges against bounding box sides of the other room.
      // Must compute polygon outward normal to determine correct side labels.
      const checkPolyEdgesVsBounds = (polyRoom: HouseRoomDef, rectRoom: HouseRoomDef) => {
        if (!polyRoom.polygon) return;
        const poly = polyRoom.polygon;
        const [rxMin, rxMax, rzMin, rzMax] = rectRoom.bounds;
        const [pxMin, pxMax, pzMin, pzMax] = polyRoom.bounds;
        // Compute polygon winding
        let pArea2 = 0;
        for (let k = 0; k < poly.length; k++) {
          const pa = poly[k], pb = poly[(k + 1) % poly.length];
          pArea2 += pa[0] * pb[1] - pb[0] * pa[1];
        }
        const pNormSign = pArea2 > 0 ? 1 : -1;

        for (let ei = 0; ei < poly.length; ei++) {
          const ep1 = poly[ei], ep2 = poly[(ei + 1) % poly.length];
          const edx = ep2[0] - ep1[0], edz = ep2[1] - ep1[1];
          const eLen = Math.sqrt(edx * edx + edz * edz);
          if (eLen < 0.01) continue;
          const eIsHoriz = Math.abs(edz) < 0.001;
          const eIsVert = Math.abs(edx) < 0.001;
          if (!eIsHoriz && !eIsVert) continue; // skip diagonal edges
          const eMinX = Math.min(ep1[0], ep2[0]), eMaxX = Math.max(ep1[0], ep2[0]);
          const eMinZ = Math.min(ep1[1], ep2[1]), eMaxZ = Math.max(ep1[1], ep2[1]);

          // Compute outward normal for this edge
          const enx = pNormSign * edz / eLen;
          const enz = pNormSign * (-edx) / eLen;
          // Determine polygon edge's "side" based on outward normal
          let polySide: string;
          if (eIsHoriz) polySide = enz > 0 ? "north" : "south";
          else polySide = enx > 0 ? "east" : "west";
          // Skip if at bounding box boundary (already handled above)
          if (eIsHoriz) {
            const edgeZ = ep1[1];
            if (Math.abs(edgeZ - pzMin) < T || Math.abs(edgeZ - pzMax) < T) continue;
            // Rect room has its OPPOSITE wall at this edge position
            // polySide "north" → rect room must be north (rzMin at edgeZ, its "south" wall)
            // polySide "south" → rect room must be south (rzMax at edgeZ, its "north" wall)
            if (polySide === "north" && Math.abs(rzMin - edgeZ) < T) {
              const ovlp = Math.min(eMaxX, rxMax) - Math.max(eMinX, rxMin);
              if (ovlp > T) { link(polyRoom.id, "north", rectRoom.id, "south"); link(rectRoom.id, "south", polyRoom.id, "north"); }
            }
            if (polySide === "south" && Math.abs(rzMax - edgeZ) < T) {
              const ovlp = Math.min(eMaxX, rxMax) - Math.max(eMinX, rxMin);
              if (ovlp > T) { link(polyRoom.id, "south", rectRoom.id, "north"); link(rectRoom.id, "north", polyRoom.id, "south"); }
            }
          }
          if (eIsVert) {
            const edgeX = ep1[0];
            if (Math.abs(edgeX - pxMin) < T || Math.abs(edgeX - pxMax) < T) continue;
            if (polySide === "east" && Math.abs(rxMin - edgeX) < T) {
              const ovlp = Math.min(eMaxZ, rzMax) - Math.max(eMinZ, rzMin);
              if (ovlp > T) { link(polyRoom.id, "east", rectRoom.id, "west"); link(rectRoom.id, "west", polyRoom.id, "east"); }
            }
            if (polySide === "west" && Math.abs(rxMax - edgeX) < T) {
              const ovlp = Math.min(eMaxZ, rzMax) - Math.max(eMinZ, rzMin);
              if (ovlp > T) { link(polyRoom.id, "west", rectRoom.id, "east"); link(rectRoom.id, "east", polyRoom.id, "west"); }
            }
          }
        }
      };
      checkPolyEdgesVsBounds(a, b);
      checkPolyEdgesVsBounds(b, a);
    }
  }
  return result;
}

let _sharedWallCache: Map<string, SharedWallData> | null = null;
function getSharedWallData(): Map<string, SharedWallData> {
  if (!_sharedWallCache) _sharedWallCache = computeSharedWallData(HOUSE_ROOM_DEFS);
  return _sharedWallCache;
}
function getSharedSides(): Map<string, Set<string>> {
  const data = getSharedWallData();
  const result = new Map<string, Set<string>>();
  for (const [id, d] of data) result.set(id, d.sides);
  return result;
}

/** Convert a world-space position to a t-parameter on a wall side of a given room */
function worldPosToWallT(worldPos: number, side: string, bounds: [number, number, number, number]): number | null {
  const [xMin, xMax, zMin, zMax] = bounds;
  const w = xMax - xMin, d = zMax - zMin;
  let t: number;
  if (side === "north") t = w > 0.01 ? (worldPos - xMin) / w : 0.5;
  else if (side === "south") t = w > 0.01 ? (xMax - worldPos) / w : 0.5;
  else if (side === "east") t = d > 0.01 ? (worldPos - zMin) / d : 0.5;
  else t = d > 0.01 ? (zMax - worldPos) / d : 0.5;
  if (t < -0.05 || t > 1.05) return null;
  return Math.max(0, Math.min(1, t));
}

/** Get door/window openings from neighbors on a shared wall, converted to this room's coords. */
function getNeighborOpenings(roomId: string, side: string, defs: HouseRoomDef[]): {
  doors: { t: number; w: number }[];
  windows: { t: number; w: number; h: number; sillH: number }[];
} {
  const doors: { t: number; w: number }[] = [];
  const windows: { t: number; w: number; h: number; sillH: number }[] = [];
  const data = getSharedWallData().get(roomId);
  if (!data) return { doors, windows };
  const neighbors = data.neighbors.get(side);
  if (!neighbors) return { doors, windows };
  const myDef = defs.find(d => d.id === roomId);
  if (!myDef) return { doors, windows };
  const isXAxis = side === "north" || side === "south";
  for (const { neighborId, neighborSide } of neighbors) {
    const nDef = defs.find(d => d.id === neighborId);
    if (!nDef) continue;
    for (const nd of nDef.doors) {
      if (nd.side !== neighborSide) continue;
      // Use polygon-aware world position for the neighbor's door
      const [wx, wz] = computeOpeningWorldPos(nDef, nd.side, nd.t);
      const worldAxisPos = isXAxis ? wx : wz;
      const newT = worldPosToWallT(worldAxisPos, side, myDef.bounds);
      if (newT !== null) doors.push({ t: newT, w: nd.w });
    }
    for (const nw of (nDef.windows || [])) {
      if (nw.side !== neighborSide) continue;
      const [wx, wz] = computeOpeningWorldPos(nDef, nw.side, nw.t);
      const worldAxisPos = isXAxis ? wx : wz;
      const newT = worldPosToWallT(worldAxisPos, side, myDef.bounds);
      if (newT !== null) windows.push({ t: newT, w: nw.w, h: nw.h, sillH: nw.sillH });
    }
  }
  return { doors, windows };
}

function defFurnitureToPlacedItems(def: HouseRoomDef): PlacedItem[] {
  return def.furniture.map(([fId, fx, fy, fz, fRot], i) => {
    const cat = CATALOG.find((c) => c.id === fId);
    return {
      id: `${def.id}-${fId}-${i}`,
      furnitureId: fId,
      name: cat?.name || fId,
      position: [fx, fy, fz] as [number, number, number],
      rotation: fRot,
      dimensions: cat?.dimensions || [1, 1, 1],
      color: cat?.color || "#8A8A8A",
      category: cat?.category || "decor",
    };
  });
}

function buildInitialRoomFurniture(): Record<string, PlacedItem[]> {
  const map: Record<string, PlacedItem[]> = {};
  for (const def of HOUSE_ROOM_DEFS) {
    map[def.id] = defFurnitureToPlacedItems(def);
  }
  return map;
}

/* ═══════════════════════════════════════════════════════
   Auto-Furnish — Smart furniture placement per room type
   ═══════════════════════════════════════════════════════ */
interface FurniturePlacement {
  catalogId: string;
  anchor: string | [number, number];
  offset?: [number, number];
  rotation?: number;
}

function getAutoFurnishPreset(label: string, roomW: number, roomD: number): FurniturePlacement[] {
  const lower = label.toLowerCase();

  if (lower.includes("kitchen") || lower.includes("dining")) {
    const items: FurniturePlacement[] = [
      { catalogId: "kitchen-counter", anchor: "west-wall", offset: [0.05, -0.8], rotation: 90 },
      { catalogId: "fridge", anchor: "nw-corner", offset: [0.05, 0.4], rotation: 90 },
      { catalogId: "kitchen-sink", anchor: "west-wall", offset: [0.05, 0.3], rotation: 90 },
      { catalogId: "oven", anchor: "west-wall", offset: [0.05, 1.2], rotation: 90 },
    ];
    if (roomD > 3.5) {
      items.push(
        { catalogId: "dining-table", anchor: "center", offset: [0, 1.2], rotation: 0 },
        { catalogId: "dining-chair", anchor: "center", offset: [-0.45, 0.8], rotation: 0 },
        { catalogId: "dining-chair", anchor: "center", offset: [0.45, 0.8], rotation: 0 },
        { catalogId: "dining-chair", anchor: "center", offset: [-0.45, 1.6], rotation: 180 },
        { catalogId: "dining-chair", anchor: "center", offset: [0.45, 1.6], rotation: 180 },
      );
    }
    if (roomW > 1.5) {
      items.push({ catalogId: "upper-cabinet", anchor: "west-wall", offset: [0.05, -0.2], rotation: 90 });
    }
    return items;
  }

  if (lower.includes("living")) {
    const items: FurniturePlacement[] = [
      { catalogId: "sofa", anchor: "center", offset: [0, 0.8], rotation: 0 },
      { catalogId: "coffee-table", anchor: "center", offset: [0, 0], rotation: 0 },
      { catalogId: "tv-console", anchor: "north-wall", offset: [0, 0.25], rotation: 0 },
      { catalogId: "tv", anchor: "north-wall", offset: [0, 0.22], rotation: 0 },
      { catalogId: "rug", anchor: "center", offset: [0, 0.3], rotation: 0 },
    ];
    if (roomW > 2.5) {
      items.push(
        { catalogId: "armchair", anchor: "center", offset: [-1.0, 0.2], rotation: 45 },
        { catalogId: "side-table", anchor: "center", offset: [-1.2, -0.3], rotation: 0 },
        { catalogId: "floor-lamp", anchor: "center", offset: [-1.3, -0.6], rotation: 0 },
      );
    }
    if (roomD > 3.5) {
      items.push(
        { catalogId: "plant", anchor: "se-corner", offset: [-0.3, -0.3], rotation: 0 },
        { catalogId: "shoe-cabinet", anchor: "south-wall", offset: [-0.5, 0.22], rotation: 180 },
      );
    }
    return items;
  }

  if ((lower.includes("main") && lower.includes("bed")) || lower.includes("master")) {
    const items: FurniturePlacement[] = [
      { catalogId: "queen-bed", anchor: "east-wall", offset: [-0.15, 0], rotation: 270 },
      { catalogId: "nightstand", anchor: "east-wall", offset: [-0.15, -1.3], rotation: 270 },
      { catalogId: "nightstand", anchor: "east-wall", offset: [-0.15, 1.3], rotation: 270 },
      { catalogId: "wardrobe", anchor: "west-wall", offset: [0.35, -0.5], rotation: 90 },
    ];
    if (roomD > 3.5) {
      items.push(
        { catalogId: "dresser", anchor: "west-wall", offset: [0.28, 1.2], rotation: 90 },
        { catalogId: "floor-lamp", anchor: "ne-corner", offset: [-0.25, 0.25], rotation: 0 },
      );
    }
    return items;
  }

  if (lower.includes("bed")) {
    const items: FurniturePlacement[] = [
      { catalogId: "single-bed", anchor: "east-wall", offset: [-0.15, 0], rotation: 270 },
      { catalogId: "nightstand", anchor: "east-wall", offset: [-0.15, -1.2], rotation: 270 },
      { catalogId: "wardrobe", anchor: "west-wall", offset: [0.35, -0.3], rotation: 90 },
      { catalogId: "desk", anchor: "north-wall", offset: [-0.4, 0.35], rotation: 0 },
      { catalogId: "office-chair", anchor: "north-wall", offset: [-0.4, 0.85], rotation: 0 },
    ];
    if (roomW > 2.0) {
      items.push({ catalogId: "bookshelf-sm", anchor: "west-wall", offset: [0.18, 1.0], rotation: 90 });
    }
    return items;
  }

  if (lower.includes("bath") || lower.includes("wc") || lower.includes("toilet")) {
    const items: FurniturePlacement[] = [
      { catalogId: "toilet", anchor: "north-wall", offset: [0.3, 0.25], rotation: 0 },
      { catalogId: "wash-basin", anchor: "east-wall", offset: [-0.1, -0.3], rotation: 270 },
      { catalogId: "bath-mirror", anchor: "east-wall", offset: [-0.05, -0.3], rotation: 270 },
    ];
    if (roomW > 1.2 && roomD > 1.2) {
      items.push({ catalogId: "shower", anchor: "sw-corner", offset: [0.5, -0.5], rotation: 0 });
    }
    items.push({ catalogId: "towel-rack", anchor: "west-wall", offset: [0.08, 0], rotation: 90 });
    return items;
  }

  if (lower.includes("store") || lower.includes("utility") || lower.includes("storage")) {
    return [
      { catalogId: "storage-rack", anchor: "west-wall", offset: [0.28, 0], rotation: 90 },
      { catalogId: "washer", anchor: "north-wall", offset: [0.2, 0.35], rotation: 0 },
      { catalogId: "ironing-board", anchor: "east-wall", offset: [-0.15, 0], rotation: 270 },
    ];
  }

  if (lower.includes("corridor") || lower.includes("hallway")) {
    const items: FurniturePlacement[] = [];
    if (roomW > 0.8) {
      items.push({ catalogId: "plant", anchor: "north-wall", offset: [0, 0.2], rotation: 0 });
    }
    return items;
  }

  if (lower.includes("balcony") || lower.includes("patio")) {
    return [
      { catalogId: "plant", anchor: "center", offset: [-1.5, 0], rotation: 0 },
      { catalogId: "plant", anchor: "center", offset: [1.5, 0], rotation: 0 },
    ];
  }

  return [];
}

function resolveAnchorPosition(
  anchor: string | [number, number],
  offset: [number, number] | undefined,
  bounds: RoomBounds,
): [number, number] {
  const { minX, maxX, minZ, maxZ } = bounds;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const [dx, dz] = offset || [0, 0];

  if (Array.isArray(anchor)) {
    return [minX + anchor[0] * (maxX - minX) + dx, minZ + anchor[1] * (maxZ - minZ) + dz];
  }

  switch (anchor) {
    case "center":      return [cx + dx, cz + dz];
    case "north-wall":  return [cx + dx, maxZ + dz];
    case "south-wall":  return [cx + dx, minZ + dz];
    case "east-wall":   return [maxX + dx, cz + dz];
    case "west-wall":   return [minX + dx, cz + dz];
    case "nw-corner":   return [minX + dx, maxZ + dz];
    case "ne-corner":   return [maxX + dx, maxZ + dz];
    case "sw-corner":   return [minX + dx, minZ + dz];
    case "se-corner":   return [maxX + dx, minZ + dz];
    default:            return [cx + dx, cz + dz];
  }
}

function autoFurnishRoom(roomId: string): PlacedItem[] {
  const def = HOUSE_ROOM_DEFS.find(d => d.id === roomId);
  if (!def) return [];

  const rb = getRoomBounds(def);
  const roomW = rb.maxX - rb.minX;
  const roomD = rb.maxZ - rb.minZ;
  const placements = getAutoFurnishPreset(def.label, roomW, roomD);
  const items: PlacedItem[] = [];

  for (const p of placements) {
    const cat = CATALOG.find(c => c.id === p.catalogId);
    if (!cat) continue;

    const [x, z] = resolveAnchorPosition(p.anchor, p.offset, rb);
    const hw = cat.dimensions[0] / 2, hd = cat.dimensions[2] / 2;
    const clampX = Math.max(rb.minX + hw, Math.min(rb.maxX - hw, x));
    const clampZ = Math.max(rb.minZ + hd, Math.min(rb.maxZ - hd, z));

    if (rb.polygon && !pointInPoly(rb.polygon, clampX, clampZ)) continue;

    const id = `af-${roomId}-${p.catalogId}-${items.length}-${Date.now()}`;
    items.push({
      id,
      furnitureId: p.catalogId,
      name: cat.name,
      position: [clampX, 0, clampZ],
      rotation: p.rotation || 0,
      dimensions: cat.dimensions,
      color: cat.color,
      category: cat.category,
    });
  }

  return items;
}

/* ═══════════════════════════════════════════════════════
   HDB 3-Room Simplified (Corridor) — 6.1m × 11.7m (64 sqm)
   Built 1984-1988. Scale 1:100. Ceiling 2,600mm.
   
   Layout (plan view, north=top):
     Top row:    Kitchen/Dining (left) | Baths (center) | Main Bedroom (right)
     Center:     Store | Corridor | Main Bedroom (cont.)
     Bottom row: Living Room (left) | Bedroom 2 (right)
     Very bottom: Access Balcony (full width, 700mm deep)
   
   Coordinate system: centered at origin
     X: -3.05 (west/left) to +3.05 (east/right)
     Z: -5.85 (north/top of plan) to +5.85 (south/bottom of plan)
     Y: 0 (floor) to 2.6 (ceiling)
   
   Door schedule: Main entry ~900mm, bedrooms/baths ~700mm
   Wall thickness: 150mm exterior, 100mm interior partitions
   ══════════════════════════════════════════════════��════ */
let HOUSE_ROOM_DEFS: HouseRoomDef[] = [
  /* ── Kitchen / Dining — 2.1m × 5.8m  (top-left) ── */
  {
    id: "kitchen", label: "Kitchen / Dining", shortLabel: "Kitchen",
    bounds: [-3.05, -0.95, -5.85, -0.05],
    floorColor: "#F0EDE8", wallColor: "#FAFAFA",
    cameraPos: [-2.5, 1.5, -1.2], cameraTarget: [-2.0, 0.8, -3.0],
    svg: { x: 0, y: 0, w: 85, h: 189 },
    accent: "#E8A87C",
    furniture: [],
    doors: [
      // No door — open-plan flow to living room on the south end
    ],
    windows: [
      { side: "north", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 }, // Kitchen window on north wall
      { side: "west", t: 0.3, w: 1.5, h: 1.4, sillH: 0.9 },
    ],
    defaultMaterials: { walls: "Subway Tile", floors: "Porcelain Tile (White)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: true },
  },
  /* ── Bath / WC 2 (Guest) — 1.5m × 1.5m  (top-center) ── */
  {
    id: "bath2", label: "Bath / WC 2", shortLabel: "Bath 2",
    bounds: [-0.95, 0.55, -5.85, -4.35],
    floorColor: "#D6E4E0", wallColor: "#F0F0F0",
    cameraPos: [-0.2, 2.0, -4.2], cameraTarget: [-0.2, 0.6, -5.1],
    svg: { x: 85, y: 0, w: 72, h: 49 },
    accent: "#6BA3BE",
    furniture: [],
    doors: [{ side: "south", t: 0.5, w: 0.7 }], // Swings inward
    windows: [
      { side: "north", t: 0.5, w: 0.6, h: 0.6, sillH: 1.5 }, // High frosted window
    ],
    defaultMaterials: { walls: "White Paint", floors: "Mosaic Tile", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  /* ── Bath / WC 1 (Main) — 1.5m × 1.5m  (below Bath 2) ── */
  {
    id: "bath1", label: "Bath / WC 1", shortLabel: "Bath 1",
    bounds: [-0.95, 0.55, -4.35, -2.85],
    floorColor: "#D6E4E0", wallColor: "#F0F0F0",
    cameraPos: [-0.2, 2.0, -2.7], cameraTarget: [-0.2, 0.6, -3.6],
    svg: { x: 85, y: 49, w: 72, h: 52 },
    accent: "#6BA3BE",
    furniture: [],
    doors: [{ side: "south", t: 0.5, w: 0.7 }], // Faces corridor zone
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Mosaic Tile", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  /* ── Main Bedroom — 2.5m × 4.5m  (right side, upper half) ── */
  {
    id: "main-bed", label: "Main Bedroom", shortLabel: "Master",
    bounds: [0.55, 3.05, -4.85, -0.35],
    floorColor: "#D4B896", wallColor: "#F5F0E8",
    cameraPos: [1.0, 1.5, 0.2], cameraTarget: [1.8, 0.8, -2.6],
    svg: { x: 115, y: 75, w: 82, h: 146 },
    accent: "#8B6B4E",
    furniture: [],
    doors: [{ side: "west", t: 0.7, w: 0.7 }], // Entry from corridor (~700mm)
    windows: [
      { side: "east", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 }, // East exterior window
    ],
    defaultMaterials: { walls: "Warm White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 16, intensity: 100, ceilingLight: true, floorLamp: true, accentLight: true, underCabinet: false },
  },
  /* ── Store Room — 1.4m × 1.2m  (center-left) ── */
  {
    id: "store", label: "Store Room", shortLabel: "Store",
    bounds: [-1.85, -0.45, -1.25, -0.05],
    floorColor: "#B8B0A6", wallColor: "#F5F5F5",
    cameraPos: [-1.15, 1.8, 0.3], cameraTarget: [-1.15, 0.5, -0.65],
    svg: { x: 39, y: 150, w: 46, h: 39 },
    accent: "#A09070",
    furniture: [],
    doors: [{ side: "east", t: 0.5, w: 0.7 }], // Swings outward into corridor
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Cement Screed", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  /* ── Corridor — 1.0m × 2.8m  (central connector) ── */
  {
    id: "corridor", label: "Corridor", shortLabel: "Corridor",
    bounds: [-0.45, 0.55, -2.85, -0.05],
    floorColor: "#C8C3BC", wallColor: "#FAFAFA",
    cameraPos: [0.05, 2.3, 0.2], cameraTarget: [0.05, 0.4, -1.5],
    svg: { x: 85, y: 101, w: 30, h: 120 },
    accent: "#8CAA7C",
    furniture: [],
    doors: [
      { side: "south", t: 0.3, w: 0.8 }, // To living room
      { side: "south", t: 0.7, w: 0.8 }, // To bedroom area
    ],
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Porcelain Tile (Gray)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  /* ── Living Room — 3.2m × 5.2m  (bottom-left, largest room) ── */
  {
    id: "living", label: "Living Room", shortLabel: "Living",
    bounds: [-3.05, 0.15, -0.05, 5.15],
    floorColor: "#E8DCCA", wallColor: "#FAFAFA",
    cameraPos: [-2.5, 1.5, 4.5], cameraTarget: [-1.45, 0.8, 2.5],
    svg: { x: 0, y: 189, w: 104, h: 169 },
    accent: "#5AB5A0",
    furniture: [],
    doors: [
      { side: "south", t: 0.15, w: 0.9 }, // Main entry door from access balcony (~900mm, bottom-left)
    ],
    windows: [
      { side: "west", t: 0.5, w: 1.5, h: 1.4, sillH: 0.9 }, // West exterior window
    ],
    defaultMaterials: { walls: "White Paint", floors: "Engineered Wood (Ash)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: true, accentLight: false, underCabinet: false },
  },
  /* ── Bedroom 2 — 2.9m × 4.2m  (bottom-right) ── */
  {
    id: "bedroom", label: "Bedroom 2", shortLabel: "Bedroom",
    bounds: [0.15, 3.05, 0.95, 5.15],
    floorColor: "#D4B896", wallColor: "#FAFAFA",
    cameraPos: [0.5, 1.5, 4.5], cameraTarget: [1.6, 0.8, 3.0],
    svg: { x: 104, y: 221, w: 94, h: 137 },
    accent: "#7CA5B8",
    furniture: [],
    doors: [{ side: "north", t: 0.15, w: 0.7 }], // Entry from living room (~700mm)
    windows: [
      { side: "east", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 }, // East exterior window
    ],
    defaultMaterials: { walls: "White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 10, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  /* ── Access Balcony / Corridor — 6.1m × 0.7m  (south edge, full width) ── */
  {
    id: "balcony", label: "Access Balcony", shortLabel: "Balcony",
    bounds: [-3.05, 3.05, 5.15, 5.85],
    floorColor: "#B8B0A6", wallColor: "#E0E0E0",
    cameraPos: [0.0, 2.5, 7.5], cameraTarget: [0.0, 0.5, 5.5],
    svg: { x: 0, y: 358, w: 198, h: 23 },
    accent: "#9E9E9E",
    furniture: [],
    doors: [], // Main entry door is on the living room side
    windows: [],
    defaultMaterials: { walls: "Concrete", floors: "Cement Screed", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: false, floorLamp: false, accentLight: false, underCabinet: false },
  },
];

let HOUSE_CAM_POS: [number, number, number] = [9, 14.5, 12];
let HOUSE_CAM_TARGET: [number, number, number] = [0, 0, 0];

// Import check runs inside the component (not at module load) so sessionStorage
// is populated by the time we read it. These module-level flags are mutated once.
let _wasImported = false;
let ROOMS = HOUSE_ROOM_DEFS.map((d) => d.label);

// ═══ Save original defaults so we can reset module-level state on re-mount ═══
const _DEFAULT_HOUSE_ROOM_DEFS = JSON.parse(JSON.stringify(HOUSE_ROOM_DEFS));
const _DEFAULT_ROOMS = [...ROOMS];
const _DEFAULT_CAM_POS: [number, number, number] = [9, 14.5, 12];
const _DEFAULT_CAM_TARGET: [number, number, number] = [0, 0, 0];
// Track which editor instance last reset the state to prevent cross-mount contamination
let _lastEditorMountId = 0;

/* ═══════════════════════════════════════════════════════
   Shared Procedural Materials for Doors/Windows
   ═══════════════════════════════════════════════════════ */
const _woodTexCache = new Map<string, THREE.CanvasTexture>();
function makeWoodGrainTexture(baseR: number, baseG: number, baseB: number, width = 128, height = 256): THREE.CanvasTexture {
  const cacheKey = `${baseR}_${baseG}_${baseB}_${width}_${height}`;
  const cached = _woodTexCache.get(cacheKey);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < height; i += 2) {
    const b = 0.85 + Math.sin(i * 0.05) * 0.08 + Math.random() * 0.04;
    ctx.fillStyle = `rgb(${Math.floor(baseR * b)},${Math.floor(baseG * b)},${Math.floor(baseB * b)})`;
    ctx.fillRect(0, i, width, 2);
  }
  for (let s = 0; s < 6; s++) {
    const sx = Math.random() * width;
    const sw = 1 + Math.random() * 2;
    ctx.fillStyle = `rgba(${Math.floor(baseR * 0.5)},${Math.floor(baseG * 0.5)},${Math.floor(baseB * 0.5)},${0.04 + Math.random() * 0.06})`;
    for (let y = 0; y < height; y += 2) {
      const wobble = Math.sin(y * 0.02 + s) * 3;
      ctx.fillRect(sx + wobble, y, sw, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  _woodTexCache.set(cacheKey, tex);
  return tex;
}

/* ═══════════════════════════════════════════════════════
   Build a door panel group (hinged, with handle & frame)
   Returns a pivot group positioned at hinge point
   ═══════════════════════════════════════════════════════ */
function buildDoorPanel(
  doorW: number, doorH: number, hingeX: number, hingeZ: number,
  openAngle: number, wallSide: string
): THREE.Group {
  const doorThick = 0.05;
  const woodTex = makeWoodGrainTexture(166, 139, 107);
  const doorMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, metalness: 0.0, transparent: true, opacity: 1.0 });

  const pivot = new THREE.Group();
  pivot.position.set(hingeX, 0, hingeZ);
  pivot.rotation.y = openAngle;
  pivot.userData.wallSide = wallSide;

  // Main panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(doorThick, doorH, doorW), doorMat);
  panel.position.set(0, doorH / 2, doorW / 2);
  panel.userData.wallSide = wallSide;
  pivot.add(panel);

  // Recessed insets (2 panels)
  const insetMat = doorMat.clone();
  const insetH = doorH * 0.35;
  const insetW = doorW * 0.6;
  for (let p = 0; p < 2; p++) {
    const y = doorH * (p === 0 ? 0.3 : 0.72);
    const inset = new THREE.Mesh(new THREE.BoxGeometry(doorThick + 0.015, insetH, insetW), insetMat);
    inset.position.set(0.008, y, doorW / 2);
    inset.userData.wallSide = wallSide;
    pivot.add(inset);
  }

  // Handle (brass lever)
  const handleMat = new THREE.MeshStandardMaterial({ color: "#A08850", roughness: 0.3, metalness: 0.85, transparent: true, opacity: 1.0 });
  const handleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 6), handleMat);
  handleBase.position.set(doorThick / 2 + 0.007, doorH * 0.47, doorW * 0.75);
  handleBase.rotation.z = Math.PI / 2;
  handleBase.userData.wallSide = wallSide;
  pivot.add(handleBase);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.09), handleMat);
  lever.position.set(doorThick / 2 + 0.022, doorH * 0.47, doorW * 0.75 + 0.02);
  lever.userData.wallSide = wallSide;
  pivot.add(lever);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.012), handleMat);
  grip.position.set(doorThick / 2 + 0.022, doorH * 0.47 - 0.018, doorW * 0.75 + 0.06);
  grip.userData.wallSide = wallSide;
  pivot.add(grip);

  // Frame trim around the doorway
  const frameMat = new THREE.MeshStandardMaterial({ color: "#9B7E5E", roughness: 0.7, transparent: true, opacity: 1.0 });
  const tw = 0.06;
  const lJamb = new THREE.Mesh(new THREE.BoxGeometry(tw, doorH + 0.05, tw), frameMat);
  lJamb.position.set(0, (doorH + 0.05) / 2, -tw / 2);
  lJamb.userData.wallSide = wallSide;
  pivot.add(lJamb);
  const rJamb = new THREE.Mesh(new THREE.BoxGeometry(tw, doorH + 0.05, tw), frameMat);
  rJamb.position.set(0, (doorH + 0.05) / 2, doorW + tw / 2);
  rJamb.userData.wallSide = wallSide;
  pivot.add(rJamb);
  const header = new THREE.Mesh(new THREE.BoxGeometry(tw, tw, doorW + tw * 2), frameMat);
  header.position.set(0, doorH + 0.025, doorW / 2);
  header.userData.wallSide = wallSide;
  pivot.add(header);

  return pivot;
}

/* ═══════════════════════════════════════════════════════
   Build a window assembly (frame, mullions, glass panes, sill)
   Position is the center of the window on the wall
   ═══════════════════════════════════════════════════════ */
function buildWindowAssembly(
  winW: number, winH: number,
  px: number, pyCenterY: number, pz: number,
  ry: number, wallSide: string
): THREE.Group {
  const wGroup = new THREE.Group();
  wGroup.userData.wallSide = wallSide;

  const frameMat = new THREE.MeshStandardMaterial({ color: "#3A3A3A", roughness: 0.6, metalness: 0.1, transparent: true, opacity: 1.0 });
  const frameThick = 0.06;
  const frameDepth = 0.055;

  // Outer frame — 4 pieces
  const pieces: [number, number, number, number, number, number][] = [
    [frameDepth, frameThick, winW + frameThick * 2, 0, winH / 2, 0],   // top
    [frameDepth, frameThick, winW + frameThick * 2, 0, -winH / 2, 0],  // bottom
    [frameDepth, winH, frameThick, 0, 0, -winW / 2],                    // left
    [frameDepth, winH, frameThick, 0, 0, winW / 2],                     // right
  ];
  for (const [dx, dy, dz, ox, oy, oz] of pieces) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(dx, dy, dz), frameMat);
    m.position.set(ox, oy, oz);
    m.userData.wallSide = wallSide;
    wGroup.add(m);
  }

  // Mullion bars — vertical and horizontal (shared material)
  const mullionW = 0.04;
  const cols = winW > 1.2 ? 3 : 2;
  const rows = winH > 1.0 ? 3 : 2;
  for (let c = 1; c < cols; c++) {
    const z = -winW / 2 + (winW / cols) * c;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, winH, mullionW), frameMat);
    bar.position.set(0, 0, z);
    bar.userData.wallSide = wallSide;
    wGroup.add(bar);
  }
  for (let r = 1; r < rows; r++) {
    const y = -winH / 2 + (winH / rows) * r;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, mullionW, winW), frameMat);
    bar.position.set(0, y, 0);
    bar.userData.wallSide = wallSide;
    wGroup.add(bar);
  }

  // Glass panes — warm-tinted see-through (shared material, use simpler MeshStandard in house view)
  const glassMat = new THREE.MeshStandardMaterial({
    color: "#E8DFD0", transparent: true, opacity: 0.18,
    roughness: 0.05, metalness: 0.0,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const paneW = (winW - mullionW * (cols - 1)) / cols - 0.01;
  const paneH = (winH - mullionW * (rows - 1)) / rows - 0.01;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pz2 = -winW / 2 + (winW / cols) * (c + 0.5);
      const py2 = -winH / 2 + (winH / rows) * (r + 0.5);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneH, paneW), glassMat);
      pane.position.set(-0.005, py2, pz2);
      pane.rotation.y = -Math.PI / 2;
      pane.userData.wallSide = wallSide;
      pane.userData.baseOpacity = 0.18;
      wGroup.add(pane);
    }
  }

  // Window sill
  const sillMat = new THREE.MeshStandardMaterial({ color: "#D8D0C4", roughness: 0.6, metalness: 0.05, transparent: true, opacity: 1.0 });
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, winW + 0.12), sillMat);
  sill.position.set(0.03, -winH / 2 - 0.015, 0);
  sill.userData.wallSide = wallSide;
  wGroup.add(sill);

  // Position and rotate the entire window group
  wGroup.position.set(px, pyCenterY, pz);
  wGroup.rotation.y = ry;

  return wGroup;
}

/* ═══════════════════════════════════════════════════════
   Map side name to wall-side tag for cutaway
   ═══════════════════════════════════════════════════════ */
function sideToWallSide(side: string): string {
  // north = wall at zMax, south = wall at zMin, west = wall at xMin, east = wall at xMax
  if (side === "north") return "north";
  if (side === "south") return "south";
  if (side === "west") return "west";
  if (side === "east") return "east";
  return side;
}

/* ═══════════════════════════════════════════════════════
   Build House Room Geometry (with doors, windows & cutaway tags)
   ═══════════════════════════════════════════════════════ */
function buildHouseRoom(def: HouseRoomDef): THREE.Group {
  const group = new THREE.Group();
  group.name = `house-${def.id}`;
  const [xMin, xMax, zMin, zMax] = def.bounds;
  const w = xMax - xMin, d = zMax - zMin;
  const cx = (xMin + xMax) / 2, cz = (zMin + zMax) / 2;
  const hasPoly = def.polygon && def.polygon.length >= 3;

  // ── Polygon-aware Floor ──
  const floorMat = new THREE.MeshStandardMaterial({ color: def.floorColor, roughness: 0.5, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  if (hasPoly) {
    const poly = def.polygon!;
    const floorShape = new THREE.Shape();
    // Reverse polygon order → CCW in shape (x, -z) space → front face up after -PI/2 rotation
    floorShape.moveTo(poly[poly.length - 1][0], -poly[poly.length - 1][1]);
    for (let i = poly.length - 2; i >= 0; i--) floorShape.lineTo(poly[i][0], -poly[i][1]);
    floorShape.closePath();
    const floorGeo = new THREE.ShapeGeometry(floorShape);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    group.add(floor);
  } else {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0.001, cz);
    group.add(floor);
  }

  // ── Floor tile grid ──
  const tileMat = new THREE.LineBasicMaterial({ color: "#CCCCCC", transparent: true, opacity: 0.25, depthWrite: false });
  const tileVerts: number[] = [];
  const tileStep = Math.min(w, d) > 2.5 ? 0.6 : 1.0;
  if (hasPoly) {
    // For polygon rooms, clip grid lines to polygon edges
    const poly = def.polygon!;
    const isInsidePoly = (px: number, pz: number): boolean => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i], [xj, zj] = poly[j];
        if (((zi > pz) !== (zj > pz)) && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi))
          inside = !inside;
      }
      return inside;
    };
    // Grid X lines clipped
    for (let x = xMin; x <= xMax; x += tileStep) {
      let segStart: number | null = null;
      for (let z = zMin; z <= zMax; z += 0.05) {
        if (isInsidePoly(x, z)) { if (segStart === null) segStart = z; }
        else { if (segStart !== null) { tileVerts.push(x, 0.004, segStart, x, 0.004, z - 0.05); segStart = null; } }
      }
      if (segStart !== null) tileVerts.push(x, 0.004, segStart, x, 0.004, zMax);
    }
    // Grid Z lines clipped
    for (let z = zMin; z <= zMax; z += tileStep) {
      let segStart: number | null = null;
      for (let x = xMin; x <= xMax; x += 0.05) {
        if (isInsidePoly(x, z)) { if (segStart === null) segStart = x; }
        else { if (segStart !== null) { tileVerts.push(segStart, 0.004, z, x - 0.05, 0.004, z); segStart = null; } }
      }
      if (segStart !== null) tileVerts.push(segStart, 0.004, z, xMax, 0.004, z);
    }
  } else {
    for (let x = xMin; x <= xMax; x += tileStep) tileVerts.push(x, 0.004, zMin, x, 0.004, zMax);
    for (let z = zMin; z <= zMax; z += tileStep) tileVerts.push(xMin, 0.004, z, xMax, 0.004, z);
  }
  if (tileVerts.length > 0) {
    const tileGeo = new THREE.BufferGeometry();
    tileGeo.setAttribute("position", new THREE.Float32BufferAttribute(tileVerts, 3));
    group.add(new THREE.LineSegments(tileGeo, tileMat));
  }

  // ── Polygon-aware Ceiling ──
  const ceilMat = new THREE.MeshStandardMaterial({ color: "#FAFAFA", roughness: 0.95, transparent: true, opacity: 1.0 });
  if (hasPoly) {
    const poly = def.polygon!;
    const ceilShape = new THREE.Shape();
    ceilShape.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ceilShape.lineTo(poly[i][0], poly[i][1]);
    ceilShape.closePath();
    const ceilGeo = new THREE.ShapeGeometry(ceilShape);
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = WALL_H;
    ceil.userData.isCeiling = true;
    group.add(ceil);
  } else {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, WALL_H, cz);
    ceil.userData.isCeiling = true;
    group.add(ceil);
  }

  // ── Shared wall detection ──
  const shared = getSharedSides().get(def.id) || new Set<string>();
  const wallMat = new THREE.MeshStandardMaterial({ color: def.wallColor, roughness: 0.9, transparent: true, opacity: 1.0 });

  // Helper: compute world position of a door/window given side + t relative to bounding box
  // Polygon-aware: resolves to the correct polygon edge for L/T/+ shaped rooms
  const openingWorldPos = (side: string, t: number): [number, number] => {
    // Default rectangular positions
    const defaultPos = (): [number, number] => {
      if (side === "north") return [xMin + t * w, zMax];
      if (side === "south") return [xMax - t * w, zMin];
      if (side === "east") return [xMax, zMin + t * d];
      return [xMin, zMax - t * d];
    };

    if (!hasPoly) return defaultPos();

    const poly = def.polygon!;
    // Compute winding
    let a2 = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      a2 += a[0] * b[1] - b[0] * a[1];
    }
    const nSign = a2 > 0 ? 1 : -1;
    const isHorizSide = side === "north" || side === "south";

    if (isHorizSide) {
      // 3D north: worldX = xMin + t*w, default z = zMax
      // 3D south: worldX = xMax - t*w, default z = zMin
      const worldX = side === "north" ? xMin + t * w : xMax - t * w;
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
        const edx = p2[0] - p1[0], edz = p2[1] - p1[1];
        if (Math.abs(edz) > 0.001 || Math.abs(edx) < 0.01) continue;
        // 3D: nz > 0 = "north", nz < 0 = "south"
        const nz = nSign * (-edx) / Math.abs(edx);
        if (side === "north" && nz <= 0) continue;
        if (side === "south" && nz >= 0) continue;
        const eMinX = Math.min(p1[0], p2[0]), eMaxX = Math.max(p1[0], p2[0]);
        if (worldX >= eMinX - 0.01 && worldX <= eMaxX + 0.01) {
          return [Math.max(eMinX, Math.min(eMaxX, worldX)), p1[1]];
        }
      }
      return defaultPos();
    }

    // East / West
    const worldZ = side === "east" ? zMin + t * d : zMax - t * d;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
      const edx = p2[0] - p1[0], edz = p2[1] - p1[1];
      if (Math.abs(edx) > 0.001 || Math.abs(edz) < 0.01) continue;
      const nx = nSign * edz / Math.abs(edz);
      if (side === "east" && nx <= 0) continue;
      if (side === "west" && nx >= 0) continue;
      const eMinZ = Math.min(p1[1], p2[1]), eMaxZ = Math.max(p1[1], p2[1]);
      if (worldZ >= eMinZ - 0.01 && worldZ <= eMaxZ + 0.01) {
        return [p1[0], Math.max(eMinZ, Math.min(eMaxZ, worldZ))];
      }
    }
    return defaultPos();
  };

  if (hasPoly) {
    // ═══ POLYGON WALLS: build wall segments along each polygon edge ═══
    const poly = def.polygon!;
    const allDoors = def.doors;
    const allWins = def.windows || [];
    const bbMat2 = new THREE.MeshStandardMaterial({ color: "#E0E0E0", transparent: true, opacity: 1.0 });
    const bbH = 0.08;

    // Compute polygon signed area to determine winding (only once)
    let area2 = 0;
    for (let j = 0; j < poly.length; j++) {
      const a = poly[j], b = poly[(j + 1) % poly.length];
      area2 += (a[0] * b[1] - b[0] * a[1]);
    }
    // The polygon from computeRectilinearUnion uses CW screen winding (CCW math → area2 > 0).
    // For CCW math: outward normal = right-hand perpendicular = (dz, -dx).
    // normalSign ensures (nx, nz) points OUTWARD regardless of winding.
    const normalSign = area2 > 0 ? 1 : -1;

    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const edgeDx = p2[0] - p1[0];
      const edgeDz = p2[1] - p1[1];
      const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDz * edgeDz);
      if (edgeLen < 0.01) continue;

      // Outward normal (pointing away from polygon interior)
      const nx = normalSign * edgeDz / edgeLen;
      const nz = normalSign * (-edgeDx) / edgeLen;

      // Determine side label for wallSide tag based on outward normal direction
      let ws: string;
      const isHoriz = Math.abs(edgeDz) < 0.001;
      const isVert = Math.abs(edgeDx) < 0.001;
      if (isHoriz) ws = nz > 0 ? "north" : "south"; // +Z = north (wall at zMax)
      else if (isVert) ws = nx > 0 ? "east" : "west";
      else ws = "north";

      const midX2 = (p1[0] + p2[0]) / 2;
      const midZ2 = (p1[1] + p2[1]) / 2;
      const eMinX = Math.min(p1[0], p2[0]), eMaxX = Math.max(p1[0], p2[0]);
      const eMinZ = Math.min(p1[1], p2[1]), eMaxZ = Math.max(p1[1], p2[1]);

      // ── Detect if this polygon edge is shared with a neighbor room ──
      let edgeIsShared = false;
      const T_EDGE = 0.1;
      for (const otherDef of HOUSE_ROOM_DEFS) {
        if (otherDef.id === def.id) continue;
        const [oxMin, oxMax, ozMin, ozMax] = otherDef.bounds;
        if (isHoriz) {
          const edgeZ = p1[1];
          if (Math.abs(ozMax - edgeZ) < T_EDGE || Math.abs(ozMin - edgeZ) < T_EDGE) {
            const ovlp = Math.min(eMaxX, oxMax) - Math.max(eMinX, oxMin);
            if (ovlp > 0.02) { edgeIsShared = true; break; }
          }
        }
        if (isVert) {
          const edgeX = p1[0];
          if (Math.abs(oxMax - edgeX) < T_EDGE || Math.abs(oxMin - edgeX) < T_EDGE) {
            const ovlp = Math.min(eMaxZ, ozMax) - Math.max(eMinZ, ozMin);
            if (ovlp > 0.02) { edgeIsShared = true; break; }
          }
        }
        // Also check other polygon edges
        if (otherDef.polygon) {
          for (let oi = 0; oi < otherDef.polygon.length; oi++) {
            const op1 = otherDef.polygon[oi], op2 = otherDef.polygon[(oi + 1) % otherDef.polygon.length];
            if (isHoriz && Math.abs(op2[1] - op1[1]) < 0.001 && Math.abs(op1[1] - p1[1]) < T_EDGE) {
              const oMinX = Math.min(op1[0], op2[0]), oMaxX = Math.max(op1[0], op2[0]);
              const ovlp = Math.min(eMaxX, oMaxX) - Math.max(eMinX, oMinX);
              if (ovlp > 0.02) { edgeIsShared = true; break; }
            }
            if (isVert && Math.abs(op2[0] - op1[0]) < 0.001 && Math.abs(op1[0] - p1[0]) < T_EDGE) {
              const oMinZ = Math.min(op1[1], op2[1]), oMaxZ = Math.max(op1[1], op2[1]);
              const ovlp = Math.min(eMaxZ, oMaxZ) - Math.max(eMinZ, oMinZ);
              if (ovlp > 0.02) { edgeIsShared = true; break; }
            }
          }
          if (edgeIsShared) break;
        }
      }
      const depth = edgeIsShared ? WALL_THICK / 2 : WALL_THICK;

      // Find doors/windows whose world position lies on this edge segment
      // Store as world-position tuples for unified cutout processing
      type DoorWP = { wx: number; wz: number; w: number };
      type WinWP = { wx: number; wz: number; w: number; h: number; sillH: number };
      const edgeDoorWPs: DoorWP[] = [];
      const edgeWinWPs: WinWP[] = [];

      // Own room's doors/windows
      for (const door of allDoors) {
        const [dx2, dz2] = openingWorldPos(door.side, door.t);
        if (isHoriz && Math.abs(dz2 - p1[1]) < 0.1) {
          if (dx2 >= eMinX - 0.1 && dx2 <= eMaxX + 0.1) edgeDoorWPs.push({ wx: dx2, wz: dz2, w: door.w });
        } else if (isVert && Math.abs(dx2 - p1[0]) < 0.1) {
          if (dz2 >= eMinZ - 0.1 && dz2 <= eMaxZ + 0.1) edgeDoorWPs.push({ wx: dx2, wz: dz2, w: door.w });
        }
      }
      for (const win of allWins) {
        const [wx3, wz3] = openingWorldPos(win.side, win.t);
        if (isHoriz && Math.abs(wz3 - p1[1]) < 0.1) {
          if (wx3 >= eMinX - 0.1 && wx3 <= eMaxX + 0.1) edgeWinWPs.push({ wx: wx3, wz: wz3, w: win.w, h: win.h, sillH: win.sillH });
        } else if (isVert && Math.abs(wx3 - p1[0]) < 0.1) {
          if (wz3 >= eMinZ - 0.1 && wz3 <= eMaxZ + 0.1) edgeWinWPs.push({ wx: wx3, wz: wz3, w: win.w, h: win.h, sillH: win.sillH });
        }
      }

      // ── Neighbor rooms' doors/windows that also fall on this edge ──
      for (const otherDef of HOUSE_ROOM_DEFS) {
        if (otherDef.id === def.id) continue;
        for (const nd of otherDef.doors) {
          const [ndx, ndz] = computeOpeningWorldPos(otherDef, nd.side, nd.t);
          if (isHoriz && Math.abs(ndz - p1[1]) < 0.1 && ndx >= eMinX - 0.1 && ndx <= eMaxX + 0.1) {
            edgeDoorWPs.push({ wx: ndx, wz: ndz, w: nd.w });
          } else if (isVert && Math.abs(ndx - p1[0]) < 0.1 && ndz >= eMinZ - 0.1 && ndz <= eMaxZ + 0.1) {
            edgeDoorWPs.push({ wx: ndx, wz: ndz, w: nd.w });
          }
        }
        for (const nw of (otherDef.windows || [])) {
          const [nwx, nwz] = computeOpeningWorldPos(otherDef, nw.side, nw.t);
          if (isHoriz && Math.abs(nwz - p1[1]) < 0.1 && nwx >= eMinX - 0.1 && nwx <= eMaxX + 0.1) {
            edgeWinWPs.push({ wx: nwx, wz: nwz, w: nw.w, h: nw.h, sillH: nw.sillH });
          } else if (isVert && Math.abs(nwx - p1[0]) < 0.1 && nwz >= eMinZ - 0.1 && nwz <= eMaxZ + 0.1) {
            edgeWinWPs.push({ wx: nwx, wz: nwz, w: nw.w, h: nw.h, sillH: nw.sillH });
          }
        }
      }

      // Build wall shape (local coords: x along edge, y vertical)
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-edgeLen / 2, -WALL_H / 2);
      wallShape.lineTo(edgeLen / 2, -WALL_H / 2);
      wallShape.lineTo(edgeLen / 2, WALL_H / 2);
      wallShape.lineTo(-edgeLen / 2, WALL_H / 2);
      wallShape.closePath();

      // Door cutouts (project world position to local edge coordinate)
      for (const dp of edgeDoorWPs) {
        const projT = ((dp.wx - p1[0]) * edgeDx + (dp.wz - p1[1]) * edgeDz) / (edgeLen * edgeLen);
        const localX = -edgeLen / 2 + projT * edgeLen;
        const hw3 = dp.w / 2;
        const dh = 2.15;
        const hole = new THREE.Path();
        hole.moveTo(localX - hw3, -WALL_H / 2);
        hole.lineTo(localX - hw3, -WALL_H / 2 + dh);
        hole.lineTo(localX + hw3, -WALL_H / 2 + dh);
        hole.lineTo(localX + hw3, -WALL_H / 2);
        hole.closePath();
        wallShape.holes.push(hole);
      }

      // Window cutouts
      for (const wp of edgeWinWPs) {
        const projT = ((wp.wx - p1[0]) * edgeDx + (wp.wz - p1[1]) * edgeDz) / (edgeLen * edgeLen);
        const localX = -edgeLen / 2 + projT * edgeLen;
        const whw = wp.w / 2;
        const wBottom = -WALL_H / 2 + wp.sillH;
        const wTop = wBottom + wp.h;
        const hole = new THREE.Path();
        hole.moveTo(localX - whw, wBottom);
        hole.lineTo(localX - whw, wTop);
        hole.lineTo(localX + whw, wTop);
        hole.lineTo(localX + whw, wBottom);
        hole.closePath();
        wallShape.holes.push(hole);
      }

      // Rotation: align local X with edge direction
      // local X → (cos ry, 0, -sin ry) should equal (edgeDx/len, 0, edgeDz/len)
      // → ry = atan2(-edgeDz, edgeDx)
      // This makes local +Z point perpendicular to edge; extrusion goes INWARD from boundary
      const ry = Math.atan2(-edgeDz, edgeDx);

      // Position front face (local z=0) at the polygon boundary (edge midpoint);
      // extrusion extends inward by `depth`.
      const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth, bevelEnabled: false, steps: 1 });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat.clone());
      wallMesh.position.set(midX2, WALL_H / 2, midZ2);
      wallMesh.rotation.y = ry;
      wallMesh.userData.wallSide = ws;
      group.add(wallMesh);

      // Baseboard along this edge (at inner wall face, flush with room interior)
      const bbGeo = new THREE.BoxGeometry(edgeLen, bbH, 0.03);
      const bbMesh = new THREE.Mesh(bbGeo, bbMat2.clone());
      // Inner face is at boundary - outwardNormal * depth (shifted inward)
      const bbX = midX2 - nx * (depth - 0.015);
      const bbZ = midZ2 - nz * (depth - 0.015);
      bbMesh.position.set(bbX, bbH / 2, bbZ);
      bbMesh.rotation.y = ry;
      bbMesh.userData.wallSide = ws;
      group.add(bbMesh);
    }

    // Door Panels for polygon rooms — polygon-aware position via openingWorldPos
    const doorH = 2.1;
    const doorOpenAngle = Math.PI * 0.3;
    for (const door of def.doors) {
      const ws2 = sideToWallSide(door.side);
      const dd = WALL_THICK;
      const [dwpX, dwpZ] = openingWorldPos(door.side, door.t);
      let hingeX = 0, hingeZ = 0, angle = doorOpenAngle;
      if (door.side === "north") {
        hingeX = dwpX - door.w / 2;
        hingeZ = dwpZ - dd;
        angle = Math.PI - doorOpenAngle;
      } else if (door.side === "south") {
        hingeX = dwpX + door.w / 2;
        hingeZ = dwpZ + dd;
        angle = -doorOpenAngle;
      } else if (door.side === "east") {
        hingeX = dwpX - dd;
        hingeZ = dwpZ - door.w / 2;
        angle = -Math.PI / 2 + doorOpenAngle;
      } else {
        hingeX = dwpX + dd;
        hingeZ = dwpZ + door.w / 2;
        angle = Math.PI / 2 + doorOpenAngle;
      }
      const doorPanel = buildDoorPanel(door.w, doorH, hingeX, hingeZ, angle, ws2);
      doorPanel.userData.openingType = "door";
      doorPanel.userData.openingRoomId = def.id;
      doorPanel.userData.openingIndex = def.doors.indexOf(door);
      doorPanel.userData.openingSide = door.side;
      group.add(doorPanel);
    }

    // Window Assemblies for polygon rooms — polygon-aware position via openingWorldPos
    for (const win of (def.windows || [])) {
      const ws2 = sideToWallSide(win.side);
      const winCenterY = win.sillH + win.h / 2;
      const wOff = WALL_THICK / 2;
      const [wwpX, wwpZ] = openingWorldPos(win.side, win.t);
      let wpx = 0, wpz = 0, wry = 0;
      if (win.side === "north") { wpx = wwpX; wpz = wwpZ - wOff; wry = Math.PI / 2; }
      else if (win.side === "south") { wpx = wwpX; wpz = wwpZ + wOff; wry = -Math.PI / 2; }
      else if (win.side === "east") { wpx = wwpX - wOff; wpz = wwpZ; wry = 0; }
      else { wpx = wwpX + wOff; wpz = wwpZ; wry = Math.PI; }

      const winAssembly = buildWindowAssembly(win.w, win.h, wpx, winCenterY, wpz, wry, ws2);
      winAssembly.userData.openingType = "window";
      winAssembly.userData.openingRoomId = def.id;
      winAssembly.userData.openingIndex = (def.windows || []).indexOf(win);
      winAssembly.userData.openingSide = win.side;
      group.add(winAssembly);
    }
  } else {
    // ═══ RECTANGULAR WALLS (original logic) ═══
    const doorsFor = (side: string) => def.doors.filter((dd) => dd.side === side);
    const winsFor = (side: string) => (def.windows || []).filter((ww) => ww.side === side);

    const buildWall = (wallW: number, px2: number, py2: number, pz2: number, ry: number, side: string) => {
      const doorOpenings = doorsFor(side);
      const winOpenings = winsFor(side);
      const ws = sideToWallSide(side);
      const depth = shared.has(side) ? WALL_THICK / 2 : WALL_THICK;
      const neighborOp = shared.has(side) ? getNeighborOpenings(def.id, side, HOUSE_ROOM_DEFS) : { doors: [], windows: [] };

      const shape = new THREE.Shape();
      shape.moveTo(-wallW / 2, -WALL_H / 2);
      shape.lineTo(wallW / 2, -WALL_H / 2);
      shape.lineTo(wallW / 2, WALL_H / 2);
      shape.lineTo(-wallW / 2, WALL_H / 2);
      shape.lineTo(-wallW / 2, -WALL_H / 2);

      for (const door of [...doorOpenings, ...neighborOp.doors]) {
        const dcx2 = -wallW / 2 + door.t * wallW;
        const hw2 = door.w / 2;
        const dh = 2.15;
        const hole = new THREE.Path();
        hole.moveTo(dcx2 - hw2, -WALL_H / 2);
        hole.lineTo(dcx2 - hw2, -WALL_H / 2 + dh);
        hole.lineTo(dcx2 + hw2, -WALL_H / 2 + dh);
        hole.lineTo(dcx2 + hw2, -WALL_H / 2);
        hole.lineTo(dcx2 - hw2, -WALL_H / 2);
        shape.holes.push(hole);
      }

      for (const win of [...winOpenings, ...neighborOp.windows]) {
        const wcx2 = -wallW / 2 + win.t * wallW;
        const whw = win.w / 2;
        const wBottom = -WALL_H / 2 + win.sillH;
        const wTop = wBottom + win.h;
        const hole = new THREE.Path();
        hole.moveTo(wcx2 - whw, wBottom);
        hole.lineTo(wcx2 - whw, wTop);
        hole.lineTo(wcx2 + whw, wTop);
        hole.lineTo(wcx2 + whw, wBottom);
        hole.lineTo(wcx2 - whw, wBottom);
        shape.holes.push(hole);
      }

      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
      const wm = new THREE.Mesh(geo, wallMat.clone());
      wm.position.set(px2, py2, pz2);
      wm.rotation.y = ry;
      wm.userData.wallSide = ws;
      group.add(wm);
    };

    const nDepth = shared.has("north") ? WALL_THICK / 2 : WALL_THICK;
    const sDepth = shared.has("south") ? WALL_THICK / 2 : WALL_THICK;
    buildWall(w, cx, WALL_H / 2, zMax - nDepth, 0, "north");
    buildWall(w, cx, WALL_H / 2, zMin + sDepth, Math.PI, "south");
    buildWall(d, xMin, WALL_H / 2, cz, Math.PI / 2, "west");
    buildWall(d, xMax, WALL_H / 2, cz, -Math.PI / 2, "east");

    // ── Baseboards ──
    const bbMat2 = new THREE.MeshStandardMaterial({ color: "#E0E0E0", transparent: true, opacity: 1.0 });
    const bbH = 0.08;
    const mkBB = (lengthAxis: "x" | "z", len: number, px2: number, pz2: number, ws: string) => {
      const geo = lengthAxis === "x"
        ? new THREE.BoxGeometry(len, bbH, 0.03)
        : new THREE.BoxGeometry(0.03, bbH, len);
      const bb = new THREE.Mesh(geo, bbMat2.clone());
      bb.position.set(px2, bbH / 2, pz2);
      bb.userData.wallSide = ws;
      group.add(bb);
    };
    const nDepth2 = shared.has("north") ? WALL_THICK / 2 : WALL_THICK;
    const sDepth2 = shared.has("south") ? WALL_THICK / 2 : WALL_THICK;
    mkBB("x", w, cx, zMax - nDepth2 + 0.005, "north");
    mkBB("x", w, cx, zMin + sDepth2 - 0.005, "south");
    const wDepth2 = shared.has("west") ? WALL_THICK / 2 : WALL_THICK;
    const eDepth2 = shared.has("east") ? WALL_THICK / 2 : WALL_THICK;
    mkBB("z", d, xMin + wDepth2 - 0.005, cz, "west");
    mkBB("z", d, xMax - eDepth2 + 0.005, cz, "east");

    // ── Door Panels ──
    const doorH = 2.1;
    const doorOpenAngle = Math.PI * 0.3;
    for (const door of def.doors) {
      const ws = sideToWallSide(door.side);
      const dd = shared.has(door.side) ? WALL_THICK / 2 : WALL_THICK;
      let hingeX = 0, hingeZ = 0, angle = doorOpenAngle;
      if (door.side === "north") {
        hingeX = cx + (-w / 2 + door.t * w) - door.w / 2;
        hingeZ = zMax - dd;
        angle = Math.PI - doorOpenAngle;
      } else if (door.side === "south") {
        hingeX = cx + (w / 2 - door.t * w) + door.w / 2;
        hingeZ = zMin + dd;
        angle = -doorOpenAngle;
      } else if (door.side === "east") {
        hingeX = xMax - dd;
        hingeZ = cz + (-d / 2 + door.t * d) - door.w / 2;
        angle = -Math.PI / 2 + doorOpenAngle;
      } else {
        hingeX = xMin + dd;
        hingeZ = cz + (d / 2 - door.t * d) + door.w / 2;
        angle = Math.PI / 2 + doorOpenAngle;
      }
      const doorPanel = buildDoorPanel(door.w, doorH, hingeX, hingeZ, angle, ws);
      doorPanel.userData.openingType = "door";
      doorPanel.userData.openingRoomId = def.id;
      doorPanel.userData.openingIndex = def.doors.indexOf(door);
      doorPanel.userData.openingSide = door.side;
      group.add(doorPanel);
    }

    // ── Window Assemblies ──
    for (const win of (def.windows || [])) {
      const ws = sideToWallSide(win.side);
      const winCenterY = win.sillH + win.h / 2;
      const wd2 = shared.has(win.side) ? WALL_THICK / 2 : WALL_THICK;
      const wOff = wd2 / 2;
      let wpx = 0, wpz = 0, wry = 0;
      if (win.side === "north") { wpx = cx + (-w / 2 + win.t * w); wpz = zMax - wOff; wry = Math.PI / 2; }
      else if (win.side === "south") { wpx = cx + (w / 2 - win.t * w); wpz = zMin + wOff; wry = -Math.PI / 2; }
      else if (win.side === "east") { wpx = xMax - wOff; wpz = cz + (-d / 2 + win.t * d); wry = 0; }
      else { wpx = xMin + wOff; wpz = cz + (d / 2 - win.t * d); wry = Math.PI; }

      const winAssembly = buildWindowAssembly(win.w, win.h, wpx, winCenterY, wpz, wry, ws);
      winAssembly.userData.openingType = "window";
      winAssembly.userData.openingRoomId = def.id;
      winAssembly.userData.openingIndex = (def.windows || []).indexOf(win);
      winAssembly.userData.openingSide = win.side;
      group.add(winAssembly);
    }
  }

  // Ceiling light fixture (6 segments = lightweight)
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 6), new THREE.MeshStandardMaterial({ color: "#DDDDDD", metalness: 0.3, roughness: 0.4 }));
  fixture.position.set(cx, WALL_H - 0.02, cz);
  fixture.userData.isCeilingFixture = true;
  group.add(fixture);

  // Room point light — always visible, per-room intensity controlled via userData
  const roomLight = new THREE.PointLight("#FFF8E8", 1.8, Math.max(w, d) * 2.0, 2);
  roomLight.position.set(cx, WALL_H - 0.1, cz);
  roomLight.castShadow = false;
  roomLight.userData.isRoomLight = true;
  roomLight.userData.roomId = def.id;
  roomLight.userData.baseIntensity = 1.8;
  roomLight.visible = true;
  group.add(roomLight);

  // Furniture (tagged as static so editor mode can remove/rebuild them)
  for (const [fId, fx, fy, fz, fRot] of def.furniture) {
    try {
      const fGroup = buildFurnitureModel(fId, "#8A8A8A");
      fGroup.position.set(fx, fy, fz);
      fGroup.rotation.y = (fRot * Math.PI) / 180;
      fGroup.userData.isStaticFurniture = true;
      group.add(fGroup);
    } catch { /* skip */ }
  }

  return group;
}

/** Centroid of a polygon (for polygon room helpers) */
function polygonCentroid2(poly: [number, number][]): [number, number] {
  let cx2 = 0, cz2 = 0;
  for (const [x, z] of poly) { cx2 += x; cz2 += z; }
  return [cx2 / poly.length, cz2 / poly.length];
}



/* ═══════════════════════════════════════════════════════
   Rebuild walls, door panels & window assemblies for a room
   Used when 2D editor modifies doors/windows
   ═══════════════════════════════════════════════════════ */
interface OpeningDoorDef { side: string; t: number; w: number; flipped?: boolean }
interface OpeningWinDef { side: string; t: number; w: number; h: number; sillH: number }

function rebuildRoomOpenings(
  roomGroup: THREE.Group,
  bounds: [number, number, number, number],
  doors: OpeningDoorDef[],
  windows: OpeningWinDef[],
  wallColor: string,
  roomId?: string,
): void {
  // For polygon rooms, do a full rebuild since polygon wall logic is complex
  if (roomId) {
    const polyDef = HOUSE_ROOM_DEFS.find(d => d.id === roomId);
    if (polyDef && polyDef.polygon && polyDef.polygon.length >= 3) {
      const allChildren = [...roomGroup.children];
      for (const child of allChildren) {
        roomGroup.remove(child);
        child.traverse((c) => {
          if ((c as any).geometry) (c as any).geometry.dispose();
          if ((c as any).material) {
            const m = (c as any).material;
            if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose());
            else m.dispose();
          }
        });
      }
      const freshGroup = buildHouseRoom(polyDef);
      const freshChildren = [...freshGroup.children];
      for (const child of freshChildren) {
        freshGroup.remove(child);
        roomGroup.add(child);
      }
      return;
    }
  }

  // 1. Remove all wall-related children (walls, baseboards, door panels, window assemblies)
  const toRemove: THREE.Object3D[] = [];
  roomGroup.children.forEach((child) => {
    if (child.userData.wallSide !== undefined) toRemove.push(child);
  });
  toRemove.forEach((obj) => {
    roomGroup.remove(obj);
    obj.traverse((c) => {
      if ((c as any).geometry) (c as any).geometry.dispose();
      if ((c as any).material) {
        const m = (c as any).material;
        if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose());
        else m.dispose();
      }
    });
  });

  const [xMin, xMax, zMin, zMax] = bounds;
  const w = xMax - xMin, d = zMax - zMin;
  const cx = (xMin + xMax) / 2, cz = (zMin + zMax) / 2;

  // Shared-wall detection
  const shared = roomId ? (getSharedSides().get(roomId) || new Set<string>()) : new Set<string>();

  // 2. Rebuild walls with door/window cutouts (thick, ExtrudeGeometry — FrontSide to fix z-fighting)
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9, transparent: true, opacity: 1.0 });
  const doorsFor = (side: string) => doors.filter((dd) => dd.side === side);
  const winsFor = (side: string) => windows.filter((ww) => ww.side === side);

  const buildWall = (wallW: number, px2: number, py2: number, pz2: number, ry: number, side: string) => {
    const doorOpenings = doorsFor(side);
    const winOpenings = winsFor(side);
    const ws = sideToWallSide(side);
    const depth = shared.has(side) ? WALL_THICK / 2 : WALL_THICK;

    // Include neighbor's openings on shared walls so doors/windows cut through both halves
    const neighborOp = (shared.has(side) && roomId)
      ? getNeighborOpenings(roomId, side, HOUSE_ROOM_DEFS) : { doors: [], windows: [] };

    const shape = new THREE.Shape();
    shape.moveTo(-wallW / 2, -WALL_H / 2);
    shape.lineTo(wallW / 2, -WALL_H / 2);
    shape.lineTo(wallW / 2, WALL_H / 2);
    shape.lineTo(-wallW / 2, WALL_H / 2);
    shape.lineTo(-wallW / 2, -WALL_H / 2);

    for (const door of [...doorOpenings, ...neighborOp.doors]) {
      const dcx2 = -wallW / 2 + door.t * wallW;
      const hw = door.w / 2;
      const dh = 2.15;
      const hole = new THREE.Path();
      hole.moveTo(dcx2 - hw, -WALL_H / 2);
      hole.lineTo(dcx2 - hw, -WALL_H / 2 + dh);
      hole.lineTo(dcx2 + hw, -WALL_H / 2 + dh);
      hole.lineTo(dcx2 + hw, -WALL_H / 2);
      hole.lineTo(dcx2 - hw, -WALL_H / 2);
      shape.holes.push(hole);
    }

    for (const win of [...winOpenings, ...neighborOp.windows]) {
      const wcx2 = -wallW / 2 + win.t * wallW;
      const whw = win.w / 2;
      const wBottom = -WALL_H / 2 + win.sillH;
      const wTop = wBottom + win.h;
      const hole = new THREE.Path();
      hole.moveTo(wcx2 - whw, wBottom);
      hole.lineTo(wcx2 - whw, wTop);
      hole.lineTo(wcx2 + whw, wTop);
      hole.lineTo(wcx2 + whw, wBottom);
      hole.lineTo(wcx2 - whw, wBottom);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
    const wm = new THREE.Mesh(geo, wallMat.clone());
    wm.position.set(px2, py2, pz2);
    wm.rotation.y = ry;
    wm.userData.wallSide = ws;
    roomGroup.add(wm);
  };

  const nDepth = shared.has("north") ? WALL_THICK / 2 : WALL_THICK;
  const sDepth = shared.has("south") ? WALL_THICK / 2 : WALL_THICK;
  buildWall(w, cx, WALL_H / 2, zMax - nDepth, 0, "north");
  buildWall(w, cx, WALL_H / 2, zMin + sDepth, Math.PI, "south");
  buildWall(d, xMin, WALL_H / 2, cz, Math.PI / 2, "west");
  buildWall(d, xMax, WALL_H / 2, cz, -Math.PI / 2, "east");

  // 3. Rebuild baseboards
  const bbMat = new THREE.MeshStandardMaterial({ color: "#E0E0E0", transparent: true, opacity: 1.0 });
  const bbH = 0.08;
  const bbDepth = 0.03;
  const mkBB = (lengthAxis: "x" | "z", len: number, px2: number, pz2: number, ws: string) => {
    const geo = lengthAxis === "x"
      ? new THREE.BoxGeometry(len, bbH, bbDepth)
      : new THREE.BoxGeometry(bbDepth, bbH, len);
    const bb = new THREE.Mesh(geo, bbMat.clone());
    bb.position.set(px2, bbH / 2, pz2);
    bb.userData.wallSide = ws;
    roomGroup.add(bb);
  };
  mkBB("x", w, cx, zMax - nDepth + 0.005, "north");
  mkBB("x", w, cx, zMin + sDepth - 0.005, "south");
  const wDepth = shared.has("west") ? WALL_THICK / 2 : WALL_THICK;
  const eDepth = shared.has("east") ? WALL_THICK / 2 : WALL_THICK;
  mkBB("z", d, xMin + wDepth - 0.005, cz, "west");
  mkBB("z", d, xMax - eDepth + 0.005, cz, "east");

  // 4. Rebuild door panels (positioned at inner face of thick wall)
  const doorH = 2.1;
  const doorOpenAngle = Math.PI * 0.3;
  for (const door of doors) {
    const ws = sideToWallSide(door.side);
    const dd = shared.has(door.side) ? WALL_THICK / 2 : WALL_THICK;
    const flipped = !!door.flipped;
    let hingeX = 0, hingeZ = 0, angle = doorOpenAngle;
    if (door.side === "north") {
      // Normal: hinge at left (lower X); Flipped: hinge at right (higher X)
      hingeX = flipped
        ? cx + (-w / 2 + door.t * w) + door.w / 2
        : cx + (-w / 2 + door.t * w) - door.w / 2;
      hingeZ = zMax - dd;
      angle = flipped
        ? -(Math.PI - doorOpenAngle)
        : Math.PI - doorOpenAngle;
    } else if (door.side === "south") {
      hingeX = flipped
        ? cx + (w / 2 - door.t * w) - door.w / 2
        : cx + (w / 2 - door.t * w) + door.w / 2;
      hingeZ = zMin + dd;
      angle = flipped
        ? doorOpenAngle
        : -doorOpenAngle;
    } else if (door.side === "east") {
      hingeX = xMax - dd;
      hingeZ = flipped
        ? cz + (-d / 2 + door.t * d) + door.w / 2
        : cz + (-d / 2 + door.t * d) - door.w / 2;
      angle = flipped
        ? -(-Math.PI / 2 + doorOpenAngle)
        : -Math.PI / 2 + doorOpenAngle;
    } else {
      hingeX = xMin + dd;
      hingeZ = flipped
        ? cz + (d / 2 - door.t * d) - door.w / 2
        : cz + (d / 2 - door.t * d) + door.w / 2;
      angle = flipped
        ? -(Math.PI / 2 + doorOpenAngle)
        : Math.PI / 2 + doorOpenAngle;
    }
    const doorPanel = buildDoorPanel(door.w, doorH, hingeX, hingeZ, angle, ws);
    doorPanel.userData.openingType = "door";
    doorPanel.userData.openingRoomId = roomId || "";
    doorPanel.userData.openingIndex = doors.indexOf(door);
    doorPanel.userData.openingSide = door.side;
    roomGroup.add(doorPanel);
  }

  // 5. Rebuild window assemblies (centered in wall thickness)
  for (const win of windows) {
    const ws = sideToWallSide(win.side);
    const winCenterY = win.sillH + win.h / 2;
    const wd = shared.has(win.side) ? WALL_THICK / 2 : WALL_THICK;
    const wOff = wd / 2;
    let wpx = 0, wpz = 0, wry = 0;
    if (win.side === "north") {
      wpx = cx + (-w / 2 + win.t * w);
      wpz = zMax - wOff;
      wry = Math.PI / 2;
    } else if (win.side === "south") {
      wpx = cx + (w / 2 - win.t * w);
      wpz = zMin + wOff;
      wry = -Math.PI / 2;
    } else if (win.side === "east") {
      wpx = xMax - wOff;
      wpz = cz + (-d / 2 + win.t * d);
      wry = 0;
    } else {
      wpx = xMin + wOff;
      wpz = cz + (d / 2 - win.t * d);
      wry = Math.PI;
    }
    const winAssembly = buildWindowAssembly(win.w, win.h, wpx, winCenterY, wpz, wry, ws);
    winAssembly.userData.openingType = "window";
    winAssembly.userData.openingRoomId = roomId || "";
    winAssembly.userData.openingIndex = windows.indexOf(win);
    winAssembly.userData.openingSide = win.side;
    roomGroup.add(winAssembly);
  }
}

/** Dispose all geometry & materials in a group, then remove from parent. */
function disposeGroup(group: THREE.Group) {
  group.traverse((child) => {
    if ((child as any).geometry) (child as any).geometry.dispose();
    if ((child as any).material) {
      const m = (child as any).material;
      if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose());
      else m.dispose();
    }
  });
  group.removeFromParent();
}

/** Build a 3D group for a standalone wall polyline (series of wall segments). */
function buildStandaloneWall3D(wall: { points: [number, number][]; thickness: number; height: number; color: string }): THREE.Group {
  const group = new THREE.Group();
  group.name = `standalone-wall-3d`;
  const wallMat = new THREE.MeshStandardMaterial({ color: wall.color, roughness: 0.9, side: THREE.DoubleSide });

  for (let i = 0; i < wall.points.length - 1; i++) {
    const [x1, z1] = wall.points[i];
    const [x2, z2] = wall.points[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.01) continue;

    // Create a box for this wall segment
    const geo = new THREE.BoxGeometry(segLen, wall.height, wall.thickness);
    const mesh = new THREE.Mesh(geo, wallMat.clone());

    // Position at midpoint, raised to half height
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    mesh.position.set(mx, wall.height / 2, mz);

    // Rotate to align with segment direction
    const angle = Math.atan2(dz, dx);
    mesh.rotation.y = -angle;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isStandaloneWall = true;
    group.add(mesh);
  }

  // Add a thin baseboard strip along the bottom
  const bbMat = new THREE.MeshStandardMaterial({ color: "#D8D0C4", roughness: 0.6, metalness: 0.05 });
  const bbH = 0.08;
  for (let i = 0; i < wall.points.length - 1; i++) {
    const [x1, z1] = wall.points[i];
    const [x2, z2] = wall.points[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.01) continue;
    const geo = new THREE.BoxGeometry(segLen + 0.02, bbH, wall.thickness + 0.02);
    const mesh = new THREE.Mesh(geo, bbMat.clone());
    mesh.position.set((x1 + x2) / 2, bbH / 2, (z1 + z2) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    mesh.userData.isStandaloneWall = true;
    group.add(mesh);
  }

  return group;
}

/* ═══════════════════════════════════════════════════════
   Contour Outline Helpers — follows actual mesh geometry
   ═══════════════════════════════════════════════════════ */

/** Build a contour outline group that traces each mesh's edges in the furniture group */
function buildContourOutline(furnitureGroup: THREE.Group, color: string): THREE.Group {
  const outlineGroup = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.9 });

  furnitureGroup.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo) return;

    const edges = new THREE.EdgesGeometry(geo, 25); // 25° threshold to skip co-planar edges
    const line = new THREE.LineSegments(edges, lineMat.clone());

    // Copy world transform relative to the furniture group
    mesh.updateWorldMatrix(true, false);
    line.applyMatrix4(mesh.matrixWorld);

    line.castShadow = false;
    line.receiveShadow = false;
    outlineGroup.add(line);
  });

  return outlineGroup;
}

/** Build a transparent glow group that wraps each mesh slightly enlarged */
function buildContourGlow(furnitureGroup: THREE.Group, color: string, opacity: number): THREE.Group {
  const glowGroup = new THREE.Group();
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.FrontSide,
  });

  furnitureGroup.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo) return;

    const clonedGeo = geo.clone();
    const glowMesh = new THREE.Mesh(clonedGeo, glowMat.clone());

    // Copy world transform and apply slight scale-up
    mesh.updateWorldMatrix(true, false);
    glowMesh.applyMatrix4(mesh.matrixWorld);
    glowMesh.scale.multiplyScalar(1.03);

    glowMesh.castShadow = false;
    glowMesh.receiveShadow = false;
    glowGroup.add(glowMesh);
  });

  return glowGroup;
}

/** Dispose all geometries and materials inside a contour outline/glow group */
function disposeContourGroup(group: THREE.Group) {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.LineSegments).isLineSegments) {
      const obj = child as THREE.Mesh | THREE.LineSegments;
      obj.geometry?.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          (obj.material as THREE.Material).dispose();
        }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════
   Three.js Scene Builder (vanilla)
   ═══════════════════════════════════════════════════════ */
interface ThreeSceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  css2dRenderer: CSS2DRenderer;
  controls: OrbitControls;
  roomGroup: THREE.Group;
  furnitureGroup: THREE.Group;
  lightsGroup: THREE.Group;
  wallMeshes: THREE.Mesh[];
  floorMesh: THREE.Mesh | null;
  ceilingMesh: THREE.Mesh | null;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  selectedOutline: THREE.Group | null;
  selectedGlow: THREE.Group | null;
  animRef: { id: number };
  ceilingPointLight: THREE.PointLight | null;
  floorPointLight: THREE.PointLight | null;
  accentSpotLight: THREE.SpotLight | null;
  underCabinetLight: THREE.PointLight | null;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  cameraAnim: { active: boolean; startTime: number; duration: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null;
  flyToZone: (zone: RoomZone) => void;
  houseRoomGroups: Map<string, THREE.Group>;
  houseRoomLabels: Map<string, CSS2DObject>;
  groundPlane: THREE.Mesh | null;
  flyToPos: (toPos: [number, number, number], toTarget: [number, number, number], dur?: number) => void;
  activeRoomBounds: RoomBounds;
  activeCutawayRoomId: string | null;
  houseCutawayState: Record<string, number>;
  perRoomCutawayStates: Map<string, Record<string, number>>;
  isHouseViewMode: boolean;
  setRoomLightShadows: (roomId: string | null) => void;
  lightCenter: { x: number; z: number };
  /** Mutable overrides for room bounds — updated when 2D editor moves/resizes rooms */
  roomBoundsOverrides: Map<string, [number, number, number, number]>;
  /** Max device pixel ratio (lower on mobile) */
  maxDPR: number;
  /** Whether this is a low-power device */
  isLowPower: boolean;
  /** Invalidate cutaway material cache when room geometry is rebuilt */
  invalidateCutawayCache: (roomId: string) => void;
  /** When true, cutaway is disabled and all walls/ceilings restore to full opacity */
  disableCutaway: boolean;
  /** Groups for standalone walls drawn in 2D editor */
  standaloneWallGroups: Map<string, THREE.Group>;
}

function buildScene(container: HTMLDivElement): ThreeSceneRef {
  // Use var to ensure hoisting — avoids TDZ in animate() closure
  var isHouseViewMode = false;

  const w = container.clientWidth;
  const h = container.clientHeight;

  // Detect low-power device (mobile or low-res screen)
  const isLowPower = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.devicePixelRatio <= 1 || (w * h < 500000);
  const maxDPR = isLowPower ? 1.5 : 2;

  const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, alpha: true, powerPreference: isLowPower ? "low-power" : "high-performance" });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // CSS2D overlay renderer for room labels
  const css2dRenderer = new CSS2DRenderer();
  css2dRenderer.setSize(w, h);
  css2dRenderer.domElement.style.position = "absolute";
  css2dRenderer.domElement.style.top = "0";
  css2dRenderer.domElement.style.left = "0";
  css2dRenderer.domElement.style.pointerEvents = "none";
  container.appendChild(css2dRenderer.domElement);

  const scene = new THREE.Scene();
  // Light off-white background matching graph paper
  scene.background = new THREE.Color("#ECEEF1");

  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  // Start at house overview position
  camera.position.set(8, 12, 10);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 25;
  controls.update();

  const roomGroup = new THREE.Group();
  const furnitureGroup = new THREE.Group();
  const lightsGroup = new THREE.Group();
  scene.add(roomGroup, furnitureGroup, lightsGroup);

  // === Build Room ===
  const roomW = 6.2, roomD = 4.5, wallH = 2.6;

  // Floor — white tile style (polygonOffset prevents z-fighting with ground plane)
  const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
  const floorMat = new THREE.MeshStandardMaterial({ color: "#F0F0F0", roughness: 0.4, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0.001;
  roomGroup.add(floorMesh);

  // Floor tile grid lines
  const tileSize = 0.6;
  const tileMat = new THREE.LineBasicMaterial({ color: "#E0E0E0", transparent: true, opacity: 0.5 });
  for (let x = -roomW / 2; x <= roomW / 2; x += tileSize) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.003, -roomD / 2),
      new THREE.Vector3(x, 0.003, roomD / 2),
    ]);
    roomGroup.add(new THREE.Line(g, tileMat));
  }
  for (let z = -roomD / 2; z <= roomD / 2; z += tileSize) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-roomW / 2, 0.003, z),
      new THREE.Vector3(roomW / 2, 0.003, z),
    ]);
    roomGroup.add(new THREE.Line(g, tileMat));
  }

  // Walls — white (FrontSide only to prevent z-fighting)
  const wallMat = new THREE.MeshStandardMaterial({ color: "#FAFAFA", roughness: 0.9, transparent: true, opacity: 1.0 });
  const wallMeshes: THREE.Mesh[] = [];

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, wallH), wallMat.clone());
  backWall.position.set(0, wallH / 2, -roomD / 2);
  backWall.userData.wallSide = "back";
  roomGroup.add(backWall);
  wallMeshes.push(backWall);

  // Door dimensions (declared early so baseboards can reference doorZ)
  const doorW = 0.9, doorH = 2.1, doorThick = 0.05;
  const doorFrameDepth = 0.06;
  const doorWallX = -roomW / 2;
  const doorZ = 0.8;
  const doorOpenAngle = Math.PI * 0.3; // ~54° open

  // Left wall with rectangular doorway cutout
  const doorHoleW = 1.02;
  const doorHoleH = 2.15;
  const doorHoleCx = -0.8;
  const doorHoleHalfW = doorHoleW / 2;
  const doorHoleBottom = -wallH / 2;
  const doorHoleTop = doorHoleBottom + doorHoleH;

  const leftWallShape = new THREE.Shape();
  leftWallShape.moveTo(-roomD / 2, -wallH / 2);
  leftWallShape.lineTo(roomD / 2, -wallH / 2);
  leftWallShape.lineTo(roomD / 2, wallH / 2);
  leftWallShape.lineTo(-roomD / 2, wallH / 2);
  leftWallShape.lineTo(-roomD / 2, -wallH / 2);

  const doorHole = new THREE.Path();
  doorHole.moveTo(doorHoleCx - doorHoleHalfW, doorHoleBottom);
  doorHole.lineTo(doorHoleCx - doorHoleHalfW, doorHoleTop);
  doorHole.lineTo(doorHoleCx + doorHoleHalfW, doorHoleTop);
  doorHole.lineTo(doorHoleCx + doorHoleHalfW, doorHoleBottom);
  doorHole.lineTo(doorHoleCx - doorHoleHalfW, doorHoleBottom);
  leftWallShape.holes.push(doorHole);

  const leftWallGeo = new THREE.ShapeGeometry(leftWallShape);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat.clone());
  leftWall.position.set(-roomW / 2, wallH / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.userData.wallSide = "left";
  roomGroup.add(leftWall);
  wallMeshes.push(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, wallH), wallMat.clone());
  rightWall.position.set(roomW / 2, wallH / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.userData.wallSide = "right";
  roomGroup.add(rightWall);
  wallMeshes.push(rightWall);

  // Ceiling (FrontSide — normal faces down into room after rotation)
  const ceilMat = new THREE.MeshStandardMaterial({ color: "#FAFAFA", roughness: 0.95, transparent: true, opacity: 1.0 });
  const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), ceilMat);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = wallH;
  roomGroup.add(ceilingMesh);

  // Baseboards (tagged with wallSide for cutaway)
  const bbMat = new THREE.MeshStandardMaterial({ color: "#E8E8E8", transparent: true, opacity: 1.0 });
  const bb1 = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.1, 0.02), bbMat.clone());
  bb1.position.set(0, 0.05, -roomD / 2 + 0.005);
  bb1.userData.wallSide = "back";
  roomGroup.add(bb1);
  const bb3 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, roomD), bbMat.clone());
  bb3.position.set(roomW / 2 - 0.005, 0.05, 0);
  bb3.userData.wallSide = "right";
  roomGroup.add(bb3);

  // Large Window (right wall) — 3×4 grid with thick dark mullions and see-through panes
  const winW = 2.4, winH = 2.0;
  const winX = roomW / 2 - 0.015;
  const winCenterY = winH / 2 + 0.4;
  const frameMat = new THREE.MeshStandardMaterial({ color: "#3A3A3A", roughness: 0.6, metalness: 0.1, transparent: true, opacity: 1.0 });
  const frameThick = 0.07;
  const frameDepth = 0.06;

  // Outer frame — top, bottom, left, right
  const frameParts: [number, number, number, number, number][] = [
    [frameDepth, frameThick, winW + frameThick * 2, winCenterY + winH / 2, 0],
    [frameDepth, frameThick, winW + frameThick * 2, winCenterY - winH / 2, 0],
    [frameDepth, winH, frameThick, winCenterY, -winW / 2],
    [frameDepth, winH, frameThick, winCenterY, winW / 2],
  ];
  frameParts.forEach(([dx, dy, dz, py, pz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(dx, dy, dz), frameMat.clone());
    m.position.set(winX, py, pz);
    m.userData.wallSide = "right";
    roomGroup.add(m);
  });

  // Mullion bars — 2 vertical (3 cols) + 3 horizontal (4 rows)
  const mullionW = 0.045;
  const winCols = 3, winRows = 4;
  for (let c = 1; c < winCols; c++) {
    const z = -winW / 2 + (winW / winCols) * c;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, winH, mullionW), frameMat.clone());
    bar.position.set(winX, winCenterY, z);
    bar.userData.wallSide = "right";
    roomGroup.add(bar);
  }
  for (let r = 1; r < winRows; r++) {
    const y = (winCenterY - winH / 2) + (winH / winRows) * r;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, mullionW, winW), frameMat.clone());
    bar.position.set(winX, y, 0);
    bar.userData.wallSide = "right";
    roomGroup.add(bar);
  }

  // Individual glass panes — see-through with warm tint (use Standard for performance)
  const glassPaneMat = new THREE.MeshStandardMaterial({
    color: "#E8DFD0",
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const paneW = (winW - mullionW * (winCols - 1)) / winCols - 0.01;
  const paneH = (winH - mullionW * (winRows - 1)) / winRows - 0.01;
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < winCols; c++) {
      const pz = -winW / 2 + (winW / winCols) * (c + 0.5);
      const py = (winCenterY - winH / 2) + (winH / winRows) * (r + 0.5);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneW, paneH), glassPaneMat.clone());
      pane.position.set(winX - 0.005, py, pz);
      pane.rotation.y = -Math.PI / 2;
      pane.userData.wallSide = "right";
      pane.userData.baseOpacity = 0.18;
      roomGroup.add(pane);
    }
  }

  // Left baseboard — split into two segments around doorway opening
  const bbDoorLeft = doorZ - doorHoleW / 2;
  const bbDoorRight = doorZ + doorHoleW / 2;
  const bbSeg1Len = bbDoorLeft - (-roomD / 2);
  const bbSeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, bbSeg1Len), bbMat.clone());
  bbSeg1.position.set(-roomW / 2 + 0.005, 0.05, (-roomD / 2 + bbDoorLeft) / 2);
  bbSeg1.userData.wallSide = "left";
  roomGroup.add(bbSeg1);
  const bbSeg2Len = roomD / 2 - bbDoorRight;
  const bbSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, bbSeg2Len), bbMat.clone());
  bbSeg2.position.set(-roomW / 2 + 0.005, 0.05, (bbDoorRight + roomD / 2) / 2);
  bbSeg2.userData.wallSide = "left";
  roomGroup.add(bbSeg2);

  // Rectangular door frame trim — two jambs + top header (with wood texture)
  const frameWoodCanvas = document.createElement("canvas");
  frameWoodCanvas.width = 64;
  frameWoodCanvas.height = 256;
  const fwCtx = frameWoodCanvas.getContext("2d")!;
  fwCtx.fillStyle = "#9B7E5E";
  fwCtx.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 256; i += 2) {
    const brightness = 0.88 + Math.sin(i * 0.06) * 0.06 + Math.random() * 0.03;
    const r = Math.floor(155 * brightness);
    const g = Math.floor(126 * brightness);
    const b = Math.floor(94 * brightness);
    fwCtx.fillStyle = `rgb(${r},${g},${b})`;
    fwCtx.fillRect(0, i, 64, 2);
  }
  const frameWoodTex = new THREE.CanvasTexture(frameWoodCanvas);
  const doorFrameMat = new THREE.MeshStandardMaterial({ map: frameWoodTex, roughness: 0.7, metalness: 0.0, transparent: true, opacity: 1.0 });
  const trimW = 0.065;
  const trimD = 0.065;

  const frameLJamb = new THREE.Mesh(new THREE.BoxGeometry(trimD, doorHoleH, trimW), doorFrameMat.clone());
  frameLJamb.position.set(doorWallX + 0.02, doorHoleH / 2, doorZ - doorHoleW / 2);
  frameLJamb.userData.wallSide = "left";
  roomGroup.add(frameLJamb);
  const frameRJamb = new THREE.Mesh(new THREE.BoxGeometry(trimD, doorHoleH, trimW), doorFrameMat.clone());
  frameRJamb.position.set(doorWallX + 0.02, doorHoleH / 2, doorZ + doorHoleW / 2);
  frameRJamb.userData.wallSide = "left";
  roomGroup.add(frameRJamb);
  const frameHeader = new THREE.Mesh(new THREE.BoxGeometry(trimD, trimW, doorHoleW + trimW * 2), doorFrameMat.clone());
  frameHeader.position.set(doorWallX + 0.02, doorHoleH + trimW / 2, doorZ);
  frameHeader.userData.wallSide = "left";
  roomGroup.add(frameHeader);

  // Door panel — pivots from hinge edge, swung open
  const doorPivotGroup = new THREE.Group();
  doorPivotGroup.position.set(doorWallX + 0.04, 0, doorZ - doorW / 2);
  doorPivotGroup.rotation.y = doorOpenAngle;
  doorPivotGroup.userData.wallSide = "left";

  // Procedural wood grain texture for door
  const woodCanvas = document.createElement("canvas");
  woodCanvas.width = 256;
  woodCanvas.height = 512;
  const wCtx = woodCanvas.getContext("2d")!;
  // Base warm wood color
  wCtx.fillStyle = "#A68B6B";
  wCtx.fillRect(0, 0, 256, 512);
  // Wood grain lines
  for (let i = 0; i < 512; i += 2) {
    const offset = Math.sin(i * 0.03) * 8 + Math.sin(i * 0.007) * 15;
    const brightness = 0.85 + Math.sin(i * 0.05 + offset * 0.1) * 0.08 + Math.random() * 0.04;
    const r = Math.floor(166 * brightness);
    const g = Math.floor(139 * brightness);
    const b = Math.floor(107 * brightness);
    wCtx.fillStyle = `rgb(${r},${g},${b})`;
    wCtx.fillRect(0, i, 256, 2);
  }
  // Subtle darker grain streaks
  for (let s = 0; s < 12; s++) {
    const sx = Math.random() * 256;
    const sw = 1 + Math.random() * 3;
    wCtx.fillStyle = `rgba(80, 60, 40, ${0.06 + Math.random() * 0.08})`;
    for (let y = 0; y < 512; y += 2) {
      const wobble = Math.sin(y * 0.02 + s) * 4;
      wCtx.fillRect(sx + wobble, y, sw, 2);
    }
  }
  const woodTex = new THREE.CanvasTexture(woodCanvas);
  woodTex.wrapS = THREE.RepeatWrapping;
  woodTex.wrapT = THREE.RepeatWrapping;
  const doorPanelMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, metalness: 0.0, transparent: true, opacity: 1.0 });
  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorThick, doorH, doorW), doorPanelMat.clone());
  doorPanel.position.set(0, doorH / 2, doorW / 2);
  doorPanel.userData.wallSide = "left";
  doorPivotGroup.add(doorPanel);

  // Brass lever handle — rosette + arm + grip
  const handleMat = new THREE.MeshStandardMaterial({ color: "#A08850", roughness: 0.3, metalness: 0.85, transparent: true, opacity: 1.0 });
  const handleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.015, 12), handleMat.clone());
  handleBase.position.set(doorThick / 2 + 0.008, doorH * 0.47, doorW * 0.72);
  handleBase.rotation.z = Math.PI / 2;
  handleBase.userData.wallSide = "left";
  doorPivotGroup.add(handleBase);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.1), handleMat.clone());
  lever.position.set(doorThick / 2 + 0.025, doorH * 0.47, doorW * 0.72 + 0.02);
  lever.userData.wallSide = "left";
  doorPivotGroup.add(lever);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.015), handleMat.clone());
  grip.position.set(doorThick / 2 + 0.025, doorH * 0.47 - 0.02, doorW * 0.72 + 0.065);
  grip.userData.wallSide = "left";
  doorPivotGroup.add(grip);

  roomGroup.add(doorPivotGroup);

  // === Lights ===
  const ambientLight = new THREE.AmbientLight("#FFF5E6", 0.4);
  lightsGroup.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight("#FFFAF0", 1.4);
  directionalLight.position.set(4, 5, 3);
  directionalLight.castShadow = false;
  lightsGroup.add(directionalLight);
  scene.add(directionalLight.target);

  const fillLight = new THREE.DirectionalLight("#E8E8FF", 0.3);
  fillLight.position.set(-3, 2, 4);
  lightsGroup.add(fillLight);

  const ceilingPointLight = new THREE.PointLight("#FFF8E8", 2.5, 4, 2); // distance=4 to limit to active room
  ceilingPointLight.position.set(0, 2.6, 0);
  ceilingPointLight.castShadow = false;
  lightsGroup.add(ceilingPointLight);

  const floorPointLight = new THREE.PointLight("#FFE8C0", 1.5, 3, 2); // distance=3
  floorPointLight.position.set(-2.2, 1.5, 1.5);
  lightsGroup.add(floorPointLight);

  const accentSpotLight = new THREE.SpotLight("#FFF0D8", 2, 4, 0.5, 0.8, 2); // distance=4
  accentSpotLight.position.set(2.5, 2.5, -1.5);
  accentSpotLight.visible = false;
  lightsGroup.add(accentSpotLight);

  const underCabinetLight = new THREE.PointLight("#FFF5E0", 1.5, 3, 2);
  underCabinetLight.position.set(2.5, 0.9, -1.8);
  underCabinetLight.visible = false;
  lightsGroup.add(underCabinetLight);

  // Camera fly-to animation state (shared container so animate loop & external code reference the same object)
  const cameraAnimState = { current: null as ThreeSceneRef["cameraAnim"] };

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // ═══ Dynamic Cutaway System ═══
  // Smoothly fades walls/ceiling that block the camera's view of the interior
  const cutawayState = { back: 1.0, left: 1.0, right: 1.0, ceiling: 1.0 };
  const CUTAWAY_MIN = 0.08; // near-invisible when blocking
  const CUTAWAY_SPEED = 0.07; // lerp speed per frame

  const updateCutaway = () => {
    // Skip when origin room is hidden (editor/house view modes)
    if (!roomGroup.visible) return;
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    // For each wall, compute a target opacity based on whether the camera
    // is on the "outer" side of that wall (i.e. the wall blocks the view).
    // Use a smooth transition zone so the fade isn't abrupt.

    // Back wall at z = -roomD/2: blocks view when camera is at negative z
    const backTarget = THREE.MathUtils.smoothstep(cz, -roomD * 0.6, roomD * 0.15);
    // Left wall at x = -roomW/2: blocks view when camera is at negative x
    const leftTarget = THREE.MathUtils.smoothstep(cx, -roomW * 0.5, roomW * 0.1);
    // Right wall at x = roomW/2: blocks view when camera is at positive x
    const rightTarget = THREE.MathUtils.smoothstep(-cx, -roomW * 0.5, roomW * 0.1);

    // Ceiling: fade when camera is above (or near) the ceiling plane.
    // Camera height relative to wall height determines visibility.
    // Below wallH*0.6 → fully visible, above wallH*1.1 → fully faded.
    const ceilFade = THREE.MathUtils.smoothstep(cy, wallH * 0.6, wallH * 1.3);
    const ceilTarget = CUTAWAY_MIN + (1.0 - ceilFade) * (1.0 - CUTAWAY_MIN);

    // Lerp current opacities toward targets for smooth transitions
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const mapTarget = (raw: number) => CUTAWAY_MIN + raw * (1.0 - CUTAWAY_MIN);

    cutawayState.back = lerp(cutawayState.back, mapTarget(backTarget), CUTAWAY_SPEED);
    cutawayState.left = lerp(cutawayState.left, mapTarget(leftTarget), CUTAWAY_SPEED);
    cutawayState.right = lerp(cutawayState.right, mapTarget(rightTarget), CUTAWAY_SPEED);
    cutawayState.ceiling = lerp(cutawayState.ceiling, ceilTarget, CUTAWAY_SPEED);

    // Apply opacities to walls and all wall-adjacent elements (baseboards, door, window, etc.)
    roomGroup.children.forEach((child) => {
      const side = child.userData.wallSide as string | undefined;
      if (!side) return;
      if (!(child as THREE.Mesh).isMesh && !(child as THREE.Line).isLine) return;
      const mat = (child as THREE.Mesh).material;
      if (!mat || Array.isArray(mat)) return;
      const stdMat = mat as THREE.MeshStandardMaterial;
      if (!stdMat.transparent) return;

      let targetOpacity: number;
      if (side === "back") targetOpacity = cutawayState.back;
      else if (side === "left") targetOpacity = cutawayState.left;
      else if (side === "right") targetOpacity = cutawayState.right;
      else return;

      // Elements with a baseOpacity (e.g. glass = 0.25) scale relative to that
      const base = (child.userData.baseOpacity as number) || 1.0;
      stdMat.opacity = targetOpacity * base;
      stdMat.depthWrite = targetOpacity > 0.95;
    });

    if (ceilingMesh) {
      const cMat = ceilingMesh.material as THREE.MeshStandardMaterial;
      cMat.opacity = cutawayState.ceiling;
      cMat.depthWrite = cMat.opacity > 0.95;
    }
  };

  // ═══ House Room Maps (declared early so cutaway closure can reference them) ═══
  const houseRoomGroups = new Map<string, THREE.Group>();
  const houseRoomLabels = new Map<string, CSS2DObject>();
  const standaloneWallGroups = new Map<string, THREE.Group>();

  // Mutable room bounds overrides — cutaway reads from here instead of static HOUSE_ROOM_DEFS
  const roomBoundsOverrides = new Map<string, [number, number, number, number]>();
  for (const def of HOUSE_ROOM_DEFS) {
    roomBoundsOverrides.set(def.id, [...def.bounds]);
  }

  // ═══ Dynamic Cutaway System for House Rooms ═══
  // Camera-based wall/ceiling fade for the currently active house room in editor mode
  const HCUTAWAY_MIN = 0.06;
  const HCUTAWAY_SPEED = 0.08;
  const houseCutawayState: Record<string, number> = { north: 1, south: 1, east: 1, west: 1, ceiling: 1 };
  let activeCutawayRoomId: string | null = null;

  // Per-room cutaway states for house view mode (all rooms visible simultaneously)
  const perRoomCutawayStates = new Map<string, Record<string, number>>();
  for (const def of HOUSE_ROOM_DEFS) {
    perRoomCutawayStates.set(def.id, { north: 1, south: 1, east: 1, west: 1, ceiling: 1 });
  }

  const updateHouseRoomCutaway = () => {
    if (!activeCutawayRoomId) return;
    const roomGroup = houseRoomGroups.get(activeCutawayRoomId);
    if (!roomGroup || !roomGroup.visible) return;

    const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeCutawayRoomId);
    if (!def) return;

    const [xMin2, xMax2, zMin2, zMax2] = def.bounds;
    const rw2 = xMax2 - xMin2, rd2 = zMax2 - zMin2;
    const rcx2 = (xMin2 + xMax2) / 2, rcz2 = (zMin2 + zMax2) / 2;

    const camX = camera.position.x;
    const camY = camera.position.y;
    const camZ = camera.position.z;

    // Compute relative camera position to room bounds
    // North wall at zMax: camera beyond zMax → fade
    const northRaw = THREE.MathUtils.smoothstep(camZ - rcz2, rd2 * 0.1, rd2 * 0.6);
    const northTarget = 1.0 - northRaw * (1.0 - HCUTAWAY_MIN);
    // South wall at zMin: camera below zMin → fade
    const southRaw = THREE.MathUtils.smoothstep(-(camZ - rcz2), rd2 * 0.1, rd2 * 0.6);
    const southTarget = 1.0 - southRaw * (1.0 - HCUTAWAY_MIN);
    // East wall at xMax: camera beyond xMax → fade
    const eastRaw = THREE.MathUtils.smoothstep(camX - rcx2, rw2 * 0.1, rw2 * 0.6);
    const eastTarget = 1.0 - eastRaw * (1.0 - HCUTAWAY_MIN);
    // West wall at xMin: camera below xMin → fade
    const westRaw = THREE.MathUtils.smoothstep(-(camX - rcx2), rw2 * 0.1, rw2 * 0.6);
    const westTarget = 1.0 - westRaw * (1.0 - HCUTAWAY_MIN);
    // Ceiling: fade when camera above wall height
    const ceilFade = THREE.MathUtils.smoothstep(camY, WALL_H * 0.6, WALL_H * 1.3);
    const ceilTarget = HCUTAWAY_MIN + (1.0 - ceilFade) * (1.0 - HCUTAWAY_MIN);

    const hLerp = (a: number, b: number) => a + (b - a) * HCUTAWAY_SPEED;
    houseCutawayState.north = hLerp(houseCutawayState.north, northTarget);
    houseCutawayState.south = hLerp(houseCutawayState.south, southTarget);
    houseCutawayState.east = hLerp(houseCutawayState.east, eastTarget);
    houseCutawayState.west = hLerp(houseCutawayState.west, westTarget);
    houseCutawayState.ceiling = hLerp(houseCutawayState.ceiling, ceilTarget);

    // Apply to all children using cached material list
    const rg = houseRoomGroups.get(activeCutawayRoomId);
    if (!rg) return;
    const entries = getRoomCutawayEntries(activeCutawayRoomId, rg);
    for (let i = 0, len = entries.length; i < len; i++) {
      const e = entries[i];
      const targetOp = houseCutawayState[e.side];
      e.mat.opacity = targetOp * e.baseOpacity;
      e.mat.depthWrite = targetOp > 0.95;
    }
  };

  // ═══ House View Cutaway: applies to ALL rooms when viewing the whole house ═══
  // Performance: cache per-room material lists to avoid deep traversal every frame
  type CutawayEntry = { mat: THREE.MeshStandardMaterial; side: string; baseOpacity: number };
  const roomCutawayCache = new Map<string, CutawayEntry[]>();

  const getRoomCutawayEntries = (roomId: string, rg: THREE.Group): CutawayEntry[] => {
    let entries = roomCutawayCache.get(roomId);
    if (entries) return entries;
    entries = [];
    rg.traverse((obj) => {
      const ws = obj.userData.wallSide as string | undefined;
      const isCeil = obj.userData.isCeiling as boolean | undefined;
      if (isCeil) {
        const mat = (obj as THREE.Mesh).material;
        if (mat && !Array.isArray(mat) && (mat as THREE.MeshStandardMaterial).transparent) {
          entries!.push({ mat: mat as THREE.MeshStandardMaterial, side: "ceiling", baseOpacity: 1.0 });
        }
      } else if (ws && (ws === "north" || ws === "south" || ws === "east" || ws === "west")) {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material;
          if (mat && !Array.isArray(mat) && (mat as THREE.MeshStandardMaterial).transparent) {
            entries!.push({ mat: mat as THREE.MeshStandardMaterial, side: ws, baseOpacity: (obj.userData.baseOpacity as number) || 1.0 });
          }
        }
      }
    });
    roomCutawayCache.set(roomId, entries);
    return entries;
  };

  // Invalidate cache when rooms are rebuilt (called by syncRoomsTo3D)
  const invalidateCutawayCache = (roomId: string) => { roomCutawayCache.delete(roomId); };

  const updateAllRoomsCutaway = () => {
    const camX = camera.position.x;
    const camY = camera.position.y;
    const camZ = camera.position.z;
    const hLerp = (a: number, b: number) => a + (b - a) * HCUTAWAY_SPEED;

    for (const def of HOUSE_ROOM_DEFS) {
      const rg = houseRoomGroups.get(def.id);
      if (!rg || !rg.visible) continue;

      const state = perRoomCutawayStates.get(def.id)!;
      // Use overridden bounds (updated by 2D editor) instead of static HOUSE_ROOM_DEFS
      const [xMin2, xMax2, zMin2, zMax2] = roomBoundsOverrides.get(def.id) || def.bounds;
      const rw2 = xMax2 - xMin2, rd2 = zMax2 - zMin2;
      const rcx2 = (xMin2 + xMax2) / 2, rcz2 = (zMin2 + zMax2) / 2;

      // Compute per-room wall targets
      const northRaw = THREE.MathUtils.smoothstep(camZ - rcz2, rd2 * 0.1, rd2 * 0.6);
      const southRaw = THREE.MathUtils.smoothstep(-(camZ - rcz2), rd2 * 0.1, rd2 * 0.6);
      const eastRaw = THREE.MathUtils.smoothstep(camX - rcx2, rw2 * 0.1, rw2 * 0.6);
      const westRaw = THREE.MathUtils.smoothstep(-(camX - rcx2), rw2 * 0.1, rw2 * 0.6);
      const ceilFade = THREE.MathUtils.smoothstep(camY, WALL_H * 0.6, WALL_H * 1.3);

      state.north = hLerp(state.north, 1.0 - northRaw * (1.0 - HCUTAWAY_MIN));
      state.south = hLerp(state.south, 1.0 - southRaw * (1.0 - HCUTAWAY_MIN));
      state.east = hLerp(state.east, 1.0 - eastRaw * (1.0 - HCUTAWAY_MIN));
      state.west = hLerp(state.west, 1.0 - westRaw * (1.0 - HCUTAWAY_MIN));
      state.ceiling = hLerp(state.ceiling, HCUTAWAY_MIN + (1.0 - ceilFade) * (1.0 - HCUTAWAY_MIN));

      // Apply opacity using cached material list (avoids deep traversal)
      const entries = getRoomCutawayEntries(def.id, rg);
      for (let i = 0, len = entries.length; i < len; i++) {
        const e = entries[i];
        const targetOp = state[e.side];
        e.mat.opacity = targetOp * e.baseOpacity;
        e.mat.depthWrite = targetOp > 0.95;
      }
    }
  };

  const animRef = { id: 0 };
  let frameCount = 0;
  // On low-power devices, run cutaway updates every 2nd frame
  const cutawayInterval = isLowPower ? 2 : 1;
  let _disableCutaway = false;

  /** When cutaway is disabled (render mode), smoothly restore all wall/ceiling opacities to 1.0 */
  const restoreAllCutawayOpacity = () => {
    const RESTORE_SPEED = 0.12;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // Restore single-room cutaway state
    cutawayState.back = lerp(cutawayState.back, 1.0, RESTORE_SPEED);
    cutawayState.left = lerp(cutawayState.left, 1.0, RESTORE_SPEED);
    cutawayState.right = lerp(cutawayState.right, 1.0, RESTORE_SPEED);
    cutawayState.ceiling = lerp(cutawayState.ceiling, 1.0, RESTORE_SPEED);

    // Apply to single-room walls
    roomGroup.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mat = (obj as THREE.Mesh).material;
        if (mat && (mat as THREE.MeshStandardMaterial).transparent) {
          const m = mat as THREE.MeshStandardMaterial;
          m.opacity = lerp(m.opacity, 1.0, RESTORE_SPEED);
          m.depthWrite = m.opacity > 0.95;
        }
      }
    });

    // Restore house room cutaway states
    houseCutawayState.north = lerp(houseCutawayState.north, 1.0, RESTORE_SPEED);
    houseCutawayState.south = lerp(houseCutawayState.south, 1.0, RESTORE_SPEED);
    houseCutawayState.east = lerp(houseCutawayState.east, 1.0, RESTORE_SPEED);
    houseCutawayState.west = lerp(houseCutawayState.west, 1.0, RESTORE_SPEED);
    houseCutawayState.ceiling = lerp(houseCutawayState.ceiling, 1.0, RESTORE_SPEED);

    // Restore per-room cutaway states for all house rooms
    perRoomCutawayStates.forEach((state, roomId) => {
      state.north = lerp(state.north, 1.0, RESTORE_SPEED);
      state.south = lerp(state.south, 1.0, RESTORE_SPEED);
      state.east = lerp(state.east, 1.0, RESTORE_SPEED);
      state.west = lerp(state.west, 1.0, RESTORE_SPEED);
      state.ceiling = lerp(state.ceiling, 1.0, RESTORE_SPEED);

      const rg = houseRoomGroups.get(roomId);
      if (rg) {
        const entries = getRoomCutawayEntries(roomId, rg);
        for (const e of entries) {
          e.mat.opacity = lerp(e.mat.opacity, e.baseOpacity, RESTORE_SPEED);
          e.mat.depthWrite = e.mat.opacity > 0.95;
        }
      }
    });
  };

  const animate = () => {
    animRef.id = requestAnimationFrame(animate);
    frameCount++;

    // Camera fly-to animation
    const ca = cameraAnimState.current;
    if (ca && ca.active) {
      const elapsed = (performance.now() - ca.startTime) / ca.duration;
      const t = Math.min(1, elapsed);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(ca.fromPos, ca.toPos, ease);
      controls.target.lerpVectors(ca.fromTarget, ca.toTarget, ease);

      if (t >= 1) {
        ca.active = false;
        cameraAnimState.current = null;
      }
    }

    controls.update();

    // Run cutaway updates (skip frames on low-power devices for performance)
    if (frameCount % cutawayInterval === 0) {
      if (_disableCutaway) {
        restoreAllCutawayOpacity();
      } else {
        updateAllRoomsCutaway();
        updateCutaway();
      }
    }

    renderer.render(scene, camera);
    // Only render CSS2D labels every few frames (they're expensive on mobile)
    if (frameCount % 2 === 0) {
      css2dRenderer.render(scene, camera);
    }
  };
  animate();

  const flyToZone = (zone: RoomZone) => {
    cameraAnimState.current = {
      active: true,
      startTime: performance.now(),
      duration: 900,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...zone.camera),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...zone.target),
    };
  };

  // General-purpose camera fly-to
  const flyToPos = (toPos: [number, number, number], toTarget: [number, number, number], dur = 1000) => {
    cameraAnimState.current = {
      active: true,
      startTime: performance.now(),
      duration: dur,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...toPos),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...toTarget),
    };
  };

  // ═══ Build Multi-Room House Geometry ═══
  // Ground plane — procedural graph-paper / blueprint grid texture
  const createGraphPaperTexture = (): THREE.CanvasTexture => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Background — light off-white like graph paper
    ctx.fillStyle = "#EAEDF0";
    ctx.fillRect(0, 0, size, size);

    // Fine grid (small squares) — subtle thin lines
    const smallStep = size / 50; // 50 small divisions
    ctx.strokeStyle = "rgba(160, 175, 195, 0.25)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const pos = i * smallStep;
      ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
      ctx.moveTo(0, pos); ctx.lineTo(size, pos);
    }
    ctx.stroke();

    // Medium grid (every 5 small = 10 divisions)
    const medStep = size / 10;
    ctx.strokeStyle = "rgba(145, 160, 185, 0.4)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const pos = i * medStep;
      ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
      ctx.moveTo(0, pos); ctx.lineTo(size, pos);
    }
    ctx.stroke();

    // Major grid (every 5 medium = 2 divisions)
    const bigStep = size / 2;
    ctx.strokeStyle = "rgba(130, 150, 175, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 2; i++) {
      const pos = i * bigStep;
      ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
      ctx.moveTo(0, pos); ctx.lineTo(size, pos);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12); // tile across ground
    tex.anisotropy = 16;
    return tex;
  };

  const graphTex = createGraphPaperTexture();
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({
    map: graphTex,
    roughness: 0.95,
    metalness: 0.0,
  });
  const groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = -0.05;
  groundPlane.visible = false;
  scene.add(groundPlane);

  for (const def of HOUSE_ROOM_DEFS) {
    const rGroup = buildHouseRoom(def);
    rGroup.visible = false; // Initially hidden
    scene.add(rGroup);
    houseRoomGroups.set(def.id, rGroup);

    // CSS2D room label (for house view)
    const labelEl = document.createElement("div");
    labelEl.style.cssText = `
      font-family:'Inter',sans-serif;font-size:11px;font-weight:600;
      color:#09090B;background:rgba(255,255,255,0.88);backdrop-filter:blur(8px);
      border-radius:100px;padding:4px 10px;pointer-events:none;
      box-shadow:0 4px 12px rgba(0,0,0,0.1);letter-spacing:-0.3px;
      white-space:nowrap;border:1px solid rgba(229,231,235,0.6);
    `;
    labelEl.textContent = def.shortLabel;
    const labelObj = new CSS2DObject(labelEl);
    const cx = (def.bounds[0] + def.bounds[1]) / 2;
    const cz = (def.bounds[2] + def.bounds[3]) / 2;
    labelObj.position.set(cx, WALL_H + 0.5, cz);
    labelObj.visible = false;
    scene.add(labelObj);
    houseRoomLabels.set(def.id, labelObj);
  }

  // Default room bounds (will be updated when switching rooms)
  const activeRoomBounds: RoomBounds = { minX: -3.05, maxX: 3.05, minZ: -2.2, maxZ: 2.2 };

  // Keep all room lights visible; per-room intensity is managed via the lighting effect
  const setRoomLightShadows = (targetRoomId: string | null) => {
    houseRoomGroups.forEach((grp, _id) => {
      grp.traverse((child) => {
        if (child.userData.isRoomLight) {
          (child as THREE.PointLight).visible = true;
        }
      });
    });
  };

  return {
    scene, camera, renderer, css2dRenderer, controls, roomGroup, furnitureGroup, lightsGroup,
    wallMeshes, floorMesh, ceilingMesh, raycaster, mouse, selectedOutline: null, selectedGlow: null,
    animRef,
    ceilingPointLight, floorPointLight, accentSpotLight, underCabinetLight,
    directionalLight, ambientLight,
    cameraAnim: null, flyToZone,
    houseRoomGroups, houseRoomLabels, groundPlane, flyToPos,
    activeRoomBounds,
    get activeCutawayRoomId() { return activeCutawayRoomId; },
    set activeCutawayRoomId(id: string | null) { activeCutawayRoomId = id; },
    houseCutawayState,
    perRoomCutawayStates,
    get isHouseViewMode() { return isHouseViewMode; },
    set isHouseViewMode(v: boolean) { isHouseViewMode = v; },
    setRoomLightShadows,
    lightCenter: { x: 0, z: 0 },
    roomBoundsOverrides,
    maxDPR,
    isLowPower,
    invalidateCutawayCache,
    standaloneWallGroups,
    get disableCutaway() { return _disableCutaway; },
    set disableCutaway(v: boolean) {
      _disableCutaway = v;
      // Hide/show ceiling light fixtures in render mode
      scene.traverse((obj: THREE.Object3D) => {
        if (obj.userData.isCeilingFixture) obj.visible = !v;
      });
    },
  };
}

function flyToZoneHelper(sceneRef: ThreeSceneRef, zone: RoomZone) {
  sceneRef.flyToZone(zone);
}

/* ═══════════════════════════════════════════════════════
   useThreeScene Hook
   ═══════════════════════════════════════════════════════ */
function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  placedItems: PlacedItem[],
  selectedId: string | null,
  materials: SceneMaterials,
  lighting: SceneLighting,
  onSelectItem: (id: string | null) => void,
  onMoveItem: (id: string, x: number, z: number) => void,
  onMoveItemToRoom: (itemId: string, newX: number, newZ: number, targetRoomId: string) => void,
  onDraggingChange: (dragging: boolean) => void,
  onOverlapChange: (overlapping: boolean) => void,
  externalSceneRef?: React.MutableRefObject<ThreeSceneRef | null>,
  onRoomSelect?: (label: string) => void,
  sceneRebuildKey?: number,
  skipBuild?: boolean,
  activeRoomId?: string,
  globalTimeOfDay?: number,
  onOpeningMove?: (roomId: string, type: "door" | "window", index: number, newT: number) => void,
  onOpeningSelect?: (roomId: string, type: "door" | "window", index: number, side: string) => void,
  onOpeningDragOverlay?: (info: { screenX: number; screenY: number; distLeft: number; distRight: number; wallLength: number; side: string; snapT: number | null; snapScreenPositions: { x: number; y: number }[] } | null) => void,
  onDeselectOpening?: () => void,
) {
  const sceneRef = useRef<ThreeSceneRef | null>(null);
  const itemGroupMap = useRef<Map<string, THREE.Group>>(new Map());
  const overlapOutlines = useRef<THREE.LineSegments[]>([]);

  // ═══ Callback refs — event handlers are set up once, these refs ensure they always call latest versions ═══
  const onMoveItemRef = useRef(onMoveItem);
  onMoveItemRef.current = onMoveItem;
  const onMoveItemToRoomRef = useRef(onMoveItemToRoom);
  onMoveItemToRoomRef.current = onMoveItemToRoom;
  const onSelectItemRef = useRef(onSelectItem);
  onSelectItemRef.current = onSelectItem;
  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;
  const onOverlapChangeRef = useRef(onOverlapChange);
  onOverlapChangeRef.current = onOverlapChange;
  const onRoomSelectRef = useRef(onRoomSelect);
  onRoomSelectRef.current = onRoomSelect;
  const onOpeningMoveRef = useRef(onOpeningMove);
  onOpeningMoveRef.current = onOpeningMove;
  const onOpeningSelectRef = useRef(onOpeningSelect);
  onOpeningSelectRef.current = onOpeningSelect;
  const onOpeningDragOverlayRef = useRef(onOpeningDragOverlay);
  onOpeningDragOverlayRef.current = onOpeningDragOverlay;
  const onDeselectOpeningRef = useRef(onDeselectOpening);
  onDeselectOpeningRef.current = onDeselectOpening;
  const placedItemsRef = useRef(placedItems);
  placedItemsRef.current = placedItems;

  useEffect(() => {
    // Skip building scene if project data hasn't loaded yet
    if (skipBuild) return;
    // Dispose previous scene if rebuilding
    if (sceneRef.current) {
      const old = sceneRef.current;
      cancelAnimationFrame(old.animRef.id);
      old.controls.dispose();
      old.renderer.dispose();
      old.css2dRenderer.domElement.remove();
      old.renderer.domElement.remove();
      old.houseRoomLabels.forEach((obj) => { obj.element.remove(); });
      old.standaloneWallGroups.forEach((grp) => { disposeGroup(grp); });
      old.standaloneWallGroups.clear();
      sceneRef.current = null;
      if (externalSceneRef) externalSceneRef.current = null;
      itemGroupMap.current.clear();
    }
    if (!containerRef.current) return;
    try {
      sceneRef.current = buildScene(containerRef.current);
    } catch (buildErr) {
      console.error("[Editor] Failed to build 3D scene (WebGL may not be supported):", buildErr);
      return;
    }
    if (externalSceneRef) externalSceneRef.current = sceneRef.current;

    // Capture container element for cleanup (avoid stale ref in cleanup function)
    const container = containerRef.current;

    // Invisible floor plane for drag raycasting
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Room bounds — read from the mutable activeRoomBounds on sceneRef
    const getBounds = () => sceneRef.current?.activeRoomBounds || { minX: -3.05, maxX: 3.05, minZ: -2.2, maxZ: 2.2 };

    // Drag state
    let isDragging = false;
    let dragItemId: string | null = null;
    const dragOffset = new THREE.Vector3();
    const dragStartPos = new THREE.Vector3(); // original position before drag started
    const mouseDownPos = new THREE.Vector2();
    let hasMoved = false;
    let currentOverlap = false;

    // Opening (door/window) drag state
    let openingDrag: {
      roomId: string;
      type: "door" | "window";
      index: number;
      side: string;
      group: THREE.Group;
      bounds: [number, number, number, number]; // room bounds
      openingW: number; // width of the door/window
      openingH?: number; // height for windows
      sillH?: number; // sill height for windows
    } | null = null;
    let isOpeningDragging = false;

    // Opening hover highlight state
    let hoveredOpeningGroup: THREE.Group | null = null;
    let openingHighlightOutline: THREE.Group | null = null;
    const lastMouseNDC = new THREE.Vector2(999, 999); // track mouse for hover

    // Snap positions for opening drag (t values)
    const SNAP_T_POSITIONS = [0.25, 0.5, 0.75];
    const SNAP_T_THRESHOLD = 0.035; // ~3.5% of wall length

    /** Determine which wall of a room the floor point is closest to */
    const determineClosestWall = (floorPt: THREE.Vector3, bounds: [number, number, number, number]): string => {
      const [xMin, xMax, zMin, zMax] = bounds;
      const dists = [
        { side: "north", d: Math.abs(floorPt.z - zMax) },
        { side: "south", d: Math.abs(floorPt.z - zMin) },
        { side: "east", d: Math.abs(floorPt.x - xMax) },
        { side: "west", d: Math.abs(floorPt.x - xMin) },
      ];
      dists.sort((a, b) => a.d - b.d);
      return dists[0].side;
    };

    /** Apply snap to nearest snap position */
    const snapOpeningT = (t: number): { t: number; snapped: number | null } => {
      for (const st of SNAP_T_POSITIONS) {
        if (Math.abs(t - st) < SNAP_T_THRESHOLD) return { t: st, snapped: st };
      }
      return { t, snapped: null };
    };

    /** Compute wall length for a given side */
    const wallLengthForSide = (side: string, bounds: [number, number, number, number]): number => {
      const [xMin, xMax, zMin, zMax] = bounds;
      return (side === "north" || side === "south") ? (xMax - xMin) : (zMax - zMin);
    };

    /** Compute left/right distances from wall edges */
    const computeEdgeDistances = (t: number, wallLen: number, openingW: number): { left: number; right: number } => {
      const center = t * wallLen;
      return { left: Math.max(0, center - openingW / 2), right: Math.max(0, wallLen - center - openingW / 2) };
    };

    /** Remove opening hover highlight */
    const clearOpeningHighlight = () => {
      if (openingHighlightOutline) {
        openingHighlightOutline.traverse((c) => {
          if ((c as any).geometry) (c as any).geometry.dispose();
          if ((c as any).material) (c as any).material.dispose();
        });
        openingHighlightOutline.removeFromParent();
        openingHighlightOutline = null;
      }
      hoveredOpeningGroup = null;
      if (containerRef.current) containerRef.current.style.cursor = "";
    };

    /** Build a highlight outline for an opening group */
    const buildOpeningHighlight = (grp: THREE.Group): THREE.Group => {
      const hlGroup = new THREE.Group();
      const mat = new THREE.LineBasicMaterial({ color: "#3B82F6", linewidth: 2, transparent: true, opacity: 0.85 });
      grp.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        if (!mesh.geometry) return;
        const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
        const line = new THREE.LineSegments(edges, mat.clone());
        mesh.updateWorldMatrix(true, false);
        line.applyMatrix4(mesh.matrixWorld);
        line.renderOrder = 999;
        hlGroup.add(line);
      });
      return hlGroup;
    };

    const getMouseNDC = (event: MouseEvent): THREE.Vector2 => {
      const rect = containerRef.current!.getBoundingClientRect();
      return new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const hitTestFurniture = (ndc: THREE.Vector2): string | null => {
      const s = sceneRef.current;
      if (!s) return null;
      s.raycaster.setFromCamera(ndc, s.camera);
      const allMeshes: THREE.Mesh[] = [];
      const meshToId = new Map<THREE.Mesh, string>();
      itemGroupMap.current.forEach((group, itemId) => {
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            allMeshes.push(child as THREE.Mesh);
            meshToId.set(child as THREE.Mesh, itemId);
          }
        });
      });
      const intersects = s.raycaster.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        return meshToId.get(intersects[0].object as THREE.Mesh) || null;
      }
      return null;
    };

    /** Hit-test door/window meshes across all room groups. Returns opening metadata or null. */
    const hitTestOpening = (ndc: THREE.Vector2): {
      roomId: string; type: "door" | "window"; index: number; side: string; group: THREE.Group;
    } | null => {
      const s = sceneRef.current;
      if (!s) return null;
      s.raycaster.setFromCamera(ndc, s.camera);
      const openingMeshes: THREE.Mesh[] = [];
      const meshToGroup = new Map<THREE.Mesh, THREE.Group>();
      s.houseRoomGroups.forEach((rg) => {
        rg.children.forEach((child) => {
          if (child.userData.openingType === "door" || child.userData.openingType === "window") {
            const grp = child as THREE.Group;
            grp.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                openingMeshes.push(c as THREE.Mesh);
                meshToGroup.set(c as THREE.Mesh, grp);
              }
            });
          }
        });
      });
      const intersects = s.raycaster.intersectObjects(openingMeshes, false);
      if (intersects.length > 0) {
        const grp = meshToGroup.get(intersects[0].object as THREE.Mesh);
        if (grp) {
          return {
            roomId: grp.userData.openingRoomId,
            type: grp.userData.openingType,
            index: grp.userData.openingIndex,
            side: grp.userData.openingSide,
            group: grp,
          };
        }
      }
      return null;
    };

    /** Compute the wall-axis position from a ray-wall intersection and convert to t value */
    const computeOpeningT = (ndc: THREE.Vector2, side: string, bounds: [number, number, number, number], openingW: number): number | null => {
      const s = sceneRef.current;
      if (!s) return null;
      s.raycaster.setFromCamera(ndc, s.camera);

      const [xMin, xMax, zMin, zMax] = bounds;
      const w = xMax - xMin, d = zMax - zMin;
      const halfW = openingW / 2;
      const margin = 0.05; // small margin from wall edges

      // Project ray onto a vertical plane aligned with the wall
      let wallPlane: THREE.Plane;
      if (side === "north") {
        wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), zMax);
      } else if (side === "south") {
        wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -zMin);
      } else if (side === "east") {
        wallPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), xMax);
      } else { // west
        wallPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -xMin);
      }

      const target = new THREE.Vector3();
      const hit = s.raycaster.ray.intersectPlane(wallPlane, target);
      if (!hit) return null;

      let t: number;
      if (side === "north") {
        const centerX = Math.max(xMin + halfW + margin, Math.min(xMax - halfW - margin, target.x));
        t = (centerX - xMin) / w;
      } else if (side === "south") {
        const centerX = Math.max(xMin + halfW + margin, Math.min(xMax - halfW - margin, target.x));
        t = (xMax - centerX) / w;
      } else if (side === "east") {
        const centerZ = Math.max(zMin + halfW + margin, Math.min(zMax - halfW - margin, target.z));
        t = (centerZ - zMin) / d;
      } else { // west
        const centerZ = Math.max(zMin + halfW + margin, Math.min(zMax - halfW - margin, target.z));
        t = (zMax - centerZ) / d;
      }
      return Math.max(0.05, Math.min(0.95, t));
    };

    const getFloorHit = (ndc: THREE.Vector2): THREE.Vector3 | null => {
      const s = sceneRef.current;
      if (!s) return null;
      s.raycaster.setFromCamera(ndc, s.camera);
      const target = new THREE.Vector3();
      return s.raycaster.ray.intersectPlane(floorPlane, target);
    };

    const handleResize = () => {
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      s.camera.aspect = w / h;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(w, h);
      s.css2dRenderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // MOUSEDOWN — prepare potential drag (openings first, then furniture)
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;
      const ndc = getMouseNDC(event);
      mouseDownPos.copy(ndc);
      hasMoved = false;

      // 1) Check opening hit first (door/window)
      const openingHit = hitTestOpening(ndc);
      if (openingHit) {
        const def = HOUSE_ROOM_DEFS.find((r) => r.id === openingHit.roomId);
        if (def) {
          const opening = openingHit.type === "door" ? def.doors[openingHit.index] : (def.windows || [])[openingHit.index];
          if (opening) {
            openingDrag = {
              roomId: openingHit.roomId,
              type: openingHit.type,
              index: openingHit.index,
              side: openingHit.side,
              group: openingHit.group,
              bounds: def.bounds,
              openingW: opening.w,
              openingH: (opening as any).h,
              sillH: (opening as any).sillH,
            };
            // Deselect furniture when clicking an opening
            onSelectItemRef.current(null);
            return;
          }
        }
      }

      // Clicked elsewhere — deselect opening popup
      onDeselectOpeningRef.current?.();

      // 2) Check furniture hit
      const hitId = hitTestFurniture(ndc);
      if (hitId) {
        dragItemId = hitId;
        currentOverlap = false;
        const group = itemGroupMap.current.get(hitId);
        if (group) {
          // Save original position so we can snap back if overlap on release
          dragStartPos.copy(group.position);
          const floorPt = getFloorHit(ndc);
          if (floorPt) {
            dragOffset.set(group.position.x - floorPt.x, 0, group.position.z - floorPt.z);
          }
        }
      }
    };
    container.addEventListener("mousedown", handleMouseDown);

    // MOUSEMOVE — drag furniture or openings
    const handleMouseMove = (event: MouseEvent) => {
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;
      const ndc = getMouseNDC(event);

      // ── Opening drag (door/window along wall — with wall switching, snap & dimension overlay) ──
      if (openingDrag) {
        const dx = (ndc.x - mouseDownPos.x) * containerRef.current.clientWidth / 2;
        const dy = (ndc.y - mouseDownPos.y) * containerRef.current.clientHeight / 2;
        if (!hasMoved && Math.sqrt(dx * dx + dy * dy) < 3) return;

        if (!hasMoved) {
          hasMoved = true;
          isOpeningDragging = true;
          s.controls.enabled = false;
          onDraggingChangeRef.current(true);
          onDeselectOpeningRef.current?.(); // hide popup during drag
          clearOpeningHighlight(); // remove hover highlight during drag
          if (containerRef.current) containerRef.current.style.cursor = "grabbing";
        }

        // Wall switching: determine which wall the mouse is closest to
        const floorPt = getFloorHit(ndc);
        if (floorPt) {
          const newSide = determineClosestWall(floorPt, openingDrag.bounds);
          if (newSide !== openingDrag.side) {
            // Side changed — need to rebuild the opening on the new wall
            const def = HOUSE_ROOM_DEFS.find((r) => r.id === openingDrag!.roomId);
            if (def) {
              // Update the definition
              if (openingDrag.type === "door" && def.doors[openingDrag.index]) {
                def.doors[openingDrag.index] = { ...def.doors[openingDrag.index], side: newSide as any };
              } else if (openingDrag.type === "window" && (def.windows || [])[openingDrag.index]) {
                def.windows[openingDrag.index] = { ...def.windows[openingDrag.index], side: newSide as any };
              }
              // Rebuild the room to move the opening to the new wall
              const rg = s.houseRoomGroups.get(openingDrag.roomId);
              if (rg) {
                rebuildRoomOpenings(rg, def.bounds, def.doors, def.windows || [], def.wallColor, openingDrag.roomId);
                // Also rebuild neighbors (shared walls may have changed)
                const sharedData = getSharedWallData();
                const wd = sharedData.get(openingDrag.roomId);
                if (wd) {
                  for (const neighbors of wd.neighbors.values()) {
                    for (const n of neighbors) {
                      const nDef = HOUSE_ROOM_DEFS.find((r) => r.id === n.neighborId);
                      const nGrp = s.houseRoomGroups.get(n.neighborId);
                      if (nDef && nGrp) rebuildRoomOpenings(nGrp, nDef.bounds, nDef.doors, nDef.windows || [], nDef.wallColor, n.neighborId);
                    }
                  }
                }
                // Find the newly rebuilt opening group
                const newGrp = rg.children.find((c) =>
                  c.userData.openingType === openingDrag!.type &&
                  c.userData.openingIndex === openingDrag!.index &&
                  c.userData.openingSide === newSide
                ) as THREE.Group | undefined;
                if (newGrp) {
                  openingDrag.group = newGrp;
                }
              }
              openingDrag.side = newSide;
            }
          }
        }

        const rawT = computeOpeningT(ndc, openingDrag.side, openingDrag.bounds, openingDrag.openingW);
        if (rawT !== null) {
          const { t: newT, snapped: snapT } = snapOpeningT(rawT);

          // Move the opening group in real-time along the wall
          const [xMin, xMax, zMin, zMax] = openingDrag.bounds;
          const w = xMax - xMin, d = zMax - zMin;
          const grp = openingDrag.group;

          if (openingDrag.type === "door") {
            if (openingDrag.side === "north") grp.position.x = xMin + newT * w - openingDrag.openingW / 2;
            else if (openingDrag.side === "south") grp.position.x = xMax - newT * w + openingDrag.openingW / 2;
            else if (openingDrag.side === "east") grp.position.z = zMin + newT * d - openingDrag.openingW / 2;
            else grp.position.z = zMax - newT * d + openingDrag.openingW / 2;
          } else {
            if (openingDrag.side === "north") grp.position.x = xMin + newT * w;
            else if (openingDrag.side === "south") grp.position.x = xMax - newT * w;
            else if (openingDrag.side === "east") grp.position.z = zMin + newT * d;
            else grp.position.z = zMax - newT * d;
          }

          // Compute dimension overlay info
          const wLen = wallLengthForSide(openingDrag.side, openingDrag.bounds);
          const { left, right } = computeEdgeDistances(newT, wLen, openingDrag.openingW);

          // Project opening center to screen for overlay position
          const openingCenter3D = new THREE.Vector3();
          grp.getWorldPosition(openingCenter3D);
          openingCenter3D.y = 1.2; // midway up the wall
          openingCenter3D.project(s.camera);
          const rect = containerRef.current!.getBoundingClientRect();
          const screenX = ((openingCenter3D.x + 1) / 2) * rect.width;
          const screenY = ((-openingCenter3D.y + 1) / 2) * rect.height;

          // Project snap positions to screen coords
          const snapScreenPositions: { x: number; y: number }[] = [];
          for (const st of SNAP_T_POSITIONS) {
            const snapPos3D = new THREE.Vector3();
            if (openingDrag.side === "north") { snapPos3D.set(xMin + st * w, 1.3, zMax); }
            else if (openingDrag.side === "south") { snapPos3D.set(xMax - st * w, 1.3, zMin); }
            else if (openingDrag.side === "east") { snapPos3D.set(xMax, 1.3, zMin + st * d); }
            else { snapPos3D.set(xMin, 1.3, zMax - st * d); }
            snapPos3D.project(s.camera);
            snapScreenPositions.push({
              x: ((snapPos3D.x + 1) / 2) * rect.width,
              y: ((-snapPos3D.y + 1) / 2) * rect.height,
            });
          }

          onOpeningDragOverlayRef.current?.({
            screenX, screenY, distLeft: left, distRight: right,
            wallLength: wLen, side: openingDrag.side,
            snapT, snapScreenPositions,
          });
        }
        return;
      }

      // ── Hover detection for openings (when not dragging anything) ──
      if (!dragItemId) {
        lastMouseNDC.copy(ndc);
        const hit = hitTestOpening(ndc);
        if (hit) {
          if (hoveredOpeningGroup !== hit.group) {
            clearOpeningHighlight();
            hoveredOpeningGroup = hit.group;
            openingHighlightOutline = buildOpeningHighlight(hit.group);
            const s2 = sceneRef.current;
            if (s2) s2.scene.add(openingHighlightOutline);
            if (containerRef.current) containerRef.current.style.cursor = "grab";
          }
        } else if (hoveredOpeningGroup) {
          clearOpeningHighlight();
        }
        return;
      }

      // Threshold check (3px)
      const dx = (ndc.x - mouseDownPos.x) * containerRef.current.clientWidth / 2;
      const dy = (ndc.y - mouseDownPos.y) * containerRef.current.clientHeight / 2;
      if (!hasMoved && Math.sqrt(dx * dx + dy * dy) < 3) return;

      if (!hasMoved) {
        hasMoved = true;
        isDragging = true;
        s.controls.enabled = false;
        onDraggingChangeRef.current(true);
        onSelectItemRef.current(dragItemId);
      }

      const floorPt = getFloorHit(ndc);
      if (floorPt) {
        const group = itemGroupMap.current.get(dragItemId);
        if (group) {
          // Allow free movement (no clamping) so user sees the red state near walls
          group.position.x = floorPt.x + dragOffset.x;
          group.position.z = floorPt.z + dragOffset.z;

          // Clear previous overlap outlines on other items
          overlapOutlines.current.forEach((ol) => {
            s.scene.remove(ol);
            ol.geometry.dispose();
            (ol.material as THREE.Material).dispose();
          });
          overlapOutlines.current = [];

          // Real-time overlap detection during drag
          const dragBox = new THREE.Box3().setFromObject(group);
          const shrunkDragBox = dragBox.clone();
          shrunkDragBox.min.addScalar(0.05);
          shrunkDragBox.max.addScalar(-0.05);
          let hasOverlap = false;

          // 1) Check wall collision — item bbox must stay within a room's bounds
          //    Supports cross-room moves: if outside active room but inside another room, it's valid
          const rb = getBounds();
          let outsideActiveRoom = (
            dragBox.min.x < rb.minX ||
            dragBox.max.x > rb.maxX ||
            dragBox.min.z < rb.minZ ||
            dragBox.max.z > rb.maxZ
          );
          // Polygon-aware: item may be within bounding box but in the "empty corner" of an L/T-shaped room
          if (!outsideActiveRoom && rb.polygon) {
            outsideActiveRoom = !boxInPoly(rb.polygon, dragBox.min.x, dragBox.max.x, dragBox.min.z, dragBox.max.z);
          }

          if (outsideActiveRoom) {
            // Check if the item fits inside ANY other room
            const targetRoom = findRoomForBox(dragBox.min.x, dragBox.max.x, dragBox.min.z, dragBox.max.z);
            if (!targetRoom) {
              // Not inside any room — overlap (red)
              hasOverlap = true;
              const rcx = (rb.minX + rb.maxX) / 2, rcz = (rb.minZ + rb.maxZ) / 2;
              const rw = rb.maxX - rb.minX, rd = rb.maxZ - rb.minZ;
              const wallHighlights: { pos: THREE.Vector3; size: THREE.Vector3 }[] = [];
              if (dragBox.min.x < rb.minX) {
                wallHighlights.push({ pos: new THREE.Vector3(rb.minX, 1.4, rcz), size: new THREE.Vector3(0.12, 2.9, rd) });
              }
              if (dragBox.max.x > rb.maxX) {
                wallHighlights.push({ pos: new THREE.Vector3(rb.maxX, 1.4, rcz), size: new THREE.Vector3(0.12, 2.9, rd) });
              }
              if (dragBox.min.z < rb.minZ) {
                wallHighlights.push({ pos: new THREE.Vector3(rcx, 1.4, rb.minZ), size: new THREE.Vector3(rw, 2.9, 0.12) });
              }
              if (dragBox.max.z > rb.maxZ) {
                wallHighlights.push({ pos: new THREE.Vector3(rcx, 1.4, rb.maxZ), size: new THREE.Vector3(rw, 2.9, 0.12) });
              }
              wallHighlights.forEach((wh) => {
                const wGeo = new THREE.BoxGeometry(wh.size.x, wh.size.y, wh.size.z);
                const wEdges = new THREE.EdgesGeometry(wGeo);
                const wMat = new THREE.LineBasicMaterial({ color: "#EF4444", linewidth: 2, transparent: true, opacity: 0.5 });
                const wLine = new THREE.LineSegments(wEdges, wMat);
                wLine.position.copy(wh.pos);
                s.scene.add(wLine);
                overlapOutlines.current.push(wLine);
                wGeo.dispose();
              });
            }
            // else: inside another room — valid cross-room move, no overlap
          }

          // 2) Check furniture overlap
          const dragFurnitureId = placedItemsRef.current.find(it => it.id === dragItemId)?.furnitureId || "";
          const isDragTable = DINING_TABLE_IDS.has(dragFurnitureId);
          const isDragChair = DINING_CHAIR_IDS.has(dragFurnitureId);

          itemGroupMap.current.forEach((otherGroup, otherId) => {
            if (otherId === dragItemId) return;
            const otherBox = new THREE.Box3().setFromObject(otherGroup);
            if (shrunkDragBox.intersectsBox(otherBox)) {
              // Allow dining table + chair to overlap
              const otherFurnitureId = placedItemsRef.current.find(it => it.id === otherId)?.furnitureId || "";
              const isOtherTable = DINING_TABLE_IDS.has(otherFurnitureId);
              const isOtherChair = DINING_CHAIR_IDS.has(otherFurnitureId);
              if ((isDragTable && isOtherChair) || (isDragChair && isOtherTable)) return; // skip — allowed overlap

              hasOverlap = true;
              // Add red outline on the colliding item
              const oSize = new THREE.Vector3();
              const oCenter = new THREE.Vector3();
              otherBox.getSize(oSize);
              otherBox.getCenter(oCenter);
              const colGeo = new THREE.BoxGeometry(oSize.x + 0.1, oSize.y + 0.1, oSize.z + 0.1);
              const colEdges = new THREE.EdgesGeometry(colGeo);
              const colMat = new THREE.LineBasicMaterial({ color: "#EF4444", linewidth: 2, transparent: true, opacity: 0.7 });
              const colOutline = new THREE.LineSegments(colEdges, colMat);
              colOutline.position.copy(oCenter);
              s.scene.add(colOutline);
              overlapOutlines.current.push(colOutline);
              colGeo.dispose();
            }
          });

          currentOverlap = hasOverlap;
          onOverlapChangeRef.current(hasOverlap);

          const oColor = hasOverlap ? "#EF4444" : "#22C55E";

          // Remove old outline + glow
          if (s.selectedOutline) {
            s.scene.remove(s.selectedOutline);
            disposeContourGroup(s.selectedOutline);
          }
          if (s.selectedGlow) {
            s.scene.remove(s.selectedGlow);
            disposeContourGroup(s.selectedGlow);
          }

          // Rebuild contour outline + glow that follows actual mesh geometry
          const outlineGroup = buildContourOutline(group, oColor);
          s.scene.add(outlineGroup);
          s.selectedOutline = outlineGroup;

          const glowGroup = buildContourGlow(group, oColor, hasOverlap ? 0.15 : 0.06);
          s.scene.add(glowGroup);
          s.selectedGlow = glowGroup;
        }
      }
    };
    container.addEventListener("mousemove", handleMouseMove);

    // MOUSEUP — commit drag or handle click
    const handleMouseUp = (event: MouseEvent) => {
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;

      // ── Opening drag commit ──
      if (openingDrag) {
        if (isOpeningDragging) {
          const ndc = getMouseNDC(event);
          const rawT = computeOpeningT(ndc, openingDrag.side, openingDrag.bounds, openingDrag.openingW);
          if (rawT !== null) {
            const { t: finalT } = snapOpeningT(rawT);
            onOpeningMoveRef.current?.(openingDrag.roomId, openingDrag.type, openingDrag.index, finalT);
          }
          s.controls.enabled = true;
          onDraggingChangeRef.current(false);
          onOpeningDragOverlayRef.current?.(null); // clear overlay
        } else if (!hasMoved) {
          // Click on opening without drag — show popup menu
          onOpeningSelectRef.current?.(openingDrag.roomId, openingDrag.type, openingDrag.index, openingDrag.side);
          onRoomSelectRef.current?.(openingDrag.roomId);
        }
        openingDrag = null;
        isOpeningDragging = false;
        hasMoved = false;
        if (containerRef.current) containerRef.current.style.cursor = "";
        return;
      }

      if (isDragging && dragItemId) {
        // Clean up collision outlines on other items
        overlapOutlines.current.forEach((ol) => {
          s.scene.remove(ol);
          ol.geometry.dispose();
          (ol.material as THREE.Material).dispose();
        });
        overlapOutlines.current = [];

        const group = itemGroupMap.current.get(dragItemId);
        const commitId = dragItemId; // capture before it's reset to null
        if (group) {
          const rb = getBounds();
          const gx = group.position.x, gz = group.position.z;
          let outsideActive = gx < rb.minX || gx > rb.maxX || gz < rb.minZ || gz > rb.maxZ;
          // Polygon-aware: center may be within bbox but in the "empty corner"
          if (!outsideActive && rb.polygon) {
            outsideActive = !pointInPoly(rb.polygon, gx, gz);
          }

          // Cross-room move: if outside active room but inside another room, transfer it
          if (outsideActive) {
            const targetRoom = findRoomForPosition(gx, gz);
            if (targetRoom) {
              if (s.furnitureGroup.children.includes(group)) {
                s.furnitureGroup.remove(group);
              }
              group.traverse((child: any) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                  if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
                  else child.material.dispose();
                }
              });
              itemGroupMap.current.delete(commitId);
              if (s.selectedOutline) { s.scene.remove(s.selectedOutline); disposeContourGroup(s.selectedOutline); s.selectedOutline = null; }
              if (s.selectedGlow) { s.scene.remove(s.selectedGlow); disposeContourGroup(s.selectedGlow); s.selectedGlow = null; }
              onMoveItemToRoomRef.current(commitId, gx, gz, targetRoom);
            } else {
              // Outside all rooms — allow free placement (no snap-back)
              onMoveItemRef.current(commitId, gx, gz);
            }
          } else {
            // Inside active room — allow placement even if overlapping
            onMoveItemRef.current(commitId, gx, gz);
          }
        }
        s.controls.enabled = true;
        onDraggingChangeRef.current(false);
        onOverlapChangeRef.current(false);
      } else if (!hasMoved) {
        const ndc = getMouseNDC(event);
        const hitId = hitTestFurniture(ndc);
        if (hitId) {
          onSelectItemRef.current(hitId);
        } else {
          onSelectItemRef.current(null);
          // Try to detect room click — check ALL meshes in room groups (floor, walls, static furniture)
          const s = sceneRef.current;
          if (s && onRoomSelectRef.current) {
            s.raycaster.setFromCamera(ndc, s.camera);
            const roomMeshes: { mesh: THREE.Mesh; roomId: string }[] = [];
            s.houseRoomGroups.forEach((grp, id) => {
              if (!grp.visible) return;
              grp.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  roomMeshes.push({ mesh: child as THREE.Mesh, roomId: id });
                }
              });
            });
            const meshes = roomMeshes.map((f) => f.mesh);
            const hits = s.raycaster.intersectObjects(meshes, false);
            if (hits.length > 0) {
              const hitMesh = hits[0].object as THREE.Mesh;
              const found = roomMeshes.find((f) => f.mesh === hitMesh);
              if (found) {
                const def = HOUSE_ROOM_DEFS.find((r) => r.id === found.roomId);
                if (def) onRoomSelectRef.current?.(found.roomId);
              }
            }
          }
        }
      }

      isDragging = false;
      dragItemId = null;
      hasMoved = false;
    };
    container.addEventListener("mouseup", handleMouseUp);

    const handleContextMenu = (e: MouseEvent) => { if (isDragging) e.preventDefault(); };
    container.addEventListener("contextmenu", handleContextMenu);

    // ═══ TOUCH HANDLERS — Mobile furniture & opening drag ═══
    let touchDragItemId: string | null = null;
    let isTouchDragging = false;
    let touchHasMoved = false;
    const touchStartPos = new THREE.Vector2();
    const touchDragOffset = new THREE.Vector3();
    const touchDragStartPos = new THREE.Vector3();
    let touchCurrentOverlap = false;
    let touchOpeningDrag: typeof openingDrag = null;
    let isTouchOpeningDragging = false;

    const getTouchNDC = (touch: Touch): THREE.Vector2 => {
      const rect = containerRef.current!.getBoundingClientRect();
      return new THREE.Vector2(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;
      const touch = event.touches[0];
      const ndc = getTouchNDC(touch);
      touchStartPos.set(touch.clientX, touch.clientY);
      touchHasMoved = false;
      touchCurrentOverlap = false;

      // 1) Check opening hit first
      const openingHit = hitTestOpening(ndc);
      if (openingHit) {
        const def = HOUSE_ROOM_DEFS.find((r) => r.id === openingHit.roomId);
        if (def) {
          const opening = openingHit.type === "door" ? def.doors[openingHit.index] : (def.windows || [])[openingHit.index];
          if (opening) {
            touchOpeningDrag = {
              roomId: openingHit.roomId,
              type: openingHit.type,
              index: openingHit.index,
              side: openingHit.side,
              group: openingHit.group,
              bounds: def.bounds,
              openingW: opening.w,
              openingH: (opening as any).h,
              sillH: (opening as any).sillH,
            };
            onSelectItemRef.current(null);
            return;
          }
        }
      }

      // Touched elsewhere — deselect opening popup
      onDeselectOpeningRef.current?.();

      // 2) Check furniture hit
      const hitId = hitTestFurniture(ndc);
      if (hitId) {
        touchDragItemId = hitId;
        const group = itemGroupMap.current.get(hitId);
        if (group) {
          touchDragStartPos.copy(group.position);
          const floorPt = getFloorHit(ndc);
          if (floorPt) {
            touchDragOffset.set(group.position.x - floorPt.x, 0, group.position.z - floorPt.z);
          }
        }
      }
    };
    container.addEventListener("touchstart", handleTouchStart, { passive: true });

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;
      const touch = event.touches[0];
      const ndc = getTouchNDC(touch);

      // ── Touch opening drag (with wall switching, snap & overlay) ──
      if (touchOpeningDrag) {
        const tdx = touch.clientX - touchStartPos.x;
        const tdy = touch.clientY - touchStartPos.y;
        if (!touchHasMoved && Math.sqrt(tdx * tdx + tdy * tdy) < 8) return;
        if (!touchHasMoved) {
          touchHasMoved = true;
          isTouchOpeningDragging = true;
          s.controls.enabled = false;
          onDraggingChangeRef.current(true);
          onDeselectOpeningRef.current?.();
        }
        event.preventDefault();

        // Wall switching
        const floorPt = getFloorHit(ndc);
        if (floorPt) {
          const newSide = determineClosestWall(floorPt, touchOpeningDrag.bounds);
          if (newSide !== touchOpeningDrag.side) {
            const def = HOUSE_ROOM_DEFS.find((r) => r.id === touchOpeningDrag!.roomId);
            if (def) {
              if (touchOpeningDrag.type === "door" && def.doors[touchOpeningDrag.index]) {
                def.doors[touchOpeningDrag.index] = { ...def.doors[touchOpeningDrag.index], side: newSide as any };
              } else if (touchOpeningDrag.type === "window" && (def.windows || [])[touchOpeningDrag.index]) {
                def.windows[touchOpeningDrag.index] = { ...def.windows[touchOpeningDrag.index], side: newSide as any };
              }
              const rg = s.houseRoomGroups.get(touchOpeningDrag.roomId);
              if (rg) {
                rebuildRoomOpenings(rg, def.bounds, def.doors, def.windows || [], def.wallColor, touchOpeningDrag.roomId);
                // Rebuild neighbors
                const sharedData = getSharedWallData();
                const wd = sharedData.get(touchOpeningDrag.roomId);
                if (wd) {
                  for (const neighbors of wd.neighbors.values()) {
                    for (const n of neighbors) {
                      const nDef = HOUSE_ROOM_DEFS.find((r) => r.id === n.neighborId);
                      const nGrp = s.houseRoomGroups.get(n.neighborId);
                      if (nDef && nGrp) rebuildRoomOpenings(nGrp, nDef.bounds, nDef.doors, nDef.windows || [], nDef.wallColor, n.neighborId);
                    }
                  }
                }
                const newGrp = rg.children.find((c) =>
                  c.userData.openingType === touchOpeningDrag!.type &&
                  c.userData.openingIndex === touchOpeningDrag!.index &&
                  c.userData.openingSide === newSide
                ) as THREE.Group | undefined;
                if (newGrp) touchOpeningDrag.group = newGrp;
              }
              touchOpeningDrag.side = newSide;
            }
          }
        }

        const rawT = computeOpeningT(ndc, touchOpeningDrag.side, touchOpeningDrag.bounds, touchOpeningDrag.openingW);
        if (rawT !== null) {
          const { t: newT, snapped: snapT } = snapOpeningT(rawT);
          const [xMin, xMax, zMin, zMax] = touchOpeningDrag.bounds;
          const w = xMax - xMin, d = zMax - zMin;
          const grp = touchOpeningDrag.group;
          if (touchOpeningDrag.type === "door") {
            if (touchOpeningDrag.side === "north") grp.position.x = xMin + newT * w - touchOpeningDrag.openingW / 2;
            else if (touchOpeningDrag.side === "south") grp.position.x = xMax - newT * w + touchOpeningDrag.openingW / 2;
            else if (touchOpeningDrag.side === "east") grp.position.z = zMin + newT * d - touchOpeningDrag.openingW / 2;
            else grp.position.z = zMax - newT * d + touchOpeningDrag.openingW / 2;
          } else {
            if (touchOpeningDrag.side === "north") grp.position.x = xMin + newT * w;
            else if (touchOpeningDrag.side === "south") grp.position.x = xMax - newT * w;
            else if (touchOpeningDrag.side === "east") grp.position.z = zMin + newT * d;
            else grp.position.z = zMax - newT * d;
          }

          // Update overlay
          const wLen = wallLengthForSide(touchOpeningDrag.side, touchOpeningDrag.bounds);
          const { left, right } = computeEdgeDistances(newT, wLen, touchOpeningDrag.openingW);
          const openingCenter3D = new THREE.Vector3();
          grp.getWorldPosition(openingCenter3D);
          openingCenter3D.y = 1.2;
          openingCenter3D.project(s.camera);
          const rect = containerRef.current!.getBoundingClientRect();
          const screenX = ((openingCenter3D.x + 1) / 2) * rect.width;
          const screenY = ((-openingCenter3D.y + 1) / 2) * rect.height;
          const snapScreenPositions: { x: number; y: number }[] = [];
          for (const st of SNAP_T_POSITIONS) {
            const snapPos3D = new THREE.Vector3();
            if (touchOpeningDrag.side === "north") snapPos3D.set(xMin + st * w, 1.3, zMax);
            else if (touchOpeningDrag.side === "south") snapPos3D.set(xMax - st * w, 1.3, zMin);
            else if (touchOpeningDrag.side === "east") snapPos3D.set(xMax, 1.3, zMin + st * d);
            else snapPos3D.set(xMin, 1.3, zMax - st * d);
            snapPos3D.project(s.camera);
            snapScreenPositions.push({
              x: ((snapPos3D.x + 1) / 2) * rect.width,
              y: ((-snapPos3D.y + 1) / 2) * rect.height,
            });
          }
          onOpeningDragOverlayRef.current?.({
            screenX, screenY, distLeft: left, distRight: right,
            wallLength: wLen, side: touchOpeningDrag.side,
            snapT, snapScreenPositions,
          });
        }
        return;
      }

      if (!touchDragItemId) return;

      const tdx = touch.clientX - touchStartPos.x;
      const tdy = touch.clientY - touchStartPos.y;
      if (!touchHasMoved && Math.sqrt(tdx * tdx + tdy * tdy) < 8) return;

      if (!touchHasMoved) {
        touchHasMoved = true;
        isTouchDragging = true;
        s.controls.enabled = false;
        onDraggingChangeRef.current(true);
        onSelectItemRef.current(touchDragItemId);
      }

      if (isTouchDragging) {
        event.preventDefault();
      }

      const floorPt = getFloorHit(ndc);
      if (floorPt) {
        const group = itemGroupMap.current.get(touchDragItemId);
        if (group) {
          group.position.x = floorPt.x + touchDragOffset.x;
          group.position.z = floorPt.z + touchDragOffset.z;

          overlapOutlines.current.forEach((ol) => {
            s.scene.remove(ol);
            ol.geometry.dispose();
            (ol.material as THREE.Material).dispose();
          });
          overlapOutlines.current = [];

          const tDragBox = new THREE.Box3().setFromObject(group);
          const tShrunkBox = tDragBox.clone();
          tShrunkBox.min.addScalar(0.05);
          tShrunkBox.max.addScalar(-0.05);
          let tHasOverlap = false;

          const rb = getBounds();
          const trcx = (rb.minX + rb.maxX) / 2, trcz = (rb.minZ + rb.maxZ) / 2;
          const trw = rb.maxX - rb.minX, trd = rb.maxZ - rb.minZ;
          let tOutsideActive = (
            tDragBox.min.x < rb.minX ||
            tDragBox.max.x > rb.maxX ||
            tDragBox.min.z < rb.minZ ||
            tDragBox.max.z > rb.maxZ
          );
          if (!tOutsideActive && rb.polygon) {
            tOutsideActive = !boxInPoly(rb.polygon, tDragBox.min.x, tDragBox.max.x, tDragBox.min.z, tDragBox.max.z);
          }
          if (tOutsideActive) {
            // Check cross-room — only overlap if not inside any room
            const tTargetRoom = findRoomForBox(tDragBox.min.x, tDragBox.max.x, tDragBox.min.z, tDragBox.max.z);
            if (!tTargetRoom) {
              tHasOverlap = true;
              const twh: { pos: THREE.Vector3; size: THREE.Vector3 }[] = [];
              if (tDragBox.min.x < rb.minX) twh.push({ pos: new THREE.Vector3(rb.minX, 1.4, trcz), size: new THREE.Vector3(0.12, 2.9, trd) });
              if (tDragBox.max.x > rb.maxX) twh.push({ pos: new THREE.Vector3(rb.maxX, 1.4, trcz), size: new THREE.Vector3(0.12, 2.9, trd) });
              if (tDragBox.min.z < rb.minZ) twh.push({ pos: new THREE.Vector3(trcx, 1.4, rb.minZ), size: new THREE.Vector3(trw, 2.9, 0.12) });
              if (tDragBox.max.z > rb.maxZ) twh.push({ pos: new THREE.Vector3(trcx, 1.4, rb.maxZ), size: new THREE.Vector3(trw, 2.9, 0.12) });
              twh.forEach((wh) => {
                const wGeo = new THREE.BoxGeometry(wh.size.x, wh.size.y, wh.size.z);
                const wEdges = new THREE.EdgesGeometry(wGeo);
                const wMat = new THREE.LineBasicMaterial({ color: "#EF4444", linewidth: 2, transparent: true, opacity: 0.5 });
                const wLine = new THREE.LineSegments(wEdges, wMat);
                wLine.position.copy(wh.pos);
                s.scene.add(wLine);
                overlapOutlines.current.push(wLine);
                wGeo.dispose();
              });
            }
          }

          const touchDragFurnitureId = placedItemsRef.current.find(it => it.id === touchDragItemId)?.furnitureId || "";
          const isTouchDragTable = DINING_TABLE_IDS.has(touchDragFurnitureId);
          const isTouchDragChair = DINING_CHAIR_IDS.has(touchDragFurnitureId);

          itemGroupMap.current.forEach((otherGroup, otherId) => {
            if (otherId === touchDragItemId) return;
            const otherBox = new THREE.Box3().setFromObject(otherGroup);
            if (tShrunkBox.intersectsBox(otherBox)) {
              const otherFId = placedItemsRef.current.find(it => it.id === otherId)?.furnitureId || "";
              const isOtherTbl = DINING_TABLE_IDS.has(otherFId);
              const isOtherChr = DINING_CHAIR_IDS.has(otherFId);
              if ((isTouchDragTable && isOtherChr) || (isTouchDragChair && isOtherTbl)) return;

              tHasOverlap = true;
              const oSize = new THREE.Vector3();
              const oCenter = new THREE.Vector3();
              otherBox.getSize(oSize);
              otherBox.getCenter(oCenter);
              const colGeo = new THREE.BoxGeometry(oSize.x + 0.1, oSize.y + 0.1, oSize.z + 0.1);
              const colEdges = new THREE.EdgesGeometry(colGeo);
              const colMat = new THREE.LineBasicMaterial({ color: "#EF4444", linewidth: 2, transparent: true, opacity: 0.7 });
              const colOutline = new THREE.LineSegments(colEdges, colMat);
              colOutline.position.copy(oCenter);
              s.scene.add(colOutline);
              overlapOutlines.current.push(colOutline);
              colGeo.dispose();
            }
          });

          touchCurrentOverlap = tHasOverlap;
          onOverlapChangeRef.current(tHasOverlap);

          const tOColor = tHasOverlap ? "#EF4444" : "#22C55E";
          if (s.selectedOutline) { s.scene.remove(s.selectedOutline); disposeContourGroup(s.selectedOutline); }
          if (s.selectedGlow) { s.scene.remove(s.selectedGlow); disposeContourGroup(s.selectedGlow); }

          const tOutlineGroup = buildContourOutline(group, tOColor);
          s.scene.add(tOutlineGroup);
          s.selectedOutline = tOutlineGroup;

          const tGlowGroup = buildContourGlow(group, tOColor, tHasOverlap ? 0.15 : 0.06);
          s.scene.add(tGlowGroup);
          s.selectedGlow = tGlowGroup;
        }
      }
    };
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    const handleTouchEnd = (_event: TouchEvent) => {
      const s = sceneRef.current;
      if (!s || !containerRef.current) return;

      // ── Touch opening drag commit ──
      if (touchOpeningDrag) {
        if (isTouchOpeningDragging) {
          // Compute final t from the group's current position
          const [xMin, xMax, zMin, zMax] = touchOpeningDrag.bounds;
          const w = xMax - xMin, d = zMax - zMin;
          const grp = touchOpeningDrag.group;
          let finalT: number;
          if (touchOpeningDrag.type === "door") {
            if (touchOpeningDrag.side === "north") finalT = (grp.position.x + touchOpeningDrag.openingW / 2 - xMin) / w;
            else if (touchOpeningDrag.side === "south") finalT = (xMax - grp.position.x + touchOpeningDrag.openingW / 2) / w;
            else if (touchOpeningDrag.side === "east") finalT = (grp.position.z + touchOpeningDrag.openingW / 2 - zMin) / d;
            else finalT = (zMax - grp.position.z + touchOpeningDrag.openingW / 2) / d;
          } else {
            if (touchOpeningDrag.side === "north") finalT = (grp.position.x - xMin) / w;
            else if (touchOpeningDrag.side === "south") finalT = (xMax - grp.position.x) / w;
            else if (touchOpeningDrag.side === "east") finalT = (grp.position.z - zMin) / d;
            else finalT = (zMax - grp.position.z) / d;
          }
          finalT = Math.max(0.05, Math.min(0.95, finalT));
          const { t: snappedFinalT } = snapOpeningT(finalT);
          onOpeningMoveRef.current?.(touchOpeningDrag.roomId, touchOpeningDrag.type, touchOpeningDrag.index, snappedFinalT);
          s.controls.enabled = true;
          onDraggingChangeRef.current(false);
          onOpeningDragOverlayRef.current?.(null);
        } else if (!touchHasMoved) {
          // Tap on opening — show popup
          onOpeningSelectRef.current?.(touchOpeningDrag.roomId, touchOpeningDrag.type, touchOpeningDrag.index, touchOpeningDrag.side);
          onRoomSelectRef.current?.(touchOpeningDrag.roomId);
        }
        touchOpeningDrag = null;
        isTouchOpeningDragging = false;
        touchHasMoved = false;
        return;
      }

      if (isTouchDragging && touchDragItemId) {
        overlapOutlines.current.forEach((ol) => {
          s.scene.remove(ol);
          ol.geometry.dispose();
          (ol.material as THREE.Material).dispose();
        });
        overlapOutlines.current = [];

        const group = itemGroupMap.current.get(touchDragItemId);
        const commitId = touchDragItemId;
        if (group) {
          const rb = getBounds();
          const gx = group.position.x, gz = group.position.z;
          let outsideActive = gx < rb.minX || gx > rb.maxX || gz < rb.minZ || gz > rb.maxZ;
          if (!outsideActive && rb.polygon) {
            outsideActive = !pointInPoly(rb.polygon, gx, gz);
          }

          // ═══ Cross-room check FIRST (even if touchCurrentOverlap was true during drag) ═══
          if (outsideActive) {
            const targetRoom = findRoomForPosition(gx, gz);
            if (targetRoom) {
              if (s.furnitureGroup.children.includes(group)) {
                s.furnitureGroup.remove(group);
              }
              group.traverse((child: any) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                  if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
                  else child.material.dispose();
                }
              });
              itemGroupMap.current.delete(commitId);
              if (s.selectedOutline) { s.scene.remove(s.selectedOutline); disposeContourGroup(s.selectedOutline); s.selectedOutline = null; }
              if (s.selectedGlow) { s.scene.remove(s.selectedGlow); disposeContourGroup(s.selectedGlow); s.selectedGlow = null; }
              onMoveItemToRoomRef.current(commitId, gx, gz, targetRoom);
            } else {
              // Outside all rooms — allow free placement (no snap-back)
              onMoveItemRef.current(commitId, gx, gz);
            }
          } else {
            // Inside active room — allow placement even if overlapping
            onMoveItemRef.current(commitId, gx, gz);
          }
        }
        s.controls.enabled = true;
        onDraggingChangeRef.current(false);
        onOverlapChangeRef.current(false);
      } else if (!touchHasMoved && touchDragItemId) {
        onSelectItemRef.current(touchDragItemId);
      } else if (!touchHasMoved && !touchDragItemId) {
        onSelectItemRef.current(null);
        // Room tap detection for house view (use last known touch position)
        if (onRoomSelectRef.current) {
          const rect = containerRef.current!.getBoundingClientRect();
          const ndc = new THREE.Vector2(
            ((touchStartPos.x - rect.left) / rect.width) * 2 - 1,
            -((touchStartPos.y - rect.top) / rect.height) * 2 + 1,
          );
          s.raycaster.setFromCamera(ndc, s.camera);
          const roomMeshesT: { mesh: THREE.Mesh; roomId: string }[] = [];
          s.houseRoomGroups.forEach((grp, id) => {
            if (!grp.visible) return;
            grp.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                roomMeshesT.push({ mesh: child as THREE.Mesh, roomId: id });
              }
            });
          });
          const meshesT = roomMeshesT.map((f) => f.mesh);
          const hitsT = s.raycaster.intersectObjects(meshesT, false);
          if (hitsT.length > 0) {
            const found = roomMeshesT.find((f) => f.mesh === hitsT[0].object);
            if (found) onRoomSelectRef.current?.(found.roomId);
          }
        }
      }

      isTouchDragging = false;
      touchDragItemId = null;
      touchHasMoved = false;
    };
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("contextmenu", handleContextMenu);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      // Clean up overlap outlines
      overlapOutlines.current.forEach((ol) => {
        ol.geometry.dispose();
        (ol.material as THREE.Material).dispose();
      });
      overlapOutlines.current = [];
      // Clean up opening hover highlight
      clearOpeningHighlight();
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animRef.id);
        // Traverse entire scene and dispose all geometries/materials to free GPU memory
        sceneRef.current.scene.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mat = mesh.material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          }
        });
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
        sceneRef.current.renderer.domElement.remove();
        sceneRef.current.css2dRenderer.domElement.remove();
        // Clean up house room labels
        sceneRef.current.houseRoomLabels.forEach((obj) => {
          obj.element.remove();
        });
        sceneRef.current.standaloneWallGroups.forEach((grp) => { disposeGroup(grp); });
        sceneRef.current.standaloneWallGroups.clear();
        sceneRef.current = null;
      }
      // Clear furniture map so next mount creates fresh groups in the new scene
      itemGroupMap.current.clear();
    };
  }, [sceneRebuildKey, skipBuild]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;

    const currentIds = new Set(placedItems.map((i) => i.id));
    itemGroupMap.current.forEach((group, id) => {
      if (!currentIds.has(id)) {
        s.furnitureGroup.remove(group);
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry.dispose();
            if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
            else (m.material as THREE.Material).dispose();
          }
        });
        itemGroupMap.current.delete(id);
      }
    });

    placedItems.forEach((item) => {
      let group = itemGroupMap.current.get(item.id);
      if (!group) {
        group = buildFurnitureModel(item.furnitureId, item.color);
        group.userData.itemId = item.id;
        s.furnitureGroup.add(group);
        itemGroupMap.current.set(item.id, group);
      } else if (group.parent !== s.furnitureGroup) {
        // Re-attach if group was orphaned (e.g. scene recreated in StrictMode)
        s.furnitureGroup.add(group);
      }
      group.position.set(item.position[0], item.position[1], item.position[2]);
      group.rotation.y = (item.rotation * Math.PI) / 180;
    });
  }, [placedItems]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;

    // Clean up old outline + glow
    if (s.selectedOutline) {
      s.scene.remove(s.selectedOutline);
      disposeContourGroup(s.selectedOutline);
      s.selectedOutline = null;
    }
    if (s.selectedGlow) {
      s.scene.remove(s.selectedGlow);
      disposeContourGroup(s.selectedGlow);
      s.selectedGlow = null;
    }

    if (selectedId) {
      const group = itemGroupMap.current.get(selectedId);
      if (group) {
        const bbox = new THREE.Box3().setFromObject(group);

        // Check overlap with walls + other placed items
        let hasOverlap = false;
        const shrunkBox = bbox.clone();
        shrunkBox.min.addScalar(0.05);
        shrunkBox.max.addScalar(-0.05);

        // Wall collision check — dynamic bounds (supports cross-room + polygon rooms)
        const rb = s.activeRoomBounds;
        let outsideActive = (
          bbox.min.x < rb.minX ||
          bbox.max.x > rb.maxX ||
          bbox.min.z < rb.minZ ||
          bbox.max.z > rb.maxZ
        );
        if (!outsideActive && rb.polygon) {
          outsideActive = !boxInPoly(rb.polygon, bbox.min.x, bbox.max.x, bbox.min.z, bbox.max.z);
        }
        if (outsideActive) {
          const targetRoom = findRoomForBox(bbox.min.x, bbox.max.x, bbox.min.z, bbox.max.z);
          if (!targetRoom) hasOverlap = true;
        }

        // Furniture collision check (dining table + chair can overlap)
        const selFurnitureId = placedItemsRef.current.find(it => it.id === selectedId)?.furnitureId || "";
        const isSelTable = DINING_TABLE_IDS.has(selFurnitureId);
        const isSelChair = DINING_CHAIR_IDS.has(selFurnitureId);
        itemGroupMap.current.forEach((otherGroup, otherId) => {
          if (otherId === selectedId) return;
          const otherBox = new THREE.Box3().setFromObject(otherGroup);
          if (shrunkBox.intersectsBox(otherBox)) {
            const oFId = placedItemsRef.current.find(it => it.id === otherId)?.furnitureId || "";
            const isOTbl = DINING_TABLE_IDS.has(oFId);
            const isOChr = DINING_CHAIR_IDS.has(oFId);
            if ((isSelTable && isOChr) || (isSelChair && isOTbl)) return;
            hasOverlap = true;
          }
        });

        const oColor = hasOverlap ? "#EF4444" : "#22C55E";

        // Contour outline that follows actual mesh geometry
        const outlineGroup = buildContourOutline(group, oColor);
        s.scene.add(outlineGroup);
        s.selectedOutline = outlineGroup;

        // Semi-transparent contour glow
        const glowGroup = buildContourGlow(group, oColor, 0.06);
        s.scene.add(glowGroup);
        s.selectedGlow = glowGroup;

        onOverlapChange(hasOverlap);
      }
    } else {
      onOverlapChange(false);
    }
  }, [selectedId, placedItems]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const wallColor = MATERIAL_DEFS.walls[materials.walls] || "#F5F5F5";
    const floorColor = MATERIAL_DEFS.floors[materials.floors] || "#F0F0F0";
    const ceilingColor = MATERIAL_DEFS.ceiling[materials.ceiling] || "#FAFAFA";
    // Update origin room
    s.wallMeshes.forEach((wall) => {
      (wall.material as THREE.MeshStandardMaterial).color.set(wallColor);
    });
    if (s.floorMesh) (s.floorMesh.material as THREE.MeshStandardMaterial).color.set(floorColor);
    if (s.ceilingMesh) (s.ceilingMesh.material as THREE.MeshStandardMaterial).color.set(ceilingColor);
    // Only update the ACTIVE room's house group (per-room materials)
    if (activeRoomId) {
      const activeGrp = s.houseRoomGroups.get(activeRoomId);
      if (activeGrp) {
        activeGrp.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (!mat || Array.isArray(mat)) return;
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (mesh.rotation.x === -Math.PI / 2 && mesh.position.y < 0.01) {
            // Floor mesh
            stdMat.color.set(floorColor);
          } else if (mesh.userData.isCeiling) {
            stdMat.color.set(ceilingColor);
          } else if (mesh.userData.wallSide && !mesh.userData.isStaticFurniture) {
            // Wall mesh (identified by wallSide tag)
            stdMat.color.set(wallColor);
          }
        });
      }
    }
  }, [materials, activeRoomId]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const base = lighting.intensity / 100;
    const tod = globalTimeOfDay ?? 14;
    const t = (tod - 6) / 14;
    const angle = Math.PI * (0.15 + t * 0.7);
    const sunX = Math.cos(angle) * 5;
    const sunY = Math.sin(angle) * 4 + 1;

    // ── Global lights: fixed intensity, NOT affected by per-room intensity slider ──
    // This ensures changing one room's intensity doesn't affect other rooms or the ground
    s.directionalLight.position.set(sunX, sunY, 2);
    s.directionalLight.target.position.set(0, 0, 0);
    s.directionalLight.target.updateMatrixWorld();
    s.directionalLight.intensity = 1.4; // fixed
    const midday = 1 - Math.abs(t - 0.5) * 2;
    s.directionalLight.color.set(midday > 0.5 ? "#FFFAF0" : "#FFE8C8");
    s.ambientLight.intensity = 0.4; // fixed

    // ── Per-room PointLight: update ONLY the active room's embedded light ──
    if (activeRoomId) {
      const roomGrp = s.houseRoomGroups.get(activeRoomId);
      if (roomGrp) {
        roomGrp.traverse((child) => {
          if (child.userData.isRoomLight && child.userData.roomId === activeRoomId) {
            const pl = child as THREE.PointLight;
            pl.intensity = (child.userData.baseIntensity || 1.8) * base;
          }
        });
      }
    }

    // ── Room-scoped editing lights: positioned at active room center, affected by intensity ──
    const lc = s.lightCenter;
    if (s.ceilingPointLight) {
      s.ceilingPointLight.position.set(lc.x, 2.6, lc.z);
      s.ceilingPointLight.visible = lighting.ceilingLight;
      s.ceilingPointLight.intensity = 2.5 * base;
      s.ceilingPointLight.distance = 4; // limit range to active room
    }
    if (s.floorPointLight) {
      const rb = s.activeRoomBounds;
      const rw = (rb.maxX - rb.minX) * 0.35;
      const rd = (rb.maxZ - rb.minZ) * 0.35;
      s.floorPointLight.position.set(lc.x - rw, 1.5, lc.z + rd);
      s.floorPointLight.visible = lighting.floorLamp;
      s.floorPointLight.intensity = 1.5 * base;
      s.floorPointLight.distance = 3;
    }
    if (s.accentSpotLight) {
      const rb = s.activeRoomBounds;
      const rw = (rb.maxX - rb.minX) * 0.4;
      const rd = (rb.maxZ - rb.minZ) * 0.35;
      s.accentSpotLight.position.set(lc.x + rw, 2.5, lc.z - rd);
      s.accentSpotLight.visible = lighting.accentLight;
      s.accentSpotLight.intensity = 2 * base;
    }
    if (s.underCabinetLight) {
      const rb = s.activeRoomBounds;
      const rw = (rb.maxX - rb.minX) * 0.4;
      const rd = (rb.maxZ - rb.minZ) * 0.4;
      s.underCabinetLight.position.set(lc.x + rw, 0.9, lc.z - rd);
      s.underCabinetLight.visible = lighting.underCabinet;
      s.underCabinetLight.intensity = 1.5 * base;
      s.underCabinetLight.distance = 3;
    }
  }, [lighting, activeRoomId, globalTimeOfDay]);
}

/* ═══════════════════════════════════════════════════════
   UI — Mini Floor Plan (SVG)
   ═══════════════════════════════════════════════════════ */
function MiniFloorPlan({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="5" y="5" width="90" height="90" fill="#09090B" stroke="#09090B" strokeWidth="2" rx="4" />
        {/* Top row: Kitchen | Bath | Main Bed */}
        <rect x="7" y="7" width="35" height="18" fill="#1A1A1A" rx="2" />
        <rect x="44" y="7" width="22" height="18" fill="#1A1A1A" rx="2" />
        <rect x="68" y="7" width="25" height="28" fill="#1A1A1A" rx="2" />
        {/* Center: Dining/Family */}
        <rect x="7" y="27" width="59" height="20" fill="#1A1A1A" rx="2" />
        <rect x="7" y="27" width="59" height="20" fill="#71717A" fillOpacity="0.25" stroke="#71717A" strokeWidth="1" rx="2" />
        {/* Bottom row: Living | Bed2 | Bed3 */}
        <rect x="7" y="49" width="35" height="38" fill="#1A1A1A" rx="2" />
        <rect x="44" y="49" width="24" height="38" fill="#1A1A1A" rx="2" />
        <rect x="70" y="49" width="23" height="38" fill="#1A1A1A" rx="2" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   UI — Furniture Thumbnail (3D model rendered to canvas)
   ═══════════════════════════════════════════════════════ */

const thumbnailCache = new Map<string, string>();

let sharedRenderer: THREE.WebGLRenderer | null = null;
function getSharedRenderer(): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    sharedRenderer.setSize(128, 128);
    sharedRenderer.setPixelRatio(1);
    sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return sharedRenderer;
}

function renderThumbnail(furnitureId: string, color: string): string {
  const cached = thumbnailCache.get(furnitureId);
  if (cached) return cached;

  const renderer = getSharedRenderer();
  const scene = new THREE.Scene();

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 5, 4);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-2, 3, -2);
  scene.add(fillLight);

  const model = buildFurnitureModel(furnitureId, color);
  scene.add(model);

  const bbox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  bbox.getCenter(center);
  bbox.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = 35;
  const dist = (maxDim / 2) / Math.tan((fov * Math.PI) / 360) * 1.35;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 100);
  camera.position.set(center.x + dist * 0.65, center.y + dist * 0.55, center.z + dist * 0.65);
  camera.lookAt(center);

  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL("image/png");

  model.traverse((child) => {
    if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    if ((child as THREE.Mesh).material) {
      const mat = (child as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach(m => m.dispose());
      else mat.dispose();
    }
  });

  thumbnailCache.set(furnitureId, dataURL);
  return dataURL;
}

function FurnitureThumbnail({ item }: { item: CatalogItem }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setSrc(renderThumbnail(item.id, item.color));
      } catch { /* fallback to icon */ }
    });
    return () => cancelAnimationFrame(id);
  }, [item.id, item.color]);

  const Icon = item.icon;
  return (
    <div className="w-full aspect-square bg-[#F9FAFB] rounded-[12px] flex items-center justify-center relative overflow-hidden border border-[#F3F4F6] group-hover:bg-[#F6F6F6] group-hover:border-[#E5E7EB] transition-all duration-200">
      {src ? (
        <img src={src} alt={item.name} className="w-full h-full object-contain" draggable={false} />
      ) : (
        <Icon className="size-[36%] text-[#71717A]" strokeWidth={1.2} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Left Panel — Add Furniture
   ═══════════════════════════════════════════════════════ */
/* ── Desktop category structure (mirrors mobile) ── */
interface DesktopCategoryDef {
  id: string;
  label: string;
  icon: typeof Sofa;
  catalogCategories: string[];
}
interface DesktopCategoryGroup {
  title: string;
  categories: DesktopCategoryDef[];
}
const DESKTOP_CATEGORY_GROUPS: DesktopCategoryGroup[] = [
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

function FurniturePanel({ onAddItem, onClose, onAutoFurnish, roomLabel }: { onAddItem: (item: CatalogItem) => void; onClose: () => void; onAutoFurnish?: () => void; roomLabel?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showHint, setShowHint] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DesktopCategoryDef | null>(null);

  const searchResults = searchQuery.trim()
    ? CATALOG.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const categoryItems = selectedCategory
    ? CATALOG.filter((item) => selectedCategory.catalogCategories.includes(item.category))
    : [];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2.5">
          {selectedCategory && !isSearching ? (
            <button
              onClick={() => setSelectedCategory(null)}
              className="size-[32px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="size-[16px] text-[#09090B]" strokeWidth={2} />
            </button>
          ) : (
            <div className="size-[32px] rounded-full bg-[#F6F6F6] flex items-center justify-center">
              <Plus className="size-[16px] text-[#09090B]" strokeWidth={2} />
            </div>
          )}
          <div>
            <h3 className="font-['Inter',sans-serif] text-[15px] font-bold text-[#09090B] tracking-[-0.5px] leading-none mb-0.5">
              {selectedCategory && !isSearching ? selectedCategory.label : "Add Furniture"}
            </h3>
            <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A] leading-none">
              {selectedCategory && !isSearching
                ? `${categoryItems.length} item${categoryItems.length !== 1 ? "s" : ""}`
                : "Tap to place in room"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="size-[32px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors">
          <X className="size-[14px] text-[#09090B]" strokeWidth={2} />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 border border-[#E5E7EB] rounded-[14px] px-4 h-[42px] bg-[#F9FAFB]">
          <Search className="size-[16px] text-[#99A1AF]" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search furniture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-[#99A1AF] hover:text-[#09090B]">
              <X className="size-[14px]" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Hint banner */}
      <AnimatePresence>
        {showHint && !selectedCategory && !isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-5 mb-3"
          >
            <div className="bg-[#FFF6DC] border border-[#FFEAB1] rounded-[12px] px-4 py-2.5 flex items-center gap-2.5">
              <Sparkles className="size-[14px] text-[#09090B] shrink-0" strokeWidth={1.5} />
              <span className="font-['Inter',sans-serif] text-[12px] text-[#09090B] flex-1">
                Browse categories or search items
              </span>
              <button onClick={() => setShowHint(false)} className="text-[#09090B]/50 hover:text-[#09090B]">
                <X className="size-[12px]" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Furnish button */}
      {onAutoFurnish && !selectedCategory && !isSearching && (
        <div className="mx-5 mb-3">
          <button
            onClick={onAutoFurnish}
            className="w-full h-[42px] rounded-[14px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[13px] font-semibold tracking-[-0.35px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="size-[14px]" strokeWidth={1.5} />
            Quick Furnish{roomLabel ? ` — ${roomLabel}` : ""}
          </button>
          <p className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] text-center mt-1.5">
            Auto-place furniture based on room type
          </p>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-auto scrollbar-styled">
        {/* ── Search results ── */}
        {isSearching && (
          <div className="px-5 pb-5">
            <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A] mb-3">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddItem(item)}
                  className="group flex flex-col items-center cursor-pointer text-center active:scale-95 transition-transform"
                >
                  <FurnitureThumbnail item={item} />
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] mt-2 leading-tight line-clamp-2">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="size-[24px] text-[#ABABAB] mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">No items found</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* ── Category items grid (drill-down) ── */}
        {!isSearching && selectedCategory && (
          <div className="px-5 pb-5 pt-2">
            <div className="grid grid-cols-3 gap-3">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddItem(item)}
                  className="group flex flex-col items-center cursor-pointer text-center active:scale-95 transition-transform"
                >
                  <FurnitureThumbnail item={item} />
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] mt-2 leading-tight line-clamp-2">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
            {categoryItems.length === 0 && (
              <div className="text-center py-12">
                <Box className="size-[24px] text-[#ABABAB] mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-['Inter',sans-serif] text-[14px] text-[#71717A]">No items yet</p>
                <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] mt-1">Coming soon</p>
              </div>
            )}
          </div>
        )}

        {/* ── Category list (default view) ── */}
        {!isSearching && !selectedCategory && (
          <div className="pb-4">
            {DESKTOP_CATEGORY_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="px-5 pt-4 pb-1.5">
                  <h4 className="font-['Inter',sans-serif] text-[12px] font-bold text-[#71717A] tracking-[0.5px] uppercase">
                    {group.title}
                  </h4>
                </div>
                {group.categories.map((cat) => {
                  const Icon = cat.icon;
                  const count = CATALOG.filter((item) => cat.catalogCategories.includes(item.category)).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-[#F9FAFB] active:bg-[#F6F6F6] transition-colors"
                    >
                      <div className="size-[32px] rounded-[8px] bg-[#F6F6F6] flex items-center justify-center shrink-0">
                        <Icon className="size-[16px] text-[#71717A]" strokeWidth={1.5} />
                      </div>
                      <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] tracking-[-0.2px] flex-1 min-w-0 truncate">
                        {cat.label}
                      </span>
                      <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] mr-1">
                        {count}
                      </span>
                      <ChevronRight className="size-[14px] text-[#C0C0C0] shrink-0" strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Left Panel — Customize (Materials, Lighting, Camera)
   ═══════════════════════════════════════════════════════ */
function CustomizePanel({
  materials,
  onMaterialChange,
  lighting,
  onLightingChange,
  activeCamPreset,
  onCameraPreset,
  globalTimeOfDay,
}: {
  materials: SceneMaterials;
  onMaterialChange: (cat: string, val: string) => void;
  lighting: SceneLighting;
  onLightingChange: (u: Partial<SceneLighting>) => void;
  activeCamPreset?: number;
  onCameraPreset?: (idx: number) => void;
  globalTimeOfDay?: number;
}) {
  const [tab, setTab] = useState<CustomizeTab>("materials");
  const [activeMat, setActiveMat] = useState("walls");
  const currentCat = MATERIALS_UI.find((m) => m.id === activeMat);
  const currentSel = activeMat === "walls" ? materials.walls : activeMat === "floors" ? materials.floors : materials.ceiling;

  const lights = [
    { key: "ceilingLight" as const, label: "Ceiling Light", enabled: lighting.ceilingLight },
    { key: "floorLamp" as const, label: "Floor Lamp", enabled: lighting.floorLamp },
    { key: "accentLight" as const, label: "Accent Light", enabled: lighting.accentLight },
    { key: "underCabinet" as const, label: "Under Cabinet", enabled: lighting.underCabinet },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex border-b border-[#F3F4F6] px-3 pt-1 shrink-0">
        {([
          { id: "materials" as const, icon: Paintbrush, label: "Materials" },
          { id: "lighting" as const, icon: Sun, label: "Lighting" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] ${
              tab === t.id ? "border-[#09090B] text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            }`}
          >
            <t.icon className="size-[15px]" strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "materials" && (
        <div className="flex-1 overflow-auto scrollbar-styled">
          <div className="px-5 pt-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {MATERIALS_UI.map((mat) => (
              <button
                key={mat.id}
                onClick={() => setActiveMat(mat.id)}
                className={`shrink-0 px-4 py-2 rounded-[100px] font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] border transition-all duration-200 ${
                  activeMat === mat.id ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_2px_8px_rgba(0,0,0,0.15)]" : "bg-white text-[#09090B] border-[#E5E7EB] hover:bg-[#F6F6F6]"
                }`}
              >
                {mat.label}
              </button>
            ))}
          </div>
          <div className="px-5 pb-5 flex flex-col gap-2.5">
            {currentCat?.options.map((opt) => {
              const hex = activeMat === "walls" ? MATERIAL_DEFS.walls[opt] : activeMat === "floors" ? MATERIAL_DEFS.floors[opt] : MATERIAL_DEFS.ceiling[opt];
              const sel = currentSel === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onMaterialChange(activeMat, opt)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-[14px] border transition-all duration-200 text-left active:scale-[0.98] ${
                    sel ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_4px_12px_rgba(0,0,0,0.15)]" : "bg-white text-[#09090B] border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D0D0D0]"
                  }`}
                >
                  <div className={`size-[40px] rounded-[10px] shrink-0 ${sel ? "ring-2 ring-white/30" : "border border-[#E5E7EB]"}`} style={{ backgroundColor: hex || "#F6F6F6" }} />
                  <span className="font-['Inter',sans-serif] text-[14px] font-medium flex-1">{opt}</span>
                  {sel && <Check className="size-[16px]" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "lighting" && (
        <div className="flex-1 overflow-auto scrollbar-styled px-5 pt-5 pb-5 flex flex-col gap-6">
          <div>
            <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] tracking-[-0.3px] mb-3 block">Time of Day <span className="text-[11px] text-[#ABABAB] font-normal">(global)</span></label>
            <input type="range" min={6} max={20} value={globalTimeOfDay ?? 14} onChange={(e) => onLightingChange({ timeOfDay: Number(e.target.value) })} className="w-full accent-[#09090B] h-[4px] rounded-full" />
            <div className="flex justify-between mt-2">
              <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">6 AM</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] font-semibold tracking-[-0.3px]">{(globalTimeOfDay ?? 14) > 12 ? `${(globalTimeOfDay ?? 14) - 12} PM` : `${globalTimeOfDay ?? 14} AM`}</span>
              <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">8 PM</span>
            </div>
          </div>
          <div>
            <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] tracking-[-0.3px] mb-3 block">Intensity</label>
            <input type="range" min={0} max={100} value={lighting.intensity} onChange={(e) => onLightingChange({ intensity: Number(e.target.value) })} className="w-full accent-[#09090B] h-[4px] rounded-full" />
            <div className="flex justify-between mt-2">
              <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">Dim</span>
              <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B] font-semibold tracking-[-0.3px]">{lighting.intensity}%</span>
              <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB]">Bright</span>
            </div>
          </div>
          <div>
            <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] tracking-[-0.3px] mb-3 block">Light Sources</label>
            <div className="bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] overflow-hidden">
              {lights.map((light, idx) => (
                <div key={light.key} className={`flex items-center justify-between px-4 py-3.5 ${idx < lights.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                  <span className="font-['Inter',sans-serif] text-[14px] text-[#09090B]">{light.label}</span>
                  <button
                    onClick={() => onLightingChange({ [light.key]: !light.enabled })}
                    className={`w-[40px] h-[22px] rounded-full transition-colors duration-200 relative ${light.enabled ? "bg-[#09090B]" : "bg-[#E5E7EB]"}`}
                  >
                    <motion.div
                      animate={{ x: light.enabled ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-[2px] size-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "camera" && (
        <div className="flex-1 overflow-auto scrollbar-styled px-5 pt-5 pb-5 flex flex-col gap-6">
          <div>
            <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] tracking-[-0.3px] mb-3 block">Camera Presets</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Perspective", icon: Eye },
                { label: "Front Wall", icon: Camera },
                { label: "Corner View", icon: Maximize2 },
                { label: "Top Down", icon: Grid3X3 },
              ].map((preset, i) => {
                const isActive = activeCamPreset === i;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onCameraPreset?.(i)}
                    className={`p-3.5 rounded-[14px] border text-left transition-all duration-200 active:scale-[0.97] ${isActive ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_4px_12px_rgba(0,0,0,0.15)]" : "bg-[#F9FAFB] text-[#09090B] border-[#E5E7EB] hover:bg-[#F6F6F6]"}`}
                  >
                    <preset.icon className={`size-[16px] mb-1.5 ${isActive ? "text-white" : "text-[#71717A]"}`} strokeWidth={1.5} />
                    <span className="font-['Inter',sans-serif] text-[12px] font-medium block tracking-[-0.2px]">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Reset View */}
          <button
            onClick={() => onCameraPreset?.(0)}
            className="flex items-center justify-center gap-2 h-[42px] rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F6F6F6] font-['Inter',sans-serif] text-[14px] font-medium text-[#09090B] tracking-[-0.3px] transition-colors active:scale-[0.98]"
          >
            <RotateCw className="size-[14px] text-[#71717A]" strokeWidth={1.5} />
            Reset Camera
          </button>
          {/* Render CTA — Double layer pill */}
          <div className="bg-[#F6F6F6] border border-white rounded-[100px] p-[5px]">
            <button className="w-full bg-[#09090B] text-white rounded-[100px] h-[48px] px-6 font-['Inter',sans-serif] font-medium text-[14px] tracking-[-0.7px] flex items-center justify-center gap-2.5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity">
              <Sparkles className="size-[15px]" strokeWidth={2} />
              Render Image
              <ArrowRight className="size-[15px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════���═══
   Room Selection — SVG Floor Plan (HDB 3-Room Simplified Corridor)
   
   SVG layout (200×370 viewBox, proportional to 6.1m × 11.0m):
   Scale: ~32.5px per meter
   
     Kitchen/Dining (0-85, 0-189)    | Bath2 (85-157, 0-49)
                                      | Bath1 (85-157, 49-101)
                                      | Main Bedroom (115-197, 75-221)
     Store (39-85, 150-189)          | Corridor (85-115, 101-221)
     Living Room (0-104, 189-358)    | Bedroom (104-197, 221-358)
   ════════════════════���══════════════════════════════════ */
function HouseFloorPlanSVG({
  activeRoom, hoveredRoom, onHover, onSelect, viewMode,
}: {
  activeRoom: string; hoveredRoom: string | null;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
  viewMode: "room" | "house";
}) {
  // Room SVG rects matching the HDB 3-Room Simplified (Corridor) layout
  const defaultRoomRects: Record<string, { x: number; y: number; w: number; h: number }> = {
    kitchen:  { x: 5,   y: 5,   w: 64,  h: 184 },
    bath2:    { x: 72,  y: 5,   w: 48,  h: 48  },
    bath1:    { x: 72,  y: 56,  w: 48,  h: 48  },
    "main-bed": { x: 123, y: 5,  w: 72,  h: 143 },
    store:    { x: 42,  y: 152, w: 43,  h: 37  },
    corridor: { x: 72,  y: 107, w: 48,  h: 82 },
    living:   { x: 5,   y: 192, w: 99,  h: 166 },
    bedroom:  { x: 107, y: 224, w: 88,  h: 134 },
    balcony:  { x: 5,   y: 362, w: 190, h: 18  },
  };

  // For imported plans, generate rects from room bounds
  const roomRects: Record<string, { x: number; y: number; w: number; h: number }> = { ...defaultRoomRects };
  let svgVBW = 202, svgVBH = 386;
  if (_wasImported) {
    // Build dynamic rects from HOUSE_ROOM_DEFS bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const def of HOUSE_ROOM_DEFS) {
      if (def.bounds[0] < minX) minX = def.bounds[0];
      if (def.bounds[1] > maxX) maxX = def.bounds[1];
      if (def.bounds[2] < minZ) minZ = def.bounds[2];
      if (def.bounds[3] > maxZ) maxZ = def.bounds[3];
    }
    const totalW = maxX - minX || 1;
    const totalD = maxZ - minZ || 1;
    const svgPad = 8;
    const svgInner = 186; // available width in svg
    const scale = svgInner / Math.max(totalW, totalD);
    svgVBW = Math.round(totalW * scale + svgPad * 2);
    svgVBH = Math.round(totalD * scale + svgPad * 2);
    for (const def of HOUSE_ROOM_DEFS) {
      roomRects[def.id] = {
        x: Math.round((def.bounds[0] - minX) * scale + svgPad),
        y: Math.round((def.bounds[2] - minZ) * scale + svgPad),
        w: Math.max(10, Math.round((def.bounds[1] - def.bounds[0]) * scale)),
        h: Math.max(10, Math.round((def.bounds[3] - def.bounds[2]) * scale)),
      };
    }
  }

  return (
    <svg viewBox={`0 0 ${svgVBW} ${svgVBH}`} className="w-full" style={{ maxWidth: 260 }}>
      {/* Background */}
      <rect x="2" y="2" width={svgVBW - 4} height={svgVBH - 4} rx="8" fill="#09090B" />
      
      {/* Room fills */}
      {HOUSE_ROOM_DEFS.map((def) => {
        const r = roomRects[def.id];
        if (!r) return null;
        const isActive = activeRoom === def.id || viewMode === "house";
        const isHovered = hoveredRoom === def.id;
        const opacity = isHovered ? 0.7 : isActive ? 0.5 : 0.2;
        return (
          <g key={def.id}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h} rx="3"
              fill={def.accent} fillOpacity={opacity}
              stroke={isActive || isHovered ? def.accent : "transparent"}
              strokeWidth={isActive ? 2 : isHovered ? 1.5 : 0}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => onHover(def.id)} onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(def.id)} style={{ pointerEvents: "all" }}
            />
            <text
              x={r.x + r.w / 2} y={r.y + r.h / 2 + 1}
              textAnchor="middle" dominantBaseline="middle" fill="white"
              fontSize={r.w < 35 ? "7" : "9"} fontFamily="Inter,sans-serif" fontWeight="500"
              className="pointer-events-none select-none"
              opacity={isActive || isHovered ? 1 : 0.6}
            >
              {def.shortLabel}
            </text>
          </g>
        );
      })}

      {/* Interior wall dividers — HDB 3-Room Simplified (Corridor) */}
      {!_wasImported && <>
      {/* Kitchen right wall */}
      <line x1="69" y1="5" x2="69" y2="189" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Bath/Main-bed vertical divider */}
      <line x1="120" y1="5" x2="120" y2="148" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Bath2 / Bath1 horizontal divider */}
      <line x1="72" y1="53" x2="120" y2="53" stroke="#71717A" strokeWidth="0.8" opacity="0.3" />
      {/* Bath1 bottom wall */}
      <line x1="72" y1="104" x2="120" y2="104" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Corridor walls */}
      <line x1="72" y1="104" x2="72" y2="189" stroke="#71717A" strokeWidth="0.8" opacity="0.3" />
      <line x1="120" y1="148" x2="120" y2="224" stroke="#71717A" strokeWidth="0.8" opacity="0.3" />
      {/* Kitchen / Living horizontal divider */}
      <line x1="5" y1="189" x2="120" y2="189" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Main bedroom / Bedroom horizontal divider */}
      <line x1="120" y1="224" x2="195" y2="224" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Living / Bedroom vertical divider */}
      <line x1="104" y1="224" x2="104" y2="358" stroke="#71717A" strokeWidth="1" opacity="0.4" />
      {/* Store room walls */}
      <line x1="42" y1="152" x2="69" y2="152" stroke="#71717A" strokeWidth="0.8" opacity="0.3" />
      {/* Balcony top divider */}
      <line x1="5" y1="360" x2="195" y2="360" stroke="#71717A" strokeWidth="1" opacity="0.4" />

      {/* Door indicators */}
      {/* Bath2 door */}
      <line x1="88" y1="104" x2="98" y2="104" stroke="#09090B" strokeWidth="2" opacity="1" />
      {/* Bath1 door */}
      <line x1="88" y1="53" x2="98" y2="53" stroke="#09090B" strokeWidth="2" opacity="1" />
      {/* Main bedroom door */}
      <line x1="120" y1="120" x2="120" y2="132" stroke="#09090B" strokeWidth="2" opacity="1" />
      {/* Living room main entry (900mm, bottom-left) */}
      <line x1="12" y1="358" x2="26" y2="358" stroke="#09090B" strokeWidth="3" opacity="1" />
      {/* Bedroom door */}
      <line x1="108" y1="224" x2="118" y2="224" stroke="#09090B" strokeWidth="2" opacity="1" />
      {/* Store door */}
      <line x1="69" y1="160" x2="69" y2="170" stroke="#09090B" strokeWidth="2" opacity="1" />

      {/* 100mm DROP indicators for bathrooms */}
      <text x="74" y="100" fill="#FFEAB1" fontSize="4" fontFamily="Inter,sans-serif" fontWeight="600" opacity="0.7">100↓</text>
      <text x="74" y="50" fill="#FFEAB1" fontSize="4" fontFamily="Inter,sans-serif" fontWeight="600" opacity="0.7">100↓</text>
      
      {/* Dimensions label */}
      <text x="101" y="383" textAnchor="middle" dominantBaseline="middle" fill="#71717A" fontSize="5" fontFamily="Inter,sans-serif" fontWeight="500" opacity="0.4">
        6,100mm × 11,700mm — 64 sqm
      </text>
      </>}

      {/* Dynamic door/window indicators for imported plans */}
      {_wasImported && HOUSE_ROOM_DEFS.map((def) => {
        const r = roomRects[def.id];
        if (!r) return null;
        return (
          <g key={`dw-${def.id}`}>
            {(def.doors || []).map((door, di) => {
              const doorLen = Math.max(6, Math.min(14, door.w * (svgVBW / 10)));
              if (door.side === "north" || door.side === "south") {
                const y = door.side === "north" ? r.y : r.y + r.h;
                const x = r.x + door.t * r.w;
                return <line key={`d-${di}`} x1={x - doorLen / 2} y1={y} x2={x + doorLen / 2} y2={y} stroke="#FFEAB1" strokeWidth="2" opacity="0.8" />;
              }
              const x = door.side === "west" ? r.x : r.x + r.w;
              const y = r.y + door.t * r.h;
              return <line key={`d-${di}`} x1={x} y1={y - doorLen / 2} x2={x} y2={y + doorLen / 2} stroke="#FFEAB1" strokeWidth="2" opacity="0.8" />;
            })}
            {(def.windows || []).map((win, wi) => {
              const winLen = Math.max(6, Math.min(16, win.w * (svgVBW / 10)));
              if (win.side === "north" || win.side === "south") {
                const y = win.side === "north" ? r.y : r.y + r.h;
                const x = r.x + win.t * r.w;
                return <line key={`w-${wi}`} x1={x - winLen / 2} y1={y} x2={x + winLen / 2} y2={y} stroke="#6BA3BE" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2" />;
              }
              const x = win.side === "west" ? r.x : r.x + r.w;
              const y = r.y + win.t * r.h;
              return <line key={`w-${wi}`} x1={x} y1={y - winLen / 2} x2={x} y2={y + winLen / 2} stroke="#6BA3BE" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Room Selection Panel
   ═══════════════════════════════════════════════════════ */
function RoomSelectionPanel({
  activeHouseRoom, hoveredHouseRoom, houseViewMode,
  onSelectRoom, onHoverRoom, onViewHouse, onContinue,
}: {
  activeHouseRoom: string; hoveredHouseRoom: string | null; houseViewMode: "room" | "house";
  onSelectRoom: (id: string) => void; onHoverRoom: (id: string | null) => void;
  onViewHouse: () => void; onContinue: () => void;
}) {
  const activeRoomLabel = HOUSE_ROOM_DEFS.find((r) => r.id === activeHouseRoom)?.label || "Room";
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="size-[32px] rounded-full bg-[#F6F6F6] flex items-center justify-center">
            <Home className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
          </div>
          <h2 className="font-['Inter',sans-serif] text-[16px] font-bold text-[#09090B] tracking-[-0.5px]">
            Explore Rooms
          </h2>
        </div>
        <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] leading-relaxed pl-[42px]">
          Select a room to preview or edit in 3D
        </p>
        {/* Total area badge */}
        <div className="mt-3 ml-[42px] inline-flex items-center gap-1.5 bg-[#FFF6DC] border border-[#FFEAB1] rounded-[100px] px-3 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B] tracking-[-0.3px]">
            {HOUSE_ROOM_DEFS.length} rooms · {HOUSE_ROOM_DEFS.reduce((s, d) => s + (d.bounds[1] - d.bounds[0]) * (d.bounds[3] - d.bounds[2]), 0).toFixed(1)} m²
          </span>
        </div>
      </div>

      {/* Floor plan */}
      <div className="px-4 pb-4">
        <div className="bg-[#09090B] rounded-[14px] p-2.5 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <HouseFloorPlanSVG
            activeRoom={activeHouseRoom} hoveredRoom={hoveredHouseRoom}
            onHover={onHoverRoom} onSelect={onSelectRoom} viewMode={houseViewMode}
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-auto px-4 pb-3">
        <div className="flex flex-col gap-2">
          {HOUSE_ROOM_DEFS.map((def) => {
            const isActive = activeHouseRoom === def.id && houseViewMode === "room";
            const roomArea = ((def.bounds[1] - def.bounds[0]) * (def.bounds[3] - def.bounds[2])).toFixed(1);
            return (
              <button
                key={def.id}
                onClick={() => onSelectRoom(def.id)}
                onMouseEnter={() => onHoverRoom(def.id)}
                onMouseLeave={() => onHoverRoom(null)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] border transition-all duration-200 text-left group active:scale-[0.98] ${
                  isActive
                    ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    : "bg-white text-[#09090B] border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D0D0D0]"
                }`}
              >
                <div
                  className="size-[10px] rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                  style={{ backgroundColor: isActive ? "#FFFFFF" : def.accent }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] block">
                    {def.label}
                  </span>
                  <span className={`font-['Inter',sans-serif] text-[11px] block ${isActive ? "text-white/50" : "text-[#ABABAB]"}`}>
                    {roomArea} m²
                  </span>
                </div>
                <ChevronRight
                  className={`size-[15px] transition-all duration-200 ${
                    isActive ? "text-white opacity-100 translate-x-0" : "text-[#ABABAB] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                  }`}
                  strokeWidth={2}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-4 pb-5 pt-3 border-t border-[#F3F4F6] flex flex-col gap-2.5">
        <button
          onClick={onViewHouse}
          className={`flex items-center justify-center gap-2 h-[44px] rounded-[100px] border font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] transition-all duration-200 ${
            houseViewMode === "house"
              ? "bg-[#09090B] text-white border-[#09090B] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
              : "bg-[#F6F6F6] text-[#09090B] border-[#E5E7EB] hover:bg-[#F0F0F0]"
          }`}
        >
          <Layers className="size-[15px]" strokeWidth={1.5} />
          {houseViewMode === "house" ? "Viewing Entire House" : "View Entire House"}
        </button>
        {/* Double-layer pill CTA */}
        <div className="bg-[#F6F6F6] border border-white rounded-[100px] p-[5px]">
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2.5 h-[48px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[15px] font-medium tracking-[-0.7px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-opacity"
          >
            Edit {activeRoomLabel}
            <ArrowRight className="size-[16px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Room Name Floating Label
   ═══════════════════════════════════════════════════════ */
function RoomLabel({ label, accent }: { label: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-20 md:top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
    >
      <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-white/50 px-5 py-2.5 flex items-center gap-2.5">
        <div className="size-[8px] rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <span className="font-['Inter',sans-serif] text-[13px] font-semibold text-[#09090B] tracking-[-0.4px] whitespace-nowrap">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Selected Item Bar (bottom floating)
   ═══════════════════════════════════════════════════════ */
function SelectedItemBar({ item, onRotate, onDelete, onDeselect, isOverlapping }: { item: PlacedItem; onRotate: () => void; onDelete: () => void; onDeselect: () => void; isOverlapping: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-32 md:bottom-16 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-32px)] max-w-[400px]">
      <div className={`hidden md:flex rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] px-5 py-3 items-center gap-3 transition-all duration-200 border ${
        isOverlapping ? "bg-white border-red-200" : "bg-white border-[#F3F4F6]"
      }`}>
        <div className="pr-3 border-r border-[#F3F4F6] flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`size-[8px] rounded-full shrink-0 ${isOverlapping ? "bg-red-500" : "bg-[#09090B]"}`} />
            <span className="font-['Inter',sans-serif] text-[14px] font-bold text-[#09090B] tracking-[-0.5px] truncate">{item.name}</span>
          </div>
          {isOverlapping ? (
            <span className="font-['Inter',sans-serif] text-[11px] text-red-500 flex items-center gap-1 pl-4">
              Overlapping another item
            </span>
          ) : (
            <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] flex items-center gap-1.5 pl-4">
              <Move className="size-[10px]" strokeWidth={2} /> Drag to reposition
            </span>
          )}
        </div>
        <button onClick={onRotate} className="size-[36px] md:size-[34px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors shrink-0 active:scale-90" title="Rotate 45°">
          <RotateCw className="size-[15px] text-[#09090B]" strokeWidth={1.5} />
        </button>
        <button onClick={onDelete} className="size-[36px] md:size-[34px] rounded-full bg-[#F6F6F6] hover:bg-red-50 flex items-center justify-center transition-colors group shrink-0 active:scale-90" title="Delete">
          <Trash2 className="size-[15px] text-[#71717A] group-hover:text-red-500" strokeWidth={1.5} />
        </button>
        <button onClick={onDeselect} className="size-[36px] md:size-[34px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors shrink-0 active:scale-90" title="Deselect">
          <X className="size-[15px] text-[#71717A]" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Opening Action Menu — 3D Door/Window Click Popup
   Shows Flip + Delete when a door/window is clicked
   ═══════════════════════════════════════════════════════ */
function OpeningActionMenu({
  opening,
  sceneRef,
  viewportRef,
  onFlip,
  onDelete,
  onDeselect,
}: {
  opening: { roomId: string; type: "door" | "window"; index: number; side: string };
  sceneRef: React.RefObject<ThreeSceneRef | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onFlip: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}) {
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [clampedX, setClampedX] = useState<number>(0);

  useEffect(() => {
    const s = sceneRef.current;
    const vp = viewportRef.current;
    if (!s || !vp) return;

    let rafId: number;
    const update = () => {
      // Find the opening group in the scene
      let openingGroup: THREE.Group | null = null;
      s.houseRoomGroups.forEach((rg) => {
        rg.children.forEach((child) => {
          if (
            child.userData.openingType === opening.type &&
            child.userData.openingRoomId === opening.roomId &&
            child.userData.openingIndex === opening.index
          ) {
            openingGroup = child as THREE.Group;
          }
        });
      });

      if (!openingGroup) { setScreenPos(null); rafId = requestAnimationFrame(update); return; }

      const pos3d = new THREE.Vector3();
      (openingGroup as THREE.Group).getWorldPosition(pos3d);
      pos3d.y = 3.8; // far above the opening to avoid blocking it
      pos3d.project(s.camera);
      const rect = vp.getBoundingClientRect();
      const x = ((pos3d.x + 1) / 2) * rect.width;
      const y = ((-pos3d.y + 1) / 2) * rect.height;
      if (pos3d.z < 1) {
        setScreenPos({ x, y });
        // Clamp X so popup stays fully visible within viewport on mobile
        const pad = 8;
        const popupW = popupRef.current?.offsetWidth ?? 180;
        const halfW = popupW / 2;
        let cx = x;
        if (cx - halfW < pad) cx = pad + halfW;
        if (cx + halfW > rect.width - pad) cx = rect.width - pad - halfW;
        setClampedX(cx);
      } else {
        setScreenPos(null);
      }
      rafId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafId);
  }, [opening, sceneRef, viewportRef]);

  if (!screenPos) return null;

  const typeName = opening.type === "door" ? "Door" : "Window";

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.7, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute z-50 pointer-events-auto"
      style={{ left: clampedX, top: screenPos.y - 80, transform: "translate(-50%, -100%)" }}
    >
      <div className="bg-white rounded-[14px] border border-[#F3F4F6] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-1.5 flex items-center gap-1">
        {/* Flip button */}
        <button
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] hover:bg-[#F6F6F6] transition-colors group active:scale-95"
          title={`Flip ${typeName}`}
        >
          <FlipHorizontal2 className="size-[16px] text-[#09090B]" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-[#09090B] font-['Inter',sans-serif] tracking-[-0.3px]">Flip</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#F3F4F6]" />

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] hover:bg-red-50 transition-colors group active:scale-95"
          title={`Delete ${typeName}`}
        >
          <Trash2 className="size-[16px] text-[#71717A] group-hover:text-red-500 transition-colors" strokeWidth={1.5} />
          <span className="text-[13px] font-medium text-[#71717A] group-hover:text-red-500 transition-colors font-['Inter',sans-serif] tracking-[-0.3px]">Delete</span>
        </button>
      </div>

      {/* Arrow pointer */}
      <div className="flex justify-center -mt-[1px]">
        <div className="w-2.5 h-2.5 bg-white border-r border-b border-[#F3F4F6] rotate-45 -translate-y-1.5" />
      </div>

      {/* Label */}
      <div className="flex justify-center mt-1">
        <div className="bg-[#09090B] text-white font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] px-3 py-1 rounded-[100px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {typeName} · {opening.side.charAt(0).toUpperCase() + opening.side.slice(1)} wall
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Opening Drag Overlay — Snap guides + Dimension labels
   Shown while dragging a door/window in 3D
   ═══════════════════════════════════════════════════════ */
function OpeningDragOverlayUI({
  info,
}: {
  info: {
    screenX: number; screenY: number;
    distLeft: number; distRight: number;
    wallLength: number; side: string;
    snapT: number | null;
    snapScreenPositions: { x: number; y: number }[];
  };
}) {
  const SNAP_T_VALUES = [0.25, 0.5, 0.75];
  const SNAP_LABELS = ["¼", "½", "¾"];

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {/* Snap guide lines */}
      {info.snapScreenPositions.map((pos, i) => (
        <div
          key={`snap-${i}`}
          className={`absolute transition-opacity duration-150 ${info.snapT === SNAP_T_VALUES[i] ? "opacity-100" : "opacity-30"}`}
          style={{ left: pos.x, top: 0, width: 0, height: "100%" }}
        >
          <div
            className={`absolute left-0 top-0 h-full border-l border-dashed ${
              info.snapT === SNAP_T_VALUES[i] ? "border-blue-500" : "border-[#B0B0B0]"
            }`}
          />
          {/* Snap label */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-3 px-1.5 py-0.5 rounded text-[10px] font-medium font-['Inter',sans-serif] ${
              info.snapT === SNAP_T_VALUES[i]
                ? "bg-blue-500 text-white"
                : "bg-[#F6F6F6] text-[#71717A]"
            }`}
          >
            {SNAP_LABELS[i]}
          </div>
        </div>
      ))}

      {/* Dimension label — floating near the opening */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute"
        style={{ left: info.screenX, top: info.screenY - 50, transform: "translate(-50%, -100%)" }}
      >
        <div className="bg-[#09090B] text-white font-['Inter',sans-serif] text-[12px] font-semibold tracking-[-0.3px] px-3 py-1.5 rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.25)] whitespace-nowrap flex items-center gap-2">
          <span className="text-[#B0B0B0] text-[10px]">←</span>
          <span>{(info.distLeft * 100).toFixed(0)}cm</span>
          <span className="text-[#71717A]">|</span>
          <span>{(info.distRight * 100).toFixed(0)}cm</span>
          <span className="text-[#B0B0B0] text-[10px]">→</span>
        </div>
      </motion.div>

      {/* Snapped indicator */}
      {info.snapT !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute"
          style={{ left: info.screenX, top: info.screenY + 20, transform: "translate(-50%, 0)" }}
        >
          <div className="bg-blue-500 text-white font-['Inter',sans-serif] text-[10px] font-bold px-2 py-0.5 rounded-[100px] shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
            SNAPPED
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Radial Action Menu — 3D Object Selection Popup
   Appears around selected furniture in 3D view
   ═══════════════════════════════════════════════════════ */
function RadialActionMenu({
  item,
  sceneRef,
  viewportRef,
  onRotate,
  onDuplicate,
  onDelete,
}: {
  item: PlacedItem;
  sceneRef: React.RefObject<ThreeSceneRef | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [screenPos, setScreenPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const s = sceneRef.current;
    const vp = viewportRef.current;
    if (!s || !vp) return;

    let rafId: number;
    const update = () => {
      const pos3d = new THREE.Vector3(
        item.position[0],
        item.position[1] + item.dimensions[1] * 0.5,
        item.position[2],
      );
      pos3d.project(s.camera);
      const rect = vp.getBoundingClientRect();
      const x = ((pos3d.x + 1) / 2) * rect.width;
      const y = ((-pos3d.y + 1) / 2) * rect.height;
      if (pos3d.z < 1) {
        setScreenPos({ x, y });
      } else {
        setScreenPos(null);
      }
      rafId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafId);
  }, [item, sceneRef, viewportRef]);

  if (!screenPos) return null;

  const actions = [
    { icon: RotateCw, label: "Rotate", shortcut: "R", onClick: onRotate, danger: false },
    { icon: Copy, label: "Duplicate", shortcut: "⌘D", onClick: onDuplicate, danger: false },
    { icon: Trash2, label: "Delete", shortcut: "Del", onClick: onDelete, danger: true },
  ];

  const radius = 64;
  const startAngle = -150;
  const endAngle = -30;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute z-40 pointer-events-none"
      style={{ left: screenPos.x, top: screenPos.y, transform: "translate(-50%, -50%)" }}
    >
      {actions.map((action, i) => {
        const angle =
          ((startAngle +
            ((endAngle - startAngle) / (actions.length - 1)) * i) *
            Math.PI) /
          180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
              delay: i * 0.04,
            }}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className={`absolute pointer-events-auto size-[46px] rounded-full bg-white border border-[#F3F4F6] shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all duration-200 active:scale-90 group ${
              action.danger
                ? "hover:bg-red-50 hover:border-red-200"
                : "hover:bg-[#F6F6F6] hover:border-[#E5E7EB]"
            }`}
            style={{ left: -23, top: -23 }}
            title={`${action.label} (${action.shortcut})`}
          >
            <action.icon
              className={`size-[18px] transition-colors duration-200 ${
                action.danger
                  ? "text-[#71717A] group-hover:text-red-500"
                  : "text-[#09090B]"
              }`}
              strokeWidth={1.5}
            />
          </motion.button>
        );
      })}

      {/* Center label pill */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: radius + 20 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: 0.1,
        }}
        className="absolute pointer-events-none left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        <div className="bg-[#09090B] text-white font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] px-3 py-1.5 rounded-[100px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {item.name}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Editor — Qanvast/Wizlab Layout
   ═══════════════════════════════════════════════════════ */
export function FloorPlan3DEditor({ mode = "project" }: { mode?: "project" | "template" }) {
  const isTemplateMode = mode === "template";

  // ═══ Reset module-level state on each fresh mount ═══
  // Prevents stale HOUSE_ROOM_DEFS / _wasImported from previous SPA navigations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editorMountId] = useState(() => {
    const id = ++_lastEditorMountId;
    // Reset to factory defaults — the load-project/import/scratch logic below will override as needed
    HOUSE_ROOM_DEFS = JSON.parse(JSON.stringify(_DEFAULT_HOUSE_ROOM_DEFS));
    ROOMS = [..._DEFAULT_ROOMS];
    HOUSE_CAM_POS = [..._DEFAULT_CAM_POS] as [number, number, number];
    HOUSE_CAM_TARGET = [..._DEFAULT_CAM_TARGET] as [number, number, number];
    _wasImported = false;
    _sharedWallCache = null;
    console.log(`[FloorPlan3D] Mount #${id} — reset module-level state to defaults`);
    return id;
  });

  // ═══ Load Imported Floor Plan (must run before any useState that reads HOUSE_ROOM_DEFS) ═══
  // useState lazy initializer runs exactly once per mount, AFTER the dashboard stored data.
  // ═══ Detect "Start from scratch" mode — clear all default rooms ═══
  const [isScratchMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("scratch") === "true") {
      console.log("[FloorPlan3D] Starting from scratch — blank canvas");
      HOUSE_ROOM_DEFS = [];
      ROOMS = [];
      _wasImported = true; // treat as custom so defaults aren't re-applied
      _sharedWallCache = null;
      HOUSE_CAM_POS = [6, 10, 6];
      HOUSE_CAM_TARGET = [0, 0, 0];
      return true;
    }
    return false;
  });

  const [importedPlanName] = useState<string | null>(() => {
    if (isScratchMode) return null; // skip import detection in scratch mode
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("import") !== "image") return null;

      const imported = retrieveAnalysis();
      if (!imported?.defs || imported.defs.length === 0) return null;

      // Mutate the module-level HOUSE_ROOM_DEFS so all references pick it up
      HOUSE_ROOM_DEFS = imported.defs.map((d: ParsedHouseRoomDef) => ({
        ...d,
        defaultMaterials: d.defaultMaterials as SceneMaterials,
        defaultLighting: d.defaultLighting as SceneLighting,
      }));

      // Adjust camera for the imported plan's total bounds
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const def of HOUSE_ROOM_DEFS) {
        if (def.bounds[0] < minX) minX = def.bounds[0];
        if (def.bounds[1] > maxX) maxX = def.bounds[1];
        if (def.bounds[2] < minZ) minZ = def.bounds[2];
        if (def.bounds[3] > maxZ) maxZ = def.bounds[3];
      }
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const span = Math.max(maxX - minX, maxZ - minZ);
      HOUSE_CAM_POS = [cx + span * 0.8, span * 1.3, cz + span * 0.8];
      HOUSE_CAM_TARGET = [cx, 0, cz];

      // Update module-level derived data
      _wasImported = true;
      _sharedWallCache = null; // invalidate shared wall cache
      ROOMS = HOUSE_ROOM_DEFS.map((d) => d.label);

      const name = `Imported Plan (${imported.defs.length} rooms)`;
      console.log(`[FloorPlan3D] Loaded imported plan with ${imported.defs.length} rooms`);
      // Clean up sessionStorage now that we've consumed the data
      clearStoredAnalysis();
      return name;
    } catch (e) {
      console.warn("[FloorPlan3D] Failed to load imported floor plan:", e);
      return null;
    }
  });

  const navigate = useNavigate();
  const params = useParams<{ projectId: string; templateId: string }>();
  const urlProjectId = isTemplateMode ? params.templateId : params.projectId;
  const [leftPanel, setLeftPanel] = useState<LeftPanel>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTopView, setIsTopView] = useState(false);

  // ═══ Save State ═══
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [screenshotToast, setScreenshotToast] = useState(false);
  const [sceneLoading, setSceneLoading] = useState(true);
  // Track whether project data has been loaded — prevents initial flash of default template
  const [projectDataLoaded, setProjectDataLoaded] = useState(!urlProjectId);
  const pendingNavigationRef = useRef<string | null>(null);

  // ═══ Safety timeout: force-clear "Building 3D Scene" overlay after 8 seconds max ═══
  useEffect(() => {
    if (!sceneLoading) return;
    const safetyTimer = setTimeout(() => {
      console.warn("[FloorPlan3D] Safety timeout — force-clearing sceneLoading after 8s");
      setSceneLoading(false);
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, [sceneLoading]);

  // ═══ Template Metadata (only used in template mode) ═══
  const [templateCategory, setTemplateCategory] = useState("bto");
  const [templateUnitType, setTemplateUnitType] = useState("3-Room");
  const [templateDescription, setTemplateDescription] = useState("");
  const [showTemplateMetaModal, setShowTemplateMetaModal] = useState(false);
  const [templateThumbnail, setTemplateThumbnail] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sceneRefForHotspots = useRef<ThreeSceneRef | null>(null);
  const roomClickRef = useRef<((roomId: string) => void) | null>(null);
  const prevRoomOpeningsRef = useRef<Map<string, string>>(new Map());
  const prevRoomBoundsRef = useRef<Map<string, string>>(new Map());
  const activeEditorRoomIdRef = useRef(HOUSE_ROOM_DEFS[0]?.id || "living");

  // ═══ Room Selection State ═══
  const [viewMode, setViewMode] = useState<"room-select" | "editor">("editor");
  const [activeHouseRoom, setActiveHouseRoom] = useState(HOUSE_ROOM_DEFS[0]?.id || "living");
  const [hoveredHouseRoom, setHoveredHouseRoom] = useState<string | null>(null);
  const [houseViewMode, setHouseViewMode] = useState<"room" | "house">("house");
  const [activeEditorRoomId, setActiveEditorRoomId] = useState(HOUSE_ROOM_DEFS[0]?.id || "living");
  useEffect(() => { activeEditorRoomIdRef.current = activeEditorRoomId; }, [activeEditorRoomId]);

  // Per-room furniture storage
  const [allRoomFurniture, setAllRoomFurnitureRaw] = useState<Record<string, PlacedItem[]>>(buildInitialRoomFurniture);
  const allRoomFurnitureRef = useRef(allRoomFurniture);
  useEffect(() => { allRoomFurnitureRef.current = allRoomFurniture; }, [allRoomFurniture]);

  // ═══ Undo / Redo History ═══
  const undoStackRef = useRef<Record<string, PlacedItem[]>[]>([]);
  const redoStackRef = useRef<Record<string, PlacedItem[]>[]>([]);
  const isUndoRedoRef = useRef(false);
  const MAX_HISTORY = 50;

  const setAllRoomFurniture = useCallback((updater: Record<string, PlacedItem[]> | ((prev: Record<string, PlacedItem[]>) => Record<string, PlacedItem[]>)) => {
    setAllRoomFurnitureRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (!isUndoRedoRef.current) {
        undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), prev];
        redoStackRef.current = [];
      }
      return next;
    });
    setIsDirty(true);
  }, []);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  // ═══ 2D/3D mode — declared early so effective undo/redo can reference it ═══
  const [is2DMode, setIs2DMode] = useState(true);

  // 2D editor undo/redo state (reported via callback)
  const [editor2DUndoRedo, setEditor2DUndoRedo] = useState<{
    canUndo: boolean; canRedo: boolean; doUndo: () => void; doRedo: () => void;
  }>({ canUndo: false, canRedo: false, doUndo: () => {}, doRedo: () => {} });

  const handleEditor2DUndoRedoChange = useCallback((cUndo: boolean, cRedo: boolean, doUndo: () => void, doRedo: () => void) => {
    setEditor2DUndoRedo({ canUndo: cUndo, canRedo: cRedo, doUndo, doRedo });
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    isUndoRedoRef.current = true;
    setAllRoomFurnitureRaw((current) => {
      const prev = undoStackRef.current[undoStackRef.current.length - 1];
      undoStackRef.current = undoStackRef.current.slice(0, -1);
      redoStackRef.current = [...redoStackRef.current, current];
      return prev;
    });
    setSelectedId(null);
    isUndoRedoRef.current = false;
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    isUndoRedoRef.current = true;
    setAllRoomFurnitureRaw((current) => {
      const next = redoStackRef.current[redoStackRef.current.length - 1];
      redoStackRef.current = redoStackRef.current.slice(0, -1);
      undoStackRef.current = [...undoStackRef.current, current];
      return next;
    });
    setSelectedId(null);
    isUndoRedoRef.current = false;
  }, []);

  // Keyboard shortcuts — uses ref to avoid dependency ordering issues
  const keyHandlersRef = useRef<Record<string, Function>>({});
  // Updated below after all handler definitions

  const placedItems = allRoomFurniture[activeEditorRoomId] || [];
  const setPlacedItems = useCallback((updater: PlacedItem[] | ((prev: PlacedItem[]) => PlacedItem[])) => {
    setAllRoomFurniture((prev) => ({
      ...prev,
      [activeEditorRoomId]: typeof updater === "function" ? updater(prev[activeEditorRoomId] || []) : updater,
    }));
  }, [activeEditorRoomId, setAllRoomFurniture]);

  const [isDragging, setIsDragging] = useState(false);
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"furniture" | "customize" | "rooms" | null>(null);
  const [mobile3dFabOpen, setMobile3dFabOpen] = useState(false);
  
  // Mobile Bottom Nav state
  const [mobileActiveTool, setMobileActiveTool] = useState<EditorTool>("select");
  const toolChangeRef = useRef<((tool: EditorTool) => void) | null>(null);

  // Handle tool changes from MobileBottomNav → Editor2DView
  const handleMobileToolChange = useCallback((tool: EditorTool) => {
    setMobileActiveTool(tool);
    toolChangeRef.current?.(tool);
  }, []);

  // Handle tool changes reported from Editor2DView → sync to mobile nav
  const handleActiveToolReport = useCallback((tool: EditorTool) => {
    setMobileActiveTool(tool);
  }, []);

  const [houseName, setHouseName] = useState(importedPlanName || (isTemplateMode ? "Untitled Template" : isScratchMode ? "Untitled Floor Plan" : "HDB 3-Room Simplified"));
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [materials, setMaterials] = useState<SceneMaterials>({ walls: "Subway Tile", floors: "Porcelain Tile (White)", ceiling: "Flat White" });
  const [lighting, setLighting] = useState<SceneLighting>({ timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: true, accentLight: false, underCabinet: false });
  const [globalTimeOfDay, setGlobalTimeOfDay] = useState(14); // Global — not per-room

  // ═══ New Feature States ═══
  // (is2DMode declared earlier, near canUndo/canRedo)

  // Effective undo/redo for nav bar (switches between 2D and 3D)
  const effectiveCanUndo = is2DMode ? editor2DUndoRedo.canUndo : canUndo;
  const effectiveCanRedo = is2DMode ? editor2DUndoRedo.canRedo : canRedo;
  const effectiveUndo = is2DMode ? editor2DUndoRedo.doUndo : handleUndo;
  const effectiveRedo = is2DMode ? editor2DUndoRedo.doRedo : handleRedo;

  const [active3DTool, setActive3DTool] = useState<Editor3DTool>("select");
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showRenderMode, setShowRenderMode] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-room materials & lighting storage (survives room switches and save/load)
  const perRoomMaterialsRef = useRef<Record<string, SceneMaterials>>({});
  const perRoomLightingRef = useRef<Record<string, SceneLighting>>({});

  // Per-room floor color overrides for 2D view (derived from material changes)
  const [roomFloorColors, setRoomFloorColors] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const def of HOUSE_ROOM_DEFS) {
      const matFloor = def.defaultMaterials?.floors;
      if (matFloor && MATERIAL_DEFS.floors[matFloor]) {
        map[def.id] = MATERIAL_DEFS.floors[matFloor];
      } else {
        map[def.id] = def.floorColor;
      }
    }
    return map;
  });

  // Scene rebuild key — increment to force 3D scene rebuild (e.g. after loading different room defs)
  const [sceneRebuildKey, setSceneRebuildKey] = useState(0);

  const handleMoveItem = useCallback((id: string, x: number, z: number) => {
    setPlacedItems((prev) => prev.map((i) => i.id === id ? { ...i, position: [x, i.position[1], z] as [number, number, number] } : i));
  }, [setPlacedItems]);

  // ═══ Cross-room furniture move: transfer item between rooms + auto-switch ═══
  const handleSwitchEditorRoomRef = useRef<((def: HouseRoomDef) => void) | null>(null);
  const handleMoveItemToRoom = useCallback((id: string, x: number, z: number, targetRoomId: string) => {
    // 1. Transfer item from active room → target room in state
    setAllRoomFurniture((prev) => {
      const fromItems = prev[activeEditorRoomId] || [];
      const item = fromItems.find((i) => i.id === id);
      if (!item) return prev;
      const movedItem = { ...item, position: [x, item.position[1], z] as [number, number, number] };
      return {
        ...prev,
        [activeEditorRoomId]: fromItems.filter((i) => i.id !== id),
        [targetRoomId]: [...(prev[targetRoomId] || []), movedItem],
      };
    });

    // 2. Deselect the moved item
    setSelectedId(null);

    // 3. Auto-switch to the target room so the moved item becomes editable there
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === targetRoomId);
    if (def) {
      // Small delay so the state transfer propagates before the room switch
      setTimeout(() => {
        handleSwitchEditorRoomRef.current?.(def);
      }, 60);
    }
  }, [activeEditorRoomId, setAllRoomFurniture, setSelectedId]);

  // Stable callback that reads from ref (avoids hook ordering issues)
  const handleRoomClickIn3D = useCallback((roomId: string) => {
    roomClickRef.current?.(roomId);
  }, []);

  // ═══ Opening (door/window) move in 3D — updates HOUSE_ROOM_DEFS, rebuilds 3D, syncs to 2D ═══
  const [openingsVersion, setOpeningsVersion] = useState(0);
  const handleOpeningMove = useCallback((roomId: string, type: "door" | "window", index: number, newT: number) => {
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
    if (!def) return;

    // Update HOUSE_ROOM_DEFS in place
    if (type === "door" && def.doors[index]) {
      def.doors[index] = { ...def.doors[index], t: newT };
    } else if (type === "window" && (def.windows || [])[index]) {
      def.windows[index] = { ...def.windows[index], t: newT };
    }

    // Rebuild the 3D room openings (walls + doors + windows)
    const s = sceneRefForHotspots.current;
    if (s) {
      const rg = s.houseRoomGroups.get(roomId);
      if (rg) {
        rebuildRoomOpenings(rg, def.bounds, def.doors, def.windows || [], def.wallColor, roomId);
        // Also rebuild neighbor rooms whose shared walls may have this opening
        const sharedData = getSharedWallData();
        const wd = sharedData.get(roomId);
        if (wd) {
          for (const neighbors of wd.neighbors.values()) {
            for (const n of neighbors) {
              const neighborDef = HOUSE_ROOM_DEFS.find((r) => r.id === n.neighborId);
              const neighborGrp = s.houseRoomGroups.get(n.neighborId);
              if (neighborDef && neighborGrp) {
                rebuildRoomOpenings(neighborGrp, neighborDef.bounds, neighborDef.doors, neighborDef.windows || [], neighborDef.wallColor, n.neighborId);
              }
            }
          }
        }
      }
    }

    // Bump version to trigger 2D editor re-sync
    setOpeningsVersion((v) => v + 1);
    setIsDirty(true);
  }, []);

  // ═══ Selected Opening State (click popup) ═══
  interface SelectedOpeningInfo {
    roomId: string;
    type: "door" | "window";
    index: number;
    side: string;
  }
  const [selectedOpening, setSelectedOpening] = useState<SelectedOpeningInfo | null>(null);

  // Opening drag overlay info (dimension labels + snap guides)
  interface OpeningDragOverlay {
    screenX: number; screenY: number;
    distLeft: number; distRight: number;
    wallLength: number;
    side: string;
    snapT: number | null;
    snapScreenPositions: { x: number; y: number }[];
  }
  const [openingDragOverlay, setOpeningDragOverlay] = useState<OpeningDragOverlay | null>(null);

  // Handle opening selection from 3D (click without drag)
  const handleOpeningSelect = useCallback((roomId: string, type: "door" | "window", index: number, side: string) => {
    setSelectedOpening({ roomId, type, index, side });
    setSelectedId(null); // deselect furniture
  }, [setSelectedId]);

  // Clear opening popup when furniture gets selected
  useEffect(() => {
    if (selectedId) setSelectedOpening(null);
  }, [selectedId]);

  // Clear opening popup when switching to 2D
  useEffect(() => {
    if (is2DMode) { setSelectedOpening(null); setOpeningDragOverlay(null); }
  }, [is2DMode]);

  // Flip opening direction
  const handleFlipOpening = useCallback(() => {
    if (!selectedOpening) return;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === selectedOpening.roomId);
    if (!def) return;

    if (selectedOpening.type === "door") {
      const door = def.doors[selectedOpening.index];
      if (!door) return;
      // Flip = toggle hinge side (left ↔ right) so door swings the other way
      def.doors[selectedOpening.index] = { ...door, flipped: !door.flipped };
    } else {
      const win = (def.windows || [])[selectedOpening.index];
      if (!win) return;
      // For windows, flip mirrors position on the wall
      def.windows[selectedOpening.index] = { ...win, t: 1 - win.t };
    }

    // Rebuild 3D
    const s = sceneRefForHotspots.current;
    if (s) {
      const rg = s.houseRoomGroups.get(selectedOpening.roomId);
      if (rg) {
        rebuildRoomOpenings(rg, def.bounds, def.doors, def.windows || [], def.wallColor, selectedOpening.roomId);
        const sharedData = getSharedWallData();
        const wd = sharedData.get(selectedOpening.roomId);
        if (wd) {
          for (const neighbors of wd.neighbors.values()) {
            for (const n of neighbors) {
              const neighborDef = HOUSE_ROOM_DEFS.find((r) => r.id === n.neighborId);
              const neighborGrp = s.houseRoomGroups.get(n.neighborId);
              if (neighborDef && neighborGrp) {
                rebuildRoomOpenings(neighborGrp, neighborDef.bounds, neighborDef.doors, neighborDef.windows || [], neighborDef.wallColor, n.neighborId);
              }
            }
          }
        }
      }
    }
    setOpeningsVersion((v) => v + 1);
    setIsDirty(true);
  }, [selectedOpening]);

  // Delete opening
  const handleDeleteOpening = useCallback(() => {
    if (!selectedOpening) return;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === selectedOpening.roomId);
    if (!def) return;

    if (selectedOpening.type === "door") {
      def.doors = def.doors.filter((_, i) => i !== selectedOpening.index);
    } else {
      def.windows = (def.windows || []).filter((_, i) => i !== selectedOpening.index);
    }

    // Rebuild 3D
    const s = sceneRefForHotspots.current;
    if (s) {
      const rg = s.houseRoomGroups.get(selectedOpening.roomId);
      if (rg) {
        rebuildRoomOpenings(rg, def.bounds, def.doors, def.windows || [], def.wallColor, selectedOpening.roomId);
        const sharedData = getSharedWallData();
        const wd = sharedData.get(selectedOpening.roomId);
        if (wd) {
          for (const neighbors of wd.neighbors.values()) {
            for (const n of neighbors) {
              const neighborDef = HOUSE_ROOM_DEFS.find((r) => r.id === n.neighborId);
              const neighborGrp = s.houseRoomGroups.get(n.neighborId);
              if (neighborDef && neighborGrp) {
                rebuildRoomOpenings(neighborGrp, neighborDef.bounds, neighborDef.doors, neighborDef.windows || [], neighborDef.wallColor, n.neighborId);
              }
            }
          }
        }
      }
    }
    setSelectedOpening(null);
    setOpeningsVersion((v) => v + 1);
    setIsDirty(true);
  }, [selectedOpening]);

  useThreeScene(viewportRef, placedItems, selectedId, materials, lighting, setSelectedId, handleMoveItem, handleMoveItemToRoom, setIsDragging, setIsOverlapping, sceneRefForHotspots, handleRoomClickIn3D, sceneRebuildKey, !projectDataLoaded, activeEditorRoomId, globalTimeOfDay, handleOpeningMove, handleOpeningSelect, setOpeningDragOverlay, setSelectedOpening);

  // ═══ Load project/template data on mount ═══
  useEffect(() => {
    if (!urlProjectId) return;
    const loadProject = async () => {
      try {
        const headers = await getEditorAuthHeaders();
        const endpoint = isTemplateMode
          ? `${API}/fp3d/templates/${urlProjectId}`
          : `${API}/fp3d/projects/${urlProjectId}`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
          console.error("[Editor] Failed to load " + (isTemplateMode ? "template" : "project") + ":", res.status);
          return;
        }
        let data;
        try { data = await res.json(); } catch { console.error("[Editor] Invalid JSON in response"); return; }
        const project = isTemplateMode ? data.template : data.project;
        if (isTemplateMode && project?.name) setHouseName(project.name);
        else if (project?.title) setHouseName(project.title);
        // ═══ Restore template metadata ═══
        if (isTemplateMode && project) {
          if (project.category) setTemplateCategory(project.category);
          if (project.unitType) setTemplateUnitType(project.unitType);
          if (project.description) setTemplateDescription(project.description);
          if (project.thumbnailUrl) setTemplateThumbnail(project.thumbnailUrl);
        }
        if (project?.projectData) {
          const pd = project.projectData;

          // ═══ Restore room definitions first (critical for imported plans) ═══
          // If roomDefinitions is explicitly an empty array, this is a "scratch" project — keep blank
          if (pd.roomDefinitions && Array.isArray(pd.roomDefinitions) && pd.roomDefinitions.length === 0) {
            console.log("[Editor] Scratch project detected — keeping blank canvas");
            HOUSE_ROOM_DEFS = [];
            ROOMS = [];
            _wasImported = true;
            _sharedWallCache = null;
            setSceneLoading(true);
            setSceneRebuildKey((k) => k + 1);
          } else if (pd.roomDefinitions && Array.isArray(pd.roomDefinitions) && pd.roomDefinitions.length > 0) {
            // Skip rebuild if sessionStorage import already loaded the same defs (avoids double-rebuild)
            const alreadyLoaded = importedPlanName && _wasImported
              && HOUSE_ROOM_DEFS.length === pd.roomDefinitions.length
              && HOUSE_ROOM_DEFS[0]?.id === pd.roomDefinitions[0]?.id;

            if (!alreadyLoaded) {
              console.log("[Editor] Restoring saved room definitions:", pd.roomDefinitions.length, "rooms");
              HOUSE_ROOM_DEFS = pd.roomDefinitions.map((d: any) => ({
                ...d,
                defaultMaterials: d.defaultMaterials as SceneMaterials,
                defaultLighting: d.defaultLighting as SceneLighting,
              }));
              _wasImported = true;
              _sharedWallCache = null; // invalidate shared wall cache
              ROOMS = HOUSE_ROOM_DEFS.map((d) => d.label);

              // Update camera for the restored plan's bounds
              let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
              for (const def of HOUSE_ROOM_DEFS) {
                if (def.bounds[0] < minX) minX = def.bounds[0];
                if (def.bounds[1] > maxX) maxX = def.bounds[1];
                if (def.bounds[2] < minZ) minZ = def.bounds[2];
                if (def.bounds[3] > maxZ) maxZ = def.bounds[3];
              }
              const cx = (minX + maxX) / 2;
              const cz = (minZ + maxZ) / 2;
              const span = Math.max(maxX - minX, maxZ - minZ);
              HOUSE_CAM_POS = [cx + span * 0.8, span * 1.3, cz + span * 0.8];
              HOUSE_CAM_TARGET = [cx, 0, cz];

              // Force 3D scene rebuild with the new room definitions
              setSceneLoading(true);
              setSceneRebuildKey((k) => k + 1);
            } else {
              console.log("[Editor] Room definitions already loaded from sessionStorage, skipping rebuild");
            }

            // Update active room IDs to match loaded definitions (always do this)
            const firstRoomId = HOUSE_ROOM_DEFS[0]?.id;
            if (firstRoomId) {
              setActiveHouseRoom(firstRoomId);
              setActiveEditorRoomId(firstRoomId);
            }
          }

          // ═══ Restore furniture ═══
          if (pd.furniture && typeof pd.furniture === "object") {
            console.log("[Editor] Restoring furniture for rooms:", Object.keys(pd.furniture));
            const furnitureRoomIds = Object.keys(pd.furniture);
            const totalItems = furnitureRoomIds.reduce((sum, rid) => sum + (Array.isArray(pd.furniture[rid]) ? pd.furniture[rid].length : 0), 0);
            console.log("[Editor] Total furniture items:", totalItems);
            setAllRoomFurnitureRaw(pd.furniture);
          }

          // ═══ Restore per-room materials & lighting ═══
          if (pd.perRoomMaterials && typeof pd.perRoomMaterials === "object") {
            perRoomMaterialsRef.current = pd.perRoomMaterials;
            // Sync floor colors to 2D view from saved per-room materials
            const colorUpdates: Record<string, string> = {};
            for (const [rId, mats] of Object.entries(pd.perRoomMaterials)) {
              const floorMat = (mats as SceneMaterials).floors;
              if (floorMat && MATERIAL_DEFS.floors[floorMat]) {
                colorUpdates[rId] = MATERIAL_DEFS.floors[floorMat];
              }
            }
            if (Object.keys(colorUpdates).length > 0) {
              setRoomFloorColors((prev) => ({ ...prev, ...colorUpdates }));
            }
          }
          if (pd.perRoomLighting && typeof pd.perRoomLighting === "object") {
            perRoomLightingRef.current = pd.perRoomLighting;
          }

          // Restore current room's materials/lighting (prefer per-room saved, fallback to single saved value)
          const activeRoom = HOUSE_ROOM_DEFS[0]?.id || activeEditorRoomId;
          if (pd.perRoomMaterials?.[activeRoom]) {
            setMaterials(pd.perRoomMaterials[activeRoom]);
          } else if (pd.materials) {
            setMaterials(pd.materials);
          }
          if (pd.perRoomLighting?.[activeRoom]) {
            setLighting(pd.perRoomLighting[activeRoom]);
          } else if (pd.lighting) {
            setLighting(pd.lighting);
          }
          // Restore global time of day (not per-room)
          if (typeof pd.globalTimeOfDay === "number") {
            setGlobalTimeOfDay(pd.globalTimeOfDay);
          }
        }
        setIsDirty(false);
        console.log("[Editor] Project loaded successfully:", project?.title);
      } catch (e) {
        console.error("[Editor] Error loading project:", e);
      } finally {
        // Signal that project data is ready — allows 3D scene to build
        setProjectDataLoaded(true);
      }
    };
    loadProject();
  }, [urlProjectId]);

  const handleAddItem = useCallback((catalogItem: CatalogItem) => {
    const id = `${catalogItem.id}-${Date.now()}`;
    // Position within the active room bounds
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeEditorRoomId);
    const b = def ? getRoomBounds(def) : { minX: -3, maxX: 3, minZ: -2, maxZ: 2 };
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const rx = (b.maxX - b.minX) * 0.3;
    const rz = (b.maxZ - b.minZ) * 0.3;
    // For polygon rooms, retry random placement until the point is inside the polygon
    let x = cx, z = cz;
    if (b.polygon) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const tx = cx + (Math.random() - 0.5) * 2 * rx;
        const tz = cz + (Math.random() - 0.5) * 2 * rz;
        if (pointInPoly(b.polygon, tx, tz)) { x = tx; z = tz; break; }
        // If all attempts fail, place at polygon centroid
        if (attempt === 19) {
          let pcx = 0, pcz = 0;
          for (const [px2, pz2] of b.polygon) { pcx += px2; pcz += pz2; }
          x = pcx / b.polygon.length; z = pcz / b.polygon.length;
        }
      }
    } else {
      x = cx + (Math.random() - 0.5) * 2 * rx;
      z = cz + (Math.random() - 0.5) * 2 * rz;
    }
    setPlacedItems((prev) => [...prev, { id, furnitureId: catalogItem.id, name: catalogItem.name, position: [x, 0, z], rotation: 0, dimensions: catalogItem.dimensions, color: catalogItem.color, category: catalogItem.category }]);
    setSelectedId(id);
  }, [activeEditorRoomId, setPlacedItems]);

  // Add a room shape from the mobile room picker
  const handleAddRoomShape = useCallback((shape: { id: string; polygon?: [number, number][]; width: number; depth: number }) => {
    // Find a free spot — offset from existing rooms
    let offsetX = 0;
    let offsetZ = 0;
    if (HOUSE_ROOM_DEFS.length > 0) {
      let maxX = -Infinity;
      for (const def of HOUSE_ROOM_DEFS) {
        if (def.bounds[1] > maxX) maxX = def.bounds[1];
      }
      offsetX = maxX + 0.5;
      offsetZ = HOUSE_ROOM_DEFS[0]?.bounds[2] || 0;
    }

    const id = `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const xMin = offsetX;
    const xMax = offsetX + shape.width;
    const zMin = offsetZ;
    const zMax = offsetZ + shape.depth;

    const ACCENT_COLORS = ["#4A90D9", "#C4A46C", "#E8A060", "#6AB0C0", "#8A7A6A", "#B0A090", "#A0B0C0", "#90B090"];
    const accent = ACCENT_COLORS[HOUSE_ROOM_DEFS.length % ACCENT_COLORS.length];

    const newDef: any = {
      id,
      label: `Room ${HOUSE_ROOM_DEFS.length + 1}`,
      shortLabel: `R${HOUSE_ROOM_DEFS.length + 1}`,
      bounds: [xMin, xMax, zMin, zMax] as [number, number, number, number],
      floorColor: "#D4B896",
      wallColor: "#FAFAFA",
      cameraPos: [xMin + shape.width / 2, 5, zMax + 6] as [number, number, number],
      cameraTarget: [xMin + shape.width / 2, 0, zMin + shape.depth / 2] as [number, number, number],
      svg: { x: xMin, y: zMin, w: shape.width, h: shape.depth },
      accent,
      furniture: [],
      doors: [{ side: "south", t: 0.5, w: 0.8 }],
      windows: [],
      defaultMaterials: { walls: "White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "White" },
      defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
    };

    // Only add polygon for non-rectangular shapes — use simple rect rooms for reliability
    // Polygon rooms need careful winding order; skip for now to avoid black screen
    // The user can reshape rooms in 2D mode

    HOUSE_ROOM_DEFS.push(newDef);

    // Trigger full scene rebuild (safer than incremental add)
    setSceneRebuildKey((k) => k + 1);

    // Switch to the new room after a tick so the rebuild picks it up
    setTimeout(() => {
      const def = HOUSE_ROOM_DEFS.find(d => d.id === id);
      if (def) handleSwitchEditorRoom(def);
    }, 100);

    setIsDirty(true);
  }, []);

  const handleAutoFurnish = useCallback(() => {
    const newItems = autoFurnishRoom(activeEditorRoomId);
    if (newItems.length === 0) return;
    setPlacedItems((prev) => [...prev, ...newItems]);
    setSelectedId(null);
  }, [activeEditorRoomId, setPlacedItems]);

  const handleRotateSelected = useCallback(() => {
    if (!selectedId) return;
    setPlacedItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, rotation: (i.rotation + 45) % 360 } : i));
  }, [selectedId, setPlacedItems]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    setPlacedItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setPlacedItems]);

  const handleMaterialChange = useCallback((cat: string, val: string) => {
    if (cat === "walls" || cat === "floors" || cat === "ceiling") {
      setMaterials((prev) => ({ ...prev, [cat]: val }));
      setIsDirty(true);
      // Sync floor color to 2D view when floor material changes
      if (cat === "floors") {
        const color = MATERIAL_DEFS.floors[val];
        if (color) {
          setRoomFloorColors((prev) => ({ ...prev, [activeEditorRoomId]: color }));
        }
      }
    }
  }, [activeEditorRoomId]);

  const handleLightingChange = useCallback((u: Partial<SceneLighting>) => {
    if (u.timeOfDay !== undefined) {
      setGlobalTimeOfDay(u.timeOfDay); // timeOfDay is global, not per-room
    }
    // Only pass non-timeOfDay changes to per-room lighting
    const { timeOfDay: _tod, ...rest } = u;
    if (Object.keys(rest).length > 0) {
      setLighting((prev) => ({ ...prev, ...rest }));
    }
    setIsDirty(true);
  }, []);

  // ═══ Capture Thumbnail (for template mode) ═══
  const captureThumbnail = useCallback((): string | null => {
    const s = sceneRefForHotspots.current;
    if (!s) return null;
    try {
      s.renderer.render(s.scene, s.camera);
      const srcCanvas = s.renderer.domElement;
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 400;
      thumbCanvas.height = 300;
      const ctx = thumbCanvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, 400, 300);
      return thumbCanvas.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      console.warn("[Editor] Failed to capture thumbnail:", e);
      return null;
    }
  }, []);

  // ═══ Save Project/Template to Supabase ═══
  const handleSaveProject = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      const headers = await getEditorAuthHeaders();
      // Snapshot current room's materials/lighting into per-room refs before saving
      perRoomMaterialsRef.current[activeEditorRoomId] = materials;
      perRoomLightingRef.current[activeEditorRoomId] = lighting;
      const projectData = {
        furniture: allRoomFurniture,
        materials,
        lighting,
        globalTimeOfDay,
        houseName,
        roomDefs: HOUSE_ROOM_DEFS.map((d) => d.id),
        // Persist full room definitions so imported plans survive reload
        roomDefinitions: HOUSE_ROOM_DEFS,
        // Persist per-room materials & lighting
        perRoomMaterials: perRoomMaterialsRef.current,
        perRoomLighting: perRoomLightingRef.current,
      };

      let saveProjectId = urlProjectId;

      // Capture thumbnail for template saves
      const thumb = isTemplateMode ? captureThumbnail() : null;

      if (isTemplateMode) {
        // ═══ Template Mode Save ═══
        if (!saveProjectId) {
          console.log("[Editor/Template] No template ID — auto-creating template before saving...");
          const createRes = await fetch(`${API}/fp3d/templates`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: houseName || "Untitled Template",
              category: templateCategory,
              unitType: templateUnitType,
              description: templateDescription,
              thumbnailUrl: thumb,
              projectData,
            }),
          });
          if (createRes.ok) {
            const d = await createRes.json();
            saveProjectId = d.template?.id;
            if (saveProjectId) {
              console.log("[Editor/Template] Auto-created template:", saveProjectId);
              window.history.replaceState(null, "", `/admin/template-editor/${saveProjectId}`);
              setIsDirty(false);
              setLastSaved(new Date());
              setIsSaving(false);
              return;
            }
          }
          console.error("[Editor/Template] Failed to auto-create template");
          setSaveError("Failed to create template. Please try again.");
          setIsSaving(false);
          return;
        }

        const res = await fetch(`${API}/fp3d/templates/${saveProjectId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: houseName,
            category: templateCategory,
            unitType: templateUnitType,
            description: templateDescription,
            thumbnailUrl: thumb,
            projectData,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("[Editor/Template] Save failed:", res.status, errText);
          setSaveError("Failed to save template. Please try again.");
        } else {
          console.log("[Editor/Template] Template saved successfully");
          setIsDirty(false);
          setLastSaved(new Date());
        }
      } else {
        // ═══ Project Mode Save ═══
        // Auto-create project if we don't have one yet (e.g. sessionStorage-only import fallback)
        if (!saveProjectId) {
          console.log("[Editor] No project ID — auto-creating project before saving...");
          const createRes = await fetch(`${API}/fp3d/projects`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              title: houseName || "Untitled Floor Plan",
              sourceType: "upload",
              projectData,
            }),
          });
          if (createRes.ok) {
            const d = await createRes.json();
            saveProjectId = d.project?.id;
            if (saveProjectId) {
              console.log("[Editor] Auto-created project:", saveProjectId);
              // Update URL to include the new project ID (replaces current history entry)
              window.history.replaceState(null, "", `/floorplan3d/editor/${saveProjectId}`);
              setIsDirty(false);
              setLastSaved(new Date());
              setIsSaving(false);
              return;
            }
          }
          console.error("[Editor] Failed to auto-create project");
          setSaveError("Failed to create project. Please try again.");
          setIsSaving(false);
          return;
        }

        const res = await fetch(`${API}/fp3d/projects/${saveProjectId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ title: houseName, projectData }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("[Editor] Save failed:", res.status, errText);
          setSaveError("Failed to save. Please try again.");
        } else {
          console.log("[Editor] Project saved successfully");
          setIsDirty(false);
          setLastSaved(new Date());
        }
      }
    } catch (e: any) {
      console.error("[Editor] Save error:", e);
      setSaveError(e.message || "Save failed");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [urlProjectId, allRoomFurniture, materials, lighting, houseName, activeEditorRoomId, isTemplateMode, templateCategory, templateUnitType, templateDescription, captureThumbnail]);

  // ═══ Auto-Save (every 30 seconds when dirty) ═══
  useEffect(() => {
    if (!isDirty || !urlProjectId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      console.log("[Editor] Auto-saving...");
      handleSaveProject();
    }, 30000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [isDirty, urlProjectId, handleSaveProject]);

  // ═══ Screenshot Capture ═══
  const handleScreenshot = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    // Force a render
    s.renderer.render(s.scene, s.camera);
    const dataUrl = s.renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${houseName.replace(/\s+/g, "_")}_screenshot.png`;
    link.href = dataUrl;
    link.click();
    setScreenshotToast(true);
    setTimeout(() => setScreenshotToast(false), 2500);
  }, [houseName]);

  // ═══ Duplicate Selected ═══
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const item = placedItems.find((i) => i.id === selectedId);
    if (!item) return;
    const newId = `${item.furnitureId}-${Date.now()}`;
    const newItem = {
      ...item,
      id: newId,
      position: [item.position[0] + 0.3, item.position[1], item.position[2] + 0.3] as [number, number, number],
    };
    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedId(newId);
  }, [selectedId, placedItems, setPlacedItems]);

  // ═══ Zoom Controls ═══
  const handleZoomIn = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    const dir = new THREE.Vector3();
    s.camera.getWorldDirection(dir);
    s.camera.position.addScaledVector(dir, 1);
    setZoomLevel((z) => Math.min(200, z + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    const dir = new THREE.Vector3();
    s.camera.getWorldDirection(dir);
    s.camera.position.addScaledVector(dir, -1);
    setZoomLevel((z) => Math.max(20, z - 10));
  }, []);

  const handleZoomFit = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    if (viewMode === "editor") {
      const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeEditorRoomId);
      if (!def) return;
      const cx = (def.bounds[0] + def.bounds[1]) / 2;
      const cz = (def.bounds[2] + def.bounds[3]) / 2;
      const maxDim = Math.max(def.bounds[1] - def.bounds[0], def.bounds[3] - def.bounds[2]);
      s.flyToPos([cx, maxDim * 1.5 + 1, cz + 0.01], [cx, 0, cz], 800);
    } else {
      s.flyToPos(HOUSE_CAM_POS, HOUSE_CAM_TARGET, 800);
    }
    setZoomLevel(100);
  }, [viewMode, activeEditorRoomId]);

  // ═══ Browser beforeunload warning ═══
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ═══ Navigation with unsaved changes check ═══
  const handleNavigateBack = useCallback((destination: string) => {
    if (isDirty) {
      pendingNavigationRef.current = destination;
      setShowUnsavedModal(true);
    } else {
      navigate(destination);
    }
  }, [isDirty, navigate]);

  const handleDiscardAndLeave = useCallback(() => {
    setShowUnsavedModal(false);
    setIsDirty(false);
    const dest = pendingNavigationRef.current || (isTemplateMode ? "/admin" : "/floorplan3d/dashboard");
    pendingNavigationRef.current = null;
    navigate(dest);
  }, [navigate, isTemplateMode]);

  const handleSaveAndLeave = useCallback(async () => {
    await handleSaveProject();
    // Only navigate if save didn't fail (isSavingRef is false means save completed)
    if (isSavingRef.current) return;
    setShowUnsavedModal(false);
    const dest = pendingNavigationRef.current || (isTemplateMode ? "/admin" : "/floorplan3d/dashboard");
    pendingNavigationRef.current = null;
    navigate(dest);
  }, [handleSaveProject, navigate]);

  // ═══ Top View Toggle ═══
  const handleToggleTopView = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeEditorRoomId);
    if (!def) return;

    const newVal = !isTopView;
    setIsTopView(newVal);

    const cx = (def.bounds[0] + def.bounds[1]) / 2;
    const cz = (def.bounds[2] + def.bounds[3]) / 2;

    if (newVal) {
      const maxDim = Math.max(def.bounds[1] - def.bounds[0], def.bounds[3] - def.bounds[2]);
      s.flyToPos([cx, maxDim * 1.5 + 1, cz + 0.01], [cx, 0, cz], 800);
    } else {
      const roomW = def.bounds[1] - def.bounds[0];
      const roomD = def.bounds[3] - def.bounds[2];
      s.flyToPos([cx + roomW * 0.35, WALL_H * 0.6, cz + roomD * 0.35], [cx, WALL_H * 0.35, cz], 800);
    }
  }, [isTopView, activeEditorRoomId]);

  // ═══ Keyboard Shortcuts (defined after all handlers to avoid TDZ) ═══
  const kbPlacedItems = allRoomFurniture[activeEditorRoomId] || [];
  const kbPlacedItemsRef = useRef(kbPlacedItems);
  kbPlacedItemsRef.current = kbPlacedItems;
  const is2DModeRef = useRef(is2DMode);
  is2DModeRef.current = is2DMode;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  keyHandlersRef.current = {
    handleUndo, handleRedo, handleSaveProject, handleDuplicateSelected,
    handleDeleteSelected, handleZoomFit, handleMoveItem, handleRotateSelected,
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const mod = e.metaKey || e.ctrlKey;
      const h = keyHandlersRef.current;
      const in2D = is2DModeRef.current;

      // ── Always-active shortcuts (both modes) ──
      if (mod && e.key === "s") { e.preventDefault(); h.handleSaveProject(); return; }
      if (e.key === "Escape") { setSelectedId(null); setShowMoreMenu(false); return; }
      if (e.key === "Tab") { e.preventDefault(); setIs2DMode((p) => !p); return; }
      if (e.key === "1") { setIs2DMode(false); return; }
      if (e.key === "2") { setIs2DMode(true); return; }

      // ── 2D mode delegates all other keys to Editor2DView ──
      if (in2D) return;

      // ── 3D-only shortcuts below ──
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); h.handleUndo(); return; }
      if (mod && e.key === "z" && e.shiftKey) { e.preventDefault(); h.handleRedo(); return; }
      if (mod && e.key === "y") { e.preventDefault(); h.handleRedo(); return; }
      if (mod && e.key === "d") { e.preventDefault(); h.handleDuplicateSelected(); return; }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIdRef.current) { e.preventDefault(); h.handleDeleteSelected(); return; }
      }
      if (e.key === "v" || e.key === "V") { e.preventDefault(); setIs2DMode(true); return; }
      if (e.key === "g" || e.key === "G") { setShowGrid((p) => !p); return; }
      if (!mod && (e.key === "s" || e.key === "S")) { setSnapEnabled((p) => !p); return; }
      if (e.key === "f" || e.key === "F") { h.handleZoomFit(); return; }

      const curSelectedId = selectedIdRef.current;
      const curViewMode = viewModeRef.current;
      if (curSelectedId && curViewMode === "editor") {
        const item = kbPlacedItemsRef.current.find(i => i.id === curSelectedId);
        if (item) {
          const nudge = e.shiftKey ? 0.01 : 0.05;
          if (e.key === "ArrowLeft") { e.preventDefault(); h.handleMoveItem(curSelectedId, item.position[0] - nudge, item.position[2]); return; }
          if (e.key === "ArrowRight") { e.preventDefault(); h.handleMoveItem(curSelectedId, item.position[0] + nudge, item.position[2]); return; }
          if (e.key === "ArrowUp") { e.preventDefault(); h.handleMoveItem(curSelectedId, item.position[0], item.position[2] - nudge); return; }
          if (e.key === "ArrowDown") { e.preventDefault(); h.handleMoveItem(curSelectedId, item.position[0], item.position[2] + nudge); return; }
        }
      }
      if ((e.key === "r" || e.key === "R") && curSelectedId) { h.handleRotateSelected(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ═══ Camera Presets ═══
  const CAMERA_PRESETS = [
    { label: "Perspective", getPos: (def: HouseRoomDef): [[number,number,number],[number,number,number]] => {
      const cx = (def.bounds[0] + def.bounds[1]) / 2, cz = (def.bounds[2] + def.bounds[3]) / 2;
      const rw = def.bounds[1] - def.bounds[0], rd = def.bounds[3] - def.bounds[2];
      return [[cx + rw * 0.35, WALL_H * 0.6, cz + rd * 0.35], [cx, WALL_H * 0.35, cz]];
    }},
    { label: "Front Wall", getPos: (def: HouseRoomDef): [[number,number,number],[number,number,number]] => {
      const cx = (def.bounds[0] + def.bounds[1]) / 2, cz = (def.bounds[2] + def.bounds[3]) / 2;
      const rd = def.bounds[3] - def.bounds[2];
      return [[cx, WALL_H * 0.5, cz + rd * 0.9], [cx, WALL_H * 0.4, cz]];
    }},
    { label: "Corner View", getPos: (def: HouseRoomDef): [[number,number,number],[number,number,number]] => {
      const cx = (def.bounds[0] + def.bounds[1]) / 2, cz = (def.bounds[2] + def.bounds[3]) / 2;
      const rw = def.bounds[1] - def.bounds[0], rd = def.bounds[3] - def.bounds[2];
      return [[def.bounds[0] - rw * 0.1, WALL_H * 0.55, def.bounds[2] - rd * 0.1], [cx, WALL_H * 0.3, cz]];
    }},
    { label: "Top Down", getPos: (def: HouseRoomDef): [[number,number,number],[number,number,number]] => {
      const cx = (def.bounds[0] + def.bounds[1]) / 2, cz = (def.bounds[2] + def.bounds[3]) / 2;
      const maxDim = Math.max(def.bounds[1] - def.bounds[0], def.bounds[3] - def.bounds[2]);
      return [[cx, maxDim * 1.5 + 1, cz + 0.01], [cx, 0, cz]];
    }},
  ];
  const [activeCamPreset, setActiveCamPreset] = useState(0);

  const handleCameraPreset = useCallback((idx: number) => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeEditorRoomId);
    if (!def) return;
    setActiveCamPreset(idx);
    setIsTopView(idx === 3);
    const [pos, target] = CAMERA_PRESETS[idx].getPos(def);
    s.flyToPos(pos, target, 800);
  }, [activeEditorRoomId]);

  // ═══ Room Selection Handlers ═══
  const handleSelectHouseRoom = useCallback((roomId: string) => {
    const s = sceneRefForHotspots.current;
    if (!s) return;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
    if (!def) return;

    setActiveHouseRoom(roomId);
    setHouseViewMode("room");

    // Exit house view performance mode
    s.isHouseViewMode = false;
    s.setRoomLightShadows(roomId); // Enable shadows only for the active room
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.maxDPR));

    // Keep all rooms visible — just reset positions
    s.houseRoomGroups.forEach((g) => { g.visible = true; g.position.y = 0; });
    s.houseRoomLabels.forEach((l) => { l.visible = true; });
    s.groundPlane!.visible = true;

    // Hide the editor room and furniture when browsing non-living rooms
    s.roomGroup.visible = false;
    s.furnitureGroup.visible = false;

    // Fly camera into the room (bounds are always up-to-date via 2D→3D sync)
    s.flyToPos(def.cameraPos, def.cameraTarget, 1000);
    s.controls.minDistance = 1;
    s.controls.maxDistance = 12;
  }, []);

  // Keep the ref in sync so the 3D click handler always calls the latest version
  // In editor mode, clicking a non-active room auto-switches to that room
  // In room-select mode, use the room-select handler
  roomClickRef.current = viewMode === "editor"
    ? (roomId: string) => {
        if (roomId === activeEditorRoomId) return; // already active, no-op
        const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
        if (def) handleSwitchEditorRoomRef.current?.(def);
      }
    : handleSelectHouseRoom;

  const handleViewWholeHouse = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;

    if (houseViewMode === "house") {
      // Toggle back
      handleSelectHouseRoom(activeHouseRoom);
      return;
    }

    setHouseViewMode("house");

    // ═══ Performance: enter house view mode ═══
    s.isHouseViewMode = true;
    s.setRoomLightShadows(null); // Disable all room light shadows
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.isLowPower ? 1 : 1.5)); // Lower pixel ratio

    // Reset per-room cutaway states so the cutaway system can smoothly fade from current camera
    s.perRoomCutawayStates.forEach((state) => {
      state.north = 1; state.south = 1; state.east = 1; state.west = 1; state.ceiling = 1;
    });

    // Show all house rooms
    s.houseRoomGroups.forEach((g) => { g.visible = true; });
    s.houseRoomLabels.forEach((l) => { l.visible = true; });
    s.groundPlane!.visible = true;

    // Hide editor room
    s.roomGroup.visible = false;
    s.furnitureGroup.visible = false;

    // Fly to overview
    s.flyToPos(HOUSE_CAM_POS, HOUSE_CAM_TARGET, 1200);
    s.controls.minDistance = 3;
    s.controls.maxDistance = 25;
  }, [houseViewMode, activeHouseRoom, handleSelectHouseRoom]);

  // Hover raise effect for house view
  useEffect(() => {
    const s = sceneRefForHotspots.current;
    if (!s || viewMode !== "room-select" || houseViewMode !== "house") return;
    // The animation loop in buildScene doesn't know about house rooms,
    // so we handle hover raise here with a small interval
    const interval = setInterval(() => {
      s.houseRoomGroups.forEach((grp, id) => {
        const targetY = id === hoveredHouseRoom ? 0.2 : 0;
        grp.position.y += (targetY - grp.position.y) * 0.1;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [hoveredHouseRoom, viewMode, houseViewMode]);

  const handleContinueToEditor = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;

    const roomId = activeHouseRoom;
    const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
    if (!def) return;

    setActiveEditorRoomId(roomId);
    setViewMode("editor");
    setLeftPanel("furniture");

    // ═══ Performance: exit house view, enable shadows for editing room only ═══
    s.isHouseViewMode = false;
    s.setRoomLightShadows(roomId);
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.maxDPR));

    // Load room-specific presets (prefer saved per-room values, fallback to defaults)
    setMaterials(perRoomMaterialsRef.current[roomId] || def.defaultMaterials);
    setLighting(perRoomLightingRef.current[roomId] || def.defaultLighting);

    // Bounds are always current via 2D→3D sync
    Object.assign(s.activeRoomBounds, getRoomBounds(def));

    // Position lights at the room's center
    const rcx = (def.bounds[0] + def.bounds[1]) / 2;
    const rcz = (def.bounds[2] + def.bounds[3]) / 2;
    s.lightCenter.x = rcx;
    s.lightCenter.z = rcz;

    // Keep all house rooms visible
    s.houseRoomGroups.forEach((g) => { g.visible = true; });
    s.houseRoomLabels.forEach((l) => { l.visible = false; });
    s.groundPlane!.visible = true;

    // Reference the editing room group
    const roomGroup = s.houseRoomGroups.get(roomId);

    // Remove the static furniture from the active room (they'll be replaced by editable ones)
    if (roomGroup) {
      const toRemove: THREE.Object3D[] = [];
      roomGroup.traverse((child) => {
        if (child.userData.isStaticFurniture) toRemove.push(child);
      });
      toRemove.forEach((obj) => roomGroup!.remove(obj));
    }

    // Populate static furniture for ALL non-active rooms so they're visible in 3D
    const currentFurniture = allRoomFurnitureRef.current;
    s.houseRoomGroups.forEach((grp, rId) => {
      if (rId === roomId) return; // active room uses editable s.furnitureGroup
      const items = currentFurniture[rId] || [];
      // Remove existing static furniture first
      const toRm: THREE.Object3D[] = [];
      grp.traverse((child: any) => { if (child.userData?.isStaticFurniture) toRm.push(child); });
      toRm.forEach((obj) => grp.remove(obj));
      items.forEach((item) => {
        try {
          const fGroup = buildFurnitureModel(item.furnitureId, item.color);
          fGroup.position.set(item.position[0], item.position[1], item.position[2]);
          fGroup.rotation.y = (item.rotation * Math.PI) / 180;
          fGroup.userData.isStaticFurniture = true;
          grp.add(fGroup);
        } catch { /* skip */ }
      });
    });

    // Hide the origin editor room — use house room instead
    s.roomGroup.visible = false;
    s.furnitureGroup.visible = true;

    // Fly camera into the room — wide enough to see the whole room
    const cx = (def.bounds[0] + def.bounds[1]) / 2;
    const cz = (def.bounds[2] + def.bounds[3]) / 2;
    const roomW = def.bounds[1] - def.bounds[0];
    const roomD = def.bounds[3] - def.bounds[2];
    const maxDim = Math.max(roomW, roomD);
    const eyePos: [number, number, number] = [
      cx + maxDim * 0.7,
      WALL_H * 1.1,
      cz + maxDim * 0.7,
    ];
    const lookAt: [number, number, number] = [cx, WALL_H * 0.15, cz];
    s.flyToPos(eyePos, lookAt, 1200);
    s.controls.minDistance = 1;
    s.controls.maxDistance = 25;
  }, [activeHouseRoom]);

  const handleBackToRoomSelect = useCallback(() => {
    const s = sceneRefForHotspots.current;
    if (!s) return;

    setViewMode("room-select");
    setSelectedId(null);

    // Hide editor furniture
    s.furnitureGroup.visible = false;
    s.roomGroup.visible = false;

    // Reset per-room cutaway states and restore full opacity
    s.perRoomCutawayStates.forEach((state) => {
      state.north = 1; state.south = 1; state.east = 1; state.west = 1; state.ceiling = 1;
    });
    s.houseRoomGroups.forEach((grp) => {
      grp.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material;
          if (mat && !Array.isArray(mat)) {
            const stdMat = mat as THREE.MeshStandardMaterial;
            if (stdMat.transparent) {
              const base = (child.userData.baseOpacity as number) || 1.0;
              stdMat.opacity = base;
              stdMat.depthWrite = true;
            }
          }
        }
      });
    });

    // Rebuild static furniture in ALL house rooms from current furniture state
    // (so house overview and room-select both show correct furniture)
    s.houseRoomGroups.forEach((roomGroup, roomId) => {
      const toRemove: THREE.Object3D[] = [];
      roomGroup.traverse((child) => {
        if (child.userData.isStaticFurniture) toRemove.push(child);
      });
      toRemove.forEach((obj) => roomGroup.remove(obj));

      const items = allRoomFurniture[roomId] || [];
      items.forEach((item) => {
        try {
          const fGroup = buildFurnitureModel(item.furnitureId, item.color);
          fGroup.position.set(item.position[0], item.position[1], item.position[2]);
          fGroup.rotation.y = (item.rotation * Math.PI) / 180;
          fGroup.userData.isStaticFurniture = true;
          roomGroup.add(fGroup);
        } catch { /* skip */ }
      });
    });

    // Show the active house room
    handleSelectHouseRoom(activeHouseRoom);
  }, [activeHouseRoom, activeEditorRoomId, allRoomFurniture, handleSelectHouseRoom, sceneRebuildKey]);

  // Initialize into room-select / house overview mode
  // Depends on both sceneRebuildKey AND projectDataLoaded so it re-runs after data loads & scene builds
  useEffect(() => {
    if (!projectDataLoaded) return; // wait for project data before initializing
    const s = sceneRefForHotspots.current;
    if (!s) return;
    // Slight delay to let scene build
    const timer = setTimeout(() => {
      // ═══ Start showing the entire floorplan — all rooms always visible ═══
      s.isHouseViewMode = false;
      s.setRoomLightShadows(HOUSE_ROOM_DEFS[0]?.id || null);
      s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.maxDPR));

      // Reset per-room cutaway states
      s.perRoomCutawayStates.forEach((state) => {
        state.north = 1; state.south = 1; state.east = 1; state.west = 1; state.ceiling = 1;
      });

      // Show all house rooms
      s.houseRoomGroups.forEach((g) => { g.visible = true; });
      s.houseRoomLabels.forEach((l) => { l.visible = false; });
      s.groundPlane!.visible = true;

      // Initialize prev-state refs so the first 2D→3D sync doesn't trigger unnecessary rebuilds.
      // Keys must match 2D convention (side3Dto2D + tVal3Dto2D conversions).
      const s2d = (side: string) => side === "north" ? "south" : side === "south" ? "north" : side;
      const t2d = (side3D: string, t: number) => (side3D === "south" || side3D === "west") ? 1 - t : t;
      for (const def of HOUSE_ROOM_DEFS) {
        prevRoomBoundsRef.current.set(def.id, def.bounds.join(","));
        prevRoomOpeningsRef.current.set(def.id, JSON.stringify(
          def.doors.map(d => ({ s: s2d(d.side), t: t2d(d.side, d.t), w: d.w })).concat(
            (def.windows || []).map(w => ({ s: s2d(w.side), t: t2d(w.side, w.t), w: w.w, h: w.h, sh: w.sillH }) as any)
          )
        ));
      }

      // Update activeRoomBounds for the current editor room so furniture drag works correctly
      const activeRoomId = activeEditorRoomIdRef.current;
      const activeDef = HOUSE_ROOM_DEFS.find((r) => r.id === activeRoomId);
      if (activeDef) {
        Object.assign(s.activeRoomBounds, getRoomBounds(activeDef));
        s.lightCenter.x = (activeDef.bounds[0] + activeDef.bounds[1]) / 2;
        s.lightCenter.z = (activeDef.bounds[2] + activeDef.bounds[3]) / 2;
      }

      // Hide legacy editor room group — using house rooms instead
      s.roomGroup.visible = false;
      s.furnitureGroup.visible = true;

      // ═══ Apply saved per-room materials to each room group ═══
      const savedMats = perRoomMaterialsRef.current;
      s.houseRoomGroups.forEach((grp, rId) => {
        const rm = savedMats[rId];
        if (!rm) return;
        const wc = MATERIAL_DEFS.walls[rm.walls] || "#F5F5F5";
        const fc = MATERIAL_DEFS.floors[rm.floors] || "#F0F0F0";
        const cc = MATERIAL_DEFS.ceiling[rm.ceiling] || "#FAFAFA";
        grp.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (!mat || Array.isArray(mat)) return;
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (mesh.rotation.x === -Math.PI / 2 && mesh.position.y < 0.01) {
            stdMat.color.set(fc);
          } else if (mesh.userData.isCeiling) {
            stdMat.color.set(cc);
          } else if (mesh.userData.wallSide && !mesh.userData.isStaticFurniture) {
            stdMat.color.set(wc);
          }
        });
      });

      // ═══ Populate static furniture for ALL rooms from allRoomFurniture state ═══
      // This ensures furniture is visible in 3D for non-active rooms on load
      const currentAllFurniture = allRoomFurnitureRef.current;
      s.houseRoomGroups.forEach((roomGroup, roomId) => {
        // Skip the active editor room (its furniture lives in s.furnitureGroup)
        if (roomId === activeEditorRoomIdRef.current) return;
        const items = currentAllFurniture[roomId] || [];
        if (items.length === 0) return;
        // Remove any existing static furniture first
        const toRemove: THREE.Object3D[] = [];
        roomGroup.traverse((child: any) => { if (child.userData?.isStaticFurniture) toRemove.push(child); });
        toRemove.forEach((obj) => roomGroup.remove(obj));
        // Build new static furniture
        items.forEach((item) => {
          try {
            const fGroup = buildFurnitureModel(item.furnitureId, item.color);
            fGroup.position.set(item.position[0], item.position[1], item.position[2]);
            fGroup.rotation.y = (item.rotation * Math.PI) / 180;
            fGroup.userData.isStaticFurniture = true;
            roomGroup.add(fGroup);
          } catch { /* skip */ }
        });
      });

      // Fly to overview
      s.flyToPos(HOUSE_CAM_POS, HOUSE_CAM_TARGET, 800);
      s.controls.minDistance = 1;
      s.controls.maxDistance = 25;
      setSceneLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [sceneRebuildKey, projectDataLoaded]);

  // ═══ Sync 2D room changes → 3D scene (full geometry rebuild) ═══
  // 2D editor is the source of truth: bounds, doors, windows all flow into HOUSE_ROOM_DEFS
  // and the 3D room groups are rebuilt to match.
  const rebuild3DTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRoomsRef = useRef<EditableRoom[] | null>(null);
  const syncRoomsTo3DRef = useRef<((rooms: EditableRoom[]) => void) | null>(null);
  const handleRoomsChange = useCallback((rooms: EditableRoom[]) => {
    // Throttle rebuilds to max ~30fps during drag operations
    pendingRoomsRef.current = rooms;
    if (rebuild3DTimerRef.current) return; // Already scheduled
    rebuild3DTimerRef.current = setTimeout(() => {
      rebuild3DTimerRef.current = null;
      const latestRooms = pendingRoomsRef.current;
      if (!latestRooms) return;
      pendingRoomsRef.current = null;
      syncRoomsTo3DRef.current?.(latestRooms);
    }, 33); // ~30fps
  }, []);
  const syncRoomsTo3D = useCallback((rooms: EditableRoom[]) => {
    const s = sceneRefForHotspots.current;
    if (!s) return;

    // 2D↔3D coordinate helpers
    const side2Dto3D = (sd: string): string => {
      if (sd === "north") return "south";
      if (sd === "south") return "north";
      return sd;
    };
    const tVal2Dto3D = (side2D: string, t2d: number): number => {
      if (side2D === "north" || side2D === "west") return 1 - t2d;
      return t2d;
    };

    // 1. Detect which rooms changed bounds or openings, and handle new/deleted rooms
    const changedRoomIds = new Set<string>();
    const boundsChangedIds = new Set<string>();
    const newRoomIds = new Set<string>();
    const deletedRoomIds = new Set<string>();

    // Find new rooms (exist in 2D but not in HOUSE_ROOM_DEFS)
    const existingIds = new Set(HOUSE_ROOM_DEFS.map(d => d.id));
    const current2DIds = new Set(rooms.map(r => r.id));
    for (const room of rooms) {
      if (!existingIds.has(room.id)) {
        newRoomIds.add(room.id);
        changedRoomIds.add(room.id);
        boundsChangedIds.add(room.id);
      }
    }
    // Find deleted rooms (exist in HOUSE_ROOM_DEFS but not in 2D)
    for (const def of HOUSE_ROOM_DEFS) {
      if (!current2DIds.has(def.id)) {
        deletedRoomIds.add(def.id);
      }
    }

    for (const room of rooms) {
      if (newRoomIds.has(room.id)) continue; // handled separately

      const boundsKey = room.bounds.join(",") + (room.polygon ? "|" + room.polygon.map(p => p.join(",")).join(";") : "");
      const prevBK = prevRoomBoundsRef.current.get(room.id);
      const openingsKey = JSON.stringify(
        room.doors.map(d => ({ s: d.side, t: d.t, w: d.width })).concat(
          room.windows.map(w => ({ s: w.side, t: w.t, w: w.width, h: w.height, sh: w.sillHeight }) as any)
        )
      );
      const prevOK = prevRoomOpeningsRef.current.get(room.id);

      if (boundsKey !== prevBK) {
        boundsChangedIds.add(room.id);
        changedRoomIds.add(room.id);
        prevRoomBoundsRef.current.set(room.id, boundsKey);
      }
      if (openingsKey !== prevOK) {
        changedRoomIds.add(room.id);
        prevRoomOpeningsRef.current.set(room.id, openingsKey);
      }
    }

    if (changedRoomIds.size === 0 && deletedRoomIds.size === 0) return;

    // 2. Handle deleted rooms — remove from HOUSE_ROOM_DEFS and 3D scene
    for (const delId of deletedRoomIds) {
      const idx = HOUSE_ROOM_DEFS.findIndex(d => d.id === delId);
      if (idx >= 0) HOUSE_ROOM_DEFS.splice(idx, 1);
      const oldGroup = s.houseRoomGroups.get(delId);
      if (oldGroup) { disposeGroup(oldGroup); s.houseRoomGroups.delete(delId); }
      const oldLabel = s.houseRoomLabels.get(delId);
      if (oldLabel) { oldLabel.removeFromParent(); s.houseRoomLabels.delete(delId); }
      s.roomBoundsOverrides.delete(delId);
      s.invalidateCutawayCache(delId);
      prevRoomBoundsRef.current.delete(delId);
      prevRoomOpeningsRef.current.delete(delId);
    }

    // 3. Handle new rooms — add to HOUSE_ROOM_DEFS
    for (const room of rooms) {
      if (!newRoomIds.has(room.id)) continue;
      const cx = (room.bounds[0] + room.bounds[1]) / 2;
      const cz = (room.bounds[2] + room.bounds[3]) / 2;
      const maxDim = Math.max(room.bounds[1] - room.bounds[0], room.bounds[3] - room.bounds[2]);
      const newDef: HouseRoomDef = {
        id: room.id,
        label: room.name,
        shortLabel: room.name.substring(0, 8),
        bounds: [...room.bounds] as [number, number, number, number],
        polygon: room.polygon ? room.polygon.map(p => [...p] as [number, number]) : undefined,
        floorColor: room.floorColor || "#D4B896",
        wallColor: room.wallColor || "#FAFAFA",
        accent: room.accent || "#D4B896",
        cameraPos: [cx + maxDim * 0.8, WALL_H * 1.8, cz + maxDim * 0.8],
        cameraTarget: [cx, WALL_H * 0.3, cz],
        svg: { x: room.bounds[0], y: room.bounds[2], w: room.bounds[1] - room.bounds[0], h: room.bounds[3] - room.bounds[2] },
        doors: room.doors.map(d => ({ side: side2Dto3D(d.side) as any, t: tVal2Dto3D(d.side, d.t), w: d.width })),
        windows: room.windows.map(w => ({ side: side2Dto3D(w.side) as any, t: tVal2Dto3D(w.side, w.t), w: w.width, h: w.height, sillH: w.sillHeight })),
        furniture: [],
        defaultMaterials: { walls: "White Paint", floors: "Engineered Oak", ceiling: "Flat White" },
        defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
      };
      HOUSE_ROOM_DEFS.push(newDef);
      prevRoomBoundsRef.current.set(room.id, room.bounds.join(",") + (room.polygon ? "|" + room.polygon.map(p => p.join(",")).join(";") : ""));
      prevRoomOpeningsRef.current.set(room.id, JSON.stringify(
        room.doors.map(d => ({ s: d.side, t: d.t, w: d.width })).concat(
          room.windows.map(w => ({ s: w.side, t: w.t, w: w.width, h: w.height, sh: w.sillHeight }) as any)
        )
      ));
    }

    // 4. Update existing HOUSE_ROOM_DEFS in place with new bounds + openings from 2D state
    for (const room of rooms) {
      if (newRoomIds.has(room.id)) continue; // already added above
      const def = HOUSE_ROOM_DEFS.find((d) => d.id === room.id);
      if (!def) continue;

      def.bounds = [...room.bounds] as [number, number, number, number];
      def.polygon = room.polygon ? room.polygon.map(p => [...p] as [number, number]) : undefined;
      if (room.floorColor) def.floorColor = room.floorColor;
      if (room.wallColor) def.wallColor = room.wallColor;

      def.doors = room.doors.map(d => ({
        side: side2Dto3D(d.side) as any,
        t: tVal2Dto3D(d.side, d.t),
        w: d.width,
      }));
      def.windows = room.windows.map(w => ({
        side: side2Dto3D(w.side) as any,
        t: tVal2Dto3D(w.side, w.t),
        w: w.width,
        h: w.height,
        sillH: w.sillHeight,
      }));

      const cx = (room.bounds[0] + room.bounds[1]) / 2;
      const cz = (room.bounds[2] + room.bounds[3]) / 2;
      const maxDim = Math.max(room.bounds[1] - room.bounds[0], room.bounds[3] - room.bounds[2]);
      def.cameraPos = [cx + maxDim * 0.8, WALL_H * 1.8, cz + maxDim * 0.8];
      def.cameraTarget = [cx, WALL_H * 0.3, cz];
    }

    // 5. Invalidate shared wall cache (bounds changed = shared walls may change)
    if (boundsChangedIds.size > 0 || deletedRoomIds.size > 0) {
      _sharedWallCache = null;
    }

    // 6. Also rebuild neighbor rooms whose shared walls are affected
    // (bounds change → shared walls may shift; openings change → neighbor cutouts change)
    const roomsToRebuild = new Set(changedRoomIds);
    const sharedData = getSharedWallData();
    for (const changedId of changedRoomIds) {
      const wd = sharedData.get(changedId);
      if (wd) {
        for (const neighbors of wd.neighbors.values()) {
          for (const n of neighbors) roomsToRebuild.add(n.neighborId);
        }
      }
    }

    // 7. Rebuild 3D groups for all affected rooms
    for (const roomId of roomsToRebuild) {
      const def = HOUSE_ROOM_DEFS.find((d) => d.id === roomId);
      if (!def) continue;

      // Remove old 3D group (if exists)
      const oldGroup = s.houseRoomGroups.get(roomId);
      if (oldGroup) {
        disposeGroup(oldGroup);
      }

      // Build new 3D group from updated def
      const newGroup = buildHouseRoom(def);
      newGroup.visible = true;
      newGroup.position.set(0, 0, 0);
      s.scene.add(newGroup);
      s.houseRoomGroups.set(roomId, newGroup);

      // Re-apply per-room materials after rebuild
      const roomMats = perRoomMaterialsRef.current[roomId];
      if (roomMats) {
        const wc = MATERIAL_DEFS.walls[roomMats.walls] || "#F5F5F5";
        const fc = MATERIAL_DEFS.floors[roomMats.floors] || "#F0F0F0";
        const cc = MATERIAL_DEFS.ceiling[roomMats.ceiling] || "#FAFAFA";
        newGroup.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          const mat = mesh.material;
          if (!mat || Array.isArray(mat)) return;
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (mesh.rotation.x === -Math.PI / 2 && mesh.position.y < 0.01) {
            stdMat.color.set(fc);
          } else if (mesh.userData.isCeiling) {
            stdMat.color.set(cc);
          } else if (mesh.userData.wallSide && !mesh.userData.isStaticFurniture) {
            stdMat.color.set(wc);
          }
        });
      }

      // If this room is currently being edited, remove static furniture (editable items live in s.furnitureGroup)
      if (roomId === activeEditorRoomIdRef.current) {
        const toRemove: THREE.Object3D[] = [];
        newGroup.traverse((child) => {
          if (child.userData.isStaticFurniture) toRemove.push(child);
        });
        toRemove.forEach((obj) => newGroup.remove(obj));
      } else {
        // For non-active rooms, populate static furniture from allRoomFurniture state
        const items = allRoomFurnitureRef.current[roomId] || [];
        items.forEach((item) => {
          try {
            const fGroup = buildFurnitureModel(item.furnitureId, item.color);
            fGroup.position.set(item.position[0], item.position[1], item.position[2]);
            fGroup.rotation.y = (item.rotation * Math.PI) / 180;
            fGroup.userData.isStaticFurniture = true;
            newGroup.add(fGroup);
          } catch { /* skip */ }
        });
      }

      // Create or update CSS2D label
      let label = s.houseRoomLabels.get(roomId);
      if (!label) {
        const labelEl = document.createElement("div");
        labelEl.style.cssText = `
          font-family:'Inter',sans-serif;font-size:11px;font-weight:600;
          color:#09090B;background:rgba(255,255,255,0.88);backdrop-filter:blur(8px);
          border-radius:100px;padding:4px 10px;pointer-events:none;
          box-shadow:0 4px 12px rgba(0,0,0,0.1);letter-spacing:-0.3px;
          white-space:nowrap;border:1px solid rgba(229,231,235,0.6);
        `;
        labelEl.textContent = def.shortLabel || def.label;
        label = new CSS2DObject(labelEl);
        label.visible = false;
        s.scene.add(label);
        s.houseRoomLabels.set(roomId, label);
      }
      const lcx = (def.bounds[0] + def.bounds[1]) / 2;
      const lcz = (def.bounds[2] + def.bounds[3]) / 2;
      label.position.set(lcx, WALL_H + 0.5, lcz);

      // Update cutaway system
      s.roomBoundsOverrides.set(roomId, [...def.bounds] as [number, number, number, number]);
      if (!s.perRoomCutawayStates.has(roomId)) {
        s.perRoomCutawayStates.set(roomId, { north: 1, south: 1, east: 1, west: 1, ceiling: 1 });
      }
      s.invalidateCutawayCache(roomId); // Force re-scan of transparent materials

      // If active editor room, update collision bounds + light positions
      if (roomId === activeEditorRoomIdRef.current) {
        Object.assign(s.activeRoomBounds, getRoomBounds(def));
        const rcx = (def.bounds[0] + def.bounds[1]) / 2;
        const rcz = (def.bounds[2] + def.bounds[3]) / 2;
        s.lightCenter.x = rcx;
        s.lightCenter.z = rcz;
      }
    }

    // 8. Update ground plane to cover all rooms
    if (s.groundPlane && (boundsChangedIds.size > 0 || deletedRoomIds.size > 0)) {
      let gxMin = Infinity, gxMax = -Infinity, gzMin = Infinity, gzMax = -Infinity;
      for (const d of HOUSE_ROOM_DEFS) {
        if (d.bounds[0] < gxMin) gxMin = d.bounds[0];
        if (d.bounds[1] > gxMax) gxMax = d.bounds[1];
        if (d.bounds[2] < gzMin) gzMin = d.bounds[2];
        if (d.bounds[3] > gzMax) gzMax = d.bounds[3];
      }
      const pcx = (gxMin + gxMax) / 2, pcz = (gzMin + gzMax) / 2;
      // Keep ground plane large (80×80) and just re-center it
      s.groundPlane.position.set(pcx, -0.05, pcz);
    }
  }, []); // end syncRoomsTo3D
  syncRoomsTo3DRef.current = syncRoomsTo3D;

  // ═══ Standalone Walls → 3D Sync ═══
  const prevStandaloneWallsRef = useRef<string>("");
  const handleStandaloneWallsChange = useCallback((walls: StandaloneWall[]) => {
    const s = sceneRefForHotspots.current;
    if (!s) return;

    const key = JSON.stringify(walls.map(w => ({ id: w.id, pts: w.points, t: w.thickness, h: w.height, c: w.color })));
    if (key === prevStandaloneWallsRef.current) return;
    prevStandaloneWallsRef.current = key;

    const currentIds = new Set(walls.map(w => w.id));

    // Remove deleted walls
    for (const [id, grp] of s.standaloneWallGroups) {
      if (!currentIds.has(id)) {
        disposeGroup(grp);
        s.standaloneWallGroups.delete(id);
      }
    }

    // Add or update walls
    for (const wall of walls) {
      const existing = s.standaloneWallGroups.get(wall.id);
      if (existing) {
        disposeGroup(existing);
      }
      const grp = buildStandaloneWall3D(wall);
      grp.visible = true;
      s.scene.add(grp);
      s.standaloneWallGroups.set(wall.id, grp);
    }
  }, []);

  const selectedItem = placedItems.find((i) => i.id === selectedId) || null;
  const roomSelectPanelWidth = 340;
  const panelWidth = viewMode === "editor" ? (leftPanel ? 280 : 0) : 0;

  const handleSwitchEditorRoom = useCallback((def: HouseRoomDef) => {
    if (activeEditorRoomId === def.id) return;
    const s = sceneRefForHotspots.current;
    if (!s) return;

    s.setRoomLightShadows(def.id);
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.maxDPR));

    // Save current room's materials & lighting before switching
    perRoomMaterialsRef.current[activeEditorRoomId] = materials;
    perRoomLightingRef.current[activeEditorRoomId] = lighting;

    const prevGroup = s.houseRoomGroups.get(activeEditorRoomId);
    if (prevGroup) {
      const toRemove: THREE.Object3D[] = [];
      prevGroup.traverse((child) => { if (child.userData.isStaticFurniture) toRemove.push(child); });
      toRemove.forEach((obj) => prevGroup.remove(obj));
      (allRoomFurniture[activeEditorRoomId] || []).forEach((item) => {
        try {
          const fGroup = buildFurnitureModel(item.furnitureId, item.color);
          fGroup.position.set(item.position[0], item.position[1], item.position[2]);
          fGroup.rotation.y = (item.rotation * Math.PI) / 180;
          fGroup.userData.isStaticFurniture = true;
          prevGroup.add(fGroup);
        } catch { /* skip */ }
      });
    }

    while (s.furnitureGroup.children.length) s.furnitureGroup.remove(s.furnitureGroup.children[0]);

    setActiveEditorRoomId(def.id);
    setSelectedId(null);
    setIsTopView(false);
    setActiveCamPreset(0);
    // Restore per-room materials & lighting (prefer saved, fallback to defaults)
    setMaterials(perRoomMaterialsRef.current[def.id] || def.defaultMaterials);
    setLighting(perRoomLightingRef.current[def.id] || def.defaultLighting);
    Object.assign(s.activeRoomBounds, getRoomBounds(def));

    // Position lights at the room's center (bounds always current via 2D→3D sync)
    const swCx = (def.bounds[0] + def.bounds[1]) / 2;
    const swCz = (def.bounds[2] + def.bounds[3]) / 2;
    s.lightCenter.x = swCx;
    s.lightCenter.z = swCz;

    // Keep all rooms visible
    s.houseRoomGroups.forEach((g) => { g.visible = true; });
    const newGroup = s.houseRoomGroups.get(def.id);
    if (newGroup) {
      const toRemove: THREE.Object3D[] = [];
      newGroup.traverse((child) => { if (child.userData.isStaticFurniture) toRemove.push(child); });
      toRemove.forEach((obj) => newGroup.remove(obj));
    }

  }, [activeEditorRoomId, allRoomFurniture, materials, lighting]);

  // ═══ Rebuild static furniture in 3D when switching from 2D → 3D ═══
  // The 2D editor updates allRoomFurniture positions, but the Three.js meshes
  // inside houseRoomGroups are stale. Rebuild them whenever we leave 2D mode.
  useEffect(() => {
    if (is2DMode) return; // only rebuild when entering 3D
    const s = sceneRefForHotspots.current;
    if (!s) return;

    s.houseRoomGroups.forEach((roomGroup, roomId) => {
      // Skip active editor room — its furniture lives in s.furnitureGroup
      if (roomId === activeEditorRoomId) return;
      // Remove old static furniture meshes
      const toRemove: THREE.Object3D[] = [];
      roomGroup.traverse((child) => {
        if (child.userData.isStaticFurniture) toRemove.push(child);
      });
      toRemove.forEach((obj) => roomGroup.remove(obj));

      // Rebuild from latest allRoomFurniture state
      const items = allRoomFurniture[roomId] || [];
      items.forEach((item) => {
        try {
          const fGroup = buildFurnitureModel(item.furnitureId, item.color);
          fGroup.position.set(item.position[0], item.position[1], item.position[2]);
          fGroup.rotation.y = (item.rotation * Math.PI) / 180;
          fGroup.userData.isStaticFurniture = true;
          roomGroup.add(fGroup);
        } catch { /* skip */ }
      });
    });
  }, [is2DMode, allRoomFurniture, activeEditorRoomId]);

  // Keep cross-room move ref in sync
  handleSwitchEditorRoomRef.current = handleSwitchEditorRoom;

  const activeDef = HOUSE_ROOM_DEFS.find((r) => r.id === activeEditorRoomId);

  // ═══ Computed helpers ═══
  const totalObjects = Object.values(allRoomFurniture).reduce((sum, items) => sum + items.length, 0);
  const allRoomDefs = HOUSE_ROOM_DEFS.map((d) => ({
    id: d.id, label: d.label, shortLabel: d.shortLabel,
    bounds: d.bounds as [number, number, number, number],
    accent: d.accent, floorColor: d.floorColor, wallColor: d.wallColor,
  }));

  // Auto-show properties panel when item is selected
  // Properties now shown in floating bottom bar — no panel auto-open needed

  return (
    <div className="h-screen w-screen overflow-hidden font-['Inter',sans-serif] relative bg-[#C5CDD5]">
      {/* Full-screen 3D Viewport */}
      <div ref={viewportRef} className={`absolute inset-0 z-0 ${isDragging ? "cursor-grabbing" : ""}`} />

      {/* ═══ Scene Loading Overlay ═══ */}
      <AnimatePresence>
        {sceneLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090B]"
          >
            <div className="relative mb-6">
              <div className="size-[56px] rounded-[17px] bg-white/5 border border-white/10 flex items-center justify-center">
                <Home className="size-[24px] text-white/60" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 size-[20px] rounded-full bg-white/10 flex items-center justify-center">
                <Loader2 className="size-[12px] text-white/80 animate-spin" strokeWidth={2} />
              </div>
            </div>
            <p className="font-['Inter',sans-serif] text-[14px] font-medium text-white/70 tracking-[-0.3px] mb-1">Building 3D Scene</p>
            <p className="font-['Inter',sans-serif] text-[12px] text-white/30">Preparing rooms and lighting...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 2D Plan View Overlay (always mounted to preserve state) ═══ */}
      {viewMode === "editor" && (
        <Editor2DView
          key={sceneRebuildKey}
          rooms={HOUSE_ROOM_DEFS as any}
          furniture={allRoomFurniture}
          activeRoomId={activeEditorRoomId}
          selectedItemId={selectedId}
          onSelectItem={setSelectedId}
          onSelectRoom={(roomId) => {
            const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
            if (def) handleSwitchEditorRoom(def);
          }}
          showGrid={showGrid}
          showMeasurements={showMeasurements}
          unitSystem={unitSystem}
          isVisible={is2DMode}
          onRoomsChange={handleRoomsChange}
          openingsVersion={openingsVersion}
          houseName={houseName}
          isEditingName={isEditingName}
          nameInputRef={nameInputRef}
          onNameChange={(name) => { setHouseName(name); setIsDirty(true); }}
          onStartEditing={() => {
            setIsEditingName(true);
            setTimeout(() => nameInputRef.current?.select(), 10);
          }}
          onStopEditing={(fallback) => {
            if (fallback && !houseName.trim()) setHouseName(fallback);
            setIsEditingName(false);
          }}
          onBack={() => handleNavigateBack(isTemplateMode ? "/admin" : "/floorplan3d/dashboard")}
          is2DMode={is2DMode}
          onToggleMode={setIs2DMode}
          onUndoRedoChange={handleEditor2DUndoRedoChange}
          roomFloorColors={roomFloorColors}
          onStandaloneWallsChange={handleStandaloneWallsChange}
          onFurnitureMove={(roomId, dx, dz) => {
            setAllRoomFurniture((prev) => {
              const items = prev[roomId];
              if (!items || items.length === 0) return prev;
              return {
                ...prev,
                [roomId]: items.map((item) => ({
                  ...item,
                  position: [
                    item.position[0] + dx,
                    item.position[1],
                    item.position[2] + dz,
                  ] as [number, number, number],
                })),
              };
            });
          }}
          onFurnitureItemMove={(roomId, itemId, newX, newZ) => {
            setAllRoomFurniture((prev) => {
              const items = prev[roomId];
              if (!items) return prev;
              return {
                ...prev,
                [roomId]: items.map((item) =>
                  item.id === itemId
                    ? { ...item, position: [newX, item.position[1], newZ] as [number, number, number] }
                    : item
                ),
              };
            });
          }}
          onOpenFurniturePanel={() => {
            setLeftPanel(leftPanel === "furniture" ? null : "furniture");
            setMobileSheet(mobileSheet === "furniture" ? null : "furniture");
          }}
          furniturePanelOpen={leftPanel === "furniture" || mobileSheet === "furniture"}
          onUndo={effectiveUndo}
          onRedo={effectiveRedo}
          parentCanUndo={effectiveCanUndo}
          parentCanRedo={effectiveCanRedo}
          toolChangeRef={toolChangeRef}
          onActiveToolChange={handleActiveToolReport}
          useMobileBottomNav={true}
          onRotateItem={handleRotateSelected}
          onDeleteItem={handleDeleteSelected}
          onDuplicateItem={handleDuplicateSelected}
        />
      )}

      {/* ═══════════════════════════════════════
           RENDER MODE OVERLAY
         ═══════════════════════════════════════ */}
      {showRenderMode && !isTemplateMode && (
        <RenderModeOverlay
          sceneRef={sceneRefForHotspots}
          onBack={() => { setShowRenderMode(false); const s = sceneRefForHotspots.current; if (s) s.disableCutaway = false; }}
          editorProjectId={urlProjectId}
          editorProjectName={houseName}
          rooms={HOUSE_ROOM_DEFS.map((r) => ({ id: r.id, label: r.label, shortLabel: r.shortLabel, bounds: r.bounds }))}
        />
      )}

      {/* ═══════════════════════════════════════
           FROSTED GLASS TOP NAVIGATION BAR
         ═══════════════════════════════════════ */}
      {!showRenderMode && (
      <div className="absolute top-3 md:top-4 right-3 md:right-4 z-30">
        <div className="bg-white/76 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-white/50 px-2 md:px-3 py-1.5 h-[40px] md:h-auto flex items-center gap-1.5 md:gap-2">
          {/* Back button (desktop only via More Options menu) */}
          {/* Right actions */}
          {viewMode === "editor" && !showRenderMode && (
            <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
              {/* More Options */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="hidden md:flex size-[30px] rounded-full items-center justify-center hover:bg-[#F6F6F6] transition-colors active:scale-90 text-[#09090B]"
                  title="More Options"
                >
                  <MoreHorizontal className="size-[14px]" strokeWidth={1.5} />
                </button>
                <AnimatePresence>
                  {showMoreMenu && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 bg-white rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#F3F4F6] overflow-hidden w-[200px] z-50"
                    >
                      <button onClick={() => { handleScreenshot(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors">
                        <Image className="size-[15px] text-[#71717A]" strokeWidth={1.5} />
                        <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">Screenshot</span>
                      </button>
                      {isTemplateMode && (
                        <button onClick={() => { setShowTemplateMetaModal(true); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors">
                          <FileText className="size-[15px] text-[#71717A]" strokeWidth={1.5} />
                          <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">Template Info</span>
                        </button>
                      )}
                      <button onClick={() => { setShowShortcutsModal(true); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors">
                        <Keyboard className="size-[15px] text-[#71717A]" strokeWidth={1.5} />
                        <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">Keyboard Shortcuts</span>
                      </button>
                      <div className="h-px bg-[#F3F4F6]" />
                      <button onClick={() => { handleNavigateBack(isTemplateMode ? "/admin" : "/floorplan3d/dashboard"); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F9FAFB] transition-colors">
                        <Home className="size-[15px] text-[#71717A]" strokeWidth={1.5} />
                        <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">{isTemplateMode ? "Back to Admin" : "Back to Dashboard"}</span>
                      </button>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden md:block w-px h-[20px] bg-[#E5E7EB] mx-0.5" />

              {/* Undo / Redo */}
              <div className="hidden md:flex items-center gap-0.5">
                <button
                  onClick={effectiveUndo}
                  disabled={!effectiveCanUndo}
                  className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors disabled:opacity-30"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={effectiveRedo}
                  disabled={!effectiveCanRedo}
                  className="size-[30px] rounded-full flex items-center justify-center hover:bg-[#F6F6F6] transition-colors disabled:opacity-30"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
                </button>
              </div>

              {/* Save button — icon only, styled like undo/redo */}
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className={`hidden md:flex size-[30px] rounded-full items-center justify-center transition-all duration-200 active:scale-90 ${
                  isSaving
                    ? "text-[#C0C0C0] cursor-wait"
                    : isDirty
                    ? "bg-[#09090B] text-white shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
                    : "hover:bg-[#F6F6F6] text-[#71717A]"
                }`}
                title={isDirty ? "Save changes (Ctrl+S)" : "All changes saved"}
              >
                {isSaving ? (
                  <Loader2 className="size-[14px] animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="size-[14px]" strokeWidth={1.5} />
                )}
              </button>

              <div className="hidden md:block w-px h-[20px] bg-[#E5E7EB] mx-0.5" />

              {/* Render button — desktop (hidden in template mode) */}
              {!isTemplateMode && (
              <button
                onClick={() => { setShowRenderMode(true); setIs2DMode(false); const s = sceneRefForHotspots.current; if (s) s.disableCutaway = true; }}
                className="hidden md:flex items-center gap-1.5 h-[30px] px-3 rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:opacity-90 transition-all active:scale-95"
                title="Open Render Mode"
              >
                <Sparkles className="size-[13px]" strokeWidth={1.5} />
                <span>Render</span>
              </button>
              )}

              {/* Save button — mobile (icon only) */}
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className={`md:hidden size-[36px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
                  isSaving
                    ? "bg-[#F6F6F6] text-[#C0C0C0] cursor-wait"
                    : isDirty
                    ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                    : "bg-[#F6F6F6] text-[#71717A]"
                }`}
                title={isDirty ? "Save changes" : "All changes saved"}
              >
                {isSaving ? (
                  <Loader2 className="size-[15px] animate-spin" strokeWidth={2} />
                ) : (
                  <Save className="size-[15px]" strokeWidth={1.5} />
                )}
              </button>

              {/* Render button — mobile (hidden in template mode) */}
              {!isTemplateMode && (
              <button
                onClick={() => { setShowRenderMode(true); setIs2DMode(false); const s = sceneRefForHotspots.current; if (s) s.disableCutaway = true; }}
                className="md:hidden size-[36px] rounded-full bg-[#09090B] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] active:scale-90 transition-all"
                title="Render"
              >
                <Sparkles className="size-[16px]" strokeWidth={1.5} />
              </button>
              )}
            </div>
          )}
          {viewMode === "room-select" && (
            <button
              onClick={handleViewWholeHouse}
              className={`size-[36px] md:size-[34px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0 ${
                houseViewMode === "house"
                  ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                  : "bg-[#F6F6F6] hover:bg-[#E5E7EB] text-[#09090B]"
              }`}
            >
              <Maximize2 className="size-[15px]" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════
           ROOM SELECTION MODE — LEFT PANEL (Desktop)
         ═══════════════════════════════════════ */}
      <AnimatePresence>
        {viewMode === "room-select" && (
          <motion.div
            initial={{ x: -roomSelectPanelWidth, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -roomSelectPanelWidth, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-3 top-[68px] bottom-3 z-20 hidden md:flex"
            style={{ width: roomSelectPanelWidth }}
          >
            <div className="w-full h-full bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] flex flex-col overflow-hidden">
              <RoomSelectionPanel
                activeHouseRoom={activeHouseRoom}
                hoveredHouseRoom={hoveredHouseRoom}
                houseViewMode={houseViewMode}
                onSelectRoom={handleSelectHouseRoom}
                onHoverRoom={setHoveredHouseRoom}
                onViewHouse={handleViewWholeHouse}
                onContinue={handleContinueToEditor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Selection — Floating Room Label */}
      {viewMode === "room-select" && (
        <AnimatePresence mode="wait">
          {houseViewMode === "room" && (() => {
            const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeHouseRoom);
            return def ? <RoomLabel key={def.id} label={def.label} accent={def.accent} /> : null;
          })()}
          {houseViewMode === "house" && (
            <RoomLabel key="house" label="Entire House — Overview" accent="#09090B" />
          )}
        </AnimatePresence>
      )}

      {/* Editor Mode — Floating Room Label removed (all rooms always visible) */}

      {/* Room Selection — Bottom Quick Switcher (Desktop) */}
      {viewMode === "room-select" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex">
          <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-white/50 px-2.5 py-2 flex items-center gap-1">
            {HOUSE_ROOM_DEFS.map((def) => {
              const isActive = activeHouseRoom === def.id && houseViewMode === "room";
              return (
                <button
                  key={def.id}
                  onClick={() => handleSelectHouseRoom(def.id)}
                  onMouseEnter={() => setHoveredHouseRoom(def.id)}
                  onMouseLeave={() => setHoveredHouseRoom(null)}
                  className={`px-3.5 py-2 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#09090B] text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                      : "text-[#71717A] hover:text-[#09090B] hover:bg-white/60"
                  }`}
                >
                  {isActive && <div className="size-[6px] rounded-full bg-white/60" />}
                  {def.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Selection — Mobile Bottom Sheet */}
      {viewMode === "room-select" && (
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-30">
          {/* Room quick-switch pills */}
          <div className="px-3 pb-3">
            <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-white/50 p-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2 border-b border-[#F3F4F6]">
                {HOUSE_ROOM_DEFS.map((def) => {
                  const isActive = activeHouseRoom === def.id && houseViewMode === "room";
                  return (
                    <button
                      key={def.id}
                      onClick={() => handleSelectHouseRoom(def.id)}
                      className={`shrink-0 px-3.5 py-2 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all duration-200 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                          : "bg-[#F6F6F6] text-[#09090B]"
                      }`}
                    >
                      {isActive && <div className="size-[5px] rounded-full bg-white/60" />}
                      {def.shortLabel}
                    </button>
                  );
                })}
              </div>
              {/* CTA */}
              <div className="bg-[#F6F6F6] border border-white rounded-[100px] p-[4px]">
                <button
                  onClick={handleContinueToEditor}
                  className="w-full flex items-center justify-center gap-2 h-[44px] rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.7px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] active:scale-[0.98] transition-transform"
                >
                  Edit {HOUSE_ROOM_DEFS.find((r) => r.id === activeHouseRoom)?.label || "Room"}
                  <ArrowRight className="size-[15px]" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {viewMode === "editor" && isDirty && urlProjectId && !showRenderMode && (
        <div className="absolute top-16 md:top-[60px] left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:block">
          <div className="bg-white/60 backdrop-blur-[8px] rounded-[100px] px-3 py-1 border border-white/30">
            <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A] flex items-center gap-1.5">
              <Clock className="size-[10px]" strokeWidth={1.5} />
              Auto-save in 30s
            </span>
          </div>
        </div>
      )}

      {/* Room Selection — Reset Camera (top-right area, below nav) */}
      {viewMode === "room-select" && (
        <div className="absolute top-16 md:top-[72px] right-3 md:right-4 z-20">
          <button
            onClick={() => {
              const s = sceneRefForHotspots.current;
              if (!s) return;
              const def = HOUSE_ROOM_DEFS.find((r) => r.id === activeHouseRoom);
              if (houseViewMode === "room" && def) {
                s.flyToPos(def.cameraPos, def.cameraTarget, 800);
              } else {
                s.flyToPos(HOUSE_CAM_POS, HOUSE_CAM_TARGET, 800);
              }
            }}
            className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-white/50 px-3.5 py-2 flex items-center gap-2 hover:bg-white/90 transition-colors active:scale-95"
          >
            <Eye className="size-[15px] text-[#09090B]" strokeWidth={1.5} />
            <span className="font-['Inter',sans-serif] text-[12px] font-medium text-[#09090B] tracking-[-0.2px]">Reset View</span>
          </button>
        </div>
      )}

      {/* ═════════════════════��═════════════════
           EDITOR MODE — LEFT PANEL (Desktop)
         ═══════════════════════════════════════ */}
      <AnimatePresence>
        {viewMode === "editor" && leftPanel && !showRenderMode && (is2DMode ? leftPanel === "furniture" : true) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute top-3 bottom-[60px] hidden md:flex ${is2DMode ? "left-[56px] z-[35]" : "left-[68px] z-20"}`}
            style={{ width: 280 }}
          >
            <div className="w-full h-full bg-white/95 backdrop-blur-[16.75px] rounded-[17px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] flex flex-col overflow-hidden">
              {leftPanel === "furniture" && (
                <FurniturePanel onAddItem={handleAddItem} onClose={() => setLeftPanel(null)} onAutoFurnish={handleAutoFurnish} roomLabel={activeDef?.shortLabel || activeDef?.label} />
              )}
              {leftPanel === "customize" && !is2DMode && (
                <CustomizePanel
                  materials={materials}
                  onMaterialChange={handleMaterialChange}
                  lighting={lighting}
                  onLightingChange={handleLightingChange}
                  activeCamPreset={activeCamPreset}
                  onCameraPreset={handleCameraPreset}
                  globalTimeOfDay={globalTimeOfDay}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Mode — Left-side Toggle (when desktop panel is closed) */}
      {viewMode === "editor" && !leftPanel && !is2DMode && !showRenderMode && (
        <Editor3DPanelToggle onOpen={() => setLeftPanel("furniture")} />
      )}

      {/* ═══ 3D OVERLAY COMPONENTS (matching 2D design) ═══ */}
      {/* 3D Toolbar (right side) */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DToolbar
          activeTool={active3DTool}
          onToolChange={setActive3DTool}
          onOpenFurniture={() => setLeftPanel(leftPanel === "furniture" ? null : "furniture")}
          onOpenCustomize={() => setLeftPanel(leftPanel === "customize" ? null : "customize")}
          isFurnitureOpen={leftPanel === "furniture"}
          isCustomizeOpen={leftPanel === "customize"}
        />
      )}

      {/* 3D Info Bar (top-left) */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DInfoBar
          activeRoom={activeDef ? {
            id: activeDef.id, label: activeDef.label, shortLabel: activeDef.shortLabel,
            bounds: activeDef.bounds, accent: activeDef.accent,
            floorColor: activeDef.floorColor, wallColor: activeDef.wallColor,
          } : null}
          allRooms={allRoomDefs}
          totalObjects={totalObjects}
          unitSystem={unitSystem}
          showPanel={!!leftPanel}
          houseName={houseName}
          isEditingName={isEditingName}
          nameInputRef={nameInputRef}
          onNameChange={(name) => { setHouseName(name); setIsDirty(true); }}
          onStartEditing={() => {
            setIsEditingName(true);
            setTimeout(() => nameInputRef.current?.select(), 10);
          }}
          onStopEditing={(fallback) => {
            if (fallback && !houseName.trim()) setHouseName(fallback);
            setIsEditingName(false);
          }}
          onBack={() => handleNavigateBack(isTemplateMode ? "/admin" : "/floorplan3d/dashboard")}
        />
      )}

      {/* 2D/3D View Toggle (top-center) */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DViewToggle
          is2DMode={is2DMode}
          onToggleMode={setIs2DMode}
        />
      )}

      {/* 3D Help Tips */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DHelpTips
          activeTool={active3DTool}
          selectedItem={!!selectedItem}
          isDragging={isDragging}
        />
      )}

      {/* 3D Active Tool Indicator */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DActiveToolIndicator
          activeTool={active3DTool}
          onReset={() => setActive3DTool("select")}
        />
      )}

      {/* ═══ EDITOR MODE — 3D ROOM SWITCHER (Desktop) ═══ */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DRoomSwitcher
          rooms={allRoomDefs}
          activeRoomId={activeEditorRoomId}
          onSelectRoom={(roomId) => {
            const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
            if (def) handleSwitchEditorRoom(def);
          }}
        />
      )}

      {/* ═══════════════════════════════════════
           EDITOR MODE — MOBILE BOTTOM NAV (replaces old sheet + FAB)
         ═══════════════════════════════════════ */}
      {viewMode === "editor" && !showRenderMode && (
        <>
          <MobileBottomNav
            is2DMode={is2DMode}
            onToggleMode={setIs2DMode}
            rooms={allRoomDefs}
            activeRoomId={activeEditorRoomId}
            onSelectRoom={(roomId) => {
              const def = HOUSE_ROOM_DEFS.find((r) => r.id === roomId);
              if (def) handleSwitchEditorRoom(def);
            }}
            activeTool={mobileActiveTool}
            onToolChange={handleMobileToolChange}
            catalog={CATALOG}
            onAddFurniture={handleAddItem}
            onAutoFurnish={handleAutoFurnish}
            activeRoomLabel={activeDef?.shortLabel || activeDef?.label}
            onOpenCustomize={() => {
              setMobileSheet(mobileSheet === "customize" ? null : "customize");
            }}
            onUndo={effectiveUndo}
            onRedo={effectiveRedo}
            canUndo={effectiveCanUndo}
            canRedo={effectiveCanRedo}
            onRender={() => { setShowRenderMode(true); setIs2DMode(false); const s = sceneRefForHotspots.current; if (s) s.disableCutaway = true; }}
            visible={true}
            renderThumbnail={(id, color) => { try { return renderThumbnail(id, color); } catch { return null; } }}
            onAddRoomShape={handleAddRoomShape}
          />

          {/* Customize panel bottom sheet (triggered from MobileBottomNav exterior tab) */}
          <AnimatePresence>
            {mobileSheet === "customize" && !is2DMode && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="md:hidden fixed inset-0 bg-black/20 z-[50]"
                  onClick={() => setMobileSheet(null)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="md:hidden fixed bottom-0 left-0 right-0 z-[51] bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-h-[75vh] flex flex-col"
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-[#E5E7EB] rounded-full" />
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <CustomizePanel
                      materials={materials}
                      onMaterialChange={handleMaterialChange}
                      lighting={lighting}
                      onLightingChange={handleLightingChange}
                      activeCamPreset={activeCamPreset}
                      onCameraPreset={handleCameraPreset}
                      globalTimeOfDay={globalTimeOfDay}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </>
      )}

      {/* ═══ EDITOR MODE — RADIAL ACTION MENU (floats over selected 3D object) ═══ */}
      <AnimatePresence>
        {viewMode === "editor" && selectedItem && !isDragging && !is2DMode && !showRenderMode && (
          <RadialActionMenu
            item={selectedItem}
            sceneRef={sceneRefForHotspots}
            viewportRef={viewportRef}
            onRotate={handleRotateSelected}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
          />
        )}
      </AnimatePresence>

      {/* ═══ EDITOR MODE — OPENING ACTION MENU (floats over selected door/window in 3D) ═══ */}
      <AnimatePresence>
        {viewMode === "editor" && selectedOpening && !isDragging && !is2DMode && !showRenderMode && (
          <OpeningActionMenu
            opening={selectedOpening}
            sceneRef={sceneRefForHotspots}
            viewportRef={viewportRef}
            onFlip={handleFlipOpening}
            onDelete={handleDeleteOpening}
            onDeselect={() => setSelectedOpening(null)}
          />
        )}
      </AnimatePresence>

      {/* ═══ EDITOR MODE — OPENING DRAG OVERLAY (snap guides + dimension labels) ═══ */}
      {viewMode === "editor" && openingDragOverlay && !is2DMode && !showRenderMode && (
        <OpeningDragOverlayUI info={openingDragOverlay} />
      )}

      {/* ═══ EDITOR MODE — BOTTOM PROPERTIES BAR (Desktop, matching 2D) ═══ */}
      <AnimatePresence>
        {viewMode === "editor" && selectedItem && !isDragging && !is2DMode && !showRenderMode && (
          <Editor3DPropertiesBar
            selectedItem={selectedItem as any}
            activeRoom={activeDef ? {
              id: activeDef.id, label: activeDef.label, shortLabel: activeDef.shortLabel,
              bounds: activeDef.bounds, accent: activeDef.accent,
              floorColor: activeDef.floorColor, wallColor: activeDef.wallColor,
            } : null}
            unitSystem={unitSystem}
            onRotate={handleRotateSelected}
            onDelete={handleDeleteSelected}
            onDuplicate={handleDuplicateSelected}
            onDeselect={() => setSelectedId(null)}
            isOverlapping={isOverlapping}
          />
        )}
      </AnimatePresence>

      {/* ═══ EDITOR MODE — BOTTOM CONTROL BAR (Desktop, matching 2D) ═══ */}
      {viewMode === "editor" && !is2DMode && !showRenderMode && (
        <Editor3DBottomBar
          zoomLevel={zoomLevel}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((p) => !p)}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((p) => !p)}
          showMeasurements={showMeasurements}
          onToggleMeasurements={() => setShowMeasurements((p) => !p)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          unitSystem={unitSystem}
          onSetUnit={(u) => setUnitSystem(u)}
        />
      )}

      {/* ═══ Bottom-Left: Disclaimer ═══ */}
      <div className={`absolute bottom-1 left-3 z-10 hidden md:block ${is2DMode || showRenderMode ? "!hidden" : ""}`} style={{ marginLeft: leftPanel ? panelWidth + 8 : 0, transition: "margin-left 0.3s ease" }}>
        <span className="font-['Inter',sans-serif] text-[9px] text-white/50">
          3D furniture is for visualization only. Actual items may vary.
        </span>
      </div>

      {/* ═══ Editor Mode: Drag Indicator ═══ */}
      <AnimatePresence>
        {viewMode === "editor" && isDragging && !showRenderMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 md:top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className={`backdrop-blur-[16.75px] rounded-[100px] px-5 py-2.5 flex items-center gap-2.5 transition-colors duration-150 border ${
              isOverlapping
                ? "bg-red-500/90 border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                : "bg-[#09090B]/80 border-white/10"
            }`}>
              {isOverlapping ? (
                <>
                  <div className="size-[16px] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold leading-none">!</span>
                  </div>
                  <span className="font-['Inter',sans-serif] text-[13px] text-white font-medium tracking-[-0.3px]">Can't place here — overlapping</span>
                </>
              ) : (
                <>
                  <Move className="size-[15px] text-white" strokeWidth={2} />
                  <span className="font-['Inter',sans-serif] text-[13px] text-white font-medium tracking-[-0.3px]">Drag to move &middot; Release to place</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Editor Mode: Selected Item Controls (mobile only — desktop uses Editor3DPropertiesBar) ═══ */}
      <AnimatePresence>
        {viewMode === "editor" && selectedItem && !isDragging && !showRenderMode && (
          <div className="md:hidden">
            <SelectedItemBar item={selectedItem} onRotate={handleRotateSelected} onDelete={handleDeleteSelected} onDeselect={() => setSelectedId(null)} isOverlapping={isOverlapping} />
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Save Error Toast ═══ */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white rounded-[100px] px-5 py-3 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(239,68,68,0.3)]"
          >
            <AlertTriangle className="size-[16px]" strokeWidth={2} />
            <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">{saveError}</span>
            <button onClick={() => setSaveError(null)} className="ml-1 hover:opacity-80 transition-opacity">
              <X className="size-[14px]" strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Template Metadata Modal ═══ */}
      <AnimatePresence>
        {showTemplateMetaModal && isTemplateMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowTemplateMetaModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.07)] border border-[#F3F4F6] w-[90vw] max-w-[480px] max-h-[90vh] overflow-y-auto p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-[40px] rounded-[14px] bg-[#F6F6F6] flex items-center justify-center">
                    <FileText className="size-[20px] text-[#09090B]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090B] tracking-[-0.5px]">Template Info</h3>
                    <p className="font-['Inter',sans-serif] text-[12px] text-[#71717A]">Edit metadata for this template</p>
                  </div>
                </div>
                <button onClick={() => setShowTemplateMetaModal(false)} className="size-[34px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors">
                  <X className="size-[18px] text-[#71717A]" />
                </button>
              </div>

              {templateThumbnail && (
                <div className="mb-5 rounded-[12px] overflow-hidden border border-[#F3F4F6] bg-[#F6F6F6]">
                  <img src={templateThumbnail} alt="Template preview" className="w-full h-[160px] object-cover" />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={houseName}
                    onChange={(e) => { setHouseName(e.target.value); setIsDirty(true); }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors"
                    placeholder="e.g. Modern 3-Room BTO"
                  />
                </div>

                <div>
                  <label className="block font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-1.5">Category</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => { setTemplateCategory(e.target.value); setIsDirty(true); }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="bto">BTO</option>
                    <option value="resale">Resale HDB</option>
                    <option value="condo">Condo</option>
                    <option value="landed">Landed</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-1.5">Unit Type</label>
                  <select
                    value={templateUnitType}
                    onChange={(e) => { setTemplateUnitType(e.target.value); setIsDirty(true); }}
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 font-['Inter',sans-serif] text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="2-Room">2-Room</option>
                    <option value="3-Room">3-Room</option>
                    <option value="4-Room">4-Room</option>
                    <option value="5-Room">5-Room</option>
                    <option value="Executive">Executive</option>
                    <option value="Studio">Studio</option>
                    <option value="1-Bedroom">1-Bedroom</option>
                    <option value="2-Bedroom">2-Bedroom</option>
                    <option value="3-Bedroom">3-Bedroom</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-['Inter',sans-serif] font-medium text-[14px] text-[#09090B] mb-1.5">Description</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => { setTemplateDescription(e.target.value); setIsDirty(true); }}
                    rows={3}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 py-3 font-['Inter',sans-serif] text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors resize-none"
                    placeholder="Brief description of this template layout..."
                  />
                </div>

                <button
                  onClick={() => {
                    const thumb = captureThumbnail();
                    if (thumb) {
                      setTemplateThumbnail(thumb);
                      setIsDirty(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-[42px] bg-[#F6F6F6] border border-[#E5E7EB] rounded-[14px] font-['Inter',sans-serif] text-[13px] font-medium text-[#09090B] hover:bg-[#EEEEEE] transition-colors"
                >
                  <Camera className="size-[15px]" strokeWidth={1.5} />
                  {templateThumbnail ? "Update Thumbnail from Current View" : "Capture Thumbnail from Current View"}
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateMetaModal(false)}
                  className="flex-1 h-[42px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[14px] font-medium hover:bg-[#F6F6F6] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleSaveProject(); setShowTemplateMetaModal(false); }}
                  className="flex-1 h-[42px] rounded-[14px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[14px] font-semibold tracking-[-0.35px] hover:opacity-90 transition-opacity"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Screenshot Toast ═══ */}
      <AnimatePresence>
        {screenshotToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#09090B] text-white rounded-[100px] px-5 py-3 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
          >
            <Camera className="size-[16px]" strokeWidth={2} />
            <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">Screenshot saved!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Save Success Indicator ═══ */}
      <AnimatePresence>
        {lastSaved && !isDirty && !isSaving && !showRenderMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 md:top-[60px] z-20"
            style={{ right: 16 }}
          >
            <div className="bg-white/80 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/50 px-3.5 py-1.5 flex items-center gap-2">
              <Check className="size-[13px] text-emerald-500" strokeWidth={2.5} />
              <span className="font-['Inter',sans-serif] text-[11px] text-[#71717A] tracking-[-0.2px]">
                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Keyboard Shortcuts Modal ═══ */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShortcutsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[480px] p-6 max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="size-[40px] rounded-[12px] bg-[#F6F6F6] flex items-center justify-center">
                    <Keyboard className="size-[18px] text-[#09090B]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090B] tracking-[-0.5px]">Keyboard Shortcuts</h3>
                </div>
                <button onClick={() => setShowShortcutsModal(false)} className="size-[32px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center">
                  <X className="size-[14px] text-[#09090B]" strokeWidth={2} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {[
                  { key: "Tab / V", action: "Toggle 2D / 3D" },
                  { key: "1", action: "Switch to 3D" },
                  { key: "2", action: "Switch to 2D" },
                  { key: "Ctrl+Z", action: "Undo" },
                  { key: "Ctrl+Shift+Z", action: "Redo" },
                  { key: "Ctrl+S", action: "Save" },
                  { key: "Ctrl+D", action: "Duplicate selected" },
                  { key: "Delete", action: "Delete selected" },
                  { key: "Esc", action: "Deselect" },
                  { key: "G", action: "Toggle grid" },
                  { key: "S", action: "Toggle snap" },
                  { key: "F", action: "Zoom to fit" },
                  { key: "P", action: "Toggle properties" },
                  { key: "R", action: "Rotate selected" },
                  { key: "Arrow Keys", action: "Nudge selected" },
                  { key: "Shift+Arrow", action: "Fine nudge" },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2.5 px-3 rounded-[10px] hover:bg-[#F9FAFB]">
                    <span className="font-['Inter',sans-serif] text-[13px] text-[#09090B]">{shortcut.action}</span>
                    <kbd className="font-['Inter',sans-serif] text-[12px] text-[#71717A] bg-[#F6F6F6] border border-[#E5E7EB] rounded-[8px] px-2.5 py-1 font-medium">{shortcut.key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Unsaved Changes Modal ═══ */}
      <AnimatePresence>
        {showUnsavedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUnsavedModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[420px] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="size-[44px] rounded-[14px] bg-[#FFF6DC] border border-[#FFEAB1] flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-[22px] text-[#09090B]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#09090B] tracking-[-0.5px]">Unsaved Changes</h3>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A]">Your design has changes that haven't been saved.</p>
                </div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] p-4 mb-5">
                <p className="font-['Inter',sans-serif] text-[13px] text-[#71717A] leading-relaxed">
                  If you leave without saving, all changes since your last save will be lost.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDiscardAndLeave}
                  className="flex-1 h-[44px] rounded-[14px] border border-[#E5E7EB] bg-white text-[#09090B] font-['Inter',sans-serif] text-[14px] font-medium tracking-[-0.3px] hover:bg-[#F6F6F6] transition-colors"
                >
                  Discard & Leave
                </button>
                <button
                  onClick={handleSaveAndLeave}
                  disabled={isSaving}
                  className="flex-1 h-[44px] rounded-[14px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[14px] font-semibold tracking-[-0.35px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-[15px] animate-spin" strokeWidth={2} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-[15px]" strokeWidth={1.5} />
                      Save & Leave
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full mt-3 h-[36px] rounded-[14px] text-[#71717A] font-['Inter',sans-serif] text-[13px] font-medium hover:text-[#09090B] hover:bg-[#F6F6F6] transition-colors"
              >
                Continue Editing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
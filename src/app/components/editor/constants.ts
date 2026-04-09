/* ═══════════════════════════════════════════════════════
   Editor Constants — Catalog, Materials, Defaults
   ═══════════════════════════════════════════════════════ */
import {
  Sofa, Armchair, Square, Bed, Box, Lamp, CookingPot, Monitor, Bath,
  CircleDot, Fan, Wine, Circle, Layers, Flower2, TreePine, Footprints,
  ShowerHead, User, Frame, Thermometer, Baby, UtensilsCrossed, PawPrint,
  Car, Lightbulb, Plug, Tv, Laptop, Speaker, Flame, Music, Dumbbell,
  Wind, Archive, Fish, Bike, Gamepad2,
} from "lucide-react";
import type { CatalogItem, HouseRoomDef, RoomZone, SceneMaterials, SceneLighting } from "./types";

// ── Wall dimensions ──

export const WALL_H = 2.6;
export const WALL_THICK = 0.12;

// ── Furniture Categories ──

export const FURNITURE_CATEGORIES = [
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
] as const;

// ── Furniture Catalog ──

export const CATALOG: CatalogItem[] = [
  // ═══ INTERIOR > FURNITURE ═══
  // Seating
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
  // Beds
  { id: "queen-bed", name: "Queen Bed", category: "beds", icon: Bed, dimensions: [1.53, 0.5, 2.03], color: "#E8E0D4" },
  { id: "king-bed", name: "King Bed", category: "beds", icon: Bed, dimensions: [1.83, 0.5, 2.03], color: "#D4C4B0" },
  { id: "single-bed", name: "Single Bed", category: "beds", icon: Bed, dimensions: [0.91, 0.5, 1.9], color: "#E8E0D4" },
  { id: "super-single", name: "Super Single Bed", category: "beds", icon: Bed, dimensions: [1.07, 0.5, 1.9], color: "#E8E0D4" },
  { id: "nightstand", name: "Bedside Table", category: "beds", icon: Box, dimensions: [0.5, 0.55, 0.4], color: "#C4A46C" },
  { id: "daybed", name: "Daybed", category: "beds", icon: Bed, dimensions: [2.0, 0.6, 0.9], color: "#D4C4B0" },
  { id: "murphy-bed", name: "Murphy Bed", category: "beds", icon: Bed, dimensions: [1.53, 2.1, 0.4], color: "#FFFFFF" },
  // Storage
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
  // Tables
  { id: "dining-table", name: "Dining Table (4-Pax)", category: "tables", icon: Square, dimensions: [1.2, 0.75, 0.8], color: "#C4A46C" },
  { id: "dining-table-6", name: "Dining Table (6-Pax)", category: "tables", icon: Square, dimensions: [1.6, 0.75, 0.9], color: "#C4A46C" },
  { id: "coffee-table", name: "Coffee Table", category: "tables", icon: Square, dimensions: [1.2, 0.45, 0.6], color: "#C4A46C" },
  { id: "round-table", name: "Round Dining Table", category: "tables", icon: Circle, dimensions: [1.1, 0.76, 1.1], color: "#C4A46C" },
  { id: "side-table", name: "Side Table", category: "tables", icon: Square, dimensions: [0.5, 0.55, 0.5], color: "#8A8A8A" },
  { id: "console-table", name: "Console Table", category: "tables", icon: Square, dimensions: [1.2, 0.78, 0.35], color: "#8A8A8A" },
  { id: "bar-counter", name: "Bar Countertop", category: "tables", icon: Square, dimensions: [1.5, 1.0, 0.5], color: "#8A8A8A" },
  { id: "folding-table", name: "Folding Table", category: "tables", icon: Square, dimensions: [1.2, 0.75, 0.6], color: "#D0D0D0" },
  { id: "nesting-tables", name: "Nesting Tables", category: "tables", icon: Square, dimensions: [0.5, 0.5, 0.4], color: "#C4A46C" },
  // Office
  { id: "office-chair", name: "Office Chair", category: "office", icon: Armchair, dimensions: [0.6, 1.0, 0.6], color: "#2D2D2D" },
  { id: "desk", name: "Study Desk", category: "office", icon: Monitor, dimensions: [1.2, 0.75, 0.6], color: "#C4A46C" },
  { id: "desk-setup", name: "Desktop Setup", category: "office", icon: Monitor, dimensions: [1.4, 0.75, 0.7], color: "#8A8A8A" },
  { id: "standing-desk", name: "Standing Desk", category: "office", icon: Monitor, dimensions: [1.4, 1.1, 0.7], color: "#C4A46C" },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "office", icon: Archive, dimensions: [0.4, 0.7, 0.5], color: "#A0A0A0" },
  { id: "office-bookshelf", name: "Office Bookshelf", category: "office", icon: Box, dimensions: [0.9, 1.8, 0.35], color: "#C4A46C" },
  { id: "whiteboard", name: "Whiteboard", category: "office", icon: Frame, dimensions: [1.2, 0.9, 0.05], color: "#FFFFFF" },
  // Children
  { id: "crib", name: "Baby Crib", category: "children", icon: Baby, dimensions: [0.7, 0.9, 1.3], color: "#FFFFFF" },
  { id: "bunk-bed", name: "Bunk Bed", category: "children", icon: Bed, dimensions: [1.0, 1.6, 2.0], color: "#C4A46C" },
  { id: "toy-box", name: "Toy Storage Box", category: "children", icon: Box, dimensions: [0.8, 0.5, 0.5], color: "#E8E0D4" },
  { id: "kids-desk", name: "Kids Study Desk", category: "children", icon: Square, dimensions: [0.8, 0.6, 0.5], color: "#C4A46C" },
  { id: "kids-chair", name: "Kids Chair", category: "children", icon: Armchair, dimensions: [0.4, 0.6, 0.4], color: "#8A8A8A" },
  { id: "changing-table", name: "Changing Table", category: "children", icon: Square, dimensions: [0.9, 0.9, 0.6], color: "#FFFFFF" },
  // Kitchen
  { id: "kitchen-counter", name: "Kitchen Counter (L-Shape)", category: "kitchen", icon: CookingPot, dimensions: [2.1, 0.9, 0.6], color: "#FFFFFF" },
  { id: "kitchen-island", name: "Kitchen Island", category: "kitchen", icon: CookingPot, dimensions: [1.58, 0.9, 0.72], color: "#8A8A8A" },
  { id: "upper-cabinet", name: "Upper Cabinet", category: "kitchen", icon: Box, dimensions: [0.6, 0.7, 0.35], color: "#FFFFFF" },
  { id: "lower-cabinet", name: "Lower Cabinet", category: "kitchen", icon: Box, dimensions: [0.6, 0.85, 0.6], color: "#FFFFFF" },
  { id: "kitchen-sink", name: "Kitchen Sink", category: "kitchen", icon: CookingPot, dimensions: [0.8, 0.2, 0.5], color: "#C0C0C0" },
  { id: "pantry-shelf", name: "Pantry Shelf", category: "kitchen", icon: Box, dimensions: [0.8, 1.8, 0.4], color: "#C4A46C" },
  // Bathroom
  { id: "toilet", name: "Toilet Bowl", category: "bathroom", icon: Bath, dimensions: [0.4, 0.4, 0.7], color: "#F5F5F5" },
  { id: "wash-basin", name: "Wash Basin (Wall)", category: "bathroom", icon: Bath, dimensions: [0.5, 0.2, 0.4], color: "#F5F5F5" },
  { id: "vanity-cabinet", name: "Vanity Cabinet", category: "bathroom", icon: Bath, dimensions: [0.6, 0.8, 0.45], color: "#FFFFFF" },
  { id: "shower", name: "Shower Screen", category: "bathroom", icon: ShowerHead, dimensions: [0.9, 1.9, 0.05], color: "#E8E8E8" },
  { id: "bathtub", name: "Bathtub", category: "bathroom", icon: Bath, dimensions: [1.7, 0.6, 0.75], color: "#F0F0F0" },
  { id: "towel-rack", name: "Towel Rack", category: "bathroom", icon: Bath, dimensions: [0.6, 0.05, 0.1], color: "#C0C0C0" },
  { id: "bath-mirror", name: "Bathroom Mirror", category: "bathroom", icon: Circle, dimensions: [0.6, 0.8, 0.05], color: "#E0E0E0" },
  { id: "bidet", name: "Bidet", category: "bathroom", icon: Bath, dimensions: [0.4, 0.4, 0.6], color: "#F5F5F5" },
  { id: "laundry-basket", name: "Laundry Basket", category: "bathroom", icon: Box, dimensions: [0.4, 0.6, 0.3], color: "#C4A46C" },
  // Public Spaces
  { id: "reception-desk", name: "Reception Desk", category: "public-spaces", icon: Square, dimensions: [2.0, 1.1, 0.8], color: "#C4A46C" },
  { id: "waiting-bench", name: "Waiting Bench", category: "public-spaces", icon: Sofa, dimensions: [1.8, 0.45, 0.5], color: "#8A8A8A" },
  { id: "display-shelf", name: "Display Shelf", category: "public-spaces", icon: Box, dimensions: [1.2, 1.8, 0.4], color: "#FFFFFF" },
  { id: "locker-unit", name: "Locker Unit", category: "public-spaces", icon: Box, dimensions: [0.9, 1.8, 0.5], color: "#A0A0A0" },
  // ═══ INTERIOR > ELECTRICAL APPLIANCES ═══
  // Lighting
  { id: "floor-lamp", name: "Floor Lamp", category: "lighting", icon: Lamp, dimensions: [0.3, 1.6, 0.3], color: "#2D2D2D" },
  { id: "pendant", name: "Pendant Light", category: "lighting", icon: Lamp, dimensions: [0.4, 0.3, 0.4], color: "#8A8A8A" },
  { id: "table-lamp", name: "Table Lamp", category: "lighting", icon: Lamp, dimensions: [0.25, 0.45, 0.25], color: "#E8E0D4" },
  { id: "wall-sconce", name: "Wall Sconce", category: "lighting", icon: Lightbulb, dimensions: [0.15, 0.25, 0.12], color: "#C4A46C" },
  { id: "chandelier", name: "Chandelier", category: "lighting", icon: Lightbulb, dimensions: [0.6, 0.5, 0.6], color: "#C4A46C" },
  { id: "led-strip", name: "LED Strip Light", category: "lighting", icon: Lightbulb, dimensions: [2.0, 0.02, 0.02], color: "#FFFFFF" },
  { id: "desk-lamp", name: "Desk Lamp", category: "lighting", icon: Lamp, dimensions: [0.2, 0.45, 0.2], color: "#2D2D2D" },
  // Sockets
  { id: "wall-socket", name: "Wall Socket", category: "sockets", icon: Plug, dimensions: [0.08, 0.08, 0.04], color: "#FFFFFF" },
  { id: "light-switch", name: "Light Switch", category: "sockets", icon: Plug, dimensions: [0.07, 0.12, 0.03], color: "#FFFFFF" },
  { id: "usb-outlet", name: "USB Wall Outlet", category: "sockets", icon: Plug, dimensions: [0.08, 0.08, 0.04], color: "#FFFFFF" },
  // Household
  { id: "washer", name: "Washing Machine", category: "household", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#E8E8E8" },
  { id: "dryer", name: "Clothes Dryer", category: "household", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#E8E8E8" },
  { id: "ironing-board", name: "Ironing Board", category: "household", icon: Box, dimensions: [0.4, 1.2, 0.15], color: "#E0E0E0" },
  { id: "vacuum", name: "Vacuum Cleaner", category: "household", icon: Box, dimensions: [0.35, 1.1, 0.3], color: "#808080" },
  { id: "robot-vacuum", name: "Robot Vacuum", category: "household", icon: Circle, dimensions: [0.35, 0.1, 0.35], color: "#2D2D2D" },
  { id: "steam-mop", name: "Steam Mop", category: "household", icon: Box, dimensions: [0.3, 1.2, 0.2], color: "#A0A0A0" },
  // Video/TV
  { id: "tv", name: "Wall TV 65\"", category: "video-tv", icon: Monitor, dimensions: [1.45, 0.85, 0.08], color: "#1A1A1A" },
  { id: "tv-55", name: "Wall TV 55\"", category: "video-tv", icon: Monitor, dimensions: [1.22, 0.72, 0.08], color: "#1A1A1A" },
  { id: "projector", name: "Projector", category: "video-tv", icon: Monitor, dimensions: [0.3, 0.12, 0.25], color: "#FFFFFF" },
  { id: "projector-screen", name: "Projector Screen", category: "video-tv", icon: Frame, dimensions: [2.0, 1.2, 0.05], color: "#FFFFFF" },
  // Kitchen Appliances
  { id: "oven", name: "Kitchen Range / Oven", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.74, 0.9, 0.64], color: "#D0D0D0" },
  { id: "microwave", name: "Microwave", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.5, 0.3, 0.4], color: "#2D2D2D" },
  { id: "fridge", name: "Refrigerator", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.7, 1.7, 0.78], color: "#D0D0D0" },
  { id: "dishwasher", name: "Dishwasher", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.6, 0.85, 0.6], color: "#D0D0D0" },
  { id: "coffee-machine", name: "Coffee Machine", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.25, 0.4, 0.35], color: "#2D2D2D" },
  { id: "toaster-oven", name: "Toaster Oven", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.4, 0.25, 0.3], color: "#D0D0D0" },
  { id: "range-hood", name: "Range Hood", category: "kitchen-appliances", icon: CookingPot, dimensions: [0.6, 0.4, 0.5], color: "#D0D0D0" },
  // Climate
  { id: "ceiling-fan", name: "Ceiling Fan", category: "climate", icon: Fan, dimensions: [0.8, 0.35, 0.8], color: "#888888" },
  { id: "air-conditioner", name: "Wall AC Unit", category: "climate", icon: Wind, dimensions: [0.9, 0.3, 0.2], color: "#FFFFFF" },
  { id: "space-heater", name: "Space Heater", category: "climate", icon: Thermometer, dimensions: [0.3, 0.6, 0.2], color: "#D0D0D0" },
  { id: "humidifier", name: "Humidifier", category: "climate", icon: Wind, dimensions: [0.25, 0.35, 0.25], color: "#FFFFFF" },
  { id: "tower-fan", name: "Tower Fan", category: "climate", icon: Fan, dimensions: [0.3, 1.0, 0.3], color: "#2D2D2D" },
  // Computers
  { id: "desktop-pc", name: "Desktop Computer", category: "computers", icon: Monitor, dimensions: [0.2, 0.45, 0.45], color: "#2D2D2D" },
  { id: "laptop", name: "Laptop", category: "computers", icon: Laptop, dimensions: [0.35, 0.02, 0.25], color: "#C0C0C0" },
  { id: "monitor-stand", name: "Monitor Stand", category: "computers", icon: Monitor, dimensions: [0.5, 0.08, 0.25], color: "#2D2D2D" },
  { id: "printer", name: "Printer", category: "computers", icon: Box, dimensions: [0.45, 0.2, 0.35], color: "#2D2D2D" },
  // Audio
  { id: "bt-speaker", name: "Bluetooth Speaker", category: "audio", icon: Speaker, dimensions: [0.2, 0.12, 0.1], color: "#2D2D2D" },
  { id: "soundbar", name: "Soundbar", category: "audio", icon: Speaker, dimensions: [1.0, 0.08, 0.1], color: "#2D2D2D" },
  { id: "bookshelf-speakers", name: "Bookshelf Speakers", category: "audio", icon: Speaker, dimensions: [0.2, 0.3, 0.2], color: "#6B4E35" },
  { id: "turntable", name: "Turntable", category: "audio", icon: Music, dimensions: [0.45, 0.15, 0.4], color: "#C4A46C" },
  // Equipment
  { id: "treadmill", name: "Treadmill", category: "equipment", icon: Dumbbell, dimensions: [0.8, 1.4, 1.9], color: "#2D2D2D" },
  { id: "exercise-bike", name: "Exercise Bike", category: "equipment", icon: Bike, dimensions: [0.55, 1.2, 1.1], color: "#2D2D2D" },
  { id: "weight-bench", name: "Weight Bench", category: "equipment", icon: Dumbbell, dimensions: [0.65, 0.5, 1.3], color: "#A0A0A0" },
  { id: "elliptical", name: "Elliptical Machine", category: "equipment", icon: Dumbbell, dimensions: [0.7, 1.7, 1.7], color: "#2D2D2D" },
  // ═══ INTERIOR > MISC ═══
  // Decor
  { id: "mirror", name: "Wall Mirror (Round)", category: "decor", icon: Circle, dimensions: [0.72, 0.72, 0.04], color: "#888888" },
  { id: "wall-art", name: "Wall Art / Canvas", category: "decor", icon: Frame, dimensions: [0.8, 0.6, 0.03], color: "#E8E0D4" },
  { id: "vase", name: "Decorative Vase", category: "decor", icon: Flower2, dimensions: [0.2, 0.4, 0.2], color: "#C8B8A0" },
  { id: "wall-clock", name: "Wall Clock", category: "decor", icon: Circle, dimensions: [0.35, 0.35, 0.05], color: "#2D2D2D" },
  { id: "photo-frames", name: "Photo Frame Set", category: "decor", icon: Frame, dimensions: [0.6, 0.4, 0.03], color: "#C4A46C" },
  { id: "sculpture", name: "Decorative Sculpture", category: "decor", icon: Box, dimensions: [0.25, 0.5, 0.25], color: "#D4C4B0" },
  // Curtains
  { id: "curtain", name: "Window Curtain", category: "curtains", icon: Layers, dimensions: [1.5, 2.4, 0.1], color: "#E8E0D4" },
  { id: "roman-blind", name: "Roman Blind", category: "curtains", icon: Layers, dimensions: [1.2, 1.5, 0.08], color: "#D4C4B0" },
  { id: "roller-shade", name: "Roller Shade", category: "curtains", icon: Layers, dimensions: [1.2, 1.5, 0.05], color: "#FFFFFF" },
  { id: "sheer-curtain", name: "Sheer Curtain", category: "curtains", icon: Layers, dimensions: [1.5, 2.4, 0.05], color: "#FAFAFA" },
  // Rugs
  { id: "rug", name: "Area Rug", category: "rugs", icon: Footprints, dimensions: [2.0, 0.02, 1.4], color: "#C8B8A0" },
  { id: "runner-rug", name: "Runner Rug", category: "rugs", icon: Footprints, dimensions: [2.4, 0.02, 0.7], color: "#8A8A8A" },
  { id: "round-rug", name: "Round Rug", category: "rugs", icon: Circle, dimensions: [1.5, 0.02, 1.5], color: "#D4C4B0" },
  { id: "bath-mat", name: "Bath Mat", category: "rugs", icon: Footprints, dimensions: [0.8, 0.02, 0.5], color: "#FFFFFF" },
  // Kitchenware
  { id: "knife-block", name: "Knife Block", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.12, 0.35, 0.1], color: "#C4A46C" },
  { id: "fruit-bowl", name: "Fruit Bowl", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.3, 0.15, 0.3], color: "#C8B8A0" },
  { id: "spice-rack", name: "Spice Rack", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.4, 0.3, 0.1], color: "#C4A46C" },
  { id: "dish-rack", name: "Dish Drying Rack", category: "kitchenware", icon: UtensilsCrossed, dimensions: [0.45, 0.3, 0.3], color: "#C0C0C0" },
  // Fireplaces
  { id: "electric-fireplace", name: "Electric Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.2, 0.9, 0.3], color: "#2D2D2D" },
  { id: "wood-fireplace", name: "Wood Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.4, 1.2, 0.5], color: "#A0603A" },
  { id: "gas-fireplace", name: "Gas Fireplace", category: "fireplaces", icon: Flame, dimensions: [1.0, 0.8, 0.3], color: "#2D2D2D" },
  // Plants
  { id: "plant", name: "Potted Plant (Small)", category: "plants", icon: Flower2, dimensions: [0.3, 0.6, 0.3], color: "#C8B8A0" },
  { id: "floor-plant", name: "Floor Plant (Large)", category: "plants", icon: TreePine, dimensions: [0.4, 1.2, 0.4], color: "#D0C0A8" },
  { id: "hanging-plant", name: "Hanging Plant", category: "plants", icon: Flower2, dimensions: [0.3, 0.5, 0.3], color: "#C8B8A0" },
  { id: "succulent-set", name: "Succulent Set", category: "plants", icon: Flower2, dimensions: [0.35, 0.15, 0.2], color: "#A0B090" },
  { id: "herb-garden", name: "Herb Garden Box", category: "plants", icon: Flower2, dimensions: [0.5, 0.3, 0.2], color: "#A0B090" },
  { id: "fiddle-leaf", name: "Fiddle Leaf Fig", category: "plants", icon: TreePine, dimensions: [0.5, 1.5, 0.5], color: "#D0C0A8" },
  // People
  { id: "standing-figure", name: "Standing Figure", category: "people", icon: User, dimensions: [0.45, 1.75, 0.3], color: "#D4C4B0" },
  { id: "seated-figure", name: "Seated Figure", category: "people", icon: User, dimensions: [0.45, 1.2, 0.5], color: "#D4C4B0" },
  // Musical Instruments
  { id: "upright-piano", name: "Upright Piano", category: "musical-instruments", icon: Music, dimensions: [1.5, 1.2, 0.65], color: "#2D2D2D" },
  { id: "grand-piano", name: "Grand Piano", category: "musical-instruments", icon: Music, dimensions: [1.55, 1.0, 2.2], color: "#2D2D2D" },
  { id: "guitar-stand", name: "Guitar Stand", category: "musical-instruments", icon: Music, dimensions: [0.4, 1.0, 0.3], color: "#C4A46C" },
  { id: "drum-kit", name: "Drum Kit", category: "musical-instruments", icon: Music, dimensions: [1.5, 1.2, 1.2], color: "#C0C0C0" },
  // Sport
  { id: "yoga-mat", name: "Yoga Mat", category: "sport", icon: Dumbbell, dimensions: [0.6, 0.01, 1.8], color: "#A0B090" },
  { id: "punching-bag", name: "Punching Bag", category: "sport", icon: Dumbbell, dimensions: [0.35, 1.0, 0.35], color: "#8A8A8A" },
  { id: "dumbbell-rack", name: "Dumbbell Rack", category: "sport", icon: Dumbbell, dimensions: [1.0, 0.8, 0.55], color: "#A0A0A0" },
  // Holidays
  { id: "christmas-tree", name: "Christmas Tree", category: "holidays", icon: TreePine, dimensions: [0.8, 1.8, 0.8], color: "#2D6B2D" },
  { id: "menorah", name: "Menorah", category: "holidays", icon: Lightbulb, dimensions: [0.4, 0.35, 0.1], color: "#C4A46C" },
  // Pets
  { id: "pet-bed", name: "Pet Bed", category: "pets", icon: PawPrint, dimensions: [0.6, 0.2, 0.5], color: "#D4C4B0" },
  { id: "cat-tree", name: "Cat Tree", category: "pets", icon: PawPrint, dimensions: [0.5, 1.5, 0.5], color: "#C4A46C" },
  { id: "fish-tank", name: "Fish Tank", category: "pets", icon: Fish, dimensions: [0.8, 0.5, 0.35], color: "#E0E0E0" },
  { id: "pet-crate", name: "Pet Crate", category: "pets", icon: PawPrint, dimensions: [0.8, 0.6, 0.5], color: "#A0A0A0" },
  // ═══ EXTERIOR ═══
  // Garage
  { id: "car", name: "Sedan Car", category: "garage", icon: Car, dimensions: [1.8, 1.5, 4.5], color: "#8A8A8A" },
  { id: "suv", name: "SUV", category: "garage", icon: Car, dimensions: [2.0, 1.7, 4.8], color: "#2D2D2D" },
  { id: "tool-bench", name: "Tool Workbench", category: "garage", icon: Box, dimensions: [1.5, 0.9, 0.6], color: "#A0A0A0" },
  { id: "storage-shelving", name: "Garage Shelving", category: "garage", icon: Box, dimensions: [1.2, 1.8, 0.4], color: "#A0A0A0" },
];

// Dining table + chair IDs that can overlap each other (chairs tucked under table)
export const DINING_TABLE_IDS = new Set(["dining-table", "dining-table-6", "round-table"]);
export const DINING_CHAIR_IDS = new Set(["dining-chair", "bar-stool"]);

// ── Material Definitions ──

export const MATERIAL_DEFS = {
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

export const MATERIALS_UI = [
  { id: "walls", label: "Walls", options: Object.keys(MATERIAL_DEFS.walls) },
  { id: "floors", label: "Floors", options: Object.keys(MATERIAL_DEFS.floors) },
  { id: "ceiling", label: "Ceiling", options: Object.keys(MATERIAL_DEFS.ceiling) },
];

// ── Room Hotspot Zones ──

export const ROOM_ZONES: RoomZone[] = [
  { id: "living", label: "Living Area", icon: "\u{1F6CB}\uFE0F", position: [1.5, 0.05, 0.6], camera: [4.5, 3.2, 4.2], target: [1.5, 0.3, 0.5] },
  { id: "reading", label: "Reading Nook", icon: "\u{1F4DA}", position: [-2.5, 0.05, -1.6], camera: [-0.5, 3.0, 0.5], target: [-2.5, 0.4, -1.6] },
  { id: "entrance", label: "Entrance", icon: "\u{1F6AA}", position: [-2.6, 0.05, 0.8], camera: [-0.5, 2.5, 3.5], target: [-2.6, 0.4, 0.8] },
  { id: "window", label: "Window Side", icon: "\u{1FA9F}", position: [2.5, 0.05, -0.8], camera: [0.5, 3.0, -3.5], target: [2.5, 0.6, -0.8] },
  { id: "center", label: "Room Center", icon: "\u2726", position: [0, 0.05, 0], camera: [6, 5, 6], target: [0, 0.5, 0] },
];

// ── Default HDB 3-Room Floor Plan ──

export const DEFAULT_HOUSE_ROOM_DEFS: HouseRoomDef[] = [
  {
    id: "kitchen", label: "Kitchen / Dining", shortLabel: "Kitchen",
    bounds: [-3.05, -0.95, -5.85, -0.05],
    floorColor: "#F0EDE8", wallColor: "#FAFAFA",
    cameraPos: [-2.5, 1.5, -1.2], cameraTarget: [-2.0, 0.8, -3.0],
    svg: { x: 0, y: 0, w: 85, h: 189 }, accent: "#E8A87C",
    furniture: [],
    doors: [],
    windows: [
      { id: "kitchen-win-1", side: "north", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 },
      { id: "kitchen-win-2", side: "west", t: 0.3, w: 1.5, h: 1.4, sillH: 0.9 },
    ],
    defaultMaterials: { walls: "Subway Tile", floors: "Porcelain Tile (White)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: true },
  },
  {
    id: "bath2", label: "Bath / WC 2", shortLabel: "Bath 2",
    bounds: [-0.95, 0.55, -5.85, -4.35],
    floorColor: "#D6E4E0", wallColor: "#F0F0F0",
    cameraPos: [-0.2, 2.0, -4.2], cameraTarget: [-0.2, 0.6, -5.1],
    svg: { x: 85, y: 0, w: 72, h: 49 }, accent: "#6BA3BE",
    furniture: [],
    doors: [{ id: "bath2-door-1", side: "south", t: 0.5, w: 0.7 }],
    windows: [{ id: "bath2-win-1", side: "north", t: 0.5, w: 0.6, h: 0.6, sillH: 1.5 }],
    defaultMaterials: { walls: "White Paint", floors: "Mosaic Tile", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  {
    id: "bath1", label: "Bath / WC 1", shortLabel: "Bath 1",
    bounds: [-0.95, 0.55, -4.35, -2.85],
    floorColor: "#D6E4E0", wallColor: "#F0F0F0",
    cameraPos: [-0.2, 2.0, -2.7], cameraTarget: [-0.2, 0.6, -3.6],
    svg: { x: 85, y: 49, w: 72, h: 52 }, accent: "#6BA3BE",
    furniture: [],
    doors: [{ id: "bath1-door-1", side: "south", t: 0.5, w: 0.7 }],
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Mosaic Tile", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  {
    id: "main-bed", label: "Main Bedroom", shortLabel: "Master",
    bounds: [0.55, 3.05, -4.85, -0.35],
    floorColor: "#D4B896", wallColor: "#F5F0E8",
    cameraPos: [1.0, 1.5, 0.2], cameraTarget: [1.8, 0.8, -2.6],
    svg: { x: 115, y: 75, w: 82, h: 146 }, accent: "#8B6B4E",
    furniture: [],
    doors: [{ id: "main-bed-door-1", side: "west", t: 0.7, w: 0.7 }],
    windows: [{ id: "main-bed-win-1", side: "east", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 }],
    defaultMaterials: { walls: "Warm White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 16, intensity: 100, ceilingLight: true, floorLamp: true, accentLight: true, underCabinet: false },
  },
  {
    id: "store", label: "Store Room", shortLabel: "Store",
    bounds: [-1.85, -0.45, -1.25, -0.05],
    floorColor: "#B8B0A6", wallColor: "#F5F5F5",
    cameraPos: [-1.15, 1.8, 0.3], cameraTarget: [-1.15, 0.5, -0.65],
    svg: { x: 39, y: 150, w: 46, h: 39 }, accent: "#A09070",
    furniture: [],
    doors: [{ id: "store-door-1", side: "east", t: 0.5, w: 0.7 }],
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Cement Screed", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  {
    id: "corridor", label: "Corridor", shortLabel: "Corridor",
    bounds: [-0.45, 0.55, -2.85, -0.05],
    floorColor: "#C8C3BC", wallColor: "#FAFAFA",
    cameraPos: [0.05, 2.3, 0.2], cameraTarget: [0.05, 0.4, -1.5],
    svg: { x: 85, y: 101, w: 30, h: 120 }, accent: "#8CAA7C",
    furniture: [],
    doors: [
      { id: "corridor-door-1", side: "south", t: 0.3, w: 0.8 },
      { id: "corridor-door-2", side: "south", t: 0.7, w: 0.8 },
    ],
    windows: [],
    defaultMaterials: { walls: "White Paint", floors: "Porcelain Tile (Gray)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  {
    id: "living", label: "Living Room", shortLabel: "Living",
    bounds: [-3.05, 0.15, -0.05, 5.15],
    floorColor: "#E8DCCA", wallColor: "#FAFAFA",
    cameraPos: [-2.5, 1.5, 4.5], cameraTarget: [-1.45, 0.8, 2.5],
    svg: { x: 0, y: 189, w: 104, h: 169 }, accent: "#5AB5A0",
    furniture: [],
    doors: [{ id: "living-door-1", side: "south", t: 0.15, w: 0.9 }],
    windows: [{ id: "living-win-1", side: "west", t: 0.5, w: 1.5, h: 1.4, sillH: 0.9 }],
    defaultMaterials: { walls: "White Paint", floors: "Engineered Wood (Ash)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: true, floorLamp: true, accentLight: false, underCabinet: false },
  },
  {
    id: "bedroom", label: "Bedroom 2", shortLabel: "Bedroom",
    bounds: [0.15, 3.05, 0.95, 5.15],
    floorColor: "#D4B896", wallColor: "#FAFAFA",
    cameraPos: [0.5, 1.5, 4.5], cameraTarget: [1.6, 0.8, 3.0],
    svg: { x: 104, y: 221, w: 94, h: 137 }, accent: "#7CA5B8",
    furniture: [],
    doors: [{ id: "bedroom-door-1", side: "north", t: 0.15, w: 0.7 }],
    windows: [{ id: "bedroom-win-1", side: "east", t: 0.5, w: 1.2, h: 1.2, sillH: 0.9 }],
    defaultMaterials: { walls: "White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 10, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  },
  {
    id: "balcony", label: "Access Balcony", shortLabel: "Balcony",
    bounds: [-3.05, 3.05, 5.15, 5.85],
    floorColor: "#B8B0A6", wallColor: "#E0E0E0",
    cameraPos: [0.0, 2.5, 7.5], cameraTarget: [0.0, 0.5, 5.5],
    svg: { x: 0, y: 358, w: 198, h: 23 }, accent: "#9E9E9E",
    furniture: [],
    doors: [],
    windows: [],
    defaultMaterials: { walls: "Concrete", floors: "Cement Screed", ceiling: "Flat White" },
    defaultLighting: { timeOfDay: 14, intensity: 100, ceilingLight: false, floorLamp: false, accentLight: false, underCabinet: false },
  },
];

export const DEFAULT_CAM_POS: [number, number, number] = [9, 14.5, 12];
export const DEFAULT_CAM_TARGET: [number, number, number] = [0, 0, 0];

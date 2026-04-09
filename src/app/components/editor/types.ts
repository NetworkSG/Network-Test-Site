/* ═══════════════════════════════════════════════════════
   Shared Types for Floor Plan Editor
   Single source of truth — imported by both 2D and 3D editors
   ═══════════════════════════════════════════════════════ */
import type * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

// ── Geometry & Bounds ──

export type Side = "north" | "south" | "east" | "west";

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  polygon?: [number, number][];
}

// ── Openings (doors & windows) ──

export interface DoorDef {
  id: string;
  side: Side;
  t: number;      // 0-1 position along wall
  w: number;       // width in meters
  flipped?: boolean;
}

export interface WindowDef {
  id: string;
  side: Side;
  t: number;
  w: number;
  h: number;       // height in meters
  sillH: number;   // sill height from floor
}

// ── Materials & Lighting ──

export interface SceneMaterials {
  walls: string;
  floors: string;
  ceiling: string;
}

export interface SceneLighting {
  timeOfDay: number;
  intensity: number;
  ceilingLight: boolean;
  floorLamp: boolean;
  accentLight: boolean;
  underCabinet: boolean;
}

// ── Room Definitions ──

export interface HouseRoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number]; // xMin, xMax, zMin, zMax
  polygon?: [number, number][];
  floorColor: string;
  wallColor: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  svg: { x: number; y: number; w: number; h: number };
  accent: string;
  furniture: [string, number, number, number, number][]; // [furnitureId, x, y, z, rotDeg]
  doors: DoorDef[];
  windows: WindowDef[];
  defaultMaterials: SceneMaterials;
  defaultLighting: SceneLighting;
}

// ── Furniture ──

export interface PlacedItem {
  id: string;
  furnitureId: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  dimensions: [number, number, number];
  color: string;
  category: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dimensions: [number, number, number];
  color: string;
}

// ── Room Zones (3D hotspots) ──

export interface RoomZone {
  id: string;
  label: string;
  icon: string;
  position: [number, number, number];
  camera: [number, number, number];
  target: [number, number, number];
}

// ── Shared Wall Detection ──

export interface SharedWallNeighbor {
  neighborId: string;
  neighborSide: string;
}

export interface SharedWallData {
  sides: Set<string>;
  neighbors: Map<string, SharedWallNeighbor[]>;
}

// ── 2D Editor Types ──

export interface EditableRoom {
  id: string;
  name: string;
  bounds: [number, number, number, number];
  polygon?: [number, number][];
  height: number;
  wallThickness: number;
  flooringHeight: number;
  floorColor: string;
  wallColor: string;
  accent: string;
  doors: EditableDoor[];
  windows: EditableWindow[];
  locked?: boolean;
  visible?: boolean;
}

export interface EditableDoor {
  id: string;
  side: Side;
  t: number;
  width: number;
  flipped?: boolean;
}

export interface EditableWindow {
  id: string;
  side: Side;
  t: number;
  width: number;
  height: number;
  sillHeight: number;
}

export interface StandaloneWall {
  id: string;
  points: [number, number][];
  thickness: number;
  height: number;
  color: string;
}

// ── Three.js Scene Reference ──

export interface ThreeSceneRef {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  css2dRenderer: CSS2DRenderer;
  controls: OrbitControls;
  animRef: { id: number; paused: boolean };
  houseRoomGroups: Map<string, THREE.Group>;
  houseRoomLabels: Map<string, CSS2DObject>;
  houseFurnitureMap: Map<string, THREE.Group>;
  groundPlane: THREE.Mesh;
  gridHelper: THREE.GridHelper;
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
}

// ── UI Types ──

export type LeftPanel = "furniture" | "customize" | null;
export type CustomizeTab = "materials" | "lighting" | "camera";

// ── ID Generation ──

let _idCounter = 0;

export function generateOpeningId(prefix: string = "op"): string {
  return `${prefix}-${Date.now().toString(36)}-${(++_idCounter).toString(36)}`;
}

/**
 * Ensure all doors/windows in a room def have IDs.
 * Used for backward compatibility with saved projects that lack IDs.
 */
export function ensureOpeningIds(def: HouseRoomDef): HouseRoomDef {
  let changed = false;
  const doors = def.doors.map((d) => {
    if (d.id) return d;
    changed = true;
    return { ...d, id: generateOpeningId("door") };
  });
  const windows = def.windows.map((w) => {
    if (w.id) return w;
    changed = true;
    return { ...w, id: generateOpeningId("win") };
  });
  return changed ? { ...def, doors, windows } : def;
}

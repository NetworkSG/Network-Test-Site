import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BuildPanel, type EditorTool, type RoomTemplate } from "./BuildPanel";
import { renderFurnitureTopDown } from "./FurnitureTopDown";
import {
  Plus, Trash2, Move, Square, PenTool, DoorOpen, Grid3X3,
  X, ChevronDown, Undo2, Redo2, MousePointer2, Minus,
  Hammer, Eye, EyeOff, Lock, Unlock, Copy, ChevronLeft, Pencil, Merge, Combine,
  Scissors, Check, Sofa, RotateCw
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
export interface EditableRoom {
  id: string;
  name: string;
  bounds: [number, number, number, number]; // xMin, xMax, zMin, zMax
  /** Optional polygon for L/T/+ shaped rooms. When present, floor & walls use this instead of bounds rect. */
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
  side: "north" | "south" | "east" | "west";
  t: number;  // position along wall (0-1)
  width: number;
  flipped?: boolean;
}

export interface EditableWindow {
  id: string;
  side: "north" | "south" | "east" | "west";
  t: number;
  width: number;
  height: number;
  sillHeight: number;
}

export interface StandaloneWall {
  id: string;
  points: [number, number][]; // polyline world coords [x, z]
  thickness: number; // meters
  height: number; // meters
  color: string;
}

interface RoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number];
  polygon?: [number, number][];
  floorColor: string;
  wallColor: string;
  accent: string;
  doors: { side: "north" | "south" | "east" | "west"; t: number; w: number }[];
  windows: { side: "north" | "south" | "east" | "west"; t: number; w: number; h: number; sillH: number }[];
}

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

interface Editor2DViewProps {
  rooms: RoomDef[];
  furniture: Record<string, PlacedItem[]>;
  activeRoomId: string;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onSelectRoom: (roomId: string) => void;
  showGrid: boolean;
  showMeasurements: boolean;
  unitSystem: "metric" | "imperial";
  /** When false the view stays mounted but is hidden & keyboard shortcuts disabled */
  isVisible?: boolean;
  /** Called whenever room bounds/properties change in the 2D editor */
  onRoomsChange?: (rooms: EditableRoom[]) => void;
  /** Called when a room is moved so furniture positions can be updated */
  onFurnitureMove?: (roomId: string, dx: number, dz: number) => void;
  /** Called when a single furniture item is dragged to a new position in 2D */
  onFurnitureItemMove?: (roomId: string, itemId: string, newX: number, newZ: number) => void;
  /** Bumped when openings are moved in 3D mode — triggers re-sync from props */
  openingsVersion?: number;
  /** Project name for the info bar */
  houseName?: string;
  /** Whether the project name is being edited */
  isEditingName?: boolean;
  /** Ref for the name input */
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  /** Callback when name changes */
  onNameChange?: (name: string) => void;
  /** Start editing name */
  onStartEditing?: () => void;
  /** Stop editing name */
  onStopEditing?: (fallback?: string) => void;
  /** Back button callback */
  onBack?: () => void;
  /** Whether in 2D mode */
  is2DMode?: boolean;
  /** Toggle between 2D and 3D mode */
  onToggleMode?: (mode: boolean) => void;
  /** Report undo/redo state to parent */
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, doUndo: () => void, doRedo: () => void) => void;
  /** Per-room floor color overrides from 3D material changes */
  roomFloorColors?: Record<string, string>;
  /** Called whenever standalone walls change */
  onStandaloneWallsChange?: (walls: StandaloneWall[]) => void;
  /** Opens the furniture panel (in parent) */
  onOpenFurniturePanel?: () => void;
  /** Whether the furniture panel is currently open */
  furniturePanelOpen?: boolean;
  /** Callback for undo (used by mobile FAB) */
  onUndo?: () => void;
  /** Callback for redo (used by mobile FAB) */
  onRedo?: () => void;
  /** Whether undo is available (from parent) */
  parentCanUndo?: boolean;
  /** Whether redo is available (from parent) */
  parentCanRedo?: boolean;
  /** Ref that the parent can use to change the active tool externally */
  toolChangeRef?: React.MutableRefObject<((tool: EditorTool) => void) | null>;
  /** Callback to report active tool changes to parent */
  onActiveToolChange?: (tool: EditorTool) => void;
  /** Whether the mobile bottom nav is used (hides built-in mobile FAB) */
  useMobileBottomNav?: boolean;
  /** Furniture action callbacks */
  onRotateItem?: () => void;
  onDeleteItem?: () => void;
  onDuplicateItem?: () => void;
}

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */
const ACCENT_COLORS = [
  "#10B981", "#6BA3BE", "#E8A87C", "#8B6B4E", "#5AB5A0",
  "#7CA5B8", "#A09070", "#8CAA7C", "#9E9E9E", "#B07D62",
  "#6C8EAD", "#D4956A", "#7B9E6B", "#A0728C", "#C4956E",
];

const SNAP_GRID = 0.1; // 10cm snap
const ROOM_SNAP_THRESHOLD = 0.25; // 25cm — snap room edges together when within this distance

/* ═══════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════ */
function genId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function genDoorId(): string {
  return `door-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function genWindowId(): string {
  return `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function genWallId(): string {
  return `swall-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function snapToGrid(val: number, grid: number): number {
  return Math.round(val / grid) * grid;
}

function formatDim(meters: number, unit: "metric" | "imperial"): string {
  if (unit === "imperial") {
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${(meters * 100).toFixed(0)}`;
}

function formatArea(sqMeters: number, unit: "metric" | "imperial"): string {
  if (unit === "imperial") return `${(sqMeters * 10.7639).toFixed(1)} ft\u00B2`;
  return `${sqMeters.toFixed(1)} m\u00B2`;
}

/** Snap threshold for geometry snapping (meters) */
const GEOM_SNAP_THRESHOLD = 0.3;

/** A line segment for edge snapping */
type SnapEdge = { a: [number, number]; b: [number, number] };

/** Collect all snap-target points from rooms and standalone walls */
function getSnapTargets(rooms: EditableRoom[], walls: StandaloneWall[], excludeWallId?: string): [number, number][] {
  const pts: [number, number][] = [];
  for (const r of rooms) {
    if (r.polygon) {
      for (const p of r.polygon) pts.push([...p] as [number, number]);
    } else {
      const [x1, x2, z1, z2] = r.bounds;
      pts.push([x1, z1], [x2, z1], [x1, z2], [x2, z2]); // corners
      pts.push([(x1 + x2) / 2, z1], [(x1 + x2) / 2, z2]); // edge midpoints
      pts.push([x1, (z1 + z2) / 2], [x2, (z1 + z2) / 2]);
    }
  }
  for (const w of walls) {
    if (w.id === excludeWallId) continue;
    for (const p of w.points) pts.push([...p] as [number, number]);
  }
  return pts;
}

/** Collect all edges (line segments) from rooms and standalone walls for edge snapping */
function getSnapEdges(rooms: EditableRoom[], walls: StandaloneWall[], excludeWallId?: string): SnapEdge[] {
  const edges: SnapEdge[] = [];
  for (const r of rooms) {
    if (r.polygon) {
      for (let i = 0; i < r.polygon.length; i++) {
        const j = (i + 1) % r.polygon.length;
        edges.push({ a: [...r.polygon[i]] as [number, number], b: [...r.polygon[j]] as [number, number] });
      }
    } else {
      const [x1, x2, z1, z2] = r.bounds;
      edges.push({ a: [x1, z1], b: [x2, z1] }); // north
      edges.push({ a: [x1, z2], b: [x2, z2] }); // south
      edges.push({ a: [x1, z1], b: [x1, z2] }); // west
      edges.push({ a: [x2, z1], b: [x2, z2] }); // east
    }
  }
  for (const w of walls) {
    if (w.id === excludeWallId) continue;
    for (let i = 0; i < w.points.length - 1; i++) {
      edges.push({ a: [...w.points[i]] as [number, number], b: [...w.points[i + 1]] as [number, number] });
    }
  }
  return edges;
}

/** Find the closest point on a line segment ab to point p */
function closestPointOnSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): [number, number] {
  const dx = bx - ax, dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-8) return [ax, az];
  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return [ax + t * dx, az + t * dz];
}

/** Try snapping a world point to the nearest geometry target (points + edges). */
function snapToGeometry(
  wx: number, wz: number,
  targets: [number, number][],
  threshold: number,
  edges?: SnapEdge[],
): { x: number; z: number; snapped: boolean; snapTarget: [number, number] | null; snapType: "point" | "edge" | null } {
  let bestDist = threshold;
  let best: [number, number] | null = null;
  let bestType: "point" | "edge" | null = null;

  // Point snapping (higher priority)
  for (const [tx, tz] of targets) {
    const dist = Math.sqrt((wx - tx) ** 2 + (wz - tz) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = [tx, tz];
      bestType = "point";
    }
  }

  // Edge snapping (only wins if closer than point snap by a margin, or no point snap found)
  if (edges) {
    for (const { a, b } of edges) {
      const [cx, cz] = closestPointOnSegment(wx, wz, a[0], a[1], b[0], b[1]);
      const dist = Math.sqrt((wx - cx) ** 2 + (wz - cz) ** 2);
      if (dist < bestDist * (bestType === "point" ? 0.6 : 1)) {
        bestDist = dist;
        best = [cx, cz];
        bestType = "edge";
      }
    }
  }

  if (best) return { x: best[0], z: best[1], snapped: true, snapTarget: best, snapType: bestType };
  return { x: wx, z: wz, snapped: false, snapTarget: null, snapType: null };
}

/**
 * Compute the rectilinear union polygon of two axis-aligned rectangles.
 * Returns the polygon vertices (CW) if the union is non-rectangular (L/T/+ shape),
 * or null if the result is a simple rectangle.
 */
function computeRectilinearUnion(
  boundsA: [number, number, number, number],
  boundsB: [number, number, number, number],
): [number, number][] | null {
  const xSet = new Set([boundsA[0], boundsA[1], boundsB[0], boundsB[1]]);
  const zSet = new Set([boundsA[2], boundsA[3], boundsB[2], boundsB[3]]);
  const xs = [...xSet].sort((a, b) => a - b);
  const zs = [...zSet].sort((a, b) => a - b);

  const rows = xs.length - 1;
  const cols = zs.length - 1;
  if (rows < 1 || cols < 1) return null;

  // Build grid: grid[i][j] = whether cell (xs[i]..xs[i+1], zs[j]..zs[j+1]) is covered by A or B
  const grid: boolean[][] = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cz = (zs[j] + zs[j + 1]) / 2;
      const inA = cx > boundsA[0] - 0.001 && cx < boundsA[1] + 0.001 &&
                  cz > boundsA[2] - 0.001 && cz < boundsA[3] + 0.001;
      const inB = cx > boundsB[0] - 0.001 && cx < boundsB[1] + 0.001 &&
                  cz > boundsB[2] - 0.001 && cz < boundsB[3] + 0.001;
      grid[i][j] = inA || inB;
    }
  }

  // Check if all cells are filled → simple rectangle
  let allFilled = true;
  for (let i = 0; i < rows && allFilled; i++)
    for (let j = 0; j < cols && allFilled; j++)
      if (!grid[i][j]) allFilled = false;
  if (allFilled) return null;

  // Collect directed boundary edges (CW winding)
  const isFilled = (i: number, j: number) =>
    i >= 0 && i < rows && j >= 0 && j < cols && grid[i][j];

  const edgeList: { from: string; to: string; fc: [number, number]; tc: [number, number] }[] = [];
  const k = (gi: number, gj: number) => `${gi},${gj}`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!grid[i][j]) continue;
      // top edge
      if (!isFilled(i, j - 1))
        edgeList.push({ from: k(i, j), to: k(i + 1, j), fc: [xs[i], zs[j]], tc: [xs[i + 1], zs[j]] });
      // right edge
      if (!isFilled(i + 1, j))
        edgeList.push({ from: k(i + 1, j), to: k(i + 1, j + 1), fc: [xs[i + 1], zs[j]], tc: [xs[i + 1], zs[j + 1]] });
      // bottom edge
      if (!isFilled(i, j + 1))
        edgeList.push({ from: k(i + 1, j + 1), to: k(i, j + 1), fc: [xs[i + 1], zs[j + 1]], tc: [xs[i], zs[j + 1]] });
      // left edge
      if (!isFilled(i - 1, j))
        edgeList.push({ from: k(i, j + 1), to: k(i, j), fc: [xs[i], zs[j + 1]], tc: [xs[i], zs[j]] });
    }
  }

  if (edgeList.length === 0) return null;

  // Chain edges into polygon
  const edgeMap = new Map<string, typeof edgeList[0]>();
  for (const e of edgeList) edgeMap.set(e.from, e);

  const polygon: [number, number][] = [];
  let cur = edgeList[0];
  const visited = new Set<string>();
  do {
    if (visited.has(cur.from)) break;
    visited.add(cur.from);
    polygon.push(cur.fc);
    const next = edgeMap.get(cur.to);
    if (!next) break;
    cur = next;
  } while (cur.from !== edgeList[0].from);

  // Remove collinear points
  const simplified: [number, number][] = [];
  for (let i = 0; i < polygon.length; i++) {
    const prev = polygon[(i - 1 + polygon.length) % polygon.length];
    const curr = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const cross = (curr[0] - prev[0]) * (next[1] - curr[1]) - (curr[1] - prev[1]) * (next[0] - curr[0]);
    if (Math.abs(cross) > 0.0001) simplified.push(curr);
  }

  return simplified.length > 4 ? simplified : null;
}

/** Compute the centroid of a polygon */
function polygonCentroid(pts: [number, number][]): [number, number] {
  let cx = 0, cz = 0;
  for (const [x, z] of pts) { cx += x; cz += z; }
  return [cx / pts.length, cz / pts.length];
}

/** Compute the area of a polygon (shoelace formula) */
function polygonArea(pts: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * For a polygon room, resolve a side + t opening position to actual world coordinates.
 * Finds the correct polygon edge for the given side classification, accounting for
 * inner step edges in L/T/+ shaped rooms.
 * 2D convention: north=zMin (top), south=zMax (bottom), east=xMax, west=xMin.
 */
function resolveOpening2D(
  room: { bounds: [number, number, number, number]; polygon?: [number, number][] },
  side: "north" | "south" | "east" | "west",
  t: number,
): [number, number] {
  const [xMin, xMax, zMin, zMax] = room.bounds;
  const rW = xMax - xMin || 1, rD = zMax - zMin || 1;

  if (!room.polygon || room.polygon.length < 3) {
    if (side === "north") return [xMin + t * rW, zMin];
    if (side === "south") return [xMin + t * rW, zMax];
    if (side === "east") return [xMax, zMin + t * rD];
    return [xMin, zMin + t * rD];
  }

  const poly = room.polygon;
  let area2 = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  const ns = area2 > 0 ? 1 : -1;
  const isHorizSide = side === "north" || side === "south";

  if (isHorizSide) {
    const worldX = xMin + t * rW;
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
      const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
      if (Math.abs(dz) > 0.001) continue;
      if (Math.abs(dx) < 0.01) continue;
      const nzSign = ns * (dx > 0 ? -1 : 1);
      if (side === "north" && nzSign >= 0) continue;
      if (side === "south" && nzSign <= 0) continue;
      const eMinX = Math.min(p1[0], p2[0]);
      const eMaxX = Math.max(p1[0], p2[0]);
      if (worldX >= eMinX - 0.01 && worldX <= eMaxX + 0.01) {
        return [Math.max(eMinX, Math.min(eMaxX, worldX)), p1[1]];
      }
    }
    return [xMin + t * rW, side === "north" ? zMin : zMax];
  }

  const worldZ = zMin + t * rD;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
    const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
    if (Math.abs(dx) > 0.001) continue;
    if (Math.abs(dz) < 0.01) continue;
    const nxSign = ns * (dz > 0 ? 1 : -1);
    if (side === "east" && nxSign <= 0) continue;
    if (side === "west" && nxSign >= 0) continue;
    const eMinZ = Math.min(p1[1], p2[1]);
    const eMaxZ = Math.max(p1[1], p2[1]);
    if (worldZ >= eMinZ - 0.01 && worldZ <= eMaxZ + 0.01) {
      return [p1[0], Math.max(eMinZ, Math.min(eMaxZ, worldZ))];
    }
  }
  return [side === "east" ? xMax : xMin, zMin + t * rD];
}

/** Point-in-polygon test (ray casting) for 2D furniture clamping */
function pointInEditableRoom(room: { bounds: [number, number, number, number]; polygon?: [number, number][] }, x: number, z: number): boolean {
  if (room.polygon && room.polygon.length >= 3) {
    const pts = room.polygon;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, zi] = pts[i], [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }
  const [xMin, xMax, zMin, zMax] = room.bounds;
  return x >= xMin && x <= xMax && z >= zMin && z <= zMax;
}

/**
 * Map 3D side convention → 2D side convention.
 * 3D: north=zMax, south=zMin.  2D: north=zMin (top), south=zMax (bottom).
 * East/West use xMax/xMin in both — no flip needed.
 */
function side3Dto2D(side: "north" | "south" | "east" | "west"): "north" | "south" | "east" | "west" {
  if (side === "north") return "south";
  if (side === "south") return "north";
  return side;
}

/**
 * Map `t` from 3D wall convention → 2D convention.
 * 3D south (rot=PI) and west (rot=PI/2) walls flip local-X,
 * so t must be inverted for those walls.
 */
function tVal3Dto2D(side3D: string, t: number): number {
  if (side3D === "south" || side3D === "west") return 1 - t;
  return t;
}

function convertInitialRooms(rooms: RoomDef[]): EditableRoom[] {
  return rooms.map((r) => ({
    id: r.id,
    name: r.label,
    bounds: [...r.bounds] as [number, number, number, number],
    polygon: r.polygon ? r.polygon.map(p => [...p] as [number, number]) : undefined,
    height: 2.6,
    wallThickness: 0.15,
    flooringHeight: 0.0,
    floorColor: r.floorColor,
    wallColor: r.wallColor,
    accent: r.accent,
    doors: (r.doors || []).map((d, i) => ({
      id: `${r.id}-door-${i}`,
      side: side3Dto2D(d.side),
      t: tVal3Dto2D(d.side, d.t),
      width: d.w,
      flipped: d.flipped,
    })),
    windows: (r.windows || []).map((w, i) => ({
      id: `${r.id}-win-${i}`,
      side: side3Dto2D(w.side),
      t: tVal3Dto2D(w.side, w.t),
      width: w.w,
      height: w.h,
      sillHeight: w.sillH,
    })),
    locked: false,
    visible: true,
  }));
}

type DragMode = 
  | null
  | { type: "move-room"; roomId: string; startMouse: [number, number]; startBounds: [number, number, number, number] }
  | { type: "resize-room"; roomId: string; handle: string; startMouse: [number, number]; startBounds: [number, number, number, number] }
  | { type: "draw-room"; startWorld: [number, number]; currentWorld: [number, number] }
  | { type: "draw-wall"; points: [number, number][] }
  | { type: "move-door"; roomId: string; doorId: string }
  | { type: "move-window"; roomId: string; windowId: string }
  | { type: "move-furniture"; roomId: string; itemId: string; startWorld: [number, number]; startPos: [number, number] }
  | { type: "move-standalone-wall"; wallId: string; startMouse: [number, number]; startPoints: [number, number][] }
  | { type: "move-vertex"; wallId: string; pointIndex: number; startWorld: [number, number] }
  | { type: "pan"; startMouse: [number, number]; startPan: [number, number] }
  | { type: "move-split"; axis: "h" | "v"; roomId: string };

type SelectedElement = 
  | null
  | { type: "room"; roomId: string }
  | { type: "door"; roomId: string; doorId: string }
  | { type: "window"; roomId: string; windowId: string }
  | { type: "wall"; roomId: string; side: "north" | "south" | "east" | "west" }
  | { type: "standalone-wall"; wallId: string };

/* ═══════════════════════════════════════════════════════
   SVG Wood Pattern
   ═══════════════════════════════════════════════════════ */
function WoodPattern({ id, color }: { id: string; color: string }) {
  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const darker = `rgb(${Math.floor(r * 0.85)},${Math.floor(g * 0.85)},${Math.floor(b * 0.85)})`;
  const lighter = `rgb(${Math.min(255, Math.floor(r * 1.1))},${Math.min(255, Math.floor(g * 1.1))},${Math.min(255, Math.floor(b * 1.1))})`;

  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="40" height="40">
      <rect width="40" height="40" fill={color} />
      {/* Wood grain lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          x1={0} y1={i * 5 + 1} x2={40} y2={i * 5 + 1.5}
          stroke={i % 3 === 0 ? darker : lighter}
          strokeWidth={0.8}
          opacity={0.3}
        />
      ))}
      {/* Knot suggestion */}
      <circle cx={20} cy={20} r={3} fill={darker} opacity={0.08} />
    </pattern>
  );
}

/* ═══════════════════════════════════════════════════════
   Resize Handle Component
   ═══════════════════════════════════════════════════════ */
function ResizeHandle({ x, y, cursor, onMouseDown, onTouchStart }: {
  x: number; y: number; cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}) {
  return (
    <g className="cursor-pointer" style={{ cursor }} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
      <rect
        x={x - 5} y={y - 5} width={10} height={10}
        fill="white" stroke="#09090B" strokeWidth={1.5}
        rx={2}
        className="pointer-events-auto"
      />
      <rect
        x={x - 2} y={y - 2} width={4} height={4}
        fill="#09090B" rx={1}
      />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════
   Properties Bar Component (Bottom)
   ═══════════════════════════════════════════════════════ */
function PropertiesBar({
  selectedRoom, selectedElement, unitSystem,
  onUpdateRoom, onDeleteElement, onDuplicateRoom,
  selectedStandaloneWall, onUpdateStandaloneWall,
  onSplitH, onSplitV,
}: {
  selectedRoom: EditableRoom | null;
  selectedElement: SelectedElement;
  unitSystem: "metric" | "imperial";
  onUpdateRoom: (id: string, updates: Partial<EditableRoom>) => void;
  onDeleteElement: () => void;
  onDuplicateRoom: () => void;
  selectedStandaloneWall?: StandaloneWall | null;
  onUpdateStandaloneWall?: (id: string, updates: Partial<StandaloneWall>) => void;
  onSplitH?: () => void;
  onSplitV?: () => void;
}) {
  if (!selectedElement) return null;

  // Standalone wall properties
  if (selectedElement.type === "standalone-wall" && selectedStandaloneWall) {
    const wall = selectedStandaloneWall;
    // Total length of polyline
    let totalLen = 0;
    for (let i = 1; i < wall.points.length; i++) {
      totalLen += Math.sqrt(
        (wall.points[i][0] - wall.points[i - 1][0]) ** 2 +
        (wall.points[i][1] - wall.points[i - 1][1]) ** 2
      );
    }
    const WALL_COLORS = [
      { label: "White", value: "#F5F0E8" },
      { label: "Warm White", value: "#EDE5D8" },
      { label: "Light Gray", value: "#D4D4D8" },
      { label: "Concrete", value: "#A1A1AA" },
      { label: "Charcoal", value: "#52525B" },
      { label: "Dark", value: "#27272A" },
      { label: "Brick", value: "#A0522D" },
      { label: "Terracotta", value: "#C07050" },
      { label: "Sage", value: "#8B9E7C" },
      { label: "Navy", value: "#3D4F6B" },
    ];
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute bottom-[140px] md:bottom-14 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-[#F3F4F6] px-3 py-2 flex flex-col gap-1.5">
          {/* Row 1: Info + dimensions */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090B] tracking-[-0.3px] shrink-0">
              Wall
            </span>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">Length</label>
              <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] font-medium tabular-nums">
                {formatDim(totalLen, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
              </span>
            </div>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">Seg</label>
              <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] font-medium tabular-nums">
                {wall.points.length - 1}
              </span>
            </div>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">Vtx</label>
              <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] font-medium tabular-nums">
                {wall.points.length}
              </span>
            </div>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium whitespace-nowrap">Thick</label>
              <input
                type="number"
                value={Math.round(wall.thickness * 100)}
                onChange={(e) => onUpdateStandaloneWall?.(wall.id, { thickness: parseFloat(e.target.value) / 100 || 0.15 })}
                step={5}
                min={5}
                max={100}
                className="w-[50px] h-[26px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-1.5 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
            </div>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">Ht</label>
              <input
                type="number"
                value={Math.round(wall.height * 100)}
                onChange={(e) => onUpdateStandaloneWall?.(wall.id, { height: parseFloat(e.target.value) / 100 || 2.6 })}
                step={10}
                min={50}
                max={500}
                className="w-[50px] h-[26px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-1.5 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
            </div>
            <div className="w-px h-[20px] bg-[#E5E7EB]" />
            <button
              onClick={onDeleteElement}
              className="size-[26px] rounded-[8px] flex items-center justify-center hover:bg-red-50 transition-colors group shrink-0"
              title="Delete Wall"
            >
              <Trash2 className="size-[13px] text-[#71717A] group-hover:text-red-500" strokeWidth={1.5} />
            </button>
          </div>

          {/* Row 2: Color swatches */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium shrink-0">Color</label>
            <div className="flex items-center gap-1">
              {WALL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onUpdateStandaloneWall?.(wall.id, { color: c.value })}
                  className="shrink-0 rounded-full transition-all"
                  style={{
                    width: wall.color === c.value ? 22 : 18,
                    height: wall.color === c.value ? 22 : 18,
                    backgroundColor: c.value,
                    border: wall.color === c.value ? "2px solid #09090B" : "1.5px solid #E5E7EB",
                    boxShadow: wall.color === c.value ? "0 0 0 2px white, 0 0 0 3.5px #09090B" : "none",
                  }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="w-px h-[18px] bg-[#E5E7EB]" />
            <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium shrink-0">Custom</label>
            <div className="relative shrink-0">
              <input
                type="color"
                value={wall.color}
                onChange={(e) => onUpdateStandaloneWall?.(wall.id, { color: e.target.value })}
                className="w-[26px] h-[26px] rounded-[8px] border border-[#E5E7EB] cursor-pointer p-0 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-none"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!selectedRoom) return null;

  if (selectedElement.type === "room") {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute bottom-[140px] md:bottom-14 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[100px] md:rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-[#F3F4F6] px-2.5 py-1.5 md:px-3 md:py-2 flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide w-fit mx-auto md:mx-0 md:w-auto">
          {/* Room Name */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={selectedRoom.name}
              onChange={(e) => onUpdateRoom(selectedRoom.id, { name: e.target.value })}
              className="w-[80px] md:w-[100px] h-[26px] md:h-[28px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-2 font-['Inter',sans-serif] text-[11px] text-[#09090B] focus:outline-none focus:border-[#09090B]/20"
            />
          </div>

          {/* Desktop-only: Height, Thickness, Flooring Height, Split */}
          <div className="hidden md:contents">
            <div className="w-px h-[20px] bg-[#E5E7EB]" />

            {/* Height */}
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium whitespace-nowrap">Height</label>
              <input
                type="number"
                value={selectedRoom.height * 100}
                onChange={(e) => onUpdateRoom(selectedRoom.id, { height: parseFloat(e.target.value) / 100 || 2.6 })}
                step={10}
                className="w-[72px] h-[28px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-2 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
            </div>

            <div className="w-px h-[20px] bg-[#E5E7EB]" />

            {/* Thickness */}
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium whitespace-nowrap">Thickness</label>
              <input
                type="number"
                value={selectedRoom.wallThickness * 100}
                onChange={(e) => onUpdateRoom(selectedRoom.id, { wallThickness: parseFloat(e.target.value) / 100 || 0.15 })}
                step={5}
                className="w-[60px] h-[28px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-2 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
            </div>

            <div className="w-px h-[20px] bg-[#E5E7EB]" />

            {/* Flooring Height */}
            <div className="flex items-center gap-1.5">
              <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium whitespace-nowrap">Flooring Height</label>
              <input
                type="number"
                value={selectedRoom.flooringHeight * 100}
                onChange={(e) => onUpdateRoom(selectedRoom.id, { flooringHeight: parseFloat(e.target.value) / 100 || 0 })}
                step={1}
                className="w-[54px] h-[28px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-2 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
            </div>

            <div className="w-px h-[20px] bg-[#E5E7EB]" />

            {/* Split buttons */}
            <button
              onClick={onSplitV}
              className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors group"
              title="Split Vertically (Left/Right)"
            >
              <Scissors className="size-[13px] text-[#71717A] group-hover:text-[#EF4444] rotate-90" strokeWidth={1.5} />
            </button>
            <button
              onClick={onSplitH}
              className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] transition-colors group"
              title="Split Horizontally (Top/Bottom)"
            >
              <Scissors className="size-[13px] text-[#71717A] group-hover:text-[#EF4444]" strokeWidth={1.5} />
            </button>
          </div>

          <div className="w-px h-[18px] md:h-[20px] bg-[#E5E7EB]" />

          {/* Action buttons — always visible */}
          <button
            onPointerUp={(e) => { e.stopPropagation(); onDuplicateRoom(); }}
            className="size-[36px] md:size-[28px] rounded-[8px] flex items-center justify-center hover:bg-[#F6F6F6] active:bg-[#E5E7EB] transition-colors"
            title="Duplicate Room"
          >
            <Copy className="size-[14px] md:size-[13px] text-[#71717A]" strokeWidth={1.5} />
          </button>
          <button
            onPointerUp={(e) => { e.stopPropagation(); onDeleteElement(); }}
            className="size-[36px] md:size-[28px] rounded-[8px] flex items-center justify-center hover:bg-red-50 active:bg-red-100 transition-colors group"
            title="Delete Room"
          >
            <Trash2 className="size-[14px] md:size-[13px] text-[#71717A] group-hover:text-red-500 group-active:text-red-500" strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Door or Window selected
  if (selectedElement.type === "door" || selectedElement.type === "window") {
    const isDoor = selectedElement.type === "door";
    const element = isDoor 
      ? selectedRoom.doors.find(d => d.id === selectedElement.doorId)
      : selectedRoom.windows.find(w => w.id === selectedElement.windowId);

    if (!element) return null;

    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute bottom-[140px] md:bottom-14 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-[#F3F4F6] px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090B] tracking-[-0.3px] shrink-0">
            {isDoor ? "Door" : "Window"}
          </span>

          <div className="w-px h-[20px] bg-[#E5E7EB]" />

          {/* Width */}
          <div className="flex items-center gap-1.5">
            <label className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] font-medium">Width</label>
            <input
              type="number"
              value={(element.width * 100).toFixed(0)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) / 100 || 0.8;
                if (isDoor && selectedElement.type === "door") {
                  const newDoors = selectedRoom.doors.map(d =>
                    d.id === selectedElement.doorId ? { ...d, width: val } : d
                  );
                  onUpdateRoom(selectedRoom.id, { doors: newDoors });
                } else if (!isDoor && selectedElement.type === "window") {
                  const newWindows = selectedRoom.windows.map(w =>
                    w.id === selectedElement.windowId ? { ...w, width: val } : w
                  );
                  onUpdateRoom(selectedRoom.id, { windows: newWindows });
                }
              }}
              step={10}
              className="w-[60px] h-[28px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-2 font-['Inter',sans-serif] text-[11px] text-[#09090B] tabular-nums focus:outline-none focus:border-[#09090B]/20"
            />
            <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">cm</span>
          </div>

          <div className="w-px h-[20px] bg-[#E5E7EB]" />

          <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">
            Wall: {element.side}
          </span>

          <div className="w-px h-[20px] bg-[#E5E7EB]" />

          <button
            onClick={onDeleteElement}
            className="size-[28px] rounded-[8px] flex items-center justify-center hover:bg-red-50 transition-colors group"
            title="Delete"
          >
            <Trash2 className="size-[13px] text-[#71717A] group-hover:text-red-500" strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════
   Tool Bar (Compact top-right)
   ═══════════════════════════════════════════════════════ */
function ToolBar({ activeTool, onToolChange, onOpenFurniture, furnitureOpen }: { activeTool: EditorTool; onToolChange: (t: EditorTool) => void; onOpenFurniture?: () => void; furnitureOpen?: boolean }) {
  const tools: { id: EditorTool; icon: typeof MousePointer2; label: string; shortcut: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { id: "draw-room", icon: Square, label: "Draw Room", shortcut: "R" },
    { id: "draw-walls", icon: PenTool, label: "Draw Walls", shortcut: "W" },
    { id: "add-door", icon: DoorOpen, label: "Add Door", shortcut: "D" },
    { id: "add-window", icon: Grid3X3, label: "Add Window", shortcut: "N" },
  ];

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-2 md:left-3 z-30">
      <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[12px] md:rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] p-1 md:p-1.5 flex flex-col gap-0.5">
        {tools.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            className={`size-[30px] md:size-[34px] rounded-[8px] md:rounded-[10px] flex items-center justify-center transition-all relative group ${
              activeTool === id
                ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
            }`}
            title={`${label} (${shortcut})`}
          >
            <Icon className="size-[14px] md:size-[15px]" strokeWidth={1.5} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#09090B] text-white rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-['Inter',sans-serif] font-medium hidden md:block">
              {label}
              <span className="ml-1.5 text-white/40">{shortcut}</span>
            </div>
          </button>
        ))}
      </div>
      {/* Furniture button - separated */}
      {onOpenFurniture && (
        <div className="mt-2 bg-white/90 backdrop-blur-[16.75px] rounded-[12px] md:rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] p-1 md:p-1.5">
          <button
            onClick={onOpenFurniture}
            className={`size-[30px] md:size-[34px] rounded-[8px] md:rounded-[10px] flex items-center justify-center transition-all relative group ${
              furnitureOpen
                ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                : "text-[#71717A] hover:bg-[#F6F6F6] hover:text-[#09090B]"
            }`}
            title="Add Furniture (F)"
          >
            <Sofa className="size-[14px] md:size-[15px]" strokeWidth={1.5} />
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#09090B] text-white rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-['Inter',sans-serif] font-medium hidden md:block">
              Furniture
              <span className="ml-1.5 text-white/40">F</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════��════════════
   Main Editor 2D View
   ═══════════════════════════════════════════════════════ */
export function Editor2DView({
  rooms: initialRooms, furniture, activeRoomId, selectedItemId,
  onSelectItem, onSelectRoom, showGrid, showMeasurements, unitSystem,
  isVisible = true, onRoomsChange, onFurnitureMove, onFurnitureItemMove,
  openingsVersion = 0,
  houseName = "", isEditingName = false, nameInputRef, onNameChange, onStartEditing, onStopEditing, onBack,
  is2DMode = true, onToggleMode, onUndoRedoChange,
  roomFloorColors = {},
  onStandaloneWallsChange,
  onOpenFurniturePanel,
  furniturePanelOpen = false,
  onUndo: parentOnUndo,
  onRedo: parentOnRedo,
  parentCanUndo = false,
  parentCanRedo = false,
  toolChangeRef,
  onActiveToolChange,
  useMobileBottomNav = false,
  onRotateItem,
  onDeleteItem,
  onDuplicateItem,
}: Editor2DViewProps) {
  // Convert initial rooms to editable format
  const [editableRooms, setEditableRooms] = useState<EditableRoom[]>(() => convertInitialRooms(initialRooms));
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [showBuildPanel, setShowBuildPanel] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragMode, _setDragMode] = useState<DragMode>(null);
  const dragModeRef = useRef<DragMode>(null);
  // Frozen transform params — captured at drag start so coordinate mapping stays stable mid-drag
  const frozenTransformRef = useRef<{ minX: number; minZ: number; svgW: number; svgH: number; ctmInverse?: DOMMatrix } | null>(null);
  const latestTransformRef = useRef({ minX: 0, minZ: 0, svgW: 0, svgH: 0 });
  // Floating door/window position when dragged away from walls (touch freeform)
  const floatingDoorWinRef = useRef<{ worldX: number; worldZ: number; lastValidRoomId: string; lastValidSide: "north" | "south" | "east" | "west" | ""; lastValidT: number } | null>(null);
  const [floatingDoorWinPos, setFloatingDoorWinPos] = useState<{ worldX: number; worldZ: number; type: "door" | "window"; id: string; snappedTo?: { roomId: string, side: "north" | "south" | "east" | "west", t: number, w: number } } | null>(null);
  // Track initial door/window state for touch delta-based dragging
  const touchDoorWinStartRef = useRef<{ side: "north" | "south" | "east" | "west"; t: number; startWorldX: number; startWorldZ: number } | null>(null);
  // Sync setter: updates both state and ref so touch handlers can read immediately
  // Also manages frozen transform: freeze when a move drag starts, unfreeze when drag ends
  const setDragMode = useCallback((mode: DragMode) => {
    dragModeRef.current = mode;
    if (mode && (mode.type === "move-room" || mode.type === "move-door" || mode.type === "move-window"
        || mode.type === "move-furniture" || mode.type === "move-standalone-wall"
        || mode.type === "resize-room" || mode.type === "move-vertex" || mode.type === "move-split")) {
      // Freeze transform on first activation (don't re-freeze if already frozen from a continuing drag)
      if (!frozenTransformRef.current) {
        const ctmInverse = svgRef.current?.getScreenCTM()?.inverse() || undefined;
        frozenTransformRef.current = { ...latestTransformRef.current, ctmInverse };
      }
    } else if (!mode) {
      frozenTransformRef.current = null;
    }
    _setDragMode(mode);
  }, []);

  // ═══ Touch tap-vs-drag threshold system ═══
  // On mobile, we defer starting drags until finger moves past a threshold.
  // This prevents accidental moves when the user just wants to tap-select.
  const TOUCH_DRAG_THRESHOLD = 10; // pixels
  const touchPendingRef = useRef<{
    startClientX: number;
    startClientY: number;
    pendingDragMode: DragMode;
    pendingSelection: SelectedElement;
    needsUndo: boolean;
    activated: boolean; // has the drag threshold been exceeded?
  } | null>(null);

  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [hoveredWall, setHoveredWall] = useState<{ roomId: string; side: string } | null>(null);
  const [snapLines, setSnapLines] = useState<{ axis: "x" | "z"; value: number }[]>([]);
  // Live position override for the furniture item being dragged
  const [draggedFurniturePos, setDraggedFurniturePos] = useState<{ itemId: string; x: number; z: number } | null>(null);
  const [undoStack, setUndoStack] = useState<{ rooms: EditableRoom[]; walls: StandaloneWall[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ rooms: EditableRoom[]; walls: StandaloneWall[] }[]>([]);
  // Wall drawing state
  const [wallDrawPoints, setWallDrawPoints] = useState<[number, number][]>([]);
  const [wallDrawCursor, setWallDrawCursor] = useState<[number, number] | null>(null);
  // Standalone walls (drawn with Draw Walls tool)
  const [standaloneWalls, setStandaloneWalls] = useState<StandaloneWall[]>([]);
  // Active snap indicator for visual feedback
  const [activeSnap, setActiveSnap] = useState<[number, number] | null>(null);
  const [activeSnapType, setActiveSnapType] = useState<"point" | "edge" | null>(null);
  // Merge selection: up to 2 room IDs for merging
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  // Split mode: interactive split line on a room
  const [splitMode, setSplitMode] = useState<{ roomId: string; axis: "h" | "v"; t: number } | null>(null);
  // Mobile FAB menu open state
  const [mobileFabOpen, setMobileFabOpen] = useState(false);

  // Wire up toolChangeRef so parent can change active tool externally
  useEffect(() => {
    if (toolChangeRef) {
      toolChangeRef.current = (tool: EditorTool) => {
        if (tool !== "draw-walls") { setWallDrawPoints([]); setWallDrawCursor(null); }
        if (tool !== "select") { setMergeSelection([]); setSplitMode(null); }
        setActiveTool(tool);
      };
      return () => { toolChangeRef.current = null; };
    }
  }, [toolChangeRef]);

  // Report active tool changes to parent
  useEffect(() => {
    onActiveToolChange?.(activeTool);
  }, [activeTool, onActiveToolChange]);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Notify parent when rooms change (bounds, resize, add/remove)
  const onRoomsChangeRef = useRef(onRoomsChange);
  onRoomsChangeRef.current = onRoomsChange;
  const onFurnitureMoveRef = useRef(onFurnitureMove);
  onFurnitureMoveRef.current = onFurnitureMove;
  const onFurnitureItemMoveRef = useRef(onFurnitureItemMove);
  onFurnitureItemMoveRef.current = onFurnitureItemMove;
  const onStandaloneWallsChangeRef = useRef(onStandaloneWallsChange);
  onStandaloneWallsChangeRef.current = onStandaloneWallsChange;
  useEffect(() => {
    onRoomsChangeRef.current?.(editableRooms);
  }, [editableRooms]);
  useEffect(() => {
    onStandaloneWallsChangeRef.current?.(standaloneWalls);
  }, [standaloneWalls]);

  // Re-sync editable rooms from props when openings are moved in 3D mode
  const prevOpeningsVersionRef = useRef(openingsVersion);
  useEffect(() => {
    if (openingsVersion !== prevOpeningsVersionRef.current) {
      prevOpeningsVersionRef.current = openingsVersion;
      setEditableRooms(convertInitialRooms(initialRooms));
    }
  }, [openingsVersion, initialRooms]);

  // Push to undo stack
  const cloneState = useCallback(() => ({
    rooms: editableRooms.map(r => ({ ...r, doors: [...r.doors], windows: [...r.windows], polygon: r.polygon ? r.polygon.map(p => [...p] as [number, number]) : undefined })),
    walls: standaloneWalls.map(w => ({ ...w, points: w.points.map(p => [...p] as [number, number]) })),
  }), [editableRooms, standaloneWalls]);

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-30), cloneState()]);
    setRedoStack([]);
  }, [cloneState]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(rs => [...rs, cloneState()]);
    setUndoStack(us => us.slice(0, -1));
    setEditableRooms(prev.rooms);
    setStandaloneWalls(prev.walls);
  }, [undoStack, cloneState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(us => [...us, cloneState()]);
    setRedoStack(rs => rs.slice(0, -1));
    setEditableRooms(next.rooms);
    setStandaloneWalls(next.walls);
  }, [redoStack, cloneState]);

  // Report undo/redo state to parent
  useEffect(() => {
    onUndoRedoChange?.(undoStack.length > 0, redoStack.length > 0, handleUndo, handleRedo);
  }, [undoStack.length, redoStack.length, handleUndo, handleRedo, onUndoRedoChange]);

  // Calculate global bounds (include standalone walls)
  const { minX, maxX, minZ, maxZ, totalW, totalD } = useMemo(() => {
    if (editableRooms.length === 0 && standaloneWalls.length === 0) return { minX: -5, maxX: 5, minZ: -5, maxZ: 5, totalW: 10, totalD: 10 };
    let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
    for (const r of editableRooms) {
      if (r.bounds[0] < mnX) mnX = r.bounds[0];
      if (r.bounds[1] > mxX) mxX = r.bounds[1];
      if (r.bounds[2] < mnZ) mnZ = r.bounds[2];
      if (r.bounds[3] > mxZ) mxZ = r.bounds[3];
    }
    for (const w of standaloneWalls) {
      for (const [px, pz] of w.points) {
        if (px < mnX) mnX = px;
        if (px > mxX) mxX = px;
        if (pz < mnZ) mnZ = pz;
        if (pz > mxZ) mxZ = pz;
      }
    }
    if (!isFinite(mnX)) { mnX = -5; mxX = 5; mnZ = -5; mxZ = 5; }
    // Add some padding for drawing new rooms outside existing bounds
    return {
      minX: mnX - 3, maxX: mxX + 3,
      minZ: mnZ - 3, maxZ: mxZ + 3,
      totalW: mxX - mnX + 6,
      totalD: mxZ - mnZ + 6,
    };
  }, [editableRooms, standaloneWalls]);

  const SCALE = 80;
  const PAD = 120;
  const svgW = totalW * SCALE + PAD * 2;
  const svgH = totalD * SCALE + PAD * 2;
  latestTransformRef.current = { minX, minZ, svgW, svgH };

  // World coords to SVG coords
  const toSVG = useCallback((wx: number, wz: number): [number, number] => {
    return [(wx - minX) * SCALE + PAD, (wz - minZ) * SCALE + PAD];
  }, [minX, minZ]);

  // SVG coords to world coords
  const toWorld = useCallback((sx: number, sy: number): [number, number] => {
    return [(sx - PAD) / SCALE + minX, (sy - PAD) / SCALE + minZ];
  }, [minX, minZ]);

  // World coordinates from raw client coords (used by both mouse and touch)
  // Uses SVG's getScreenCTM() for robust coordinate conversion that handles
  // all ancestor transforms, viewport offsets, and mobile browser quirks.
  const getWorldPosFromCoords = useCallback((clientX: number, clientY: number): [number, number] => {
    const svg = svgRef.current;
    if (svg) {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const inv = ctm.inverse();
        const svgX = inv.a * clientX + inv.c * clientY + inv.e;
        const svgY = inv.b * clientX + inv.d * clientY + inv.f;
        return toWorld(svgX, svgY);
      }
    }
    // Fallback to manual calculation if SVG ref not available
    const container = containerRef.current;
    if (!container) return [0, 0];
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rawX = (clientX - rect.left - cx - pan.x) / zoom + cx;
    const rawY = (clientY - rect.top - cy - pan.y) / zoom + cy;
    const svgOffsetX = (rect.width - svgW) / 2;
    const svgOffsetY = (rect.height - svgH) / 2;
    const svgX = rawX - svgOffsetX;
    const svgY = rawY - svgOffsetY;
    return toWorld(svgX, svgY);
  }, [pan, zoom, svgW, svgH, toWorld]);

  // Stable version that uses frozen transform when dragging — prevents coordinate drift
  // when moving rooms/furniture causes minX/minZ to shift mid-drag
  const getWorldPosStable = useCallback((clientX: number, clientY: number): [number, number] => {
    const frozen = frozenTransformRef.current;
    if (!frozen) return getWorldPosFromCoords(clientX, clientY);
    // Use frozen CTM inverse if available (most robust)
    if (frozen.ctmInverse) {
      const inv = frozen.ctmInverse;
      const svgX = inv.a * clientX + inv.c * clientY + inv.e;
      const svgY = inv.b * clientX + inv.d * clientY + inv.f;
      return [(svgX - PAD) / SCALE + frozen.minX, (svgY - PAD) / SCALE + frozen.minZ];
    }
    // Fallback to manual calculation
    const container = containerRef.current;
    if (!container) return [0, 0];
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rawX = (clientX - rect.left - cx - pan.x) / zoom + cx;
    const rawY = (clientY - rect.top - cy - pan.y) / zoom + cy;
    const svgOffsetX = (rect.width - frozen.svgW) / 2;
    const svgOffsetY = (rect.height - frozen.svgH) / 2;
    const svgX = rawX - svgOffsetX;
    const svgY = rawY - svgOffsetY;
    return [(svgX - PAD) / SCALE + frozen.minX, (svgY - PAD) / SCALE + frozen.minZ];
  }, [pan, zoom, getWorldPosFromCoords]);

  // Freeze/unfreeze transform for drag operations
  const freezeTransform = useCallback(() => {
    frozenTransformRef.current = { minX, minZ, svgW, svgH };
  }, [minX, minZ, svgW, svgH]);
  const unfreezeTransform = useCallback(() => {
    frozenTransformRef.current = null;
  }, []);

  // Mouse position to world coordinates
  const getWorldPos = useCallback((e: React.MouseEvent): [number, number] => {
    return getWorldPosFromCoords(e.clientX, e.clientY);
  }, [getWorldPosFromCoords]);

  // Stable mouse position (uses frozen transform during drags)
  const getWorldPosStableFromEvent = useCallback((e: React.MouseEvent): [number, number] => {
    return getWorldPosStable(e.clientX, e.clientY);
  }, [getWorldPosStable]);

  // Find wall at point (wider threshold when dragging doors/windows for easier snapping)
  // Polygon-aware: checks each polygon edge and classifies as N/S/E/W by outward normal
  const findWallAtPoint = useCallback((worldX: number, worldZ: number, wideSnap?: boolean, preferRoomId?: string): { roomId: string; side: "north" | "south" | "east" | "west" } | null => {
    const threshold = wideSnap ? 1.0 : 0.2;
    // Find the globally closest wall across ALL rooms, with a bias toward preferRoomId
    // so doors/windows don't jump to adjacent rooms on shared walls
    const PREFER_BIAS = 0.3;
    let globalBestDist = threshold + 1;
    let globalBestResult: { roomId: string; side: "north" | "south" | "east" | "west" } | null = null;

    for (const room of editableRooms) {
      let roomBestDist = threshold + 1;
      let roomBestSide: "north" | "south" | "east" | "west" | null = null;

      if (room.polygon && room.polygon.length >= 3) {
        // Polygon room: check each edge
        const poly = room.polygon;
        let area2 = 0;
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i], b = poly[(i + 1) % poly.length];
          area2 += a[0] * b[1] - b[0] * a[1];
        }
        const ns = area2 > 0 ? 1 : -1;

        for (let i = 0; i < poly.length; i++) {
          const p1 = poly[i], p2 = poly[(i + 1) % poly.length];
          const edgeDx = p2[0] - p1[0], edgeDz = p2[1] - p1[1];
          const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDz * edgeDz);
          if (edgeLen < 0.01) continue;

          let tProj = ((worldX - p1[0]) * edgeDx + (worldZ - p1[1]) * edgeDz) / (edgeLen * edgeLen);
          tProj = Math.max(0, Math.min(1, tProj));
          const projX = p1[0] + tProj * edgeDx;
          const projZ = p1[1] + tProj * edgeDz;
          const dist = Math.sqrt((worldX - projX) ** 2 + (worldZ - projZ) ** 2);

          if (dist < threshold && dist < roomBestDist) {
            const isHoriz = Math.abs(edgeDz) < 0.001;
            const isVert = Math.abs(edgeDx) < 0.001;
            let side2D: "north" | "south" | "east" | "west";
            if (isHoriz) {
              const nzSign = ns * (edgeDx > 0 ? -1 : 1);
              side2D = nzSign < 0 ? "north" : "south";
            } else if (isVert) {
              const nxSign = ns * (edgeDz > 0 ? 1 : -1);
              side2D = nxSign > 0 ? "east" : "west";
            } else {
              continue; // skip non-axis-aligned edges
            }
            roomBestDist = dist;
            roomBestSide = side2D;
          }
        }
      } else {
        // Rectangular room: find the closest wall
        const [xMin, xMax, zMin, zMax] = room.bounds;

        if (worldX >= xMin - threshold && worldX <= xMax + threshold) {
          const d = Math.abs(worldZ - zMin);
          if (d < threshold && d < roomBestDist) { roomBestDist = d; roomBestSide = "north"; }
        }
        if (worldX >= xMin - threshold && worldX <= xMax + threshold) {
          const d = Math.abs(worldZ - zMax);
          if (d < threshold && d < roomBestDist) { roomBestDist = d; roomBestSide = "south"; }
        }
        if (worldZ >= zMin - threshold && worldZ <= zMax + threshold) {
          const d = Math.abs(worldX - xMin);
          if (d < threshold && d < roomBestDist) { roomBestDist = d; roomBestSide = "west"; }
        }
        if (worldZ >= zMin - threshold && worldZ <= zMax + threshold) {
          const d = Math.abs(worldX - xMax);
          if (d < threshold && d < roomBestDist) { roomBestDist = d; roomBestSide = "east"; }
        }
      }

      if (roomBestSide) {
        // Preferred room gets a distance advantage so it wins on shared walls
        const effectiveDist = preferRoomId && room.id === preferRoomId
          ? roomBestDist - PREFER_BIAS
          : roomBestDist;
        if (effectiveDist < globalBestDist) {
          globalBestDist = effectiveDist;
          globalBestResult = { roomId: room.id, side: roomBestSide };
        }
      }
    }
    return globalBestResult;
  }, [editableRooms]);

  // Standalone wall at point
  const findStandaloneWallAtPoint = useCallback((worldX: number, worldZ: number): string | null => {
    const threshold = 0.25;
    for (const wall of [...standaloneWalls].reverse()) {
      for (let i = 0; i < wall.points.length - 1; i++) {
        const [ax, az] = wall.points[i];
        const [bx, bz] = wall.points[i + 1];
        // Distance from point to line segment
        const dx = bx - ax, dz = bz - az;
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) continue;
        let t = ((worldX - ax) * dx + (worldZ - az) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = ax + t * dx, projZ = az + t * dz;
        const dist = Math.sqrt((worldX - projX) ** 2 + (worldZ - projZ) ** 2);
        if (dist < threshold + wall.thickness / 2) return wall.id;
      }
    }
    return null;
  }, [standaloneWalls]);

  // Room at point (supports polygon rooms via ray casting)
  const findRoomAtPoint = useCallback((worldX: number, worldZ: number): string | null => {
    for (const room of [...editableRooms].reverse()) {
      if (room.polygon) {
        // Ray casting algorithm for point-in-polygon
        const pts = room.polygon;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, zi] = pts[i];
          const [xj, zj] = pts[j];
          if ((zi > worldZ) !== (zj > worldZ) &&
              worldX < (xj - xi) * (worldZ - zi) / (zj - zi) + xi) {
            inside = !inside;
          }
        }
        if (inside) return room.id;
      } else {
        const [xMin, xMax, zMin, zMax] = room.bounds;
        if (worldX >= xMin && worldX <= xMax && worldZ >= zMin && worldZ <= zMax) {
          return room.id;
        }
      }
    }
    return null;
  }, [editableRooms]);

  // Update room
  const updateRoom = useCallback((id: string, updates: Partial<EditableRoom>) => {
    setEditableRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  // Delete selected element
  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) return;
    pushUndo();

    if (selectedElement.type === "room") {
      setEditableRooms(prev => prev.filter(r => r.id !== selectedElement.roomId));
      setSelectedElement(null);
    } else if (selectedElement.type === "door") {
      setEditableRooms(prev => prev.map(r => 
        r.id === selectedElement.roomId 
          ? { ...r, doors: r.doors.filter(d => d.id !== selectedElement.doorId) }
          : r
      ));
      setSelectedElement(null);
    } else if (selectedElement.type === "window") {
      setEditableRooms(prev => prev.map(r => 
        r.id === selectedElement.roomId 
          ? { ...r, windows: r.windows.filter(w => w.id !== selectedElement.windowId) }
          : r
      ));
      setSelectedElement(null);
    } else if (selectedElement.type === "standalone-wall") {
      setStandaloneWalls(prev => prev.filter(w => w.id !== selectedElement.wallId));
      setSelectedElement(null);
    }
  }, [selectedElement, pushUndo]);

  // Duplicate room
  const duplicateRoom = useCallback(() => {
    if (!selectedElement || selectedElement.type !== "room") return;
    pushUndo();
    const srcRoom = editableRooms.find(r => r.id === selectedElement.roomId);
    if (!srcRoom) return;

    const offset = 0.5;
    const newRoom: EditableRoom = {
      ...srcRoom,
      id: genId(),
      name: `${srcRoom.name} (copy)`,
      bounds: [srcRoom.bounds[0] + offset, srcRoom.bounds[1] + offset, srcRoom.bounds[2] + offset, srcRoom.bounds[3] + offset],
      doors: srcRoom.doors.map(d => ({ ...d, id: genDoorId() })),
      windows: srcRoom.windows.map(w => ({ ...w, id: genWindowId() })),
    };
    setEditableRooms(prev => [...prev, newRoom]);
    setSelectedElement({ type: "room", roomId: newRoom.id });
  }, [selectedElement, editableRooms, pushUndo]);

  // Merge two rooms — compute bounding box union, remove shared internal doors/windows
  const mergeRooms = useCallback(() => {
    if (mergeSelection.length !== 2) return;
    const roomA = editableRooms.find(r => r.id === mergeSelection[0]);
    const roomB = editableRooms.find(r => r.id === mergeSelection[1]);
    if (!roomA || !roomB) return;

    pushUndo();

    // Compute bounding box union
    const newBounds: [number, number, number, number] = [
      Math.min(roomA.bounds[0], roomB.bounds[0]),
      Math.max(roomA.bounds[1], roomB.bounds[1]),
      Math.min(roomA.bounds[2], roomB.bounds[2]),
      Math.max(roomA.bounds[3], roomB.bounds[3]),
    ];

    // Compute overlap region (for filtering internal doors/windows)
    const overlapXMin = Math.max(roomA.bounds[0], roomB.bounds[0]);
    const overlapXMax = Math.min(roomA.bounds[1], roomB.bounds[1]);
    const overlapZMin = Math.max(roomA.bounds[2], roomB.bounds[2]);
    const overlapZMax = Math.min(roomA.bounds[3], roomB.bounds[3]);
    const hasOverlap = overlapXMin < overlapXMax && overlapZMin < overlapZMax;

    // Helper: check if a door/window on a room wall is on an internal (shared) edge
    function isOnSharedEdge(
      room: EditableRoom,
      side: "north" | "south" | "east" | "west",
      t: number,
      width: number,
      other: EditableRoom,
    ): boolean {
      if (!hasOverlap) return false;
      const rW = room.bounds[1] - room.bounds[0];
      const rD = room.bounds[3] - room.bounds[2];

      // The wall position in world coords
      if (side === "north") {
        // North wall = zMin edge
        const wallZ = room.bounds[2];
        // Check if this wall overlaps with the other room's south wall
        if (Math.abs(wallZ - other.bounds[3]) > 0.01) return false;
        const itemWorldX = room.bounds[0] + t * rW;
        return itemWorldX >= overlapXMin && itemWorldX <= overlapXMax;
      }
      if (side === "south") {
        const wallZ = room.bounds[3];
        if (Math.abs(wallZ - other.bounds[2]) > 0.01) return false;
        const itemWorldX = room.bounds[0] + t * rW;
        return itemWorldX >= overlapXMin && itemWorldX <= overlapXMax;
      }
      if (side === "west") {
        const wallX = room.bounds[0];
        if (Math.abs(wallX - other.bounds[1]) > 0.01) return false;
        const itemWorldZ = room.bounds[2] + t * rD;
        return itemWorldZ >= overlapZMin && itemWorldZ <= overlapZMax;
      }
      if (side === "east") {
        const wallX = room.bounds[1];
        if (Math.abs(wallX - other.bounds[0]) > 0.01) return false;
        const itemWorldZ = room.bounds[2] + t * rD;
        return itemWorldZ >= overlapZMin && itemWorldZ <= overlapZMax;
      }
      return false;
    }

    // Remap a door/window from old room coords to new merged room coords
    function remapT(
      room: EditableRoom,
      side: "north" | "south" | "east" | "west",
      t: number,
    ): { newSide: "north" | "south" | "east" | "west"; newT: number } | null {
      const rW = room.bounds[1] - room.bounds[0];
      const rD = room.bounds[3] - room.bounds[2];
      const mW = newBounds[1] - newBounds[0];
      const mD = newBounds[3] - newBounds[2];

      if (side === "north" || side === "south") {
        const worldX = room.bounds[0] + t * rW;
        const newT = (worldX - newBounds[0]) / mW;
        // Check that this wall side still exists on the merged room
        if (side === "north" && Math.abs(room.bounds[2] - newBounds[2]) > 0.01) return null;
        if (side === "south" && Math.abs(room.bounds[3] - newBounds[3]) > 0.01) return null;
        return { newSide: side, newT: Math.max(0, Math.min(1, newT)) };
      }
      if (side === "west" || side === "east") {
        const worldZ = room.bounds[2] + t * rD;
        const newT = (worldZ - newBounds[2]) / mD;
        if (side === "west" && Math.abs(room.bounds[0] - newBounds[0]) > 0.01) return null;
        if (side === "east" && Math.abs(room.bounds[1] - newBounds[1]) > 0.01) return null;
        return { newSide: side, newT: Math.max(0, Math.min(1, newT)) };
      }
      return null;
    }

    // Collect doors from both rooms, excluding internal shared-edge ones, remapped to new coords
    const mergedDoors: EditableDoor[] = [];
    for (const room of [roomA, roomB]) {
      const other = room === roomA ? roomB : roomA;
      for (const door of room.doors) {
        if (isOnSharedEdge(room, door.side, door.t, door.width, other)) continue;
        const mapped = remapT(room, door.side, door.t);
        if (mapped) {
          mergedDoors.push({ ...door, id: genDoorId(), side: mapped.newSide, t: mapped.newT });
        }
      }
    }

    // Collect windows similarly
    const mergedWindows: EditableWindow[] = [];
    for (const room of [roomA, roomB]) {
      const other = room === roomA ? roomB : roomA;
      for (const win of room.windows) {
        if (isOnSharedEdge(room, win.side, win.t, win.width, other)) continue;
        const mapped = remapT(room, win.side, win.t);
        if (mapped) {
          mergedWindows.push({ ...win, id: genWindowId(), side: mapped.newSide, t: mapped.newT });
        }
      }
    }

    // Compute polygon for non-rectangular unions (L/T/+ shapes)
    const unionPoly = computeRectilinearUnion(roomA.bounds, roomB.bounds);

    // Create merged room (inherits properties from roomA)
    const mergedRoom: EditableRoom = {
      ...roomA,
      id: genId(),
      name: `Room`,
      bounds: newBounds,
      polygon: unionPoly || undefined,
      doors: mergedDoors,
      windows: mergedWindows,
      locked: false,
    };

    // Remove old rooms, add merged
    setEditableRooms(prev => [
      ...prev.filter(r => r.id !== roomA.id && r.id !== roomB.id),
      mergedRoom,
    ]);
    setMergeSelection([]);
    setSelectedElement({ type: "room", roomId: mergedRoom.id });
  }, [mergeSelection, editableRooms, pushUndo]);

  // Split a room into two at the split line position
  const executeSplit = useCallback(() => {
    if (!splitMode) return;
    const room = editableRooms.find(r => r.id === splitMode.roomId);
    if (!room) { setSplitMode(null); return; }

    pushUndo();
    const [xMin, xMax, zMin, zMax] = room.bounds;
    const rW = xMax - xMin;
    const rD = zMax - zMin;
    const accentA = ACCENT_COLORS[(editableRooms.length) % ACCENT_COLORS.length];
    const accentB = ACCENT_COLORS[(editableRooms.length + 1) % ACCENT_COLORS.length];

    let roomA: EditableRoom;
    let roomB: EditableRoom;

    if (splitMode.axis === "v") {
      const splitX = xMin + splitMode.t * rW;
      roomA = {
        ...room, id: genId(), name: `${room.name} (L)`, accent: accentA,
        bounds: [xMin, splitX, zMin, zMax], polygon: undefined,
        doors: [], windows: [], locked: false,
      };
      roomB = {
        ...room, id: genId(), name: `${room.name} (R)`, accent: accentB,
        bounds: [splitX, xMax, zMin, zMax], polygon: undefined,
        doors: [], windows: [], locked: false,
      };
      // Distribute doors
      for (const door of room.doors) {
        if (door.side === "north" || door.side === "south") {
          const worldX = xMin + door.t * rW;
          if (worldX <= splitX) {
            const newT = splitX - xMin > 0.01 ? (worldX - xMin) / (splitX - xMin) : 0.5;
            roomA.doors.push({ ...door, id: genDoorId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          } else {
            const newT = xMax - splitX > 0.01 ? (worldX - splitX) / (xMax - splitX) : 0.5;
            roomB.doors.push({ ...door, id: genDoorId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          }
        } else if (door.side === "west") {
          roomA.doors.push({ ...door, id: genDoorId() });
        } else {
          roomB.doors.push({ ...door, id: genDoorId() });
        }
      }
      // Distribute windows
      for (const win of room.windows) {
        if (win.side === "north" || win.side === "south") {
          const worldX = xMin + win.t * rW;
          if (worldX <= splitX) {
            const newT = splitX - xMin > 0.01 ? (worldX - xMin) / (splitX - xMin) : 0.5;
            roomA.windows.push({ ...win, id: genWindowId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          } else {
            const newT = xMax - splitX > 0.01 ? (worldX - splitX) / (xMax - splitX) : 0.5;
            roomB.windows.push({ ...win, id: genWindowId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          }
        } else if (win.side === "west") {
          roomA.windows.push({ ...win, id: genWindowId() });
        } else {
          roomB.windows.push({ ...win, id: genWindowId() });
        }
      }
    } else {
      // Horizontal split
      const splitZ = zMin + splitMode.t * rD;
      roomA = {
        ...room, id: genId(), name: `${room.name} (T)`, accent: accentA,
        bounds: [xMin, xMax, zMin, splitZ], polygon: undefined,
        doors: [], windows: [], locked: false,
      };
      roomB = {
        ...room, id: genId(), name: `${room.name} (B)`, accent: accentB,
        bounds: [xMin, xMax, splitZ, zMax], polygon: undefined,
        doors: [], windows: [], locked: false,
      };
      for (const door of room.doors) {
        if (door.side === "east" || door.side === "west") {
          const worldZ = zMin + door.t * rD;
          if (worldZ <= splitZ) {
            const newT = splitZ - zMin > 0.01 ? (worldZ - zMin) / (splitZ - zMin) : 0.5;
            roomA.doors.push({ ...door, id: genDoorId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          } else {
            const newT = zMax - splitZ > 0.01 ? (worldZ - splitZ) / (zMax - splitZ) : 0.5;
            roomB.doors.push({ ...door, id: genDoorId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          }
        } else if (door.side === "north") {
          roomA.doors.push({ ...door, id: genDoorId() });
        } else {
          roomB.doors.push({ ...door, id: genDoorId() });
        }
      }
      for (const win of room.windows) {
        if (win.side === "east" || win.side === "west") {
          const worldZ = zMin + win.t * rD;
          if (worldZ <= splitZ) {
            const newT = splitZ - zMin > 0.01 ? (worldZ - zMin) / (splitZ - zMin) : 0.5;
            roomA.windows.push({ ...win, id: genWindowId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          } else {
            const newT = zMax - splitZ > 0.01 ? (worldZ - splitZ) / (zMax - splitZ) : 0.5;
            roomB.windows.push({ ...win, id: genWindowId(), t: Math.max(0.05, Math.min(0.95, newT)) });
          }
        } else if (win.side === "north") {
          roomA.windows.push({ ...win, id: genWindowId() });
        } else {
          roomB.windows.push({ ...win, id: genWindowId() });
        }
      }
    }

    setEditableRooms(prev => [
      ...prev.filter(r => r.id !== room.id),
      roomA, roomB,
    ]);
    setSelectedElement({ type: "room", roomId: roomA.id });
    setSplitMode(null);
  }, [splitMode, editableRooms, pushUndo]);

  // Add room from template
  const addRoomFromTemplate = useCallback((template: RoomTemplate) => {
    pushUndo();
    const id = genId();
    const accent = ACCENT_COLORS[editableRooms.length % ACCENT_COLORS.length];
    // Place at center of current view
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const newRoom: EditableRoom = {
      id,
      name: template.name,
      bounds: [
        cx - template.width / 2, cx + template.width / 2,
        cz - template.depth / 2, cz + template.depth / 2,
      ],
      height: 2.6,
      wallThickness: 0.15,
      flooringHeight: 0,
      floorColor: "#D4B896",
      wallColor: "#FAFAFA",
      accent,
      doors: [],
      windows: [],
      locked: false,
      visible: true,
    };
    setEditableRooms(prev => [...prev, newRoom]);
    setSelectedElement({ type: "room", roomId: id });
    setActiveTool("select");
  }, [editableRooms.length, minX, maxX, minZ, maxZ, pushUndo]);

  // Finish wall drawing — create a standalone wall polyline
  const finishWallDraw = useCallback((points: [number, number][]) => {
    if (points.length < 2) {
      setWallDrawPoints([]);
      setWallDrawCursor(null);
      return;
    }
    pushUndo();
    const id = genWallId();
    const newWall: StandaloneWall = {
      id,
      points: points.map(p => [...p] as [number, number]),
      thickness: 0.15,
      height: 2.6,
      color: "#09090B",
    };
    setStandaloneWalls(prev => [...prev, newWall]);
    setSelectedElement({ type: "standalone-wall", wallId: id });
    setWallDrawPoints([]);
    setWallDrawCursor(null);
    setActiveSnap(null);
    setActiveSnapType(null);
  }, [pushUndo]);

  // ═══ Mouse Handlers ═══
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) return; // Ignore right-click

    // Middle mouse or Alt+click for panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setDragMode({ type: "pan", startMouse: [e.clientX, e.clientY], startPan: [pan.x, pan.y] });
      e.preventDefault();
      return;
    }

    const [worldX, worldZ] = getWorldPos(e);

    if (activeTool === "draw-room") {
      const snappedX = snapToGrid(worldX, SNAP_GRID);
      const snappedZ = snapToGrid(worldZ, SNAP_GRID);
      setDragMode({ type: "draw-room", startWorld: [snappedX, snappedZ], currentWorld: [snappedX, snappedZ] });
      return;
    }

    if (activeTool === "draw-walls") {
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      // Try geometry snapping first (room corners, wall endpoints, edges), fall back to grid
      const targets = getSnapTargets(editableRooms, standaloneWalls);
      const edges = getSnapEdges(editableRooms, standaloneWalls);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edges);
      const finalX = snap.snapped ? snap.x : gridX;
      const finalZ = snap.snapped ? snap.z : gridZ;
      
      // Add point to the polyline
      setWallDrawPoints(prev => [...prev, [finalX, finalZ]]);
      setActiveSnap(snap.snapped ? snap.snapTarget : null);
      setActiveSnapType(snap.snapType);
      return;
    }

    if (activeTool === "add-door" || activeTool === "add-window") {
      const wall = findWallAtPoint(worldX, worldZ);
      if (wall) {
        pushUndo();
        const room = editableRooms.find(r => r.id === wall.roomId);
        if (!room) return;
        
        const [xMin, xMax, zMin, zMax] = room.bounds;
        const rW = xMax - xMin;
        const rD = zMax - zMin;
        
        let t: number;
        if (wall.side === "north" || wall.side === "south") {
          t = Math.max(0.1, Math.min(0.9, (worldX - xMin) / rW));
        } else {
          t = Math.max(0.1, Math.min(0.9, (worldZ - zMin) / rD));
        }

        if (activeTool === "add-door") {
          const newDoor: EditableDoor = { id: genDoorId(), side: wall.side, t, width: 0.8 };
          updateRoom(wall.roomId, { doors: [...room.doors, newDoor] });
          setSelectedElement({ type: "door", roomId: wall.roomId, doorId: newDoor.id });
        } else {
          const newWindow: EditableWindow = { id: genWindowId(), side: wall.side, t, width: 1.2, height: 1.2, sillHeight: 0.9 };
          updateRoom(wall.roomId, { windows: [...room.windows, newWindow] });
          setSelectedElement({ type: "window", roomId: wall.roomId, windowId: newWindow.id });
        }
      }
      return;
    }

    if (activeTool === "delete") {
      const wall = findWallAtPoint(worldX, worldZ);
      if (wall) {
        // Check if there's a door or window on this wall
        const room = editableRooms.find(r => r.id === wall.roomId);
        if (room) {
          // Check doors on this wall
          const doorOnWall = room.doors.find(d => d.side === wall.side);
          if (doorOnWall) {
            pushUndo();
            updateRoom(wall.roomId, { doors: room.doors.filter(d => d.id !== doorOnWall.id) });
            return;
          }
          // Check windows
          const winOnWall = room.windows.find(w => w.side === wall.side);
          if (winOnWall) {
            pushUndo();
            updateRoom(wall.roomId, { windows: room.windows.filter(w => w.id !== winOnWall.id) });
            return;
          }
        }
      }
      // Check standalone walls
      const swId = findStandaloneWallAtPoint(worldX, worldZ);
      if (swId) {
        pushUndo();
        setStandaloneWalls(prev => prev.filter(w => w.id !== swId));
        setSelectedElement(null);
        return;
      }
      const roomId = findRoomAtPoint(worldX, worldZ);
      if (roomId) {
        pushUndo();
        setEditableRooms(prev => prev.filter(r => r.id !== roomId));
        setSelectedElement(null);
      }
      return;
    }

    // Select tool - handled by SVG element click handlers (rooms, standalone walls, etc.)
  }, [activeTool, pan, getWorldPos, findWallAtPoint, findRoomAtPoint, editableRooms, standaloneWalls, pushUndo, updateRoom, wallDrawPoints, finishWallDraw, findStandaloneWallAtPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Track cursor for wall drawing preview
    if (activeTool === "draw-walls") {
      const [worldX, worldZ] = getWorldPos(e);
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      const targets = getSnapTargets(editableRooms, standaloneWalls);
      const edges = getSnapEdges(editableRooms, standaloneWalls);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edges);
      if (snap.snapped) {
        setWallDrawCursor([snap.x, snap.z]);
        setActiveSnap(snap.snapTarget);
        setActiveSnapType(snap.snapType);
      } else {
        setWallDrawCursor([gridX, gridZ]);
        setActiveSnap(null);
        setActiveSnapType(null);
      }
    }

    if (!dragMode) {
      // Update hovered wall for visual feedback
      if (activeTool === "add-door" || activeTool === "add-window") {
        const [worldX, worldZ] = getWorldPos(e);
        const wall = findWallAtPoint(worldX, worldZ);
        setHoveredWall(wall ? { roomId: wall.roomId, side: wall.side } : null);
      }
      return;
    }

    if (dragMode.type === "pan") {
      const dx = e.clientX - dragMode.startMouse[0];
      const dy = e.clientY - dragMode.startMouse[1];
      setPan({ x: dragMode.startPan[0] + dx, y: dragMode.startPan[1] + dy });
      return;
    }

    if (dragMode.type === "draw-room") {
      const [worldX, worldZ] = getWorldPos(e);
      setDragMode({
        ...dragMode,
        currentWorld: [snapToGrid(worldX, SNAP_GRID), snapToGrid(worldZ, SNAP_GRID)],
      });
      return;
    }

    if (dragMode.type === "move-room") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      let dx = snapToGrid(worldX - dragMode.startMouse[0], SNAP_GRID);
      let dz = snapToGrid(worldZ - dragMode.startMouse[1], SNAP_GRID);
      const [xMin, xMax, zMin, zMax] = dragMode.startBounds;

      // Candidate bounds after grid snap
      let nxMin = xMin + dx, nxMax = xMax + dx, nzMin = zMin + dz, nzMax = zMax + dz;

      // Snap to adjacent room edges
      setEditableRooms(prev => {
        const others = prev.filter(r => r.id !== dragMode.roomId);
        let bestDx = 0, bestDz = 0;
        let closestX = ROOM_SNAP_THRESHOLD + 1;
        let closestZ = ROOM_SNAP_THRESHOLD + 1;

        for (const o of others) {
          const [oxMin, oxMax, ozMin, ozMax] = o.bounds;
          // X-axis edge pairs: check if moving room's left/right aligns with other's left/right
          const xPairs = [
            nxMin - oxMax, // left edge → other's right edge (snap together)
            nxMin - oxMin, // left edge → other's left edge (align)
            nxMax - oxMin, // right edge → other's left edge (snap together)
            nxMax - oxMax, // right edge → other's right edge (align)
          ];
          for (const gap of xPairs) {
            if (Math.abs(gap) < closestX) { closestX = Math.abs(gap); bestDx = -gap; }
          }
          // Z-axis edge pairs
          const zPairs = [
            nzMin - ozMax, // top edge → other's bottom edge
            nzMin - ozMin, // top → top align
            nzMax - ozMin, // bottom → other's top
            nzMax - ozMax, // bottom → bottom align
          ];
          for (const gap of zPairs) {
            if (Math.abs(gap) < closestZ) { closestZ = Math.abs(gap); bestDz = -gap; }
          }
        }

        const newSnaps: { axis: "x" | "z"; value: number }[] = [];
        if (closestX <= ROOM_SNAP_THRESHOLD) {
          nxMin += bestDx; nxMax += bestDx;
          // Show snap guide at the snapped X edge
          newSnaps.push({ axis: "x", value: bestDx < 0 ? nxMax : nxMin });
        }
        if (closestZ <= ROOM_SNAP_THRESHOLD) {
          nzMin += bestDz; nzMax += bestDz;
          newSnaps.push({ axis: "z", value: bestDz < 0 ? nzMax : nzMin });
        }
        setSnapLines(newSnaps);

        return prev.map(r => {
          if (r.id !== dragMode.roomId) return r;
          const moveDx = nxMin - r.bounds[0];
          const moveDz = nzMin - r.bounds[2];
          return {
            ...r,
            bounds: [nxMin, nxMax, nzMin, nzMax] as [number, number, number, number],
            ...(r.polygon ? { polygon: r.polygon.map(([px, pz]) =>
              [px + moveDx, pz + moveDz] as [number, number]
            ) } : {}),
          };
        });
      });
      return;
    }

    if (dragMode.type === "resize-room") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      let sx = snapToGrid(worldX, SNAP_GRID);
      let sz = snapToGrid(worldZ, SNAP_GRID);
      const [oXMin, oXMax, oZMin, oZMax] = dragMode.startBounds;
      const handle = dragMode.handle;
      const MIN_SIZE = 0.5;

      // Snap resize edge to nearby room edges
      setEditableRooms(prev => {
        const others = prev.filter(r => r.id !== dragMode.roomId);
        const newSnaps: { axis: "x" | "z"; value: number }[] = [];

        const snapCoord = (val: number, axis: "x" | "z"): number => {
          let best = val, bestDist = ROOM_SNAP_THRESHOLD + 1;
          for (const o of others) {
            const edges = axis === "x" ? [o.bounds[0], o.bounds[1]] : [o.bounds[2], o.bounds[3]];
            for (const edge of edges) {
              const dist = Math.abs(val - edge);
              if (dist < bestDist) { bestDist = dist; best = edge; }
            }
          }
          if (bestDist <= ROOM_SNAP_THRESHOLD) newSnaps.push({ axis, value: best });
          return best;
        };

        let newBounds: [number, number, number, number] = [oXMin, oXMax, oZMin, oZMax];
        if (handle.includes("n")) newBounds[2] = Math.min(snapCoord(sz, "z"), oZMax - MIN_SIZE);
        if (handle.includes("s")) newBounds[3] = Math.max(snapCoord(sz, "z"), oZMin + MIN_SIZE);
        if (handle.includes("w")) newBounds[0] = Math.min(snapCoord(sx, "x"), oXMax - MIN_SIZE);
        if (handle.includes("e")) newBounds[1] = Math.max(snapCoord(sx, "x"), oXMin + MIN_SIZE);
        setSnapLines(newSnaps);

        return prev.map(r =>
          r.id === dragMode.roomId ? { ...r, bounds: newBounds } : r
        );
      });
      return;
    }

    if (dragMode.type === "move-door" || dragMode.type === "move-window") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      // Find the nearest wall to snap to (wide threshold for easy snapping), prefer current room
      const wall = findWallAtPoint(worldX, worldZ, true, dragMode.roomId);
      if (!wall) return;

      const room = editableRooms.find(r => r.id === wall.roomId);
      if (!room) return;

      const [xMin, xMax, zMin, zMax] = room.bounds;
      const rW = xMax - xMin;
      const rD = zMax - zMin;

      let t: number;
      if (wall.side === "north" || wall.side === "south") {
        t = Math.max(0.05, Math.min(0.95, (worldX - xMin) / rW));
      } else {
        t = Math.max(0.05, Math.min(0.95, (worldZ - zMin) / rD));
      }
      t = snapToGrid(t, 0.01);

      if (dragMode.type === "move-door") {
        // Move door — may change room and wall
        const origRoom = editableRooms.find(r => r.id === dragMode.roomId);
        if (!origRoom) return;
        const door = origRoom.doors.find(d => d.id === dragMode.doorId);
        if (!door) return;

        if (wall.roomId === dragMode.roomId) {
          // Same room, just update side and t
          setEditableRooms(prev => prev.map(r =>
            r.id === dragMode.roomId
              ? { ...r, doors: r.doors.map(d => d.id === dragMode.doorId ? { ...d, side: wall.side, t } : d) }
              : r
          ));
        } else {
          // Moving to a different room
          const movedDoor = { ...door, side: wall.side, t };
          setEditableRooms(prev => prev.map(r => {
            if (r.id === dragMode.roomId) return { ...r, doors: r.doors.filter(d => d.id !== dragMode.doorId) };
            if (r.id === wall.roomId) return { ...r, doors: [...r.doors, movedDoor] };
            return r;
          }));
          // Update dragMode to track new room
          setDragMode({ type: "move-door", roomId: wall.roomId, doorId: dragMode.doorId });
          setSelectedElement({ type: "door", roomId: wall.roomId, doorId: dragMode.doorId });
        }
      } else {
        // Move window
        const origRoom = editableRooms.find(r => r.id === dragMode.roomId);
        if (!origRoom) return;
        const win = origRoom.windows.find(w => w.id === dragMode.windowId);
        if (!win) return;

        if (wall.roomId === dragMode.roomId) {
          setEditableRooms(prev => prev.map(r =>
            r.id === dragMode.roomId
              ? { ...r, windows: r.windows.map(w => w.id === dragMode.windowId ? { ...w, side: wall.side, t } : w) }
              : r
          ));
        } else {
          const movedWin = { ...win, side: wall.side, t };
          setEditableRooms(prev => prev.map(r => {
            if (r.id === dragMode.roomId) return { ...r, windows: r.windows.filter(w => w.id !== dragMode.windowId) };
            if (r.id === wall.roomId) return { ...r, windows: [...r.windows, movedWin] };
            return r;
          }));
          setDragMode({ type: "move-window", roomId: wall.roomId, windowId: dragMode.windowId });
          setSelectedElement({ type: "window", roomId: wall.roomId, windowId: dragMode.windowId });
        }
      }
      return;
    }

    if (dragMode.type === "move-furniture") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      const dx = worldX - dragMode.startWorld[0];
      const dz = worldZ - dragMode.startWorld[1];
      let newX = snapToGrid(dragMode.startPos[0] + dx, SNAP_GRID);
      let newZ = snapToGrid(dragMode.startPos[1] + dz, SNAP_GRID);

      // Snap to room edges and other furniture centers
      const FURN_SNAP = 0.15; // 15cm snap threshold
      const furnSnaps: { axis: "x" | "z"; value: number }[] = [];
      // Collect snap targets: room edges
      for (const r of editableRooms) {
        const [rxMin, rxMax, rzMin, rzMax] = r.bounds;
        const rcx = (rxMin + rxMax) / 2, rcz = (rzMin + rzMax) / 2;
        for (const tx of [rxMin, rxMax, rcx]) {
          if (Math.abs(newX - tx) < FURN_SNAP) { newX = tx; furnSnaps.push({ axis: "x", value: tx }); break; }
        }
        for (const tz of [rzMin, rzMax, rcz]) {
          if (Math.abs(newZ - tz) < FURN_SNAP) { newZ = tz; furnSnaps.push({ axis: "z", value: tz }); break; }
        }
      }
      setSnapLines(furnSnaps);
      setDraggedFurniturePos({ itemId: dragMode.itemId, x: newX, z: newZ });
      return;
    }

    if (dragMode.type === "move-standalone-wall") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      const dx = snapToGrid(worldX - dragMode.startMouse[0], SNAP_GRID);
      const dz = snapToGrid(worldZ - dragMode.startMouse[1], SNAP_GRID);
      setStandaloneWalls(prev => prev.map(w =>
        w.id === dragMode.wallId
          ? { ...w, points: dragMode.startPoints.map(([px, pz]) => [px + dx, pz + dz] as [number, number]) }
          : w
      ));
      return;
    }

    if (dragMode.type === "move-split" && splitMode) {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      const room = editableRooms.find(r => r.id === splitMode.roomId);
      if (room) {
        const [xMin, xMax, zMin, zMax] = room.bounds;
        const snapFractions = [0.25, 1/3, 0.5, 2/3, 0.75];
        const FRAC_SNAP = 0.02; // snap within 2%
        const snapT = (raw: number) => {
          let t = Math.max(0.1, Math.min(0.9, raw));
          for (const f of snapFractions) {
            if (Math.abs(t - f) < FRAC_SNAP) { t = f; break; }
          }
          return Math.round(t * 100) / 100;
        };
        if (splitMode.axis === "v") {
          setSplitMode(prev => prev ? { ...prev, t: snapT((worldX - xMin) / (xMax - xMin)) } : null);
        } else {
          setSplitMode(prev => prev ? { ...prev, t: snapT((worldZ - zMin) / (zMax - zMin)) } : null);
        }
      }
      return;
    }

    if (dragMode.type === "move-vertex") {
      const [worldX, worldZ] = getWorldPosStableFromEvent(e);
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      // Snap vertex to geometry (room corners, other wall endpoints, edges)
      const targets = getSnapTargets(editableRooms, standaloneWalls, dragMode.wallId);
      const edges = getSnapEdges(editableRooms, standaloneWalls, dragMode.wallId);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edges);
      const finalX = snap.snapped ? snap.x : gridX;
      const finalZ = snap.snapped ? snap.z : gridZ;
      setActiveSnap(snap.snapped ? snap.snapTarget : null);
      setActiveSnapType(snap.snapType);
      setStandaloneWalls(prev => prev.map(w => {
        if (w.id !== dragMode.wallId) return w;
        const newPoints = w.points.map((p, i) =>
          i === dragMode.pointIndex ? [finalX, finalZ] as [number, number] : p
        );
        return { ...w, points: newPoints };
      }));
      return;
    }
  }, [dragMode, getWorldPos, getWorldPosStableFromEvent, activeTool, findWallAtPoint, editableRooms, wallDrawPoints, standaloneWalls]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragMode?.type === "draw-room") {
      const { startWorld, currentWorld } = dragMode;
      const x1 = Math.min(startWorld[0], currentWorld[0]);
      const x2 = Math.max(startWorld[0], currentWorld[0]);
      const z1 = Math.min(startWorld[1], currentWorld[1]);
      const z2 = Math.max(startWorld[1], currentWorld[1]);
      
      if (x2 - x1 > 0.3 && z2 - z1 > 0.3) {
        pushUndo();
        const id = genId();
        const accent = ACCENT_COLORS[editableRooms.length % ACCENT_COLORS.length];
        const newRoom: EditableRoom = {
          id,
          name: `Room ${editableRooms.length + 1}`,
          bounds: [x1, x2, z1, z2],
          height: 2.6,
          wallThickness: 0.15,
          flooringHeight: 0,
          floorColor: "#D4B896",
          wallColor: "#FAFAFA",
          accent,
          doors: [],
          windows: [],
          locked: false,
          visible: true,
        };
        setEditableRooms(prev => [...prev, newRoom]);
        setSelectedElement({ type: "room", roomId: id });
        setActiveTool("select");
      }
    }

    if (dragMode?.type === "move-room") {
      // Move furniture along with the room
      const room = editableRooms.find(r => r.id === dragMode.roomId);
      if (room) {
        const dx = room.bounds[0] - dragMode.startBounds[0];
        const dz = room.bounds[2] - dragMode.startBounds[2];
        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
          onFurnitureMoveRef.current?.(dragMode.roomId, dx, dz);
        }
      }
    }

    if (dragMode?.type === "move-furniture") {
      // Commit the furniture item's final position
      if (draggedFurniturePos && draggedFurniturePos.itemId === dragMode.itemId) {
        onFurnitureItemMoveRef.current?.(dragMode.roomId, dragMode.itemId, draggedFurniturePos.x, draggedFurniturePos.z);
      }
      setDraggedFurniturePos(null);
    }

    if (dragMode?.type === "resize-room"
      || dragMode?.type === "move-door" || dragMode?.type === "move-window") {
      // Already modified in real-time, just clean up
      // Clear floating door/window ghost
      setFloatingDoorWinPos(null);
      floatingDoorWinRef.current = null;
    }

    if (dragMode?.type === "move-vertex") {
      // Vertex drag committed in real-time, just clear snap indicator
      setActiveSnap(null);
      setActiveSnapType(null);
    }

    setDragMode(null);
    setSnapLines([]);
    setDraggedFurniturePos(null);
  }, [dragMode, editableRooms, draggedFurniturePos, pushUndo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom(z => Math.max(0.15, Math.min(4, z * delta)));
  }, []);

  // ═══ Touch Handlers (mobile support) ═══
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isVisible) return;
    e.preventDefault(); // Prevent synthesized mouse events (avoids double-handling)

    // Two-finger pinch-to-zoom
    if (e.touches.length === 2) {
      // Cancel any pending drag when second finger appears
      touchPendingRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
      // Start panning from midpoint
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setDragMode({ type: "pan", startMouse: [midX, midY], startPan: [pan.x, pan.y] });
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    const [worldX, worldZ] = getWorldPosFromCoords(touch.clientX, touch.clientY);

    // For tools that need immediate action on touch (draw-room, draw-walls, add-door, add-window)
    if (activeTool === "draw-room") {
      const snappedX = snapToGrid(worldX, SNAP_GRID);
      const snappedZ = snapToGrid(worldZ, SNAP_GRID);
      setDragMode({ type: "draw-room", startWorld: [snappedX, snappedZ], currentWorld: [snappedX, snappedZ] });
      return;
    }

    if (activeTool === "draw-walls") {
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      const targets = getSnapTargets(editableRooms, standaloneWalls);
      const edges = getSnapEdges(editableRooms, standaloneWalls);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edges);
      const finalX = snap.snapped ? snap.x : gridX;
      const finalZ = snap.snapped ? snap.z : gridZ;
      setWallDrawPoints(prev => [...prev, [finalX, finalZ]]);
      setActiveSnap(snap.snapped ? snap.snapTarget : null);
      setActiveSnapType(snap.snapType);
      return;
    }

    if (activeTool === "add-door" || activeTool === "add-window") {
      const wall = findWallAtPoint(worldX, worldZ);
      if (wall) {
        pushUndo();
        const room = editableRooms.find(r => r.id === wall.roomId);
        if (!room) return;
        const [xMin, xMax, zMin, zMax] = room.bounds;
        const rW = xMax - xMin;
        const rD = zMax - zMin;
        let t: number;
        if (wall.side === "north" || wall.side === "south") {
          t = Math.max(0.1, Math.min(0.9, (worldX - xMin) / rW));
        } else {
          t = Math.max(0.1, Math.min(0.9, (worldZ - zMin) / rD));
        }
        if (activeTool === "add-door") {
          const newDoor: EditableDoor = { id: genDoorId(), side: wall.side, t, width: 0.8 };
          updateRoom(wall.roomId, { doors: [...room.doors, newDoor] });
          setSelectedElement({ type: "door", roomId: wall.roomId, doorId: newDoor.id });
        } else {
          const newWindow: EditableWindow = { id: genWindowId(), side: wall.side, t, width: 1.2, height: 1.2, sillHeight: 0.9 };
          updateRoom(wall.roomId, { windows: [...room.windows, newWindow] });
          setSelectedElement({ type: "window", roomId: wall.roomId, windowId: newWindow.id });
        }
      }
      return;
    }

    if (activeTool === "delete") {
      const wall = findWallAtPoint(worldX, worldZ);
      if (wall) {
        const room = editableRooms.find(r => r.id === wall.roomId);
        if (room) {
          const doorOnWall = room.doors.find(d => d.side === wall.side);
          if (doorOnWall) { pushUndo(); updateRoom(wall.roomId, { doors: room.doors.filter(d => d.id !== doorOnWall.id) }); return; }
          const winOnWall = room.windows.find(w => w.side === wall.side);
          if (winOnWall) { pushUndo(); updateRoom(wall.roomId, { windows: room.windows.filter(w => w.id !== winOnWall.id) }); return; }
        }
      }
      // Check standalone walls
      const swId = findStandaloneWallAtPoint(worldX, worldZ);
      if (swId) {
        pushUndo();
        setStandaloneWalls(prev => prev.filter(w => w.id !== swId));
        setSelectedElement(null);
        return;
      }
      // Check rooms
      const deleteRoomId = findRoomAtPoint(worldX, worldZ);
      if (deleteRoomId) {
        pushUndo();
        setEditableRooms(prev => prev.filter(r => r.id !== deleteRoomId));
        setSelectedElement(null);
      }
      return;
    }

    // Select tool - check for rooms/doors/windows, otherwise pan
    if (activeTool === "select") {
      // Check if tapping on a door (wider threshold for touch - 0.8m)
      const TOUCH_HIT = 0.8;
      // Find the closest door/window within threshold (use resolveOpening2D for polygon-aware positions)
      let bestDist = TOUCH_HIT;
      let bestDoor: { roomId: string; doorId: string } | null = null;
      let bestWin: { roomId: string; windowId: string } | null = null;
      for (const room of editableRooms) {
        for (const door of room.doors) {
          const [dx, dz] = resolveOpening2D(room, door.side, door.t);
          const dist = Math.hypot(worldX - dx, worldZ - dz);
          if (dist < bestDist) {
            bestDist = dist;
            bestDoor = { roomId: room.id, doorId: door.id };
            bestWin = null;
          }
        }
        for (const win of room.windows) {
          const [wx, wz] = resolveOpening2D(room, win.side, win.t);
          const dist = Math.hypot(worldX - wx, worldZ - wz);
          if (dist < bestDist) {
            bestDist = dist;
            bestWin = { roomId: room.id, windowId: win.id };
            bestDoor = null;
          }
        }
      }
      if (bestDoor) {
        // Defer drag: select immediately but only start move-door after threshold
        setSelectedElement({ type: "door", roomId: bestDoor.roomId, doorId: bestDoor.doorId });
        // Capture initial door state for delta-based touch dragging
        const doorRoom = editableRooms.find(r => r.id === bestDoor.roomId);
        const doorObj = doorRoom?.doors.find(d => d.id === bestDoor.doorId);
        if (doorObj) {
          touchDoorWinStartRef.current = { side: doorObj.side, t: doorObj.t, startWorldX: worldX, startWorldZ: worldZ };
        }
        touchPendingRef.current = {
          startClientX: touch.clientX, startClientY: touch.clientY,
          pendingDragMode: { type: "move-door", roomId: bestDoor.roomId, doorId: bestDoor.doorId },
          pendingSelection: { type: "door", roomId: bestDoor.roomId, doorId: bestDoor.doorId },
          needsUndo: true, activated: false,
        };
        return;
      }
      if (bestWin) {
        setSelectedElement({ type: "window", roomId: bestWin.roomId, windowId: bestWin.windowId });
        // Capture initial window state for delta-based touch dragging
        const winRoom = editableRooms.find(r => r.id === bestWin.roomId);
        const winObj = winRoom?.windows.find(w => w.id === bestWin.windowId);
        if (winObj) {
          touchDoorWinStartRef.current = { side: winObj.side, t: winObj.t, startWorldX: worldX, startWorldZ: worldZ };
        }
        touchPendingRef.current = {
          startClientX: touch.clientX, startClientY: touch.clientY,
          pendingDragMode: { type: "move-window", roomId: bestWin.roomId, windowId: bestWin.windowId },
          pendingSelection: { type: "window", roomId: bestWin.roomId, windowId: bestWin.windowId },
          needsUndo: true, activated: false,
        };
        return;
      }

      // Check furniture
      const roomFurniture = furniture || {};
      let bestFurnDist = 0.5;
      let bestFurn: { roomId: string; itemId: string; startPos: [number, number]; startWorld: [number, number] } | null = null;
      for (const room of editableRooms) {
        const items = roomFurniture[room.id];
        if (!items) continue;
        for (const item of items) {
          const dist = Math.hypot(worldX - item.position[0], worldZ - item.position[2]);
          if (dist < bestFurnDist) {
            bestFurnDist = dist;
            bestFurn = { roomId: room.id, itemId: item.id, startPos: [item.position[0], item.position[2]], startWorld: [worldX, worldZ] };
          }
        }
      }
      if (bestFurn) {
        onSelectItem(bestFurn.itemId);
        touchPendingRef.current = {
          startClientX: touch.clientX, startClientY: touch.clientY,
          pendingDragMode: { type: "move-furniture", roomId: bestFurn.roomId, itemId: bestFurn.itemId, startWorld: bestFurn.startWorld, startPos: bestFurn.startPos } as any,
          pendingSelection: null,
          needsUndo: true, activated: false,
        };
        return;
      }

      // Check if tapping on a room → select immediately, defer move
      const roomId = findRoomAtPoint(worldX, worldZ);
      if (roomId) {
        const room = editableRooms.find(r => r.id === roomId);
        if (room && !room.locked) {
          setSelectedElement({ type: "room", roomId });
          setMergeSelection([]);
          onSelectRoom(roomId);
          touchPendingRef.current = {
            startClientX: touch.clientX, startClientY: touch.clientY,
            pendingDragMode: {
              type: "move-room", roomId,
              startMouse: [worldX, worldZ],
              startBounds: [...room.bounds],
            },
            pendingSelection: { type: "room", roomId },
            needsUndo: true, activated: false,
          };
          return;
        }
      }
      // Empty area → deselect and pan
      setSelectedElement(null);
      setMergeSelection([]);
      setDragMode({ type: "pan", startMouse: [touch.clientX, touch.clientY], startPan: [pan.x, pan.y] });
    }
  }, [isVisible, activeTool, pan, getWorldPosFromCoords, findWallAtPoint, findRoomAtPoint, findStandaloneWallAtPoint, editableRooms, standaloneWalls, pushUndo, updateRoom, wallDrawPoints, onSelectRoom, furniture, onSelectItem]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isVisible) return;
    e.preventDefault();

    // ── Check pending drag threshold ──
    const pending = touchPendingRef.current;
    if (pending && !pending.activated && e.touches.length === 1) {
      const dx = e.touches[0].clientX - pending.startClientX;
      const dy = e.touches[0].clientY - pending.startClientY;
      const dist = Math.hypot(dx, dy);
      if (dist < TOUCH_DRAG_THRESHOLD) {
        return; // Still below threshold, don't move anything yet
      }
      // Threshold exceeded → activate the pending drag
      pending.activated = true;
      if (pending.needsUndo) pushUndo();
      setDragMode(pending.pendingDragMode);
      // Fall through to process this move event with the now-active drag
    }

    // Read from ref for immediate access (avoids React batching delay)
    const dm = dragModeRef.current;

    // Pinch-to-zoom (also cancel any pending)
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      if (pending) touchPendingRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scale = newDist / pinchDistRef.current;
      pinchDistRef.current = newDist;
      setZoom(z => Math.max(0.15, Math.min(4, z * scale)));
      // Also pan from midpoint
      if (dm?.type === "pan") {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const ddx = midX - dm.startMouse[0];
        const ddy = midY - dm.startMouse[1];
        setPan({ x: dm.startPan[0] + ddx, y: dm.startPan[1] + ddy });
      }
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    if (dm?.type === "pan") {
      const ddx = touch.clientX - dm.startMouse[0];
      const ddy = touch.clientY - dm.startMouse[1];
      setPan({ x: dm.startPan[0] + ddx, y: dm.startPan[1] + ddy });
      return;
    }

    if (dm?.type === "draw-room") {
      const [worldX, worldZ] = getWorldPosFromCoords(touch.clientX, touch.clientY);
      setDragMode({
        ...dm,
        currentWorld: [snapToGrid(worldX, SNAP_GRID), snapToGrid(worldZ, SNAP_GRID)],
      });
      return;
    }

    if (dm?.type === "move-room") {
      const [worldX, worldZ] = getWorldPosStable(touch.clientX, touch.clientY);
      let dx = snapToGrid(worldX - dm.startMouse[0], SNAP_GRID);
      let dz = snapToGrid(worldZ - dm.startMouse[1], SNAP_GRID);
      const [xMin, xMax, zMin, zMax] = dm.startBounds;
      const newBounds: [number, number, number, number] = [xMin + dx, xMax + dx, zMin + dz, zMax + dz];
      setSnapLines([]); // No alignment snap lines on mobile
      setEditableRooms(prev => prev.map(r => {
        if (r.id !== dm.roomId) return r;
        const moveDx = newBounds[0] - r.bounds[0];
        const moveDz = newBounds[2] - r.bounds[2];
        return {
          ...r,
          bounds: newBounds,
          ...(r.polygon ? { polygon: r.polygon.map(([px, pz]) =>
            [px + moveDx, pz + moveDz] as [number, number]
          ) } : {}),
        };
      }));
      return;
    }

    if (dm?.type === "move-door" || dm?.type === "move-window") {
      const [worldX, worldZ] = getWorldPosStable(touch.clientX, touch.clientY);
      const srcRoom = editableRooms.find(r => r.id === dm.roomId);
      if (!srcRoom) return;

      const startInfo = touchDoorWinStartRef.current;
      const itemId = dm.type === "move-door" ? (dm as any).doorId : (dm as any).windowId;

      // Delta-based approach: compute finger delta from start position, apply as t-delta
      // This prevents the door from jumping to wrong walls/rooms on first move
      if (startInfo) {
        const [xMin, xMax, zMin, zMax] = srcRoom.bounds;
        const rW = xMax - xMin || 1;
        const rD = zMax - zMin || 1;
        const deltaX = worldX - startInfo.startWorldX;
        const deltaZ = worldZ - startInfo.startWorldZ;

        // Calculate how far the finger has moved perpendicular to the wall
        // If it's far enough (> 0.8m), switch to freeform wall detection
        let perpDist = 0;
        if (startInfo.side === "north" || startInfo.side === "south") {
          perpDist = Math.abs(deltaZ);
        } else {
          perpDist = Math.abs(deltaX);
        }

        if (perpDist < 0.8) {
          // Stay on current wall: convert finger delta to t-delta along the wall
          let deltaT: number;
          if (startInfo.side === "north" || startInfo.side === "south") {
            deltaT = deltaX / rW;
          } else {
            deltaT = deltaZ / rD;
          }
          const newT = Math.max(0.05, Math.min(0.95, snapToGrid(startInfo.t + deltaT, 0.01)));

          floatingDoorWinRef.current = { worldX, worldZ, lastValidRoomId: dm.roomId, lastValidSide: startInfo.side, lastValidT: newT };
          setFloatingDoorWinPos(null);

          if (dm.type === "move-door") {
            setEditableRooms(prev => prev.map(r =>
              r.id === dm.roomId
                ? { ...r, doors: r.doors.map(d => d.id === (dm as any).doorId ? { ...d, side: startInfo.side, t: newT } : d) }
                : r
            ));
          } else {
            setEditableRooms(prev => prev.map(r =>
              r.id === dm.roomId
                ? { ...r, windows: r.windows.map(w => w.id === (dm as any).windowId ? { ...w, side: startInfo.side, t: newT } : w) }
                : r
            ));
          }
          return;
        }

        // Perpendicular distance exceeded — fall through to freeform wall detection
      }

      // Freeform: find nearest wall (strongly prefer current room)
      const wall = findWallAtPoint(worldX, worldZ, true, dm.roomId);

      if (wall) {
        const room = editableRooms.find(r => r.id === wall.roomId);
        if (!room) return;
        const [xMin, xMax, zMin, zMax] = room.bounds;
        const rW = xMax - xMin || 1;
        const rD = zMax - zMin || 1;
        let t: number;
        if (wall.side === "north" || wall.side === "south") {
          t = Math.max(0.05, Math.min(0.95, (worldX - xMin) / rW));
        } else {
          t = Math.max(0.05, Math.min(0.95, (worldZ - zMin) / rD));
        }
        t = snapToGrid(t, 0.01);

        // Update start info to new wall so delta tracking continues from here
        touchDoorWinStartRef.current = { side: wall.side, t, startWorldX: worldX, startWorldZ: worldZ };
        floatingDoorWinRef.current = { worldX, worldZ, lastValidRoomId: wall.roomId, lastValidSide: wall.side, lastValidT: t };
        setFloatingDoorWinPos(null);

        if (dm.type === "move-door") {
          if (wall.roomId === dm.roomId) {
            setEditableRooms(prev => prev.map(r =>
              r.id === dm.roomId
                ? { ...r, doors: r.doors.map(d => d.id === (dm as any).doorId ? { ...d, side: wall.side, t } : d) }
                : r
            ));
          } else {
            const door = srcRoom.doors.find(d => d.id === (dm as any).doorId);
            if (!door) return;
            const movedDoor = { ...door, side: wall.side, t };
            setEditableRooms(prev => prev.map(r => {
              if (r.id === dm.roomId) return { ...r, doors: r.doors.filter(d => d.id !== (dm as any).doorId) };
              if (r.id === wall.roomId) return { ...r, doors: [...r.doors, movedDoor] };
              return r;
            }));
            setDragMode({ type: "move-door", roomId: wall.roomId, doorId: (dm as any).doorId });
            setSelectedElement({ type: "door", roomId: wall.roomId, doorId: (dm as any).doorId });
          }
        } else {
          if (wall.roomId === dm.roomId) {
            setEditableRooms(prev => prev.map(r =>
              r.id === dm.roomId
                ? { ...r, windows: r.windows.map(w => w.id === (dm as any).windowId ? { ...w, side: wall.side, t } : w) }
                : r
            ));
          } else {
            const win = srcRoom.windows.find(w => w.id === (dm as any).windowId);
            if (!win) return;
            const movedWin = { ...win, side: wall.side, t };
            setEditableRooms(prev => prev.map(r => {
              if (r.id === dm.roomId) return { ...r, windows: r.windows.filter(w => w.id !== (dm as any).windowId) };
              if (r.id === wall.roomId) return { ...r, windows: [...r.windows, movedWin] };
              return r;
            }));
            setDragMode({ type: "move-window", roomId: wall.roomId, windowId: (dm as any).windowId });
            setSelectedElement({ type: "window", roomId: wall.roomId, windowId: (dm as any).windowId });
          }
        }
      } else {
        // No wall nearby — show floating ghost at finger position
        setFloatingDoorWinPos({
          worldX, worldZ,
          type: dm.type === "move-door" ? "door" : "window",
          id: itemId,
        });
      }
      return;
    }

    if (dm?.type === "resize-room") {
      const [worldX, worldZ] = getWorldPosStable(touch.clientX, touch.clientY);
      let sx = snapToGrid(worldX, SNAP_GRID);
      let sz = snapToGrid(worldZ, SNAP_GRID);
      const [oXMin, oXMax, oZMin, oZMax] = dm.startBounds;
      const handle = dm.handle;
      const MIN_SIZE = 0.5;
      // Mobile: no room-edge alignment snapping for freeform resizing
      setEditableRooms(prev => {
        let newBounds: [number, number, number, number] = [oXMin, oXMax, oZMin, oZMax];
        if (handle.includes("n")) newBounds[2] = Math.min(sz, oZMax - MIN_SIZE);
        if (handle.includes("s")) newBounds[3] = Math.max(sz, oZMin + MIN_SIZE);
        if (handle.includes("w")) newBounds[0] = Math.min(sx, oXMax - MIN_SIZE);
        if (handle.includes("e")) newBounds[1] = Math.max(sx, oXMin + MIN_SIZE);
        setSnapLines([]);
        return prev.map(r => r.id === dm.roomId ? { ...r, bounds: newBounds } : r);
      });
      return;
    }

    if (dm?.type === "move-furniture") {
      const [worldX, worldZ] = getWorldPosStable(touch.clientX, touch.clientY);
      const dx = worldX - dm.startWorld[0];
      const dz = worldZ - dm.startWorld[1];
      let newX = snapToGrid(dm.startPos[0] + dx, SNAP_GRID);
      let newZ = snapToGrid(dm.startPos[1] + dz, SNAP_GRID);
      // Free placement: no room clamping
      setDraggedFurniturePos({ itemId: dm.itemId, x: newX, z: newZ });
      return;
    }

    if (dm?.type === "move-standalone-wall") {
      const [worldX, worldZ] = getWorldPosStable(touch.clientX, touch.clientY);
      const dx = snapToGrid(worldX - dm.startMouse[0], SNAP_GRID);
      const dz = snapToGrid(worldZ - dm.startMouse[1], SNAP_GRID);
      setStandaloneWalls(prev => prev.map(w =>
        w.id === dm.wallId
          ? { ...w, points: dm.startPoints.map(([px, pz]) => [px + dx, pz + dz] as [number, number]) }
          : w
      ));
      return;
    }

    if (dm?.type === "move-split" && splitMode) {
      const [worldX, worldZ] = getWorldPosFromCoords(touch.clientX, touch.clientY);
      const room = editableRooms.find(r => r.id === splitMode.roomId);
      if (room) {
        const [xMin, xMax, zMin, zMax] = room.bounds;
        const snapFractions = [0.25, 1/3, 0.5, 2/3, 0.75];
        const FRAC_SNAP = 0.02;
        const snapT = (raw: number) => {
          let t = Math.max(0.1, Math.min(0.9, raw));
          for (const f of snapFractions) {
            if (Math.abs(t - f) < FRAC_SNAP) { t = f; break; }
          }
          return Math.round(t * 100) / 100;
        };
        if (splitMode.axis === "v") {
          setSplitMode(prev => prev ? { ...prev, t: snapT((worldX - xMin) / (xMax - xMin)) } : null);
        } else {
          setSplitMode(prev => prev ? { ...prev, t: snapT((worldZ - zMin) / (zMax - zMin)) } : null);
        }
      }
      return;
    }

    if (dm?.type === "move-vertex") {
      const [worldX, worldZ] = getWorldPosFromCoords(touch.clientX, touch.clientY);
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      const targets = getSnapTargets(editableRooms, standaloneWalls, dm.wallId);
      const edges = getSnapEdges(editableRooms, standaloneWalls, dm.wallId);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edges);
      const finalX = snap.snapped ? snap.x : gridX;
      const finalZ = snap.snapped ? snap.z : gridZ;
      setActiveSnap(snap.snapped ? snap.snapTarget : null);
      setActiveSnapType(snap.snapType);
      setStandaloneWalls(prev => prev.map(w => {
        if (w.id !== dm.wallId) return w;
        const newPoints = w.points.map((p, i) =>
          i === dm.pointIndex ? [finalX, finalZ] as [number, number] : p
        );
        return { ...w, points: newPoints };
      }));
      return;
    }

    // Update wall draw cursor for preview
    if (activeTool === "draw-walls" && wallDrawPoints.length > 0) {
      const [worldX, worldZ] = getWorldPosFromCoords(touch.clientX, touch.clientY);
      const gridX = snapToGrid(worldX, SNAP_GRID);
      const gridZ = snapToGrid(worldZ, SNAP_GRID);
      const targets = getSnapTargets(editableRooms, standaloneWalls);
      const edgesSnap = getSnapEdges(editableRooms, standaloneWalls);
      const snap = snapToGeometry(gridX, gridZ, targets, GEOM_SNAP_THRESHOLD, edgesSnap);
      setWallDrawCursor(snap.snapped ? [snap.x, snap.z] : [gridX, gridZ]);
      setActiveSnap(snap.snapped ? snap.snapTarget : null);
      setActiveSnapType(snap.snapType);
    }
  }, [isVisible, getWorldPosFromCoords, getWorldPosStable, activeTool, findWallAtPoint, editableRooms, updateRoom, wallDrawPoints, standaloneWalls, splitMode, draggedFurniturePos, pushUndo, pan, zoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    pinchDistRef.current = null;

    // ── Handle pending (tap that never exceeded drag threshold) ──
    const pending = touchPendingRef.current;
    if (pending && !pending.activated) {
      // This was a simple tap — selection was already set in touchStart, just clean up
      touchPendingRef.current = null;
      setDragMode(null);
      lastTouchRef.current = null;
      return;
    }
    touchPendingRef.current = null;

    const dm = dragModeRef.current;

    // Handle draw-room completion
    if (dm?.type === "draw-room") {
      const { startWorld, currentWorld } = dm;
      const x1 = Math.min(startWorld[0], currentWorld[0]);
      const x2 = Math.max(startWorld[0], currentWorld[0]);
      const z1 = Math.min(startWorld[1], currentWorld[1]);
      const z2 = Math.max(startWorld[1], currentWorld[1]);
      if (x2 - x1 > 0.3 && z2 - z1 > 0.3) {
        pushUndo();
        const id = genId();
        const accent = ACCENT_COLORS[editableRooms.length % ACCENT_COLORS.length];
        const newRoom: EditableRoom = {
          id, name: `Room ${editableRooms.length + 1}`,
          bounds: [x1, x2, z1, z2], height: 2.6, wallThickness: 0.15,
          flooringHeight: 0, floorColor: "#D4B896", wallColor: "#FAFAFA",
          accent, doors: [], windows: [], locked: false, visible: true,
        };
        setEditableRooms(prev => [...prev, newRoom]);
        setSelectedElement({ type: "room", roomId: id });
        setActiveTool("select");
      }
    }

    // Move room's furniture along
    if (dm?.type === "move-room") {
      const room = editableRooms.find(r => r.id === dm.roomId);
      if (room) {
        const dx = room.bounds[0] - dm.startBounds[0];
        const dz = room.bounds[2] - dm.startBounds[2];
        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
          onFurnitureMoveRef.current?.(dm.roomId, dx, dz);
        }
      }
    }

    // Handle furniture drop
    if (dm?.type === "move-furniture") {
      if (draggedFurniturePos && draggedFurniturePos.itemId === dm.itemId) {
        onFurnitureItemMoveRef.current?.(dm.roomId, dm.itemId, draggedFurniturePos.x, draggedFurniturePos.z);
      }
      setDraggedFurniturePos(null);
    }

    if (dm?.type === "move-vertex") {
      setActiveSnap(null);
      setActiveSnapType(null);
    }

    // Clear floating door/window ghost on touch end
    if (dm?.type === "move-door" || dm?.type === "move-window") {
      setFloatingDoorWinPos(null);
      floatingDoorWinRef.current = null;
      touchDoorWinStartRef.current = null;
    }

    setDragMode(null);
    setSnapLines([]);
    setDraggedFurniturePos(null);
    lastTouchRef.current = null;
  }, [editableRooms, draggedFurniturePos, pushUndo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isVisible) return; // Don't handle keys when hidden (3D mode)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "v" || e.key === "V") { setActiveTool("select"); setWallDrawPoints([]); setWallDrawCursor(null); setSplitMode(null); }
      else if (e.key === "r" || e.key === "R") { setActiveTool("draw-room"); setMergeSelection([]); setWallDrawPoints([]); setWallDrawCursor(null); setSplitMode(null); }
      else if (e.key === "w" || e.key === "W") { setActiveTool("draw-walls"); setMergeSelection([]); setSplitMode(null); }
      else if (e.key === "d" || e.key === "D") { setActiveTool("add-door"); setMergeSelection([]); setWallDrawPoints([]); setWallDrawCursor(null); setSplitMode(null); }
      else if (e.key === "n" || e.key === "N") { setActiveTool("add-window"); setMergeSelection([]); setWallDrawPoints([]); setWallDrawCursor(null); setSplitMode(null); }
      else if (e.key === "Delete" || e.key === "Backspace") deleteSelectedElement();
      else if (e.key === "Escape") {
        if (splitMode) {
          setSplitMode(null);
        } else if (wallDrawPoints.length > 0) {
          setWallDrawPoints([]);
          setWallDrawCursor(null);
          setActiveSnap(null);
          setActiveSnapType(null);
        } else {
          setSelectedElement(null);
          setMergeSelection([]);
          setActiveTool("select");
          setDragMode(null);
        }
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        duplicateRoom();
      }
      // Ctrl+M: trigger merge when 2 rooms selected
      else if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        if (mergeSelection.length === 2) {
          mergeRooms();
        }
      }
      // Enter: confirm split
      else if (e.key === "Enter" && splitMode) {
        e.preventDefault();
        executeSplit();
      }
      else if (e.key === "b" || e.key === "B") {
        setShowBuildPanel(prev => !prev);
      }
      else if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
        onOpenFurniturePanel?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isVisible, deleteSelectedElement, handleUndo, handleRedo, duplicateRoom, mergeSelection, mergeRooms, splitMode, executeSplit, wallDrawPoints, onOpenFurniturePanel]);

  // Handle room click (for select tool) — Shift+click adds to merge selection
  const handleRoomClick = useCallback((e: React.MouseEvent, roomId: string) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    
    const room = editableRooms.find(r => r.id === roomId);
    if (room?.locked) return;

    if (e.shiftKey) {
      // Shift+click: toggle room in merge selection (max 2)
      setMergeSelection(prev => {
        if (prev.includes(roomId)) {
          // Deselect
          return prev.filter(id => id !== roomId);
        }
        if (prev.length >= 2) {
          // Replace the oldest one
          return [prev[1], roomId];
        }
        return [...prev, roomId];
      });
      return;
    }

    // Normal click: clear merge selection
    setMergeSelection([]);
    setSelectedElement({ type: "room", roomId });
    onSelectRoom(roomId);
  }, [activeTool, editableRooms, onSelectRoom]);

  // Start room move
  const handleRoomMoveStart = useCallback((e: React.MouseEvent, roomId: string) => {
    if (activeTool !== "select") return;
    const room = editableRooms.find(r => r.id === roomId);
    if (!room || room.locked) return;
    
    e.stopPropagation();
    pushUndo();
    const [worldX, worldZ] = getWorldPos(e);
    setDragMode({
      type: "move-room", roomId,
      startMouse: [worldX, worldZ],
      startBounds: [...room.bounds],
    });
    setSelectedElement({ type: "room", roomId });
  }, [activeTool, editableRooms, getWorldPos, pushUndo]);

  const handleRoomMoveTouchStart = useCallback((e: React.TouchEvent, roomId: string) => {
    if (activeTool !== "select" || e.touches.length !== 1) return;
    const room = editableRooms.find(r => r.id === roomId);
    if (!room || room.locked) return;
    const [worldX, worldZ] = getWorldPosFromCoords(e.touches[0].clientX, e.touches[0].clientY);
    // Check if touch is actually closer to a door/window — if so, let container handle it
    const DOOR_PRIORITY_DIST = 0.6;
    for (const rm of editableRooms) {
      for (const d of rm.doors) {
        const [dx, dz] = resolveOpening2D(rm, d.side, d.t);
        if (Math.hypot(worldX - dx, worldZ - dz) < DOOR_PRIORITY_DIST) return; // let propagate
      }
      for (const w of rm.windows) {
        const [wx, wz] = resolveOpening2D(rm, w.side, w.t);
        if (Math.hypot(worldX - wx, worldZ - wz) < DOOR_PRIORITY_DIST) return; // let propagate
      }
    }
    e.stopPropagation();
    e.preventDefault();
    // Select immediately, but defer the move-room drag until threshold exceeded
    setSelectedElement({ type: "room", roomId });
    onSelectRoom(roomId);
    touchPendingRef.current = {
      startClientX: e.touches[0].clientX, startClientY: e.touches[0].clientY,
      pendingDragMode: {
        type: "move-room", roomId,
        startMouse: [worldX, worldZ],
        startBounds: [...room.bounds],
      },
      pendingSelection: { type: "room", roomId },
      needsUndo: true, activated: false,
    };
  }, [activeTool, editableRooms, getWorldPosFromCoords, onSelectRoom]);

  // Start resize
  const handleResizeStart = useCallback((e: React.MouseEvent, roomId: string, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const room = editableRooms.find(r => r.id === roomId);
    if (!room || room.locked) return;
    
    pushUndo();
    const [worldX, worldZ] = getWorldPos(e);
    setDragMode({
      type: "resize-room", roomId, handle,
      startMouse: [worldX, worldZ],
      startBounds: [...room.bounds],
    });
  }, [editableRooms, getWorldPos, pushUndo]);

  const handleResizeTouchStart = useCallback((e: React.TouchEvent, roomId: string, handle: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    const room = editableRooms.find(r => r.id === roomId);
    if (!room || room.locked) return;
    pushUndo();
    const [worldX, worldZ] = getWorldPosFromCoords(e.touches[0].clientX, e.touches[0].clientY);
    setDragMode({
      type: "resize-room", roomId, handle,
      startMouse: [worldX, worldZ],
      startBounds: [...room.bounds],
    });
  }, [editableRooms, getWorldPosFromCoords, pushUndo]);

  // Handle door click
  const handleDoorClick = useCallback((e: React.MouseEvent, roomId: string, doorId: string) => {
    e.stopPropagation();
    setSelectedElement({ type: "door", roomId, doorId });
  }, []);

  // Handle door drag start
  const handleDoorDragStart = useCallback((e: React.MouseEvent, roomId: string, doorId: string) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    e.preventDefault();
    pushUndo();
    setDragMode({ type: "move-door", roomId, doorId });
    setSelectedElement({ type: "door", roomId, doorId });
  }, [activeTool, pushUndo]);

  // Handle door touch start (mobile — uses pending threshold system)
  const handleDoorTouchStart = useCallback((e: React.TouchEvent, roomId: string, doorId: string) => {
    if (activeTool !== "select" || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedElement({ type: "door", roomId, doorId });
    touchPendingRef.current = {
      startClientX: e.touches[0].clientX, startClientY: e.touches[0].clientY,
      pendingDragMode: { type: "move-door", roomId, doorId },
      pendingSelection: { type: "door", roomId, doorId },
      needsUndo: true, activated: false,
    };
  }, [activeTool]);

  // Handle window click
  const handleWindowClick = useCallback((e: React.MouseEvent, roomId: string, windowId: string) => {
    e.stopPropagation();
    setSelectedElement({ type: "window", roomId, windowId });
  }, []);

  // Handle window drag start
  const handleWindowDragStart = useCallback((e: React.MouseEvent, roomId: string, windowId: string) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    e.preventDefault();
    pushUndo();
    setDragMode({ type: "move-window", roomId, windowId });
    setSelectedElement({ type: "window", roomId, windowId });
  }, [activeTool, pushUndo]);

  // Handle window touch start (mobile — uses pending threshold system)
  const handleWindowTouchStart = useCallback((e: React.TouchEvent, roomId: string, windowId: string) => {
    if (activeTool !== "select" || e.touches.length !== 1) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedElement({ type: "window", roomId, windowId });
    touchPendingRef.current = {
      startClientX: e.touches[0].clientX, startClientY: e.touches[0].clientY,
      pendingDragMode: { type: "move-window", roomId, windowId },
      pendingSelection: { type: "window", roomId, windowId },
      needsUndo: true, activated: false,
    };
  }, [activeTool]);

  // Canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (activeTool === "select" && !dragMode) {
      setSelectedElement(null);
      setMergeSelection([]);
    }
  }, [activeTool, dragMode]);

  const selectedRoom = selectedElement && "roomId" in selectedElement ? editableRooms.find(r => r.id === selectedElement.roomId) || null : null;
  const totalArea = editableRooms.reduce((sum, r) => sum + (r.bounds[1] - r.bounds[0]) * (r.bounds[3] - r.bounds[2]), 0);

  // Cursor based on tool
  const getCursor = () => {
    if (dragMode?.type === "pan") return "grabbing";
    if (dragMode?.type === "move-room") return "move";
    if (dragMode?.type === "move-door" || dragMode?.type === "move-window") return "grabbing";
    if (dragMode?.type === "resize-room") return "nwse-resize";
    if (dragMode?.type === "draw-room") return "crosshair";
    if (activeTool === "draw-room" || activeTool === "draw-walls") return "crosshair";
    if (activeTool === "add-door" || activeTool === "add-window") return "crosshair";
    if (activeTool === "delete") return "not-allowed";
    return "default";
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-[5] bg-[#F8FAF8] overflow-hidden transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ cursor: isVisible ? getCursor() : "default", touchAction: "none" }}
      onMouseDown={isVisible ? handleMouseDown : undefined}
      onMouseMove={isVisible ? handleMouseMove : undefined}
      onMouseUp={isVisible ? handleMouseUp : undefined}
      onMouseLeave={isVisible ? () => setDragMode(null) : undefined}
      onTouchStart={isVisible ? handleTouchStart : undefined}
      onTouchMove={isVisible ? handleTouchMove : undefined}
      onTouchEnd={isVisible ? handleTouchEnd : undefined}
      onWheel={isVisible ? handleWheel : undefined}
      onClick={isVisible ? handleCanvasClick : undefined}
      onDoubleClick={isVisible ? (e) => {
        if (activeTool === "draw-walls" && wallDrawPoints.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          // The last click from the double-click already added a duplicate point, remove it
          const pts = wallDrawPoints.slice(0, -1);
          finishWallDraw(pts.length >= 2 ? pts : wallDrawPoints);
        }
      } : undefined}
    >
      {/* Zoomable/pannable container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="select-none"
        >
          {/* Defs for patterns */}
          <defs>
            {editableRooms.map(room => (
              <WoodPattern key={`pat-${room.id}`} id={`wood-${room.id}`} color={roomFloorColors[room.id] || room.floorColor} />
            ))}
            {/* Grid pattern */}
            <pattern id="grid-minor" patternUnits="userSpaceOnUse" width={SCALE * 0.5} height={SCALE * 0.5}>
              <path d={`M ${SCALE * 0.5} 0 L 0 0 0 ${SCALE * 0.5}`} fill="none" stroke="#C8E6C9" strokeWidth={0.5} opacity={0.5} />
            </pattern>
            <pattern id="grid-major" patternUnits="userSpaceOnUse" width={SCALE} height={SCALE}>
              <rect width={SCALE} height={SCALE} fill="url(#grid-minor)" />
              <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="#A5D6A7" strokeWidth={0.8} opacity={0.4} />
            </pattern>
          </defs>

          {/* Background grid */}
          {showGrid && (
            <rect x={0} y={0} width={svgW} height={svgH} fill="url(#grid-major)" />
          )}

          {/* ═══ Room Floors ═══ */}
          {editableRooms.map((room) => {
            if (room.visible === false) return null;
            const [x1, y1] = toSVG(room.bounds[0], room.bounds[2]);
            const w = (room.bounds[1] - room.bounds[0]) * SCALE;
            const h = (room.bounds[3] - room.bounds[2]) * SCALE;
            const isSelected = selectedElement?.type === "room" && selectedElement.roomId === room.id;
            const isHovered = hoveredRoom === room.id;
            const hasPoly = !!room.polygon;
            const roomArea = hasPoly
              ? polygonArea(room.polygon!)
              : (room.bounds[1] - room.bounds[0]) * (room.bounds[3] - room.bounds[2]);
            const labelCenter = hasPoly
              ? (() => { const c = polygonCentroid(room.polygon!); const [sx, sy] = toSVG(c[0], c[1]); return { x: sx, y: sy }; })()
              : { x: x1 + w / 2, y: y1 + h / 2 };

            return (
              <g key={room.id}>
                {/* Floor fill with wood pattern */}
                {hasPoly ? (
                  <polygon
                    points={room.polygon!.map(([px, pz]) => { const [sx, sy] = toSVG(px, pz); return `${sx},${sy}`; }).join(" ")}
                    fill={`url(#wood-${room.id})`}
                    className="cursor-pointer"
                    onMouseDown={(e) => handleRoomMoveStart(e, room.id)}
                    onTouchStart={(e) => handleRoomMoveTouchStart(e, room.id)}
                    onClick={(e) => handleRoomClick(e, room.id)}
                    onMouseEnter={() => setHoveredRoom(room.id)}
                    onMouseLeave={() => setHoveredRoom(null)}
                  />
                ) : (
                  <rect
                    x={x1} y={y1} width={w} height={h}
                    fill={`url(#wood-${room.id})`}
                    className="cursor-pointer"
                    onMouseDown={(e) => handleRoomMoveStart(e, room.id)}
                    onTouchStart={(e) => handleRoomMoveTouchStart(e, room.id)}
                    onClick={(e) => handleRoomClick(e, room.id)}
                    onMouseEnter={() => setHoveredRoom(room.id)}
                    onMouseLeave={() => setHoveredRoom(null)}
                  />
                )}

                {/* Room label */}
                <text
                  x={labelCenter.x} y={labelCenter.y - 8}
                  textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  fill="#09090B" fontSize={12} fontFamily="Inter,sans-serif" fontWeight="600"
                  letterSpacing="-0.3" opacity={0.9}
                >
                  {room.name}
                </text>
                {/* Room dimensions */}
                <text
                  x={labelCenter.x} y={labelCenter.y + 6}
                  textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  fill="#71717A" fontSize={10} fontFamily="Inter,sans-serif" fontWeight="400"
                >
                  {hasPoly ? `${room.polygon!.length} vertices` : (
                    `${formatDim(room.bounds[1] - room.bounds[0], unitSystem)} x ${formatDim(room.bounds[3] - room.bounds[2], unitSystem)}${unitSystem === "metric" ? " cm" : ""}`
                  )}
                </text>
                {/* Area */}
                <text
                  x={labelCenter.x} y={labelCenter.y + 18}
                  textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  fill="#ABABAB" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="500"
                >
                  {formatArea(roomArea, unitSystem)}
                </text>
                {/* Polygon shape badge */}
                {hasPoly && (
                  <g transform={`translate(${labelCenter.x - 24}, ${labelCenter.y + 28})`}>
                    <rect x={0} y={0} width={48} height={16} rx={8}
                      fill="#FFF6DC" stroke="#FFEAB1" strokeWidth={0.8} />
                    <text x={24} y={8.5} textAnchor="middle" dominantBaseline="middle"
                      fill="#09090B" fontSize={8} fontFamily="Inter,sans-serif" fontWeight="600"
                      className="pointer-events-none select-none"
                    >L-Shape</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ═══ Merge Selection Highlights ═══ */}
          {mergeSelection.length > 0 && mergeSelection.map((roomId, idx) => {
            const room = editableRooms.find(r => r.id === roomId);
            if (!room || room.visible === false) return null;
            const [x1, y1] = toSVG(room.bounds[0], room.bounds[2]);
            const w = (room.bounds[1] - room.bounds[0]) * SCALE;
            const h = (room.bounds[3] - room.bounds[2]) * SCALE;
            return (
              <g key={`merge-hl-${roomId}`}>
                {/* Tinted overlay */}
                <rect
                  x={x1} y={y1} width={w} height={h}
                  fill={idx === 0 ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)"}
                  className="pointer-events-none"
                />
                {/* Animated dashed border */}
                <rect
                  x={x1} y={y1} width={w} height={h}
                  fill="none"
                  stroke={idx === 0 ? "#3B82F6" : "#A855F7"}
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  className="pointer-events-none"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1.5s" repeatCount="indefinite" />
                </rect>
                {/* Badge showing selection order */}
                <g transform={`translate(${x1 + 8}, ${y1 + 8})`}>
                  <rect x={0} y={0} width={20} height={20} rx={10}
                    fill={idx === 0 ? "#3B82F6" : "#A855F7"} />
                  <text x={10} y={10.5} textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={10} fontFamily="Inter,sans-serif" fontWeight="700"
                    className="pointer-events-none select-none"
                  >{idx + 1}</text>
                </g>
              </g>
            );
          })}

          {/* ═══ Merge Preview (bounding box + overlap area) ═══ */}
          {mergeSelection.length === 2 && (() => {
            const roomA = editableRooms.find(r => r.id === mergeSelection[0]);
            const roomB = editableRooms.find(r => r.id === mergeSelection[1]);
            if (!roomA || !roomB) return null;
            // Overlap region
            const oXMin = Math.max(roomA.bounds[0], roomB.bounds[0]);
            const oXMax = Math.min(roomA.bounds[1], roomB.bounds[1]);
            const oZMin = Math.max(roomA.bounds[2], roomB.bounds[2]);
            const oZMax = Math.min(roomA.bounds[3], roomB.bounds[3]);
            const hasOverlap = oXMin < oXMax && oZMin < oZMax;
            // Adjacent check (touching edges with tolerance)
            const adj = Math.abs(roomA.bounds[1] - roomB.bounds[0]) < 0.05
              || Math.abs(roomB.bounds[1] - roomA.bounds[0]) < 0.05
              || Math.abs(roomA.bounds[3] - roomB.bounds[2]) < 0.05
              || Math.abs(roomB.bounds[3] - roomA.bounds[2]) < 0.05;
            // Bounding box preview
            const bbXMin = Math.min(roomA.bounds[0], roomB.bounds[0]);
            const bbXMax = Math.max(roomA.bounds[1], roomB.bounds[1]);
            const bbZMin = Math.min(roomA.bounds[2], roomB.bounds[2]);
            const bbZMax = Math.max(roomA.bounds[3], roomB.bounds[3]);
            const [bx, by] = toSVG(bbXMin, bbZMin);
            const bw = (bbXMax - bbXMin) * SCALE;
            const bh = (bbZMax - bbZMin) * SCALE;
            return (
              <g className="pointer-events-none">
                {/* Merged bounding box outline */}
                <rect x={bx} y={by} width={bw} height={bh}
                  fill="none" stroke="#10B981" strokeWidth={2}
                  strokeDasharray="6 3" opacity={0.7}
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="18" dur="2s" repeatCount="indefinite" />
                </rect>
                {/* Overlap zone highlight */}
                {hasOverlap && (() => {
                  const [ox, oy] = toSVG(oXMin, oZMin);
                  const ow = (oXMax - oXMin) * SCALE;
                  const oh = (oZMax - oZMin) * SCALE;
                  return (
                    <g>
                      <rect x={ox} y={oy} width={ow} height={oh}
                        fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth={1.5}
                        strokeDasharray="4 2" />
                      {/* "Overlap" label */}
                      <text x={ox + ow / 2} y={oy + oh / 2}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="#EF4444" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                        opacity={0.8}
                      >Overlap</text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}

          {/* ═══ Walls ═══ */}
          {editableRooms.map((room) => {
            if (room.visible === false) return null;
            const [x1, y1] = toSVG(room.bounds[0], room.bounds[2]);
            const w = (room.bounds[1] - room.bounds[0]) * SCALE;
            const h = (room.bounds[3] - room.bounds[2]) * SCALE;
            const isSelected = selectedElement?.type === "room" && selectedElement.roomId === room.id;
            const wallPx = room.wallThickness * SCALE;
            const wallColor = isSelected ? "#10B981" : "#09090B";
            const wallWidth = isSelected ? Math.max(wallPx, 4) : Math.max(wallPx * 0.8, 2);
            const hasPoly = !!room.polygon;

            // Hovered wall highlight
            const isNorthHovered = hoveredWall?.roomId === room.id && hoveredWall.side === "north";
            const isSouthHovered = hoveredWall?.roomId === room.id && hoveredWall.side === "south";
            const isEastHovered = hoveredWall?.roomId === room.id && hoveredWall.side === "east";
            const isWestHovered = hoveredWall?.roomId === room.id && hoveredWall.side === "west";

            if (hasPoly) {
              // Polygon walls: draw each edge with hover highlight
              const polyPts = room.polygon!;
              // Classify edges for hover highlight
              let polyArea2 = 0;
              for (let pi = 0; pi < polyPts.length; pi++) {
                const pa = polyPts[pi], pb = polyPts[(pi + 1) % polyPts.length];
                polyArea2 += pa[0] * pb[1] - pb[0] * pa[1];
              }
              const polyNs = polyArea2 > 0 ? 1 : -1;
              return (
                <g key={`walls-${room.id}`}>
                  {polyPts.map((pt, i) => {
                    const j = (i + 1) % polyPts.length;
                    const [sx1, sy1] = toSVG(pt[0], pt[1]);
                    const [sx2, sy2] = toSVG(polyPts[j][0], polyPts[j][1]);
                    // Classify this edge for hover detection
                    const edx = polyPts[j][0] - pt[0], edz = polyPts[j][1] - pt[1];
                    let edgeSide: string | null = null;
                    if (Math.abs(edz) < 0.001 && Math.abs(edx) > 0.01) {
                      const nzS = polyNs * (edx > 0 ? -1 : 1);
                      edgeSide = nzS < 0 ? "north" : "south";
                    } else if (Math.abs(edx) < 0.001 && Math.abs(edz) > 0.01) {
                      const nxS = polyNs * (edz > 0 ? 1 : -1);
                      edgeSide = nxS > 0 ? "east" : "west";
                    }
                    const isEdgeHovered = hoveredWall?.roomId === room.id && edgeSide === hoveredWall.side;
                    return (
                      <line key={`poly-wall-${room.id}-${i}`}
                        x1={sx1} y1={sy1} x2={sx2} y2={sy2}
                        stroke={isEdgeHovered ? "#10B981" : wallColor}
                        strokeWidth={isEdgeHovered ? wallWidth + 2 : wallWidth}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  {/* Selection glow */}
                  {isSelected && (
                    <polygon
                      points={polyPts.map(([px, pz]) => { const [sx, sy] = toSVG(px, pz); return `${sx},${sy}`; }).join(" ")}
                      fill="none" stroke="#10B981" strokeWidth={1}
                      opacity={0.3} strokeDasharray="6,3"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            }

            return (
              <g key={`walls-${room.id}`}>
                {/* North wall */}
                <line
                  x1={x1} y1={y1} x2={x1 + w} y2={y1}
                  stroke={isNorthHovered ? "#10B981" : wallColor}
                  strokeWidth={isNorthHovered ? wallWidth + 2 : wallWidth}
                  strokeLinecap="round"
                />
                {/* South wall */}
                <line
                  x1={x1} y1={y1 + h} x2={x1 + w} y2={y1 + h}
                  stroke={isSouthHovered ? "#10B981" : wallColor}
                  strokeWidth={isSouthHovered ? wallWidth + 2 : wallWidth}
                  strokeLinecap="round"
                />
                {/* West wall */}
                <line
                  x1={x1} y1={y1} x2={x1} y2={y1 + h}
                  stroke={isWestHovered ? "#10B981" : wallColor}
                  strokeWidth={isWestHovered ? wallWidth + 2 : wallWidth}
                  strokeLinecap="round"
                />
                {/* East wall */}
                <line
                  x1={x1 + w} y1={y1} x2={x1 + w} y2={y1 + h}
                  stroke={isEastHovered ? "#10B981" : wallColor}
                  strokeWidth={isEastHovered ? wallWidth + 2 : wallWidth}
                  strokeLinecap="round"
                />

                {/* Selection glow */}
                {isSelected && (
                  <rect
                    x={x1 - 2} y={y1 - 2} width={w + 4} height={h + 4}
                    fill="none" stroke="#10B981" strokeWidth={1}
                    opacity={0.3} strokeDasharray="6,3"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* ═══ Doors (Architectural floor plan style) ═══ */}
          {editableRooms.map((room) =>
            room.doors.map((door) => {
              if (room.visible === false) return null;
              const rW = room.bounds[1] - room.bounds[0];
              const rD = room.bounds[3] - room.bounds[2];
              const doorPx = door.width * SCALE;
              const wallTh = room.wallThickness * SCALE;
              const isSelected = selectedElement?.type === "door" && selectedElement.doorId === door.id;
              const isDragging = dragMode?.type === "move-door" && dragMode.doorId === door.id;
              const strokeCol = isSelected || isDragging ? "#10B981" : "#6B5B4D";
              const doorPanelCol = isSelected || isDragging ? "#10B981" : "#5C4A3A";
              const arcCol = isSelected || isDragging ? "#10B981" : "#09090B";

              // Render an architectural door: wall gap + thick door panel rectangle + quarter-circle arc sweep
              const renderArchDoor = (
                cx: number, cy: number,
                side: "north" | "south" | "east" | "west",
              ) => {
                const half = doorPx / 2;
                const swingR = doorPx;
                const cos45 = Math.cos(Math.PI / 4);
                const sin45 = Math.sin(Math.PI / 4);
                const panelThick = 5;
                const isFlipped = !!door.flipped;

                let gapX1: number, gapY1: number, gapX2: number, gapY2: number;
                let hingeX: number, hingeY: number;
                let leafEndX: number, leafEndY: number;
                let closedX: number, closedY: number;
                let openX: number, openY: number;
                let arcSweep: 0 | 1;

                if (side === "north") {
                  gapX1 = cx - half; gapY1 = cy;
                  gapX2 = cx + half; gapY2 = cy;
                  hingeX = isFlipped ? cx + half : cx - half; hingeY = cy;
                  leafEndX = isFlipped ? hingeX - swingR * cos45 : hingeX + swingR * cos45; leafEndY = hingeY + swingR * sin45;
                  closedX = isFlipped ? hingeX - swingR : hingeX + swingR; closedY = hingeY;
                  openX = hingeX; openY = hingeY + swingR;
                  arcSweep = isFlipped ? 0 : 1;
                } else if (side === "south") {
                  gapX1 = cx - half; gapY1 = cy;
                  gapX2 = cx + half; gapY2 = cy;
                  hingeX = isFlipped ? cx + half : cx - half; hingeY = cy;
                  leafEndX = isFlipped ? hingeX - swingR * cos45 : hingeX + swingR * cos45; leafEndY = hingeY - swingR * sin45;
                  closedX = isFlipped ? hingeX - swingR : hingeX + swingR; closedY = hingeY;
                  openX = hingeX; openY = hingeY - swingR;
                  arcSweep = isFlipped ? 1 : 0;
                } else if (side === "west") {
                  gapX1 = cx; gapY1 = cy - half;
                  gapX2 = cx; gapY2 = cy + half;
                  hingeX = cx; hingeY = isFlipped ? cy + half : cy - half;
                  leafEndX = hingeX + swingR * sin45; leafEndY = isFlipped ? hingeY - swingR * cos45 : hingeY + swingR * cos45;
                  closedX = hingeX; closedY = isFlipped ? hingeY - swingR : hingeY + swingR;
                  openX = hingeX + swingR; openY = hingeY;
                  arcSweep = isFlipped ? 1 : 0;
                } else {
                  gapX1 = cx; gapY1 = cy - half;
                  gapX2 = cx; gapY2 = cy + half;
                  hingeX = cx; hingeY = isFlipped ? cy + half : cy - half;
                  leafEndX = hingeX - swingR * sin45; leafEndY = isFlipped ? hingeY - swingR * cos45 : hingeY + swingR * cos45;
                  closedX = hingeX; closedY = isFlipped ? hingeY - swingR : hingeY + swingR;
                  openX = hingeX - swingR; openY = hingeY;
                  arcSweep = isFlipped ? 0 : 1;
                }

                const isHoriz = side === "north" || side === "south";

                // Door panel as thick rotated rectangle (4 polygon corners)
                const dx = leafEndX - hingeX;
                const dy = leafEndY - hingeY;
                const len = Math.sqrt(dx * dx + dy * dy);
                const perpX = (-dy / len) * (panelThick / 2);
                const perpY = (dx / len) * (panelThick / 2);
                const panelPoints = [
                  `${hingeX + perpX},${hingeY + perpY}`,
                  `${hingeX - perpX},${hingeY - perpY}`,
                  `${leafEndX - perpX},${leafEndY - perpY}`,
                  `${leafEndX + perpX},${leafEndY + perpY}`,
                ].join(" ");

                // Pie-slice wedge path: hinge → closed → arc → leaf (half arc only)
                const wedgePath = `M ${hingeX} ${hingeY} L ${closedX} ${closedY} A ${swingR} ${swingR} 0 0 ${arcSweep} ${leafEndX} ${leafEndY} Z`;

                // Hit area bounds
                const allX = [hingeX, leafEndX, closedX, openX];
                const allY = [hingeY, leafEndY, closedY, openY];
                const HIT_PAD = 20; // Large padding for easier touch targeting
                const hitMinX = Math.min(...allX) - HIT_PAD;
                const hitMinY = Math.min(...allY) - HIT_PAD;
                const hitW = Math.max(...allX) - Math.min(...allX) + HIT_PAD * 2;
                const hitH = Math.max(...allY) - Math.min(...allY) + HIT_PAD * 2;

                return (
                  <g
                    key={`door-${room.id}-${door.id}`}
                    className="cursor-grab"
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                    onMouseDown={(e) => handleDoorDragStart(e, room.id, door.id)}
                    onTouchStart={(e) => handleDoorTouchStart(e, room.id, door.id)}
                    onClick={(e) => handleDoorClick(e, room.id, door.id)}
                  >
                    {/* Invisible larger hit area */}
                    <rect
                      x={hitMinX} y={hitMinY} width={hitW} height={hitH}
                      fill="transparent" className="pointer-events-auto"
                    />

                    {/* White gap in wall */}
                    <line x1={gapX1} y1={gapY1} x2={gapX2} y2={gapY2}
                      stroke="white" strokeWidth={wallTh + 6} />

                    {/* Door frame marks */}
                    {isHoriz ? (
                      <>
                        <line x1={gapX1} y1={cy - wallTh / 2 - 1} x2={gapX1} y2={cy + wallTh / 2 + 1}
                          stroke={strokeCol} strokeWidth={2.5} strokeLinecap="round" />
                        <line x1={gapX2} y1={cy - wallTh / 2 - 1} x2={gapX2} y2={cy + wallTh / 2 + 1}
                          stroke={strokeCol} strokeWidth={2.5} strokeLinecap="round" />
                      </>
                    ) : (
                      <>
                        <line x1={cx - wallTh / 2 - 1} y1={gapY1} x2={cx + wallTh / 2 + 1} y2={gapY1}
                          stroke={strokeCol} strokeWidth={2.5} strokeLinecap="round" />
                        <line x1={cx - wallTh / 2 - 1} y1={gapY2} x2={cx + wallTh / 2 + 1} y2={gapY2}
                          stroke={strokeCol} strokeWidth={2.5} strokeLinecap="round" />
                      </>
                    )}

                    {/* Filled wedge (pie-slice) between closed and open positions */}
                    <path
                      d={wedgePath}
                      fill={isSelected || isDragging ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.5)"}
                      stroke="none"
                    />

                    {/* Arc sweep line from closed position to leaf (half arc) */}
                    <path
                      d={`M ${closedX} ${closedY} A ${swingR} ${swingR} 0 0 ${arcSweep} ${leafEndX} ${leafEndY}`}
                      fill="none"
                      stroke={arcCol}
                      strokeWidth={1.8}
                    />

                    {/* Thick door panel rectangle */}
                    <polygon
                      points={panelPoints}
                      fill={doorPanelCol}
                      stroke={isSelected || isDragging ? "#10B981" : "#4A3B2E"}
                      strokeWidth={1}
                      strokeLinejoin="round"
                    />

                    {/* Selection glow */}
                    {(isSelected || isDragging) && (
                      <>
                        <polygon
                          points={panelPoints}
                          fill="none" stroke="#10B981" strokeWidth={8} opacity={0.12}
                          strokeLinejoin="round" className="pointer-events-none"
                        />
                        <path
                          d={`M ${closedX} ${closedY} A ${swingR} ${swingR} 0 0 ${arcSweep} ${leafEndX} ${leafEndY}`}
                          fill="none" stroke="#10B981" strokeWidth={4} opacity={0.12}
                          className="pointer-events-none"
                        />
                      </>
                    )}
                  </g>
                );
              };

              // Resolve door position — polygon-aware for L/T shaped rooms
              const [dwx, dwz] = resolveOpening2D(room, door.side, door.t);
              const [bx, by] = toSVG(dwx, dwz);
              return renderArchDoor(bx, by, door.side);
            })
          )}

          {/* ═══ Windows ═══ */}
          {editableRooms.map((room) =>
            room.windows.map((win) => {
              if (room.visible === false) return null;
              const rW = room.bounds[1] - room.bounds[0];
              const rD = room.bounds[3] - room.bounds[2];
              const winPx = win.width * SCALE;
              const isSelected = selectedElement?.type === "window" && selectedElement.windowId === win.id;
              const strokeColor = isSelected ? "#10B981" : "#09090B";

              const isDraggingWin = dragMode?.type === "move-window" && dragMode.windowId === win.id;

              if (win.side === "north" || win.side === "south") {
                const [resolvedWx, resolvedWz] = resolveOpening2D(room, win.side, win.t);
                const [wx, wySvg] = toSVG(resolvedWx, resolvedWz);
                return (
                  <g key={`win-${room.id}-${win.id}`} className="cursor-grab" style={{ cursor: isDraggingWin ? "grabbing" : "grab" }}
                    onMouseDown={(e) => handleWindowDragStart(e, room.id, win.id)}
                    onTouchStart={(e) => handleWindowTouchStart(e, room.id, win.id)}
                    onClick={(e) => handleWindowClick(e, room.id, win.id)}>
                    <rect x={wx - winPx / 2 - 12} y={wySvg - 20} width={winPx + 24} height={40}
                      fill="transparent" className="pointer-events-auto" />
                    <line x1={wx - winPx / 2} y1={wySvg} x2={wx + winPx / 2} y2={wySvg}
                      stroke="white" strokeWidth={room.wallThickness * SCALE + 4} />
                    <line x1={wx - winPx / 2} y1={wySvg - 3} x2={wx + winPx / 2} y2={wySvg - 3}
                      stroke={strokeColor} strokeWidth={1.5} />
                    <line x1={wx - winPx / 2} y1={wySvg + 3} x2={wx + winPx / 2} y2={wySvg + 3}
                      stroke={strokeColor} strokeWidth={1.5} />
                    <line x1={wx - winPx / 2} y1={wySvg} x2={wx + winPx / 2} y2={wySvg}
                      stroke="#6BA3BE" strokeWidth={1.5} opacity={0.5} />
                    <line x1={wx} y1={wySvg - 3} x2={wx} y2={wySvg + 3}
                      stroke={strokeColor} strokeWidth={0.8} opacity={0.4} />
                    {(isSelected || isDraggingWin) && (
                      <rect x={wx - winPx / 2 - 3} y={wySvg - 8} width={winPx + 6} height={16}
                        fill="#10B981" opacity={0.1} rx={3} className="pointer-events-none" />
                    )}
                  </g>
                );
              }
              // east or west
              const [resolvedEwX, resolvedEwZ] = resolveOpening2D(room, win.side, win.t);
              const [wxSvg, wySvg] = toSVG(resolvedEwX, resolvedEwZ);
              return (
                <g key={`win-${room.id}-${win.id}`} className="cursor-grab" style={{ cursor: isDraggingWin ? "grabbing" : "grab" }}
                  onMouseDown={(e) => handleWindowDragStart(e, room.id, win.id)}
                  onTouchStart={(e) => handleWindowTouchStart(e, room.id, win.id)}
                  onClick={(e) => handleWindowClick(e, room.id, win.id)}>
                  <rect x={wxSvg - 20} y={wySvg - winPx / 2 - 12} width={40} height={winPx + 24}
                    fill="transparent" className="pointer-events-auto" />
                  <line x1={wxSvg} y1={wySvg - winPx / 2} x2={wxSvg} y2={wySvg + winPx / 2}
                    stroke="white" strokeWidth={room.wallThickness * SCALE + 4} />
                  <line x1={wxSvg - 3} y1={wySvg - winPx / 2} x2={wxSvg - 3} y2={wySvg + winPx / 2}
                    stroke={strokeColor} strokeWidth={1.5} />
                  <line x1={wxSvg + 3} y1={wySvg - winPx / 2} x2={wxSvg + 3} y2={wySvg + winPx / 2}
                    stroke={strokeColor} strokeWidth={1.5} />
                  <line x1={wxSvg} y1={wySvg - winPx / 2} x2={wxSvg} y2={wySvg + winPx / 2}
                    stroke="#6BA3BE" strokeWidth={1.5} opacity={0.5} />
                  <line x1={wxSvg - 3} y1={wySvg} x2={wxSvg + 3} y2={wySvg}
                    stroke={strokeColor} strokeWidth={0.8} opacity={0.4} />
                  {(isSelected || isDraggingWin) && (
                    <rect x={wxSvg - 8} y={wySvg - winPx / 2 - 3} width={16} height={winPx + 6}
                      fill="#10B981" opacity={0.1} rx={3} className="pointer-events-none" />
                  )}
                </g>
              );
            })
          )}

          {/* ═══ Furniture footprints ═══ */}
          {editableRooms.map((room) => {
            const items = furniture[room.id] || [];
            // While dragging a room, compute visual offset for its furniture
            let furnitureDx = 0, furnitureDz = 0;
            if (dragMode?.type === "move-room" && dragMode.roomId === room.id) {
              furnitureDx = room.bounds[0] - dragMode.startBounds[0];
              furnitureDz = room.bounds[2] - dragMode.startBounds[2];
            }
            return items.map((item) => {
              const [iw, , id] = item.dimensions;
              // Use live dragged position if this item is being dragged
              const isDraggingThis = dragMode?.type === "move-furniture" && dragMode.itemId === item.id;
              const livePos = isDraggingThis && draggedFurniturePos ? draggedFurniturePos : null;
              const wx = livePos ? livePos.x : item.position[0] + furnitureDx;
              const wz = livePos ? livePos.z : item.position[2] + furnitureDz;
              const [cx, cy] = toSVG(wx, wz);
              const pw = iw * SCALE;
              const pd = id * SCALE;
              const isItemSelected = item.id === selectedItemId;
              const rot = item.rotation;

              return (
                <g
                  key={`${room.id}-${item.id}`}
                  transform={`translate(${cx}, ${cy}) rotate(${rot})`}
                  className={activeTool === "select" ? "cursor-grab" : "cursor-pointer"}
                  style={isDraggingThis ? { cursor: "grabbing" } : undefined}
                  onMouseDown={(e) => {
                    if (e.button !== 0 || activeTool !== "select") return;
                    e.stopPropagation();
                    onSelectRoom(room.id);
                    onSelectItem(item.id);
                    const [worldX, worldZ] = getWorldPos(e);
                    setDragMode({
                      type: "move-furniture",
                      roomId: room.id,
                      itemId: item.id,
                      startWorld: [worldX, worldZ],
                      startPos: [item.position[0] + furnitureDx, item.position[2] + furnitureDz],
                    });
                    setDraggedFurniturePos({
                      itemId: item.id,
                      x: item.position[0] + furnitureDx,
                      z: item.position[2] + furnitureDz,
                    });
                  }}
                  onTouchStart={(e) => {
                    if (activeTool !== "select" || e.touches.length !== 1) return;
                    const [worldX, worldZ] = getWorldPosFromCoords(e.touches[0].clientX, e.touches[0].clientY);
                    // Check if touch is actually closer to a door/window — if so, let container handle it
                    const DOOR_PRIORITY_DIST = 0.6;
                    for (const rm of editableRooms) {
                      for (const d of rm.doors) {
                        const [dx, dz] = resolveOpening2D(rm, d.side, d.t);
                        if (Math.hypot(worldX - dx, worldZ - dz) < DOOR_PRIORITY_DIST) return; // let propagate
                      }
                      for (const w of rm.windows) {
                        const [wx, wz] = resolveOpening2D(rm, w.side, w.t);
                        if (Math.hypot(worldX - wx, worldZ - wz) < DOOR_PRIORITY_DIST) return; // let propagate
                      }
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    onSelectRoom(room.id);
                    onSelectItem(item.id);
                    // Use pending system instead of immediate drag
                    touchPendingRef.current = {
                      startClientX: e.touches[0].clientX, startClientY: e.touches[0].clientY,
                      pendingDragMode: {
                        type: "move-furniture",
                        roomId: room.id,
                        itemId: item.id,
                        startWorld: [worldX, worldZ],
                        startPos: [item.position[0] + furnitureDx, item.position[2] + furnitureDz],
                      },
                      pendingSelection: null,
                      needsUndo: false, activated: false,
                    };
                  }}
                  onClick={(e) => { e.stopPropagation(); onSelectRoom(room.id); onSelectItem(item.id); }}
                >
                  {renderFurnitureTopDown(
                    item.furnitureId, pw, pd,
                    isItemSelected, !!isDraggingThis,
                    room.accent, item.name, item.color,
                  )}
                </g>
              );
            });
          })}

          {/* ═══ Floating Action Buttons for Selected Furniture ═══ */}
          {selectedItemId && (() => {
            // Find the selected item across all rooms
            let selItem: PlacedItem | null = null;
            let selRoom: EditableRoom | null = null;
            let furnitureDxSel = 0, furnitureDzSel = 0;
            for (const room of editableRooms) {
              const items = furniture[room.id];
              if (!items) continue;
              const found = items.find(it => it.id === selectedItemId);
              if (found) {
                selItem = found;
                selRoom = room;
                if (dragMode?.type === "move-room" && dragMode.roomId === room.id) {
                  furnitureDxSel = room.bounds[0] - dragMode.startBounds[0];
                  furnitureDzSel = room.bounds[2] - dragMode.startBounds[2];
                }
                break;
              }
            }
            if (!selItem || !selRoom) return null;
            const isDraggingThis = dragMode?.type === "move-furniture" && dragMode.itemId === selItem.id;
            if (isDraggingThis) return null; // Hide buttons while dragging
            const livePos = draggedFurniturePos?.itemId === selItem.id ? draggedFurniturePos : null;
            const wx = livePos ? livePos.x : selItem.position[0] + furnitureDxSel;
            const wz = livePos ? livePos.z : selItem.position[2] + furnitureDzSel;
            const [cx, cy] = toSVG(wx, wz);
            const [iw, , id] = selItem.dimensions;
            const halfH = (id * SCALE) / 2;
            const btnY = cy + halfH + 8;
            const btnSize = 44;
            const btnGap = 12;
            const totalW = btnSize * 3 + btnGap * 2;
            const foX = cx - totalW / 2;
            return (
              <foreignObject x={foX} y={btnY} width={totalW} height={btnSize + 4} style={{ overflow: "visible" }}>
                <div
                  style={{ display: "flex", gap: `${btnGap}px`, justifyContent: "center" }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onRotateItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRotateItem(); }}
                      style={{
                        width: btnSize, height: btnSize, borderRadius: "50%",
                        background: "white", border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", touchAction: "manipulation",
                      }}
                      title="Rotate 45°"
                    >
                      <RotateCw size={18} color="#09090B" strokeWidth={1.5} />
                    </button>
                  )}
                  {onDuplicateItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicateItem(); }}
                      style={{
                        width: btnSize, height: btnSize, borderRadius: "50%",
                        background: "white", border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", touchAction: "manipulation",
                      }}
                      title="Duplicate"
                    >
                      <Copy size={18} color="#09090B" strokeWidth={1.5} />
                    </button>
                  )}
                  {onDeleteItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteItem(); }}
                      style={{
                        width: btnSize, height: btnSize, borderRadius: "50%",
                        background: "white", border: "1px solid #F3F4F6",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", touchAction: "manipulation",
                      }}
                      title="Delete"
                    >
                      <Trash2 size={18} color="#71717A" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </foreignObject>
            );
          })()}

          {/* ═══ Resize Handles (for selected room) ═══ */}
          {selectedElement?.type === "room" && (() => {
            const room = editableRooms.find(r => r.id === selectedElement.roomId);
            if (!room || room.locked) return null;

            // Polygon rooms: show vertex handles instead
            if (room.polygon) {
              return (
                <g>
                  {room.polygon.map((pt, i) => {
                    const [sx, sy] = toSVG(pt[0], pt[1]);
                    return (
                      <g key={`poly-handle-${i}`}>
                        <circle cx={sx} cy={sy} r={5}
                          fill="white" stroke="#10B981" strokeWidth={1.5}
                          className="pointer-events-none"
                          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
                        />
                        <text x={sx} y={sy - 10} textAnchor="middle" dominantBaseline="middle"
                          fill="#10B981" fontSize={7} fontFamily="Inter,sans-serif" fontWeight="600"
                          className="pointer-events-none select-none" opacity={0.6}
                        >v{i}</text>
                      </g>
                    );
                  })}
                </g>
              );
            }

            const [x1, y1] = toSVG(room.bounds[0], room.bounds[2]);
            const w = (room.bounds[1] - room.bounds[0]) * SCALE;
            const h = (room.bounds[3] - room.bounds[2]) * SCALE;
            const mx = x1 + w / 2;
            const my = y1 + h / 2;

            return (
              <g>
                {/* Corner handles */}
                <ResizeHandle x={x1} y={y1} cursor="nw-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "nw")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "nw")} />
                <ResizeHandle x={x1 + w} y={y1} cursor="ne-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "ne")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "ne")} />
                <ResizeHandle x={x1} y={y1 + h} cursor="sw-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "sw")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "sw")} />
                <ResizeHandle x={x1 + w} y={y1 + h} cursor="se-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "se")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "se")} />
                {/* Edge midpoint handles */}
                <ResizeHandle x={mx} y={y1} cursor="n-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "n")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "n")} />
                <ResizeHandle x={mx} y={y1 + h} cursor="s-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "s")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "s")} />
                <ResizeHandle x={x1} y={my} cursor="w-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "w")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "w")} />
                <ResizeHandle x={x1 + w} y={my} cursor="e-resize" onMouseDown={(e) => handleResizeStart(e, room.id, "e")} onTouchStart={(e) => handleResizeTouchStart(e, room.id, "e")} />
              </g>
            );
          })()}

          {/* ═══ Dimension arrows for selected room ═══ */}
          {selectedElement?.type === "room" && (() => {
            const room = editableRooms.find(r => r.id === selectedElement.roomId);
            if (!room) return null;
            const rw = room.bounds[1] - room.bounds[0];
            const rd = room.bounds[3] - room.bounds[2];
            const [x1, y1] = toSVG(room.bounds[0], room.bounds[2]);
            const w = rw * SCALE;
            const h = rd * SCALE;

            return (
              <g className="pointer-events-none">
                {/* Top dimension */}
                <line x1={x1} y1={y1 - 20} x2={x1 + w} y2={y1 - 20} stroke="#10B981" strokeWidth={1} />
                <line x1={x1} y1={y1 - 16} x2={x1} y2={y1 - 24} stroke="#10B981" strokeWidth={1} />
                <line x1={x1 + w} y1={y1 - 16} x2={x1 + w} y2={y1 - 24} stroke="#10B981" strokeWidth={1} />
                <rect x={x1 + w / 2 - 22} y={y1 - 30} width={44} height={16} rx={4} fill="white" stroke="#10B981" strokeWidth={0.5} />
                <text x={x1 + w / 2} y={y1 - 22} textAnchor="middle" dominantBaseline="middle"
                  fill="#10B981" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600">
                  {formatDim(rw, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
                </text>

                {/* Left dimension */}
                <line x1={x1 - 20} y1={y1} x2={x1 - 20} y2={y1 + h} stroke="#10B981" strokeWidth={1} />
                <line x1={x1 - 16} y1={y1} x2={x1 - 24} y2={y1} stroke="#10B981" strokeWidth={1} />
                <line x1={x1 - 16} y1={y1 + h} x2={x1 - 24} y2={y1 + h} stroke="#10B981" strokeWidth={1} />
                <g transform={`translate(${x1 - 22}, ${y1 + h / 2})`}>
                  <rect x={-22} y={-8} width={44} height={16} rx={4} fill="white" stroke="#10B981" strokeWidth={0.5}
                    transform="rotate(-90)" />
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="middle"
                    fill="#10B981" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                    transform="rotate(-90)">
                    {formatDim(rd, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* ═══ Split Preview Line ═══ */}
          {splitMode && (() => {
            const room = editableRooms.find(r => r.id === splitMode.roomId);
            if (!room) return null;
            const [xMin, xMax, zMin, zMax] = room.bounds;
            const rW = xMax - xMin;
            const rD = zMax - zMin;

            if (splitMode.axis === "v") {
              const splitX = xMin + splitMode.t * rW;
              const [sx, sy1] = toSVG(splitX, zMin);
              const [, sy2] = toSVG(splitX, zMax);
              const sizeL = formatDim(splitMode.t * rW, unitSystem);
              const sizeR = formatDim((1 - splitMode.t) * rW, unitSystem);
              return (
                <g>
                  {/* Left half tint */}
                  {(() => { const [lx, ly] = toSVG(xMin, zMin); return (
                    <rect x={lx} y={ly} width={splitMode.t * rW * SCALE} height={rD * SCALE}
                      fill="rgba(59,130,246,0.08)" className="pointer-events-none" />
                  ); })()}
                  {/* Right half tint */}
                  {(() => { const [rx, ry] = toSVG(splitX, zMin); return (
                    <rect x={rx} y={ry} width={(1 - splitMode.t) * rW * SCALE} height={rD * SCALE}
                      fill="rgba(168,85,247,0.08)" className="pointer-events-none" />
                  ); })()}
                  {/* Split line */}
                  <line x1={sx} y1={sy1 - 10} x2={sx} y2={sy2 + 10}
                    stroke="#EF4444" strokeWidth={2} strokeDasharray="6 3">
                    <animate attributeName="stroke-dashoffset" from="0" to="18" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  {/* Drag handle */}
                  <rect x={sx - 14} y={(sy1 + sy2) / 2 - 10} width={28} height={20} rx={6}
                    fill="white" stroke="#EF4444" strokeWidth={1.5}
                    className="cursor-ew-resize pointer-events-auto"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                    onMouseDown={(e) => { e.stopPropagation(); setDragMode({ type: "move-split", axis: "v", roomId: splitMode.roomId }); }}
                    onTouchStart={(e) => { if (e.touches.length === 1) { e.stopPropagation(); e.preventDefault(); setDragMode({ type: "move-split", axis: "v", roomId: splitMode.roomId }); } }}
                  />
                  <line x1={sx - 4} y1={(sy1 + sy2) / 2 - 4} x2={sx - 4} y2={(sy1 + sy2) / 2 + 4}
                    stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                  <line x1={sx + 4} y1={(sy1 + sy2) / 2 - 4} x2={sx + 4} y2={(sy1 + sy2) / 2 + 4}
                    stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                  {/* Size labels */}
                  <text x={sx - splitMode.t * rW * SCALE / 2} y={sy1 - 16} textAnchor="middle"
                    fill="#3B82F6" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                    className="pointer-events-none select-none">
                    {sizeL}{unitSystem === "metric" ? "cm" : ""}
                  </text>
                  <text x={sx + (1 - splitMode.t) * rW * SCALE / 2} y={sy1 - 16} textAnchor="middle"
                    fill="#A855F7" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                    className="pointer-events-none select-none">
                    {sizeR}{unitSystem === "metric" ? "cm" : ""}
                  </text>
                </g>
              );
            } else {
              const splitZ = zMin + splitMode.t * rD;
              const [sx1, sy] = toSVG(xMin, splitZ);
              const [sx2] = toSVG(xMax, splitZ);
              const sizeT = formatDim(splitMode.t * rD, unitSystem);
              const sizeB = formatDim((1 - splitMode.t) * rD, unitSystem);
              return (
                <g>
                  {/* Top half tint */}
                  {(() => { const [lx, ly] = toSVG(xMin, zMin); return (
                    <rect x={lx} y={ly} width={rW * SCALE} height={splitMode.t * rD * SCALE}
                      fill="rgba(59,130,246,0.08)" className="pointer-events-none" />
                  ); })()}
                  {/* Bottom half tint */}
                  {(() => { const [rx, ry] = toSVG(xMin, splitZ); return (
                    <rect x={rx} y={ry} width={rW * SCALE} height={(1 - splitMode.t) * rD * SCALE}
                      fill="rgba(168,85,247,0.08)" className="pointer-events-none" />
                  ); })()}
                  {/* Split line */}
                  <line x1={sx1 - 10} y1={sy} x2={sx2 + 10} y2={sy}
                    stroke="#EF4444" strokeWidth={2} strokeDasharray="6 3">
                    <animate attributeName="stroke-dashoffset" from="0" to="18" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  {/* Drag handle */}
                  <rect x={(sx1 + sx2) / 2 - 10} y={sy - 14} width={20} height={28} rx={6}
                    fill="white" stroke="#EF4444" strokeWidth={1.5}
                    className="cursor-ns-resize pointer-events-auto"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
                    onMouseDown={(e) => { e.stopPropagation(); setDragMode({ type: "move-split", axis: "h", roomId: splitMode.roomId }); }}
                    onTouchStart={(e) => { if (e.touches.length === 1) { e.stopPropagation(); e.preventDefault(); setDragMode({ type: "move-split", axis: "h", roomId: splitMode.roomId }); } }}
                  />
                  <line x1={(sx1 + sx2) / 2 - 4} y1={sy - 4} x2={(sx1 + sx2) / 2 + 4} y2={sy - 4}
                    stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                  <line x1={(sx1 + sx2) / 2 - 4} y1={sy + 4} x2={(sx1 + sx2) / 2 + 4} y2={sy + 4}
                    stroke="#EF4444" strokeWidth={1.5} strokeLinecap="round" className="pointer-events-none" />
                  {/* Size labels */}
                  <text x={sx1 - 18} y={sy - splitMode.t * rD * SCALE / 2} textAnchor="middle"
                    fill="#3B82F6" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                    className="pointer-events-none select-none" transform={`rotate(-90,${sx1 - 18},${sy - splitMode.t * rD * SCALE / 2})`}>
                    {sizeT}{unitSystem === "metric" ? "cm" : ""}
                  </text>
                  <text x={sx1 - 18} y={sy + (1 - splitMode.t) * rD * SCALE / 2} textAnchor="middle"
                    fill="#A855F7" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                    className="pointer-events-none select-none" transform={`rotate(-90,${sx1 - 18},${sy + (1 - splitMode.t) * rD * SCALE / 2})`}>
                    {sizeB}{unitSystem === "metric" ? "cm" : ""}
                  </text>
                </g>
              );
            }
          })()}

          {/* ═══ Draw Room Preview ═══ */}
          {dragMode?.type === "draw-room" && (() => {
            const { startWorld, currentWorld } = dragMode;
            const x1 = Math.min(startWorld[0], currentWorld[0]);
            const x2 = Math.max(startWorld[0], currentWorld[0]);
            const z1 = Math.min(startWorld[1], currentWorld[1]);
            const z2 = Math.max(startWorld[1], currentWorld[1]);
            const [sx, sy] = toSVG(x1, z1);
            const w = (x2 - x1) * SCALE;
            const h = (z2 - z1) * SCALE;

            return (
              <g>
                <rect
                  x={sx} y={sy} width={w} height={h}
                  fill="#10B981" fillOpacity={0.1}
                  stroke="#10B981" strokeWidth={2}
                  strokeDasharray="8,4"
                  rx={2}
                />
                {/* Size label */}
                {w > 20 && h > 20 && (
                  <text
                    x={sx + w / 2} y={sy + h / 2}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#10B981" fontSize={12} fontFamily="Inter,sans-serif" fontWeight="600"
                  >
                    {formatDim(x2 - x1, unitSystem)} x {formatDim(z2 - z1, unitSystem)}
                    {unitSystem === "metric" ? " cm" : ""}
                  </text>
                )}
              </g>
            );
          })()}

          {/* ═══ Standalone Walls (committed) ═══ */}
          {standaloneWalls.map((wall) => {
            const svgPts = wall.points.map(([wx, wz]) => toSVG(wx, wz));
            const isSelected = selectedElement?.type === "standalone-wall" && selectedElement.wallId === wall.id;
            const isDragging = dragMode?.type === "move-standalone-wall" && dragMode.wallId === wall.id;
            const wallPx = Math.max(wall.thickness * SCALE, 3);

            return (
              <g key={wall.id}>
                {/* Hit area (wider invisible line for easier clicking) */}
                {svgPts.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPts[i - 1];
                  return (
                    <line key={`sw-hit-${wall.id}-${i}`}
                      x1={prev[0]} y1={prev[1]} x2={pt[0]} y2={pt[1]}
                      stroke="transparent" strokeWidth={wallPx + 12}
                      strokeLinecap="round"
                      className="cursor-pointer pointer-events-auto"
                      onMouseDown={(e) => {
                        if (activeTool !== "select") return;
                        e.stopPropagation();
                        pushUndo();
                        const [worldX, worldZ] = getWorldPos(e);
                        setDragMode({
                          type: "move-standalone-wall",
                          wallId: wall.id,
                          startMouse: [worldX, worldZ],
                          startPoints: wall.points.map(p => [...p] as [number, number]),
                        });
                        setSelectedElement({ type: "standalone-wall", wallId: wall.id });
                      }}
                      onTouchStart={(e) => {
                        if (activeTool !== "select" || e.touches.length !== 1) return;
                        e.stopPropagation();
                        e.preventDefault();
                        pushUndo();
                        const [worldX, worldZ] = getWorldPosFromCoords(e.touches[0].clientX, e.touches[0].clientY);
                        setDragMode({
                          type: "move-standalone-wall",
                          wallId: wall.id,
                          startMouse: [worldX, worldZ],
                          startPoints: wall.points.map(p => [...p] as [number, number]),
                        });
                        setSelectedElement({ type: "standalone-wall", wallId: wall.id });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: "standalone-wall", wallId: wall.id });
                      }}
                    />
                  );
                })}

                {/* Selection glow */}
                {(isSelected || isDragging) && svgPts.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPts[i - 1];
                  return (
                    <line key={`sw-glow-${wall.id}-${i}`}
                      x1={prev[0]} y1={prev[1]} x2={pt[0]} y2={pt[1]}
                      stroke="#10B981" strokeWidth={wallPx + 6}
                      strokeLinecap="round" opacity={0.15}
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* Visible wall line */}
                {svgPts.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPts[i - 1];
                  return (
                    <line key={`sw-line-${wall.id}-${i}`}
                      x1={prev[0]} y1={prev[1]} x2={pt[0]} y2={pt[1]}
                      stroke={isSelected || isDragging ? "#10B981" : wall.color}
                      strokeWidth={wallPx}
                      strokeLinecap="round"
                      className="pointer-events-none"
                    />
                  );
                })}

                {/* Vertex dots when selected — draggable for vertex editing */}
                {isSelected && svgPts.map((pt, i) => (
                  <circle key={`sw-dot-${wall.id}-${i}`}
                    cx={pt[0]} cy={pt[1]} r={6}
                    fill="white" stroke="#10B981" strokeWidth={2}
                    className="cursor-grab pointer-events-auto"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
                    onMouseDown={(e) => {
                      if (activeTool !== "select") return;
                      e.stopPropagation();
                      pushUndo();
                      const [wx, wz] = getWorldPos(e);
                      setDragMode({
                        type: "move-vertex",
                        wallId: wall.id,
                        pointIndex: i,
                        startWorld: [wx, wz],
                      });
                    }}
                    onTouchStart={(e) => {
                      if (activeTool !== "select" || e.touches.length !== 1) return;
                      e.stopPropagation();
                      e.preventDefault();
                      pushUndo();
                      const [wx, wz] = getWorldPosFromCoords(e.touches[0].clientX, e.touches[0].clientY);
                      setDragMode({
                        type: "move-vertex",
                        wallId: wall.id,
                        pointIndex: i,
                        startWorld: [wx, wz],
                      });
                    }}
                  />
                ))}

                {/* Segment lengths when selected */}
                {isSelected && svgPts.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPts[i - 1];
                  const mx = (prev[0] + pt[0]) / 2;
                  const my = (prev[1] + pt[1]) / 2;
                  const segLen = Math.sqrt(
                    (wall.points[i][0] - wall.points[i - 1][0]) ** 2 +
                    (wall.points[i][1] - wall.points[i - 1][1]) ** 2
                  );
                  return (
                    <g key={`sw-dim-${wall.id}-${i}`}>
                      <rect x={mx - 20} y={my - 9} width={40} height={16} rx={4}
                        fill="white" stroke="#10B981" strokeWidth={0.5}
                        className="pointer-events-none" />
                      <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
                        fill="#10B981" fontSize={9} fontFamily="Inter,sans-serif" fontWeight="600"
                        className="pointer-events-none">
                        {formatDim(segLen, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
                      </text>
                    </g>
                  );
                })}

                {/* Split midpoint buttons when selected */}
                {isSelected && activeTool === "select" && svgPts.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPts[i - 1];
                  const mx = (prev[0] + pt[0]) / 2;
                  const my = (prev[1] + pt[1]) / 2;
                  // Offset the split button perpendicular to the segment
                  const segDx = pt[0] - prev[0];
                  const segDy = pt[1] - prev[1];
                  const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
                  if (segLen < 20) return null; // too short to split
                  const nx = -segDy / segLen;
                  const ny = segDx / segLen;
                  const offsetDist = 18;
                  const bx = mx + nx * offsetDist;
                  const by = my + ny * offsetDist;
                  return (
                    <g key={`sw-split-${wall.id}-${i}`}
                      className="cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        pushUndo();
                        // Insert a new vertex at the midpoint of this segment
                        const midWorldX = (wall.points[i - 1][0] + wall.points[i][0]) / 2;
                        const midWorldZ = (wall.points[i - 1][1] + wall.points[i][1]) / 2;
                        setStandaloneWalls(prev => prev.map(w => {
                          if (w.id !== wall.id) return w;
                          const newPts = [...w.points];
                          newPts.splice(i, 0, [midWorldX, midWorldZ]);
                          return { ...w, points: newPts };
                        }));
                      }}
                    >
                      <circle cx={bx} cy={by} r={9} fill="white" stroke="#10B981" strokeWidth={1.5}
                        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.12))" }}
                      />
                      <line x1={bx - 4} y1={by} x2={bx + 4} y2={by} stroke="#10B981" strokeWidth={1.5} strokeLinecap="round" />
                      <line x1={bx} y1={by - 4} x2={bx} y2={by + 4} stroke="#10B981" strokeWidth={1.5} strokeLinecap="round" />
                      <title>Split segment — add vertex</title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ═══ Draw Walls Cursor (before any points placed) ═══ */}
          {activeTool === "draw-walls" && wallDrawPoints.length === 0 && wallDrawCursor && (() => {
            const [cx, cy] = toSVG(wallDrawCursor[0], wallDrawCursor[1]);
            return (
              <g className="pointer-events-none">
                <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#10B981" strokeWidth={1} opacity={0.5} />
                <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#10B981" strokeWidth={1} opacity={0.5} />
                <circle cx={cx} cy={cy} r={4} fill="#10B981" opacity={0.4} />
              </g>
            );
          })()}

          {/* ═══ Draw Walls Preview ═══ */}
          {activeTool === "draw-walls" && wallDrawPoints.length > 0 && (() => {
            const svgPoints = wallDrawPoints.map(([wx, wz]) => toSVG(wx, wz));
            const cursorSvg = wallDrawCursor ? toSVG(wallDrawCursor[0], wallDrawCursor[1]) : null;

            return (
              <g>
                {/* Drawn wall segments */}
                {svgPoints.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = svgPoints[i - 1];
                  const segLen = Math.sqrt(
                    (wallDrawPoints[i][0] - wallDrawPoints[i - 1][0]) ** 2 +
                    (wallDrawPoints[i][1] - wallDrawPoints[i - 1][1]) ** 2
                  );
                  const mx = (prev[0] + pt[0]) / 2;
                  const my = (prev[1] + pt[1]) / 2;
                  return (
                    <g key={`wall-seg-${i}`}>
                      <line
                        x1={prev[0]} y1={prev[1]} x2={pt[0]} y2={pt[1]}
                        stroke="#10B981" strokeWidth={Math.max(0.15 * SCALE, 3)}
                        strokeLinecap="round"
                      />
                      {/* Segment length label */}
                      <rect x={mx - 18} y={my - 17} width={36} height={14} rx={4}
                        fill="white" stroke="#10B981" strokeWidth={0.5} opacity={0.9} />
                      <text x={mx} y={my - 10} textAnchor="middle" dominantBaseline="middle"
                        fill="#10B981" fontSize={8} fontFamily="Inter,sans-serif" fontWeight="600">
                        {formatDim(segLen, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
                      </text>
                    </g>
                  );
                })}

                {/* Preview line from last point to cursor */}
                {cursorSvg && (
                  <>
                    <line
                      x1={svgPoints[svgPoints.length - 1][0]}
                      y1={svgPoints[svgPoints.length - 1][1]}
                      x2={cursorSvg[0]}
                      y2={cursorSvg[1]}
                      stroke="#10B981" strokeWidth={Math.max(0.15 * SCALE, 3)}
                      strokeLinecap="round"
                      strokeDasharray="8,4" opacity={0.6}
                    />
                    {/* Preview segment length */}
                    {(() => {
                      const lastPt = wallDrawPoints[wallDrawPoints.length - 1];
                      const previewLen = Math.sqrt(
                        (wallDrawCursor![0] - lastPt[0]) ** 2 +
                        (wallDrawCursor![1] - lastPt[1]) ** 2
                      );
                      if (previewLen < 0.1) return null;
                      const mx = (svgPoints[svgPoints.length - 1][0] + cursorSvg[0]) / 2;
                      const my = (svgPoints[svgPoints.length - 1][1] + cursorSvg[1]) / 2;
                      return (
                        <g>
                          <rect x={mx - 18} y={my - 17} width={36} height={14} rx={4}
                            fill="white" stroke="#10B981" strokeWidth={0.5} opacity={0.7} />
                          <text x={mx} y={my - 10} textAnchor="middle" dominantBaseline="middle"
                            fill="#10B981" fontSize={8} fontFamily="Inter,sans-serif" fontWeight="600"
                            opacity={0.7}>
                            {formatDim(previewLen, unitSystem)}{unitSystem === "metric" ? "cm" : ""}
                          </text>
                        </g>
                      );
                    })()}
                  </>
                )}

                {/* Point markers */}
                {svgPoints.map((pt, i) => (
                  <circle key={`wall-pt-${i}`}
                    cx={pt[0]} cy={pt[1]} r={5}
                    fill={i === 0 ? "#10B981" : "white"}
                    stroke="#10B981" strokeWidth={2}
                  />
                ))}

                {/* Cursor point */}
                {cursorSvg && (
                  <circle cx={cursorSvg[0]} cy={cursorSvg[1]} r={4}
                    fill="#10B981" opacity={0.5}
                  />
                )}
              </g>
            );
          })()}

          {/* Compass Rose */}
          <g transform={`translate(${svgW - 45}, ${45})`}>
            <circle cx={0} cy={0} r={18} fill="white" stroke="#E5E7EB" strokeWidth={1} />
            <polygon points="0,-14 -4,-6 4,-6" fill="#09090B" />
            <text x={0} y={-5} textAnchor="middle" dominantBaseline="middle" fill="#09090B" fontSize={6} fontFamily="Inter,sans-serif" fontWeight="700">N</text>
            <text x={0} y={12} textAnchor="middle" dominantBaseline="middle" fill="#ABABAB" fontSize={5} fontFamily="Inter,sans-serif" fontWeight="500">S</text>
            <text x={12} y={1} textAnchor="middle" dominantBaseline="middle" fill="#ABABAB" fontSize={5} fontFamily="Inter,sans-serif" fontWeight="500">E</text>
            <text x={-12} y={1} textAnchor="middle" dominantBaseline="middle" fill="#ABABAB" fontSize={5} fontFamily="Inter,sans-serif" fontWeight="500">W</text>
          </g>

          {/* ═══ Floating Door/Window Ghost (touch freeform) ═══ */}
          {floatingDoorWinPos && (() => {
            const fx = (floatingDoorWinPos.worldX - minX) * SCALE + PAD;
            const fz = (floatingDoorWinPos.worldZ - minZ) * SCALE + PAD;
            const ghostSize = 0.8 * SCALE;
            const isDoor = floatingDoorWinPos.type === "door";
            return (
              <g opacity={0.5}>
                <rect
                  x={fx - ghostSize / 2} y={fz - ghostSize / 2}
                  width={ghostSize} height={ghostSize}
                  rx={4} ry={4}
                  fill={isDoor ? "#6B5B4D" : "#3B82F6"}
                  stroke={isDoor ? "#5C4A3A" : "#2563EB"}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
                <text x={fx} y={fz + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight={600}>
                  {isDoor ? "🚪" : "🪟"}
                </text>
              </g>
            );
          })()}

          {/* ═══ Snap Guide Lines ═══ */}
          {snapLines.map((sl, i) => {
            if (sl.axis === "x") {
              const sx = (sl.value - minX) * SCALE + PAD;
              return <line key={`snap-${i}`} x1={sx} y1={0} x2={sx} y2={svgH} stroke="#FFEAB1" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.9} />;
            } else {
              const sy = (sl.value - minZ) * SCALE + PAD;
              return <line key={`snap-${i}`} x1={0} y1={sy} x2={svgW} y2={sy} stroke="#FFEAB1" strokeWidth={1.5} strokeDasharray="6 3" opacity={0.9} />;
            }
          })}

          {/* ═══ Geometry Snap Indicator ═══ */}
          {activeSnap && (() => {
            const [snapSvgX, snapSvgY] = toSVG(activeSnap[0], activeSnap[1]);
            const isEdge = activeSnapType === "edge";
            const snapColor = isEdge ? "#60A5FA" : "#FFEAB1";
            return (
              <g className="pointer-events-none">
                {isEdge ? (
                  /* Edge snap: diamond indicator */
                  <>
                    <rect x={snapSvgX - 6} y={snapSvgY - 6} width={12} height={12} rx={2}
                      fill="none" stroke={snapColor} strokeWidth={2} opacity={0.8}
                      transform={`rotate(45,${snapSvgX},${snapSvgY})`}>
                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.8s" repeatCount="indefinite" />
                    </rect>
                    <circle cx={snapSvgX} cy={snapSvgY} r={3} fill={snapColor} opacity={0.8} />
                  </>
                ) : (
                  /* Point snap: circle indicator */
                  <>
                    <circle cx={snapSvgX} cy={snapSvgY} r={10} fill="none" stroke={snapColor} strokeWidth={2} opacity={0.8}>
                      <animate attributeName="r" values="6;12;6" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={snapSvgX} cy={snapSvgY} r={4} fill={snapColor} opacity={0.7} />
                  </>
                )}
                <line x1={snapSvgX} y1={0} x2={snapSvgX} y2={svgH} stroke={snapColor} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
                <line x1={0} y1={snapSvgY} x2={svgW} y2={snapSvgY} stroke={snapColor} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
              </g>
            );
          })()}

          {/* ═══ Snap alignment guide lines (shown during room drag/resize) ═══ */}
          {snapLines.map((sl, i) => {
            if (sl.axis === "x") {
              const [sx] = toSVG(sl.value, 0);
              return <line key={`snap-${i}`} x1={sx} y1={0} x2={sx} y2={svgH} stroke="#3B82F6" strokeWidth={1} strokeDasharray="6 3" opacity={0.7} />;
            } else {
              const [, sy] = toSVG(0, sl.value);
              return <line key={`snap-${i}`} x1={0} y1={sy} x2={svgW} y2={sy} stroke="#3B82F6" strokeWidth={1} strokeDasharray="6 3" opacity={0.7} />;
            }
          })}
        </svg>
      </div>

      {/* ═══ Build Panel ═══ */}
      <AnimatePresence>
        {showBuildPanel && (
          <BuildPanel
            isOpen={showBuildPanel}
            onClose={() => setShowBuildPanel(false)}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onAddRoomTemplate={addRoomFromTemplate}
          />
        )}
      </AnimatePresence>

      {/* ═══ Tool Bar (desktop only — mobile uses FAB) ═══ */}
      <div className="hidden md:block">
      <ToolBar activeTool={activeTool} onToolChange={(t) => {
        if (t !== "draw-walls") {
          setWallDrawPoints([]);
          setWallDrawCursor(null);
        }
        if (t !== "select") {
          setMergeSelection([]);
        }
        setActiveTool(t);
      }} onOpenFurniture={onOpenFurniturePanel} furnitureOpen={furniturePanelOpen} />
      </div>

      {/* ═══ Top-left info bar ═══ */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none max-w-[calc(50%-10px)] md:max-w-none">
        <div className="bg-[#09090B] text-white rounded-[100px] px-3 py-1.5 h-[40px] md:h-auto shadow-[0_4px_12px_rgba(0,0,0,0.2)] pointer-events-auto flex items-center gap-1.5">
          {onBack && (
            <button
              onClick={onBack}
              className="flex size-[28px] rounded-full bg-white/15 hover:bg-white/25 items-center justify-center transition-colors shrink-0 active:scale-90"
              title="Back to Dashboard"
            >
              <ChevronLeft className="size-[14px] text-white" strokeWidth={2} />
            </button>
          )}
          {houseName ? (
            <div className="hidden md:block min-w-0 flex-1">
              {isEditingName && nameInputRef ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={houseName}
                  onChange={(e) => onNameChange?.(e.target.value)}
                  onBlur={() => onStopEditing?.("Untitled Project")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onStopEditing?.("Untitled Project");
                    if (e.key === "Escape") onStopEditing?.();
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
          ) : (
            <span className="hidden md:inline font-['Inter',sans-serif] text-[12px] font-semibold tracking-[-0.3px] px-2">2D Editor</span>
          )}
          {houseName && (
            <>
              <div className="hidden md:block w-px h-[16px] bg-white/20 mx-0.5" />
              <span className="hidden md:inline font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] text-white/60 shrink-0 pr-1">
                2D
              </span>
            </>
          )}
        </div>
        <div className="hidden md:block bg-white/80 backdrop-blur-[8px] rounded-[14px] px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-white/50 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Total Area</p>
              <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px] tabular-nums">{formatArea(totalArea, unitSystem)}</p>
            </div>
            <div className="w-px h-[24px] bg-[#E5E7EB]" />
            <div>
              <p className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">Rooms</p>
              <p className="font-['Inter',sans-serif] text-[13px] font-bold text-[#09090B] tracking-[-0.3px] tabular-nums">{editableRooms.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Build Panel Toggle ═══ */}
      {!showBuildPanel && (
        null
      )}

      {/* ═══ 2D/3D Toggle — top-center (desktop), bottom-left (mobile) ═══ */}
      {onToggleMode && (
        <div className="absolute bottom-4 left-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:top-3 z-[25]">
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
      )}

      {/* ═══ Merge Rooms Toolbar ═══ */}
      <AnimatePresence>
        {mergeSelection.length > 0 && (
          <motion.div
            key="merge-toolbar"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-28 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30"
          >
            <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-[#F3F4F6] px-3 py-2 flex items-center gap-2.5 w-fit mx-auto">
              <Combine className="size-[14px] text-[#09090B]" strokeWidth={1.5} />
              <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090B] tracking-[-0.3px] whitespace-nowrap">
                Merge Rooms
              </span>
              <div className="w-px h-[20px] bg-[#E5E7EB]" />
              {/* Show selected room names */}
              <div className="flex items-center gap-1.5">
                {mergeSelection.map((roomId, idx) => {
                  const room = editableRooms.find(r => r.id === roomId);
                  return (
                    <div key={roomId} className="flex items-center gap-1">
                      <span
                        className="size-[16px] rounded-full text-white flex items-center justify-center text-[9px] font-bold font-['Inter',sans-serif] shrink-0"
                        style={{ backgroundColor: idx === 0 ? "#3B82F6" : "#A855F7" }}
                      >{idx + 1}</span>
                      <span className="font-['Inter',sans-serif] text-[11px] text-[#09090B] font-medium truncate max-w-[80px]">
                        {room?.name || "?"}
                      </span>
                      {idx === 0 && mergeSelection.length === 2 && (
                        <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] mx-0.5">+</span>
                      )}
                    </div>
                  );
                })}
                {mergeSelection.length === 1 && (
                  <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB] italic whitespace-nowrap">
                    Shift+click another room
                  </span>
                )}
              </div>
              {mergeSelection.length === 2 && (
                <>
                  <div className="w-px h-[20px] bg-[#E5E7EB]" />
                  {/* Overlap info */}
                  {(() => {
                    const roomA = editableRooms.find(r => r.id === mergeSelection[0]);
                    const roomB = editableRooms.find(r => r.id === mergeSelection[1]);
                    if (!roomA || !roomB) return null;
                    const oXMin = Math.max(roomA.bounds[0], roomB.bounds[0]);
                    const oXMax = Math.min(roomA.bounds[1], roomB.bounds[1]);
                    const oZMin = Math.max(roomA.bounds[2], roomB.bounds[2]);
                    const oZMax = Math.min(roomA.bounds[3], roomB.bounds[3]);
                    const hasOverlap = oXMin < oXMax && oZMin < oZMax;
                    const adj = Math.abs(roomA.bounds[1] - roomB.bounds[0]) < 0.05
                      || Math.abs(roomB.bounds[1] - roomA.bounds[0]) < 0.05
                      || Math.abs(roomA.bounds[3] - roomB.bounds[2]) < 0.05
                      || Math.abs(roomB.bounds[3] - roomA.bounds[2]) < 0.05;
                    return (
                      <span className={`font-['Inter',sans-serif] text-[10px] font-medium ${
                        hasOverlap ? "text-[#EF4444]" : adj ? "text-[#10B981]" : "text-[#F59E0B]"
                      }`}>
                        {hasOverlap ? "Overlapping" : adj ? "Adjacent" : "Separate"}
                      </span>
                    );
                  })()}
                  <div className="w-px h-[20px] bg-[#E5E7EB]" />
                  <button
                    onClick={mergeRooms}
                    className="h-[28px] px-3 rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] hover:bg-[#27272A] transition-colors flex items-center gap-1.5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] whitespace-nowrap"
                  >
                    <Merge className="size-[12px]" strokeWidth={2} />
                    Merge
                    <span className="text-white/40 text-[9px] font-normal ml-0.5">⌘M</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setMergeSelection([])}
                className="size-[24px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors shrink-0"
                title="Cancel merge"
              >
                <X className="size-[10px] text-[#71717A]" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Split Confirmation Toolbar ═══ */}
      <AnimatePresence>
        {splitMode && (
          <motion.div
            key="split-toolbar"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-28 left-2 right-2 md:left-1/2 md:right-auto md:-translate-x-1/2 z-30"
          >
            <div className="bg-white/90 backdrop-blur-[16.75px] rounded-[14px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-[#F3F4F6] px-3 py-2 flex items-center gap-2.5 w-fit mx-auto">
              <Scissors className="size-[14px] text-[#EF4444]" strokeWidth={1.5} />
              <span className="font-['Inter',sans-serif] text-[11px] font-semibold text-[#09090B] tracking-[-0.3px] whitespace-nowrap">
                Split Room
              </span>
              <div className="w-px h-[20px] bg-[#E5E7EB]" />
              {/* Axis toggle */}
              <div className="flex items-center gap-1 bg-[#F6F6F6] rounded-[8px] p-0.5">
                <button
                  onClick={() => setSplitMode(prev => prev ? { ...prev, axis: "v", t: 0.5 } : null)}
                  className={`px-2 py-1 rounded-[6px] font-['Inter',sans-serif] text-[10px] font-medium transition-all ${
                    splitMode.axis === "v" ? "bg-white text-[#09090B] shadow-sm" : "text-[#71717A]"
                  }`}
                >
                  L / R
                </button>
                <button
                  onClick={() => setSplitMode(prev => prev ? { ...prev, axis: "h", t: 0.5 } : null)}
                  className={`px-2 py-1 rounded-[6px] font-['Inter',sans-serif] text-[10px] font-medium transition-all ${
                    splitMode.axis === "h" ? "bg-white text-[#09090B] shadow-sm" : "text-[#71717A]"
                  }`}
                >
                  T / B
                </button>
              </div>
              <div className="w-px h-[20px] bg-[#E5E7EB]" />
              {/* Position indicator */}
              <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A] tabular-nums whitespace-nowrap">
                {Math.round(splitMode.t * 100)}%
              </span>
              <div className="w-px h-[20px] bg-[#E5E7EB]" />
              <span className="font-['Inter',sans-serif] text-[9px] text-[#ABABAB] italic whitespace-nowrap hidden md:inline">
                Drag line to position
              </span>
              <div className="w-px h-[20px] bg-[#E5E7EB]" />
              <button
                onClick={executeSplit}
                className="h-[28px] px-3 rounded-[100px] bg-[#09090B] text-white font-['Inter',sans-serif] text-[11px] font-medium tracking-[-0.3px] hover:bg-[#27272A] transition-colors flex items-center gap-1.5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] whitespace-nowrap"
              >
                <Check className="size-[12px]" strokeWidth={2} />
                Split
              </button>
              <button
                onClick={() => setSplitMode(null)}
                className="size-[24px] rounded-full bg-[#F6F6F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors shrink-0"
                title="Cancel split"
              >
                <X className="size-[10px] text-[#71717A]" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Properties Bar (bottom) ═══ */}
      <AnimatePresence>
        <PropertiesBar
          selectedRoom={selectedRoom}
          selectedElement={selectedElement}
          unitSystem={unitSystem}
          onUpdateRoom={updateRoom}
          onDeleteElement={deleteSelectedElement}
          onDuplicateRoom={duplicateRoom}
          selectedStandaloneWall={selectedElement?.type === "standalone-wall" ? standaloneWalls.find(w => w.id === selectedElement.wallId) || null : null}
          onUpdateStandaloneWall={(id, updates) => setStandaloneWalls(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))}
          onSplitH={() => {
            if (selectedElement?.type === "room") {
              setSplitMode({ roomId: selectedElement.roomId, axis: "h", t: 0.5 });
            }
          }}
          onSplitV={() => {
            if (selectedElement?.type === "room") {
              setSplitMode({ roomId: selectedElement.roomId, axis: "v", t: 0.5 });
            }
          }}
        />
      </AnimatePresence>

      {/* ═══ Zoom indicator (desktop only — mobile has 2D/3D toggle at bottom-left) ═══ */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-20 hidden md:block">
        <div className="bg-white/60 backdrop-blur-[8px] rounded-[100px] px-3 py-1.5 border border-white/30">
          <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A] tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* ═══ Help tips ═══ */}
      <div className="absolute bottom-4 right-4 pointer-events-none z-20 hidden md:block">
        <div className="bg-white/60 backdrop-blur-[8px] rounded-[100px] px-3 py-1.5 border border-white/30">
          <span className="font-['Inter',sans-serif] text-[10px] text-[#71717A]">
            {activeTool === "select" && (splitMode ? "Drag split line · L/R or T/B · Enter to confirm · Esc to cancel" : "Click to select · Drag to move · Shift+click to merge (⌘M) · ✂ to split room")}
            {activeTool === "draw-room" && "Click & drag to draw a room · Release to create"}
            {activeTool === "draw-walls" && (wallDrawPoints.length === 0 ? "Click to start drawing a wall · Snaps to edges & corners" : `${wallDrawPoints.length} point${wallDrawPoints.length > 1 ? "s" : ""} · Click to add · Double-click to finish · Esc to cancel`)}
            {activeTool === "add-door" && "Click on any wall to add a door"}
            {activeTool === "add-window" && "Click on any wall to add a window"}
            {activeTool === "delete" && "Click any element to delete it"}
          </span>
        </div>
      </div>

      {/* ═══ Active tool indicator (floating, desktop only) ═══ */}
      {activeTool !== "select" && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-14 right-4 z-[25] hidden md:block"
        >
          <div className="bg-[#09090B] text-white rounded-[100px] px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center gap-2">
            <span className="font-['Inter',sans-serif] text-[11px] font-medium">
              {activeTool === "draw-room" && "Drawing Room"}
              {activeTool === "draw-walls" && "Drawing Walls"}
              {activeTool === "add-door" && "Placing Door"}
              {activeTool === "add-window" && "Placing Window"}
              {activeTool === "delete" && "Delete Mode"}
            </span>
            <button
              onClick={() => setActiveTool("select")}
              className="size-[20px] rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="size-[10px]" strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ Mobile FAB + Radial Menu (bottom-right) — hidden when MobileBottomNav is used ═══ */}
      {!useMobileBottomNav && <div className="md:hidden absolute bottom-4 right-3 z-[35]">
        <AnimatePresence>
          {mobileFabOpen && (
            <>
              {/* Backdrop to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[34]"
                onClick={() => setMobileFabOpen(false)}
              />
              {/* Menu items - stacked upward */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="absolute bottom-[58px] right-0 z-[36] flex flex-col gap-2 items-end"
              >
                {([
                  { id: "draw-room" as EditorTool, icon: Square, label: "Draw Room" },
                  { id: "draw-walls" as EditorTool, icon: PenTool, label: "Draw Walls" },
                  { id: "add-door" as EditorTool, icon: DoorOpen, label: "Add Door" },
                  { id: "add-window" as EditorTool, icon: Grid3X3, label: "Add Window" },
                ] as const).map(({ id, icon: Icon, label }, i) => (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      if (id !== "draw-walls") { setWallDrawPoints([]); setWallDrawCursor(null); }
                      if (id !== "select") { setMergeSelection([]); setSplitMode(null); }
                      setActiveTool(activeTool === id ? "select" : id);
                      setMobileFabOpen(false);
                    }}
                    className={`flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all active:scale-95 ${
                      activeTool === id
                        ? "bg-[#09090B] text-white"
                        : "bg-white text-[#09090B] border border-[#F3F4F6]"
                    }`}
                  >
                    <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">{label}</span>
                    <div className={`size-[32px] rounded-[10px] flex items-center justify-center ${
                      activeTool === id ? "bg-white/15" : "bg-[#F6F6F6]"
                    }`}>
                      <Icon className="size-[15px]" strokeWidth={1.5} />
                    </div>
                  </motion.button>
                ))}
                {/* Add Furniture */}
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.12 }}
                  onClick={() => {
                    onOpenFurniturePanel?.();
                    setMobileFabOpen(false);
                  }}
                  className={`flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all active:scale-95 ${
                    furniturePanelOpen
                      ? "bg-[#09090B] text-white"
                      : "bg-white text-[#09090B] border border-[#F3F4F6]"
                  }`}
                >
                  <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">Furniture</span>
                  <div className={`size-[32px] rounded-[10px] flex items-center justify-center ${
                    furniturePanelOpen ? "bg-white/15" : "bg-[#F6F6F6]"
                  }`}>
                    <Sofa className="size-[15px]" strokeWidth={1.5} />
                  </div>
                </motion.button>
                {/* Undo / Redo row */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <button
                    onClick={() => { parentOnUndo?.(); }}
                    disabled={!parentCanUndo}
                    className={`size-[40px] rounded-[12px] bg-white border border-[#F3F4F6] shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all active:scale-95 ${
                      parentCanUndo ? "text-[#09090B]" : "text-[#C0C0C0]"
                    }`}
                  >
                    <Undo2 className="size-[16px]" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => { parentOnRedo?.(); }}
                    disabled={!parentCanRedo}
                    className={`size-[40px] rounded-[12px] bg-white border border-[#F3F4F6] shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all active:scale-95 ${
                      parentCanRedo ? "text-[#09090B]" : "text-[#C0C0C0]"
                    }`}
                  >
                    <Redo2 className="size-[16px]" strokeWidth={1.5} />
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Active tool badge above FAB */}
        <AnimatePresence>
          {activeTool !== "select" && !mobileFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-2 flex justify-center"
            >
              <div className="bg-[#09090B] text-white rounded-[100px] px-2.5 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center gap-1.5">
                <span className="font-['Inter',sans-serif] text-[10px] font-medium tracking-[-0.2px] whitespace-nowrap">
                  {activeTool === "draw-room" && "Drawing Room"}
                  {activeTool === "draw-walls" && "Drawing Walls"}
                  {activeTool === "add-door" && "Placing Door"}
                  {activeTool === "add-window" && "Placing Window"}
                </span>
                <button
                  onClick={() => setActiveTool("select")}
                  className="size-[16px] rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="size-[8px]" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <button
          onClick={() => setMobileFabOpen(f => !f)}
          className={`size-[50px] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-200 active:scale-90 relative z-[37] ${
            mobileFabOpen
              ? "bg-white text-[#09090B] border border-[#F3F4F6]"
              : "bg-[#09090B] text-white"
          }`}
        >
          <motion.div
            animate={{ rotate: mobileFabOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Plus className="size-[22px]" strokeWidth={2} />
          </motion.div>
        </button>
      </div>}
    </div>
  );
}

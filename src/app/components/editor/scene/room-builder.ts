/* ═══════════════════════════════════════════════════════
   Room Geometry Utilities
   Pure functions for room geometry, shared walls, and coordinate conversion.
   Extracted from FloorPlan3DEditor.tsx — these functions are stateless.
   ═══════════════════════════════════════════════════════ */
import type { HouseRoomDef, RoomBounds, SharedWallData, SharedWallNeighbor } from "../types";
import { WALL_THICK } from "../constants";

// ── Point-in-Polygon / Box-in-Polygon ──

export function pointInPoly(poly: [number, number][], px: number, pz: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (((zi > pz) !== (zj > pz)) && (px < (xj - xi) * (pz - zi) / (zj - zi) + xi))
      inside = !inside;
  }
  return inside;
}

export function boxInPoly(poly: [number, number][], bMinX: number, bMaxX: number, bMinZ: number, bMaxZ: number): boolean {
  return pointInPoly(poly, bMinX, bMinZ) && pointInPoly(poly, bMaxX, bMinZ) &&
         pointInPoly(poly, bMinX, bMaxZ) && pointInPoly(poly, bMaxX, bMaxZ);
}

// ── Polygon Inset ──

export function insetPolygon(poly: [number, number][], dist: number): [number, number][] {
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

// ── Room Bounds ──

export function getRoomBounds(def: HouseRoomDef): RoomBounds {
  const inset = WALL_THICK + 0.03;
  const rb: RoomBounds = { minX: def.bounds[0] + inset, maxX: def.bounds[1] - inset, minZ: def.bounds[2] + inset, maxZ: def.bounds[3] - inset };
  if (def.polygon && def.polygon.length >= 3) {
    rb.polygon = insetPolygon(def.polygon, inset);
  }
  return rb;
}

export function isPointInRoom(def: HouseRoomDef, x: number, z: number, inset: number): boolean {
  if (x < def.bounds[0] + inset || x > def.bounds[1] - inset ||
      z < def.bounds[2] + inset || z > def.bounds[3] - inset) return false;
  if (def.polygon && def.polygon.length >= 3) {
    return pointInPoly(insetPolygon(def.polygon, inset), x, z);
  }
  return true;
}

export function isBoxInRoom(def: HouseRoomDef, bMinX: number, bMaxX: number, bMinZ: number, bMaxZ: number, inset: number): boolean {
  if (bMinX < def.bounds[0] + inset || bMaxX > def.bounds[1] - inset ||
      bMinZ < def.bounds[2] + inset || bMaxZ > def.bounds[3] - inset) return false;
  if (def.polygon && def.polygon.length >= 3) {
    return boxInPoly(insetPolygon(def.polygon, inset), bMinX, bMaxX, bMinZ, bMaxZ);
  }
  return true;
}

export function findRoomForPosition(defs: HouseRoomDef[], x: number, z: number): string | null {
  const inset = WALL_THICK + 0.03;
  for (const def of defs) {
    if (isPointInRoom(def, x, z, inset)) return def.id;
  }
  return null;
}

export function findRoomForBox(defs: HouseRoomDef[], minX: number, maxX: number, minZ: number, maxZ: number): string | null {
  const inset = WALL_THICK + 0.03;
  for (const def of defs) {
    if (isBoxInRoom(def, minX, maxX, minZ, maxZ, inset)) return def.id;
  }
  return null;
}

// ── Coordinate Conversion ──

export function convertTBetweenWalls(
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

export function computeOpeningWorldPos(def: HouseRoomDef, side: string, t: number): [number, number] {
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

// ── Shared Wall Detection ──

export function computeSharedWallData(defs: HouseRoomDef[]): Map<string, SharedWallData> {
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

      // Polygon inner-edge shared wall detection
      const checkPolyEdgesVsBounds = (polyRoom: HouseRoomDef, rectRoom: HouseRoomDef) => {
        if (!polyRoom.polygon) return;
        const poly = polyRoom.polygon;
        const [rxMin, rxMax, rzMin, rzMax] = rectRoom.bounds;
        const [pxMin, pxMax, pzMin, pzMax] = polyRoom.bounds;
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
          if (!eIsHoriz && !eIsVert) continue;
          const eMinX = Math.min(ep1[0], ep2[0]), eMaxX = Math.max(ep1[0], ep2[0]);
          const eMinZ = Math.min(ep1[1], ep2[1]), eMaxZ = Math.max(ep1[1], ep2[1]);
          const enx = pNormSign * edz / eLen;
          const enz = pNormSign * (-edx) / eLen;
          let polySide: string;
          if (eIsHoriz) polySide = enz > 0 ? "north" : "south";
          else polySide = enx > 0 ? "east" : "west";
          if (eIsHoriz) {
            const edgeZ = ep1[1];
            if (Math.abs(edgeZ - pzMin) < T || Math.abs(edgeZ - pzMax) < T) continue;
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

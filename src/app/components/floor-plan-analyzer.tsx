/**
 * Floor Plan Analyzer — Client-side 2D-to-3D Pipeline
 *
 * Implements a simplified version of the 6-stage pipeline described in
 * "2D Floor Plan to 3D Model Conversion — Full Technical Pipeline":
 *
 *   Stage 1: Preprocessing (grayscale, contrast, threshold)
 *   Stage 2: Text/Graphics separation (simplified — threshold only)
 *   Stage 3: Structural element detection (wall pixel classification)
 *   Stage 4: Room contour extraction (flood fill + bounding boxes)
 *   Stage 5: Vectorization (contour → polygon bounds)
 *   Stage 6: 3D reconstruction data (→ HouseRoomDef-compatible output)
 *
 * This runs entirely on the client via the Canvas API.
 */

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export interface DetectedRoom {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number]; // xMin, xMax, zMin, zMax (meters)
  pixelBounds: { x: number; y: number; w: number; h: number };
  area: number; // m²
  color: string;
  type: RoomType;
}

export interface AnalysisResult {
  rooms: DetectedRoom[];
  totalWidth: number;  // meters
  totalDepth: number;  // meters
  wallPixels: number;
  imageWidth: number;
  imageHeight: number;
  sourceImage: string; // data URL of original
  processedImage: string; // data URL of processed visualization
  pixelsPerMeter: number;
  confidence: number;
}

type RoomType =
  | "living"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "corridor"
  | "store"
  | "balcony"
  | "dining"
  | "unknown";

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const ANALYSIS_SIZE = 512; // Resize input to this (Stage 1)
const WALL_THRESHOLD = 100; // Pixels darker than this = wall
const MIN_ROOM_AREA_RATIO = 0.005; // Minimum room area as fraction of image
const MAX_ROOMS = 15;
const DEFAULT_CEILING_H = 2.6; // meters (HDB standard)

const ROOM_ACCENTS = [
  "#E8A87C", "#6BA3BE", "#8B6B4E", "#A09070", "#8CAA7C",
  "#5AB5A0", "#7CA5B8", "#9E9E9E", "#B58DAE", "#C4A46C",
];

const ROOM_FLOOR_COLORS: Record<RoomType, string> = {
  kitchen: "#C8C3BC",
  bathroom: "#D6E4E0",
  bedroom: "#D4B896",
  living: "#E8DCCA",
  dining: "#D8CCB8",
  corridor: "#D8CCB8",
  store: "#B8B0A6",
  balcony: "#B0B0B0",
  unknown: "#D0D0D0",
};

const ROOM_WALL_COLORS: Record<RoomType, string> = {
  kitchen: "#FAFAFA",
  bathroom: "#F0F0F0",
  bedroom: "#F5F0E8",
  living: "#FAFAFA",
  dining: "#FAFAFA",
  corridor: "#FAFAFA",
  store: "#F5F5F5",
  balcony: "#E0E0E0",
  unknown: "#FAFAFA",
};

/* ═══════════════════════════════════════════════════════
   Stage 1 — Preprocessing
   ═══════════════════════════════════════════════════════ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function toGrayscale(data: Uint8ClampedArray): Uint8Array {
  const gray = new Uint8Array(data.length / 4);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

/** Adaptive threshold using local mean (Sauvola-inspired) */
function adaptiveThreshold(
  gray: Uint8Array,
  w: number,
  h: number,
  blockSize = 31,
  k = 0.2
): Uint8Array {
  const result = new Uint8Array(w * h);
  const half = Math.floor(blockSize / 2);

  // Build integral image for fast local mean
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] =
        rowSum + integral[y * (w + 1) + (x + 1)];
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half);
      const y0 = Math.max(0, y - half);
      const x1 = Math.min(w - 1, x + half);
      const y1 = Math.min(h - 1, y + half);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (w + 1) + (x1 + 1)] -
        integral[y0 * (w + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (w + 1) + x0] +
        integral[y0 * (w + 1) + x0];
      const mean = sum / count;
      const threshold = mean * (1 - k);
      result[y * w + x] = gray[y * w + x] < threshold ? 0 : 255;
    }
  }
  return result;
}

/** CLAHE-inspired contrast enhancement */
function enhanceContrast(gray: Uint8Array): Uint8Array {
  let min = 255, max = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const range = max - min || 1;
  const result = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    result[i] = Math.round(((gray[i] - min) / range) * 255);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   Stage 3 — Wall Detection (Simplified Segmentation)
   ═══════════════════════════════════════════════════════ */

function detectWalls(
  binary: Uint8Array,
  w: number,
  h: number
): Uint8Array {
  // Wall pixels = dark pixels (value 0 in binary image)
  const walls = new Uint8Array(w * h);
  for (let i = 0; i < walls.length; i++) {
    walls[i] = binary[i] === 0 ? 1 : 0;
  }

  // Morphological close (dilate then erode) to connect nearby wall segments
  const dilated = morphDilate(walls, w, h, 2);
  const closed = morphErode(dilated, w, h, 1);
  return closed;
}

function morphDilate(
  data: Uint8Array,
  w: number,
  h: number,
  radius: number
): Uint8Array {
  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let dy = -radius; dy <= radius && !val; dy++) {
        for (let dx = -radius; dx <= radius && !val; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (data[ny * w + nx]) val = 1;
          }
        }
      }
      result[y * w + x] = val;
    }
  }
  return result;
}

function morphErode(
  data: Uint8Array,
  w: number,
  h: number,
  radius: number
): Uint8Array {
  const result = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 1;
      for (let dy = -radius; dy <= radius && val; dy++) {
        for (let dx = -radius; dx <= radius && val; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (!data[ny * w + nx]) val = 0;
          } else {
            val = 0;
          }
        }
      }
      result[y * w + x] = val;
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   Stage 4 — Room Detection (Flood Fill)
   ═══════════════════════════════════════════════════════ */

interface RawRegion {
  id: number;
  pixels: number;
  minX: number; maxX: number;
  minY: number; maxY: number;
  cx: number; cy: number;
}

function floodFillRooms(
  walls: Uint8Array,
  w: number,
  h: number
): { labels: Int32Array; regions: RawRegion[] } {
  const labels = new Int32Array(w * h).fill(-1);
  const regions: RawRegion[] = [];
  let nextId = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (walls[idx] === 1 || labels[idx] >= 0) continue;

      // BFS flood fill
      const region: RawRegion = {
        id: nextId,
        pixels: 0,
        minX: x, maxX: x,
        minY: y, maxY: y,
        cx: 0, cy: 0,
      };
      const queue = [idx];
      labels[idx] = nextId;
      let sumX = 0, sumY = 0;

      while (queue.length > 0) {
        const ci = queue.pop()!;
        const cx = ci % w;
        const cy = Math.floor(ci / w);
        region.pixels++;
        sumX += cx;
        sumY += cy;
        if (cx < region.minX) region.minX = cx;
        if (cx > region.maxX) region.maxX = cx;
        if (cy < region.minY) region.minY = cy;
        if (cy > region.maxY) region.maxY = cy;

        // 4-connected neighbors
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const ni = ny * w + nx;
            if (walls[ni] === 0 && labels[ni] < 0) {
              labels[ni] = nextId;
              queue.push(ni);
            }
          }
        }
      }

      region.cx = sumX / region.pixels;
      region.cy = sumY / region.pixels;
      regions.push(region);
      nextId++;
    }
  }

  return { labels, regions };
}

/* ═══════════════════════════════════════════════════════
   Stage 5 — Vectorization & Room Classification
   ═══════════════════════════════════════════════════════ */

function classifyRoom(
  region: RawRegion,
  allRegions: RawRegion[],
  imgW: number,
  imgH: number,
  index: number
): RoomType {
  const rw = region.maxX - region.minX;
  const rh = region.maxY - region.minY;
  const aspect = rw / (rh || 1);
  const relArea = region.pixels / (imgW * imgH);
  const isNarrow = aspect > 3 || aspect < 0.33;
  const isSmall = relArea < 0.02;
  const isTiny = relArea < 0.008;

  // Sort regions by area to identify largest (likely living room)
  const sorted = [...allRegions].sort((a, b) => b.pixels - a.pixels);
  const rank = sorted.findIndex((r) => r.id === region.id);

  // Heuristic: narrow and small = corridor or balcony
  if (isNarrow && isTiny) return "balcony";
  if (isNarrow) return "corridor";
  if (isTiny) return "store";

  // Largest room = living
  if (rank === 0) return "living";
  // Second largest often kitchen/dining
  if (rank === 1) return "kitchen";
  // Small rooms near edges could be bathrooms
  if (isSmall && (aspect > 0.7 && aspect < 1.5)) return "bathroom";
  // Medium rooms = bedrooms
  if (rank <= 3) return "bedroom";

  return "unknown";
}

function generateRoomLabel(type: RoomType, index: number, counts: Record<string, number>): { label: string; shortLabel: string } {
  counts[type] = (counts[type] || 0) + 1;
  const n = counts[type];
  const labels: Record<RoomType, [string, string]> = {
    living: ["Living Room", "Living"],
    bedroom: [`Bedroom ${n}`, `Bed ${n}`],
    kitchen: ["Kitchen / Dining", "Kitchen"],
    bathroom: [`Bath / WC ${n}`, `Bath ${n}`],
    corridor: ["Corridor", "Corridor"],
    store: ["Store Room", "Store"],
    balcony: ["Access Balcony", "Balcony"],
    dining: ["Dining Room", "Dining"],
    unknown: [`Room ${index + 1}`, `Room ${index + 1}`],
  };
  const [label, shortLabel] = labels[type];
  return { label, shortLabel };
}

/* ═══════════════════════════════════════════════════════
   Stage 6 — Convert to 3D-ready HouseRoomDef data
   ═══════════════════════════════════════════════════════ */

function pixelBoundsToMeters(
  region: RawRegion,
  ppm: number,
  offsetX: number,
  offsetZ: number
): [number, number, number, number] {
  const xMin = (region.minX / ppm) - offsetX;
  const xMax = (region.maxX / ppm) - offsetX;
  const zMin = (region.minY / ppm) - offsetZ;
  const zMax = (region.maxY / ppm) - offsetZ;
  return [xMin, xMax, zMin, zMax];
}

/* ═══════════════════════════════════════════════════════
   Visualization — Draw analysis overlay
   ═══════════════════════════════════════════════════════ */

function drawVisualization(
  sourceImg: HTMLImageElement,
  walls: Uint8Array,
  labels: Int32Array,
  regions: RawRegion[],
  validRegions: RawRegion[],
  w: number,
  h: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Draw original image as background (dimmed)
  ctx.drawImage(sourceImg, 0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(0, 0, w, h);

  // Color-code detected rooms
  const validIds = new Set(validRegions.map((r) => r.id));
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < labels.length; i++) {
    const lbl = labels[i];
    if (lbl >= 0 && validIds.has(lbl)) {
      const regionIdx = validRegions.findIndex((r) => r.id === lbl);
      if (regionIdx >= 0) {
        const hex = ROOM_ACCENTS[regionIdx % ROOM_ACCENTS.length];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        data[i * 4] = Math.round(data[i * 4] * 0.4 + r * 0.6);
        data[i * 4 + 1] = Math.round(data[i * 4 + 1] * 0.4 + g * 0.6);
        data[i * 4 + 2] = Math.round(data[i * 4 + 2] * 0.4 + b * 0.6);
        data[i * 4 + 3] = 200;
      }
    }
    // Draw walls
    if (walls[i]) {
      data[i * 4] = 9;
      data[i * 4 + 1] = 9;
      data[i * 4 + 2] = 11;
      data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Draw room labels
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < validRegions.length; i++) {
    const r = validRegions[i];
    const hex = ROOM_ACCENTS[i % ROOM_ACCENTS.length];
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const textW = ctx.measureText(`Room ${i + 1}`).width + 12;
    ctx.beginPath();
    ctx.roundRect(r.cx - textW / 2, r.cy - 9, textW, 18, 4);
    ctx.fill();
    ctx.fillStyle = hex;
    ctx.fillText(`Room ${i + 1}`, r.cx, r.cy);
  }

  return canvas.toDataURL("image/png");
}

/* ═══════════════════════════════════════════════════════
   Main Analysis Function — Full Pipeline
   ═══════════════════════════════════════════════════════ */

export async function analyzeFloorPlan(
  imageDataUrl: string,
  onProgress?: (stage: string, pct: number) => void
): Promise<AnalysisResult> {
  const report = (stage: string, pct: number) => onProgress?.(stage, pct);

  // ─── Stage 1: Preprocessing ───
  report("Loading image...", 5);
  const img = await loadImage(imageDataUrl);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  // Resize to analysis size while preserving aspect ratio
  const scale = Math.min(ANALYSIS_SIZE / origW, ANALYSIS_SIZE / origH);
  const w = Math.round(origW * scale);
  const h = Math.round(origH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);

  report("Preprocessing...", 15);
  let gray = toGrayscale(imgData.data);
  gray = enhanceContrast(gray);

  // ─── Stage 2 & 3: Wall Detection ───
  report("Detecting walls...", 30);
  const binary = adaptiveThreshold(gray, w, h, 25, 0.15);
  const walls = detectWalls(binary, w, h);

  let wallCount = 0;
  for (let i = 0; i < walls.length; i++) if (walls[i]) wallCount++;

  // ─── Stage 4: Room Detection ───
  report("Identifying rooms...", 50);
  const { labels, regions } = floodFillRooms(walls, w, h);

  // Filter: only keep significant regions (not background / tiny gaps)
  const totalPixels = w * h;
  const minPixels = totalPixels * MIN_ROOM_AREA_RATIO;
  let validRegions = regions
    .filter((r) => r.pixels >= minPixels)
    // Exclude the largest region if it's the background (>60% of image)
    .filter((r) => r.pixels < totalPixels * 0.6)
    .sort((a, b) => b.pixels - a.pixels)
    .slice(0, MAX_ROOMS);

  // If no rooms detected, create a single room from the full image
  if (validRegions.length === 0) {
    validRegions = [{
      id: 0, pixels: totalPixels * 0.5,
      minX: Math.round(w * 0.05), maxX: Math.round(w * 0.95),
      minY: Math.round(h * 0.05), maxY: Math.round(h * 0.95),
      cx: w / 2, cy: h / 2,
    }];
  }

  // ─── Stage 5: Vectorization ───
  report("Extracting geometry...", 70);

  // Estimate scale: assume typical floor plan shows ~8-12m total width
  const estimatedTotalWidth = 8 + validRegions.length * 0.5; // rough heuristic
  const ppm = w / estimatedTotalWidth; // pixels per meter
  const totalW = w / ppm;
  const totalD = h / ppm;
  const offsetX = totalW / 2;
  const offsetZ = totalD / 2;

  // ─── Stage 6: Build room definitions ───
  report("Building 3D model...", 85);
  const counts: Record<string, number> = {};
  const rooms: DetectedRoom[] = validRegions.map((region, i) => {
    const type = classifyRoom(region, validRegions, w, h, i);
    const { label, shortLabel } = generateRoomLabel(type, i, counts);
    const bounds = pixelBoundsToMeters(region, ppm, offsetX, offsetZ);
    const rw = bounds[1] - bounds[0];
    const rd = bounds[3] - bounds[2];

    return {
      id: `room-${i}`,
      label,
      shortLabel,
      bounds,
      pixelBounds: {
        x: region.minX,
        y: region.minY,
        w: region.maxX - region.minX,
        h: region.maxY - region.minY,
      },
      area: rw * rd,
      color: ROOM_FLOOR_COLORS[type],
      type,
    };
  });

  // Generate visualization
  report("Generating preview...", 95);
  const processedImage = drawVisualization(
    img, walls, labels, regions, validRegions, w, h
  );

  report("Complete!", 100);

  return {
    rooms,
    totalWidth: totalW,
    totalDepth: totalD,
    wallPixels: wallCount,
    imageWidth: origW,
    imageHeight: origH,
    sourceImage: imageDataUrl,
    processedImage,
    pixelsPerMeter: ppm,
    confidence: Math.min(0.95, 0.4 + validRegions.length * 0.08),
  };
}

/* ═══════════════════════════════════════════════════════
   Convert AnalysisResult → HouseRoomDef-compatible format
   (stored in sessionStorage for the editor to consume)
   ═══════════════════════════════════════════════════════ */

export interface ParsedHouseRoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number];
  floorColor: string;
  wallColor: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  svg: { x: number; y: number; w: number; h: number };
  accent: string;
  furniture: [string, number, number, number, number][];
  doors: { side: "north" | "south" | "east" | "west"; t: number; w: number }[];
  windows: { side: "north" | "south" | "east" | "west"; t: number; w: number; h: number; sillH: number }[];
  defaultMaterials: { walls: string; floors: string; ceiling: string };
  defaultLighting: { timeOfDay: number; intensity: number; ceilingLight: boolean; floorLamp: boolean; accentLight: boolean; underCabinet: boolean };
}

export function analysisToHouseRoomDefs(result: AnalysisResult): ParsedHouseRoomDef[] {
  return result.rooms.map((room, i) => {
    const [xMin, xMax, zMin, zMax] = room.bounds;
    const cx = (xMin + xMax) / 2;
    const cz = (zMin + zMax) / 2;
    const rw = xMax - xMin;
    const rd = zMax - zMin;

    // Camera: look at center from slightly above and to the side
    const cameraPos: [number, number, number] = [
      cx + rw * 0.4,
      DEFAULT_CEILING_H * 0.6,
      cz + rd * 0.4,
    ];
    const cameraTarget: [number, number, number] = [cx, DEFAULT_CEILING_H * 0.35, cz];

    // SVG layout positioning (for the 2D minimap)
    const svgScale = 30;
    const svgX = room.pixelBounds.x * (svgScale / (result.imageWidth / ANALYSIS_SIZE));
    const svgY = room.pixelBounds.y * (svgScale / (result.imageHeight / ANALYSIS_SIZE));
    const svgW = room.pixelBounds.w * (svgScale / (result.imageWidth / ANALYSIS_SIZE));
    const svgH = room.pixelBounds.h * (svgScale / (result.imageHeight / ANALYSIS_SIZE));

    // Add windows on exterior walls (heuristic: walls near plan edges)
    const windows: ParsedHouseRoomDef["windows"] = [];
    const halfTotalW = result.totalWidth / 2;
    const halfTotalD = result.totalDepth / 2;
    if (Math.abs(xMax - halfTotalW) < 0.5) {
      windows.push({ side: "east", t: 0.5, w: Math.min(rw * 0.4, 1.2), h: 1.2, sillH: 0.9 });
    }
    if (Math.abs(xMin + halfTotalW) < 0.5) {
      windows.push({ side: "west", t: 0.5, w: Math.min(rw * 0.4, 1.2), h: 1.2, sillH: 0.9 });
    }
    if (Math.abs(zMin + halfTotalD) < 0.5) {
      windows.push({ side: "north", t: 0.5, w: Math.min(rd * 0.4, 1.2), h: 1.2, sillH: 0.9 });
    }

    // Add a door connecting to an adjacent room
    const doors: ParsedHouseRoomDef["doors"] = [];
    if (i > 0) {
      // Find the shared wall side with the previous room
      const prev = result.rooms[i - 1];
      const [pxMin, pxMax, pzMin, pzMax] = prev.bounds;
      if (Math.abs(xMin - pxMax) < 0.3) doors.push({ side: "west", t: 0.4, w: 0.7 });
      else if (Math.abs(xMax - pxMin) < 0.3) doors.push({ side: "east", t: 0.4, w: 0.7 });
      else if (Math.abs(zMin - pzMax) < 0.3) doors.push({ side: "north", t: 0.4, w: 0.7 });
      else if (Math.abs(zMax - pzMin) < 0.3) doors.push({ side: "south", t: 0.4, w: 0.7 });
      else doors.push({ side: "south", t: 0.4, w: 0.7 });
    }

    // Material defaults based on room type
    const materialMap: Record<RoomType, { walls: string; floors: string }> = {
      kitchen: { walls: "Subway Tile", floors: "Porcelain Tile (White)" },
      bathroom: { walls: "White Paint", floors: "Mosaic Tile" },
      bedroom: { walls: "Warm White Paint", floors: "Vinyl Plank (Light Oak)" },
      living: { walls: "White Paint", floors: "Engineered Wood (Ash)" },
      dining: { walls: "White Paint", floors: "Porcelain Tile (Gray)" },
      corridor: { walls: "White Paint", floors: "Porcelain Tile (Gray)" },
      store: { walls: "White Paint", floors: "Cement Screed" },
      balcony: { walls: "Concrete", floors: "Cement Screed" },
      unknown: { walls: "White Paint", floors: "Porcelain Tile (White)" },
    };
    const mats = materialMap[room.type];

    return {
      id: room.id,
      label: room.label,
      shortLabel: room.shortLabel,
      bounds: room.bounds,
      floorColor: room.color,
      wallColor: ROOM_WALL_COLORS[room.type],
      cameraPos,
      cameraTarget,
      svg: { x: svgX, y: svgY, w: svgW, h: svgH },
      accent: ROOM_ACCENTS[i % ROOM_ACCENTS.length],
      furniture: [],
      doors,
      windows,
      defaultMaterials: { walls: mats.walls, floors: mats.floors, ceiling: "Flat White" },
      defaultLighting: {
        timeOfDay: room.type === "bedroom" ? 16 : 14,
        intensity: room.type === "balcony" ? 100 : 85,
        ceilingLight: true,
        floorLamp: room.type === "living" || room.type === "bedroom",
        accentLight: room.type === "bedroom",
        underCabinet: room.type === "kitchen",
      },
    };
  });
}

/* ═══════════════════════════════════════════════════════
   AI-Powered Floor Plan Analysis (via kie.ai Gemini Vision)
   Sends the image to the backend which calls the vision API
   and returns structured room definitions.
   ═══════════════════════════════════════════════════════ */

interface AIRoomData {
  id: string;
  label: string;
  shortLabel: string;
  type: string;
  boundsM: { xMin: number; xMax: number; zMin: number; zMax: number };
  widthM: number;
  depthM: number;
  areaM2: number;
  // These fields are optional — the simplified 2D prompt may not include them
  floorColor?: string;
  wallColor?: string;
  doors: { wall: string; positionRatio: number; widthM: number }[];
  windows: { wall: string; positionRatio: number; widthM: number; heightM: number; sillHeightM: number }[];
  suggestedMaterials?: { walls: string; floors: string; ceiling: string };
  suggestedLighting?: { timeOfDay: number; intensity: number; ceilingLight: boolean; floorLamp: boolean; accentLight: boolean; underCabinet: boolean };
}

interface AIAnalysisResponse {
  planName: string;
  totalWidthM: number;
  totalDepthM: number;
  rooms: AIRoomData[];
  confidence: number;
}

// Defaults applied client-side based on room type — keeps AI prompt focused on geometry
const MATERIAL_DEFAULTS: Record<string, { walls: string; floors: string; ceiling: string }> = {
  kitchen: { walls: "Subway Tile", floors: "Porcelain Tile (White)", ceiling: "Flat White" },
  bathroom: { walls: "White Paint", floors: "Mosaic Tile", ceiling: "Flat White" },
  bedroom: { walls: "Warm White Paint", floors: "Vinyl Plank (Light Oak)", ceiling: "Flat White" },
  living: { walls: "White Paint", floors: "Engineered Wood (Ash)", ceiling: "Flat White" },
  dining: { walls: "White Paint", floors: "Engineered Wood (Ash)", ceiling: "Flat White" },
  corridor: { walls: "White Paint", floors: "Porcelain Tile (Gray)", ceiling: "Flat White" },
  store: { walls: "White Paint", floors: "Cement Screed", ceiling: "Flat White" },
  utility: { walls: "White Paint", floors: "Cement Screed", ceiling: "Flat White" },
  balcony: { walls: "Concrete", floors: "Cement Screed", ceiling: "Concrete" },
  unknown: { walls: "White Paint", floors: "Porcelain Tile (White)", ceiling: "Flat White" },
};

const LIGHTING_DEFAULTS: Record<string, { timeOfDay: number; intensity: number; ceilingLight: boolean; floorLamp: boolean; accentLight: boolean; underCabinet: boolean }> = {
  kitchen: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: true },
  bathroom: { timeOfDay: 12, intensity: 100, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  bedroom: { timeOfDay: 16, intensity: 85, ceilingLight: true, floorLamp: true, accentLight: true, underCabinet: false },
  living: { timeOfDay: 14, intensity: 85, ceilingLight: true, floorLamp: true, accentLight: false, underCabinet: false },
  dining: { timeOfDay: 14, intensity: 85, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  corridor: { timeOfDay: 14, intensity: 80, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  store: { timeOfDay: 14, intensity: 80, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  utility: { timeOfDay: 14, intensity: 80, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
  balcony: { timeOfDay: 14, intensity: 100, ceilingLight: false, floorLamp: false, accentLight: false, underCabinet: false },
  unknown: { timeOfDay: 14, intensity: 85, ceilingLight: true, floorLamp: false, accentLight: false, underCabinet: false },
};

function aiRoomToHouseRoomDef(room: AIRoomData, _index: number): ParsedHouseRoomDef {
  const { boundsM } = room;
  const cx = (boundsM.xMin + boundsM.xMax) / 2;
  const cz = (boundsM.zMin + boundsM.zMax) / 2;
  const rw = boundsM.xMax - boundsM.xMin;
  const rd = boundsM.zMax - boundsM.zMin;
  const roomType = room.type || "unknown";

  // Apply floor/wall colors from room type if AI didn't provide them
  const floorColor = room.floorColor || ROOM_FLOOR_COLORS[roomType as RoomType] || "#D0D0D0";
  const wallColor = room.wallColor || ROOM_WALL_COLORS[roomType as RoomType] || "#FAFAFA";

  // Apply materials/lighting defaults from room type
  const matDefaults = MATERIAL_DEFAULTS[roomType] || MATERIAL_DEFAULTS.unknown;
  const lightDefaults = LIGHTING_DEFAULTS[roomType] || LIGHTING_DEFAULTS.unknown;

  return {
    id: room.id,
    label: room.label,
    shortLabel: room.shortLabel,
    bounds: [boundsM.xMin, boundsM.xMax, boundsM.zMin, boundsM.zMax],
    floorColor,
    wallColor,
    cameraPos: [cx + rw * 0.4, DEFAULT_CEILING_H * 0.6, cz + rd * 0.4],
    cameraTarget: [cx, DEFAULT_CEILING_H * 0.35, cz],
    svg: { x: 0, y: 0, w: 0, h: 0 }, // SVG minimap coords are generated dynamically by the editor
    accent: ROOM_ACCENTS[_index % ROOM_ACCENTS.length],
    furniture: [],
    doors: (room.doors || []).map((d) => ({
      side: d.wall as "north" | "south" | "east" | "west",
      t: d.positionRatio,
      w: d.widthM,
    })),
    windows: (room.windows || []).map((w) => ({
      side: w.wall as "north" | "south" | "east" | "west",
      t: w.positionRatio,
      w: w.widthM,
      h: w.heightM || 1.2,
      sillH: w.sillHeightM || 0.9,
    })),
    defaultMaterials: {
      walls: room.suggestedMaterials?.walls || matDefaults.walls,
      floors: room.suggestedMaterials?.floors || matDefaults.floors,
      ceiling: room.suggestedMaterials?.ceiling || matDefaults.ceiling,
    },
    defaultLighting: {
      timeOfDay: room.suggestedLighting?.timeOfDay ?? lightDefaults.timeOfDay,
      intensity: room.suggestedLighting?.intensity ?? lightDefaults.intensity,
      ceilingLight: room.suggestedLighting?.ceilingLight ?? lightDefaults.ceilingLight,
      floorLamp: room.suggestedLighting?.floorLamp ?? lightDefaults.floorLamp,
      accentLight: room.suggestedLighting?.accentLight ?? lightDefaults.accentLight,
      underCabinet: room.suggestedLighting?.underCabinet ?? lightDefaults.underCabinet,
    },
  };
}

export async function analyzeFloorPlanAI(
  imageDataUrl: string,
  serverBaseUrl: string,
  authToken: string,
  onProgress?: (stage: string, pct: number) => void,
): Promise<{ defs: ParsedHouseRoomDef[]; planName: string; confidence: number; roomCount: number }> {
  const report = (stage: string, pct: number) => onProgress?.(stage, pct);

  report("Preparing image for AI analysis...", 5);

  // ── Resize image client-side to reduce payload ──
  // Max 1400px on longest side keeps detail while cutting base64 size drastically
  const resizedDataUrl = await resizeImageForAI(imageDataUrl, 1400);

  // Extract base64 and content type from (resized) data URL
  const match = resizedDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL format");
  }
  const [, contentType, base64Data] = match;

  console.log(`[FloorPlanAI] Sending image: ${(base64Data.length / 1024).toFixed(0)} KB base64`);

  report("Sending to AI vision model...", 15);

  // Start a progress ticker that simulates progress while waiting for AI response
  let progressTick = 20;
  const progressMessages = [
    "AI is reading dimension annotations...",
    "AI is detecting walls and boundaries...",
    "AI is identifying rooms and spaces...",
    "AI is measuring room dimensions...",
    "AI is locating doors and windows...",
    "AI is verifying wall alignment...",
    "AI is building 2D floor plan layout...",
  ];
  let msgIdx = 0;
  const tickInterval = setInterval(() => {
    if (progressTick < 75) {
      progressTick += 3 + Math.random() * 4;
      if (progressTick > 75) progressTick = 75;
      if (msgIdx < progressMessages.length && progressTick > 20 + (msgIdx + 1) * 8) {
        report(progressMessages[msgIdx], Math.round(progressTick));
        msgIdx++;
      } else {
        report(progressMessages[Math.min(msgIdx, progressMessages.length - 1)], Math.round(progressTick));
      }
    }
  }, 2000);

  // Frontend abort controller — 150s timeout (generous; server has its own 90s)
  const frontendAbort = new AbortController();
  const frontendTimeout = setTimeout(() => frontendAbort.abort(), 150_000);

  let response: Response;
  try {
    response = await fetch(`${serverBaseUrl}/make-server-4808de5e/analyze-floorplan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({ imageBase64: base64Data, contentType }),
      signal: frontendAbort.signal,
    });
  } catch (fetchErr: any) {
    clearInterval(tickInterval);
    clearTimeout(frontendTimeout);
    if (fetchErr.name === "AbortError") {
      throw new Error("Analysis timed out after 2.5 minutes. Try uploading a smaller or clearer floor plan image.");
    }
    throw fetchErr;
  } finally {
    clearInterval(tickInterval);
    clearTimeout(frontendTimeout);
  }

  report("Processing AI response...", 80);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  report("Complete!", 100);

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || "AI analysis returned no data");
  }

  const aiData: AIAnalysisResponse = result.data;

  // Convert AI rooms → ParsedHouseRoomDef[]
  const defs = aiData.rooms.map((room, i) => aiRoomToHouseRoomDef(room, i));

  return {
    defs,
    planName: aiData.planName || `Floor Plan (${defs.length} rooms)`,
    confidence: aiData.confidence || 0.8,
    roomCount: defs.length,
  };
}

/** Store AI-analyzed defs directly into sessionStorage */
export function storeAIDefs(defs: ParsedHouseRoomDef[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY + "_defs", JSON.stringify(defs));
    // Store a minimal analysis result placeholder so retrieveAnalysis finds it
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ rooms: [], totalWidth: 0, totalDepth: 0, wallPixels: 0, imageWidth: 0, imageHeight: 0, sourceImage: "", processedImage: "", pixelsPerMeter: 0, confidence: 0 }));
  } catch {
    console.warn("Failed to store AI analysis defs in sessionStorage");
  }
}

/* ═══════════════════════════════════════════════════════
   Shared state: pass analysis from dashboard → editor
   ═══════════════════════════════════════════════════════ */

const STORAGE_KEY = "floorplan3d_analysis";

export function storeAnalysis(result: AnalysisResult): void {
  try {
    // Store everything except the large images (too big for sessionStorage)
    const slim = {
      ...result,
      sourceImage: "", // omit — too large
      processedImage: "", // omit
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    // Store the HouseRoomDefs separately
    const defs = analysisToHouseRoomDefs(result);
    sessionStorage.setItem(STORAGE_KEY + "_defs", JSON.stringify(defs));
  } catch {
    console.warn("Failed to store analysis result in sessionStorage");
  }
}

export function retrieveAnalysis(): { result: AnalysisResult; defs: ParsedHouseRoomDef[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const rawDefs = sessionStorage.getItem(STORAGE_KEY + "_defs");
    if (!raw || !rawDefs) return null;
    return { result: JSON.parse(raw), defs: JSON.parse(rawDefs) };
  } catch {
    return null;
  }
}

export function clearStoredAnalysis(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY + "_defs");
}

/* ═══════════════════════════════════════════════════════
   Helper Function — Resize Image for AI Analysis
   ═══════════════════════════════════════════════════════ */

function resizeImageForAI(imageDataUrl: string, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const { naturalWidth: nw, naturalHeight: nh } = img;
      // Skip resize if already small enough
      if (nw <= maxSide && nh <= maxSide) {
        resolve(imageDataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSide / nw, maxSide / nh);
      canvas.width = Math.round(nw * scale);
      canvas.height = Math.round(nh * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Use JPEG at 85% quality — much smaller than PNG for photos/scans
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}
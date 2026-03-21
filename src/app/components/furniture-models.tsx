/**
 * Procedural 3D Furniture Models built with Three.js compound geometry.
 * Each builder returns a THREE.Group that looks like the real furniture piece.
 * All models are centered at origin with Y=0 being the floor.
 *
 * V2 — Enhanced with:
 *   • Rounded geometry (beveled boxes, lathe profiles)
 *   • Material presets (fabric, wood, metal, glass, marble, leather)
 *   • More geometric detail (cushion stitching, drawer knobs, tufting, etc.)
 *   • 15+ new furniture types (kitchen island, wardrobe, plant, rug, etc.)
 */
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════
   Material Presets
   ═══════════════════════════════════════════════════════ */

function fabric(color: string, opts?: { roughness?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.92,
    metalness: 0.0,
  });
}

function wood(color: string, opts?: { roughness?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.55,
    metalness: 0.02,
  });
}

function metal(color: string, opts?: { roughness?: number; metalness?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.18,
    metalness: opts?.metalness ?? 0.82,
  });
}

function glass(color: string, opacity = 0.3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity,
  });
}

function marble(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.22,
    metalness: 0.05,
  });
}

function leather(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.04,
  });
}

/* generic fallback */
function mat(color: string, opts?: { roughness?: number; metalness?: number }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.6,
    metalness: opts?.metalness ?? 0.05,
  });
}

/* ═══════════════════════════════════════════════════════
   Geometry Helpers
   ═══════════════════════════════════════════════════════ */

function _mesh(geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}

function box(
  w: number, h: number, d: number,
  color: string,
  x: number, y: number, z: number,
  opts?: { roughness?: number; metalness?: number }
): THREE.Mesh {
  return _mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts), x, y, z);
}

/** Rounded box via ExtrudeGeometry with beveled corners */
function roundedBox(
  w: number, h: number, d: number,
  radius: number,
  material: THREE.Material,
  x: number, y: number, z: number,
): THREE.Mesh {
  const hw = w / 2 - radius;
  const hh = h / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hh - radius);
  shape.lineTo(hw, -hh - radius);
  shape.quadraticCurveTo(hw + radius, -hh - radius, hw + radius, -hh);
  shape.lineTo(hw + radius, hh);
  shape.quadraticCurveTo(hw + radius, hh + radius, hw, hh + radius);
  shape.lineTo(-hw, hh + radius);
  shape.quadraticCurveTo(-hw - radius, hh + radius, -hw - radius, hh);
  shape.lineTo(-hw - radius, -hh);
  shape.quadraticCurveTo(-hw - radius, -hh - radius, -hw, -hh - radius);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: d,
    bevelEnabled: true,
    bevelThickness: Math.min(radius * 0.5, 0.02),
    bevelSize: Math.min(radius * 0.5, 0.02),
    bevelSegments: 3,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
}

function cyl(
  rTop: number, rBot: number, h: number,
  color: string,
  x: number, y: number, z: number,
  segments = 16,
  opts?: { roughness?: number; metalness?: number }
): THREE.Mesh {
  return _mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segments),
    mat(color, opts), x, y, z,
  );
}

function cylMat(
  rTop: number, rBot: number, h: number,
  material: THREE.Material,
  x: number, y: number, z: number,
  segments = 16,
): THREE.Mesh {
  return _mesh(new THREE.CylinderGeometry(rTop, rBot, h, segments), material, x, y, z);
}

function sphere(
  r: number, color: string,
  x: number, y: number, z: number,
  opts?: { roughness?: number; metalness?: number }
): THREE.Mesh {
  return _mesh(new THREE.SphereGeometry(r, 16, 12), mat(color, opts), x, y, z);
}

function sphereMat(
  r: number, material: THREE.Material,
  x: number, y: number, z: number,
): THREE.Mesh {
  return _mesh(new THREE.SphereGeometry(r, 16, 12), material, x, y, z);
}

/** Thin torus ring */
function torus(
  R: number, r: number,
  material: THREE.Material,
  x: number, y: number, z: number,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, 24), material);
  m.position.set(x, y, z);
  return m;
}

/** Cushion shape — a slightly puffy rounded box with fabric material */
function cushion(
  w: number, h: number, d: number,
  color: string,
  x: number, y: number, z: number,
): THREE.Mesh {
  return roundedBox(w, h, d, Math.min(h * 0.35, 0.04), fabric(color), x, y, z);
}

/** Piping / seam line (thin cylinder laid horizontally) */
function pipingLine(
  length: number, color: string,
  x: number, y: number, z: number,
  rotateAxis: "x" | "z" = "z",
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, length, 6),
    fabric(darken(color, 0.08)),
  );
  m.position.set(x, y, z);
  if (rotateAxis === "z") m.rotation.z = Math.PI / 2;
  if (rotateAxis === "x") m.rotation.x = Math.PI / 2;
  return m;
}

/* ═══════════════════════════════════════════════════════
   ENHANCED Furniture Builders
   ═══════════════════════════════════════════════════════ */

/** Modern 3-seater sofa — rounded cushions, piping, throw pillows, tapered wood legs */
export function buildSofa(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const dark = darken(baseColor, 0.15);
  const light = lighten(baseColor, 0.1);
  const accent = lighten(baseColor, 0.2);
  const legCol = "#5C4A3A";

  // Frame base
  g.add(roundedBox(2.2, 0.16, 0.9, 0.04, fabric(dark), 0, 0.16, 0));

  // Seat cushions (3 individual rounded)
  for (let i = -1; i <= 1; i++) {
    g.add(cushion(0.66, 0.14, 0.65, baseColor, i * 0.7, 0.35, 0.06));
    // Piping between cushions
    if (i < 1) {
      g.add(pipingLine(0.65, dark, i * 0.7 + 0.35, 0.35, 0.06, "x"));
    }
  }

  // Back rest frame
  g.add(roundedBox(2.2, 0.44, 0.13, 0.03, fabric(dark), 0, 0.64, -0.39));

  // Back cushions (3 puffy)
  for (let i = -1; i <= 1; i++) {
    g.add(cushion(0.62, 0.36, 0.12, light, i * 0.7, 0.62, -0.32));
  }

  // Arms (rounded)
  g.add(roundedBox(0.13, 0.32, 0.88, 0.04, fabric(dark), -1.07, 0.43, 0));
  g.add(roundedBox(0.13, 0.32, 0.88, 0.04, fabric(dark), 1.07, 0.43, 0));

  // Arm top cushion pads
  g.add(cushion(0.13, 0.05, 0.6, baseColor, -1.07, 0.6, 0.05));
  g.add(cushion(0.13, 0.05, 0.6, baseColor, 1.07, 0.6, 0.05));

  // Throw pillows (2, angled in corners)
  const pillowMat = fabric(accent);
  const p1 = roundedBox(0.28, 0.28, 0.08, 0.03, pillowMat, -0.82, 0.58, -0.2);
  p1.rotation.z = 0.15;
  p1.rotation.y = -0.2;
  g.add(p1);
  const p2 = roundedBox(0.28, 0.28, 0.08, 0.03, pillowMat, 0.82, 0.58, -0.2);
  p2.rotation.z = -0.15;
  p2.rotation.y = 0.2;
  g.add(p2);

  // Tapered wood legs (4)
  const legMat = wood(legCol);
  const legPositions = [[-0.95, 0.35], [0.95, 0.35], [-0.95, -0.35], [0.95, -0.35]];
  for (const [lx, lz] of legPositions) {
    g.add(cylMat(0.02, 0.028, 0.09, legMat, lx, 0.045, lz, 8));
  }

  return g;
}

/** Armchair — tufted back, rounded frame, accent piping */
export function buildArmchair(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const dark = darken(baseColor, 0.12);
  const legCol = "#5C4A3A";

  // Base frame
  g.add(roundedBox(0.84, 0.13, 0.82, 0.035, fabric(dark), 0, 0.13, 0));

  // Seat cushion (puffy)
  g.add(cushion(0.68, 0.13, 0.64, baseColor, 0, 0.27, 0.04));

  // Back rest frame
  g.add(roundedBox(0.84, 0.52, 0.12, 0.03, fabric(dark), 0, 0.56, -0.35));

  // Tufted back cushion — 2x2 grid of smaller puffs
  const tuftColor = lighten(baseColor, 0.05);
  for (let tx = -1; tx <= 1; tx += 2) {
    for (let ty = 0; ty <= 1; ty++) {
      g.add(cushion(0.28, 0.16, 0.08, tuftColor, tx * 0.16, 0.45 + ty * 0.18, -0.29));
    }
  }

  // Tufting buttons (small spheres)
  const btnMat = fabric(darken(baseColor, 0.2));
  for (let tx = -1; tx <= 1; tx += 2) {
    g.add(sphereMat(0.012, btnMat, tx * 0.16, 0.54, -0.25));
  }

  // Arms (rounded, with top pad)
  g.add(roundedBox(0.11, 0.3, 0.76, 0.035, fabric(dark), -0.41, 0.36, 0.02));
  g.add(roundedBox(0.11, 0.3, 0.76, 0.035, fabric(dark), 0.41, 0.36, 0.02));
  g.add(cushion(0.11, 0.04, 0.5, baseColor, -0.41, 0.52, 0.08));
  g.add(cushion(0.11, 0.04, 0.5, baseColor, 0.41, 0.52, 0.08));

  // Piping along seat front edge
  g.add(pipingLine(0.68, dark, 0, 0.34, 0.36, "z"));

  // Tapered wood legs
  const legMat = wood(legCol);
  const lp = [[-0.33, 0.3], [0.33, 0.3], [-0.33, -0.3], [0.33, -0.3]];
  for (const [lx, lz] of lp) {
    g.add(cylMat(0.02, 0.025, 0.07, legMat, lx, 0.035, lz, 8));
  }

  return g;
}

/** Dining Table — beveled wood top, cross-support stretchers, tapered legs */
export function buildDiningTable(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const legColor = darken(baseColor, 0.2);
  const topMat = wood(baseColor);
  const legMat = wood(legColor);

  // Tabletop (rounded edges)
  g.add(roundedBox(1.6, 0.06, 0.9, 0.02, topMat, 0, 0.73, 0));

  // Apron (under-table frame)
  const apronMat = wood(darken(baseColor, 0.1));
  g.add(roundedBox(1.42, 0.06, 0.04, 0.01, apronMat, 0, 0.67, -0.38));
  g.add(roundedBox(1.42, 0.06, 0.04, 0.01, apronMat, 0, 0.67, 0.38));
  g.add(roundedBox(0.04, 0.06, 0.76, 0.01, apronMat, -0.68, 0.67, 0));
  g.add(roundedBox(0.04, 0.06, 0.76, 0.01, apronMat, 0.68, 0.67, 0));

  // Tapered legs
  const legs = [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]];
  for (const [lx, lz] of legs) {
    g.add(cylMat(0.032, 0.022, 0.64, legMat, lx, 0.32, lz, 8));
  }

  // Cross stretcher (X shape under table)
  const stretchMat = wood(darken(baseColor, 0.15));
  const stretchGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6);
  const s1 = new THREE.Mesh(stretchGeo, stretchMat);
  s1.position.set(0, 0.18, 0);
  s1.rotation.z = Math.PI / 2;
  s1.rotation.y = 0.4;
  g.add(s1);
  const s2 = new THREE.Mesh(stretchGeo.clone(), stretchMat);
  s2.position.set(0, 0.18, 0);
  s2.rotation.z = Math.PI / 2;
  s2.rotation.y = -0.4;
  g.add(s2);

  return g;
}

/** Coffee Table — rounded glass/wood top, metal hairpin legs, magazine stack */
export function buildCoffeeTable(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const topMat = wood(baseColor);
  const shelfMat = wood(darken(baseColor, 0.1));
  const legMat = metal("#3A3A3A");

  // Top surface (rounded)
  g.add(roundedBox(1.2, 0.04, 0.6, 0.02, topMat, 0, 0.40, 0));

  // Lower shelf (rounded)
  g.add(roundedBox(1.05, 0.025, 0.48, 0.015, shelfMat, 0, 0.12, 0));

  // Hairpin metal legs (4 sets of 2 rods each)
  const hairpinPositions = [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]];
  for (const [hx, hz] of hairpinPositions) {
    // Two rods per leg
    g.add(cylMat(0.008, 0.008, 0.4, legMat, hx - 0.015, 0.2, hz, 6));
    g.add(cylMat(0.008, 0.008, 0.4, legMat, hx + 0.015, 0.2, hz, 6));
    // Small foot cap
    g.add(sphereMat(0.01, legMat, hx - 0.015, 0.005, hz));
    g.add(sphereMat(0.01, legMat, hx + 0.015, 0.005, hz));
  }

  // Decorative items on top
  // Small stack of magazines/books
  g.add(roundedBox(0.18, 0.015, 0.12, 0.005, mat("#C8B8A0"), -0.3, 0.43, 0.1));
  g.add(roundedBox(0.16, 0.012, 0.11, 0.005, mat("#A09080"), -0.3, 0.445, 0.1));
  // Small decorative bowl
  g.add(cylMat(0.06, 0.04, 0.03, marble("#E8E0D8"), 0.35, 0.43, -0.05, 16));

  return g;
}

/** Queen/King Bed — tufted headboard, layered bedding, decorative pillows, bedskirt */
export function buildBed(baseColor: string, width: number): THREE.Group {
  const g = new THREE.Group();
  const frame = darken(baseColor, 0.25);
  const sheet = lighten(baseColor, 0.15);
  const accentPillow = darken(baseColor, 0.05);
  const frameMat = wood(frame);
  const headboardMat = fabric(darken(baseColor, 0.1));

  // Bed frame base (rounded wood)
  g.add(roundedBox(width + 0.04, 0.14, 2.14, 0.02, frameMat, 0, 0.14, 0));

  // Bed slats (visible detail under mattress)
  for (let i = -3; i <= 3; i++) {
    g.add(box(width - 0.1, 0.02, 0.08, darken(frame, 0.1), 0, 0.20, i * 0.28));
  }

  // Mattress (rounded, thick)
  g.add(roundedBox(width - 0.08, 0.22, 2.0, 0.04, mat("#F2F0EA", { roughness: 0.85 }), 0, 0.32, 0));

  // Fitted sheet
  g.add(roundedBox(width - 0.1, 0.03, 1.98, 0.02, fabric("#FAFAF5"), 0, 0.44, 0));

  // Duvet/comforter (slightly rumpled look — offset a tad)
  g.add(roundedBox(width - 0.06, 0.08, 1.5, 0.035, fabric(sheet), 0.02, 0.48, 0.24));
  // Duvet fold at top
  g.add(roundedBox(width - 0.08, 0.06, 0.25, 0.02, fabric(lighten(sheet, 0.05)), 0, 0.50, -0.42));

  // Sleeping pillows (2, puffy rounded)
  const pw = (width - 0.3) / 2;
  g.add(cushion(pw * 0.82, 0.12, 0.32, "#FEFEFE", -pw / 2, 0.48, -0.74));
  g.add(cushion(pw * 0.82, 0.12, 0.32, "#FEFEFE", pw / 2, 0.48, -0.74));

  // Decorative accent pillows (smaller, in front of sleeping pillows)
  g.add(cushion(0.28, 0.26, 0.07, accentPillow, -0.2, 0.52, -0.52));
  g.add(cushion(0.28, 0.26, 0.07, accentPillow, 0.2, 0.52, -0.52));
  // Small round bolster pillow in center
  g.add(cylMat(0.06, 0.06, 0.3, fabric(darken(baseColor, 0.15)), 0, 0.50, -0.48, 12));

  // Headboard (tall, tufted)
  g.add(roundedBox(width + 0.06, 0.75, 0.07, 0.03, headboardMat, 0, 0.58, -1.04));
  // Tufting grid on headboard (3 columns × 2 rows of diamond tufts)
  const tuftCols = Math.floor(width / 0.25);
  const tuftBtnMat = fabric(darken(baseColor, 0.25));
  for (let col = 0; col < tuftCols; col++) {
    for (let row = 0; row < 2; row++) {
      const tx = -width / 2 + 0.2 + col * (width / tuftCols);
      const ty = 0.38 + row * 0.28;
      g.add(sphereMat(0.012, tuftBtnMat, tx, ty, -0.99));
    }
  }

  // Footboard (low)
  g.add(roundedBox(width + 0.02, 0.3, 0.06, 0.02, frameMat, 0, 0.15, 1.04));

  // Feet (rounded wood)
  const feetMat = wood(darken(frame, 0.1));
  g.add(cylMat(0.04, 0.04, 0.06, feetMat, -width / 2 + 0.06, 0.03, 1.02, 8));
  g.add(cylMat(0.04, 0.04, 0.06, feetMat, width / 2 - 0.06, 0.03, 1.02, 8));
  g.add(cylMat(0.04, 0.04, 0.06, feetMat, -width / 2 + 0.06, 0.03, -1.02, 8));
  g.add(cylMat(0.04, 0.04, 0.06, feetMat, width / 2 - 0.06, 0.03, -1.02, 8));

  return g;
}

/** Bookshelf — decorative objects, varied book sizes, bookends, small vase */
export function buildBookshelf(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const backMat = wood(darken(baseColor, 0.12));

  // Side panels (thicker, with subtle edge rounding)
  g.add(roundedBox(0.03, 1.8, 0.35, 0.005, woodMat, -0.44, 0.9, 0));
  g.add(roundedBox(0.03, 1.8, 0.35, 0.005, woodMat, 0.44, 0.9, 0));

  // Back panel
  g.add(roundedBox(0.88, 1.78, 0.012, 0.003, backMat, 0, 0.9, -0.17));

  // Shelves (5, with subtle rounded front edge)
  for (let i = 0; i < 5; i++) {
    const y = i * 0.42 + 0.02;
    g.add(roundedBox(0.87, 0.03, 0.34, 0.005, woodMat, 0, y, 0));
  }

  // Top crown molding detail
  g.add(roundedBox(0.92, 0.025, 0.37, 0.005, woodMat, 0, 1.81, 0));

  // Books on shelves (colored blocks with spines)
  const bookColors = ["#7B3F2E", "#2D4F4F", "#6B2035", "#1A4D3E", "#4A3728", "#2C3E50", "#8B6E3A", "#5D3E7A"];
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let shelf = 1; shelf < 4; shelf++) {
    const shelfY = shelf * 0.42 + 0.04;
    const numBooks = 4 + Math.floor(seededRandom(shelf * 7) * 4);
    let xOff = -0.36;

    for (let b = 0; b < numBooks && xOff < 0.32; b++) {
      const bw = 0.03 + seededRandom(shelf * 10 + b * 3) * 0.05;
      const bh = 0.2 + seededRandom(shelf * 10 + b * 3 + 1) * 0.18;
      const bc = bookColors[(shelf * 3 + b) % bookColors.length];

      // Book body
      g.add(roundedBox(bw, bh, 0.2, 0.004, mat(bc, { roughness: 0.8 }), xOff + bw / 2, shelfY + bh / 2, 0));
      // Spine highlight (thin lighter strip)
      g.add(box(0.003, bh - 0.02, 0.2, lighten(bc, 0.15), xOff + 0.003, shelfY + bh / 2, 0));

      xOff += bw + 0.008;
    }

    // Bookend on shelf 2
    if (shelf === 2) {
      g.add(box(0.04, 0.14, 0.12, "#4A4A4A", 0.34, shelfY + 0.07, 0, { metalness: 0.6 }));
    }
  }

  // Decorative objects on top shelf (shelf 4)
  const topShelfY = 4 * 0.42 + 0.04;
  // Small vase
  g.add(cylMat(0.035, 0.025, 0.1, marble("#E0D8D0"), -0.2, topShelfY + 0.05, 0, 12));
  g.add(sphereMat(0.038, marble("#E0D8D0"), -0.2, topShelfY + 0.1, 0));
  // Small framed photo
  g.add(box(0.1, 0.12, 0.015, "#3A3A3A", 0.15, topShelfY + 0.06, 0));
  g.add(box(0.08, 0.1, 0.005, "#E0D0C0", 0.15, topShelfY + 0.06, 0.01));

  return g;
}

/** TV Console — open shelves, closed cabinets, cable management hole, decorative items */
export function buildTVConsole(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const topMat = wood(lighten(baseColor, 0.08));
  const handleMat = metal("#A8A8A8");

  // Main body
  g.add(roundedBox(1.8, 0.4, 0.4, 0.02, woodMat, 0, 0.25, 0));

  // Top surface
  g.add(roundedBox(1.84, 0.025, 0.44, 0.01, topMat, 0, 0.465, 0));

  // Center open shelf (inset darker)
  g.add(box(0.54, 0.3, 0.35, darken(baseColor, 0.2), 0, 0.2, 0.01, { roughness: 0.85 }));

  // Side cabinet doors (left and right)
  for (const side of [-1, 1]) {
    const dx = side * 0.63;
    g.add(roundedBox(0.5, 0.34, 0.012, 0.008, wood(lighten(baseColor, 0.04)), dx, 0.25, 0.2));
    // Handle
    g.add(cylMat(0.006, 0.006, 0.1, handleMat, dx + side * -0.08, 0.25, 0.215, 8));
  }

  // Drawer divider lines
  g.add(box(0.005, 0.36, 0.4, darken(baseColor, 0.15), -0.33, 0.25, 0));
  g.add(box(0.005, 0.36, 0.4, darken(baseColor, 0.15), 0.33, 0.25, 0));

  // Cable management hole (back, dark circle)
  g.add(cylMat(0.03, 0.03, 0.02, mat("#222"), 0, 0.3, -0.19, 12));

  // Short tapered legs
  const legMat = wood(darken(baseColor, 0.2));
  const lp = [[-0.82, 0.15], [0.82, 0.15], [-0.82, -0.15], [0.82, -0.15]];
  for (const [lx, lz] of lp) {
    g.add(cylMat(0.025, 0.03, 0.05, legMat, lx, 0.025, lz, 8));
  }

  // Decorative item in open shelf (small speaker/box)
  g.add(roundedBox(0.12, 0.1, 0.1, 0.01, mat("#2A2A2A", { roughness: 0.3 }), 0.12, 0.12, 0.05));

  return g;
}

/** Floor Lamp — arc style with weighted base, fabric shade, warm glow */
export function buildFloorLamp(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const baseMat = metal("#3C3C3C");
  const poleMat = metal("#505050");
  const shadeMat = fabric(baseColor, { roughness: 0.85 });

  // Heavy circular base
  g.add(cylMat(0.18, 0.2, 0.025, baseMat, 0, 0.0125, 0, 24));
  // Base weight ring
  g.add(cylMat(0.15, 0.15, 0.01, metal("#4A4A4A"), 0, 0.03, 0, 24));

  // Main pole (slightly tapered)
  g.add(cylMat(0.018, 0.015, 1.35, poleMat, 0, 0.71, 0, 12));

  // Arc section at top (curved via angled cylinder)
  const arc = cylMat(0.012, 0.012, 0.2, poleMat, 0.05, 1.44, 0, 8);
  arc.rotation.z = -0.4;
  g.add(arc);

  // Shade (truncated cone, larger)
  g.add(cylMat(0.22, 0.14, 0.28, shadeMat, 0.08, 1.48, 0, 24));
  // Inner shade (slightly darker for depth)
  g.add(cylMat(0.2, 0.12, 0.26, fabric(darken(baseColor, 0.1)), 0.08, 1.48, 0, 24));

  // Bulb glow
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshStandardMaterial({
      color: "#FFF5D4", emissive: "#FFF5D4", emissiveIntensity: 0.8,
      roughness: 0.3, metalness: 0.0,
    }),
  );
  bulb.position.set(0.08, 1.36, 0);
  g.add(bulb);

  return g;
}

/** Pendant Light — minimalist cord mount, detailed shade, warm glow */
export function buildPendantLight(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const cordMat = metal("#444");
  const canopyMat = metal("#555");
  const shadeMat = fabric(baseColor, { roughness: 0.85 });

  // Canopy (ceiling mount)
  g.add(cylMat(0.07, 0.07, 0.025, canopyMat, 0, 2.785, 0, 16));

  // Cord
  g.add(cylMat(0.004, 0.004, 0.6, cordMat, 0, 2.5, 0, 6));

  // Shade (elegant drum shape)
  g.add(cylMat(0.22, 0.2, 0.24, shadeMat, 0, 2.2, 0, 32));
  // Shade ring (metal trim top and bottom)
  g.add(torus(0.21, 0.005, metal("#888"), 0, 2.32, 0));
  g.add(torus(0.19, 0.005, metal("#888"), 0, 2.08, 0));

  // Bulb
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshStandardMaterial({
      color: "#FFF5D4", emissive: "#FFF5D4", emissiveIntensity: 0.6,
    }),
  );
  bulb.position.set(0, 2.12, 0);
  g.add(bulb);

  return g;
}

/** Refrigerator — double door, water dispenser, detailed handles, brand detail */
export function buildFridge(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(baseColor, { roughness: 0.28, metalness: 0.18 });
  const doorMat = mat(lighten(baseColor, 0.03), { roughness: 0.22, metalness: 0.22 });
  const handleMat = metal("#B8B8B8");

  // Main body
  g.add(_mesh(new THREE.BoxGeometry(0.72, 1.72, 0.7), bodyMat, 0, 0.9, 0));

  // Freezer door (top)
  g.add(_mesh(new THREE.BoxGeometry(0.74, 0.52, 0.015), doorMat, 0, 1.52, 0.35));

  // Fridge door (bottom)
  g.add(_mesh(new THREE.BoxGeometry(0.74, 1.1, 0.015), doorMat, 0, 0.61, 0.35));

  // Door separator line
  g.add(box(0.74, 0.012, 0.02, darken(baseColor, 0.12), 0, 1.23, 0.345));

  // Handles (rounded bars)
  g.add(cylMat(0.01, 0.01, 0.28, handleMat, 0.3, 1.52, 0.375, 8));
  g.add(cylMat(0.01, 0.01, 0.5, handleMat, 0.3, 0.66, 0.375, 8));
  // Handle end caps
  g.add(sphereMat(0.012, handleMat, 0.3, 1.66, 0.375));
  g.add(sphereMat(0.012, handleMat, 0.3, 1.38, 0.375));
  g.add(sphereMat(0.012, handleMat, 0.3, 0.91, 0.375));
  g.add(sphereMat(0.012, handleMat, 0.3, 0.41, 0.375));

  // Water/ice dispenser recess on freezer door
  g.add(box(0.18, 0.15, 0.012, darken(baseColor, 0.08), -0.1, 1.52, 0.36));

  // Brand logo placeholder (subtle circle)
  g.add(cylMat(0.03, 0.03, 0.003, metal("#C0C0C0"), 0, 1.18, 0.36, 16));

  // Feet
  g.add(box(0.06, 0.04, 0.06, "#333", -0.28, 0.02, 0.28));
  g.add(box(0.06, 0.04, 0.06, "#333", 0.28, 0.02, 0.28));
  g.add(box(0.06, 0.04, 0.06, "#333", -0.28, 0.02, -0.28));
  g.add(box(0.06, 0.04, 0.06, "#333", 0.28, 0.02, -0.28));

  return g;
}

/** Washing Machine — detailed drum, control panel with buttons */
export function buildWasher(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(baseColor, { roughness: 0.28, metalness: 0.12 });

  // Body
  g.add(_mesh(new THREE.BoxGeometry(0.6, 0.84, 0.58), bodyMat, 0, 0.44, 0));

  // Front face
  g.add(box(0.62, 0.86, 0.012, lighten(baseColor, 0.02), 0, 0.44, 0.295, { roughness: 0.22 }));

  // Door drum glass (dark circle)
  g.add(cylMat(0.2, 0.2, 0.015, glass("#88AACC", 0.4), 0, 0.38, 0.31, 32));

  // Door rim ring
  g.add(torus(0.2, 0.018, metal("#B0B0B0"), 0, 0.38, 0.315));

  // Control panel area
  g.add(box(0.52, 0.1, 0.012, "#E4E4E4", 0, 0.8, 0.3));

  // Control knobs (2)
  g.add(cylMat(0.028, 0.028, 0.025, metal("#888"), -0.12, 0.8, 0.325, 16));
  g.add(cylMat(0.028, 0.028, 0.025, metal("#888"), 0.12, 0.8, 0.325, 16));

  // Buttons (3 small)
  for (let i = -1; i <= 1; i++) {
    g.add(cylMat(0.01, 0.01, 0.008, metal("#999"), -0.12 + i * 0.06, 0.74, 0.315, 8));
  }

  // LED display placeholder
  g.add(box(0.08, 0.03, 0.005, "#1A3A1A", 0.18, 0.8, 0.315, { roughness: 0.1 }));

  return g;
}

/** Smart TV — ultra-thin bezel, detailed stand */
export function buildTV(baseColor: string): THREE.Group {
  const g = new THREE.Group();

  // Screen housing
  g.add(box(1.45, 0.82, 0.035, baseColor, 0, 0.46, 0, { roughness: 0.08 }));
  // Screen face (glossy dark)
  g.add(box(1.4, 0.78, 0.004, "#080808", 0, 0.46, 0.02, { roughness: 0.03, metalness: 0.12 }));
  // Subtle screen reflection (lighter strip)
  g.add(box(0.4, 0.5, 0.003, "#151520", 0.25, 0.5, 0.023, { roughness: 0.02 }));
  // Thin bezel frame
  g.add(box(1.46, 0.018, 0.04, "#111", 0, 0.065, 0));

  // V-shaped stand
  const standMat = metal("#2A2A2A");
  const standL = _mesh(new THREE.BoxGeometry(0.03, 0.015, 0.22), standMat, -0.2, 0.008, 0.06);
  standL.rotation.y = 0.25;
  g.add(standL);
  const standR = _mesh(new THREE.BoxGeometry(0.03, 0.015, 0.22), standMat, 0.2, 0.008, 0.06);
  standR.rotation.y = -0.25;
  g.add(standR);

  // Stand connector to screen
  g.add(box(0.06, 0.04, 0.05, "#222", 0, 0.04, 0, { metalness: 0.3 }));

  // Power LED dot
  g.add(sphereMat(0.005, new THREE.MeshStandardMaterial({
    color: "#FF2200", emissive: "#FF2200", emissiveIntensity: 0.4,
  }), 0, 0.085, 0.02));

  return g;
}

/** Desktop Setup — detailed desk, monitor with webcam, keyboard, mouse, cable tray */
export function buildDeskSetup(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const deskMat = wood(baseColor);
  const legMat = metal("#3A3A3A");

  // Desk surface (rounded wood)
  g.add(roundedBox(1.4, 0.04, 0.7, 0.015, deskMat, 0, 0.73, 0));

  // Metal legs (4, square tube)
  const legPositions = [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]];
  for (const [lx, lz] of legPositions) {
    g.add(_mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04), legMat, lx, 0.36, lz));
    // Foot pad
    g.add(_mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.01, 8), legMat, lx, 0.005, lz));
  }

  // Cable management tray under desk
  g.add(roundedBox(0.6, 0.04, 0.1, 0.008, metal("#444"), 0, 0.68, -0.2));

  // Monitor
  g.add(box(0.62, 0.4, 0.025, "#1A1A1A", 0, 1.01, -0.22, { roughness: 0.08 }));
  g.add(box(0.58, 0.36, 0.005, "#060606", 0, 1.01, -0.205, { roughness: 0.03 }));
  // Webcam dot
  g.add(sphereMat(0.006, mat("#222"), 0, 1.22, -0.2));

  // Monitor stand
  g.add(box(0.04, 0.18, 0.04, "#2A2A2A", 0, 0.85, -0.22, { metalness: 0.45 }));
  g.add(roundedBox(0.2, 0.015, 0.14, 0.01, metal("#2A2A2A"), 0, 0.76, -0.22));

  // Keyboard (with subtle key row detail)
  g.add(roundedBox(0.4, 0.015, 0.13, 0.008, mat("#2C2C2C", { roughness: 0.4 }), -0.05, 0.76, 0.1));
  // Key rows (subtle lighter lines)
  for (let kr = 0; kr < 4; kr++) {
    g.add(box(0.36, 0.002, 0.02, "#3A3A3A", -0.05, 0.77, 0.06 + kr * 0.025));
  }

  // Mouse (ergonomic shape)
  g.add(roundedBox(0.05, 0.025, 0.09, 0.012, mat("#2C2C2C"), 0.28, 0.76, 0.1));
  // Mouse scroll wheel
  g.add(cylMat(0.005, 0.005, 0.015, metal("#555"), 0.28, 0.775, 0.07, 8));

  // Desk lamp (small)
  g.add(cylMat(0.04, 0.04, 0.01, metal("#444"), -0.5, 0.76, -0.15, 12));
  g.add(cylMat(0.008, 0.008, 0.25, metal("#444"), -0.5, 0.88, -0.15, 6));
  g.add(cylMat(0.06, 0.03, 0.06, mat("#555", { roughness: 0.4 }), -0.48, 1.0, -0.15, 12));

  return g;
}

/** Bathtub — smoother curves, chrome fixtures, towel draped */
export function buildBathtub(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = marble(baseColor);
  const innerMat = marble(darken(baseColor, 0.06));
  const chromeMat = metal("#C8C8C8");

  // Outer shell (rounded)
  g.add(roundedBox(1.72, 0.56, 0.76, 0.06, bodyMat, 0, 0.28, 0));
  // Inner cavity
  g.add(roundedBox(1.48, 0.44, 0.58, 0.04, innerMat, 0, 0.34, 0));
  // Rim (wide, rounded)
  g.add(roundedBox(1.76, 0.04, 0.8, 0.02, marble(lighten(baseColor, 0.03)), 0, 0.56, 0));

  // Faucet assembly
  g.add(cylMat(0.02, 0.02, 0.18, chromeMat, 0, 0.65, -0.32, 12));
  // Faucet arc
  const faucetArc = cylMat(0.015, 0.015, 0.12, chromeMat, 0, 0.73, -0.26, 8);
  faucetArc.rotation.x = Math.PI / 4;
  g.add(faucetArc);
  // Hot/cold handles
  g.add(cylMat(0.015, 0.015, 0.04, chromeMat, -0.08, 0.6, -0.32, 8));
  g.add(cylMat(0.025, 0.025, 0.01, chromeMat, -0.08, 0.62, -0.32, 8));
  g.add(cylMat(0.015, 0.015, 0.04, chromeMat, 0.08, 0.6, -0.32, 8));
  g.add(cylMat(0.025, 0.025, 0.01, chromeMat, 0.08, 0.62, -0.32, 8));

  // Claw feet (4)
  for (const [fx, fz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) {
    g.add(sphereMat(0.045, chromeMat, fx, 0.04, fz));
    g.add(cylMat(0.02, 0.035, 0.04, chromeMat, fx, 0.04, fz, 8));
  }

  // Draped towel on rim
  g.add(roundedBox(0.4, 0.02, 0.15, 0.008, fabric("#F5F0EA"), 0.6, 0.57, 0.35));
  const towelHang = roundedBox(0.08, 0.2, 0.15, 0.008, fabric("#F5F0EA"), 0.76, 0.46, 0.35);
  towelHang.rotation.z = 0.1;
  g.add(towelHang);

  return g;
}

/** Vanity Set — detailed basin, mirror frame, improved cabinet, brushed nickel hardware */
export function buildVanity(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const cabinetMat = wood(baseColor);
  const counterMat = marble(lighten(baseColor, 0.06));
  const chromeMat = metal("#B8B8B8");
  const handleMat = metal("#A0A0A0");

  // Cabinet body
  g.add(roundedBox(1.2, 0.72, 0.48, 0.02, cabinetMat, 0, 0.36, 0));

  // Countertop (marble)
  g.add(roundedBox(1.26, 0.035, 0.54, 0.012, counterMat, 0, 0.735, 0));

  // Sink basin (integrated)
  g.add(cylMat(0.2, 0.15, 0.07, marble("#E8E8E8"), 0, 0.7, 0.05, 24));
  // Drain
  g.add(cylMat(0.015, 0.015, 0.01, chromeMat, 0, 0.67, 0.05, 8));

  // Faucet
  g.add(cylMat(0.014, 0.014, 0.16, chromeMat, 0, 0.84, -0.1, 12));
  const spout = cylMat(0.01, 0.01, 0.1, chromeMat, 0, 0.9, -0.05, 8);
  spout.rotation.x = Math.PI / 3;
  g.add(spout);
  // Faucet handles
  g.add(cylMat(0.018, 0.018, 0.025, chromeMat, -0.08, 0.77, -0.1, 8));
  g.add(cylMat(0.018, 0.018, 0.025, chromeMat, 0.08, 0.77, -0.1, 8));

  // Cabinet doors (2)
  for (const side of [-1, 1]) {
    g.add(roundedBox(0.54, 0.6, 0.012, 0.008, wood(lighten(baseColor, 0.03)), side * 0.28, 0.34, 0.245));
    // Handle
    g.add(cylMat(0.006, 0.006, 0.1, handleMat, side * 0.05, 0.38, 0.26, 8));
  }

  // Door divider line
  g.add(box(0.005, 0.62, 0.02, darken(baseColor, 0.12), 0, 0.34, 0.245));

  return g;
}

/** Shoe Cabinet — angled tilt-out drawers, vented panels */
export function buildShoeCabinet(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const handleMat = metal("#A0A0A0");

  // Main body
  g.add(roundedBox(0.62, 1.52, 0.42, 0.015, woodMat, 0, 0.76, 0));

  // Top
  g.add(roundedBox(0.64, 0.025, 0.44, 0.008, wood(lighten(baseColor, 0.05)), 0, 1.52, 0));

  // Tilt-out drawer fronts (3)
  for (let i = 0; i < 3; i++) {
    const dy = 0.22 + i * 0.42;
    g.add(roundedBox(0.56, 0.36, 0.012, 0.008, wood(lighten(baseColor, 0.03)), 0, dy, 0.215));
    // Handle groove (recessed line)
    g.add(box(0.2, 0.008, 0.005, darken(baseColor, 0.1), 0, dy + 0.14, 0.225));
  }

  // Vent slits on sides (decorative)
  for (let v = 0; v < 3; v++) {
    g.add(box(0.005, 0.15, 0.005, darken(baseColor, 0.08), -0.31, 0.4 + v * 0.35, 0));
  }

  // Feet
  const footMat = metal("#555");
  g.add(cylMat(0.02, 0.02, 0.03, footMat, -0.25, 0.015, 0.16, 8));
  g.add(cylMat(0.02, 0.02, 0.03, footMat, 0.25, 0.015, 0.16, 8));
  g.add(cylMat(0.02, 0.02, 0.03, footMat, -0.25, 0.015, -0.16, 8));
  g.add(cylMat(0.02, 0.02, 0.03, footMat, 0.25, 0.015, -0.16, 8));

  return g;
}

/** Settee — smaller sofa, same enhanced detail style */
export function buildSettee(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const dark = darken(baseColor, 0.15);
  const light = lighten(baseColor, 0.1);
  const legCol = "#5C4A3A";

  // Frame base
  g.add(roundedBox(1.6, 0.16, 0.88, 0.035, fabric(dark), 0, 0.16, 0));

  // Seat cushions (2)
  g.add(cushion(0.7, 0.14, 0.64, baseColor, -0.38, 0.34, 0.05));
  g.add(cushion(0.7, 0.14, 0.64, baseColor, 0.38, 0.34, 0.05));
  g.add(pipingLine(0.64, dark, 0, 0.34, 0.05, "x"));

  // Back rest
  g.add(roundedBox(1.6, 0.42, 0.12, 0.03, fabric(dark), 0, 0.62, -0.38));

  // Back cushions (2)
  g.add(cushion(0.68, 0.34, 0.11, light, -0.38, 0.6, -0.32));
  g.add(cushion(0.68, 0.34, 0.11, light, 0.38, 0.6, -0.32));

  // Arms
  g.add(roundedBox(0.12, 0.3, 0.86, 0.035, fabric(dark), -0.8, 0.42, 0));
  g.add(roundedBox(0.12, 0.3, 0.86, 0.035, fabric(dark), 0.8, 0.42, 0));

  // Legs
  const legMat = wood(legCol);
  const lp = [[-0.72, 0.35], [0.72, 0.35], [-0.72, -0.35], [0.72, -0.35]];
  for (const [lx, lz] of lp) {
    g.add(cylMat(0.02, 0.025, 0.08, legMat, lx, 0.04, lz, 8));
  }

  return g;
}

/** Side Table — with small drawer */
export function buildSideTable(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const topMat = wood(baseColor);
  const legMat = metal("#4A4A4A");
  const handleMat = metal("#888");

  // Tabletop (rounded)
  g.add(roundedBox(0.5, 0.035, 0.5, 0.015, topMat, 0, 0.42, 0));

  // Small drawer under top
  g.add(roundedBox(0.4, 0.08, 0.4, 0.01, wood(darken(baseColor, 0.05)), 0, 0.37, 0));
  // Drawer face
  g.add(roundedBox(0.42, 0.08, 0.01, 0.005, wood(lighten(baseColor, 0.02)), 0, 0.37, 0.205));
  // Drawer knob
  g.add(sphereMat(0.012, handleMat, 0, 0.37, 0.22));

  // Lower shelf
  g.add(roundedBox(0.44, 0.02, 0.44, 0.01, wood(darken(baseColor, 0.08)), 0, 0.1, 0));

  // Hairpin legs (4)
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    g.add(cylMat(0.008, 0.008, 0.42, legMat, lx, 0.21, lz, 6));
    g.add(cylMat(0.008, 0.008, 0.42, legMat, lx + 0.02, 0.21, lz + 0.02, 6));
  }

  return g;
}

/** Lounge Chair — mid-century modern, angled legs, curved back */
export function buildLoungeChair(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const dark = darken(baseColor, 0.12);
  const legCol = "#5C4A3A";

  // Base shell
  g.add(roundedBox(0.84, 0.12, 0.82, 0.04, fabric(dark), 0, 0.16, 0));

  // Seat cushion (thick, puffy)
  g.add(cushion(0.68, 0.14, 0.62, baseColor, 0, 0.3, 0.04));

  // Back rest (curved — slight tilt via rotation)
  const backRest = roundedBox(0.82, 0.54, 0.1, 0.035, fabric(dark), 0, 0.53, -0.35);
  backRest.rotation.x = -0.08;
  g.add(backRest);

  // Back cushion
  const backCushion = cushion(0.64, 0.42, 0.1, lighten(baseColor, 0.05), 0, 0.52, -0.29);
  backCushion.rotation.x = -0.08;
  g.add(backCushion);

  // Arms (low, rounded)
  g.add(roundedBox(0.1, 0.22, 0.72, 0.03, leather(dark), -0.42, 0.32, 0.02));
  g.add(roundedBox(0.1, 0.22, 0.72, 0.03, leather(dark), 0.42, 0.32, 0.02));

  // Angled tapered wood legs
  const legMat = wood(legCol);
  const legH = 0.14;
  const angles = [
    { x: -0.34, z: 0.32, rx: 0, rz: 0.12 },
    { x: 0.34, z: 0.32, rx: 0, rz: -0.12 },
    { x: -0.34, z: -0.32, rx: 0, rz: 0.12 },
    { x: 0.34, z: -0.32, rx: 0, rz: -0.12 },
  ];
  for (const l of angles) {
    const leg = cylMat(0.02, 0.025, legH, legMat, l.x, legH / 2, l.z, 8);
    leg.rotation.z = l.rz;
    g.add(leg);
  }

  return g;
}

/** Bar Counter — thick countertop, paneled front, footrest rail */
export function buildBarCounter(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const topMat = wood(baseColor);
  const legMat = wood(darken(baseColor, 0.2));
  const railMat = metal("#888");

  // Thick countertop
  g.add(roundedBox(1.6, 0.06, 0.5, 0.015, topMat, 0, 1.02, 0));

  // Front panel (solid)
  g.add(roundedBox(1.54, 0.9, 0.04, 0.015, wood(darken(baseColor, 0.08)), 0, 0.52, 0.22));

  // Side panels
  g.add(roundedBox(0.04, 0.9, 0.44, 0.01, legMat, -0.76, 0.52, 0));
  g.add(roundedBox(0.04, 0.9, 0.44, 0.01, legMat, 0.76, 0.52, 0));

  // Internal shelf
  g.add(box(1.48, 0.02, 0.38, darken(baseColor, 0.1), 0, 0.4, 0));

  // Footrest rail (chrome tube)
  g.add(cylMat(0.015, 0.015, 1.5, railMat, 0, 0.22, 0.24, 12));
  // Rail brackets
  g.add(box(0.02, 0.06, 0.04, "#666", -0.6, 0.22, 0.24, { metalness: 0.5 }));
  g.add(box(0.02, 0.06, 0.04, "#666", 0.6, 0.22, 0.24, { metalness: 0.5 }));

  return g;
}

/** Bar Stool — swivel base, padded seat, chrome details */
export function buildBarStool(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const chromeMat = metal("#4A4A4A");
  const seatMat = leather(baseColor);

  // Padded seat
  g.add(roundedBox(0.36, 0.05, 0.36, 0.04, seatMat, 0, 0.74, 0));
  // Seat cushion top (puffy)
  g.add(cushion(0.32, 0.04, 0.32, lighten(baseColor, 0.06), 0, 0.78, 0));

  // Small backrest
  const backrest = roundedBox(0.34, 0.2, 0.03, 0.02, leather(darken(baseColor, 0.1)), 0, 0.88, -0.16);
  g.add(backrest);

  // Center pole
  g.add(cylMat(0.022, 0.022, 0.52, chromeMat, 0, 0.46, 0, 12));

  // Footrest ring
  g.add(torus(0.14, 0.012, chromeMat, 0, 0.3, 0));

  // 4-point base
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const bx = Math.cos(angle) * 0.16;
    const bz = Math.sin(angle) * 0.16;
    g.add(cylMat(0.02, 0.02, 0.32, chromeMat, bx, 0.01, bz, 6));
    // Foot pad
    g.add(cylMat(0.025, 0.025, 0.008, metal("#333"), bx, 0.004, bz, 8));
  }

  return g;
}

/** Dining Chair — upholstered seat, curved wood back, detailed joints */
export function buildDiningChair(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const dark = darken(baseColor, 0.15);
  const legCol = "#5C4A3A";
  const legMat = wood(legCol);

  // Upholstered seat
  g.add(roundedBox(0.42, 0.05, 0.42, 0.02, fabric(baseColor), 0, 0.455, 0));
  // Seat cushion
  g.add(cushion(0.38, 0.04, 0.38, lighten(baseColor, 0.05), 0, 0.49, 0));

  // Seat frame
  g.add(roundedBox(0.44, 0.025, 0.44, 0.008, legMat, 0, 0.42, 0));

  // Back rest (curved wood)
  g.add(roundedBox(0.38, 0.38, 0.025, 0.02, wood(darken(legCol, 0.05)), 0, 0.7, -0.19));

  // Back vertical slats (3)
  for (let s = -1; s <= 1; s++) {
    g.add(roundedBox(0.04, 0.32, 0.015, 0.005, legMat, s * 0.1, 0.67, -0.19));
  }

  // Legs (4, tapered)
  const lp = [
    { x: -0.18, z: 0.18, back: false },
    { x: 0.18, z: 0.18, back: false },
    { x: -0.18, z: -0.18, back: true },
    { x: 0.18, z: -0.18, back: true },
  ];
  for (const l of lp) {
    const h = l.back ? 0.9 : 0.43;
    const cy = l.back ? 0.45 : 0.215;
    g.add(cylMat(0.018, 0.015, h, legMat, l.x, cy, l.z, 8));
  }

  // Cross stretcher between front legs
  g.add(cylMat(0.01, 0.01, 0.32, legMat, 0, 0.12, 0.18, 6));

  return g;
}

/* ═══════════════════════════════════════════════════════
   NEW Furniture Types
   ═══════════════════════════════════════════════════════ */

/** Kitchen Island — thick countertop, open shelves, towel bar */
export function buildKitchenIsland(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const cabinetMat = wood(baseColor);
  const counterMat = marble(lighten(baseColor, 0.2));
  const handleMat = metal("#A0A0A0");

  // Base cabinet
  g.add(roundedBox(1.5, 0.82, 0.65, 0.02, cabinetMat, 0, 0.41, 0));

  // Marble countertop (overhangs)
  g.add(roundedBox(1.58, 0.05, 0.72, 0.015, counterMat, 0, 0.86, 0));

  // Cabinet doors (front, 3 panels)
  for (let i = -1; i <= 1; i++) {
    g.add(roundedBox(0.44, 0.7, 0.012, 0.008, wood(lighten(baseColor, 0.03)), i * 0.48, 0.39, 0.33));
    // Handle
    g.add(cylMat(0.006, 0.006, 0.1, handleMat, i * 0.48, 0.45, 0.345, 8));
  }

  // Open shelves on back side
  g.add(box(1.4, 0.02, 0.3, darken(baseColor, 0.05), 0, 0.25, -0.15));
  g.add(box(1.4, 0.02, 0.3, darken(baseColor, 0.05), 0, 0.55, -0.15));

  // Towel bar (side)
  g.add(cylMat(0.008, 0.008, 0.3, metal("#AAA"), 0.76, 0.35, 0, 8));
  // Towel bar brackets
  g.add(box(0.02, 0.04, 0.03, "#888", 0.76, 0.35, -0.14, { metalness: 0.5 }));
  g.add(box(0.02, 0.04, 0.03, "#888", 0.76, 0.35, 0.14, { metalness: 0.5 }));

  // Small items on counter
  g.add(cylMat(0.04, 0.035, 0.08, marble("#E0DDD5"), -0.5, 0.92, 0.15, 12));

  return g;
}

/** Wardrobe — double door, interior rod visible through gap, mirror accent */
export function buildWardrobe(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const handleMat = metal("#A0A0A0");

  // Main body
  g.add(roundedBox(1.2, 2.0, 0.58, 0.02, woodMat, 0, 1.0, 0));

  // Top molding
  g.add(roundedBox(1.24, 0.04, 0.62, 0.008, wood(lighten(baseColor, 0.04)), 0, 2.02, 0));

  // Doors (2)
  for (const side of [-1, 1]) {
    g.add(roundedBox(0.56, 1.88, 0.015, 0.01, wood(lighten(baseColor, 0.02)), side * 0.29, 0.98, 0.29));
    // Door panel inset (decorative rectangle)
    g.add(roundedBox(0.44, 0.8, 0.005, 0.008, wood(darken(baseColor, 0.05)), side * 0.29, 1.2, 0.3));
    g.add(roundedBox(0.44, 0.6, 0.005, 0.008, wood(darken(baseColor, 0.05)), side * 0.29, 0.4, 0.3));
    // Handle (vertical bar)
    g.add(cylMat(0.008, 0.008, 0.18, handleMat, side * 0.03, 1.0, 0.31, 8));
  }

  // Door gap line
  g.add(box(0.005, 1.9, 0.02, darken(baseColor, 0.15), 0, 0.98, 0.29));

  // Internal rod (visible through slight gap)
  g.add(cylMat(0.012, 0.012, 1.1, metal("#888"), 0, 1.7, 0, 8));

  // Feet
  const footMat = wood(darken(baseColor, 0.15));
  for (const [fx, fz] of [[-0.5, 0.22], [0.5, 0.22], [-0.5, -0.22], [0.5, -0.22]]) {
    g.add(cylMat(0.03, 0.03, 0.04, footMat, fx, 0.02, fz, 8));
  }

  return g;
}

/** Indoor Plant — decorative pot with layered foliage */
export function buildPlant(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const potMat = marble(baseColor);
  const soilColor = "#4A3828";
  const leafGreens = ["#3D6B3D", "#4A7C4A", "#2D5A2D", "#5A8A5A", "#3A7040"];

  // Pot (tapered cylinder)
  g.add(cylMat(0.14, 0.1, 0.22, potMat, 0, 0.11, 0, 16));
  // Pot rim
  g.add(cylMat(0.15, 0.15, 0.02, potMat, 0, 0.22, 0, 16));
  // Pot base
  g.add(cylMat(0.08, 0.1, 0.02, potMat, 0, 0.01, 0, 16));

  // Soil
  g.add(cylMat(0.12, 0.12, 0.02, mat(soilColor, { roughness: 0.95 }), 0, 0.21, 0, 16));

  // Foliage — cluster of spheres and elongated ellipsoids
  const leafMats = leafGreens.map(c => mat(c, { roughness: 0.85 }));

  // Main foliage mass
  g.add(sphereMat(0.14, leafMats[0], 0, 0.42, 0));
  g.add(sphereMat(0.12, leafMats[1], 0.08, 0.48, 0.05));
  g.add(sphereMat(0.12, leafMats[2], -0.06, 0.5, -0.04));
  g.add(sphereMat(0.1, leafMats[3], 0.04, 0.55, -0.06));
  g.add(sphereMat(0.08, leafMats[4], -0.03, 0.58, 0.04));

  // Stems (thin cylinders from soil to foliage)
  const stemMat = mat("#3A5A2A", { roughness: 0.8 });
  g.add(cylMat(0.008, 0.006, 0.2, stemMat, 0, 0.32, 0, 6));
  g.add(cylMat(0.006, 0.005, 0.18, stemMat, 0.04, 0.31, 0.02, 6));
  g.add(cylMat(0.006, 0.005, 0.16, stemMat, -0.03, 0.3, -0.02, 6));

  return g;
}

/** Large Indoor Plant (Floor Plant / Fiddle Leaf Fig style) */
export function buildFloorPlant(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const potMat = marble(baseColor);
  const leafGreens = ["#2D5A2D", "#3D6B3D", "#4A7C4A", "#3A7040", "#2A5530"];

  // Large pot
  g.add(cylMat(0.18, 0.14, 0.32, potMat, 0, 0.16, 0, 16));
  g.add(cylMat(0.19, 0.19, 0.025, potMat, 0, 0.325, 0, 16));
  g.add(cylMat(0.12, 0.14, 0.02, potMat, 0, 0.01, 0, 16));

  // Soil
  g.add(cylMat(0.16, 0.16, 0.02, mat("#4A3828", { roughness: 0.95 }), 0, 0.32, 0, 16));

  // Main trunk
  const trunkMat = mat("#5A4A38", { roughness: 0.8 });
  g.add(cylMat(0.025, 0.02, 0.7, trunkMat, 0, 0.68, 0, 8));

  // Branch stems
  const stemMat = mat("#4A5A2A", { roughness: 0.75 });
  const branches = [
    { x: 0.05, z: 0.02, h: 0.3, y: 0.95 },
    { x: -0.04, z: -0.03, h: 0.25, y: 0.88 },
    { x: 0.02, z: -0.04, h: 0.2, y: 1.05 },
  ];
  for (const b of branches) {
    const stem = cylMat(0.01, 0.008, b.h, stemMat, b.x, b.y, b.z, 6);
    stem.rotation.z = b.x * 3;
    stem.rotation.x = b.z * 2;
    g.add(stem);
  }

  // Large leaves (flattened spheres/ellipsoids)
  const leafMats = leafGreens.map(c => mat(c, { roughness: 0.82 }));
  const leafPositions = [
    { x: 0, y: 1.1, z: 0, r: 0.1 },
    { x: 0.12, y: 1.0, z: 0.05, r: 0.09 },
    { x: -0.1, y: 1.05, z: -0.06, r: 0.08 },
    { x: 0.05, y: 1.18, z: -0.04, r: 0.09 },
    { x: -0.06, y: 1.15, z: 0.06, r: 0.07 },
    { x: 0.08, y: 0.95, z: 0.08, r: 0.08 },
    { x: -0.08, y: 0.92, z: -0.08, r: 0.07 },
  ];
  for (let i = 0; i < leafPositions.length; i++) {
    const lp = leafPositions[i];
    const leaf = sphereMat(lp.r, leafMats[i % leafMats.length], lp.x, lp.y, lp.z);
    leaf.scale.set(1.3, 0.6, 1.3);
    g.add(leaf);
  }

  return g;
}

/** Area Rug — flat textured rectangle with fringe */
export function buildRug(baseColor: string): THREE.Group {
  const g = new THREE.Group();

  // Main rug body (very thin)
  g.add(roundedBox(2.0, 0.015, 1.4, 0.015, fabric(baseColor, { roughness: 0.95 }), 0, 0.0075, 0));

  // Border stripe
  g.add(roundedBox(2.02, 0.003, 1.42, 0.01, fabric(darken(baseColor, 0.15)), 0, 0.016, 0));
  // Inner border
  g.add(roundedBox(1.8, 0.003, 1.2, 0.01, fabric(darken(baseColor, 0.08)), 0, 0.017, 0));

  // Center pattern (simple geometric — lighter rectangle)
  g.add(roundedBox(1.2, 0.003, 0.8, 0.01, fabric(lighten(baseColor, 0.08)), 0, 0.018, 0));

  // Fringe on short ends
  const fringeMat = fabric(lighten(baseColor, 0.12));
  for (let fx = -0.9; fx <= 0.9; fx += 0.06) {
    g.add(cylMat(0.004, 0.004, 0.06, fringeMat, fx, 0.005, -0.73, 4));
    g.add(cylMat(0.004, 0.004, 0.06, fringeMat, fx, 0.005, 0.73, 4));
  }

  return g;
}

/** Nightstand — small bedside table with drawer and shelf */
export function buildNightstand(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const handleMat = metal("#A0A0A0");

  // Main body
  g.add(roundedBox(0.5, 0.52, 0.4, 0.015, woodMat, 0, 0.3, 0));

  // Top surface
  g.add(roundedBox(0.52, 0.025, 0.42, 0.008, wood(lighten(baseColor, 0.05)), 0, 0.56, 0));

  // Drawer
  g.add(roundedBox(0.44, 0.18, 0.012, 0.008, wood(lighten(baseColor, 0.03)), 0, 0.44, 0.2));
  // Drawer handle (knob)
  g.add(sphereMat(0.015, handleMat, 0, 0.44, 0.215));

  // Open shelf below
  g.add(box(0.44, 0.02, 0.34, darken(baseColor, 0.05), 0, 0.25, 0));

  // Tapered legs
  const legMat = wood(darken(baseColor, 0.15));
  for (const [lx, lz] of [[-0.2, 0.15], [0.2, 0.15], [-0.2, -0.15], [0.2, -0.15]]) {
    g.add(cylMat(0.018, 0.022, 0.08, legMat, lx, 0.04, lz, 8));
  }

  // Decorative items on top
  // Small alarm clock
  g.add(roundedBox(0.06, 0.06, 0.03, 0.008, mat("#2A2A2A"), 0.12, 0.6, 0.05));
  g.add(box(0.04, 0.04, 0.002, "#1A3A1A", 0.12, 0.6, 0.065, { roughness: 0.1 }));

  return g;
}

/** Toilet — modern one-piece design */
export function buildToilet(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const porcelainMat = marble(baseColor);
  const chromeMat = metal("#C0C0C0");

  // Base (oval footprint)
  g.add(cylMat(0.2, 0.22, 0.06, porcelainMat, 0, 0.03, 0.08, 16));

  // Bowl (elongated oval)
  const bowlGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.3, 16);
  const bowl = new THREE.Mesh(bowlGeo, porcelainMat);
  bowl.position.set(0, 0.2, 0.1);
  g.add(bowl);

  // Bowl interior (dark)
  g.add(cylMat(0.14, 0.14, 0.05, mat("#E8E8EC", { roughness: 0.15 }), 0, 0.32, 0.1, 16));

  // Seat
  g.add(cylMat(0.19, 0.19, 0.025, marble(lighten(baseColor, 0.02)), 0, 0.36, 0.1, 16));

  // Lid (tilted back slightly)
  const lid = cylMat(0.19, 0.19, 0.02, porcelainMat, 0, 0.38, 0.1, 16);
  g.add(lid);

  // Tank (back box)
  g.add(roundedBox(0.36, 0.4, 0.18, 0.03, porcelainMat, 0, 0.38, -0.18));
  // Tank lid
  g.add(roundedBox(0.38, 0.03, 0.2, 0.015, marble(lighten(baseColor, 0.01)), 0, 0.59, -0.18));

  // Flush handle
  g.add(cylMat(0.008, 0.008, 0.06, chromeMat, 0.2, 0.52, -0.18, 8));
  g.add(sphereMat(0.012, chromeMat, 0.23, 0.52, -0.18));

  return g;
}

/** Kitchen Range / Oven — 4 burners, oven door, control knobs */
export function buildOven(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(baseColor, { roughness: 0.25, metalness: 0.2 });
  const chromeMat = metal("#B8B8B8");
  const grateMat = metal("#3A3A3A");

  // Main body
  g.add(_mesh(new THREE.BoxGeometry(0.72, 0.84, 0.62), bodyMat, 0, 0.44, 0));

  // Cooktop surface
  g.add(box(0.74, 0.025, 0.64, "#1A1A1A", 0, 0.87, 0, { roughness: 0.15 }));

  // 4 Burner grates (circles)
  const burnerPositions = [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]];
  for (const [bx, bz] of burnerPositions) {
    g.add(torus(0.08, 0.006, grateMat, bx, 0.89, bz));
    g.add(torus(0.04, 0.005, grateMat, bx, 0.89, bz));
    // Grate bars (cross)
    g.add(cylMat(0.004, 0.004, 0.16, grateMat, bx, 0.89, bz, 4));
    const crossBar = cylMat(0.004, 0.004, 0.16, grateMat, bx, 0.89, bz, 4);
    crossBar.rotation.y = Math.PI / 2;
    g.add(crossBar);
  }

  // Oven door
  g.add(roundedBox(0.64, 0.52, 0.015, 0.01, mat(lighten(baseColor, 0.02), { roughness: 0.2 }), 0, 0.3, 0.31));
  // Oven window
  g.add(roundedBox(0.42, 0.24, 0.008, 0.008, glass("#111", 0.6), 0, 0.38, 0.32));

  // Oven handle
  g.add(cylMat(0.01, 0.01, 0.5, chromeMat, 0, 0.6, 0.34, 8));
  // Handle brackets
  g.add(box(0.02, 0.03, 0.03, "#888", -0.2, 0.6, 0.33, { metalness: 0.5 }));
  g.add(box(0.02, 0.03, 0.03, "#888", 0.2, 0.6, 0.33, { metalness: 0.5 }));

  // Control knobs (5 across top)
  for (let i = -2; i <= 2; i++) {
    g.add(cylMat(0.018, 0.018, 0.015, chromeMat, i * 0.12, 0.82, 0.32, 12));
  }

  return g;
}

/** Ottoman / Pouf — round, tufted, low */
export function buildOttoman(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const fabricMat = fabric(baseColor);

  // Main body (squat cylinder)
  g.add(cylMat(0.25, 0.28, 0.3, fabricMat, 0, 0.15, 0, 24));

  // Top cushion (puffy dome)
  g.add(sphereMat(0.24, fabric(lighten(baseColor, 0.05)), 0, 0.32, 0));

  // Tufting buttons on top
  const tuftMat = fabric(darken(baseColor, 0.2));
  g.add(sphereMat(0.012, tuftMat, 0, 0.34, 0));
  for (let a = 0; a < 6; a++) {
    const angle = (a / 6) * Math.PI * 2;
    g.add(sphereMat(0.01, tuftMat, Math.cos(angle) * 0.1, 0.33, Math.sin(angle) * 0.1));
  }

  // Vertical seam lines (pleats)
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    const sx = Math.cos(angle) * 0.265;
    const sz = Math.sin(angle) * 0.265;
    g.add(cylMat(0.005, 0.005, 0.28, fabric(darken(baseColor, 0.06)), sx, 0.14, sz, 4));
  }

  // Short feet hidden underneath
  for (let a = 0; a < 4; a++) {
    const angle = (a / 4) * Math.PI * 2;
    g.add(cylMat(0.015, 0.015, 0.02, mat("#555"), Math.cos(angle) * 0.2, 0.01, Math.sin(angle) * 0.2, 6));
  }

  return g;
}

/** Dresser — wide, 6 drawers (2 columns × 3 rows), mirror optional */
export function buildDresser(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);
  const handleMat = metal("#A8A8A8");

  // Main body
  g.add(roundedBox(1.2, 0.82, 0.48, 0.02, woodMat, 0, 0.41, 0));

  // Top surface
  g.add(roundedBox(1.22, 0.025, 0.5, 0.01, wood(lighten(baseColor, 0.06)), 0, 0.835, 0));

  // 6 Drawer fronts (3 rows × 2 columns)
  for (let row = 0; row < 3; row++) {
    for (let col = -1; col <= 1; col += 2) {
      const dy = 0.14 + row * 0.25;
      const dx = col * 0.28;
      g.add(roundedBox(0.52, 0.2, 0.012, 0.008, wood(lighten(baseColor, 0.03)), dx, dy, 0.24));
      // Handle
      g.add(cylMat(0.006, 0.006, 0.08, handleMat, dx, dy, 0.255, 8));
    }
  }

  // Drawer divider lines
  g.add(box(0.005, 0.78, 0.02, darken(baseColor, 0.12), 0, 0.41, 0.24));
  for (let row = 0; row < 2; row++) {
    g.add(box(1.14, 0.005, 0.02, darken(baseColor, 0.1), 0, 0.27 + row * 0.25, 0.24));
  }

  // Feet
  const footMat = wood(darken(baseColor, 0.15));
  for (const [fx, fz] of [[-0.52, 0.18], [0.52, 0.18], [-0.52, -0.18], [0.52, -0.18]]) {
    g.add(cylMat(0.025, 0.025, 0.04, footMat, fx, 0.02, fz, 8));
  }

  // Decorative items on top (small tray + candle)
  g.add(roundedBox(0.18, 0.015, 0.12, 0.008, metal("#C8B890"), -0.35, 0.855, 0));
  g.add(cylMat(0.025, 0.025, 0.08, mat("#F5F0E8"), 0.3, 0.88, 0, 12));
  // Candle wick
  g.add(cylMat(0.003, 0.003, 0.015, mat("#444"), 0.3, 0.925, 0, 4));

  return g;
}

/** Console Table — narrow, for entryways */
export function buildConsoleTable(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const topMat = wood(baseColor);
  const legMat = metal("#444");

  // Top surface (narrow, long)
  g.add(roundedBox(1.2, 0.035, 0.35, 0.012, topMat, 0, 0.76, 0));

  // Lower shelf (narrower)
  g.add(roundedBox(1.05, 0.02, 0.28, 0.008, wood(darken(baseColor, 0.08)), 0, 0.2, 0));

  // Hairpin legs (4 sets)
  for (const [lx, lz] of [[-0.52, -0.12], [0.52, -0.12], [-0.52, 0.12], [0.52, 0.12]]) {
    g.add(cylMat(0.008, 0.008, 0.76, legMat, lx, 0.38, lz, 6));
    g.add(cylMat(0.008, 0.008, 0.76, legMat, lx + 0.02, 0.38, lz, 6));
  }

  // Decorative items on top
  // Vase
  g.add(cylMat(0.04, 0.03, 0.12, marble("#D8D0C8"), -0.35, 0.84, 0, 12));
  g.add(sphereMat(0.042, marble("#D8D0C8"), -0.35, 0.9, 0));
  // Small frame
  g.add(box(0.08, 0.1, 0.012, "#3A3A3A", 0.35, 0.84, 0));
  g.add(box(0.065, 0.085, 0.005, "#D8C8B0", 0.35, 0.84, 0.01));
  // Keys/tray
  g.add(roundedBox(0.14, 0.01, 0.1, 0.01, marble("#E8E0D4"), 0, 0.785, 0));

  return g;
}

/** Wine Rack — diamond grid pattern, holds bottles */
export function buildWineRack(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = wood(baseColor);

  // Frame
  g.add(roundedBox(0.6, 0.9, 0.3, 0.01, woodMat, 0, 0.45, 0));

  // Back panel
  g.add(box(0.56, 0.86, 0.01, darken(baseColor, 0.1), 0, 0.45, -0.14));

  // Diamond grid dividers
  const divMat = wood(darken(baseColor, 0.08));
  // Horizontal shelves
  for (let i = 0; i < 4; i++) {
    g.add(box(0.56, 0.015, 0.26, darken(baseColor, 0.05), 0, 0.06 + i * 0.28, 0));
  }
  // Vertical dividers
  for (let i = 0; i < 3; i++) {
    g.add(box(0.015, 0.84, 0.26, darken(baseColor, 0.05), -0.2 + i * 0.2, 0.45, 0));
  }

  // Wine bottles (in some slots)
  const bottleColors = ["#4A1A2A", "#2A3A1A", "#3A2A1A", "#1A2A3A"];
  const bottleSlots = [
    { x: -0.2, y: 0.16 }, { x: 0, y: 0.16 }, { x: 0.2, y: 0.16 },
    { x: -0.2, y: 0.44 }, { x: 0.2, y: 0.44 },
    { x: 0, y: 0.72 },
  ];
  for (let i = 0; i < bottleSlots.length; i++) {
    const slot = bottleSlots[i];
    const bColor = bottleColors[i % bottleColors.length];
    // Bottle body (horizontal)
    const bottle = cylMat(0.025, 0.025, 0.24, glass(bColor, 0.7), slot.x, slot.y, 0, 8);
    bottle.rotation.x = Math.PI / 2;
    g.add(bottle);
    // Bottle neck
    const neck = cylMat(0.012, 0.012, 0.06, glass(bColor, 0.7), slot.x, slot.y, 0.15, 6);
    neck.rotation.x = Math.PI / 2;
    g.add(neck);
  }

  return g;
}

/** Round Dining Table — circular top, pedestal base */
export function buildRoundTable(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const topMat = wood(baseColor);
  const baseMat = wood(darken(baseColor, 0.15));

  // Circular top
  g.add(cylMat(0.55, 0.55, 0.05, topMat, 0, 0.73, 0, 32));
  // Edge detail
  g.add(torus(0.54, 0.015, wood(darken(baseColor, 0.05)), 0, 0.73, 0));

  // Pedestal column
  g.add(cylMat(0.08, 0.1, 0.58, baseMat, 0, 0.39, 0, 16));

  // Base feet (4 curved feet)
  for (let a = 0; a < 4; a++) {
    const angle = (a / 4) * Math.PI * 2 + Math.PI / 4;
    const fx = Math.cos(angle) * 0.25;
    const fz = Math.sin(angle) * 0.25;
    g.add(roundedBox(0.06, 0.04, 0.22, 0.015, baseMat, fx, 0.02, fz));
  }

  return g;
}

/** Ceiling Fan — 4 blades, central motor housing, pull chain */
export function buildCeilingFan(_baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const motorMat = metal("#888");
  const bladeMat = wood("#8B7355");
  const chainMat = metal("#AAA");

  // Ceiling mount
  g.add(cylMat(0.06, 0.06, 0.04, motorMat, 0, 2.78, 0, 16));
  // Down rod
  g.add(cylMat(0.015, 0.015, 0.15, motorMat, 0, 2.69, 0, 8));
  // Motor housing
  g.add(cylMat(0.1, 0.1, 0.08, motorMat, 0, 2.6, 0, 16));
  g.add(cylMat(0.08, 0.08, 0.03, metal("#777"), 0, 2.55, 0, 16));

  // 4 Blades
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const blade = _mesh(
      new THREE.BoxGeometry(0.12, 0.01, 0.5),
      bladeMat,
      Math.cos(angle) * 0.3, 2.58, Math.sin(angle) * 0.3,
    );
    blade.rotation.y = -angle;
    g.add(blade);
  }

  // Light kit (small globe underneath)
  g.add(sphereMat(0.06, glass("#FFF8E0", 0.4), 0, 2.5, 0));
  // Bulb inside
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshStandardMaterial({
      color: "#FFF5D4", emissive: "#FFF5D4", emissiveIntensity: 0.5,
    }),
  );
  bulb.position.set(0, 2.5, 0);
  g.add(bulb);

  // Pull chain
  g.add(cylMat(0.003, 0.003, 0.15, chainMat, 0.04, 2.42, 0, 4));
  g.add(sphereMat(0.008, chainMat, 0.04, 2.34, 0));

  return g;
}

/** Shower Enclosure — glass panels, rain showerhead, chrome fixtures */
export function buildShower(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const chromeMat = metal("#C0C0C0");

  // Base tray
  g.add(roundedBox(0.9, 0.05, 0.9, 0.02, marble(baseColor), 0, 0.025, 0));

  // Glass panels (2 sides — back and one side, other side is "door")
  const glassMat = glass("#D8E4EC", 0.15);
  // Back panel
  g.add(_mesh(new THREE.BoxGeometry(0.9, 2.0, 0.01), glassMat, 0, 1.05, -0.44));
  // Side panel
  g.add(_mesh(new THREE.BoxGeometry(0.01, 2.0, 0.9), glassMat, -0.44, 1.05, 0));

  // Chrome frame edges
  g.add(cylMat(0.012, 0.012, 2.0, chromeMat, -0.44, 1.05, -0.44, 6));
  g.add(cylMat(0.012, 0.012, 2.0, chromeMat, 0.44, 1.05, -0.44, 6));
  g.add(cylMat(0.012, 0.012, 2.0, chromeMat, -0.44, 1.05, 0.44, 6));

  // Rain showerhead
  g.add(cylMat(0.12, 0.12, 0.015, chromeMat, 0, 2.05, -0.3, 24));
  // Shower arm
  g.add(cylMat(0.015, 0.015, 0.2, chromeMat, 0, 1.96, -0.38, 8));
  // Vertical pipe
  g.add(cylMat(0.015, 0.015, 0.5, chromeMat, 0, 1.8, -0.42, 8));

  // Controls
  g.add(cylMat(0.025, 0.025, 0.02, chromeMat, 0, 1.2, -0.42, 12));
  g.add(cylMat(0.02, 0.02, 0.03, chromeMat, 0, 1.2, -0.4, 8));

  // Drain
  g.add(cylMat(0.03, 0.03, 0.005, chromeMat, 0, 0.05, 0, 12));

  return g;
}

/** Wall Mirror — round, with frame */
export function buildMirror(baseColor: string): THREE.Group {
  const g = new THREE.Group();
  const frameMat = metal(baseColor);

  // Mirror surface (very reflective)
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: "#E8EEF4",
    roughness: 0.02,
    metalness: 0.95,
  });
  g.add(cylMat(0.35, 0.35, 0.01, mirrorMat, 0, 1.4, -0.01, 32));

  // Frame ring
  g.add(torus(0.36, 0.02, frameMat, 0, 1.4, -0.005));

  // Wall mount bracket
  g.add(box(0.06, 0.06, 0.02, darken(baseColor, 0.2), 0, 1.4, -0.03, { metalness: 0.5 }));

  return g;
}

/* ═══════════════════════════════════════════════════════
   Model Factory
   ═══════════════════════════════════════════════════════ */
export function buildFurnitureModel(furnitureId: string, color: string): THREE.Group {
  switch (furnitureId) {
    case "sofa": return buildSofa(color);
    case "armchair": return buildArmchair(color);
    case "dining-table": return buildDiningTable(color);
    case "coffee-table": return buildCoffeeTable(color);
    case "queen-bed": return buildBed(color, 1.6);
    case "king-bed": return buildBed(color, 1.9);
    case "bookshelf": return buildBookshelf(color);
    case "tv-console": return buildTVConsole(color);
    case "floor-lamp": return buildFloorLamp(color);
    case "pendant": return buildPendantLight(color);
    case "fridge": return buildFridge(color);
    case "washer": return buildWasher(color);
    case "tv": return buildTV(color);
    case "desk": return buildDeskSetup(color);
    case "bathtub": return buildBathtub(color);
    case "vanity": return buildVanity(color);
    case "shoe-cabinet": return buildShoeCabinet(color);
    case "settee": return buildSettee(color);
    case "side-table": return buildSideTable(color);
    case "lounge-chair": return buildLoungeChair(color);
    case "bar-counter": return buildBarCounter(color);
    case "bar-stool": return buildBarStool(color);
    case "dining-chair": return buildDiningChair(color);
    // New types
    case "kitchen-island": return buildKitchenIsland(color);
    case "wardrobe": return buildWardrobe(color);
    case "plant": return buildPlant(color);
    case "floor-plant": return buildFloorPlant(color);
    case "rug": return buildRug(color);
    case "nightstand": return buildNightstand(color);
    case "toilet": return buildToilet(color);
    case "oven": return buildOven(color);
    case "ottoman": return buildOttoman(color);
    case "dresser": return buildDresser(color);
    case "console-table": return buildConsoleTable(color);
    case "wine-rack": return buildWineRack(color);
    case "round-table": return buildRoundTable(color);
    case "ceiling-fan": return buildCeilingFan(color);
    case "shower": return buildShower(color);
    case "mirror": return buildMirror(color);
    // New HDB spec items
    case "sofa-2": return buildSofa2(color);
    case "single-bed": return buildBed(color, 0.91);
    case "super-single": return buildBed(color, 1.07);
    case "office-chair": return buildOfficeChair(color);
    case "dining-table-6": return buildDiningTable(color);
    case "desk-setup": return buildDeskSetup(color);
    case "bookshelf-sm": return buildBookshelfSmall(color);
    case "wardrobe-3": return buildWardrobe3(color);
    case "storage-rack": return buildStorageRack(color);
    case "kitchen-counter": return buildKitchenCounter(color);
    case "upper-cabinet": return buildUpperCabinet(color);
    case "lower-cabinet": return buildLowerCabinet(color);
    case "microwave": return buildMicrowave(color);
    case "kitchen-sink": return buildKitchenSink(color);
    case "wash-basin": return buildWashBasin(color);
    case "vanity-cabinet": return buildVanityCabinet(color);
    case "towel-rack": return buildTowelRack(color);
    case "bath-mirror": return buildBathMirror(color);
    case "ironing-board": return buildIroningBoard(color);
    case "vacuum": return buildVacuum(color);
    // ── Expanded catalog ──
    case "recliner": return buildRecliner(color);
    case "bean-bag": return buildBeanBag(color);
    case "l-sofa": return buildLSofa(color);
    case "daybed": return buildDaybed(color);
    case "murphy-bed": return buildMurphyBed(color);
    case "sideboard": return buildSideboard(color);
    case "hall-closet": return buildHallCloset(color);
    case "folding-table": return buildFoldingTable(color);
    case "nesting-tables": return buildNestingTables(color);
    case "standing-desk": return buildStandingDesk(color);
    case "filing-cabinet": return buildFilingCabinet(color);
    case "office-bookshelf": return buildOfficeBookshelf(color);
    case "whiteboard": return buildWhiteboard(color);
    case "crib": return buildCrib(color);
    case "bunk-bed": return buildBunkBed(color);
    case "toy-box": return buildToyBox(color);
    case "kids-desk": return buildKidsDesk(color);
    case "kids-chair": return buildKidsChair(color);
    case "changing-table": return buildChangingTable(color);
    case "pantry-shelf": return buildPantryShelf(color);
    case "bidet": return buildBidet(color);
    case "laundry-basket": return buildLaundryBasket(color);
    case "reception-desk": return buildReceptionDesk(color);
    case "waiting-bench": return buildWaitingBench(color);
    case "display-shelf": return buildDisplayShelf(color);
    case "locker-unit": return buildLockerUnit(color);
    case "table-lamp": return buildTableLamp(color);
    case "wall-sconce": return buildWallSconce(color);
    case "chandelier": return buildChandelier(color);
    case "led-strip": return buildLedStrip(color);
    case "desk-lamp": return buildDeskLamp(color);
    case "wall-socket": return buildWallSocket(color);
    case "light-switch": return buildLightSwitch(color);
    case "usb-outlet": return buildWallSocket(color);
    case "dryer": return buildDryer(color);
    case "robot-vacuum": return buildRobotVacuum(color);
    case "steam-mop": return buildSteamMop(color);
    case "tv-55": return buildTV55(color);
    case "projector": return buildProjector(color);
    case "projector-screen": return buildProjectorScreen(color);
    case "dishwasher": return buildDishwasher(color);
    case "coffee-machine": return buildCoffeeMachine(color);
    case "toaster-oven": return buildToasterOven(color);
    case "range-hood": return buildRangeHood(color);
    case "air-conditioner": return buildAirConditioner(color);
    case "space-heater": return buildSpaceHeater(color);
    case "humidifier": return buildHumidifier(color);
    case "tower-fan": return buildTowerFan(color);
    case "desktop-pc": return buildDesktopPC(color);
    case "laptop": return buildLaptopModel(color);
    case "monitor-stand": return buildMonitorStand(color);
    case "printer": return buildPrinter(color);
    case "bt-speaker": return buildBtSpeaker(color);
    case "soundbar": return buildSoundbar(color);
    case "bookshelf-speakers": return buildBookshelfSpeakers(color);
    case "turntable": return buildTurntable(color);
    case "treadmill": return buildTreadmill(color);
    case "exercise-bike": return buildExerciseBike(color);
    case "weight-bench": return buildWeightBench(color);
    case "elliptical": return buildElliptical(color);
    case "wall-art": return buildWallArt(color);
    case "vase": return buildVase(color);
    case "wall-clock": return buildWallClock(color);
    case "photo-frames": return buildPhotoFrames(color);
    case "sculpture": return buildSculpture(color);
    case "curtain": return buildCurtain(color);
    case "roman-blind": return buildRomanBlind(color);
    case "roller-shade": return buildRollerShade(color);
    case "sheer-curtain": return buildSheerCurtain(color);
    case "runner-rug": return buildRunnerRug(color);
    case "round-rug": return buildRoundRug(color);
    case "bath-mat": return buildBathMat(color);
    case "knife-block": return buildKnifeBlock(color);
    case "fruit-bowl": return buildFruitBowl(color);
    case "spice-rack": return buildSpiceRack(color);
    case "dish-rack": return buildDishRack(color);
    case "electric-fireplace": return buildElectricFireplace(color);
    case "wood-fireplace": return buildWoodFireplace(color);
    case "gas-fireplace": return buildGasFireplace(color);
    case "hanging-plant": return buildHangingPlant(color);
    case "succulent-set": return buildSucculentSet(color);
    case "herb-garden": return buildHerbGarden(color);
    case "fiddle-leaf": return buildFiddleLeaf(color);
    case "standing-figure": return buildStandingFigure(color);
    case "seated-figure": return buildSeatedFigure(color);
    case "upright-piano": return buildUprightPiano(color);
    case "grand-piano": return buildGrandPiano(color);
    case "guitar-stand": return buildGuitarStand(color);
    case "drum-kit": return buildDrumKit(color);
    case "yoga-mat": return buildYogaMat(color);
    case "punching-bag": return buildPunchingBag(color);
    case "dumbbell-rack": return buildDumbbellRack(color);
    case "christmas-tree": return buildChristmasTree(color);
    case "menorah": return buildMenorah(color);
    case "pet-bed": return buildPetBed(color);
    case "cat-tree": return buildCatTree(color);
    case "fish-tank": return buildFishTank(color);
    case "pet-crate": return buildPetCrate(color);
    case "stone-path": return buildStonePath(color);
    case "lawn-patch": return buildLawnPatch(color);
    case "gravel-path": return buildGravelPath(color);
    case "outdoor-table": return buildOutdoorTable(color);
    case "outdoor-chair": return buildOutdoorChair(color);
    case "garden-bench": return buildGardenBench(color);
    case "hammock": return buildHammock(color);
    case "outdoor-lounge": return buildOutdoorLounge(color);
    case "oak-tree": return buildOakTree(color);
    case "palm-tree": return buildPalmTree(color);
    case "hedge": return buildHedge(color);
    case "flower-bed": return buildFlowerBed(color);
    case "shrub": return buildShrub(color);
    case "car": return buildCar(color);
    case "suv": return buildSUV(color);
    case "tool-bench": return buildToolBench(color);
    case "storage-shelving": return buildStorageShelving(color);
    case "swimming-pool": return buildSwimmingPool(color);
    case "hot-tub": return buildHotTub(color);
    case "pool-lounger": return buildPoolLounger(color);
    case "garden-light": return buildGardenLight(color);
    case "solar-lamp": return buildSolarLamp(color);
    case "path-light": return buildPathLight(color);
    case "string-lights": return buildStringLights(color);
    case "bbq-grill": return buildBBQGrill(color);
    case "fire-pit": return buildFirePit(color);
    case "playground-set": return buildPlaygroundSet(color);
    case "trampoline": return buildTrampoline(color);
    default: {
      // Fallback: simple rounded box
      const g = new THREE.Group();
      g.add(roundedBox(0.8, 0.6, 0.6, 0.04, mat(color, { roughness: 0.6 }), 0, 0.3, 0));
      return g;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   Color Helpers
   ═══════════════════════════════════════════════════════ */
function darken(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.max(0, c.r - amount);
  c.g = Math.max(0, c.g - amount);
  c.b = Math.max(0, c.b - amount);
  return "#" + c.getHexString();
}

function lighten(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return "#" + c.getHexString();
}

/* ═══════════════════════════════════════════════════════
   New HDB Spec Furniture Builders
   ═══════════════════════════════════════════════════════ */

function buildSofa2(color: string): THREE.Group {
  const g = new THREE.Group();
  const f = fabric(color);
  // Seat
  g.add(roundedBox(1.5, 0.22, 0.85, 0.04, f, 0, 0.28, 0));
  // Back
  g.add(roundedBox(1.5, 0.45, 0.12, 0.04, f, 0, 0.55, -0.36));
  // Arms
  const armMat = fabric(darken(color, 0.06));
  g.add(roundedBox(0.12, 0.32, 0.75, 0.03, armMat, -0.69, 0.42, 0.04));
  g.add(roundedBox(0.12, 0.32, 0.75, 0.03, armMat, 0.69, 0.42, 0.04));
  // Legs
  const legM = metal("#3A3A3A", { roughness: 0.3, metalness: 0.5 });
  for (const [lx, lz] of [[-0.6, 0.3], [0.6, 0.3], [-0.6, -0.3], [0.6, -0.3]]) {
    g.add(cylMat(0.025, 0.025, 0.15, legM, lx, 0.075, lz, 8));
  }
  // Cushions
  const cushF = fabric(lighten(color, 0.04));
  g.add(roundedBox(0.65, 0.1, 0.7, 0.03, cushF, -0.35, 0.44, 0.04));
  g.add(roundedBox(0.65, 0.1, 0.7, 0.03, cushF, 0.35, 0.44, 0.04));
  return g;
}

function buildOfficeChair(color: string): THREE.Group {
  const g = new THREE.Group();
  const meshMat = fabric(color);
  // Base star (5 arms)
  const baseMat = metal("#2D2D2D");
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), baseMat);
    arm.position.set(Math.cos(angle) * 0.14, 0.015, Math.sin(angle) * 0.14);
    arm.rotation.y = -angle;
    g.add(arm);
    // Caster
    g.add(cylMat(0.02, 0.02, 0.025, baseMat, Math.cos(angle) * 0.28, 0.012, Math.sin(angle) * 0.28, 8));
  }
  // Cylinder
  g.add(cylMat(0.03, 0.03, 0.38, baseMat, 0, 0.22, 0, 12));
  // Seat
  g.add(roundedBox(0.48, 0.06, 0.46, 0.03, meshMat, 0, 0.44, 0));
  // Backrest
  g.add(roundedBox(0.44, 0.42, 0.04, 0.03, meshMat, 0, 0.74, -0.21));
  // Armrests
  const armM = mat("#4A4A4A");
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), armM, -0.24, 0.58, -0.04));
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.03, 0.2), armM, 0.24, 0.58, -0.04));
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), armM, -0.24, 0.5, 0.06));
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), armM, 0.24, 0.5, 0.06));
  return g;
}

function buildBookshelfSmall(color: string): THREE.Group {
  const g = new THREE.Group();
  const w = wood(color);
  const bw = 0.6, bd = 0.25, bh = 1.2;
  // Sides
  g.add(_mesh(new THREE.BoxGeometry(0.025, bh, bd), w, -bw / 2, bh / 2, 0));
  g.add(_mesh(new THREE.BoxGeometry(0.025, bh, bd), w, bw / 2, bh / 2, 0));
  // Top/bottom
  g.add(_mesh(new THREE.BoxGeometry(bw, 0.025, bd), w, 0, 0.012, 0));
  g.add(_mesh(new THREE.BoxGeometry(bw, 0.025, bd), w, 0, bh, 0));
  // Shelves
  for (let i = 1; i < 4; i++) {
    g.add(_mesh(new THREE.BoxGeometry(bw - 0.05, 0.02, bd - 0.02), w, 0, (bh / 4) * i, 0));
  }
  // Back panel
  g.add(_mesh(new THREE.BoxGeometry(bw - 0.04, bh - 0.04, 0.01), mat(darken(color, 0.1)), 0, bh / 2, -bd / 2 + 0.005));
  return g;
}

function buildWardrobe3(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  const ww = 1.8, wd = 0.6, wh = 2.1;
  // Main box
  g.add(roundedBox(ww, wh, wd, 0.02, m, 0, wh / 2, 0));
  // Door lines
  const lineMat = mat(darken(color, 0.08));
  g.add(_mesh(new THREE.BoxGeometry(0.01, wh - 0.08, 0.01), lineMat, -ww / 6, wh / 2, wd / 2 + 0.005));
  g.add(_mesh(new THREE.BoxGeometry(0.01, wh - 0.08, 0.01), lineMat, ww / 6, wh / 2, wd / 2 + 0.005));
  // Handles
  const hMat = metal("#888888");
  g.add(cylMat(0.01, 0.01, 0.06, hMat, -ww / 6 + 0.08, wh * 0.5, wd / 2 + 0.015, 8));
  g.add(cylMat(0.01, 0.01, 0.06, hMat, ww / 6 - 0.08, wh * 0.5, wd / 2 + 0.015, 8));
  return g;
}

function buildStorageRack(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = metal(color);
  const rw = 0.9, rd = 0.45, rh = 1.8;
  // 4 vertical poles
  for (const [px, pz] of [[-rw / 2 + 0.02, -rd / 2 + 0.02], [rw / 2 - 0.02, -rd / 2 + 0.02], [-rw / 2 + 0.02, rd / 2 - 0.02], [rw / 2 - 0.02, rd / 2 - 0.02]]) {
    g.add(cylMat(0.015, 0.015, rh, m, px, rh / 2, pz, 8));
  }
  // 4 shelves
  for (let i = 0; i < 4; i++) {
    const y = 0.05 + (rh / 4) * i;
    g.add(_mesh(new THREE.BoxGeometry(rw - 0.04, 0.02, rd - 0.04), m, 0, y, 0));
  }
  return g;
}

function buildKitchenCounter(color: string): THREE.Group {
  const g = new THREE.Group();
  const cabinetM = mat(color);
  const counterM = wood("#C4A46C");
  // Base cabinets (L-shape: main run + short return)
  g.add(roundedBox(2.1, 0.85, 0.6, 0.02, cabinetM, 0, 0.425, 0));
  g.add(roundedBox(0.6, 0.85, 0.6, 0.02, cabinetM, -0.75, 0.425, -0.6));
  // Countertop
  g.add(_mesh(new THREE.BoxGeometry(2.14, 0.04, 0.64), counterM, 0, 0.88, 0));
  g.add(_mesh(new THREE.BoxGeometry(0.64, 0.04, 0.64), counterM, -0.75, 0.88, -0.6));
  // Cabinet doors
  const lineM = mat(darken(color, 0.06));
  for (let i = 0; i < 3; i++) {
    const cx = -0.7 + i * 0.7;
    g.add(_mesh(new THREE.BoxGeometry(0.01, 0.7, 0.01), lineM, cx, 0.4, 0.305));
  }
  return g;
}

function buildUpperCabinet(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(roundedBox(0.6, 0.7, 0.35, 0.02, m, 0, 0.35, 0));
  // Handle
  const hm = metal("#AAAAAA");
  g.add(cylMat(0.008, 0.008, 0.08, hm, -0.05, 0.35, 0.18, 8));
  return g;
}

function buildLowerCabinet(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(roundedBox(0.6, 0.85, 0.6, 0.02, m, 0, 0.425, 0));
  // Handle
  const hm = metal("#AAAAAA");
  g.add(cylMat(0.008, 0.008, 0.08, hm, -0.05, 0.55, 0.305, 8));
  return g;
}

function buildMicrowave(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(roundedBox(0.5, 0.28, 0.38, 0.02, m, 0, 0.14, 0));
  // Glass door
  const gm = glass("#222222", 0.6);
  g.add(_mesh(new THREE.PlaneGeometry(0.3, 0.2), gm, -0.1, 0.15, 0.192));
  // Handle
  g.add(cylMat(0.008, 0.008, 0.18, metal("#666666"), 0.2, 0.14, 0.195, 8));
  return g;
}

function buildKitchenSink(color: string): THREE.Group {
  const g = new THREE.Group();
  const sinkM = metal(color);
  // Basin
  g.add(_mesh(new THREE.BoxGeometry(0.8, 0.18, 0.5), sinkM, 0, 0.09, 0));
  // Inner basin (darker)
  g.add(_mesh(new THREE.BoxGeometry(0.65, 0.14, 0.36), metal(darken(color, 0.1)), 0, 0.08, 0));
  // Faucet
  const fMat = metal("#C0C0C0");
  g.add(cylMat(0.015, 0.015, 0.25, fMat, 0, 0.3, -0.18, 8));
  g.add(cylMat(0.015, 0.012, 0.12, fMat, 0, 0.42, -0.12, 8));
  return g;
}

function buildWashBasin(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  // Basin
  g.add(roundedBox(0.5, 0.08, 0.38, 0.04, m, 0, 0.1, 0));
  // Pedestal or bracket
  g.add(_mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), m, 0, 0.35, -0.12));
  // Faucet
  const fMat = metal("#C0C0C0");
  g.add(cylMat(0.012, 0.012, 0.15, fMat, 0, 0.22, -0.14, 8));
  g.add(cylMat(0.012, 0.01, 0.08, fMat, 0, 0.29, -0.1, 8));
  return g;
}

function buildVanityCabinet(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  // Cabinet body
  g.add(roundedBox(0.6, 0.75, 0.45, 0.02, m, 0, 0.375, 0));
  // Counter top
  g.add(_mesh(new THREE.BoxGeometry(0.64, 0.03, 0.48), mat("#E0E0E0"), 0, 0.765, 0));
  // Sink basin inset
  g.add(cylMat(0.12, 0.1, 0.06, metal("#DDDDDD"), 0, 0.76, 0.06, 16));
  // Handles
  const hm = metal("#AAAAAA");
  g.add(cylMat(0.008, 0.008, 0.06, hm, -0.12, 0.4, 0.23, 8));
  g.add(cylMat(0.008, 0.008, 0.06, hm, 0.12, 0.4, 0.23, 8));
  return g;
}

function buildTowelRack(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = metal(color);
  // Bar
  g.add(cylMat(0.01, 0.01, 0.6, m, 0, 0.025, 0, 8));
  // Wall brackets
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), m, -0.28, 0.025, -0.03));
  g.add(_mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), m, 0.28, 0.025, -0.03));
  // Towel draped
  const towelM = fabric("#E8DCC8");
  g.add(roundedBox(0.4, 0.3, 0.02, 0.01, towelM, 0, -0.12, 0.02));
  return g;
}

function buildBathMirror(color: string): THREE.Group {
  const g = new THREE.Group();
  // Frame
  g.add(_mesh(new THREE.BoxGeometry(0.62, 0.82, 0.02), mat(darken(color, 0.1)), 0, 0.41, 0));
  // Mirror surface
  g.add(_mesh(new THREE.BoxGeometry(0.56, 0.76, 0.01), glass("#EEEEFF", 0.15), 0, 0.41, 0.015));
  return g;
}

function buildIroningBoard(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = metal(color);
  // Board (folded, standing upright)
  g.add(roundedBox(0.35, 1.1, 0.04, 0.02, m, 0, 0.55, 0));
  // Legs (folded along the board)
  const legM = metal("#888888");
  g.add(_mesh(new THREE.BoxGeometry(0.02, 0.9, 0.02), legM, -0.1, 0.5, 0.04));
  g.add(_mesh(new THREE.BoxGeometry(0.02, 0.9, 0.02), legM, 0.1, 0.5, 0.04));
  return g;
}

function buildVacuum(color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(cylMat(0.1, 0.12, 0.5, m, 0, 0.25, 0, 12));
  g.add(cylMat(0.02, 0.02, 0.6, m, 0, 0.8, 0, 8));
  g.add(roundedBox(0.06, 0.08, 0.12, 0.02, mat(darken(color, 0.15)), 0, 1.06, 0));
  g.add(cylMat(0.04, 0.04, 0.02, mat("#333333"), -0.08, 0.04, -0.06, 8));
  g.add(cylMat(0.04, 0.04, 0.02, mat("#333333"), 0.08, 0.04, -0.06, 8));
  return g;
}
/* ═══ Expanded Catalog Models ═══ */
function buildRecliner(c: string) { const g = new THREE.Group(); const f = leather(c); g.add(roundedBox(0.85,0.24,0.85,0.04,f,0,0.3,0)); g.add(roundedBox(0.85,0.55,0.12,0.04,f,0,0.6,-0.36)); g.add(roundedBox(0.12,0.35,0.8,0.03,leather(darken(c,0.08)),-0.39,0.45,0)); g.add(roundedBox(0.12,0.35,0.8,0.03,leather(darken(c,0.08)),0.39,0.45,0)); g.add(roundedBox(0.6,0.08,0.35,0.03,f,0,0.22,0.55)); for(const[x,z]of[[-0.35,0.3],[0.35,0.3],[-0.35,-0.35],[0.35,-0.35]])g.add(cylMat(0.025,0.025,0.16,wood(darken(c,0.2)),x,0.08,z,8)); return g; }
function buildBeanBag(c: string) { const g = new THREE.Group(); g.add(sphereMat(0.38,fabric(c),0,0.28,0,12)); const t=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,8,0,Math.PI*2,0,Math.PI/2),fabric(lighten(c,0.05))); t.position.set(0,0.38,0); g.add(t); return g; }
function buildLSofa(c: string) { const g = new THREE.Group(); const f=fabric(c); g.add(roundedBox(2.2,0.22,0.85,0.04,f,-0.2,0.28,0)); g.add(roundedBox(2.2,0.5,0.12,0.04,f,-0.2,0.58,-0.36)); g.add(roundedBox(0.85,0.22,1.2,0.04,f,0.88,0.28,0.52)); g.add(roundedBox(0.12,0.5,1.2,0.04,f,1.28,0.58,0.52)); g.add(roundedBox(0.12,0.3,0.85,0.03,fabric(darken(c,0.06)),-1.28,0.42,0)); for(const[x,z]of[[-1.1,0.3],[-1.1,-0.3],[0.5,-0.3],[1.15,0.9],[1.15,-0.1]])g.add(cylMat(0.025,0.025,0.14,metal("#3A3A3A"),x,0.07,z,8)); return g; }
function buildDaybed(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.9,0.2,0.85,0.04,fabric(c),0,0.35,0)); const w=wood(darken(c,0.15)); g.add(roundedBox(2.0,0.15,0.9,0.03,w,0,0.2,0)); g.add(roundedBox(0.08,0.45,0.9,0.03,w,-0.96,0.35,0)); g.add(roundedBox(0.08,0.45,0.9,0.03,w,0.96,0.35,0)); for(const[x,z]of[[-0.85,0.35],[0.85,0.35],[-0.85,-0.35],[0.85,-0.35]])g.add(cylMat(0.03,0.03,0.12,w,x,0.06,z,8)); return g; }
function buildMurphyBed(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.53,2.1,0.35,0.02,mat(c),0,1.05,0)); g.add(_mesh(new THREE.BoxGeometry(1.4,0.01,0.01),mat(darken(c,0.08)),0,1.05,0.176)); g.add(_mesh(new THREE.BoxGeometry(0.01,1.9,0.01),mat(darken(c,0.08)),0,1.05,0.176)); g.add(cylMat(0.015,0.015,0.12,metal("#888"),0,0.5,0.185,8)); return g; }
function buildSideboard(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.5,0.65,0.42,0.02,wood(c),0,0.45,0)); g.add(_mesh(new THREE.BoxGeometry(0.01,0.5,0.01),mat(darken(c,0.05)),0,0.45,0.215)); const l=metal("#555"); for(const[x,z]of[[-0.65,0.16],[0.65,0.16],[-0.65,-0.16],[0.65,-0.16]])g.add(cylMat(0.02,0.02,0.12,l,x,0.06,z,8)); g.add(cylMat(0.008,0.008,0.06,metal("#888"),-0.38,0.45,0.22,8)); g.add(cylMat(0.008,0.008,0.06,metal("#888"),0.38,0.45,0.22,8)); return g; }
function buildHallCloset(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.0,2.1,0.58,0.02,mat(c),0,1.05,0)); g.add(_mesh(new THREE.BoxGeometry(0.01,2.0,0.01),mat(darken(c,0.06)),0,1.05,0.295)); g.add(cylMat(0.01,0.01,0.06,metal("#888"),-0.08,1.05,0.3,8)); g.add(cylMat(0.01,0.01,0.06,metal("#888"),0.08,1.05,0.3,8)); return g; }
function buildFoldingTable(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.2,0.04,0.6,0.01,mat(c),0,0.73,0)); const l=metal("#808080"); for(const x of[-0.45,0.45]){g.add(_mesh(new THREE.BoxGeometry(0.03,0.7,0.03),l,x,0.37,-0.18));g.add(_mesh(new THREE.BoxGeometry(0.03,0.7,0.03),l,x,0.37,0.18));} return g; }
function buildNestingTables(c: string) { const g = new THREE.Group(); const w=wood(c),l=metal("#555"); g.add(roundedBox(0.45,0.03,0.4,0.01,w,0,0.47,0)); for(const[x,z]of[[-0.18,0.15],[0.18,0.15],[-0.18,-0.15],[0.18,-0.15]])g.add(cylMat(0.015,0.015,0.47,l,x,0.235,z,8)); g.add(roundedBox(0.35,0.03,0.32,0.01,wood(lighten(c,0.08)),0.12,0.37,0)); for(const[x,z]of[[0,0.1],[0.24,0.1],[0,-0.1],[0.24,-0.1]])g.add(cylMat(0.012,0.012,0.37,l,x,0.185,z,8)); return g; }
function buildStandingDesk(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.4,0.04,0.65,0.02,wood(c),0,1.08,0)); const l=metal("#555"); g.add(_mesh(new THREE.BoxGeometry(0.06,1.06,0.06),l,-0.55,0.53,0)); g.add(_mesh(new THREE.BoxGeometry(0.06,1.06,0.06),l,0.55,0.53,0)); g.add(_mesh(new THREE.BoxGeometry(0.3,0.03,0.5),l,-0.55,0.015,0)); g.add(_mesh(new THREE.BoxGeometry(0.3,0.03,0.5),l,0.55,0.015,0)); return g; }
function buildFilingCabinet(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.38,0.68,0.48,0.02,metal(c),0,0.34,0)); for(let i=0;i<3;i++){g.add(_mesh(new THREE.BoxGeometry(0.34,0.005,0.005),mat(darken(c,0.1)),0,0.18+i*0.2,0.245));g.add(cylMat(0.008,0.008,0.04,metal("#888"),0,0.1+i*0.2+0.08,0.26,8));} return g; }
function buildOfficeBookshelf(c: string) { const g = new THREE.Group(); const w=wood(c); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.35),w,-0.45,0.9,0)); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.35),w,0.45,0.9,0)); g.add(_mesh(new THREE.BoxGeometry(0.9,0.025,0.35),w,0,0.012,0)); g.add(_mesh(new THREE.BoxGeometry(0.9,0.025,0.35),w,0,1.8,0)); for(let i=1;i<=4;i++)g.add(_mesh(new THREE.BoxGeometry(0.85,0.02,0.33),w,0,(1.8/5)*i,0)); return g; }
function buildWhiteboard(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.2,0.9,0.03,0.01,mat(c),0,1.2,0)); const f=metal("#AAA"); g.add(_mesh(new THREE.BoxGeometry(1.24,0.02,0.04),f,0,0.76,0)); g.add(_mesh(new THREE.BoxGeometry(1.24,0.02,0.04),f,0,1.66,0)); g.add(_mesh(new THREE.BoxGeometry(0.02,0.92,0.04),f,-0.61,1.21,0)); g.add(_mesh(new THREE.BoxGeometry(0.02,0.92,0.04),f,0.61,1.21,0)); g.add(_mesh(new THREE.BoxGeometry(0.4,0.03,0.06),f,0,0.75,0.04)); return g; }
function buildCrib(c: string) { const g = new THREE.Group(); const w=wood(c),b=wood(lighten(c,0.1)); g.add(roundedBox(0.6,0.1,1.2,0.02,fabric("#F0EDE8"),0,0.42,0)); g.add(roundedBox(0.65,0.06,1.25,0.02,w,0,0.34,0)); for(let i=0;i<10;i++){const z=-0.55+i*0.12;g.add(cylMat(0.012,0.012,0.45,b,-0.31,0.6,z,6));g.add(cylMat(0.012,0.012,0.45,b,0.31,0.6,z,6));} g.add(cylMat(0.02,0.02,1.25,b,-0.31,0.85,0,8)); g.add(cylMat(0.02,0.02,1.25,b,0.31,0.85,0,8)); for(const[x,z]of[[-0.3,0.58],[0.3,0.58],[-0.3,-0.58],[0.3,-0.58]])g.add(cylMat(0.025,0.025,0.35,w,x,0.175,z,8)); return g; }
function buildBunkBed(c: string) { const g = new THREE.Group(); const w=wood(c); for(const[x,z]of[[-0.42,0.9],[0.42,0.9],[-0.42,-0.9],[0.42,-0.9]])g.add(cylMat(0.035,0.035,1.6,w,x,0.8,z,8)); g.add(roundedBox(0.9,0.04,1.85,0.01,w,0,0.3,0)); g.add(roundedBox(0.85,0.12,1.8,0.03,fabric("#E8E0D4"),0,0.4,0)); g.add(roundedBox(0.9,0.04,1.85,0.01,w,0,0.95,0)); g.add(roundedBox(0.85,0.12,1.8,0.03,fabric("#D4C4B0"),0,1.05,0)); g.add(_mesh(new THREE.BoxGeometry(0.03,0.25,1.0),w,0.44,1.22,0.4)); for(let i=0;i<4;i++)g.add(_mesh(new THREE.BoxGeometry(0.25,0.025,0.03),w,0.44,0.35+i*0.2,-0.9)); return g; }
function buildToyBox(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.75,0.45,0.45,0.03,wood(c),0,0.225,0)); const lid=roundedBox(0.75,0.04,0.45,0.02,wood(lighten(c,0.06)),0,0.47,-0.02); lid.rotation.x=-0.15; g.add(lid); return g; }
function buildKidsDesk(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.75,0.04,0.45,0.02,wood(c),0,0.58,0)); for(const[x,z]of[[-0.32,0.18],[0.32,0.18],[-0.32,-0.18],[0.32,-0.18]])g.add(cylMat(0.025,0.025,0.56,wood(darken(c,0.1)),x,0.28,z,8)); return g; }
function buildKidsChair(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.35,0.05,0.35,0.02,fabric(c),0,0.33,0)); g.add(roundedBox(0.35,0.3,0.04,0.02,fabric(c),0,0.5,-0.16)); for(const[x,z]of[[-0.13,0.13],[0.13,0.13],[-0.13,-0.13],[0.13,-0.13]])g.add(cylMat(0.02,0.02,0.3,wood(darken(c,0.15)),x,0.15,z,8)); return g; }
function buildChangingTable(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.85,0.85,0.55,0.02,wood(c),0,0.425,0)); g.add(roundedBox(0.75,0.06,0.5,0.03,fabric("#F0EDE8"),0,0.88,0)); g.add(roundedBox(0.75,0.1,0.04,0.02,fabric("#E8E0D4"),0,0.94,-0.23)); g.add(roundedBox(0.75,0.1,0.04,0.02,fabric("#E8E0D4"),0,0.94,0.23)); return g; }
function buildPantryShelf(c: string) { const g = new THREE.Group(); const w=wood(c); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.38),w,-0.39,0.9,0)); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.38),w,0.39,0.9,0)); for(let i=0;i<5;i++)g.add(_mesh(new THREE.BoxGeometry(0.76,0.02,0.36),w,0,0.05+i*0.43,0)); return g; }
function buildBidet(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.38,0.3,0.55,0.04,marble(c),0,0.15,0)); g.add(cylMat(0.12,0.14,0.06,mat(darken(c,0.03)),0,0.32,0.05,16)); g.add(cylMat(0.012,0.012,0.08,metal("#C0C0C0"),0,0.36,-0.15,8)); return g; }
function buildLaundryBasket(c: string) { const g = new THREE.Group(); g.add(cylMat(0.18,0.15,0.55,mat(c,{roughness:0.85}),0,0.275,0,12)); g.add(cylMat(0.19,0.19,0.03,mat(darken(c,0.08)),0,0.56,0,12)); return g; }
function buildReceptionDesk(c: string) { const g = new THREE.Group(); g.add(roundedBox(2.0,1.05,0.7,0.03,wood(c),0,0.525,0)); g.add(roundedBox(2.0,1.1,0.04,0.02,wood(darken(c,0.06)),0,0.55,0.33)); g.add(roundedBox(1.8,0.03,0.5,0.01,wood(lighten(c,0.06)),0,0.78,-0.05)); return g; }
function buildWaitingBench(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.8,0.06,0.45,0.02,wood(c),0,0.42,0)); for(const x of[-0.7,0,0.7])g.add(_mesh(new THREE.BoxGeometry(0.04,0.4,0.42),metal("#555"),x,0.2,0)); return g; }
function buildDisplayShelf(c: string) { const g = new THREE.Group(); const m=mat(c); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.38),m,-0.59,0.9,0)); g.add(_mesh(new THREE.BoxGeometry(0.025,1.8,0.38),m,0.59,0.9,0)); for(let i=0;i<5;i++)g.add(_mesh(new THREE.BoxGeometry(1.16,0.02,0.38),m,0,0.05+i*0.43,0)); return g; }
function buildLockerUnit(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.85,1.8,0.48,0.02,metal(c),0,0.9,0)); const l=mat(darken(c,0.12)); g.add(_mesh(new THREE.BoxGeometry(0.01,1.7,0.01),l,0,0.9,0.245)); for(let i=1;i<=2;i++)g.add(_mesh(new THREE.BoxGeometry(0.8,0.01,0.01),l,0,i*0.6,0.245)); return g; }
function buildTableLamp(c: string) { const g = new THREE.Group(); g.add(cylMat(0.08,0.08,0.02,mat(darken(c,0.15)),0,0.01,0,16)); g.add(cylMat(0.015,0.015,0.25,metal("#888"),0,0.14,0,8)); g.add(cylMat(0.02,0.12,0.18,fabric(c),0,0.36,0,16)); return g; }
function buildWallSconce(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.08,0.12,0.03,0.01,metal(c),0,0.12,0)); g.add(_mesh(new THREE.BoxGeometry(0.02,0.02,0.08),metal(c),0,0.14,0.05)); g.add(cylMat(0.03,0.06,0.1,fabric(lighten(c,0.2)),0,0.18,0.09,12)); return g; }
function buildChandelier(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(cylMat(0.015,0.015,0.3,m,0,0.35,0,8)); g.add(cylMat(0.06,0.06,0.04,m,0,0.18,0,16)); for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2,ax=Math.cos(a)*0.22,az=Math.sin(a)*0.22;g.add(_mesh(new THREE.BoxGeometry(0.01,0.01,0.22),m,ax/2,0.18,az/2));g.add(cylMat(0.015,0.035,0.06,glass(lighten(c,0.3),0.4),ax,0.15,az,8));} return g; }
function buildLedStrip(c: string) { const g = new THREE.Group(); g.add(_mesh(new THREE.BoxGeometry(2.0,0.01,0.015),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.6,roughness:0.3}),0,0.01,0)); return g; }
function buildDeskLamp(c: string) { const g = new THREE.Group(); g.add(cylMat(0.07,0.07,0.015,metal(darken(c,0.1)),0,0.008,0,16)); g.add(cylMat(0.01,0.01,0.25,metal(c),0,0.14,0,8)); g.add(roundedBox(0.1,0.03,0.08,0.01,metal(c),0.06,0.38,0)); return g; }
function buildWallSocket(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.07,0.07,0.02,0.008,mat(c),0,0.5,0)); g.add(cylMat(0.006,0.006,0.01,mat("#333"),-0.015,0.51,0.015,6)); g.add(cylMat(0.006,0.006,0.01,mat("#333"),0.015,0.51,0.015,6)); return g; }
function buildLightSwitch(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.06,0.1,0.02,0.006,mat(c),0,0.55,0)); g.add(roundedBox(0.025,0.04,0.01,0.003,mat(darken(c,0.15)),0,0.56,0.015)); return g; }
function buildDryer(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.58,0.82,0.58,0.03,mat(c),0,0.42,0)); g.add(cylMat(0.18,0.18,0.02,glass("#666",0.3),0,0.42,0.3,24)); g.add(roundedBox(0.45,0.08,0.02,0.01,mat(darken(c,0.1)),0,0.8,0.3)); return g; }
function buildRobotVacuum(c: string) { const g = new THREE.Group(); g.add(cylMat(0.16,0.16,0.08,mat(c),0,0.04,0,24)); g.add(cylMat(0.17,0.17,0.03,mat(darken(c,0.05)),0,0.06,0,24)); return g; }
function buildSteamMop(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.2,0.04,0.25,0.02,mat(darken(c,0.05)),0,0.02,0)); g.add(cylMat(0.02,0.02,1.0,mat(c),0,0.54,0,8)); return g; }
function buildTV55(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.22,0.7,0.04,0.01,mat("#1A1A1A"),0,0.72,0)); g.add(roundedBox(1.14,0.62,0.01,0.005,mat("#111"),0,0.73,0.025)); return g; }
function buildProjector(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.28,0.1,0.22,0.02,mat(c),0,0.05,0)); g.add(cylMat(0.035,0.035,0.04,glass("#333",0.5),0,0.05,0.13,16)); return g; }
function buildProjectorScreen(c: string) { const g = new THREE.Group(); g.add(_mesh(new THREE.BoxGeometry(2.0,0.04,0.04),metal("#888"),0,1.22,0)); g.add(roundedBox(1.9,1.1,0.01,0.005,mat(c),0,0.65,0)); return g; }
function buildDishwasher(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.58,0.82,0.58,0.03,mat(c),0,0.42,0)); g.add(roundedBox(0.5,0.06,0.02,0.01,mat(darken(c,0.08)),0,0.8,0.295)); g.add(cylMat(0.008,0.008,0.06,metal("#888"),0,0.52,0.31,8)); return g; }
function buildCoffeeMachine(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.22,0.35,0.3,0.02,mat(c),0,0.175,0)); g.add(cylMat(0.015,0.015,0.04,metal("#888"),0,0.2,0.16,8)); return g; }
function buildToasterOven(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.38,0.22,0.28,0.02,mat(c),0,0.11,0)); g.add(roundedBox(0.3,0.16,0.01,0.005,glass("#333",0.3),0,0.12,0.145)); return g; }
function buildRangeHood(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.58,0.15,0.48,0.02,mat(c),0,0.35,0)); g.add(_mesh(new THREE.BoxGeometry(0.3,0.25,0.25),mat(c),0,0.55,-0.05)); return g; }
function buildAirConditioner(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.85,0.28,0.18,0.03,mat(c),0,2.3,0)); for(let i=0;i<4;i++)g.add(_mesh(new THREE.BoxGeometry(0.7,0.005,0.01),mat(darken(c,0.05)),0,2.2+i*0.03,0.09)); return g; }
function buildSpaceHeater(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.28,0.55,0.15,0.03,mat(c),0,0.275,0)); for(let i=0;i<6;i++)g.add(_mesh(new THREE.BoxGeometry(0.2,0.005,0.005),mat(darken(c,0.15)),0,0.15+i*0.05,0.08)); return g; }
function buildHumidifier(c: string) { const g = new THREE.Group(); g.add(cylMat(0.12,0.1,0.3,mat(c),0,0.15,0,16)); g.add(cylMat(0.04,0.02,0.06,mat(lighten(c,0.1)),0,0.33,0,12)); return g; }
function buildTowerFan(c: string) { const g = new THREE.Group(); g.add(cylMat(0.12,0.12,0.03,mat(darken(c,0.1)),0,0.015,0,16)); g.add(roundedBox(0.12,0.9,0.1,0.04,mat(c),0,0.5,0)); return g; }
function buildDesktopPC(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.18,0.42,0.4,0.02,mat(c),0,0.21,0)); g.add(cylMat(0.01,0.01,0.005,mat("#4A90D9"),0,0.38,0.205,8)); return g; }
function buildLaptopModel(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.34,0.015,0.24,0.005,metal(c),0,0.008,0)); const s=roundedBox(0.32,0.22,0.008,0.005,mat("#1A1A1A"),0,0.12,-0.12); s.rotation.x=-0.15; g.add(s); return g; }
function buildMonitorStand(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.48,0.03,0.22,0.01,mat(c),0,0.035,0)); g.add(_mesh(new THREE.BoxGeometry(0.04,0.04,0.18),mat(c),-0.18,0.055,0)); g.add(_mesh(new THREE.BoxGeometry(0.04,0.04,0.18),mat(c),0.18,0.055,0)); return g; }
function buildPrinter(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.42,0.18,0.32,0.02,mat(c),0,0.09,0)); g.add(roundedBox(0.35,0.01,0.15,0.005,mat(lighten(c,0.15)),0,0.185,0.04)); return g; }
function buildBtSpeaker(c: string) { const g = new THREE.Group(); g.add(cylMat(0.05,0.05,0.11,mat(c),0,0.055,0,16)); return g; }
function buildSoundbar(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.0,0.06,0.08,0.02,mat(c),0,0.03,0)); g.add(roundedBox(0.9,0.04,0.005,0.01,mat(darken(c,0.15)),0,0.03,0.042)); return g; }
function buildBookshelfSpeakers(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.18,0.28,0.18,0.01,wood(c),0,0.14,0)); g.add(cylMat(0.05,0.05,0.01,mat("#333"),0,0.1,0.095,12)); g.add(cylMat(0.02,0.02,0.01,mat("#555"),0,0.2,0.095,12)); return g; }
function buildTurntable(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.42,0.06,0.38,0.02,wood(c),0,0.03,0)); g.add(cylMat(0.14,0.14,0.01,mat("#1A1A1A"),-0.04,0.065,0,24)); return g; }
function buildTreadmill(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.7,0.1,1.6,0.02,mat("#222"),0,0.12,0)); g.add(cylMat(0.025,0.025,1.2,mat(c),-0.3,0.72,-0.65,8)); g.add(cylMat(0.025,0.025,1.2,mat(c),0.3,0.72,-0.65,8)); g.add(roundedBox(0.5,0.2,0.06,0.02,mat("#333"),0,1.3,-0.65)); return g; }
function buildExerciseBike(c: string) { const g = new THREE.Group(); const m=mat(c); g.add(cylMat(0.025,0.025,0.9,m,0,0.5,-0.2,8)); g.add(roundedBox(0.3,0.06,0.25,0.03,fabric("#333"),0,0.98,-0.2)); g.add(cylMat(0.025,0.025,0.7,m,0,0.55,0.25,8)); g.add(cylMat(0.08,0.08,0.04,mat("#555"),0,0.2,0,12)); return g; }
function buildWeightBench(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(_mesh(new THREE.BoxGeometry(0.6,0.04,1.2),m,0,0.44,0)); g.add(roundedBox(0.3,0.08,1.1,0.03,leather("#333"),0,0.5,0)); for(const[x,z]of[[-0.25,0.5],[0.25,0.5],[-0.25,-0.5],[0.25,-0.5]])g.add(cylMat(0.025,0.025,0.42,m,x,0.21,z,8)); return g; }
function buildElliptical(c: string) { const g = new THREE.Group(); const m=mat(c); g.add(cylMat(0.025,0.025,1.5,m,0,0.75,0,8)); g.add(roundedBox(0.4,0.15,0.04,0.02,mat("#333"),0,1.5,0)); g.add(cylMat(0.015,0.015,0.8,m,-0.2,1.0,0,8)); g.add(cylMat(0.015,0.015,0.8,m,0.2,1.0,0,8)); return g; }
function buildWallArt(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.76,0.56,0.025,0.005,mat(c),0,0.9,0)); const f=wood("#5A4A3A"); g.add(_mesh(new THREE.BoxGeometry(0.8,0.02,0.03),f,0,0.63,0)); g.add(_mesh(new THREE.BoxGeometry(0.8,0.02,0.03),f,0,1.17,0)); g.add(_mesh(new THREE.BoxGeometry(0.02,0.56,0.03),f,-0.39,0.9,0)); g.add(_mesh(new THREE.BoxGeometry(0.02,0.56,0.03),f,0.39,0.9,0)); return g; }
function buildVase(c: string) { const g = new THREE.Group(); const p:THREE.Vector2[]=[]; for(let i=0;i<=10;i++){const t=i/10;p.push(new THREE.Vector2(0.04+0.06*Math.sin(t*Math.PI)*(1+0.3*Math.sin(t*Math.PI*3)),t*0.38));} g.add(_mesh(new THREE.LatheGeometry(p,16),mat(c,{roughness:0.3}),0,0,0)); return g; }
function buildWallClock(c: string) { const g = new THREE.Group(); g.add(cylMat(0.16,0.16,0.03,mat(c),0,0.9,0,24)); g.add(cylMat(0.15,0.15,0.005,mat("#FAFAFA"),0,0.9,0.018,24)); g.add(_mesh(new THREE.BoxGeometry(0.008,0.1,0.003),mat("#333"),0,0.94,0.022)); return g; }
function buildPhotoFrames(c: string) { const g = new THREE.Group(); for(let i=0;i<3;i++){g.add(roundedBox(0.17,0.13,0.015,0.003,wood(c),-0.2+i*0.2,0.9+(i%2)*0.05,0));g.add(roundedBox(0.15,0.11,0.005,0.002,mat("#E8E0D4"),-0.2+i*0.2,0.9+(i%2)*0.05,0.008));} return g; }
function buildSculpture(c: string) { const g = new THREE.Group(); g.add(cylMat(0.08,0.08,0.04,marble(darken(c,0.1)),0,0.02,0,16)); g.add(sphereMat(0.08,marble(c),0,0.2,0,12)); g.add(sphereMat(0.06,marble(lighten(c,0.05)),0.02,0.35,0,10)); g.add(sphereMat(0.04,marble(lighten(c,0.08)),-0.01,0.45,0,8)); return g; }
function buildCurtain(c: string) { const g = new THREE.Group(); g.add(cylMat(0.012,0.012,1.6,metal("#888"),0,2.35,0,8)); g.add(roundedBox(0.6,2.3,0.04,0.01,fabric(c),-0.45,1.15,0)); g.add(roundedBox(0.6,2.3,0.04,0.01,fabric(c),0.45,1.15,0)); return g; }
function buildRomanBlind(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.15,1.4,0.03,0.01,fabric(c),0,1.9,0)); for(let i=1;i<=4;i++)g.add(_mesh(new THREE.BoxGeometry(1.1,0.005,0.035),fabric(darken(c,0.05)),0,1.2+i*0.25,0.002)); return g; }
function buildRollerShade(c: string) { const g = new THREE.Group(); g.add(cylMat(0.025,0.025,1.2,mat(c),0,2.55,0,12)); g.add(roundedBox(1.15,1.4,0.01,0.005,mat(c),0,1.85,0)); return g; }
function buildSheerCurtain(c: string) { const g = new THREE.Group(); g.add(cylMat(0.01,0.01,1.55,metal("#CCC"),0,2.35,0,8)); g.add(roundedBox(1.45,2.3,0.02,0.01,new THREE.MeshStandardMaterial({color:c,roughness:0.9,transparent:true,opacity:0.4}),0,1.15,0)); return g; }
function buildRunnerRug(c: string) { const g = new THREE.Group(); g.add(roundedBox(2.4,0.015,0.65,0.005,fabric(c,{roughness:0.95}),0,0.008,0)); return g; }
function buildRoundRug(c: string) { const g = new THREE.Group(); g.add(cylMat(0.72,0.72,0.015,fabric(c,{roughness:0.95}),0,0.008,0,32)); return g; }
function buildBathMat(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.75,0.015,0.45,0.008,fabric(c,{roughness:0.95}),0,0.008,0)); return g; }
function buildKnifeBlock(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.1,0.3,0.08,0.01,wood(c),0,0.15,0)); for(let i=0;i<4;i++)g.add(_mesh(new THREE.BoxGeometry(0.015,0.06,0.015),mat("#333"),-0.02+i*0.02,0.33,0)); return g; }
function buildFruitBowl(c: string) { const g = new THREE.Group(); g.add(_mesh(new THREE.LatheGeometry([new THREE.Vector2(0.14,0),new THREE.Vector2(0.14,0.03),new THREE.Vector2(0.12,0.08),new THREE.Vector2(0.06,0.01)],16),mat(c,{roughness:0.3}),0,0,0)); g.add(sphereMat(0.025,mat("#E06040"),-0.03,0.1,0,8)); g.add(sphereMat(0.025,mat("#E0C040"),0.03,0.1,0.02,8)); return g; }
function buildSpiceRack(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.38,0.28,0.08,0.01,wood(c),0,0.14,0)); for(let i=0;i<5;i++)g.add(cylMat(0.018,0.018,0.08,glass("#F0E0C0",0.5),-0.14+i*0.07,0.08,0.04,8)); return g; }
function buildDishRack(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(roundedBox(0.42,0.04,0.28,0.01,m,0,0.02,0)); for(let i=0;i<8;i++)g.add(cylMat(0.004,0.004,0.2,m,-0.16+i*0.045,0.14,0,6)); return g; }
function buildElectricFireplace(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.15,0.85,0.25,0.02,mat(c),0,0.425,0)); g.add(roundedBox(0.9,0.5,0.01,0.01,glass("#FF6600",0.3),0,0.35,0.13)); g.add(roundedBox(1.25,0.04,0.3,0.01,mat(lighten(c,0.1)),0,0.88,0)); return g; }
function buildWoodFireplace(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.35,1.15,0.45,0.03,mat(c),0,0.575,0)); g.add(roundedBox(0.8,0.7,0.1,0.02,mat("#222"),0,0.4,0.2)); g.add(roundedBox(1.5,0.06,0.5,0.02,wood(lighten(c,0.15)),0,1.18,0)); return g; }
function buildGasFireplace(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.95,0.75,0.25,0.02,mat(c),0,0.375,0)); g.add(roundedBox(0.75,0.5,0.01,0.01,glass("#333",0.3),0,0.35,0.13)); return g; }
function buildHangingPlant(c: string) { const g = new THREE.Group(); g.add(cylMat(0.1,0.08,0.12,mat(c),0,2.2,0,12)); const lf=new THREE.MeshStandardMaterial({color:"#5A8A4A",roughness:0.85}); g.add(sphereMat(0.14,lf,0,2.15,0,8)); g.add(sphereMat(0.1,lf,0.06,2.05,0.05,8)); g.add(sphereMat(0.1,lf,-0.06,2.05,-0.04,8)); return g; }
function buildSucculentSet(c: string) { const g = new THREE.Group(); const lf=new THREE.MeshStandardMaterial({color:"#6B9B5A",roughness:0.8}); for(let i=0;i<3;i++){g.add(cylMat(0.04,0.035,0.06,mat(c,{roughness:0.4}),-0.1+i*0.1,0.03,0,8));g.add(sphereMat(0.035,lf,-0.1+i*0.1,0.08,0,8));} return g; }
function buildHerbGarden(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.48,0.15,0.18,0.02,wood(c),0,0.075,0)); const lf=new THREE.MeshStandardMaterial({color:"#5A8A4A",roughness:0.85}); for(let i=0;i<4;i++)g.add(sphereMat(0.05,lf,-0.15+i*0.1,0.2,0,8)); return g; }
function buildFiddleLeaf(c: string) { const g = new THREE.Group(); g.add(cylMat(0.12,0.1,0.18,mat(c),0,0.09,0,12)); g.add(cylMat(0.02,0.015,1.0,wood("#6B5A4A"),0,0.7,0,8)); const lf=new THREE.MeshStandardMaterial({color:"#4A7A3A",roughness:0.85}); g.add(sphereMat(0.3,lf,0,1.25,0,10)); g.add(sphereMat(0.22,lf,0.1,1.4,0.05,8)); return g; }
function buildStandingFigure(c: string) { const g = new THREE.Group(); const m=mat(c); g.add(sphereMat(0.1,m,0,1.65,0,10)); g.add(cylMat(0.12,0.1,0.65,m,0,1.2,0,12)); g.add(cylMat(0.06,0.05,0.75,m,-0.08,0.45,0,8)); g.add(cylMat(0.06,0.05,0.75,m,0.08,0.45,0,8)); return g; }
function buildSeatedFigure(c: string) { const g = new THREE.Group(); const m=mat(c); g.add(sphereMat(0.1,m,0,1.1,0,10)); g.add(cylMat(0.12,0.1,0.45,m,0,0.82,0,12)); g.add(roundedBox(0.22,0.1,0.4,0.02,m,0,0.55,0.05)); g.add(cylMat(0.05,0.04,0.45,m,-0.08,0.28,0.2,8)); g.add(cylMat(0.05,0.04,0.45,m,0.08,0.28,0.2,8)); return g; }
function buildUprightPiano(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.45,1.15,0.55,0.02,mat(c),0,0.6,0)); g.add(roundedBox(1.3,0.03,0.15,0.005,mat("#FAFAFA"),0,0.72,0.22)); for(const x of[-0.6,0.6])g.add(cylMat(0.035,0.035,0.08,mat(c),x,0.04,0.2,8)); return g; }
function buildGrandPiano(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.4,0.3,1.8,0.04,mat(c),0,0.7,0)); const lid=roundedBox(1.35,0.02,1.0,0.02,mat(c),0,1.1,-0.35); lid.rotation.x=-0.6; g.add(lid); g.add(roundedBox(1.2,0.03,0.15,0.005,mat("#FAFAFA"),0,0.86,0.85)); g.add(cylMat(0.04,0.04,0.68,mat(c),-0.5,0.34,0.7,8)); g.add(cylMat(0.04,0.04,0.68,mat(c),0.5,0.34,0.7,8)); g.add(cylMat(0.04,0.04,0.68,mat(c),0,0.34,-0.7,8)); return g; }
function buildGuitarStand(c: string) { const g = new THREE.Group(); const w=wood(c); g.add(roundedBox(0.28,0.08,0.35,0.04,w,0,0.45,0)); g.add(_mesh(new THREE.BoxGeometry(0.04,0.6,0.025),w,0,0.78,0)); g.add(roundedBox(0.06,0.1,0.02,0.01,w,0,1.1,0)); const s=metal("#555"); g.add(cylMat(0.01,0.01,0.4,s,-0.1,0.2,0.1,6)); g.add(cylMat(0.01,0.01,0.4,s,0.1,0.2,0.1,6)); g.add(cylMat(0.01,0.01,0.4,s,0,0.2,-0.1,6)); return g; }
function buildDrumKit(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(cylMat(0.28,0.28,0.35,m,0,0.3,0,16)); g.add(cylMat(0.15,0.15,0.1,m,-0.35,0.55,0,12)); g.add(cylMat(0.12,0.12,0.12,m,-0.15,0.65,-0.2,12)); g.add(cylMat(0.12,0.12,0.12,m,0.15,0.65,-0.2,12)); g.add(cylMat(0.015,0.015,0.8,m,-0.5,0.4,-0.15,8)); g.add(cylMat(0.12,0.12,0.01,metal("#C4A46C"),-0.5,0.8,-0.15,16)); g.add(cylMat(0.015,0.015,0.9,m,0.45,0.45,-0.2,8)); g.add(cylMat(0.16,0.16,0.01,metal("#C4A46C"),0.45,0.9,-0.2,16)); return g; }
function buildYogaMat(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.58,0.01,1.75,0.005,fabric(c,{roughness:0.9}),0,0.005,0)); return g; }
function buildPunchingBag(c: string) { const g = new THREE.Group(); g.add(cylMat(0.01,0.01,0.3,metal("#888"),0,2.35,0,6)); g.add(cylMat(0.15,0.12,0.8,leather(c),0,1.8,0,12)); g.add(sphereMat(0.12,leather(c),0,1.35,0,10)); return g; }
function buildDumbbellRack(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(_mesh(new THREE.BoxGeometry(0.95,0.04,0.45),m,0,0.3,0)); g.add(_mesh(new THREE.BoxGeometry(0.95,0.04,0.45),m,0,0.6,0)); for(const[x,z]of[[-0.42,0.18],[0.42,0.18],[-0.42,-0.18],[0.42,-0.18]])g.add(cylMat(0.02,0.02,0.76,m,x,0.38,z,8)); for(let i=0;i<4;i++)g.add(cylMat(0.04,0.04,0.25,mat("#333"),-0.3+i*0.2,0.35,0,8)); return g; }
function buildChristmasTree(c: string) { const g = new THREE.Group(); g.add(cylMat(0.05,0.06,0.2,wood("#6B4E35"),0,0.1,0,8)); const l=new THREE.MeshStandardMaterial({color:c,roughness:0.85}); g.add(_mesh(new THREE.ConeGeometry(0.4,0.6,12),l,0,0.55,0)); g.add(_mesh(new THREE.ConeGeometry(0.32,0.5,12),l,0,0.95,0)); g.add(_mesh(new THREE.ConeGeometry(0.22,0.4,12),l,0,1.3,0)); g.add(sphereMat(0.04,mat("#FFD700",{roughness:0.2,metalness:0.6}),0,1.55,0,8)); return g; }
function buildMenorah(c: string) { const g = new THREE.Group(); const m=metal(c); g.add(roundedBox(0.35,0.03,0.06,0.01,m,0,0.015,0)); for(let i=0;i<9;i++){const x=-0.16+i*0.04,h=i===4?0.3:0.22;g.add(cylMat(0.008,0.008,h,m,x,h/2+0.03,0,6));g.add(cylMat(0.006,0.006,0.04,mat("#FFFDE8"),x,h+0.05,0,6));} return g; }
function buildPetBed(c: string) { const g = new THREE.Group(); const f=fabric(c,{roughness:0.92}),e=fabric(darken(c,0.08)); g.add(roundedBox(0.55,0.1,0.45,0.04,f,0,0.05,0)); g.add(roundedBox(0.55,0.12,0.06,0.03,e,0,0.12,-0.2)); g.add(roundedBox(0.55,0.12,0.06,0.03,e,0,0.12,0.2)); g.add(roundedBox(0.06,0.12,0.45,0.03,e,-0.25,0.12,0)); g.add(roundedBox(0.06,0.12,0.45,0.03,e,0.25,0.12,0)); return g; }
function buildCatTree(c: string) { const g = new THREE.Group(); const w=mat(c,{roughness:0.85}); g.add(cylMat(0.06,0.06,1.4,w,0,0.7,0,12)); g.add(cylMat(0.18,0.18,0.04,w,0,0.45,0,16)); g.add(cylMat(0.15,0.15,0.04,w,0,0.9,0,16)); g.add(cylMat(0.2,0.2,0.04,w,0,1.4,0,16)); g.add(roundedBox(0.4,0.04,0.4,0.02,w,0,0.02,0)); return g; }
function buildFishTank(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.75,0.45,0.3,0.01,glass("#88CCDD",0.25),0,0.225,0)); g.add(roundedBox(0.72,0.38,0.27,0.005,glass("#5599BB",0.35),0,0.2,0)); g.add(roundedBox(0.78,0.04,0.33,0.01,mat(c),0,0.47,0)); return g; }
function buildPetCrate(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.75,0.55,0.45,0.02,mat(c),0,0.275,0)); const w=metal(darken(c,0.15)); for(let i=0;i<6;i++)g.add(cylMat(0.006,0.006,0.5,w,-0.28+i*0.11,0.275,0.23,4)); return g; }
function buildStonePath(c: string) { const g = new THREE.Group(); g.add(roundedBox(3.0,0.02,0.9,0.005,mat(c,{roughness:0.8}),0,0.01,0)); for(let i=0;i<8;i++)g.add(_mesh(new THREE.BoxGeometry(0.3,0.005,0.3),mat(darken(c,0.05)),-1.2+i*0.35+(i%2)*0.1,0.022,(i%2-0.5)*0.2)); return g; }
function buildLawnPatch(c: string) { const g = new THREE.Group(); g.add(roundedBox(3.0,0.02,1.8,0.01,mat(c,{roughness:0.95}),0,0.01,0)); return g; }
function buildGravelPath(c: string) { const g = new THREE.Group(); g.add(roundedBox(3.0,0.02,0.75,0.005,mat(c,{roughness:0.9}),0,0.01,0)); return g; }
function buildOutdoorTable(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.35,0.05,0.85,0.02,wood(c),0,0.73,0)); for(const[x,z]of[[-0.55,0.32],[0.55,0.32],[-0.55,-0.32],[0.55,-0.32]])g.add(cylMat(0.03,0.03,0.7,metal("#555"),x,0.35,z,8)); return g; }
function buildOutdoorChair(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.5,0.05,0.5,0.02,wood(c),0,0.42,0)); g.add(roundedBox(0.5,0.4,0.04,0.02,wood(c),0,0.65,-0.23)); for(const[x,z]of[[-0.2,0.2],[0.2,0.2],[-0.2,-0.2],[0.2,-0.2]])g.add(cylMat(0.02,0.02,0.4,metal("#555"),x,0.2,z,8)); return g; }
function buildGardenBench(c: string) { const g = new THREE.Group(); const w=wood(c); for(let i=0;i<4;i++)g.add(roundedBox(1.45,0.03,0.1,0.005,w,0,0.42,-0.15+i*0.1)); for(let i=0;i<3;i++)g.add(roundedBox(1.45,0.1,0.02,0.005,w,0,0.58+i*0.12,-0.27)); g.add(_mesh(new THREE.BoxGeometry(0.05,0.4,0.5),metal("#444"),-0.6,0.2,0)); g.add(_mesh(new THREE.BoxGeometry(0.05,0.4,0.5),metal("#444"),0.6,0.2,0)); return g; }
function buildHammock(c: string) { const g = new THREE.Group(); g.add(cylMat(0.04,0.04,1.0,wood("#6B4E35"),-1.1,0.5,0,8)); g.add(cylMat(0.04,0.04,1.0,wood("#6B4E35"),1.1,0.5,0,8)); g.add(roundedBox(2.0,0.04,0.75,0.02,fabric(c,{roughness:0.92}),0,0.5,0)); return g; }
function buildOutdoorLounge(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.65,0.12,1.7,0.03,fabric(c),0,0.22,0)); const b=roundedBox(0.6,0.1,0.5,0.03,fabric(c),0,0.35,-0.65); b.rotation.x=0.4; g.add(b); for(const[x,z]of[[-0.25,0.7],[0.25,0.7],[-0.25,-0.7],[0.25,-0.7]])g.add(cylMat(0.02,0.02,0.14,metal("#555"),x,0.07,z,8)); return g; }
function buildOakTree(c: string) { const g = new THREE.Group(); g.add(cylMat(0.15,0.2,2.5,wood("#5A4030"),0,1.25,0,8)); const l=new THREE.MeshStandardMaterial({color:c,roughness:0.85}); g.add(sphereMat(1.2,l,0,3.5,0,10)); g.add(sphereMat(0.9,l,0.5,3.8,0.3,8)); g.add(sphereMat(0.8,l,-0.4,3.6,-0.3,8)); return g; }
function buildPalmTree(c: string) { const g = new THREE.Group(); g.add(cylMat(0.08,0.12,3.0,wood("#8A6A4A"),0,1.5,0,8)); const l=new THREE.MeshStandardMaterial({color:c,roughness:0.85}); for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;const f=_mesh(new THREE.BoxGeometry(0.15,0.02,1.0),l,Math.cos(a)*0.5,3.1,Math.sin(a)*0.5);f.rotation.y=-a;f.rotation.x=0.4;g.add(f);} return g; }
function buildHedge(c: string) { const g = new THREE.Group(); g.add(roundedBox(2.0,1.15,0.45,0.08,mat(c,{roughness:0.9}),0,0.6,0)); return g; }
function buildFlowerBed(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.45,0.2,0.75,0.03,mat("#6B4E35",{roughness:0.9}),0,0.1,0)); for(let i=0;i<8;i++){const x=-0.55+i*0.15,z=-0.2+(i%2)*0.15;g.add(cylMat(0.008,0.008,0.15,mat("#4A8A3A"),x,0.27,z,4));g.add(sphereMat(0.03,mat(c),x,0.37,z,6));} return g; }
function buildShrub(c: string) { const g = new THREE.Group(); g.add(sphereMat(0.38,mat(c,{roughness:0.88}),0,0.38,0,10)); g.add(sphereMat(0.25,mat(lighten(c,0.05),{roughness:0.88}),0.15,0.5,0.1,8)); return g; }
function buildCar(c: string) { const g = new THREE.Group(); const m=mat(c,{roughness:0.25,metalness:0.6}); g.add(roundedBox(1.7,0.55,4.0,0.08,m,0,0.55,0)); g.add(roundedBox(1.5,0.5,2.0,0.1,glass("#333",0.3),0,1.05,-0.3)); for(const[x,z]of[[-0.8,1.2],[0.8,1.2],[-0.8,-1.2],[0.8,-1.2]])g.add(cylMat(0.3,0.3,0.15,mat("#222",{roughness:0.3}),x,0.3,z,16)); return g; }
function buildSUV(c: string) { const g = new THREE.Group(); const m=mat(c,{roughness:0.25,metalness:0.6}); g.add(roundedBox(1.9,0.65,4.3,0.08,m,0,0.6,0)); g.add(roundedBox(1.7,0.6,2.4,0.1,glass("#333",0.3),0,1.2,-0.2)); for(const[x,z]of[[-0.9,1.3],[0.9,1.3],[-0.9,-1.3],[0.9,-1.3]])g.add(cylMat(0.35,0.35,0.18,mat("#222",{roughness:0.3}),x,0.35,z,16)); return g; }
function buildToolBench(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.45,0.05,0.55,0.02,wood("#8A7060"),0,0.88,0)); g.add(roundedBox(1.4,0.4,0.5,0.02,mat(c),0,0.45,0)); for(const[x,z]of[[-0.6,0.22],[0.6,0.22],[-0.6,-0.22],[0.6,-0.22]])g.add(cylMat(0.03,0.03,0.88,metal("#555"),x,0.44,z,8)); return g; }
function buildStorageShelving(c: string) { const g = new THREE.Group(); const m=metal(c); for(const[x,z]of[[-0.55,-0.17],[0.55,-0.17],[-0.55,0.17],[0.55,0.17]])g.add(cylMat(0.02,0.02,1.8,m,x,0.9,z,8)); for(let i=0;i<5;i++)g.add(_mesh(new THREE.BoxGeometry(1.1,0.02,0.36),m,0,0.05+i*0.43,0)); return g; }
function buildSwimmingPool(c: string) { const g = new THREE.Group(); g.add(roundedBox(3.8,0.15,7.5,0.1,mat("#DDDDD8"),0,0.075,0)); g.add(roundedBox(3.5,0.05,7.2,0.08,new THREE.MeshStandardMaterial({color:c,roughness:0.1,transparent:true,opacity:0.6}),0,0.02,0)); return g; }
function buildHotTub(c: string) { const g = new THREE.Group(); g.add(cylMat(0.95,0.95,0.85,wood("#6B4E35"),0,0.425,0,16)); g.add(cylMat(0.85,0.85,0.05,new THREE.MeshStandardMaterial({color:c,roughness:0.1,transparent:true,opacity:0.5}),0,0.8,0,16)); return g; }
function buildPoolLounger(c: string) { const g = new THREE.Group(); g.add(roundedBox(0.6,0.06,1.6,0.02,mat(c),0,0.28,0)); const b=roundedBox(0.55,0.04,0.5,0.02,mat(c),0,0.4,-0.6); b.rotation.x=0.5; g.add(b); for(const[x,z]of[[-0.25,0.65],[0.25,0.65],[-0.25,-0.65],[0.25,-0.65]])g.add(cylMat(0.015,0.015,0.24,metal("#888"),x,0.12,z,8)); return g; }
function buildGardenLight(c: string) { const g = new THREE.Group(); g.add(cylMat(0.015,0.015,0.5,metal(c),0,0.25,0,8)); g.add(sphereMat(0.05,glass("#FFFDE8",0.5),0,0.53,0,10)); g.add(cylMat(0.06,0.02,0.04,metal(c),0,0.56,0,8)); return g; }
function buildSolarLamp(c: string) { const g = new THREE.Group(); g.add(cylMat(0.012,0.012,0.42,metal(c),0,0.21,0,8)); g.add(cylMat(0.04,0.04,0.03,mat("#333"),0,0.44,0,12)); return g; }
function buildPathLight(c: string) { const g = new THREE.Group(); g.add(cylMat(0.008,0.008,0.25,metal(c),0,0.125,0,6)); g.add(_mesh(new THREE.ConeGeometry(0.04,0.03,8),metal(c),0,0.27,0)); return g; }
function buildStringLights(c: string) { const g = new THREE.Group(); g.add(_mesh(new THREE.BoxGeometry(3.0,0.005,0.005),mat("#333"),0,2.5,0)); for(let i=0;i<10;i++)g.add(sphereMat(0.02,new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.4,roughness:0.3}),-1.35+i*0.3,2.47,0,6)); return g; }
function buildBBQGrill(c: string) { const g = new THREE.Group(); g.add(roundedBox(1.1,0.45,0.5,0.04,mat(c),0,0.7,0)); g.add(roundedBox(1.05,0.25,0.45,0.06,mat(c),0,1.06,0)); for(const[x,z]of[[-0.4,0.18],[0.4,0.18],[-0.4,-0.18],[0.4,-0.18]])g.add(cylMat(0.025,0.025,0.45,metal("#555"),x,0.225,z,8)); return g; }
function buildFirePit(c: string) { const g = new THREE.Group(); g.add(cylMat(0.38,0.4,0.35,mat(c),0,0.175,0,16)); g.add(cylMat(0.32,0.34,0.3,mat(darken(c,0.15)),0,0.2,0,16)); return g; }
function buildPlaygroundSet(c: string) { const g = new THREE.Group(); const w=wood(c); for(const[x,z]of[[-1.0,-0.8],[1.0,-0.8],[-1.0,0.8],[1.0,0.8]])g.add(cylMat(0.06,0.06,2.2,w,x,1.1,z,8)); g.add(roundedBox(2.0,0.06,1.6,0.02,w,0,1.2,0)); g.add(roundedBox(2.2,0.04,1.8,0.02,mat("#AA3030"),0,2.2,0)); g.add(roundedBox(0.4,0.02,1.5,0.02,mat("#4488CC"),1.3,0.7,0)); return g; }
function buildTrampoline(c: string) { const g = new THREE.Group(); g.add(cylMat(1.2,1.2,0.04,fabric("#333"),0,0.55,0,24)); g.add(cylMat(1.25,1.25,0.06,metal(c),0,0.53,0,24)); for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2;g.add(cylMat(0.03,0.03,0.5,metal(c),Math.cos(a)*1.1,0.25,Math.sin(a)*1.1,8));} return g; }

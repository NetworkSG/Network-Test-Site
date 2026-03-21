/**
 * FurnitureTopDown.tsx
 * Detailed architectural top-down SVG symbols for ~50 furniture types.
 *
 * Each symbol is drawn centered at (0,0) within the given pixel width (pw)
 * and pixel depth (pd). Stroke and fill colours adapt to selection state.
 */
import React from "react";

/* ────────────────────────────────────────────────────────── *
   Colour helpers
   ────────────────────────────────────────────────────────── */
interface Palette {
  fill: string;       // main body fill
  fillAlt: string;    // secondary fill (cushions, etc.)
  stroke: string;     // outline stroke
  detail: string;     // inner detail lines
  accent: string;     // small accent dots / handles
  text: string;       // label text
  sw: number;         // stroke-width base
}

/** Parse a hex color into [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    : h.slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Lighten a hex colour toward white by `amount` (0-1) */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/** Darken a hex colour toward black by `amount` (0-1) */
function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Perceived brightness 0-255 */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getPalette(
  isSelected: boolean,
  isDragging: boolean,
  _roomAccent: string,
  itemColor?: string,
): Palette {
  const base = itemColor || _roomAccent || "#8B8B8B";
  // Strip any trailing alpha hex chars – keep only first 7 chars (#RRGGBB)
  const color = base.length > 7 ? base.slice(0, 7) : base;
  const lum = luminance(color);
  const isLight = lum > 170;

  if (isSelected || isDragging) {
    return {
      fill: color,
      fillAlt: darken(color, 0.15),
      stroke: darken(color, 0.35),
      detail: darken(color, 0.25),
      accent: darken(color, 0.4),
      text: isLight ? "#09090B" : "#FFFFFF",
      sw: 2,
    };
  }

  return {
    fill: color,
    fillAlt: isLight ? darken(color, 0.1) : lighten(color, 0.15),
    stroke: darken(color, 0.3),
    detail: isLight ? darken(color, 0.2) : lighten(color, 0.25),
    accent: isLight ? darken(color, 0.35) : lighten(color, 0.3),
    text: isLight ? "#09090B" : "#FFFFFF",
    sw: 1.2,
  };
}

/* ────────────────────────────────────────────────────────── *
   Main export: returns an SVG <g> fragment
   ────────────────────────────────────────────────────────── */
export function renderFurnitureTopDown(
  furnitureId: string,
  pw: number,      // pixel width
  pd: number,      // pixel depth (height in top-down)
  isSelected: boolean,
  isDragging: boolean,
  roomAccent: string,
  itemName: string,
  itemColor?: string,
): React.ReactNode {
  const p = getPalette(isSelected, isDragging, roomAccent, itemColor);
  const showLabel = pw > 28 && pd > 16;
  const labelSize = Math.min(7, Math.max(4.5, pw * 0.15));
  const hw = pw / 2;
  const hd = pd / 2;

  const label = showLabel ? (
    <text
      x={0} y={hd - labelSize * 0.4}
      textAnchor="middle" dominantBaseline="auto"
      fill={p.text} fontSize={labelSize} fontFamily="Inter,sans-serif" fontWeight="500"
      className="pointer-events-none select-none"
    >
      {itemName.length > 14 ? itemName.substring(0, 12) + ".." : itemName}
    </text>
  ) : null;

  // Outline rect used as a shared base
  const baseRect = (rx = 2) => (
    <rect x={-hw} y={-hd} width={pw} height={pd} rx={rx}
      fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
  );

  // Get the builder
  const builder = BUILDERS[furnitureId];
  if (builder) {
    return <>{builder(pw, pd, hw, hd, p)}{label}</>;
  }

  // Fallback: simple rounded rect + label
  return <>{baseRect(3)}{label}</>;
}

/* ────────────────────────────────────────────────────────── *
   Symbol Builders (keyed by furnitureId)
   ────────────────────────────────────────────────────────── */
type Builder = (pw: number, pd: number, hw: number, hd: number, p: Palette) => React.ReactNode;

const BUILDERS: Record<string, Builder> = {

  /* ── SOFAS ── */
  "sofa": (pw, pd, hw, hd, p) => {
    const backH = pd * 0.18;
    const armW = pw * 0.1;
    const cushW = (pw - armW * 2) / 3;
    return (
      <g>
        {/* Back */}
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={backH} rx={2} fill={p.fillAlt} />
        {/* Arms */}
        <rect x={-hw + 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        <rect x={hw - armW - 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        {/* Seat cushions */}
        {[0, 1, 2].map(i => (
          <rect key={i} x={-hw + armW + 1.5 + i * cushW} y={-hd + backH + 2} width={cushW - 2} height={pd - backH - 4} rx={2}
            fill="none" stroke={p.detail} strokeWidth={0.7} />
        ))}
      </g>
    );
  },

  "sofa-2": (pw, pd, hw, hd, p) => {
    const backH = pd * 0.18;
    const armW = pw * 0.12;
    const cushW = (pw - armW * 2) / 2;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={backH} rx={2} fill={p.fillAlt} />
        <rect x={-hw + 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        <rect x={hw - armW - 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        {[0, 1].map(i => (
          <rect key={i} x={-hw + armW + 1.5 + i * cushW} y={-hd + backH + 2} width={cushW - 2} height={pd - backH - 4} rx={2}
            fill="none" stroke={p.detail} strokeWidth={0.7} />
        ))}
      </g>
    );
  },

  "settee": (pw, pd, hw, hd, p) => BUILDERS["sofa-2"](pw, pd, hw, hd, p),

  "armchair": (pw, pd, hw, hd, p) => {
    const backH = pd * 0.22;
    const armW = pw * 0.18;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Back */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={backH} rx={2} fill={p.fillAlt} />
        {/* Arms */}
        <rect x={-hw + 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        <rect x={hw - armW - 1} y={-hd + backH} width={armW} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        {/* Seat cushion */}
        <rect x={-hw + armW + 2} y={-hd + backH + 2} width={pw - armW * 2 - 4} height={pd - backH - 4} rx={2}
          fill="none" stroke={p.detail} strokeWidth={0.7} />
      </g>
    );
  },

  "lounge-chair": (pw, pd, hw, hd, p) => BUILDERS["armchair"](pw, pd, hw, hd, p),

  "ottoman": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={pw * 0.15} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Tufting cross */}
        <line x1={0} y1={-hd + 3} x2={0} y2={hd - 3} stroke={p.detail} strokeWidth={0.6} />
        <line x1={-hw + 3} y1={0} x2={hw - 3} y2={0} stroke={p.detail} strokeWidth={0.6} />
        {/* Button center */}
        <circle cx={0} cy={0} r={1.5} fill={p.detail} />
      </g>
    );
  },

  "dining-chair": (pw, pd, hw, hd, p) => {
    const backH = pd * 0.2;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Chair back */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={backH} rx={1.5} fill={p.fillAlt} />
        {/* Seat */}
        <rect x={-hw + 2} y={-hd + backH + 1.5} width={pw - 4} height={pd - backH - 3} rx={1.5}
          fill="none" stroke={p.detail} strokeWidth={0.6} />
      </g>
    );
  },

  "office-chair": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        {/* Base circle with casters */}
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Star base (5 legs) */}
        {[0, 72, 144, 216, 288].map((a, i) => {
          const rad = (a - 90) * Math.PI / 180;
          return (
            <g key={i}>
              <line x1={0} y1={0} x2={Math.cos(rad) * r * 0.75} y2={Math.sin(rad) * r * 0.75}
                stroke={p.detail} strokeWidth={0.6} />
              <circle cx={Math.cos(rad) * r * 0.8} cy={Math.sin(rad) * r * 0.8} r={1.2} fill={p.detail} />
            </g>
          );
        })}
        {/* Seat */}
        <circle cx={0} cy={0} r={r * 0.6} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Back */}
        <path d={`M ${-r * 0.4} ${-r * 0.35} Q 0 ${-r * 0.7} ${r * 0.4} ${-r * 0.35}`}
          fill="none" stroke={p.stroke} strokeWidth={1.2} strokeLinecap="round" />
      </g>
    );
  },

  "bar-stool": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={0} r={r * 0.65} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Footrest ring */}
        <circle cx={0} cy={0} r={r * 0.85} fill="none" stroke={p.detail} strokeWidth={0.5} strokeDasharray="2 2" />
      </g>
    );
  },

  /* ── TABLES ── */
  "dining-table": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Inner edge bevel */}
        <rect x={-hw + 3} y={-hd + 3} width={pw - 6} height={pd - 6} rx={1}
          fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* Legs */}
        {[[-hw + 4, -hd + 4], [hw - 4, -hd + 4], [-hw + 4, hd - 4], [hw - 4, hd - 4]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        ))}
      </g>
    );
  },

  "dining-table-6": (pw, pd, hw, hd, p) => BUILDERS["dining-table"](pw, pd, hw, hd, p),

  "coffee-table": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={pw * 0.08} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Surface detail */}
        <rect x={-hw + 2.5} y={-hd + 2.5} width={pw - 5} height={pd - 5} rx={pw * 0.05}
          fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* Legs */}
        {[[-hw + 4, -hd + 4], [hw - 4, -hd + 4], [-hw + 4, hd - 4], [hw - 4, hd - 4]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill={p.accent} />
        ))}
      </g>
    );
  },

  "side-table": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={0} r={r * 0.65} fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* Center leg */}
        <circle cx={0} cy={0} r={2} fill={p.accent} />
      </g>
    );
  },

  "round-table": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={0} r={r * 0.7} fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* 4 legs */}
        {[45, 135, 225, 315].map((a, i) => {
          const rad = a * Math.PI / 180;
          return <circle key={i} cx={Math.cos(rad) * r * 0.55} cy={Math.sin(rad) * r * 0.55} r={1.5} fill={p.accent} />;
        })}
      </g>
    );
  },

  "desk": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Drawer section */}
        <rect x={hw - pw * 0.35} y={-hd + 2} width={pw * 0.32} height={pd - 4} rx={1.5}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Drawer lines */}
        <line x1={hw - pw * 0.35 + 2} y1={-hd + pd * 0.33} x2={hw - 4} y2={-hd + pd * 0.33} stroke={p.detail} strokeWidth={0.4} />
        <line x1={hw - pw * 0.35 + 2} y1={-hd + pd * 0.66} x2={hw - 4} y2={-hd + pd * 0.66} stroke={p.detail} strokeWidth={0.4} />
        {/* Drawer handles */}
        {[0.33, 0.66].map((t, i) => (
          <circle key={i} cx={hw - pw * 0.19} cy={-hd + pd * t - pd * 0.08} r={0.8} fill={p.accent} />
        ))}
        {/* Legs */}
        {[[-hw + 3, -hd + 3], [-hw + 3, hd - 3], [hw - 3, -hd + 3], [hw - 3, hd - 3]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
        ))}
      </g>
    );
  },

  "desk-setup": (pw, pd, hw, hd, p) => BUILDERS["desk"](pw, pd, hw, hd, p),

  "console-table": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={1.5} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd - 4} rx={1}
          fill="none" stroke={p.detail} strokeWidth={0.4} />
        {/* Legs */}
        {[[-hw + 3, -hd + 2], [hw - 3, -hd + 2], [-hw + 3, hd - 2], [hw - 3, hd - 2]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.3} fill={p.accent} />
        ))}
      </g>
    );
  },

  "bar-counter": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Counter top edge */}
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd * 0.25} rx={1} fill={p.fillAlt} />
        {/* Shelves */}
        <line x1={-hw + 3} y1={0} x2={hw - 3} y2={0} stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },

  "kitchen-island": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd - 4} rx={1}
          fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* Sink */}
        <ellipse cx={-hw * 0.3} cy={0} rx={pw * 0.12} ry={pd * 0.18} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Faucet dot */}
        <circle cx={-hw * 0.3} cy={-pd * 0.25} r={1} fill={p.accent} />
      </g>
    );
  },

  /* ── BEDS ── */
  "queen-bed": (pw, pd, hw, hd, p) => buildBedSymbol(pw, pd, hw, hd, p, 2),
  "king-bed": (pw, pd, hw, hd, p) => buildBedSymbol(pw, pd, hw, hd, p, 2),
  "single-bed": (pw, pd, hw, hd, p) => buildBedSymbol(pw, pd, hw, hd, p, 1),
  "super-single": (pw, pd, hw, hd, p) => buildBedSymbol(pw, pd, hw, hd, p, 1),

  "nightstand": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Drawer */}
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd * 0.45} rx={1}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        <rect x={-hw + 2} y={hd - pd * 0.45 - 2} width={pw - 4} height={pd * 0.45} rx={1}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Handles */}
        <circle cx={0} cy={-hd + pd * 0.25} r={1} fill={p.accent} />
        <circle cx={0} cy={hd - pd * 0.25} r={1} fill={p.accent} />
      </g>
    );
  },

  /* ── STORAGE ── */
  "bookshelf": (pw, pd, hw, hd, p) => {
    const shelves = 4;
    const gap = pd / (shelves + 1);
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Shelf lines */}
        {Array.from({ length: shelves }, (_, i) => (
          <line key={i} x1={-hw + 2} y1={-hd + gap * (i + 1)} x2={hw - 2} y2={-hd + gap * (i + 1)}
            stroke={p.detail} strokeWidth={0.6} />
        ))}
        {/* Some "books" on shelves */}
        {Array.from({ length: shelves }, (_, i) => {
          const y = -hd + gap * i + 2;
          const booksW = (pw - 6) * (0.5 + [0.35, 0.25, 0.4, 0.3][i % 4]);
          return (
            <rect key={`b${i}`} x={-hw + 3} y={y} width={booksW} height={gap - 3} rx={0.5}
              fill={p.fillAlt} />
          );
        })}
      </g>
    );
  },

  "bookshelf-sm": (pw, pd, hw, hd, p) => BUILDERS["bookshelf"](pw, pd, hw, hd, p),

  "wardrobe": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Door split */}
        <line x1={0} y1={-hd + 2} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.7} />
        {/* Handles */}
        <circle cx={-3} cy={0} r={1} fill={p.accent} />
        <circle cx={3} cy={0} r={1} fill={p.accent} />
      </g>
    );
  },

  "wardrobe-3": (pw, pd, hw, hd, p) => {
    const doorW = pw / 3;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Door splits */}
        <line x1={-hw + doorW} y1={-hd + 2} x2={-hw + doorW} y2={hd - 2} stroke={p.detail} strokeWidth={0.7} />
        <line x1={-hw + doorW * 2} y1={-hd + 2} x2={-hw + doorW * 2} y2={hd - 2} stroke={p.detail} strokeWidth={0.7} />
        {/* Handles */}
        {[0.5, 1.5, 2.5].map((m, i) => (
          <circle key={i} cx={-hw + doorW * m} cy={0} r={1} fill={p.accent} />
        ))}
      </g>
    );
  },

  "shoe-cabinet": (pw, pd, hw, hd, p) => {
    const slats = 3;
    const gap = pd / (slats + 1);
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Slanted drawer fronts */}
        {Array.from({ length: slats }, (_, i) => {
          const y = -hd + gap * (i + 0.5);
          return (
            <g key={i}>
              <line x1={-hw + 2} y1={y} x2={hw - 2} y2={y + gap * 0.3} stroke={p.detail} strokeWidth={0.5} />
              <circle cx={hw - 5} cy={y + gap * 0.15} r={0.8} fill={p.accent} />
            </g>
          );
        })}
      </g>
    );
  },

  "dresser": (pw, pd, hw, hd, p) => {
    const drawers = 4;
    const drawerH = (pd - 3) / drawers;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {Array.from({ length: drawers }, (_, i) => (
          <g key={i}>
            <rect x={-hw + 2} y={-hd + 1.5 + i * drawerH} width={pw - 4} height={drawerH - 1.5} rx={1}
              fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
            <circle cx={0} cy={-hd + 1.5 + i * drawerH + drawerH / 2} r={0.8} fill={p.accent} />
          </g>
        ))}
      </g>
    );
  },

  "storage-rack": (pw, pd, hw, hd, p) => {
    const shelves = 3;
    const gap = pd / (shelves + 1);
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={1.5} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {Array.from({ length: shelves }, (_, i) => (
          <line key={i} x1={-hw + 2} y1={-hd + gap * (i + 1)} x2={hw - 2} y2={-hd + gap * (i + 1)}
            stroke={p.detail} strokeWidth={0.5} />
        ))}
        {/* Vertical divider */}
        <line x1={0} y1={-hd + 2} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.4} />
      </g>
    );
  },

  "wine-rack": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Diamond grid pattern */}
        {Array.from({ length: 3 }, (_, i) =>
          Array.from({ length: 2 }, (_, j) => {
            const cx = -hw + pw * (i + 1) / 4;
            const cy = -hd + pd * (j + 1) / 3;
            return (
              <g key={`${i}-${j}`}>
                <circle cx={cx} cy={cy} r={Math.min(pw, pd) * 0.08} fill="none" stroke={p.detail} strokeWidth={0.5} />
                <circle cx={cx} cy={cy} r={1} fill={p.accent} />
              </g>
            );
          })
        )}
      </g>
    );
  },

  /* ── KITCHEN ── */
  "fridge": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Door split */}
        <line x1={-hw + 2} y1={-hd + pd * 0.35} x2={hw - 2} y2={-hd + pd * 0.35} stroke={p.detail} strokeWidth={0.7} />
        {/* Handles */}
        <line x1={hw - 5} y1={-hd + pd * 0.12} x2={hw - 5} y2={-hd + pd * 0.28} stroke={p.accent} strokeWidth={1.2} strokeLinecap="round" />
        <line x1={hw - 5} y1={-hd + pd * 0.42} x2={hw - 5} y2={-hd + pd * 0.65} stroke={p.accent} strokeWidth={1.2} strokeLinecap="round" />
      </g>
    );
  },

  "oven": (pw, pd, hw, hd, p) => {
    const br = Math.min(pw, pd) * 0.13;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* 4 burner circles */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
          <g key={i}>
            <circle cx={dx * pw * 0.2} cy={dy * pd * 0.2} r={br} fill="none" stroke={p.detail} strokeWidth={0.7} />
            <circle cx={dx * pw * 0.2} cy={dy * pd * 0.2} r={br * 0.5} fill="none" stroke={p.detail} strokeWidth={0.4} />
          </g>
        ))}
        {/* Knobs row */}
        <line x1={-hw + 3} y1={hd - 3} x2={hw - 3} y2={hd - 3} stroke={p.detail} strokeWidth={0.4} />
        {[0.2, 0.4, 0.6, 0.8].map((t, i) => (
          <circle key={i} cx={-hw + pw * t} cy={hd - 3} r={1.2} fill={p.accent} />
        ))}
      </g>
    );
  },

  "microwave": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Window */}
        <rect x={-hw + 3} y={-hd + 3} width={pw * 0.55} height={pd - 6} rx={1.5}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Control panel */}
        <circle cx={hw - pw * 0.18} cy={0} r={Math.min(pw, pd) * 0.1} fill="none" stroke={p.detail} strokeWidth={0.5} />
        <circle cx={hw - pw * 0.18} cy={0} r={1} fill={p.accent} />
      </g>
    );
  },

  "kitchen-sink": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Basin */}
        <rect x={-hw + 4} y={-hd + 4} width={pw - 8} height={pd - 8} rx={3}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.7} />
        {/* Drain */}
        <circle cx={0} cy={pd * 0.08} r={2} fill={p.detail} />
        {/* Faucet */}
        <circle cx={0} cy={-hd + 5} r={1.5} fill={p.accent} />
        <line x1={0} y1={-hd + 6.5} x2={0} y2={-hd + pd * 0.35} stroke={p.accent} strokeWidth={0.8} />
      </g>
    );
  },

  "kitchen-counter": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd - 4} rx={1}
          fill="none" stroke={p.detail} strokeWidth={0.4} />
        {/* Cabinet doors below */}
        <line x1={0} y1={-hd + pd * 0.4} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.4} />
      </g>
    );
  },

  "upper-cabinet": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={1.5} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <line x1={0} y1={-hd + 2} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.5} />
        <circle cx={-3} cy={0} r={0.8} fill={p.accent} />
        <circle cx={3} cy={0} r={0.8} fill={p.accent} />
      </g>
    );
  },

  "lower-cabinet": (pw, pd, hw, hd, p) => BUILDERS["upper-cabinet"](pw, pd, hw, hd, p),

  /* ── BATHROOM ── */
  "toilet": (pw, pd, hw, hd, p) => {
    const tankH = pd * 0.25;
    return (
      <g>
        {/* Tank */}
        <rect x={-hw + 1} y={-hd} width={pw - 2} height={tankH} rx={2}
          fill={p.fillAlt} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Seat (oval) */}
        <ellipse cx={0} cy={-hd + tankH + (pd - tankH) * 0.48} rx={hw - 2} ry={(pd - tankH) * 0.48}
          fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Inner bowl */}
        <ellipse cx={0} cy={-hd + tankH + (pd - tankH) * 0.45} rx={hw * 0.6} ry={(pd - tankH) * 0.32}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Flush button */}
        <circle cx={0} cy={-hd + tankH * 0.4} r={1.5} fill={p.accent} />
      </g>
    );
  },

  "bathtub": (pw, pd, hw, hd, p) => {
    return (
      <g>
        {/* Outer tub */}
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={pw * 0.08}
          fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Inner basin */}
        <rect x={-hw + 3} y={-hd + 3} width={pw - 6} height={pd - 6} rx={pw * 0.06}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Drain */}
        <circle cx={0} cy={hd - 8} r={2} fill={p.detail} />
        {/* Faucet area */}
        <rect x={-4} y={-hd + 1} width={8} height={4} rx={1.5} fill={p.accent} />
      </g>
    );
  },

  "shower": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd);
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Shower tray */}
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd - 4} rx={1.5}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Shower head (circle) */}
        <circle cx={0} cy={-hd + r * 0.4} r={r * 0.2} fill="none" stroke={p.detail} strokeWidth={0.6} />
        {/* Water spray dots */}
        {[-2, 0, 2].map((dx, i) =>
          [-1, 1].map((dy, j) => (
            <circle key={`${i}-${j}`} cx={dx} cy={-hd + r * 0.4 + dy * 2} r={0.5} fill={p.detail} />
          ))
        )}
        {/* Drain */}
        <circle cx={0} cy={hd - 5} r={2} fill={p.detail} />
      </g>
    );
  },

  "vanity": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Counter top */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={pd * 0.3} rx={1} fill={p.fillAlt} />
        {/* Sink basin */}
        <ellipse cx={0} cy={-hd + pd * 0.15} rx={pw * 0.2} ry={pd * 0.1} fill="none" stroke={p.detail} strokeWidth={0.6} />
        <circle cx={0} cy={-hd + pd * 0.15} r={1} fill={p.accent} />
        {/* Cabinet doors */}
        <line x1={0} y1={-hd + pd * 0.35} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.5} />
        <circle cx={-3} cy={pd * 0.15} r={0.8} fill={p.accent} />
        <circle cx={3} cy={pd * 0.15} r={0.8} fill={p.accent} />
      </g>
    );
  },

  "vanity-cabinet": (pw, pd, hw, hd, p) => BUILDERS["vanity"](pw, pd, hw, hd, p),

  "wash-basin": (pw, pd, hw, hd, p) => {
    const rx = hw * 0.75;
    const ry = hd * 0.75;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        <circle cx={0} cy={0} r={1.5} fill={p.detail} />
        <circle cx={0} cy={-ry * 0.7} r={1.2} fill={p.accent} />
      </g>
    );
  },

  "towel-rack": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={1.5} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Bars */}
        {[0.3, 0.5, 0.7].map((t, i) => (
          <line key={i} x1={-hw + 3} y1={-hd + pd * t} x2={hw - 3} y2={-hd + pd * t}
            stroke={p.detail} strokeWidth={0.8} strokeLinecap="round" />
        ))}
      </g>
    );
  },

  "bath-mirror": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <rect x={-hw + 2} y={-hd + 2} width={pw - 4} height={pd - 4} rx={1.5}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
        {/* Shine highlight */}
        <line x1={-hw + 4} y1={-hd + 4} x2={-hw + pw * 0.3} y2={-hd + pd * 0.3}
          stroke={p.detail} strokeWidth={0.5} strokeLinecap="round" />
      </g>
    );
  },

  "mirror": (pw, pd, hw, hd, p) => BUILDERS["bath-mirror"](pw, pd, hw, hd, p),

  /* ── APPLIANCES ── */
  "washer": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) * 0.55;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Drum circle */}
        <circle cx={0} cy={pd * 0.05} r={r} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.7} />
        <circle cx={0} cy={pd * 0.05} r={r * 0.6} fill="none" stroke={p.detail} strokeWidth={0.4} />
        {/* Control panel */}
        <line x1={-hw + 2} y1={-hd + pd * 0.18} x2={hw - 2} y2={-hd + pd * 0.18} stroke={p.detail} strokeWidth={0.4} />
        <circle cx={hw - 6} cy={-hd + pd * 0.09} r={1.5} fill="none" stroke={p.accent} strokeWidth={0.5} />
      </g>
    );
  },

  "tv": (pw, pd, hw, hd, p) => {
    return (
      <g>
        {/* Thin screen */}
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={1} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Screen bezel */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={pd * 0.7} rx={0.5}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
        {/* Stand */}
        <rect x={-pw * 0.15} y={hd - pd * 0.2} width={pw * 0.3} height={pd * 0.15} rx={1}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
      </g>
    );
  },

  "tv-console": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Compartments */}
        <line x1={-hw + pw * 0.33} y1={-hd + 2} x2={-hw + pw * 0.33} y2={hd - 2} stroke={p.detail} strokeWidth={0.5} />
        <line x1={-hw + pw * 0.66} y1={-hd + 2} x2={-hw + pw * 0.66} y2={hd - 2} stroke={p.detail} strokeWidth={0.5} />
        {/* Shelf in center */}
        <line x1={-hw + pw * 0.33 + 2} y1={0} x2={-hw + pw * 0.66 - 2} y2={0} stroke={p.detail} strokeWidth={0.4} />
      </g>
    );
  },

  "ironing-board": (pw, pd, hw, hd, p) => {
    // Tapered shape — wider at one end
    const wTop = pw * 0.4;
    const wBot = pw;
    return (
      <g>
        <path
          d={`M ${-wTop / 2} ${-hd} L ${wTop / 2} ${-hd} L ${wBot / 2} ${hd} Q 0 ${hd + 2} ${-wBot / 2} ${hd} Z`}
          fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Cross pattern */}
        <line x1={0} y1={-hd + 3} x2={0} y2={hd - 2} stroke={p.detail} strokeWidth={0.4} />
        {/* Legs */}
        <line x1={-hw * 0.4} y1={-hd * 0.3} x2={hw * 0.4} y2={hd * 0.3} stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },

  "vacuum": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) * 0.65;
    return (
      <g>
        <circle cx={0} cy={hd * 0.2} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={hd * 0.2} r={r * 0.5} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Handle line */}
        <line x1={0} y1={-hd + 2} x2={0} y2={hd * 0.2 - r} stroke={p.stroke} strokeWidth={1} strokeLinecap="round" />
        <circle cx={0} cy={-hd + 2} r={1.5} fill={p.accent} />
      </g>
    );
  },

  /* ── DECOR ── */
  "plant": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        {/* Pot */}
        <circle cx={0} cy={0} r={r * 0.45} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Foliage */}
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Leaf details */}
        {[0, 60, 120, 180, 240, 300].map((a, i) => {
          const rad = a * Math.PI / 180;
          const lx = Math.cos(rad) * r * 0.55;
          const ly = Math.sin(rad) * r * 0.55;
          return (
            <ellipse key={i} cx={lx} cy={ly} rx={r * 0.25} ry={r * 0.12}
              transform={`rotate(${a}, ${lx}, ${ly})`}
              fill="none" stroke={p.detail} strokeWidth={0.5} />
          );
        })}
        <circle cx={0} cy={0} r={r * 0.15} fill={p.accent} />
      </g>
    );
  },

  "floor-plant": (pw, pd, hw, hd, p) => BUILDERS["plant"](pw, pd, hw, hd, p),

  "rug": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray="3 1.5" />
        {/* Inner border */}
        <rect x={-hw + 4} y={-hd + 4} width={pw - 8} height={pd - 8} rx={1.5}
          fill="none" stroke={p.detail} strokeWidth={0.5} />
        {/* Pattern center */}
        <rect x={-hw + 8} y={-hd + 8} width={pw - 16} height={pd - 16} rx={1}
          fill="none" stroke={p.detail} strokeWidth={0.4} strokeDasharray="2 2" />
      </g>
    );
  },

  "floor-lamp": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        {/* Base */}
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Shade circle */}
        <circle cx={0} cy={0} r={r * 0.65} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        {/* Pole */}
        <circle cx={0} cy={0} r={1.5} fill={p.accent} />
        {/* Light rays */}
        {[0, 90, 180, 270].map((a, i) => {
          const rad = a * Math.PI / 180;
          return (
            <line key={i}
              x1={Math.cos(rad) * r * 0.35} y1={Math.sin(rad) * r * 0.35}
              x2={Math.cos(rad) * r * 0.55} y2={Math.sin(rad) * r * 0.55}
              stroke={p.detail} strokeWidth={0.4} />
          );
        })}
      </g>
    );
  },

  "pendant": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray="2 1" />
        <circle cx={0} cy={0} r={r * 0.5} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        <circle cx={0} cy={0} r={2} fill={p.accent} />
      </g>
    );
  },

  "dryer": (pw, pd, hw, hd, p) => BUILDERS["washer"](pw, pd, hw, hd, p),
  "dishwasher": (pw, pd, hw, hd, p) => BUILDERS["washer"](pw, pd, hw, hd, p),

  "robot-vacuum": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={-r * 0.2} r={r * 0.25} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
        <line x1={-r * 0.5} y1={r * 0.3} x2={r * 0.5} y2={r * 0.3} stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },

  "l-sofa": (pw, pd, hw, hd, p) => {
    // L-shaped sofa: main body along bottom, extension up the right side
    const armW = pw * 0.08;
    const backH = pd * 0.14;
    const extW = pw * 0.35;
    return (
      <g>
        {/* Main horizontal body */}
        <rect x={-hw} y={hd - pd * 0.45} width={pw} height={pd * 0.45} rx={3}
          fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Vertical extension (right side) */}
        <rect x={hw - extW} y={-hd} width={extW} height={pd} rx={3}
          fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Back cushions horizontal */}
        <rect x={-hw + 1} y={hd - backH - 1} width={pw - extW - 1} height={backH} rx={2}
          fill={p.fillAlt} />
        {/* Back cushions vertical */}
        <rect x={hw - armW - 1} y={-hd + 1} width={armW} height={pd * 0.55 - 2} rx={2}
          fill={p.fillAlt} />
        {/* Seat cushion lines */}
        <line x1={-hw + armW + 2} y1={hd - pd * 0.22} x2={hw - extW - 2} y2={hd - pd * 0.22}
          stroke={p.detail} strokeWidth={0.5} />
        <line x1={hw - extW + 3} y1={-hd + pd * 0.15} x2={hw - extW + 3} y2={hd - pd * 0.45 - 2}
          stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },

  "recliner": (pw, pd, hw, hd, p) => {
    const backH = pd * 0.2;
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Back */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={backH} rx={2} fill={p.fillAlt} />
        {/* Arms */}
        <rect x={-hw + 1} y={-hd + backH} width={pw * 0.12} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        <rect x={hw - pw * 0.12 - 1} y={-hd + backH} width={pw * 0.12} height={pd - backH - 1} rx={2} fill={p.fillAlt} />
        {/* Seat cushion */}
        <rect x={-hw + pw * 0.15} y={-hd + backH + 2} width={pw * 0.7} height={pd * 0.35} rx={2}
          fill="none" stroke={p.detail} strokeWidth={0.6} />
        {/* Footrest line */}
        <line x1={-hw + pw * 0.2} y1={hd - pd * 0.15} x2={hw - pw * 0.2} y2={hd - pd * 0.15}
          stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },

  "standing-desk": (pw, pd, hw, hd, p) => BUILDERS["desk"](pw, pd, hw, hd, p),
  "kids-desk": (pw, pd, hw, hd, p) => BUILDERS["desk"](pw, pd, hw, hd, p),
  "folding-table": (pw, pd, hw, hd, p) => BUILDERS["dining-table"](pw, pd, hw, hd, p),

  "bunk-bed": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Headboard */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={pd * 0.08} rx={2} fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Two mattresses shown via dashed center line */}
        <line x1={-hw + 3} y1={0} x2={hw - 3} y2={0} stroke={p.detail} strokeWidth={0.5} strokeDasharray="3 2" />
        {/* Pillow top */}
        <rect x={-hw + 3} y={-hd + pd * 0.1} width={pw * 0.5} height={pd * 0.12} rx={2}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
        {/* Pillow bottom */}
        <rect x={-hw + 3} y={pd * 0.02} width={pw * 0.5} height={pd * 0.12} rx={2}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.4} />
        {/* Ladder */}
        <line x1={hw - 3} y1={-hd + pd * 0.3} x2={hw - 3} y2={hd - 3} stroke={p.accent} strokeWidth={0.8} />
        <line x1={hw - 6} y1={-hd + pd * 0.4} x2={hw - 1} y2={-hd + pd * 0.4} stroke={p.accent} strokeWidth={0.5} />
        <line x1={hw - 6} y1={-hd + pd * 0.55} x2={hw - 1} y2={-hd + pd * 0.55} stroke={p.accent} strokeWidth={0.5} />
      </g>
    );
  },

  "crib": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Rails */}
        <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={pd - 2} rx={2}
          fill="none" stroke={p.detail} strokeWidth={0.6} />
        {/* Slats */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = -hw + 3 + (i * (pw - 6)) / 4;
          return <line key={i} x1={x} y1={-hd + 2} x2={x} y2={hd - 2} stroke={p.detail} strokeWidth={0.4} />;
        })}
      </g>
    );
  },

  "tv-55": (pw, pd, hw, hd, p) => BUILDERS["tv"](pw, pd, hw, hd, p),
  "soundbar": (pw, pd, hw, hd, p) => BUILDERS["tv"](pw, pd, hw, hd, p),

  "sideboard": (pw, pd, hw, hd, p) => BUILDERS["tv-console"](pw, pd, hw, hd, p),
  "hall-closet": (pw, pd, hw, hd, p) => BUILDERS["wardrobe"](pw, pd, hw, hd, p),
  "wardrobe-3": (pw, pd, hw, hd, p) => BUILDERS["wardrobe"](pw, pd, hw, hd, p),
  "display-shelf": (pw, pd, hw, hd, p) => BUILDERS["bookshelf"](pw, pd, hw, hd, p),
  "office-bookshelf": (pw, pd, hw, hd, p) => BUILDERS["bookshelf"](pw, pd, hw, hd, p),
  "pantry-shelf": (pw, pd, hw, hd, p) => BUILDERS["bookshelf"](pw, pd, hw, hd, p),
  "storage-shelving": (pw, pd, hw, hd, p) => BUILDERS["bookshelf"](pw, pd, hw, hd, p),
  "locker-unit": (pw, pd, hw, hd, p) => BUILDERS["wardrobe"](pw, pd, hw, hd, p),

  "runner-rug": (pw, pd, hw, hd, p) => BUILDERS["rug"](pw, pd, hw, hd, p),
  "bath-mat": (pw, pd, hw, hd, p) => BUILDERS["rug"](pw, pd, hw, hd, p),
  "round-rug": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        <circle cx={0} cy={0} r={r * 0.7} fill="none" stroke={p.detail} strokeWidth={0.5} />
        <circle cx={0} cy={0} r={r * 0.35} fill="none" stroke={p.detail} strokeWidth={0.4} />
      </g>
    );
  },

  "bidet": (pw, pd, hw, hd, p) => BUILDERS["toilet"](pw, pd, hw, hd, p),

  "electric-fireplace": (pw, pd, hw, hd, p) => {
    return (
      <g>
        <rect x={-hw} y={-hd} width={pw} height={pd} rx={2} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
        {/* Opening */}
        <rect x={-hw + pw * 0.15} y={-hd + 2} width={pw * 0.7} height={pd * 0.6} rx={2}
          fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        {/* Flame hint */}
        <path d={`M ${-pw * 0.1} ${-hd + pd * 0.5} Q 0 ${-hd + pd * 0.15} ${pw * 0.1} ${-hd + pd * 0.5}`}
          fill="none" stroke={p.accent} strokeWidth={0.7} />
      </g>
    );
  },
  "wood-fireplace": (pw, pd, hw, hd, p) => BUILDERS["electric-fireplace"](pw, pd, hw, hd, p),
  "gas-fireplace": (pw, pd, hw, hd, p) => BUILDERS["electric-fireplace"](pw, pd, hw, hd, p),

  "ceiling-fan": (pw, pd, hw, hd, p) => {
    const r = Math.min(hw, hd) - 1;
    return (
      <g>
        <circle cx={0} cy={0} r={r} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray="2 1.5" />
        {/* 4 blades */}
        {[0, 90, 180, 270].map((a, i) => {
          const rad = a * Math.PI / 180;
          const bx = Math.cos(rad) * r * 0.55;
          const by = Math.sin(rad) * r * 0.55;
          return (
            <ellipse key={i} cx={bx} cy={by} rx={r * 0.35} ry={r * 0.1}
              transform={`rotate(${a}, ${bx}, ${by})`}
              fill={p.fillAlt} stroke={p.detail} strokeWidth={0.5} />
          );
        })}
        {/* Center motor */}
        <circle cx={0} cy={0} r={r * 0.15} fill={p.accent} stroke={p.detail} strokeWidth={0.5} />
      </g>
    );
  },
};

/* ────────────────────────────────────────────────────────── *
   Bed helper (shared by all bed sizes)
   ────────────────────────────────────────────────────────── */
function buildBedSymbol(
  pw: number, pd: number, hw: number, hd: number, p: Palette, pillows: number,
): React.ReactNode {
  const headboardH = pd * 0.08;
  const pillowH = pd * 0.14;
  const pillowGap = 2;
  const pillowW = pillows === 1
    ? pw * 0.55
    : (pw - pillowGap * (pillows + 1)) / pillows;

  return (
    <g>
      {/* Mattress */}
      <rect x={-hw} y={-hd} width={pw} height={pd} rx={3} fill={p.fill} stroke={p.stroke} strokeWidth={p.sw} />
      {/* Headboard */}
      <rect x={-hw + 1} y={-hd + 1} width={pw - 2} height={headboardH} rx={2}
        fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
      {/* Pillows */}
      {Array.from({ length: pillows }, (_, i) => {
        const px = pillows === 1
          ? -pillowW / 2
          : -hw + pillowGap + i * (pillowW + pillowGap);
        return (
          <rect key={i}
            x={px} y={-hd + headboardH + 3}
            width={pillowW} height={pillowH}
            rx={pillowH * 0.35}
            fill={p.fillAlt} stroke={p.detail} strokeWidth={0.6} />
        );
      })}
      {/* Blanket fold line */}
      <line x1={-hw + 4} y1={hd - pd * 0.3} x2={hw - 4} y2={hd - pd * 0.3}
        stroke={p.detail} strokeWidth={0.6} strokeLinecap="round" />
      {/* Second fold line (subtle) */}
      <line x1={-hw + 6} y1={hd - pd * 0.25} x2={hw - 6} y2={hd - pd * 0.25}
        stroke={p.detail} strokeWidth={0.35} strokeLinecap="round" />
    </g>
  );
}
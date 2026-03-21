# 3D Interactive Space Planner — HDB 3-Room Simplified (Corridor), 1984–1988, 64 sqm

## Task

Build a fully interactive 3D space planner web application (React + Three.js / React Three Fiber) that faithfully reproduces the **HDB 3-Room Simplified (Corridor)** floor plan from the 1984–1988 era (64 sqm / ~689 sq ft). The app must allow users to navigate the 3D space, place/move/rotate furniture, swap wall and floor materials, and export their layout.

---

## Context

### About the Unit

- **Type**: HDB 3-Room Simplified (Corridor access)
- **Era**: Built 1984–1988
- **Total Floor Area**: 64 sqm (~689 sq ft)
- **Overall Dimensions**: 6,100mm wide × 11,700mm deep (exterior wall-to-wall)
- **Scale**: Original drawing at 1:100
- **Common Locations**: Bedok, Bishan, Bukit Batok, Geyland, Hougang, Jurong West, Serangoon, Tampines, Yishun (Singapore)
- **Access**: Corridor-type unit with access balcony running along the bottom (south) edge

### Target Users

Singapore homeowners doing BTO/resale HDB renovation planning — they need to visualize furniture placement, spatial flow, and material choices before committing to a contractor.

---

## Elements

### A. Floor Plan Geometry (Exact Dimensions)

All measurements are in **millimeters** from the original architectural drawing. Convert to meters for the 3D scene (÷ 1000). Wall thickness should be **150mm** (typical HDB concrete wall) unless noted. Ceiling height is **2,600mm** (standard HDB).

#### A.1 — Overall Envelope

| Parameter | Value |
|---|---|
| Total width (E–W) | 6,100 mm |
| Total depth (N–S) | 11,700 mm |
| Ceiling height | 2,600 mm |
| Wall thickness (exterior) | 150 mm |
| Wall thickness (interior partitions) | 100 mm |

#### A.2 — Room Breakdown (clockwise from top-left)

##### Kitchen / Dining
- **Position**: Top-left quadrant
- **Width**: ~2,100 mm (from left exterior wall to internal partition)
- **Depth**: ~5,800 mm (from top exterior wall down to store room partition)
- **Features**:
  - Refuse chute recess in top-left corner (~500 mm × 500 mm)
  - Kitchen counter runs along the top wall (north)
  - Open-plan to living room (no partition on the south end — flows into living room)
  - Drop point (100mm) near top wall for plumbing stack

##### Bath/WC 2 (Guest Bathroom)
- **Position**: Top-center, adjacent to kitchen
- **Width**: ~2,200 mm
- **Depth**: ~1,500 mm
- **Features**:
  - Toilet, wash basin, shower area
  - Door swings inward (toward bathroom interior)
  - 100mm drop from corridor level

##### Bath/WC 1 (Main Bathroom)
- **Position**: Directly below Bath/WC 2
- **Width**: ~2,200 mm
- **Depth**: ~1,500 mm (approximately, stacked below WC 2)
- **Features**:
  - Toilet, wash basin, shower area
  - Door faces the internal corridor / main bedroom entry zone
  - 100mm drop from corridor level

##### Main Bedroom
- **Position**: Right side, upper half
- **Width**: ~2,900 mm (from internal partition to right exterior wall, accounting for wall thickness; internal clear width ~2,750 mm)
- **Depth**: ~4,500 mm
- **Features**:
  - Entry door from central corridor zone (~700mm wide)
  - Window on the right (east) exterior wall (~1,200 mm wide)
  - 100mm drop indicated near bathroom wall for plumbing

##### Store Room
- **Position**: Center-left, between kitchen/dining and living room
- **Width**: ~1,400 mm
- **Depth**: ~1,200 mm
- **Features**:
  - Small utility closet
  - Door opening ~700mm, swings outward into corridor zone
  - Adjacent to the 500mm deep kitchen counter wall

##### Living Room
- **Position**: Left side, lower half
- **Width**: ~3,200 mm (from left exterior wall to bedroom partition)
- **Depth**: ~5,200 mm (from store room partition down to access balcony wall)
- **Features**:
  - Largest room in the unit
  - Open connection to kitchen/dining on the north side
  - Window(s) on the left (west) exterior wall
  - Main entry door from access balcony on the bottom-left

##### Bedroom (Second Bedroom)
- **Position**: Right side, lower half
- **Width**: ~2,900 mm (from partition to right exterior wall)
- **Depth**: ~4,200 mm
- **Features**:
  - Entry door from living room area (~700mm wide)
  - Window on the right (east) exterior wall
  - 100mm drop near partition wall

##### Access Balcony / Corridor
- **Position**: Bottom (south) edge, full width
- **Width**: 6,100 mm (full unit width)
- **Depth**: ~700 mm
- **Features**:
  - Common corridor shared with neighbors
  - Main entrance door to the unit (~900mm wide) located on the left side
  - Open railing / wall on the south side

#### A.3 — Door Schedule

| Door | Location | Width | Swing Direction |
|---|---|---|---|
| Main Entry | Access balcony → Living Room (bottom-left) | ~900 mm | Inward (into living room) |
| Main Bedroom | Central corridor → Main Bedroom | ~700 mm | Inward |
| Bedroom 2 | Living Room → Bedroom | ~700 mm | Inward |
| Bath/WC 1 | Corridor zone → Bathroom 1 | ~700 mm | Inward |
| Bath/WC 2 | Corridor zone → Bathroom 2 | ~700 mm | Inward |
| Store Room | Corridor zone → Store | ~700 mm | Outward |
| Kitchen (no door) | Open-plan flow from kitchen to living room | N/A | N/A |

#### A.4 — Window Schedule

| Window | Wall | Approximate Width | Sill Height |
|---|---|---|---|
| Kitchen window | North (top) wall | ~1,200 mm | 900 mm |
| Living Room window | West (left) wall | ~1,500 mm | 900 mm |
| Main Bedroom window | East (right) wall | ~1,200 mm | 900 mm |
| Bedroom 2 window | East (right) wall | ~1,200 mm | 900 mm |
| Bathroom windows (if any) | North wall (high, frosted) | ~600 mm | 1,500 mm |

---

### B. 3D Scene Requirements

#### B.1 — Architecture Rendering

- **Walls**: Extruded from floor plan polylines to 2,600mm height. Interior faces accept material/paint swaps. Exterior walls are fixed concrete texture.
- **Floor**: Each room has an independent floor zone that accepts material swaps (tile, vinyl, wood, concrete).
- **Ceiling**: Flat slab at 2,600mm. Option to toggle ceiling visibility for top-down planning.
- **Doors**: Modeled as 3D panels with frame. Animated open/close on click (hinge rotation 0°–90°). Glass panel option for main entry.
- **Windows**: Recessed openings with frame geometry. Optional frosted/clear glass toggle. Exterior light source behind each window to simulate daylight.
- **Bathroom drop**: Visually indicate the 100mm floor level drop in both bathrooms with a step or color change.
- **Refuse chute recess**: Modeled as a recessed column/box in the top-left corner of the kitchen.

#### B.2 — Camera System

| Mode | Description |
|---|---|
| **Orbit** (default) | OrbitControls centered on the unit. Zoom, pan, rotate freely. |
| **Top-Down** | Orthographic camera looking straight down. Snaps to plan view. Grid overlay optional. |
| **First-Person Walkthrough** | WASD + mouse look. Eye height at 1,600mm. Collision detection against walls. |
| **Room Focus** | Click a room label → camera smoothly animates to frame that room. |

#### B.3 — Lighting

- **Ambient**: Soft warm ambient light (intensity 0.4, color #FFF5E6)
- **Directional (Sun)**: Angle from top-right simulating Singapore afternoon sun. Casts soft shadows.
- **Window Light**: Rectangular area lights behind each window opening. Warm white (#FFF8F0).
- **Interior Points**: One point light per room (togglable, simulating ceiling fixture). Warm white, intensity 0.6.

---

### C. Furniture & Object Library

Provide a categorized, drag-and-drop panel. Each item is a simplified 3D mesh (box geometry with rounded edges is fine — keep it clean, not photorealistic). All dimensions in mm.

#### C.1 — Living Room

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| 3-Seater Sofa | 2,100 × 900 × 850 | Warm gray fabric |
| 2-Seater Sofa | 1,500 × 900 × 850 | Warm gray fabric |
| Armchair | 800 × 800 × 850 | Warm gray fabric |
| Coffee Table | 1,200 × 600 × 450 | Oak wood |
| TV Console | 1,800 × 400 × 500 | Walnut wood |
| TV (wall-mount) | 1,200 × 80 × 700 | Black |
| Bookshelf | 800 × 300 × 1,800 | Oak wood |
| Floor Lamp | 300 × 300 × 1,600 | Black metal + warm glow |
| Shoe Cabinet | 1,000 × 350 × 900 | White laminate |

#### C.2 — Kitchen / Dining

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| Dining Table (4-pax) | 1,200 × 800 × 750 | Oak wood |
| Dining Chair | 450 × 500 × 850 | Oak wood + gray seat |
| Kitchen Counter (L-shape) | 2,100 × 600 × 900 | White + wood top |
| Refrigerator | 700 × 700 × 1,700 | Silver |
| Washing Machine | 600 × 600 × 850 | White |
| Upper Cabinets (per unit) | 600 × 350 × 700 | White laminate |
| Lower Cabinets (per unit) | 600 × 600 × 850 | White laminate |
| Microwave | 500 × 400 × 300 | Black |
| Kitchen Sink (built-in) | 800 × 500 × 200 | Stainless steel |

#### C.3 — Main Bedroom

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| Queen Bed | 1,530 × 2,030 × 500 | White sheets + oak frame |
| King Bed | 1,830 × 2,030 × 500 | White sheets + oak frame |
| Wardrobe (2-door) | 1,200 × 600 × 2,100 | White laminate |
| Wardrobe (3-door) | 1,800 × 600 × 2,100 | White laminate |
| Bedside Table | 500 × 400 × 550 | Oak wood |
| Dresser/Vanity | 1,000 × 450 × 750 | White + mirror |
| Desk | 1,200 × 600 × 750 | Oak wood |
| Office Chair | 600 × 600 × 1,000 | Black mesh |

#### C.4 — Bedroom 2

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| Single Bed | 910 × 1,900 × 500 | White sheets + oak frame |
| Super Single Bed | 1,070 × 1,900 × 500 | White sheets + oak frame |
| Study Desk | 1,000 × 500 × 750 | White laminate |
| Wardrobe (2-door) | 1,000 × 550 × 2,100 | White laminate |
| Bookshelf (small) | 600 × 250 × 1,200 | Oak wood |
| Bedside Table | 400 × 350 × 500 | Oak wood |

#### C.5 — Bathroom (×2)

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| Toilet Bowl | 400 × 700 × 400 | White ceramic |
| Wash Basin (wall-mount) | 500 × 400 × 200 | White ceramic |
| Vanity Cabinet | 600 × 450 × 800 | White laminate |
| Shower Screen (glass) | 900 × 50 × 1,900 | Clear glass |
| Rain Shower Head | 250 × 250 × 100 | Chrome |
| Towel Rack | 600 × 100 × 50 | Chrome |
| Mirror | 600 × 50 × 800 | Frameless |

#### C.6 — Store Room

| Item | W × D × H (mm) | Color Default |
|---|---|---|
| Storage Rack | 900 × 450 × 1,800 | Gray metal |
| Vacuum Cleaner | 350 × 300 × 1,100 | Gray |
| Ironing Board (folded) | 400 × 150 × 1,200 | White metal |

---

### D. Material / Finish Swapper

Each room surface (floor + 4 walls) is independently editable.

#### D.1 — Floor Materials

| Material | Texture Description | Hex Base |
|---|---|---|
| Polished Porcelain Tile (white) | 600×600 grid, subtle veining | #F0EDE8 |
| Polished Porcelain Tile (gray) | 600×600 grid, concrete look | #C8C3BC |
| Vinyl Plank (light oak) | 180×1200 plank, warm grain | #D4B896 |
| Vinyl Plank (walnut) | 180×1200 plank, dark grain | #7A5C42 |
| Engineered Wood (ash) | 150×900 plank, light straw | #E8DCCA |
| Engineered Wood (teak) | 150×900 plank, warm amber | #B5875A |
| Cement Screed | Smooth matte concrete | #B8B0A6 |
| Terrazzo | Aggregate chip pattern | #E2DAD0 |
| Mosaic Tile (bathroom) | 50×50 grid | #D6E4E0 |

#### D.2 — Wall Finishes

| Finish | Description | Hex Base |
|---|---|---|
| White Paint (flat) | Clean matte white | #FAFAFA |
| Warm White Paint | Slight cream undertone | #F5F0E8 |
| Light Gray Paint | Scandinavian cool gray | #E0DDD8 |
| Sage Green Paint | Earthy muted green | #B8C5B2 |
| Dusty Rose Paint | Subtle warm pink | #D4B5B0 |
| Charcoal Accent | Dark feature wall | #3A3A3A |
| Exposed Brick | Red-brown brick pattern | #A0603A |
| Wood Paneling | Vertical slat pattern | #C9A87C |
| Concrete | Raw concrete texture | #ACA79E |
| Subway Tile (kitchen/bath) | White 75×150 brick-lay | #FFFFFF |

#### D.3 — Ceiling Options

| Option | Description |
|---|---|
| Flat White | Standard HDB flat ceiling |
| Cove Lighting | Recessed LED strip perimeter (~100mm recess) |
| False Ceiling (partial) | Dropped 200mm in a selected zone |

---

### E. UI Layout

#### E.1 — Overall Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR (logo, project name, undo/redo, save, export)   │
├────────────┬────────────────────────────────────┬───────────┤
│            │                                    │           │
│  LEFT      │                                    │  RIGHT    │
│  PANEL     │         3D VIEWPORT                │  PANEL    │
│            │         (Three.js Canvas)           │           │
│  • Room    │                                    │  • Object │
│    List    │                                    │    Props  │
│  • Camera  │                                    │  • Material│
│    Modes   │                                    │    Swap   │
│  • Layers  │                                    │  • Color  │
│            │                                    │    Picker │
│            │                                    │           │
├────────────┴────────────────────────────────────┴───────────┤
│  BOTTOM TRAY: Furniture library (scrollable, categorized)    │
└─────────────────────────────────────────────────────────────┘
```

#### E.2 — Left Panel Contents

1. **Room List**: Clickable room names → camera focuses on room
   - Kitchen/Dining
   - Living Room
   - Main Bedroom
   - Bedroom 2
   - Bath/WC 1
   - Bath/WC 2
   - Store Room
   - Access Balcony
2. **Camera Mode Toggle**: Orbit / Top-Down / First-Person / Room Focus
3. **Layer Toggles**: Walls on/off, Ceiling on/off, Furniture on/off, Dimensions on/off, Grid on/off
4. **Measurement Tool**: Click two points → display distance in mm

#### E.3 — Right Panel Contents (Context-Sensitive)

- **When nothing selected**: Overview stats (total area, room count)
- **When a room surface is selected**: Material swapper + color picker
- **When furniture is selected**: Position (x, y, z), rotation (°), dimensions readout, duplicate, delete, color/material swap

#### E.4 — Bottom Tray

- Horizontal scrollable strip with furniture thumbnails grouped by category tabs (Living, Kitchen/Dining, Bedroom, Bathroom, Storage)
- Drag from tray → drop into 3D viewport
- Search/filter bar

#### E.5 — Header Bar Actions

| Action | Icon | Function |
|---|---|---|
| Undo | ↩ | Undo last action (Ctrl+Z) |
| Redo | ↪ | Redo (Ctrl+Shift+Z) |
| Save | 💾 | Save layout to local storage / export JSON |
| Export PNG | 📸 | Screenshot current viewport at 2× resolution |
| Export PDF | 📄 | Generate annotated 2D floor plan with furniture placement |
| Share | 🔗 | Generate shareable link / embed code |
| Reset | 🗑 | Clear all furniture, reset materials |

---

### F. Interaction System

#### F.1 — Furniture Placement

1. **Drag & Drop**: Drag from bottom tray onto the 3D floor plane. Object snaps to floor level of the room it's dropped into (handling the 100mm bathroom drop).
2. **Move**: Click + drag on floor plane. Constrain to X/Z axes with Shift held.
3. **Rotate**: R key or rotation handle (circular gizmo around Y-axis). Snap to 15° increments by default; free rotation with Alt held.
4. **Scale**: Not free-scale (furniture is real-world sized), but allow switching between size variants (e.g., queen bed ↔ king bed).
5. **Snap-to-Wall**: Furniture auto-aligns when dragged near a wall (within 50mm).
6. **Collision Warning**: Red highlight if furniture overlaps another object or exceeds room boundary.
7. **Delete**: Select + Delete key, or right-click context menu.
8. **Duplicate**: Ctrl+D or context menu.

#### F.2 — Material Application

1. Click any wall face or floor zone → right panel shows material options.
2. Select material → live preview updates instantly.
3. Paint bucket mode: Click a material, then click surfaces to apply rapidly.

#### F.3 — Measurement & Dimensions

1. **Auto Dimensions**: Room dimensions displayed as floating labels (toggleable).
2. **Manual Measure**: Click two points → dashed line + mm readout.
3. **Furniture Clearance**: When moving furniture, show distance to nearest wall/object.

---

### G. Data Schema (JSON State)

```json
{
  "project": {
    "name": "My HDB 3-Room Reno",
    "unitType": "HDB 3-Room Simplified (Corridor)",
    "era": "1984-1988",
    "totalArea_sqm": 64,
    "created": "2026-03-14T00:00:00Z"
  },
  "rooms": [
    {
      "id": "kitchen-dining",
      "label": "Kitchen / Dining",
      "vertices": [[0, 0], [2100, 0], [2100, 5800], [0, 5800]],
      "floorMaterial": "vinyl-plank-light-oak",
      "wallMaterials": {
        "north": "subway-tile",
        "east": "warm-white-paint",
        "south": "warm-white-paint",
        "west": "warm-white-paint"
      },
      "ceilingOption": "cove-lighting",
      "floorDrop_mm": 0
    }
    // ... repeat for each room
  ],
  "furniture": [
    {
      "id": "sofa-01",
      "type": "3-seater-sofa",
      "room": "living-room",
      "position": { "x": 1200, "y": 0, "z": 3500 },
      "rotation": 0,
      "material": "warm-gray-fabric"
    }
    // ... repeat for placed items
  ],
  "doors": [
    {
      "id": "door-main-entry",
      "position": { "x": 500, "z": 11000 },
      "width": 900,
      "swingDirection": "inward",
      "isOpen": false,
      "openAngle": 0
    }
    // ... repeat for each door
  ]
}
```

---

## Behavior

### State Management

- All furniture placements, material changes, and camera states are tracked in a single store (Zustand or Redux).
- Every mutation pushes to an undo/redo stack (max 50 entries).
- Auto-save to `localStorage` every 30 seconds.
- On load, check for saved state and offer "Resume previous session?" prompt.

### Performance

- Use instanced meshes for repeated geometry (e.g., multiple chairs).
- Implement frustum culling and LOD for furniture objects.
- Target 60fps on mid-range hardware. Degrade gracefully: disable shadows first, then reduce light count.
- Lazy-load furniture models only when that category tab is opened.

### Responsiveness

- **Desktop** (≥1024px): Full 3-panel layout as described.
- **Tablet** (768–1023px): Collapse left panel into hamburger menu. Right panel becomes slide-over.
- **Mobile** (< 768px): Full-screen viewport with floating action buttons. Bottom tray becomes a modal sheet. Pinch-to-zoom for orbit.

### Accessibility

- All interactive elements keyboard-navigable (Tab, Enter, Escape).
- ARIA labels on furniture items and room zones.
- High-contrast mode toggle for dimension labels.
- Screen reader announces room name when camera focuses.

---

## Constraints

1. **Framework**: React 18+ with React Three Fiber (@react-three/fiber) and Drei (@react-three/drei) for 3D. Zustand for state. Tailwind CSS for UI panels.
2. **No external 3D model files**: All furniture and architecture must be built from Three.js primitives (BoxGeometry, CylinderGeometry, ExtrudeGeometry, etc.) — keep it stylized and clean, not photorealistic.
3. **Accuracy**: Floor plan dimensions must be within ±50mm of the values specified. Room proportions are critical for real renovation planning.
4. **Units**: Internal coordinate system in millimeters. Display to user in mm with an option to toggle to feet/inches.
5. **Color System**: Use CSS custom properties for all UI colors. Support light and dark mode.
6. **File Size**: Total bundle under 2MB. No heavy texture files — use procedural textures or CSS patterns.
7. **Browser Support**: Chrome, Safari, Firefox (latest 2 versions). WebGL 2.0 required.
8. **Export Formats**: JSON (full state), PNG (viewport screenshot), SVG (2D floor plan with furniture footprints).

---

## Aesthetic Direction

### Visual Style: "Warm Scandinavian Architect Studio"

- **Palette**: Warm whites (#FAF8F5), soft taupes (#D5CEC5), muted oak (#C9A87C), charcoal accents (#2D2D2D), and a single pop of terracotta (#C2694F) for interactive highlights and selected states.
- **Typography**:
  - Headers: `"Instrument Serif"` (Google Fonts) — editorial, refined
  - Body/UI: `"DM Sans"` — clean, modern, excellent readability
  - Measurements/Data: `"JetBrains Mono"` — monospace for alignment
- **UI Panels**: Frosted glass effect (`backdrop-filter: blur(12px)`) with warm-tinted translucency. Subtle 1px borders in `rgba(0,0,0,0.06)`.
- **3D Scene Background**: Warm off-white (#F5F2EE) with subtle gradient toward horizon. No harsh grid — use a faint dotted grid that fades at edges.
- **Furniture Style**: Minimal geometric forms with slightly rounded edges (bevel = 2mm). Soft shadows. Matte materials with subtle ambient occlusion.
- **Selection Highlight**: Terracotta (#C2694F) outline with soft glow. Transform handles in the same accent.
- **Transitions**: All panel slides and camera movements eased with `cubic-bezier(0.25, 0.1, 0.25, 1.0)`, duration 400ms.
- **Hover States**: Furniture items in the tray lift slightly (translateY -2px) with a warm shadow bloom on hover.
- **Empty State**: When no furniture is placed, show a gentle pulsing "Drag furniture here to start planning" message in the center of each room, in a handwritten-style font at low opacity.

---

## Implementation Notes

### Phase 1 — Architecture Shell
Build the floor plan walls, floors, doors, and windows as a static 3D scene. Verify all room dimensions match the spec. Implement orbit camera.

### Phase 2 — Camera System
Add all four camera modes. Implement smooth transitions between modes. Room focus click targets.

### Phase 3 — Furniture System
Build the object library with primitive meshes. Implement drag-and-drop, move, rotate. Collision detection. Snap-to-wall.

### Phase 4 — Material System
Implement per-surface material swapping. Build the right panel UI. Procedural texture generation for wood grain, tile grids, concrete.

### Phase 5 — UI Chrome & Polish
Header bar, left panel, bottom tray. Undo/redo. Save/load. Export functions. Responsive breakpoints.

### Phase 6 — Lighting & Atmosphere
Fine-tune lighting. Add shadow maps. Window daylight simulation. Toggle room lights.

---

## Reference

- Original floor plan: `HDB-1984-1988-3S-corridor-64sqm.png`
- This is a **corridor-type** unit (access balcony on one side), not a point-block
- Plumbing stacks are on the north wall (bathroom/kitchen zone) — these columns cannot be moved in renovation
- The structural walls between the living room and bedrooms are typically load-bearing — flag these as "non-removable" in the planner with a different wall color or icon

---

*End of prompt.*
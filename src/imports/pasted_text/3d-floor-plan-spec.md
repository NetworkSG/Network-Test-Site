# 3D Floor Plan Editor — Feature Revamp Specification

> **Reference:** [Planner5D](https://planner5d.com/) editor functionality
> **Scope:** 3D Editor only — Dashboard excluded (already built)
> **Last Updated:** March 15, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Editor Layout & UI Structure](#2-editor-layout--ui-structure)
3. [View Modes](#3-view-modes)
4. [Building Tools — Structural](#4-building-tools--structural)
5. [Object Catalog & Library](#5-object-catalog--library)
6. [Object Interaction & Manipulation](#6-object-interaction--manipulation)
7. [Material, Texture & Color System](#7-material-texture--color-system)
8. [Properties Panel](#8-properties-panel)
9. [Floor / Level Management](#9-floor--level-management)
10. [Camera & Navigation Controls](#10-camera--navigation-controls)
11. [Measurement & Grid System](#11-measurement--grid-system)
12. [Rendering & Export](#12-rendering--export)
13. [AI-Powered Features](#13-ai-powered-features)
14. [Project Management (In-Editor)](#14-project-management-in-editor)
15. [Keyboard Shortcuts & Accessibility](#15-keyboard-shortcuts--accessibility)
16. [Performance & Technical Considerations](#16-performance--technical-considerations)
17. [Appendix — Feature Priority Matrix](#17-appendix--feature-priority-matrix)

---

## 1. Overview

The goal is to revamp the existing 3D Floor Plan Editor to match the feature set and interaction quality of Planner5D's editor — an intuitive, web-based 2D/3D hybrid design tool where users can draw floor plans, furnish rooms, apply materials, and preview designs in real-time 3D. The editor should feel responsive, visually polished, and accessible to non-technical users while retaining enough depth for professionals.

### Core Design Principles

- **Dual-mode editing:** 2D plan view for precision layout work, 3D perspective view for spatial visualization — seamlessly switchable at any time.
- **Drag-and-drop first:** All object placement, furniture arrangement, and material application should be drag-and-drop.
- **Real-time sync:** Any change in 2D should be instantly reflected in 3D and vice versa.
- **Non-destructive workflow:** Undo/redo history, auto-save, and version snapshots.
- **Progressive disclosure:** Simple tools surface first; advanced controls reveal on selection or hover.

---

## 2. Editor Layout & UI Structure

### 2.1 Top Toolbar (Header Bar)

| Element | Description |
|---|---|
| **Project Name** | Editable inline title — click to rename |
| **Undo / Redo** | Buttons with keyboard shortcut support (`Ctrl+Z` / `Ctrl+Shift+Z`) |
| **Floor Selector** | Dropdown or stepper to switch between floors (Ground, 1st, 2nd, etc.) |
| **View Mode Toggle** | 2D ↔ 3D switch button (prominent, center-ish placement) |
| **Properties Toggle** | Show/hide the right-side properties panel |
| **Render Button** | Camera icon — opens render/screenshot dialog |
| **Save Status** | Auto-save indicator (e.g., "All changes saved" / spinner) |
| **More Options** | Overflow menu: Share, Export, Print, Settings, Help |

### 2.2 Left Sidebar — Tool & Catalog Panel

A vertical sidebar containing categorized tools and catalog items, organized into collapsible sections:

- **Build Tools** — Walls, Rooms, Doors, Windows, Stairs, Columns, Openings
- **Furniture** — Living Room, Bedroom, Kitchen, Bathroom, Dining, Office, Outdoor
- **Decor & Accessories** — Rugs, Art, Plants, Lighting, Curtains, Mirrors, Shelving
- **Appliances** — Kitchen appliances, Laundry, HVAC, Electronics
- **Outdoor / Landscape** — Trees, Plants, Fencing, Pools, Driveways, Pavers, Lighting
- **Textures & Materials** — Quick-access to material browser (walls, floors, ceilings)
- **Recently Used** — Auto-populated list of last ~20 items placed
- **Favorites** — User-bookmarked items for quick access

Each catalog category displays items as thumbnail cards in a scrollable grid. Clicking an item selects it for placement; dragging drops it directly onto the canvas.

**Search Bar** — At the top of the sidebar, a search input filters across all catalog categories with real-time results.

### 2.3 Canvas (Center)

The main working area where the floor plan is drawn and objects are placed. Behavior changes based on view mode (2D or 3D). Should occupy maximum available screen space.

### 2.4 Right Sidebar — Properties Panel

Context-sensitive panel that appears when an object, wall, room, or material is selected. Shows editable properties for the current selection. Collapses when nothing is selected.

### 2.5 Bottom Bar (Optional / Minimal)

- Zoom controls (slider + zoom-to-fit button)
- Grid toggle (show/hide grid)
- Snap toggle (snap to grid / snap to object)
- Unit selector (meters / feet-inches)
- Minimap (small overview of the full plan when zoomed in)

---

## 3. View Modes

### 3.1 2D Mode (Plan View)

- Top-down orthographic view of the floor plan.
- Walls displayed as thick lines with dimension labels auto-shown on hover or always-on (user preference).
- Doors and windows render as standard architectural symbols (arc for door swing, parallel lines for windows).
- Furniture and objects shown as 2D footprint outlines with icons.
- Grid visible in background (toggleable).
- This is the primary mode for structural editing: drawing walls, resizing rooms, placing doors/windows.

### 3.2 3D Mode (Perspective View)

- Real-time 3D perspective of the designed space.
- Full material rendering: textures on walls, floors, ceilings; 3D furniture models visible.
- Orbit, pan, and zoom camera controls (mouse + touch).
- Objects can be selected, moved, rotated, and deleted in 3D.
- Walls can be toggled transparent or hidden for interior visibility.
- Lighting preview: ambient + directional light with time-of-day option.

### 3.3 Switching Between Modes

- Single-click toggle button in the top toolbar.
- Transition should be animated (smooth camera rotation from top-down to perspective).
- Editor state, selections, and tool context persist across switches.
- Keyboard shortcut: `Tab` or `V` to toggle.

### 3.4 First-Person Walkthrough Mode (Optional / Pro Feature)

- Activated from 3D mode via a "Walk" button.
- WASD + mouse-look navigation at eye-level height (~1.6m).
- Collision detection with walls.
- Exit via `Esc` or a floating "Back to Editor" button.

---

## 4. Building Tools — Structural

### 4.1 Wall Drawing

- **Draw Mode:** Click-to-start, click-to-place corner, double-click or `Esc` to finish.
- Walls auto-align to 90° and 45° angles (with override for freeform via holding `Shift`).
- Wall thickness is configurable (default ~15cm / 6in).
- Walls snap to existing wall endpoints and intersections.
- Dimension labels appear in real time while drawing.
- Walls auto-join at intersections (T-junctions, corners).

### 4.2 Room Presets

- Quick-add predefined room shapes: Rectangle, L-Shape, T-Shape, U-Shape.
- Click to place, then drag corners to resize.
- Each preset auto-names based on type (e.g., "Bedroom 1", "Kitchen") — editable.

### 4.3 Wall Editing

- Select a wall → drag to move the entire wall segment.
- Drag wall endpoints to resize.
- Split a wall by clicking a point along it.
- Delete a wall segment independently.
- Wall height adjustable per segment (default 2.7m / 9ft, configurable).

### 4.4 Doors

- Catalog of door types: Single, Double, Sliding, Pocket, French, Folding, Garage.
- Drag onto a wall → door auto-snaps and cuts an opening.
- Door properties: width, height, swing direction (left/right), open angle (for 3D preview).
- In 2D, doors render as standard architectural symbols (arc showing swing).

### 4.5 Windows

- Catalog of window types: Single-hung, Double-hung, Casement, Sliding, Bay, Picture, Skylight.
- Drag onto a wall → auto-snaps and positions at default sill height.
- Window properties: width, height, sill height from floor, number of panes.
- In 2D, windows render as parallel lines within the wall.

### 4.6 Openings / Arches

- Create wall openings without a door or window (passthrough).
- Configurable width, height, and arch shape (square, rounded, pointed).

### 4.7 Stairs

- Stair types: Straight, L-shaped, U-shaped, Spiral.
- Auto-calculates step count based on floor-to-floor height.
- Links between floors for multi-level plans.
- Properties: width, tread depth, railing style (left/right/both/none).

### 4.8 Columns & Beams

- Freestanding structural columns (round, square cross-section).
- Adjustable diameter/width and height.
- Beams that span between walls or columns (visible in 3D).

### 4.9 Roof (3D Only)

- Auto-generated roof based on room perimeter.
- Roof types: Flat, Gable, Hip, Shed, Mansard.
- Adjustable pitch angle and overhang.
- Material/texture application for exterior rendering.

---

## 5. Object Catalog & Library

### 5.1 Catalog Structure

The catalog is a hierarchical, browsable, and searchable library of 3D objects organized by room type and function.

**Top-Level Categories:**

| Category | Example Sub-Categories |
|---|---|
| Living Room | Sofas, Coffee Tables, TV Units, Bookshelves, Armchairs |
| Bedroom | Beds, Nightstands, Wardrobes, Dressers, Vanities |
| Kitchen | Cabinets (Base, Wall, Island), Countertops, Sinks, Appliances |
| Bathroom | Toilets, Sinks, Bathtubs, Showers, Vanities, Mirrors |
| Dining | Tables, Chairs, Buffets, Bar Stools |
| Office | Desks, Office Chairs, Filing Cabinets, Printers |
| Kids / Nursery | Cribs, Bunk Beds, Toy Storage, Play Tables |
| Outdoor | Patio Furniture, Grills, Pools, Planters, Fencing |
| Lighting | Ceiling, Floor Lamps, Table Lamps, Sconces, Pendant Lights |
| Decor | Rugs, Art, Mirrors, Vases, Clocks, Cushions |
| Plants | Indoor, Outdoor, Trees, Hedges, Flower Beds |
| Appliances | Refrigerators, Washers, Dryers, Ovens, Dishwashers |

### 5.2 Item Card Display

Each item in the catalog grid shows:
- 3D-rendered thumbnail (light gray background)
- Item name
- Lock icon if premium-only
- Favorite (heart) toggle

### 5.3 Search & Filtering

- **Keyword search** across all categories
- **Filters:** Category, Style (Modern, Classic, Minimalist, Industrial, etc.), Color, Size range, Free vs Premium
- **Sort:** Popularity, Newest, Alphabetical

### 5.4 Custom 3D Model Import (Pro Feature)

- Upload `.obj`, `.fbx`, `.blend`, `.stl`, `.glb`, `.gltf` files.
- Import wizard: set scale, orientation, assign material zones.
- Imported models saved to a "My Uploads" catalog section.
- Applies to the user's account across all projects.

---

## 6. Object Interaction & Manipulation

### 6.1 Placement

- **Drag from catalog** onto the canvas to place.
- **Click catalog item** → click on canvas to drop.
- Objects auto-snap to floor level.
- Furniture items that logically attach to walls (e.g., wall-mounted shelves, sconces) auto-snap to the nearest wall when placed close.

### 6.2 Selection

- Click to select an object.
- Selected object shows a bounding box with control handles.
- Multi-select via `Shift+Click` or marquee drag (2D mode).

### 6.3 Transform Controls (2D & 3D)

| Action | 2D Behavior | 3D Behavior |
|---|---|---|
| **Move** | Drag to reposition on the floor plane | Drag to reposition; constrained to floor plane by default |
| **Rotate** | Rotate handle at corner of bounding box; snaps to 15° increments (hold `Shift` for free rotate) | Same, with visual rotation gizmo |
| **Resize** | Drag edge handles; maintains aspect ratio by default (hold `Alt` to free resize) | Same |
| **Elevate** | N/A | Drag vertical arrow handle to lift object off the floor (for wall-mounted items) |
| **Duplicate** | `Ctrl+D` or right-click → Duplicate | Same |
| **Delete** | `Delete` key or right-click → Delete | Same |
| **Lock** | Right-click → Lock Position (prevents accidental moves) | Same |
| **Flip** | Right-click → Flip Horizontal / Vertical | Same |

### 6.4 Snap Behavior

- **Grid Snap:** Objects snap to grid intersections (toggleable).
- **Wall Snap:** Objects near walls align flush to the wall surface.
- **Object Snap:** Objects align to edges/centers of adjacent objects (smart guides).
- **Rotation Snap:** Default 15° increments; hold `Shift` for 1° precision.

### 6.5 Right-Click Context Menu

- Move to Front / Send to Back (layering in 2D)
- Duplicate
- Delete
- Lock / Unlock
- Flip Horizontal / Vertical
- Replace with Similar Item
- Copy Style (material/color)
- Paste Style

---

## 7. Material, Texture & Color System

### 7.1 Applicability

Materials can be applied to:
- **Walls** — inner face, outer face (independently)
- **Floors** — per room
- **Ceilings** — per room
- **Furniture surfaces** — base material, cushion fabric, frame material, etc.
- **Countertops** — kitchen and bathroom surfaces
- **Doors & Windows** — frame material, glass type

### 7.2 Material Browser

A dedicated panel (accessible from the left sidebar or from the properties panel when a surface is selected):

**Categories:**
- Paint / Solid Colors — color picker + preset swatches
- Wallpaper — patterned, textured, geometric, floral
- Wood — hardwood, laminate, plywood, reclaimed
- Stone — marble, granite, slate, travertine, concrete
- Tile — ceramic, porcelain, mosaic, subway, hexagonal
- Brick — standard, whitewash, exposed
- Metal — brushed steel, copper, brass, matte black
- Fabric — linen, velvet, leather, cotton, wool
- Glass — clear, frosted, tinted, textured

### 7.3 Material Application

- **Click to apply:** Select a material → click a surface in the editor.
- **Drag to apply:** Drag a material swatch from the browser directly onto a surface.
- **Copy/Paste material:** Right-click a surface → Copy Material → click target surface → Paste Material.

### 7.4 Material Properties (Editable)

| Property | Description |
|---|---|
| Color / Tint | HSL color adjustment overlay |
| Texture Scale | Repeat size (e.g., tile size in cm) |
| Texture Rotation | Rotate pattern angle (0°, 45°, 90°, custom) |
| Glossiness / Roughness | Matte to high-gloss slider |
| Opacity | For glass or translucent materials |

### 7.5 Custom Texture Upload (Pro Feature)

- Upload an image (`.jpg`, `.png`) as a custom repeating texture.
- Set tile size and rotation.
- Saved to "My Textures" library.

---

## 8. Properties Panel

The right-side contextual panel displays editable properties for the currently selected element. Content changes dynamically based on selection type.

### 8.1 Wall Selected

- Wall length (editable, with live canvas update)
- Wall height
- Wall thickness
- Inner material / Outer material (click to open material browser)
- Delete wall

### 8.2 Room Selected (click inside a room area)

- Room name (editable label, e.g., "Master Bedroom")
- Room dimensions (auto-calculated — width × depth)
- Floor area (auto-calculated, displayed in m² or ft²)
- Floor material
- Ceiling material
- Ceiling height

### 8.3 Door / Window Selected

- Type (dropdown to swap between types)
- Width, Height
- Sill height (windows only)
- Swing direction / Slide direction
- Open angle (slider, for 3D preview: 0° closed → 90° open)
- Frame material
- Glass type (windows)

### 8.4 Furniture / Object Selected

- Item name
- Dimensions: Width (W) × Depth (D) × Height (H) — editable with aspect-ratio lock toggle
- Position: X, Y coordinates on the floor plane
- Rotation: angle in degrees
- Elevation: height off floor (for wall-mounted items)
- Material zones (if applicable): list of surfaces with material swatches, each clickable to change
- Replace button → opens catalog filtered to similar items
- Duplicate / Delete buttons

### 8.5 Nothing Selected

- Room list summary: clickable list of all rooms with name + area
- Project stats: total floor area, room count, object count
- Quick actions: Add Room, Add Floor

---

## 9. Floor / Level Management

### 9.1 Multi-Floor Support

- Add up to 5+ floors (Ground + upper floors + basement/underground).
- Each floor is an independent plan layer with its own walls, rooms, objects.
- Floor-to-floor height configurable per level (default 2.7m / 9ft).

### 9.2 Floor Selector UI

- Located in the top toolbar.
- Dropdown or vertical stepper showing all floors.
- Active floor is highlighted; other floors shown as dimmed.
- "+ Add Floor" button at bottom of the list.

### 9.3 Cross-Floor Features

- Stairs automatically connect between the active floor and the floor above/below.
- In 3D mode, option to view "All Floors" as a stacked cutaway or exploded view.
- In 2D mode, the floor below is shown as a faint ghost overlay (toggleable) for alignment reference.

### 9.4 Floor Actions

- Duplicate Floor (copies the layout as a starting point for the next level).
- Delete Floor (with confirmation dialog).
- Reorder Floors (drag to rearrange in the floor list).

---

## 10. Camera & Navigation Controls

### 10.1 2D Navigation

| Action | Input |
|---|---|
| Pan | Middle mouse drag / Two-finger drag (trackpad) / Hold `Space` + left-click drag |
| Zoom | Scroll wheel / Pinch (trackpad) / Zoom slider in bottom bar |
| Zoom to Fit | Double-click the zoom-to-fit icon (fits entire plan in view) |
| Center on Selection | Press `F` with an object selected |

### 10.2 3D Navigation

| Action | Input |
|---|---|
| Orbit | Left-click drag on empty space / One-finger drag (touch) |
| Pan | Middle mouse drag / Two-finger drag (touch) |
| Zoom | Scroll wheel / Pinch (touch) |
| Reset Camera | Home key or button |
| Zoom to Selection | Press `F` with an object selected |

### 10.3 Camera Presets (3D Mode)

- **Top-Down** — orthographic bird's-eye view (essentially 2D mode but rendered in 3D)
- **Front / Back / Left / Right** — elevation views
- **Corner Perspectives** — preset isometric angles
- **Room Focus** — click a room name to fly the camera into that room at eye level

### 10.4 Section / Cutaway View

- Toggle to slice the model horizontally at a user-defined height.
- Useful for viewing interior layouts of multi-story buildings in 3D.
- Adjustable cut plane height slider.

---

## 11. Measurement & Grid System

### 11.1 Grid

- Background grid visible in 2D mode.
- Grid spacing configurable: 10cm, 25cm, 50cm, 1m (metric) or 6in, 1ft (imperial).
- Minor grid lines (lighter) and major grid lines (bolder) for visual hierarchy.
- Grid toggleable via bottom toolbar or `G` shortcut.

### 11.2 Snap-to-Grid

- When enabled, all object placement and wall drawing snaps to grid intersections.
- Toggle via bottom toolbar or `S` shortcut.
- Smart snap can be enabled alongside grid snap: objects also snap to wall surfaces, object edges, and room centers.

### 11.3 Dimension Labels

- Auto-displayed on walls while drawing and while hovering in 2D.
- Show wall length, room width × depth.
- Editable: click a dimension label to type a precise value.
- Option for "Always Show Dimensions" (toggle in settings).

### 11.4 Measurement Tool (Ruler)

- Dedicated ruler tool in the toolbar.
- Click two points to see the distance between them.
- Measurement label persists until dismissed or tool is deselected.
- Supports straight-line and multi-point (polyline) measurement.

### 11.5 Unit System

- Toggle between Metric (meters, centimeters) and Imperial (feet, inches).
- Selector in bottom toolbar or editor settings.
- All dimension labels, property inputs, and grid spacing update accordingly.

---

## 12. Rendering & Export

### 12.1 Screenshot / Quick Capture

- Capture the current canvas view as a `.png` image.
- Available in both 2D and 3D modes.
- No render processing — instant capture of the viewport.

### 12.2 High-Quality Render

- Triggered via the camera/render icon in the top toolbar.
- Render dialog options:
  - **Resolution:** HD (1280×720), Full HD (1920×1080), Quad HD (2560×1440), 4K (3840×2160)
  - **Aspect Ratio:** 16:9, 4:3, 1:1, Custom
  - **Lighting Preset:** Daylight, Sunset, Night, Studio
  - **Camera Position:** Current view or pick from saved angles
- Render processes asynchronously; notification when complete.
- Output saved to a "Renders" gallery accessible from the project.

### 12.3 360° Panorama (Pro Feature)

- Generate a spherical panorama from a chosen viewpoint inside the space.
- Viewable in-browser as a draggable 360° image.
- Shareable via link.

### 12.4 Video Walkthrough (Pro Feature)

- Define a camera path through the space (set keyframe positions).
- System generates a fly-through video (`.mp4`).
- Configurable duration, resolution, and transition smoothness.

### 12.5 2D Floor Plan Export

- Export the 2D plan view as:
  - **PDF** — with dimensions, room labels, and legend
  - **PNG / SVG** — for digital use
  - **DWG / DXF** — for AutoCAD / professional CAD interoperability

### 12.6 Project Export

- Export the entire project (all floors) as a downloadable package.
- Includes: floor plans, 3D model (`.glb` / `.obj`), renders, material list.
- Optional: "Shopping List" export — itemized list of all placed objects with names and quantities.

---

## 13. AI-Powered Features

### 13.1 AI Floor Plan Recognition

- Upload a photo or scan of an existing floor plan (hand-drawn or architectural).
- AI detects walls, rooms, doors, and windows and converts them into editable vector elements in the 2D editor.
- User reviews and corrects before finalizing.

### 13.2 AI Auto-Furnish / Smart Wizard

- Select one or more empty rooms.
- Choose a style preference (Modern, Classic, Minimalist, Scandinavian, etc.).
- AI auto-populates the room with contextually appropriate furniture.
- User can accept, modify, or reject individual placements.
- Option to regenerate with different parameters.

### 13.3 AI Design Generator

- Provide a text prompt (e.g., "Modern open-concept living room with warm tones") or upload an inspiration image.
- AI generates a furnished room layout matching the prompt.
- Result is fully editable — all objects are individually selectable and replaceable.

### 13.4 AI Material Suggestion

- Select a room → "Suggest Materials" button.
- AI recommends coordinated floor, wall, and ceiling material combinations based on the selected furniture style.
- Presents 3–5 palette options to choose from.

---

## 14. Project Management (In-Editor)

### 14.1 Auto-Save

- Project auto-saves every 30 seconds of activity (configurable).
- Save status indicator in the top toolbar.
- Manual save available via `Ctrl+S`.

### 14.2 Undo / Redo

- Full undo/redo stack with at least 50 levels.
- Covers all actions: object placement, moves, deletions, material changes, wall edits.
- `Ctrl+Z` / `Ctrl+Shift+Z` shortcuts.

### 14.3 Version History (Pro Feature)

- Automatic version snapshots at regular intervals.
- Manual "Save Version" with optional label.
- Restore any previous version from a timeline view.

### 14.4 Collaboration & Sharing

- **Share link:** Generate a read-only viewer link for the project.
- **Embed code:** Iframe snippet for embedding the 3D view on a website.
- **Collaborate (Pro):** Invite others to co-edit in real time with cursor presence.

---

## 15. Keyboard Shortcuts & Accessibility

### 15.1 Essential Shortcuts

| Shortcut | Action |
|---|---|
| `Tab` or `V` | Toggle 2D / 3D view |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save |
| `Ctrl+D` | Duplicate selected |
| `Delete` / `Backspace` | Delete selected |
| `Esc` | Deselect / Cancel current tool |
| `G` | Toggle grid |
| `S` | Toggle snap |
| `F` | Zoom to selection |
| `R` | Activate rotate mode |
| `M` | Activate move mode |
| `W` | Activate wall draw tool |
| `Space + Drag` | Pan canvas (2D) |
| `1` | Switch to 2D mode |
| `2` | Switch to 3D mode |
| `Ctrl+A` | Select all objects |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste |
| Arrow Keys | Nudge selected object (grid-unit increments) |

### 15.2 Accessibility Considerations

- All interactive elements must be keyboard-navigable.
- ARIA labels on toolbar buttons and panel controls.
- High-contrast mode support (respects OS/browser preferences).
- Tooltips with descriptive text on hover for all icons.
- Screen reader support for properties panel (announce selected object type and key properties).
- Touch-friendly hit targets (minimum 44×44px) for mobile/tablet use.

---

## 16. Performance & Technical Considerations

### 16.1 Rendering Engine

- WebGL-based 3D rendering (Three.js, Babylon.js, or equivalent).
- Progressive level-of-detail (LOD) for large scenes — simplify distant objects.
- Frustum culling to avoid rendering off-screen geometry.
- Instanced rendering for repeated objects (e.g., multiple identical chairs).

### 16.2 Scene Limits & Guardrails

- Warn at >500 objects in a single project.
- Throttle 3D rendering quality on low-end devices (auto-detect GPU capabilities).
- Lazy-load catalog thumbnails and 3D models on demand.
- Texture atlas packing for materials to reduce draw calls.

### 16.3 State Management

- Editor state stored as a JSON structure (floor plan graph, object instances, material assignments).
- Serializable for save/load, undo/redo snapshots, and collaboration sync.
- Schema versioned for backward compatibility.

### 16.4 Responsive Layout

- Full desktop support (1280px+ viewport).
- Tablet support (768px+) with touch-optimized controls and collapsible sidebars.
- Mobile (below 768px): simplified toolbar, limited to 2D mode or 3D view-only.

### 16.5 Browser Compatibility

- Chrome, Edge, Firefox, Safari (latest 2 versions).
- WebGL 2.0 required; graceful fallback messaging for unsupported browsers.
- Offline mode: Service worker caching for catalog assets and last-opened project.

---

## 17. Appendix — Feature Priority Matrix

### Phase 1 — MVP (Core Editor)

| Feature | Priority |
|---|---|
| 2D/3D view toggle | P0 — Must Have |
| Wall drawing with snap & auto-join | P0 |
| Door and window placement (snap to wall) | P0 |
| Room detection & labeling | P0 |
| Basic furniture catalog (drag & drop) | P0 |
| Object move, rotate, resize, delete | P0 |
| Properties panel (dimensions, materials) | P0 |
| Material/color application to walls & floors | P0 |
| Grid, snap, and measurement labels | P0 |
| Undo/Redo | P0 |
| Auto-save | P0 |
| Quick screenshot capture | P0 |
| 2D export (PDF, PNG) | P0 |

### Phase 2 — Enhanced Editor

| Feature | Priority |
|---|---|
| Room presets (L-shape, T-shape, etc.) | P1 — Should Have |
| Stairs | P1 |
| Multi-floor support | P1 |
| Full material browser (wood, stone, tile, etc.) | P1 |
| Catalog search & filtering | P1 |
| Favorites & recently used | P1 |
| Keyboard shortcuts (full set) | P1 |
| Ruler / measurement tool | P1 |
| Right-click context menu | P1 |
| DWG / DXF export | P1 |
| Responsive tablet support | P1 |

### Phase 3 — Pro Features

| Feature | Priority |
|---|---|
| HD / 4K rendering | P2 — Nice to Have |
| 360° panorama | P2 |
| Video walkthrough | P2 |
| First-person walkthrough | P2 |
| Custom 3D model import (.obj, .fbx, .glb) | P2 |
| Custom texture upload | P2 |
| Version history | P2 |
| Collaboration / shared editing | P2 |
| Shopping list / bill of materials export | P2 |
| Section / cutaway view | P2 |
| Roof generation | P2 |
| Columns & beams | P2 |

### Phase 4 — AI Features

| Feature | Priority |
|---|---|
| AI floor plan recognition (image → plan) | P3 — Future |
| AI auto-furnish / Smart Wizard | P3 |
| AI design generator (text/image → layout) | P3 |
| AI material suggestion | P3 |

---

## Notes

- This spec covers **functionality only** — visual/UI design (colors, spacing, component styling) should be defined in a separate design system or Figma file.
- The Dashboard (project list, user account, billing) is **out of scope** — already built.
- Each phase should be validated with user testing before progressing to the next.
- Catalog item count will grow over time — start with ~200 free items and expand to 2,000+ with a premium tier.

---

*End of specification.*
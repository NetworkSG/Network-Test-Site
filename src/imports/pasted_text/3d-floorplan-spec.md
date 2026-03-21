# 3D Floor Plan — Next Steps Spec

> **Project:** Network Singapore Platform
> **Date:** March 15, 2026
> **Status:** Planning / Pre-Build

---

## Overview

This document outlines the next build phase for the **3D Floor Plan** feature across three areas:

1. **`/floorplan3d`** — Public landing page (Qanvast-inspired layout with signup gate)
2. **`/floorplan3d/dashboard`** — Authenticated user dashboard for managing 3D floor plan projects
3. **Admin Page** — New tab for uploading and managing DWG template files

---

## 1. Landing Page — `/floorplan3d`

### Reference

Structure modeled after [Qanvast BTO Layout Planner](https://qanvast.com/sg/bto-layout-planner), **without** the "Select your floor plan" section.

### Page Structure (Top → Bottom)

| Section | Description |
|---|---|
| **Hero** | Headline + subtext + "Start Free Project" CTA button. Background with organic/curved mask shapes à la Qanvast. |
| **How It Works** | 3-step visual walkthrough (icon + title + description per step). Steps: ① Upload or choose a floor plan → ② Customize layout in 3D → ③ Save & share with your ID. |
| **Value Props / Cross-Sell** | Cards linking to Renovation Calculator, Style Quiz, or other Network tools. |
| **Lead Capture Form** | Inline form (Name, Email, Contact Number, Key Collection Period) for users who want ID recommendations — **not** required to use the planner. |
| **FAQ Accordion** | Common questions about supported file types, saving projects, sharing, etc. |
| **Footer** | Standard Network footer. |

### Signup Modal (Gated on CTA)

When a user clicks **"Start Free Project"**, a modal appears instead of navigating away.

**Modal Fields:**

| Field | Type | Validation |
|---|---|---|
| Name | Text input | Required |
| Email | Email input | Required, valid email format |
| Contact Number | Tel input | Required |
| Password | Password input | Required, min 6 characters |
| Key Collection Period | Dropdown (`Keys Collected`, `Within 3 months`, `3–6 months`, `6–12 months`, `More than 12 months`) | Required |
| Get a shortlist of IDs | Checkbox (pre-checked, labeled `FREE`) | Optional |

**Modal Behavior:**

- "Have an account? **Login**" link at top toggles to a login form (Email + Password only).
- On successful signup → create user in DB → redirect to `/floorplan3d/dashboard`.
- On successful login → redirect to `/floorplan3d/dashboard`.
- Terms of Service and Privacy Policy links in footer text.
- Close (×) button returns user to the landing page.

---

## 2. User Dashboard — `/floorplan3d/dashboard`

### Access

Authenticated users only. Redirect to `/floorplan3d` (with login prompt) if unauthenticated.

### Layout

```
┌──────────────────────────────────────────────────┐
│  Header: "My 3D Floor Plans"         [+ New]     │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ Project │  │ Project │  │ Project │   ...     │
│  │ Thumb   │  │ Thumb   │  │ Thumb   │          │
│  │         │  │         │  │         │          │
│  │ Title   │  │ Title   │  │ Title   │          │
│  │ Date    │  │ Date    │  │ Date    │          │
│  └─────────┘  └─────────┘  └─────────┘          │
│                                                  │
│  Empty State:                                    │
│  "You haven't created any floor plans yet."      │
│  [Upload Floor Plan]  [Use a Template]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---|---|
| **Project Cards** | Grid of recent 3D floor plan projects. Each card shows: thumbnail preview, project title (editable), last modified date, and a ⋯ menu (Rename, Duplicate, Delete). |
| **[+ New] Button** | Opens a choice modal: **"Upload Your Floor Plan"** or **"Use a Template"**. |
| **Upload Floor Plan** | File picker accepting `.dwg`, `.pdf`, `.png`, `.jpg` (max **5 MB**). Uploads to `user-floor-plans` bucket → triggers DWG conversion (if applicable) → creates new project entry in DB → opens the 3D editor. |
| **Use a Template** | Displays a grid/list of admin-uploaded DWG templates (pulled from the template library in the DB). User selects one → creates a new project from that template → opens the 3D editor. |
| **Sorting / Filtering** | Sort by: Last Modified (default), Name A–Z, Date Created. Optional search bar for users with many projects. |
| **Pagination / Infinite Scroll** | Load projects in batches (e.g., 12 per page). |

### Data Model — User Projects

```
floor_plan_projects
├── id              (UUID, PK)
├── user_id         (FK → users)
├── title           (string, default: "Untitled Floor Plan")
├── thumbnail_url   (string, nullable)
├── source_type     (enum: 'upload' | 'template')
├── source_file_id  (FK → uploaded file or template ID)
├── project_data    (JSONB — stores 3D editor state)
├── created_at      (timestamp)
└── updated_at      (timestamp)
```

---

## 3. Admin Page — DWG Template Management Tab

### Location

New tab within the existing Admin Page: **"Floor Plan Templates"**

### Layout

```
┌──────────────────────────────────────────────────┐
│  Admin > Floor Plan Templates                    │
│                                                  │
│  [+ Upload Template]                             │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Template Name  │ File    │ Date    │ Actions│  │
│  ├────────────────┼─────────┼─────────┼────────┤  │
│  │ 4-Room BTO     │ .dwg    │ Mar 15  │ ✏️ 🗑️  │  │
│  │ 5-Room Resale  │ .dwg    │ Mar 10  │ ✏️ 🗑️  │  │
│  │ 3-Room Condo   │ .dwg    │ Feb 28  │ ✏️ 🗑️  │  │
│  └────────────────┴─────────┴─────────┴────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Upload Flow

1. Admin clicks **[+ Upload Template]**.
2. Modal opens with fields:

| Field | Type | Validation |
|---|---|---|
| Template Name | Text input | Required |
| Category | Dropdown (`BTO`, `Resale HDB`, `Condo`, `Landed`, `Commercial`) | Required |
| Unit Type | Dropdown (`2-Room`, `3-Room`, `4-Room`, `5-Room`, `Executive`, `Penthouse`, `Other`) | Required |
| DWG File | File upload (`.dwg` only) | Required, max 50MB |
| Thumbnail | Image upload (`.png`, `.jpg`) | Optional — auto-generate if not provided |
| Description | Textarea | Optional |

3. On submit → upload DWG to Supabase Storage bucket `floor-plan-templates/` → trigger server-side DWG conversion → insert record into DB.

### Admin Actions

| Action | Description |
|---|---|
| **Edit (✏️)** | Update template name, category, unit type, description, or replace the DWG/thumbnail file. |
| **Delete (🗑️)** | Soft-delete (mark as inactive). Templates already used in user projects remain accessible but are hidden from the template picker for new projects. |
| **Preview** | View thumbnail + metadata. Future: inline DWG preview renderer. |

### Data Model — Templates

```
floor_plan_templates
├── id              (UUID, PK)
├── name            (string)
├── category        (enum: 'bto' | 'resale_hdb' | 'condo' | 'landed' | 'commercial')
├── unit_type       (string)
├── dwg_file_url    (string — path in storage)
├── thumbnail_url   (string, nullable)
├── description     (text, nullable)
├── is_active       (boolean, default: true)
├── uploaded_by     (FK → admin users)
├── created_at      (timestamp)
└── updated_at      (timestamp)
```

---

## Implementation Priority

| Phase | Scope | Depends On |
|---|---|---|
| **Phase 1** | Admin tab — DWG template upload + storage + CRUD | Supabase storage bucket setup (`floor-plan-templates` bucket) |
| **Phase 2** | `/floorplan3d` landing page + signup/login modal | Auth system (existing) |
| **Phase 3** | `/floorplan3d/dashboard` — project list, "Use a Template" flow, "Upload Floor Plan" flow | Phase 1 + Phase 2, Supabase storage bucket (`user-floor-plans` bucket) |

---

## Resolved Decisions

| Question | Decision |
|---|---|
| 3D rendering engine | **Already handled** — existing editor integration, no action needed. |
| Google/Facebook OAuth on signup modal | **No** — Email + password only. |
| File size limit for user-uploaded floor plans | **5 MB max** |
| Separate Supabase buckets | **Yes** — `floor-plan-templates/` for admin-uploaded templates, `user-floor-plans/` for user uploads. |

---

## Supabase Storage Configuration

| Bucket | Purpose | Access |
|---|---|---|
| `floor-plan-templates` | Admin-uploaded DWG template files + thumbnails | Public read (for template picker), admin-only write |
| `user-floor-plans` | User-uploaded floor plan files (`.dwg`, `.pdf`, `.png`, `.jpg`) | Authenticated user read/write (scoped to own `user_id`), max 5 MB per file |

---

## DWG → Three.js Conversion Pipeline

Three.js **cannot load DWG files directly**. The conversion pipeline is: **DWG → DXF → Three.js scene** (via `three-dxf-loader`), with an optional glTF export path for optimized delivery.

### Why This Stack

| Layer | Tool | Why |
|---|---|---|
| **DWG → DXF** | **ODA File Converter** (CLI) | Free, cross-platform, battle-tested. Handles all DWG versions. Runs as a CLI on Linux servers — no GUI needed. |
| **DXF → Three.js** | **`three-dxf-loader`** (npm) | Purpose-built DXF loader for Three.js and React Three Fiber. Parses DXF entities (lines, arcs, polylines, blocks) directly into `THREE.Object3D`. Works client-side. |
| **Optional: DXF → glTF** | **`Aspose.CAD` JS SDK** or custom script | For pre-baked 3D delivery — glTF loads faster than parsing DXF at runtime. Three.js has a native `GLTFLoader`. Best for templates that don't change. |

### Conversion Flow

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  User/Admin  │      │  Server (API     │      │  Supabase        │
│  uploads     │─────▶│  Route / Edge    │─────▶│  Storage         │
│  .dwg file   │      │  Function)       │      │                  │
└─────────────┘      └────────┬─────────┘      └─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  ODA File Converter │
                    │  (CLI on server)    │
                    │                    │
                    │  DWG → DXF         │
                    │  (+ optional glTF) │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Store converted    │
                    │  .dxf (+ .glb)     │
                    │  back to Supabase  │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Client loads .dxf  │
                    │  via three-dxf-    │
                    │  loader into       │
                    │  Three.js scene    │
                    └────────────────────┘
```

### Step-by-Step

| Step | Detail |
|---|---|
| **1. Upload** | DWG file lands in Supabase Storage (`floor-plan-templates/` or `user-floor-plans/`). Max 5 MB for user uploads. |
| **2. Trigger** | A Supabase Database Webhook or Next.js API route detects the new upload. |
| **3. Convert DWG → DXF** | Server calls ODA File Converter CLI: `ODAFileConverter "/input" "/output" "*.dwg" "ACAD2018" "DXF" "0" "1"`. This converts the DWG to a DXF file (AutoCAD 2018 format, with audit enabled). |
| **4. (Optional) Convert DXF → glTF** | For templates or performance-critical files, a secondary conversion from DXF → glTF using Aspose.CAD JS SDK or a Python script with `ezdxf` + `trimesh`. glTF files load significantly faster in Three.js via the native `GLTFLoader`. |
| **5. Store** | Converted `.dxf` (and optional `.glb`) files are uploaded to the same Supabase bucket alongside the original DWG. DB record is updated with `dxf_file_url` and optionally `gltf_file_url`. |
| **6. Serve to Client** | The 3D editor fetches the `.dxf` file URL from the DB and loads it via `three-dxf-loader`. If a glTF version exists, it's preferred for faster load times. |

### Client-Side Loading (React / Three.js)

```javascript
// Option A: Load DXF directly (works for all files)
import { DXFLoader } from 'three-dxf-loader';

const loader = new DXFLoader();
loader.setEnableLayer(true);
loader.setConsumeUnits(true); // scales to meters
loader.load(dxfFileUrl, (data) => {
  if (data?.entity) {
    scene.add(data.entity);
  }
});

// Option B: Load glTF (faster, for pre-converted templates)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const gltfLoader = new GLTFLoader();
gltfLoader.load(gltfFileUrl, (gltf) => {
  scene.add(gltf.scene);
});
```

### Data Model Addition

Add conversion output fields to both tables:

```
floor_plan_templates
├── dxf_file_url    (string, nullable — converted DXF path)
├── gltf_file_url   (string, nullable — optional glTF path)
└── conversion_status (enum: 'pending' | 'processing' | 'completed' | 'failed')

floor_plan_projects
├── dxf_file_url    (string, nullable — converted DXF path)
├── gltf_file_url   (string, nullable — optional glTF path)
└── conversion_status (enum: 'pending' | 'processing' | 'completed' | 'failed')
```

### ODA File Converter — Server Setup

ODA File Converter is free for use and available as a Linux CLI (DEB/RPM/AppImage).

**Installation on server (Ubuntu/Debian):**
```bash
# Download from https://www.opendesign.com/guestfiles/oda_file_converter
sudo gdebi ODAFileConverter_QT6_lnxX64_8.3dll.deb

# CLI usage:
ODAFileConverter "/path/to/input/" "/path/to/output/" "*.dwg" "ACAD2018" "DXF" "0" "1"
#                 source_dir        target_dir        filter  version    type  recurse audit
```

**For Vercel/serverless:** ODA cannot run natively in serverless. Options:
- Run a small dedicated conversion microservice (e.g., a $5/mo DigitalOcean droplet or Railway container with ODA installed).
- Use Aspose.CAD Cloud API as a managed alternative (paid, but no server to maintain).

### npm Dependencies

```json
{
  "three-dxf-loader": "^5.2.0",
  "dxf-parser": "^1.1.2",
  "three": "^0.160.0"
}
```

### Open Items (DWG Conversion Only)

- [ ] Where does ODA run? Dedicated microservice (Railway/DO) vs. Aspose Cloud API?
- [ ] Do we pre-convert all admin templates to glTF at upload time, or only convert to DXF and let the client parse?
- [ ] Error handling: what happens if conversion fails? (Retry queue? Notify admin?)
- [ ] Do user-uploaded `.pdf` / `.png` / `.jpg` floor plans also need conversion, or are those handled differently by the 3D editor?

---

*This spec covers the page structure, data models, storage config, conversion pipeline, and user flows. The 3D editor (Three.js) is already in place — this build focuses on the surrounding infrastructure to feed it.*
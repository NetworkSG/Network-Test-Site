# FloorPlan3D – App Planning Document

> An AI-assisted interior design tool that converts uploaded floor plans into interactive 3D models, allows furniture and appliance staging, and renders photorealistic outputs.

---

## App Overview

**App Name:** FloorPlan3D (working title)
**Tagline:** *Upload. Stage. Visualize. Render.*
**Target Users:** Homeowners, interior designers, real estate agents, OJT students in design programs
**Platform:** Web App (mobile-responsive)

---

## Core Problem

Users want to visualize their living spaces in 3D — with real furniture and finishes — before committing to purchases or renovations. Existing tools require technical expertise or expensive software. This app removes that friction.

---

## Key Features

### 1. Floor Plan Upload & Parsing
- Upload PNG, JPG, or PDF floor plan files
- AI auto-detects walls, doors, windows, and room boundaries
- Option to manually adjust room outlines if auto-detection is off

### 2. 3D Model Generation
- Converts parsed 2D floor plan into a navigable 3D environment
- Room dimensions inferred from scale or manually entered
- Orbit, pan, and zoom controls for 3D navigation
- Wall height customization per room

### 3. Furniture & Appliance Library
- Drag-and-drop furniture catalog (sofa, bed, dining table, etc.)
- Appliance library (fridge, washing machine, oven, etc.)
- Filter by category, style (modern, Baroque, Japandi, etc.), and room type
- Upload custom 3D assets (GLB/OBJ format)
- Resize, rotate, and reposition items freely in 3D space

### 4. Material & Finish Customization
- Apply wall paint colors or wallpaper textures
- Swap floor materials (hardwood, marble, tile, vinyl)
- Ceiling finish options
- Window covering presets (curtains, blinds, shutters)

### 5. Lighting Controls
- Adjust natural light direction and time of day
- Add artificial light sources (ceiling, floor, accent)
- Real-time lighting preview in 3D viewport

### 6. Photorealistic Render
- One-click render to photorealistic still image
- Select render quality: Draft / Standard / Ultra
- Multiple camera angle saves
- Download rendered images as PNG/JPG
- Optional: short walkthrough video render export

### 7. Project Save & Share
- Save projects to user account
- Share a view-only link with clients or collaborators
- Export floor plan back to 2D with furniture overlay

---

## User Flow

```
1. Sign Up / Log In
        ↓
2. Create New Project → Upload Floor Plan
        ↓
3. AI Parses Floor Plan → 3D Room Generated
        ↓
4. Browse & Place Furniture / Appliances
        ↓
5. Customize Materials + Lighting
        ↓
6. Position Camera Angle(s)
        ↓
7. Render to Photo → Download / Share
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (Vite) |
| 3D Viewport | Three.js or React Three Fiber |
| UI Components | Tailwind CSS + shadcn/ui |
| Drag & Drop | dnd-kit |
| State Management | Zustand |

### Backend
| Layer | Technology |
|---|---|
| Server | Node.js + Express or Next.js API Routes |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| AI Floor Plan Parsing | OpenAI Vision API or custom Python model |

### Rendering
| Layer | Technology |
|---|---|
| Real-time Preview | Three.js (WebGL) |
| Photorealistic Render | Replicate API (Stable Diffusion ControlNet) or Three.js PMREMGenerator |
| Render Queue | Background job via Supabase Edge Functions |

### Deployment
| Layer | Technology |
|---|---|
| Frontend | Vercel |
| Backend | Vercel (serverless) or Railway |
| CDN / Assets | Cloudflare or Supabase Storage CDN |

---

## Database Schema (Simplified)

### `users`
- id, email, full_name, created_at

### `projects`
- id, user_id, name, created_at, updated_at
- floor_plan_url (raw upload)
- parsed_data (JSON — walls, rooms, dimensions)

### `room_elements`
- id, project_id, type (furniture/appliance/material)
- asset_id, position_x, position_y, position_z
- rotation, scale

### `renders`
- id, project_id, camera_angle (JSON), quality, status, output_url, created_at

---

## Competitor Research

| App | Strengths | Weaknesses |
|---|---|---|
| Planner 5D | Intuitive UI, large asset library | Limited photorealistic render |
| RoomSketcher | Good floor plan import | Clunky 3D editor |
| HomeByMe | Free tier available | Dated UI, slow rendering |
| Homestyler | AI styling features | Login wall, limited export |
| SketchUp | Industry standard | Steep learning curve, expensive |

**Our Edge:** AI-driven floor plan parsing + one-click photorealistic render + clean UI — all in one web app with no install required.

---

## Monetization Model

| Tier | Price | Features |
|---|---|---|
| Free | ₱0 | 1 project, draft render only, watermarked export |
| Pro | ₱499/mo | Unlimited projects, ultra render, no watermark |
| Agency | ₱1,499/mo | Team seats, client share links, priority render queue |

---

## MVP Scope (v1.0)

For the first build, focus only on:

- [x] Floor plan image upload
- [x] Basic AI room boundary detection
- [x] Simple 3D room generation (box model per room)
- [x] Basic furniture placement from preset catalog
- [x] Standard render output (no ultra yet)
- [x] User auth + project save

Defer to v2:
- [ ] Custom asset upload (GLB/OBJ)
- [ ] Video walkthrough export
- [ ] Full material library
- [ ] Collaboration / share links

---

## Figma Make Prompt (TC-EBC Format)

```
TASK: Build the Floor Plan Upload screen for FloorPlan3D.

CONTEXT: A web app that converts 2D floor plans into 3D models for interior staging and photorealistic rendering. Design language is luxury-warm, clean, hotel-feel — inspired by Mollie Aspen and Sora Studios aesthetics. Typography: Playfair Display (headings) + DM Sans (body). Color: warm off-white (#FAF8F5), deep charcoal (#1C1C1E), warm gold accent (#C9A96E).

ELEMENTS:
- Top nav with logo left, "My Projects" and "Account" links right
- Hero upload zone: large dashed bordered card, icon + "Upload your floor plan" headline, subtext "PNG, JPG, or PDF accepted", primary CTA button "Upload & Start"
- Below: 3 step icons showing the flow (Upload → Stage → Render) in a horizontal strip
- Recently opened projects row (3 cards, project thumbnail + name + last edited date)

BEHAVIOR:
- Upload zone has hover state (border glow, background tint)
- CTA button has warm gold fill with white text
- Cards have soft shadow and subtle hover lift

CONSTRAINTS:
- Desktop layout, 1440px wide
- No sidebar
- Don't change anything else.
```

---

## Notes & References

- Floor plan parsing inspiration: [Replicate – ControlNet](https://replicate.com/jagilley/controlnet)
- 3D engine reference: [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- Supabase storage for uploads: [Supabase Docs](https://supabase.com/docs/guides/storage)
- Vercel deployment pipeline: same as Sora Studios setup

---

*Document created for AI-assisted build planning. Use this as the source of truth when prompting Lovable, Figma Make, or Cursor.*
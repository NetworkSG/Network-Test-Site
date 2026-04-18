# Network eQuote — CraftMyPDF Template Guide

## How to Use

1. Open CraftMyPDF template editor (use template ID: `28177b236b53ee54` or create new)
2. Go to the **Data** tab and paste the contents of `sample-data.json`
3. Click **Validate and Format JSON**
4. Build the layout in the **Designer** tab following the design spec below
5. Use `{{data.field_name}}` expressions to bind each field

---

## Design System

### Fonts
| Role | Font | Fallback |
|------|------|----------|
| Headings / Section titles | **EB Garamond** | Georgia, serif |
| Body / Labels / Values | **DM Sans** | Arial, sans-serif |

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#f0ede6` | Page background (cream) |
| Card background | `#fafaf8` | eQuote result card |
| Primary text | `#0f0f0d` | Headings, values, total |
| Secondary text | `#6b6860` | Body text, line item labels |
| Muted text | `#a09a90` | Labels (uppercase), footer, date |
| Border | `#d8d3c8` | Card borders, section dividers |
| Divider light | `#e8e3da` | Between line items |
| Header/Footer bg | `#0f0f0d` | Black bars |
| Header/Footer text | `#fafaf8` | White text on black |

### Label Style
- Font: DM Sans, 9pt
- Color: `#a09a90`
- Transform: UPPERCASE
- Letter-spacing: 1px

### Value Style
- Font: DM Sans, 10pt, medium weight
- Color: `#0f0f0d`

---

## Page Layout (A4 Portrait)

Build from top to bottom. All measurements approximate — adjust in the visual editor.

---

### 1. HEADER BAR
- Full-width black (`#0f0f0d`) rectangle, ~80px tall
- Left: **"NETWORK"** — EB Garamond 22pt, white (`#fafaf8`), letter-spacing 4px
- Right: `{{data.date}}` — DM Sans 10pt, `#a09a90`

---

### 2. PROPERTY DETAILS
- Cream background (`#f0ede6`)
- Section title: **"Property Details"** — EB Garamond 18pt, `#0f0f0d`
- Thin divider line below title: `#d8d3c8`

| Label | Expression |
|-------|------------|
| ADDRESS | `{{data.address}}` |
| POSTAL CODE | `{{data.zipcode}}` |
| PROPERTY | `{{data.property_type}} — {{data.unit_type}}` |
| STATUS | `{{data.property_status}}` |
| KEY COLLECTION | `{{data.renovation_timeline}}` |

Layout: 2-column grid where possible (e.g., Postal Code + Property on same row, Status + Key Collection on same row). Address spans full width.

---

### 3. AREAS & THEME
- Thin divider above
- Same label/value style as Property Details

| Label | Expression |
|-------|------------|
| AREAS | `{{data.rooms_to_renovate}}` |
| THEME | `{{data.preferred_themes}}` |

---

### 4. LIFESTYLE PREFERENCES
- Section title: **"Lifestyle Preferences"** — EB Garamond 18pt
- Thin divider below title
- Horizontal row of 5 label/value pairs (or 3+2 rows on narrow layout)

| Label | Expression |
|-------|------------|
| PETS | `{{data.lifestyle_pets}}` |
| CHILDREN | `{{data.lifestyle_children}}` |
| ACCESSIBLE | `{{data.lifestyle_handicap}}` |
| SUSTAINABLE | `{{data.lifestyle_ecoFriendly}}` |
| BOLD DESIGN | `{{data.lifestyle_boldDesign}}` |

---

### 5. eQUOTE RESULT CARD
- White rectangle (`#fafaf8`) with border `#d8d3c8`, corner radius 12px
- Header row:
  - Left: **"eQuote Result"** — EB Garamond 22pt, `#0f0f0d`
  - Right: **"Budget: {{data.renovationcost}}"** — DM Sans 10pt medium, `#6b6860`
- Thin divider below header

**Line items** — each row has:
- Left: Room name (DM Sans 10pt, `#6b6860`)
- Center: Scope level
- Right: Price (DM Sans 10pt medium, `#0f0f0d`, right-aligned)
- Below each: Includes text (DM Sans 8pt, `#a09a90`)
- Thin divider (`#e8e3da`) between each row

| Room | Scope | Price | Includes |
|------|-------|-------|----------|
| Living / Dining | `{{data.living_room}}` | `{{data.living_room_price}}` | `{{data.living_room_include}}` |
| Kitchen | `{{data.kitchen}}` | `{{data.kitchen_price}}` | `{{data.kitchen_include}}` |
| Bedrooms (x`{{data.bedrooms_count}}`) | `{{data.bedrooms}}` | `{{data.bedrooms_price}}` | `{{data.bed_room_include}}` |
| Bathrooms (x`{{data.bathrooms_count}}`) | `{{data.bathrooms}}` | `{{data.bathrooms_price}}` | `{{data.bath_room_include}}` |
| Others | `{{data.other_rooms}}` | `{{data.other_rooms_price}}` | `{{data.other_room_include}}` |

**Total row:**
- Bold divider line (`#0f0f0d`, 1px) above
- Left: **"Total Estimate"** — EB Garamond 16pt, `#0f0f0d`
- Right: **`{{data.renovationcost}}`** — DM Sans 14pt bold, `#0f0f0d`

---

### 6. ADDITIONAL INFO (optional section)
- Only include if you want these fields visible on the PDF

| Label | Expression |
|-------|------------|
| MEETING PREFERENCE | `{{data.meeting_preference}}` |
| ADDITIONAL NOTES | `{{data.additional_notes}}` |
| REFERENCE PHOTOS | `{{data.reference_photos}}` |

---

### 7. DISCLAIMER BOX
- Rectangle with border `#d8d3c8`, 1px, corner radius 8px
- Cream background (`#f0ede6`)
- Text inside (DM Sans 8pt, `#a09a90`, line-height 1.5):

> Numbers here are purely budgetary. A lot depends on actual site assessments, discussion, design direction and choice of materials. You can use this as a basis and a guide, but I'll suggest a meeting with designers to establish the design and direction to have a finalised set of numbers.

---

### 8. FOOTER BAR
- Full-width black (`#0f0f0d`) rectangle, ~50px tall
- Left: **"NETWORK"** — EB Garamond 12pt, white, letter-spacing 3px
- Right: **"network.com.sg"** — DM Sans 9pt, `#a09a90`

---

## All Template Fields Reference

These are the field names sent by the server. Use `{{data.field_name}}` in CraftMyPDF expressions.

### Property & Contact
- `date` — Generation date (e.g., "9 April 2026")
- `address` — Verified address from postal code
- `zipcode` — 6-digit Singapore postal code
- `property_type` — HDB / Condominium / EC / Landed
- `unit_type` — e.g., 3-Room, 4-Room, 5-Room
- `property_status` — New / Existing / Resale
- `renovation_timeline` — Key collection date or timeline

### Preferences
- `preferred_themes` — Comma-separated theme names
- `lifestyle_pets` — Yes / No / -
- `lifestyle_children` — Yes / No / -
- `lifestyle_handicap` — Yes / No / -
- `lifestyle_ecoFriendly` — Yes / No / -
- `lifestyle_boldDesign` — Yes / No / -
- `meeting_preference` — Virtual / Physical
- `additional_notes` — Free text
- `reference_photos` — Comma-separated URLs

### Cost Breakdown
- `renovationcost` — Total range (e.g., "$55K - $65K")
- `rooms_to_renovate` — Comma-separated room names

### Per-Room Data
- `living_room` / `living_room_price` / `living_room_include`
- `kitchen` / `kitchen_price` / `kitchen_include`
- `bedrooms` / `bedrooms_price` / `bedrooms_count` / `bed_room_include`
- `bathrooms` / `bathrooms_price` / `bathrooms_count` / `bath_room_include`
- `other_rooms` / `other_rooms_price` / `other_room_include`

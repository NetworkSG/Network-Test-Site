# Network Design System — Guidelines.md

> **Purpose:** This file is the persistent design system reference for building screens in the Network brand style using Figma Make. Every prompt should reference this file to maintain visual consistency across all screens and components.

---

## 1. Design Identity

- **Brand Mood:** Premium, trustworthy, editorial, warm-minimal
- **Visual Strategy:** Monochromatic (black/white/gray) with surgical warm yellow accents
- **Shape Language:** Soft-rounded, pill-shaped, generous border-radius everywhere
- **Depth System:** Soft diffuse shadows + frosted glass — never hard drop-shadows
- **Typography:** Inter family ONLY — hierarchy driven by weight + size + tracking
- **Photography:** Warm-toned interior design imagery, cinematic crop, dark overlays
- **Layout:** Centered containers, generous whitespace, max-width 1170–1270px

---

## 2. Color Tokens

### Core

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#09090B` | Headings, CTA buttons, primary text, dark sections |
| `--color-white` | `#FFFFFF` | Page bg, card bg, button label text |
| `--color-off-white` | `#F6F6F6` | Alternate section bg, card outer containers, pill outer rings |
| `--color-input-bg` | `#F9FAFB` | Form input/dropdown backgrounds |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-muted` | `#71717A` | Subtitle text, hero secondary line, section subheads |
| `--color-body` | `#747474` | Body copy on white cards, form descriptions |
| `--color-placeholder` | `#99A1AF` | Input placeholder text |
| `--color-light` | `#ABABAB` | Footnotes, disclaimers, timestamps |
| `--color-accent-gray` | `#B0B0B0` | Extended body text on dark backgrounds |

### Accent & Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-badge-bg` | `#FFF6DC` | Social proof badge backgrounds ONLY |
| `--color-badge-border` | `#FFEAB1` | Social proof badge borders ONLY |
| `--color-border` | `#E5E7EB` | Form field borders, card dividers, tag pill borders |
| `--color-divider` | `#F3F4F6` | Card borders, section separators |

### Rules

- **No additional hues.** Never introduce blue, red, green, or other colors into UI elements.
- Warm yellow (`#FFF6DC` / `#FFEAB1`) is ONLY for social-proof badges and status indicators.
- Use `#09090B` for all CTAs — never gray or semi-transparent black.
- Photography is the only source of rich color.
- Section backgrounds alternate: `#FFFFFF` → `#F6F6F6` → `#09090B` (dark sections).

---

## 3. Typography

**Font Family:** `Inter` — no other fonts, ever.

### Type Scale

| Name | Weight | Size | Tracking | Usage |
|------|--------|------|----------|-------|
| Display XL | SemiBold (600) | 80px | -4px | Hero headline primary word |
| Display Muted | Medium (500) | 80px | -4.8px | Hero headline secondary line |
| Section Title | SemiBold (600) | 48px | -2.4px | Page section headings |
| Card Title | Bold (700) | 24px | -1.2px | Card headlines, bold callouts |
| Heading 3 | Bold (700) | 20px | -0.5px | Form titles, subsection heads |
| Body Large | Regular (400) | 18px | normal | Hero subtext, section descriptions |
| Body | Regular (400) | 14px | normal | Paragraph text, form labels, nav links |
| Button Label | Medium (500) | 14–16px | -0.7 to -0.8px | CTA buttons, pill labels |
| Caption | Regular (400) | 12px | normal | Footnotes, disclaimers |
| Badge Text | Medium+Bold | 16px | -0.8px | Status pills, social proof tags |

### Rules

- All headings use **tight negative letter-spacing** (see table above).
- Body text uses **normal tracking** (0).
- Hero pattern: primary word in `SemiBold #09090B` + secondary word in `Medium #71717A` — same size, different weight and color.
- `Bold (700)` for card titles. `ExtraBold (800)` only on dark-background display text.
- Line-height: headings use `1.0–1.1×`, body uses `1.5–1.6×`.

---

## 4. Spacing & Layout

### Grid

| Property | Value |
|----------|-------|
| Max content width | 1170px (nav/homepage), 1270px (profile content) |
| Page outer padding | 30–32px (desktop), 16px (mobile) |
| Section vertical gap | 60–100px between major sections |
| Card internal padding | 29–40px (standard), 20–25px (compact) |
| Form field gap | 14–16px between field groups |
| Label-to-input gap | 6px |

### Section Architecture Pattern

Sections alternate backgrounds for visual rhythm:
1. White (`#FFFFFF`) — default
2. Off-white (`#F6F6F6`) — subtle contrast
3. Dark (`#09090B`) — impact sections (hero, trust bar, blog)

Each section has a consistent internal structure:
- Section label pill (top-left or centered)
- Heading + subtext
- Content area
- Optional CTA

### Responsive

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Single column, 16px padding, stacked |
| Tablet | 768–1199px | Flexible grid, reduced padding |
| Desktop | ≥ 1200px | Full layout, max-width container |

Mobile adaptations:
- Hero text → 32–40px
- Two-column → single-column stacked
- Cards → full-width with 16px margins
- Avatars → horizontal scroll row
- Forms → full-width stacked

---

## 5. Border Radius

| Element | Radius |
|---------|--------|
| Pill buttons, nav bar, badges | `100px` (full-round) |
| Section containers (dark bg inner frame) | `29–34px` |
| Content cards, form cards | `17px` |
| Form inputs, dropdowns | `14px` |
| Image cards, project photos | `8–12px` |
| Avatars | `50%` (circle) |

**Rule:** Never use sharp corners (< 8px) on any element.

---

## 6. Shadow Tokens

| Name | Value | Usage |
|------|-------|-------|
| `--shadow-nav` | `0 11px 34.4px -5px rgba(0,0,0,0.1)` | Navigation bar |
| `--shadow-card` | `0 25px 35.9px rgba(0,0,0,0.07)` | Floating cards, quote forms |
| `--shadow-button` | `0 4px 4px rgba(0,0,0,0.25)` | Inner CTA pill buttons |
| `--shadow-pill` | `0 17px 33.4px rgba(0,0,0,0.17)` | Hero CTA pills |
| `--shadow-badge` | `0 8px 33.4px rgba(0,0,0,0.18)` | Social proof badges |

### Frosted Glass (Nav Only)

```
backdrop-filter: blur(16.75px);
background: rgba(255, 255, 255, 0.76);
```

### Rules

- Shadows are always **soft, diffuse, black-only**.
- Never use colored shadows.
- Never use hard drop-shadows (small blur, high opacity).

---

## 7. Components

### 7.1 Navigation Bar

- Shape: Pill (`border-radius: 100px`), centered, 1170px max-width
- Background: Frosted glass (`rgba(255,255,255,0.76)` + `blur(16.75px)`)
- Shadow: `--shadow-nav`
- Position: Fixed top, 48px offset from top edge
- Logo: `#2B2B2B` wordmark, left-aligned within pill
- Nav links: `Inter Regular 14px`, black, with dropdown arrow icons
- CTA: Nested pill button (see below)

### 7.2 Primary CTA Button (Pill)

**Double-layer structure:**
- **Outer ring:** `#F6F6F6`, `border: 1px solid white`, `border-radius: 100px`
- **Inner pill:** `#09090B`, `border-radius: 100px`, `shadow: --shadow-button`
- **Label:** `Inter Medium 14–16px`, white, `tracking: -0.7px to -0.8px`
- **Arrow:** Right-arrow icon (`→`) following label

Sizes:
- Small: `146 × 56px` (nav CTA)
- Medium: `230 × 70px` (section CTA)
- Large: `288 × 70px` (hero CTA)

### 7.3 Form Submit Button

- Background: `#09090B` solid
- Border-radius: `14px` (matches inputs)
- Height: `42–48px`
- Label: `Inter SemiBold 14px`, white, `tracking: -0.35px`
- Full-width (matches form input width)

### 7.4 Form Fields

- **Label:** `Inter Medium 14px`, `#09090B`, 6px gap to input
- **Input bg:** `#F9FAFB`
- **Input border:** `1px solid #E5E7EB`
- **Input radius:** `14px`
- **Input height:** `42px`
- **Input padding:** `16px horizontal`, `10px vertical`
- **Placeholder:** `Inter Regular 14px`, `#99A1AF`
- **Dropdown:** Same as input + chevron-down icon right-aligned

### 7.5 Cards

**White Content Card (Quote form, info overlay):**
- Background: `#FFFFFF`
- Border: `1px solid #F3F4F6`
- Border-radius: `17px`
- Shadow: `--shadow-card`
- Padding: `29px`

**Feature Card (Image + text, e.g. Renovation Cost Guide):**
- Size: `566 × 666px` (desktop), full-width (mobile)
- Image: background cover, top portion
- Content: bottom portion, `46–48px` left padding
- Title: `Inter Bold 24px`, `#09090B`
- Description: `Inter Regular 18px`, `#71717A`
- CTA: Pill button at bottom

**Review Card (Testimonial):**
- Structure: Image top (160px) + content (276px)
- Stars: 5-star row, 14px, filled
- Verified badge: Google icon + "Verified" right-aligned
- Title: `Inter Medium 16–20px`
- Body: `Inter Regular 14px` with "Read more" link
- Reviewer: `36px` avatar circle + name + date

### 7.6 Social Proof Badge

- Background: `#FFF6DC`
- Border: `1px solid #FFEAB1`
- Border-radius: `100px`
- Shadow: `--shadow-badge`
- Text: `Inter Medium+Bold 16px`, `#09090B`, tight tracking
- Example: "3,214 homeowners matched this year"

### 7.7 Tag / Filter Pill

- Background: transparent or light fill
- Border: `1px solid #E5E7EB`
- Border-radius: `100px`
- Padding: `8px 20px`
- Text: `Inter Regular 14px`, `#09090B`
- Examples: "3-minute call", "Budget discussion", "Style preferences"

### 7.8 Section Label Pill

- Background: `#F6F6F6` or white
- Border: `1px solid white` or `#E5E7EB`
- Border-radius: `100px`
- Text: `Inter Medium 16px`, `#09090B`
- Examples: "What we do", "Free tools", "FAQs", "Blog"

### 7.9 Accordion / FAQ

- Layout: Left column (intro text) + Right column (accordion items)
- Question: `Inter SemiBold 20–24px`, `#09090B`
- Answer: `Inter Regular 18px`, `#71717A`
- Divider: `1px solid #E5E7EB` between items
- Toggle: `32px` circular icon, `+` / `×`
- Info box at bottom: rounded card, different background

### 7.10 Avatar Row

- Avatar: `60px` (mobile) / `80px` (desktop), circular
- Border: `6px solid white` ring
- Gap: `20px` between avatars
- Name: `Inter Regular 14–16px`, centered below
- Behavior: Horizontal scroll (mobile), row (desktop)

---

## 8. Dark Sections

- Background: `#09090B`
- Container: Inset `30px` from page edges, `border-radius: 29–34px`
- Headings: `#FFFFFF`
- Body text: `#B0B0B0` or `#71717A`
- Photography: Warm interior photos visible through dark overlay
- Usage: Trust bar, blog section, footer CTA area

---

## 9. Imagery

- **Style:** Warm natural lighting, interior design focus, completed spaces
- **Aspect ratios:** 16:9 (hero/wide), 3:4 or 4:3 (cards)
- **Tone:** Slightly desaturated, warm color grading
- **Hero treatment:** Full-bleed within rounded container + dark gradient overlay (bottom-heavy)
- **Card images:** Cover fit, subtle top border-radius, no visible border
- **Profile hero:** Full-width, ~462px height, dark overlay with text
- **Avatars:** Circular crop, 6px white border ring
- **Maps:** Desaturated/dark-themed style matching brand palette

---

## 10. Iconography

- **Style:** Line icons, thin stroke, minimal — no filled/solid icons
- **Sizes:** 18px (nav/inline), 16–20px (cards), 24px (features)
- **Color:** `#09090B` on light bg, `#FFFFFF` on dark bg
- **Key icons:** Right-arrow (`→`) in CTAs, down-chevron for dropdowns, checkmark for credentials, 5-star rating rows, play button (56–64px circle)
- **3D house icon:** Rendered minimal 3D house used in hero CTA pills

---

## 11. Footer Pattern

- **Pre-footer CTA:** Large centered heading using hero text pattern (SemiBold primary + Medium muted secondary), pill CTA button below
- **Footer container:** Off-white rounded container, `30px` inner padding
- **Logo:** Black wordmark, left-aligned
- **Tagline:** `Inter Regular 18px`, `#71717A`
- **Newsletter:** Rounded card with email input + "Subscribe" pill button
- **Nav columns:** "Navigation" + "Socials" columns, `Inter Regular 18px`
- **Divider:** `1px solid #E5E7EB` above copyright
- **Copyright:** `Inter Regular 18px`, `#71717A`, left-aligned

---

## 12. Page Templates

### Homepage Flow

1. Sticky frosted-glass nav (pill, centered)
2. Hero section (white bg, centered display text, CTA pills)
3. Trust bar (dark bg, logo strip + stat badges)
4. How It Works (white bg, left intro card + right accordion)
5. Testimonials (white bg, centered heading, 3 portrait cards)
6. Free Tools (white bg, 2 side-by-side feature cards)
7. Blog (dark bg, rounded inner container, article cards)
8. FAQ (white bg, left intro + right accordion)
9. Footer CTA + Footer (off-white rounded container)

### Profile Page Flow

1. Hero image banner (dark overlay, project info)
2. Company info row (logo, name, verified badge, stats row)
3. Quote form card (floating right sidebar)
4. Team avatar row (horizontal)
5. "Trusted Since" section + credentials badges
6. All-Inclusive Packages banner
7. Projects gallery (2-column image cards)
8. Trust & Credentials (licenses + business info table)
9. Case Study timeline (4 phases, alternating image + text)
10. Reviews section (latest reviews + video tours)
11. Review cards grid (masonry, verified badges)
12. Service area map + postal code input
13. Footer

---

## 13. Do's and Don'ts

### ✅ Do

- Use tight letter-spacing on all headings
- Maintain double-layer pill button structure for primary CTAs
- Use generous whitespace between sections (60–100px)
- Keep photography warm-toned and interior-focused
- Alternate section backgrounds for rhythm
- Use frosted-glass nav on scroll
- Use soft, diffuse shadows (large blur, low opacity)

### ❌ Don't

- Introduce color accents beyond the warm yellow badge tone
- Use sharp corners (< 8px radius) on anything
- Use fonts other than Inter
- Use hard drop-shadows
- Crowd content — every section needs breathing room
- Use flat buttons without the layered pill structure for primary CTAs
- Use colored text for links — use black + underline or bold weight
- Use gradients in UI elements (only photo overlays)

---

## 14. Figma Make Prompt Conventions

When writing prompts that reference this guide:

- Start every build prompt with: `Follow Guidelines.md for all styling.`
- One screen per prompt — keep it lean.
- Scoped revision prompts end with: `Don't change anything else.`
- Reference specific tokens: "Use `--color-primary` for the button background."
- Reference specific components: "Use the Primary CTA Button (Pill) pattern from Guidelines.md."
- For new screens, specify which Page Template to follow.

---

*Last updated: March 2026 — Version 1.0*
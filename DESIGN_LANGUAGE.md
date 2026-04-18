# Network SOP Design — Design Language

A living reference for the visual identity, component patterns, and interaction standards used across the Network website.

---

## Color Palette

### Core Colors

| Token        | Hex         | Usage                                      |
|-------------|-------------|---------------------------------------------|
| `cream`      | `#f0ede6`   | Primary background, nav, footer, overlays   |
| `black`      | `#0f0f0d`   | Primary text, buttons, logo mask            |
| `white`      | `#fafaf8`   | Card backgrounds, alternate sections        |
| `gray`       | `#6b6860`   | Secondary text, nav links, descriptions     |
| `grayLight`  | `#a09a90`   | Tertiary text, footer links, captions       |
| `creamBorder`| `#d8d3c8`   | Dividers, card borders, input borders       |

### Extended Palette

| Color            | Hex         | Usage                                    |
|-----------------|-------------|-------------------------------------------|
| Accent green     | `#2d5a27`   | Trust badges, check icons, success states |
| Light green bg   | `#f0f7ef`   | Badge backgrounds, success highlights     |
| Gold star        | `#f5c518`   | Star ratings                              |
| Light cream      | `#faf9f6`   | Subtle section backgrounds                |
| Warm sand        | `#e8e3da`   | Border accents, hover states              |
| Deep charcoal    | `#1a1a1a`   | Footer backgrounds (alternate)            |

### Gradients

- **Mobile sticky CTA fade**: `linear-gradient(to top, #f0ede6 70%, transparent)`
- **Hero overlay**: `linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.1))`
- **Card hover accents**: `linear-gradient(135deg, ...)` with brand colors

---

## Typography

### Font Families

| Role     | Family         | Variable             | Fallback            |
|----------|----------------|----------------------|---------------------|
| Display  | EB Garamond    | `--font-serif`       | `Georgia, serif`    |
| Body/UI  | DM Sans        | `--font-sans`        | `system-ui, sans`   |
| Forms    | Inter          | `--font-inter`       | `DM Sans, sans`     |

### Type Scale

| Element              | Size (mobile → desktop) | Weight | Family      |
|----------------------|------------------------|--------|-------------|
| Hero headline        | `32px → 56px`          | 400    | EB Garamond |
| Section headline     | `28px → 44px`          | 400    | EB Garamond |
| Sub-headline         | `24px → 36px`          | 400    | EB Garamond |
| Card title           | `18px → 22px`          | 500    | DM Sans     |
| Body text            | `15px → 17px`          | 400    | DM Sans     |
| Small body           | `14px → 15px`          | 400    | DM Sans     |
| Nav links            | `13px`                 | 400    | DM Sans     |
| Button label         | `14px → 15px`          | 500    | DM Sans     |
| Caption/fine print   | `12px → 13px`          | 400    | DM Sans     |

### Line Heights

- Headlines: `1.15 – 1.25`
- Body: `1.5 – 1.65`
- UI elements: `1.2 – 1.4`

### Letter Spacing

- Headlines: `-0.02em` (tight)
- Body: `normal`
- Uppercase labels: `0.08em – 0.12em`

---

## Spacing

### Layout

| Token            | Value                     |
|------------------|---------------------------|
| Max content width | `1280px`                 |
| Page padding      | `24px` (mobile) / `40px` (desktop) |
| Section padding   | `py-16 md:py-24` (64px / 96px)     |
| Card gap          | `16px – 24px`            |
| Nav height        | `56px` (mobile) / `64px` (desktop) |

### Component Spacing

| Context               | Value          |
|-----------------------|----------------|
| Between headline + body | `12px – 16px` |
| Between sections       | `0` (dividers) or `64px – 96px` |
| Form field gap         | `12px`         |
| Button internal padding| `px-5 py-2.5` (small) / `px-8 py-4` (large) |
| Icon + label gap       | `8px`          |

---

## Border Radius

| Element       | Radius    |
|---------------|-----------|
| Pill buttons  | `100px`   |
| Cards         | `12px – 16px` |
| Input fields  | `10px`    |
| Image frames  | `12px – 20px` |
| Nav CTA       | `12px`    |
| Badges/tags   | `100px`   |
| Modals        | `16px – 24px` |

---

## Shadows

| Level       | Value                                              | Usage                    |
|-------------|-----------------------------------------------------|--------------------------|
| Subtle      | `0 1px 3px rgba(0,0,0,0.04)`                       | Cards at rest            |
| Medium      | `0 2px 12px rgba(0,0,0,0.06)`                      | Elevated cards           |
| Strong      | `0 4px 24px rgba(0,0,0,0.08)`                      | Modals, dropdowns        |
| Float       | `0 8px 32px rgba(0,0,0,0.12)`                      | Floating elements        |
| Inner glow  | `inset 0 1px 2px rgba(0,0,0,0.05)`                | Input fields (focus)     |

---

## Buttons

### Primary (Dark)

```
background: #0f0f0d
color: #fafaf8
border-radius: 12px
font: 14–15px / 500 DM Sans
padding: 12px 20px (small) / 16px 32px (large)
hover: opacity 0.85
active: scale(0.98)
transition: all 0.15s
```

### Secondary (Outline)

```
background: transparent
border: 1px solid #d8d3c8
color: #0f0f0d
border-radius: 12px
hover: background #f0ede6
```

### Ghost / Text Link

```
background: none
color: #6b6860
text-decoration: underline (optional)
hover: opacity 0.6
```

### Pill CTA (Hero)

```
border-radius: 100px
height: 56px (desktop) / 52px (mobile)
full-width on mobile
```

---

## Form Inputs

```
height: 48px – 52px
border: 1px solid #e4e4e7
border-radius: 10px
padding: 0 16px
font: 15px / 400 Inter or DM Sans
background: #fafaf8
focus: ring-2 ring-offset-2 ring-[#0f0f0d]
placeholder: #a09a90
```

### Text Areas

```
min-height: 120px
padding: 12px 16px
resize: vertical
```

---

## Navigation

### Desktop

- Fixed top, `z-50`, background `#f0ede6`
- Height: `64px`
- Logo left, links center, CTA right
- Links: `13px` DM Sans, color `#6b6860`, hover `opacity 0.6`
- Bottom border: `1px solid #d8d3c8`

### Mobile

- Height: `56px`
- Hamburger icon right (3-line / X toggle)
- Dropdown: animated height with `motion/react`, full-width links at `15px`
- Sticky CTA bar at bottom when hero scrolls out of view

---

## Cards

### Standard Card

```
background: #fafaf8
border: 1px solid #d8d3c8
border-radius: 12px – 16px
padding: 24px – 32px
shadow: 0 1px 3px rgba(0,0,0,0.04)
```

### Hover State

```
shadow: 0 4px 24px rgba(0,0,0,0.08)
transform: translateY(-2px) (optional)
transition: all 0.3s
```

### Image Card

```
overflow: hidden
border-radius: 12px – 20px
image: object-fit cover
aspect-ratio: 4/3 or 16/9
```

---

## Dividers

```
height: 1px
background: #d8d3c8
max-width: 1280px
margin: 0 auto
mx: 24px (mobile) / 40px (desktop)
```

Used between major content sections. No divider between hero and first content block.

---

## Animation & Motion

### Library

[motion/react](https://motion.dev/) (formerly Framer Motion)

### Transitions

| Context              | Duration  | Easing                    |
|---------------------|-----------|----------------------------|
| Hover states         | `0.15s`   | `ease`                    |
| Menu open/close      | `0.2s`    | default spring             |
| Section reveal       | `0.5–0.7s`| `ease-out`               |
| Page scroll          | Lenis smooth scroll (`lerp: 0.08, duration: 1.2`) |

### Scroll Animations

- Sections fade in using `useInView` from motion/react
- Typical pattern: `initial={{ opacity: 0, y: 30 }}` → `animate={{ opacity: 1, y: 0 }}`
- Stagger children: `0.1s – 0.15s` delay between items
- Margin trigger: `-100px` (start animation before element is fully in view)

### Micro-interactions

- Button press: `active:scale-[0.98]`
- Link hover: `opacity 0.6`
- Card hover: subtle lift + shadow increase
- Form focus: ring animation

---

## Responsive Breakpoints

| Breakpoint | Width    | Usage                              |
|-----------|----------|-------------------------------------|
| Default    | `0px+`   | Mobile-first base styles           |
| `sm`       | `640px`  | Small tablets, two-column layouts  |
| `md`       | `768px`  | Tablets, nav switch, side-by-side  |
| `lg`       | `1024px` | Desktop, three-column grids        |
| `xl`       | `1280px` | Wide desktop (max content width)   |

### Common Patterns

- Single column → two column at `md`
- Stack → grid at `sm` or `md`
- Mobile hamburger → desktop nav at `md`
- `px-6` → `px-10` at `md`
- Font size bumps at `md` (e.g., `text-[32px] md:text-[56px]`)

---

## Icons

- **Library**: [Lucide React](https://lucide.dev/)
- **Size**: `16px – 24px` (contextual)
- **Stroke width**: `1.5 – 2`
- **Color**: Inherits from parent (`currentColor`)
- **Inline SVGs**: Used for nav icons, close buttons, arrows

---

## Images

### Photos

- Served from `/public` or Supabase storage
- Format: JPG for photos, PNG for UI elements
- Always use `object-fit: cover`
- Border radius: `12px – 20px`
- Lazy loading via browser-native `loading="lazy"`

### Logo

- Applied as CSS mask on a solid-color div
- Allows color changes without multiple image files
- Size: `110px x 23px`

---

## Accessibility

- All interactive elements have `cursor-pointer`
- Buttons include `aria-label` where icon-only
- Focus states use visible ring (`ring-2`)
- Color contrast: `#0f0f0d` on `#f0ede6` passes WCAG AA
- Mobile touch targets: minimum `44px` height

---

## File Organization

```
src/app/components/
├── homepage/
│   ├── v8/
│   │   ├── HomepageV8.tsx          # Main page component
│   │   ├── primitives.ts           # Design tokens (C, sans, serif, Divider)
│   │   └── sections/               # Section components
│   ├── content.ts                  # Copy content (NAVBAR, FOOTER, etc.)
│   └── types.ts                    # Shared TypeScript types
├── shared/
│   ├── SiteNav.tsx                 # Shared navigation
│   └── SiteFooter.tsx              # Shared footer
└── [feature]Landing.tsx            # Feature landing pages
```

### Token Source of Truth

All color and font tokens live in `primitives.ts`:

```typescript
export const C = {
  cream: "#f0ede6",
  black: "#0f0f0d",
  white: "#fafaf8",
  gray: "#6b6860",
  grayLight: "#a09a90",
  creamBorder: "#d8d3c8",
};

export const serif = "var(--font-serif)";  // EB Garamond
export const sans = "var(--font-sans)";    // DM Sans
```

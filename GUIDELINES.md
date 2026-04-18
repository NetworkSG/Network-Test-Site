# Network Homepage — Design Guidelines

> This document captures the design system, layout patterns, component architecture, and interaction design used on the Network homepage (HomepageV8). Use this as the single source of truth for maintaining visual consistency across the site.

---

## 1. Design Tokens

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#f0ede6` | Page background, input backgrounds |
| `creamDark` | `#e8e4db` | Trust bar background, selected states |
| `creamBorder` | `#d8d3c8` | All borders, dividers, decorative lines |
| `black` | `#0f0f0d` | Primary text, buttons, dark UI elements |
| `gray` | `#6b6860` | Body text, secondary content |
| `grayLight` | `#9a9790` | Captions, labels, eyebrow text, placeholders |
| `white` | `#fafaf8` | Card backgrounds, form backgrounds |
| `footerDark` | `#0f0f0d` | Footer CTA block background |

### Typography

| Role | Font | Weight | Size Range |
|------|------|--------|------------|
| Display / Headlines | `'EB Garamond', Georgia, serif` | 400 (normal) | 28px–60px responsive |
| Body / UI | `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 400–600 | 11px–14px |
| Eyebrow Labels | DM Sans | 600 | 11px, uppercase, letter-spacing: 0.12em |
| Step Numbers | EB Garamond | 400 | 64px–80px, color: `creamBorder` |

### Spacing & Layout

- Max content width: `1280px`
- Section padding: `px-6 md:px-10 py-[80px] md:py-[100px]`
- Card padding: `p-6` to `p-8` / `p-10`
- Card border-radius: `12px`
- Button border-radius: `100px` (pill shape)
- Input border-radius: `10px`
- Grid gaps: `10px`–`16px`

---

## 2. Page Structure & Sections

### 2.1 Navbar
- Fixed top, `z-50`, cream background
- Logo: Network logo via CSS mask image (black fill)
- Nav links (desktop): Explore, Designers, Floor Layout Planner, Cost Guide
- CTA button: pill shape, black bg, white text
- Bottom border: 1px `creamBorder`
- Height: `56px` mobile, `64px` desktop

### 2.2 Hero Section
- Full viewport height, two-column grid on desktop
- **Left column**: Eyebrow with decorative line → H1 headline (serif, with italic gray second part) → Subheadline paragraph
- **Right column**: Lead capture form card (white bg, cream border, 12px radius)
- Form fields: Name, Phone (+65 prefix), Email
- Submit button: full-width pill, black bg
- Ghost photo grid in background at 6% opacity
- Scroll indicator bottom-right on desktop

### 2.3 Trust Bar
- `creamDark` background
- 4-column grid with vertical border dividers
- Large serif numbers (48px–64px) with small sans labels
- **Hover**: background shifts to cream, number scales up 110% from left origin, label shifts right 1 unit
- Transition: `0.4s cubic-bezier(0.22,1,0.36,1)`

### 2.4 Social Proof (Projects)
- Eyebrow label → Large serif headline → 3-column card grid
- **Card design**: Full-height image (480px–520px) with gradient overlay
- Gradient: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)`
- Text overlaid at bottom: property tag (uppercase, white 70%), review quote (serif, white), yellow stars + "Verified"
- **Hover effects**:
  - Image zooms to `scale(1.06)` with `duration-500 ease-out`
  - Blurred image glow appears behind card: `blur(32px) saturate(1.5) brightness(1.1)`, `-20px` inset, `opacity 0→0.5`, `duration-700`
- Section and grid have `overflow: visible` to allow glow to extend beyond card bounds
- Anchor line + "See more projects →" link below grid

### 2.5 How It Works
- Centered eyebrow + centered headline
- **2-column grid** (max-width 960px, centered)
- Each step: large serif number (64px–80px, `creamBorder` color) on the left, content on right
- Content: uppercase eyebrow (first 3 words of title) → serif title (24px–28px) → body paragraph
- Inline note card below: white bg, cream border, 12px radius, centered (max-width 560px)

### 2.6 Testimonials
- Centered eyebrow + headline (with italic gray portion)
- 3-column card grid
- Each card: white bg, cream border, 12px radius
- Content: 5 black stars → quote text → divider → avatar + name + role

### 2.7 FAQ
- Centered eyebrow + headline + subtitle
- Accordion (max-width 760px, centered)
- Each item: bottom border, serif question text, animated `+` rotation to `×`
- Expanding answer area with height/opacity animation

### 2.8 Footer CTA
- Dark block (`footerDark` bg, 12px radius) inside max-width container
- Centered: eyebrow (white 40%) → headline (white) → subheadline (white 55%) → white pill button
- Trust indicators: "6 questions · 2 minutes · Free, no obligations"

### 2.9 Footer
- Logo (CSS mask) + nav links + copyright
- Flex row on desktop, stacked on mobile

---

## 3. Component Primitives

### FadeIn
- Scroll-triggered entrance animation using `motion/react`
- `useInView` with `once: true`, margin `-40px`
- Animation: `opacity 0→1`, `y 12→0`, `duration 0.3s`
- Respects `prefers-reduced-motion`
- Supports staggered `delay` prop

### TagLabel
- Uppercase eyebrow text component
- `11px`, `font-weight: 600`, `letter-spacing: 0.12em`
- Color: `grayLight`, Font: DM Sans

---

## 4. Interaction Patterns

### Hover States
- Links/buttons: `opacity 0.6` on hover, `transition: all 0.15s`
- Submit buttons: `opacity 0.8` on hover, `scale(0.98)` on active
- Image cards: zoom `scale(1.06)` + blurred image glow behind card
- Trust bar stats: background change + scale/translate animation
- Smooth easing: `cubic-bezier(0.22,1,0.36,1)` for premium feel

### Animations
- Page-level smooth scroll: Lenis (`lerp: 0.08, duration: 1.2`)
- Section entrances: FadeIn (scroll-triggered, staggered)
- Form state transitions: AnimatePresence with slide/fade
- FAQ accordion: height + opacity animation
- Qualifying flow: horizontal slide between questions

### Form Flow
1. **Idle**: Lead form with name/phone/email
2. **Qualifying**: 6-step question flow with progress bar, animated transitions, response reveals
3. **Complete**: Success state with checkmark, headline, CTAs

---

## 5. Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (default) | Single column, smaller type, hamburger-free (CTA only) |
| `md` (768px) | 2–3 column grids, larger type, nav links visible |
| `lg` (1024px) | Full 4-column trust bar, larger headlines, hero two-column |

---

## 6. Design Principles

1. **Warm & Editorial**: Cream palette, serif display type, generous whitespace
2. **Clean Borders, No Shadows**: Cards use `1px solid creamBorder`, not box-shadows (except hover glow effects)
3. **Premium Motion**: Subtle, purposeful animations — never flashy
4. **Content-First**: Large readable type, clear hierarchy, no visual clutter
5. **Trust-Forward**: Stats, verified badges, real project photos, social proof prominent
6. **Accessible**: Reduced motion support, semantic HTML, keyboard-focusable elements

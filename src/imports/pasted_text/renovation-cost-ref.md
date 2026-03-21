# Network Renovation Cost Guide — Computation Reference

> Paste this into Figma Make as a `Guidelines.md` or reference doc.
> This covers **computation logic only** — no design execution.

---

## Overview

The Cost Guide calculates a renovation budget range (`estMin` – `estMax`) in two stages:

1. **Stage 1 — Property Profile**: Captures property type, resale status, unit type, rooms to renovate, and timeline. Produces three multipliers: `propertyFactor`, `resaleFactor`, `sizeWeight`.
2. **Stage 2 — Renovation Scope**: User picks either **Full Home** or **Specific Rooms** path. Produces a base `sumMin` / `sumMax`.
3. **Final Formula**: Combines Stage 1 multipliers with Stage 2 subtotals to output `estMin` and `estMax`.

---

## Stage 1 — Property Multipliers

### Property Factor (`propertyFactor`)

| Property Type | Factor |
|---|---|
| HDB | 1.00 |
| Condominium | 1.05 |
| Executive Condo (EC) | 1.05 |
| Landed | 1.25 |

### Resale Uplift (`resaleFactor`)

Applied **only** when `isResale = true`. Otherwise `resaleFactor = 1`.

| Property Type | Resale Uplift |
|---|---|
| HDB | 1.10 |
| Condo / EC | 1.08 |
| Landed | 1.12 |

### Size Weight (`sizeWeight`)

Baseline reference: HDB 4-Room = 1.00

**HDB**

| Unit Type | Weight |
|---|---|
| 2-Room | 0.65 |
| 3-Room | 0.80 |
| 4-Room | 1.00 |
| 5-Room | 1.20 |
| Executive Apt (EA) | 1.30 |
| Executive Maisonette (EM) | 1.40 |

**Condo / EC**

| Unit Type | Weight |
|---|---|
| Studio | 0.60 |
| 1-Bedroom | 0.75 |
| 2-Bedroom | 0.90 |
| 3-Bedroom | 1.05 |
| 4-Bedroom+ | 1.25 |

**Landed**

| Unit Type | Weight |
|---|---|
| Terrace | 1.40 |
| Semi-Detached | 1.60 |
| Detached | 1.80 |

---

## Stage 2 — Renovation Scope

Stage 2 has **two paths**. The user enters one based on their room selection in Stage 1.

- **Full Home** path → user selected ALL rooms (Living/Dining + Kitchen + Bedrooms + Bathrooms + Others)
- **Specific Rooms** path → user selected a subset of rooms

---

### Path A: Full Home

#### Inputs

1. **Scope** — How big is the upgrade?
   - Light / Moderate / Extensive

2. **Carpentry Emphasis** — How much custom carpentry?
   - Low / Medium / High

3. **Layout Changes** — Any major layout changes?
   - No / Some / Major

#### Full Home Package Values (base min/max at reference home)

| Scope | Min | Max |
|---|---|---|
| Light | $12,000 | $25,000 |
| Moderate | $28,000 | $55,000 |
| Extensive | $60,000 | $110,000 |

#### Full Home Adjustment Multipliers

**Carpentry Adjustment (`carpAdj`)**

| Level | Multiplier |
|---|---|
| Low | 0.90 |
| Medium | 1.00 |
| High | 1.15 |

**Layout Adjustment (`layAdj`)**

| Level | Multiplier |
|---|---|
| No | 1.00 |
| Some | 1.07 |
| Major | 1.15 |

#### Full Home Computation

```
base = FULL_HOME_PACKAGES[scope]   // { min, max }
carpAdj = CARPENTRY_ADJ[carpentryEmphasis]
layAdj  = LAYOUT_ADJ[layoutChanges]

sumMin = base.min * carpAdj * layAdj
sumMax = base.max * carpAdj * layAdj
```

Then apply Stage 1 factors (see Final Formula below).

---

### Path B: Specific Rooms

#### Room Package Values (per unit, at reference home)

**Living/Dining** (single room, no count)

| Scope | Min | Max | Includes |
|---|---|---|---|
| Light | $1,000 | $2,000 | Repainting, light fixtures, small carpentry |
| Moderate | $3,000 | $6,000 | New flooring, some custom carpentry, updated lighting |
| Extensive | $7,000 | $12,000 | Full flooring change, feature wall, extensive carpentry |

**Kitchen** (single room, no count)

| Scope | Min | Max | Includes |
|---|---|---|---|
| Light | $3,000 | $6,000 | Change cabinet doors, small carpentry, basic tiling |
| Moderate | $8,000 | $14,000 | New cabinetry, updated appliances, partial tiling |
| Extensive | $15,000 | $25,000 | Full kitchen overhaul, new cabinetry, full tiling, layout changes |

**Bedroom** (multiplied by `bedCount`)

| Scope | Min (per room) | Max (per room) | Includes |
|---|---|---|---|
| Light | $1,000 | $2,000 | Paint, lighting, basic wardrobes |
| Moderate | $2,500 | $4,500 | New flooring, custom wardrobes, lighting updates |
| Extensive | $5,000 | $8,000 | Full carpentry fit-out, flooring, layout changes |

**Bathroom** (multiplied by `bathCount`)

| Scope | Min (per room) | Max (per room) | Includes |
|---|---|---|---|
| Light | $1,500 | $3,000 | Replace fixtures, partial tiling |
| Moderate | $4,000 | $7,000 | New fixtures, partial wall/floor tiling |
| Extensive | $8,000 | $12,000 | Full tiling, custom vanity, layout changes |

**Others — Study, Balcony, etc.** (single room, no count)

| Scope | Min | Max | Includes |
|---|---|---|---|
| Light | $800 | $1,500 | Basic finishing, minor carpentry |
| Moderate | $2,000 | $3,500 | New flooring, partial carpentry |
| Extensive | $4,000 | $6,000 | Full custom carpentry and flooring |

#### Specific Rooms Computation

```
sumMin = 0
sumMax = 0

// Single rooms (count = 1 if selected)
if selected.LivingDining:
    pkg = ROOM_PACKAGES["LivingDining"][scope]
    sumMin += pkg.min
    sumMax += pkg.max

if selected.Kitchen:
    pkg = ROOM_PACKAGES["Kitchen"][scope]
    sumMin += pkg.min
    sumMax += pkg.max

// Counted rooms
if bedCount > 0:
    pkg = ROOM_PACKAGES["Bedroom"][scope]
    sumMin += pkg.min * bedCount
    sumMax += pkg.max * bedCount

if bathCount > 0:
    pkg = ROOM_PACKAGES["Bathroom"][scope]
    sumMin += pkg.min * bathCount
    sumMax += pkg.max * bathCount

if otherCount > 0:
    pkg = ROOM_PACKAGES["Others"][scope]
    sumMin += pkg.min * otherCount
    sumMax += pkg.max * otherCount
```

#### Optional Global Tweaks (Specific Rooms)

These are gentler than the Full Home multipliers because room scopes already capture most variance. They can be omitted for simplicity.

**Carpentry Adjustment (specific rooms)**

| Level | Multiplier |
|---|---|
| Low | 0.95 |
| Medium | 1.00 |
| High | 1.12 |

**Layout Adjustment (specific rooms)**

| Level | Multiplier |
|---|---|
| No | 1.00 |
| Some | 1.05 |
| Major | 1.12 |

If using optional globals:
```
sumMin *= carpAdj * layAdj
sumMax *= carpAdj * layAdj
```

---

## Final Formula (Both Paths)

After computing `sumMin` / `sumMax` from either path:

```
contingencyMax = 1.10    // +10% buffer on max only
roundTo = 100            // round to nearest $100

estMin = round(sumMin * propertyFactor * resaleFactor * sizeWeight, roundTo)
estMax = round(sumMax * propertyFactor * resaleFactor * sizeWeight * contingencyMax, roundTo)
```

### Rounding Function

```
round(value, nearest) = Math.round(value / nearest) * nearest
```

Example: `round(47,350, 100)` → `$47,400`

---

## Floor Rule

If the calculated `estMin` (in thousands) is less than **$45K**, display a fixed message instead:

- **Display**: `$30k – $35k`
- **Subtext**: "While it's possible to spend less, most homeowners in Singapore invest at least $30K+ for a renovation that lasts, improves resale value, and truly feels like home."

Otherwise, display the computed range as `$[numMin]K – $[numMax]K`.

---

## Validation Rules

### Stage 1 (must all pass before proceeding)
- `property.type` — required (HDB | Condo | EC | Landed)
- `property.isResale` — boolean (checkbox, defaults false)
- `unitType` — required, must match the allowed set for the chosen property type
- `rooms[]` — at least 1 room selected
- `timeline` — optional, no pricing effect

### Stage 2
- **Full Home**: `scope`, `carpentryEmphasis`, `layoutChanges` all required
- **Specific Rooms**: at least one room must have a scope selected; Bedrooms/Bathrooms require `count ≥ 1` if toggled on
- If a room is selected but no scope is chosen, treat its subtotal as `$0`

---

## Guardrails

1. **No double-counting size** — All package values are for a reference home (HDB 4-Room). `sizeWeight` from Stage 1 handles scaling. Don't bake size into room packages.
2. **EC = Condo** — Treat Executive Condo identically to Condo for all multipliers.
3. **Conservative bands** — Ranges are intentionally cautious to avoid underquoting. Recalibrate monthly against real quotes.
4. **Rounding** — Always round to nearest $100 for cleaner display.

---

## Worked Example

**Inputs:**
- Property: HDB, Resale, 4-Room
- Path: Specific Rooms
- Living/Dining: Moderate → $3,000 – $6,000
- Kitchen: Extensive → $15,000 – $25,000
- Bedrooms: Light × 3 → $3,000 – $6,000
- Bathrooms: Moderate × 2 → $8,000 – $14,000

**Stage 1 factors:**
- propertyFactor = 1.00 (HDB)
- resaleFactor = 1.10 (HDB resale)
- sizeWeight = 1.00 (4-Room)

**Stage 2 subtotals:**
- sumMin = 3,000 + 15,000 + 3,000 + 8,000 = $29,000
- sumMax = 6,000 + 25,000 + 6,000 + 14,000 = $51,000

**Final:**
- estMin = round(29,000 × 1.00 × 1.10 × 1.00, 100) = round(31,900, 100) = **$31,900**
- estMax = round(51,000 × 1.00 × 1.10 × 1.00 × 1.10, 100) = round(61,710, 100) = **$61,700**

**Display:** `$32K – $62K`
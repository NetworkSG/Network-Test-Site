import type { QuizOption, PaletteOption, TextOption, QuizSelections, DesignDNA } from '@/app/utils/quiz-types'

export const roomStyleOptions: QuizOption[] = [
  {
    id: 'modern',
    label: 'Modern Contemporary',
    imageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
    tags: ['modern', 'clean', 'minimal'],
  },
  {
    id: 'scandinavian',
    label: 'Scandinavian',
    imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80',
    tags: ['scandinavian', 'light', 'cozy', 'minimal'],
  },
  {
    id: 'japandi',
    label: 'Japandi / Muji',
    imageUrl: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&q=80',
    tags: ['japandi', 'zen', 'natural', 'minimal'],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    imageUrl: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=600&q=80',
    tags: ['industrial', 'raw', 'urban', 'bold'],
  },
  {
    id: 'midcentury',
    label: 'Mid-Century Modern',
    imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80',
    tags: ['midcentury', 'retro', 'warm', 'organic'],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80',
    tags: ['minimal', 'clean', 'zen', 'modern'],
  },
  {
    id: 'resort',
    label: 'Resort / Tropical',
    imageUrl: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=600&q=80',
    tags: ['resort', 'natural', 'relaxed', 'warm'],
  },
  {
    id: 'luxe',
    label: 'Luxe Contemporary',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
    tags: ['luxe', 'elegant', 'bold', 'dramatic'],
  },
]

export const colorPaletteOptions: PaletteOption[] = [
  {
    id: 'warm-neutrals',
    label: 'Warm Neutrals',
    colors: ['#F5F0EB', '#D4C5B5', '#A68B6B', '#7A6455', '#4A3728'],
    tags: ['warm', 'natural', 'cozy'],
  },
  {
    id: 'cool-grays',
    label: 'Cool Grays',
    colors: ['#F8F9FA', '#DEE2E6', '#ADB5BD', '#6C757D', '#343A40'],
    tags: ['cool', 'modern', 'clean'],
  },
  {
    id: 'earth-tones',
    label: 'Earth Tones',
    colors: ['#E8DDD3', '#C4A882', '#8B7355', '#5C4033', '#3B2F2F'],
    tags: ['earthy', 'natural', 'organic', 'warm'],
  },
  {
    id: 'monochrome',
    label: 'Black & White',
    colors: ['#FFFFFF', '#E0E0E0', '#9E9E9E', '#424242', '#000000'],
    tags: ['monochrome', 'bold', 'modern', 'clean'],
  },
  {
    id: 'sage-greens',
    label: 'Sage & Greens',
    colors: ['#F0F7F4', '#B8D8C8', '#7FB5A0', '#4A8E6E', '#2C5F4F'],
    tags: ['cool', 'natural', 'relaxed', 'zen'],
  },
  {
    id: 'warm-wood',
    label: 'Warm Wood Tones',
    colors: ['#FDF6F0', '#E8C9A0', '#C4956B', '#9B6B3A', '#5C3D1E'],
    tags: ['warm', 'natural', 'organic', 'cozy'],
  },
]

export const furnitureStyleOptions: QuizOption[] = [
  {
    id: 'minimal-sleek',
    label: 'Minimal & Sleek',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    tags: ['minimal', 'modern', 'clean'],
  },
  {
    id: 'organic-curves',
    label: 'Organic Curves',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80',
    tags: ['organic', 'warm', 'natural'],
  },
  {
    id: 'statement-pieces',
    label: 'Statement Pieces',
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
    tags: ['bold', 'luxe', 'dramatic'],
  },
  {
    id: 'built-in-storage',
    label: 'Built-In & Storage',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
    tags: ['functional', 'modern', 'clean'],
  },
  {
    id: 'compact-multifunctional',
    label: 'Compact & Multi-Use',
    imageUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&q=80',
    tags: ['functional', 'minimal', 'modern', 'zen'],
  },
  {
    id: 'warm-wood',
    label: 'Warm Wood & Natural',
    imageUrl: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&q=80',
    tags: ['natural', 'warm', 'organic', 'japandi'],
  },
]

export const roomLayoutOptions: TextOption[] = [
  {
    id: 'open-concept',
    label: 'Open Concept',
    description: 'Hack away walls for a spacious, connected living-dining-kitchen flow — popular in 4 & 5-room HDBs and condos',
    tags: ['open', 'modern', 'social'],
  },
  {
    id: 'defined-rooms',
    label: 'Defined Rooms',
    description: 'Keep each room separate with clear purpose — bedrooms stay private, kitchen stays contained',
    tags: ['defined', 'cozy', 'functional', 'private'],
  },
  {
    id: 'mixed-flow',
    label: 'Semi-Open',
    description: 'Open up key areas like living-dining but keep bedrooms and kitchen partially enclosed',
    tags: ['flexible', 'balanced', 'adaptable'],
  },
]

export const materialTextureOptions: QuizOption[] = [
  {
    id: 'natural-wood',
    label: 'Natural Wood',
    imageUrl: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80',
    tags: ['natural', 'warm', 'organic', 'cozy'],
  },
  {
    id: 'sintered-stone',
    label: 'Sintered Stone / Quartz',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
    tags: ['elegant', 'modern', 'clean', 'luxe'],
  },
  {
    id: 'metal-glass',
    label: 'Metal & Glass',
    imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80',
    tags: ['modern', 'industrial', 'clean', 'bold'],
  },
  {
    id: 'vinyl-laminate',
    label: 'Vinyl / Laminate',
    imageUrl: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80',
    tags: ['functional', 'modern', 'warm', 'minimal'],
  },
  {
    id: 'concrete',
    label: 'Concrete & Cement',
    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80',
    tags: ['industrial', 'modern', 'raw', 'urban'],
  },
  {
    id: 'rattan-wicker',
    label: 'Rattan & Wicker',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&q=80',
    tags: ['natural', 'resort', 'relaxed', 'warm'],
  },
]

export const lightingMoodOptions: QuizOption[] = [
  {
    id: 'bright-airy',
    label: 'Bright & Airy',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
    tags: ['light', 'clean', 'modern', 'scandinavian'],
  },
  {
    id: 'warm-ambient',
    label: 'Warm & Ambient',
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80',
    tags: ['warm', 'cozy', 'relaxed', 'intimate'],
  },
  {
    id: 'dramatic-moody',
    label: 'Dramatic & Moody',
    imageUrl: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=600&q=80',
    tags: ['dramatic', 'bold', 'elegant', 'luxe'],
  },
  {
    id: 'natural-daylight',
    label: 'Natural Daylight',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80',
    tags: ['natural', 'organic', 'zen', 'resort'],
  },
]

const STYLE_NAMES: Record<string, string> = {
  modern: 'Modern Contemporary',
  scandinavian: 'Scandinavian',
  japandi: 'Japandi / Muji',
  industrial: 'Urban Industrial',
  midcentury: 'Mid-Century Modern',
  minimalist: 'Minimalist',
  resort: 'Resort Tropical',
  luxe: 'Luxe Contemporary',
  minimal: 'Minimalist',
  zen: 'Zen',
  warm: 'Warm',
  natural: 'Natural',
  bold: 'Bold',
  clean: 'Clean',
  cozy: 'Cozy',
  elegant: 'Elegant',
  functional: 'Functional',
}

export function calculateDesignDNA(selections: QuizSelections): DesignDNA {
  const tagCounts: Record<string, number> = {}

  const addTags = (tags: string[]) => {
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  }

  // Room styles
  selections.roomStyle.forEach(id => {
    const opt = roomStyleOptions.find(o => o.id === id)
    if (opt) addTags(opt.tags)
  })

  // Color palette
  if (selections.colorPalette) {
    const opt = colorPaletteOptions.find(o => o.id === selections.colorPalette)
    if (opt) addTags(opt.tags)
  }

  // Furniture style
  if (selections.furnitureStyle) {
    const opt = furnitureStyleOptions.find(o => o.id === selections.furnitureStyle)
    if (opt) addTags(opt.tags)
  }

  // Room layout
  if (selections.roomLayout) {
    const opt = roomLayoutOptions.find(o => o.id === selections.roomLayout)
    if (opt) addTags(opt.tags)
  }

  // Materials
  selections.materialTexture.forEach(id => {
    const opt = materialTextureOptions.find(o => o.id === id)
    if (opt) addTags(opt.tags)
  })

  // Lighting
  if (selections.lightingMood) {
    const opt = lightingMoodOptions.find(o => o.id === selections.lightingMood)
    if (opt) addTags(opt.tags)
  }

  // Sort tags by frequency
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  const maxCount = sorted[0]?.[1] || 1

  // Build match percentages for top styles
  const matchPercentages: Record<string, number> = {}
  sorted.slice(0, 6).forEach(([tag, count]) => {
    const name = STYLE_NAMES[tag] || tag.charAt(0).toUpperCase() + tag.slice(1)
    matchPercentages[name] = Math.round((count / maxCount) * 100)
  })

  // Determine primary style from room style selections + top tags
  const topTags = sorted.slice(0, 3).map(([tag]) => tag)
  let primaryStyle = 'Modern Contemporary'
  if (topTags.includes('japandi') || (topTags.includes('zen') && topTags.includes('natural'))) {
    primaryStyle = 'Japandi / Muji'
  } else if (topTags.includes('scandinavian')) {
    primaryStyle = 'Scandinavian Modern'
  } else if (topTags.includes('industrial')) {
    primaryStyle = 'Urban Industrial'
  } else if (topTags.includes('luxe') || (topTags.includes('elegant') && topTags.includes('bold'))) {
    primaryStyle = 'Luxe Contemporary'
  } else if (topTags.includes('resort')) {
    primaryStyle = 'Resort Tropical'
  } else if (topTags.includes('warm') && topTags.includes('minimal')) {
    primaryStyle = 'Warm Minimalist'
  } else if (topTags.includes('functional') && topTags.includes('modern')) {
    primaryStyle = 'Modern Functional'
  } else if (topTags.includes('modern')) {
    primaryStyle = 'Modern Contemporary'
  }

  // Color profile
  let colorProfile = 'Warm Neutrals'
  if (selections.colorPalette) {
    const palette = colorPaletteOptions.find(o => o.id === selections.colorPalette)
    if (palette) colorProfile = palette.label
  }

  // Layout preference
  let layoutPreference = 'Open Concept'
  if (selections.roomLayout) {
    const layout = roomLayoutOptions.find(o => o.id === selections.roomLayout)
    if (layout) layoutPreference = layout.label
  }

  // Palette colors
  let paletteColors = ['#F5F0EB', '#D4C5B5', '#A68B6B', '#7A6455', '#4A3728']
  if (selections.colorPalette) {
    const palette = colorPaletteOptions.find(o => o.id === selections.colorPalette)
    if (palette) paletteColors = palette.colors
  }

  return {
    primaryStyle,
    colorProfile,
    layoutPreference,
    traits: sorted.slice(0, 8).map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1)),
    matchPercentages,
    paletteColors,
  }
}

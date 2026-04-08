import type { QuizOption, PaletteOption, TextOption, QuizSelections, DesignDNA } from '@/app/utils/quiz-types'

export const roomStyleOptions: QuizOption[] = [
  {
    id: 'modern',
    label: 'Modern',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
    tags: ['modern', 'clean', 'minimal'],
  },
  {
    id: 'scandinavian',
    label: 'Scandinavian',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    tags: ['scandinavian', 'light', 'cozy', 'minimal'],
  },
  {
    id: 'japandi',
    label: 'Japandi',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    tags: ['japandi', 'zen', 'natural', 'minimal'],
  },
  {
    id: 'industrial',
    label: 'Industrial',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
    tags: ['industrial', 'raw', 'urban', 'bold'],
  },
  {
    id: 'midcentury',
    label: 'Mid-Century Modern',
    imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80',
    tags: ['midcentury', 'retro', 'warm', 'organic'],
  },
  {
    id: 'traditional',
    label: 'Traditional',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    tags: ['traditional', 'classic', 'elegant', 'ornate'],
  },
  {
    id: 'coastal',
    label: 'Coastal',
    imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80',
    tags: ['coastal', 'light', 'natural', 'relaxed'],
  },
  {
    id: 'bohemian',
    label: 'Bohemian',
    imageUrl: 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=600&q=80',
    tags: ['bohemian', 'eclectic', 'colorful', 'warm'],
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
    id: 'ocean-breeze',
    label: 'Ocean Breeze',
    colors: ['#F0F7F4', '#B8D8D0', '#7FB5B0', '#4A8E8E', '#2C5F5F'],
    tags: ['cool', 'coastal', 'relaxed', 'natural'],
  },
  {
    id: 'desert-sunset',
    label: 'Desert Sunset',
    colors: ['#FDF6F0', '#F0D6B4', '#D4956B', '#B05E3A', '#6B3A2A'],
    tags: ['warm', 'bold', 'earthy', 'dramatic'],
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
    tags: ['bold', 'eclectic', 'dramatic'],
  },
  {
    id: 'built-in-storage',
    label: 'Built-In & Storage',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
    tags: ['functional', 'modern', 'clean'],
  },
  {
    id: 'vintage-retro',
    label: 'Vintage & Retro',
    imageUrl: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&q=80',
    tags: ['retro', 'warm', 'eclectic', 'classic'],
  },
  {
    id: 'low-profile',
    label: 'Low-Profile',
    imageUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&q=80',
    tags: ['zen', 'minimal', 'japandi', 'relaxed'],
  },
]

export const roomLayoutOptions: TextOption[] = [
  {
    id: 'open-concept',
    label: 'Open Concept',
    description: 'Flowing spaces with minimal walls, perfect for social living',
    tags: ['open', 'modern', 'social'],
  },
  {
    id: 'cozy-compartments',
    label: 'Cozy Compartments',
    description: 'Defined rooms with their own character and purpose',
    tags: ['defined', 'cozy', 'traditional', 'private'],
  },
  {
    id: 'mixed-flow',
    label: 'Mixed Flow',
    description: 'A blend of open and defined spaces for flexibility',
    tags: ['flexible', 'balanced', 'adaptable'],
  },
]

export const materialTextureOptions: QuizOption[] = [
  {
    id: 'natural-wood',
    label: 'Natural Wood',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
    tags: ['natural', 'warm', 'organic', 'cozy'],
  },
  {
    id: 'stone-marble',
    label: 'Stone & Marble',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80',
    tags: ['elegant', 'classic', 'dramatic', 'cool'],
  },
  {
    id: 'metal-glass',
    label: 'Metal & Glass',
    imageUrl: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=600&q=80',
    tags: ['modern', 'industrial', 'clean', 'bold'],
  },
  {
    id: 'soft-textiles',
    label: 'Soft Textiles',
    imageUrl: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80',
    tags: ['cozy', 'warm', 'relaxed', 'bohemian'],
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
    tags: ['natural', 'coastal', 'bohemian', 'relaxed'],
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
    tags: ['dramatic', 'bold', 'elegant', 'dark'],
  },
  {
    id: 'natural-daylight',
    label: 'Natural Daylight',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80',
    tags: ['natural', 'organic', 'zen', 'coastal'],
  },
]

const STYLE_NAMES: Record<string, string> = {
  modern: 'Modern Minimalist',
  scandinavian: 'Scandinavian',
  japandi: 'Japandi',
  industrial: 'Urban Industrial',
  midcentury: 'Mid-Century Modern',
  traditional: 'Contemporary Classic',
  coastal: 'Coastal Living',
  bohemian: 'Bohemian Eclectic',
  minimal: 'Minimalist',
  zen: 'Zen',
  warm: 'Warm',
  natural: 'Natural',
  bold: 'Bold',
  clean: 'Clean',
  cozy: 'Cozy',
  elegant: 'Elegant',
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
  let primaryStyle = 'Modern Minimalist'
  if (topTags.includes('japandi') || (topTags.includes('zen') && topTags.includes('natural'))) {
    primaryStyle = 'Modern Japandi'
  } else if (topTags.includes('scandinavian')) {
    primaryStyle = 'Scandinavian Modern'
  } else if (topTags.includes('industrial')) {
    primaryStyle = 'Urban Industrial'
  } else if (topTags.includes('bohemian') || topTags.includes('eclectic')) {
    primaryStyle = 'Bohemian Eclectic'
  } else if (topTags.includes('coastal')) {
    primaryStyle = 'Coastal Contemporary'
  } else if (topTags.includes('traditional') || topTags.includes('classic')) {
    primaryStyle = 'Contemporary Classic'
  } else if (topTags.includes('warm') && topTags.includes('minimal')) {
    primaryStyle = 'Warm Minimalist'
  } else if (topTags.includes('modern')) {
    primaryStyle = 'Modern Minimalist'
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

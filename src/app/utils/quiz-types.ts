export interface QuizOption {
  id: string
  label: string
  imageUrl: string
  tags: string[]
}

export interface PaletteOption {
  id: string
  label: string
  colors: string[]
  tags: string[]
}

export interface TextOption {
  id: string
  label: string
  description: string
  tags: string[]
}

export interface QuizSelections {
  roomStyle: string[]
  colorPalette: string | null
  furnitureStyle: string | null
  roomLayout: string | null
  materialTexture: string[]
  lightingMood: string | null
}

export interface DesignDNA {
  primaryStyle: string
  colorProfile: string
  layoutPreference: string
  traits: string[]
  matchPercentages: Record<string, number>
  paletteColors: string[]
}

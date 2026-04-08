export interface BoardPin {
  id: string
  type: 'image' | 'note'
  imageUrl?: string
  note?: string
  label?: string
  colors: string[]
  createdAt: number
}

export interface MoodBoard {
  id: string
  name: string
  pins: BoardPin[]
  createdAt: number
  updatedAt: number
}

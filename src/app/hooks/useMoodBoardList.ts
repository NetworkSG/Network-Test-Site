import { useCallback } from 'react'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'
import { supabase } from '@/app/components/supabaseClient'
import { useAuth } from '@/app/hooks/useAuth'
import type { MoodBoard } from '@/app/utils/mood-board-types'

export interface BoardSummary {
  id: string
  name: string
  pinCount: number
  thumbnail: string | null
  updatedAt: number
  createdAt: number
}

const LIST_KEY = 'network-mood-boards-list'

function generateId() {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function boardToSummary(board: MoodBoard): BoardSummary {
  // Prefer pins with persistent URLs (skip blob: URLs that don't survive reload)
  const firstImage = board.pins.find(p => p.type === 'image' && p.imageUrl && !p.imageUrl.startsWith('blob:'))
    || board.pins.find(p => p.type === 'image' && p.imageUrl)
  return {
    id: board.id,
    name: board.name,
    pinCount: board.pins.length,
    thumbnail: firstImage?.imageUrl || null,
    updatedAt: board.updatedAt,
    createdAt: board.createdAt,
  }
}

export function useMoodBoardList() {
  const [boards, setBoards] = useLocalStorage<BoardSummary[]>(LIST_KEY, [])
  const { user, isLoggedIn } = useAuth()

  const createBoard = useCallback((name?: string): string => {
    const id = generateId()
    const now = Date.now()
    const board: MoodBoard = {
      id,
      name: name || 'Untitled Board',
      pins: [],
      createdAt: now,
      updatedAt: now,
    }
    // Save the full board to its own localStorage key
    localStorage.setItem(`network-mood-board-${id}`, JSON.stringify(board))

    // Add to list
    const summary = boardToSummary(board)
    setBoards(prev => [summary, ...prev])

    // Sync to Supabase
    if (isLoggedIn && user) {
      supabase.from('mood_boards').upsert({
        id,
        user_id: user.email,
        name: board.name,
        pins: board.pins,
        extracted_palette: [],
        updated_at: new Date().toISOString(),
      })
    }

    return id
  }, [setBoards, isLoggedIn, user])

  const deleteBoard = useCallback((id: string) => {
    localStorage.removeItem(`network-mood-board-${id}`)
    setBoards(prev => prev.filter(b => b.id !== id))

    if (isLoggedIn && user) {
      supabase.from('mood_boards').delete().eq('id', id)
    }
  }, [setBoards, isLoggedIn, user])

  const updateBoardSummary = useCallback((board: MoodBoard) => {
    const summary = boardToSummary(board)
    setBoards(prev => {
      const exists = prev.some(b => b.id === board.id)
      if (exists) {
        return prev.map(b => b.id === board.id ? summary : b)
      }
      return [summary, ...prev]
    })
  }, [setBoards])

  // Load boards from Supabase on first call (for logged-in users)
  const syncFromSupabase = useCallback(async () => {
    if (!isLoggedIn || !user) return

    const { data } = await supabase
      .from('mood_boards')
      .select('*')
      .eq('user_id', user.email)
      .order('updated_at', { ascending: false })

    if (!data || data.length === 0) return

    const remoteSummaries: BoardSummary[] = data.map((d: Record<string, unknown>) => {
      const pins = (d.pins as MoodBoard['pins']) || []
      const firstImage = pins.find(p => p.type === 'image' && p.imageUrl)
      return {
        id: d.id as string,
        name: (d.name as string) || 'Untitled Board',
        pinCount: pins.length,
        thumbnail: firstImage?.imageUrl || null,
        updatedAt: new Date(d.updated_at as string).getTime(),
        createdAt: new Date(d.created_at as string).getTime(),
      }
    })

    // Also save each board's full data to localStorage
    for (const d of data) {
      const board: MoodBoard = {
        id: d.id as string,
        name: (d.name as string) || 'Untitled Board',
        pins: (d.pins as MoodBoard['pins']) || [],
        createdAt: new Date(d.created_at as string).getTime(),
        updatedAt: new Date(d.updated_at as string).getTime(),
      }
      localStorage.setItem(`network-mood-board-${d.id}`, JSON.stringify(board))
    }

    setBoards(remoteSummaries)
  }, [isLoggedIn, user, setBoards])

  return {
    boards,
    createBoard,
    deleteBoard,
    updateBoardSummary,
    syncFromSupabase,
  }
}

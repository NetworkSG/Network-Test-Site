import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/app/components/supabaseClient'
import { useAuth } from '@/app/hooks/useAuth'
import type { MoodBoard } from '@/app/utils/mood-board-types'

const DEBOUNCE_MS = 2000

export function useMoodBoardSync(
  board: MoodBoard,
  _setBoard: (b: MoodBoard | ((prev: MoodBoard) => MoodBoard)) => void
) {
  void _setBoard // used for future remote->local sync
  const { user, isLoggedIn } = useAuth()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save to Supabase whenever board changes
  const saveToSupabase = useCallback(async (boardData: MoodBoard) => {
    if (!isLoggedIn || !user) return

    await supabase.from('mood_boards').upsert({
      id: boardData.id,
      user_id: user.email,
      name: boardData.name,
      pins: boardData.pins,
      extracted_palette: [...new Set(boardData.pins.flatMap(p => p.colors))],
      updated_at: new Date().toISOString(),
    })
  }, [isLoggedIn, user])

  useEffect(() => {
    if (!isLoggedIn) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToSupabase(board)
    }, DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [board, isLoggedIn, saveToSupabase])
}

import { useState, useCallback } from 'react'
import { supabase } from '@/app/components/supabaseClient'
import type { QuizSelections, DesignDNA } from '@/app/utils/quiz-types'

const SESSION_KEY = 'network-quiz-session-id'
const EMAIL_COUNT_PREFIX = 'network-quiz-email-count:'
const MAX_ANONYMOUS_USES = 3

function generateId() {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function useQuizSession() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requiresAuth, setRequiresAuth] = useState(false)

  // Check how many times an email has been used anonymously
  const checkEmailUsage = useCallback(async (email: string): Promise<number> => {
    // Check local cache first for fast feedback
    const localKey = EMAIL_COUNT_PREFIX + email.toLowerCase()
    const localCount = parseInt(localStorage.getItem(localKey) || '0', 10)

    // Also verify against Supabase
    try {
      const { count, error: countErr } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .is('user_id', null) // only anonymous sessions
      if (!countErr && count !== null) {
        // Sync local cache with server
        localStorage.setItem(localKey, String(count))
        return count
      }
    } catch {
      // Fall back to local count
    }
    return localCount
  }, [])

  // Save quiz session to Supabase (called at lead capture step)
  const saveSession = useCallback(async (params: {
    email: string
    name: string
    phone: string
    selections: QuizSelections
    designDna: DesignDNA
  }): Promise<{ success: boolean; requiresAuth?: boolean }> => {
    setLoading(true)
    setError('')
    setRequiresAuth(false)

    const email = params.email.toLowerCase()

    // Check email usage limit
    const usageCount = await checkEmailUsage(email)
    if (usageCount >= MAX_ANONYMOUS_USES) {
      setLoading(false)
      setRequiresAuth(true)
      return { success: false, requiresAuth: true }
    }

    const sessionId = getOrCreateSessionId()

    try {
      const { error: upsertErr } = await supabase
        .from('quiz_sessions')
        .upsert({
          id: sessionId,
          email,
          name: params.name,
          phone: params.phone,
          selections: params.selections,
          design_dna: params.designDna,
          completed: true,
          updated_at: new Date().toISOString(),
        })

      if (upsertErr) {
        setError(upsertErr.message)
        setLoading(false)
        return { success: false }
      }

      // Increment local email counter
      const localKey = EMAIL_COUNT_PREFIX + email
      const current = parseInt(localStorage.getItem(localKey) || '0', 10)
      localStorage.setItem(localKey, String(current + 1))

      // Generate new session ID for next quiz attempt
      localStorage.setItem(SESSION_KEY, generateId())

      setLoading(false)
      return { success: true }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      setLoading(false)
      return { success: false }
    }
  }, [checkEmailUsage])

  // Link anonymous sessions to a user after signup/login
  const linkSessionsToUser = useCallback(async (userId: string, email: string) => {
    try {
      await supabase
        .from('quiz_sessions')
        .update({ user_id: userId })
        .eq('email', email.toLowerCase())
        .is('user_id', null)
    } catch {
      // Non-critical
    }
  }, [])

  return {
    loading,
    error,
    requiresAuth,
    setRequiresAuth,
    checkEmailUsage,
    saveSession,
    linkSessionsToUser,
  }
}

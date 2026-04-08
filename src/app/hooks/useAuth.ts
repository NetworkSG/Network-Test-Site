import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/components/supabaseClient'
import { API, getApiHeaders } from '@/app/utils/supabase-helpers'

export interface UserProfile {
  name: string
  email: string
  contactNumber: string
}

const PROFILE_KEY = 'homeowner-profile-cache'
const TOKEN_KEY = 'homeowner-token'
const USERID_KEY = 'homeowner-userId'
const AUTH_EVENT = 'homeowner-auth-changed'

function getStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(getStoredProfile)
  const [loading, setLoading] = useState(false)

  // Sync across tabs + same-tab events
  useEffect(() => {
    const sync = () => setUser(getStoredProfile())
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Validate session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    fetch(`${API}/homeowner-session`, {
      headers: {
        ...getApiHeaders(),
        'X-Homeowner-Token': token,
      },
    }).then(res => {
      if (!res.ok) {
        // Session invalid — clear
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USERID_KEY)
        localStorage.removeItem(PROFILE_KEY)
        localStorage.removeItem('homeowner-full-cache')
        setUser(null)
        window.dispatchEvent(new Event(AUTH_EVENT))
      }
    }).catch(() => {
      // Network error — keep cached state
    })
  }, [])

  const signup = useCallback(async (form: {
    name: string
    email: string
    contactNumber: string
    password: string
    keyCollectionPeriod: string
    wantIdShortlist: boolean
  }): Promise<{ error?: string }> => {
    setLoading(true)
    try {
      // 1. Create account via edge function
      const res = await fetch(`${API}/fp3d/signup`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoading(false)
        return { error: data.error || 'Signup failed' }
      }

      // 2. Sign in with Supabase
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (loginErr) {
        setLoading(false)
        return { error: 'Account created, but login failed. Please log in manually.' }
      }

      // 3. Get homeowner token
      try {
        const hRes = await fetch(`${API}/homeowner-login`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ email: form.email, password: form.password }),
        })
        const hJson = await hRes.json()
        if (hJson.token) {
          localStorage.setItem(TOKEN_KEY, hJson.token)
          localStorage.setItem(USERID_KEY, hJson.userId)
        }
      } catch {
        // Non-critical — continue
      }

      // 4. Store profile
      const profile: UserProfile = {
        name: form.name,
        email: form.email,
        contactNumber: form.contactNumber,
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      setUser(profile)
      window.dispatchEvent(new Event(AUTH_EVENT))
      setLoading(false)
      return {}
    } catch (e: unknown) {
      setLoading(false)
      return { error: e instanceof Error ? e.message : 'Network error' }
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true)
    try {
      // 1. Supabase sign in
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
      if (loginErr) {
        setLoading(false)
        return { error: loginErr.message }
      }

      // 2. Get homeowner token
      let profileName = ''
      try {
        const hRes = await fetch(`${API}/homeowner-login`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ email, password }),
        })
        const hJson = await hRes.json()
        if (hJson.token) {
          localStorage.setItem(TOKEN_KEY, hJson.token)
          localStorage.setItem(USERID_KEY, hJson.userId)
          profileName = hJson.profile?.name || ''
        }
      } catch {
        // Non-critical
      }

      // 3. Store profile
      const profile: UserProfile = {
        name: profileName || 'Homeowner',
        email,
        contactNumber: '',
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      setUser(profile)
      window.dispatchEvent(new Event(AUTH_EVENT))
      setLoading(false)
      return {}
    } catch (e: unknown) {
      setLoading(false)
      return { error: e instanceof Error ? e.message : 'Network error' }
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERID_KEY)
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem('homeowner-full-cache')
    setUser(null)
    window.dispatchEvent(new Event(AUTH_EVENT))
  }, [])

  return { user, isLoggedIn: !!user, loading, signup, login, logout }
}

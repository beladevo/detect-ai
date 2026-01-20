"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User as PrismaUser } from '@prisma/client'

type AuthContextType = {
  supabaseUser: SupabaseUser | null
  user: PrismaUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<PrismaUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.email!)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.email!)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserData(email: string) {
    try {
      const response = await fetch(`/api/users/me`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ supabaseUser, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

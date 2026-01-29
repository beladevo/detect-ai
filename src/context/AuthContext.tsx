"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  firstName: string | null
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  emailVerified: boolean
  apiKey: string | null
  apiKeyEnabled: boolean
  monthlyDetections: number
  totalDetections: number
  lastDetectionAt: string | null
  createdAt: string
  lastLoginAt: string | null
  registerIp: string | null
  lastLoginIp: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  stripeCurrentPeriodEnd: string | null
  billingPlan: 'premium' | 'enterprise' | null
  billingCycle: 'monthly' | 'annual' | null
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

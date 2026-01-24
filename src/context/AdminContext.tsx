"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AdminRole } from '@prisma/client'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  isAdmin: true
  adminRole: AdminRole
  createdAt: string
  lastLoginAt: string | null
}

type AdminContextType = {
  admin: AdminUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshAdmin: () => Promise<void>
  canModifyUsers: boolean
  canManageAdmins: boolean
  canViewLogs: boolean
  canModifySettings: boolean
  canDeleteUsers: boolean
}

const AdminContext = createContext<AdminContextType>({
  admin: null,
  loading: true,
  signOut: async () => {},
  refreshAdmin: async () => {},
  canModifyUsers: false,
  canManageAdmins: false,
  canViewLogs: false,
  canModifySettings: false,
  canDeleteUsers: false,
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAdmin = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/session')
      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error('Failed to fetch admin session:', error)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmin()
  }, [fetchAdmin])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setAdmin(null)
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Admin logout failed:', error)
    }
  }, [])

  const refreshAdmin = useCallback(async () => {
    await fetchAdmin()
  }, [fetchAdmin])

  const canModifyUsers = admin?.adminRole === 'SUPER_ADMIN' || admin?.adminRole === 'ADMIN'
  const canManageAdmins = admin?.adminRole === 'SUPER_ADMIN'
  const canViewLogs = !!admin?.adminRole
  const canModifySettings = admin?.adminRole === 'SUPER_ADMIN' || admin?.adminRole === 'ADMIN'
  const canDeleteUsers = admin?.adminRole === 'SUPER_ADMIN'

  return (
    <AdminContext.Provider value={{
      admin,
      loading,
      signOut,
      refreshAdmin,
      canModifyUsers,
      canManageAdmins,
      canViewLogs,
      canModifySettings,
      canDeleteUsers,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)

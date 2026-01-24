"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminProvider, useAdmin } from "@/src/context/AdminContext"
import { AdminSidebar } from "@/src/components/admin"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !admin && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [admin, loading, router, pathname])

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pl-64">
        {children}
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  )
}

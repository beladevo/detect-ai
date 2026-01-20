"use client"

import { useAuth } from '@/src/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import GlowButton from '@/src/components/ui/GlowButton'
import { PremiumBadge } from '@/src/components/ui/PremiumBadge'
import { LogOut, Crown, Activity, Image as ImageIcon } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-gray-400">Welcome back, {user.name || user.email}</p>
          </div>
          <GlowButton onClick={handleSignOut} variant="secondary">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </GlowButton>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Tier Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <Crown className="h-8 w-8 text-amber-400" />
              {user.tier !== 'FREE' && <PremiumBadge />}
            </div>
            <h3 className="text-sm font-medium text-gray-400">Current Tier</h3>
            <p className="mt-2 text-3xl font-bold text-white">{user.tier}</p>
            {user.tier === 'FREE' && (
              <p className="mt-2 text-xs text-gray-500">
                Upgrade to access premium features
              </p>
            )}
          </div>

          {/* Total Detections */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <ImageIcon className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Total Detections</h3>
            <p className="mt-2 text-3xl font-bold text-white">{user.totalDetections}</p>
            <p className="mt-2 text-xs text-gray-500">All-time count</p>
          </div>

          {/* Monthly Usage */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <Activity className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Monthly Usage</h3>
            <p className="mt-2 text-3xl font-bold text-white">{user.monthlyDetections}</p>
            <p className="mt-2 text-xs text-gray-500">This month</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Account Information</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.lastLoginAt && (
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-gray-400">Last Login</span>
                <span className="text-white">
                  {new Date(user.lastLoginAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.apiKey && (
              <div className="flex justify-between pb-3">
                <span className="text-gray-400">API Key</span>
                <span className="font-mono text-xs text-white">
                  {user.apiKey.slice(0, 8)}...{user.apiKey.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <GlowButton onClick={() => router.push('/')}>
              Go to Detection
            </GlowButton>
            {user.tier === 'FREE' && (
              <GlowButton variant="secondary">
                <Crown className="h-4 w-4" />
                <span>Upgrade to Premium</span>
              </GlowButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

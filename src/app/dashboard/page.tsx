"use client"

import { useAuth } from '@/src/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import GlowButton from '@/src/components/ui/GlowButton'
import Modal from '@/src/components/ui/Modal'
import { PremiumBadge } from '@/src/components/ui/PremiumBadge'
import { LogOut, Crown, Activity, Image as ImageIcon, BarChart3, Clock, Trash2 } from 'lucide-react'
import { hasFeatureSync } from '@/src/lib/features'

type DashboardSummary = {
  usage: {
    dailyUsed: number
    dailyLimit: number | null
    monthlyUsed: number
    monthlyLimit: number | null
  }
  trend: Array<{ date: string; count: number; avgScore: number | null }>
  recentDetections: Array<{
    id: string
    fileName: string
    score: number
    verdict: string
    createdAt: string
    modelUsed: string
  }>
  api: {
    callsLast24h: number
    callsLast7d: number
  }
}

export default function DashboardPage() {
  const { user, loading, signOut, refreshUser } = useAuth()
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [billingMessage, setBillingMessage] = useState<string | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const canViewAnalytics = hasFeatureSync(user?.tier ?? null, 'advanced_analytics')
  const isPremium = user?.tier === 'PREMIUM' || user?.tier === 'ENTERPRISE'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || !canViewAnalytics) return

    let isMounted = true
    const loadSummary = async () => {
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const response = await fetch('/api/dashboard/summary')
        if (!response.ok) {
          throw new Error('Failed to load summary')
        }
        const data = (await response.json()) as DashboardSummary
        if (isMounted) {
          setSummary(data)
        }
      } catch (error) {
        console.error('Dashboard summary error:', error)
        if (isMounted) {
          setSummaryError('Unable to load dashboard insights.')
        }
      } finally {
        if (isMounted) {
          setSummaryLoading(false)
        }
      }
    }

    loadSummary()
    return () => {
      isMounted = false
    }
  }, [user, canViewAnalytics])

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

  async function handleCancelPlan() {
    setBillingMessage(null)
    setBillingError(null)
    setBillingLoading(true)
    try {
      const response = await fetch('/api/billing/cancel', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Cancel failed')
      }
      setBillingMessage('Plan cancelled. Your account is now Free.')
      await refreshUser().catch(() => {})
    } catch (error) {
      console.error('Cancel plan failed:', error)
      setBillingError('Unable to cancel plan right now.')
    } finally {
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setPortalError(null)
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data?.error || 'Failed to open portal')
      }
      window.location.assign(data.url)
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      setPortalError('Unable to open billing portal right now.')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setBillingMessage(null)
    setBillingError(null)
    setAccountLoading(true)
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Delete account failed:', error)
      setBillingError('Unable to delete account right now.')
    } finally {
      setAccountLoading(false)
    }
  }

  const formatLimit = (value: number | null) =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : 'Unlimited'
  const formatUsagePercent = (used: number, limit: number | null) => {
    if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) return 0
    return Math.min(100, (used / limit) * 100)
  }
  const trendMax = summary?.trend.reduce((max, item) => Math.max(max, item.count), 1) ?? 1
  const lastDetectionAt = summary?.recentDetections[0]?.createdAt || user.lastDetectionAt

  const verdictLabel = (verdict: string) => {
    const normalized = verdict.toLowerCase()
    if (normalized.includes('ai')) return 'AI'
    if (normalized.includes('real')) return 'Real'
    return 'Uncertain'
  }
  const verdictStyle = (verdict: string) => {
    const normalized = verdict.toLowerCase()
    if (normalized.includes('ai')) return 'border-amber-400/40 bg-amber-400/10 text-amber-200'
    if (normalized.includes('real')) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
    return 'border-slate-400/40 bg-slate-400/10 text-slate-200'
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
            <p className="mt-2 text-3xl font-bold text-white">
              {canViewAnalytics ? user.totalDetections : '--'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {canViewAnalytics ? 'All-time count' : 'Premium analytics'}
            </p>
          </div>

          {/* Monthly Usage */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4">
              <Activity className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Monthly Usage</h3>
            <p className="mt-2 text-3xl font-bold text-white">
              {canViewAnalytics ? user.monthlyDetections : '--'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {canViewAnalytics ? 'This month' : 'Premium analytics'}
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Activity Trend</h2>
              </div>
              <span className="text-xs text-gray-400">Last 7 days</span>
            </div>
            {!canViewAnalytics ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
                Upgrade to Premium to unlock activity trends and analytics.
              </div>
            ) : summaryLoading ? (
              <div className="text-sm text-gray-500">Loading activity insights...</div>
            ) : summaryError ? (
              <div className="text-sm text-rose-300">{summaryError}</div>
            ) : summary ? (
              <div className="grid grid-cols-7 gap-3">
                {summary.trend.map((point) => {
                  const height = Math.max(8, Math.round((point.count / trendMax) * 64))
                  const date = new Date(`${point.date}T00:00:00Z`)
                  return (
                    <div key={point.date} className="flex flex-col items-center gap-2">
                      <div className="flex h-20 items-end">
                        <div
                          className="w-4 rounded-full bg-gradient-to-t from-purple-500/70 via-purple-400/40 to-purple-300/20"
                          style={{ height: `${height}px` }}
                        />
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-gray-400">
                        {date.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="text-[11px] text-gray-300">{point.count}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No activity data yet.</div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">Usage Overview</h2>
            </div>
            {!canViewAnalytics ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
                Premium plans include usage insights and API analytics.
              </div>
            ) : summaryLoading ? (
              <div className="text-sm text-gray-500">Loading usage...</div>
            ) : summary ? (
              <div className="space-y-5 text-sm">
                <div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Daily detections</span>
                    <span>
                      {summary.usage.dailyUsed} / {formatLimit(summary.usage.dailyLimit)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-200/40"
                      style={{ width: `${formatUsagePercent(summary.usage.dailyUsed, summary.usage.dailyLimit)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Monthly detections</span>
                    <span>
                      {summary.usage.monthlyUsed} / {formatLimit(summary.usage.monthlyLimit)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-400/70 to-purple-200/40"
                      style={{ width: `${formatUsagePercent(summary.usage.monthlyUsed, summary.usage.monthlyLimit)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">API calls</div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-200">
                    <span>Last 24h</span>
                    <span className="font-semibold">{summary.api.callsLast24h}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm text-gray-200">
                    <span>Last 7 days</span>
                    <span className="font-semibold">{summary.api.callsLast7d}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Last detection:{' '}
                  <span className="text-gray-200">
                    {lastDetectionAt
                      ? new Date(lastDetectionAt).toLocaleString()
                      : 'No detections yet'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No usage data yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-emerald-300" />
              <h2 className="text-lg font-semibold text-white">Recent Detections</h2>
            </div>
            <span className="text-xs text-gray-400">Latest 5</span>
          </div>
          {!canViewAnalytics ? (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
              Detection history is available on Premium plans.
            </div>
          ) : summaryLoading ? (
            <div className="text-sm text-gray-500">Loading detection history...</div>
          ) : summary && summary.recentDetections.length > 0 ? (
            <div className="space-y-3">
              {summary.recentDetections.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{item.fileName}</div>
                    <div className="mt-1 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString()} - {item.modelUsed}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${verdictStyle(item.verdict)}`}
                    >
                      {verdictLabel(item.verdict)}
                    </span>
                    <div className="text-sm font-semibold text-white">
                      {Math.round(item.score)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No detections yet.</div>
          )}
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
            {!isPremium && (
              <GlowButton variant="secondary" onClick={() => router.push('/pricing')}>
                <Crown className="h-4 w-4" />
                <span>Upgrade to Premium</span>
              </GlowButton>
            )}
          </div>
        </div>

        {/* Plan & Account */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Plan & Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Manage your subscription and account settings.
          </p>
          {billingMessage && (
            <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {billingMessage}
            </div>
          )}
          {billingError && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {billingError}
            </div>
          )}
          {portalError && (
            <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              {portalError}
            </div>
          )}
          <div className="mt-4 grid gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-gray-300 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Plan</p>
              <p className="text-white">
                {user.billingPlan
                  ? user.billingPlan.charAt(0).toUpperCase() + user.billingPlan.slice(1)
                  : user.tier}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Billing</p>
              <p className="text-white">
                {user.billingCycle
                  ? user.billingCycle === 'annual'
                    ? 'Annual'
                    : 'Monthly'
                  : 'Pay as you go'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Next billing</p>
              <p className="text-white">
                {user.stripeCurrentPeriodEnd
                  ? new Date(user.stripeCurrentPeriodEnd).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {isPremium ? (
              <GlowButton
                variant="secondary"
                onClick={() => setShowCancelDialog(true)}
                disabled={billingLoading}
              >
                {billingLoading ? 'Cancelling...' : 'Cancel Plan'}
              </GlowButton>
            ) : (
              <GlowButton variant="secondary" onClick={() => router.push('/pricing')}>
                <Crown className="h-4 w-4" />
                <span>View Premium Plans</span>
              </GlowButton>
            )}
            {isPremium && (
              <GlowButton variant="secondary" onClick={handleManageBilling} disabled={portalLoading}>
                {portalLoading ? 'Opening...' : 'Manage billing'}
              </GlowButton>
            )}
            <GlowButton
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={accountLoading}
              className="border border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>{accountLoading ? 'Deleting...' : 'Delete Account'}</span>
            </GlowButton>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="Cancel Premium"
      >
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Cancel your premium plan now? Your account will be downgraded to Free
            immediately.
          </p>
          <div className="flex flex-wrap gap-3">
            <GlowButton
              variant="secondary"
              onClick={async () => {
                await handleCancelPlan()
                setShowCancelDialog(false)
              }}
              disabled={billingLoading}
            >
              {billingLoading ? 'Cancelling...' : 'Confirm Cancel'}
            </GlowButton>
            <GlowButton variant="ghost" onClick={() => setShowCancelDialog(false)}>
              Keep Premium
            </GlowButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Account"
      >
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            This will permanently disable your account and remove access to all
            detection history. This action cannot be undone.
          </p>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            You will be signed out and lose access immediately.
          </div>
          <div className="flex flex-wrap gap-3">
            <GlowButton
              variant="ghost"
              className="border border-rose-500/30 text-rose-200 hover:bg-rose-500/10"
              onClick={async () => {
                await handleDeleteAccount()
                setShowDeleteDialog(false)
              }}
              disabled={accountLoading}
            >
              {accountLoading ? 'Deleting...' : 'Delete Account'}
            </GlowButton>
            <GlowButton variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Keep Account
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

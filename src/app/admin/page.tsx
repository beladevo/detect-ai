"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  AdminHeader,
  StatCard,
  ActivityFeed,
  SimpleChart,
  DonutChart,
} from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"

interface DashboardStats {
  totalUsers: number
  activeToday: number
  detectionsToday: number
  monthlyRevenue: number
  userGrowth: number
  detectionGrowth: number
  revenueGrowth: number
  verdictDistribution: {
    ai: number
    real: number
    uncertain: number
  }
  recentActivity: Array<{
    id: string
    type: "user_signup" | "detection" | "subscription" | "admin_action" | "security"
    title: string
    description: string
    timestamp: string
  }>
  detectionTrend: Array<{
    label: string
    value: number
  }>
  userTrend: Array<{
    label: string
    value: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    fetchDashboardStats()
  }, [timeRange])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/overview?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const mockStats: DashboardStats = {
    totalUsers: 12847,
    activeToday: 1234,
    detectionsToday: 45678,
    monthlyRevenue: 24500,
    userGrowth: 12.5,
    detectionGrowth: 23.4,
    revenueGrowth: 8.2,
    verdictDistribution: {
      ai: 15234,
      real: 28456,
      uncertain: 1988,
    },
    recentActivity: [
      { id: '1', type: 'user_signup', title: 'New user registered', description: 'john@example.com signed up', timestamp: new Date().toISOString() },
      { id: '2', type: 'detection', title: 'Detection completed', description: 'AI generated image detected', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: '3', type: 'subscription', title: 'New premium subscriber', description: 'jane@example.com upgraded to Premium', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: '4', type: 'security', title: 'Failed login attempt', description: '3 failed attempts from 192.168.1.1', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '5', type: 'admin_action', title: 'User locked', description: 'Admin locked user spam@test.com', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
    ],
    detectionTrend: [
      { label: 'Mon', value: 5200 },
      { label: 'Tue', value: 6100 },
      { label: 'Wed', value: 5800 },
      { label: 'Thu', value: 7200 },
      { label: 'Fri', value: 8100 },
      { label: 'Sat', value: 4500 },
      { label: 'Sun', value: 4200 },
    ],
    userTrend: [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 145 },
      { label: 'Wed', value: 132 },
      { label: 'Thu', value: 168 },
      { label: 'Fri', value: 189 },
      { label: 'Sat', value: 98 },
      { label: 'Sun', value: 85 },
    ],
  }

  const displayStats = stats || mockStats

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Dashboard"
        description="Overview of your platform metrics"
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/50 p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-brand-purple text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={displayStats.totalUsers}
            change={displayStats.userGrowth}
            variant="purple"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Active Today"
            value={displayStats.activeToday}
            variant="cyan"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            }
          />
          <StatCard
            title="Detections Today"
            value={displayStats.detectionsToday}
            change={displayStats.detectionGrowth}
            variant="pink"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${displayStats.monthlyRevenue.toLocaleString()}`}
            change={displayStats.revenueGrowth}
            variant="emerald"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Charts Row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Detection Trend */}
          <GlassCard className="p-6 lg:col-span-2" hover={false}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Detection Volume</h3>
                <p className="text-sm text-muted-foreground">Daily detection activity</p>
              </div>
            </div>
            <SimpleChart
              data={displayStats.detectionTrend}
              height={200}
              type="line"
              color="var(--brand-purple)"
            />
          </GlassCard>

          {/* Verdict Distribution */}
          <GlassCard className="p-6" hover={false}>
            <div className="mb-6">
              <h3 className="font-display text-lg font-semibold text-foreground">Verdict Distribution</h3>
              <p className="text-sm text-muted-foreground">Detection results breakdown</p>
            </div>
            <div className="flex flex-col items-center">
              <DonutChart
                data={[
                  { label: 'AI Generated', value: displayStats.verdictDistribution.ai, color: 'var(--brand-purple)' },
                  { label: 'Real', value: displayStats.verdictDistribution.real, color: 'var(--brand-cyan)' },
                  { label: 'Uncertain', value: displayStats.verdictDistribution.uncertain, color: 'var(--brand-pink)' },
                ]}
              />
              <div className="mt-4 grid w-full grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-purple" />
                    <span className="text-xs text-muted-foreground">AI</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{displayStats.verdictDistribution.ai.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-cyan" />
                    <span className="text-xs text-muted-foreground">Real</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{displayStats.verdictDistribution.real.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-brand-pink" />
                    <span className="text-xs text-muted-foreground">Uncertain</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{displayStats.verdictDistribution.uncertain.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* User Growth */}
          <GlassCard className="p-6" hover={false}>
            <div className="mb-6">
              <h3 className="font-display text-lg font-semibold text-foreground">User Growth</h3>
              <p className="text-sm text-muted-foreground">New registrations</p>
            </div>
            <SimpleChart
              data={displayStats.userTrend}
              height={160}
              type="bar"
              color="var(--brand-cyan)"
            />
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard className="p-6 lg:col-span-2" hover={false}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest platform events</p>
              </div>
              <a
                href="/admin/logs"
                className="text-sm font-medium text-brand-purple hover:underline"
              >
                View all
              </a>
            </div>
            <ActivityFeed activities={displayStats.recentActivity} maxItems={5} />
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Quick Actions</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/admin/users"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Add User</p>
                  <p className="text-xs text-muted-foreground">Create new account</p>
                </div>
              </a>
              <a
                href="/admin/settings"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Settings</p>
                  <p className="text-xs text-muted-foreground">Configure platform</p>
                </div>
              </a>
              <a
                href="/admin/waitlist"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Waitlist</p>
                  <p className="text-xs text-muted-foreground">Manage signups</p>
                </div>
              </a>
              <a
                href="/admin/reports"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Reports</p>
                  <p className="text-xs text-muted-foreground">View analytics</p>
                </div>
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

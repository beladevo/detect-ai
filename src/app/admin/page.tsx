import { Activity, FileText, Settings, ShieldCheck } from "lucide-react"
import AuroraBackground from "@/src/components/ui/AuroraBackground"
import GlassCard from "@/src/components/ui/GlassCard"
import { BorderBeam } from "@/src/components/ui/BorderBeam"
import AdminNavButton from "@/src/components/AdminNavButton"
import { ActivityFeed, SimpleChart, StatCard } from "@/src/components/admin"
import { getAdminAnalyticsOverview } from "@/src/lib/admin/analytics"

export const metadata = {
  title: "Admin",
  description: "Operations hub for reviewing logs and tuning Imagion settings.",
}

const sections = [
  {
    title: "Audit logs",
    description: "Browse auth, billing, and detection logs with filters for severity and timeframe.",
    icon: Activity,
    href: "/admin/logs",
    action: "Review logs",
    glow: "cyan",
  },
  {
    title: "Global settings",
    description: "Adjust feature flags, API credentials, and billing controls for all users.",
    icon: Settings,
    href: "/admin/settings",
    action: "Open settings",
    glow: "purple",
  },
  {
    title: "Security checks",
    description: "Monitor rate limit feedback, telemetry spikes, and blocked domains.",
    icon: ShieldCheck,
    href: "/admin/settings#security",
    action: "Inspect security",
    glow: "pink",
  },
]

export default async function AdminPage() {
  const analytics = await getAdminAnalyticsOverview("7d")

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  const statCards = [
    {
      title: "Live detections",
      value: analytics.detectionsToday,
      change: analytics.detectionGrowth,
      changeLabel: "vs previous period",
      variant: "purple" as const,
    },
    {
      title: "Active users today",
      value: analytics.activeToday,
      change: analytics.userGrowth,
      changeLabel: "vs previous period",
      variant: "emerald" as const,
    },
    {
      title: "Total users",
      value: analytics.totalUsers,
      variant: "cyan" as const,
    },
    {
      title: "Monthly recurring revenue",
      value: formatCurrency(analytics.monthlyRevenue),
      change: analytics.revenueGrowth,
      changeLabel: "vs previous period",
      variant: "cyan" as const,
    },
  ]

  const verdictSummary = [
    { label: "AI generated", value: analytics.verdictDistribution.ai },
    { label: "Real", value: analytics.verdictDistribution.real },
    { label: "Uncertain", value: analytics.verdictDistribution.uncertain },
  ]

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <AuroraBackground className="min-h-screen">
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
          <GlassCard hover={false} glow="purple" className="border-border/80 bg-gradient-to-br from-card/90 via-card/60 to-transparent p-10">
            <BorderBeam className="pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Admin</p>
                  <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Imagion operations <span className="text-gradient-purple">command</span>
                  </h1>
                </div>
                <AdminNavButton href="/admin/settings" variant="primary" size="md">
                  Manage workspace
                </AdminNavButton>
              </div>

              <p className="max-w-2xl text-base text-slate-300">
                Everything you need to triage detections, revisit security signals, and steer Imagion's services from a single console.
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                  <StatCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    change={card.change}
                    changeLabel={card.changeLabel}
                    variant={card.variant}
                  />
                ))}
              </div>
            </div>
          </GlassCard>

          <section className="grid gap-6 md:grid-cols-3">
            {sections.map((section) => (
              <GlassCard
                key={section.title}
                glow={section.glow as Parameters<typeof GlassCard>[0]["glow"]}
                className="p-6"
              >
                <div className="relative flex h-full flex-col gap-5">
                  <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-slate-400">
                    <section.icon className="h-5 w-5 text-white/70" />
                    <span>Section</span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                    <p className="text-sm text-slate-300">{section.description}</p>
                  </div>
                  <span className="mt-auto">
                    <AdminNavButton href={section.href} variant="secondary" size="md" className="px-5">
                      {section.action}
                      <FileText className="h-4 w-4" />
                    </AdminNavButton>
                  </span>
                </div>
              </GlassCard>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6" hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Detection trend</p>
                  <h3 className="text-2xl font-semibold text-white">Last 7 days</h3>
                  <p className="text-xs text-muted-foreground">
                    {analytics.billing.activeSubscriptions.toLocaleString()} active subscriptions · {analytics.billing.newSubscriptions.toLocaleString()} new this period
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Updated in real time</span>
              </div>
              <div className="mt-6">
                <SimpleChart data={analytics.detectionTrend} height={200} type="line" color="var(--brand-purple)" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {verdictSummary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/50 bg-card/30 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6" hover={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Telemetry</p>
                  <h3 className="text-2xl font-semibold text-white">Recent activity</h3>
                  <p className="text-sm text-muted-foreground">Captured from the most recent user and detection events.</p>
                </div>
                <AdminNavButton href="/admin/logs" variant="ghost" size="md" className="mt-2 lg:mt-0">
                  View telemetry log
                  <Activity className="h-4 w-4" />
                </AdminNavButton>
              </div>
              <div className="mt-6">
                <ActivityFeed activities={analytics.recentActivity} maxItems={5} />
              </div>
            </GlassCard>
          </div>
        </div>
      </AuroraBackground>
    </main>
  )
}

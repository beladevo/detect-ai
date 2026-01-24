"use client"

import { useMemo } from "react"
import { AdminHeader, SimpleChart } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"

const productivityData = [
  { label: "Week 1", value: 120 },
  { label: "Week 2", value: 150 },
  { label: "Week 3", value: 175 },
  { label: "Week 4", value: 200 },
]

const detectionAccuracy = [
  { label: "AI-generated", value: 64 },
  { label: "Real", value: 28 },
  { label: "Uncertain", value: 8 },
]

const userGeography = [
  { region: "North America", value: 52 },
  { region: "EMEA", value: 28 },
  { region: "APAC", value: 16 },
  { region: "LATAM", value: 4 },
]

export default function AdminReportsPage() {
  const totalDetections = useMemo(() => detectionAccuracy.reduce((sum, item) => sum + item.value, 0), [])

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Reports"
        description="Pre-built analytics and exports"
        actions={
          <GlowButton variant="ghost" size="sm" onClick={() => window.open("/admin/reports", "_self")}>
            Export PDF
          </GlowButton>
        }
      />

      <div className="p-6 space-y-6">
        {/* Overview stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "User Growth", value: "+18%", helper: "vs last month" },
            { label: "Detection Volume", value: "48k", helper: "+3% MoM" },
            { label: "Revenue", value: "$120k", helper: "MRR" },
            { label: "API Uptime", value: "99.95%", helper: "last 30 days" },
            { label: "Average Resolution", value: "2h 12m", helper: "security alerts" },
            { label: "Compliance Requests", value: "4", helper: "pending" },
          ].map((item) => (
            <GlassCard key={item.label} className="p-4" hover={false}>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.helper}</p>
            </GlassCard>
          ))}
        </div>

        {/* Detection analytics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Detection Volume</h3>
                <p className="text-sm text-muted-foreground">Weekly trend</p>
              </div>
              <GlowButton variant="ghost" size="sm">
                Refresh
              </GlowButton>
            </div>
            <SimpleChart data={productivityData} height={220} type="line" color="var(--brand-cyan)" />
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <h3 className="font-display text-lg font-semibold text-foreground">Accuracy Breakdown</h3>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
            <div className="mt-4 space-y-3">
              {detectionAccuracy.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                    <span className="text-xs text-muted-foreground">
                      {((item.value / totalDetections) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Reports list */}
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Revenue Report</h3>
                <p className="text-sm text-muted-foreground">By plan</p>
              </div>
              <GlowButton variant="secondary" size="sm">
                Export
              </GlowButton>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              <li>Premium: $92k MRR</li>
              <li>Enterprise: $28k MRR</li>
              <li>Churn: 2.1%</li>
              <li>ARPU: $79</li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">User Growth</h3>
                <p className="text-sm text-muted-foreground">Retention + churn</p>
              </div>
              <GlowButton variant="secondary" size="sm">
                View chart
              </GlowButton>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Retention 74%, churn 5.4%, net new users 1,340.
            </p>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <h3 className="font-display text-lg font-semibold text-foreground">Geographic Reach</h3>
            <p className="text-sm text-muted-foreground">Share of volume</p>
            <div className="mt-4 space-y-3 text-sm text-foreground">
              {userGeography.map((region) => (
                <div key={region.region} className="flex items-center justify-between">
                  <span>{region.region}</span>
                  <span>{region.value}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick actions */}
        <GlassCard className="p-6" hover={false}>
          <div className="flex flex-wrap items-center gap-3">
            <GlowButton variant="secondary">Create custom report</GlowButton>
            <GlowButton variant="ghost">Schedule exports</GlowButton>
            <GlowButton variant="ghost">Share with finance</GlowButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

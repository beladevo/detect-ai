"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AdminHeader, DataTable, Badge, Column } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"

type SeverityBreakdown = {
  severity: string
  count: number
}

type SecurityAlertRow = Record<string, unknown> & {
  id: string
  type: string
  severity: string
  ipAddress: string | null
  userEmail: string | null
  details: string
  createdAt: string
  resolved: boolean
  resolvedAt: string | null
}

type SecuritySummary = {
  total: number
  resolved: number
  unresolved: number
  severityBreakdown: SeverityBreakdown[]
}

export default function AdminSecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlertRow[]>([])
  const [summary, setSummary] = useState<SecuritySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [resolutionFilter, setResolutionFilter] = useState("all")
  const [resolving, setResolving] = useState<string | null>(null)

  const severityOptions = useMemo(
    () => ["all", "critical", "high", "medium", "low"],
    []
  )

  const resolvedLabel = (resolved: boolean) => (resolved ? "Resolved" : "Open")

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      if (severityFilter !== "all") {
        params.set("severity", severityFilter)
      }
      if (resolutionFilter !== "all") {
        params.set("resolved", resolutionFilter === "resolved" ? "true" : "false")
      }

      const response = await fetch(`/api/admin/security/alerts?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to load security alerts")
      }
      const data = await response.json()
      setAlerts(data.alerts)
      setSummary(data.summary)
      setPage(data.page)
    } catch (error) {
      console.error("Security alerts error:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, severityFilter, resolutionFilter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleResolve = async (alertId: string) => {
    setResolving(alertId)
    try {
      const response = await fetch(`/api/admin/security/alerts/${alertId}`, {
        method: "PATCH",
      })
      if (!response.ok) {
        throw new Error("Failed to resolve alert")
      }
      await fetchAlerts()
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    } finally {
      setResolving(null)
    }
  }

  const severityBadgeVariant = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "error"
      case "high":
        return "warning"
      case "medium":
        return "info"
      default:
        return "default"
    }
  }

  const columns: Column<SecurityAlertRow>[] = [
    {
      key: "createdAt",
      label: "Time",
      render: (alert) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(alert.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (alert) => (
        <span className="text-sm text-foreground">{alert.type}</span>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      render: (alert) => (
        <Badge variant={severityBadgeVariant(alert.severity)}>
          {alert.severity.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "userEmail",
      label: "User / IP",
      render: (alert) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-foreground">{alert.userEmail || "—"}</span>
          <span className="text-xs text-muted-foreground">{alert.ipAddress || "unknown IP"}</span>
        </div>
      ),
    },
    {
      key: "details",
      label: "Details",
      className: "max-w-lg",
      render: (alert) => (
        <p className="truncate text-sm text-foreground">{alert.details}</p>
      ),
    },
    {
      key: "resolved",
      label: "Status",
      render: (alert) => (
        <div className="flex flex-col gap-2 text-sm">
          <Badge variant={alert.resolved ? "success" : "warning"}>
            {resolvedLabel(alert.resolved)}
          </Badge>
          {!alert.resolved && (
            <GlowButton
              size="sm"
              variant="secondary"
              onClick={() => handleResolve(alert.id)}
              disabled={resolving === alert.id}
            >
              {resolving === alert.id ? "Resolving…" : "Mark Resolved"}
            </GlowButton>
          )}
        </div>
      ),
    },
  ]

  const summaryCards = [
    {
      label: "Open alerts",
      value: summary ? summary.unresolved : "—",
      description: "Requires investigation",
    },
    {
      label: "Resolved alerts",
      value: summary ? summary.resolved : "—",
      description: "Issues that have been addressed",
    },
    {
      label: "Total alerts",
      value: summary ? summary.total : "—",
      description: "Aggregated from the database",
    },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Security"
        description="Monitor security alerts and access controls"
      />

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <GlassCard key={card.label} className="p-5" hover={false}>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mt-6 p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid gap-1 text-xs uppercase tracking-[0.3em] text-gray-500">
              <span>Filters</span>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All severities" : option}
                </option>
              ))}
            </select>
            <select
              value={resolutionFilter}
              onChange={(e) => setResolutionFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Open</option>
            </select>
            <GlowButton variant="ghost" size="sm" onClick={() => fetchAlerts()}>
              Refresh
            </GlowButton>
          </div>
        </GlassCard>

        <GlassCard className="mt-6 p-4" hover={false}>
          <DataTable<SecurityAlertRow>
            columns={columns}
            data={alerts}
            keyField="id"
            loading={loading}
            pagination={{
              page,
              pageSize,
              total: summary?.total ?? 0,
              onPageChange: setPage,
            }}
            emptyMessage="No security alerts found"
          />
        </GlassCard>

        {summary?.severityBreakdown && summary.severityBreakdown.length > 0 && (
          <GlassCard className="mt-6 p-6" hover={false}>
            <h3 className="text-lg font-semibold text-foreground">Severity breakdown</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {summary.severityBreakdown.map((item) => (
                <div key={item.severity} className="rounded-xl border border-border bg-card/30 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{item.severity}</p>
                  <p className="text-2xl font-semibold text-foreground">{item.count.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

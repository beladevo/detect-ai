"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminHeader, DataTable, Badge, Column } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"

interface LogEntry {
  id: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  message: string
  source: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface AuditLogEntry {
  id: string
  adminId: string
  adminEmail?: string
  action: string
  targetType: string
  targetId: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

type TabType = "system" | "audit" | "api" | "errors"

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("system")
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(50)

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("24h")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        dateRange: dateFilter,
      })
      if (levelFilter !== "all") params.set("level", levelFilter)

      if (activeTab === "system") {
        const response = await fetch(`/api/admin/logs/system?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSystemLogs(data.logs)
          setTotal(data.total)
        }
      } else if (activeTab === "audit") {
        const response = await fetch(`/api/admin/logs/audit?${params}`)
        if (response.ok) {
          const data = await response.json()
          setAuditLogs(data.logs)
          setTotal(data.total)
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, pageSize, levelFilter, dateFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [activeTab, levelFilter, dateFilter])

  const getLevelBadge = (level: LogEntry["level"]) => {
    const config = {
      DEBUG: { variant: "default" as const },
      INFO: { variant: "info" as const },
      WARN: { variant: "warning" as const },
      ERROR: { variant: "error" as const },
    }
    return <Badge variant={config[level].variant}>{level}</Badge>
  }

  const systemColumns: Column<LogEntry>[] = [
    {
      key: "createdAt",
      label: "Time",
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "level",
      label: "Level",
      render: (log) => getLevelBadge(log.level),
    },
    {
      key: "source",
      label: "Source",
      render: (log) => (
        <span className="font-mono text-xs text-foreground">{log.source}</span>
      ),
    },
    {
      key: "message",
      label: "Message",
      className: "max-w-md",
      render: (log) => (
        <p className="truncate text-sm text-foreground">{log.message}</p>
      ),
    },
  ]

  const auditColumns: Column<AuditLogEntry>[] = [
    {
      key: "createdAt",
      label: "Time",
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "adminEmail",
      label: "Admin",
      render: (log) => (
        <span className="text-sm text-foreground">{log.adminEmail || log.adminId}</span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (log) => (
        <Badge variant="purple">{log.action.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "targetType",
      label: "Target",
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {log.targetType}: {log.targetId.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP",
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.ipAddress || "-"}
        </span>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Logs"
        description="System and audit logs"
        actions={
          <GlowButton variant="ghost" size="sm" onClick={() => fetchLogs()}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </GlowButton>
        }
      />

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card/30 p-1">
          {([
            { key: "system", label: "System Logs" },
            { key: "audit", label: "Audit Trail" },
            { key: "api", label: "API Logs", href: "/admin/logs/api" },
            { key: "errors", label: "Errors", href: "/admin/logs/errors" },
          ] as const).map((tab) => (
            tab.href ? (
              <a
                key={tab.key}
                href={tab.href}
                className="flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {tab.label}
              </a>
            ) : (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand-purple text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            )
          ))}
        </div>

        {/* Filters */}
        <GlassCard className="mb-6 p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-4">
            {activeTab === "system" && (
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value="DEBUG">Debug</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            )}

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <div className="ml-auto text-sm text-muted-foreground">
              {total.toLocaleString()} entries
            </div>
          </div>
        </GlassCard>

        {/* Logs Table */}
        {activeTab === "system" && (
          <DataTable
            columns={systemColumns}
            data={systemLogs}
            keyField="id"
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
            }}
            emptyMessage="No logs found"
          />
        )}

        {activeTab === "audit" && (
          <DataTable
            columns={auditColumns}
            data={auditLogs}
            keyField="id"
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
            }}
            emptyMessage="No audit logs found"
          />
        )}

        {/* Info Card */}
        <GlassCard className="mt-6 p-6" hover={false}>
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Log Retention</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/30 p-4">
              <p className="text-sm text-muted-foreground">System Logs</p>
              <p className="text-lg font-semibold text-foreground">30 days</p>
            </div>
            <div className="rounded-xl border border-border bg-card/30 p-4">
              <p className="text-sm text-muted-foreground">Audit Logs</p>
              <p className="text-lg font-semibold text-foreground">1 year</p>
            </div>
            <div className="rounded-xl border border-border bg-card/30 p-4">
              <p className="text-sm text-muted-foreground">API Logs</p>
              <p className="text-lg font-semibold text-foreground">90 days</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

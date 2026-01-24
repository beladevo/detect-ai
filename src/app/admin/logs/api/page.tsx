"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminHeader, DataTable, Badge, SimpleChart, Column } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"

interface ApiLogEntry {
  id: string
  userId: string | null
  userEmail?: string
  endpoint: string
  method: string
  statusCode: number
  ipAddress: string | null
  userAgent: string | null
  responseTime?: number
  createdAt: string
}

interface ApiStats {
  totalRequests: number
  successRate: number
  avgResponseTime: number
  requestsByEndpoint: Array<{ endpoint: string; count: number }>
  requestsTrend: Array<{ label: string; value: number }>
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ApiLogEntry[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(50)

  // Filters
  const [endpointFilter, setEndpointFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("24h")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        dateRange: dateFilter,
      })
      if (endpointFilter !== "all") params.set("endpoint", endpointFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)

      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/logs/api?${params}`),
        fetch(`/api/admin/logs/api/stats?dateRange=${dateFilter}`),
      ])

      if (logsResponse.ok) {
        const data = await logsResponse.json()
        setLogs(data.logs)
        setTotal(data.total)
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch API logs:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, endpointFilter, statusFilter, dateFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="success">{statusCode}</Badge>
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="warning">{statusCode}</Badge>
    } else if (statusCode >= 500) {
      return <Badge variant="error">{statusCode}</Badge>
    }
    return <Badge variant="default">{statusCode}</Badge>
  }

  const getMethodBadge = (method: string) => {
    const variants: Record<string, "success" | "info" | "warning" | "error" | "purple"> = {
      GET: "info",
      POST: "success",
      PUT: "warning",
      PATCH: "purple",
      DELETE: "error",
    }
    return <Badge variant={variants[method] || "default"}>{method}</Badge>
  }

  const columns: Column<ApiLogEntry>[] = [
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
      key: "method",
      label: "Method",
      render: (log) => getMethodBadge(log.method),
    },
    {
      key: "endpoint",
      label: "Endpoint",
      render: (log) => (
        <span className="font-mono text-xs text-foreground">{log.endpoint}</span>
      ),
    },
    {
      key: "statusCode",
      label: "Status",
      render: (log) => getStatusBadge(log.statusCode),
    },
    {
      key: "responseTime",
      label: "Duration",
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {log.responseTime ? `${log.responseTime}ms` : "-"}
        </span>
      ),
    },
    {
      key: "userEmail",
      label: "User",
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {log.userEmail || "Anonymous"}
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

  // Mock stats for display
  const displayStats: ApiStats = stats || {
    totalRequests: 125847,
    successRate: 98.5,
    avgResponseTime: 245,
    requestsByEndpoint: [
      { endpoint: "/api/detect", count: 45000 },
      { endpoint: "/api/auth/session", count: 32000 },
      { endpoint: "/api/auth/login", count: 8500 },
      { endpoint: "/api/users/me", count: 15000 },
    ],
    requestsTrend: [
      { label: "Mon", value: 15000 },
      { label: "Tue", value: 18000 },
      { label: "Wed", value: 17500 },
      { label: "Thu", value: 21000 },
      { label: "Fri", value: 23000 },
      { label: "Sat", value: 12000 },
      { label: "Sun", value: 11000 },
    ],
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="API Logs"
        description="Monitor API request activity"
        actions={
          <GlowButton variant="ghost" size="sm" onClick={() => window.location.href = "/admin/logs"}>
            Back to Logs
          </GlowButton>
        }
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayStats.totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">
                  {displayStats.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayStats.avgResponseTime}ms
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Request Volume</h3>
            <SimpleChart
              data={displayStats.requestsTrend}
              height={180}
              type="line"
              color="var(--brand-purple)"
            />
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Top Endpoints</h3>
            <div className="space-y-3">
              {displayStats.requestsByEndpoint.map((item) => (
                <div key={item.endpoint} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{item.endpoint}</span>
                  <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6 p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All Endpoints</option>
              <option value="/api/detect">/api/detect</option>
              <option value="/api/auth">/api/auth/*</option>
              <option value="/api/users">/api/users/*</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>

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
          </div>
        </GlassCard>

        {/* Logs Table */}
        <DataTable
          columns={columns}
          data={logs}
          keyField="id"
          loading={loading}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
          emptyMessage="No API logs found"
        />
      </div>
    </div>
  )
}

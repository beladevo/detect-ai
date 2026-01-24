 "use client"

import { useEffect, useMemo, useState } from "react"
import { AdminHeader, DataTable, Column, SimpleChart, Badge } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import Badge from "@/src/components/admin/Badge"

type DetectionRow = {
  id: string
  verdict: string
  status: string
  score: number
  confidence: number
  createdAt: string
  modelUsed: string
  user: {
    id: string
    email: string
    name: string | null
  } | null
}

type DetectionResponse = {
  detections: DetectionRow[]
  total: number
  page: number
  pageSize: number
  trend: Array<{ label: string; value: number }>
  statusBreakdown: Array<{ status: string; count: number }>
  verdictBreakdown: Array<{ verdict: string; count: number }>
}

export default function AdminDetectionsPage() {
  const [detections, setDetections] = useState<DetectionRow[]>([])
  const [trend, setTrend] = useState<DetectionResponse["trend"]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<
    DetectionResponse["statusBreakdown"]
  >([])
  const [verdictBreakdown, setVerdictBreakdown] = useState<
    DetectionResponse["verdictBreakdown"]
  >([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [verdictFilter, setVerdictFilter] = useState("")

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    })
    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    }
    if (verdictFilter) {
      params.set("verdict", verdictFilter)
    }

    fetch(`/api/admin/detections?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load detections")
        }
        return res.json()
      })
      .then((data: DetectionResponse) => {
        if (!isMounted) return
        setDetections(data.detections)
        setTotal(data.total)
        setTrend(data.trend)
        setStatusBreakdown(data.statusBreakdown)
        setVerdictBreakdown(data.verdictBreakdown)
        setPage(data.page)
      })
      .catch((error) => {
        console.error("Failed to fetch detections:", error)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [page, pageSize, statusFilter, verdictFilter])

  const columns: Column<DetectionRow>[] = [
    {
      key: "createdAt",
      label: "Time",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (row) => (
        <span className="text-sm text-foreground">
          {row.user?.email || "Anonymous"}{' '}
          {row.user?.name ? `(${row.user.name})` : ''}
        </span>
      ),
    },
    {
      key: "modelUsed",
      label: "Model",
      render: (row) => <span className="text-sm text-muted-foreground">{row.modelUsed}</span>,
    },
    {
      key: "score",
      label: "Score",
      render: (row) => (
        <span className="text-sm font-semibold text-foreground">{Math.round(row.score)}%</span>
      ),
    },
    {
      key: "confidence",
      label: "Confidence",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{(row.confidence * 100).toFixed(1)}%</span>
      ),
    },
    {
      key: "verdict",
      label: "Verdict",
      render: (row) => (
        <Badge variant={row.verdict.includes("AI") ? "purple" : "cyan"}>{row.verdict}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "COMPLETED" ? "success" : row.status === "FAILED" ? "error" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
  ]

  const statusButtons = [
    { label: "All", value: "all" },
    { label: "Pending", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Failed", value: "FAILED" },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Detections"
        description="View recent detection runs and their verdicts"
        actions={
          <GlowButton variant="ghost" size="sm">
            Export CSV
          </GlowButton>
        }
      />

      <div className="p-6 space-y-6">
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {statusButtons.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                    statusFilter === item.value
                      ? "bg-brand-purple text-white"
                      : "border border-white/10 text-muted-foreground hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Filter verdict"
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="ml-auto rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <div className="grid gap-4 lg:grid-cols-3">
            {statusBreakdown.map((item) => (
              <div key={item.status}>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{item.status}</p>
                <p className="text-2xl font-semibold text-foreground">{item.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <SimpleChart data={trend} height={200} type="line" color="var(--brand-purple)" />
        </GlassCard>

        <GlassCard className="p-4" hover={false}>
          <DataTable
            columns={columns}
            data={detections}
            keyField="id"
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
            }}
            emptyMessage="No detections found"
          />
        </GlassCard>
      </div>
    </div>
  )
}

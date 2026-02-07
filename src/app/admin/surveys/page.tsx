"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AdminHeader,
  StatCard,
  SimpleChart,
  DataTable,
  Badge,
  Column,
  DonutChart,
} from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"

interface SurveyEntry extends Record<string, unknown> {
  id: string
  response: "YEAH_SURE" | "NOT_REALLY" | "MAYBE"
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface SurveyData {
  entries: SurveyEntry[]
  total: number
  page: number
  pageSize: number
  stats: {
    total: number
    yeahSure: number
    notReally: number
    maybe: number
  }
  percentages: {
    yeahSure: number
    notReally: number
    maybe: number
  }
  trend: { label: string; value: number }[]
}

export default function SurveysPage() {
  const [data, setData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [range, setRange] = useState<"7d" | "30d">("7d")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        range,
      })
      const response = await fetch(`/api/admin/surveys?${params}`)
      if (response.ok) {
        const json: SurveyData = await response.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch survey data:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, range])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getResponseBadge = (response: SurveyEntry["response"]) => {
    const config = {
      YEAH_SURE: { variant: "success" as const, label: "Yeah sure!" },
      NOT_REALLY: { variant: "default" as const, label: "Not really" },
      MAYBE: { variant: "warning" as const, label: "Maybe" },
    }
    const { variant, label } = config[response]
    return (
      <Badge variant={variant} dot>
        {label}
      </Badge>
    )
  }

  const columns: Column<SurveyEntry>[] = [
    {
      key: "response",
      label: "Response",
      sortable: true,
      render: (entry) => getResponseBadge(entry.response),
    },
    {
      key: "userId",
      label: "User",
      render: (entry) => (
        <span className="text-muted-foreground">
          {entry.userId ? entry.userId.slice(0, 8) + "..." : "Anonymous"}
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (entry) => (
        <span className="font-mono text-xs text-muted-foreground">
          {entry.ipAddress || "-"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (entry) => (
        <span className="text-muted-foreground">
          {new Date(entry.createdAt).toLocaleDateString()}{" "}
          {new Date(entry.createdAt).toLocaleTimeString()}
        </span>
      ),
    },
  ]

  const donutData = data
    ? [
        {
          label: "Yeah sure!",
          value: data.stats.yeahSure,
          color: "var(--brand-mint, #10b981)",
        },
        {
          label: "Maybe",
          value: data.stats.maybe,
          color: "var(--brand-purple, #8b5cf6)",
        },
        {
          label: "Not really",
          value: data.stats.notReally,
          color: "var(--brand-pink, #ec4899)",
        },
      ]
    : []

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Pricing Survey"
        description={`${data?.total.toLocaleString() || 0} total responses`}
        actions={
          <div className="flex items-center gap-2">
            <GlowButton
              variant={range === "7d" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRange("7d")}
            >
              7 Days
            </GlowButton>
            <GlowButton
              variant={range === "30d" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRange("30d")}
            >
              30 Days
            </GlowButton>
          </div>
        }
      />

      <div className="p-6">
        {/* Stat Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <StatCard
            title="Total Responses"
            value={data?.stats.total || 0}
            variant="purple"
          />
          <StatCard
            title="Yeah sure!"
            value={`${data?.stats.yeahSure || 0} (${data?.percentages.yeahSure || 0}%)`}
            variant="emerald"
          />
          <StatCard
            title="Maybe"
            value={`${data?.stats.maybe || 0} (${data?.percentages.maybe || 0}%)`}
            variant="cyan"
          />
          <StatCard
            title="Not really"
            value={`${data?.stats.notReally || 0} (${data?.percentages.notReally || 0}%)`}
            variant="pink"
          />
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Response Trend
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Last {range === "7d" ? "7" : "30"} days
            </h3>
            <div className="mt-4">
              {data?.trend && (
                <SimpleChart
                  data={data.trend}
                  height={200}
                  type="line"
                  color="var(--brand-purple)"
                />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Distribution
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Response breakdown
            </h3>
            <div className="mt-4 flex items-center justify-center">
              {data && (
                <DonutChart data={donutData} size={180} strokeWidth={28} />
              )}
            </div>
            <div className="mt-4 flex justify-center gap-4">
              {donutData.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.label}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Recent Responses Table */}
        <DataTable<SurveyEntry>
          columns={columns}
          data={data?.entries || []}
          keyField="id"
          loading={loading}
          pagination={{
            page,
            pageSize,
            total: data?.total || 0,
            onPageChange: setPage,
          }}
          emptyMessage="No survey responses yet"
        />
      </div>
    </div>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { withAdminAuth } from "@/src/lib/auth"

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const range = searchParams.get("range") || "7d"

    const days = range === "30d" ? 30 : 7
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [entries, total, responseCounts, trend] = await Promise.all([
      // Recent responses (paginated)
      prisma.pricingSurvey.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),

      // Total count
      prisma.pricingSurvey.count(),

      // Breakdown by response type
      prisma.pricingSurvey.groupBy({
        by: ["response"],
        _count: true,
      }),

      // Daily trend within range
      generateSurveyTrend(days),
    ])

    const stats = {
      total,
      yeahSure:
        responseCounts.find((r) => r.response === "YEAH_SURE")?._count || 0,
      notReally:
        responseCounts.find((r) => r.response === "NOT_REALLY")?._count || 0,
      maybe: responseCounts.find((r) => r.response === "MAYBE")?._count || 0,
    }

    // Calculate percentages
    const percentages = {
      yeahSure: total > 0 ? Math.round((stats.yeahSure / total) * 100) : 0,
      notReally: total > 0 ? Math.round((stats.notReally / total) * 100) : 0,
      maybe: total > 0 ? Math.round((stats.maybe / total) * 100) : 0,
    }

    return NextResponse.json({
      entries,
      total,
      page,
      pageSize,
      stats,
      percentages,
      trend,
    })
  })
}

async function generateSurveyTrend(days: number) {
  const trend: { label: string; value: number }[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const count = await prisma.pricingSurvey.count({
      where: {
        createdAt: { gte: date, lt: nextDate },
      },
    })

    trend.push({
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    })
  }

  return trend
}

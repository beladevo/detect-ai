import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/src/lib/prisma"
import { withAdminAuth } from "@/src/lib/auth"

type DateRangeOption = "1h" | "24h" | "7d" | "30d"
type BucketUnit = "minute" | "hour" | "day"

const DATE_RANGES: DateRangeOption[] = ["1h", "24h", "7d", "30d"]
const DEFAULT_DATE_RANGE: DateRangeOption = "24h"

function getStartDate(range: DateRangeOption): Date {
  const now = new Date()
  switch (range) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000)
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }
}

function getBucketUnit(range: DateRangeOption): BucketUnit {
  if (range === "1h") {
    return "minute"
  }

  if (range === "24h") {
    return "hour"
  }

  return "day"
}

function formatBucketLabel(date: Date, unit: BucketUnit) {
  if (unit === "minute") {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  if (unit === "hour") {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
    }).format(date)
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date)
}

const formatAsDateRange = (value: string | null): DateRangeOption => {
  if (value && DATE_RANGES.includes(value as DateRangeOption)) {
    return value as DateRangeOption
  }

  return DEFAULT_DATE_RANGE
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_admin) => {
    const searchParams = request.nextUrl.searchParams
    const dateRange = formatAsDateRange(searchParams.get("dateRange"))
    const startDate = getStartDate(dateRange)

    const baseWhere = { createdAt: { gte: startDate } }

    const [totalRequests, successRequests] = await Promise.all([
      prisma.usageLog.count({ where: baseWhere }),
      prisma.usageLog.count({
        where: {
          ...baseWhere,
          statusCode: { gte: 200, lt: 300 },
        },
      }),
    ])

    const endpoints = await prisma.usageLog.groupBy({
      by: ["endpoint"],
      where: baseWhere,
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: "desc" } },
      take: 5,
    })

    const bucketUnit = getBucketUnit(dateRange)
    const trendRows = await prisma.$queryRaw<
      { bucket: Date; count: bigint }[]
    >(
      Prisma.sql`
        SELECT date_trunc(${Prisma.raw(bucketUnit)}) AS bucket, COUNT(*) AS count
        FROM "UsageLog"
        WHERE "createdAt" >= ${startDate}
        GROUP BY bucket
        ORDER BY bucket ASC
      `
    )

    const detectionAggregate = await prisma.detection.aggregate({
      _avg: { processingTime: true },
      where: {
        createdAt: { gte: startDate },
        processingTime: { not: null },
      },
    })

    const avgResponseTime = detectionAggregate._avg.processingTime
      ? Math.round(detectionAggregate._avg.processingTime)
      : 0

    const total = totalRequests || 0
    const success = successRequests || 0
    const successRate = total === 0 ? 0 : (success / total) * 100

    return NextResponse.json({
      totalRequests: total,
      successRate,
      avgResponseTime,
      requestsByEndpoint: endpoints.map((row) => ({
        endpoint: row.endpoint,
        count: Number(row._count.endpoint),
      })),
      requestsTrend: trendRows.map((row) => ({
        label: formatBucketLabel(new Date(row.bucket), bucketUnit),
        value: Number(row.count),
      })),
    })
  })
}

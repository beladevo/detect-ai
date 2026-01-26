import { NextRequest, NextResponse } from "next/server"
import { Prisma, type ServerLogLevel } from "@prisma/client"
import { prisma } from "@/src/lib/prisma"
import { withAdminAuth } from "@/src/lib/auth"

const LEVELS: ServerLogLevel[] = ["Error", "Warn", "Info", "Log", "System"]

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "50")))
    const levelParam = searchParams.get("level")
    const dateRange = searchParams.get("dateRange") || "24h"

    const now = new Date()
    let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    if (dateRange === "1h") {
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
    } else if (dateRange === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (dateRange === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const selectedLevel =
      levelParam && LEVELS.includes(levelParam as ServerLogLevel)
        ? (levelParam as ServerLogLevel)
        : undefined

    const where: Prisma.ServerLogWhereInput = {
      createdAt: { gte: startDate },
      ...(selectedLevel ? { level: selectedLevel } : {}),
    }

    const [logs, total] = await Promise.all([
      prisma.serverLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.serverLog.count({ where }),
    ])

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      level: log.level,
      source: log.source,
      service: log.service,
      message: log.message,
      metadata: {
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        details: log.details,
      },
      createdAt: log.createdAt.toISOString(),
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      pageSize,
    })
  })
}

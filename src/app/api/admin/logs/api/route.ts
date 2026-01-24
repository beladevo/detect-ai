import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const endpoint = searchParams.get('endpoint')
    const status = searchParams.get('status')
    const dateRange = searchParams.get('dateRange') || '24h'

    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const where: Record<string, unknown> = {
      createdAt: { gte: startDate },
    }

    if (endpoint && endpoint !== 'all') {
      where.endpoint = { startsWith: endpoint }
    }

    if (status && status !== 'all') {
      switch (status) {
        case '2xx':
          where.statusCode = { gte: 200, lt: 300 }
          break
        case '4xx':
          where.statusCode = { gte: 400, lt: 500 }
          break
        case '5xx':
          where.statusCode = { gte: 500 }
          break
      }
    }

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
      prisma.usageLog.count({ where }),
    ])

    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total,
      page,
      pageSize,
    })
  })
}

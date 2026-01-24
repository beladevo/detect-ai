import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
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

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where: { createdAt: { gte: startDate } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminAuditLog.count({ where: { createdAt: { gte: startDate } } }),
    ])

    const adminIds = [...new Set(logs.map(log => log.adminId))]
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true },
    })

    const adminMap = new Map(admins.map(a => [a.id, a.email]))

    const logsWithEmail = logs.map(log => ({
      ...log,
      adminEmail: adminMap.get(log.adminId) || log.adminId,
    }))

    return NextResponse.json({
      logs: logsWithEmail,
      total,
      page,
      pageSize,
    })
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const severity = searchParams.get('severity')
    const resolvedParam = searchParams.get('resolved')

    const where: Record<string, unknown> = {}
    const severityClause: Record<string, unknown> =
      severity && severity !== 'all' ? { severity } : {}
    const resolvedClause: Record<string, unknown> =
      resolvedParam === 'true'
        ? { resolved: true }
        : resolvedParam === 'false'
        ? { resolved: false }
        : {}

    Object.assign(where, severityClause, resolvedClause)

    const [alerts, total, severityGroups, resolvedCount, unresolvedCount] =
      await Promise.all([
        prisma.securityAlert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.securityAlert.count({ where }),
      prisma.securityAlert.count({ where: { ...where, resolved: true } }),
      prisma.securityAlert.count({ where: { ...where, resolved: false } }),
      prisma.securityAlert.groupBy({
        by: ['severity'],
        where: severityClause,
        _count: true,
      }),
      prisma.securityAlert.count({
        where: { ...severityClause, resolved: true },
      }),
      prisma.securityAlert.count({
        where: { ...severityClause, resolved: false },
      }),
    ])

    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      ipAddress: alert.ipAddress,
      userEmail: alert.user?.email ?? null,
      details: typeof alert.details === 'string' ? alert.details : JSON.stringify(alert.details),
      createdAt: alert.createdAt.toISOString(),
      resolved: alert.resolved,
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
    }))

    return NextResponse.json({
      alerts: formattedAlerts,
      total,
      page,
      pageSize,
      summary: {
        total,
        resolved: resolvedCount,
        unresolved: unresolvedCount,
        severityBreakdown: severityGroups.map((group) => ({
          severity: group.severity,
          count: group._count,
        })),
      },
    })
  })
}

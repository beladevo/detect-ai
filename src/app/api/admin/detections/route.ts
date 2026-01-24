import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

const DEFAULT_PAGE_SIZE = 20
const TREND_DAYS = 7

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || `${DEFAULT_PAGE_SIZE}`)))
    const status = searchParams.get('status')
    const verdict = searchParams.get('verdict')

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (verdict) {
      where.verdict = verdict
    }

    const [detections, total, statusGroups, verdictGroups] = await Promise.all([
      prisma.detection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.detection.count({ where }),
      prisma.detection.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.detection.groupBy({
        by: ['verdict'],
        _count: true,
        orderBy: { _count: 'desc' },
        where,
      }),
    ])

    const trendStart = new Date()
    trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1))
    trendStart.setHours(0, 0, 0, 0)

    const recentDetections = await prisma.detection.findMany({
      where: {
        createdAt: { gte: trendStart },
      },
      select: { createdAt: true },
    })

    const trend = Array.from({ length: TREND_DAYS }, (_, index) => {
      const date = new Date(trendStart)
      date.setDate(date.getDate() + index)
      const iso = date.toISOString().split('T')[0]
      const count = recentDetections.filter((d) => d.createdAt.toISOString().startsWith(iso)).length
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: count,
      }
    })

    return NextResponse.json({
      detections: detections.map((det) => ({
        id: det.id,
        verdict: det.verdict,
        score: det.score,
        confidence: det.confidence,
        status: det.status,
        createdAt: det.createdAt.toISOString(),
        modelUsed: det.modelUsed,
        user: det.user
          ? {
              id: det.user.id,
              email: det.user.email,
              name: det.user.name,
            }
          : null,
      })),
      total,
      page,
      pageSize,
      trend,
      statusBreakdown: statusGroups.map((group) => ({
        status: group.status,
        count: group._count,
      })),
      verdictBreakdown: verdictGroups.map((group) => ({
        verdict: group.verdict,
        count: group._count,
      })),
    })
  })
}

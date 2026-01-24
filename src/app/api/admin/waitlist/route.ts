import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.email = { contains: search, mode: 'insensitive' }
    }

    const [entries, total, stats] = await Promise.all([
      prisma.waitlist.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.waitlist.count({ where }),
      prisma.waitlist.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    const statsFormatted = {
      pending: stats.find(s => s.status === 'PENDING')?._count || 0,
      invited: stats.find(s => s.status === 'INVITED')?._count || 0,
      converted: stats.find(s => s.status === 'CONVERTED')?._count || 0,
    }

    return NextResponse.json({
      entries,
      total,
      page,
      pageSize,
      stats: statsFormatted,
    })
  })
}

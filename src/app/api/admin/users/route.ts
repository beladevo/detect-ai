import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const tier = searchParams.get('tier')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (tier && tier !== 'all') {
      where.tier = tier
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          where.deletedAt = null
          where.lockedAt = null
          where.suspendedUntil = null
          break
        case 'locked':
          where.lockedAt = { not: null }
          break
        case 'suspended':
          where.suspendedUntil = { gt: new Date() }
          break
        case 'deleted':
          where.deletedAt = { not: null }
          break
      }
    } else {
      where.deletedAt = null
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          emailVerified: true,
          monthlyDetections: true,
          totalDetections: true,
          createdAt: true,
          lastLoginAt: true,
          deletedAt: true,
          lockedAt: true,
          suspendedUntil: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    const formattedUsers = users.map((user) => ({
      ...user,
      status: user.deletedAt
        ? 'deleted'
        : user.lockedAt
        ? 'locked'
        : user.suspendedUntil && user.suspendedUntil > new Date()
        ? 'suspended'
        : 'active',
    }))

    return NextResponse.json({
      users: formattedUsers,
      total,
      page,
      pageSize,
    })
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '7d'

    const now = new Date()
    let startDate: Date

    switch (range) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      previousUsers,
      activeToday,
      detectionsToday,
      previousDetections,
      premiumUsers,
      enterpriseUsers,
      verdictCounts,
      activeBillingUsers,
      newBillingSubscriptions,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { lt: startDate } } }),
      prisma.user.count({ where: { deletedAt: null, lastLoginAt: { gte: today } } }),
      prisma.detection.count({ where: { createdAt: { gte: today } } }),
      prisma.detection.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
      }),
      prisma.user.count({ where: { deletedAt: null, tier: 'PREMIUM' } }),
      prisma.user.count({ where: { deletedAt: null, tier: 'ENTERPRISE' } }),
      prisma.detection.groupBy({
        by: ['verdict'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          stripeSubscriptionId: { not: null },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          stripeSubscriptionId: { not: null },
          createdAt: { gte: startDate },
        },
      }),
    ])

    const detectionsInPeriod = await prisma.detection.count({
      where: { createdAt: { gte: startDate } },
    })

    const userGrowth = previousUsers > 0
      ? ((totalUsers - previousUsers) / previousUsers) * 100
      : 100

    const detectionGrowth = previousDetections > 0
      ? ((detectionsInPeriod - previousDetections) / previousDetections) * 100
      : 100

    const monthlyRevenue = premiumUsers * 9.99 + enterpriseUsers * 49.99
    const premiumRevenue = premiumUsers * 9.99
    const enterpriseRevenue = enterpriseUsers * 49.99

    const verdictDistribution = {
      ai: verdictCounts.find(v => v.verdict === 'AI_GENERATED')?._count || 0,
      real: verdictCounts.find(v => v.verdict === 'REAL')?._count || 0,
      uncertain: verdictCounts.find(v => v.verdict === 'UNCERTAIN')?._count || 0,
    }

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const detectionTrend = await generateTrend(days, 'detection')
    const userTrend = await generateTrend(days, 'user')

    const recentActivity = await getRecentActivity()

    const billingBreakdown = {
      mrr: Math.round(monthlyRevenue * 100) / 100,
      activeSubscriptions: activeBillingUsers,
      newSubscriptions: newBillingSubscriptions,
      premiumSubscribers: premiumUsers,
      enterpriseSubscribers: enterpriseUsers,
      premiumRevenue: Math.round(premiumRevenue * 100) / 100,
      enterpriseRevenue: Math.round(enterpriseRevenue * 100) / 100,
    }

    return NextResponse.json({
      totalUsers,
      activeToday,
      detectionsToday,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      userGrowth: Math.round(userGrowth * 10) / 10,
      detectionGrowth: Math.round(detectionGrowth * 10) / 10,
      revenueGrowth: 8.2,
      billing: billingBreakdown,
      verdictDistribution,
      detectionTrend,
      userTrend,
      recentActivity,
    })
  })
}

async function generateTrend(days: number, type: 'detection' | 'user') {
  const trend = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    let count: number

    if (type === 'detection') {
      count = await prisma.detection.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      })
    } else {
      count = await prisma.user.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
          deletedAt: null,
        },
      })
    }

    trend.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: count,
    })
  }

  return trend.slice(-7)
}

async function getRecentActivity() {
  const [recentUsers, recentDetections] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.detection.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, verdict: true, createdAt: true },
    }),
  ])

  const activities = [
    ...recentUsers.map(user => ({
      id: `user-${user.id}`,
      type: 'user_signup' as const,
      title: 'New user registered',
      description: `${user.email} signed up`,
      timestamp: user.createdAt.toISOString(),
    })),
    ...recentDetections.map(det => ({
      id: `det-${det.id}`,
      type: 'detection' as const,
      title: 'Detection completed',
      description: `Result: ${det.verdict}`,
      timestamp: det.createdAt.toISOString(),
    })),
  ]

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

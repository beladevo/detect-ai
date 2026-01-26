import { prisma } from "@/src/lib/prisma"
import { getBillingAmount } from "@/src/lib/billing"

export type AdminAnalyticsRange = "7d" | "30d" | "90d"

export interface AdminTrendPoint {
  label: string
  value: number
}

export interface AdminBillingBreakdown {
  mrr: number
  activeSubscriptions: number
  newSubscriptions: number
  premiumSubscribers: number
  enterpriseSubscribers: number
  premiumRevenue: number
  enterpriseRevenue: number
}

export interface AdminVerdictDistribution {
  ai: number
  real: number
  uncertain: number
}

export interface AdminDetectionSourceBreakdown {
  api: number
  local: number
  extension: number
}

export type AdminActivityType =
  | "user_signup"
  | "detection"
  | "subscription"
  | "admin_action"
  | "security"

export interface AdminActivity {
  id: string
  type: AdminActivityType
  title: string
  description: string
  timestamp: string
}

export interface AdminAnalyticsOverview {
  totalUsers: number
  activeToday: number
  detectionsToday: number
  monthlyRevenue: number
  userGrowth: number
  detectionGrowth: number
  revenueGrowth: number
  billing: AdminBillingBreakdown
  verdictDistribution: AdminVerdictDistribution
  detectionSourceBreakdown: AdminDetectionSourceBreakdown
  detectionTrend: AdminTrendPoint[]
  userTrend: AdminTrendPoint[]
  recentActivity: AdminActivity[]
}

export async function getAdminAnalyticsOverview(
  range: AdminAnalyticsRange = "7d"
): Promise<AdminAnalyticsOverview> {
  const now = new Date()
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 7
  const duration = days * 24 * 60 * 60 * 1000
  const startDate = new Date(now.getTime() - duration)
  const previousPeriodStart = new Date(startDate.getTime() - duration)

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
    previousPremiumUsers,
    previousEnterpriseUsers,
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
    prisma.user.count({ where: { deletedAt: null, tier: "PREMIUM" } }),
    prisma.user.count({ where: { deletedAt: null, tier: "ENTERPRISE" } }),
    prisma.detection.groupBy({
      by: ["verdict"],
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
    prisma.user.count({
      where: { deletedAt: null, tier: "PREMIUM", createdAt: { lt: startDate } },
    }),
    prisma.user.count({
      where: { deletedAt: null, tier: "ENTERPRISE", createdAt: { lt: startDate } },
    }),
  ])

  const detectionSourceCounts = await prisma.detection.groupBy({
    by: ["detectionSource"],
    where: { createdAt: { gte: startDate } },
    _count: true,
  })

  const detectionsInPeriod = await prisma.detection.count({
    where: { createdAt: { gte: startDate } },
  })

  const userGrowth =
    previousUsers > 0 ? ((totalUsers - previousUsers) / previousUsers) * 100 : 100
  const detectionGrowth =
    previousDetections > 0
      ? ((detectionsInPeriod - previousDetections) / previousDetections) * 100
      : 100

  const premiumMonthlyAmount = getBillingAmount("premium", "monthly")
  const enterpriseMonthlyAmount = getBillingAmount("enterprise", "monthly")
  const monthlyRevenue =
    premiumUsers * premiumMonthlyAmount + enterpriseUsers * enterpriseMonthlyAmount
  const premiumRevenue = premiumUsers * premiumMonthlyAmount
  const enterpriseRevenue = enterpriseUsers * enterpriseMonthlyAmount
  const previousRevenue =
    previousPremiumUsers * premiumMonthlyAmount +
    previousEnterpriseUsers * enterpriseMonthlyAmount
  const revenueGrowth =
    previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 100

  const verdictDistribution: AdminVerdictDistribution = {
    ai: verdictCounts.find((v) => v.verdict === "AI_GENERATED")?._count || 0,
    real: verdictCounts.find((v) => v.verdict === "REAL")?._count || 0,
    uncertain: verdictCounts.find((v) => v.verdict === "UNCERTAIN")?._count || 0,
  }

  const extensionLocalCount =
    detectionSourceCounts.find((v) => v.detectionSource === "extension-local")?._count || 0
  const extensionCount = detectionSourceCounts.find((v) => v.detectionSource === "extension")?._count || 0
  const websiteCount = detectionSourceCounts.find((v) => v.detectionSource === "website")?._count || 0
  const detectionSourceBreakdown: AdminDetectionSourceBreakdown = {
    api: websiteCount + extensionCount,
    local: extensionLocalCount,
    extension: extensionCount,
  }

  const [detectionTrend, userTrend, recentActivity] = await Promise.all([
    generateTrend(days, "detection"),
    generateTrend(days, "user"),
    getRecentActivity(),
  ])

  const billingBreakdown: AdminBillingBreakdown = {
    mrr: Math.round(monthlyRevenue * 100) / 100,
    activeSubscriptions: activeBillingUsers,
    newSubscriptions: newBillingSubscriptions,
    premiumSubscribers: premiumUsers,
    enterpriseSubscribers: enterpriseUsers,
    premiumRevenue: Math.round(premiumRevenue * 100) / 100,
    enterpriseRevenue: Math.round(enterpriseRevenue * 100) / 100,
  }

  return {
    totalUsers,
    activeToday,
    detectionsToday,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    userGrowth: Math.round(userGrowth * 10) / 10,
    detectionGrowth: Math.round(detectionGrowth * 10) / 10,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    billing: billingBreakdown,
    verdictDistribution,
    detectionTrend,
    userTrend,
    recentActivity,
    detectionSourceBreakdown,
  }
}

async function generateTrend(days: number, type: "detection" | "user") {
  const trend: AdminTrendPoint[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const count =
      type === "detection"
        ? await prisma.detection.count({
            where: {
              createdAt: { gte: date, lt: nextDate },
            },
          })
        : await prisma.user.count({
            where: {
              createdAt: { gte: date, lt: nextDate },
              deletedAt: null,
            },
          })

    trend.push({
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    })
  }

  return trend.slice(-7)
}

async function getRecentActivity(): Promise<AdminActivity[]> {
  const [recentUsers, recentDetections] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.detection.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, verdict: true, createdAt: true },
    }),
  ])

  const activities: AdminActivity[] = [
    ...recentUsers.map((user) => ({
      id: `user-${user.id}`,
      type: "user_signup" as const,
      title: "New user registered",
      description: `${user.email} signed up`,
      timestamp: user.createdAt.toISOString(),
    })),
    ...recentDetections.map((det) => ({
      id: `det-${det.id}`,
      type: "detection" as const,
      title: "Detection completed",
      description: `Result: ${det.verdict}`,
      timestamp: det.createdAt.toISOString(),
    })),
  ]

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getPlanForPriceId } from '@/src/lib/stripe'
import { withAdminAuth, logAdminAction, canModifyUser, canDeleteUsers } from '@/src/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        adminNotes: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        detections: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            verdict: true,
            score: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const detectionHistory = await prisma.detection.groupBy({
      by: ['createdAt'],
      where: {
        userId: id,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    const detectionHistoryFormatted = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      const dayData = detectionHistory.find((d) => {
        const dDate = new Date(d.createdAt)
        dDate.setHours(0, 0, 0, 0)
        return dDate.getTime() === date.getTime()
      })
      return {
        date: date.toISOString(),
        count: dayData?._count || 0,
      }
    })

    const billing = getPlanForPriceId(user.stripePriceId)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      status: user.deletedAt
        ? 'deleted'
        : user.lockedAt
        ? 'locked'
        : user.suspendedUntil && user.suspendedUntil > new Date()
        ? 'suspended'
        : 'active',
      emailVerified: user.emailVerified,
      apiKey: user.apiKey,
      apiKeyEnabled: user.apiKeyEnabled,
      monthlyDetections: user.monthlyDetections,
      totalDetections: user.totalDetections,
      lastDetectionAt: user.lastDetectionAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      lockedAt: user.lockedAt,
      lockedReason: user.lockedReason,
      lockedBy: user.lockedBy,
      suspendedUntil: user.suspendedUntil,
      tags: user.tags,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      billingPlan: billing?.plan ?? null,
      billingCycle: billing?.billingCycle ?? null,
      notes: user.adminNotes,
      detectionHistory: detectionHistoryFormatted,
      recentDetections: user.detections,
    })
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params

    if (!canModifyUser(admin, id)) {
      return NextResponse.json({ error: 'Cannot modify this user' }, { status: 403 })
    }

    const updates = await request.json()
    const allowedUpdates = ['name', 'tier', 'tags', 'apiKeyEnabled']
    const filteredUpdates: Record<string, unknown> = {}

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key]
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: filteredUpdates,
    })

    await logAdminAction(
      admin.id,
      'USER_UPDATED',
      'User',
      id,
      filteredUpdates,
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json(user)
  }, ['SUPER_ADMIN', 'ADMIN'])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params

    if (!canDeleteUsers(admin)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAdminAction(
      admin.id,
      'USER_DELETED',
      'User',
      id,
      null,
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true })
  }, ['SUPER_ADMIN'])
}

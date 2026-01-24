import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/src/lib/auth'
import { getPlanForPriceId } from '@/src/lib/stripe'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const billing = getPlanForPriceId(user.stripePriceId)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      emailVerified: user.emailVerified,
      apiKey: user.apiKey,
      apiKeyEnabled: user.apiKeyEnabled,
      monthlyDetections: user.monthlyDetections,
      totalDetections: user.totalDetections,
      lastDetectionAt: user.lastDetectionAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
      billingPlan: billing?.plan ?? null,
      billingCycle: billing?.billingCycle ?? null,
    })
  } catch (error) {
    console.error('Get user failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

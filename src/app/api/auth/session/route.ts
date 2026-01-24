import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/src/lib/auth'
import { getPlanForPriceId } from '@/src/lib/stripe'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    const billing = getPlanForPriceId(user.stripePriceId)

    return NextResponse.json({
      user: {
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
        lastLoginAt: user.lastLoginAt,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeCustomerId: user.stripeCustomerId,
        stripePriceId: user.stripePriceId,
        stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
        billingPlan: billing?.plan ?? null,
        billingCycle: billing?.billingCycle ?? null,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
}

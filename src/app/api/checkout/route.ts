import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser } from '@/src/lib/auth'
import {
  BillingCycle,
  BillingPlanKey,
  getPriceIdForPlan,
  getStripeClient,
} from '@/src/lib/stripe'

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000'

type CheckoutPayload = {
  plan?: string
  billingCycle?: string
}

const isBillingCycle = (value: unknown): value is BillingCycle =>
  value === 'monthly' || value === 'annual'

const isBillingPlan = (value: unknown): value is BillingPlanKey =>
  value === 'premium' || value === 'enterprise'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json().catch(() => ({}))) as CheckoutPayload
    const plan: BillingPlanKey = isBillingPlan(payload.plan) ? payload.plan : 'premium'
    const billingCycle: BillingCycle = isBillingCycle(payload.billingCycle)
      ? payload.billingCycle
      : 'monthly'

    const priceId = getPriceIdForPlan(plan, billingCycle)
    const customerId = await ensureStripeCustomer(user)
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        plan,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
      success_url: `${BASE_URL}/dashboard?checkout=success`,
      cancel_url: `${BASE_URL}/pricing?checkout=canceled`,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Unable to create checkout session' },
        { status: 500 }
      )
    }

    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

async function ensureStripeCustomer(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: user.id,
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

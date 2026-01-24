import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/src/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  BillingPlanKey,
  getPlanForPriceId,
  getStripeClient,
} from '@/src/lib/stripe'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
}

const PLAN_TO_TIER: Record<BillingPlanKey, 'PREMIUM' | 'ENTERPRISE'> = {
  premium: 'PREMIUM',
  enterprise: 'ENTERPRISE',
}

const convertTimestampToDate = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000) : null

const buildBillingUpdateFromSubscription = (
  subscription: Stripe.Subscription
): Prisma.UserUpdateInput => {
  const priceId = subscription.items.data[0]?.price.id ?? null
  const planInfo = getPlanForPriceId(priceId)
  const tier = planInfo ? PLAN_TO_TIER[planInfo.plan] : 'PREMIUM'

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : undefined

  const updatePayload: Prisma.UserUpdateInput = {
    tier,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: convertTimestampToDate(subscription.current_period_end),
  }

  if (customerId) {
    updatePayload.stripeCustomerId = customerId
  }

  return updatePayload
}

const findUserFromSubscription = async (subscription: Stripe.Subscription) => {
  if (subscription.metadata?.userId) {
    return prisma.user.findUnique({ where: { id: subscription.metadata.userId } })
  }

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : undefined
  if (customerId) {
    return prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
  }

  return null
}

const findUserFromSession = async (session: Stripe.Checkout.Session) => {
  if (session.metadata?.userId) {
    return prisma.user.findUnique({ where: { id: session.metadata.userId } })
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : undefined
  if (customerId) {
    return prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
  }

  return null
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  const stripe = getStripeClient()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripe, event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripe, event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripe, event.data.object as Stripe.Invoice)
        break
      default:
        break
    }
  } catch (error) {
    console.error('Stripe webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

const handleCheckoutSessionCompleted = async (
  stripe: Stripe,
  session: Stripe.Checkout.Session
) => {
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

  if (!subscriptionId) {
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const user = await findUserFromSession(session)
  if (!user) {
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: buildBillingUpdateFromSubscription(subscription),
  })
}

const handleSubscriptionUpdated = async (stripe: Stripe, subscription: Stripe.Subscription) => {
  const user = await findUserFromSubscription(subscription)
  if (!user) {
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: buildBillingUpdateFromSubscription(subscription),
  })
}

const handleSubscriptionDeleted = async (
  stripe: Stripe,
  subscription: Stripe.Subscription
) => {
  const user = await findUserFromSubscription(subscription)
  if (!user) {
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier: 'FREE',
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  })
}

const handleInvoicePaymentSucceeded = async (stripe: Stripe, invoice: Stripe.Invoice) => {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
  if (!subscriptionId) {
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const user = await findUserFromSubscription(subscription)
  if (!user) {
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: buildBillingUpdateFromSubscription(subscription),
  })
}

import Stripe from 'stripe'

const requiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required Stripe environment variable: ${key}`)
  }
  return value
}

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const secret = requiredEnv('STRIPE_SECRET_KEY')
    stripeInstance = new Stripe(secret, { apiVersion: '2024-11-20' })
  }
  return stripeInstance
}

export type BillingCycle = 'monthly' | 'annual'
export type BillingPlanKey = 'premium' | 'enterprise'

const PRICE_ENV_KEYS: Record<
  BillingPlanKey,
  { label: string; description: string; prices: Record<BillingCycle, string> }
> = {
  premium: {
    label: 'Premium',
    description: 'Advanced detections, analytics, and priority support.',
    prices: {
      monthly: 'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
      annual: 'STRIPE_PREMIUM_ANNUAL_PRICE_ID',
    },
  },
  enterprise: {
    label: 'Enterprise',
    description: 'Dedicated infrastructure, SSO, and enterprise SLA.',
    prices: {
      monthly: 'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
      annual: 'STRIPE_ENTERPRISE_ANNUAL_PRICE_ID',
    },
  },
}

export function getPriceIdForPlan(
  plan: BillingPlanKey,
  cycle: BillingCycle
): string {
  const planConfig = PRICE_ENV_KEYS[plan]
  if (!planConfig) {
    throw new Error(`Invalid billing plan: ${plan}`)
  }
  return requiredEnv(planConfig.prices[cycle])
}

export function getPlanForPriceId(
  priceId?: string | null
): { plan: BillingPlanKey; billingCycle: BillingCycle } | null {
  if (!priceId) return null

  for (const [plan, config] of Object.entries(PRICE_ENV_KEYS) as Array<
    [BillingPlanKey, typeof PRICE_ENV_KEYS[BillingPlanKey]]
  >) {
    for (const [cycle, envKey] of Object.entries(config.prices) as Array<
      [BillingCycle, string]
    >) {
      const envPriceId = process.env[envKey]
      if (envPriceId && envPriceId === priceId) {
        return { plan, billingCycle: cycle }
      }
    }
  }
  return null
}

export function getPlanLabel(plan: BillingPlanKey): string {
  return PRICE_ENV_KEYS[plan]?.label ?? plan
}

export function getPlanDescription(plan: BillingPlanKey): string {
  return PRICE_ENV_KEYS[plan]?.description ?? ''
}

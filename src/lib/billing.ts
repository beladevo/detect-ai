export type BillingCycle = "monthly" | "annual"
export type BillingPlanKey = "premium" | "enterprise"

export const PLAN_LABELS: Record<BillingPlanKey, string> = {
  premium: "Premium",
  enterprise: "Enterprise",
}

export const PLAN_DESCRIPTIONS: Record<BillingPlanKey, string> = {
  premium: "Advanced detections, analytics, and priority support.",
  enterprise: "Dedicated resources, compliance controls, and a white glove experience.",
}

export const PLAN_AMOUNT = {
  premium: {
    monthly: 49,
    annual: 399,
  },
  enterprise: {
    monthly: 149,
    annual: 999,
  },
}

export function getBillingAmount(plan: BillingPlanKey, cycle: BillingCycle) {
  const planAmounts = PLAN_AMOUNT[plan]
  const amount = planAmounts[cycle]
  return amount
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

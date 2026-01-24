import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { BillingPlanKey, BillingCycle, getBillingAmount, PLAN_LABELS } from "@/src/lib/billing"
import { createPayPalOrder, isPayPalConfigured } from "@/src/lib/paypal"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000"

type CheckoutPayload = {
  plan?: unknown
  billingCycle?: unknown
}

const isBillingCycle = (value: unknown): value is BillingCycle =>
  value === "monthly" || value === "annual"

const isBillingPlan = (value: unknown): value is BillingPlanKey =>
  value === "premium" || value === "enterprise"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: "PayPal checkout is not configured" },
        { status: 503 }
      )
    }

    const payload = (await request.json().catch(() => ({}))) as CheckoutPayload
    const plan: BillingPlanKey = isBillingPlan(payload.plan) ? payload.plan : "premium"
    const billingCycle: BillingCycle = isBillingCycle(payload.billingCycle)
      ? payload.billingCycle
      : "monthly"

    const amount = getBillingAmount(plan, billingCycle)
    const order = await createPayPalOrder({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
          description: `${PLAN_LABELS[plan]} (${billingCycle}) plan`,
        },
      ],
      application_context: {
        brand_name: "Imagion",
        user_action: "PAY_NOW",
        return_url: `${BASE_URL}/paypal/complete?plan=${plan}&billingCycle=${billingCycle}`,
        cancel_url: `${BASE_URL}/pricing?checkout=canceled`,
      },
    })

    const approvalLink = order.links.find((link) => link.rel === "approve")

    if (!approvalLink) {
      console.error("PayPal order missing approval link:", order)
      return NextResponse.json(
        { error: "Unable to initiate PayPal checkout" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: approvalLink.href,
      orderId: order.id,
    })
  } catch (error) {
    console.error("PayPal checkout creation failed:", error)
    const message =
      error instanceof Error ? error.message : "Failed to initiate checkout"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

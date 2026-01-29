import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { getCurrentUser } from "@/src/lib/auth"
import { capturePayPalOrder } from "@/src/lib/paypal"
import { BillingPlanKey, BillingCycle } from "@/src/lib/billing"

type CapturePayload = {
  orderId?: string
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

    const payload = (await request.json().catch(() => ({}))) as CapturePayload
    const orderId = payload.orderId
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const plan: BillingPlanKey = isBillingPlan(payload.plan) ? payload.plan : "premium"
    const billingCycle: BillingCycle = isBillingCycle(payload.billingCycle)
      ? payload.billingCycle
      : "monthly"

    const capture = await capturePayPalOrder(orderId)
    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "PayPal order not completed", status: capture.status },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: plan === "enterprise" ? "ENTERPRISE" : "PREMIUM",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayPal capture failed:", error)
    return NextResponse.json({ error: "Failed to capture PayPal order" }, { status: 500 })
  }
}

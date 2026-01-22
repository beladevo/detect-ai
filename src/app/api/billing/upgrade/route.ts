import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type UpgradePayload = {
  plan?: string;
  billingCycle?: "monthly" | "annual";
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as UpgradePayload;
    const plan = payload.plan || "premium";
    const billingCycle = payload.billingCycle || "monthly";
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (billingCycle === "annual" ? 365 : 30));

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: "PREMIUM",
        stripeCustomerId: user.stripeCustomerId || `mock_cus_${user.id.slice(0, 8)}`,
        stripeSubscriptionId: `mock_sub_${Date.now()}`,
        stripePriceId: `mock_price_${plan}_${billingCycle}`,
        stripeCurrentPeriodEnd: periodEnd,
      },
      select: {
        tier: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    return NextResponse.json({
      ok: true,
      plan,
      billingCycle,
      subscription: updated,
      message: "Mock payment processed. Premium is now active.",
    });
  } catch (error) {
    console.error("Upgrade failed:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}

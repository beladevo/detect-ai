import { NextResponse } from "next/server";
import { getStripeClient } from "@/src/lib/stripe";
import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.stripeSubscriptionId) {
      try {
        const stripe = getStripeClient();
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (error) {
        console.error("Stripe subscription cancel failed:", error);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: "FREE",
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Plan cancelled" });
  } catch (error) {
    console.error("Cancel plan failed:", error);
    return NextResponse.json(
      { error: "Failed to cancel plan" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser, destroyAllUserSessions, destroySession } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        tier: "FREE",
        apiKey: null,
        apiKeyEnabled: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
    await destroyAllUserSessions(user.id);
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete account failed:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

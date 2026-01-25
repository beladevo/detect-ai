import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/src/lib/auth/api";
import { prisma } from "@/src/lib/prisma";
import { getTierLimitsForDisplay } from "@/src/lib/features";
import { resolveUserTier } from "@/src/lib/tierConfig";

export const runtime = "nodejs";

function safeLimit(value: number) {
  return Number.isFinite(value) ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyUsed, monthlyUsed] = await Promise.all([
      prisma.detection.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.detection.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const nextDay = new Date(startOfToday);
    nextDay.setDate(startOfToday.getDate() + 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const limits = getTierLimitsForDisplay(resolveUserTier(user.tier));

    return NextResponse.json({
      success: true,
      usage: {
        tier: user.tier,
        dailyUsed,
        monthlyUsed,
        dailyLimit: safeLimit(limits.daily),
        monthlyLimit: safeLimit(limits.monthly),
        totalDetections: user.totalDetections,
        monthlyResetAt: nextMonth.toISOString(),
        dailyResetAt: nextDay.toISOString(),
      },
    });
  } catch (error) {
    console.error("Usage status lookup failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load usage status" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getRateLimits, hasFeature } from "@/src/lib/features";

type TrendPoint = {
  date: string;
  count: number;
  avgScore: number | null;
};

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAnalytics = await hasFeature(user, "advanced_analytics");
    if (!hasAnalytics) {
      return NextResponse.json(
        { error: "Premium feature required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now);
    trendStart.setDate(now.getDate() - 6);
    trendStart.setHours(0, 0, 0, 0);

    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentDetections,
      trendDetections,
      dailyCount,
      monthlyCount,
      apiCallsLast24h,
      apiCallsLast7d,
    ] = await Promise.all([
      prisma.detection.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fileName: true,
          score: true,
          verdict: true,
          createdAt: true,
          modelUsed: true,
        },
      }),
      prisma.detection.findMany({
        where: { userId: user.id, createdAt: { gte: trendStart } },
        select: { createdAt: true, score: true },
      }),
      prisma.detection.count({
        where: { userId: user.id, createdAt: { gte: startOfToday } },
      }),
      prisma.detection.count({
        where: { userId: user.id, createdAt: { gte: startOfMonth } },
      }),
      prisma.usageLog.count({
        where: {
          userId: user.id,
          endpoint: "/api/detect",
          createdAt: { gte: last24h },
        },
      }),
      prisma.usageLog.count({
        where: {
          userId: user.id,
          endpoint: "/api/detect",
          createdAt: { gte: last7d },
        },
      }),
    ]);

    const trendMap = new Map<string, { count: number; totalScore: number }>();
    for (const entry of trendDetections) {
      const key = getDateKey(entry.createdAt);
      const current = trendMap.get(key) || { count: 0, totalScore: 0 };
      trendMap.set(key, {
        count: current.count + 1,
        totalScore: current.totalScore + entry.score,
      });
    }

    const trend: TrendPoint[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(trendStart);
      day.setDate(trendStart.getDate() + i);
      const key = getDateKey(day);
      const info = trendMap.get(key);
      trend.push({
        date: key,
        count: info?.count || 0,
        avgScore: info && info.count > 0 ? info.totalScore / info.count : null,
      });
    }

    const limits = getRateLimits(user.tier);
    const safeLimit = (value: number) => (Number.isFinite(value) ? value : null);

    return NextResponse.json({
      usage: {
        dailyUsed: dailyCount,
        dailyLimit: safeLimit(limits.daily),
        monthlyUsed: monthlyCount,
        monthlyLimit: safeLimit(limits.monthly),
      },
      trend,
      recentDetections: recentDetections.map((item) => ({
        id: item.id,
        fileName: item.fileName,
        score: item.score,
        verdict: item.verdict,
        createdAt: item.createdAt.toISOString(),
        modelUsed: item.modelUsed,
      })),
      api: {
        callsLast24h: apiCallsLast24h,
        callsLast7d: apiCallsLast7d,
      },
    });
  } catch (error) {
    console.error("Dashboard summary failed:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/src/lib/auth"
import { getAdminAnalyticsOverview, type AdminAnalyticsRange } from "@/src/lib/admin/analytics"

const ALLOWED_RANGES: AdminAnalyticsRange[] = ["7d", "30d", "90d"]

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const rangeParam = request.nextUrl.searchParams.get("range")
    const range = ALLOWED_RANGES.includes(rangeParam as AdminAnalyticsRange)
      ? (rangeParam as AdminAnalyticsRange)
      : "7d"

    const data = await getAdminAnalyticsOverview(range)

    return NextResponse.json(data)
  })
}

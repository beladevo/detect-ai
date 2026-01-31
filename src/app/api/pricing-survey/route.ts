import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { logServerEvent } from "@/src/lib/loggerServer"

export const runtime = "nodejs"

type SurveyPayload = {
  response?: string
}

const VALID_RESPONSES = ["YEAH_SURE", "NOT_REALLY", "MAYBE"] as const
type ValidResponse = typeof VALID_RESPONSES[number]

export async function POST(request: Request) {
  try {
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "PricingSurvey",
      message: "Survey response received",
      request,
    })

    const payload = (await request.json()) as SurveyPayload
    const response = payload.response?.trim().toUpperCase() as string

    if (!response || !VALID_RESPONSES.includes(response as ValidResponse)) {
      return NextResponse.json(
        { message: "Invalid response value." },
        { status: 400 }
      )
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
    const userAgent = request.headers.get("user-agent") || null

    // Rate limit: 1 response per IP per 24 hours
    if (ip) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const existing = await prisma.pricingSurvey.findFirst({
        where: {
          ipAddress: ip,
          createdAt: { gte: twentyFourHoursAgo },
        },
      })

      if (existing) {
        return NextResponse.json({
          ok: true,
          status: "already_responded",
          message: "You have already submitted a response.",
        })
      }
    }

    // Attempt to get userId from auth cookie (optional)
    let userId: string | null = null
    try {
      const { getCurrentUser } = await import("@/src/lib/auth")
      const user = await getCurrentUser()
      userId = user?.id || null
    } catch {
      // No authenticated user -- that is fine
    }

    await prisma.pricingSurvey.create({
      data: {
        response: response as ValidResponse,
        userId,
        ipAddress: ip,
        userAgent,
      },
    })

    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "PricingSurvey",
      message: "Survey response stored",
      additional: JSON.stringify({ response }),
      request,
    })

    return NextResponse.json({ ok: true, status: "recorded" })
  } catch (error) {
    await logServerEvent({
      level: "Error",
      source: "Backend",
      service: "PricingSurvey",
      message: "Survey submission failed",
      additional: error instanceof Error ? error.message : "Unknown error",
      request,
    })
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { logServerEvent } from "@/src/lib/loggerServer"

export const runtime = "nodejs"

type WaitlistPayload = {
  email?: string
  source?: string
}

const isValidEmail = (value: string) => /.+@.+\..+/.test(value)

export async function POST(request: Request) {
  try {
    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Waitlist",
      message: "Request received",
      request,
    })

    const payload = (await request.json()) as WaitlistPayload
    const email = payload.email?.trim().toLowerCase() || ""
    const source = payload.source?.trim() || "unknown"

    if (!email || !isValidEmail(email)) {
      await logServerEvent({
        level: "Warn",
        source: "Backend",
        service: "Waitlist",
        message: "Invalid email",
        additional: JSON.stringify({ source }),
        request,
      })
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
    const userAgent = request.headers.get("user-agent") || null

    const existingEntry = await prisma.waitlist.findUnique({
      where: { email },
    })

    if (existingEntry) {
      await logServerEvent({
        level: "Info",
        source: "Backend",
        service: "Waitlist",
        message: "Email already on waitlist",
        additional: JSON.stringify({ source }),
        request,
      })
      return NextResponse.json({ ok: true, message: "Already on waitlist" })
    }

    await prisma.waitlist.create({
      data: {
        email,
        source,
        ipAddress: ip,
        userAgent,
      },
    })

    await logServerEvent({
      level: "Info",
      source: "Backend",
      service: "Waitlist",
      message: "Signup stored",
      additional: JSON.stringify({ source }),
      request,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    await logServerEvent({
      level: "Error",
      source: "Backend",
      service: "Waitlist",
      message: "Signup failed",
      additional: error instanceof Error ? error.message : "Unknown error",
      request,
    })
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const count = await prisma.waitlist.count()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

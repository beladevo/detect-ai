import { NextResponse } from "next/server"
import { isPayPalConfigured } from "@/src/lib/paypal"

export function GET() {
  return NextResponse.json({ enabled: isPayPalConfigured() })
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import GlowButton from "@/src/components/ui/GlowButton"
import Link from "next/link"

type CaptureState = "processing" | "success" | "error"

export default function PayPalCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<CaptureState>("processing")
  const [message, setMessage] = useState<string>("Confirming your payment...")

  useEffect(() => {
    const orderId = searchParams.get("token")
    const plan = searchParams.get("plan")
    const billingCycle = searchParams.get("billingCycle")

    if (!orderId) {
      setState("error")
      setMessage("Missing PayPal order reference.")
      return
    }

    fetch("/api/paypal/capture", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        plan,
        billingCycle,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Capture failed")
        }
        setState("success")
        setMessage("Payment confirmed. Redirecting to your dashboard...")
        setTimeout(() => router.push("/dashboard?checkout=success"), 1200)
      })
      .catch((error) => {
        console.error("PayPal capture error:", error)
        setState("error")
        setMessage("We couldn't confirm your PayPal payment. Please contact support.")
      })
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-gray-900 via-purple-900 to-black px-4 text-center text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold">Completing PayPal Checkout</h1>
        <p className="mt-4 text-sm text-gray-300">{message}</p>
        {state === "error" && (
          <div className="mt-6">
            <GlowButton variant="secondary" onClick={() => router.push("/pricing")}>
              Return to Pricing
            </GlowButton>
          </div>
        )}
        {state === "success" && (
          <div className="mt-6">
            <GlowButton onClick={() => router.push("/dashboard")}>Go to Dashboard</GlowButton>
          </div>
        )}
      </div>
      <Link href="/" className="text-xs uppercase tracking-[0.4em] text-gray-400">
        or continue browsing
      </Link>
    </div>
  )
}

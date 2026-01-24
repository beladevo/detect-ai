'use client'

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import GlowButton from "@/src/components/ui/GlowButton"
import { useAuth } from "@/src/context/AuthContext"
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Sparkles } from "lucide-react"
import {
  BillingCycle,
  BillingPlanKey,
  formatCurrency,
  getBillingAmount,
  PLAN_LABELS,
} from "@/src/lib/billing"

type CheckoutState = "idle" | "processing" | "error"

const PRICE_LABEL = (cycle: BillingCycle) => {
  const amount = getBillingAmount("premium", cycle)
  return formatCurrency(amount)
}

export default function PricingPage() {
  const router = useRouter()
  const { user, loading, refreshUser } = useAuth()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle")
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [paypalAvailable, setPaypalAvailable] = useState(true)

  const price = useMemo(() => {
    return { amount: getBillingAmount("premium", billingCycle), label: PRICE_LABEL(billingCycle) }
  }, [billingCycle])

  const isPremium = user?.tier === "PREMIUM" || user?.tier === "ENTERPRISE"

  useEffect(() => {
    let isMounted = true

    const fetchAvailability = async () => {
      try {
        const response = await fetch("/api/paypal/configured")
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { enabled?: boolean }
        if (!isMounted) {
          return
        }

        if (typeof data.enabled === "boolean") {
          setPaypalAvailable(data.enabled)
        }
      } catch (error) {
        console.error("Failed to load PayPal availability:", error)
      }
    }

    fetchAvailability()

    return () => {
      isMounted = false
    }
  }, [])

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setCheckoutState("processing")
    setCheckoutError(null)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium", billingCycle }),
      })

      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data?.error || "Upgrade failed")
      }

      await refreshUser()
      window.location.assign(data.url)
    } catch (error) {
      console.error("Upgrade failed:", error)
      setCheckoutState("error")
      const message =
        error instanceof Error
          ? error.message
          : "Checkout could not be started. Please try again."
      setCheckoutError(message)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="relative mx-auto mt-10 w-full max-w-6xl space-y-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-purple-300/70">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
            Unlock premium detection intelligence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-400">
            Choose a plan that scales with your detection volume. All plans include priority
            models, faster analysis, and full analytics access.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900"
                : "border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              billingCycle === "annual"
                ? "bg-white text-gray-900"
                : "border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Annual
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Free</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Starter</span>
            </div>
            <div className="mt-6 text-4xl font-bold text-white">$0</div>
            <p className="mt-2 text-xs text-gray-400">For light usage and quick checks.</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-300" />
                50 detections per day
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-300" />
                Local-only detection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-300" />
                Smaller lightweight model
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-300" />
                Community support
              </li>
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
              Included with every account.
            </div>
          </div>

          <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-500/20 via-white/5 to-cyan-500/10 p-6 shadow-[0_20px_60px_rgba(124,58,237,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Premium</h2>
              <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-purple-200">
                Recommended
              </span>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <div className="text-4xl font-bold text-white">{price.label}</div>
              <div className="text-xs uppercase tracking-[0.3em] text-gray-300">
                /{billingCycle === "annual" ? "year" : "month"}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-300">
              For teams shipping high-volume detections.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-200">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                1,000 detections per day
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Server-side detection with larger models
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Multiple model voting for higher confidence
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Priority multi-model ensemble
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Advanced analytics + audit logs
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                API access and batch export
              </li>
            </ul>

            <div className="mt-6 space-y-3">
              {checkoutState === "error" && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {checkoutError}
                </div>
              )}

              <GlowButton
                onClick={handleUpgrade}
                disabled={
                  loading ||
                  checkoutState === "processing" ||
                  isPremium ||
                  paypalAvailable === false
                }
                className="w-full"
              >
                {isPremium
                  ? "Premium Active"
                  : checkoutState === "processing"
                  ? "Redirecting to PayPal..."
                  : "Pay with PayPal"}
              </GlowButton>
              {paypalAvailable === false && (
                <p className="text-xs text-yellow-200">
                  PayPal checkout is disabled until payment credentials are configured.
                </p>
              )}

              {checkoutState === "success" && (
                <GlowButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                </GlowButton>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Enterprise</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Custom</span>
            </div>
            <div className="mt-6 text-4xl font-bold text-white">Let us talk</div>
            <p className="mt-2 text-xs text-gray-400">
              For orgs with compliance, SLAs, and dedicated support.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Unlimited detections + white glove support
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Dedicated inference cluster
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                SSO, audit exports, and SLA
              </li>
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-300" />
                Contact sales for a tailored quote.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Plan Summary</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span className="font-semibold text-white">{PLAN_LABELS.premium}</span>
                </div>
              <div className="flex items-center justify-between">
                <span>Billing</span>
                <span className="font-semibold text-white">
                  {billingCycle === "annual" ? "Annual" : "Monthly"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount</span>
                <span className="font-semibold text-white">{price.label}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
                PayPal handles the secure payment; your subscription will follow the {billingCycle === "annual" ? "365-day" : "30-day"} cycle.
              </div>
              {!user && !loading && (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-200">
                  Sign in to complete the mock checkout.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

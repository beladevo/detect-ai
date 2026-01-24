"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/src/components/admin"
import GlowButton from "@/src/components/ui/GlowButton"
import GlassCard from "@/src/components/ui/GlassCard"

type BillingMetrics = {
  mrr: number
  activeSubscriptions: number
  newSubscriptions: number
  premiumSubscribers: number
  enterpriseSubscribers: number
  premiumRevenue: number
  enterpriseRevenue: number
}

export default function AdminBillingPage() {
  const [billing, setBilling] = useState<BillingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d")

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    fetch(`/api/admin/analytics/overview?range=${range}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load billing overview")
        }
        const payload = await response.json()
        if (isMounted && payload?.billing) {
          setBilling(payload.billing)
        }
      })
      .catch((err) => {
        console.error("Billing overview error:", err)
        if (isMounted) {
          setError("Unable to load billing data right now.")
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [range])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Billing"
        description="Monitor subscription health and revenue."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/50 p-1">
            {(["7d", "30d", "90d"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === option
                    ? "bg-brand-purple text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "7d" ? "7 Days" : option === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Monthly Recurring Revenue</p>
            <p className="text-3xl font-semibold text-foreground">
              {billing ? formatCurrency(billing.mrr) : loading ? "Loading…" : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Active and renewing subscriptions only.
            </p>
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Active subscriptions</p>
            <p className="text-3xl font-semibold text-foreground">
              {billing ? billing.activeSubscriptions.toLocaleString() : loading ? "Loading…" : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Totals across premium + enterprise.</p>
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">New this period</p>
            <p className="text-3xl font-semibold text-foreground">
              {billing ? billing.newSubscriptions.toLocaleString() : loading ? "Loading…" : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Stripe subscriptions created.</p>
          </GlassCard>
          <GlassCard className="p-6" hover={false}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Premium / Enterprise</p>
            <p className="text-3xl font-semibold text-foreground">
              {billing
                ? `${billing.premiumSubscribers.toLocaleString()} / ${billing.enterpriseSubscribers.toLocaleString()}`
                : loading
                ? "Loading…"
                : "—"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Active subscribers per tier.</p>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Revenue split</h3>
                <p className="text-xs text-muted-foreground">Premium vs enterprise</p>
              </div>
              <GlowButton
                variant="secondary"
                size="sm"
                onClick={() =>
                  window.open("https://dashboard.stripe.com/subscriptions", "_blank", "noopener,noreferrer")
                }
              >
                View Stripe
              </GlowButton>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/30 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Premium revenue</p>
                <p className="text-2xl font-semibold text-foreground">
                  {billing ? formatCurrency(billing.premiumRevenue) : loading ? "Loading…" : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/30 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Enterprise revenue</p>
                <p className="text-2xl font-semibold text-foreground">
                  {billing ? formatCurrency(billing.enterpriseRevenue) : loading ? "Loading…" : "—"}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <h3 className="font-display text-lg font-semibold text-foreground">Current status</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View and update active subscriptions with the billing portal or manage Stripe directly.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <GlowButton
                variant="secondary"
                onClick={() =>
                  window.open("https://dashboard.stripe.com/subscriptions", "_blank", "noopener,noreferrer")
                }
                className="w-full justify-center"
              >
                Open Stripe subscriptions
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => window.location.assign("/admin/users")}>
                Review premium users
              </GlowButton>
            </div>
          </GlassCard>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

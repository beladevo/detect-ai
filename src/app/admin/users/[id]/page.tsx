"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AdminHeader, TierBadge, StatusBadge, SimpleChart } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import Modal from "@/src/components/ui/Modal"
import { useAdmin } from "@/src/context/AdminContext"

interface UserDetail {
  id: string
  email: string
  name: string | null
  tier: "FREE" | "PREMIUM" | "ENTERPRISE"
  status: "active" | "locked" | "suspended" | "deleted"
  emailVerified: boolean
  apiKey: string | null
  apiKeyEnabled: boolean
  monthlyDetections: number
  totalDetections: number
  lastDetectionAt: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  lockedAt: string | null
  lockedReason: string | null
  lockedBy: string | null
  suspendedUntil: string | null
  tags: string[]
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  stripeCurrentPeriodEnd: string | null
  billingPlan: "premium" | "enterprise" | null
  billingCycle: "monthly" | "annual" | null
  notes: Array<{
    id: string
    content: string
    createdBy: string
    createdAt: string
  }>
  detectionHistory: Array<{
    date: string
    count: number
  }>
  recentDetections: Array<{
    id: string
    verdict: string
    score: number
    createdAt: string
  }>
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { canModifyUsers, canDeleteUsers } = useAdmin()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "security" | "notes">("overview")

  // Modals
  const [showLockModal, setShowLockModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTierModal, setShowTierModal] = useState(false)
  const [lockReason, setLockReason] = useState("")
  const [newTier, setNewTier] = useState<"FREE" | "PREMIUM" | "ENTERPRISE">("FREE")
  const [newNote, setNewNote] = useState("")
  const [billingActionLoading, setBillingActionLoading] = useState(false)
  const [billingActionMessage, setBillingActionMessage] = useState<string | null>(null)
  const [billingActionError, setBillingActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [resolvedParams.id])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setNewTier(data.tier)
      } else if (response.status === 404) {
        router.push("/admin/users")
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: lockReason }),
      })
      if (response.ok) {
        setShowLockModal(false)
        setLockReason("")
        fetchUser()
      }
    } catch (error) {
      console.error("Failed to lock user:", error)
    }
  }

  const handleUnlock = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/unlock`, {
        method: "POST",
      })
      if (response.ok) {
        fetchUser()
      }
    } catch (error) {
      console.error("Failed to unlock user:", error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/admin/users")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const handleTierChange = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      })
      if (response.ok) {
        setShowTierModal(false)
        fetchUser()
      }
    } catch (error) {
      console.error("Failed to change tier:", error)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      })
      if (response.ok) {
        setNewNote("")
        fetchUser()
      }
    } catch (error) {
      console.error("Failed to add note:", error)
    }
  }

  const handleAdminCancelBilling = async () => {
    if (!user) return
    setBillingActionLoading(true)
    setBillingActionMessage(null)
    setBillingActionError(null)
    try {
      const response = await fetch(
        `/api/admin/users/${resolvedParams.id}/billing/cancel`,
        { method: "POST" }
      )
      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }
      setBillingActionMessage("Subscription cancelled.")
      fetchUser()
    } catch (error) {
      console.error("Failed to cancel subscription:", error)
      setBillingActionError(
        "Unable to cancel the subscription right now."
      )
    } finally {
      setBillingActionLoading(false)
    }
  }

  const handleOpenStripeDashboard = () => {
    if (typeof window === "undefined" || !user?.stripeSubscriptionId) return
    window.open(
      `https://dashboard.stripe.com/subscriptions/${user.stripeSubscriptionId}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="User Details"
        description={user.email}
        actions={
          <div className="flex items-center gap-2">
            <GlowButton variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
              Back to Users
            </GlowButton>
          </div>
        }
      />

      <div className="p-6">
        {/* User Header Card */}
        <GlassCard className="mb-6 p-6" hover={false}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan text-2xl font-bold text-white">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {user.name || "No name"}
                  </h2>
                  {user.emailVerified && (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <TierBadge tier={user.tier} />
                  <StatusBadge status={user.status} />
                </div>
              </div>
            </div>

            {canModifyUsers && (
              <div className="flex flex-wrap items-center gap-2">
                <GlowButton variant="secondary" size="sm" onClick={() => setShowTierModal(true)}>
                  Change Tier
                </GlowButton>
                {user.status === "active" ? (
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLockModal(true)}
                    className="!border-yellow-500/50 !text-yellow-500"
                  >
                    Lock Account
                  </GlowButton>
                ) : user.status === "locked" ? (
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    onClick={handleUnlock}
                    className="!border-green-500/50 !text-green-500"
                  >
                    Unlock Account
                  </GlowButton>
                ) : null}
                {canDeleteUsers && (
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                    className="!border-red-500/50 !text-red-500"
                  >
                    Delete
                  </GlowButton>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card/30 p-1">
          {(["overview", "activity", "security", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-brand-purple text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Stats */}
            <GlassCard className="p-6" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Usage Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monthly Detections</span>
                  <span className="font-semibold text-foreground">{user.monthlyDetections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Detections</span>
                  <span className="font-semibold text-foreground">{user.totalDetections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Detection</span>
                  <span className="text-foreground">
                    {user.lastDetectionAt
                      ? new Date(user.lastDetectionAt).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Access</span>
                  <span className={user.apiKeyEnabled ? "text-green-500" : "text-muted-foreground"}>
                    {user.apiKeyEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Detection Chart */}
            <GlassCard className="p-6 lg:col-span-2" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Detection History</h3>
              {user.detectionHistory && user.detectionHistory.length > 0 ? (
                <SimpleChart
                  data={user.detectionHistory.map((d) => ({
                    label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
                    value: d.count,
                  }))}
                  height={180}
                  type="line"
                  color="var(--brand-purple)"
                />
              ) : (
                <div className="flex h-[180px] items-center justify-center text-muted-foreground">
                  No detection data available
                </div>
              )}
            </GlassCard>

            {/* Account Info */}
            <GlassCard className="p-6 lg:col-span-3" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Account Information</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium text-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Verified</p>
                  <p className={`font-medium ${user.emailVerified ? "text-green-500" : "text-yellow-500"}`}>
                    {user.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stripe Customer</p>
                  <p className="font-medium text-foreground">
                    {user.stripeCustomerId ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-purple hover:underline"
                      >
                        View in Stripe
                      </a>
                    ) : (
                      "None"
                    )}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-6 lg:col-span-3" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Billing
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Plan
                  </p>
                  <p className="text-white">
                    {user.billingPlan
                      ? user.billingPlan.charAt(0).toUpperCase() +
                        user.billingPlan.slice(1)
                      : user.tier}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Billing cycle
                  </p>
                  <p className="text-white">
                    {user.billingCycle === "annual"
                      ? "Annual"
                      : user.billingCycle === "monthly"
                      ? "Monthly"
                      : "Pay as you go"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Next renewal
                  </p>
                  <p className="text-white">
                    {user.stripeCurrentPeriodEnd
                      ? new Date(user.stripeCurrentPeriodEnd).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Stripe customer
                  </p>
                  <p className="text-white">
                    {user.stripeCustomerId || "None"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {billingActionMessage && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                    {billingActionMessage}
                  </div>
                )}
                {billingActionError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {billingActionError}
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {user.stripeSubscriptionId && (
                  <GlowButton
                    variant="secondary"
                    onClick={handleAdminCancelBilling}
                    disabled={billingActionLoading}
                  >
                    {billingActionLoading
                      ? "Cancelling..."
                      : "Cancel subscription"}
                  </GlowButton>
                )}
                {user.stripeSubscriptionId && (
                  <GlowButton variant="ghost" onClick={handleOpenStripeDashboard}>
                    View in Stripe
                  </GlowButton>
                )}
              </div>
              {user.stripeSubscriptionId && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Subscription ID: {user.stripeSubscriptionId}
                </p>
              )}
              {user.stripePriceId && (
                <p className="text-xs text-muted-foreground">
                  Price ID: {user.stripePriceId}
                </p>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === "activity" && (
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Detections</h3>
            {user.recentDetections && user.recentDetections.length > 0 ? (
              <div className="space-y-3">
                {user.recentDetections.map((detection) => (
                  <div
                    key={detection.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card/30 p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{detection.verdict}</p>
                      <p className="text-sm text-muted-foreground">
                        Score: {(detection.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(detection.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent detections</p>
            )}
          </GlassCard>
        )}

        {activeTab === "security" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-6" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">API Key</h3>
              {user.apiKey ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card/50 p-3 font-mono text-sm">
                    {user.apiKey.slice(0, 8)}...{user.apiKey.slice(-8)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Status: {user.apiKeyEnabled ? "Active" : "Disabled"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No API key generated</p>
              )}
            </GlassCard>

            <GlassCard className="p-6" hover={false}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Lock Status</h3>
              {user.lockedAt ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Locked at:</span>{" "}
                    <span className="text-foreground">{new Date(user.lockedAt).toLocaleString()}</span>
                  </p>
                  {user.lockedReason && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      <span className="text-foreground">{user.lockedReason}</span>
                    </p>
                  )}
                  {user.lockedBy && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Locked by:</span>{" "}
                      <span className="text-foreground">{user.lockedBy}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Account is not locked</p>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === "notes" && (
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Admin Notes</h3>

            {canModifyUsers && (
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full rounded-xl border border-border bg-card/50 p-3 text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <GlowButton size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </GlowButton>
                </div>
              </div>
            )}

            {user.notes && user.notes.length > 0 ? (
              <div className="space-y-3">
                {user.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-border bg-card/30 p-4"
                  >
                    <p className="text-foreground">{note.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>by {note.createdBy}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No notes yet</p>
            )}
          </GlassCard>
        )}
      </div>

      {/* Lock Modal */}
      <Modal
        isOpen={showLockModal}
        onClose={() => {
          setShowLockModal(false)
          setLockReason("")
        }}
        title="Lock Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Lock this account to prevent the user from logging in.
          </p>
          <textarea
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="Reason for locking (optional)"
            className="w-full rounded-xl border border-border bg-card/50 p-3 text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <GlowButton variant="ghost" onClick={() => setShowLockModal(false)}>
              Cancel
            </GlowButton>
            <GlowButton onClick={handleLock} className="!bg-yellow-500 hover:!bg-yellow-600">
              Lock Account
            </GlowButton>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this account? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <GlowButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </GlowButton>
            <GlowButton onClick={handleDelete} className="!bg-red-500 hover:!bg-red-600">
              Delete Account
            </GlowButton>
          </div>
        </div>
      </Modal>

      {/* Tier Modal */}
      <Modal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        title="Change Tier"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a new tier for this user.
          </p>
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value as "FREE" | "PREMIUM" | "ENTERPRISE")}
            className="w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground focus:border-brand-purple focus:outline-none"
          >
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <div className="flex justify-end gap-3">
            <GlowButton variant="ghost" onClick={() => setShowTierModal(false)}>
              Cancel
            </GlowButton>
            <GlowButton onClick={handleTierChange}>
              Save Changes
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

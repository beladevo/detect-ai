"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import { useAdmin } from "@/src/context/AdminContext"

interface FeatureFlag {
  id: string
  key: string
  description: string | null
  enabled: boolean
  freeEnabled: boolean
  premiumEnabled: boolean
  enterpriseEnabled: boolean
}

export default function FeatureFlagsPage() {
  const { canModifySettings } = useAdmin()
  const [features, setFeatures] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatures()
  }, [])

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/admin/feature-flags")
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      }
    } catch (error) {
      console.error("Failed to fetch features:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFeature = async (
    key: string,
    field: "enabled" | "freeEnabled" | "premiumEnabled" | "enterpriseEnabled",
    value: boolean
  ) => {
    setSaving(key)
    try {
      const response = await fetch(`/api/admin/feature-flags/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (response.ok) {
        setFeatures((prev) =>
          prev.map((f) => (f.key === key ? { ...f, [field]: value } : f))
        )
      }
    } catch (error) {
      console.error("Failed to update feature:", error)
    } finally {
      setSaving(null)
    }
  }

  const featureLabels: Record<string, { name: string; description: string }> = {
    multiple_models: {
      name: "Multiple Models",
      description: "Use multiple ONNX models in ensemble for better accuracy",
    },
    api_access: {
      name: "API Access",
      description: "Allow users to generate and use API keys",
    },
    advanced_analytics: {
      name: "Advanced Analytics",
      description: "Detailed detection analytics and history",
    },
    cloud_storage: {
      name: "Cloud Storage",
      description: "Store detection results in cloud storage",
    },
    priority_queue: {
      name: "Priority Queue",
      description: "Process detections with higher priority",
    },
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Feature Flags"
        description="Enable or disable features per tier"
        actions={
          <GlowButton variant="ghost" onClick={() => window.location.href = "/admin/settings"}>
            Back to Settings
          </GlowButton>
        }
      />

      <div className="p-6">
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Global
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Free
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Premium
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => {
                const labels = featureLabels[feature.key] || {
                  name: feature.key,
                  description: feature.description,
                }

                return (
                  <tr key={feature.id} className="border-b border-border/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{labels.name}</p>
                      <p className="text-sm text-muted-foreground">{labels.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleButton
                        enabled={feature.enabled}
                        onChange={(val) => updateFeature(feature.key, "enabled", val)}
                        disabled={!canModifySettings || saving === feature.key}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleButton
                        enabled={feature.freeEnabled}
                        onChange={(val) => updateFeature(feature.key, "freeEnabled", val)}
                        disabled={!canModifySettings || saving === feature.key}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleButton
                        enabled={feature.premiumEnabled}
                        onChange={(val) => updateFeature(feature.key, "premiumEnabled", val)}
                        disabled={!canModifySettings || saving === feature.key}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ToggleButton
                        enabled={feature.enterpriseEnabled}
                        onChange={(val) => updateFeature(feature.key, "enterpriseEnabled", val)}
                        disabled={!canModifySettings || saving === feature.key}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {features.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No feature flags configured
            </div>
          )}
        </GlassCard>

        {/* Info Card */}
        <GlassCard className="mt-6 p-6" hover={false}>
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">How Feature Flags Work</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Global Toggle:</strong> Master switch for the feature.
              If disabled, the feature is off for all users regardless of tier settings.
            </p>
            <p>
              <strong className="text-foreground">Tier Toggles:</strong> Control feature access per subscription tier.
              Only applies when the global toggle is enabled.
            </p>
            <p>
              <strong className="text-foreground">Environment Override:</strong> Set{" "}
              <code className="rounded bg-card px-1">NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true</code>{" "}
              to enable all premium features globally (useful for development).
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function ToggleButton({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-brand-purple" : "bg-card"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

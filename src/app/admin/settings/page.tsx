"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import { useAdmin } from "@/src/context/AdminContext"

interface SystemSettings {
  siteName: string
  siteTagline: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  defaultUserTier: "FREE" | "PREMIUM" | "ENTERPRISE"
  defaultApiModel: string
  defaultBrowserModel: string
  maxFileSize: number
  enabledPipelineModules: string[]
  rateLimits: {
    free: { daily: number; monthly: number; perMinute: number }
    premium: { daily: number; monthly: number; perMinute: number }
    enterprise: { daily: number; monthly: number; perMinute: number }
  }
}

const defaultSettings: SystemSettings = {
  siteName: "Imagion",
  siteTagline: "AI Image Detector",
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: false,
  defaultUserTier: "FREE",
  defaultApiModel: "model_q4.onnx",
  defaultBrowserModel: "model_q4.onnx",
  maxFileSize: 10485760,
  enabledPipelineModules: ["mlEnsemble", "frequencyForensics", "physicsConsistency", "visualArtifacts", "metadataForensics", "provenance"],
  rateLimits: {
    free: { daily: 50, monthly: 1000, perMinute: 10 },
    premium: { daily: 1000, monthly: 30000, perMinute: 30 },
    enterprise: { daily: 10000, monthly: 300000, perMinute: 100 },
  },
}

export default function SettingsPage() {
  const { canModifySettings } = useAdmin()
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateRateLimit = (
    tier: "free" | "premium" | "enterprise",
    field: "daily" | "monthly" | "perMinute",
    value: number
  ) => {
    setSettings((prev) => ({
      ...prev,
      rateLimits: {
        ...prev.rateLimits,
        [tier]: {
          ...prev.rateLimits[tier],
          [field]: value,
        },
      },
    }))
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
        title="Settings"
        description="Configure platform settings"
        actions={
          canModifySettings && (
            <GlowButton onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </GlowButton>
          )
        }
      />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Platform Settings */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-6 font-display text-lg font-semibold text-foreground">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateSetting("siteName", e.target.value)}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Tagline</label>
                <input
                  type="text"
                  value={settings.siteTagline}
                  onChange={(e) => updateSetting("siteTagline", e.target.value)}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Temporarily disable the site</p>
                </div>
                <button
                  onClick={() => updateSetting("maintenanceMode", !settings.maintenanceMode)}
                  disabled={!canModifySettings}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings.maintenanceMode ? "bg-brand-purple" : "bg-card"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                      settings.maintenanceMode ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Registration Enabled</p>
                  <p className="text-sm text-muted-foreground">Allow new user signups</p>
                </div>
                <button
                  onClick={() => updateSetting("registrationEnabled", !settings.registrationEnabled)}
                  disabled={!canModifySettings}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings.registrationEnabled ? "bg-brand-purple" : "bg-card"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                      settings.registrationEnabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Verification Required</p>
                  <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                </div>
                <button
                  onClick={() => updateSetting("emailVerificationRequired", !settings.emailVerificationRequired)}
                  disabled={!canModifySettings}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    settings.emailVerificationRequired ? "bg-brand-purple" : "bg-card"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                      settings.emailVerificationRequired ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Default User Tier</label>
                <select
                  value={settings.defaultUserTier}
                  onChange={(e) => updateSetting("defaultUserTier", e.target.value as "FREE" | "PREMIUM" | "ENTERPRISE")}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                >
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Detection Settings */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="mb-6 font-display text-lg font-semibold text-foreground">Detection Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Default API Model</label>
                <select
                  value={settings.defaultApiModel}
                  onChange={(e) => updateSetting("defaultApiModel", e.target.value)}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                >
                  <option value="model.onnx">model.onnx</option>
                  <option value="model_q4.onnx">model_q4.onnx (Quantized)</option>
                  <option value="nyuad.onnx">nyuad.onnx</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Default Browser Model</label>
                <select
                  value={settings.defaultBrowserModel}
                  onChange={(e) => updateSetting("defaultBrowserModel", e.target.value)}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                >
                  <option value="model.onnx">model.onnx</option>
                  <option value="model_q4.onnx">model_q4.onnx (Quantized)</option>
                  <option value="nyuad.onnx">nyuad.onnx</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Max File Size (bytes)</label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting("maxFileSize", parseInt(e.target.value))}
                  disabled={!canModifySettings}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {(settings.maxFileSize / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Rate Limits */}
          <GlassCard className="p-6 lg:col-span-2" hover={false}>
            <h3 className="mb-6 font-display text-lg font-semibold text-foreground">Rate Limits</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {(["free", "premium", "enterprise"] as const).map((tier) => (
                <div key={tier} className="rounded-xl border border-border bg-card/30 p-4">
                  <h4 className="mb-4 font-semibold capitalize text-foreground">{tier}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Daily Limit</label>
                      <input
                        type="number"
                        value={settings.rateLimits[tier].daily}
                        onChange={(e) => updateRateLimit(tier, "daily", parseInt(e.target.value))}
                        disabled={!canModifySettings}
                        className="w-full rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Monthly Limit</label>
                      <input
                        type="number"
                        value={settings.rateLimits[tier].monthly}
                        onChange={(e) => updateRateLimit(tier, "monthly", parseInt(e.target.value))}
                        disabled={!canModifySettings}
                        className="w-full rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Per Minute</label>
                      <input
                        type="number"
                        value={settings.rateLimits[tier].perMinute}
                        onChange={(e) => updateRateLimit(tier, "perMinute", parseInt(e.target.value))}
                        disabled={!canModifySettings}
                        className="w-full rounded-lg border border-border bg-card/50 px-3 py-1.5 text-sm text-foreground focus:border-brand-purple focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Links */}
          <GlassCard className="p-6 lg:col-span-2" hover={false}>
            <h3 className="mb-6 font-display text-lg font-semibold text-foreground">More Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="/admin/settings/models"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/30 p-4 transition-colors hover:bg-card/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Model Configuration</p>
                  <p className="text-sm text-muted-foreground">Manage ONNX models and settings</p>
                </div>
              </a>
              <a
                href="/admin/settings/features"
                className="flex items-center gap-3 rounded-xl border border-border bg-card/30 p-4 transition-colors hover:bg-card/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Feature Flags</p>
                  <p className="text-sm text-muted-foreground">Toggle features per tier</p>
                </div>
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

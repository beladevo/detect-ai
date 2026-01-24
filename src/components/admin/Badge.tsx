"use client"

import React from "react"

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple"
  | "cyan"
  | "pink"
  | "outline"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: "sm" | "md"
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-foreground/10 text-foreground",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  error: "bg-red-500/10 text-red-500",
  info: "bg-blue-500/10 text-blue-500",
  purple: "bg-brand-purple/10 text-brand-purple",
  cyan: "bg-brand-cyan/10 text-brand-cyan",
  pink: "bg-brand-pink/10 text-brand-pink",
  outline: "border border-border bg-transparent text-muted-foreground",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === "success" ? "bg-green-500" :
            variant === "warning" ? "bg-yellow-500" :
            variant === "error" ? "bg-red-500" :
            variant === "info" ? "bg-blue-500" :
            variant === "purple" ? "bg-brand-purple" :
            variant === "cyan" ? "bg-brand-cyan" :
            variant === "pink" ? "bg-brand-pink" :
            "bg-current"
          }`}
        />
      )}
      {children}
    </span>
  )
}

export function TierBadge({ tier }: { tier: "FREE" | "PREMIUM" | "ENTERPRISE" }) {
  const tierConfig = {
    FREE: { variant: "default" as const, label: "Free" },
    PREMIUM: { variant: "purple" as const, label: "Premium" },
    ENTERPRISE: { variant: "cyan" as const, label: "Enterprise" },
  }

  const config = tierConfig[tier]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function StatusBadge({ status }: { status: "active" | "locked" | "suspended" | "deleted" }) {
  const statusConfig = {
    active: { variant: "success" as const, label: "Active", dot: true },
    locked: { variant: "error" as const, label: "Locked", dot: true },
    suspended: { variant: "warning" as const, label: "Suspended", dot: true },
    deleted: { variant: "default" as const, label: "Deleted", dot: true },
  }

  const config = statusConfig[status]
  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>
}

export function RoleBadge({ role }: { role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "READONLY" }) {
  const roleConfig = {
    SUPER_ADMIN: { variant: "purple" as const, label: "Super Admin" },
    ADMIN: { variant: "cyan" as const, label: "Admin" },
    MODERATOR: { variant: "pink" as const, label: "Moderator" },
    READONLY: { variant: "outline" as const, label: "Read Only" },
  }

  const config = roleConfig[role]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

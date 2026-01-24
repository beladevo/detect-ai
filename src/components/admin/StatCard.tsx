"use client"

import React from "react"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  variant?: "default" | "purple" | "cyan" | "pink" | "emerald"
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: "bg-card/50",
      iconBg: "bg-foreground/10",
      iconColor: "text-foreground",
    },
    purple: {
      bg: "bg-gradient-to-br from-brand-purple/10 to-transparent",
      iconBg: "bg-brand-purple/20",
      iconColor: "text-brand-purple",
    },
    cyan: {
      bg: "bg-gradient-to-br from-brand-cyan/10 to-transparent",
      iconBg: "bg-brand-cyan/20",
      iconColor: "text-brand-cyan",
    },
    pink: {
      bg: "bg-gradient-to-br from-brand-pink/10 to-transparent",
      iconBg: "bg-brand-pink/20",
      iconColor: "text-brand-pink",
    },
    emerald: {
      bg: "bg-gradient-to-br from-brand-mint/10 to-transparent",
      iconBg: "bg-brand-mint/20",
      iconColor: "text-brand-mint",
    },
  }

  const styles = variantStyles[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-border ${styles.bg} p-6 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            className="mt-2 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {change >= 0 ? (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-purple/20 to-transparent blur-2xl" />
    </motion.div>
  )
}

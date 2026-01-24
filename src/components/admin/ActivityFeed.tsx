"use client"

import React from "react"
import { motion } from "framer-motion"

interface Activity {
  id: string
  type: "user_signup" | "detection" | "subscription" | "admin_action" | "security"
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    email: string
  }
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
  loading?: boolean
}

const activityIcons: Record<Activity["type"], React.ReactNode> = {
  user_signup: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  detection: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  subscription: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  admin_action: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  security: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
}

const activityColors: Record<Activity["type"], string> = {
  user_signup: "bg-green-500/10 text-green-500",
  detection: "bg-brand-purple/10 text-brand-purple",
  subscription: "bg-brand-cyan/10 text-brand-cyan",
  admin_action: "bg-brand-pink/10 text-brand-pink",
  security: "bg-red-500/10 text-red-500",
}

export default function ActivityFeed({
  activities,
  maxItems = 10,
  loading = false,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-card" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-card" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-card" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayedActivities.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-start gap-3"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors[activity.type]}`}>
            {activityIcons[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{activity.title}</p>
            <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
            {activity.user && (
              <p className="mt-1 text-xs text-muted-foreground">
                by {activity.user.name || activity.user.email}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

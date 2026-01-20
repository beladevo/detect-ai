"use client"

import { Crown } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PremiumBadge({ size = "sm", className }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-2 py-0.5",
      className
    )}>
      <Crown className={cn("text-amber-400", sizeClasses[size])} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
        Premium
      </span>
    </div>
  )
}

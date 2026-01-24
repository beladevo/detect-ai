"use client"

import React from "react"
import { motion } from "framer-motion"

interface DataPoint {
  label: string
  value: number
}

interface SimpleChartProps {
  data: DataPoint[]
  height?: number
  color?: string
  showLabels?: boolean
  showValues?: boolean
  type?: "bar" | "line"
}

export default function SimpleChart({
  data,
  height = 200,
  color = "var(--brand-purple)",
  showLabels = true,
  showValues = false,
  type = "bar",
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  if (type === "line") {
    return <LineChart data={data} height={height} color={color} showLabels={showLabels} />
  }

  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-1"
        style={{ height }}
      >
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * 100

          return (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center"
            >
              <motion.div
                className="w-full rounded-t-lg"
                style={{ backgroundColor: color }}
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              />
            </div>
          )
        })}
      </div>
      {showLabels && (
        <div className="mt-2 flex justify-between">
          {data.map((point) => (
            <div key={point.label} className="flex-1 text-center">
              <p className="text-xs text-muted-foreground truncate">{point.label}</p>
              {showValues && (
                <p className="text-xs font-medium text-foreground">{point.value}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LineChart({
  data,
  height,
  color,
  showLabels,
}: {
  data: DataPoint[]
  height: number
  color: string
  showLabels: boolean
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const width = 100
  const padding = 10

  const points = data.map((point, index) => ({
    x: padding + (index * (width - 2 * padding)) / (data.length - 1 || 1),
    y: height - padding - ((point.value / maxValue) * (height - 2 * padding)),
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  const areaD = `${pathD} L ${points[points.length - 1]?.x || padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          />
        ))}
      </svg>
      {showLabels && (
        <div className="mt-2 flex justify-between">
          {data.map((point) => (
            <p key={point.label} className="flex-1 text-center text-xs text-muted-foreground truncate">
              {point.label}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 24,
}: {
  data: { label: string; value: number; color: string }[]
  size?: number
  strokeWidth?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativeOffset = 0

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {data.map((segment, index) => {
          const percentage = total > 0 ? segment.value / total : 0
          const dashLength = circumference * percentage
          const dashOffset = circumference * cumulativeOffset
          cumulativeOffset += percentage

          return (
            <motion.circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-dashOffset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">Total</span>
      </div>
    </div>
  )
}

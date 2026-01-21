"use client";

import React from "react";
import { motion } from "framer-motion";

interface ConfidenceDisplayProps {
  confidence: number;
  uncertainty?: number;
  verdict: string;
  size?: "small" | "medium" | "large";
  showInterval?: boolean;
}

export default function ConfidenceDisplay({
  confidence,
  uncertainty = 0,
  verdict,
  size = "medium",
  showInterval = true,
}: ConfidenceDisplayProps) {
  const confidencePercent = confidence * 100;
  const uncertaintyPercent = uncertainty * 100;
  const lowerBound = Math.max(0, confidencePercent - uncertaintyPercent);
  const upperBound = Math.min(100, confidencePercent + uncertaintyPercent);

  const getVerdictColor = () => {
    if (verdict === "AI_GENERATED") return "text-red-400";
    if (verdict === "LIKELY_AI") return "text-orange-400";
    if (verdict === "UNCERTAIN") return "text-yellow-400";
    if (verdict === "LIKELY_REAL") return "text-emerald-400";
    if (verdict === "REAL") return "text-green-400";
    return "text-gray-400";
  };

  const getVerdictBg = () => {
    if (verdict === "AI_GENERATED") return "bg-red-500";
    if (verdict === "LIKELY_AI") return "bg-orange-500";
    if (verdict === "UNCERTAIN") return "bg-yellow-500";
    if (verdict === "LIKELY_REAL") return "bg-emerald-500";
    if (verdict === "REAL") return "bg-green-500";
    return "bg-gray-500";
  };

  const sizeClasses = {
    small: {
      value: "text-2xl",
      label: "text-[10px]",
      interval: "text-xs",
    },
    medium: {
      value: "text-4xl",
      label: "text-xs",
      interval: "text-sm",
    },
    large: {
      value: "text-6xl",
      label: "text-sm",
      interval: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-baseline gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`font-bold ${getVerdictColor()} ${classes.value}`}
        >
          {confidencePercent.toFixed(1)}%
        </motion.div>

        {showInterval && uncertainty > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`${classes.interval} text-gray-400`}
          >
            ± {uncertaintyPercent.toFixed(1)}%
          </motion.div>
        )}
      </div>

      {showInterval && uncertainty > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className={`${classes.label} text-gray-500`}
        >
          Range: {lowerBound.toFixed(1)}% - {upperBound.toFixed(1)}%
        </motion.div>
      )}

      <div className="relative mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
        {/* Uncertainty range background */}
        {showInterval && uncertainty > 0 && (
          <div
            className="absolute h-2 bg-white/10"
            style={{
              left: `${lowerBound}%`,
              width: `${upperBound - lowerBound}%`,
            }}
          />
        )}
        {/* Main confidence bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidencePercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${getVerdictBg()} opacity-80`}
        />
      </div>
    </div>
  );
}

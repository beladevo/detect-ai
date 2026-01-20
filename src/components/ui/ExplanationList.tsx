"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";
import { getExplanations } from "@/src/lib/explanations";

interface ExplanationListProps {
  flags: string[];
  maxDisplay?: number;
}

export default function ExplanationList({ flags, maxDisplay }: ExplanationListProps) {
  const explanations = getExplanations(flags);
  const displayedExplanations = maxDisplay
    ? explanations.slice(0, maxDisplay)
    : explanations;
  const hasMore = maxDisplay && explanations.length > maxDisplay;

  const getSeverityIcon = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColors = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          icon: "text-red-400",
          text: "text-red-300",
        };
      case "medium":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          icon: "text-yellow-400",
          text: "text-yellow-300",
        };
      case "low":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          icon: "text-blue-400",
          text: "text-blue-300",
        };
    }
  };

  if (explanations.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <Info className="mx-auto mb-2 h-5 w-5 text-gray-500" />
        <p className="text-sm text-gray-400">No specific findings to report</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedExplanations.map((explanation, index) => {
        const colors = getSeverityColors(explanation.severity);
        const icon = getSeverityIcon(explanation.severity);

        return (
          <motion.div
            key={explanation.flag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all hover:bg-opacity-80`}
          >
            <div className="flex gap-3">
              <div className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>{icon}</div>
              <div className="flex-1 space-y-1">
                <h4 className={`text-sm font-semibold ${colors.text}`}>
                  {explanation.title}
                </h4>
                <p className="text-xs leading-relaxed text-gray-300">
                  {explanation.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {hasMore && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            +{explanations.length - maxDisplay} more finding
            {explanations.length - maxDisplay > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

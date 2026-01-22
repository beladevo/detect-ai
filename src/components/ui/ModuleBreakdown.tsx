"use client";

import React from "react";
import { motion } from "framer-motion";
import { getModuleName, getModuleColor } from "@/src/lib/explanations";

interface ModuleBreakdownProps {
  weights: Record<string, number>;
  scores: Record<string, number>;
  finalConfidence: number;
}

export default function ModuleBreakdown({
  weights,
  scores,
  finalConfidence,
}: ModuleBreakdownProps) {
  const modules = Object.keys(weights).map((key) => ({
    name: key,
    displayName: getModuleName(key),
    weight: weights[key],
    score: scores[key],
    contribution: weights[key] * scores[key],
  }));

  // Sort by contribution (highest first)
  modules.sort((a, b) => b.contribution - a.contribution);

  const getColorClasses = (module: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      purple: { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500/30" },
      blue: { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-500/30" },
      pink: { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-500/30" },
      cyan: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500/30" },
      orange: { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500/30" },
      green: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30" },
    };
    const color = getModuleColor(module);
    return colorMap[color] ?? colorMap.purple;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Module Contribution Breakdown</h3>
        <div className="text-xs text-gray-500">
          Final: <span className="font-semibold text-gray-300">{(finalConfidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((module, index) => {
          const colors = getColorClasses(module.name);
          const contributionPercent = module.contribution * 100;

          return (
            <motion.div
              key={module.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${colors.bg}`} />
                  <span className="font-medium text-gray-300">{module.displayName}</span>
                  <span className="text-gray-500">
                    ({(module.weight * 100).toFixed(0)}% weight)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    Score: {(module.score * 100).toFixed(0)}%
                  </span>
                  <span className={`font-semibold ${colors.text}`}>
                    +{contributionPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, contributionPercent)}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${colors.bg} opacity-80`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Combined weighted score</span>
          <span className="font-semibold text-gray-200">
            {(finalConfidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="text-[10px] text-gray-500">
        Each module's contribution = weight × score. Higher scores indicate stronger AI generation signals.
      </div>
    </div>
  );
}

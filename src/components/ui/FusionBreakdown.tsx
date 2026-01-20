"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import type { FusionResult } from "@/src/lib/pipeline/types";

interface FusionBreakdownProps {
  fusion: FusionResult;
}

export default function FusionBreakdown({ fusion }: FusionBreakdownProps) {
  const modules = [
    { key: "ml", label: "AI Model Ensemble", color: "text-purple-400", bgColor: "bg-purple-500" },
    { key: "frequency", label: "Frequency Analysis", color: "text-cyan-400", bgColor: "bg-cyan-500" },
    { key: "physics", label: "Physics Consistency", color: "text-pink-400", bgColor: "bg-pink-500" },
    { key: "visual", label: "Visual Artifacts", color: "text-amber-400", bgColor: "bg-amber-500" },
    { key: "metadata", label: "Metadata Forensics", color: "text-emerald-400", bgColor: "bg-emerald-500" },
  ];

  const totalWeightedScore = Object.values(fusion.weighted_scores).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2">
          <Calculator className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Score Calculation Breakdown</h3>
          <p className="text-xs text-gray-400">Transparent view of how the final score is computed</p>
        </div>
      </div>

      {/* Module Contributions */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h4 className="mb-4 text-sm font-semibold text-gray-300">Module Contributions</h4>
        <div className="space-y-3">
          {modules.map((module) => {
            const rawScore = fusion.module_scores[module.key as keyof typeof fusion.module_scores];
            const weight = fusion.weights[module.key as keyof typeof fusion.weights];
            const weightedScore = fusion.weighted_scores[module.key as keyof typeof fusion.weighted_scores];

            return (
              <div key={module.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${module.color}`}>{module.label}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Score: {(rawScore * 100).toFixed(1)}%</span>
                    <span>×</span>
                    <span>Weight: {(weight * 100).toFixed(1)}%</span>
                    <span>=</span>
                    <span className="font-semibold text-white">{(weightedScore * 100).toFixed(2)}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Raw Score Bar */}
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rawScore * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${module.bgColor} opacity-50`}
                      />
                    </div>
                  </div>
                  {/* Weighted Score Bar */}
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(weightedScore / weight) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className={`h-full ${module.bgColor}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">Weighted Sum</span>
            <span className="text-lg font-bold text-white">{(totalWeightedScore * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Adjustments */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h4 className="mb-4 text-sm font-semibold text-gray-300">Final Adjustments</h4>
        <div className="space-y-3">
          {/* Contradiction Penalty */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Contradiction Penalty</span>
                <span className="text-sm font-semibold text-amber-400">
                  -{(fusion.contradiction_penalty * 100).toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Applied when module scores significantly disagree, reducing confidence in the result
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${fusion.contradiction_penalty * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Score */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-semibold text-gray-300">Final AI Detection Score</span>
          </div>
          <span className="text-2xl font-bold text-white">{(fusion.confidence * 100).toFixed(1)}%</span>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Formula: (Weighted Sum) × (1 - Contradiction Penalty) = {(totalWeightedScore * 100).toFixed(2)}% × {((1 - fusion.contradiction_penalty) * 100).toFixed(1)}% = {(fusion.confidence * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

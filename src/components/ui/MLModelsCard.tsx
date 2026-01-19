"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, XCircle, BarChart3, TrendingUp } from "lucide-react";
import type { MlEnsembleResult } from "@/src/lib/pipeline/types";

interface MLModelsCardProps {
  ml: MlEnsembleResult;
}

export default function MLModelsCard({ ml }: MLModelsCardProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2">
          <Brain className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-100">AI Model Predictions</h4>
          <p className="text-xs text-gray-500">Individual model scores and ensemble statistics</p>
        </div>
      </div>

      {/* Individual Model Votes */}
      <div className="space-y-3">
        {ml.model_votes.map((vote, idx) => {
          const isAI = vote.prediction === "AI";
          const confidencePercent = vote.confidence * 100;

          return (
            <motion.div
              key={vote.model}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {isAI ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">{vote.model}</div>
                    <div className="text-xs text-gray-500">
                      Prediction: <span className={isAI ? "text-red-300" : "text-emerald-300"}>{vote.prediction}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">{confidencePercent.toFixed(1)}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">Confidence</div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  className={`h-full ${isAI ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-emerald-500 to-cyan-500"}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ensemble Statistics */}
      {ml.ensemble_stats && (
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-gray-300">Ensemble Statistics</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-gray-500">Mean</div>
              <div className="mt-1 text-lg font-semibold text-white">{(ml.ensemble_stats.mean * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-gray-500">Spread</div>
              <div className="mt-1 text-lg font-semibold text-white">{(ml.ensemble_stats.spread * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-gray-500">Variance</div>
              <div className="mt-1 text-lg font-semibold text-white">{(ml.ensemble_stats.variance * 100).toFixed(2)}%</div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
            <TrendingUp className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <p>
              {ml.ensemble_stats.spread < 0.15
                ? "High agreement between models - confident prediction"
                : ml.ensemble_stats.spread < 0.25
                ? "Moderate agreement between models"
                : "Significant disagreement detected - lower confidence"}
            </p>
          </div>
        </div>
      )}

      {/* Flags */}
      {ml.flags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ml.flags.map((flag) => (
            <span
              key={flag}
              className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-purple-200"
            >
              {flag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

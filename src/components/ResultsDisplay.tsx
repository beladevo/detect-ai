"use client";

import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RotateCcw,
  Fingerprint, Aperture, BarChart3, ScanEye, ArrowRight, Eye,
  Zap, Brain, Share2
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import Modal from "./ui/Modal";
import GlassCard from "./ui/GlassCard";
import GlowButton from "./ui/GlowButton";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import MLModelsCard from "./ui/MLModelsCard";
import FusionBreakdown from "./ui/FusionBreakdown";
import DetailCard from "./ui/DetailCard";
import ShareModal from "./ShareModal";
import DetectionVisualization from "./ui/DetectionVisualization";
import ModuleBreakdown from "./ui/ModuleBreakdown";
import ExplanationList from "./ui/ExplanationList";
import ConfidenceDisplay from "./ui/ConfidenceDisplay";
import ExportButton from "./ui/ExportButton";

type ResultsDisplayProps = {
  score: number;
  verdict?: "ai" | "real" | "uncertain";
  confidenceLabel: string;
  onReset: () => void;
  pipeline?: PipelineResult;
  imageUrl?: string;
};

export default function ResultsDisplay({
  score,
  verdict,
  confidenceLabel,
  onReset,
  pipeline,
  imageUrl,
}: ResultsDisplayProps) {
  const [showModal, setShowModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [displayScore, setDisplayScore] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = score;
    if (start === end) return;

    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  const config = {
    ai: {
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      iconBg: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      glowColor: "rgba(139,92,246,0.2)",
      Icon: ShieldAlert,
      title: "AI-Generated Detected",
      message: "Detected signatures consistent with AI-generated imagery.",
    },
    real: {
      gradient: "from-emerald-400 to-cyan-400",
      iconBg: "from-emerald-500/20 to-cyan-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      glowColor: "rgba(52,211,153,0.2)",
      Icon: CheckCircle2,
      title: "Authentic Image",
      message: "The system identifies the image as authentic.",
    },
    uncertain: {
      gradient: "from-amber-400 to-orange-400",
      iconBg: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30",
      glowColor: "rgba(245,158,11,0.2)",
      Icon: AlertCircle,
      title: "Inconclusive Result",
      message: "The result is inconclusive. Consider a secondary check.",
    },
  };

  const current = config[verdict || "uncertain"];
  const Icon = current.Icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mt-10"
      >
        <GlassCard
          hover={false}
          variant="glowing"
          glow={verdict === "ai" ? "purple" : verdict === "real" ? "emerald" : "pink"}
          className="p-8"
        >
          {/* Glass shine effect */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
            }}
          />

          {/* Animated background glow */}
          <motion.div
            className="pointer-events-none absolute -inset-20 opacity-30"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${current.glowColor}, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          <div className="relative z-10">
            {/* Header with icon */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border ${current.borderColor} bg-gradient-to-br ${current.iconBg}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 rounded-2xl bg-white/5" />
                <Icon className={`h-10 w-10 ${current.iconColor}`} />
              </motion.div>

              <motion.h2
                className="mt-6 text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {current.title}
              </motion.h2>

              {/* Score display */}
              <motion.div
                className="mt-6 relative flex justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {/* Animated Glow Ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                    transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                    className={`h-44 w-44 rounded-full border-2 border-dashed ${current.borderColor} opacity-30`}
                  />
                </div>

                <div className="relative flex flex-col items-center justify-center h-44 w-44 rounded-full border-2 border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md shadow-2xl">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className={`text-7xl font-black font-display bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent`}>
                      {displayScore}
                    </span>
                    <span className="text-3xl font-bold text-gray-400 -ml-0.5">%</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] font-semibold text-gray-400">AI Score</p>
                </div>
              </motion.div>

              {/* Disclaimer */}
              <motion.div
                className="mt-6 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4 backdrop-blur-sm">
                  <p className="text-xs text-center text-gray-400 leading-relaxed">
                    AI detection can be imperfect, especially with heavily edited, compressed, or blurred content.
                  </p>
                </div>
              </motion.div>

              {/* View Details Button (Only if pipeline data is available) */}
              {pipeline && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <GlowButton
                    onClick={() => setShowModal(true)}
                    variant="secondary"
                    className="group"
                  >
                    <span>View Detailed Analysis</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </GlowButton>
                </motion.div>
              )}
            </div>

            {/* Confidence Display with Uncertainty */}
            {pipeline?.verdict && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <ConfidenceDisplay
                  confidence={pipeline.verdict.confidence}
                  uncertainty={pipeline.verdict.uncertainty}
                  verdict={pipeline.verdict.verdict}
                />
              </motion.div>
            )}

            {/* Fallback simple confidence meter if no pipeline data */}
            {!pipeline && (
              <motion.div
                className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Confidence Level</span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white">{confidenceLabel}</span>
                  </div>
                </div>

                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${current.gradient} transition-[width] duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </motion.div>
            )}

            {/* Verdict badge */}
            <motion.div
              className={`mt-6 flex items-center justify-center gap-3 rounded-full border ${current.borderColor} bg-gradient-to-r from-transparent via-white/5 to-transparent px-6 py-3`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Icon className={`h-5 w-5 ${current.iconColor}`} />
              <span className="text-sm font-medium text-white">{current.message}</span>
            </motion.div>

            {/* Key Findings - Show top explanations */}
            {pipeline?.verdict && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="mt-6"
              >
                <ExplanationList
                  flags={{
                    visual: pipeline.visual.flags,
                    metadata: pipeline.metadata.flags,
                    physics: pipeline.physics.flags,
                    frequency: pipeline.frequency.flags,
                    provenance: pipeline.provenance.flags,
                  }}
                  maxDisplay={3}
                />
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <GlowButton onClick={onReset} size="lg" className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                <span>Analyze Another</span>
              </GlowButton>

              <button
                onClick={() => setShowShare(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Result</span>
              </button>

              {pipeline && (
                <ExportButton pipeline={pipeline} />
              )}
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        result={{ score, verdict: verdict || "uncertain" }}
      />

      {/* Detailed Analysis Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Comprehensive Analysis"
      >
        <div className="space-y-8">
          <p className="text-gray-400">
            A deep dive into the forensic trace of the image. Our multi-stage pipeline analyzes visual artifacts, metadata anomalies, and physical inconsistencies.
          </p>

          {pipeline && (
            <>
              {/* AI Model Predictions Section */}
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-6">
                <MLModelsCard ml={pipeline.ml} />
              </div>

              {/* Module Contribution Breakdown */}
              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
                <ModuleBreakdown
                  weights={pipeline.fusion.weights}
                  scores={pipeline.fusion.module_scores}
                  finalConfidence={pipeline.fusion.confidence}
                />
              </div>

              {/* Score Calculation Breakdown */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <FusionBreakdown fusion={pipeline.fusion} />
              </div>

              {/* Forensic Modules Grid */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Forensic Module Details</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Visual Artifacts */}
                  <DetailCard
                    title="Visual Analysis"
                    icon={ScanEye}
                    color="purple"
                    score={pipeline.visual.visual_artifacts_score * 100}
                    metrics={[
                      { label: "Skin Smoothing", value: pipeline.visual.details.smoothingScore, threshold: 0.6 },
                      { label: "Texture Consistency", value: pipeline.visual.details.textureMeltScore, threshold: 0.5 },
                      { label: "Symmetry", value: pipeline.visual.details.symmetryScore, threshold: 0.7 },
                    ]}
                    flags={pipeline.visual.flags}
                  />

                  {/* Digital Forensics */}
                  <DetailCard
                    title="Digital Forensics"
                    icon={Fingerprint}
                    color="cyan"
                    score={pipeline.metadata.metadata_score * 100}
                    metrics={[
                      { label: "Metadata Risk", value: pipeline.metadata.metadata_score, threshold: 0.3 },
                      { label: "Frequency Anomalies", value: pipeline.frequency.frequency_score, threshold: 0.5 },
                      { label: "C2PA Signature", value: pipeline.provenance.c2pa_present ? 1 : 0, isBinary: true },
                    ]}
                    flags={[...pipeline.metadata.flags, ...pipeline.provenance.flags]}
                  />

                  {/* Physics & Light */}
                  <DetailCard
                    title="Physics & Light"
                    icon={Zap}
                    color="pink"
                    score={100 - pipeline.physics.physics_score * 100}
                    scoreLabel="Consistency"
                    metrics={[
                      { label: "Lighting Coherence", value: 1 - pipeline.physics.details.lightInconsistency, threshold: 0.3, invertColor: true },
                      { label: "Shadow Alignment", value: 1 - pipeline.physics.details.shadowMisalignment, threshold: 0.4, invertColor: true },
                      { label: "Perspective", value: 1 - pipeline.physics.details.perspectiveChaos, threshold: 0.3, invertColor: true },
                    ]}
                    flags={pipeline.physics.flags}
                  />
                </div>
              </div>

              {/* Detection Visualization */}
              {imageUrl && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <DetectionVisualization pipeline={pipeline} imageUrl={imageUrl} />
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

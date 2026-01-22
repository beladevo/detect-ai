"use client";

import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, ShieldAlert, RotateCcw,
  Fingerprint, ScanEye, ArrowRight,
  Zap, Share2
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import Modal from "./ui/Modal";
import GlassCard from "./ui/GlassCard";
import GlowButton from "./ui/GlowButton";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import DetailCard from "./ui/DetailCard";
import ShareModal from "./ShareModal";
import DetectionVisualization from "./ui/DetectionVisualization";
import ExplanationList from "./ui/ExplanationList";
import ExportButton from "./ui/ExportButton";
import NumberTicker from "./ui/NumberTicker";
import { BorderBeam } from "./ui/BorderBeam";
import MLModelsCard from "./ui/MLModelsCard"; // Moved here for modal
import FusionBreakdown from "./ui/FusionBreakdown"; // Moved here for modal
import ModuleBreakdown from "./ui/ModuleBreakdown"; // Moved here for modal
import PremiumOverlay from "./ui/PremiumOverlay";


type ResultsDisplayProps = {
  score: number;
  verdict?: "ai" | "real" | "uncertain";
  onReset: () => void;
  pipeline?: PipelineResult;
  imageUrl?: string;
};

export default function ResultsDisplay({
  score,
  verdict,
  onReset,
  pipeline,
  imageUrl,
}: ResultsDisplayProps) {
  const [showModal, setShowModal] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const config = {
    ai: {
      gradient: "from-rose-500 via-orange-400 to-amber-400",
      iconBg: "from-rose-500/20 to-amber-500/20",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/30",
      glowColor: "rgba(244,63,94,0.18)",
      Icon: ShieldAlert,
      title: "AI-Generated Detected",
      message: "Detected signatures consistent with AI-generated imagery.",
      label: "AI-GENERATED",
    },
    real: {
      gradient: "from-emerald-400 to-teal-400",
      iconBg: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      glowColor: "rgba(16,185,129,0.18)",
      Icon: CheckCircle2,
      title: "Authentic Image",
      message: "The system identifies the image as authentic.",
      label: "AUTHENTIC",
    },
    uncertain: {
      gradient: "from-amber-400 to-orange-400",
      iconBg: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30",
      glowColor: "rgba(245,158,11,0.18)",
      Icon: AlertCircle,
      title: "Inconclusive Result",
      message: "The result is inconclusive. Consider a secondary check.",
      label: "INCONCLUSIVE",
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
          className="p-6 md:p-8 relative"
        >
          {verdict === "ai" && <BorderBeam size={300} duration={12} delay={9} />}
          {/* Glass shine effect */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-20 dark:opacity-100"
            style={{
              background: "linear-gradient(135deg, var(--border) 0%, transparent 50%)",
            }}
          />

          {/* Animated background glow */}
          <motion.div
            className="pointer-events-none absolute -inset-24 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${current.glowColor}, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/30 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border ${current.borderColor} bg-gradient-to-br ${current.iconBg}`}
                  initial={{ scale: 0.8, rotate: -6 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-white/10" />
                  <Icon className={`h-6 w-6 ${current.iconColor}`} />
                </motion.div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/50">Result</p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground font-display">
                    {current.title}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60">{current.message}</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border ${current.borderColor} bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${current.iconColor}`}>
                <Icon className="h-3.5 w-3.5" />
                <span>{current.label}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <motion.div
                className="rounded-2xl border border-border bg-card/40 p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-foreground/45">
                  <span>AI Score</span>
                  <span className="text-foreground/35">0-100</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className={`text-6xl font-black font-display bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent`}>
                    <NumberTicker value={score} />
                  </span>
                  <span className="text-2xl font-semibold text-foreground/40">%</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${current.gradient} transition-[width] duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-foreground/40">
                  <span>Low</span>
                  <span>Neutral</span>
                  <span>High</span>
                </div>
              </motion.div>
            </div>

            {pipeline && (
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
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

            {/* Key Findings - Show top explanations */}
            {pipeline?.verdict && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2"
              >
                <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/50">
                  <span>Key Findings</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <PremiumOverlay className="rounded-2xl">
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
                </PremiumOverlay>
              </motion.div>
            )}

            <motion.div
              className="text-center text-[10px] uppercase tracking-[0.3em] text-foreground/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Analysis based on multi-stage forensic trace
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <GlowButton onClick={onReset} size="lg" className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                <span>Analyze Another</span>
              </GlowButton>

              <button
                onClick={() => setShowShare(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-all text-foreground font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Result</span>
              </button>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        result={{ score, verdict: verdict || "uncertain" }}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Comprehensive Analysis"
      >
        {pipeline && (
          <div className="space-y-12 py-4">
            {/* Finding Summaries */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-brand-purple/50" />
                <h3 className="text-lg font-bold text-foreground font-display">Key Forensic Findings</h3>
              </div>
              <PremiumOverlay className="rounded-2xl">
                <ExplanationList
                  flags={{
                    visual: pipeline.visual.flags,
                    metadata: pipeline.metadata.flags,
                    physics: pipeline.physics.flags,
                    frequency: pipeline.frequency.flags,
                    provenance: pipeline.provenance.flags,
                  }}
                />
              </PremiumOverlay>
            </div>

            {/* Visual Evidence (The Hero) */}
            {imageUrl && (
              <div className="animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-1 w-8 rounded-full bg-brand-cyan/50" />
                  <h3 className="text-lg font-bold text-foreground font-display">Spatial Analysis Overlay</h3>
                </div>
                <PremiumOverlay className="rounded-2xl overflow-hidden">
                  <div className="rounded-2xl border border-border bg-card/20 p-1">
                    <DetectionVisualization pipeline={pipeline} imageUrl={imageUrl} />
                  </div>
                </PremiumOverlay>
              </div>
            )}

            {/* Technical Metrics */}
            <div className="animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-brand-mint/50" />
                <h3 className="text-lg font-bold text-foreground font-display">Technical Signature</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MLModelsCard ml={pipeline.ml} finalVerdict={pipeline.verdict.verdict} />
                <PremiumOverlay className="rounded-2xl">
                  <ModuleBreakdown
                    weights={pipeline.fusion.weights}
                    scores={pipeline.fusion.module_scores}
                    finalConfidence={pipeline.fusion.confidence}
                  />
                </PremiumOverlay>
              </div>
            </div>

            {/* Forensic Details Grid */}
            <div className="animate-in fade-in slide-in-from-bottom-4 delay-400 duration-700">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-brand-pink/50" />
                <h3 className="text-lg font-bold text-foreground font-display">Deep Scan Report</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <PremiumOverlay className="rounded-2xl">
                  <DetailCard
                    title="Digital Forensics"
                    icon={Fingerprint}
                    color="cyan"
                    score={pipeline.metadata.metadata_score * 100}
                    metrics={[
                      { label: "Metadata Risk", value: pipeline.metadata.metadata_score, threshold: 0.3 },
                      { label: "Frequency Anomalies", value: pipeline.frequency.frequency_score, threshold: 0.5 },
                    ]}
                    flags={[...pipeline.metadata.flags, ...pipeline.provenance.flags]}
                  />
                </PremiumOverlay>

                <PremiumOverlay className="rounded-2xl">
                  <DetailCard
                    title="Visual Artifacts"
                    icon={ScanEye}
                    color="purple"
                    score={pipeline.visual.visual_artifacts_score * 100}
                    metrics={[
                      { label: "Skin Smoothing", value: pipeline.visual.details.smoothingScore, threshold: 0.6 },
                      { label: "Texture Consistency", value: pipeline.visual.details.textureMeltScore, threshold: 0.5 },
                    ]}
                    flags={pipeline.visual.flags}
                  />
                </PremiumOverlay>

                <PremiumOverlay className="rounded-2xl">
                  <DetailCard
                    title="Physics & Light"
                    icon={Zap}
                    color="pink"
                    score={100 - pipeline.physics.physics_score * 100}
                    scoreLabel="Consistency"
                    metrics={[
                      { label: "Lighting Coherence", value: 1 - pipeline.physics.details.lightInconsistency, threshold: 0.3, invertColor: true },
                      { label: "Shadow Alignment", value: 1 - pipeline.physics.details.shadowMisalignment, threshold: 0.4, invertColor: true },
                    ]}
                    flags={pipeline.physics.flags}
                  />
                </PremiumOverlay>
              </div>
            </div>

            {/* Export Section */}
            <div className="flex justify-center border-t border-white/10 pt-8 mt-12 pb-8">
              <PremiumOverlay className="inline-flex rounded-2xl">
                <ExportButton pipeline={pipeline} />
              </PremiumOverlay>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

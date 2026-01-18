"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RotateCcw, Fingerprint, Aperture, BarChart3, ScanEye } from "lucide-react";
import GlowButton from "./ui/GlowButton";
import type { PipelineResult } from "@/src/lib/pipeline/types";

type ResultsDisplayProps = {
  score: number;
  verdict?: "ai" | "real" | "uncertain";
  confidenceLabel: string;
  onReset: () => void;
  pipeline?: PipelineResult;
};

export default function ResultsDisplay({
  score,
  verdict,
  confidenceLabel,
  onReset,
  pipeline,
}: ResultsDisplayProps) {

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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-8 backdrop-blur-xl"
      style={{
        boxShadow: `0 0 60px ${current.glowColor}`,
      }}
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
            className="mt-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-7xl font-black bg-gradient-to-r ${current.gradient} bg-clip-text text-transparent`}>
                {score}
              </span>
              <span className="text-3xl font-bold text-gray-400">%</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">AI Detection Score</p>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            className="mt-4 max-w-sm text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            AI detection can be imperfect, especially with heavily edited, compressed, or blurred content.
          </motion.p>
        </div>

        {/* Confidence meter */}
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

        {/* Detailed Pipeline Analysis */}
        {pipeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
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
              icon={Aperture}
              color="pink"
              score={100 - pipeline.physics.physics_score * 100} // Invert for "Consistency"
              scoreLabel="Consistency"
              metrics={[
                { label: "Lighting Coherence", value: 1 - pipeline.physics.details.lightInconsistency, threshold: 0.3, invertColor: true },
                { label: "Shadow Alignment", value: 1 - pipeline.physics.details.shadowMisalignment, threshold: 0.4, invertColor: true },
                { label: "Perspective", value: 1 - pipeline.physics.details.perspectiveChaos, threshold: 0.3, invertColor: true },
              ]}
              flags={pipeline.physics.flags}
            />
          </motion.div>
        )}

        {/* Reset button */}
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <GlowButton onClick={onReset} size="lg">
            <RotateCcw className="h-4 w-4" />
            <span>Analyze Another Image</span>
          </GlowButton>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  color,
  score,
  scoreLabel = "Risk Score",
  metrics,
  flags,
}: {
  title: string;
  icon: any;
  color: "purple" | "cyan" | "pink";
  score: number;
  scoreLabel?: string;
  metrics: Array<{ label: string; value: number; threshold?: number; isBinary?: boolean; invertColor?: boolean }>;
  flags: string[];
}) {
  const colors = {
    purple: { text: "text-purple-400", bg: "bg-purple-500", border: "border-purple-500/20", badge: "bg-purple-500/10 text-purple-200" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500/20", badge: "bg-cyan-500/10 text-cyan-200" },
    pink: { text: "text-pink-400", bg: "bg-pink-500", border: "border-pink-500/20", badge: "bg-pink-500/10 text-pink-200" },
  };
  const theme = colors[color];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.07]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg bg-white/5 p-2 ${theme.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-gray-100">{title}</h4>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${theme.text}`}>{score.toFixed(0)}%</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">{scoreLabel}</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{m.label}</span>
              <span>{m.isBinary ? (m.value ? "Detected" : "None") : `${(m.value * 100).toFixed(0)}%`}</span>
            </div>
            {!m.isBinary && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, m.value * 100))}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${m.invertColor ? 'bg-emerald-400' : theme.bg} opacity-80`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {flags.length > 0 ? (
          flags.map((flag) => (
            <span
              key={flag}
              className={`rounded-md border ${theme.border} ${theme.badge} px-2 py-1 text-[10px] font-medium uppercase tracking-wide`}
            >
              {flag.replace(/_/g, " ")}
            </span>
          ))
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <CheckCircle2 className="h-3 w-3" />
            No anomalies detected
          </span>
        )}
      </div>
    </div>
  );
}

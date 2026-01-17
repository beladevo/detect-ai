"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, RotateCcw } from "lucide-react";
import GlowButton from "./ui/GlowButton";

type ResultsDisplayProps = {
  score: number;
  verdict?: "ai" | "real" | "uncertain";
  confidenceLabel: string;
  onReset: () => void;
};

export default function ResultsDisplay({
  score,
  verdict,
  confidenceLabel,
  onReset,
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

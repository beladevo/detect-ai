"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

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
  const accent =
    verdict === "real"
      ? "from-emerald-400 to-emerald-200"
      : verdict === "ai"
        ? "from-purple-500 to-pink-500"
        : "from-amber-400 to-orange-400";

  const alertText =
    verdict === "real"
      ? "המערכת מזהה את התמונה כאותנטית."
      : verdict === "ai"
        ? "נמצאו חתימות אופייניות לתמונה שנוצרה ב-AI."
        : "התוצאה אינה חד-משמעית. מומלץ בדיקה נוספת.";

  const Icon =
    verdict === "real" ? CheckCircle2 : verdict === "ai" ? ShieldAlert : AlertCircle;

  const tone =
    verdict === "real"
      ? "text-emerald-200 border-emerald-400/30 bg-emerald-500/10"
      : verdict === "ai"
        ? "text-purple-200 border-purple-400/30 bg-purple-500/10"
        : "text-amber-200 border-amber-400/30 bg-amber-500/10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold">תוצאת ניתוח</h2>
      <div className="mt-3 text-6xl font-black text-purple-300">
        {score}% <span className="text-lg font-medium text-gray-400">AI</span>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-right text-sm text-gray-300">
        <div className="flex items-center justify-end gap-2">
          <span>רמת ודאות: {confidenceLabel}</span>
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full bg-gradient-to-r ${accent}`}
          />
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm ${tone}`}>
        <Icon className="h-4 w-4" />
        {alertText}
      </div>

      <button
        onClick={onReset}
        className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-purple-100"
      >
        בדיקת תמונה נוספת
      </button>
    </motion.div>
  );
}

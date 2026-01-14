"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { width: "0%" },
      { width: `${score}%`, duration: 0.8, ease: "power2.out" }
    );
  }, [score]);

  const accent =
    verdict === "real"
      ? "from-emerald-400 to-emerald-200"
      : verdict === "ai"
        ? "from-purple-500 to-pink-500"
        : "from-amber-400 to-orange-400";

  const alertText =
    verdict === "real"
      ? "The system identifies the image as authentic."
      : verdict === "ai"
        ? "Detected signatures consistent with AI-generated imagery."
        : "The result is inconclusive. Consider a secondary check.";

  const Icon =
    verdict === "real" ? CheckCircle2 : verdict === "ai" ? ShieldAlert : AlertCircle;

  const tone =
    verdict === "real"
      ? "text-emerald-200 border-emerald-400/30 bg-emerald-500/10"
      : verdict === "ai"
        ? "text-purple-200 border-purple-400/30 bg-purple-500/10"
        : "text-amber-200 border-amber-400/30 bg-amber-500/10";

  return (
    <div
      ref={containerRef}
      className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
    >
      <div className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold">Analysis Result</h2>
      <div className="mt-3 text-6xl font-black text-purple-300">
        {score}% <span className="text-lg font-medium text-gray-400">AI</span>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-right text-sm text-gray-300">
        <div className="flex items-center justify-end gap-2">
          <span>Confidence level: {confidenceLabel}</span>
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-800">
          <div
            ref={barRef}
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
        Analyze another image
      </button>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/src/components/Navbar";
import HeroSection from "@/src/components/HeroSection";
import UploadZone from "@/src/components/UploadZone";
import ResultsDisplay from "@/src/components/ResultsDisplay";
import HistoryList, { type HistoryItem } from "@/src/components/HistoryList";
import Footer from "@/src/components/Footer";
import ComparisonTool from "@/src/components/ComparisonTool";

type DetectionResult = {
  score: number | null;
  verdict?: "ai" | "real" | "uncertain";
};

const HISTORY_KEY = "eliteb_history";

export default function AIDetectorPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<DetectionResult>({ score: null });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as HistoryItem[];
        setHistory(parsed);
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const verdict = useMemo(() => {
    if (result.score === null) return undefined;
    if (result.score >= 70) return "ai";
    if (result.score <= 20) return "real";
    return "uncertain";
  }, [result.score]);

  const confidenceLabel = useMemo(() => {
    if (result.score === null) return "";
    if (result.score >= 85 || result.score <= 10) return "גבוהה";
    if (result.score >= 60 || result.score <= 30) return "בינונית";
    return "נמוכה";
  }, [result.score]);

  const pushHistory = useCallback(
    (item: HistoryItem) => {
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 8);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    },
    [setHistory]
  );

  const handleFileSelected = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    setResult({ score: null });
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Detection failed");
      }
      const data = (await response.json()) as { score?: number };
      const score = typeof data.score === "number" ? data.score : 0;
      setResult({ score });
      pushHistory({
        id: crypto.randomUUID(),
        fileName: file.name,
        score,
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError("העלאה נכשלה. נסה שנית בעוד רגע.");
    } finally {
      setIsUploading(false);
    }
  }, [pushHistory]);

  const handleReset = () => {
    setResult({ score: null });
    setError(null);
  };

  const handleCTAClick = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen text-white">
      <Navbar onActionClick={handleCTAClick} />

      <main className="relative overflow-hidden pt-24">
        <div className="absolute left-[-10%] top-[-20%] h-[36rem] w-[36rem] rounded-full bg-purple-900/20 blur-[140px]" />
        <div className="absolute right-[-15%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-cyan-700/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[26rem] w-[26rem] rounded-full bg-pink-600/20 blur-[140px]" />

        <HeroSection onCTA={handleCTAClick} />

        <section
          id="upload"
          ref={uploadRef}
          className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-white/10 bg-[var(--panel)] p-8 shadow-2xl backdrop-blur-xl"
          >
            <UploadZone isUploading={isUploading} onFileSelected={handleFileSelected} />

            {error ? (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
                <button
                  onClick={handleReset}
                  className="rounded-full border border-red-200/40 px-4 py-1 text-xs uppercase tracking-widest"
                >
                  Reset
                </button>
              </div>
            ) : null}

            {result.score !== null ? (
              <ResultsDisplay
                score={result.score}
                verdict={verdict}
                confidenceLabel={confidenceLabel}
                onReset={handleReset}
              />
            ) : (
              <div className="mt-10 grid gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  <span>ניתוח פיקסלים עמוק עם חתימות מודל מתקדמות.</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span>שמירת פרטיות מלאה - קבצים נמחקים לאחר הבדיקה.</span>
                </div>
              </div>
            )}
          </motion.div>

          <div id="features" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-purple-500/10 p-6 shadow-glow-purple"
            >
              <h3 className="text-lg font-semibold text-white">סטטוס מנוע זיהוי</h3>
              <p className="mt-2 text-sm text-gray-300">
                גרסת מודל: EliteVision v2.4 • זמן תגובה ממוצע: 1.6s • דיוק: 96.2%
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-gray-200">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Realtime</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-200">Live</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Threat Index</p>
                  <p className="mt-1 text-lg font-semibold text-purple-200">Low</p>
                </div>
              </div>
            </motion.div>

            <HistoryList
              items={history}
              onClear={() => {
                localStorage.removeItem(HISTORY_KEY);
                setHistory([]);
              }}
            />
          </div>
        </section>

        {result.score !== null && previewUrl ? (
          <ComparisonTool previewUrl={previewUrl} verdict={verdict} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

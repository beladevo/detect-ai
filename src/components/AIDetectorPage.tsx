"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/src/components/Navbar";
import HeroSection from "@/src/components/HeroSection";
import FeaturesSection from "@/src/components/FeaturesSection";
import ExtensionSection from "@/src/components/ExtensionSection";
import WaitlistSection from "@/src/components/WaitlistSection";
import UploadZone from "@/src/components/UploadZone";
import HistoryList, { type HistoryItem } from "@/src/components/HistoryList";
import PrivacySection from "@/src/components/PrivacySection";
import FAQSection from "@/src/components/FAQSection";
import Footer from "@/src/components/Footer";
import ModelSelector from "@/src/components/ui/ModelSelector";
import { PerformanceMonitor } from "@/src/components/PerformanceMonitor";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
const ResultsDisplay = dynamic(() => import("@/src/components/ResultsDisplay"), {
  ssr: false,
});
const ComparisonTool = dynamic(() => import("@/src/components/ComparisonTool"), {
  ssr: false,
});

import { DotPattern } from "@/src/components/ui/DotPattern";
import { cn } from "@/src/lib/utils";
import { getConfiguredModelName } from "@/src/lib/models";
import { getVerdictPresentation, getVerdictPresentationFromScore } from "@/src/lib/verdictUi";
import type { VerdictPresentation, UiVerdict } from "@/src/lib/verdictUi";


import type { PipelineResult } from "@/src/lib/pipeline/types";

type DetectionResult = {
  score: number | null;
  verdict?: UiVerdict;
  pipeline?: PipelineResult;
  presentation?: VerdictPresentation;
};

const HISTORY_KEY = "detectai_history";

async function computeSha256(file: File): Promise<string | null> {
  if (!crypto?.subtle) return null;
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logLocalDetection(payload: Record<string, unknown>) {
  try {
    await fetch("/api/detections/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Local detection log failed:", error);
  }
}

export default function AIDetectorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<DetectionResult>({ score: null });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>("--");
  const [selectedModel, setSelectedModel] = useState<string>(() => getConfiguredModelName());
  const uploadRef = useRef<HTMLDivElement>(null);
  const uploadCardRef = useRef<HTMLDivElement>(null);
  const statusCardRef = useRef<HTMLDivElement>(null);
  const historyCardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    let isMounted = true;

    const estimateTime = async () => {
      try {
        const modelSizeMb = Number(process.env.NEXT_PUBLIC_MODEL_SIZE_MB || "0");
        const estimatedModelBytes =
          !Number.isNaN(modelSizeMb) && modelSizeMb > 0
            ? modelSizeMb * 1024 * 1024
            : 6 * 1024 * 1024;
        const downlinkMbps =
          (navigator as Navigator & { connection?: { downlink?: number } })
            .connection?.downlink || 10;

        const downloadSeconds =
          estimatedModelBytes > 0
            ? (estimatedModelBytes * 8) / (downlinkMbps * 1_000_000)
            : 0;
        const wasmOverheadSeconds = 0.6;
        const totalSeconds = Math.max(0.5, downloadSeconds + wasmOverheadSeconds);
        const pretty = totalSeconds >= 10 ? totalSeconds.toFixed(0) : totalSeconds.toFixed(1);

        if (isMounted) {
          setEstimatedTime(`~${pretty}s`);
        }
      } catch {
        if (isMounted) {
          setEstimatedTime("~2.0s");
        }
      }
    };

    estimateTime();
    return () => {
      isMounted = false;
    };
  }, []);

  const presentation = useMemo(() => {
    if (result.presentation) return result.presentation;
    if (result.pipeline?.verdict) {
      return getVerdictPresentation(result.pipeline.verdict.verdict);
    }
    return getVerdictPresentationFromScore(result.score);
  }, [result.pipeline?.verdict, result.presentation, result.score]);

  const verdict = presentation?.uiVerdict;

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
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const queueToast = (props: { title: string; description: string; variant?: "default" | "success" | "error" | "warning"; duration?: number }) => {
      toast({ duration: 2400, ...props });
    };
    const startedAt = performance.now();
    setIsUploading(true);
    setError(null);
    setResult({ score: null });
    setPreviewUrl(URL.createObjectURL(file));

    try {
      queueToast({
        title: "Preparing image",
        description: "Optimizing the file for analysis.",
      });
      timers.push(setTimeout(() => {
        queueToast({
          title: "Loading model",
          description: "Starting the detection engine.",
        });
      }, 900));
      timers.push(setTimeout(() => {
        queueToast({
          title: "Analyzing image",
          description: "Scanning for AI signatures.",
        });
      }, 2000));

      const { analyzeImageWithWasm } = await import("@/src/lib/wasmDetector");
      const result = await analyzeImageWithWasm(file, selectedModel);
      setResult({ score: result.score, pipeline: result.pipeline, presentation: result.presentation });
      timers.forEach(clearTimeout);
      queueToast({
        title: "Analysis complete",
        description: result.presentation?.title ?? "Results are ready.",
        variant: "success",
        duration: 3200,
      });
      pushHistory({
        id: crypto.randomUUID(),
        fileName: file.name,
        score: result.score,
        createdAt: new Date().toISOString(),
      });

      if (user && result.source === "local") {
        const processingTime = performance.now() - startedAt;
        const fileHash =
          result.pipeline?.hashes?.sha256 || (await computeSha256(file)) || "";
        const verdict = result.pipeline?.verdict?.verdict || "UNKNOWN";
        const confidence =
          typeof result.pipeline?.verdict?.confidence === "number"
            ? result.pipeline.verdict.confidence
            : result.score / 100;

        await logLocalDetection({
          fileName: file.name,
          fileSize: file.size,
          fileHash,
          score: result.score,
          verdict,
          confidence,
          modelUsed: selectedModel,
          processingTime,
          pipeline: result.pipeline
            ? {
                verdict: result.pipeline.verdict,
                hashes: result.pipeline.hashes,
                fusion: result.pipeline.fusion,
                modules: {
                  visual: {
                    score: result.pipeline.visual.visual_artifacts_score,
                    flags: result.pipeline.visual.flags,
                  },
                  metadata: {
                    score: result.pipeline.metadata.metadata_score,
                    flags: result.pipeline.metadata.flags,
                  },
                  physics: {
                    score: result.pipeline.physics.physics_score,
                    flags: result.pipeline.physics.flags,
                  },
                  frequency: {
                    score: result.pipeline.frequency.frequency_score,
                    flags: result.pipeline.frequency.flags,
                  },
                  ml: {
                    score: result.pipeline.ml.ml_score,
                    flags: result.pipeline.ml.flags,
                  },
                  provenance: {
                    score: result.pipeline.provenance.provenance_score,
                    flags: result.pipeline.provenance.flags,
                  },
                },
              }
            : undefined,
        });
      }
    } catch (err) {
      console.error("Detection failed", err);
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again shortly.";
      setError(message);
      timers.forEach(clearTimeout);
      queueToast({
        title: "Detection failed",
        description: message,
        variant: "error",
        duration: 4000,
      });
    } finally {
      timers.forEach(clearTimeout);
      setIsUploading(false);
    }
  }, [pushHistory, selectedModel, toast, user]);

  const handleReset = () => {
    setResult({ score: null });
    setError(null);
  };

  const handleCTAClick = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen text-foreground">
      <Navbar onActionClick={handleCTAClick} />

      <main className="relative overflow-hidden pt-24">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
            "opacity-30 dark:hidden"
          )}
        />
        <div className="absolute left-[-10%] top-[-20%] h-[36rem] w-[36rem] rounded-full bg-brand-purple/5 blur-[140px] dark:bg-brand-purple/20" />
        <div className="absolute right-[-15%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-brand-cyan/5 blur-[140px] dark:bg-brand-cyan/20" />
        <div className="absolute bottom-[-10%] left-[25%] h-[26rem] w-[26rem] rounded-full bg-brand-pink/5 blur-[140px] dark:bg-brand-pink/20" />

        <HeroSection onCTA={handleCTAClick} />
        <FeaturesSection />
        <ExtensionSection />
        <WaitlistSection />

        <section
          id="upload"
          ref={uploadRef}
          className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-12 pt-4 md:gap-6 md:px-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]"
        >
          <div
            ref={uploadCardRef}
            className="min-w-0 rounded-2xl border border-border bg-card/60 p-4 md:p-6 shadow-2xl backdrop-blur-xl dark:bg-panel"
          >
            <UploadZone isUploading={isUploading} onFileSelected={handleFileSelected} />

            {error ? (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
                <button
                  onClick={handleReset}
                  className="rounded-full border border-red-200/40 px-3 py-1 text-[10px] uppercase tracking-widest"
                >
                  Reset
                </button>
              </div>
            ) : null}

            {result.score !== null ? (
              <ResultsDisplay
                score={result.score}
                verdict={verdict}
                presentation={presentation}
                onReset={handleReset}
                pipeline={result.pipeline}
                imageUrl={previewUrl || undefined}
              />
            ) : (
              <div className="mt-6 grid gap-2 text-xs text-foreground/50">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-purple shrink-0" />
                  <span>Deep pixel analysis with advanced model signatures.</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-mint shrink-0" />
                  <span>Full privacy mode with local-only processing.</span>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4 overflow-hidden">
            <div
              ref={statusCardRef}
              className="rounded-2xl border border-border bg-gradient-to-br from-card/40 via-card/20 to-brand-purple/10 p-4 shadow-glow-purple overflow-visible"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-foreground truncate">Detection engine status</h3>
                <ModelSelector
                  currentModel={selectedModel}
                  onModelChange={setSelectedModel}
                  variant="single"
                />
              </div>
              <p className="text-[10px] text-foreground/60 truncate">
                {estimatedTime} | Accuracy: 96.2%
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-foreground/80">
                <div className="rounded-lg border border-border bg-card/40 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/40">Realtime</p>
                  <p className="text-sm font-semibold text-brand-cyan">Live</p>
                </div>
                <div className="rounded-lg border border-border bg-card/40 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/40">Threat Index</p>
                  <p className="text-sm font-semibold text-brand-purple">Low</p>
                </div>
              </div>
            </div>

            {/* <PerformanceMonitor isActive={isUploading} /> */}

            <div ref={historyCardRef}>
              <HistoryList
                items={history}
                onClear={() => {
                  localStorage.removeItem(HISTORY_KEY);
                  setHistory([]);
                }}
              />
            </div>
          </div>
        </section>

        {result.score !== null && previewUrl ? (
          <ComparisonTool previewUrl={previewUrl} verdict={verdict} pipeline={result.pipeline} />
        ) : null}
        <PrivacySection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}



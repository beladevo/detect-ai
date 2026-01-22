"use client";

import React from "react";
import DetectionVisualization from "./ui/DetectionVisualization";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import PremiumOverlay from "./ui/PremiumOverlay";

type ComparisonToolProps = {
  previewUrl: string;
  verdict?: "ai" | "real" | "uncertain";
  pipeline?: PipelineResult;
};

export default function ComparisonTool({ previewUrl, verdict, pipeline }: ComparisonToolProps) {
  const label =
    verdict === "real"
      ? "Authentic map"
      : verdict === "ai"
        ? "AI artifact map"
        : "Confidence map";

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
      <PremiumOverlay className="rounded-3xl" overlayClassName="rounded-3xl">
        <div className="rounded-3xl border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Layer comparison</h3>
              <p className="text-sm text-foreground/50">
                Side-by-side view of the original and the anomaly heatmap.
              </p>
            </div>
            <span className="rounded-full border border-border bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-foreground/60">
              {label}
            </span>
          </div>

          {pipeline ? (
            <div className="mt-6">
              <DetectionVisualization pipeline={pipeline} imageUrl={previewUrl} />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card/20">
                <div className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-foreground/40">
                  Original
                </div>
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card/20">
                <div className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-foreground/40">
                  Heatmap Overlay
                </div>
                <div className="relative aspect-[4/3] w-full">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,0,122,0.5),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(99,102,241,0.5),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(34,197,94,0.35),transparent_40%)] mix-blend-screen" />
                </div>
              </div>
            </div>
          )}
        </div>
      </PremiumOverlay>
    </section>
  );
}

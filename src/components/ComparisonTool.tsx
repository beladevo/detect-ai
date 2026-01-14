"use client";

import React from "react";

type ComparisonToolProps = {
  previewUrl: string;
  verdict?: "ai" | "real" | "uncertain";
};

export default function ComparisonTool({ previewUrl, verdict }: ComparisonToolProps) {
  const label =
    verdict === "real"
      ? "Authentic map"
      : verdict === "ai"
        ? "AI artifact map"
        : "Confidence map";

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Layer comparison</h3>
            <p className="text-sm text-gray-400">
              Side-by-side view of the original and the anomaly heatmap.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-300">
            {label}
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-gray-400">
              Original
            </div>
            <div
              className="aspect-[4/3] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="px-4 py-3 text-xs uppercase tracking-[0.3em] text-gray-400">
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
      </div>
    </section>
  );
}

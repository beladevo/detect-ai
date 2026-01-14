"use client";

import React from "react";
import { Cpu, Layers, ScanSearch, ShieldCheck, Sparkles, Zap } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Local model execution",
    description: "Runs on your device for fast, private AI detection.",
  },
  {
    icon: ScanSearch,
    title: "Forensic confidence score",
    description: "Breaks down signal strength with calibrated certainty levels.",
  },
  {
    icon: Layers,
    title: "Heatmap overlays",
    description: "Visualize where synthetic artifacts concentrate in the frame.",
  },
  {
    icon: ShieldCheck,
    title: "Zero retention",
    description: "Images stay local and are never uploaded to a server.",
  },
  {
    icon: Zap,
    title: "Realtime analysis",
    description: "Average response stays under two seconds for most images.",
  },
  {
    icon: Sparkles,
    title: "Free to use (currently)",
    description: "Unlimited scans while we prepare the production launch.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-6"
    >
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-cyan-500/10 p-8 shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-300">
              Feature Set
            </p>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Detection built for creators, teams, and investigators.
            </h2>
            <p className="mt-4 text-sm text-gray-300">
              <strong className="font-semibold text-white">
                Local AI inference
              </strong>{" "}
              keeps images on your machine while still delivering forensic-grade
              insights.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
                  >
                    <div className="flex items-center gap-3 text-white">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-4 w-4 text-cyan-200" />
                      </span>
                      <span className="font-semibold">{feature.title}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-cyan-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              <img
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=80"
                alt="Creative studio with AI visualization"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-xs uppercase tracking-[0.3em] text-gray-200">
                Unsplash collection
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

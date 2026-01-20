"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, Layers, Info } from "lucide-react";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import {
  generateImportanceMap,
  heatmapToImageData,
  getImportantRegions,
  type VisualizationMode,
} from "@/src/lib/visualizationMap";

interface DetectionVisualizationProps {
  pipeline: PipelineResult;
  imageUrl?: string;
}

export default function DetectionVisualization({
  pipeline,
  imageUrl,
}: DetectionVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<VisualizationMode>("combined");
  const [opacity, setOpacity] = useState(0.6);
  const [showOriginal, setShowOriginal] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate heatmap
    const heatmap = generateImportanceMap(pipeline, mode);
    const imageData = heatmapToImageData(heatmap, "hot");

    // Set canvas size
    canvas.width = heatmap.width;
    canvas.height = heatmap.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw original image if available
    if (showOriginal && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Overlay heatmap
        ctx.globalAlpha = opacity;
        ctx.putImageData(imageData, 0, 0);
        ctx.globalAlpha = 1;
      };
      img.src = imageUrl;
    } else {
      // Just draw heatmap
      ctx.putImageData(imageData, 0, 0);
    }
  }, [pipeline, mode, opacity, showOriginal, imageUrl]);

  const regions = getImportantRegions(pipeline);

  const modes: Array<{ value: VisualizationMode; label: string; icon: string }> = [
    { value: "combined", label: "Combined", icon: "🔮" },
    { value: "visual", label: "Visual", icon: "👁️" },
    { value: "physics", label: "Physics", icon: "⚡" },
    { value: "frequency", label: "Frequency", icon: "📊" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-200">Detection Visualization</h3>
        </div>

        <div className="flex items-center gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mode === m.value
                  ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              <span className="mr-1">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5">
        <canvas
          ref={canvasRef}
          className="h-auto w-full"
          style={{ imageRendering: "pixelated" }}
        />

        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-sm text-gray-400">
              <Layers className="mx-auto mb-2 h-8 w-8" />
              <p>Upload an image to see visualization</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Overlay Opacity</span>
          <span>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity * 100}
          onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
          className="w-full"
        />
      </div>

      {regions.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Info className="h-4 w-4" />
            Important Regions
          </div>

          <div className="space-y-2">
            {regions.map((region, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-md bg-white/5 p-2"
              >
                <div className="flex-shrink-0">
                  <div
                    className="h-8 w-1 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, rgba(255, ${Math.floor((1 - region.score) * 255)}, 0, ${region.score}), rgba(255, 0, 0, 0))`,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">
                    {region.region}
                  </div>
                  <div className="text-xs text-gray-400">{region.reason}</div>
                </div>
                <div className="text-xs font-semibold text-orange-400">
                  {(region.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200">
        <strong>Note:</strong> This visualization is based on forensic module scores. For
        true model attention maps, Grad-CAM integration would be required.
      </div>
    </div>
  );
}

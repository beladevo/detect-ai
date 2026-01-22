"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Info, Scan } from "lucide-react";
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate heatmap from actual forensic spatial data
    const heatmap = generateImportanceMap(pipeline, mode);
    const imageData = heatmapToImageData(heatmap, "hot");
    const heatmapCanvas = document.createElement("canvas");
    const heatmapCtx = heatmapCanvas.getContext("2d");
    if (!heatmapCtx) return;

    // Set canvas size
    canvas.width = heatmap.width;
    canvas.height = heatmap.height;
    heatmapCanvas.width = heatmap.width;
    heatmapCanvas.height = heatmap.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    heatmapCtx.putImageData(imageData, 0, 0);

    // Draw original image if available, then overlay heatmap
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Overlay heatmap with opacity
        ctx.globalAlpha = opacity;
        ctx.drawImage(heatmapCanvas, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      };
      img.src = imageUrl;
    } else {
      ctx.drawImage(heatmapCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [pipeline, mode, opacity, imageUrl]);

  const regions = getImportantRegions(pipeline);

  const modes: Array<{ value: VisualizationMode; label: string; description: string }> = [
    { value: "combined", label: "All", description: "Combined analysis" },
    { value: "visual", label: "Texture", description: "Skin smoothing, texture" },
    { value: "physics", label: "Light", description: "Lighting & shadows" },
    { value: "frequency", label: "Freq", description: "DCT frequency analysis" },
  ];

  // Check if we have real spatial data
  const hasSpatialData = !!(
    pipeline.visual.spatialMap ||
    pipeline.physics.spatialMap ||
    pipeline.frequency.spatialMap
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Scan className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Forensic Heat Map</h3>
            {hasSpatialData && (
              <p className="text-[10px] text-emerald-400">Real spatial analysis</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/5 border border-white/10">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              title={m.description}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${mode === m.value
                  ? "bg-purple-500/20 text-purple-300 shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <canvas
          ref={canvasRef}
          className="h-auto w-full"
          style={{ imageRendering: "auto" }}
        />

        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-sm text-gray-400">
              <Layers className="mx-auto mb-2 h-6 w-6" />
              <p className="text-xs">Upload an image to see analysis</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[9px] text-gray-300">
          <div className="h-2 w-12 rounded-sm bg-gradient-to-r from-transparent via-yellow-500 to-red-500" />
          <span>AI likelihood</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Intensity</span>
        <input
          type="range"
          min="20"
          max="100"
          value={opacity * 100}
          onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
        />
        <span className="text-[10px] text-gray-400 w-8">{Math.round(opacity * 100)}%</span>
      </div>

      {regions.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-200">
            <Info className="h-3.5 w-3.5" />
            Detected Anomalies
          </div>

          <div className="space-y-1.5">
            {regions.map((region, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5"
              >
                <div
                  className="h-6 w-1 rounded-full shrink-0"
                  style={{
                    background: `linear-gradient(to bottom, rgba(255, ${Math.floor((1 - region.score) * 200)}, 0, 1), rgba(255, 100, 0, 0.3))`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-200 truncate">
                    {region.region}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">{region.reason}</div>
                </div>
                <div className="text-xs font-bold text-orange-400 shrink-0">
                  {(region.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

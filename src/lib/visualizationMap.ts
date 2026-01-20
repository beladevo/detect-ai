/**
 * Generate visualization/saliency maps based on forensic analysis
 * This is a simplified alternative to Grad-CAM that doesn't require model internals
 */

import type { PipelineResult } from "@/src/lib/pipeline/types";

export type HeatmapData = {
  width: number;
  height: number;
  data: Float32Array; // 0-1 values representing attention/importance
};

export type VisualizationMode = "combined" | "visual" | "physics" | "frequency";

/**
 * Generate a simple importance map based on module scores
 * This creates a basic visualization showing which modules contributed most
 */
export function generateImportanceMap(
  pipeline: PipelineResult,
  mode: VisualizationMode = "combined"
): HeatmapData {
  // For now, create a simple radial gradient based on scores
  // In future, this could be enhanced with actual region-based analysis
  const width = 256;
  const height = 256;
  const data = new Float32Array(width * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  // Get module scores
  const scores = {
    visual: pipeline.visual.visual_artifacts_score,
    physics: pipeline.physics.physics_score,
    frequency: pipeline.frequency.frequency_score,
    ml: pipeline.ml.ml_score,
  };

  // Calculate importance weight based on mode
  const getImportance = (x: number, y: number): number => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDistance = distance / maxRadius;

    switch (mode) {
      case "visual":
        // Visual artifacts often concentrated in center (faces, objects)
        return scores.visual * (1 - normalizedDistance * 0.5);

      case "physics":
        // Physics issues can be anywhere
        return scores.physics * (0.7 + Math.random() * 0.3);

      case "frequency":
        // Frequency anomalies distributed
        return scores.frequency * (0.8 + normalizedDistance * 0.2);

      case "combined":
      default:
        // Weighted combination
        return (
          scores.visual * (1 - normalizedDistance * 0.5) * 0.3 +
          scores.physics * 0.25 +
          scores.frequency * 0.25 +
          scores.ml * 0.2
        );
    }
  };

  // Generate heatmap data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      data[idx] = Math.min(1, Math.max(0, getImportance(x, y)));
    }
  }

  return { width, height, data };
}

/**
 * Convert heatmap data to canvas ImageData for rendering
 */
export function heatmapToImageData(
  heatmap: HeatmapData,
  colormap: "hot" | "cool" | "viridis" = "hot"
): ImageData {
  const { width, height, data } = heatmap;
  const imageData = new ImageData(width, height);

  const getColor = (value: number): [number, number, number, number] => {
    // Clamp value
    const v = Math.min(1, Math.max(0, value));

    switch (colormap) {
      case "hot":
        // Red → Yellow → White
        if (v < 0.5) {
          const t = v * 2;
          return [255, Math.floor(t * 255), 0, Math.floor(v * 200)];
        } else {
          const t = (v - 0.5) * 2;
          return [255, 255, Math.floor(t * 255), Math.floor(v * 200)];
        }

      case "cool":
        // Blue → Cyan → Green
        if (v < 0.5) {
          const t = v * 2;
          return [0, Math.floor(t * 255), 255, Math.floor(v * 200)];
        } else {
          const t = (v - 0.5) * 2;
          return [0, 255, Math.floor((1 - t) * 255), Math.floor(v * 200)];
        }

      case "viridis":
        // Viridis-like colormap (purple → green → yellow)
        if (v < 0.33) {
          const t = v * 3;
          return [
            Math.floor(68 + t * (59 - 68)),
            Math.floor(1 + t * (82 - 1)),
            Math.floor(84 + t * (139 - 84)),
            Math.floor(v * 200),
          ];
        } else if (v < 0.67) {
          const t = (v - 0.33) * 3;
          return [
            Math.floor(59 + t * (33 - 59)),
            Math.floor(82 + t * (145 - 82)),
            Math.floor(139 + t * (140 - 139)),
            Math.floor(v * 200),
          ];
        } else {
          const t = (v - 0.67) * 3;
          return [
            Math.floor(33 + t * (253 - 33)),
            Math.floor(145 + t * (231 - 145)),
            Math.floor(140 + t * (37 - 140)),
            Math.floor(v * 200),
          ];
        }

      default:
        return [255, 0, 0, Math.floor(v * 200)];
    }
  };

  for (let i = 0; i < data.length; i++) {
    const [r, g, b, a] = getColor(data[i]);
    imageData.data[i * 4] = r;
    imageData.data[i * 4 + 1] = g;
    imageData.data[i * 4 + 2] = b;
    imageData.data[i * 4 + 3] = a;
  }

  return imageData;
}

/**
 * Generate summary of important regions
 */
export function getImportantRegions(
  pipeline: PipelineResult
): Array<{ region: string; score: number; reason: string }> {
  const regions: Array<{ region: string; score: number; reason: string }> = [];

  // Analyze flags to determine important regions
  if (pipeline.visual.flags.includes("skin_smoothing")) {
    regions.push({
      region: "Face/Skin areas",
      score: pipeline.visual.visual_artifacts_score,
      reason: "Unnatural skin smoothing detected",
    });
  }

  if (pipeline.visual.flags.includes("texture_melting")) {
    regions.push({
      region: "Background/textures",
      score: pipeline.visual.visual_artifacts_score,
      reason: "Texture melting artifacts found",
    });
  }

  if (pipeline.physics.flags.includes("light_inconsistency")) {
    regions.push({
      region: "Lighting across image",
      score: pipeline.physics.physics_score,
      reason: "Inconsistent light direction",
    });
  }

  if (pipeline.frequency.flags.includes("spectral_peak")) {
    regions.push({
      region: "Entire image",
      score: pipeline.frequency.frequency_score,
      reason: "Unusual frequency spectrum patterns",
    });
  }

  // Sort by score descending
  regions.sort((a, b) => b.score - a.score);

  return regions;
}

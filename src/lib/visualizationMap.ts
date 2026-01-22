/**
 * Generate visualization/saliency maps based on forensic analysis
 * Uses actual spatial forensic data from pipeline modules
 */

import type { PipelineResult, SpatialMap } from "@/src/lib/pipeline/types";

export type HeatmapData = {
  width: number;
  height: number;
  data: Float32Array; // 0-1 values representing attention/importance
};

export type VisualizationMode = "combined" | "visual" | "physics" | "frequency";

/**
 * Upsample a spatial map to target dimensions using bilinear interpolation
 */
function upsampleMap(map: SpatialMap, targetWidth: number, targetHeight: number): Float32Array {
  const result = new Float32Array(targetWidth * targetHeight);
  const scaleX = map.width / targetWidth;
  const scaleY = map.height / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = x * scaleX;
      const srcY = y * scaleY;

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, map.width - 1);
      const y1 = Math.min(y0 + 1, map.height - 1);

      const xFrac = srcX - x0;
      const yFrac = srcY - y0;

      const v00 = map.data[y0 * map.width + x0];
      const v10 = map.data[y0 * map.width + x1];
      const v01 = map.data[y1 * map.width + x0];
      const v11 = map.data[y1 * map.width + x1];

      const v0 = v00 * (1 - xFrac) + v10 * xFrac;
      const v1 = v01 * (1 - xFrac) + v11 * xFrac;

      result[y * targetWidth + x] = v0 * (1 - yFrac) + v1 * yFrac;
    }
  }

  return result;
}

/**
 * Generate importance map from actual forensic spatial data
 */
export function generateImportanceMap(
  pipeline: PipelineResult,
  mode: VisualizationMode = "combined"
): HeatmapData {
  const width = 256;
  const height = 256;
  const data = new Float32Array(width * height);

  // Get spatial maps from modules (if available)
  const visualMap = pipeline.visual.spatialMap;
  const physicsMap = pipeline.physics.spatialMap;
  const frequencyMap = pipeline.frequency.spatialMap;

  // Upsample maps to target resolution
  const visualData = visualMap
    ? upsampleMap(visualMap, width, height)
    : null;
  const physicsData = physicsMap
    ? upsampleMap(physicsMap, width, height)
    : null;
  const frequencyData = frequencyMap
    ? upsampleMap(frequencyMap, width, height)
    : null;

  // Module scores for weighting
  const scores = {
    visual: pipeline.visual.visual_artifacts_score,
    physics: pipeline.physics.physics_score,
    frequency: pipeline.frequency.frequency_score,
  };

  // Generate combined or mode-specific heatmap
  for (let i = 0; i < width * height; i++) {
    let value = 0;

    switch (mode) {
      case "visual":
        value = visualData ? visualData[i] * scores.visual : scores.visual * 0.5;
        break;

      case "physics":
        value = physicsData ? physicsData[i] * scores.physics : scores.physics * 0.5;
        break;

      case "frequency":
        value = frequencyData ? frequencyData[i] * scores.frequency : scores.frequency * 0.5;
        break;

      case "combined":
      default:
        // Weighted combination of all available maps
        const visualContrib = visualData ? visualData[i] * 0.4 : scores.visual * 0.4;
        const physicsContrib = physicsData ? physicsData[i] * 0.3 : scores.physics * 0.3;
        const frequencyContrib = frequencyData ? frequencyData[i] * 0.3 : scores.frequency * 0.3;
        value = visualContrib + physicsContrib + frequencyContrib;
        break;
    }

    data[i] = Math.min(1, Math.max(0, value));
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

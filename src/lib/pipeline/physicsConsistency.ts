import { StandardizedImage, PhysicsConsistencyResult, SpatialMap } from "@/src/lib/pipeline/types";

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function generatePhysicsSpatialMap(
  gx: Float32Array,
  gy: Float32Array,
  gray: Float32Array,
  width: number,
  height: number,
  globalCoherence: number
): SpatialMap {
  const mapSize = 64;
  const blockSize = Math.floor(width / mapSize);
  const data = new Float32Array(mapSize * mapSize);

  for (let my = 0; my < mapSize; my++) {
    for (let mx = 0; mx < mapSize; mx++) {
      const startX = mx * blockSize;
      const startY = my * blockSize;
      const endX = Math.min(startX + blockSize, width);
      const endY = Math.min(startY + blockSize, height);

      let sumX = 0;
      let sumY = 0;
      let totalMag = 0;
      let shadowScore = 0;
      let shadowCount = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = y * width + x;
          const gradX = gx[idx];
          const gradY = gy[idx];
          const mag = Math.hypot(gradX, gradY);

          if (mag >= 0.05) {
            const angle = Math.atan2(gradY, gradX);
            sumX += Math.cos(angle) * mag;
            sumY += Math.sin(angle) * mag;
            totalMag += mag;
          }

          // Shadow analysis
          if (gray[idx] < 0.22 && mag >= 0.08) {
            const angle = Math.atan2(gradY, gradX);
            shadowScore += 1 - Math.abs(Math.cos(angle));
            shadowCount++;
          }
        }
      }

      // Local coherence (deviation from global)
      const localCoherence = totalMag > 0 ? Math.hypot(sumX, sumY) / totalMag : globalCoherence;
      const coherenceDeviation = Math.abs(localCoherence - globalCoherence);

      // Shadow misalignment contribution
      const localShadowMisalignment = shadowCount > 0 ? shadowScore / shadowCount : 0;

      // Combined score: areas with low coherence or shadow issues
      const anomalyScore = clamp01(
        coherenceDeviation * 0.6 +
        localShadowMisalignment * 0.4
      );

      data[my * mapSize + mx] = anomalyScore;
    }
  }

  return { width: mapSize, height: mapSize, data };
}

function sobelGradients(gray: Float32Array, width: number, height: number) {
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const idx = row + x;
      const tl = gray[idx - width - 1];
      const tc = gray[idx - width];
      const tr = gray[idx - width + 1];
      const ml = gray[idx - 1];
      const mr = gray[idx + 1];
      const bl = gray[idx + width - 1];
      const bc = gray[idx + width];
      const br = gray[idx + width + 1];
      gx[idx] = -tl - 2 * ml - bl + tr + 2 * mr + br;
      gy[idx] = -tl - 2 * tc - tr + bl + 2 * bc + br;
    }
  }
  return { gx, gy };
}

function orientationHistogram(
  gx: Float32Array,
  gy: Float32Array,
  width: number,
  height: number
): { histogram: number[]; coherence: number } {
  const bins = 18;
  const histogram = new Array(bins).fill(0);
  let sumX = 0;
  let sumY = 0;
  let total = 0;
  for (let i = 0; i < width * height; i += 1) {
    const x = gx[i];
    const y = gy[i];
    const mag = Math.hypot(x, y);
    if (mag < 0.05) continue;
    const angle = Math.atan2(y, x);
    const normalized = (angle + Math.PI) / (2 * Math.PI);
    const bin = Math.min(bins - 1, Math.floor(normalized * bins));
    histogram[bin] += mag;
    sumX += Math.cos(angle) * mag;
    sumY += Math.sin(angle) * mag;
    total += mag;
  }
  const coherence = total > 0 ? Math.hypot(sumX, sumY) / total : 0;
  return { histogram, coherence };
}

function histogramEntropy(histogram: number[]): number {
  const sum = histogram.reduce((acc, v) => acc + v, 0);
  if (sum === 0) return 0;
  let entropy = 0;
  for (const v of histogram) {
    if (v <= 0) continue;
    const p = v / sum;
    entropy -= p * Math.log2(p);
  }
  return entropy / Math.log2(histogram.length);
}

export function analyzePhysicsConsistency(
  image: StandardizedImage
): PhysicsConsistencyResult {
  const { gray, width, height } = image.resized;
  const flags: string[] = [];

  const { gx, gy } = sobelGradients(gray, width, height);
  const { histogram, coherence } = orientationHistogram(gx, gy, width, height);
  const entropy = histogramEntropy(histogram);

  const lightInconsistency = clamp01(1 - coherence);
  if (lightInconsistency > 0.65) {
    flags.push("light_direction_inconsistent");
  }

  const perspectiveChaos = clamp01(entropy);
  if (perspectiveChaos > 0.65) {
    flags.push("perspective_incoherent");
  }

  let shadowAlignmentScore = 0;
  let shadowCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const idx = row + x;
      if (gray[idx] > 0.22) continue;
      const mag = Math.hypot(gx[idx], gy[idx]);
      if (mag < 0.08) continue;
      const angle = Math.atan2(gy[idx], gx[idx]);
      shadowAlignmentScore += Math.abs(Math.cos(angle));
      shadowCount += 1;
    }
  }
  const shadowAlignment = shadowCount > 0 ? shadowAlignmentScore / shadowCount : 0;
  const shadowMisalignment = clamp01(1 - shadowAlignment);
  if (shadowMisalignment > 0.55) {
    flags.push("shadow_misalignment");
  }

  const physicsScore = clamp01(
    0.35 * lightInconsistency + 0.35 * shadowMisalignment + 0.3 * perspectiveChaos
  );

  // Generate spatial map
  const spatialMap = generatePhysicsSpatialMap(gx, gy, gray, width, height, coherence);

  return {
    physics_score: physicsScore,
    flags,
    details: {
      lightInconsistency,
      shadowMisalignment,
      perspectiveChaos,
      gradientCoherence: coherence,
      orientationEntropy: entropy,
    },
    spatialMap,
  };
}

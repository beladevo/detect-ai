import { StandardizedImage, VisualArtifactsResult } from "@/src/lib/pipeline/types";

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function rgbToYCbCr(r: number, g: number, b: number): { y: number; cb: number; cr: number } {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

function computeLaplacianVariance(gray: Float32Array, width: number, height: number): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const idx = row + x;
      const v =
        -4 * gray[idx] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width];
      sum += v;
      sumSq += v * v;
      count += 1;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return Math.max(0, sumSq / count - mean * mean);
}

function blockVariance(gray: Float32Array, width: number, height: number, block: number): number[] {
  const variances: number[] = [];
  for (let by = 0; by + block <= height; by += block) {
    for (let bx = 0; bx + block <= width; bx += block) {
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let y = 0; y < block; y += 1) {
        const row = (by + y) * width + bx;
        for (let x = 0; x < block; x += 1) {
          const v = gray[row + x];
          sum += v;
          sumSq += v * v;
          count += 1;
        }
      }
      const mean = sum / count;
      variances.push(Math.max(0, sumSq / count - mean * mean));
    }
  }
  return variances;
}

export function analyzeVisualArtifacts(image: StandardizedImage): VisualArtifactsResult {
  const { resized } = image;
  const { rgb, gray, width, height } = resized;
  const flags: string[] = [];

  let skinCount = 0;
  let skinLaplacianSum = 0;
  let skinLaplacianSumSq = 0;
  let skinLaplacianCount = 0;

  let skinCbSum = 0;
  let skinCbSumSq = 0;
  let skinCrSum = 0;
  let skinCrSumSq = 0;

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = row + x;
      const base = idx * 3;
      const r = rgb[base];
      const g = rgb[base + 1];
      const b = rgb[base + 2];
      const { y: luma, cb, cr } = rgbToYCbCr(r, g, b);
      const isSkin =
        luma > 40 &&
        cb >= 77 &&
        cb <= 127 &&
        cr >= 133 &&
        cr <= 173;
      if (isSkin) {
        skinCount += 1;
        skinCbSum += cb;
        skinCbSumSq += cb * cb;
        skinCrSum += cr;
        skinCrSumSq += cr * cr;

        if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
          const lap =
            -4 * gray[idx] +
            gray[idx - 1] +
            gray[idx + 1] +
            gray[idx - width] +
            gray[idx + width];
          skinLaplacianSum += lap;
          skinLaplacianSumSq += lap * lap;
          skinLaplacianCount += 1;
        }
      }
    }
  }

  let skinVariance = 0;
  let skinChrominanceVariance = 0;

  if (skinLaplacianCount > 0) {
    const mean = skinLaplacianSum / skinLaplacianCount;
    skinVariance = Math.max(
      0,
      skinLaplacianSumSq / skinLaplacianCount - mean * mean
    );
  }

  if (skinCount > 0) {
    const cbMean = skinCbSum / skinCount;
    const crMean = skinCrSum / skinCount;
    const cbVar = Math.max(0, skinCbSumSq / skinCount - cbMean * cbMean);
    const crVar = Math.max(0, skinCrSumSq / skinCount - crMean * crMean);
    // Normalized variance (Cb/Cr range is roughly 0-255)
    skinChrominanceVariance = (cbVar + crVar) / (2 * 255 * 255);
  }

  const globalLaplacianVariance = computeLaplacianVariance(gray, width, height);
  const smoothingScore = skinCount > 0
    ? clamp01((0.018 - skinVariance) / 0.018)
    : clamp01((0.012 - globalLaplacianVariance) / 0.012);
  if (smoothingScore > 0.55) {
    flags.push("skin_smoothing");
  }

  const colorNoiseScore = skinCount > 0
    ? clamp01((skinChrominanceVariance - 0.0004) / 0.0018)
    : 0;
  if (colorNoiseScore > 0.45) {
    flags.push("skin_color_noise");
  }

  const variances = blockVariance(gray, width, height, 8);
  const lowVar = variances.filter((v) => v < 0.0025).length;
  const textureMeltScore = clamp01(lowVar / Math.max(1, variances.length));
  if (textureMeltScore > 0.45) {
    flags.push("texture_melting");
  }

  let symmetryDiff = 0;
  let symmetryCount = 0;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width / 2; x += 1) {
      const left = gray[row + x];
      const right = gray[row + (width - 1 - x)];
      symmetryDiff += Math.abs(left - right);
      symmetryCount += 1;
    }
  }
  const avgDiff = symmetryCount > 0 ? symmetryDiff / symmetryCount : 1;
  const symmetryScore = clamp01((0.18 - avgDiff) / 0.18);
  if (symmetryScore > 0.65) {
    flags.push("high_symmetry");
  }

  const visualScore = clamp01(
    0.35 * smoothingScore +
      0.3 * textureMeltScore +
      0.15 * symmetryScore +
      0.2 * colorNoiseScore
  );

  return {
    visual_artifacts_score: visualScore,
    flags,
    details: {
      smoothingScore,
      colorNoiseScore,
      textureMeltScore,
      symmetryScore,
      skinCoverage: skinCount / (width * height),
      globalLaplacianVariance,
      skinChrominanceVariance,
    },
  };
}

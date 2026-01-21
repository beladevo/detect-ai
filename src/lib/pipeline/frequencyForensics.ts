import { FrequencyForensicsResult, StandardizedImage } from "@/src/lib/pipeline/types";

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function fft1d(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j2 = 0; j2 < len / 2; j2 += 1) {
        const uRe = re[i + j2];
        const uIm = im[i + j2];
        const vRe = re[i + j2 + len / 2] * wRe - im[i + j2 + len / 2] * wIm;
        const vIm = re[i + j2 + len / 2] * wIm + im[i + j2 + len / 2] * wRe;
        re[i + j2] = uRe + vRe;
        im[i + j2] = uIm + vIm;
        re[i + j2 + len / 2] = uRe - vRe;
        im[i + j2 + len / 2] = uIm - vIm;
        const nextRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextRe;
      }
    }
  }
}

function fft2d(input: Float32Array, width: number, height: number): Float64Array {
  const re = new Float64Array(width * height);
  const im = new Float64Array(width * height);
  let mean = 0;
  for (let i = 0; i < input.length; i += 1) {
    mean += input[i];
  }
  mean /= input.length;
  for (let i = 0; i < input.length; i += 1) {
    re[i] = input[i] - mean;
  }

  const rowRe = new Float64Array(width);
  const rowIm = new Float64Array(width);
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      rowRe[x] = re[row + x];
      rowIm[x] = im[row + x];
    }
    fft1d(rowRe, rowIm);
    for (let x = 0; x < width; x += 1) {
      re[row + x] = rowRe[x];
      im[row + x] = rowIm[x];
    }
  }

  const colRe = new Float64Array(height);
  const colIm = new Float64Array(height);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      colRe[y] = re[y * width + x];
      colIm[y] = im[y * width + x];
    }
    fft1d(colRe, colIm);
    for (let y = 0; y < height; y += 1) {
      re[y * width + x] = colRe[y];
      im[y * width + x] = colIm[y];
    }
  }

  const magnitude = new Float64Array(width * height);
  for (let i = 0; i < magnitude.length; i += 1) {
    magnitude[i] = Math.hypot(re[i], im[i]);
  }
  return magnitude;
}

function laplacianResidual(gray: Float32Array, width: number, height: number): Float32Array {
  const residual = new Float32Array(gray.length);
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const idx = row + x;
      residual[idx] =
        -4 * gray[idx] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width];
    }
  }
  return residual;
}

function correlation(residual: Float32Array, width: number, height: number, dx: number, dy: number): number {
  let sum = 0;
  let sumSq = 0;
  let sumShift = 0;
  let sumShiftSq = 0;
  let sumCross = 0;
  let count = 0;
  for (let y = 1; y < height - 1 - dy; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1 - dx; x += 1) {
      const a = residual[row + x];
      const b = residual[(y + dy) * width + (x + dx)];
      sum += a;
      sumSq += a * a;
      sumShift += b;
      sumShiftSq += b * b;
      sumCross += a * b;
      count += 1;
    }
  }
  if (count === 0) return 0;
  const meanA = sum / count;
  const meanB = sumShift / count;
  const varA = sumSq / count - meanA * meanA;
  const varB = sumShiftSq / count - meanB * meanB;
  if (varA <= 0 || varB <= 0) return 0;
  const cov = sumCross / count - meanA * meanB;
  return cov / Math.sqrt(varA * varB);
}

function dct8x8(block: Float32Array): Float32Array {
  const out = new Float32Array(64);
  const cosTable: number[][] = [];
  for (let u = 0; u < 8; u += 1) {
    cosTable[u] = [];
    for (let x = 0; x < 8; x += 1) {
      cosTable[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / 16);
    }
  }
  for (let v = 0; v < 8; v += 1) {
    const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
    for (let u = 0; u < 8; u += 1) {
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      let sum = 0;
      for (let y = 0; y < 8; y += 1) {
        const row = y * 8;
        const cosVy = cosTable[v][y];
        for (let x = 0; x < 8; x += 1) {
          sum += block[row + x] * cosTable[u][x] * cosVy;
        }
      }
      out[v * 8 + u] = 0.25 * cu * cv * sum;
    }
  }
  return out;
}

function dctBlockStats(gray: Float32Array, width: number, height: number): number {
  const step = Math.floor(width / 4);
  let energySum = 0;
  let count = 0;
  for (let by = 0; by + 8 < height; by += step) {
    for (let bx = 0; bx + 8 < width; bx += step) {
      const block = new Float32Array(64);
      for (let y = 0; y < 8; y += 1) {
        const row = (by + y) * width + bx;
        for (let x = 0; x < 8; x += 1) {
          block[y * 8 + x] = gray[row + x];
        }
      }
      const dct = dct8x8(block);
      let highEnergy = 0;
      let totalEnergy = 0;
      for (let i = 1; i < dct.length; i += 1) {
        const v = Math.abs(dct[i]);
        totalEnergy += v;
        if (i > 10) highEnergy += v;
      }
      if (totalEnergy > 0) {
        energySum += highEnergy / totalEnergy;
        count += 1;
      }
    }
  }
  return count > 0 ? energySum / count : 0;
}

export function analyzeFrequencyForensics(image: StandardizedImage): FrequencyForensicsResult {
  const { gray, width, height } = image.resized;
  const flags: string[] = [];

  const spectrum = fft2d(gray, width, height);
  let total = 0;
  let high = 0;
  let low = 0;
  const values: number[] = [];
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    const fy = y <= height / 2 ? y : height - y;
    for (let x = 0; x < width; x += 1) {
      const fx = x <= width / 2 ? x : width - x;
      const r = Math.hypot(fx, fy);
      const mag = spectrum[row + x];
      if (r < 4) {
        low += mag;
      } else if (r > width / 4) {
        high += mag;
      }
      total += mag;
      if (r > 4) values.push(mag);
    }
  }
  const highRatio = total > 0 ? high / total : 0;
  const lowRatio = total > 0 ? low / total : 0;

  const mean = values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length);
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) /
    Math.max(1, values.length);
  const std = Math.sqrt(variance);
  const peakThreshold = mean + 2.5 * std; 
  const peakCount = values.filter((v) => v > peakThreshold).length;
  const peakScore = clamp01(peakCount / Math.max(1, values.length / 45));
  if (peakScore > 0.5) {
    flags.push("spectral_peaks");
  }

  const residual = laplacianResidual(gray, width, height);
  const noiseCorr = correlation(residual, width, height, 1, 0);
  const noiseScore = clamp01((noiseCorr - 0.08) / 0.35);
  if (noiseScore > 0.55) {
    flags.push("structured_noise");
  }

  const dctEnergyRatio = dctBlockStats(gray, width, height);
  const dctScore = clamp01((0.42 - dctEnergyRatio) / 0.42);
  if (dctScore > 0.55) {
    flags.push("low_dct_highfreq_energy");
  }

  const frequencyScore = clamp01(
    0.3 * clamp01((highRatio - 0.12) / 0.32) +
      0.2 * peakScore +
      0.2 * noiseScore +
      0.3 * dctScore
  );

  return {
    frequency_score: frequencyScore,
    flags,
    details: {
      highRatio,
      lowRatio,
      peakScore,
      noiseCorr,
      dctEnergyRatio,
    },
  };
}

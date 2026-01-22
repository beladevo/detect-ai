import fs from "node:fs";
import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";
import { resolveModelConfig } from "@/src/lib/modelConfigs";
import {
  logInference,
  createLogEntry,
  isLoggingEnabled,
} from "@/src/lib/inferenceLogger";

type DetectionResult = {
  isAI: boolean;
  confidence: number;
  model: string;
};

type SessionState = {
  session: ort.InferenceSession;
  inputName: string;
  outputName: string;
  layout: "NCHW" | "NHWC";
  width: number;
  height: number;
  model: string;
};

type InputMetadata = {
  dimensions?: Array<number | string | null>;
};

const MODEL_RELATIVE_PATH = "public/models/onnx";
const DEFAULT_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Multi-crop settings
const MULTI_CROP_THRESHOLD = 512; // Use multi-crop for images larger than this
const MAX_PIXELS = 4096 * 4096;

type CropRegion = {
  name: string;
  x: number;
  y: number;
  size: number;
};

const sessionCache = new Map<string, Promise<SessionState>>();

async function getSession(modelName?: string): Promise<SessionState> {
  const { name } = resolveModelConfig(modelName);
  const cacheKey = name;
  if (!sessionCache.has(cacheKey)) {
    const sessionPromise = (async () => {
      const modelPath = resolveModelPath(name);
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model not found: ${modelPath}`);
      }

      console.info("Node detector: loading model", modelPath);
      const session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
      });

      const inputName = session.inputNames[0];
      const outputName = session.outputNames[0];
      const rawMetadata = session.inputMetadata as unknown;
      const metadata = Array.isArray(rawMetadata)
        ? (rawMetadata[0] as InputMetadata)
        : (rawMetadata as Record<string, InputMetadata>)[inputName];
      const { layout, width, height } = resolveInputShape(metadata);

      console.info("Node detector: model ready", {
        modelName: name,
        inputName,
        outputName,
        layout,
        width,
        height,
      });
      return {
        session,
        inputName,
        outputName,
        layout,
        width,
        height,
        model: path.basename(modelPath),
      };
    })();
    sessionCache.set(cacheKey, sessionPromise);
  }

  return sessionCache.get(cacheKey)!;
}

function resolveModelPath(modelName: string): string {
  return path.join(process.cwd(), MODEL_RELATIVE_PATH, modelName);
}

function resolveInputShape(meta?: InputMetadata): {
  layout: "NCHW" | "NHWC";
  width: number;
  height: number;
} {
  const dims = meta?.dimensions ?? [];
  if (dims.length === 4) {
    const [, d1, d2, d3] = dims;
    if (d1 === 3) {
      return {
        layout: "NCHW",
        width: typeof d3 === "number" && d3 > 0 ? d3 : DEFAULT_SIZE,
        height: typeof d2 === "number" && d2 > 0 ? d2 : DEFAULT_SIZE,
      };
    }
    if (d3 === 3) {
      return {
        layout: "NHWC",
        width: typeof d2 === "number" && d2 > 0 ? d2 : DEFAULT_SIZE,
        height: typeof d1 === "number" && d1 > 0 ? d1 : DEFAULT_SIZE,
      };
    }
  }

  return { layout: "NCHW", width: DEFAULT_SIZE, height: DEFAULT_SIZE };
}

function buildInputTensor(
  image: Uint8Array,
  width: number,
  height: number,
  channels: number,
  targetW: number,
  targetH: number,
  layout: "NCHW" | "NHWC"
): ort.Tensor {
  const scaleX = width / targetW;
  const scaleY = height / targetH;
  const pixelCount = targetW * targetH;
  const data =
    layout === "NCHW"
      ? new Float32Array(3 * pixelCount)
      : new Float32Array(pixelCount * 3);

  for (let y = 0; y < targetH; y += 1) {
    const srcY = Math.min(height - 1, Math.floor((y + 0.5) * scaleY));
    for (let x = 0; x < targetW; x += 1) {
      const srcX = Math.min(width - 1, Math.floor((x + 0.5) * scaleX));
      const srcIndex = (srcY * width + srcX) * channels;
      let r = image[srcIndex] / 255;
      let g = image[srcIndex + 1] / 255;
      let b = image[srcIndex + 2] / 255;
      if (channels === 4) {
        const a = image[srcIndex + 3] / 255;
        const inv = 1 - a;
        r = r * a + inv;
        g = g * a + inv;
        b = b * a + inv;
      }

      r = (r - MEAN[0]) / STD[0];
      g = (g - MEAN[1]) / STD[1];
      b = (b - MEAN[2]) / STD[2];

      if (layout === "NCHW") {
        const base = y * targetW + x;
        data[base] = r;
        data[pixelCount + base] = g;
        data[pixelCount * 2 + base] = b;
      } else {
        const base = (y * targetW + x) * 3;
        data[base] = r;
        data[base + 1] = g;
        data[base + 2] = b;
      }
    }
  }

  const dims =
    layout === "NCHW" ? [1, 3, targetH, targetW] : [1, targetH, targetW, 3];
  return new ort.Tensor("float32", data, dims);
}

/**
 * Calculate crop regions for multi-crop analysis.
 * For large images, we analyze multiple regions and average the results.
 */
function getCropRegions(width: number, height: number, targetSize: number): CropRegion[] {
  const minDim = Math.min(width, height);

  // If image is small enough, just use center crop
  if (minDim <= MULTI_CROP_THRESHOLD) {
    return [{
      name: "center",
      x: Math.floor((width - minDim) / 2),
      y: Math.floor((height - minDim) / 2),
      size: minDim,
    }];
  }

  // For large images, use 5 crops: 4 corners + center
  const cropSize = Math.min(minDim, Math.max(targetSize * 2, 448)); // At least 2x target size

  const regions: CropRegion[] = [
    // Center crop (most important)
    {
      name: "center",
      x: Math.floor((width - cropSize) / 2),
      y: Math.floor((height - cropSize) / 2),
      size: cropSize,
    },
    // Top-left
    {
      name: "top-left",
      x: 0,
      y: 0,
      size: cropSize,
    },
    // Top-right
    {
      name: "top-right",
      x: Math.max(0, width - cropSize),
      y: 0,
      size: cropSize,
    },
    // Bottom-left
    {
      name: "bottom-left",
      x: 0,
      y: Math.max(0, height - cropSize),
      size: cropSize,
    },
    // Bottom-right
    {
      name: "bottom-right",
      x: Math.max(0, width - cropSize),
      y: Math.max(0, height - cropSize),
      size: cropSize,
    },
  ];

  return regions;
}

/**
 * Run inference on a single crop region.
 */
async function runInferenceOnCrop(
  buffer: Buffer,
  crop: CropRegion,
  session: SessionState,
  aiIndex: number
): Promise<{ confidence: number; rawValues: number[]; probabilities: number[] }> {
  // Extract and resize the crop
  const cropped = await sharp(buffer, { failOn: "none" })
    .extract({
      left: crop.x,
      top: crop.y,
      width: crop.size,
      height: crop.size,
    })
    .ensureAlpha()
    .resize(session.width, session.height, { fit: "cover", kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = buildInputTensor(
    new Uint8Array(cropped.data.buffer, cropped.data.byteOffset, cropped.data.byteLength),
    cropped.info.width,
    cropped.info.height,
    cropped.info.channels,
    session.width,
    session.height,
    session.layout
  );

  const results = await session.session.run({ [session.inputName]: tensor });
  const output = results[session.outputName];

  if (!output) {
    throw new Error("Model output missing");
  }

  const rawData = output.data as Float32Array | number[];
  const rawValues = Array.from(rawData).map((v) => Number(v));

  // Calculate probabilities
  let probabilities: number[];
  if (rawValues.length === 1) {
    const value = rawValues[0];
    const prob = value >= 0 && value <= 1 ? value : 1 / (1 + Math.exp(-value));
    probabilities = [prob];
  } else {
    let sum = 0;
    let inRange = true;
    for (const v of rawValues) {
      sum += v;
      if (v < 0 || v > 1) inRange = false;
    }
    if (inRange && Math.abs(sum - 1) < 0.01) {
      probabilities = rawValues;
    } else {
      probabilities = Array.from(softmax(rawValues));
    }
  }

  const confidence = probabilities.length > 1 ? probabilities[aiIndex] : probabilities[0];

  return { confidence, rawValues, probabilities };
}

function softmax(values: Float32Array | number[]): Float32Array {
  let max = -Infinity;
  for (const v of values) {
    if (v > max) max = v;
  }
  let sum = 0;
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const e = Math.exp(values[i] - max);
    out[i] = e;
    sum += e;
  }
  if (sum > 0) {
    for (let i = 0; i < out.length; i += 1) {
      out[i] /= sum;
    }
  }
  return out;
}

export async function detectAIFromBuffer(
  buffer: Buffer,
  modelName?: string,
  fileName?: string
): Promise<DetectionResult> {
  const session = await getSession(modelName);
  const { config } = resolveModelConfig(modelName);

  // Get original image dimensions
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  if (!originalWidth || !originalHeight) {
    throw new Error("Unable to read image dimensions");
  }

  if (originalWidth * originalHeight > MAX_PIXELS) {
    throw new Error("Image dimensions out of range");
  }

  const startTime = performance.now();

  // Determine crop regions based on image size
  const crops = getCropRegions(originalWidth, originalHeight, session.width);
  const useMultiCrop = crops.length > 1;

  let finalConfidence: number;
  let finalRawValues: number[];
  let finalProbabilities: number[];

  if (useMultiCrop) {
    // Run inference on multiple crops and average the results
    console.log(`Multi-crop analysis: ${crops.length} regions for ${originalWidth}x${originalHeight} image`);

    const cropResults = await Promise.all(
      crops.map((crop) => runInferenceOnCrop(buffer, crop, session, config.aiIndex))
    );

    // Average the confidences (weighted: center crop has more weight)
    const weights = crops.map((c) => (c.name === "center" ? 2 : 1));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    finalConfidence = cropResults.reduce(
      (sum, result, i) => sum + result.confidence * weights[i],
      0
    ) / totalWeight;

    // Use center crop's raw values for logging (most representative)
    const centerResult = cropResults[0];
    finalRawValues = centerResult.rawValues;
    finalProbabilities = centerResult.probabilities;

    // Log individual crop results
    console.log("=== MULTI-CROP RESULTS ===");
    crops.forEach((crop, i) => {
      console.log(`  ${crop.name}: ${(cropResults[i].confidence * 100).toFixed(1)}%`);
    });
    console.log(`  Weighted average: ${(finalConfidence * 100).toFixed(1)}%`);
    console.log("==========================");
  } else {
    // Single crop (small image) - use center crop with proper aspect ratio
    const crop = crops[0];

    // Extract center crop and resize properly (no stretching!)
    const cropped = await sharp(buffer, { failOn: "none" })
      .extract({
        left: crop.x,
        top: crop.y,
        width: crop.size,
        height: crop.size,
      })
      .ensureAlpha()
      .resize(session.width, session.height, { fit: "cover", kernel: "lanczos3" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = buildInputTensor(
      new Uint8Array(cropped.data.buffer, cropped.data.byteOffset, cropped.data.byteLength),
      cropped.info.width,
      cropped.info.height,
      cropped.info.channels,
      session.width,
      session.height,
      session.layout
    );

    const results = await session.session.run({ [session.inputName]: tensor });
    const output = results[session.outputName];

    if (!output) {
      throw new Error("Model output missing");
    }

    const rawData = output.data as Float32Array | number[];
    finalRawValues = Array.from(rawData).map((v) => Number(v));

    // Calculate probabilities
    if (finalRawValues.length === 1) {
      const value = finalRawValues[0];
      const prob = value >= 0 && value <= 1 ? value : 1 / (1 + Math.exp(-value));
      finalProbabilities = [prob];
    } else {
      let sum = 0;
      let inRange = true;
      for (const v of finalRawValues) {
        sum += v;
        if (v < 0 || v > 1) inRange = false;
      }
      if (inRange && Math.abs(sum - 1) < 0.01) {
        finalProbabilities = finalRawValues;
      } else {
        finalProbabilities = Array.from(softmax(finalRawValues));
      }
    }

    finalConfidence = finalProbabilities.length > 1
      ? finalProbabilities[config.aiIndex]
      : finalProbabilities[0];
  }

  const inferenceTimeMs = performance.now() - startTime;
  const clamped = Math.min(1, Math.max(0, finalConfidence));
  const score = Math.round(clamped * 100);

  // Log model output to console
  console.log("=== MODEL INFERENCE ===");
  console.log("File:", fileName || "unknown");
  console.log("Model:", session.model);
  console.log("Original Size:", `${originalWidth}x${originalHeight}`);
  console.log("Multi-crop:", useMultiCrop ? `Yes (${crops.length} regions)` : "No");
  console.log("AI Index:", config.aiIndex);
  console.log("Raw Output:", finalRawValues);
  console.log("Probabilities:", finalProbabilities);
  console.log("Confidence:", clamped);
  console.log("Score:", score);
  console.log("Inference Time:", inferenceTimeMs.toFixed(2), "ms");
  console.log("=======================");

  // Log inference details to file if enabled
  if (isLoggingEnabled()) {
    const logEntry = createLogEntry(
      "node",
      session.model,
      fileName,
      {
        originalWidth,
        originalHeight,
        channels: 4,
        targetWidth: session.width,
        targetHeight: session.height,
        layout: session.layout,
        tensorShape: [1, 3, session.height, session.width],
        multiCrop: useMultiCrop,
        cropCount: crops.length,
      },
      {
        rawValues: finalRawValues,
        probabilities: finalProbabilities,
        aiIndex: config.aiIndex,
        confidence: clamped,
        score,
      },
      inferenceTimeMs
    );
    logInference(logEntry);
  }

  return { isAI: clamped >= 0.5, confidence: clamped, model: session.model };
}

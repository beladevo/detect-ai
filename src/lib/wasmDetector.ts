import * as ort from "onnxruntime-web";
import { resolveModelConfig, getModelPathFor, MODEL_NAME } from "@/src/lib/modelConfigs";
import { scoreFromConfidence } from "@/src/lib/scoreUtils";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import { getVerdictPresentation } from "@/src/lib/verdictUi";
import type { VerdictPresentation } from "@/src/lib/verdictUi";
import { analyzeImagePipelineBrowser } from "@/src/lib/pipeline/analyzeImagePipelineBrowser";

type DetectionResult = {
  isAI: boolean;
  confidence: number;
  pipeline?: PipelineResult;
};

export type AnalysisResult = {
  score: number;
  pipeline?: PipelineResult;
  presentation?: VerdictPresentation;
};

type SessionState = {
  session: ort.InferenceSession;
  inputName: string;
  outputName: string;
  layout: "NCHW" | "NHWC";
  width: number;
  height: number;
};

type InputMetadata = {
  dimensions?: Array<number | string | null>;
};

const ORT_WASM_PATH = "/onnxruntime/";
const MAX_PIXELS = 4096 * 4096;
const DEFAULT_SIZE = 224;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

// Helper to dispatch toast events from non-React code
function dispatchToast(detail: { title?: string; description: string; variant?: "default" | "success" | "error" | "warning"; duration?: number }) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("dispatch-toast", { detail });
    window.dispatchEvent(event);
  }
}

const sessionCache = new Map<string, Promise<SessionState>>();


async function getSession(modelName?: string): Promise<SessionState> {
  const { name } = resolveModelConfig(modelName);
  const cacheKey = name;
  if (!sessionCache.has(cacheKey)) {
    const sessionPromise = (async () => {
      ort.env.wasm.wasmPaths = ORT_WASM_PATH;
      const cpuThreads =
        typeof navigator !== "undefined"
          ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
          : 1;
      console.info("WASM detector: env", {
        simd: true,
        threads: cpuThreads,
      });

      const modelPaths = [getModelPathFor(name)];
      let lastError: unknown = null;
      for (const modelPath of modelPaths) {
        const executionProviders: Array<"wasm"> = ["wasm"];
        const modelBuffer = await fetchModelBuffer(modelPath);
        const externalData = await resolveExternalData(modelPath);
        const attempts: Array<{ simd: boolean; numThreads: number }> = [
          { simd: true, numThreads: cpuThreads },
          { simd: false, numThreads: 1 },
        ];
        for (const attempt of attempts) {
          try {
            console.info("WASM detector: loading model", {
              modelPath,
              executionProviders,
              simd: attempt.simd,
              numThreads: attempt.numThreads,
            });
            ort.env.wasm.simd = attempt.simd;
            ort.env.wasm.numThreads = attempt.numThreads;
            const session = await ort.InferenceSession.create(modelBuffer.slice(0), {
              executionProviders,
              graphOptimizationLevel: "all",
              externalData,
            });

            const inputName = session.inputNames[0];
            const outputName = session.outputNames[0];
            const rawMetadata = session.inputMetadata as unknown;
            const metadata = Array.isArray(rawMetadata)
              ? (rawMetadata[0] as InputMetadata)
              : (rawMetadata as Record<string, InputMetadata>)[inputName];
            const { layout, width, height } = resolveInputShape(metadata);

            console.info("WASM detector: model ready", {
              modelName: name,
              modelPath,
              executionProviders,
              simd: attempt.simd,
              numThreads: attempt.numThreads,
              inputName,
              outputName,
              layout,
              width,
              height,
            });

            return { session, inputName, outputName, layout, width, height };
          } catch (error) {
            lastError = error;
            console.error("WASM detector: provider failed", {
              modelPath,
              executionProviders,
              simd: attempt.simd,
              numThreads: attempt.numThreads,
              error: formatWasmError(error),
            });
          }
        }
      }
      throw new Error(`Unable to load WASM model: ${formatWasmError(lastError)}`);
    })();
    sessionCache.set(cacheKey, sessionPromise);
  }

  return sessionCache.get(cacheKey)!;
}


function resolveInputShape(meta?: InputMetadata): {
  layout: "NCHW" | "NHWC";
  width: number;
  height: number;
} {
  const dims = meta?.dimensions ?? [];
  if (dims.length === 4) {
    const [d0, d1, d2, d3] = dims;
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

function probabilityFromOutput(output: ort.Tensor, aiIndex = 1): number {
  const data = output.data as Float32Array | number[];
  if (!data || data.length === 0) {
    throw new Error("Model returned no data");
  }
  if (data.length === 1) {
    const value = data[0];
    if (value >= 0 && value <= 1) {
      return value;
    }
    return 1 / (1 + Math.exp(-value));
  }
  let sum = 0;
  let inRange = true;
  for (const v of data) {
    sum += v;
    if (v < 0 || v > 1) inRange = false;
  }
  const probs = inRange && Math.abs(sum - 1) < 0.01 ? new Float32Array(data) : softmax(data);
  const index = probs.length > 1 ? aiIndex : 0;
  return probs[index];
}

/**
 * Extract crop from image
 */
function extractCrop(
  image: Uint8Array,
  width: number,
  height: number,
  channels: number,
  x: number,
  y: number,
  cropWidth: number,
  cropHeight: number
): Uint8Array {
  const crop = new Uint8Array(cropWidth * cropHeight * channels);
  for (let cy = 0; cy < cropHeight; cy++) {
    const srcY = Math.min(height - 1, y + cy);
    for (let cx = 0; cx < cropWidth; cx++) {
      const srcX = Math.min(width - 1, x + cx);
      const srcIdx = (srcY * width + srcX) * channels;
      const dstIdx = (cy * cropWidth + cx) * channels;
      for (let c = 0; c < channels; c++) {
        crop[dstIdx + c] = image[srcIdx + c];
      }
    }
  }
  return crop;
}

export async function detectAI(
  image: Uint8Array,
  width: number,
  height: number,
  channels = 4,
  modelName?: string
): Promise<DetectionResult> {
  console.debug("WASM detector: input", { width, height, channels });
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("Invalid image dimensions");
  }
  if (width <= 0 || height <= 0 || width * height > MAX_PIXELS) {
    throw new Error("Image dimensions out of range");
  }
  if (channels !== 3 && channels !== 4) {
    throw new Error("Channels must be 3 (RGB) or 4 (RGBA)");
  }

  const { config } = resolveModelConfig(modelName);
  const session = await getSession(modelName);

  // Multi-crop analysis for large images (matching server-side nodeDetector.ts)
  const MIN_CROP_SIZE = 512;
  const useCrops = width >= MIN_CROP_SIZE && height >= MIN_CROP_SIZE;

  if (useCrops) {
    const cropSize = 448;
    const crops: Array<{ x: number; y: number; weight: number }> = [
      // Center crop (higher weight)
      {
        x: Math.floor((width - cropSize) / 2),
        y: Math.floor((height - cropSize) / 2),
        weight: 2,
      },
      // Corner crops
      { x: 0, y: 0, weight: 1 },
      { x: width - cropSize, y: 0, weight: 1 },
      { x: 0, y: height - cropSize, weight: 1 },
      { x: width - cropSize, y: height - cropSize, weight: 1 },
    ];

    let totalWeight = 0;
    let weightedSum = 0;

    console.debug("WASM detector: multi-crop analysis", { numCrops: crops.length });

    for (const crop of crops) {
      const cropData = extractCrop(
        image,
        width,
        height,
        channels,
        crop.x,
        crop.y,
        cropSize,
        cropSize
      );

      const tensor = buildInputTensor(
        cropData,
        cropSize,
        cropSize,
        channels,
        session.width,
        session.height,
        session.layout
      );

      const results = await session.session.run({ [session.inputName]: tensor });
      const output = results[session.outputName];
      if (!output) {
        throw new Error("Model output missing");
      }

      const confidence = probabilityFromOutput(output, config.aiIndex);
      weightedSum += confidence * crop.weight;
      totalWeight += crop.weight;

      console.debug("WASM detector: crop result", {
        x: crop.x,
        y: crop.y,
        weight: crop.weight,
        confidence,
      });
    }

    const finalConfidence = weightedSum / totalWeight;
    const clamped = Math.min(1, Math.max(0, finalConfidence));
    console.debug("WASM detector: multi-crop output", { confidence: clamped });
    return { isAI: clamped >= 0.5, confidence: clamped };
  }

  // Single inference for small images
  const tensor = buildInputTensor(
    image,
    width,
    height,
    channels,
    session.width,
    session.height,
    session.layout
  );
  const results = await session.session.run({ [session.inputName]: tensor });
  const output = results[session.outputName];
  if (!output) {
    throw new Error("Model output missing");
  }
  const confidence = probabilityFromOutput(output, config.aiIndex);
  const clamped = Math.min(1, Math.max(0, confidence));
  console.debug("WASM detector: single-crop output", { confidence: clamped });
  return { isAI: clamped >= 0.5, confidence: clamped };
}

export async function analyzeImageWithWasm(
  file: File,
  modelName?: string
): Promise<AnalysisResult> {
  try {
    if (shouldUseApiOnly()) {
      const apiResult = await analyzeImageWithApi(file, modelName);
      console.info("WASM detector: API-only mode score", { score: apiResult.score });
      return apiResult;
    }
    if (isHeicLike(file)) {
      console.info("WASM detector: HEIC/HEIF detected, using API fallback", {
        name: file.name,
        type: file.type,
      });
      return await analyzeImageWithApi(file, modelName);
    }
    console.info("WASM detector: analyzing file", {
      name: file.name,
      size: file.size,
      type: file.type,
      model: modelName || MODEL_NAME,
    });
    const decoded = await decodeImageToRgba(file);
    const result = await detectAI(decoded.pixels, decoded.width, decoded.height, 4, modelName);
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    // Run full pipeline analysis in browser
    console.info("WASM detector: running forensic pipeline");
    const pipeline = await analyzeImagePipelineBrowser(
      decoded.pixels,
      decoded.width,
      decoded.height,
      result.confidence,
      modelName,
      fileBytes
    );

    const score = scoreFromConfidence(pipeline.verdict.confidence);
    console.info("WASM detector: analysis complete", {
      score,
      mlScore: result.confidence,
      finalConfidence: pipeline.verdict.confidence,
      uncertainty: pipeline.verdict.uncertainty,
    });

    return { score, pipeline, presentation: getVerdictPresentation(pipeline.verdict.verdict) };
  } catch (error) {
    const details = formatWasmError(error);
    console.error("WASM detector: error", details);
    try {
      console.warn("WASM detector: falling back to API", {
        model: MODEL_NAME,
      });
      const apiResult = await analyzeImageWithApi(file, modelName);
      console.info("WASM detector: API fallback score", { score: apiResult.score });
      return apiResult;
    } catch (fallbackError) {
      const fallbackDetails = formatWasmError(fallbackError);
      console.error("WASM detector: API fallback failed", fallbackDetails);
      throw new Error(`WASM detection failed: ${details}`);
    }
  }
}

export async function detectAIFromEncoded(
  bytes: Uint8Array,
  modelName?: string
): Promise<DetectionResult> {
  const safeBytes = new Uint8Array(bytes);
  const blob = new Blob([safeBytes]);
  const decoded = await decodeImageToRgba(blob);
  return detectAI(decoded.pixels, decoded.width, decoded.height, 4, modelName);
}

import { env } from "@/src/lib/env";

function shouldUseApiOnly(): boolean {
  if (typeof window === "undefined") return true;
  // Allow URL override
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("useApi")) {
      return params.get("useApi") !== "0";
    }
  } catch {
    // ignore
  }
  
  return env.USE_API_ONLY;
}

function isHeicLike(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

async function analyzeImageWithApi(file: File, modelName?: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (modelName) {
    formData.append("model", modelName);
  }
  const response = await fetch("/api/detect", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  const data = await response.json();
  return {
    score: data.score,
    pipeline: {
      hashes: data.hashes,
      visual: data.modules.visual,
      metadata: data.modules.metadata,
      physics: data.modules.physics,
      frequency: data.modules.frequency,
      ml: data.modules.ml,
      provenance: data.modules.provenance,
      fusion: data.modules.fusion,
      verdict: {
        verdict: data.verdict,
        confidence: data.confidence,
        uncertainty: data.uncertainty || 0,
        explanations: data.explanations,
      },
    },
    presentation: data.presentation ?? getVerdictPresentation(data.verdict),
  };
}

export async function decodeImageToRgba(
  file: Blob
): Promise<{ pixels: Uint8Array; width: number; height: number }> {
  if (typeof createImageBitmap === "undefined") {
    throw new Error("Image decoding is not available in this browser");
  }

  console.debug("WASM detector: decoding image");
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;

  if (width * height > MAX_PIXELS) {
    bitmap.close();
    throw new Error("Image is too large");
  }

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Unable to decode image");
    }
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    bitmap.close();
    return {
      pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
      width,
      height,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Unable to decode image");
  }
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, width, height).data;
  bitmap.close();
  return {
    pixels: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width,
    height,
  };
}

function formatWasmError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  if (typeof error === "string" || typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(record)) {
      data[key] = record[key];
    }
    try {
      return JSON.stringify(data);
    } catch {
      return "[object]";
    }
  }
  return "Unknown error";
}

async function fetchModelBuffer(modelPath: string): Promise<ArrayBuffer> {
  const response = await fetch(modelPath);
  if (!response.ok) {
    if (response.status === 403) {
      dispatchToast({
        title: "Access Forbidden",
        description: `Unable to load the AI model (403 Forbidden). Please check your network or contact support. URL: ${modelPath}`,
        variant: "error",
      });
    } else {
      dispatchToast({
        title: "Model Loading Error",
        description: `Failed to load AI model: ${response.status} ${response.statusText}`,
        variant: "error",
      });
    }
    throw new Error(`Failed to fetch model: ${response.status} ${modelPath}`);
  }
  const buffer = await response.arrayBuffer();
  console.info("WASM detector: model fetched", {
    modelPath,
    bytes: buffer.byteLength,
  });
  return buffer;
}

async function resolveExternalData(
  modelPath: string
): Promise<ort.InferenceSession.SessionOptions["externalData"] | undefined> {
  const dataPath = `${modelPath}.data`;
  try {
    const response = await fetch(dataPath, { method: "HEAD" });
    if (response.ok) {
      return buildExternalData(modelPath, dataPath);
    }
    if (response.status === 404) {
      return undefined;
    }
  } catch {
    // Fall through to range check.
  }

  try {
    const response = await fetch(dataPath, { headers: { Range: "bytes=0-0" } });
    if (!response.ok) {
      return undefined;
    }
    return buildExternalData(modelPath, dataPath);
  } catch {
    return undefined;
  }
}

function buildExternalData(
  modelPath: string,
  dataPath: string
): ort.InferenceSession.SessionOptions["externalData"] {
  const fileName = dataPath.split("/").pop() ?? dataPath;
  const isRemoteUrl = modelPath.startsWith("http");
  return [{ path: fileName, data: isRemoteUrl ? dataPath : dataPath }];
}

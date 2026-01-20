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
  console.debug("Node detector: output tensor", output);
  
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

export async function detectAIFromBuffer(
  buffer: Buffer,
  modelName?: string,
  fileName?: string
): Promise<DetectionResult> {
  const session = await getSession(modelName);
  const image = sharp(buffer, { failOn: "none" })
    .ensureAlpha()
    .resize(session.width, session.height, { fit: "fill" });
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  console.debug("Node detector: decoded image", {
    width: info.width,
    height: info.height,
    channels: info.channels,
  });
  if (!Number.isFinite(info.width) || !Number.isFinite(info.height)) {
    throw new Error("Invalid image dimensions");
  }

  const { config } = resolveModelConfig(modelName);
  const tensor = buildInputTensor(
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    info.width,
    info.height,
    info.channels,
    session.width,
    session.height,
    session.layout
  );

  const startTime = performance.now();
  const results = await session.session.run({ [session.inputName]: tensor });
  const inferenceTimeMs = performance.now() - startTime;

  const output = results[session.outputName];
  if (!output) {
    throw new Error("Model output missing");
  }

  // Get raw output for logging
  const rawData = output.data as Float32Array | number[];
  const rawValues = Array.from(rawData).map((v) => Number(v));

  // Calculate probabilities for logging
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

  const confidence = probabilityFromOutput(output, config.aiIndex);
  const clamped = Math.min(1, Math.max(0, confidence));
  const score = Math.round(clamped * 100);

  // Always log model output to console for debugging
  console.log("=== MODEL INFERENCE ===");
  console.log("File:", fileName || "unknown");
  console.log("Model:", session.model);
  console.log("AI Index:", config.aiIndex);
  console.log("Raw Output:", rawValues);
  console.log("Probabilities:", probabilities);
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
        originalWidth: info.width,
        originalHeight: info.height,
        channels: info.channels,
        targetWidth: session.width,
        targetHeight: session.height,
        layout: session.layout,
        tensorShape: tensor.dims as number[],
        tensorData: tensor.data as Float32Array,
      },
      {
        rawValues,
        probabilities,
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

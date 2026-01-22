/**
 * AI Detection Model Benchmark Tool
 *
 * Evaluates multiple ONNX models against a test dataset to help choose the best model for production.
 *
 * Usage:
 *   npx tsx benchmark/benchmark.ts
 *   npx tsx benchmark/benchmark.ts --models model_q4.onnx,nyuad.onnx
 *   npx tsx benchmark/benchmark.ts --threshold 60
 *   npx tsx benchmark/benchmark.ts --verbose  # Enable detailed logging
 *   npx tsx benchmark/benchmark.ts --show-misses  # Show misclassified image paths
 */

import fs from "node:fs";
import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";

// ============================================================================
// Types
// ============================================================================

type ImageResult = {
  file: string;
  expected: "real" | "fake";
  predicted: "real" | "fake";
  score: number;
  timeMs: number;
  correct: boolean;
};

type ConfusionMatrix = {
  truePositive: number;  // Correctly identified as fake (AI)
  trueNegative: number;  // Correctly identified as real
  falsePositive: number; // Real image incorrectly flagged as fake
  falseNegative: number; // Fake image incorrectly flagged as real
};

type ModelResult = {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgInferenceMs: number;
  confusion: ConfusionMatrix;
  perImageResults: ImageResult[];
};

type BenchmarkOutput = {
  timestamp: string;
  threshold: number;
  testSet: {
    realCount: number;
    fakeCount: number;
    totalImages: number;
  };
  models: ModelResult[];
  ranking: string[];
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

// ============================================================================
// Constants
// ============================================================================

const BENCHMARK_DIR = path.join(process.cwd(), "benchmark");
const TEST_ASSETS_DIR = path.join(BENCHMARK_DIR, "test-assets");
const RESULTS_DIR = path.join(BENCHMARK_DIR, "results");
const LOGS_DIR = path.join(BENCHMARK_DIR, "logs");
const MODELS_DIR = path.join(process.cwd(), "public", "models", "onnx");

const DEFAULT_SIZE = 224;
const MAX_PIXELS = 4096 * 4096;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

// Model-specific AI index configuration (which output index represents AI)
const MODEL_AI_INDEX: Record<string, number> = {
  // 2-class models: [AI, Real] - AI at index 0
  "sdxl-detector.onnx": 0,
  "model.onnx": 0,

  // 2-class models: [Real, AI] - AI at index 1
  "model_q4.onnx": 1,

  // 3-class models: [class0, AI, class2] - AI at index 1
  "nyuad.onnx": 1,
  "smogy.onnx": 1,
};

// Models to skip (embedding models, not classifiers)
const SKIP_MODELS: string[] = [
  "e5-small-lora-ai.onnx", // Embedding model with 768 outputs, not a classifier
];

// Default AI index for unconfigured models
const DEFAULT_AI_INDEX = 0;

// ============================================================================
// Logger Class
// ============================================================================

type InferenceLogEntry = {
  timestamp: string;
  model: string;
  file: string;
  input: {
    originalWidth: number;
    originalHeight: number;
    channels: number;
    targetWidth: number;
    targetHeight: number;
    layout: "NCHW" | "NHWC";
    tensorShape: number[];
    // Sample of normalized pixel values (first 10 values)
    tensorSample: number[];
  };
  output: {
    rawValues: number[];
    probabilities: number[];
    aiIndex: number;
    confidence: number;
    score: number;
  };
  inferenceTimeMs: number;
};

class BenchmarkLogger {
  private logFile: string;
  private stream: fs.WriteStream | null = null;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.logFile = path.join(LOGS_DIR, `benchmark-log-${timestamp}.jsonl`);
  }

  init() {
    if (!this.enabled) return;

    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    this.stream = fs.createWriteStream(this.logFile, { flags: "a" });
    console.log(`Detailed logging enabled: ${this.logFile}\n`);
  }

  log(entry: InferenceLogEntry) {
    if (!this.enabled || !this.stream) return;
    this.stream.write(JSON.stringify(entry) + "\n");
  }

  close() {
    if (this.stream) {
      this.stream.end();
    }
  }

  getLogFile(): string | null {
    return this.enabled ? this.logFile : null;
  }
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): {
  models: string[];
  threshold: number;
  verbose: boolean;
  showMisses: boolean;
} {
  const args = process.argv.slice(2);
  let models: string[] = [];
  let threshold = 50;
  let verbose = false;
  let showMisses = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--models" && args[i + 1]) {
      models = args[i + 1].split(",").map((m) => m.trim());
      i++;
    } else if (args[i] === "--threshold" && args[i + 1]) {
      threshold = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      verbose = true;
    } else if (args[i] === "--show-misses") {
      showMisses = true;
    }
  }

  return { models, threshold, verbose, showMisses };
}

// ============================================================================
// File Discovery
// ============================================================================

function discoverModels(specificModels: string[]): string[] {
  if (specificModels.length > 0) {
    // Verify specified models exist
    return specificModels.filter((model) => {
      const modelPath = path.join(MODELS_DIR, model);
      if (!fs.existsSync(modelPath)) {
        console.warn(`Warning: Model not found: ${model}`);
        return false;
      }
      return true;
    });
  }

  // Auto-discover all .onnx files (exclude .data files and skip models)
  const files = fs.readdirSync(MODELS_DIR);
  return files.filter(
    (f) =>
      f.endsWith(".onnx") &&
      !f.endsWith(".onnx.data") &&
      !SKIP_MODELS.includes(f)
  );
}

function discoverTestImages(): { real: string[]; fake: string[] } {
  const realDir = path.join(TEST_ASSETS_DIR, "real");
  const fakeDir = path.join(TEST_ASSETS_DIR, "fake");

  const getImages = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map((f) => path.join(dir, f));
  };

  return {
    real: getImages(realDir),
    fake: getImages(fakeDir),
  };
}

// ============================================================================
// ONNX Model Loading & Inference (adapted from nodeDetector.ts)
// ============================================================================

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

async function loadModel(modelName: string): Promise<SessionState> {
  const modelPath = path.join(MODELS_DIR, modelName);

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

  return { session, inputName, outputName, layout, width, height };
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

type InferenceResult = {
  score: number;
  timeMs: number;
  logEntry: Omit<InferenceLogEntry, "timestamp" | "model" | "file">;
};

async function runInference(
  session: SessionState,
  imagePath: string,
  aiIndex: number
): Promise<InferenceResult> {
  const buffer = fs.readFileSync(imagePath);
  const image = sharp(buffer, { failOn: "none" }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  if (info.width * info.height > MAX_PIXELS) {
    throw new Error("Image dimensions out of range");
  }

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
  const endTime = performance.now();
  const inferenceTimeMs = endTime - startTime;

  const output = results[session.outputName];
  if (!output) {
    throw new Error("Model output missing");
  }

  // Get raw output values
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
      const softmaxProbs = softmax(rawValues);
      probabilities = Array.from(softmaxProbs);
    }
  }

  const confidence = probabilities.length > 1 ? probabilities[aiIndex] : probabilities[0];
  const score = Math.round(Math.min(1, Math.max(0, confidence)) * 100);

  // Get tensor sample (first 10 values)
  const tensorData = tensor.data as Float32Array;
  const tensorSample = Array.from(tensorData.slice(0, 10)).map((v) => Number(v.toFixed(6)));

  return {
    score,
    timeMs: inferenceTimeMs,
    logEntry: {
      input: {
        originalWidth: info.width,
        originalHeight: info.height,
        channels: info.channels,
        targetWidth: session.width,
        targetHeight: session.height,
        layout: session.layout,
        tensorShape: tensor.dims as number[],
        tensorSample,
      },
      output: {
        rawValues: rawValues.map((v) => Number(v.toFixed(6))),
        probabilities: probabilities.map((v) => Number(v.toFixed(6))),
        aiIndex,
        confidence: Number(confidence.toFixed(6)),
        score,
      },
      inferenceTimeMs: Number(inferenceTimeMs.toFixed(2)),
    },
  };
}

// ============================================================================
// Metrics Calculation
// ============================================================================

function calculateMetrics(
  results: ImageResult[],
  threshold: number
): Omit<ModelResult, "name" | "perImageResults"> {
  const confusion: ConfusionMatrix = {
    truePositive: 0,
    trueNegative: 0,
    falsePositive: 0,
    falseNegative: 0,
  };

  let totalTime = 0;

  for (const r of results) {
    totalTime += r.timeMs;
    const predictedFake = r.score >= threshold;
    const actualFake = r.expected === "fake";

    if (predictedFake && actualFake) {
      confusion.truePositive++;
    } else if (!predictedFake && !actualFake) {
      confusion.trueNegative++;
    } else if (predictedFake && !actualFake) {
      confusion.falsePositive++;
    } else {
      confusion.falseNegative++;
    }
  }

  const total = results.length;
  const correct = confusion.truePositive + confusion.trueNegative;
  const accuracy = total > 0 ? correct / total : 0;

  const precision =
    confusion.truePositive + confusion.falsePositive > 0
      ? confusion.truePositive / (confusion.truePositive + confusion.falsePositive)
      : 0;

  const recall =
    confusion.truePositive + confusion.falseNegative > 0
      ? confusion.truePositive / (confusion.truePositive + confusion.falseNegative)
      : 0;

  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const avgInferenceMs = total > 0 ? totalTime / total : 0;

  return { accuracy, precision, recall, f1Score, avgInferenceMs, confusion };
}

// ============================================================================
// Console Output Helpers
// ============================================================================

function printHeader(realCount: number, fakeCount: number, threshold: number) {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    AI DETECTION BENCHMARK                     ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║ Test Set: ${realCount} real + ${fakeCount} fake = ${realCount + fakeCount} images`.padEnd(63) + "║");
  console.log(`║ Threshold: ${threshold}%`.padEnd(63) + "║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
}

function printProgress(current: number, total: number, width = 40) {
  const percent = current / total;
  const filled = Math.round(width * percent);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  // Skip progress bar during build
  if (typeof process !== 'undefined' && process.stdout && 'write' in process.stdout) {
    (process.stdout as any).write(`\rProgress: [${bar}] ${current}/${total}`);
  }
  if (current === total) {
    console.log("");
  }
}

function printModelResults(result: ModelResult) {
  console.log(`\nResults for ${result.name}:`);
  console.log(`  Accuracy:    ${(result.accuracy * 100).toFixed(1)}%`);
  console.log(`  Precision:   ${(result.precision * 100).toFixed(1)}%`);
  console.log(`  Recall:      ${(result.recall * 100).toFixed(1)}%`);
  console.log(`  F1 Score:    ${(result.f1Score * 100).toFixed(1)}%`);
  console.log(`  Avg Time:    ${result.avgInferenceMs.toFixed(0)}ms`);
  console.log("");
  console.log("  Confusion Matrix:");
  console.log("                 Predicted");
  console.log("              │  Real  │  Fake");
  console.log("  ────────────┼────────┼────────");
  console.log(
    `  Actual Real │ ${result.confusion.trueNegative.toString().padStart(5)}  │ ${result.confusion.falsePositive.toString().padStart(5)}`
  );
  console.log(
    `  Actual Fake │ ${result.confusion.falseNegative.toString().padStart(5)}  │ ${result.confusion.truePositive.toString().padStart(5)}`
  );
}

function printMisclassified(result: ModelResult) {
  const misses = result.perImageResults.filter((r) => !r.correct);
  console.log("");
  console.log("  Misclassified images:");
  if (misses.length === 0) {
    console.log("  - None");
    return;
  }

  for (const miss of misses) {
    console.log(
      `  - ${miss.file} (expected ${miss.expected}, predicted ${miss.predicted}, score ${miss.score}%)`
    );
  }
}

function printFinalRanking(models: ModelResult[]) {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                        FINAL RANKING");
  console.log("═══════════════════════════════════════════════════════════════");

  const sorted = [...models].sort((a, b) => b.f1Score - a.f1Score);

  sorted.forEach((m, i) => {
    const rank = `#${i + 1}`;
    const name = m.name.padEnd(20);
    const f1 = `F1: ${(m.f1Score * 100).toFixed(1)}%`;
    const acc = `Accuracy: ${(m.accuracy * 100).toFixed(1)}%`;
    const time = `Avg: ${m.avgInferenceMs.toFixed(0)}ms`;
    console.log(`  ${rank}  ${name} ${f1}  ${acc}  ${time}`);
  });

  console.log("");
}

// ============================================================================
// Main Benchmark Function
// ============================================================================

async function runBenchmark() {
  const { models: specifiedModels, threshold, verbose, showMisses } = parseArgs();

  // Initialize logger
  const logger = new BenchmarkLogger(verbose);
  logger.init();

  // Discover models
  const models = discoverModels(specifiedModels);
  if (models.length === 0) {
    console.error("No models found in", MODELS_DIR);
    process.exit(1);
  }

  // Discover test images
  const testImages = discoverTestImages();
  const realCount = testImages.real.length;
  const fakeCount = testImages.fake.length;
  const totalImages = realCount + fakeCount;

  if (totalImages === 0) {
    console.error("No test images found.");
    console.error(`Add images to:`);
    console.error(`  - ${path.join(TEST_ASSETS_DIR, "real")} (real photos)`);
    console.error(`  - ${path.join(TEST_ASSETS_DIR, "fake")} (AI-generated images)`);
    process.exit(1);
  }

  printHeader(realCount, fakeCount, threshold);
  console.log(`Models to test: ${models.join(", ")}\n`);

  const allResults: ModelResult[] = [];

  for (const modelName of models) {
    console.log(`Testing model: ${modelName}`);
    console.log("━".repeat(63));

    let session: SessionState;
    try {
      session = await loadModel(modelName);
    } catch (err) {
      console.error(`  Failed to load model: ${err}`);
      continue;
    }

    const aiIndex = MODEL_AI_INDEX[modelName] ?? DEFAULT_AI_INDEX;
    const imageResults: ImageResult[] = [];
    let processed = 0;

    // Process real images
    for (const imagePath of testImages.real) {
      try {
        const { score, timeMs, logEntry } = await runInference(session, imagePath, aiIndex);
        const predicted = score >= threshold ? "fake" : "real";
        const relPath = path.relative(TEST_ASSETS_DIR, imagePath);
        imageResults.push({
          file: relPath,
          expected: "real",
          predicted,
          score,
          timeMs,
          correct: predicted === "real",
        });
        // Log detailed inference data
        logger.log({
          timestamp: new Date().toISOString(),
          model: modelName,
          file: relPath,
          ...logEntry,
        });
      } catch (err) {
        console.error(`\n  Error processing ${imagePath}: ${err}`);
      }
      processed++;
      printProgress(processed, totalImages);
    }

    // Process fake images
    for (const imagePath of testImages.fake) {
      try {
        const { score, timeMs, logEntry } = await runInference(session, imagePath, aiIndex);
        const predicted = score >= threshold ? "fake" : "real";
        const relPath = path.relative(TEST_ASSETS_DIR, imagePath);
        imageResults.push({
          file: relPath,
          expected: "fake",
          predicted,
          score,
          timeMs,
          correct: predicted === "fake",
        });
        // Log detailed inference data
        logger.log({
          timestamp: new Date().toISOString(),
          model: modelName,
          file: relPath,
          ...logEntry,
        });
      } catch (err) {
        console.error(`\n  Error processing ${imagePath}: ${err}`);
      }
      processed++;
      printProgress(processed, totalImages);
    }

    // Calculate metrics
    const metrics = calculateMetrics(imageResults, threshold);
    const modelResult: ModelResult = {
      name: modelName,
      ...metrics,
      perImageResults: imageResults,
    };

    allResults.push(modelResult);
    printModelResults(modelResult);
    if (showMisses) {
      printMisclassified(modelResult);
    }
  }

  // Final ranking
  printFinalRanking(allResults);

  // Save results to JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);

  const output: BenchmarkOutput = {
    timestamp: new Date().toISOString(),
    threshold,
    testSet: {
      realCount,
      fakeCount,
      totalImages,
    },
    models: allResults,
    ranking: [...allResults].sort((a, b) => b.f1Score - a.f1Score).map((m) => m.name),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Results saved to: ${outputPath}`);

  // Close logger and output log file path
  logger.close();
  const logFile = logger.getLogFile();
  if (logFile) {
    console.log(`Detailed logs saved to: ${logFile}`);
  }
}

// ============================================================================
// Entry Point
// ============================================================================

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

/**
 * Inference Logger
 *
 * Logs detailed model input/output data for debugging and analysis.
 * Server-side logging writes to files, client-side logs to console/localStorage.
 */

import fs from "node:fs";
import path from "node:path";

export type InferenceLogEntry = {
  timestamp: string;
  source: "node" | "wasm" | "api";
  model: string;
  fileName?: string;
  input: {
    originalWidth: number;
    originalHeight: number;
    channels: number;
    targetWidth: number;
    targetHeight: number;
    layout: "NCHW" | "NHWC";
    tensorShape: number[];
    tensorSample: number[]; // First 10 normalized values
  };
  output: {
    rawValues: number[];
    probabilities?: number[];
    aiIndex: number;
    confidence: number;
    score: number;
  };
  inferenceTimeMs: number;
};

const LOGS_DIR = path.join(process.cwd(), "logs", "inference");
const LOG_ENABLED = process.env.INFERENCE_LOG_ENABLED === "true";

let logStream: fs.WriteStream | null = null;
let currentLogFile: string | null = null;

function ensureLogDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogStream(): fs.WriteStream {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const logFile = path.join(LOGS_DIR, `inference-${today}.jsonl`);

  // Create new stream if date changed or not initialized
  if (currentLogFile !== logFile) {
    if (logStream) {
      logStream.end();
    }
    ensureLogDir();
    logStream = fs.createWriteStream(logFile, { flags: "a" });
    currentLogFile = logFile;
  }

  return logStream!;
}

export function logInference(entry: InferenceLogEntry): void {
  if (!LOG_ENABLED) return;

  try {
    const stream = getLogStream();
    stream.write(JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("Failed to write inference log:", err);
  }
}

export function createLogEntry(
  source: "node" | "wasm" | "api",
  model: string,
  fileName: string | undefined,
  inputInfo: {
    originalWidth: number;
    originalHeight: number;
    channels: number;
    targetWidth: number;
    targetHeight: number;
    layout: "NCHW" | "NHWC";
    tensorShape: number[];
    tensorData: Float32Array;
  },
  outputInfo: {
    rawValues: number[];
    probabilities?: number[];
    aiIndex: number;
    confidence: number;
    score: number;
  },
  inferenceTimeMs: number
): InferenceLogEntry {
  return {
    timestamp: new Date().toISOString(),
    source,
    model,
    fileName,
    input: {
      originalWidth: inputInfo.originalWidth,
      originalHeight: inputInfo.originalHeight,
      channels: inputInfo.channels,
      targetWidth: inputInfo.targetWidth,
      targetHeight: inputInfo.targetHeight,
      layout: inputInfo.layout,
      tensorShape: inputInfo.tensorShape,
      tensorSample: Array.from(inputInfo.tensorData.slice(0, 10)).map((v) =>
        Number(v.toFixed(6))
      ),
    },
    output: {
      rawValues: outputInfo.rawValues.map((v) => Number(v.toFixed(6))),
      probabilities: outputInfo.probabilities?.map((v) => Number(v.toFixed(6))),
      aiIndex: outputInfo.aiIndex,
      confidence: Number(outputInfo.confidence.toFixed(6)),
      score: outputInfo.score,
    },
    inferenceTimeMs: Number(inferenceTimeMs.toFixed(2)),
  };
}

export function isLoggingEnabled(): boolean {
  return LOG_ENABLED;
}

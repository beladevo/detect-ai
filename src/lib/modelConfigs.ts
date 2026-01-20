export type ModelConfig = {
  aiIndex: number;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // 2-class models: [AI, Real] - AI at index 0
  "sdxl-detector.onnx": { aiIndex: 0 },
  "model.onnx": { aiIndex: 0 },

  // 2-class models: [Real, AI] - AI at index 1
  "model_q4.onnx": { aiIndex: 1 },

  // 3-class models: [class0, AI, class2] - AI at index 1
  "nyuad.onnx": { aiIndex: 1 },
  "smogy.onnx": { aiIndex: 1 },
};

// Centralized model name from environment variable
export const MODEL_NAME = process.env.NEXT_PUBLIC_MODEL_NAME || "model_q4.onnx";

// Centralized blob base URL
export const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "";

// Get full model path (local or remote)
export function getModelPath(): string {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return `/models/onnx/${MODEL_NAME}`;
  }

  return BLOB_BASE_URL
    ? `${BLOB_BASE_URL}/models/onnx/${MODEL_NAME}`
    : `/models/onnx/${MODEL_NAME}`;
}

export function resolveModelConfig(modelName?: string): {
  name: string;
  config: ModelConfig;
} {
  const normalized = modelName?.trim();
  const name = normalized && normalized.length > 0 ? normalized : MODEL_NAME;
  return {
    name,
    config: MODEL_CONFIGS[name] ?? { aiIndex: 1 },
  };
}

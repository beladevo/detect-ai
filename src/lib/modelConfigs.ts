export type ModelConfig = {
  aiIndex: number;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  "model_q4.onnx": { aiIndex: 0 },
};

// Centralized model name from environment variable
export const MODEL_NAME = process.env.NEXT_PUBLIC_MODEL_NAME || "model_q4.onnx";

// Centralized blob base URL
export const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "";

// Get full model path (local or remote)
export function getModelPath(): string {
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

import { getConfiguredModelName, getModelAiIndex, resolveModelName } from "@/src/lib/models";

export type ModelConfig = {
  aiIndex: number;
};

// Centralized model name from environment variable
export const MODEL_NAME = getConfiguredModelName();

// Centralized blob base URL
export const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL || "";

// Get full model path (local or remote)
export function getModelPath(): string {
  return getModelPathFor(MODEL_NAME);
}

export function resolveModelConfig(modelName?: string): {
  name: string;
  config: ModelConfig;
} {
  const name = resolveModelName(modelName);
  return {
    name,
    config: { aiIndex: getModelAiIndex(name) },
  };
}

export function getModelPathFor(modelName?: string): string {
  const { name } = resolveModelConfig(modelName);
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return `/models/onnx/${name}`;
  }

  return BLOB_BASE_URL
    ? `${BLOB_BASE_URL}/models/onnx/${name}`
    : `/models/onnx/${name}`;
}

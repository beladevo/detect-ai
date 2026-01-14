export type ModelConfig = {
  aiIndex: number;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  "model.onnx": { aiIndex: 0 },
};

export function resolveModelConfig(modelName?: string): {
  name: string;
  config: ModelConfig;
} {
  const normalized = modelName?.trim();
  const name = normalized && normalized.length > 0 ? normalized : "model.onnx";
  return {
    name,
    config: MODEL_CONFIGS[name] ?? { aiIndex: 1 },
  };
}

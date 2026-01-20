/**
 * Runtime model selection and ensemble configuration
 */

export type EnsemblePreset = "fast" | "balanced" | "thorough";

export const ENSEMBLE_CONFIGURATIONS: Record<EnsemblePreset, string[]> = {
  fast: ["model_q4.onnx"],
  balanced: ["model_q4.onnx", "model.onnx"],
  thorough: ["model_q4.onnx", "model.onnx", "nyuad.onnx"],
};

/**
 * Get the current model configuration from environment or default
 */
export function getCurrentModelConfig(): {
  models: string[];
  isEnsemble: boolean;
} {
  // Check if ensemble is configured via environment variable
  const envModels = process.env.AI_ENSEMBLE_MODELS;

  if (envModels) {
    const models = envModels
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    return {
      models,
      isEnsemble: models.length > 1,
    };
  }

  // Default to fast preset (single model)
  const defaultPreset = (process.env.AI_ENSEMBLE_PRESET as EnsemblePreset) ?? "fast";
  const models = ENSEMBLE_CONFIGURATIONS[defaultPreset] ?? ENSEMBLE_CONFIGURATIONS.fast;

  return {
    models,
    isEnsemble: models.length > 1,
  };
}

/**
 * Format model list for environment variable
 */
export function formatModelsForEnv(models: string[]): string {
  return models.join(",");
}

/**
 * Get recommended ensemble based on use case
 */
export function getRecommendedEnsemble(useCase: "speed" | "accuracy" | "balanced"): string[] {
  switch (useCase) {
    case "speed":
      return ENSEMBLE_CONFIGURATIONS.fast;
    case "accuracy":
      return ENSEMBLE_CONFIGURATIONS.thorough;
    case "balanced":
    default:
      return ENSEMBLE_CONFIGURATIONS.balanced;
  }
}

/**
 * Validate model names
 */
export function validateModelNames(models: string[]): { valid: boolean; errors: string[] } {
  const validModels = [
    "model.onnx",
    "model_q4.onnx",
    "nyuad.onnx",
    "smogy.onnx",
    "sdxl-detector.onnx",
  ];

  const errors: string[] = [];

  for (const model of models) {
    if (!validModels.includes(model)) {
      errors.push(`Unknown model: ${model}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

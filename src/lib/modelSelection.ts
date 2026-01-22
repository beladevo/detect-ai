/**
 * Runtime model selection and ensemble configuration
 */

import { ENSEMBLE_CONFIGURATIONS, EnsemblePreset, getKnownModelNames } from "@/src/lib/models";

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
  const validModels = new Set(getKnownModelNames());

  const errors: string[] = [];

  for (const model of models) {
    if (!validModels.has(model)) {
      errors.push(`Unknown model: ${model}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

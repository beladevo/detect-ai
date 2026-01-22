export type ModelSpeed = "fast" | "medium" | "slow";
export type ModelAccuracy = "high" | "medium";

export type ModelDefinition = {
  name: string;
  displayName: string;
  description: string;
  speed: ModelSpeed;
  accuracy: ModelAccuracy;
  aiIndex: number;
  selectable?: boolean;
  requiresPremium?: boolean;
};

export const DEFAULT_MODEL_NAME = "model.onnx";

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    name: "model_q4.onnx",
    displayName: "Fast Model (Q4)",
    description: "Quantized model - best for quick analysis",
    speed: "fast",
    accuracy: "high",
    aiIndex: 1,
    requiresPremium: true,
  },
  {
    name: "model.onnx",
    displayName: "Standard Model",
    description: "Full precision - balanced speed and accuracy",
    speed: "medium",
    accuracy: "high",
    aiIndex: 0,
  },
  {
    name: "nyuad.onnx",
    displayName: "NYUAD Model",
    description: "Specialized academic model",
    speed: "medium",
    accuracy: "high",
    aiIndex: 1,
  },
  {
    name: "smogy.onnx",
    displayName: "Smogy Model",
    description: "Alternative detection approach",
    speed: "medium",
    accuracy: "medium",
    aiIndex: 1,
  },
  {
    name: "sdxl-detector.onnx",
    displayName: "SDXL Detector",
    description: "Specialized SDXL detection model",
    speed: "slow",
    accuracy: "high",
    aiIndex: 0,
    selectable: false,
  },
];

const MODEL_REGISTRY = MODEL_CATALOG.reduce<Record<string, ModelDefinition>>((acc, model) => {
  acc[model.name] = model;
  return acc;
}, {});

export function getConfiguredModelName(): string {
  const envName = process.env.NEXT_PUBLIC_MODEL_NAME;
  const trimmed = envName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_MODEL_NAME;
}

export function resolveModelName(modelName?: string): string {
  const normalized = modelName?.trim();
  return normalized && normalized.length > 0 ? normalized : getConfiguredModelName();
}

export function getModelByName(modelName: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[modelName];
}

export function getModelAiIndex(modelName: string): number {
  return MODEL_REGISTRY[modelName]?.aiIndex ?? 1;
}

export function getSelectableModels(): ModelDefinition[] {
  return MODEL_CATALOG.filter((model) => model.selectable !== false);
}

export function getKnownModelNames(): string[] {
  return MODEL_CATALOG.map((model) => model.name);
}

export type EnsemblePreset = "fast" | "balanced" | "thorough";

export type EnsemblePresetDefinition = {
  name: EnsemblePreset;
  displayName: string;
  models: string[];
  description: string;
};

export const ENSEMBLE_PRESETS: EnsemblePresetDefinition[] = [
  {
    name: "fast",
    displayName: "Fast (Single Model)",
    models: ["model_q4.onnx"],
    description: "Quickest analysis with good accuracy",
  },
  {
    name: "balanced",
    displayName: "Balanced (2 Models)",
    models: ["model_q4.onnx", "model.onnx"],
    description: "Good balance of speed and accuracy",
  },
  {
    name: "thorough",
    displayName: "Thorough (3 Models)",
    models: ["model_q4.onnx", "model.onnx", "nyuad.onnx"],
    description: "Most accurate but slower",
  },
];

export const ENSEMBLE_CONFIGURATIONS = ENSEMBLE_PRESETS.reduce<Record<EnsemblePreset, string[]>>(
  (acc, preset) => {
    acc[preset.name] = preset.models;
    return acc;
  },
  {
    fast: [],
    balanced: [],
    thorough: [],
  }
);

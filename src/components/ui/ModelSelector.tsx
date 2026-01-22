"use client";

import React from "react";
import { Brain, Check } from "lucide-react";

type ModelInfo = {
  name: string;
  displayName: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  accuracy: "high" | "medium";
};

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: "model_q4.onnx",
    displayName: "Fast Model (Q4)",
    description: "Quantized model - best for quick analysis",
    speed: "fast",
    accuracy: "high",
  },
  {
    name: "model.onnx",
    displayName: "Standard Model",
    description: "Full precision - balanced speed and accuracy",
    speed: "medium",
    accuracy: "high",
  },
  {
    name: "nyuad.onnx",
    displayName: "NYUAD Model",
    description: "Specialized academic model",
    speed: "medium",
    accuracy: "high",
  },
  {
    name: "smogy.onnx",
    displayName: "Smogy Model",
    description: "Alternative detection approach",
    speed: "medium",
    accuracy: "medium",
  },
];

const ENSEMBLE_PRESETS = [
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

interface ModelSelectorProps {
  currentModel?: string;
  onModelChange?: (model: string) => void;
  variant?: "single" | "ensemble";
}

export default function ModelSelector({
  currentModel = "model_q4.onnx",
  onModelChange,
  variant = "single",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState("fast");

  const handleSelectModel = (modelName: string) => {
    onModelChange?.(modelName);
    setIsOpen(false);
  };

  const handleSelectPreset = (presetName: string) => {
    const preset = ENSEMBLE_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setSelectedPreset(presetName);
      onModelChange?.(preset.models.join(","));
      setIsOpen(false);
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "fast":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "slow":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (variant === "ensemble") {
    const activePreset =
      ENSEMBLE_PRESETS.find((p) => p.name === selectedPreset) ?? ENSEMBLE_PRESETS[0];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-all hover:border-white/30 hover:bg-white/10"
        >
          <Brain className="h-4 w-4" />
          <span>{activePreset.displayName}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-white/20 bg-gray-900 shadow-xl">
              <div className="border-b border-white/10 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-200">Model Ensemble</h3>
                <p className="text-xs text-gray-500">
                  Multiple models for better accuracy
                </p>
              </div>

              {ENSEMBLE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset.name)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <div className="mt-0.5">
                    {selectedPreset === preset.name ? (
                      <Check className="h-4 w-4 text-blue-400" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">{preset.displayName}</div>
                    <div className="text-xs text-gray-500">{preset.description}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {preset.models.map((model) => (
                        <span
                          key={model}
                          className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400"
                        >
                          {model.replace(".onnx", "")}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.name === currentModel) ?? AVAILABLE_MODELS[0];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-gray-200 transition-all hover:border-white/30 hover:bg-white/10"
      >
        <Brain className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{activeModel.displayName}</span>
        <span className="sm:hidden">{activeModel.name.replace('.onnx', '')}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-white/20 bg-gray-900 shadow-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-200">Select Model</h3>
              <p className="text-xs text-gray-500">Choose detection model</p>
            </div>

            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.name}
                onClick={() => handleSelectModel(model.name)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                <div className="mt-0.5">
                  {currentModel === model.name ? (
                    <Check className="h-4 w-4 text-blue-400" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-200">{model.displayName}</div>
                  <div className="text-xs text-gray-500">{model.description}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className={getSpeedColor(model.speed)}>
                      Speed: {model.speed}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-purple-400">
                      Accuracy: {model.accuracy}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Brain, Check, Lock } from "lucide-react";
import {
  DEFAULT_MODEL_NAME,
  ENSEMBLE_PRESETS,
  EnsemblePreset,
  getModelByName,
  getSelectableModels,
} from "@/src/lib/models";
import { useAuth } from "@/src/context/AuthContext";

interface ModelSelectorProps {
  currentModel?: string;
  onModelChange?: (model: string) => void;
  variant?: "single" | "ensemble";
}

export default function ModelSelector({
  currentModel = DEFAULT_MODEL_NAME,
  onModelChange,
  variant = "single",
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectableModels = getSelectableModels();
  const fallbackModel = {
    name: currentModel,
    displayName: currentModel,
    description: "Custom model",
    speed: "medium",
    accuracy: "high",
  };
  const availableModels = selectableModels.length > 0 ? selectableModels : [fallbackModel];
  const defaultPreset: EnsemblePreset = ENSEMBLE_PRESETS[0]?.name ?? "fast";
  const [selectedPreset, setSelectedPreset] = React.useState<EnsemblePreset>(
    defaultPreset,
  );
  const { user } = useAuth();
  const premiumEnabled =
    process.env.NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED === "true" ||
    user?.tier === "PREMIUM" ||
    user?.tier === "ENTERPRISE";

  const isModelLocked = React.useCallback(
    (modelName: string) => {
      const model = getModelByName(modelName);
      return Boolean(model?.requiresPremium && !premiumEnabled);
    },
    [premiumEnabled],
  );

  React.useEffect(() => {
    if (isModelLocked(currentModel)) {
      onModelChange?.(DEFAULT_MODEL_NAME);
    }
  }, [currentModel, isModelLocked, onModelChange]);

  const handleSelectModel = (modelName: string) => {
    onModelChange?.(modelName);
    setIsOpen(false);
  };

  const handleSelectPreset = (presetName: EnsemblePreset) => {
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
          className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-2 text-sm font-semibold text-foreground/80 transition-all hover:bg-card/60"
        >
          <Brain className="h-4 w-4" />
          <span>{activePreset.displayName}</span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-panel shadow-xl backdrop-blur">
              <div className="border-b border-border/60 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Model Ensemble</h3>
                <p className="text-xs text-foreground/50">
                  Multiple models for better accuracy
                </p>
              </div>

              {ENSEMBLE_PRESETS.map((preset) => {
                const isLocked = preset.models.some((model) => isModelLocked(model));
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      if (isLocked) return;
                      handleSelectPreset(preset.name);
                    }}
                    aria-disabled={isLocked}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card/40 ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="mt-0.5">
                      {selectedPreset === preset.name ? (
                        <Check className="h-4 w-4 text-brand-cyan" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        {preset.displayName}
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-brand-pink">
                            <Lock className="h-3 w-3" />
                            Premium
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-foreground/50">{preset.description}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {preset.models.map((model) => (
                          <span
                            key={model}
                            className="rounded bg-brand-cyan/10 px-1.5 py-0.5 text-[10px] text-brand-cyan"
                          >
                            {model.replace(".onnx", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const activeModel = getModelByName(currentModel) ?? availableModels[0];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card/40 px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition-all hover:bg-card/60"
      >
        <Brain className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{activeModel.displayName}</span>
        <span className="sm:hidden">{activeModel.name.replace('.onnx', '')}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-panel shadow-xl backdrop-blur">
            <div className="border-b border-border/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Select Model</h3>
              <p className="text-xs text-foreground/50">Choose detection model</p>
            </div>

            {availableModels.map((model) => {
              const isLocked = isModelLocked(model.name);
              return (
                <button
                  key={model.name}
                  onClick={() => {
                    if (isLocked) return;
                    handleSelectModel(model.name);
                  }}
                  aria-disabled={isLocked}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card/40 ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="mt-0.5">
                    {currentModel === model.name ? (
                      <Check className="h-4 w-4 text-brand-cyan" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {model.displayName}
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-brand-pink">
                          <Lock className="h-3 w-3" />
                          Premium
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-foreground/50">{model.description}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className={getSpeedColor(model.speed)}>
                        Speed: {model.speed}
                      </span>
                      <span className="text-foreground/30">|</span>
                      <span className="text-brand-purple">
                        Accuracy: {model.accuracy}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

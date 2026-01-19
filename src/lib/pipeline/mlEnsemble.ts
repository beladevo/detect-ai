import { detectAIFromBuffer } from "@/src/lib/nodeDetector";
import { MlEnsembleResult } from "@/src/lib/pipeline/types";
import { MODEL_NAME } from "@/src/lib/modelConfigs";

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function resolveModelList(): string[] {
  const env = process.env.AI_ENSEMBLE_MODELS;
  if (env) {
    return env
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }
  return [MODEL_NAME];
}

export async function runMlEnsemble(
  buffer: Buffer,
  fileName?: string
): Promise<MlEnsembleResult> {
  const models = resolveModelList();
  const votes = await Promise.all(
    models.map(async (model) => {
      const result = await detectAIFromBuffer(buffer, model, fileName);
      return { model: result.model, confidence: result.confidence };
    })
  );

  const avg = votes.reduce((acc, v) => acc + v.confidence, 0) / Math.max(1, votes.length);
  const variance =
    votes.reduce((acc, v) => acc + (v.confidence - avg) ** 2, 0) /
    Math.max(1, votes.length);
  const spread = Math.sqrt(variance);
  const confidence = clamp01(avg);
  const flags: string[] = [];
  if (votes.length === 1) {
    flags.push("single_model");
  }
  if (spread > 0.25) {
    flags.push("model_disagreement");
  }

  return {
    ml_score: confidence,
    model_votes: votes,
    flags,
  };
}

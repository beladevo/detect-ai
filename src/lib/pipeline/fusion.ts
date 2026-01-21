import {
  FusionResult,
  MetadataForensicsResult,
  MlEnsembleResult,
  PhysicsConsistencyResult,
  ProvenanceResult,
  VisualArtifactsResult,
  FrequencyForensicsResult,
  StandardizedImage,
} from "@/src/lib/pipeline/types";

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function fuseEvidence(input: {
  image: StandardizedImage;
  visual: VisualArtifactsResult;
  metadata: MetadataForensicsResult;
  physics: PhysicsConsistencyResult;
  frequency: FrequencyForensicsResult;
  ml: MlEnsembleResult;
  provenance: ProvenanceResult;
}): FusionResult {
  const { image, visual, metadata, physics, frequency, ml, provenance } = input;
  const weights = {
    visual: 0.12,
    metadata: 0.08,
    physics: 0.15,
    frequency: 0.2,
    ml: 0.45,
  };

  if (!metadata.exif_present) {
    weights.metadata *= 0.5;
  }

  if (ml.flags.includes("single_model")) {
    weights.ml *= 0.95;
  }

  if (image.width < 256 || image.height < 256) {
    weights.visual *= 0.7;
    weights.physics *= 0.7;
    weights.frequency *= 0.7;
  }

  const weightSum =
    weights.visual + weights.metadata + weights.physics + weights.frequency + weights.ml;
  const normalized = {
    visual: weights.visual / weightSum,
    metadata: weights.metadata / weightSum,
    physics: weights.physics / weightSum,
    frequency: weights.frequency / weightSum,
    ml: weights.ml / weightSum,
  };

  const weighted =
    normalized.visual * visual.visual_artifacts_score +
    normalized.metadata * metadata.metadata_score +
    normalized.physics * physics.physics_score +
    normalized.frequency * frequency.frequency_score +
    normalized.ml * ml.ml_score;

  const scores = [
    visual.visual_artifacts_score,
    metadata.metadata_score,
    physics.physics_score,
    frequency.frequency_score,
    ml.ml_score,
  ];
  const mean = scores.reduce((acc, v) => acc + v, 0) / scores.length;
  const variance =
    scores.reduce((acc, v) => acc + (v - mean) ** 2, 0) / scores.length;
  const spread = Math.sqrt(variance);

  const mlDiff = Math.abs(ml.ml_score - mean);
  const mlConfident = mlDiff < 0.2;
  const contradictionPenalty = mlConfident
    ? clamp01(spread * 0.4)
    : clamp01(spread * 0.5);

  let confidence = 0.5 + (weighted - 0.5) * (1 - contradictionPenalty);

  if (provenance.c2pa_present && provenance.signature_valid) {
    confidence = Math.max(0, confidence - 0.2);
  }

  // Calculate uncertainty as standard deviation
  // Higher module disagreement = higher uncertainty
  const uncertainty = Math.min(spread * 0.5, 0.15); // Cap at ±15%

  // Calculate weighted scores (weight * score)
  const weighted_scores = {
    visual: normalized.visual * visual.visual_artifacts_score,
    metadata: normalized.metadata * metadata.metadata_score,
    physics: normalized.physics * physics.physics_score,
    frequency: normalized.frequency * frequency.frequency_score,
    ml: normalized.ml * ml.ml_score,
  };

  return {
    confidence: clamp01(confidence),
    weights: normalized,
    raw_weights: weights,
    contradiction_penalty: contradictionPenalty,
    uncertainty,
    weighted_scores,
    module_scores: {
      visual: visual.visual_artifacts_score,
      metadata: metadata.metadata_score,
      physics: physics.physics_score,
      frequency: frequency.frequency_score,
      ml: ml.ml_score,
    },
  };
}

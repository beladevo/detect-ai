export type StandardizedImage = {
  width: number;
  height: number;
  rgb: Uint8Array;
  gray: Float32Array;
  resized: {
    width: number;
    height: number;
    rgb: Uint8Array;
    gray: Float32Array;
  };
  hashes: {
    sha256: string;
    phash: string;
  };
  metadata: {
    format?: string;
    exif?: Buffer;
    icc?: Buffer;
  };
};

export type VisualArtifactsResult = {
  visual_artifacts_score: number;
  flags: string[];
  details: Record<string, number>;
};

export type MetadataForensicsResult = {
  metadata_score: number;
  exif_present: boolean;
  flags: string[];
  tags: Record<string, string | number | boolean>;
};

export type PhysicsConsistencyResult = {
  physics_score: number;
  flags: string[];
  details: Record<string, number>;
};

export type FrequencyForensicsResult = {
  frequency_score: number;
  flags: string[];
  details: Record<string, number>;
};

export type MlEnsembleResult = {
  ml_score: number;
  model_votes: Array<{ model: string; confidence: number }>;
  flags: string[];
};

export type ProvenanceResult = {
  provenance_score: number;
  c2pa_present: boolean;
  signature_valid: boolean;
  flags: string[];
  details: Record<string, string | boolean>;
};

export type FusionResult = {
  confidence: number;
  weights: Record<string, number>;
  contradiction_penalty: number;
  uncertainty: number; // Standard deviation of module scores (for ± display)
  module_scores: Record<string, number>; // Individual module scores for breakdown
};

export type VerdictResult = {
  verdict: "AI_GENERATED" | "LIKELY_AI" | "UNCERTAIN" | "LIKELY_REAL" | "REAL";
  confidence: number;
  uncertainty: number; // ± uncertainty value (e.g., 0.06 for ±6%)
  explanations: string[];
};

export type PipelineResult = {
  hashes: StandardizedImage["hashes"];
  visual: VisualArtifactsResult;
  metadata: MetadataForensicsResult;
  physics: PhysicsConsistencyResult;
  frequency: FrequencyForensicsResult;
  ml: MlEnsembleResult;
  provenance: ProvenanceResult;
  fusion: FusionResult;
  verdict: VerdictResult;
};

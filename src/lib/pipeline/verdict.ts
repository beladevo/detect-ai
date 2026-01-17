import {
  FrequencyForensicsResult,
  MetadataForensicsResult,
  MlEnsembleResult,
  PhysicsConsistencyResult,
  VerdictResult,
  VisualArtifactsResult,
  ProvenanceResult,
} from "@/src/lib/pipeline/types";

export function buildVerdict(input: {
  confidence: number;
  visual: VisualArtifactsResult;
  metadata: MetadataForensicsResult;
  physics: PhysicsConsistencyResult;
  frequency: FrequencyForensicsResult;
  ml: MlEnsembleResult;
  provenance: ProvenanceResult;
}): VerdictResult {
  const { confidence, visual, metadata, physics, frequency, ml, provenance } = input;

  let verdict: VerdictResult["verdict"] = "UNCERTAIN";
  if (confidence >= 0.85) verdict = "AI_GENERATED";
  else if (confidence >= 0.7) verdict = "LIKELY_AI";
  else if (confidence <= 0.15) verdict = "REAL";
  else if (confidence <= 0.3) verdict = "LIKELY_REAL";

  const explanations = new Set<string>();
  for (const flag of visual.flags) explanations.add(`visual:${flag}`);
  for (const flag of metadata.flags) explanations.add(`metadata:${flag}`);
  for (const flag of physics.flags) explanations.add(`physics:${flag}`);
  for (const flag of frequency.flags) explanations.add(`frequency:${flag}`);
  for (const flag of ml.flags) explanations.add(`ml:${flag}`);
  for (const flag of provenance.flags) explanations.add(`provenance:${flag}`);

  if (confidence >= 0.7) {
    explanations.add("final:strong_ai_signals");
  } else if (confidence <= 0.3) {
    explanations.add("final:strong_real_signals");
  } else {
    explanations.add("final:conflicting_signals");
  }

  return {
    verdict,
    confidence,
    explanations: Array.from(explanations),
  };
}

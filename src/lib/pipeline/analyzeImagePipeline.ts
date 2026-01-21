import { preprocessImage } from "@/src/lib/pipeline/preprocess";
import { analyzeVisualArtifacts } from "@/src/lib/pipeline/visualArtifacts";
import { analyzeMetadata } from "@/src/lib/pipeline/metadataForensics";
import { analyzePhysicsConsistency } from "@/src/lib/pipeline/physicsConsistency";
import { analyzeFrequencyForensics } from "@/src/lib/pipeline/frequencyForensics";
import { runMlEnsemble } from "@/src/lib/pipeline/mlEnsemble";
import { analyzeProvenance } from "@/src/lib/pipeline/provenance";
import { fuseEvidence } from "@/src/lib/pipeline/fusion";
import { buildVerdict } from "@/src/lib/pipeline/verdict";
import { PipelineResult } from "@/src/lib/pipeline/types";

import { env } from "@/src/lib/env";

export async function analyzeImagePipeline(
  buffer: Buffer,
  fileName?: string
): Promise<PipelineResult> {
  const randomized = process.env.AI_RANDOMIZE_PREPROCESS === "true";
  const standardized = await preprocessImage(buffer, { randomize: randomized });

  const visual = env.PIPELINE_VISUAL_ENABLED
    ? analyzeVisualArtifacts(standardized)
    : { visual_artifacts_score: 0, flags: [], details: {}, disabled: true };

  const metadata = env.PIPELINE_METADATA_ENABLED
    ? analyzeMetadata(standardized.metadata.exif)
    : { metadata_score: 0, exif_present: false, flags: [], tags: {}, disabled: true };

  const physics = env.PIPELINE_PHYSICS_ENABLED
    ? analyzePhysicsConsistency(standardized)
    : { physics_score: 0, flags: [], details: {}, disabled: true };

  const frequency = env.PIPELINE_FREQUENCY_ENABLED
    ? analyzeFrequencyForensics(standardized)
    : { frequency_score: 0, flags: [], details: {}, disabled: true };

  const ml = env.PIPELINE_ML_ENABLED
    ? await runMlEnsemble(buffer, fileName)
    : { ml_score: 0, model_votes: [], flags: [], disabled: true };

  const provenance = env.PIPELINE_PROVENANCE_ENABLED
    ? analyzeProvenance(buffer)
    : { provenance_score: 0, c2pa_present: false, signature_valid: false, flags: [], details: {}, disabled: true };

  const fusion = fuseEvidence({
    image: standardized,
    visual,
    metadata,
    physics,
    frequency,
    ml,
    provenance,
  });

  const verdict = buildVerdict({
    confidence: fusion.confidence,
    uncertainty: fusion.uncertainty,
    visual,
    metadata,
    physics,
    frequency,
    ml,
    provenance,
  });

  return {
    hashes: standardized.hashes,
    visual,
    metadata,
    physics,
    frequency,
    ml,
    provenance,
    fusion,
    verdict,
  };
}

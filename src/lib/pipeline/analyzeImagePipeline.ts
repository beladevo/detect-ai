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

export async function analyzeImagePipeline(buffer: Buffer): Promise<PipelineResult> {
  const randomized = process.env.AI_RANDOMIZE_PREPROCESS === "true";
  const standardized = await preprocessImage(buffer, { randomize: randomized });
  const visual = analyzeVisualArtifacts(standardized);
  const metadata = analyzeMetadata(standardized.metadata.exif);
  const physics = analyzePhysicsConsistency(standardized);
  const frequency = analyzeFrequencyForensics(standardized);
  const ml = await runMlEnsemble(buffer);
  const provenance = analyzeProvenance(buffer);
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

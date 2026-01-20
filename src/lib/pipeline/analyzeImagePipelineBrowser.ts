/**
 * Browser-compatible image analysis pipeline
 * This is a simplified version that works with already-decoded image data
 */

import { analyzeVisualArtifacts } from "@/src/lib/pipeline/visualArtifacts";
import { analyzeMetadata } from "@/src/lib/pipeline/metadataForensics";
import { analyzePhysicsConsistency } from "@/src/lib/pipeline/physicsConsistency";
import { analyzeFrequencyForensics } from "@/src/lib/pipeline/frequencyForensics";
import { analyzeProvenance } from "@/src/lib/pipeline/provenance";
import { fuseEvidence } from "@/src/lib/pipeline/fusion";
import { buildVerdict } from "@/src/lib/pipeline/verdict";
import type {
  PipelineResult,
  StandardizedImage,
  MlEnsembleResult,
} from "@/src/lib/pipeline/types";

/**
 * Create a standardized image object from browser-decoded RGBA data
 */
function createStandardizedImage(
  pixels: Uint8Array,
  width: number,
  height: number,
  mlConfidence: number
): StandardizedImage {
  // Convert RGBA to RGB
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = pixels[i * 4];
    rgb[i * 3 + 1] = pixels[i * 4 + 1];
    rgb[i * 3 + 2] = pixels[i * 4 + 2];
  }

  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4] / 255;
    const g = pixels[i * 4 + 1] / 255;
    const b = pixels[i * 4 + 2] / 255;
    // ITU-R BT.709 luma coefficients
    gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Create resized version (256x256 for analysis)
  const targetSize = 256;
  const scaleX = width / targetSize;
  const scaleY = height / targetSize;
  const resizedRgb = new Uint8Array(targetSize * targetSize * 3);
  const resizedGray = new Float32Array(targetSize * targetSize);

  for (let y = 0; y < targetSize; y++) {
    const srcY = Math.min(height - 1, Math.floor((y + 0.5) * scaleY));
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.min(width - 1, Math.floor((x + 0.5) * scaleX));
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * targetSize + x) * 3;
      const dstGrayIdx = y * targetSize + x;

      resizedRgb[dstIdx] = pixels[srcIdx];
      resizedRgb[dstIdx + 1] = pixels[srcIdx + 1];
      resizedRgb[dstIdx + 2] = pixels[srcIdx + 2];

      const r = pixels[srcIdx] / 255;
      const g = pixels[srcIdx + 1] / 255;
      const b = pixels[srcIdx + 2] / 255;
      resizedGray[dstGrayIdx] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }

  // Simple hash computation (SHA256 would require crypto library)
  const computeSimpleHash = (data: Uint8Array): string => {
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      hash = ((hash << 5) - hash + data[i]) | 0;
    }
    return `browser_${hash.toString(16)}`;
  };

  return {
    width,
    height,
    rgb,
    gray,
    resized: {
      width: targetSize,
      height: targetSize,
      rgb: resizedRgb,
      gray: resizedGray,
    },
    hashes: {
      sha256: computeSimpleHash(rgb),
      phash: computeSimpleHash(resizedRgb),
    },
    metadata: {
      format: "browser-decoded",
    },
  };
}

/**
 * Analyze image in browser using WASM ML model + forensic checks
 */
export async function analyzeImagePipelineBrowser(
  pixels: Uint8Array,
  width: number,
  height: number,
  mlConfidence: number,
  modelName?: string
): Promise<PipelineResult> {
  // Create standardized image from browser-decoded data
  const standardized = createStandardizedImage(pixels, width, height, mlConfidence);

  // Run forensic modules (no async needed for these)
  const visual = analyzeVisualArtifacts(standardized);
  const metadata = analyzeMetadata(undefined); // No EXIF in browser mode
  const physics = analyzePhysicsConsistency(standardized);
  const frequency = analyzeFrequencyForensics(standardized);

  // Create ML ensemble result from WASM inference
  const ml: MlEnsembleResult = {
    ml_score: mlConfidence,
    model_votes: [
      {
        model: modelName || "browser-wasm",
        confidence: mlConfidence,
        prediction: mlConfidence >= 0.5 ? "AI" : "REAL",
      },
    ],
    flags: ["single_model"],
  };

  // Provenance check (basic buffer check, no actual file)
  const provenance = {
    provenance_score: 0,
    c2pa_present: false,
    signature_valid: false,
    flags: [] as string[],
    details: {},
  };

  // Fuse evidence
  const fusion = fuseEvidence({
    image: standardized,
    visual,
    metadata,
    physics,
    frequency,
    ml,
    provenance,
  });

  // Build verdict
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

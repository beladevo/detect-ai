import { ProvenanceResult } from "@/src/lib/pipeline/types";

const C2PA_MARKERS = [
  "c2pa",
  "contentcredentials",
  "contentcredentials.org",
  "urn:c2pa",
];

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function bufferIncludes(buffer: Uint8Array, needle: string): boolean {
  const needleBytes = new TextEncoder().encode(needle);
  if (needleBytes.length === 0) return true;
  for (let i = 0; i <= buffer.length - needleBytes.length; i += 1) {
    let match = true;
    for (let j = 0; j < needleBytes.length; j += 1) {
      if (buffer[i + j] !== needleBytes[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export function analyzeProvenance(buffer: Uint8Array): ProvenanceResult {
  const flags: string[] = [];
  let c2paPresent = false;

  for (const marker of C2PA_MARKERS) {
    if (bufferIncludes(buffer, marker)) {
      c2paPresent = true;
      break;
    }
  }

  if (c2paPresent) {
    flags.push("c2pa_marker_present");
  }

  return {
    provenance_score: clamp01(c2paPresent ? 0.1 : 0),
    c2pa_present: c2paPresent,
    signature_valid: false,
    flags,
    details: {
      c2paPresent,
      signatureValid: false,
    },
  };
}

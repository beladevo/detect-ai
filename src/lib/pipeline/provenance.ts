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

function bufferIncludes(buffer: Buffer, needle: string): boolean {
  const idx = buffer.indexOf(needle, 0, "utf8");
  return idx !== -1;
}

export function analyzeProvenance(buffer: Buffer): ProvenanceResult {
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

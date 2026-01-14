export function scoreFromConfidence(confidence: number): number {
  if (!Number.isFinite(confidence)) return 0;
  if (confidence >= 1) return 100;
  if (confidence <= 0) return 0;
  return Math.floor(confidence * 100);
}

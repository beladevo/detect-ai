import type { VerdictResult } from "@/src/lib/pipeline/types";

export type UiVerdict = "ai" | "real" | "uncertain";

export function uiVerdictFromPipeline(verdict?: VerdictResult["verdict"]): UiVerdict {
  if (!verdict) return "uncertain";
  if (verdict === "AI_GENERATED" || verdict === "LIKELY_AI") return "ai";
  if (verdict === "REAL" || verdict === "LIKELY_REAL") return "real";
  return "uncertain";
}

export function uiVerdictFromScore(score?: number | null): UiVerdict | undefined {
  if (score === null || score === undefined) return undefined;
  if (score >= 70) return "ai";
  if (score <= 20) return "real";
  return "uncertain";
}

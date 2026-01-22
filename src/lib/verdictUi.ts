import type { VerdictResult } from "@/src/lib/pipeline/types";

export type UiVerdict = "ai" | "real" | "uncertain";

export type VerdictPresentation = {
  uiVerdict: UiVerdict;
  label: string;
  title: string;
  message: string;
};

const presentationByVerdict: Record<VerdictResult["verdict"], VerdictPresentation> = {
  AI_GENERATED: {
    uiVerdict: "ai",
    label: "AI-GENERATED",
    title: "AI-Generated Detected",
    message: "Detected signatures consistent with AI-generated imagery.",
  },
  LIKELY_AI: {
    uiVerdict: "ai",
    label: "LIKELY AI",
    title: "Likely AI-Generated",
    message: "Signals lean toward AI generation, but not definitive.",
  },
  UNCERTAIN: {
    uiVerdict: "uncertain",
    label: "INCONCLUSIVE",
    title: "Inconclusive Result",
    message: "The result is inconclusive. Consider a secondary check.",
  },
  LIKELY_REAL: {
    uiVerdict: "real",
    label: "LIKELY REAL",
    title: "Likely Authentic Image",
    message: "Signals suggest an authentic image, but not definitive.",
  },
  REAL: {
    uiVerdict: "real",
    label: "AUTHENTIC",
    title: "Authentic Image",
    message: "The system identifies the image as authentic.",
  },
};

const presentationByUiVerdict: Record<UiVerdict, VerdictPresentation> = {
  ai: presentationByVerdict.AI_GENERATED,
  real: presentationByVerdict.REAL,
  uncertain: presentationByVerdict.UNCERTAIN,
};

export function uiVerdictFromPipeline(verdict?: VerdictResult["verdict"]): UiVerdict {
  if (!verdict) return "uncertain";
  return presentationByVerdict[verdict].uiVerdict;
}

export function uiVerdictFromScore(score?: number | null): UiVerdict | undefined {
  if (score === null || score === undefined) return undefined;
  if (score >= 70) return "ai";
  if (score <= 20) return "real";
  return "uncertain";
}

export function getVerdictPresentation(verdict?: VerdictResult["verdict"]): VerdictPresentation {
  if (!verdict) return presentationByUiVerdict.uncertain;
  return presentationByVerdict[verdict] ?? presentationByUiVerdict.uncertain;
}

export function getVerdictPresentationFromScore(score?: number | null): VerdictPresentation | undefined {
  const uiVerdict = uiVerdictFromScore(score);
  if (!uiVerdict) return undefined;
  return presentationByUiVerdict[uiVerdict];
}

/**
 * Export detection results to JSON or generate PDF report data
 */

import type { PipelineResult } from "@/src/lib/pipeline/types";
import { getExplanations } from "@/src/lib/explanations";

export type ExportData = {
  timestamp: string;
  image: {
    name?: string;
    hashes: {
      sha256: string;
      phash: string;
    };
  };
  verdict: {
    classification: string;
    confidence: number;
    uncertainty: number;
    confidenceRange: {
      lower: number;
      upper: number;
    };
  };
  modules: {
    visual: {
      score: number;
      weight: number;
      contribution: number;
      flags: string[];
    };
    metadata: {
      score: number;
      weight: number;
      contribution: number;
      exifPresent: boolean;
      flags: string[];
    };
    physics: {
      score: number;
      weight: number;
      contribution: number;
      flags: string[];
    };
    frequency: {
      score: number;
      weight: number;
      contribution: number;
      flags: string[];
    };
    ml: {
      score: number;
      weight: number;
      contribution: number;
      modelVotes: Array<{ model: string; confidence: number; prediction: string }>;
      flags: string[];
    };
  };
  explanations: Array<{
    flag: string;
    title: string;
    description: string;
    severity: string;
  }>;
  metadata: {
    contradictionPenalty: number;
    uncertainty: number;
  };
};

/**
 * Convert pipeline result to exportable data structure
 */
export function prepareExportData(
  pipeline: PipelineResult,
  fileName?: string
): ExportData {
  const uncertaintyPercent = pipeline.verdict.uncertainty;
  const confidencePercent = pipeline.verdict.confidence * 100;

  const explanations = getExplanations(pipeline.verdict.explanations);

  return {
    timestamp: new Date().toISOString(),
    image: {
      name: fileName,
      hashes: pipeline.hashes,
    },
    verdict: {
      classification: pipeline.verdict.verdict,
      confidence: pipeline.verdict.confidence,
      uncertainty: pipeline.verdict.uncertainty,
      confidenceRange: {
        lower: Math.max(0, confidencePercent - uncertaintyPercent * 100),
        upper: Math.min(100, confidencePercent + uncertaintyPercent * 100),
      },
    },
    modules: {
      visual: {
        score: pipeline.visual.visual_artifacts_score,
        weight: pipeline.fusion.weights.visual,
        contribution: pipeline.fusion.weighted_scores.visual,
        flags: pipeline.visual.flags,
      },
      metadata: {
        score: pipeline.metadata.metadata_score,
        weight: pipeline.fusion.weights.metadata,
        contribution: pipeline.fusion.weighted_scores.metadata,
        exifPresent: pipeline.metadata.exif_present,
        flags: pipeline.metadata.flags,
      },
      physics: {
        score: pipeline.physics.physics_score,
        weight: pipeline.fusion.weights.physics,
        contribution: pipeline.fusion.weighted_scores.physics,
        flags: pipeline.physics.flags,
      },
      frequency: {
        score: pipeline.frequency.frequency_score,
        weight: pipeline.fusion.weights.frequency,
        contribution: pipeline.fusion.weighted_scores.frequency,
        flags: pipeline.frequency.flags,
      },
      ml: {
        score: pipeline.ml.ml_score,
        weight: pipeline.fusion.weights.ml,
        contribution: pipeline.fusion.weighted_scores.ml,
        modelVotes: pipeline.ml.model_votes,
        flags: pipeline.ml.flags,
      },
    },
    explanations: explanations.map((exp) => ({
      flag: exp.flag,
      title: exp.title,
      description: exp.description,
      severity: exp.severity,
    })),
    metadata: {
      contradictionPenalty: pipeline.fusion.contradiction_penalty,
      uncertainty: pipeline.fusion.uncertainty,
    },
  };
}

/**
 * Export as JSON file
 */
export function exportAsJSON(data: ExportData, fileName?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `imagion-report-${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate text report for simple export
 */
export function generateTextReport(data: ExportData): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("IMAGION AI DETECTION REPORT");
  lines.push("=".repeat(60));
  lines.push("");

  lines.push(`Generated: ${new Date(data.timestamp).toLocaleString()}`);
  if (data.image.name) {
    lines.push(`Image: ${data.image.name}`);
  }
  lines.push(`SHA256: ${data.image.hashes.sha256}`);
  lines.push("");

  lines.push("VERDICT");
  lines.push("-".repeat(60));
  lines.push(`Classification: ${data.verdict.classification.replace(/_/g, " ")}`);
  lines.push(
    `Confidence: ${(data.verdict.confidence * 100).toFixed(1)}% ± ${(data.verdict.uncertainty * 100).toFixed(1)}%`
  );
  lines.push(
    `Range: ${data.verdict.confidenceRange.lower.toFixed(1)}% - ${data.verdict.confidenceRange.upper.toFixed(1)}%`
  );
  lines.push("");

  lines.push("MODULE BREAKDOWN");
  lines.push("-".repeat(60));

  const modules = [
    { name: "ML Detection", data: data.modules.ml },
    { name: "Frequency Analysis", data: data.modules.frequency },
    { name: "Physics Consistency", data: data.modules.physics },
    { name: "Visual Artifacts", data: data.modules.visual },
    { name: "Metadata Forensics", data: data.modules.metadata },
  ];

  for (const module of modules) {
    lines.push(
      `${module.name}: ${(module.data.score * 100).toFixed(0)}% (weight: ${(module.data.weight * 100).toFixed(0)}%, contribution: ${(module.data.contribution * 100).toFixed(1)}%)`
    );
  }
  lines.push("");

  if (data.explanations.length > 0) {
    lines.push("FINDINGS");
    lines.push("-".repeat(60));

    const highSeverity = data.explanations.filter((e) => e.severity === "high");
    const mediumSeverity = data.explanations.filter((e) => e.severity === "medium");
    const lowSeverity = data.explanations.filter((e) => e.severity === "low");

    if (highSeverity.length > 0) {
      lines.push("HIGH SEVERITY:");
      for (const exp of highSeverity) {
        lines.push(`  • ${exp.title}`);
        lines.push(`    ${exp.description}`);
      }
      lines.push("");
    }

    if (mediumSeverity.length > 0) {
      lines.push("MEDIUM SEVERITY:");
      for (const exp of mediumSeverity) {
        lines.push(`  • ${exp.title}`);
        lines.push(`    ${exp.description}`);
      }
      lines.push("");
    }

    if (lowSeverity.length > 0) {
      lines.push("LOW SEVERITY:");
      for (const exp of lowSeverity) {
        lines.push(`  • ${exp.title}`);
      }
      lines.push("");
    }
  }

  lines.push("=".repeat(60));
  lines.push("Report generated by Imagion - AI Image Detection");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

/**
 * Export as text file
 */
export function exportAsText(data: ExportData, fileName?: string): void {
  const textReport = generateTextReport(data);
  const blob = new Blob([textReport], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `imagion-report-${new Date().getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

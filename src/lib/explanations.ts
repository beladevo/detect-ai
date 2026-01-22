/**
 * Human-readable explanations for forensic detection flags
 */

export type ExplanationInfo = {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
};

const VISUAL_EXPLANATIONS: Record<string, ExplanationInfo> = {
  skin_smoothing: {
    title: "Unnatural Skin Smoothing",
    description: "Detected overly smooth skin textures typical of AI-generated faces, lacking natural pores and imperfections.",
    severity: "high",
  },
  texture_melting: {
    title: "Texture Melting Artifacts",
    description: "Found areas where textures blend unnaturally, a common artifact in diffusion-based image generators.",
    severity: "high",
  },
  high_symmetry: {
    title: "Unusual Symmetry",
    description: "Detected unnaturally high bilateral symmetry, often seen in AI-generated portraits.",
    severity: "medium",
  },
  skin_noise_anomaly: {
    title: "Skin Noise Pattern",
    description: "Chrominance variance in skin regions differs from natural photography patterns.",
    severity: "medium",
  },
};

const METADATA_EXPLANATIONS: Record<string, ExplanationInfo> = {
  no_exif: {
    title: "Missing EXIF Data",
    description: "No camera metadata found. Real photos typically contain device and capture information.",
    severity: "medium",
  },
  ai_generator_signature: {
    title: "AI Generator Signature",
    description: "Detected software signature from a known AI image generator in the metadata.",
    severity: "high",
  },
  suspicious_software: {
    title: "Suspicious Software Tag",
    description: "The image's software tag indicates it may have been created or processed by AI tools.",
    severity: "medium",
  },
  missing_camera_details: {
    title: "No Camera Information",
    description: "Missing typical camera capture details like aperture, exposure, and ISO settings.",
    severity: "low",
  },
  invalid_timestamp: {
    title: "Invalid Timestamp",
    description: "The image timestamp is missing or contains an invalid date.",
    severity: "low",
  },
  generator_in_make_model: {
    title: "AI Generator in Camera Fields",
    description: "Camera make/model fields contain AI generator names (e.g., Midjourney, DALL-E, Stable Diffusion).",
    severity: "high",
  },
  incomplete_camera_metadata: {
    title: "Incomplete Camera Metadata",
    description: "Camera information present but missing critical capture details like ISO, aperture, or shutter speed.",
    severity: "medium",
  },
};

const PHYSICS_EXPLANATIONS: Record<string, ExplanationInfo> = {
  light_inconsistency: {
    title: "Lighting Inconsistency",
    description: "Light direction varies across the image in ways that are physically implausible.",
    severity: "high",
  },
  shadow_misalignment: {
    title: "Shadow Misalignment",
    description: "Shadows don't align with the apparent light sources in the scene.",
    severity: "high",
  },
  perspective_chaos: {
    title: "Perspective Issues",
    description: "Perspective cues in the image are inconsistent, suggesting synthetic generation.",
    severity: "medium",
  },
};

const FREQUENCY_EXPLANATIONS: Record<string, ExplanationInfo> = {
  high_frequency_anomaly: {
    title: "Frequency Spectrum Anomaly",
    description: "The image's frequency spectrum shows patterns typical of AI upscaling or generation.",
    severity: "high",
  },
  spectral_peak: {
    title: "Spectral Peak Detected",
    description: "Unusual peaks in the FFT analysis suggest synthetic image generation.",
    severity: "high",
  },
  dct_anomaly: {
    title: "DCT Block Anomaly",
    description: "DCT coefficient patterns indicate AI-specific compression artifacts.",
    severity: "medium",
  },
  laplacian_residual: {
    title: "Structured Noise Pattern",
    description: "Detected structured noise in the Laplacian residual, common in AI images.",
    severity: "medium",
  },
};

const ML_EXPLANATIONS: Record<string, ExplanationInfo> = {
  high_ai_confidence: {
    title: "High AI Probability",
    description: "The ML model detected strong AI generation signatures with high confidence.",
    severity: "high",
  },
  single_model: {
    title: "Single Model Analysis",
    description: "Analysis performed with a single model. Multi-model ensemble would provide higher confidence.",
    severity: "low",
  },
  model_disagreement: {
    title: "Model Disagreement",
    description: "Multiple models produced conflicting results, indicating a borderline case.",
    severity: "medium",
  },
};

const PROVENANCE_EXPLANATIONS: Record<string, ExplanationInfo> = {
  c2pa_present: {
    title: "C2PA Credentials Found",
    description: "Content Credentials (C2PA) digital signature detected in the image.",
    severity: "low",
  },
  c2pa_invalid: {
    title: "Invalid C2PA Signature",
    description: "C2PA signature present but could not be validated.",
    severity: "medium",
  },
};

const FINAL_EXPLANATIONS: Record<string, ExplanationInfo> = {
  strong_ai_signals: {
    title: "Strong AI Indicators",
    description: "Multiple forensic modules detected clear AI generation signatures.",
    severity: "high",
  },
  strong_real_signals: {
    title: "Authentic Image Indicators",
    description: "Forensic analysis suggests the image is authentic with natural characteristics.",
    severity: "low",
  },
  conflicting_signals: {
    title: "Mixed Signals",
    description: "Different analysis modules produced conflicting results. Manual review recommended.",
    severity: "medium",
  },
};

const ALL_EXPLANATIONS: Record<string, Record<string, ExplanationInfo>> = {
  visual: VISUAL_EXPLANATIONS,
  metadata: METADATA_EXPLANATIONS,
  physics: PHYSICS_EXPLANATIONS,
  frequency: FREQUENCY_EXPLANATIONS,
  ml: ML_EXPLANATIONS,
  provenance: PROVENANCE_EXPLANATIONS,
  final: FINAL_EXPLANATIONS,
};

/**
 * Get human-readable explanation for a flag
 * @param flag - Flag in format "module:flag_name" or just "flag_name"
 */
export function getExplanation(flag: string): ExplanationInfo | null {
  const parts = flag.split(":");
  if (parts.length === 2) {
    const [module, flagName] = parts;
    return ALL_EXPLANATIONS[module]?.[flagName] ?? null;
  }

  // Search all modules for the flag
  for (const moduleExplanations of Object.values(ALL_EXPLANATIONS)) {
    if (flag in moduleExplanations) {
      return moduleExplanations[flag];
    }
  }

  return null;
}

/**
 * Get all explanations for a list of flags, sorted by severity
 */
export function getExplanations(flags: string[]): Array<ExplanationInfo & { flag: string }> {
  const results: Array<ExplanationInfo & { flag: string }> = [];

  for (const flag of flags) {
    const explanation = getExplanation(flag);
    if (explanation) {
      results.push({ ...explanation, flag });
    }
  }

  // Sort by severity: high > medium > low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return results;
}

/**
 * Get module-specific color for display
 */
export function getModuleColor(module: string): string {
  const colors: Record<string, string> = {
    visual: "purple",
    metadata: "blue",
    physics: "pink",
    frequency: "cyan",
    ml: "orange",
    provenance: "green",
  };
  return colors[module] ?? "gray";
}

/**
 * Get human-readable module name
 */
export function getModuleName(module: string): string {
  const names: Record<string, string> = {
    visual: "Visual Analysis",
    metadata: "Metadata Forensics",
    physics: "Physics Consistency",
    frequency: "Frequency Analysis",
    ml: "ML Detection",
    provenance: "Provenance Check",
  };
  return names[module] ?? module;
}

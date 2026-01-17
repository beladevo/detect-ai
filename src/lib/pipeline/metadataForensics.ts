import exifReader from "exif-reader";
import { MetadataForensicsResult } from "@/src/lib/pipeline/types";

const KNOWN_GENERATORS = [
  "midjourney",
  "stable diffusion",
  "dall-e",
  "openai",
  "firefly",
  "comfyui",
  "automatic1111",
  "sdxl",
  "diffusion",
  "novelai",
];

const KNOWN_CAMERA_MAKES = [
  "canon",
  "nikon",
  "sony",
  "fujifilm",
  "panasonic",
  "olympus",
  "leica",
  "pentax",
  "apple",
  "samsung",
  "google",
  "huawei",
  "xiaomi",
  "oneplus",
];

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function normalizeText(value: unknown): string {
  if (!value) return "";
  return String(value).toLowerCase();
}

export function analyzeMetadata(exif?: Buffer): MetadataForensicsResult {
  const flags: string[] = [];
  const tags: Record<string, string | number | boolean> = {};
  let exifPresent = false;
  let score = 0.1;

  if (!exif) {
    flags.push("exif_missing");
    return {
      metadata_score: clamp01(score),
      exif_present: false,
      flags,
      tags,
    };
  }

  try {
    const data = exifReader(exif) as {
      Image?: Record<string, unknown>;
      Exif?: Record<string, unknown>;
    };
    exifPresent = true;
    const make = data.Image?.Make || data.Exif?.Make;
    const model = data.Image?.Model || data.Exif?.Model;
    const software = data.Image?.Software || data.Exif?.Software;
    const date = data.Exif?.DateTimeOriginal || data.Image?.DateTime;

    if (make) tags.make = String(make);
    if (model) tags.model = String(model);
    if (software) tags.software = String(software);
    if (date) tags.timestamp = String(date);

    const softwareText = normalizeText(software);
    if (KNOWN_GENERATORS.some((token) => softwareText.includes(token))) {
      score += 0.5;
      flags.push("software_generator_tag");
    }

    const makeText = normalizeText(make);
    if (makeText && !KNOWN_CAMERA_MAKES.some((token) => makeText.includes(token))) {
      score += 0.2;
      flags.push("unknown_camera_make");
    }

    if (!make && !model) {
      score += 0.1;
      flags.push("camera_make_model_missing");
    }

    if (date) {
      const parsed = new Date(String(date).replace(":", "-").replace(":", "-"));
      if (Number.isFinite(parsed.getTime())) {
        const now = Date.now();
        const delta = Math.abs(now - parsed.getTime());
        if (delta > 1000 * 60 * 60 * 24 * 365 * 20) {
          score += 0.1;
          flags.push("timestamp_out_of_range");
        }
        if (parsed.getTime() > now + 1000 * 60 * 60 * 24 * 2) {
          score += 0.2;
          flags.push("timestamp_future");
        }
      }
    }
  } catch (error) {
    score += 0.15;
    flags.push("exif_parse_error");
  }

  return {
    metadata_score: clamp01(score),
    exif_present: exifPresent,
    flags,
    tags,
  };
}

import ExifReader from "exifreader";
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
  "flux",
  "black forest labs",
  "mj v6",
  "midjourney v6",
  "imagen",
  "playground",
  "leonardo.ai",
  "civitai",
  "artbreeder",
  "craiyon",
  "bluewillow",
  "starryai",
  "dreamstudio",
  "runway",
  "pika",
  "gen-2",
  "gen-3",
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

const CAPTURE_DETAIL_TAGS = [
  "FNumber",
  "ExposureTime",
  "ISOSpeedRatings",
  "FocalLength",
  "ExposureProgram",
  "Whitebalance",
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
    const data = ExifReader.load(exif);
    exifPresent = true;

    // Configurable access to common tags
    const getTag = (key: string) => {
      const tag = data[key];
      if (tag && tag.description) return tag.description;
      if (tag && tag.value) return String(tag.value);
      return undefined;
    };

    const make = getTag("Make");
    const model = getTag("Model");
    const software = getTag("Software");
    const date = getTag("DateTimeOriginal") || getTag("DateTime");

    if (make) tags.make = make;
    if (model) tags.model = model;
    if (software) tags.software = software;
    if (date) tags.timestamp = date;

    const softwareText = normalizeText(software);
    if (KNOWN_GENERATORS.some((token) => softwareText.includes(token))) {
      score += 0.6;
      flags.push("software_generator_tag");
    }

    const makeText = normalizeText(make);
    const modelText = normalizeText(model);

    const hasMake = Boolean(makeText && KNOWN_CAMERA_MAKES.some((token) => makeText.includes(token)));

    if (KNOWN_GENERATORS.some((token) => makeText.includes(token) || modelText.includes(token))) {
      score += 0.5;
      flags.push("generator_in_make_model");
    }

    if (makeText && !hasMake) {
      score += 0.25;
      flags.push("unknown_camera_make");
    }

    if (!make && !model) {
      score += 0.15;
      flags.push("camera_make_model_missing");
    }

    // Deep Validation: Check for capture-specific details if a Make is present
    if (hasMake) {
      let captureDetailCount = 0;
      for (const tag of CAPTURE_DETAIL_TAGS) {
        if (getTag(tag)) {
          captureDetailCount += 1;
        }
      }

      if (captureDetailCount < 2) {
        score += 0.35;
        flags.push("spoofed_metadata_detected");
      } else if (captureDetailCount < 3) {
        score += 0.15;
        flags.push("incomplete_camera_metadata");
      }
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

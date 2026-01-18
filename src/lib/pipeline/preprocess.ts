import crypto from "node:crypto";
import sharp from "sharp";
import { StandardizedImage } from "@/src/lib/pipeline/types";

const MAX_PIXELS = 4096 * 4096;
const RESIZE_MAX = 512;
const ANALYSIS_SIZE = 256;
const PHASH_SIZE = 32;

function toGray(rgb: Uint8Array): Float32Array {
  const gray = new Float32Array(rgb.length / 3);
  for (let i = 0; i < gray.length; i += 1) {
    const base = i * 3;
    const r = rgb[base];
    const g = rgb[base + 1];
    const b = rgb[base + 2];
    gray[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  return gray;
}

function computePHash(pixels: Float32Array): string {
  const size = PHASH_SIZE;
  const dct = computeDct(pixels, size, size, 8);
  const values: number[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      if (x === 0 && y === 0) continue;
      values.push(dct[y * 8 + x]);
    }
  }
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  let hash = "";
  for (let i = 0; i < values.length; i += 4) {
    let nibble = 0;
    for (let bit = 0; bit < 4; bit += 1) {
      if (values[i + bit] > median) {
        nibble |= 1 << (3 - bit);
      }
    }
    hash += nibble.toString(16);
  }
  return hash.padStart(16, "0");
}

function computeDct(
  pixels: Float32Array,
  width: number,
  height: number,
  target: number
): Float32Array {
  const result = new Float32Array(target * target);
  const cosX: number[][] = [];
  const cosY: number[][] = [];
  const factorX = Math.PI / (2 * width);
  const factorY = Math.PI / (2 * height);
  for (let u = 0; u < target; u += 1) {
    cosX[u] = [];
    for (let x = 0; x < width; x += 1) {
      cosX[u][x] = Math.cos((2 * x + 1) * u * factorX);
    }
  }
  for (let v = 0; v < target; v += 1) {
    cosY[v] = [];
    for (let y = 0; y < height; y += 1) {
      cosY[v][y] = Math.cos((2 * y + 1) * v * factorY);
    }
  }

  for (let v = 0; v < target; v += 1) {
    const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
    for (let u = 0; u < target; u += 1) {
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      let sum = 0;
      for (let y = 0; y < height; y += 1) {
        const row = y * width;
        const cosVy = cosY[v][y];
        for (let x = 0; x < width; x += 1) {
          sum += pixels[row + x] * cosX[u][x] * cosVy;
        }
      }
      result[v * target + u] = 0.25 * cu * cv * sum;
    }
  }
  return result;
}

export async function preprocessImage(
  buffer: Buffer,
  options?: { randomize?: boolean }
): Promise<StandardizedImage> {
  const randomize = options?.randomize ?? false;
  const image = sharp(buffer, { failOn: "none" }).ensureAlpha().toColourspace("srgb");
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read image dimensions");
  }
  if (metadata.width * metadata.height > MAX_PIXELS) {
    throw new Error("Image dimensions out of range");
  }

  const normalized = image
    .resize({
      width: metadata.width > RESIZE_MAX ? RESIZE_MAX : undefined,
      height: metadata.height > RESIZE_MAX ? RESIZE_MAX : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha();
  const { data, info } = await normalized.raw().toBuffer({ resolveWithObject: true });
  const rgb = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const gray = toGray(rgb);

  const resizeKernel = randomize && Math.random() > 0.5 ? "cubic" : "lanczos3";
  let resizedPipeline = sharp(buffer, { failOn: "none" })
    .ensureAlpha()
    .toColourspace("srgb")
    .resize(ANALYSIS_SIZE, ANALYSIS_SIZE, { fit: "cover", kernel: resizeKernel });
    
  if (randomize) {
    resizedPipeline = resizedPipeline.blur(0.3);
  }
  
  const resizedImage = resizedPipeline.removeAlpha();
  const resized = await resizedImage.raw().toBuffer({ resolveWithObject: true });
  const resizedRgb = new Uint8Array(
    resized.data.buffer,
    resized.data.byteOffset,
    resized.data.byteLength
  );
  const resizedGray = toGray(resizedRgb);

  const phashImage = sharp(buffer, { failOn: "none" })
    .ensureAlpha()
    .resize(PHASH_SIZE, PHASH_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw();
  const phashRaw = await phashImage.toBuffer();
  const phashGray = new Float32Array(PHASH_SIZE * PHASH_SIZE);
  for (let i = 0; i < phashGray.length; i += 1) {
    const base = i * 3;
    const r = phashRaw[base];
    const g = phashRaw[base + 1];
    const b = phashRaw[base + 2];
    phashGray[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const phash = computePHash(phashGray);

  return {
    width: info.width,
    height: info.height,
    rgb,
    gray,
    resized: {
      width: resized.info.width,
      height: resized.info.height,
      rgb: resizedRgb,
      gray: resizedGray,
    },
    hashes: {
      sha256,
      phash,
    },
    metadata: {
      format: metadata.format,
      exif: metadata.exif ?? undefined,
      icc: metadata.icc ?? undefined,
    },
  };
}

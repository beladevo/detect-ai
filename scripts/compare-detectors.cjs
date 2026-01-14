const fs = require("node:fs");
const path = require("node:path");
const { Blob } = require("node:buffer");
const { chromium } = require("playwright");

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const WASM_URL = process.env.WASM_URL || `${API_BASE}/dev/wasm-check`;

const samples = [
  {
    label: "ai",
    filePath: path.resolve("test-assets/ai-sample.png"),
  },
  {
    label: "real",
    filePath: path.resolve("test-assets/real-sample.jpg"),
  },
];

const verdictForScore = (score) => {
  if (score >= 70) return "ai";
  if (score <= 20) return "real";
  return "uncertain";
};

const ensureFileExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
};

const scoreFromApi = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), path.basename(filePath));

  const response = await fetch(`${API_BASE}/api/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.score;
};

const scoreFromWasm = async (page, filePath) => {
  await page.goto(WASM_URL, { waitUntil: "networkidle" });
  const input = page.locator("input[type='file']");
  await input.setInputFiles(filePath);
  await page.waitForSelector("[data-testid='score']", { state: "visible" });
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid='score']");
    if (!el) return false;
    const text = (el.textContent || "").trim();
    return /^\d+(\.\d+)?$/.test(text);
  });

  const text = await page.textContent("[data-testid='score']");
  const score = Number(text);
  if (!Number.isFinite(score)) {
    throw new Error(`Invalid WASM score: ${text}`);
  }
  return score;
};

const run = async () => {
  samples.forEach((sample) => ensureFileExists(sample.filePath));

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    for (const sample of samples) {
      const apiScore = await scoreFromApi(sample.filePath);
      const wasmScore = await scoreFromWasm(page, sample.filePath);

      console.log(`File: ${sample.filePath}`);
      console.log(
        `  /api/detect: ${apiScore} (${verdictForScore(apiScore)})`
      );
      console.log(
        `  wasm-check: ${wasmScore} (${verdictForScore(wasmScore)})`
      );
    }
  } finally {
    await browser.close();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

const fs = require("node:fs");
const path = require("node:path");
const { Blob } = require("node:buffer");
const { chromium } = require("playwright");

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const WASM_URL = process.env.WASM_URL || `${API_BASE}/dev/wasm-check`;
const models = ["model.onnx"];

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

const scoreFromApi = async (filePath, modelName) => {
  const buffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([buffer]), path.basename(filePath));
  if (modelName) {
    formData.append("model", modelName);
  }

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

const scoreFromWasm = async (page, filePath, modelName) => {
  const url = modelName ? `${WASM_URL}?model=${encodeURIComponent(modelName)}` : WASM_URL;
  await page.goto(url, { waitUntil: "networkidle" });
  const input = page.locator("input[type='file']");
  await input.setInputFiles(filePath);
  await page.waitForSelector("[data-testid='score']", { state: "visible" });
  await page.waitForFunction(() => {
    const scoreEl = document.querySelector("[data-testid='score']");
    const errorEl = document.querySelector("[data-testid='error']");
    const scoreText = (scoreEl?.textContent || "").trim();
    const errorText = (errorEl?.textContent || "").trim();
    return Boolean(errorText) || /^\d+(\.\d+)?$/.test(scoreText);
  }, { timeout: 60000 });

  const errorText = await page.textContent("[data-testid='error']");
  if (errorText && errorText.trim()) {
    throw new Error(`WASM error: ${errorText.trim()}`);
  }

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
    for (const modelName of models) {
      console.log(`\nModel: ${modelName}`);
      let apiCorrect = 0;
      let wasmCorrect = 0;
      let apiSamples = 0;
      let wasmSamples = 0;

      for (const sample of samples) {
        console.log(`File: ${sample.filePath}`);

        try {
          const apiStart = Date.now();
          const apiScore = await scoreFromApi(sample.filePath, modelName);
          const apiMs = Date.now() - apiStart;
          const apiVerdict = verdictForScore(apiScore);
          if (apiVerdict === sample.label) apiCorrect += 1;
          apiSamples += 1;
          console.log(
            `  /api/detect: ${apiScore} (${apiVerdict}) ${apiMs}ms`
          );
        } catch (error) {
          console.log(`  /api/detect: error ${error.message}`);
        }

        try {
          const wasmStart = Date.now();
          const wasmScore = await scoreFromWasm(page, sample.filePath, modelName);
          const wasmMs = Date.now() - wasmStart;
          const wasmVerdict = verdictForScore(wasmScore);
          if (wasmVerdict === sample.label) wasmCorrect += 1;
          wasmSamples += 1;
          console.log(
            `  wasm-check: ${wasmScore} (${wasmVerdict}) ${wasmMs}ms`
          );
        } catch (error) {
          console.log(`  wasm-check: error ${error.message}`);
        }
      }

      if (apiSamples > 0) {
        console.log(
          `  API accuracy: ${apiCorrect}/${apiSamples} (${Math.round(
            (apiCorrect / apiSamples) * 100
          )}%)`
        );
      } else {
        console.log("  API accuracy: no successful samples");
      }
      if (wasmSamples > 0) {
        console.log(
          `  WASM accuracy: ${wasmCorrect}/${wasmSamples} (${Math.round(
            (wasmCorrect / wasmSamples) * 100
          )}%)`
        );
      } else {
        console.log("  WASM accuracy: no successful samples");
      }
    }
  } finally {
    await browser.close();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

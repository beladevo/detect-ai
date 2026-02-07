import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

const svgPath = path.resolve("assets/icon.svg");
if (!fs.existsSync(svgPath)) {
  throw new Error(`SVG icon not found at ${svgPath}`);
}

const svgContent = await fs.promises.readFile(svgPath, "utf8");
const wasmPath = path.resolve("node_modules/@resvg/resvg-wasm/index_bg.wasm");
const wasmBytes = await fs.promises.readFile(wasmPath);
await initWasm(wasmBytes);
const resvg = new Resvg(svgContent);
const targetDir = path.resolve(".plasmo/gen-assets");
await fs.promises.mkdir(targetDir, { recursive: true });

const sizes = [16, 32, 48, 64, 128];
for (const size of sizes) {
  const rendered = resvg.render({
    fitTo: {
      mode: "width",
      value: size,
    },
  });
  const outputPath = path.join(targetDir, `icon${size}.plasmo.png`);
  await fs.promises.writeFile(outputPath, rendered.asPng());
  console.info(`Generated ${outputPath}`);
}

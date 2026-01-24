import { build } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

async function runBuild() {
  // Clean dist directory
  rmSync(resolve(rootDir, "dist"), { recursive: true, force: true });
  mkdirSync(resolve(rootDir, "dist"), { recursive: true });

  const isDev = process.env.NODE_ENV !== "production";

  // Build content script (IIFE)
  console.log("Building content.js (IIFE)...");
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: isDev,
      minify: "esbuild",
      lib: {
        entry: resolve(rootDir, "src/content.ts"),
        formats: ["iife"],
        name: "ImagionContent",
        fileName: () => "content.js",
      },
      rollupOptions: {
        output: {
          entryFileNames: "content.js",
        },
      },
      target: "esnext",
    },
  });

  // Build options script (IIFE)
  console.log("Building options.js (IIFE)...");
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: isDev,
      minify: "esbuild",
      lib: {
        entry: resolve(rootDir, "src/options.ts"),
        formats: ["iife"],
        name: "ImagionOptions",
        fileName: () => "options.js",
      },
      rollupOptions: {
        output: {
          entryFileNames: "options.js",
        },
      },
      target: "esnext",
    },
  });

  // Build background service worker (ESM)
  console.log("Building background.js (ESM)...");
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: isDev,
      minify: "esbuild",
      lib: {
        entry: resolve(rootDir, "src/background.ts"),
        formats: ["es"],
        fileName: () => "background.js",
      },
      target: "esnext",
    },
  });

  console.log("Build complete!");
}

runBuild().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});

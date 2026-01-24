import { build } from "vite";
import { resolve } from "path";
import { rmSync, mkdirSync } from "fs";

const rootDir = resolve(__dirname, "..");

async function runBuild() {
  // Clean dist directory
  rmSync(resolve(rootDir, "dist"), { recursive: true, force: true });
  mkdirSync(resolve(rootDir, "dist"), { recursive: true });

  console.log("Building content scripts (IIFE)...");
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: process.env.NODE_ENV !== "production",
      minify: "esbuild",
      lib: {
        entry: {
          content: resolve(rootDir, "src/content.ts"),
          options: resolve(rootDir, "src/options.ts"),
        },
        formats: ["iife"],
        name: "ImagionExtension",
      },
      rollupOptions: {
        output: {
          entryFileNames: "[name].js",
          extend: true,
        },
      },
      target: "esnext",
    },
  });

  console.log("Building background service worker (ESM)...");
  await build({
    configFile: false,
    root: rootDir,
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: process.env.NODE_ENV !== "production",
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

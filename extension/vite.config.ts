import { defineConfig, UserConfig } from "vite";
import { resolve } from "path";

const isWatch = process.argv.includes("--watch");

// Content scripts and options need IIFE format (no ES modules support)
const contentConfig: UserConfig = {
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV !== "production",
    minify: "esbuild",
    lib: {
      entry: {
        content: resolve(__dirname, "src/content.ts"),
        options: resolve(__dirname, "src/options.ts"),
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
};

// Background service worker needs ES module format
const backgroundConfig: UserConfig = {
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV !== "production",
    minify: "esbuild",
    lib: {
      entry: resolve(__dirname, "src/background.ts"),
      formats: ["es"],
      fileName: () => "background.js",
    },
    target: "esnext",
  },
};

// Default export for simple builds - we'll use a custom script for full builds
export default defineConfig(contentConfig);

export { contentConfig, backgroundConfig };

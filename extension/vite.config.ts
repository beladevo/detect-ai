import { defineConfig, UserConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export default defineConfig(contentConfig);

export { contentConfig, backgroundConfig };

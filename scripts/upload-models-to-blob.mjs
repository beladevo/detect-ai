import dotenv from "dotenv";
import { put } from "@vercel/blob";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Load .env.local
dotenv.config({ path: ".env.local" });

const MODELS_DIR = "./public/models/onnx";

async function uploadModels() {
  const files = readdirSync(MODELS_DIR);
  const modelFiles = files.filter(
    (f) => f.endsWith(".onnx") || f.endsWith(".onnx.data")
  );

  console.log(`Found ${modelFiles.length} model files to upload:`);
  modelFiles.forEach((f) => console.log(`  - ${f}`));

  const uploadedUrls = {};

  for (const fileName of modelFiles) {
    const filePath = join(MODELS_DIR, fileName);
    const fileBuffer = readFileSync(filePath);

    console.log(`\nUploading ${fileName}...`);

    const { url } = await put(`models/onnx/${fileName}`, fileBuffer, {
      access: "public",
      addRandomSuffix: false,
    });

    uploadedUrls[fileName] = url;
    console.log(`  Uploaded: ${url}`);
  }

  console.log("\n--- Upload Complete ---\n");
  console.log("Model URLs (add these to your .env.local):\n");

  // Generate the base URL from one of the uploaded files
  const sampleUrl = Object.values(uploadedUrls)[0];
  const baseUrl = sampleUrl.replace(/\/models\/onnx\/.*$/, "");

  console.log(`NEXT_PUBLIC_BLOB_BASE_URL=${baseUrl}`);
  console.log("\nAll uploaded URLs:");
  Object.entries(uploadedUrls).forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
}

uploadModels().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});

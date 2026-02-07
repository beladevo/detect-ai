#!/usr/bin/env node
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";

// Load .env.local
dotenv.config({ path: ".env.local" });

const MODELS_DIR = "./public/models/onnx";

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev or custom domain

function printUsage() {
  console.log(`
Usage: node scripts/upload-models-r2.mjs <models...>

Arguments:
  <models>    Model names to upload (comma or space separated)
              Automatically includes .onnx and .onnx.data files

Options:
  --all       Upload all models
  --list      List available models without uploading
  --help      Show this help message

Examples:
  node scripts/upload-models-r2.mjs model
  node scripts/upload-models-r2.mjs model,nyuad
  node scripts/upload-models-r2.mjs model nyuad smogy
  node scripts/upload-models-r2.mjs --all
  node scripts/upload-models-r2.mjs --list

Required Environment Variables (.env.local):
  R2_ACCOUNT_ID        Cloudflare Account ID
  R2_ACCESS_KEY_ID     R2 API Token Access Key ID
  R2_SECRET_ACCESS_KEY R2 API Token Secret Access Key
  R2_BUCKET_NAME       R2 Bucket name
  R2_PUBLIC_URL        Public URL for the bucket (optional, for output)
`);
}

function validateConfig() {
  const missing = [];
  if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    console.error("\nError: Missing required environment variables:");
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error("\nPlease add them to your .env.local file.");
    process.exit(1);
  }
}

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function getAvailableModels() {
  const files = readdirSync(MODELS_DIR);
  // Get unique model base names (without .onnx or .onnx.data extension)
  const modelNames = new Set();
  files.forEach((f) => {
    if (f.endsWith(".onnx.data")) {
      modelNames.add(f.replace(".onnx.data", ""));
    } else if (f.endsWith(".onnx")) {
      modelNames.add(f.replace(".onnx", ""));
    }
  });
  return {
    files,
    modelNames: Array.from(modelNames).sort(),
  };
}

function getFilesForModel(modelName, availableFiles) {
  const files = [];
  const onnxFile = `${modelName}.onnx`;
  const dataFile = `${modelName}.onnx.data`;

  if (availableFiles.includes(onnxFile)) {
    files.push(onnxFile);
  }
  if (availableFiles.includes(dataFile)) {
    files.push(dataFile);
  }

  return files;
}

function parseModelNames(args) {
  const models = [];
  for (const arg of args) {
    // Support comma-separated values
    const parts = arg.split(",").map((s) => s.trim()).filter(Boolean);
    models.push(...parts);
  }
  return [...new Set(models)]; // Remove duplicates
}

function getContentType(fileName) {
  if (fileName.endsWith(".onnx")) {
    return "application/octet-stream";
  }
  if (fileName.endsWith(".onnx.data")) {
    return "application/octet-stream";
  }
  return "application/octet-stream";
}

async function uploadFile(client, fileName) {
  const filePath = join(MODELS_DIR, fileName);

  if (!existsSync(filePath)) {
    console.error(`  Error: File not found: ${filePath}`);
    return null;
  }

  const fileBuffer = readFileSync(filePath);
  const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

  console.log(`  Uploading ${fileName} (${fileSizeMB} MB)...`);

  const key = `models/onnx/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(fileName),
  });

  await client.send(command);

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  console.log(`  ✓ Uploaded: ${publicUrl}`);

  return { fileName, key, publicUrl, sizeMB: fileSizeMB };
}

async function uploadModels(modelNames, availableFiles) {
  const client = createR2Client();
  const results = [];
  const errors = [];

  for (const modelName of modelNames) {
    console.log(`\nProcessing model: ${modelName}`);

    const files = getFilesForModel(modelName, availableFiles);

    if (files.length === 0) {
      console.error(`  Error: No files found for model "${modelName}"`);
      errors.push(modelName);
      continue;
    }

    for (const fileName of files) {
      try {
        const result = await uploadFile(client, fileName);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`  Error uploading ${fileName}:`, error.message);
        errors.push(fileName);
      }
    }
  }

  return { results, errors };
}

async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printUsage();
    return;
  }

  const { files: availableFiles, modelNames: availableModelNames } =
    getAvailableModels();

  // Check for list flag
  if (args.includes("--list")) {
    console.log(`\nAvailable models in ${MODELS_DIR}:\n`);
    availableModelNames.forEach((name) => {
      const modelFiles = getFilesForModel(name, availableFiles);
      console.log(`  ${name}`);
      modelFiles.forEach((f) => console.log(`    - ${f}`));
    });
    return;
  }

  // Validate R2 configuration
  validateConfig();

  let modelsToUpload;

  // Check for --all flag
  if (args.includes("--all")) {
    modelsToUpload = availableModelNames;
  } else {
    // Parse model names from arguments (excluding flags)
    const modelArgs = args.filter((a) => !a.startsWith("--"));
    modelsToUpload = parseModelNames(modelArgs);

    // Validate model names
    const invalidModels = modelsToUpload.filter(
      (m) => !availableModelNames.includes(m)
    );
    if (invalidModels.length > 0) {
      console.error("\nError: Unknown model(s):", invalidModels.join(", "));
      console.log("\nAvailable models:");
      availableModelNames.forEach((name) => console.log(`  - ${name}`));
      process.exit(1);
    }
  }

  if (modelsToUpload.length === 0) {
    console.error("\nError: No models specified.");
    printUsage();
    process.exit(1);
  }

  console.log("\n=== Cloudflare R2 Model Upload ===");
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Models to upload: ${modelsToUpload.join(", ")}`);

  const { results, errors } = await uploadModels(modelsToUpload, availableFiles);

  // Print summary
  console.log("\n=== Upload Summary ===\n");

  if (results.length > 0) {
    console.log(`Successfully uploaded ${results.length} file(s):\n`);
    results.forEach((r) => {
      console.log(`  ${r.fileName} (${r.sizeMB} MB)`);
      console.log(`    → ${r.publicUrl}`);
    });

    if (R2_PUBLIC_URL) {
      console.log("\n--- Environment Variable ---\n");
      console.log(`NEXT_PUBLIC_BLOB_BASE_URL=${R2_PUBLIC_URL}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\nFailed to upload ${errors.length} item(s):`);
    errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  }

  console.log("\nDone!");
}

main().catch((error) => {
  console.error("\nUpload failed:", error);
  process.exit(1);
});

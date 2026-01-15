import dotenv from "dotenv";
import { put } from "@vercel/blob";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Load .env.local
dotenv.config({ path: ".env.local" });

const MODELS_DIR = "./public/models/onnx";

function printUsage() {
  console.log(`
Usage: node scripts/upload-models-to-blob.mjs [options]

Options:
  --model <name>    Upload a specific model (e.g., model_q4.onnx)
  --all             Upload all models (default if no options provided)
  --list            List available models without uploading
  --help            Show this help message

Examples:
  node scripts/upload-models-to-blob.mjs --model model_q4.onnx
  node scripts/upload-models-to-blob.mjs --all
  node scripts/upload-models-to-blob.mjs --list
`);
}

function getAvailableModels() {
  const files = readdirSync(MODELS_DIR);
  return files.filter(
    (f) => f.endsWith(".onnx") || f.endsWith(".onnx.data")
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    model: null,
    all: false,
    list: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model":
        options.model = args[++i];
        break;
      case "--all":
        options.all = true;
        break;
      case "--list":
        options.list = true;
        break;
      case "--help":
        options.help = true;
        break;
    }
  }

  // Default to --all if no options specified
  if (!options.model && !options.all && !options.list && !options.help) {
    options.all = true;
  }

  return options;
}

async function uploadModels(modelFiles) {
  console.log(`\nUploading ${modelFiles.length} file(s):`);
  modelFiles.forEach((f) => console.log(`  - ${f}`));

  const uploadedUrls = {};

  for (const fileName of modelFiles) {
    const filePath = join(MODELS_DIR, fileName);

    if (!existsSync(filePath)) {
      console.error(`\nError: File not found: ${filePath}`);
      continue;
    }

    const fileBuffer = readFileSync(filePath);
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

    console.log(`\nUploading ${fileName} (${fileSizeMB} MB)...`);

    const { url } = await put(`models/onnx/${fileName}`, fileBuffer, {
      access: "public",
      addRandomSuffix: false,
    });

    uploadedUrls[fileName] = url;
    console.log(`  Uploaded: ${url}`);
  }

  if (Object.keys(uploadedUrls).length > 0) {
    console.log("\n--- Upload Complete ---\n");
    console.log("Model URLs (add these to your .env.local):\n");

    const sampleUrl = Object.values(uploadedUrls)[0];
    const baseUrl = sampleUrl.replace(/\/models\/onnx\/.*$/, "");

    console.log(`NEXT_PUBLIC_BLOB_BASE_URL=${baseUrl}`);
    console.log("\nAll uploaded URLs:");
    Object.entries(uploadedUrls).forEach(([name, url]) => {
      console.log(`  ${name}: ${url}`);
    });
  }
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printUsage();
    return;
  }

  const availableModels = getAvailableModels();

  if (options.list) {
    console.log(`\nAvailable models in ${MODELS_DIR}:`);
    availableModels.forEach((f) => console.log(`  - ${f}`));
    return;
  }

  if (options.model) {
    // Upload specific model and its .data file if exists
    const filesToUpload = [];

    if (availableModels.includes(options.model)) {
      filesToUpload.push(options.model);
    } else {
      console.error(`\nError: Model "${options.model}" not found.`);
      console.log("\nAvailable models:");
      availableModels.forEach((f) => console.log(`  - ${f}`));
      process.exit(1);
    }

    // Also upload the .data file if it exists
    const dataFile = `${options.model}.data`;
    if (availableModels.includes(dataFile)) {
      filesToUpload.push(dataFile);
    }

    await uploadModels(filesToUpload);
  } else if (options.all) {
    await uploadModels(availableModels);
  }
}

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});

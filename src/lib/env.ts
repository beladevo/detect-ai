export const env = {
  // Application Configuration
  USE_API_ONLY: process.env.NEXT_PUBLIC_USE_API_ONLY === "true" || process.env.NEXT_PUBLIC_USE_API_ONLY === "1",
  
  // Environment Flags
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",
  
  // Model Config
  MODEL_NAME: process.env.NEXT_PUBLIC_MODEL_NAME || "model.onnx",
  BLOB_BASE_URL: process.env.NEXT_PUBLIC_BLOB_BASE_URL,

  // Pipeline Feature Flags
  PIPELINE_VISUAL_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED === "true",
  PIPELINE_METADATA_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_METADATA_ENABLED === "true",
  PIPELINE_PHYSICS_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED === "true",
  PIPELINE_FREQUENCY_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED === "true",
  PIPELINE_PROVENANCE_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED === "true",
  PIPELINE_ML_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_ML_ENABLED !== "false", // Default true
};

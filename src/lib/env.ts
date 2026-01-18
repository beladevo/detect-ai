export const env = {
  // Application Configuration
  USE_API_ONLY: process.env.NEXT_PUBLIC_USE_API_ONLY === "true" || process.env.NEXT_PUBLIC_USE_API_ONLY === "1",
  
  // Environment Flags
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",
  
  // Model Config
  MODEL_NAME: process.env.NEXT_PUBLIC_MODEL_NAME || "model.onnx",
  BLOB_BASE_URL: process.env.NEXT_PUBLIC_BLOB_BASE_URL,
};

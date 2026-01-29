import { getConfiguredModelName } from "@/src/lib/models";

const parsePort = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export const env = {
  // Application Configuration
  USE_API_ONLY: process.env.NEXT_PUBLIC_USE_API_ONLY === "true" || process.env.NEXT_PUBLIC_USE_API_ONLY === "1",

  // Environment Flags
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",

  // Base URLs & Model Config
  MODEL_NAME: getConfiguredModelName(),
  BLOB_BASE_URL: process.env.NEXT_PUBLIC_BLOB_BASE_URL,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  // SMTP configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parsePort(process.env.SMTP_PORT),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Pipeline Feature Flags
  PIPELINE_VISUAL_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED === "true",
  PIPELINE_METADATA_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_METADATA_ENABLED === "true",
  PIPELINE_PHYSICS_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED === "true",
  PIPELINE_FREQUENCY_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED === "true",
  PIPELINE_PROVENANCE_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED === "true",
  PIPELINE_ML_ENABLED: process.env.NEXT_PUBLIC_PIPELINE_ML_ENABLED !== "false", // Default true
};

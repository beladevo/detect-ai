export const STORAGE_KEYS = {
  API_KEY: "imagionApiKey",
  DETECTION_ENDPOINT: "imagionDetectionEndpoint",
  BADGE_ENABLED: "imagionBadgeEnabled",
  USER_EMAIL: "imagionUserEmail",
  USER_TIER: "imagionUserTier",
  MONTHLY_DETECTIONS: "imagionMonthlyDetections",
  TOTAL_DETECTIONS: "imagionTotalDetections",
  DAILY_DETECTIONS: "imagionDailyDetections",
  MONTHLY_LIMIT: "imagionMonthlyLimit",
  DAILY_LIMIT: "imagionDailyLimit",
  DETECTION_MODE: "imagionDetectionMode",
  LOCAL_ENDPOINT: "imagionLocalEndpoint",
  PLAN_TIER: "imagionPlanTier",
  DISABLED_HOSTS: "imagionDisabledHosts",
  TELEMETRY: "imagionTelemetry",
  HASH_HISTORY: "recentImageHistory",
  RATE_LIMIT_STATE: "imagionRateLimitState",
  ONBOARDING_COMPLETE: "imagionOnboardingComplete",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

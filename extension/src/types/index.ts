export type DetectionMode = "api" | "local";
export type PlanTier = "free" | "pro";

export type Verdict =
  | "AI_GENERATED"
  | "LIKELY_AI"
  | "UNCERTAIN"
  | "LIKELY_REAL"
  | "REAL";

export type DetectionStatus = "success" | "missing-key" | "error" | "rate-limit";

export type DetectionResponsePayload = {
  status: DetectionStatus;
  verdict?: string;
  score?: number;
  confidence?: number;
  presentation?: string;
  errorType?: string;
  message?: string;
  badgeLabel?: string;
  retryAfterSeconds?: number;
};

export type DetectionResponse = DetectionResponsePayload & {
  badgeId: string;
  imageUrl: string;
  hash?: string;
};

export type PageSummary = {
  ai: number;
  real: number;
  uncertain: number;
  pending: number;
  error: number;
  total: number;
};

export type StorageData = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionUserEmail: string;
  imagionUserTier: string;
  imagionMonthlyDetections: number;
  imagionTotalDetections: number;
  imagionDailyDetections: number;
  imagionMonthlyLimit: number | null;
  imagionDailyLimit: number | null;
  imagionDetectionMode: DetectionMode;
  imagionLocalEndpoint: string;
  imagionPlanTier: PlanTier;
  imagionDisabledHosts: string[];
  imagionOnboardingComplete: boolean;
};

export type AuthResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    tier: string;
    monthlyDetections: number;
    totalDetections: number;
  };
  apiKey?: string;
  error?: string;
};

export type ExtensionSettings = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionDisabledHosts: string[];
  imagionDetectionMode: DetectionMode;
  imagionLocalEndpoint: string;
  imagionPlanTier: PlanTier;
};

export type HashHistoryEntry = {
  hash: string;
  payload: DetectionResponsePayload;
  createdAt: number;
  mode: DetectionMode;
};

export type TelemetryEntry = {
  timestamp: number;
  level: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type RateLimitReason = "burst" | "daily" | "plan";

export type RateLimitIndicator = {
  reason: RateLimitReason;
  expiresAt: number;
};

export type ImagionConfig = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  detectionMode: DetectionMode;
  localDetectionEndpoint: string;
  planTier: PlanTier;
};

export type PendingResolver = {
  badgeId: string;
  resolve: (response: DetectionResponse) => void;
};

export type PendingRequest = {
  resolvers: PendingResolver[];
};

export type DetectionJob = {
  imageUrl: string;
  requestKey: string;
  mode: DetectionMode;
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  localEndpoint: string;
};

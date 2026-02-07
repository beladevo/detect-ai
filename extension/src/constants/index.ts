export const DEFAULT_DETECTION_ENDPOINT = "http://localhost:3000/api/detect";
export const LOCAL_DETECTION_ENDPOINT_DEFAULT = "http://localhost:4000/api/detect";
export const DEFAULT_BASE_URL = "http://localhost:3000";

export const REQUEST_TTL_MS = 5 * 60 * 1000;
export const MAX_CONCURRENT_DETECTIONS = 3;
export const TELEMETRY_LIMIT = 40;
export const BACKOFF_MIN_MS = 15_000;
export const BACKOFF_MAX_MS = 60_000;
export const MAX_HASH_HISTORY = 250;
export const MAX_CACHE_SIZE = 500;
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MIN_IMAGE_DIMENSION = 50;
export const MAX_TRACKED_IMAGES = 200;
export const SCAN_DEBOUNCE_MS = 300;
export const INITIAL_SCAN_DELAY_MS = 500;

export const RATE_LIMIT_BADGE_TEXT = "!";
export const RATE_LIMIT_BADGE_COLOR = "#ff4d67";

export const EXCLUDED_DOMAINS: readonly string[] = [
  "localhost",
  "127.0.0.1",
  "imagion.ai",
  "www.imagion.ai",
];

export const AI_VERDICTS = new Set(["ai", "fake", "ai_generated", "likely_ai"]);
export const UNCERTAIN_VERDICTS = new Set(["uncertain"]);
export const REAL_VERDICTS = new Set(["real", "likely_real"]);

export const HIGH_CONFIDENCE_AI_THRESHOLD = 0.85;

export const CONTEXT_MENU_ID = "imagion-analyze-image";

export const ALARM_CACHE_SWEEP = "imagion-cache-sweep";
export const ALARM_KEEPALIVE = "imagion-keepalive";

export const AUTH_ENDPOINT_PATH = "/api/auth/extension";

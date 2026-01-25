const LOG_PREFIX = "[Imagion Background]";
const DEFAULT_DETECTION_ENDPOINT = "http://localhost:3000/api/detect";
const REQUEST_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_DETECTIONS = 3;
const TELEMETRY_KEY = "imagionTelemetry";
const TELEMETRY_LIMIT = 40;
const BACKOFF_MIN_MS = 15000;
const BACKOFF_MAX_MS = 60000;
const HASH_HISTORY_KEY = "recentImageHistory";
const MAX_HASH_HISTORY = 250;
const RATE_LIMIT_INDICATOR_KEY = "imagionRateLimitState";
const RATE_LIMIT_BADGE_TEXT = "!";
const RATE_LIMIT_BADGE_COLOR = "#ff4d67";
const USAGE_STATUS_MESSAGE = "REQUEST_USAGE_STATUS";

console.info(LOG_PREFIX, "Service worker started");

type ImagionConfig = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
};

type DetectionResponsePayload = {
  status: "success" | "missing-key" | "error" | "rate-limit";
  verdict?: string;
  score?: number;
  confidence?: number;
  presentation?: string;
  errorType?: string;
  message?: string;
  badgeLabel?: string;
  retryAfterSeconds?: number;
};

type HashHistoryEntry = {
  hash: string;
  payload: DetectionResponsePayload;
  createdAt: number;
};

type DetectionResponse = DetectionResponsePayload & {
  badgeId: string;
  imageUrl: string;
};

type PendingResolver = {
  badgeId: string;
  sendResponse: (response: DetectionResponse) => void;
};

type PendingRequest = {
  resolvers: PendingResolver[];
};

type TelemetryEntry = {
  timestamp: number;
  level: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
};

type RateLimitReason = "burst" | "daily" | "plan";
type RateLimitIndicator = {
  reason: RateLimitReason;
  expiresAt: number;
};

type UsageStatusPayload = {
  tier: string;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  totalDetections: number;
  monthlyResetAt: string;
  dailyResetAt: string;
};

const cache = new Map<string, { timestamp: number; payload: DetectionResponsePayload }>();
const pendingRequests = new Map<string, PendingRequest>();
const detectionQueue: Array<{ imageUrl: string }> = [];
const telemetryEntries: TelemetryEntry[] = [];
let runningDetections = 0;
let cachedConfig: ImagionConfig | null = null;
let nextAllowedTimestamp = 0;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let hashHistory: HashHistoryEntry[] = [];
const hashHistoryReady = loadHashHistory();
let rateLimitIndicator: RateLimitIndicator | null = null;
loadRateLimitIndicator();

async function getConfig(): Promise<ImagionConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = await new Promise<ImagionConfig>((resolve) => {
    chrome.storage.local.get(
      {
        imagionApiKey: "",
        imagionDetectionEndpoint: DEFAULT_DETECTION_ENDPOINT,
      },
      (items) => {
        resolve({
          imagionApiKey: typeof items.imagionApiKey === "string" ? items.imagionApiKey.trim() : "",
          imagionDetectionEndpoint:
            typeof items.imagionDetectionEndpoint === "string" && items.imagionDetectionEndpoint.trim().length > 0
              ? items.imagionDetectionEndpoint.trim()
              : DEFAULT_DETECTION_ENDPOINT,
        });
      }
    );
  });

  cachedConfig = config;
  console.info(LOG_PREFIX, "Config loaded:", {
    hasApiKey: !!config.imagionApiKey,
    endpoint: config.imagionDetectionEndpoint,
  });
  return config;
}

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (changes.imagionApiKey || changes.imagionDetectionEndpoint) {
      console.info(LOG_PREFIX, "Config changed, clearing cache");
      cachedConfig = null;
      if (changes.imagionApiKey && !changes.imagionApiKey.newValue) {
        setRateLimitIndicator(null);
      }
    }
  });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "REQUEST_DETECTION") {
    console.debug(LOG_PREFIX, "Received detection request:", message.badgeId, message.imageUrl?.substring(0, 80));
    handleImageDetection(message, sendResponse);
    return true;
  }

  if (message.type === USAGE_STATUS_MESSAGE) {
    void (async () => {
      try {
        const usage = await fetchUsageStatus();
        sendResponse({ success: true, usage });
      } catch (error) {
        console.error(LOG_PREFIX, "Usage status failed:", error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Failed to load usage status",
        });
      }
    })();
    return true;
  }

  return false;
});

function handleImageDetection(message: {
  type: "REQUEST_DETECTION";
  imageUrl: string;
  badgeId: string;
  pageUrl: string;
}, sendResponse: (response: DetectionResponse) => void) {
  const normalizedUrl = normalizeImageUrl(message.imageUrl, message.pageUrl);
  if (!normalizedUrl) {
    console.warn(LOG_PREFIX, "Invalid URL:", message.imageUrl);
    sendResponse({
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: message.badgeId,
      imageUrl: message.imageUrl,
    });
    return;
  }

  const cached = getCachedResult(normalizedUrl);
  if (cached) {
    console.debug(LOG_PREFIX, "Cache hit for:", message.badgeId);
    sendResponse({ ...cached, badgeId: message.badgeId, imageUrl: normalizedUrl });
    return;
  }

  const existing = pendingRequests.get(normalizedUrl);
  if (existing) {
    console.debug(LOG_PREFIX, "Joining existing request for:", message.badgeId);
    existing.resolvers.push({ badgeId: message.badgeId, sendResponse });
    return;
  }

  console.debug(LOG_PREFIX, "Queueing new request for:", message.badgeId);
  pendingRequests.set(normalizedUrl, { resolvers: [{ badgeId: message.badgeId, sendResponse }] });
  detectionQueue.push({ imageUrl: normalizedUrl });
  processQueue();
}

function normalizeImageUrl(imageUrl: string, pageUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }
  try {
    return new URL(imageUrl, pageUrl || undefined).toString();
  } catch (error) {
    console.warn(LOG_PREFIX, "Invalid image URL", imageUrl, error);
    return null;
  }
}

function getCachedResult(imageUrl: string): DetectionResponsePayload | null {
  const entry = cache.get(imageUrl);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > REQUEST_TTL_MS) {
    cache.delete(imageUrl);
    return null;
  }
  return entry.payload;
}

function processQueue() {
  if (Date.now() < nextAllowedTimestamp) {
    console.debug(LOG_PREFIX, "Rate limited, waiting...");
    return;
  }

  while (runningDetections < MAX_CONCURRENT_DETECTIONS && detectionQueue.length > 0) {
    const job = detectionQueue.shift();
    if (!job) {
      continue;
    }
    runningDetections += 1;
    console.debug(LOG_PREFIX, `Processing queue (${runningDetections}/${MAX_CONCURRENT_DETECTIONS} running, ${detectionQueue.length} pending)`);

    runDetection(job.imageUrl)
      .catch(() => {
        // Individual errors are handled inside runDetection.
      })
      .finally(() => {
        runningDetections -= 1;
        processQueue();
      });
  }
}

async function runDetection(imageUrl: string) {
  const { imagionApiKey, imagionDetectionEndpoint } = await getConfig();

  if (!imagionApiKey) {
    console.warn(LOG_PREFIX, "No API key configured");
    recordTelemetry({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl },
    });
    dispatchResponse(imageUrl, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page.",
    });
    return;
  }

  let blob: Blob;
  try {
    console.debug(LOG_PREFIX, "Fetching image:", imageUrl.substring(0, 80));
    blob = await fetchImageBytes(imageUrl);
    console.debug(LOG_PREFIX, "Image fetched, size:", blob.size, "bytes");
  } catch (error) {
    console.error(LOG_PREFIX, "Failed to fetch image:", error);
    recordTelemetry({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl, error: error instanceof Error ? error.message : String(error) },
    });
    dispatchResponse(imageUrl, {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to fetch the image.",
    });
    return;
  }

  let imageHash: string | null = null;
  try {
    imageHash = await hashBlobSHA256(blob);
  } catch (hashError) {
    console.warn(LOG_PREFIX, "Failed to hash image:", hashError);
  }

  if (imageHash) {
    const historyEntry = await findHashHistoryEntry(imageHash);
    if (historyEntry) {
      recordTelemetry({
        level: "info",
        message: "local_history_hit",
        details: { imageUrl, hash: imageHash },
      });
      cache.set(imageUrl, { timestamp: Date.now(), payload: historyEntry.payload });
      dispatchResponse(imageUrl, historyEntry.payload);
      return;
    }
  }

  const cacheLookupEndpoint = getCacheLookupEndpoint(imagionDetectionEndpoint);
  if (imageHash && imagionApiKey) {
    const remotePayload = await lookupBackendHash(imageHash, cacheLookupEndpoint, imagionApiKey);
    if (remotePayload) {
      recordTelemetry({
        level: "info",
        message: "remote_cache_hit",
        details: { imageUrl, hash: imageHash },
      });
      cache.set(imageUrl, { timestamp: Date.now(), payload: remotePayload });
      void recordHashHistory(imageHash, remotePayload);
      dispatchResponse(imageUrl, remotePayload);
      return;
    }
  }

  const formData = new FormData();
  const fileName = extractFileName(imageUrl);
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  formData.append("file", file);

  let response: Response;
  try {
    console.debug(LOG_PREFIX, "Sending to API:", imagionDetectionEndpoint);
    response = await fetch(imagionDetectionEndpoint, {
      method: "POST",
      headers: {
        "x-api-key": imagionApiKey,
        "x-detection-source": "extension",
      },
      body: formData,
    });
    console.debug(LOG_PREFIX, "API response status:", response.status);
  } catch (error) {
    console.error(LOG_PREFIX, "API request failed:", error);
    recordTelemetry({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl, error: error instanceof Error ? error.message : String(error) },
    });
    dispatchResponse(imageUrl, {
      status: "error",
      message: error instanceof Error ? error.message : "Detection request failed.",
    });
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
    console.debug(LOG_PREFIX, "API response payload:", payload);
  } catch (error) {
    console.error(LOG_PREFIX, "Failed to parse JSON:", error);
    recordTelemetry({
      level: "error",
      message: "invalid_json",
      details: { imageUrl, error: error instanceof Error ? error.message : String(error) },
    });
    dispatchResponse(imageUrl, {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to parse detection response.",
    });
    return;
  }

  if (response.status === 429) {
    const rateLimitBody = payload as {
      message?: string;
      badgeLabel?: string;
      retryAfter?: number;
      errorType?: string;
    };
    const headerRetry = parseRetryAfter(response.headers.get("Retry-After"));
    const effectiveRetryAfter = rateLimitBody.retryAfter ?? headerRetry;
    const limitReason: RateLimitReason =
      rateLimitBody.errorType === "PLAN_LIMIT_EXCEEDED"
        ? "plan"
        : rateLimitBody.errorType === "DAILY_RATE_LIMIT_EXCEEDED"
          ? "daily"
          : "burst";
    applyRateLimitBackoff(effectiveRetryAfter, limitReason);
    console.warn(LOG_PREFIX, "Rate limited, retry after:", effectiveRetryAfter, "seconds");
    recordTelemetry({
      level: "warning",
      message: "rate_limited",
      details: {
        imageUrl,
        retryAfter: effectiveRetryAfter,
        badgeLabel: rateLimitBody.badgeLabel,
        errorType: rateLimitBody.errorType,
      },
    });
    dispatchResponse(imageUrl, {
      status: "rate-limit",
      message: rateLimitBody.message ?? `Rate limit exceeded. Retrying in ${effectiveRetryAfter} seconds.`,
      retryAfterSeconds: effectiveRetryAfter,
      badgeLabel: rateLimitBody.badgeLabel,
      errorType: rateLimitBody.errorType,
    });
    return;
  }

  if (!response.ok) {
    const message = (payload as { message?: string })?.message || "Detection failed";
    console.error(LOG_PREFIX, "API error:", response.status, message);
    recordTelemetry({
      level: "error",
      message: "detection_error",
      details: { imageUrl, responseStatus: response.status, message },
    });
    dispatchResponse(imageUrl, {
      status: "error",
      message,
    });
    return;
  }

  const structuredPayload = payload as {
    verdict?: string;
    score?: number;
    confidence?: number;
    presentation?: string;
  };

  const successPayload: DetectionResponsePayload = {
    status: "success",
    verdict: structuredPayload.verdict,
    score: structuredPayload.score,
    confidence: structuredPayload.confidence,
    presentation: structuredPayload.presentation,
  };

  console.info(LOG_PREFIX, "Detection success:", structuredPayload.verdict, "score:", structuredPayload.score);
  recordTelemetry({
    level: "info",
    message: "detection_success",
    details: { imageUrl, score: structuredPayload.score, verdict: structuredPayload.verdict },
  });

  cache.set(imageUrl, { timestamp: Date.now(), payload: successPayload });
  if (imageHash) {
    void recordHashHistory(imageHash, successPayload);
  }
  dispatchResponse(imageUrl, successPayload);
}

async function fetchImageBytes(url: string): Promise<Blob> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch image (${response.status})`);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error("Image payload was empty.");
  }

  return blob;
}

function extractFileName(url: string): string {
  try {
    const parsed = new URL(url);
    const pieces = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pieces[pieces.length - 1];
    return lastSegment || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}

function dispatchResponse(imageUrl: string, payload: DetectionResponsePayload) {
  const entry = pendingRequests.get(imageUrl);
  if (!entry) {
    return;
  }
  console.debug(LOG_PREFIX, "Dispatching response to", entry.resolvers.length, "resolver(s)");
  entry.resolvers.forEach(({ badgeId, sendResponse }) => {
    sendResponse({ ...payload, badgeId, imageUrl });
  });
  pendingRequests.delete(imageUrl);
}

function parseRetryAfter(header: string | null): number {
  if (!header) {
    return BACKOFF_MIN_MS / 1000;
  }
  const parsed = Number.parseInt(header, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return BACKOFF_MIN_MS / 1000;
}

function applyRateLimitBackoff(seconds: number, reason: RateLimitReason = "burst") {
  const waitMs = Math.min(Math.max(seconds * 1000, BACKOFF_MIN_MS), BACKOFF_MAX_MS);
  nextAllowedTimestamp = Date.now() + waitMs;
  if (backoffTimer) {
    clearTimeout(backoffTimer);
  }
  if (reason === "plan") {
    setRateLimitIndicator({
      reason,
      expiresAt: nextAllowedTimestamp,
    });
  }
  backoffTimer = setTimeout(() => {
    nextAllowedTimestamp = 0;
    backoffTimer = null;
    if (reason === "plan") {
      setRateLimitIndicator(null);
    }
    processQueue();
  }, waitMs);
}

function applyLimitBadge(active: boolean) {
  if (active) {
    chrome.action.setBadgeText({ text: RATE_LIMIT_BADGE_TEXT });
    chrome.action.setBadgeBackgroundColor({ color: RATE_LIMIT_BADGE_COLOR });
  } else {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setBadgeBackgroundColor({ color: "#000000" });
  }
}

function persistRateLimitIndicator(state: RateLimitIndicator | null) {
  if (state) {
    chrome.storage.local.set({ [RATE_LIMIT_INDICATOR_KEY]: state });
  } else {
    chrome.storage.local.remove(RATE_LIMIT_INDICATOR_KEY);
  }
}

function setRateLimitIndicator(state: RateLimitIndicator | null) {
  rateLimitIndicator = state;
  applyLimitBadge(Boolean(state));
  persistRateLimitIndicator(state);
}

function isRateLimitIndicator(value: unknown): value is RateLimitIndicator {
  if (!value || typeof value !== "object") {
    return false;
  }
  const indicator = value as RateLimitIndicator;
  return (
    ["burst", "daily", "plan"].includes(indicator.reason) &&
    typeof indicator.expiresAt === "number" &&
    Number.isFinite(indicator.expiresAt)
  );
}

function loadRateLimitIndicator(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(RATE_LIMIT_INDICATOR_KEY, (items) => {
      const stored = items[RATE_LIMIT_INDICATOR_KEY];
      if (isRateLimitIndicator(stored) && stored.expiresAt > Date.now()) {
        rateLimitIndicator = stored;
        applyLimitBadge(true);
        nextAllowedTimestamp = stored.expiresAt;
        const waitMs = stored.expiresAt - Date.now();
        if (waitMs > 0) {
          backoffTimer = setTimeout(() => {
            nextAllowedTimestamp = 0;
            backoffTimer = null;
            setRateLimitIndicator(null);
            processQueue();
          }, waitMs);
        } else {
          setRateLimitIndicator(null);
        }
      } else {
        chrome.storage.local.remove(RATE_LIMIT_INDICATOR_KEY);
      }
      resolve();
    });
  });
}

async function loadHashHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(HASH_HISTORY_KEY, (items) => {
      const stored = items[HASH_HISTORY_KEY];
      if (Array.isArray(stored)) {
        hashHistory = stored.filter(isHashHistoryEntry);
        if (hashHistory.length > MAX_HASH_HISTORY) {
          hashHistory = hashHistory.slice(0, MAX_HASH_HISTORY);
        }
      } else {
        hashHistory = [];
      }
      resolve();
    });
  });
}

async function ensureHashHistoryLoaded(): Promise<void> {
  await hashHistoryReady;
}

async function findHashHistoryEntry(hash: string): Promise<HashHistoryEntry | undefined> {
  await ensureHashHistoryLoaded();
  return hashHistory.find((entry) => entry.hash === hash);
}

async function recordHashHistory(hash: string, payload: DetectionResponsePayload): Promise<void> {
  await ensureHashHistoryLoaded();
  hashHistory = hashHistory.filter((entry) => entry.hash !== hash);
  hashHistory.unshift({ hash, payload, createdAt: Date.now() });
  if (hashHistory.length > MAX_HASH_HISTORY) {
    hashHistory.length = MAX_HASH_HISTORY;
  }
  persistHashHistory();
}

function persistHashHistory() {
  chrome.storage.local.set({ [HASH_HISTORY_KEY]: hashHistory });
}

function isHashHistoryEntry(value: unknown): value is HashHistoryEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as HashHistoryEntry;
  return (
    typeof entry.hash === "string" &&
    entry.hash.length > 0 &&
    typeof entry.createdAt === "number" &&
    typeof entry.payload === "object" &&
    entry.payload !== null &&
    typeof entry.payload.status === "string"
  );
}

async function hashBlobSHA256(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getCacheLookupEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.pathname.endsWith("/api/detect")) {
      url.pathname = url.pathname.replace(/\/api\/detect$/, "/api/cache/hash");
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/api/cache/hash`;
    }
    return url.toString();
  } catch {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/api/cache/hash`;
  }
}

async function lookupBackendHash(
  hash: string,
  endpoint: string,
  apiKey: string
): Promise<DetectionResponsePayload | null> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ hash }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data?.found && data.payload) {
      return data.payload;
    }
  } catch (error) {
    console.warn(LOG_PREFIX, "Backend cache lookup failed:", error);
  }
  return null;
}

function getUsageStatusEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.pathname.endsWith("/api/detect")) {
      url.pathname = url.pathname.replace(/\/api\/detect$/, "/api/usage/status");
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/api/usage/status`;
    }
    return url.toString();
  } catch {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/api/usage/status`;
  }
}

async function fetchUsageStatus(): Promise<UsageStatusPayload> {
  const { imagionApiKey, imagionDetectionEndpoint } = await getConfig();
  if (!imagionApiKey) {
    throw new Error("Missing Imagion API key");
  }

  const endpoint = getUsageStatusEndpoint(imagionDetectionEndpoint);
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "x-api-key": imagionApiKey,
    },
  });
  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Usage status request failed (${response.status}): ${bodyText}`);
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.usage) {
    throw new Error("Invalid usage status response");
  }

  return payload.usage as UsageStatusPayload;
}

function recordTelemetry(entry: Omit<TelemetryEntry, "timestamp">) {
  telemetryEntries.push({ timestamp: Date.now(), ...entry });
  if (telemetryEntries.length > TELEMETRY_LIMIT) {
    telemetryEntries.shift();
  }
  chrome.storage.local.set({ [TELEMETRY_KEY]: telemetryEntries });
}

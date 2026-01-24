const LOG_PREFIX = "[Imagion Background]";
const DEFAULT_DETECTION_ENDPOINT = "http://localhost:3000/api/detect";
const REQUEST_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_DETECTIONS = 3;
const TELEMETRY_KEY = "imagionTelemetry";
const TELEMETRY_LIMIT = 40;
const BACKOFF_MIN_MS = 15000;
const BACKOFF_MAX_MS = 60000;

console.log(LOG_PREFIX, "Service worker started");

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
  message?: string;
  retryAfterSeconds?: number;
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

const cache = new Map<string, { timestamp: number; payload: DetectionResponsePayload }>();
const pendingRequests = new Map<string, PendingRequest>();
const detectionQueue: Array<{ imageUrl: string }> = [];
const telemetryEntries: TelemetryEntry[] = [];
let runningDetections = 0;
let cachedConfig: ImagionConfig | null = null;
let nextAllowedTimestamp = 0;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;

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
  console.log(LOG_PREFIX, "Config loaded:", {
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
    console.log(LOG_PREFIX, "Config changed, clearing cache");
    cachedConfig = null;
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "REQUEST_DETECTION") {
    return false;
  }

  console.log(LOG_PREFIX, "Received detection request:", message.badgeId, message.imageUrl?.substring(0, 80));
  handleImageDetection(message, sendResponse);
  return true;
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
    console.log(LOG_PREFIX, "Cache hit for:", message.badgeId);
    sendResponse({ ...cached, badgeId: message.badgeId, imageUrl: normalizedUrl });
    return;
  }

  const existing = pendingRequests.get(normalizedUrl);
  if (existing) {
    console.log(LOG_PREFIX, "Joining existing request for:", message.badgeId);
    existing.resolvers.push({ badgeId: message.badgeId, sendResponse });
    return;
  }

  console.log(LOG_PREFIX, "Queueing new request for:", message.badgeId);
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
    console.log(LOG_PREFIX, "Rate limited, waiting...");
    return;
  }

  while (runningDetections < MAX_CONCURRENT_DETECTIONS && detectionQueue.length > 0) {
    const job = detectionQueue.shift();
    if (!job) {
      continue;
    }
    runningDetections += 1;
    console.log(LOG_PREFIX, `Processing queue (${runningDetections}/${MAX_CONCURRENT_DETECTIONS} running, ${detectionQueue.length} pending)`);

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
    console.log(LOG_PREFIX, "Fetching image:", imageUrl.substring(0, 80));
    blob = await fetchImageBytes(imageUrl);
    console.log(LOG_PREFIX, "Image fetched, size:", blob.size, "bytes");
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

  const formData = new FormData();
  const fileName = extractFileName(imageUrl);
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  formData.append("file", file);

  let response: Response;
  try {
    console.log(LOG_PREFIX, "Sending to API:", imagionDetectionEndpoint);
    response = await fetch(imagionDetectionEndpoint, {
      method: "POST",
      headers: {
        "x-api-key": imagionApiKey,
      },
      body: formData,
    });
    console.log(LOG_PREFIX, "API response status:", response.status);
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
    console.log(LOG_PREFIX, "API response payload:", payload);
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
    const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
    applyRateLimitBackoff(retryAfter);
    console.warn(LOG_PREFIX, "Rate limited, retry after:", retryAfter, "seconds");
    recordTelemetry({
      level: "warning",
      message: "rate_limited",
      details: { imageUrl, retryAfter },
    });
    dispatchResponse(imageUrl, {
      status: "rate-limit",
      message: `Rate limit exceeded. Retrying in ${retryAfter} seconds.`,
      retryAfterSeconds: retryAfter,
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

  console.log(LOG_PREFIX, "Detection success:", structuredPayload.verdict, "score:", structuredPayload.score);
  recordTelemetry({
    level: "info",
    message: "detection_success",
    details: { imageUrl, score: structuredPayload.score, verdict: structuredPayload.verdict },
  });

  cache.set(imageUrl, { timestamp: Date.now(), payload: successPayload });
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
  console.log(LOG_PREFIX, "Dispatching response to", entry.resolvers.length, "resolver(s)");
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

function applyRateLimitBackoff(seconds: number) {
  const waitMs = Math.min(Math.max(seconds * 1000, BACKOFF_MIN_MS), BACKOFF_MAX_MS);
  nextAllowedTimestamp = Date.now() + waitMs;
  if (backoffTimer) {
    clearTimeout(backoffTimer);
  }
  backoffTimer = setTimeout(() => {
    nextAllowedTimestamp = 0;
    backoffTimer = null;
    processQueue();
  }, waitMs);
}

function recordTelemetry(entry: Omit<TelemetryEntry, "timestamp">) {
  telemetryEntries.push({ timestamp: Date.now(), ...entry });
  if (telemetryEntries.length > TELEMETRY_LIMIT) {
    telemetryEntries.shift();
  }
  chrome.storage.local.set({ [TELEMETRY_KEY]: telemetryEntries });
}

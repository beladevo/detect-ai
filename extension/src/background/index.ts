import browser from "webextension-polyfill";
import type {
  DetectionMode,
  ImagionConfig,
  DetectionResponsePayload,
  HashHistoryEntry,
  TelemetryEntry,
  RateLimitReason,
  RateLimitIndicator,
  UsageStatusPayload,
  DetectionResponse,
  PendingResolver,
  PendingRequest,
  DetectionJob,
} from "../types";
import {
  DEFAULT_DETECTION_ENDPOINT,
  LOCAL_DETECTION_ENDPOINT_DEFAULT,
  REQUEST_TTL_MS,
  MAX_CONCURRENT_DETECTIONS,
  TELEMETRY_LIMIT,
  BACKOFF_MIN_MS,
  BACKOFF_MAX_MS,
  MAX_HASH_HISTORY,
  MAX_CACHE_SIZE,
  MAX_IMAGE_UPLOAD_BYTES,
  RATE_LIMIT_BADGE_TEXT,
  RATE_LIMIT_BADGE_COLOR,
  HIGH_CONFIDENCE_AI_THRESHOLD,
  CONTEXT_MENU_ID,
  ALARM_CACHE_SWEEP,
  ALARM_KEEPALIVE,
  AI_VERDICTS,
} from "../constants";
import { STORAGE_KEYS } from "../config/storageKeys";
import { MESSAGE_TYPES } from "../types/messages";
import {
  normalizeImageUrl,
  extractFileName,
  getCacheLookupEndpoint,
  getUsageStatusEndpoint,
  parseRetryAfter,
  buildRequestKey,
  isHashHistoryEntry,
  isRateLimitIndicator,
  hashBlobSHA256,
} from "../utils";

const LOG_PREFIX = "[Imagion Background]";

const cache = new Map<string, { timestamp: number; payload: DetectionResponsePayload }>();
const pendingRequests = new Map<string, PendingRequest>();
const detectionQueue: DetectionJob[] = [];
const telemetryEntries: TelemetryEntry[] = [];

let runningDetections = 0;
let cachedConfig: ImagionConfig | null = null;
let nextAllowedTimestamp = 0;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let hashHistory: HashHistoryEntry[] = [];

const hashHistoryReady = loadHashHistory();
loadRateLimitIndicator();

async function getConfig(): Promise<ImagionConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const stored = await browser.storage.local.get({
    [STORAGE_KEYS.API_KEY]: "",
    [STORAGE_KEYS.DETECTION_ENDPOINT]: DEFAULT_DETECTION_ENDPOINT,
    [STORAGE_KEYS.DETECTION_MODE]: "api",
    [STORAGE_KEYS.LOCAL_ENDPOINT]: LOCAL_DETECTION_ENDPOINT_DEFAULT,
    [STORAGE_KEYS.PLAN_TIER]: "free",
  });

  const config: ImagionConfig = {
    imagionApiKey:
      typeof stored[STORAGE_KEYS.API_KEY] === "string"
        ? stored[STORAGE_KEYS.API_KEY].trim()
        : "",
    imagionDetectionEndpoint:
      typeof stored[STORAGE_KEYS.DETECTION_ENDPOINT] === "string" &&
      stored[STORAGE_KEYS.DETECTION_ENDPOINT].trim().length > 0
        ? stored[STORAGE_KEYS.DETECTION_ENDPOINT].trim()
        : DEFAULT_DETECTION_ENDPOINT,
    detectionMode: stored[STORAGE_KEYS.DETECTION_MODE] === "local" ? "local" : "api",
    localDetectionEndpoint:
      typeof stored[STORAGE_KEYS.LOCAL_ENDPOINT] === "string" &&
      stored[STORAGE_KEYS.LOCAL_ENDPOINT].trim().length > 0
        ? stored[STORAGE_KEYS.LOCAL_ENDPOINT].trim()
        : LOCAL_DETECTION_ENDPOINT_DEFAULT,
    planTier: stored[STORAGE_KEYS.PLAN_TIER] === "pro" ? "pro" : "free",
  };

  cachedConfig = config;
  return config;
}

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  const configKeys =
    changes[STORAGE_KEYS.API_KEY] ||
    changes[STORAGE_KEYS.DETECTION_ENDPOINT] ||
    changes[STORAGE_KEYS.DETECTION_MODE] ||
    changes[STORAGE_KEYS.LOCAL_ENDPOINT] ||
    changes[STORAGE_KEYS.PLAN_TIER];
  if (configKeys) {
    cachedConfig = null;
    cache.clear();
    if (changes[STORAGE_KEYS.API_KEY] && !changes[STORAGE_KEYS.API_KEY].newValue) {
      setRateLimitIndicator(null);
    }
  }
});

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus
    .create({
      id: CONTEXT_MENU_ID,
      title: "Analyze with Imagion",
      contexts: ["image"],
    })
    .catch(() => undefined);

  browser.alarms.create(ALARM_CACHE_SWEEP, { periodInMinutes: 5 });
  browser.alarms.create(ALARM_KEEPALIVE, { periodInMinutes: 0.4 });

});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_CACHE_SWEEP) {
    sweepExpiredCache();
  }
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.srcUrl) {
    handleContextMenuDetection(info.srcUrl, tab);
  }
});

browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-badges") {
    const items = await browser.storage.local.get({ [STORAGE_KEYS.BADGE_ENABLED]: true });
    const current = items[STORAGE_KEYS.BADGE_ENABLED];
    const next = !current;
    await browser.storage.local.set({ [STORAGE_KEYS.BADGE_ENABLED]: next });
    return;
  }

  if (command === "scan-page") {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      try {
        await browser.tabs.sendMessage(activeTab.id, { type: "RESCAN_PAGE" });
      } catch (error) {
        console.warn(LOG_PREFIX, "Failed to send scan-page command to tab:", error);
      }
    }
  }
});

browser.runtime.onStartup.addListener(async () => {
  await loadRateLimitIndicator();
  await hashHistoryReady;

  const cacheAlarm = await browser.alarms.get(ALARM_CACHE_SWEEP);
  if (!cacheAlarm) {
    browser.alarms.create(ALARM_CACHE_SWEEP, { periodInMinutes: 5 });
  }
  const keepAliveAlarm = await browser.alarms.get(ALARM_KEEPALIVE);
  if (!keepAliveAlarm) {
    browser.alarms.create(ALARM_KEEPALIVE, { periodInMinutes: 0.4 });
  }
});

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || typeof message.type !== "string") {
    return;
  }

  if (message.type === MESSAGE_TYPES.REQUEST_DETECTION) {
    return handleImageDetection(message);
  }

  if (message.type === MESSAGE_TYPES.REQUEST_USAGE_STATUS) {
    try {
      const usage = await fetchUsageStatus();
      return { success: true, usage };
    } catch (error) {
      console.error(LOG_PREFIX, "Usage status failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load usage status",
      };
    }
  }

  if (message.type === MESSAGE_TYPES.REQUEST_PAGE_SUMMARY) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (!activeTab?.id) {
      return { success: false, error: "No active tab found" };
    }
    try {
      const response = await browser.tabs.sendMessage(activeTab.id, {
        type: MESSAGE_TYPES.REQUEST_PAGE_SUMMARY,
      });
      if (!response?.summary) {
        return { success: false, error: "Not available on this page" };
      }
      return { success: true, ...response };
    } catch (error) {
      console.warn(LOG_PREFIX, "Page summary error:", error);
      return { success: false, error: "Failed to query content script" };
    }
  }
});

async function handleImageDetection(
  message: {
    type: "REQUEST_DETECTION";
    imageUrl: string;
    badgeId: string;
    pageUrl: string;
  }
): Promise<DetectionResponse> {
  const normalizedUrl = normalizeImageUrl(message.imageUrl, message.pageUrl);
  if (!normalizedUrl) {
    console.warn(LOG_PREFIX, "Invalid URL:", message.imageUrl);
    return {
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: message.badgeId,
      imageUrl: message.imageUrl,
    };
  }

  const config = await getConfig();
  const requestKey = buildRequestKey(normalizedUrl, config.detectionMode);
  const cached = getCachedResult(requestKey);
  if (cached) {
    return { ...cached, badgeId: message.badgeId, imageUrl: normalizedUrl };
  }

  return new Promise<DetectionResponse>((resolve) => {
    const resolver: PendingResolver = { badgeId: message.badgeId, resolve };
    const existing = pendingRequests.get(requestKey);
    if (existing) {
      existing.resolvers.push(resolver);
      return;
    }

    pendingRequests.set(requestKey, { resolvers: [resolver] });
    detectionQueue.push({
      imageUrl: normalizedUrl,
      requestKey,
      mode: config.detectionMode,
      imagionApiKey: config.imagionApiKey,
      imagionDetectionEndpoint: config.imagionDetectionEndpoint,
      localEndpoint: config.localDetectionEndpoint,
    });
    processQueue();
  });
}

function processQueue() {
  if (Date.now() < nextAllowedTimestamp) {
    return;
  }

  while (runningDetections < MAX_CONCURRENT_DETECTIONS && detectionQueue.length > 0) {
    const job = detectionQueue.shift();
    if (!job) {
      continue;
    }
    runningDetections += 1;

    runDetection(job)
      .catch(() => {
        // Errors handled internally.
      })
      .finally(() => {
        runningDetections -= 1;
        processQueue();
      });
  }
}

async function runDetection(job: DetectionJob) {
  const {
    imageUrl,
    requestKey,
    mode,
    imagionApiKey,
    imagionDetectionEndpoint,
    localEndpoint,
  } = job;

  if (mode === "api" && !imagionApiKey) {
    console.warn(LOG_PREFIX, "No API key configured for API mode");
    recordTelemetry({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page.",
    });
    return;
  }

  let blob: Blob;
  try {
    blob = await fetchImageBytes(imageUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(LOG_PREFIX, "Failed to fetch image:", {
      imageUrl,
      mode,
      error: errorMessage,
      errorType: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    recordTelemetry({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl, error: errorMessage, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message: `Failed to fetch image: ${errorMessage}`,
    });
    return;
  }

  if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    console.warn(LOG_PREFIX, "Image too large:", blob.size, "bytes");
    recordTelemetry({
      level: "warning",
      message: "image_too_large",
      details: { imageUrl, size: blob.size, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message: `Image too large (${sizeMB} MB). Maximum allowed size is 10 MB.`,
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
    const historyEntry = await findHashHistoryEntry(imageHash, mode);
    if (historyEntry) {
      recordTelemetry({
        level: "info",
        message: "local_history_hit",
        details: { imageUrl, hash: imageHash, mode },
      });
      const payload = { ...historyEntry.payload, status: historyEntry.payload.status || "success" as const };
      setCacheEntry(requestKey, payload);
      dispatchResponse(imageUrl, requestKey, payload, imageHash);
      return;
    }
  }

  if (mode === "api" && imageHash && imagionApiKey) {
    const cacheLookupEndpoint = getCacheLookupEndpoint(imagionDetectionEndpoint);
    const remotePayload = await lookupBackendHash(imageHash, cacheLookupEndpoint, imagionApiKey);
    if (remotePayload) {
      recordTelemetry({
        level: "info",
        message: "remote_cache_hit",
        details: { imageUrl, hash: imageHash, mode },
      });
      const payload = { ...remotePayload, status: remotePayload.status || "success" as const };
      setCacheEntry(requestKey, payload);
      void recordHashHistory(imageHash, payload, mode);
      dispatchResponse(imageUrl, requestKey, payload, imageHash);
      return;
    }
  }

  const formData = new FormData();
  const fileName = extractFileName(imageUrl);
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  formData.append("file", file);

  const targetEndpoint =
    mode === "local" ? localEndpoint || imagionDetectionEndpoint : imagionDetectionEndpoint;
  const isLocalMode = mode === "local";
  const headers: Record<string, string> = {
    "x-detection-source": isLocalMode ? "extension-local" : "extension",
  };
  if (!isLocalMode) {
    headers["x-api-key"] = imagionApiKey;
  }

  let response: Response;
  try {
    response = await fetch(targetEndpoint, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(LOG_PREFIX, "Detection request failed:", {
      imageUrl,
      endpoint: targetEndpoint,
      mode,
      error: errorMessage,
      errorType: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    recordTelemetry({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl, error: errorMessage, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message: `${isLocalMode ? "Local" : "API"} detection failed: ${errorMessage}`,
    }, imageHash ?? undefined);
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(LOG_PREFIX, "Failed to parse detection response JSON:", {
      imageUrl,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      error: errorMessage,
      mode,
    });
    recordTelemetry({
      level: "error",
      message: "invalid_json",
      details: { imageUrl, status: response.status, error: errorMessage, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message: `Failed to parse response (status ${response.status}): ${errorMessage}`,
    }, imageHash ?? undefined);
    return;
  }

  if (response.status === 429) {
    const rateLimitBody = payload as {
      message?: string;
      badgeLabel?: string;
      retryAfter?: number;
      errorType?: string;
    };
    const headerRetry = parseRetryAfter(response.headers.get("Retry-After"), BACKOFF_MIN_MS);
    const effectiveRetryAfter = rateLimitBody.retryAfter ?? headerRetry;
    const limitReason: RateLimitReason =
      rateLimitBody.errorType === "PLAN_LIMIT_EXCEEDED"
        ? "plan"
        : rateLimitBody.errorType === "DAILY_RATE_LIMIT_EXCEEDED"
          ? "daily"
          : "burst";
    applyRateLimitBackoff(effectiveRetryAfter, limitReason);
    console.warn(LOG_PREFIX, "Rate limited, retry after:", effectiveRetryAfter, "seconds", "mode:", mode);
    recordTelemetry({
      level: "warning",
      message: "rate_limited",
      details: {
        imageUrl,
        retryAfter: effectiveRetryAfter,
        badgeLabel: rateLimitBody.badgeLabel,
        errorType: rateLimitBody.errorType,
        mode,
      },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "rate-limit",
      message: rateLimitBody.message ?? `Rate limit exceeded. Retrying in ${effectiveRetryAfter} seconds.`,
      retryAfterSeconds: effectiveRetryAfter,
      badgeLabel: rateLimitBody.badgeLabel,
      errorType: rateLimitBody.errorType,
    }, imageHash ?? undefined);
    return;
  }

  if (!response.ok) {
    const errorBody = payload as { message?: string; error?: string; details?: unknown };
    const message = errorBody.message || errorBody.error || "Detection failed";
    console.error(LOG_PREFIX, "Detection error response:", {
      status: response.status,
      statusText: response.statusText,
      message,
      imageUrl,
      mode,
      fullResponse: errorBody,
    });
    recordTelemetry({
      level: "error",
      message: "detection_error",
      details: { imageUrl, responseStatus: response.status, message, fullResponse: errorBody, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message,
    }, imageHash ?? undefined);
    return;
  }

  const structuredPayload = payload as {
    verdict?: string;
    score?: number;
    confidence?: number;
    presentation?: string;
    message?: string;
    error?: string;
  };

  if (!structuredPayload.verdict) {
    const errorMessage = structuredPayload.message || structuredPayload.error || "Detection returned no verdict.";
    console.error(LOG_PREFIX, "Detection response lacked verdict:", {
      imageUrl,
      responseStatus: response.status,
      payload: structuredPayload,
      rawPayload: payload,
      mode,
    });
    recordTelemetry({
      level: "error",
      message: "no_verdict_returned",
      details: { imageUrl, responseStatus: response.status, rawPayload: payload, mode },
    });
    dispatchResponse(imageUrl, requestKey, {
      status: "error",
      message: errorMessage,
    }, imageHash ?? undefined);
    return;
  }

  const successPayload: DetectionResponsePayload = {
    status: "success",
    verdict: structuredPayload.verdict,
    score: structuredPayload.score,
    confidence: structuredPayload.confidence,
    presentation: structuredPayload.presentation,
  };

  recordTelemetry({
    level: "info",
    message: "detection_success",
    details: { imageUrl, score: structuredPayload.score, verdict: structuredPayload.verdict, mode },
  });

  setCacheEntry(requestKey, successPayload);
  if (imageHash) {
    void recordHashHistory(imageHash, successPayload, mode);
  }
  dispatchResponse(imageUrl, requestKey, successPayload, imageHash ?? undefined);

  if (
    structuredPayload.verdict &&
    AI_VERDICTS.has(structuredPayload.verdict.toLowerCase()) &&
    typeof structuredPayload.score === "number" &&
    structuredPayload.score >= HIGH_CONFIDENCE_AI_THRESHOLD
  ) {
    sendHighConfidenceNotification(imageUrl, structuredPayload.verdict, structuredPayload.score);
  }
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

function dispatchResponse(
  imageUrl: string,
  requestKey: string,
  payload: DetectionResponsePayload,
  hash?: string
) {
  const entry = pendingRequests.get(requestKey);
  if (!entry) {
    return;
  }
  entry.resolvers.forEach(({ badgeId, resolve }) => {
    resolve({ ...payload, badgeId, imageUrl, hash });
  });
  pendingRequests.delete(requestKey);
}

function getCachedResult(requestKey: string): DetectionResponsePayload | null {
  const entry = cache.get(requestKey);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > REQUEST_TTL_MS) {
    cache.delete(requestKey);
    return null;
  }
  cache.delete(requestKey);
  cache.set(requestKey, entry);
  return entry.payload;
}

function setCacheEntry(requestKey: string, payload: DetectionResponsePayload) {
  if (cache.has(requestKey)) {
    cache.delete(requestKey);
  }
  cache.set(requestKey, { timestamp: Date.now(), payload });
  evictCacheIfNeeded();
}

function evictCacheIfNeeded() {
  if (cache.size <= MAX_CACHE_SIZE) {
    return;
  }
  const excess = cache.size - MAX_CACHE_SIZE;
  const keysIterator = cache.keys();
  for (let i = 0; i < excess; i++) {
    const next = keysIterator.next();
    if (next.done) {
      break;
    }
    cache.delete(next.value);
  }
}

function sweepExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > REQUEST_TTL_MS) {
      cache.delete(key);
    }
  }
}

async function loadHashHistory(): Promise<void> {
  const items = await browser.storage.local.get(STORAGE_KEYS.HASH_HISTORY);
  const stored = items[STORAGE_KEYS.HASH_HISTORY];
  if (Array.isArray(stored)) {
    hashHistory = stored.filter(isHashHistoryEntry);
    if (hashHistory.length > MAX_HASH_HISTORY) {
      hashHistory = hashHistory.slice(0, MAX_HASH_HISTORY);
    }
  } else {
    hashHistory = [];
  }
}

async function ensureHashHistoryLoaded(): Promise<void> {
  await hashHistoryReady;
}

async function findHashHistoryEntry(hash: string, mode: DetectionMode): Promise<HashHistoryEntry | undefined> {
  await ensureHashHistoryLoaded();
  return hashHistory.find((entry) => entry.hash === hash && entry.mode === mode);
}

async function recordHashHistory(hash: string, payload: DetectionResponsePayload, mode: DetectionMode): Promise<void> {
  await ensureHashHistoryLoaded();
  hashHistory = hashHistory.filter((entry) => entry.hash !== hash || entry.mode !== mode);
  hashHistory.unshift({ hash, payload, mode, createdAt: Date.now() });
  if (hashHistory.length > MAX_HASH_HISTORY) {
    hashHistory.length = MAX_HASH_HISTORY;
  }
  persistHashHistory();
}

function persistHashHistory() {
  browser.storage.local.set({ [STORAGE_KEYS.HASH_HISTORY]: hashHistory });
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
    browser.action.setBadgeText({ text: RATE_LIMIT_BADGE_TEXT });
    browser.action.setBadgeBackgroundColor({ color: RATE_LIMIT_BADGE_COLOR });
  } else {
    browser.action.setBadgeText({ text: "" });
    browser.action.setBadgeBackgroundColor({ color: "#000000" });
  }
}

async function persistRateLimitIndicator(state: RateLimitIndicator | null) {
  if (state) {
    await browser.storage.local.set({ [STORAGE_KEYS.RATE_LIMIT_STATE]: state });
  } else {
    await browser.storage.local.remove(STORAGE_KEYS.RATE_LIMIT_STATE);
  }
}

function setRateLimitIndicator(state: RateLimitIndicator | null) {
  applyLimitBadge(Boolean(state));
  void persistRateLimitIndicator(state);
}

async function loadRateLimitIndicator(): Promise<void> {
  const items = await browser.storage.local.get(STORAGE_KEYS.RATE_LIMIT_STATE);
  const stored = items[STORAGE_KEYS.RATE_LIMIT_STATE];
  if (isRateLimitIndicator(stored) && stored.expiresAt > Date.now()) {
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
    await browser.storage.local.remove(STORAGE_KEYS.RATE_LIMIT_STATE);
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
  void browser.storage.local.set({ [STORAGE_KEYS.TELEMETRY]: telemetryEntries });
}

async function handleContextMenuDetection(srcUrl: string, tab: browser.tabs.Tab | undefined) {
  const pageUrl = tab?.url ?? "";
  const normalizedUrl = normalizeImageUrl(srcUrl, pageUrl);
  if (!normalizedUrl) {
    console.warn(LOG_PREFIX, "Context menu: invalid image URL:", srcUrl);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Imagion",
      message: "Unable to resolve image URL.",
    });
    return;
  }


  try {
    const config = await getConfig();
    const mode = config.detectionMode;

    let blob: Blob;
    try {
      blob = await fetchImageBytes(normalizedUrl);
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      await browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Imagion",
        message: `Failed to fetch image: ${errMsg}`,
      });
      return;
    }

    if (blob.size > MAX_IMAGE_UPLOAD_BYTES) {
      await browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Imagion",
        message: "Image too large. Maximum allowed size is 10 MB.",
      });
      return;
    }

    if (mode === "api" && !config.imagionApiKey) {
      await browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Imagion",
        message: "Please provide an Imagion API key in the options page.",
      });
      return;
    }

    let imageHash: string | null = null;
    try {
      imageHash = await hashBlobSHA256(blob);
    } catch {
      // non-fatal
    }

    const formData = new FormData();
    const fileName = extractFileName(normalizedUrl);
    const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
    formData.append("file", file);

    const targetEndpoint =
      mode === "local"
        ? config.localDetectionEndpoint || config.imagionDetectionEndpoint
        : config.imagionDetectionEndpoint;
    const isLocalMode = mode === "local";

    const headers: Record<string, string> = {
      "x-detection-source": isLocalMode ? "extension-local" : "extension",
    };
    if (!isLocalMode) {
      headers["x-api-key"] = config.imagionApiKey;
    }

    const response = await fetch(targetEndpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const msg = (errBody as { message?: string })?.message || `Detection failed (${response.status})`;
      await browser.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Imagion",
        message: msg,
      });
      return;
    }

    const result = await response.json();
    const verdict = result.verdict ?? "Unknown";
    const score = typeof result.score === "number" ? result.score : null;
    const scoreText = score !== null ? ` (score: ${(score * 100).toFixed(0)}%)` : "";

    await browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `Imagion: ${verdict}`,
      message: `Verdict: ${verdict}${scoreText}`,
    });

    if (result.verdict) {
      const successPayload: DetectionResponsePayload = {
        status: "success",
        verdict: result.verdict,
        score: result.score,
        confidence: result.confidence,
        presentation: result.presentation,
      };
      const requestKey = buildRequestKey(normalizedUrl, mode);
      setCacheEntry(requestKey, successPayload);
      if (imageHash) {
        void recordHashHistory(imageHash, successPayload, mode);
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(LOG_PREFIX, "Context menu detection failed:", errMsg);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Imagion",
      message: `Detection failed: ${errMsg}`,
    });
  }
}

function sendHighConfidenceNotification(imageUrl: string, verdict: string, score: number) {
  const scorePercent = (score * 100).toFixed(0);
  const truncatedUrl = imageUrl.length > 60 ? `${imageUrl.substring(0, 57)}...` : imageUrl;
  void browser.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "AI Image Detected",
    message: `Verdict: ${verdict} (${scorePercent}% confidence)\n${truncatedUrl}`,
  });
}

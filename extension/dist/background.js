"use strict";
const DEFAULT_DETECTION_ENDPOINT = "http://localost:3000/api/detect";
const REQUEST_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_DETECTIONS = 3;
const TELEMETRY_KEY = "imagionTelemetry";
const TELEMETRY_LIMIT = 40;
const BACKOFF_MIN_MS = 15000;
const BACKOFF_MAX_MS = 60000;
const cache = new Map();
const pendingRequests = new Map();
const detectionQueue = [];
const telemetryEntries = [];
let runningDetections = 0;
let cachedConfig = null;
let nextAllowedTimestamp = 0;
let backoffTimer = null;
async function getConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const config = await new Promise((resolve) => {
        chrome.storage.local.get({
            imagionApiKey: "",
            imagionDetectionEndpoint: DEFAULT_DETECTION_ENDPOINT,
        }, (items) => {
            resolve({
                imagionApiKey: typeof items.imagionApiKey === "string" ? items.imagionApiKey.trim() : "",
                imagionDetectionEndpoint: typeof items.imagionDetectionEndpoint === "string" && items.imagionDetectionEndpoint.trim().length > 0
                    ? items.imagionDetectionEndpoint.trim()
                    : DEFAULT_DETECTION_ENDPOINT,
            });
        });
    });
    cachedConfig = config;
    return config;
}
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
        return;
    }
    if (changes.imagionApiKey || changes.imagionDetectionEndpoint) {
        cachedConfig = null;
    }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "REQUEST_DETECTION") {
        return false;
    }
    handleImageDetection(message, sendResponse);
    return true;
});
function handleImageDetection(message, sendResponse) {
    const normalizedUrl = normalizeImageUrl(message.imageUrl, message.pageUrl);
    if (!normalizedUrl) {
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
        sendResponse({ ...cached, badgeId: message.badgeId, imageUrl: normalizedUrl });
        return;
    }
    const existing = pendingRequests.get(normalizedUrl);
    if (existing) {
        existing.resolvers.push({ badgeId: message.badgeId, sendResponse });
        return;
    }
    pendingRequests.set(normalizedUrl, { resolvers: [{ badgeId: message.badgeId, sendResponse }] });
    detectionQueue.push({ imageUrl: normalizedUrl });
    processQueue();
}
function normalizeImageUrl(imageUrl, pageUrl) {
    if (!imageUrl) {
        return null;
    }
    try {
        return new URL(imageUrl, pageUrl || undefined).toString();
    }
    catch (error) {
        console.warn("Invalid image URL", imageUrl, error);
        return null;
    }
}
function getCachedResult(imageUrl) {
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
        return;
    }
    while (runningDetections < MAX_CONCURRENT_DETECTIONS && detectionQueue.length > 0) {
        const job = detectionQueue.shift();
        if (!job) {
            continue;
        }
        runningDetections += 1;
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
async function runDetection(imageUrl) {
    const { imagionApiKey, imagionDetectionEndpoint } = await getConfig();
    if (!imagionApiKey) {
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
    let blob;
    try {
        blob = await fetchImageBytes(imageUrl);
    }
    catch (error) {
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
    let response;
    try {
        response = await fetch(imagionDetectionEndpoint, {
            method: "POST",
            headers: {
                "x-api-key": imagionApiKey,
            },
            body: formData,
        });
    }
    catch (error) {
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
    let payload;
    try {
        payload = await response.json();
    }
    catch (error) {
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
        const message = payload?.message || "Detection failed";
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
    const structuredPayload = payload;
    const successPayload = {
        status: "success",
        verdict: structuredPayload.verdict,
        score: structuredPayload.score,
        confidence: structuredPayload.confidence,
        presentation: structuredPayload.presentation,
    };
    recordTelemetry({
        level: "info",
        message: "detection_success",
        details: { imageUrl, score: structuredPayload.score, verdict: structuredPayload.verdict },
    });
    cache.set(imageUrl, { timestamp: Date.now(), payload: successPayload });
    dispatchResponse(imageUrl, successPayload);
}
async function fetchImageBytes(url) {
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
function extractFileName(url) {
    try {
        const parsed = new URL(url);
        const pieces = parsed.pathname.split("/").filter(Boolean);
        const lastSegment = pieces[pieces.length - 1];
        return lastSegment || "imagion-image.jpg";
    }
    catch {
        return "imagion-image.jpg";
    }
}
function dispatchResponse(imageUrl, payload) {
    const entry = pendingRequests.get(imageUrl);
    if (!entry) {
        return;
    }
    entry.resolvers.forEach(({ badgeId, sendResponse }) => {
        sendResponse({ ...payload, badgeId, imageUrl });
    });
    pendingRequests.delete(imageUrl);
}
function parseRetryAfter(header) {
    if (!header) {
        return BACKOFF_MIN_MS / 1000;
    }
    const parsed = Number.parseInt(header, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return BACKOFF_MIN_MS / 1000;
}
function applyRateLimitBackoff(seconds) {
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
function recordTelemetry(entry) {
    telemetryEntries.push({ timestamp: Date.now(), ...entry });
    if (telemetryEntries.length > TELEMETRY_LIMIT) {
        telemetryEntries.shift();
    }
    chrome.storage.local.set({ [TELEMETRY_KEY]: telemetryEntries });
}

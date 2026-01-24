const DEFAULT_DETECTION_ENDPOINT = "https://imagion.ai/api/detect";
const REQUEST_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_DETECTIONS = 3;

type ImagionConfig = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
};

type DetectionResponsePayload = {
  status: "success" | "missing-key" | "error";
  verdict?: string;
  score?: number;
  confidence?: number;
  presentation?: string;
  message?: string;
};

type PendingResolver = {
  badgeId: string;
  sendResponse: (response: DetectionResponse) => void;
};

type PendingRequest = {
  resolvers: PendingResolver[];
};

type DetectionResponse = DetectionResponsePayload & {
  badgeId: string;
  imageUrl: string;
};

const cache = new Map<string, { timestamp: number; payload: DetectionResponsePayload }>();
const pendingRequests = new Map<string, PendingRequest>();
const detectionQueue: Array<{ imageUrl: string }> = [];
let runningDetections = 0;
let cachedConfig: ImagionConfig | null = null;

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

function handleImageDetection(message: {
  type: "REQUEST_DETECTION";
  imageUrl: string;
  badgeId: string;
  pageUrl: string;
}, sendResponse: (response: DetectionResponse) => void) {
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

function normalizeImageUrl(imageUrl: string, pageUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }
  try {
    return new URL(imageUrl, pageUrl || undefined).toString();
  } catch (error) {
    console.warn("Invalid image URL", imageUrl, error);
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

async function runDetection(imageUrl: string) {
  const { imagionApiKey, imagionDetectionEndpoint } = await getConfig();

  if (!imagionApiKey) {
    dispatchResult(imageUrl, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page.",
    });
    return;
  }

  let blob: Blob;
  try {
    blob = await fetchImageBytes(imageUrl);
  } catch (error) {
    dispatchError(imageUrl, error);
    return;
  }

  const formData = new FormData();
  const fileName = extractFileName(imageUrl);
  const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(imagionDetectionEndpoint, {
      method: "POST",
      headers: {
        "x-api-key": imagionApiKey,
      },
      body: formData,
    });
  } catch (error) {
    dispatchError(imageUrl, error);
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    dispatchError(imageUrl, error);
    return;
  }

  if (!response.ok) {
    const message = (payload as { message?: string })?.message || "Detection failed";
    dispatchError(imageUrl, new Error(message));
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

  cache.set(imageUrl, { timestamp: Date.now(), payload: successPayload });
  dispatchResult(imageUrl, successPayload);
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

function dispatchResult(imageUrl: string, payload: DetectionResponsePayload) {
  const entry = pendingRequests.get(imageUrl);
  if (!entry) {
    return;
  }
  entry.resolvers.forEach(({ badgeId, sendResponse }) => {
    sendResponse({ ...payload, badgeId, imageUrl });
  });
  pendingRequests.delete(imageUrl);
}

function dispatchError(imageUrl: string, error: unknown) {
  const entry = pendingRequests.get(imageUrl);
  if (!entry) {
    return;
  }
  const message = error instanceof Error ? error.message : "Detection failed.";
  entry.resolvers.forEach(({ badgeId, sendResponse }) => {
    sendResponse({
      status: "error",
      message,
      badgeId,
      imageUrl,
    });
  });
  pendingRequests.delete(imageUrl);
}

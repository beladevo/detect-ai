const LOG_PREFIX = "[Imagion Content]";
const STYLE_ID = "imagion-badge-style";
const MAX_TRACKED_IMAGES = 200;
const MIN_IMAGE_SIZE = 50; // Minimum width/height to track
const trackedImages = new Map<HTMLImageElement, { badge: HTMLDivElement; wrapper: HTMLSpanElement }>();
let badgeCounter = 0;
let positionScheduled = false;
let scanScheduled = false;
const state = {
  enabled: true,
};

type BadgeResponse = {
  status?: "success" | "missing-key" | "error" | "rate-limit";
  verdict?: string;
  score?: number;
  confidence?: number;
  presentation?: string;
  message?: string;
  badgeId: string;
  imageUrl?: string;
  retryAfterSeconds?: number;
  badgeLabel?: string;
};

type ContentLocaleStrings = {
  aiLabel: string;
  realLabel: string;
  errorLabel: string;
  loginLabel: string;
  badgePrefix: string;
  tooltipFallback: string;
  rateLimitLabel: string;
  disabledHostMessage: string;
};

const TRANSLATIONS: Record<string, ContentLocaleStrings> = {
  en: {
    aiLabel: "AI",
    realLabel: "Real",
    errorLabel: "Error",
    loginLabel: "Log in",
    badgePrefix: "Imagion badge",
    tooltipFallback: "Imagion verdict",
    rateLimitLabel: "Rate limited",
    disabledHostMessage: "Badges paused on this host.",
  },
  es: {
    aiLabel: "IA",
    realLabel: "Real",
    errorLabel: "Error",
    loginLabel: "Iniciar sesión",
    badgePrefix: "Insignia Imagion",
    tooltipFallback: "Veredicto de Imagion",
    rateLimitLabel: "Límite de velocidad",
    disabledHostMessage: "Insignias pausadas en este host.",
  },
};

const localeCode = navigator.language.split("-")[0];
const localized = TRANSLATIONS[localeCode] ?? TRANSLATIONS.en;

const badgeStyle = `
.imagion-wrapper {
  position: relative !important;
  display: inline-block !important;
}
.imagion-badge {
  position: absolute !important;
  top: 6px !important;
  right: 6px !important;
  pointer-events: auto !important;
  cursor: default !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 3px 8px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  border-radius: 4px !important;
  background: rgba(100, 100, 100, 0.9) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
  letter-spacing: 0.02em !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  text-transform: uppercase !important;
  white-space: nowrap !important;
  margin: 0 !important;
  border: none !important;
  text-decoration: none !important;
  line-height: 1.2 !important;
}
.imagion-badge__logo {
  width: 14px !important;
  height: 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 3px !important;
  background: #fff !important;
  color: #1a1a2e !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  padding: 0 !important;
}
.imagion-badge__label {
  line-height: 1 !important;
}
.imagion-badge--pending {
  background: rgba(100, 100, 100, 0.9) !important;
}
.imagion-badge--ai {
  background: rgba(220, 53, 69, 0.95) !important;
}
.imagion-badge--real {
  background: rgba(40, 167, 69, 0.95) !important;
}
.imagion-badge--error {
  background: rgba(255, 69, 96, 0.9) !important;
}
.imagion-badge--missing-key {
  background: rgba(255, 193, 7, 0.95) !important;
  color: #1a1a1a !important;
}
`;

function insertBadgeStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = badgeStyle;
  (document.head || document.documentElement).appendChild(style);
  console.log(LOG_PREFIX, "Badge styles injected");
}

function schedulePositionUpdate() {
  if (positionScheduled) {
    return;
  }
  positionScheduled = true;
  requestAnimationFrame(() => {
    positionScheduled = false;
    updateAllBadgePositions();
  });
}

function scheduleScan() {
  if (scanScheduled) {
    return;
  }
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    scanForImages();
  });
}

function updateAllBadgePositions() {
  for (const [img, meta] of trackedImages) {
    if (!img.isConnected) {
      removeBadgeAndWrapper(img, meta);
      trackedImages.delete(img);
    }
  }
}

function removeBadgeAndWrapper(img: HTMLImageElement, meta: { badge: HTMLDivElement; wrapper: HTMLSpanElement }) {
  const { badge, wrapper } = meta;
  badge.remove();
  // Restore image to its original position
  if (wrapper.parentNode) {
    wrapper.parentNode.insertBefore(img, wrapper);
    wrapper.remove();
  }
}

function shouldSkipScanning() {
  return !state.enabled || isHostBlocked(window.location.hostname);
}

function scanForImages() {
  if (shouldSkipScanning()) {
    console.log(LOG_PREFIX, "Scanning skipped (disabled or host blocked)");
    removeAllBadges();
    return;
  }
  const images = Array.from(document.images) as HTMLImageElement[];
  const newImages = images.filter((img) => shouldTrackImage(img));
  if (newImages.length > 0) {
    console.log(LOG_PREFIX, `Found ${newImages.length} new images to track (total on page: ${images.length})`);
  }
  for (const img of newImages) {
    attachBadge(img);
  }
}

function shouldTrackImage(img: HTMLImageElement) {
  if (trackedImages.has(img)) {
    return false;
  }
  if (trackedImages.size >= MAX_TRACKED_IMAGES) {
    return false;
  }
  if (!img.src) {
    return false;
  }
  // Skip data URIs
  if (img.src.startsWith("data:")) {
    return false;
  }
  // Skip tiny images (icons, avatars, etc.)
  const rect = img.getBoundingClientRect();
  if (rect.width < MIN_IMAGE_SIZE || rect.height < MIN_IMAGE_SIZE) {
    return false;
  }
  // Skip images that are not visible
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  return true;
}

function attachBadge(img: HTMLImageElement) {
  const badge = document.createElement("div");
  badge.className = "imagion-badge imagion-badge--pending";
  badge.setAttribute("role", "status");
  badge.setAttribute("lang", localeCode);
  badge.innerHTML = `<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">...</span>`;
  updateBadgeAria(badge, "Analyzing");
  badge.dataset.requestState = "pending";
  const badgeId = `imagion-${++badgeCounter}`;
  badge.dataset.requestId = badgeId;

  // Wrap image in a container and insert badge as sibling
  const wrapper = document.createElement("span");
  wrapper.className = "imagion-wrapper";

  // Match the image's z-index
  const computedStyle = window.getComputedStyle(img);
  const imgZIndex = computedStyle.zIndex;
  if (imgZIndex && imgZIndex !== "auto") {
    wrapper.style.zIndex = imgZIndex;
  }

  const parent = img.parentNode;
  if (parent) {
    parent.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(badge);
  }

  trackedImages.set(img, { badge, wrapper });

  requestDetection(img, badge, badgeId);
}

function requestDetection(img: HTMLImageElement, badge: HTMLDivElement, badgeId: string) {
  const imageUrl = img.currentSrc || img.src;
  if (!imageUrl || imageUrl.startsWith("data:")) {
    console.log(LOG_PREFIX, `Skipping data URI for ${badgeId}`);
    updateBadgeFromResponse(badge, {
      status: "error",
      message: "Unable to analyze data URI.",
      badgeId,
    });
    return;
  }

  console.log(LOG_PREFIX, `Requesting detection for ${badgeId}:`, imageUrl.substring(0, 100));

  const payload = {
    type: "REQUEST_DETECTION" as const,
    imageUrl,
    badgeId,
    pageUrl: window.location.href,
  };

  sendDetectionRequest(payload)
    .then((response) => {
      console.log(LOG_PREFIX, `Response for ${badgeId}:`, response.status, response.verdict || response.message);
      updateBadgeFromResponse(badge, response);
    })
    .catch((error) => {
      console.error(LOG_PREFIX, `Error for ${badgeId}:`, error);
      updateBadgeFromResponse(badge, {
        status: "error",
        message: error?.message || "Detection request failed.",
        badgeId,
      });
    });
}

function sendDetectionRequest(payload: {
  type: "REQUEST_DETECTION";
  imageUrl: string;
  badgeId: string;
  pageUrl: string;
}): Promise<BadgeResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.error(LOG_PREFIX, "Runtime error:", chrome.runtime.lastError.message);
        resolve({
          status: "error",
          message: chrome.runtime.lastError.message,
          badgeId: payload.badgeId,
        });
        return;
      }
      resolve(response as BadgeResponse);
    });
  });
}

function updateBadgeFromResponse(badge: HTMLDivElement, response: BadgeResponse) {
  if (!badge || !response) {
    return;
  }

  if (badge.dataset.requestId !== response.badgeId) {
    return;
  }

  const label = badge.querySelector(".imagion-badge__label");
  if (!label) {
    return;
  }

  badge.classList.remove(
    "imagion-badge--pending",
    "imagion-badge--ai",
    "imagion-badge--real",
    "imagion-badge--error",
    "imagion-badge--missing-key"
  );

  if (response.status === "success" && response.verdict) {
    const verdict = response.verdict.toLowerCase();
    if (verdict === "ai" || verdict === "fake" || verdict === "ai_generated" || verdict === "likely_ai") {
      badge.classList.add("imagion-badge--ai");
      label.textContent = localized.aiLabel;
      updateBadgeAria(badge, localized.aiLabel);
    } else {
      badge.classList.add("imagion-badge--real");
      label.textContent = localized.realLabel;
      updateBadgeAria(badge, localized.realLabel);
    }
    badge.title = createTooltip(response);
    badge.dataset.requestState = "success";
  } else if (response.status === "missing-key") {
    badge.classList.add("imagion-badge--missing-key");
    label.textContent = localized.loginLabel;
    updateBadgeAria(badge, localized.loginLabel);
    badge.title = response.message || "Click the Imagion icon to sign in.";
    badge.dataset.requestState = "key-required";
  } else if (response.status === "rate-limit") {
    const rateLimitLabel = response.badgeLabel ?? localized.rateLimitLabel;
    badge.classList.add("imagion-badge--error");
    label.textContent = rateLimitLabel;
    updateBadgeAria(badge, rateLimitLabel);
    badge.title = response.message || localized.disabledHostMessage;
    badge.dataset.requestState = "rate-limit";
  } else {
    badge.classList.add("imagion-badge--error");
    label.textContent = localized.errorLabel;
    updateBadgeAria(badge, localized.errorLabel);
    badge.title = response.message || "Detection failed.";
    badge.dataset.requestState = "error";
  }
}

function updateBadgeAria(badge: HTMLDivElement, text: string) {
  badge.setAttribute("aria-label", `${localized.badgePrefix}: ${text}`);
}

function createTooltip(response: BadgeResponse) {
  const parts: string[] = [];
  if (response.verdict) {
    parts.push(`Verdict: ${response.verdict}`);
  }
  if (response.score != null) {
    parts.push(`Score: ${(Number(response.score) * 100).toFixed(0)}%`);
  }
  if (response.confidence != null) {
    parts.push(`Confidence: ${(Number(response.confidence) * 100).toFixed(0)}%`);
  }
  if (response.presentation) {
    parts.push(response.presentation);
  }
  return parts.length ? parts.join("\n") : localized.tooltipFallback;
}

function removeAllBadges() {
  const count = trackedImages.size;
  for (const [img, meta] of trackedImages) {
    removeBadgeAndWrapper(img, meta);
  }
  trackedImages.clear();
  if (count > 0) {
    console.log(LOG_PREFIX, `Removed ${count} badges`);
  }
}

function updateDisabledHosts(items: Record<string, unknown>) {
  const storedHosts = Array.isArray(items.imagionDisabledHosts) ? items.imagionDisabledHosts : [];
  const normalized = storedHosts
    .map((host) => normalizeHostname(host))
    .filter((value): value is string => Boolean(value));
  disabledHostsSet = new Set(normalized);
  if (normalized.length > 0) {
    console.log(LOG_PREFIX, "Disabled hosts:", normalized);
  }
}

function normalizeHostname(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

function isHostBlocked(host: string) {
  const normalized = normalizeHostname(host);
  if (!normalized) {
    return false;
  }
  const candidate = normalized.startsWith("www.") ? normalized.slice(4) : normalized;
  return disabledHostsSet.has(normalized) || disabledHostsSet.has(candidate);
}

let disabledHostsSet = new Set<string>();

function syncSettings() {
  chrome.storage.local.get(
    { imagionBadgeEnabled: true, imagionDisabledHosts: [] },
    (items) => {
      const enabled = items.imagionBadgeEnabled !== false;
      state.enabled = enabled;
      updateDisabledHosts(items);

      console.log(LOG_PREFIX, "Settings synced:", { enabled, hostBlocked: isHostBlocked(window.location.hostname) });

      if (shouldSkipScanning()) {
        removeAllBadges();
        return;
      }
      if (state.enabled) {
        scheduleScan();
      } else {
        removeAllBadges();
      }
    }
  );
}

function init() {
  console.log(LOG_PREFIX, "Initializing on", window.location.hostname);

  insertBadgeStyles();
  syncSettings();

  // Initial scan after a short delay to let images load
  setTimeout(() => {
    scanForImages();
    schedulePositionUpdate();
  }, 500);

  const observerTarget = document.documentElement || document.body;
  if (observerTarget) {
    const mutationObserver = new MutationObserver(() => scheduleScan());
    mutationObserver.observe(observerTarget, { childList: true, subtree: true });
    console.log(LOG_PREFIX, "MutationObserver attached");
  }

  window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
  window.addEventListener("resize", schedulePositionUpdate);
  chrome.storage.onChanged.addListener(syncSettings);

  console.log(LOG_PREFIX, "Initialization complete");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};

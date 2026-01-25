const LOG_PREFIX = "[Imagion Content]";
const STYLE_ID = "imagion-badge-style";
const MAX_TRACKED_IMAGES = 200;
const MIN_IMAGE_SIZE = 50; // Minimum width/height to track

// Skip extension on our own domains to prevent React hydration errors
const EXCLUDED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "imagion.ai",
  "www.imagion.ai",
];
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
  hash?: string;
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
  z-index: 10000 !important;
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

/* Hover Card Styles - MagicUI inspired */
.imagion-hover-card {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  margin-top: 8px !important;
  min-width: 220px !important;
  max-width: 280px !important;
  padding: 12px 14px !important;
  background: rgba(15, 15, 20, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: #fff !important;
  z-index: 10001 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transform: translateY(-4px) !important;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s !important;
  pointer-events: none !important;
}
.imagion-badge:hover .imagion-hover-card {
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}
.imagion-hover-card__header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-bottom: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.imagion-hover-card__verdict {
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
.imagion-hover-card__verdict--ai {
  color: #ff6b7a !important;
}
.imagion-hover-card__verdict--real {
  color: #6bff8e !important;
}
.imagion-hover-card__verdict--error {
  color: #ffaa6b !important;
}
.imagion-hover-card__row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 6px !important;
  font-size: 12px !important;
}
.imagion-hover-card__label {
  color: rgba(255, 255, 255, 0.6) !important;
  font-weight: 400 !important;
}
.imagion-hover-card__value {
  color: #fff !important;
  font-weight: 500 !important;
}
.imagion-hover-card__bar {
  height: 4px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 2px !important;
  overflow: hidden !important;
  margin-top: 4px !important;
  margin-bottom: 8px !important;
}
.imagion-hover-card__bar-fill {
  height: 100% !important;
  border-radius: 2px !important;
  transition: width 0.3s ease !important;
}
.imagion-hover-card__bar-fill--ai {
  background: linear-gradient(90deg, #ff6b7a, #ff4d67) !important;
}
.imagion-hover-card__bar-fill--real {
  background: linear-gradient(90deg, #6bff8e, #28a745) !important;
}
.imagion-hover-card__hash {
  margin-top: 10px !important;
  padding-top: 8px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  font-size: 9px !important;
  color: rgba(255, 255, 255, 0.35) !important;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace !important;
  word-break: break-all !important;
  line-height: 1.4 !important;
}
.imagion-hover-card__hash-label {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 9px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  margin-bottom: 2px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
.imagion-hover-card__message {
  font-size: 11px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  line-height: 1.4 !important;
  margin-top: 6px !important;
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
  console.debug(LOG_PREFIX, "Badge styles injected");
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

function isExcludedDomain(hostname: string) {
  const normalized = hostname.toLowerCase();
  return EXCLUDED_DOMAINS.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

function shouldSkipScanning() {
  return !state.enabled || isHostBlocked(window.location.hostname) || isExcludedDomain(window.location.hostname);
}

function scanForImages() {
  if (shouldSkipScanning()) {
    console.debug(LOG_PREFIX, "Scanning skipped (disabled or host blocked)");
    removeAllBadges();
    return;
  }
  const images = Array.from(document.images) as HTMLImageElement[];
  const newImages = images.filter((img) => shouldTrackImage(img));
  if (newImages.length > 0) {
    console.debug(LOG_PREFIX, `Found ${newImages.length} new images to track (total on page: ${images.length})`);
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
    console.debug(LOG_PREFIX, `Skipping data URI for ${badgeId}`);
    updateBadgeFromResponse(badge, {
      status: "error",
      message: "Unable to analyze data URI.",
      badgeId,
    });
    return;
  }

  console.debug(LOG_PREFIX, `Requesting detection for ${badgeId}:`, imageUrl.substring(0, 100));

  const payload = {
    type: "REQUEST_DETECTION" as const,
    imageUrl,
    badgeId,
    pageUrl: window.location.href,
  };

  sendDetectionRequest(payload)
    .then((response) => {
      console.debug(LOG_PREFIX, `Response for ${badgeId}:`, response.status, response.verdict || response.message);
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

  // Remove existing hover card if any
  const existingCard = badge.querySelector(".imagion-hover-card");
  if (existingCard) {
    existingCard.remove();
  }

  // Handle success: either explicit status="success" OR has a verdict (for cached responses without status)
  const isSuccess = (response.status === "success" || response.status === undefined) && response.verdict;

  if (isSuccess) {
    const verdict = response.verdict!.toLowerCase();
    if (verdict === "ai" || verdict === "fake" || verdict === "ai_generated" || verdict === "likely_ai") {
      badge.classList.add("imagion-badge--ai");
      label.textContent = localized.aiLabel;
      updateBadgeAria(badge, localized.aiLabel);
    } else {
      badge.classList.add("imagion-badge--real");
      label.textContent = localized.realLabel;
      updateBadgeAria(badge, localized.realLabel);
    }
    badge.dataset.requestState = "success";
  } else if (response.status === "missing-key") {
    badge.classList.add("imagion-badge--missing-key");
    label.textContent = localized.loginLabel;
    updateBadgeAria(badge, localized.loginLabel);
    badge.dataset.requestState = "key-required";
  } else if (response.status === "rate-limit") {
    const rateLimitLabel = response.badgeLabel ?? localized.rateLimitLabel;
    badge.classList.add("imagion-badge--error");
    label.textContent = rateLimitLabel;
    updateBadgeAria(badge, rateLimitLabel);
    badge.dataset.requestState = "rate-limit";
  } else {
    console.error(LOG_PREFIX, `Badge error for ${response.badgeId}:`, {
      status: response.status,
      verdict: response.verdict,
      message: response.message,
      imageUrl: response.imageUrl,
      fullResponse: response,
    });
    badge.classList.add("imagion-badge--error");
    label.textContent = localized.errorLabel;
    updateBadgeAria(badge, localized.errorLabel);
    badge.dataset.requestState = "error";
  }

  // Add hover card with details
  badge.title = ""; // Clear native tooltip
  const hoverCard = createHoverCard(response);
  badge.appendChild(hoverCard);
}

function updateBadgeAria(badge: HTMLDivElement, text: string) {
  badge.setAttribute("aria-label", `${localized.badgePrefix}: ${text}`);
}

function createHoverCard(response: BadgeResponse): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "imagion-hover-card";

  const verdict = response.verdict?.toLowerCase() || "";
  const isAI = verdict === "ai" || verdict === "fake" || verdict === "ai_generated" || verdict === "likely_ai";
  // Handle success: either explicit status="success" OR has a verdict (for cached responses without status)
  const isSuccess = (response.status === "success" || response.status === undefined) && response.verdict;

  let html = "";

  // Header with verdict
  if (isSuccess) {
    const verdictClass = isAI ? "imagion-hover-card__verdict--ai" : "imagion-hover-card__verdict--real";
    const verdictLabel = isAI ? "AI Generated" : "Real Image";
    html += `<div class="imagion-hover-card__header">
      <span class="imagion-hover-card__verdict ${verdictClass}">${verdictLabel}</span>
    </div>`;
  } else if (response.status === "error" || response.status === "rate-limit") {
    html += `<div class="imagion-hover-card__header">
      <span class="imagion-hover-card__verdict imagion-hover-card__verdict--error">${response.status === "rate-limit" ? "Rate Limited" : "Error"}</span>
    </div>`;
  }

  // Score bar (only show for success)
  if (response.score != null && isSuccess) {
    const rawScore = Number(response.score);
    // Handle both 0-1 range and 0-100 range
    const scorePercent = rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);
    const barClass = isAI ? "imagion-hover-card__bar-fill--ai" : "imagion-hover-card__bar-fill--real";
    html += `<div class="imagion-hover-card__row">
      <span class="imagion-hover-card__label">AI Score</span>
      <span class="imagion-hover-card__value">${scorePercent}%</span>
    </div>
    <div class="imagion-hover-card__bar">
      <div class="imagion-hover-card__bar-fill ${barClass}" style="width: ${Math.min(scorePercent, 100)}%"></div>
    </div>`;
  }

  // Confidence (only show for success)
  if (response.confidence != null && isSuccess) {
    const rawConfidence = Number(response.confidence);
    // Handle both 0-1 range and 0-100 range
    const confidencePercent = rawConfidence > 1 ? Math.round(rawConfidence) : Math.round(rawConfidence * 100);
    html += `<div class="imagion-hover-card__row">
      <span class="imagion-hover-card__label">Confidence</span>
      <span class="imagion-hover-card__value">${confidencePercent}%</span>
    </div>`;
  }

  // Message (for errors) - always show for non-success states
  if (!isSuccess) {
    const errorMessage = response.message || "Detection failed. Please try again.";
    html += `<div class="imagion-hover-card__message">${escapeHtml(errorMessage)}</div>`;
  }

  // Hash
  if (response.hash) {
    const shortHash = response.hash.substring(0, 16) + "..." + response.hash.substring(response.hash.length - 8);
    html += `<div class="imagion-hover-card__hash">
      <div class="imagion-hover-card__hash-label">SHA-256</div>
      ${shortHash}
    </div>`;
  }

  card.innerHTML = html;
  return card;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function removeAllBadges() {
  const count = trackedImages.size;
  for (const [img, meta] of trackedImages) {
    removeBadgeAndWrapper(img, meta);
  }
  trackedImages.clear();
  if (count > 0) {
    console.debug(LOG_PREFIX, `Removed ${count} badges`);
  }
}

function updateDisabledHosts(items: Record<string, unknown>) {
  const storedHosts = Array.isArray(items.imagionDisabledHosts) ? items.imagionDisabledHosts : [];
  const normalized = storedHosts
    .map((host) => normalizeHostname(host))
    .filter((value): value is string => Boolean(value));
  disabledHostsSet = new Set(normalized);
  if (normalized.length > 0) {
    console.info(LOG_PREFIX, "Disabled hosts:", normalized);
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

      console.info(LOG_PREFIX, "Settings synced:", { enabled, hostBlocked: isHostBlocked(window.location.hostname) });

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
  console.info(LOG_PREFIX, "Initializing on", window.location.hostname);

  // Skip entirely on our own domains to prevent React hydration issues
  if (isExcludedDomain(window.location.hostname)) {
    console.info(LOG_PREFIX, "Skipping on excluded domain:", window.location.hostname);
    return;
  }

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
    console.debug(LOG_PREFIX, "MutationObserver attached");
  }

  window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
  window.addEventListener("resize", schedulePositionUpdate);
  chrome.storage.onChanged.addListener(syncSettings);

  console.info(LOG_PREFIX, "Initialization complete");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};

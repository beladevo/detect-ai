const STYLE_ID = "imagion-badge-style";
const MAX_TRACKED_IMAGES = 200;
const trackedImages = new Map();
let badgeCounter = 0;
let positionScheduled = false;
let scanScheduled = false;
const state = {
    enabled: true,
};
const TRANSLATIONS = {
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
.imagion-badge {
  position: absolute;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  background: rgba(44, 120, 255, 0.85);
  color: #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
  z-index: 2147483647;
  letter-spacing: 0.02em;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  text-transform: uppercase;
}
.imagion-badge__logo {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  color: #1c1c1c;
  font-size: 9px;
}
.imagion-badge__label {
  line-height: 1;
}
.imagion-badge--ai {
  background: rgba(124, 77, 255, 0.95);
}
.imagion-badge--real {
  background: rgba(0, 200, 138, 0.95);
}
.imagion-badge--error {
  background: rgba(255, 69, 96, 0.95);
}
.imagion-badge--missing-key {
  background: rgba(255, 195, 0, 0.95);
  color: #2b2b2b;
}
`;
function insertBadgeStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = badgeStyle;
    document.head.appendChild(style);
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
            meta.badge.remove();
            trackedImages.delete(img);
            continue;
        }
        updateBadgePosition(img, meta.badge);
    }
}
function shouldSkipScanning() {
    return !state.enabled || isHostBlocked(window.location.hostname);
}
function scanForImages() {
    if (shouldSkipScanning()) {
        removeAllBadges();
        return;
    }
    const images = Array.from(document.images);
    for (const img of images) {
        if (!shouldTrackImage(img)) {
            continue;
        }
        attachBadge(img);
    }
}
function shouldTrackImage(img) {
    if (trackedImages.has(img)) {
        return false;
    }
    if (trackedImages.size >= MAX_TRACKED_IMAGES) {
        return false;
    }
    if (!img.src) {
        return false;
    }
    return true;
}
function attachBadge(img) {
    const badge = document.createElement("div");
    badge.className = "imagion-badge";
    badge.setAttribute("role", "status");
    badge.setAttribute("lang", localeCode);
    badge.innerHTML = `<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">${localized.badgePrefix}</span>`;
    updateBadgeAria(badge, localized.badgePrefix);
    badge.dataset.requestState = "pending";
    const badgeId = `imagion-${++badgeCounter}`;
    badge.dataset.requestId = badgeId;
    document.body.appendChild(badge);
    trackedImages.set(img, { badge });
    schedulePositionUpdate();
    requestDetection(img, badge, badgeId);
}
function updateBadgePosition(img, badge) {
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        badge.style.display = "none";
        return;
    }
    badge.style.display = "inline-flex";
    const offset = 6;
    const x = window.scrollX + rect.left + rect.width - badge.offsetWidth - offset;
    const y = window.scrollY + rect.top + offset;
    badge.style.transform = `translate(${x}px, ${y}px)`;
}
function requestDetection(img, badge, badgeId) {
    const imageUrl = img.currentSrc || img.src;
    if (!imageUrl || imageUrl.startsWith("data:")) {
        updateBadgeFromResponse(badge, {
            status: "error",
            message: "Unable to analyze data URI.",
            badgeId,
        });
        return;
    }
    const payload = {
        type: "REQUEST_DETECTION",
        imageUrl,
        badgeId,
        pageUrl: window.location.href,
    };
    sendDetectionRequest(payload)
        .then((response) => {
        updateBadgeFromResponse(badge, response);
    })
        .catch((error) => {
        updateBadgeFromResponse(badge, {
            status: "error",
            message: error?.message || "Detection request failed.",
            badgeId,
        });
    });
}
function sendDetectionRequest(payload) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(payload, (response) => {
            if (chrome.runtime.lastError) {
                resolve({
                    status: "error",
                    message: chrome.runtime.lastError.message,
                    badgeId: payload.badgeId,
                });
                return;
            }
            resolve(response);
        });
    });
}
function updateBadgeFromResponse(badge, response) {
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
    badge.classList.remove("imagion-badge--ai", "imagion-badge--real", "imagion-badge--error", "imagion-badge--missing-key");
    if (response.status === "success" && response.verdict) {
        const verdict = response.verdict.toLowerCase();
        if (verdict === "ai" || verdict === "fake") {
            badge.classList.add("imagion-badge--ai");
            label.textContent = localized.aiLabel;
            updateBadgeAria(badge, localized.aiLabel);
        }
        else if (verdict === "real") {
            badge.classList.add("imagion-badge--real");
            label.textContent = localized.realLabel;
            updateBadgeAria(badge, localized.realLabel);
        }
        else {
            badge.classList.add("imagion-badge--real");
            label.textContent = localized.realLabel;
            updateBadgeAria(badge, localized.realLabel);
        }
        badge.title = createTooltip(response);
        badge.dataset.requestState = "success";
    }
    else if (response.status === "missing-key") {
        badge.classList.add("imagion-badge--missing-key");
        label.textContent = localized.loginLabel;
        updateBadgeAria(badge, localized.loginLabel);
        badge.title = response.message || "Add your API key via the Imagion extension options.";
        badge.dataset.requestState = "key-required";
    }
    else if (response.status === "rate-limit") {
        badge.classList.add("imagion-badge--error");
        label.textContent = localized.rateLimitLabel;
        updateBadgeAria(badge, localized.rateLimitLabel);
        badge.title = response.message || localized.disabledHostMessage;
        badge.dataset.requestState = "rate-limit";
    }
    else {
        badge.classList.add("imagion-badge--error");
        label.textContent = localized.errorLabel;
        updateBadgeAria(badge, localized.errorLabel);
        badge.title = response.message || "Detection failed.";
        badge.dataset.requestState = "error";
    }
}
function updateBadgeAria(badge, text) {
    badge.setAttribute("aria-label", `${localized.badgePrefix}: ${text}`);
}
function createTooltip(response) {
    const parts = [];
    if (response.score != null) {
        parts.push(`Score ${Number(response.score).toFixed(2)}`);
    }
    if (response.confidence != null) {
        parts.push(`Confidence ${Number(response.confidence).toFixed(2)}`);
    }
    if (response.presentation) {
        parts.push(response.presentation);
    }
    if (response.retryAfterSeconds) {
        parts.push(`Retry in ${response.retryAfterSeconds}s`);
    }
    return parts.length ? parts.join(" | ") : localized.tooltipFallback;
}
function removeAllBadges() {
    for (const [, meta] of trackedImages) {
        meta.badge.remove();
    }
    trackedImages.clear();
}
function updateDisabledHosts(items) {
    const storedHosts = Array.isArray(items.imagionDisabledHosts) ? items.imagionDisabledHosts : [];
    const normalized = storedHosts
        .map((host) => normalizeHostname(host))
        .filter((value) => Boolean(value));
    disabledHostsSet = new Set(normalized);
}
function normalizeHostname(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    try {
        const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
        return parsed.hostname.toLowerCase();
    }
    catch {
        return trimmed.toLowerCase();
    }
}
function isHostBlocked(host) {
    const normalized = normalizeHostname(host);
    if (!normalized) {
        return false;
    }
    const candidate = normalized.startsWith("www.") ? normalized.slice(4) : normalized;
    return disabledHostsSet.has(normalized) || disabledHostsSet.has(candidate);
}
let disabledHostsSet = new Set();
function syncSettings() {
    chrome.storage.local.get({ imagionBadgeEnabled: true, imagionDisabledHosts: [] }, (items) => {
        const enabled = items.imagionBadgeEnabled !== false;
        state.enabled = enabled;
        updateDisabledHosts(items);
        if (shouldSkipScanning()) {
            removeAllBadges();
            return;
        }
        if (state.enabled) {
            scheduleScan();
        }
        else {
            removeAllBadges();
        }
    });
}
function init() {
    insertBadgeStyles();
    syncSettings();
    scanForImages();
    schedulePositionUpdate();
    const observerTarget = document.documentElement || document.body;
    if (observerTarget) {
        const mutationObserver = new MutationObserver(() => scheduleScan());
        mutationObserver.observe(observerTarget, { childList: true, subtree: true });
    }
    window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
    window.addEventListener("resize", schedulePositionUpdate);
    chrome.storage.onChanged.addListener(syncSettings);
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
}
else {
    init();
}
export {};

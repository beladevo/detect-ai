"use strict";
const STYLE_ID = "imagion-badge-style";
const MAX_TRACKED_IMAGES = 200;
const trackedImages = new Map();
let badgeCounter = 0;
let positionScheduled = false;
let scanScheduled = false;
const state = {
    enabled: true,
};
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
    for (const [img, meta] of trackedImages.entries()) {
        if (!img.isConnected) {
            meta.badge.remove();
            trackedImages.delete(img);
            continue;
        }
        updateBadgePosition(img, meta.badge);
    }
}
function scanForImages() {
    if (!state.enabled) {
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
    badge.innerHTML = `<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">Imagion</span>`;
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
            label.textContent = "AI";
        }
        else if (verdict === "real") {
            badge.classList.add("imagion-badge--real");
            label.textContent = "Real";
        }
        else {
            badge.classList.add("imagion-badge--real");
            label.textContent = "Real";
        }
        badge.title = createTooltip(response);
        badge.dataset.requestState = "success";
    }
    else if (response.status === "missing-key") {
        badge.classList.add("imagion-badge--missing-key");
        label.textContent = "Log in";
        badge.title = response.message || "Add your API key via the Imagion extension options.";
        badge.dataset.requestState = "key-required";
    }
    else {
        badge.classList.add("imagion-badge--error");
        label.textContent = "Error";
        badge.title = response.message || "Detection failed.";
        badge.dataset.requestState = "error";
    }
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
    return parts.length ? parts.join(" | ") : "Imagion verdict";
}
function removeAllBadges() {
    for (const [, meta] of trackedImages) {
        meta.badge.remove();
    }
    trackedImages.clear();
}
function syncSettings() {
    chrome.storage.local.get({ imagionBadgeEnabled: true }, (items) => {
        const enabled = items.imagionBadgeEnabled !== false;
        if (state.enabled === enabled) {
            return;
        }
        state.enabled = enabled;
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

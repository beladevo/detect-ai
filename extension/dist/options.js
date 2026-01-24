"use strict";
const DEFAULTS = {
    imagionApiKey: "",
    imagionDetectionEndpoint: "https://imagion.ai/api/detect",
    imagionBadgeEnabled: true,
};
const form = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("api-key");
const endpointInput = document.getElementById("detection-endpoint");
const badgeToggle = document.getElementById("badge-enabled");
const statusNode = document.getElementById("status");
const saveButton = document.getElementById("save-button");
function getStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(DEFAULTS, (items) => {
            resolve({
                imagionApiKey: typeof items.imagionApiKey === "string" ? items.imagionApiKey : "",
                imagionDetectionEndpoint: typeof items.imagionDetectionEndpoint === "string" && items.imagionDetectionEndpoint.trim().length > 0
                    ? items.imagionDetectionEndpoint.trim()
                    : DEFAULTS.imagionDetectionEndpoint,
                imagionBadgeEnabled: items.imagionBadgeEnabled !== false,
            });
        });
    });
}
function setStorage(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, () => resolve());
    });
}
function showStatus(message, success = true) {
    statusNode.textContent = message;
    statusNode.style.color = success ? "#22c55e" : "#f87171";
}
function clearStatus(delay = 3000) {
    setTimeout(() => {
        statusNode.textContent = "";
    }, delay);
}
async function populateForm() {
    const stored = await getStorage();
    apiKeyInput.value = stored.imagionApiKey;
    endpointInput.value = stored.imagionDetectionEndpoint;
    badgeToggle.checked = stored.imagionBadgeEnabled;
}
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    showStatus("Saving...", true);
    const payload = {
        imagionApiKey: apiKeyInput.value.trim(),
        imagionDetectionEndpoint: endpointInput.value.trim() || DEFAULTS.imagionDetectionEndpoint,
        imagionBadgeEnabled: Boolean(badgeToggle.checked),
    };
    try {
        await setStorage(payload);
        showStatus("Settings saved.");
    }
    catch (error) {
        console.error("Failed to save options", error);
        showStatus("Unable to save settings.", false);
    }
    finally {
        saveButton.disabled = false;
        clearStatus();
    }
});
populateForm();

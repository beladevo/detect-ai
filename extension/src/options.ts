type ExtensionSettings = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
};

const DEFAULTS: ExtensionSettings = {
  imagionApiKey: "",
  imagionDetectionEndpoint: "https://imagion.ai/api/detect",
  imagionBadgeEnabled: true,
};

const form = document.getElementById("settings-form") as HTMLFormElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const endpointInput = document.getElementById("detection-endpoint") as HTMLInputElement;
const badgeToggle = document.getElementById("badge-enabled") as HTMLInputElement;
const statusNode = document.getElementById("status") as HTMLElement;
const saveButton = document.getElementById("save-button") as HTMLButtonElement;

function getStorage(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, (items) => {
      resolve({
        imagionApiKey: typeof items.imagionApiKey === "string" ? items.imagionApiKey : "",
        imagionDetectionEndpoint:
          typeof items.imagionDetectionEndpoint === "string" && items.imagionDetectionEndpoint.trim().length > 0
            ? items.imagionDetectionEndpoint.trim()
            : DEFAULTS.imagionDetectionEndpoint,
        imagionBadgeEnabled: items.imagionBadgeEnabled !== false,
      });
    });
  });
}

function setStorage(data: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

function showStatus(message: string, success = true) {
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

  const payload: ExtensionSettings = {
    imagionApiKey: apiKeyInput.value.trim(),
    imagionDetectionEndpoint: endpointInput.value.trim() || DEFAULTS.imagionDetectionEndpoint,
    imagionBadgeEnabled: Boolean(badgeToggle.checked),
  };

  try {
    await setStorage(payload);
    showStatus("Settings saved.");
  } catch (error) {
    console.error("Failed to save options", error);
    showStatus("Unable to save settings.", false);
  } finally {
    saveButton.disabled = false;
    clearStatus();
  }
});

populateForm();

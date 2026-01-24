type ExtensionSettings = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionDisabledHosts: string[];
};

type OptionsLocaleStrings = {
  savedMessage: string;
  savingMessage: string;
  addDomainLabel: string;
  addButtonLabel: string;
  removeButtonLabel: string;
  domainExistsMessage: string;
  domainAddedMessage: string;
  domainRemovedMessage: string;
  saveErrorMessage: string;
  domainPlaceholder: string;
};

const LOCALE_MAP: Record<string, OptionsLocaleStrings> = {
  en: {
    savedMessage: "Settings saved.",
    savingMessage: "Saving...",
    addDomainLabel: "Disable badges on specific hosts",
    addButtonLabel: "Add",
    removeButtonLabel: "Remove",
    domainExistsMessage: "Host already blocked.",
    domainAddedMessage: "Host added.",
    domainRemovedMessage: "Host removed.",
    saveErrorMessage: "Unable to save settings.",
    domainPlaceholder: "example.com",
  },
  es: {
    savedMessage: "Configuración guardada.",
    savingMessage: "Guardando...",
    addDomainLabel: "Deshabilitar insignias en hosts específicos",
    addButtonLabel: "Agregar",
    removeButtonLabel: "Eliminar",
    domainExistsMessage: "El host ya está bloqueado.",
    domainAddedMessage: "Host agregado.",
    domainRemovedMessage: "Host eliminado.",
    saveErrorMessage: "No se pudieron guardar los ajustes.",
    domainPlaceholder: "ejemplo.com",
  },
};

const DEFAULTS: ExtensionSettings = {
  imagionApiKey: "",
  imagionDetectionEndpoint: "http://localhost:3000/api/detect",
  imagionBadgeEnabled: true,
  imagionDisabledHosts: [],
};

const form = document.getElementById("settings-form") as HTMLFormElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const endpointInput = document.getElementById("detection-endpoint") as HTMLInputElement;
const badgeToggle = document.getElementById("badge-enabled") as HTMLInputElement;
const statusNode = document.getElementById("status") as HTMLElement;
const saveButton = document.getElementById("save-button") as HTMLButtonElement;
const domainInput = document.getElementById("domain-input") as HTMLInputElement;
const addDomainButton = document.getElementById("add-domain-btn") as HTMLButtonElement;
const domainList = document.getElementById("domain-list") as HTMLUListElement;

const localeCode = navigator.language.split("-")[0];
const strings = LOCALE_MAP[localeCode] ?? LOCALE_MAP.en;

let blockedHosts: string[] = [];

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
        imagionDisabledHosts: Array.isArray(items.imagionDisabledHosts)
          ? items.imagionDisabledHosts.filter((host) => typeof host === "string")
          : [],
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

function normalizeHost(input: string): string | null {
  const trimmed = input.trim();
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

function renderDomainList() {
  domainList.innerHTML = "";
  blockedHosts.forEach((host) => {
    const li = document.createElement("li");
    li.textContent = host;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-domain";
    removeButton.textContent = strings.removeButtonLabel;
    removeButton.addEventListener("click", () => {
      blockedHosts = blockedHosts.filter((entry) => entry !== host);
      renderDomainList();
      persistSettings(false);
      showStatus(strings.domainRemovedMessage);
      clearStatus();
    });
    li.appendChild(removeButton);
    domainList.appendChild(li);
  });
}

async function persistSettings(showFeedback = true) {
  const payload: ExtensionSettings = {
    imagionApiKey: apiKeyInput.value.trim(),
    imagionDetectionEndpoint: endpointInput.value.trim() || DEFAULTS.imagionDetectionEndpoint,
    imagionBadgeEnabled: badgeToggle.checked,
    imagionDisabledHosts: blockedHosts,
  };
  try {
    await setStorage(payload);
    if (showFeedback) {
      showStatus(strings.savedMessage);
      clearStatus();
    }
    return true;
  } catch (error) {
    showStatus(strings.saveErrorMessage, false);
    clearStatus();
    return false;
  }
}

async function populateForm() {
  const stored = await getStorage();
  apiKeyInput.value = stored.imagionApiKey;
  endpointInput.value = stored.imagionDetectionEndpoint;
  badgeToggle.checked = stored.imagionBadgeEnabled;
  blockedHosts = stored.imagionDisabledHosts;
  renderDomainList();
  domainInput.placeholder = strings.domainPlaceholder;
  const domainLabel = document.querySelector(".domain-blocker label");
  if (domainLabel) {
    domainLabel.textContent = strings.addDomainLabel;
  }
  addDomainButton.textContent = strings.addButtonLabel;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  showStatus(strings.savingMessage, true);
  await persistSettings();
  saveButton.disabled = false;
  clearStatus();
});

addDomainButton.addEventListener("click", async () => {
  const normalized = normalizeHost(domainInput.value);
  if (!normalized) {
    return;
  }
  if (blockedHosts.includes(normalized)) {
    showStatus(strings.domainExistsMessage, false);
    clearStatus();
    return;
  }
  blockedHosts = [...blockedHosts, normalized];
  renderDomainList();
  await persistSettings(false);
  showStatus(strings.domainAddedMessage);
  clearStatus();
  domainInput.value = "";
});

statusNode.setAttribute("aria-live", "polite");
domainList.setAttribute("aria-live", "polite");

populateForm();

export {};

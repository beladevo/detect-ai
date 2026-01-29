type DetectionMode = "api" | "local";
type PlanTier = "free" | "pro";

type ExtensionSettings = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionDisabledHosts: string[];
  imagionDetectionMode: DetectionMode;
  imagionLocalEndpoint: string;
  imagionPlanTier: PlanTier;
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

const LOCAL_ENDPOINT_DEFAULT = "http://localhost:4000/api/detect";

const DEFAULTS: ExtensionSettings = {
  imagionApiKey: "",
  imagionDetectionEndpoint: "http://localhost:3000/api/detect",
  imagionBadgeEnabled: true,
  imagionDisabledHosts: [],
  imagionDetectionMode: "api",
  imagionLocalEndpoint: LOCAL_ENDPOINT_DEFAULT,
  imagionPlanTier: "free",
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
const planSelect = document.getElementById("plan-tier") as HTMLSelectElement;
const planBadge = document.getElementById("plan-badge") as HTMLElement;
const planDescription = document.getElementById("plan-description") as HTMLElement;
const detectionModeInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="detection-mode"]'));
const localEndpointField = document.getElementById("local-endpoint-field") as HTMLElement;
const localEndpointInput = document.getElementById("local-endpoint") as HTMLInputElement;

const localeCode = navigator.language.split("-")[0];
const strings = LOCALE_MAP[localeCode] ?? LOCALE_MAP.en;

let blockedHosts: string[] = [];
let currentPlan: PlanTier = "free";

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
        imagionDetectionMode:
          items.imagionDetectionMode === "local" ? "local" : DEFAULTS.imagionDetectionMode,
        imagionLocalEndpoint:
          typeof items.imagionLocalEndpoint === "string" && items.imagionLocalEndpoint.trim().length > 0
            ? items.imagionLocalEndpoint.trim()
            : DEFAULTS.imagionLocalEndpoint,
        imagionPlanTier: items.imagionPlanTier === "pro" ? "pro" : DEFAULTS.imagionPlanTier,
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

function getSelectedDetectionMode(): DetectionMode {
  const checked = detectionModeInputs.find((input) => input.checked);
  return (checked?.value as DetectionMode) ?? "api";
}

function setDetectionMode(mode: DetectionMode) {
  detectionModeInputs.forEach((input) => {
    input.checked = input.value === mode;
  });
  updateLocalEndpointVisibility(mode);
}

function isLocalModeAllowed(planTier: PlanTier) {
  return planTier === "free";
}

function updatePlanUi(planTier: PlanTier, desiredMode: DetectionMode) {
  currentPlan = planTier;
  planSelect.value = planTier;
  planBadge.textContent = planTier === "free" ? "Free" : "Pro";
  planBadge.dataset.plan = planTier;
  planDescription.textContent =
    planTier === "free"
      ? "Free tier can run the API or the bundled local model."
      : "Pro tier routes every detection through the Imagion API.";
  const localRadio = detectionModeInputs.find((input) => input.value === "local");
  if (localRadio) {
    localRadio.disabled = !isLocalModeAllowed(planTier);
  }
  const nextMode = !isLocalModeAllowed(planTier) && desiredMode === "local" ? "api" : desiredMode;
  setDetectionMode(nextMode);
}

function updateLocalEndpointVisibility(mode: DetectionMode) {
  const visible = mode === "local";
  localEndpointField.classList.toggle("visible", visible);
  localEndpointInput.disabled = !visible;
}

async function persistSettings(showFeedback = true) {
  const payload: ExtensionSettings = {
    imagionApiKey: apiKeyInput.value.trim(),
    imagionDetectionEndpoint: endpointInput.value.trim() || DEFAULTS.imagionDetectionEndpoint,
    imagionBadgeEnabled: badgeToggle.checked,
    imagionDetectionMode: getSelectedDetectionMode(),
    imagionLocalEndpoint: localEndpointInput.value.trim() || endpointInput.value.trim() || LOCAL_ENDPOINT_DEFAULT,
    imagionPlanTier: (planSelect.value as PlanTier) || DEFAULTS.imagionPlanTier,
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
  planSelect.value = stored.imagionPlanTier;
  localEndpointInput.value = stored.imagionLocalEndpoint;
  updatePlanUi(stored.imagionPlanTier, stored.imagionDetectionMode);
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

planSelect.addEventListener("change", () => {
  const nextPlan = (planSelect.value as PlanTier) || "free";
  updatePlanUi(nextPlan, getSelectedDetectionMode());
});
detectionModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateLocalEndpointVisibility(getSelectedDetectionMode());
  });
});

statusNode.setAttribute("aria-live", "polite");
domainList.setAttribute("aria-live", "polite");

populateForm();

export {};

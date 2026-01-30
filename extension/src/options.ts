import type { DetectionMode, PlanTier, ExtensionSettings } from "./shared/types";
import { STORAGE_KEYS } from "./shared/storageKeys";
import {
  DEFAULT_DETECTION_ENDPOINT,
  LOCAL_DETECTION_ENDPOINT_DEFAULT,
} from "./shared/constants";
import { normalizeHostname } from "./shared/utils";

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
  fr: {
    savedMessage: "Paramètres enregistrés.",
    savingMessage: "Enregistrement...",
    addDomainLabel: "Désactiver les badges sur des hôtes spécifiques",
    addButtonLabel: "Ajouter",
    removeButtonLabel: "Supprimer",
    domainExistsMessage: "Hôte déjà bloqué.",
    domainAddedMessage: "Hôte ajouté.",
    domainRemovedMessage: "Hôte supprimé.",
    saveErrorMessage: "Impossible d'enregistrer les paramètres.",
    domainPlaceholder: "exemple.com",
  },
  de: {
    savedMessage: "Einstellungen gespeichert.",
    savingMessage: "Speichern...",
    addDomainLabel: "Badges auf bestimmten Hosts deaktivieren",
    addButtonLabel: "Hinzufügen",
    removeButtonLabel: "Entfernen",
    domainExistsMessage: "Host bereits blockiert.",
    domainAddedMessage: "Host hinzugefügt.",
    domainRemovedMessage: "Host entfernt.",
    saveErrorMessage: "Einstellungen konnten nicht gespeichert werden.",
    domainPlaceholder: "beispiel.de",
  },
  pt: {
    savedMessage: "Configurações salvas.",
    savingMessage: "Salvando...",
    addDomainLabel: "Desativar selos em hosts específicos",
    addButtonLabel: "Adicionar",
    removeButtonLabel: "Remover",
    domainExistsMessage: "Host já bloqueado.",
    domainAddedMessage: "Host adicionado.",
    domainRemovedMessage: "Host removido.",
    saveErrorMessage: "Não foi possível salvar as configurações.",
    domainPlaceholder: "exemplo.com",
  },
  ja: {
    savedMessage: "設定を保存しました。",
    savingMessage: "保存中...",
    addDomainLabel: "特定のホストでバッジを無効化",
    addButtonLabel: "追加",
    removeButtonLabel: "削除",
    domainExistsMessage: "ホストは既にブロックされています。",
    domainAddedMessage: "ホストを追加しました。",
    domainRemovedMessage: "ホストを削除しました。",
    saveErrorMessage: "設定を保存できませんでした。",
    domainPlaceholder: "example.com",
  },
  zh: {
    savedMessage: "设置已保存。",
    savingMessage: "保存中...",
    addDomainLabel: "禁用特定主机上的徽章",
    addButtonLabel: "添加",
    removeButtonLabel: "移除",
    domainExistsMessage: "主机已被屏蔽。",
    domainAddedMessage: "已添加主机。",
    domainRemovedMessage: "已移除主机。",
    saveErrorMessage: "无法保存设置。",
    domainPlaceholder: "example.com",
  },
};

const DEFAULTS: ExtensionSettings = {
  [STORAGE_KEYS.API_KEY]: "",
  [STORAGE_KEYS.DETECTION_ENDPOINT]: DEFAULT_DETECTION_ENDPOINT,
  [STORAGE_KEYS.BADGE_ENABLED]: true,
  [STORAGE_KEYS.DISABLED_HOSTS]: [],
  [STORAGE_KEYS.DETECTION_MODE]: "api",
  [STORAGE_KEYS.LOCAL_ENDPOINT]: LOCAL_DETECTION_ENDPOINT_DEFAULT,
  [STORAGE_KEYS.PLAN_TIER]: "free",
};

const form = document.getElementById("settings-form") as HTMLFormElement;
const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
const endpointInput = document.getElementById(
  "detection-endpoint"
) as HTMLInputElement;
const badgeToggle = document.getElementById("badge-enabled") as HTMLInputElement;
const statusNode = document.getElementById("status") as HTMLElement;
const saveButton = document.getElementById("save-button") as HTMLButtonElement;
const domainInput = document.getElementById("domain-input") as HTMLInputElement;
const addDomainButton = document.getElementById(
  "add-domain-btn"
) as HTMLButtonElement;
const domainList = document.getElementById("domain-list") as HTMLUListElement;
const planSelect = document.getElementById("plan-tier") as HTMLSelectElement;
const planBadge = document.getElementById("plan-badge") as HTMLElement;
const planDescription = document.getElementById(
  "plan-description"
) as HTMLElement;
const detectionModeInputs = Array.from(
  document.querySelectorAll<HTMLInputElement>('input[name="detection-mode"]')
);
const localEndpointField = document.getElementById(
  "local-endpoint-field"
) as HTMLElement;
const localEndpointInput = document.getElementById(
  "local-endpoint"
) as HTMLInputElement;

const localeCode = navigator.language.split("-")[0];
const strings = LOCALE_MAP[localeCode] ?? LOCALE_MAP.en;

let blockedHosts: string[] = [];
let currentPlan: PlanTier = "free";

function getStorage(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, (items) => {
      resolve({
        [STORAGE_KEYS.API_KEY]:
          typeof items[STORAGE_KEYS.API_KEY] === "string"
            ? items[STORAGE_KEYS.API_KEY]
            : "",
        [STORAGE_KEYS.DETECTION_ENDPOINT]:
          typeof items[STORAGE_KEYS.DETECTION_ENDPOINT] === "string" &&
          items[STORAGE_KEYS.DETECTION_ENDPOINT].trim().length > 0
            ? items[STORAGE_KEYS.DETECTION_ENDPOINT].trim()
            : DEFAULTS[STORAGE_KEYS.DETECTION_ENDPOINT],
        [STORAGE_KEYS.BADGE_ENABLED]:
          items[STORAGE_KEYS.BADGE_ENABLED] !== false,
        [STORAGE_KEYS.DISABLED_HOSTS]: Array.isArray(
          items[STORAGE_KEYS.DISABLED_HOSTS]
        )
          ? items[STORAGE_KEYS.DISABLED_HOSTS].filter(
              (host: unknown) => typeof host === "string"
            )
          : [],
        [STORAGE_KEYS.DETECTION_MODE]:
          items[STORAGE_KEYS.DETECTION_MODE] === "local"
            ? "local"
            : DEFAULTS[STORAGE_KEYS.DETECTION_MODE],
        [STORAGE_KEYS.LOCAL_ENDPOINT]:
          typeof items[STORAGE_KEYS.LOCAL_ENDPOINT] === "string" &&
          items[STORAGE_KEYS.LOCAL_ENDPOINT].trim().length > 0
            ? items[STORAGE_KEYS.LOCAL_ENDPOINT].trim()
            : DEFAULTS[STORAGE_KEYS.LOCAL_ENDPOINT],
        [STORAGE_KEYS.PLAN_TIER]:
          items[STORAGE_KEYS.PLAN_TIER] === "pro"
            ? "pro"
            : DEFAULTS[STORAGE_KEYS.PLAN_TIER],
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
  const localRadio = detectionModeInputs.find(
    (input) => input.value === "local"
  );
  if (localRadio) {
    localRadio.disabled = !isLocalModeAllowed(planTier);
  }
  const nextMode =
    !isLocalModeAllowed(planTier) && desiredMode === "local"
      ? "api"
      : desiredMode;
  setDetectionMode(nextMode);
}

function updateLocalEndpointVisibility(mode: DetectionMode) {
  const visible = mode === "local";
  localEndpointField.classList.toggle("visible", visible);
  localEndpointInput.disabled = !visible;
}

async function persistSettings(showFeedback = true) {
  const payload: ExtensionSettings = {
    [STORAGE_KEYS.API_KEY]: apiKeyInput.value.trim(),
    [STORAGE_KEYS.DETECTION_ENDPOINT]:
      endpointInput.value.trim() || DEFAULTS[STORAGE_KEYS.DETECTION_ENDPOINT],
    [STORAGE_KEYS.BADGE_ENABLED]: badgeToggle.checked,
    [STORAGE_KEYS.DETECTION_MODE]: getSelectedDetectionMode(),
    [STORAGE_KEYS.LOCAL_ENDPOINT]:
      localEndpointInput.value.trim() ||
      endpointInput.value.trim() ||
      LOCAL_DETECTION_ENDPOINT_DEFAULT,
    [STORAGE_KEYS.PLAN_TIER]:
      (planSelect.value as PlanTier) || DEFAULTS[STORAGE_KEYS.PLAN_TIER],
    [STORAGE_KEYS.DISABLED_HOSTS]: blockedHosts,
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
  apiKeyInput.value = stored[STORAGE_KEYS.API_KEY];
  endpointInput.value = stored[STORAGE_KEYS.DETECTION_ENDPOINT];
  badgeToggle.checked = stored[STORAGE_KEYS.BADGE_ENABLED];
  blockedHosts = stored[STORAGE_KEYS.DISABLED_HOSTS];
  renderDomainList();
  domainInput.placeholder = strings.domainPlaceholder;
  const domainLabel = document.querySelector(".domain-blocker label");
  if (domainLabel) {
    domainLabel.textContent = strings.addDomainLabel;
  }
  addDomainButton.textContent = strings.addButtonLabel;
  planSelect.value = stored[STORAGE_KEYS.PLAN_TIER];
  localEndpointInput.value = stored[STORAGE_KEYS.LOCAL_ENDPOINT];
  updatePlanUi(
    stored[STORAGE_KEYS.PLAN_TIER],
    stored[STORAGE_KEYS.DETECTION_MODE]
  );
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
  const normalized = normalizeHostname(domainInput.value);
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

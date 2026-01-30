import type { PageSummary } from "./shared/types";
import { STORAGE_KEYS } from "./shared/storageKeys";
import { MESSAGE_TYPES } from "./shared/messages";
import { maskApiKey, formatLimit } from "./shared/utils";

const LOG_PREFIX = "[Imagion Popup]";
const USAGE_STATUS_MESSAGE = "REQUEST_USAGE_STATUS";

type StorageData = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionUserEmail: string;
  imagionUserTier: string;
  imagionMonthlyDetections: number;
  imagionTotalDetections: number;
  imagionDailyDetections: number;
  imagionMonthlyLimit: number | null;
  imagionDailyLimit: number | null;
  imagionOnboardingComplete: boolean;
};

type AuthResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    tier: string;
    monthlyDetections: number;
    totalDetections: number;
  };
  apiKey?: string;
  error?: string;
};

type UsageStatusPayload = {
  tier: string;
  dailyUsed: number;
  monthlyUsed: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  totalDetections: number;
  monthlyResetAt: string;
  dailyResetAt: string;
};

const DEFAULT_ENDPOINT = "http://localhost:3000";
const AUTH_ENDPOINT_PATH = "/api/auth/extension";

// DOM Elements
const viewLoading = document.getElementById("view-loading") as HTMLDivElement;
const viewOnboarding = document.getElementById("view-onboarding") as HTMLDivElement;
const viewLogin = document.getElementById("view-login") as HTMLDivElement;
const viewAuthenticated = document.getElementById("view-authenticated") as HTMLDivElement;

const onboardingBtn = document.getElementById("onboarding-btn") as HTMLButtonElement;

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const loginStatus = document.getElementById("login-status") as HTMLDivElement;

const advancedToggle = document.getElementById("advanced-toggle") as HTMLSpanElement;
const advancedSection = document.getElementById("advanced-section") as HTMLDivElement;
const endpointInput = document.getElementById("endpoint-input") as HTMLInputElement;

const userEmail = document.getElementById("user-email") as HTMLDivElement;
const userTier = document.getElementById("user-tier") as HTMLDivElement;
const monthlyDetections = document.getElementById("monthly-detections") as HTMLDivElement;
const totalDetections = document.getElementById("total-detections") as HTMLDivElement;
const monthlyLimit = document.getElementById("monthly-limit") as HTMLDivElement;
const dailyLimit = document.getElementById("daily-limit") as HTMLDivElement;
const apiKeyDisplay = document.getElementById("api-key-display") as HTMLDivElement;
const copyApiKeyBtn = document.getElementById("copy-api-key") as HTMLButtonElement;
const badgeToggle = document.getElementById("badge-toggle") as HTMLInputElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;

const pageSummaryContent = document.getElementById("page-summary-content") as HTMLDivElement;
const refreshSummaryBtn = document.getElementById("refresh-summary-btn") as HTMLButtonElement;

const registerLink = document.getElementById("register-link") as HTMLAnchorElement;
const forgotLink = document.getElementById("forgot-link") as HTMLAnchorElement;
const dashboardLink = document.getElementById("dashboard-link") as HTMLAnchorElement;
const historyLink = document.getElementById("history-link") as HTMLAnchorElement;
const optionsLink = document.getElementById("options-link") as HTMLAnchorElement;

let currentApiKey = "";
let baseUrl = DEFAULT_ENDPOINT;

function showView(view: "loading" | "onboarding" | "login" | "authenticated") {
  viewLoading.classList.remove("active");
  viewOnboarding.classList.remove("active");
  viewLogin.classList.remove("active");
  viewAuthenticated.classList.remove("active");

  switch (view) {
    case "loading":
      viewLoading.classList.add("active");
      break;
    case "onboarding":
      viewOnboarding.classList.add("active");
      break;
    case "login":
      viewLogin.classList.add("active");
      break;
    case "authenticated":
      viewAuthenticated.classList.add("active");
      break;
  }
}

function showStatus(message: string, type: "error" | "success") {
  loginStatus.textContent = message;
  loginStatus.className = `status show ${type}`;
}

function hideStatus() {
  loginStatus.className = "status";
}

function setLoading(loading: boolean) {
  loginBtn.disabled = loading;
  loginBtn.innerHTML = loading
    ? '<span class="spinner"></span> Signing in...'
    : "Sign In";
}

async function getStorage(): Promise<Partial<StorageData>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      {
        [STORAGE_KEYS.API_KEY]: "",
        [STORAGE_KEYS.DETECTION_ENDPOINT]: `${DEFAULT_ENDPOINT}/api/detect`,
        [STORAGE_KEYS.BADGE_ENABLED]: true,
        [STORAGE_KEYS.USER_EMAIL]: "",
        [STORAGE_KEYS.USER_TIER]: "",
        [STORAGE_KEYS.MONTHLY_DETECTIONS]: 0,
        [STORAGE_KEYS.TOTAL_DETECTIONS]: 0,
        [STORAGE_KEYS.DAILY_DETECTIONS]: 0,
        [STORAGE_KEYS.MONTHLY_LIMIT]: null,
        [STORAGE_KEYS.DAILY_LIMIT]: null,
        [STORAGE_KEYS.ONBOARDING_COMPLETE]: false,
      },
      (items) => resolve(items as StorageData)
    );
  });
}

async function setStorage(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

async function checkOnboardingAndAuth() {
  console.debug(LOG_PREFIX, "Checking onboarding and auth status...");
  const storage = await getStorage();

  if (!storage[STORAGE_KEYS.ONBOARDING_COMPLETE]) {
    console.info(LOG_PREFIX, "First-time user, showing onboarding");
    showView("onboarding");
    return;
  }

  await checkAuthStatus();
}

async function checkAuthStatus() {
  console.debug(LOG_PREFIX, "Checking auth status...");
  const storage = await getStorage();

  // Extract base URL from endpoint
  if (storage[STORAGE_KEYS.DETECTION_ENDPOINT]) {
    try {
      const url = new URL(storage[STORAGE_KEYS.DETECTION_ENDPOINT]);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch {
      baseUrl = DEFAULT_ENDPOINT;
    }
  }

  endpointInput.value = baseUrl;

  if (storage[STORAGE_KEYS.API_KEY]) {
    console.info(LOG_PREFIX, "User is authenticated");
    currentApiKey = storage[STORAGE_KEYS.API_KEY];
    displayAuthenticatedView(storage);
    showView("authenticated");
    void refreshUsageStatus();
    void loadPageSummary();
  } else {
    console.info(LOG_PREFIX, "User is not authenticated");
    showView("login");
  }
}

async function refreshUsageStatus() {
  if (!currentApiKey) {
    return;
  }

  return new Promise<void>((resolve) => {
    chrome.runtime.sendMessage({ type: USAGE_STATUS_MESSAGE }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn(LOG_PREFIX, "Usage status unavailable:", chrome.runtime.lastError.message);
        resolve();
        return;
      }

      if (!response?.success || !response?.usage) {
        resolve();
        return;
      }

      const usage = response.usage as UsageStatusPayload;
      await setStorage({
        [STORAGE_KEYS.MONTHLY_DETECTIONS]: usage.monthlyUsed,
        [STORAGE_KEYS.DAILY_DETECTIONS]: usage.dailyUsed,
        [STORAGE_KEYS.MONTHLY_LIMIT]: usage.monthlyLimit,
        [STORAGE_KEYS.DAILY_LIMIT]: usage.dailyLimit,
        [STORAGE_KEYS.TOTAL_DETECTIONS]: usage.totalDetections,
      });

      const updated = await getStorage();
      displayAuthenticatedView(updated);
      resolve();
    });
  });
}

async function loadPageSummary() {
  pageSummaryContent.innerHTML = '<div class="page-summary-empty">Loading...</div>';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      pageSummaryContent.innerHTML = '<div class="page-summary-empty">No active tab</div>';
      return;
    }

    // Send message to background which will forward to content script
    chrome.runtime.sendMessage(
      { type: MESSAGE_TYPES.REQUEST_PAGE_SUMMARY, tabId: tab.id },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn(LOG_PREFIX, "Page summary error:", chrome.runtime.lastError.message);
          pageSummaryContent.innerHTML = '<div class="page-summary-empty">Not available on this page</div>';
          return;
        }

        if (!response?.summary) {
          pageSummaryContent.innerHTML = '<div class="page-summary-empty">Not available on this page</div>';
          return;
        }

        displayPageSummary(response.summary as PageSummary);
      }
    );
  } catch (error) {
    console.error(LOG_PREFIX, "Failed to load page summary:", error);
    pageSummaryContent.innerHTML = '<div class="page-summary-empty">Error loading summary</div>';
  }
}

function displayPageSummary(summary: PageSummary) {
  if (summary.total === 0) {
    pageSummaryContent.innerHTML = '<div class="page-summary-empty">No images scanned</div>';
    return;
  }

  const html = `
    <div class="page-summary-grid">
      <div class="page-summary-item">
        <div class="page-summary-count ai">${summary.ai}</div>
        <div class="page-summary-label">AI</div>
      </div>
      <div class="page-summary-item">
        <div class="page-summary-count real">${summary.real}</div>
        <div class="page-summary-label">Real</div>
      </div>
      <div class="page-summary-item">
        <div class="page-summary-count uncertain">${summary.uncertain}</div>
        <div class="page-summary-label">Uncertain</div>
      </div>
      <div class="page-summary-item">
        <div class="page-summary-count pending">${summary.pending}</div>
        <div class="page-summary-label">Pending</div>
      </div>
    </div>
  `;

  pageSummaryContent.innerHTML = html;
}

function displayAuthenticatedView(storage: Partial<StorageData>) {
  userEmail.textContent = storage[STORAGE_KEYS.USER_EMAIL] || "Unknown";
  userTier.textContent = storage[STORAGE_KEYS.USER_TIER] || "FREE";
  monthlyDetections.textContent = String(storage[STORAGE_KEYS.MONTHLY_DETECTIONS] || 0);
  totalDetections.textContent = String(storage[STORAGE_KEYS.TOTAL_DETECTIONS] || 0);
  monthlyLimit.textContent = formatLimit(storage[STORAGE_KEYS.MONTHLY_LIMIT]);
  dailyLimit.textContent = formatLimit(storage[STORAGE_KEYS.DAILY_LIMIT]);
  apiKeyDisplay.textContent = maskApiKey(storage[STORAGE_KEYS.API_KEY] || "");
  badgeToggle.checked = storage[STORAGE_KEYS.BADGE_ENABLED] !== false;

  // Update links with base URL
  registerLink.href = `${baseUrl}/register`;
  forgotLink.href = `${baseUrl}/forgot-password`;
  dashboardLink.href = `${baseUrl}/dashboard`;
}

async function handleOnboardingComplete() {
  console.info(LOG_PREFIX, "Onboarding completed");
  await setStorage({
    [STORAGE_KEYS.ONBOARDING_COMPLETE]: true,
  });
  await checkAuthStatus();
}

async function handleLogin(e: Event) {
  e.preventDefault();
  hideStatus();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const customEndpoint = endpointInput.value.trim();

  if (!email || !password) {
    showStatus("Please enter email and password", "error");
    return;
  }

  // Update base URL if custom endpoint provided
  if (customEndpoint) {
    try {
      const url = new URL(customEndpoint);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch {
      showStatus("Invalid endpoint URL", "error");
      return;
    }
  }

  setLoading(true);
  console.info(LOG_PREFIX, "Attempting login for:", email);

  try {
    const response = await fetch(`${baseUrl}${AUTH_ENDPOINT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();
    console.debug(LOG_PREFIX, "Auth response:", response.status, data.success);

    if (!response.ok || !data.success) {
      showStatus(data.error || "Authentication failed", "error");
      setLoading(false);
      return;
    }

    if (!data.apiKey) {
      showStatus("No API key received", "error");
      setLoading(false);
      return;
    }

    // Save to storage
    await setStorage({
      [STORAGE_KEYS.API_KEY]: data.apiKey,
      [STORAGE_KEYS.DETECTION_ENDPOINT]: `${baseUrl}/api/detect`,
      [STORAGE_KEYS.USER_EMAIL]: data.user?.email || email,
      [STORAGE_KEYS.USER_TIER]: data.user?.tier || "FREE",
      [STORAGE_KEYS.MONTHLY_DETECTIONS]: data.user?.monthlyDetections || 0,
      [STORAGE_KEYS.TOTAL_DETECTIONS]: data.user?.totalDetections || 0,
      [STORAGE_KEYS.BADGE_ENABLED]: true,
    });

    currentApiKey = data.apiKey;
    console.info(LOG_PREFIX, "Login successful, API key saved");

    // Clear form
    emailInput.value = "";
    passwordInput.value = "";

    // Show authenticated view
    const storage = await getStorage();
    displayAuthenticatedView(storage);
    showView("authenticated");
    void refreshUsageStatus();
    void loadPageSummary();
  } catch (error) {
    console.error(LOG_PREFIX, "Login error:", error);
    showStatus(
      error instanceof Error ? error.message : "Network error. Check your connection.",
      "error"
    );
  } finally {
    setLoading(false);
  }
}

async function handleLogout() {
  console.info(LOG_PREFIX, "Logging out...");

  await setStorage({
    [STORAGE_KEYS.API_KEY]: "",
    [STORAGE_KEYS.USER_EMAIL]: "",
    [STORAGE_KEYS.USER_TIER]: "",
    [STORAGE_KEYS.MONTHLY_DETECTIONS]: 0,
    [STORAGE_KEYS.TOTAL_DETECTIONS]: 0,
    [STORAGE_KEYS.DAILY_DETECTIONS]: 0,
    [STORAGE_KEYS.MONTHLY_LIMIT]: null,
    [STORAGE_KEYS.DAILY_LIMIT]: null,
  });

  currentApiKey = "";
  showView("login");
}

async function handleCopyApiKey() {
  if (!currentApiKey) return;

  try {
    await navigator.clipboard.writeText(currentApiKey);
    const originalText = copyApiKeyBtn.textContent;
    copyApiKeyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyApiKeyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error(LOG_PREFIX, "Failed to copy:", error);
  }
}

async function handleBadgeToggle() {
  const enabled = badgeToggle.checked;
  console.debug(LOG_PREFIX, "Badge toggle:", enabled);
  await setStorage({ [STORAGE_KEYS.BADGE_ENABLED]: enabled });
}

function handleAdvancedToggle() {
  advancedSection.classList.toggle("show");
  advancedToggle.textContent = advancedSection.classList.contains("show")
    ? "Hide advanced settings"
    : "Advanced settings";
}

function openUrl(url: string) {
  chrome.tabs.create({ url });
}

// Event Listeners
onboardingBtn.addEventListener("click", handleOnboardingComplete);

loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);
copyApiKeyBtn.addEventListener("click", handleCopyApiKey);
badgeToggle.addEventListener("change", handleBadgeToggle);
advancedToggle.addEventListener("click", handleAdvancedToggle);

refreshSummaryBtn.addEventListener("click", () => {
  void loadPageSummary();
});

registerLink.addEventListener("click", (e) => {
  e.preventDefault();
  openUrl(`${baseUrl}/register`);
});

forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  openUrl(`${baseUrl}/forgot-password`);
});

dashboardLink.addEventListener("click", (e) => {
  e.preventDefault();
  openUrl(`${baseUrl}/dashboard`);
});

historyLink.addEventListener("click", (e) => {
  e.preventDefault();
  // Open history.html in extension or external page
  const historyUrl = chrome.runtime.getURL("history.html");
  openUrl(historyUrl);
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
console.info(LOG_PREFIX, "Popup initialized");
checkOnboardingAndAuth();

export {};

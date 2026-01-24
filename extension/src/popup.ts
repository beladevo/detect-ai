const LOG_PREFIX = "[Imagion Popup]";

type StorageData = {
  imagionApiKey: string;
  imagionDetectionEndpoint: string;
  imagionBadgeEnabled: boolean;
  imagionUserEmail: string;
  imagionUserTier: string;
  imagionMonthlyDetections: number;
  imagionTotalDetections: number;
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

const DEFAULT_ENDPOINT = "http://localhost:3000";
const AUTH_ENDPOINT_PATH = "/api/auth/extension";

// DOM Elements
const viewLoading = document.getElementById("view-loading") as HTMLDivElement;
const viewLogin = document.getElementById("view-login") as HTMLDivElement;
const viewAuthenticated = document.getElementById("view-authenticated") as HTMLDivElement;

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
const apiKeyDisplay = document.getElementById("api-key-display") as HTMLDivElement;
const copyApiKeyBtn = document.getElementById("copy-api-key") as HTMLButtonElement;
const badgeToggle = document.getElementById("badge-toggle") as HTMLInputElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;

const registerLink = document.getElementById("register-link") as HTMLAnchorElement;
const forgotLink = document.getElementById("forgot-link") as HTMLAnchorElement;
const dashboardLink = document.getElementById("dashboard-link") as HTMLAnchorElement;
const optionsLink = document.getElementById("options-link") as HTMLAnchorElement;

let currentApiKey = "";
let baseUrl = DEFAULT_ENDPOINT;

function showView(view: "loading" | "login" | "authenticated") {
  viewLoading.classList.remove("active");
  viewLogin.classList.remove("active");
  viewAuthenticated.classList.remove("active");

  switch (view) {
    case "loading":
      viewLoading.classList.add("active");
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

function maskApiKey(key: string): string {
  if (!key || key.length < 20) return key;
  return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
}

async function getStorage(): Promise<Partial<StorageData>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      {
        imagionApiKey: "",
        imagionDetectionEndpoint: `${DEFAULT_ENDPOINT}/api/detect`,
        imagionBadgeEnabled: true,
        imagionUserEmail: "",
        imagionUserTier: "",
        imagionMonthlyDetections: 0,
        imagionTotalDetections: 0,
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

async function checkAuthStatus() {
  console.debug(LOG_PREFIX, "Checking auth status...");
  const storage = await getStorage();

  // Extract base URL from endpoint
  if (storage.imagionDetectionEndpoint) {
    try {
      const url = new URL(storage.imagionDetectionEndpoint);
      baseUrl = `${url.protocol}//${url.host}`;
    } catch {
      baseUrl = DEFAULT_ENDPOINT;
    }
  }

  endpointInput.value = baseUrl;

  if (storage.imagionApiKey) {
    console.info(LOG_PREFIX, "User is authenticated");
    currentApiKey = storage.imagionApiKey;
    displayAuthenticatedView(storage);
    showView("authenticated");
  } else {
    console.info(LOG_PREFIX, "User is not authenticated");
    showView("login");
  }
}

function displayAuthenticatedView(storage: Partial<StorageData>) {
  userEmail.textContent = storage.imagionUserEmail || "Unknown";
  userTier.textContent = storage.imagionUserTier || "FREE";
  monthlyDetections.textContent = String(storage.imagionMonthlyDetections || 0);
  totalDetections.textContent = String(storage.imagionTotalDetections || 0);
  apiKeyDisplay.textContent = maskApiKey(storage.imagionApiKey || "");
  badgeToggle.checked = storage.imagionBadgeEnabled !== false;

  // Update links with base URL
  registerLink.href = `${baseUrl}/register`;
  forgotLink.href = `${baseUrl}/forgot-password`;
  dashboardLink.href = `${baseUrl}/dashboard`;
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
      imagionApiKey: data.apiKey,
      imagionDetectionEndpoint: `${baseUrl}/api/detect`,
      imagionUserEmail: data.user?.email || email,
      imagionUserTier: data.user?.tier || "FREE",
      imagionMonthlyDetections: data.user?.monthlyDetections || 0,
      imagionTotalDetections: data.user?.totalDetections || 0,
      imagionBadgeEnabled: true,
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
    imagionApiKey: "",
    imagionUserEmail: "",
    imagionUserTier: "",
    imagionMonthlyDetections: 0,
    imagionTotalDetections: 0,
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
  await setStorage({ imagionBadgeEnabled: enabled });
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
loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);
copyApiKeyBtn.addEventListener("click", handleCopyApiKey);
badgeToggle.addEventListener("change", handleBadgeToggle);
advancedToggle.addEventListener("click", handleAdvancedToggle);

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

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize
console.info(LOG_PREFIX, "Popup initialized");
checkAuthStatus();

export {};

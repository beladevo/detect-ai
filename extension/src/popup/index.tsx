import React, { useEffect, useMemo, useState } from "react";
import browser from "webextension-polyfill";
import { STORAGE_KEYS } from "../config/storageKeys";
import { MESSAGE_TYPES } from "../types/messages";
import { formatLimit, maskApiKey } from "../utils";
import { DEFAULT_DETECTION_ENDPOINT, AUTH_ENDPOINT_PATH } from "../constants";
import type { UsageStatusPayload, PageSummary } from "../types";

type StorageSnapshot = {
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

type ViewState = "onboarding" | "login" | "authenticated";

const getDefaultStorage = (): StorageSnapshot => ({
  imagionApiKey: "",
  imagionDetectionEndpoint: DEFAULT_DETECTION_ENDPOINT,
  imagionBadgeEnabled: true,
  imagionUserEmail: "",
  imagionUserTier: "FREE",
  imagionMonthlyDetections: 0,
  imagionTotalDetections: 0,
  imagionDailyDetections: 0,
  imagionMonthlyLimit: null,
  imagionDailyLimit: null,
  imagionOnboardingComplete: false,
});

const Popup = () => {
  const [storage, setStorage] = useState<StorageSnapshot>(getDefaultStorage());
  const [view, setView] = useState<ViewState>("onboarding");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStatusPayload | null>(null);
  const [pageSummary, setPageSummary] = useState<PageSummary | null>(null);
  const [endpointInput, setEndpointInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const normalizedBaseUrl = useMemo(() => {
    try {
      const url = new URL(storage.imagionDetectionEndpoint);
      return `${url.protocol}//${url.host}`;
    } catch {
      return DEFAULT_DETECTION_ENDPOINT.replace("/api/detect", "");
    }
  }, [storage.imagionDetectionEndpoint]);

  useEffect(() => {
    void initialize();
  }, []);

  const initialize = async () => {
    const defaults = {
      [STORAGE_KEYS.API_KEY]: "",
      [STORAGE_KEYS.DETECTION_ENDPOINT]: DEFAULT_DETECTION_ENDPOINT,
      [STORAGE_KEYS.BADGE_ENABLED]: true,
      [STORAGE_KEYS.USER_EMAIL]: "",
      [STORAGE_KEYS.USER_TIER]: "FREE",
      [STORAGE_KEYS.MONTHLY_DETECTIONS]: 0,
      [STORAGE_KEYS.TOTAL_DETECTIONS]: 0,
      [STORAGE_KEYS.DAILY_DETECTIONS]: 0,
      [STORAGE_KEYS.MONTHLY_LIMIT]: null,
      [STORAGE_KEYS.DAILY_LIMIT]: null,
      [STORAGE_KEYS.ONBOARDING_COMPLETE]: false,
    };
    const items = await browser.storage.local.get(defaults);
    const snapshot: StorageSnapshot = {
      imagionApiKey: typeof items[STORAGE_KEYS.API_KEY] === "string" ? items[STORAGE_KEYS.API_KEY] : "",
      imagionDetectionEndpoint:
        typeof items[STORAGE_KEYS.DETECTION_ENDPOINT] === "string" && items[STORAGE_KEYS.DETECTION_ENDPOINT].trim().length > 0
          ? items[STORAGE_KEYS.DETECTION_ENDPOINT].trim()
          : DEFAULT_DETECTION_ENDPOINT,
      imagionBadgeEnabled: items[STORAGE_KEYS.BADGE_ENABLED] !== false,
      imagionUserEmail: typeof items[STORAGE_KEYS.USER_EMAIL] === "string" ? items[STORAGE_KEYS.USER_EMAIL] : "",
      imagionUserTier: typeof items[STORAGE_KEYS.USER_TIER] === "string" ? items[STORAGE_KEYS.USER_TIER] : "FREE",
      imagionMonthlyDetections: Number(items[STORAGE_KEYS.MONTHLY_DETECTIONS] ?? 0),
      imagionTotalDetections: Number(items[STORAGE_KEYS.TOTAL_DETECTIONS] ?? 0),
      imagionDailyDetections: Number(items[STORAGE_KEYS.DAILY_DETECTIONS] ?? 0),
      imagionMonthlyLimit: items[STORAGE_KEYS.MONTHLY_LIMIT] ?? null,
      imagionDailyLimit: items[STORAGE_KEYS.DAILY_LIMIT] ?? null,
      imagionOnboardingComplete: Boolean(items[STORAGE_KEYS.ONBOARDING_COMPLETE]),
    };
    setStorage(snapshot);
    setEndpointInput(snapshot.imagionDetectionEndpoint);
    if (!snapshot.imagionOnboardingComplete) {
      setView("onboarding");
      return;
    }
    if (!snapshot.imagionApiKey) {
      setView("login");
      return;
    }
    setView("authenticated");
    void refreshUsageStatus(snapshot.imagionApiKey);
    void loadPageSummary();
  };

  const refreshUsageStatus = async (apiKey?: string) => {
    const key = apiKey ?? storage.imagionApiKey;
    if (!key) {
      return;
    }
    try {
      const response = (await browser.runtime.sendMessage({
        type: MESSAGE_TYPES.REQUEST_USAGE_STATUS,
      })) as { success: boolean; usage?: UsageStatusPayload };
      if (response?.success && response.usage) {
        setUsage(response.usage);
        await browser.storage.local.set({
          [STORAGE_KEYS.MONTHLY_DETECTIONS]: response.usage.monthlyUsed,
          [STORAGE_KEYS.DAILY_DETECTIONS]: response.usage.dailyUsed,
          [STORAGE_KEYS.MONTHLY_LIMIT]: response.usage.monthlyLimit,
          [STORAGE_KEYS.DAILY_LIMIT]: response.usage.dailyLimit,
          [STORAGE_KEYS.TOTAL_DETECTIONS]: response.usage.totalDetections,
        });
        setStorage((prev) => ({
          ...prev,
          imagionMonthlyDetections: response.usage.monthlyUsed,
          imagionDailyDetections: response.usage.dailyUsed,
          imagionMonthlyLimit: response.usage.monthlyLimit,
          imagionDailyLimit: response.usage.dailyLimit,
          imagionTotalDetections: response.usage.totalDetections,
        }));
      }
    } catch (error) {
      console.warn(LOG_PREFIX, "Usage status fetch failed:", error);
    }
  };

  const loadPageSummary = async () => {
    try {
      const response = (await browser.runtime.sendMessage({
        type: MESSAGE_TYPES.REQUEST_PAGE_SUMMARY,
      })) as { success: boolean; summary?: PageSummary };
      if (response?.success && response.summary) {
        setPageSummary(response.summary);
      }
    } catch (error) {
      console.warn(LOG_PREFIX, "Page summary load failed:", error);
    }
  };

  const handleOnboardingComplete = async () => {
    await browser.storage.local.set({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: true });
    setView("login");
  };

  const handleBadgeToggle = async (enabled: boolean) => {
    await browser.storage.local.set({ [STORAGE_KEYS.BADGE_ENABLED]: enabled });
    setStorage((prev) => ({ ...prev, imagionBadgeEnabled: enabled }));
  };

  const handleLogout = async () => {
    await browser.storage.local.set({
      [STORAGE_KEYS.API_KEY]: "",
      [STORAGE_KEYS.USER_EMAIL]: "",
      [STORAGE_KEYS.USER_TIER]: "",
      [STORAGE_KEYS.MONTHLY_DETECTIONS]: 0,
      [STORAGE_KEYS.TOTAL_DETECTIONS]: 0,
      [STORAGE_KEYS.DAILY_DETECTIONS]: 0,
      [STORAGE_KEYS.MONTHLY_LIMIT]: null,
      [STORAGE_KEYS.DAILY_LIMIT]: null,
    });
    setStorage(getDefaultStorage());
    setView("login");
    setUsage(null);
    setPageSummary(null);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      setFormError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${normalizedBaseUrl}${AUTH_ENDPOINT_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as {
        success: boolean;
        apiKey?: string;
        user?: { email?: string; tier?: string; monthlyDetections?: number; totalDetections?: number };
        error?: string;
      };
      if (!response.ok || !data.success || !data.apiKey) {
        setFormError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }
      const endpoint = endpointInput.trim() || DEFAULT_DETECTION_ENDPOINT;
      await browser.storage.local.set({
        [STORAGE_KEYS.API_KEY]: data.apiKey,
      [STORAGE_KEYS.DETECTION_ENDPOINT]: `${endpoint.replace(/\/$/, "")}/api/detect`,
        [STORAGE_KEYS.USER_EMAIL]: data.user?.email ?? email,
        [STORAGE_KEYS.USER_TIER]: data.user?.tier ?? "FREE",
        [STORAGE_KEYS.MONTHLY_DETECTIONS]: data.user?.monthlyDetections ?? 0,
        [STORAGE_KEYS.TOTAL_DETECTIONS]: data.user?.totalDetections ?? 0,
        [STORAGE_KEYS.BADGE_ENABLED]: true,
        [STORAGE_KEYS.ONBOARDING_COMPLETE]: true,
      });
      setStorage((prev) => ({
        ...prev,
        imagionApiKey: data.apiKey!,
      imagionDetectionEndpoint: `${endpoint.replace(/\/$/, "")}/api/detect`,
        imagionUserEmail: data.user?.email ?? email,
        imagionUserTier: data.user?.tier ?? "FREE",
        imagionMonthlyDetections: data.user?.monthlyDetections ?? 0,
        imagionTotalDetections: data.user?.totalDetections ?? 0,
        imagionOnboardingComplete: true,
      }));
      setView("authenticated");
      await refreshUsageStatus(data.apiKey);
      await loadPageSummary();
    } catch (error) {
      setFormError("Network error. Check your connection.");
      console.error(LOG_PREFIX, "Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!storage.imagionApiKey) {
      return;
    }
    try {
      await navigator.clipboard.writeText(storage.imagionApiKey);
    } catch (error) {
      console.error(LOG_PREFIX, "Clipboard write failed:", error);
    }
  };

  const handlePageSummaryRefresh = () => {
    void loadPageSummary();
  };

  const toggleAdvanced = () => {
    setAdvancedOpen((curr) => !curr);
  };

  const openLink = (path: string) => {
    const url = `${normalizedBaseUrl}${path}`;
    void browser.tabs.create({ url });
  };

  if (view === "onboarding") {
    return (
      <div className="popup-shell">
        <h1>Welcome to Imagion</h1>
        <p>We detect AI-generated images while you browse. Continue to get started.</p>
        <button type="button" onClick={handleOnboardingComplete}>
          Continue
        </button>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="popup-shell">
        <h1>Sign In</h1>
        <form onSubmit={handleLogin}>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Password
            <input type="password" name="password" required />
          </label>
          <label>
            Detection endpoint
            <input
              type="text"
              value={endpointInput}
              onChange={(event) => setEndpointInput(event.target.value)}
              placeholder={DEFAULT_DETECTION_ENDPOINT.replace("/api/detect", "")}
            />
          </label>
          {formError && <p className="status error">{formError}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="popup-shell">
      <header>
        <h1>Imagion</h1>
        <p>{storage.imagionUserEmail || "Signed in"}</p>
      </header>
      <section>
        <div>
          <strong>Tier</strong>
          <span>{storage.imagionUserTier || "FREE"}</span>
        </div>
        <div>
          <strong>Monthly</strong>
          <span>
            {storage.imagionMonthlyDetections} / {formatLimit(storage.imagionMonthlyLimit)}
          </span>
        </div>
        <div>
          <strong>Daily</strong>
          <span>
            {storage.imagionDailyDetections} / {formatLimit(storage.imagionDailyLimit)}
          </span>
        </div>
      </section>
      <section>
        <label>
          <input
            type="checkbox"
            checked={storage.imagionBadgeEnabled}
            onChange={(event) => handleBadgeToggle(event.target.checked)}
          />
          Enable badges
        </label>
      </section>
      <section>
        <h2>Usage</h2>
        <button type="button" onClick={() => void refreshUsageStatus()}>
          Refresh usage
        </button>
        {usage ? (
          <ul>
            <li>Tier: {usage.tier}</li>
            <li>Monthly used: {usage.monthlyUsed}</li>
            <li>Daily used: {usage.dailyUsed}</li>
          </ul>
        ) : (
          <p>No usage data</p>
        )}
      </section>
      <section>
        <h2>Page summary</h2>
        <button type="button" onClick={handlePageSummaryRefresh}>
          Refresh summary
        </button>
        {pageSummary ? (
          <ul>
            <li>AI: {pageSummary.ai}</li>
            <li>Real: {pageSummary.real}</li>
            <li>Uncertain: {pageSummary.uncertain}</li>
            <li>Pending: {pageSummary.pending}</li>
          </ul>
        ) : (
          <p>No summary available</p>
        )}
      </section>
      <section>
        <div>
          <strong>API key</strong>
          <p>{maskApiKey(storage.imagionApiKey)}</p>
          <button type="button" onClick={handleCopyApiKey}>
            Copy key
          </button>
        </div>
      </section>
      <section>
        <button type="button" onClick={() => openLink("/register")}>
          Register
        </button>
        <button type="button" onClick={() => openLink("/forgot-password")}>
          Forgot password
        </button>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
      <section>
        <button type="button" onClick={toggleAdvanced}>
          {advancedOpen ? "Hide advanced" : "Advanced settings"}
        </button>
        {advancedOpen && (
          <div>
            <label>
              Custom endpoint
              <input
                type="text"
                value={endpointInput}
                onChange={(event) => setEndpointInput(event.target.value)}
              />
            </label>
          </div>
        )}
      </section>
    </div>
  );
};

export default Popup;

import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { STORAGE_KEYS } from "../config/storageKeys";
import { normalizeHostname } from "../utils";
import {
  DEFAULT_DETECTION_ENDPOINT,
  LOCAL_DETECTION_ENDPOINT_DEFAULT,
} from "../constants";
import type { DetectionMode, PlanTier, ExtensionSettings } from "../types";

const Options = () => {
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(DEFAULT_DETECTION_ENDPOINT);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [detectionMode, setDetectionMode] = useState<DetectionMode>("api");
  const [localEndpoint, setLocalEndpoint] = useState(LOCAL_DETECTION_ENDPOINT_DEFAULT);
  const [planTier, setPlanTier] = useState<PlanTier>("free");
  const [disabledHosts, setDisabledHosts] = useState<string[]>([]);
  const [newHost, setNewHost] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    const items = await browser.storage.local.get({
      [STORAGE_KEYS.API_KEY]: "",
      [STORAGE_KEYS.DETECTION_ENDPOINT]: DEFAULT_DETECTION_ENDPOINT,
      [STORAGE_KEYS.BADGE_ENABLED]: true,
      [STORAGE_KEYS.DETECTION_MODE]: "api",
      [STORAGE_KEYS.LOCAL_ENDPOINT]: LOCAL_DETECTION_ENDPOINT_DEFAULT,
      [STORAGE_KEYS.PLAN_TIER]: "free",
      [STORAGE_KEYS.DISABLED_HOSTS]: [],
    });
    setApiKey(items[STORAGE_KEYS.API_KEY] ?? "");
    setEndpoint(
      typeof items[STORAGE_KEYS.DETECTION_ENDPOINT] === "string" && items[STORAGE_KEYS.DETECTION_ENDPOINT].trim().length > 0
        ? items[STORAGE_KEYS.DETECTION_ENDPOINT].trim()
        : DEFAULT_DETECTION_ENDPOINT
    );
    setBadgeEnabled(items[STORAGE_KEYS.BADGE_ENABLED] !== false);
    setDetectionMode(items[STORAGE_KEYS.DETECTION_MODE] === "local" ? "local" : "api");
    setLocalEndpoint(
      typeof items[STORAGE_KEYS.LOCAL_ENDPOINT] === "string" && items[STORAGE_KEYS.LOCAL_ENDPOINT].trim().length > 0
        ? items[STORAGE_KEYS.LOCAL_ENDPOINT].trim()
        : LOCAL_DETECTION_ENDPOINT_DEFAULT
    );
    setPlanTier(items[STORAGE_KEYS.PLAN_TIER] === "pro" ? "pro" : "free");
    const hosts = Array.isArray(items[STORAGE_KEYS.DISABLED_HOSTS])
      ? items[STORAGE_KEYS.DISABLED_HOSTS].filter((entry) => typeof entry === "string")
      : [];
    setDisabledHosts(hosts);
  };

  const handleSave = async () => {
    const payload: ExtensionSettings = {
      imagionApiKey: apiKey.trim(),
      imagionDetectionEndpoint: endpoint.trim() || DEFAULT_DETECTION_ENDPOINT,
      imagionBadgeEnabled: badgeEnabled,
      imagionDisabledHosts: disabledHosts,
      imagionDetectionMode: detectionMode,
      imagionLocalEndpoint: localEndpoint.trim() || endpoint.trim() || LOCAL_DETECTION_ENDPOINT_DEFAULT,
      imagionPlanTier: planTier,
    };
    try {
      await browser.storage.local.set(payload);
      setStatus("Settings saved.");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Failed to save settings.");
    }
  };

  const handleAddHost = () => {
    const normalized = normalizeHostname(newHost);
    if (!normalized || disabledHosts.includes(normalized)) {
      setNewHost("");
      return;
    }
    setDisabledHosts((prev) => [...prev, normalized]);
    setNewHost("");
  };

  const handleRemoveHost = (host: string) => {
    setDisabledHosts((prev) => prev.filter((entry) => entry !== host));
  };

  const handlePlanChange = (tier: PlanTier) => {
    setPlanTier(tier);
    if (tier !== "free" && detectionMode === "local") {
      setDetectionMode("api");
    }
  };

  return (
    <div className="options-shell">
      <h1>Imagion Settings</h1>
      <section>
        <label>
          API key
          <input type="text" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
        </label>
        <label>
          Detection endpoint
          <input type="text" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={badgeEnabled} onChange={(event) => setBadgeEnabled(event.target.checked)} />
          Show badges
        </label>
      </section>
      <section>
        <h2>Plan</h2>
        <button type="button" onClick={() => handlePlanChange("free")} className={planTier === "free" ? "active" : ""}>
          Free
        </button>
        <button type="button" onClick={() => handlePlanChange("pro")} className={planTier === "pro" ? "active" : ""}>
          Pro
        </button>
      </section>
      <section>
        <h2>Detection mode</h2>
        <label>
          <input
            type="radio"
            name="detection-mode"
            value="api"
            checked={detectionMode === "api"}
            onChange={() => setDetectionMode("api")}
          />
          API
        </label>
        <label>
          <input
            type="radio"
            name="detection-mode"
            value="local"
            checked={detectionMode === "local"}
            onChange={() => setDetectionMode("local")}
            disabled={planTier !== "free"}
          />
          Local
        </label>
        {detectionMode === "local" && (
          <label>
            Local endpoint
            <input type="text" value={localEndpoint} onChange={(event) => setLocalEndpoint(event.target.value)} />
          </label>
        )}
      </section>
      <section>
        <h2>Disabled hosts</h2>
        <div className="domain-input">
          <input type="text" value={newHost} onChange={(event) => setNewHost(event.target.value)} placeholder="example.com" />
          <button type="button" onClick={handleAddHost}>
            Add
          </button>
        </div>
        <ul>
          {disabledHosts.map((host) => (
            <li key={host}>
              {host}
              <button type="button" onClick={() => handleRemoveHost(host)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
      <footer>
        <button type="button" onClick={handleSave}>
          Save
        </button>
        {status && <span>{status}</span>}
      </footer>
    </div>
  );
};

export default Options;

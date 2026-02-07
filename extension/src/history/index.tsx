import React, { useEffect, useMemo, useState } from "react";
import browser from "webextension-polyfill";
import { STORAGE_KEYS } from "../config/storageKeys";
import type { HashHistoryEntry } from "../types";
import "./styles.css";

const History = () => {
  const [history, setHistory] = useState<HashHistoryEntry[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    void loadHistory();
  }, []);

  const loadHistory = async () => {
    const items = await browser.storage.local.get(STORAGE_KEYS.HASH_HISTORY);
    const stored = items[STORAGE_KEYS.HASH_HISTORY];
    if (Array.isArray(stored)) {
      setHistory(stored);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    await browser.storage.local.set({ [STORAGE_KEYS.HASH_HISTORY]: [] });
    setHistory([]);
    setIsClearing(false);
  };

  const groupedByMode = useMemo(() => {
    return history.reduce<Record<string, HashHistoryEntry[]>>((acc, entry) => {
      acc[entry.mode] = acc[entry.mode] ?? [];
      acc[entry.mode].push(entry);
      return acc;
    }, {});
  }, [history]);

  return (
    <div className="history-shell">
      <header>
        <h1>Detection history</h1>
        <button type="button" onClick={handleClear} disabled={isClearing || history.length === 0}>
          {isClearing ? "Clearing…" : "Clear history"}
        </button>
      </header>
      {history.length === 0 ? (
        <p className="empty">No cached detections yet.</p>
      ) : (
        <div className="history-grid">
          {Object.entries(groupedByMode).map(([mode, entries]) => (
            <section key={mode} className="history-card">
              <h2>{mode === "local" ? "Local" : "API"} mode</h2>
              <ul>
                {entries.map((entry) => (
                  <li key={entry.hash}>
                    <div>
                      <span>{entry.payload.verdict ?? "Unknown"}</span>
                      <small>{new Date(entry.createdAt).toLocaleString()}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(entry.hash)}
                      title="Copy SHA-256"
                    >
                      Copy hash
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

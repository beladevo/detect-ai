import type { HashHistoryEntry, RateLimitIndicator } from "./types";

export function normalizeImageUrl(imageUrl: string, pageUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }
  try {
    return new URL(imageUrl, pageUrl || undefined).toString();
  } catch {
    return null;
  }
}

export function extractFileName(url: string): string {
  try {
    const parsed = new URL(url);
    const pieces = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pieces[pieces.length - 1];
    return lastSegment || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}

export function normalizeHostname(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = trimmed.includes("://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

export function isHostBlocked(host: string, blockedSet: Set<string>): boolean {
  const normalized = normalizeHostname(host);
  if (!normalized) {
    return false;
  }
  const candidate = normalized.startsWith("www.")
    ? normalized.slice(4)
    : normalized;
  return blockedSet.has(normalized) || blockedSet.has(candidate);
}

export function isExcludedDomain(
  hostname: string,
  excludedDomains: ReadonlyArray<string>
): boolean {
  const normalized = hostname.toLowerCase();
  return excludedDomains.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
}

export function getCacheLookupEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    if (url.pathname.endsWith("/api/detect")) {
      url.pathname = url.pathname.replace(/\/api\/detect$/, "/api/cache/hash");
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/api/cache/hash`;
    }
    return url.toString();
  } catch {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/api/cache/hash`;
  }
}

export function getUsageStatusEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    if (url.pathname.endsWith("/api/detect")) {
      url.pathname = url.pathname.replace(
        /\/api\/detect$/,
        "/api/usage/status"
      );
    } else {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/api/usage/status`;
    }
    return url.toString();
  } catch {
    const normalized = endpoint.replace(/\/$/, "");
    return `${normalized}/api/usage/status`;
  }
}

export function parseRetryAfter(
  header: string | null,
  fallbackMs: number
): number {
  if (!header) {
    return fallbackMs / 1000;
  }
  const parsed = Number.parseInt(header, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallbackMs / 1000;
}

export function buildRequestKey(
  imageUrl: string,
  mode: string
): string {
  return `${mode}:${imageUrl}`;
}

export function isHashHistoryEntry(value: unknown): value is HashHistoryEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as HashHistoryEntry;
  return (
    typeof entry.hash === "string" &&
    entry.hash.length > 0 &&
    typeof entry.createdAt === "number" &&
    typeof entry.payload === "object" &&
    entry.payload !== null &&
    typeof entry.payload.status === "string" &&
    (entry.mode === "api" || entry.mode === "local")
  );
}

export function isRateLimitIndicator(
  value: unknown
): value is RateLimitIndicator {
  if (!value || typeof value !== "object") {
    return false;
  }
  const indicator = value as RateLimitIndicator;
  return (
    ["burst", "daily", "plan"].includes(indicator.reason) &&
    typeof indicator.expiresAt === "number" &&
    Number.isFinite(indicator.expiresAt)
  );
}

export async function hashBlobSHA256(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 20) return key;
  return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
}

export function formatLimit(value: number | null | undefined): string {
  if (value == null) {
    return "\u221E";
  }
  return value.toLocaleString();
}
